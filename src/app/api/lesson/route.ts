import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CURRICULUM_DIR =
  process.env.CURRICULUM_DIR ||
  path.join(process.cwd(), "../pocketwise-curriculum");

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder");
  const filename = searchParams.get("filename");

  if (!folder || !filename) {
    return NextResponse.json({ error: "Missing folder or filename" }, { status: 400 });
  }

  // Sanitise
  if (folder.includes("..") || filename.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const filePath = path.join(CURRICULUM_DIR, folder, filename);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to parse lesson" }, { status: 500 });
  }
}
