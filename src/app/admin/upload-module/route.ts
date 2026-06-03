import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CURRICULUM_DIR =
  process.env.CURRICULUM_DIR ||
  path.join(process.cwd(), "../pocketwise-curriculum");

export async function POST(request: Request) {
  try {
    const { filename, data } = await request.json();

    if (!filename || !data) {
      return NextResponse.json({ error: "Missing filename or data" }, { status: 400 });
    }

    // Determine folder from filename
    // Expected formats: "module-1-title/module.json" or "module.json" or "lesson-1.json"
    let folderName: string | null = null;
    let actualFilename = filename;

    if (filename.includes("/")) {
      const parts = filename.split("/");
      folderName = parts[0];
      actualFilename = parts[1];
    } else if (data.folder) {
      folderName = data.folder;
    } else if (data.nceaStandard || data.yearLevel) {
      // It's a module.json — derive folder name from title
      const title = (data.title || "module").toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 50);
      const order = data.order || "1";
      folderName = `module-${order}-${title}`;
      actualFilename = "module.json";
    } else if (data.dayNumber !== undefined || data.activities) {
      // It's a lesson file — need folder from request or default
      return NextResponse.json({ error: "Lesson files must be uploaded with folder path. Use format: module-folder/lesson-1.json" }, { status: 400 });
    }

    if (!folderName) {
      return NextResponse.json({ error: "Could not determine module folder" }, { status: 400 });
    }

    // Create folder if needed
    const folderPath = path.join(CURRICULUM_DIR, folderName);
    if (!fs.existsSync(CURRICULUM_DIR)) {
      fs.mkdirSync(CURRICULUM_DIR, { recursive: true });
    }
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Write file
    const filePath = path.join(folderPath, actualFilename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");

    return NextResponse.json({ success: true, path: `${folderName}/${actualFilename}` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
