import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CURRICULUM_DIR = path.join(process.cwd(), "curriculum-data");
const ADMIN_EMAILS = ["admin@pocketwise.nz", "ronan@pocketwise.nz", "ronancorbett@gmail.com", "ronanccorbett@gmail.com"];

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// POST — save a single file (module.json or lesson-X.json)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { folder, filename, content } = body;

    if (!folder || !filename || !content) {
      return NextResponse.json({ error: "Missing folder, filename, or content" }, { status: 400 });
    }

    // Validate it's valid JSON
    try { JSON.parse(content); } catch (e: any) {
      return NextResponse.json({ error: "Invalid JSON: " + e.message }, { status: 400 });
    }

    // Security: sanitise folder name
    const safeName = folder.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 80);
    const safeFile = filename.replace(/[^a-zA-Z0-9-_.]/g, "-").slice(0, 40);
    const dir = path.join(CURRICULUM_DIR, safeName);
    ensureDir(dir);

    const filePath = path.join(dir, safeFile);
    fs.writeFileSync(filePath, content, "utf8");

    // If saving a lesson, update module.json lessons array
    if (safeFile.startsWith("lesson-") && safeFile.endsWith(".json")) {
      const modPath = path.join(dir, "module.json");
      if (fs.existsSync(modPath)) {
        const mod = JSON.parse(fs.readFileSync(modPath, "utf8"));
        const lessonData = JSON.parse(content);
        const existing = (mod.lessons ?? []).find((l: any) => l.filename === safeFile);
        if (!existing) {
          mod.lessons = [...(mod.lessons ?? []), {
            filename: safeFile,
            title: lessonData.title ?? "Untitled",
            order: lessonData.order ?? (mod.lessons?.length ?? 0) + 1,
            xpReward: lessonData.xpReward ?? 25,
          }];
          mod.lessons.sort((a: any, b: any) => (a.order ?? 99) - (b.order ?? 99));
          fs.writeFileSync(modPath, JSON.stringify(mod, null, 2), "utf8");
        } else {
          // Update title/order in module.json
          mod.lessons = mod.lessons.map((l: any) => l.filename === safeFile
            ? { ...l, title: lessonData.title ?? l.title, order: lessonData.order ?? l.order, xpReward: lessonData.xpReward ?? l.xpReward }
            : l
          );
          fs.writeFileSync(modPath, JSON.stringify(mod, null, 2), "utf8");
        }
      }
    }

    return NextResponse.json({ ok: true, path: `${safeName}/${safeFile}` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE — remove a lesson file or entire module
export async function DELETE(req: NextRequest) {
  try {
    const folder = req.nextUrl.searchParams.get("folder");
    const filename = req.nextUrl.searchParams.get("filename");

    if (!folder) return NextResponse.json({ error: "Missing folder" }, { status: 400 });

    const safeName = folder.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 80);
    const dir = path.join(CURRICULUM_DIR, safeName);

    if (!fs.existsSync(dir)) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    if (filename) {
      // Delete specific lesson file
      const safeFile = filename.replace(/[^a-zA-Z0-9-_.]/g, "-").slice(0, 40);
      const filePath = path.join(dir, safeFile);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      // Remove from module.json
      const modPath = path.join(dir, "module.json");
      if (fs.existsSync(modPath)) {
        const mod = JSON.parse(fs.readFileSync(modPath, "utf8"));
        mod.lessons = (mod.lessons ?? []).filter((l: any) => l.filename !== safeFile);
        fs.writeFileSync(modPath, JSON.stringify(mod, null, 2), "utf8");
      }

      return NextResponse.json({ ok: true, deleted: `${safeName}/${safeFile}` });
    } else {
      // Delete entire module directory
      fs.rmSync(dir, { recursive: true, force: true });
      return NextResponse.json({ ok: true, deleted: safeName });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Also handle file uploads (multipart from the Choose JSON Files button)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const files: { name: string; content: string }[] = body.files ?? [];
    const results: string[] = [];

    for (const file of files) {
      try {
        const parsed = JSON.parse(file.content);
        // Determine if it's a module.json or lesson file
        const isModule = file.name === "module.json" || parsed.lessons !== undefined;
        const folder = parsed.folder ?? file.name.replace(".json", "");
        const safeName = folder.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 80);
        const dir = path.join(CURRICULUM_DIR, safeName);
        ensureDir(dir);
        const safeFile = isModule ? "module.json" : file.name;
        fs.writeFileSync(path.join(dir, safeFile), JSON.stringify(parsed, null, 2), "utf8");
        results.push(`Saved: ${safeName}/${safeFile}`);
      } catch (e: any) {
        results.push(`Failed: ${file.name} — ${e.message}`);
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
