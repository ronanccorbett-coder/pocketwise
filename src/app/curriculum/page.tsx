"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { useTheme } from "@/lib/theme";
import { useGame } from "@/lib/gameContext";
import { db } from "@/lib/db";
import { BookOpen, Zap, Award, Flame, ChevronRight, Lock, Play, Star, Megaphone } from "lucide-react";

const FONT = "Inter, system-ui, sans-serif";

const LEVEL_GROUPS = [
  { key: "11",    label: "Level 1",        sub: "Year 11 - NCEA Level 1",  color: "#76AD25" },
  { key: "12",    label: "Level 2",        sub: "Year 12 - NCEA Level 2",  color: "#3B82F6" },
  { key: "13",    label: "Level 3",        sub: "Year 13 - NCEA Level 3",  color: "#EF4444" },
  { key: "extra", label: "Extra Learning", sub: "Beyond the curriculum",   color: "#f59e0b" },
];

function getLevel(mod: any) {
  if (mod.ageTrack === "extra") return "extra";
  if (mod.yearLevel?.includes("13")) return "13";
  if (mod.yearLevel?.includes("12")) return "12";
  return "11";
}

function ModuleCard({ mod, completedLessons, isAssigned }: { mod: any; completedLessons: any[]; isAssigned: boolean }) {
  const { isDark } = useTheme();
  const T = { bg: isDark?"#0d1526":"#f0f4f8", card: isDark?"#111c30":"#ffffff", text: isDark?"#ffffff":"#0d1526", text2: isDark?"#8b9dc3":"#475569", text3: isDark?"#4a6a8a":"#94a3b8", border: isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)", border2: isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.16)", bg3: isDark?"#1a2540":"#f8fafc", green: isDark?"#76AD25":"#5a9a1a" };
  const router = useRouter();
  const accent = mod.colorTheme || "#76AD25";
  const lessons = mod.lessons ?? [];
  const totalXp = lessons.reduce((s, l) => s + (l.xpReward || 0), 0) || mod.xpReward || 0;
  const firstLesson = lessons.find((l) => !completedLessons.includes(mod.folder + "/" + l.filename)) ?? lessons[0];
  const completedCount = lessons.filter((l) => completedLessons.includes(mod.folder + "/" + l.filename)).length;
  const progressPct = mod.lessonCount > 0 ? Math.round((completedCount / mod.lessonCount) * 100) : 0;
  const isComplete = completedCount === mod.lessonCount && mod.lessonCount > 0;
  const btnLabel = completedCount === 0 ? "Start" : isComplete ? "Review" : "Continue";

  return (
    <div
      onClick={() => mod.lessonCount > 0 && router.push("/module?folder=" + mod.folder)}
      style={{
        background: T.card,
        border: "1.5px solid " + (isAssigned ? accent + "44" : T.border),
        borderRadius: 16,
        overflow: "hidden",
        cursor: mod.lessonCount > 0 ? "pointer" : "default",
        transition: "all .2s cubic-bezier(.34,1.56,.64,1)",
        boxShadow: isAssigned ? "0 4px 20px " + accent + "22" : "0 2px 8px rgba(0,0,0,.08)",
        position: "relative",
      }}
      onMouseEnter={(e) => { if (mod.lessonCount > 0) { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px " + accent + "33"; } }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = isAssigned ? "0 4px 20px " + accent + "22" : "0 2px 8px rgba(0,0,0,.08)"; }}
    >
      <div style={{ height: 4, background: "linear-gradient(90deg," + accent + "," + accent + "88)" }} />
      <div style={{ padding: "18px 18px 16px" }}>
        {isAssigned && (
          <div style={{ position: "absolute", top: 12, right: 12, display: "flex", alignItems: "center", gap: 3, background: "rgba(245,158,11,.15)", color: "#f59e0b", padding: "2px 8px", borderRadius: 99, fontSize: "0.62rem", fontWeight: 800, border: "1px solid rgba(245,158,11,.25)" }}>
            <Star size={9} fill="#f59e0b" color="#f59e0b" /> Assigned
          </div>
        )}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: accent + "18", border: "1.5px solid " + accent + "33", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <BookOpen size={20} color={accent} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, color: T.text, fontSize: "0.9rem", lineHeight: 1.3 }}>{mod.title}</div>
            {mod.nceaStandard && <div style={{ fontSize: "0.68rem", color: T.text3, marginTop: 2 }}>{mod.nceaStandard}</div>}
          </div>
        </div>
        {mod.description && (
          <div style={{ fontSize: "0.78rem", color: T.text2, lineHeight: 1.5, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{mod.description}</div>
        )}
        <div style={{ height: 5, background: T.bg3, borderRadius: 99, marginBottom: 8, overflow: "hidden" }}>
          <div style={{ height: 5, borderRadius: 99, width: progressPct + "%", background: isComplete ? "#76AD25" : accent, transition: "width 1s ease", boxShadow: progressPct > 0 ? "0 0 6px " + accent + "66" : "none" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: "0.72rem", color: T.text3 }}>{completedCount}/{mod.lessonCount ?? 0} lessons</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Zap size={11} color="#f59e0b" fill="#f59e0b" />
            <span style={{ fontSize: "0.72rem", color: "#f59e0b", fontWeight: 700 }}>{totalXp} XP</span>
          </div>
        </div>
        {mod.lessonCount > 0 ? (
          <button
            onClick={(e) => { e.stopPropagation(); router.push("/module?folder=" + mod.folder); }}
            className={isComplete ? "btn-3d-ghost" : "btn-3d-green"}
            style={{ width: "100%", padding: "9px", fontSize: "0.82rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}
          >
            {isComplete ? <Award size={13} /> : <Play size={13} />} {btnLabel}
            <ChevronRight size={12} />
          </button>
        ) : (
          <div style={{ width: "100%", padding: "9px", fontSize: "0.78rem", background: T.bg3, borderRadius: 10, color: T.text3, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Lock size={12} /> Coming Soon
          </div>
        )}
      </div>
    </div>
  );
}

export default function CurriculumPage() {
  const { isDark } = useTheme();
  const T = { bg: isDark?"#0d1526":"#f0f4f8", bg2: isDark?"#111c30":"#ffffff", bg3: isDark?"#1a2540":"#f8fafc", card: isDark?"#111c30":"#ffffff", text: isDark?"#ffffff":"#0d1526", text2: isDark?"#8b9dc3":"#475569", text3: isDark?"#4a6a8a":"#94a3b8", border: isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)", border2: isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.16)", green: isDark?"#76AD25":"#5a9a1a" };
  const { state, user } = useGame();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeLevel, setActiveLevel] = useState("11");

  const { data: enrollData } = db.useQuery(
    user ? { classEnrollments: { $: { where: { studentEmail: user.email ?? "" } } } } : null
  );
  const { data: classData } = db.useQuery({ classrooms: {} });
  const enrollments   = (enrollData?.classEnrollments ?? []);
  const allClassrooms = (classData?.classrooms ?? []);
  const myClassrooms  = enrollments.map((e) => allClassrooms.find((c) => c.id === e.classroomId)).filter(Boolean);
  const assignedModules = myClassrooms.flatMap((cls) => cls.assignedModules ?? []);
  const classAnnouncement = myClassrooms[0]?.announcement ?? null;

  const completedLessons = (state?.completedLessons ?? []);
  const xp = state?.xp ?? 0;
  const streak = state?.streak ?? 0;

  useEffect(() => {
    fetch("/api/modules")
      .then((r) => r.json())
      .then((d) => { if (d.modules) setModules(d.modules); else setError(d.error ?? "Could not load modules"); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  const grouped = LEVEL_GROUPS.map((g) => ({
    ...g,
    modules: modules
      .filter((m) => getLevel(m) === g.key)
      .sort((a, b) => {
        const aA = assignedModules.includes(a.folder) ? 0 : 1;
        const bA = assignedModules.includes(b.folder) ? 0 : 1;
        if (aA !== bA) return aA - bA;
        return (a.order ?? 99) - (b.order ?? 99);
      }),
  }));
  const currentGroup = grouped.find((g) => g.key === activeLevel) ?? grouped[0];

  return (
    <AuthGuard>
      <div style={{ minHeight: "100vh", background: T.bg, fontFamily: FONT }}>
        <Nav />

        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg," + T.bg + " 0%," + T.bg2 + " 50%," + T.bg + " 100%)", padding: "28px 2rem", borderBottom: "1px solid " + T.border }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <BookOpen size={22} color="#76AD25" />
              <h1 style={{ fontWeight: 900, fontSize: "1.4rem", color: T.text }}>Curriculum</h1>
            </div>
            <p style={{ color: T.text2, fontSize: "0.875rem", marginBottom: 16 }}>Work through lessons, earn XP, and build real financial skills.</p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {[
                { Icon: Zap,   label: "XP",      val: xp.toLocaleString(),          color: "#f59e0b" },
                { Icon: Award, label: "Lessons",  val: completedLessons.length,      color: "#76AD25" },
                { Icon: Flame, label: "Streak",   val: streak + "d",                 color: "#f97316" },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, background: isDark?"rgba(255,255,255,.05)":"rgba(0,0,0,.04)", border: "1px solid " + T.border, borderRadius: 10, padding: "8px 14px" }}>
                  <s.Icon size={15} color={s.color} />
                  <div>
                    <div style={{ fontSize: "0.6rem", color: T.text3, textTransform: "uppercase", letterSpacing: ".04em" }}>{s.label}</div>
                    <div style={{ fontWeight: 800, color: s.color, fontSize: "0.9rem" }}>{s.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 1.5rem 60px" }}>

          {/* Announcement */}
          {classAnnouncement && (
            <div style={{ background: isDark?"rgba(59,130,246,.08)":"rgba(59,130,246,.06)", border: "1px solid rgba(59,130,246,.15)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <Megaphone size={15} color="#60a5fa" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: "0.68rem", color: "#60a5fa", fontWeight: 700, marginBottom: 3, textTransform: "uppercase", letterSpacing: ".04em" }}>Teacher Announcement</div>
                <div style={{ color: T.text, fontSize: "0.82rem", lineHeight: 1.5 }}>{classAnnouncement}</div>
              </div>
            </div>
          )}

          {/* Level tabs */}
          <div style={{ display: "flex", background: isDark?"rgba(255,255,255,.04)":"rgba(0,0,0,.03)", borderRadius: 12, padding: 4, marginBottom: 24, gap: 2, overflowX: "auto" }}>
            {LEVEL_GROUPS.map((g) => (
              <button key={g.key} onClick={() => setActiveLevel(g.key)} style={{ padding: "9px 20px", borderRadius: 9, whiteSpace: "nowrap", background: activeLevel === g.key ? T.card : "transparent", color: activeLevel === g.key ? g.color : T.text3, border: activeLevel === g.key ? "1px solid " + T.border2 : "1px solid transparent", fontWeight: activeLevel === g.key ? 700 : 500, fontSize: "0.82rem", cursor: "pointer", fontFamily: FONT, transition: "all .15s", boxShadow: activeLevel === g.key ? "0 2px 8px rgba(0,0,0,.1)" : "none" }}>
                {g.label}
              </button>
            ))}
          </div>

          {loading && <div style={{ textAlign: "center", padding: "60px", color: T.text3 }}>Loading curriculum...</div>}
          {error && <div style={{ textAlign: "center", padding: "40px", color: "#EF4444" }}>{error}</div>}

          {!loading && !error && currentGroup && (() => {
            const assigned   = currentGroup.modules.filter((m) => assignedModules.includes(m.folder));
            const unassigned = currentGroup.modules.filter((m) => !assignedModules.includes(m.folder));
            return (
              <div>
                {assigned.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <Star size={13} color="#f59e0b" fill="#f59e0b" />
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: ".05em" }}>Assigned by your teacher</span>
                      <div style={{ flex: 1, height: 1, background: "rgba(245,158,11,.2)" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
                      {assigned.map((mod) => (
                        <ModuleCard key={mod.folder} mod={mod} completedLessons={completedLessons} isAssigned={true} />
                      ))}
                    </div>
                  </div>
                )}
                {unassigned.length > 0 && (
                  <div>
                    {assigned.length > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: ".05em" }}>All modules</span>
                        <div style={{ flex: 1, height: 1, background: T.border }} />
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
                      {unassigned.map((mod) => (
                        <ModuleCard key={mod.folder} mod={mod} completedLessons={completedLessons} isAssigned={false} />
                      ))}
                    </div>
                  </div>
                )}
                {currentGroup.modules.length === 0 && (
                  <div style={{ textAlign: "center", padding: "60px", color: T.text3 }}>
                    <BookOpen size={44} color={T.text3} style={{ margin: "0 auto 12px", display: "block" }} />
                    <p>No modules available for this level yet.</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </AuthGuard>
  );
}
