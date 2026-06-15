"use client";
import { useState } from "react";
import { id } from "@instantdb/react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { db } from "@/lib/db";
import { useGame } from "@/lib/gameContext";
import { Users, BookOpen, BarChart2, Home, Plus, Copy, Zap, TrendingUp, CheckCircle } from "lucide-react";

type Tab = "home" | "students" | "modules" | "analytics";

function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function EducatorPage() {
  const { user } = useGame();
  const [tab, setTab] = useState("home" as Tab);
  const [className, setClassName] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [notif, setNotif] = useState<string | null>(null);

  const { data: classData } = db.useQuery(
    user ? { classrooms: { $: { where: { ownerEmail: user.email } } } } : null
  );
  const { data: enrollData } = db.useQuery({ classEnrollments: {} });
  const { data: progressData } = db.useQuery({ userState: {} });

  const classrooms = (classData?.classrooms ?? []) as any[];
  const enrollments = (enrollData?.classEnrollments ?? []) as any[];
  const allProgress = (progressData?.userState ?? []) as any[];

  function notify(m: string) { setNotif(m); setTimeout(() => setNotif(null), 3000); }

  function createClass() {
    if (!className.trim() || !user) return;
    db.transact(
      (db as any).tx.classrooms[id()].update({
        name: className.trim(),
        joinCode: genCode(),
        ownerEmail: user.email,
        isActive: true,
        createdAt: Date.now(),
      })
    );
    setClassName("");
    notify("Class created");
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  const avgXp = allProgress.length
    ? Math.round(allProgress.reduce((s: number, p: any) => s + (p.xp ?? 0), 0) / allProgress.length)
    : 0;
  const totalLessons = allProgress.reduce((s: number, p: any) => s + (p.completedLessons?.length ?? 0), 0);

  const TABS = [
    { key: "home" as Tab,      Icon: Home,     label: "Home" },
    { key: "students" as Tab,  Icon: Users,    label: "Students" },
    { key: "modules" as Tab,   Icon: BookOpen, label: "Modules" },
    { key: "analytics" as Tab, Icon: BarChart2,label: "Analytics" },
  ];

  return (
    <AuthGuard>
      <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>
        <Nav />

        {notif && (
          <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 100, background: "#0d1526", color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: "0.85rem", fontWeight: 600, border: "1px solid #76AD25" }}>
            {notif}
          </div>
        )}

        <div style={{ background: "linear-gradient(135deg,#0d1526,#111c30)", padding: "28px 2rem" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", marginBottom: 4 }}>Educator Dashboard</h1>
            <p style={{ color: "#8b9dc3", fontSize: "0.875rem" }}>Manage your classes, assign modules, and track student progress.</p>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 1.5rem" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, background: "#e2e8f0", padding: 4, borderRadius: 10, width: "fit-content", marginBottom: 24 }}>
            {TABS.map(({ key, Icon, label }) => (
              <button key={key} onClick={() => setTab(key)} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 8,
                background: tab === key ? "#fff" : "transparent",
                color: tab === key ? "#0d1526" : "#64748b",
                border: "none", fontWeight: 600, fontSize: "0.82rem",
                cursor: "pointer", fontFamily: "Inter, sans-serif",
                boxShadow: tab === key ? "0 1px 3px rgba(0,0,0,.1)" : "none",
              }}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* HOME */}
          {tab === "home" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
                {[
                  { label: "Classes", val: classrooms.length, Icon: Home, color: "#3B82F6", bg: "#eff6ff" },
                  { label: "Students", val: enrollments.length, Icon: Users, color: "#76AD25", bg: "#e8f5d0" },
                  { label: "Avg XP", val: avgXp.toLocaleString(), Icon: Zap, color: "#f59e0b", bg: "#fffbeb" },
                  { label: "Lessons Completed", val: totalLessons, Icon: CheckCircle, color: "#76AD25", bg: "#e8f5d0" },
                ].map(s => (
                  <div key={s.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                      <s.Icon size={16} color={s.color} />
                    </div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0d1526" }}>{s.val}</div>
                    <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Create class */}
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "22px" }}>
                <h2 style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 14 }}>Create a New Class</h2>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    type="text"
                    placeholder="e.g. Commerce 10A"
                    value={className}
                    onChange={e => setClassName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && createClass()}
                    style={{ flex: 1, border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 14px", fontFamily: "Inter, sans-serif", fontSize: "0.875rem", outline: "none", color: "#0d1526" }}
                    onFocus={e => e.target.style.borderColor = "#76AD25"}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                  />
                  <button onClick={createClass} style={{ padding: "10px 20px", background: "#0d1526", color: "#fff", border: "none", borderRadius: 9, fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                    <Plus size={14} /> Create
                  </button>
                </div>
              </div>

              {/* Class list */}
              {classrooms.map((c: any) => (
                <div key={c.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: "0.95rem" }}>{c.name}</h3>
                      <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 3 }}>
                        Join code: <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0d1526", background: "#f1f5f9", padding: "1px 6px", borderRadius: 4 }}>{c.joinCode}</span>
                        {" "}&middot; {enrollments.filter((e: any) => e.classroomId === c.id).length} students
                      </div>
                    </div>
                    <button onClick={() => copyCode(c.joinCode)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: copied === c.joinCode ? "#e8f5d0" : "#f1f5f9", color: copied === c.joinCode ? "#76AD25" : "#475569", border: `1px solid ${copied === c.joinCode ? "#76AD25" : "#e2e8f0"}`, borderRadius: 8, fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                      <Copy size={13} /> {copied === c.joinCode ? "Copied" : "Copy Code"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STUDENTS */}
          {tab === "students" && (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, fontSize: "0.95rem" }}>
                All Students ({allProgress.length})
              </div>
              {allProgress.length === 0 ? (
                <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8", fontSize: "0.875rem" }}>
                  No students yet. Share your class join code to get started.
                </div>
              ) : (
                allProgress
                  .sort((a: any, b: any) => (b.xp ?? 0) - (a.xp ?? 0))
                  .map((p: any, i: number) => (
                    <div key={p.id ?? i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: "1px solid #f8fafc" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.78rem", color: "#475569", flexShrink: 0 }}>
                        {p.userId?.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                          {p.userId === user?.id ? "You" : `Student ${p.userId?.slice(0, 8)}`}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 2 }}>
                          {p.completedLessons?.length ?? 0} lessons · {p.streak ?? 0} day streak
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                          <Zap size={12} color="#f59e0b" />
                          <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#f59e0b" }}>{(p.xp ?? 0).toLocaleString()}</span>
                        </div>
                        <div style={{ background: "#e2e8f0", borderRadius: 99, height: 4, width: 80, overflow: "hidden", marginTop: 4, marginLeft: "auto" }}>
                          <div style={{ background: "#76AD25", height: 4, borderRadius: 99, width: `${Math.min(100, ((p.xp ?? 0) / 2000) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}

          {/* MODULES */}
          {tab === "modules" && (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "24px" }}>
              <h2 style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 16 }}>Module Management</h2>
              <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: 20, lineHeight: 1.6 }}>
                Modules are managed through your local curriculum folder. Add JSON files using the PocketWise Editor, then upload to Base44. Assigned modules appear automatically on the Curriculum page.
              </p>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px", fontFamily: "monospace", fontSize: "0.8rem", color: "#475569" }}>
                pocketwise-curriculum/<br />
                &nbsp;&nbsp;module-1-money-foundations/<br />
                &nbsp;&nbsp;&nbsp;&nbsp;module.json<br />
                &nbsp;&nbsp;&nbsp;&nbsp;lesson-1.json ... lesson-8.json<br />
                &nbsp;&nbsp;module-2-price-market/<br />
                &nbsp;&nbsp;&nbsp;&nbsp;...
              </div>
            </div>
          )}

          {/* ANALYTICS */}
          {tab === "analytics" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
                {[
                  { label: "Total XP Earned", val: allProgress.reduce((s: number, p: any) => s + (p.xp ?? 0), 0).toLocaleString(), color: "#f59e0b" },
                  { label: "Total Lessons", val: totalLessons, color: "#76AD25" },
                  { label: "Active Learners", val: allProgress.filter((p: any) => (p.xp ?? 0) > 0).length, color: "#3B82F6" },
                  { label: "Average XP", val: avgXp.toLocaleString(), color: "#f59e0b" },
                ].map(s => (
                  <div key={s.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px", textAlign: "center" }}>
                    <div style={{ fontSize: "1.75rem", fontWeight: 800, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "22px" }}>
                <h2 style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
                  <TrendingUp size={16} color="#3B82F6" /> Student XP Distribution
                </h2>
                {allProgress.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>No data yet.</p>
                ) : (
                  allProgress
                    .sort((a: any, b: any) => (b.xp ?? 0) - (a.xp ?? 0))
                    .slice(0, 10)
                    .map((p: any, i: number) => {
                      const maxXp = Math.max(...allProgress.map((x: any) => x.xp ?? 0), 1);
                      const pct = ((p.xp ?? 0) / maxXp) * 100;
                      return (
                        <div key={p.id ?? i} style={{ marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: 4 }}>
                            <span style={{ color: "#475569", fontWeight: 500 }}>
                              {p.userId === user?.id ? "You" : `Student ${p.userId?.slice(0, 6)}`}
                            </span>
                            <span style={{ fontWeight: 700, color: "#f59e0b" }}>
                              {(p.xp ?? 0).toLocaleString()} XP
                            </span>
                          </div>
                          <div style={{ background: "#f1f5f9", borderRadius: 99, height: 6, overflow: "hidden" }}>
                            <div style={{ background: "#76AD25", height: 6, borderRadius: 99, width: `${pct}%`, transition: "width .5s" }} />
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
