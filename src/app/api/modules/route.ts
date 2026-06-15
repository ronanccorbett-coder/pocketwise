import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CURRICULUM_DIR = path.join(process.cwd(), "curriculum-data");

export async function GET(req: NextRequest) {
  const folder = req.nextUrl.searchParams.get("folder");

  if (!fs.existsSync(CURRICULUM_DIR)) {
    return NextResponse.json({ modules: [] });
  }

  // Return specific module with all lessons
  if (folder) {
    const modPath = path.join(CURRICULUM_DIR, folder);
    if (!fs.existsSync(modPath)) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }
    try {
      const modJson = JSON.parse(fs.readFileSync(path.join(modPath, "module.json"), "utf8"));
      // Load all lesson files
      const lessons: any[] = [];
      for (const lesson of (modJson.lessons ?? [])) {
        const lessonPath = path.join(modPath, lesson.filename);
        if (fs.existsSync(lessonPath)) {
          const lessonJson = JSON.parse(fs.readFileSync(lessonPath, "utf8"));
          lessons.push(lessonJson);
        }
      }
      return NextResponse.json({ ...modJson, lessons });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // Return all modules summary
  try {
    const entries = fs.readdirSync(CURRICULUM_DIR, { withFileTypes: true });
    const modules: any[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const modFile = path.join(CURRICULUM_DIR, entry.name, "module.json");
      if (!fs.existsSync(modFile)) continue;
      try {
        const mod = JSON.parse(fs.readFileSync(modFile, "utf8"));
        // Count lesson files
        const lessonCount = fs.readdirSync(path.join(CURRICULUM_DIR, entry.name))
          .filter(f => f.startsWith("lesson-") && f.endsWith(".json")).length;
        modules.push({ ...mod, folder: entry.name, lessonCount });
      } catch {}
    }
    modules.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    return NextResponse.json({ modules });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
