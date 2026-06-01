import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Point this at your pocketwise-curriculum folder
// By default it looks one level up from the Next.js project
const CURRICULUM_DIR =
  process.env.CURRICULUM_DIR ||
  path.join(process.cwd(), "../pocketwise-curriculum");

export async function GET() {
  try {
    if (!fs.existsSync(CURRICULUM_DIR)) {
      return NextResponse.json({
        modules: [],
        error: `Curriculum folder not found. Expected: ${CURRICULUM_DIR}. Set CURRICULUM_DIR env var to override.`,
      });
    }

    const folders = fs
      .readdirSync(CURRICULUM_DIR)
      .filter((f) => {
        const full = path.join(CURRICULUM_DIR, f);
        return fs.statSync(full).isDirectory() && f.startsWith("module-");
      })
      .sort();

    const modules = folders
      .map((folder) => {
        const modPath = path.join(CURRICULUM_DIR, folder, "module.json");
        if (!fs.existsSync(modPath)) return null;

        const mod = JSON.parse(fs.readFileSync(modPath, "utf8"));

        const lessonFiles = fs
          .readdirSync(path.join(CURRICULUM_DIR, folder))
          .filter((f) => f.startsWith("lesson-") && f.endsWith(".json"))
          .sort();

        const lessons = lessonFiles.map((lf) => {
          const data = JSON.parse(
            fs.readFileSync(path.join(CURRICULUM_DIR, folder, lf), "utf8")
          );
          return {
            filename: lf,
            title: data.title,
            order: data.order,
            xpReward: data.xpReward,
            dayNumber: data.dayNumber,
            weekNumber: data.weekNumber,
            bloomsLevel: data.bloomsLevel,
            nceaFocus: data.nceaFocus,
          };
        });

        return { folder, ...mod, lessons, lessonCount: lessonFiles.length };
      })
      .filter(Boolean);

    return NextResponse.json({ modules });
  } catch (e: any) {
    return NextResponse.json({ modules: [], error: e.message });
  }
}
