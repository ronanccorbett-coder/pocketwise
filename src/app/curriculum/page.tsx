"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { useGame } from "@/lib/gameContext";
import { MascotMessage, pickMood } from "@/components/Mascot";
import { BookOpen, Zap, Award, Flame, ChevronRight, Lock, Play, Star } from "lucide-react";

type Lesson = {
  filename: string; title: string; order: number; xpReward: number;
  dayNumber: number; weekNumber: number; bloomsLevel: string;
};
type Module = {
  folder: string; title: string; description?: string;
  ageTrack: string; yearLevel: string; nceaStandard?: string;
  nceaCredits?: number; xpReward: number; colorTheme?: string;
  isPublished?: boolean; order?: number;
  lessons: Lesson[]; lessonCount: number;
};

const LEVEL_GROUPS = [
  { key: "11",    label: "Level 1",        sub: "Year 11 · NCEA Level 1",  color: "#76AD25" },
  { key: "12",    label: "Level 2",        sub: "Year 12 · NCEA Level 2",  color: "#3B82F6" },
  { key: "13",    label: "Level 3",        sub: "Year 13 · NCEA Level 3",  color: "#EF4444" },
  { key: "extra", label: "Extra Learning", sub: "Beyond the curriculum",   color: "#f59e0b" },
];

function getLevel(mod: Module) {
  if (mod.ageTrack === "extra") return "extra";
  if (mod.yearLevel?.includes("13")) return "13";
  if (mod.yearLevel?.includes("12")) return "12";
  return "11";
}

const FONT = "Inter, system-ui, sans-serif";

// ── Animated XP bar ──────────────────────────────────────────────────────
function XPBar({ xp }: { xp: number }) {
  const milestones = [100, 200, 300, 500, 800, 1500, 3000, 5000];
  const nextMilestone = milestones.find(m => m > xp) ?? 5000;
  const prevMilestone = milestones.filter(m => m <= xp).pop() ?? 0;
  const pct = Math.min(100, ((xp - prevMilestone) / (nextMilestone - prevMilestone)) * 100);

  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Zap size={13} color="#f59e0b" fill="#f59e0b" />
          <span style={{ fontWeight: 800, color: "#f59e0b", fontSize: "0.85rem" }}>{xp.toLocaleString()} XP</span>
        </div>
        <span style={{ fontSize: "0.72rem", color: "#8b9dc3" }}>Next: {nextMilestone} XP</span>
      </div>
      <div style={{ height: 8, background: "rgba(255,255,255,.1)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: 8, borderRadius: 99, width: `${pct}%`,
          background: "linear-gradient(90deg, #76AD25, #22c55e)",
          transition: "width 1s cubic-bezier(.34,1.56,.64,1)",
          boxShadow: "0 0 8px rgba(118,173,37,.6)",
        }} />
      </div>
    </div>
  );
}

// ── Module Card ───────────────────────────────────────────────────────────
function ModuleCard({ mod, completedLessons }: { mod: Module; completedLessons: string[] }) {
  const router = useRouter();
  const accent = mod.colorTheme || "#76AD25";
  const totalXp = mod.lessons.reduce((s, l) => s + (l.xpReward || 0), 0) || mod.xpReward || 0;
  const firstLesson = mod.lessons.find(l => !completedLessons.includes(`${mod.folder}/${l.filename}`)) ?? mod.lessons[0];
  const completedCount = mod.lessons.filter(l => completedLessons.includes(`${mod.folder}/${l.filename}`)).length;
  const progressPct = mod.lessonCount > 0 ? Math.round((completedCount / mod.lessonCount) * 100) : 0;
  const isComplete = completedCount === mod.lessonCount && mod.lessonCount > 0;

  const btnLabel = completedCount === 0 ? "Start" : isComplete ? "Review" : "Continue";

  return (
    <div
      onClick={() => mod.lessonCount > 0 && router.push(`/module?folder=${mod.folder}`)}
      style={{
        background: "var(--card-bg)",
        border: `2px solid ${isComplete ? accent : "#e2e8f0"}`,
        borderRadius: 18,
        overflow: "hidden",
        cursor: mod.lessonCount > 0 ? "pointer" : "default",
        transition: "transform .15s, box-shadow .15s",
        position: "relative",
      }}
      onMouseEnter={e => { if (mod.lessonCount > 0) { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px ${accent}22`; } }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
    >
      {/* Colour band top */}
      <div style={{ height: 5, background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />

      {/* Complete badge */}
      {isComplete && (
        <div style={{ position: "absolute", top: 14, right: 14, background: accent, color: "#fff", padding: "3px 10px", borderRadius: 99, fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em" }}>
          Complete
        </div>
      )}

      <div style={{ padding: "16px 18px 18px" }}>
        {/* Standard badge */}
        {mod.nceaStandard && (
          <div style={{ display: "inline-block", background: `${accent}18`, color: accent, padding: "2px 10px", borderRadius: 6, fontSize: "0.68rem", fontWeight: 700, marginBottom: 8 }}>
            {mod.nceaStandard}
          </div>
        )}

        <h3 style={{ fontWeight: 800, fontSize: "0.975rem", color: "var(--text)", marginBottom: 4, lineHeight: 1.3 }}>
          {mod.title}
        </h3>

        {mod.description && (
          <p style={{ fontSize: "0.78rem", color: "var(--text2)", lineHeight: 1.5, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {mod.description}
          </p>
        )}

        {/* Stats row */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <BookOpen size={12} color="#94a3b8" />
            <span style={{ fontSize: "0.72rem", color: "var(--text3)" }}>{mod.lessonCount} lessons</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Zap size={12} color="#f59e0b" />
            <span style={{ fontSize: "0.72rem", color: "var(--text3)" }}>{totalXp} XP</span>
          </div>
          {completedCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Star size={12} color={accent} fill={accent} />
              <span style={{ fontSize: "0.72rem", color: accent, fontWeight: 700 }}>{completedCount}/{mod.lessonCount}</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {mod.lessonCount > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ height: 6, background: "var(--bg3)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: 6, borderRadius: 99, width: `${progressPct}%`,
                background: isComplete ? `linear-gradient(90deg, ${accent}, ${accent}88)` : `linear-gradient(90deg, ${accent}88, ${accent}44)`,
                transition: "width .6s ease",
              }} />
            </div>
          </div>
        )}

        {/* CTA button */}
        <button
          onClick={e => { e.stopPropagation(); mod.lessonCount > 0 && router.push(`/module?folder=${mod.folder}`); }}
          disabled={mod.lessonCount === 0}
          style={{
            width: "100%", padding: "10px",
            background: mod.lessonCount === 0 ? "#f1f5f9" : isComplete ? `${accent}18` : accent,
            color: mod.lessonCount === 0 ? "#94a3b8" : isComplete ? accent : "#fff",
            border: isComplete ? `1.5px solid ${accent}40` : "none",
            borderRadius: 10, fontSize: "0.825rem", fontWeight: 700,
            cursor: mod.lessonCount === 0 ? "not-allowed" : "pointer",
            fontFamily: FONT,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "all .15s",
          }}>
          {mod.lessonCount === 0 ? (
            <><Lock size={13} /> Coming Soon</>
          ) : (
            <><Play size={13} /> {btnLabel} Module</>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function CurriculumPage() {
  const { state } = useGame();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLevel, setActiveLevel] = useState("11");

  const completedLessons = (state?.completedLessons as string[]) ?? [];
  const xp = state?.xp ?? 0;
  const streak = state?.streak ?? 0;
  const totalLessons = completedLessons.length;
  const recentlyCompleted = totalLessons > 0 && Date.now() - (state?.lastActivityDate ?? 0) < 60000;
  const mood = pickMood(xp, streak, recentlyCompleted);

  useEffect(() => {
    fetch("/api/modules")
      .then(r => r.json())
      .then(d => {
        if (d.modules) setModules(d.modules);
        else setError(d.error ?? "Could not load modules");
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const grouped = LEVEL_GROUPS.map(g => ({
    ...g,
    modules: modules.filter(m => getLevel(m) === g.key).sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
  }));

  const currentGroup = grouped.find(g => g.key === activeLevel) ?? grouped[0];

  // Overall progress stats
  const totalModules = modules.length;
  const completedModules = modules.filter(m =>
    m.lessons.length > 0 && m.lessons.every(l => completedLessons.includes(`${m.folder}/${l.filename}`))
  ).length;

  return (
    <AuthGuard>
      <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: FONT }}>
        <Nav />

        {/* Hero with mascot */}
        <div style={{
          background: "linear-gradient(135deg, #0d1526 0%, #0f2318 50%, #0d1526 100%)",
          padding: "24px 1.5rem 28px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Background sparkles */}
          {[...Array(12)].map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              left: `${(i * 37 + 10) % 100}%`,
              top: `${(i * 23 + 5) % 100}%`,
              width: i % 3 === 0 ? 3 : 2,
              height: i % 3 === 0 ? 3 : 2,
              borderRadius: "50%",
              background: i % 2 === 0 ? "#76AD25" : "#f59e0b",
              opacity: 0.4,
              animation: `twinkle ${2 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }} />
          ))}

          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            {/* Mascot row */}
            <div style={{ marginBottom: 20 }}>
              <MascotMessage mood={mood} xp={xp} streak={streak} />
            </div>

            {/* XP progress */}
            <div style={{ background: "rgba(255,255,255,.07)", borderRadius: 14, padding: "14px 18px", marginBottom: 16 }}>
              <XPBar xp={xp} />
            </div>

            {/* Stats pills */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { Icon: Flame, val: streak, label: "day streak", color: "#f59e0b", show: streak > 0 },
                { Icon: BookOpen, val: totalLessons, label: "lessons done", color: "#3B82F6", show: true },
                { Icon: Award, val: completedModules, label: "modules complete", color: "#76AD25", show: totalModules > 0 },
                { Icon: Star, val: (state?.badges as string[] ?? []).length, label: "badges", color: "#a78bfa", show: true },
              ].filter(s => s.show).map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 99, padding: "5px 12px" }}>
                  <s.Icon size={13} color={s.color} fill={s.Icon === Flame || s.Icon === Star ? s.color : "none"} />
                  <span style={{ fontWeight: 800, color: "#fff", fontSize: "0.8rem" }}>{s.val}</span>
                  <span style={{ color: "#8b9dc3", fontSize: "0.72rem" }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Level tabs */}
        <div style={{ background: "var(--card-bg)", borderBottom: "2px solid #f1f5f9", padding: "0 1.5rem", position: "sticky", top: 56, zIndex: 30 }}>
          <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 0 }}>
            {grouped.map(g => (
              <button
                key={g.key}
                onClick={() => setActiveLevel(g.key)}
                style={{
                  padding: "14px 20px", background: "none", border: "none",
                  borderBottom: `3px solid ${activeLevel === g.key ? g.color : "transparent"}`,
                  color: activeLevel === g.key ? g.color : "#94a3b8",
                  fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
                  fontFamily: FONT, transition: "all .15s", whiteSpace: "nowrap",
                }}>
                {g.label}
                {g.modules.length > 0 && (
                  <span style={{ marginLeft: 6, background: activeLevel === g.key ? g.color : "#f1f5f9", color: activeLevel === g.key ? "#fff" : "#94a3b8", borderRadius: 99, padding: "1px 7px", fontSize: "0.68rem", fontWeight: 800 }}>
                    {g.modules.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Module grid */}
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 1.5rem 60px" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "#76AD25", animation: `pulse 1s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
              <p style={{ color: "var(--text3)", fontSize: "0.875rem" }}>Loading your curriculum...</p>
            </div>
          )}

          {error && (
            <div style={{ background: "var(--card-bg)", border: "2px dashed #e2e8f0", borderRadius: 16, padding: "48px", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: 12 }}>🥝</div>
              <p style={{ color: "#EF4444", fontWeight: 700, marginBottom: 4 }}>Could not load modules</p>
              <p style={{ color: "var(--text3)", fontSize: "0.825rem" }}>{error}</p>
            </div>
          )}

          {!loading && !error && currentGroup.modules.length === 0 && (
            <div style={{ background: "var(--card-bg)", border: "2px dashed #e2e8f0", borderRadius: 16, padding: "48px", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>📚</div>
              <p style={{ color: "var(--text)", fontWeight: 700, fontSize: "1rem", marginBottom: 4 }}>{currentGroup.label} coming soon</p>
              <p style={{ color: "var(--text3)", fontSize: "0.825rem" }}>Start with Level 1 while we build this out!</p>
            </div>
          )}

          {!loading && !error && currentGroup.modules.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {currentGroup.modules.map(mod => (
                <ModuleCard key={mod.folder} mod={mod} completedLessons={completedLessons} />
              ))}
            </div>
          )}
        </div>

        <style>{`
          @keyframes twinkle {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.5); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(0.8); opacity: 0.5; }
            50% { transform: scale(1.2); opacity: 1; }
          }
        `}</style>
      </div>
    </AuthGuard>
  );
}
