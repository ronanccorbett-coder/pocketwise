import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function getCurriculumDir(): string {
  if (process.env.CURRICULUM_DIR) {
    // If relative, resolve from project root (process.cwd())
    if (!path.isAbsolute(process.env.CURRICULUM_DIR)) {
      return path.join(process.cwd(), process.env.CURRICULUM_DIR);
    }
    return process.env.CURRICULUM_DIR;
  }
  // Fallback: look for curriculum-data inside the project
  const inside = path.join(process.cwd(), "curriculum-data");
  if (fs.existsSync(inside)) return inside;
  // Last resort: sibling folder
  return path.join(process.cwd(), "../pocketwise-curriculum");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder");
    const filename = searchParams.get("filename");

    if (!folder || !filename) {
      return NextResponse.json({ error: "Missing folder or filename" }, { status: 400 });
    }

    const dir = getCurriculumDir();
    const filePath = path.join(dir, folder, filename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: `Lesson not found` },
        { status: 404 }
      );
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
