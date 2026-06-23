import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function findFile(folder: string, filename: string): string | null {
  const bases = [
    path.join(process.cwd(), "public", "curriculum-data"),
    path.join(process.cwd(), "curriculum-data"),
    path.join(process.cwd(), ".next", "server", "curriculum-data"),
  ];
  for (const base of bases) {
    const p = path.join(base, folder, filename);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const folder   = searchParams.get("folder");
    const filename = searchParams.get("filename");
    if (!folder || !filename) {
      return NextResponse.json({ error: "Missing folder or filename" }, { status: 400 });
    }
    const filePath = findFile(folder, filename);
    if (!filePath) {
      return NextResponse.json({ error: `Lesson not found: ${folder}/${filename}` }, { status: 404 });
    }
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
