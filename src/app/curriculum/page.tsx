"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { useGame } from "@/lib/gameContext";
import { BookOpen, Zap, Award, Flame, ChevronRight, Lock, Play, List, Map } from "lucide-react";
import LessonPathMap from "@/components/LessonPathMap";

type Lesson = {
  filename: string;
  title: string;
  order: number;
  xpReward: number;
  dayNumber: number;
  weekNumber: number;
  bloomsLevel: string;
};

type Module = {
  folder: string;
  title: string;
  description?: string;
  ageTrack: string;
  yearLevel: string;
  nceaStandard?: string;
  nceaCredits?: number;
  nceaAssessmentType?: string;
  xpReward: number;
  colorTheme?: string;
  isPublished?: boolean;
  order?: number;
  lessons: Lesson[];
  lessonCount: number;
};

const LEVEL_GROUPS = [
  { key: "11",    label: "Level 1",        sub: "Year 11 · NCEA Level 1",  color: "#76AD25" },
  { key: "12",    label: "Level 2",        sub: "Year 12 · NCEA Level 2",  color: "#3B82F6" },
  { key: "13",    label: "Level 3",        sub: "Year 13 · NCEA Level 3",  color: "#EF4444" },
  { key: "extra", label: "Extra Learning", sub: "Beyond the curriculum",   color: "#6b7280" },
];

function trackToGroup(ageTrack: string, yearLevel?: string): string {
  const combined = `${ageTrack} ${yearLevel || ""}`.toLowerCase();
  if (combined.includes("11") || ageTrack === "15") return "11";
  if (combined.includes("12") || ageTrack === "16") return "12";
  if (combined.includes("13") || ageTrack === "17" || ageTrack === "18") return "13";
  if (combined.includes("extra")) return "extra";
  return "extra";
}

function ModuleCard({ mod, completedLessons }: { mod: Module; completedLessons: string[] }) {
  const [showLessons, setShowLessons] = useState(false);
  const [viewMode, setViewMode] = useState<"list"|"map">("map");
  const router = useRouter();
  const accent = mod.colorTheme || "#76AD25";
  const totalXp = mod.lessons.reduce((s, l) => s + (l.xpReward || 0), 0) || mod.xpReward || 0;

  // Find the first incomplete lesson, or first lesson if none completed
  const firstLesson = mod.lessons.find(l => !completedLessons.includes(`${mod.folder}/${l.filename}`))
    ?? mod.lessons[0];

  const completedCount = mod.lessons.filter(l =>
    completedLessons.includes(`${mod.folder}/${l.filename}`)
  ).length;

  const progressPct = mod.lessonCount > 0
    ? Math.round((completedCount / mod.lessonCount) * 100)
    : 0;

  function openLesson(lesson: Lesson) {
    router.push(`/lesson?folder=${mod.folder}&filename=${lesson.filename}`);
  }

  function startModule() {
    if (firstLesson) openLesson(firstLesson);
  }

  const btnLabel = completedCount === 0
    ? "Start Module"
    : completedCount === mod.lessonCount
    ? "Review Module"
    : `Continue (${completedCount}/${mod.lessonCount})`;

  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0",
      borderRadius: 14, overflow: "hidden",
      transition: "box-shadow .15s",
    }}>
      {/* Colour bar */}
      <div style={{ height: 4, background: accent }} />

      <div style={{ padding: "18px 20px" }}>
        {/* Title row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0d1526", lineHeight: 1.3, marginBottom: 4 }}>
              {mod.title}
            </h3>
            {mod.nceaStandard && (
              <span style={{
                background: "#f1f5f9", color: "#475569",
                padding: "2px 8px", borderRadius: 4,
                fontSize: "0.7rem", fontWeight: 600,
              }}>
                {mod.nceaStandard}
                {mod.nceaCredits ? ` · ${mod.nceaCredits} credits` : ""}
                {mod.nceaAssessmentType ? ` · ${mod.nceaAssessmentType}` : ""}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <Zap size={13} color="#f59e0b" />
            <span style={{ fontWeight: 700, fontSize: "0.78rem", color: "#0d1526" }}>{totalXp} XP</span>
          </div>
        </div>

        {/* Description */}
        {mod.description && (
          <p style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.6, marginBottom: 12 }}>
            {mod.description}
          </p>
        )}

        {/* Progress bar */}
        {mod.lessonCount > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#94a3b8", marginBottom: 4 }}>
              <span>{completedCount} of {mod.lessonCount} lessons</span>
              <span>{progressPct}%</span>
            </div>
            <div style={{ background: "#f1f5f9", borderRadius: 99, height: 5, overflow: "hidden" }}>
              <div style={{
                background: progressPct === 100 ? "#76AD25" : accent,
                height: 5, borderRadius: 99,
                width: `${progressPct}%`,
                transition: "width .4s",
              }} />
            </div>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          <span style={{ background: "#f1f5f9", color: "#475569", padding: "2px 9px", borderRadius: 6, fontSize: "0.72rem", fontWeight: 500 }}>
            {mod.lessonCount} lesson{mod.lessonCount !== 1 ? "s" : ""}
          </span>
          {progressPct === 100 && (
            <span style={{ background: "#e8f5d0", color: "#3d5a12", padding: "2px 9px", borderRadius: 6, fontSize: "0.72rem", fontWeight: 700 }}>
              Complete
            </span>
          )}
          {!mod.isPublished && (
            <span style={{ background: "#fef2f2", color: "#EF4444", padding: "2px 9px", borderRadius: 6, fontSize: "0.72rem", fontWeight: 600 }}>
              Draft
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={startModule}
            disabled={mod.lessonCount === 0}
            style={{
              flex: 1, padding: "10px 0",
              background: mod.lessonCount === 0 ? "#f1f5f9" : "#0d1526",
              color: mod.lessonCount === 0 ? "#94a3b8" : "#fff",
              border: "none", borderRadius: 8,
              fontSize: "0.8rem", fontWeight: 600,
              cursor: mod.lessonCount === 0 ? "not-allowed" : "pointer",
              fontFamily: "Inter, sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
            <Play size={13} />
            {btnLabel}
          </button>
          {mod.lessonCount > 0 && (
            <button
              onClick={() => setShowLessons(s => !s)}
              style={{
                padding: "10px 12px",
                background: showLessons ? "#f1f5f9" : "#fff",
                color: "#475569",
                border: "1px solid #e2e8f0", borderRadius: 8,
                fontSize: "0.8rem", fontWeight: 600,
                cursor: "pointer", fontFamily: "Inter, sans-serif",
                display: "flex", alignItems: "center", gap: 4,
              }}>
              <Map size={14} />
              <ChevronRight size={13} style={{ transform: showLessons ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
            </button>
          )}
        </div>

        {/* Lesson path / list dropdown */}
        {showLessons && mod.lessons.length > 0 && (
          <div style={{ marginTop: 12, borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
            {/* View toggle */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              <button onClick={() => setViewMode("map")} style={{ flex: 1, padding: "6px", borderRadius: 7, background: viewMode === "map" ? accent : "#f1f5f9", color: viewMode === "map" ? "#fff" : "#475569", border: "none", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <Map size={12} /> Path
              </button>
              <button onClick={() => setViewMode("list")} style={{ flex: 1, padding: "6px", borderRadius: 7, background: viewMode === "list" ? accent : "#f1f5f9", color: viewMode === "list" ? "#fff" : "#475569", border: "none", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <List size={12} /> List
              </button>
            </div>

            {/* Map view */}
            {viewMode === "map" && (
              <LessonPathMap
                folder={mod.folder}
                lessons={mod.lessons}
                completedLessons={completedLessons}
                accentColor={accent}
                moduleTitle={mod.title}
              />
            )}

            {/* List view */}
            {viewMode === "list" && mod.lessons
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((l, i) => {
                const done = completedLessons.includes(`${mod.folder}/${l.filename}`);
                const isCurrent = !done && l.filename === firstLesson?.filename;
                return (
                  <button
                    key={l.filename}
                    onClick={() => openLesson(l)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 10px", borderRadius: 8, marginBottom: 4,
                      background: isCurrent ? "#f0fdf4" : "transparent",
                      border: `1px solid ${isCurrent ? "#76AD25" : "transparent"}`,
                      cursor: "pointer", textAlign: "left",
                      fontFamily: "Inter, sans-serif", transition: "background .1s",
                    }}
                    onMouseEnter={e => { if (!isCurrent) (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
                    onMouseLeave={e => { if (!isCurrent) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <div style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0, background: done ? "#76AD25" : isCurrent ? "#e8f5d0" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", fontWeight: 700, color: done ? "#fff" : isCurrent ? "#3d5a12" : "#64748b" }}>
                      {done ? "✓" : l.order || i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: isCurrent ? 600 : 500, color: done ? "#94a3b8" : "#0d1526", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: done ? "line-through" : "none" }}>
                        {l.title}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                      <Zap size={11} color="#f59e0b" />
                      <span style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600 }}>{l.xpReward}</span>
                    </div>
                  </button>
                );
              })}
          </div>
        )}

        {showLessons && mod.lessons.length === 0 && (
          <div style={{ marginTop: 12, padding: "12px", background: "#f8fafc", borderRadius: 8, textAlign: "center" }}>
            <p style={{ fontSize: "0.78rem", color: "#94a3b8" }}>No lessons yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CurriculumPage() {
  const { state } = useGame();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLevel, setActiveLevel] = useState("11");

  const completedLessons = (state?.completedLessons as string[]) ?? [];

  useEffect(() => {
    fetch("/api/modules")
      .then(r => r.json())
      .then(d => {
        setModules(d.modules || []);
        if (d.error) setError(d.error);
        setLoading(false);
      })
      .catch(() => { setError("Could not load modules."); setLoading(false); });
  }, []);

  const grouped = LEVEL_GROUPS.map(g => ({
    ...g,
    modules: modules.filter(m => trackToGroup(m.ageTrack, m.yearLevel) === g.key),
  }));

  const activeGroup = grouped.find(g => g.key === activeLevel)!;

  return (
    <AuthGuard>
      <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>
        <Nav />

        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg, #0d1526 0%, #111c30 100%)", padding: "32px 2rem" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", marginBottom: 4 }}>Curriculum</h1>
            <p style={{ color: "#8b9dc3", fontSize: "0.875rem", marginBottom: 20 }}>
              NCEA-aligned financial literacy from Year 11 to Year 13.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { Icon: Zap,      val: (state?.xp ?? 0).toLocaleString(),                              label: "Total XP",     color: "#f59e0b" },
                { Icon: BookOpen, val: completedLessons.length.toString(),                             label: "Lessons Done", color: "#3B82F6" },
                { Icon: Award,    val: ((state?.badges as string[]) ?? []).length.toString(),          label: "Badges",       color: "#a78bfa" },
                { Icon: Flame,    val: (state?.streak ?? 0).toString(),                               label: "Day Streak",   color: "#f59e0b" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,.08)", borderRadius: 12, padding: "10px 18px", textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 3 }}>
                    <s.Icon size={14} color={s.color} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff" }}>{s.val}</div>
                  <div style={{ fontSize: "0.7rem", color: "#8b9dc3" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 1.5rem" }}>

          {/* Level tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 28, flexWrap: "wrap" }}>
            {grouped.map(g => (
              <button
                key={g.key}
                onClick={() => setActiveLevel(g.key)}
                style={{
                  padding: "9px 20px", borderRadius: 9999,
                  background: activeLevel === g.key ? g.color : "#fff",
                  color: activeLevel === g.key ? "#fff" : "#475569",
                  border: `1.5px solid ${activeLevel === g.key ? g.color : "#e2e8f0"}`,
                  fontWeight: 600, fontSize: "0.875rem", cursor: "pointer",
                  fontFamily: "Inter, sans-serif", transition: "all .12s",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                {g.label}
                <span style={{
                  background: activeLevel === g.key ? "rgba(255,255,255,.25)" : "#f1f5f9",
                  color: activeLevel === g.key ? "#fff" : "#64748b",
                  borderRadius: 99, padding: "1px 7px", fontSize: "0.72rem", fontWeight: 700,
                }}>
                  {g.modules.length}
                </span>
              </button>
            ))}
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontWeight: 800, fontSize: "1.2rem", color: "#0d1526", marginBottom: 3 }}>
              {activeGroup.label}
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#64748b" }}>{activeGroup.sub}</p>
          </div>

          {/* Loading skeletons */}
          {loading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, height: 200 }} />
              ))}
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: "#EF4444", fontSize: "0.875rem", marginBottom: 4 }}>
                Could not load modules
              </div>
              <p style={{ fontSize: "0.8rem", color: "#ef4444", opacity: 0.8 }}>{error}</p>
              <p style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 8 }}>
                Make sure <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>pocketwise-curriculum</code> is
                one level above this project, or set <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>CURRICULUM_DIR</code> in .env.local
              </p>
            </div>
          )}

          {/* Modules */}
          {!loading && activeGroup.modules.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {activeGroup.modules
                .sort((a, b) => (a.order || 99) - (b.order || 99))
                .map(m => (
                  <ModuleCard
                    key={m.folder}
                    mod={m}
                    completedLessons={completedLessons}
                  />
                ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && activeGroup.modules.length === 0 && (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "48px", textAlign: "center" }}>
              <Lock size={32} color="#cbd5e1" style={{ margin: "0 auto 16px", display: "block" }} />
              <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "#0d1526", marginBottom: 8 }}>
                No {activeGroup.label} modules yet
              </h3>
              <p style={{ color: "#94a3b8", fontSize: "0.875rem", maxWidth: 380, margin: "0 auto" }}>
                Add module folders starting with{" "}
                <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>module-</code>{" "}
                to your curriculum directory and they will appear here automatically.
              </p>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
