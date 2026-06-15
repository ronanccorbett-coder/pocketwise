"use client";
import { useState, useEffect } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { db } from "@/lib/db";
import { useGame } from "@/lib/gameContext";
import { useTheme } from "@/lib/theme";
import { id } from "@instantdb/react";
import {
  Users, BookOpen, Zap, TrendingUp, Copy, Check, Plus, Trash2,
  Megaphone, Trophy, Target, BarChart2, Star, RefreshCw, Send,
  GraduationCap, AlertCircle, Award, Flame, Clock, Lock, Unlock,
  DollarSign, Shield,
} from "lucide-react";

const FONT = "Inter, system-ui, sans-serif";

function genCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

type Tab = "overview" | "students" | "modules" | "challenges" | "tools";

const SUBJECT_OPTIONS = ["Commerce", "Economics", "Business Studies", "Financial Literacy", "Mathematics", "Social Studies", "Other"];
const YEAR_OPTIONS    = ["Year 9", "Year 10", "Year 11", "Year 12", "Year 13", "Mixed"];

export default function TeacherPage() {
  const { isDark } = useTheme();
  const T = {
    bg:      isDark ? "#0d1526" : "#f0f4f8",
    bg2:     isDark ? "#111c30" : "#ffffff",
    bg3:     isDark ? "#1a2540" : "#f8fafc",
    text:    isDark ? "#ffffff" : "#0d1526",
    text2:   isDark ? "#8b9dc3" : "#475569",
    text3:   isDark ? "#4a6a8a" : "#94a3b8",
    border:  isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.08)",
    border2: isDark ? "rgba(255,255,255,.14)" : "rgba(0,0,0,.16)",
    card:    isDark ? "#111c30" : "#ffffff",
    input:   isDark ? "rgba(255,255,255,.06)" : "#f8fafc",
    shadow:  isDark ? "rgba(0,0,0,.4)" : "rgba(0,0,0,.08)",
    green:   isDark ? "#76AD25" : "#5a9a1a",
    accent:  isDark ? "#f59e0b" : "#d97706",
  };

  const { user, state } = useGame();
  const [tab, setTab] = useState("overview" as Tab);

  const { data: classData }    = db.useQuery(user ? { classrooms: { $: { where: { ownerId: user.id } } } } : null);
  const { data: enrollData }   = db.useQuery({ classEnrollments: {} });
  const { data: allStateData } = db.useQuery({ userState: {} });
  const { data: announceData } = db.useQuery({ classAnnouncements: {} });
  const { data: subData }      = db.useQuery(user ? { subscriptions: { $: { where: { ownerEmail: user.email ?? "" } } } } : null);

  const myClasses    = (classData?.classrooms ?? []) as any[];
  const allEnrolls   = (enrollData?.classEnrollments ?? []) as any[];
  const allStates    = (allStateData?.userState ?? []) as any[];
  const allAnnounce  = (announceData?.classAnnouncements ?? []) as any[];
  const allSubs      = (subData?.subscriptions ?? []) as any[];

  const isTeacher  = (state as any)?.role === "teacher";
  const isApproved = (state as any)?.teacherApproved === true;

  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const activeClass = myClasses.find(c => c.id === selectedClass) ?? myClasses[0] ?? null;

  useEffect(() => {
    if (myClasses.length > 0 && !selectedClass) setSelectedClass(myClasses[0].id);
  }, [myClasses.length]);

  const [showCreate,   setShowCreate]   = useState(false);
  const [className,    setClassName]    = useState("");
  const [subject,      setSubject]      = useState("Commerce");
  const [yearLevel,    setYearLevel]    = useState("Year 11");
  const [description,  setDescription]  = useState("");
  const [creating,     setCreating]     = useState(false);

  const [announce,    setAnnounce]    = useState("");
  const [announcing,  setAnnouncing]  = useState(false);
  const [copied,      setCopied]      = useState(false);

  const [challengeText,     setChallengeText]     = useState("");
  const [challengeXP,       setChallengeXP]       = useState(50);
  const [challengeDeadline, setChallengeDeadline] = useState("");

  const [boostEmail,  setBoostEmail]  = useState("");
  const [boostAmount, setBoostAmount] = useState(100);

  const [planCodeInput, setPlanCodeInput] = useState("");
  const [subLoading,    setSubLoading]    = useState(false);
  const [subError,      setSubError]      = useState("");
  const [subSuccess,    setSubSuccess]    = useState("");

  const classEnrolls   = activeClass ? allEnrolls.filter(e => e.classroomId === activeClass.id) : [];
  const studentStates  = classEnrolls.map(e => allStates.find((s: any) => s.email === e.studentEmail)).filter(Boolean) as any[];
  const classAnnouncements = activeClass ? allAnnounce.filter((a: any) => a.classroomId === activeClass.id).sort((a: any, b: any) => b.createdAt - a.createdAt) : [];

  const activeSub = activeClass
    ? allSubs.find((s: any) => s.classroomId === activeClass.id && s.status === "active" && (s.expiresAt ?? 0) > Date.now())
    : null;

  const avgXP       = studentStates.length ? Math.round(studentStates.reduce((s: number, st: any) => s + (st.xp ?? 0), 0) / studentStates.length) : 0;
  const avgNetWorth = studentStates.length ? Math.round(studentStates.reduce((s: number, st: any) => s + (st.netWorth ?? 0), 0) / studentStates.length) : 0;
  const avgStreak   = studentStates.length ? Math.round(studentStates.reduce((s: number, st: any) => s + (st.streak ?? 0), 0) / studentStates.length) : 0;
  const totalLessons = studentStates.reduce((s: number, st: any) => s + ((st.completedLessons as any[])?.length ?? 0), 0);

  async function createClass() {
    if (!className || !user) return;
    setCreating(true);
    const code = genCode();
    await db.transact(
      (db as any).tx.classrooms[id()].update({
        name: className, joinCode: code, ownerId: user.id,
        ownerEmail: user.email ?? "", isActive: true,
        createdAt: Date.now(), subject, yearLevel,
        description, xpMultiplier: 1.0, assignedModules: [],
      })
    );
    setShowCreate(false); setClassName(""); setDescription(""); setCreating(false);
  }

  async function postAnnouncement() {
    if (!announce || !activeClass || !user) return;
    setAnnouncing(true);
    await db.transact(
      (db as any).tx.classAnnouncements[id()].update({
        classroomId: activeClass.id, authorEmail: user.email,
        text: announce, createdAt: Date.now(),
      })
    );
    await db.transact((db as any).tx.classrooms[activeClass.id].update({ announcement: announce, announcedAt: Date.now() }));
    setAnnounce(""); setAnnouncing(false);
  }

  async function setChallenge() {
    if (!challengeText || !activeClass) return;
    const challenge = JSON.stringify({ text: challengeText, xp: challengeXP, deadline: challengeDeadline, createdAt: Date.now() });
    await db.transact((db as any).tx.classrooms[activeClass.id].update({ challenge }));
    setChallengeText(""); setChallengeDeadline("");
  }

  async function boostStudentXP() {
    const student = studentStates.find((s: any) => s.email === boostEmail);
    if (!student) return;
    await db.transact((db as any).tx.userState[student.id].update({ xp: (student.xp ?? 0) + boostAmount }));
    setBoostEmail("");
  }

  async function setXPMultiplier(mult: number) {
    if (!activeClass) return;
    await db.transact((db as any).tx.classrooms[activeClass.id].update({ xpMultiplier: mult }));
  }

  function copyCode() {
    if (!activeClass) return;
    navigator.clipboard.writeText(activeClass.joinCode);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  async function activateSubscription() {
    if (!planCodeInput.trim() || !activeClass || !user) return;
    setSubLoading(true); setSubError(""); setSubSuccess("");
    try {
      const allSubsQuery = await db.queryOnce({ subscriptions: {} });
      const allSubRows = (allSubsQuery.data?.subscriptions ?? []) as any[];
      const sub = allSubRows.find((s: any) => s.planCode === planCodeInput.trim().toUpperCase());
      if (!sub) { setSubError("Code not found. Check the code and try again."); setSubLoading(false); return; }
      if (sub.status === "active" && sub.classroomId && sub.classroomId !== activeClass.id) {
        setSubError("This code is already active on another class."); setSubLoading(false); return;
      }
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      await db.transact([
        (db as any).tx.subscriptions[sub.id].update({
          classroomId: activeClass.id, ownerEmail: user.email,
          ownerId: user.id, status: "active",
          activatedAt: Date.now(), expiresAt,
        }),
        (db as any).tx.classrooms[activeClass.id].update({ subscriptionId: sub.id }),
      ]);
      setSubSuccess(`Subscription activated! Valid until ${new Date(expiresAt).toLocaleDateString("en-NZ")}.`);
      setPlanCodeInput("");
    } catch (e: any) {
      setSubError("Something went wrong. Please try again.");
    }
    setSubLoading(false);
  }

  const TAB_LIST: { key: Tab; label: string; Icon: any }[] = [
    { key: "overview",   label: "Overview",   Icon: BarChart2 },
    { key: "students",   label: "Students",   Icon: Users },
    { key: "modules",    label: "Modules",    Icon: BookOpen },
    { key: "challenges", label: "Challenges", Icon: Trophy },
    { key: "tools",      label: "Tools",      Icon: Zap },
  ];

  if (!isApproved) {
    return (
      <AuthGuard>
        <div style={{ minHeight: "100vh", background: T.bg, fontFamily: FONT }}>
          <Nav />
          <div style={{ maxWidth: 500, margin: "80px auto", padding: "0 1.5rem", textAlign: "center" }}>
            <div style={{ background: T.card, border: "1.5px solid rgba(59,130,246,.3)", borderRadius: 20, padding: "40px 32px" }}>
              <GraduationCap size={48} color="#3B82F6" style={{ margin: "0 auto 16px" }} />
              <h2 style={{ color: T.text, fontWeight: 800, fontSize: "1.25rem", marginBottom: 8 }}>Awaiting Approval</h2>
              <p style={{ color: T.text2, fontSize: "0.875rem", lineHeight: 1.6, marginBottom: 20 }}>
                Your teacher account is pending admin review. You will receive access once your request is approved.
              </p>
              <div style={{ background: "rgba(59,130,246,.1)", border: "1px solid rgba(59,130,246,.2)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                <AlertCircle size={14} color="#60a5fa" />
                <span style={{ fontSize: "0.78rem", color: "#60a5fa" }}>The admin will be notified of your request.</span>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div style={{ minHeight: "100vh", background: T.bg, fontFamily: FONT }}>
        <Nav />

        {/* Hero */}
        <div style={{ background: `linear-gradient(135deg, ${T.bg} 0%, ${T.bg2} 60%, ${T.bg} 100%)`, borderBottom: `1px solid ${T.border}`, padding: "24px 1.5rem" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <GraduationCap size={22} color="#3B82F6" />
                  <h1 style={{ fontWeight: 900, fontSize: "1.4rem", color: T.text }}>Class Dashboard</h1>
                  <span style={{ background: "rgba(59,130,246,.15)", color: "#60a5fa", padding: "2px 10px", borderRadius: 99, fontSize: "0.65rem", fontWeight: 800, border: "1px solid rgba(59,130,246,.2)" }}>Teacher</span>
                </div>
                <p style={{ color: T.text3, fontSize: "0.82rem" }}>Welcome back, {user?.email?.split("@")[0]}</p>
              </div>
              <button onClick={() => setShowCreate(true)} className="btn-3d-blue" style={{ padding: "10px 20px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 6 }}>
                <Plus size={14} /> New Class
              </button>
            </div>

            {myClasses.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                {myClasses.map((cls: any) => (
                  <button key={cls.id} onClick={() => setSelectedClass(cls.id)} style={{
                    padding: "7px 16px", borderRadius: 99,
                    background: selectedClass === cls.id ? "#3B82F6" : "rgba(255,255,255,.07)",
                    color: selectedClass === cls.id ? "#fff" : T.text2,
                    border: `1px solid ${selectedClass === cls.id ? "#3B82F6" : T.border}`,
                    fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", fontFamily: FONT,
                    boxShadow: selectedClass === cls.id ? "0 4px 0 #1e3a8a, 0 6px 12px rgba(59,130,246,.3)" : "none",
                    transition: "all .15s",
                  }}>
                    {cls.name}
                    <span style={{ marginLeft: 6, opacity: 0.7, fontSize: "0.7rem" }}>({allEnrolls.filter((e: any) => e.classroomId === cls.id).length})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create class modal */}
        {showCreate && (
          <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
            <div style={{ background: T.card, border: "1.5px solid rgba(59,130,246,.3)", borderRadius: 20, padding: "28px 24px", maxWidth: 480, width: "100%", animation: "pw-pop .35s ease" }}>
              <h2 style={{ fontWeight: 800, color: T.text, fontSize: "1.1rem", marginBottom: 20 }}>Create New Class</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Class Name", val: className, set: setClassName, placeholder: "e.g. Year 11 Commerce 2025" },
                  { label: "Description (optional)", val: description, set: setDescription, placeholder: "Brief description..." },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ display: "block", fontSize: "0.7rem", color: T.text2, fontWeight: 600, marginBottom: 5, textTransform: "uppercase" as const, letterSpacing: ".04em" }}>{f.label}</label>
                    <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} className="pw-input" style={{ width: "100%", fontSize: "0.875rem" }} />
                  </div>
                ))}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Subject", val: subject, set: setSubject, opts: SUBJECT_OPTIONS },
                    { label: "Year Level", val: yearLevel, set: setYearLevel, opts: YEAR_OPTIONS },
                  ].map(f => (
                    <div key={f.label}>
                      <label style={{ display: "block", fontSize: "0.7rem", color: T.text2, fontWeight: 600, marginBottom: 5, textTransform: "uppercase" as const, letterSpacing: ".04em" }}>{f.label}</label>
                      <select value={f.val} onChange={e => f.set(e.target.value)} style={{ width: "100%", padding: "10px 12px", background: T.input, border: `1.5px solid ${T.border}`, borderRadius: 10, color: T.text, fontFamily: FONT, fontSize: "0.875rem", outline: "none" }}>
                        {f.opts.map(o => <option key={o} value={o} style={{ background: T.bg }}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                <button onClick={createClass} disabled={!className || creating} className={className && !creating ? "btn-3d-blue" : ""} style={{ flex: 1, padding: "12px", fontSize: "0.875rem", background: !className ? T.bg3 : undefined, color: !className ? T.text3 : undefined, border: "none", borderRadius: 10, fontWeight: 700, cursor: !className ? "not-allowed" : "pointer", fontFamily: FONT }}>
                  {creating ? "Creating..." : "Create Class"}
                </button>
                <button onClick={() => setShowCreate(false)} className="btn-3d-ghost" style={{ padding: "12px 18px", fontSize: "0.875rem" }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* No classes */}
        {myClasses.length === 0 && (
          <div style={{ maxWidth: 500, margin: "80px auto", padding: "0 1.5rem", textAlign: "center" }}>
            <div style={{ background: T.card, border: `2px dashed ${T.border}`, borderRadius: 20, padding: "48px 32px" }}>
              <BookOpen size={44} color={T.text3} style={{ margin: "0 auto 16px" }} />
              <h2 style={{ color: T.text, fontWeight: 800, fontSize: "1.1rem", marginBottom: 8 }}>No Classes Yet</h2>
              <p style={{ color: T.text3, fontSize: "0.875rem", marginBottom: 20 }}>Create your first class to start managing students.</p>
              <button onClick={() => setShowCreate(true)} className="btn-3d-blue" style={{ padding: "12px 28px", fontSize: "0.875rem" }}>Create Your First Class</button>
            </div>
          </div>
        )}

        {/* Main dashboard */}
        {activeClass && (
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.5rem 60px" }}>

            {/* Class info bar */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 20px", margin: "20px 0", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 800, color: T.text, fontSize: "1rem" }}>{activeClass.name}</div>
                <div style={{ fontSize: "0.72rem", color: T.text3, marginTop: 2 }}>{activeClass.subject} - {activeClass.yearLevel}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(118,173,37,.1)", border: "1px solid rgba(118,173,37,.2)", borderRadius: 10, padding: "8px 14px" }}>
                <div>
                  <div style={{ fontSize: "0.6rem", color: "#76AD25", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: ".04em" }}>Join Code</div>
                  <div style={{ fontWeight: 900, color: "#76AD25", fontSize: "1.2rem", letterSpacing: ".15em", fontFamily: "monospace" }}>{activeClass.joinCode}</div>
                </div>
                <button onClick={copyCode} style={{ background: "none", border: "none", cursor: "pointer", color: copied ? "#76AD25" : T.text3, display: "flex", padding: 4 }}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Users size={14} color={T.text2} />
                <span style={{ fontWeight: 700, color: T.text, fontSize: "0.875rem" }}>{classEnrolls.length} students</span>
              </div>
              {activeSub ? (
                <span style={{ background: "rgba(118,173,37,.12)", color: "#76AD25", padding: "4px 12px", borderRadius: 99, fontSize: "0.72rem", fontWeight: 700, border: "1px solid rgba(118,173,37,.2)" }}>
                  Active - expires {new Date(activeSub.expiresAt).toLocaleDateString("en-NZ")}
                </span>
              ) : (
                <span style={{ background: "rgba(245,158,11,.1)", color: "#f59e0b", padding: "4px 12px", borderRadius: 99, fontSize: "0.72rem", fontWeight: 700, border: "1px solid rgba(245,158,11,.2)" }}>
                  No active subscription
                </span>
              )}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", background: `rgba(255,255,255,.04)`, borderRadius: 12, padding: 4, marginBottom: 24, overflowX: "auto" as const, gap: 2 }}>
              {TAB_LIST.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  padding: "9px 18px", borderRadius: 9, whiteSpace: "nowrap" as const,
                  background: tab === t.key ? T.bg3 : "transparent",
                  color: tab === t.key ? "#60a5fa" : T.text3,
                  border: tab === t.key ? `1px solid ${T.border2}` : "1px solid transparent",
                  fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", fontFamily: FONT,
                  display: "flex", alignItems: "center", gap: 6, transition: "all .15s",
                }}>
                  <t.Icon size={13} /> {t.label}
                </button>
              ))}
            </div>

            {/* OVERVIEW */}
            {tab === "overview" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
                  {[
                    { label: "Students",      val: classEnrolls.length,                Icon: Users,       color: "#3B82F6" },
                    { label: "Avg XP",        val: avgXP.toLocaleString(),             Icon: Zap,         color: "#f59e0b" },
                    { label: "Avg Net Worth", val: `$${avgNetWorth.toLocaleString()}`, Icon: TrendingUp,  color: "#76AD25" },
                    { label: "Avg Streak",    val: `${avgStreak}d`,                    Icon: Flame,       color: "#f97316" },
                    { label: "Lessons Done",  val: totalLessons,                       Icon: BookOpen,    color: "#a78bfa" },
                    { label: "Subject",       val: activeClass.subject,                Icon: GraduationCap, color: "#22d3ee" },
                  ].map(s => (
                    <div key={s.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px", display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${s.color}18`, border: `1px solid ${s.color}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <s.Icon size={17} color={s.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.65rem", color: T.text3, textTransform: "uppercase" as const, letterSpacing: ".04em" }}>{s.label}</div>
                        <div style={{ fontWeight: 900, color: T.text, fontSize: "1rem", lineHeight: 1.2 }}>{s.val}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                      <Trophy size={16} color="#f59e0b" />
                      <h3 style={{ fontWeight: 700, color: T.text, fontSize: "0.9rem" }}>Class Leaderboard</h3>
                    </div>
                    {studentStates.slice().sort((a: any, b: any) => (b.xp ?? 0) - (a.xp ?? 0)).slice(0, 5).map((st: any, i: number) => (
                      <div key={st.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 4 ? `1px solid ${T.border}` : "none" }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : T.bg3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", fontWeight: 800, color: T.text, flexShrink: 0 }}>{i + 1}</div>
                        <div style={{ flex: 1, fontWeight: 600, color: T.text, fontSize: "0.8rem" }}>{st.email?.split("@")[0]}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <Zap size={11} color="#f59e0b" fill="#f59e0b" />
                          <span style={{ fontWeight: 700, color: "#f59e0b", fontSize: "0.78rem" }}>{(st.xp ?? 0).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                    {studentStates.length === 0 && <p style={{ color: T.text3, fontSize: "0.78rem", textAlign: "center", padding: "16px 0" }}>No students enrolled yet</p>}
                  </div>
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                      <Megaphone size={16} color="#60a5fa" />
                      <h3 style={{ fontWeight: 700, color: T.text, fontSize: "0.9rem" }}>Post Announcement</h3>
                    </div>
                    <textarea value={announce} onChange={e => setAnnounce(e.target.value)} placeholder="e.g. Portfolios due Friday!" rows={3} className="pw-input" style={{ width: "100%", resize: "none" as const, marginBottom: 10, fontSize: "0.85rem" }} />
                    <button onClick={postAnnouncement} disabled={!announce || announcing} className={announce && !announcing ? "btn-3d-blue" : ""} style={{ width: "100%", padding: "10px", fontSize: "0.85rem", background: !announce ? T.bg3 : undefined, color: !announce ? T.text3 : undefined, border: "none", borderRadius: 10, fontWeight: 700, cursor: !announce ? "not-allowed" : "pointer", fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <Send size={13} /> {announcing ? "Posting..." : "Post to Class"}
                    </button>
                    {classAnnouncements.length > 0 && (
                      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6, maxHeight: 120, overflowY: "auto" as const }}>
                        {classAnnouncements.slice(0, 3).map((a: any) => (
                          <div key={a.id} style={{ background: T.bg3, borderRadius: 8, padding: "8px 10px" }}>
                            <div style={{ fontSize: "0.75rem", color: T.text }}>{a.text}</div>
                            <div style={{ fontSize: "0.62rem", color: T.text3, marginTop: 3 }}>{new Date(a.createdAt).toLocaleDateString("en-NZ")}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STUDENTS */}
            {tab === "students" && (
              <div>
                {classEnrolls.length === 0 ? (
                  <div style={{ background: T.card, border: `2px dashed ${T.border}`, borderRadius: 14, padding: "48px", textAlign: "center" }}>
                    <Users size={40} color={T.text3} style={{ margin: "0 auto 12px" }} />
                    <p style={{ color: T.text3, fontSize: "0.875rem", marginBottom: 8 }}>No students enrolled yet.</p>
                    <p style={{ color: T.text3, fontSize: "0.82rem" }}>Share the class code <strong style={{ color: "#76AD25", fontFamily: "monospace", fontSize: "1rem" }}>{activeClass.joinCode}</strong> with your students.</p>
                  </div>
                ) : (
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
                    <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ fontWeight: 700, color: T.text, fontSize: "0.9rem" }}>All Students ({classEnrolls.length})</h3>
                    </div>
                    {studentStates.slice().sort((a: any, b: any) => (b.xp ?? 0) - (a.xp ?? 0)).map((st: any, i: number) => (
                      <div key={st.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: `1px solid ${T.border}` }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: `hsl(${(i * 47) % 360}, 55%, 35%)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: T.text, fontSize: "0.78rem", flexShrink: 0 }}>
                          {st.email?.slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: T.text, fontSize: "0.85rem" }}>{st.email?.split("@")[0]}</div>
                          <div style={{ fontSize: "0.7rem", color: T.text3 }}>{st.email}</div>
                        </div>
                        <div style={{ display: "flex", gap: 16 }}>
                          {[
                            { Icon: Zap,        val: (st.xp ?? 0).toLocaleString(),        color: "#f59e0b", label: "XP" },
                            { Icon: DollarSign, val: `$${(st.netWorth ?? 0).toFixed(0)}`,  color: "#76AD25", label: "Net" },
                            { Icon: BookOpen,   val: (st.completedLessons as any[])?.length ?? 0, color: "#a78bfa", label: "Lessons" },
                            { Icon: Flame,      val: `${st.streak ?? 0}d`,                 color: "#f97316", label: "Streak" },
                          ].map(s => (
                            <div key={s.label} style={{ textAlign: "center", minWidth: 48 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 3, justifyContent: "center" }}>
                                <s.Icon size={11} color={s.color} />
                                <span style={{ fontWeight: 700, color: s.color, fontSize: "0.8rem" }}>{s.val}</span>
                              </div>
                              <div style={{ fontSize: "0.58rem", color: T.text3 }}>{s.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MODULES */}
            {tab === "modules" && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px" }}>
                <h3 style={{ fontWeight: 700, color: T.text, fontSize: "0.9rem", marginBottom: 6 }}>Assigned Modules</h3>
                <p style={{ color: T.text3, fontSize: "0.8rem", marginBottom: 16 }}>Control which modules your class can access.</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                  {["module-1-financial-decision-making", "module-2-budgeting-basics", "module-3-saving-and-investing", "module-4-financial-viability", "module-5-credit-and-debt"].map(mod => {
                    const assigned = ((activeClass.assignedModules as string[]) ?? []).includes(mod);
                    const modName = mod.replace(/^module-\d+-/, "").replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
                    return (
                      <div key={mod} style={{ background: assigned ? "rgba(118,173,37,.08)" : T.bg3, border: `1.5px solid ${assigned ? "rgba(118,173,37,.25)" : T.border}`, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                        {assigned ? <Unlock size={14} color="#76AD25" /> : <Lock size={14} color={T.text3} />}
                        <div style={{ flex: 1, fontWeight: 600, color: assigned ? T.text : T.text2, fontSize: "0.8rem" }}>{modName}</div>
                        <button onClick={async () => {
                          const curr = (activeClass.assignedModules as string[]) ?? [];
                          const updated = assigned ? curr.filter((m: string) => m !== mod) : [...curr, mod];
                          await db.transact((db as any).tx.classrooms[activeClass.id].update({ assignedModules: updated }));
                        }} style={{ background: assigned ? "rgba(239,68,68,.12)" : "rgba(118,173,37,.12)", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: "0.7rem", fontWeight: 700, color: assigned ? "#EF4444" : "#76AD25", cursor: "pointer", fontFamily: FONT }}>
                          {assigned ? "Remove" : "Assign"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CHALLENGES */}
            {tab === "challenges" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                    <Trophy size={16} color="#f59e0b" />
                    <h3 style={{ fontWeight: 700, color: T.text, fontSize: "0.9rem" }}>Set Class Challenge</h3>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <textarea value={challengeText} onChange={e => setChallengeText(e.target.value)} placeholder="e.g. Complete 3 lessons this week to earn bonus XP!" rows={3} className="pw-input" style={{ width: "100%", resize: "none" as const, fontSize: "0.85rem" }} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.7rem", color: T.text2, fontWeight: 600, marginBottom: 5, textTransform: "uppercase" as const }}>Bonus XP</label>
                        <input type="number" value={challengeXP} onChange={e => setChallengeXP(parseInt(e.target.value))} className="pw-input" style={{ width: "100%", fontSize: "0.875rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.7rem", color: T.text2, fontWeight: 600, marginBottom: 5, textTransform: "uppercase" as const }}>Deadline</label>
                        <input type="date" value={challengeDeadline} onChange={e => setChallengeDeadline(e.target.value)} className="pw-input" style={{ width: "100%", fontSize: "0.875rem" }} />
                      </div>
                    </div>
                    <button onClick={setChallenge} disabled={!challengeText} className={challengeText ? "btn-3d-amber" : ""} style={{ padding: "11px", fontSize: "0.875rem", background: !challengeText ? T.bg3 : undefined, color: !challengeText ? T.text3 : undefined, border: "none", borderRadius: 10, fontWeight: 700, cursor: !challengeText ? "not-allowed" : "pointer", fontFamily: FONT }}>
                      Set Challenge
                    </button>
                  </div>
                  {activeClass.challenge && (() => {
                    try {
                      const ch = JSON.parse(activeClass.challenge);
                      return (
                        <div style={{ background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.2)", borderRadius: 10, padding: "12px 14px", marginTop: 14 }}>
                          <div style={{ fontSize: "0.68rem", color: "#f59e0b", fontWeight: 700, marginBottom: 4 }}>ACTIVE CHALLENGE</div>
                          <div style={{ color: T.text, fontSize: "0.82rem", marginBottom: 6 }}>{ch.text}</div>
                          <div style={{ display: "flex", gap: 12, fontSize: "0.72rem", color: T.text2 }}>
                            <span>Reward: <strong style={{ color: "#f59e0b" }}>+{ch.xp} XP</strong></span>
                            {ch.deadline && <span>Deadline: {ch.deadline}</span>}
                          </div>
                        </div>
                      );
                    } catch { return null; }
                  })()}
                </div>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <Target size={16} color="#a78bfa" />
                    <h3 style={{ fontWeight: 700, color: T.text, fontSize: "0.9rem" }}>Challenge Ideas</h3>
                  </div>
                  <p style={{ color: T.text3, fontSize: "0.78rem", marginBottom: 14 }}>Click to use as a template</p>
                  {["Complete 3 lessons this week", "Get your net worth above $10,000", "Buy your first stock and hold it for 7 days", "Set up a KiwiSaver goal and reach 50% progress", "Earn 500 XP this week", "Try every game in the casino and reflect on what you learned", "Get a 5-day lesson streak", "Invest in 3 different sectors"].map(idea => (
                    <button key={idea} onClick={() => setChallengeText(idea)} style={{ width: "100%", textAlign: "left", background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 12px", marginBottom: 6, color: T.text2, fontSize: "0.78rem", cursor: "pointer", fontFamily: FONT, transition: "all .12s" }}>
                      {idea}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TOOLS */}
            {tab === "tools" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Subscription */}
                <div style={{ background: activeSub ? "linear-gradient(135deg,#0a2010,#0f2818)" : T.card, border: `1.5px solid ${activeSub ? "rgba(118,173,37,.3)" : T.border}`, borderRadius: 14, padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Shield size={16} color={activeSub ? "#76AD25" : "#f59e0b"} />
                      <h3 style={{ fontWeight: 700, color: T.text, fontSize: "0.9rem" }}>Class Subscription</h3>
                    </div>
                    {activeSub ? (
                      <span style={{ background: "rgba(118,173,37,.15)", color: "#76AD25", padding: "3px 10px", borderRadius: 99, fontSize: "0.68rem", fontWeight: 800 }}>Active</span>
                    ) : (
                      <span style={{ background: "rgba(245,158,11,.12)", color: "#f59e0b", padding: "3px 10px", borderRadius: 99, fontSize: "0.68rem", fontWeight: 800 }}>Not Activated</span>
                    )}
                  </div>
                  {activeSub ? (
                    <div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                        {[
                          { label: "Plan",     val: activeSub.plan ?? "Monthly" },
                          { label: "Expires",  val: new Date(activeSub.expiresAt).toLocaleDateString("en-NZ") },
                          { label: "Students", val: `${classEnrolls.length} / ${activeSub.studentLimit ?? 35}` },
                          { label: "Days left", val: `${Math.ceil((activeSub.expiresAt - Date.now()) / 86400000)}d` },
                        ].map(s => (
                          <div key={s.label} style={{ background: "rgba(118,173,37,.08)", borderRadius: 8, padding: "8px 12px" }}>
                            <div style={{ fontSize: "0.6rem", color: T.text3, textTransform: "uppercase" as const }}>{s.label}</div>
                            <div style={{ fontWeight: 700, color: T.text, fontSize: "0.82rem" }}>{s.val}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 14 }}>
                        <div style={{ fontSize: "0.72rem", color: T.text3, marginBottom: 6 }}>Renew with a new plan code:</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <input value={planCodeInput} onChange={e => setPlanCodeInput(e.target.value.toUpperCase())} placeholder="Enter new code" className="pw-input" style={{ flex: 1, fontSize: "0.875rem" }} />
                          <button onClick={activateSubscription} disabled={!planCodeInput || subLoading} className={planCodeInput && !subLoading ? "btn-3d-green" : ""} style={{ padding: "0 18px", background: !planCodeInput ? T.bg3 : undefined, color: !planCodeInput ? T.text3 : undefined, border: "none", borderRadius: 10, fontWeight: 700, fontSize: "0.82rem", cursor: !planCodeInput ? "not-allowed" : "pointer", fontFamily: FONT }}>
                            Renew
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p style={{ color: T.text3, fontSize: "0.78rem", marginBottom: 14, lineHeight: 1.5 }}>
                        Enter your plan code to activate PocketWise for this class. Students will not be able to access the platform until the subscription is active.
                      </p>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <input value={planCodeInput} onChange={e => { setPlanCodeInput(e.target.value.toUpperCase()); setSubError(""); }} placeholder="XXXX-XXXX" className="pw-input" style={{ flex: 1, fontSize: "1rem", letterSpacing: ".1em", fontWeight: 800 }} onKeyDown={e => { if (e.key === "Enter") activateSubscription(); }} />
                        <button onClick={activateSubscription} disabled={!planCodeInput || subLoading} className={planCodeInput && !subLoading ? "btn-3d-green" : ""} style={{ padding: "0 20px", background: !planCodeInput ? T.bg3 : undefined, color: !planCodeInput ? T.text3 : undefined, border: "none", borderRadius: 10, fontWeight: 700, fontSize: "0.875rem", cursor: !planCodeInput ? "not-allowed" : "pointer", fontFamily: FONT }}>
                          {subLoading ? "Activating..." : "Activate"}
                        </button>
                      </div>
                      {subError && <div style={{ fontSize: "0.78rem", color: "#EF4444", display: "flex", alignItems: "center", gap: 5 }}><AlertCircle size={12} />{subError}</div>}
                      {subSuccess && <div style={{ fontSize: "0.78rem", color: "#76AD25", display: "flex", alignItems: "center", gap: 5 }}><Check size={12} />{subSuccess}</div>}
                      <div style={{ marginTop: 12, background: T.bg3, borderRadius: 8, padding: "10px 12px", fontSize: "0.75rem", color: T.text3 }}>
                        Contact <span style={{ color: "#76AD25" }}>ronanccorbett@gmail.com</span> to get a plan code.
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {/* XP Boost */}
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <Zap size={16} color="#f59e0b" fill="#f59e0b" />
                      <h3 style={{ fontWeight: 700, color: T.text, fontSize: "0.9rem" }}>Boost Student XP</h3>
                    </div>
                    <p style={{ color: T.text3, fontSize: "0.78rem", marginBottom: 14 }}>Manually award XP to a student for participation or great work.</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <select value={boostEmail} onChange={e => setBoostEmail(e.target.value)} style={{ width: "100%", padding: "10px 12px", background: T.input, border: `1.5px solid ${T.border}`, borderRadius: 10, color: boostEmail ? T.text : T.text3, fontFamily: FONT, fontSize: "0.875rem", outline: "none" }}>
                        <option value="" style={{ background: T.bg }}>Select student...</option>
                        {studentStates.map((s: any) => <option key={s.id} value={s.email} style={{ background: T.bg }}>{s.email?.split("@")[0]} ({s.email})</option>)}
                      </select>
                      <input type="number" value={boostAmount} onChange={e => setBoostAmount(parseInt(e.target.value))} min={1} max={5000} className="pw-input" style={{ width: "100%", fontSize: "0.875rem" }} />
                      <button onClick={boostStudentXP} disabled={!boostEmail} className={boostEmail ? "btn-3d-amber" : ""} style={{ padding: "11px", fontSize: "0.875rem", background: !boostEmail ? T.bg3 : undefined, color: !boostEmail ? T.text3 : undefined, border: "none", borderRadius: 10, fontWeight: 700, cursor: !boostEmail ? "not-allowed" : "pointer", fontFamily: FONT }}>
                        Award XP
                      </button>
                    </div>
                  </div>

                  {/* XP Multiplier */}
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <Star size={16} color="#a78bfa" fill="#a78bfa" />
                      <h3 style={{ fontWeight: 700, color: T.text, fontSize: "0.9rem" }}>Class XP Multiplier</h3>
                    </div>
                    <p style={{ color: T.text3, fontSize: "0.78rem", marginBottom: 14 }}>Boost XP rewards for everyone in this class.</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
                      {[1.0, 1.5, 2.0, 3.0].map(m => (
                        <button key={m} onClick={() => setXPMultiplier(m)} style={{
                          padding: "10px 6px", borderRadius: 10, textAlign: "center" as const,
                          background: activeClass.xpMultiplier === m ? "rgba(167,139,250,.2)" : T.bg3,
                          border: `1.5px solid ${activeClass.xpMultiplier === m ? "rgba(167,139,250,.5)" : T.border}`,
                          cursor: "pointer", fontFamily: FONT, transition: "all .15s",
                        }}>
                          <div style={{ fontWeight: 900, color: activeClass.xpMultiplier === m ? "#a78bfa" : T.text, fontSize: "1rem" }}>{m}x</div>
                          <div style={{ fontSize: "0.6rem", color: T.text3 }}>{m === 1 ? "Normal" : m === 1.5 ? "Boost" : m === 2 ? "Double" : "Triple"}</div>
                        </button>
                      ))}
                    </div>
                    <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", fontSize: "0.75rem", color: T.text3 }}>
                      Currently: <strong style={{ color: "#a78bfa" }}>{activeClass.xpMultiplier ?? 1}x multiplier</strong>
                    </div>
                  </div>

                  {/* Join code share */}
                  <div style={{ background: "linear-gradient(135deg,#0a2010,#0f2818)", border: "1px solid rgba(118,173,37,.2)", borderRadius: 14, padding: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <Users size={16} color="#76AD25" />
                      <h3 style={{ fontWeight: 700, color: T.text, fontSize: "0.9rem" }}>Student Join Code</h3>
                    </div>
                    <p style={{ color: T.text3, fontSize: "0.78rem", marginBottom: 16 }}>Share this code with students to join this class.</p>
                    <div style={{ textAlign: "center", background: "rgba(118,173,37,.1)", border: "2px solid rgba(118,173,37,.3)", borderRadius: 12, padding: "20px" }}>
                      <div style={{ fontWeight: 900, fontSize: "2.5rem", color: "#76AD25", letterSpacing: ".3em", fontFamily: "monospace" }}>{activeClass.joinCode}</div>
                      <button onClick={copyCode} className="btn-3d-green" style={{ marginTop: 14, padding: "9px 24px", fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Code</>}
                      </button>
                    </div>
                  </div>

                  {/* Class settings */}
                  <div style={{ background: T.card, border: "1px solid rgba(239,68,68,.2)", borderRadius: 14, padding: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <AlertCircle size={16} color="#EF4444" />
                      <h3 style={{ fontWeight: 700, color: "#EF4444", fontSize: "0.9rem" }}>Class Settings</h3>
                    </div>
                    <p style={{ color: T.text3, fontSize: "0.78rem", marginBottom: 14 }}>Manage class status.</p>
                    <button onClick={async () => {
                      await db.transact((db as any).tx.classrooms[activeClass.id].update({ isActive: !activeClass.isActive }));
                    }} className={activeClass.isActive ? "btn-3d-red" : "btn-3d-green"} style={{ padding: "9px 18px", fontSize: "0.8rem" }}>
                      {activeClass.isActive ? "Archive Class" : "Reactivate Class"}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </AuthGuard>
  );
}
