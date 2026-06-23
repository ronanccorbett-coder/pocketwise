import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function candidateBases(): string[] {
  return [
    path.join(process.cwd(), "curriculum-data"),
    path.join(process.cwd(), "public", "curriculum-data"),
    path.join(process.cwd(), "src", "curriculum-data"),
    path.join("/var/task", "curriculum-data"),
    path.join("/var/task", "public", "curriculum-data"),
    path.join(process.cwd(), ".next", "server", "curriculum-data"),
  ];
}

function findFile(folder: string, filename: string): { path: string | null; tried: string[] } {
  const tried: string[] = [];
  for (const base of candidateBases()) {
    const p = path.join(base, folder, filename);
    tried.push(p);
    if (fs.existsSync(p)) return { path: p, tried };
  }
  return { path: null, tried };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const folder   = searchParams.get("folder");
    const filename = searchParams.get("filename");
    if (!folder || !filename) {
      return NextResponse.json({ error: "Missing folder or filename" }, { status: 400 });
    }
    const { path: filePath, tried } = findFile(folder, filename);
    if (!filePath) {
      return NextResponse.json(
        { error: `Lesson not found: ${folder}/${filename}`, tried, cwd: process.cwd() },
        { status: 404 }
      );
    }
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}