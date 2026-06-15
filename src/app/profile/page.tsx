"use client";
import { useState } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { useTheme } from "@/lib/theme";
import { useGame } from "@/lib/gameContext";
import { db } from "@/lib/db";
import { id } from "@instantdb/react";
import { Zap, DollarSign, Flame, BookOpen, Trophy, TrendingUp, Award, Target, Briefcase, Calendar, GraduationCap, Clock, Send } from "lucide-react";

const BADGE_META: Record<string, { label: string; desc: string; color: string; bg: string }> = {
  onboarded:      { label: "Welcome",        desc: "Completed onboarding",              color: "#76AD25", bg: "#e8f5d0" },
  first_hundred:  { label: "Century",         desc: "Earned 100 XP",                    color: "#f59e0b", bg: "#fffbeb" },
  five_hundred:   { label: "High Five",       desc: "Earned 500 XP",                    color: "#f59e0b", bg: "#fffbeb" },
  one_thousand:   { label: "Four Digits",     desc: "Earned 1,000 XP",                  color: "#f59e0b", bg: "#fffbeb" },
  five_thousand:  { label: "Legend",          desc: "Earned 5,000 XP",                  color: "#EF4444", bg: "#fef2f2" },
  week_streak:    { label: "Week Warrior",    desc: "7 day learning streak",            color: "#3B82F6", bg: "#eff6ff" },
  month_streak:   { label: "Monthly Grind",   desc: "30 day learning streak",           color: "#3B82F6", bg: "#eff6ff" },
  ten_lessons:    { label: "Getting Started", desc: "Completed 10 lessons",             color: "#76AD25", bg: "#e8f5d0" },
  twenty_five:    { label: "Quarter Way",     desc: "Completed 25 lessons",             color: "#76AD25", bg: "#e8f5d0" },
  fifty_lessons:  { label: "Half Century",    desc: "Completed 50 lessons",             color: "#a78bfa", bg: "#faf5ff" },
};

const XP_UNLOCKS = [
  { xp: 0,    label: "Curriculum",    done: true },
  { xp: 100,  label: "Buy Stocks",   done: false },
  { xp: 150,  label: "Assets",       done: false },
  { xp: 300,  label: "Loans",        done: false },
  { xp: 500,  label: "Day Trading",  done: false },
  { xp: 800,  label: "Property",     done: false },
  { xp: 1500, label: "Senior Jobs",  done: false },
];

const CAREERS: Record<string, string> = {
  barista:      "Barista — Mojo Coffee",
  cashier:      "Supermarket Cashier — Pak'nSave",
  retail:       "Retail Assistant — The Warehouse",
  "teacher-aide": "Teacher Aide — Auckland Schools",
  admin:        "Administration Officer — IRD",
  marketing:    "Marketing Coordinator — Tourism NZ",
  accounts:     "Accounts Assistant — Deloitte NZ",
  developer:    "Junior Developer — Xero",
  engineer:     "Software Engineer — Spark NZ",
  analyst:      "Financial Analyst — ANZ Bank",
};

export default function ProfilePage() {
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
    inputBorder: isDark ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.14)",
    shadow:  isDark ? "rgba(0,0,0,.4)" : "rgba(0,0,0,.08)",
    green:   isDark ? "#76AD25" : "#5a9a1a",
    accent:  isDark ? "#f59e0b" : "#d97706",
    strip:   isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.02)",
  };

  const { state, stocks, properties, loans, assets, user } = useGame();
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [school,   setSchool]   = useState("");
  const [message,  setMessage]  = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  const { data: reqData } = db.useQuery(
    user ? { teacherRequests: { $: { where: { userId: user.id } } } } : null
  );
  const myRequest = (reqData?.teacherRequests ?? [])[0] as any;

  const isTeacher  = (state as any)?.role === "teacher";
  const isApproved = (state as any)?.teacherApproved === true;
  const isPending  = myRequest?.status === "pending";

  async function submitTeacherRequest() {
    if (!user || !school.trim()) return;
    setSubmitting(true);
    await db.transact([
      (db as any).tx.teacherRequests[id()].update({
        userId: user.id, email: user.email ?? "",
        fullName: user.email?.split("@")[0] ?? "",
        school: school.trim(), message: message.trim(),
        status: "pending", createdAt: Date.now(),
      }),
      (db as any).tx.userState[(state as any).id].update({ role: "teacher", teacherApproved: false }),
    ]);
    setSubmitting(false);
    setSubmitted(true);
    setShowTeacherForm(false);
  }

  if (!state) return (
    <AuthGuard>
      <div style={{ minHeight: "100vh", background: T.bg }}>
        <Nav />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
          <p style={{ color: T.text3 }}>Loading profile...</p>
        </div>
      </div>
    </AuthGuard>
  );

  const xp = state.xp ?? 0;
  const balance = state.balance ?? 5000;
  const streak = state.streak ?? 0;
  const badges = (state.badges as string[]) ?? [];
  const completedLessons = (state.completedLessons as string[]) ?? [];
  const netWorth = state.netWorth ?? 5000;
  const currentJobId = state.currentJobId?.split(":")?.[0] ?? null;
  const currentJobLabel = currentJobId ? CAREERS[currentJobId] ?? currentJobId : null;
  const currentJobSalary = state.currentJobId ? parseInt(state.currentJobId.split(":")[1] || "0") : 0;

  // XP progress to next unlock
  const unlocksWithStatus = XP_UNLOCKS.map(u => ({ ...u, done: xp >= u.xp }));
  const nextUnlock = unlocksWithStatus.find(u => !u.done);
  const prevUnlock = [...unlocksWithStatus].reverse().find(u => u.done);
  const xpProgress = nextUnlock
    ? Math.min(100, ((xp - (prevUnlock?.xp ?? 0)) / (nextUnlock.xp - (prevUnlock?.xp ?? 0))) * 100)
    : 100;

  // Days since joined
  const joinedDaysAgo = state.lastActivityDate
    ? Math.floor((Date.now() - state.lastActivityDate) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <AuthGuard>
      <div style={{ minHeight: "100vh", background: T.bg }}>
        <Nav />

        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg, #0d1526 0%, #111c30 100%)", padding: "32px 2rem" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>

              {/* Avatar */}
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "#76AD25", display: "flex", alignItems: "center",
                justifyContent: "center", fontWeight: 800, fontSize: "1.5rem",
                color: T.text, flexShrink: 0, border: "3px solid rgba(255,255,255,.2)",
              }}>
                {user?.email?.[0]?.toUpperCase() ?? "S"}
              </div>

              <div style={{ flex: 1 }}>
                <h1 style={{ fontWeight: 800, fontSize: "1.4rem", color: T.text, marginBottom: 4 }}>
                  {user?.email?.split("@")[0] ?? "Student"}
                </h1>
                <p style={{ color: T.text2, fontSize: "0.825rem", marginBottom: 14 }}>
                  {user?.email}
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {currentJobLabel && (
                    <span style={{ background: "rgba(59,130,246,.2)", color: "#93c5fd", padding: "3px 10px", borderRadius: 99, fontSize: "0.72rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                      <Briefcase size={11} /> {currentJobLabel.split("—")[0].trim()}
                    </span>
                  )}
                  <span style={{ background: "rgba(245,158,11,.2)", color: "#fde68a", padding: "3px 10px", borderRadius: 99, fontSize: "0.72rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                    <Zap size={11} /> {xp.toLocaleString()} XP
                  </span>
                  {streak > 0 && (
                    <span style={{ background: "rgba(239,68,68,.2)", color: "#fca5a5", padding: "3px 10px", borderRadius: 99, fontSize: "0.72rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                      <Flame size={11} /> {streak} day streak
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>

            {/* Left column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Stats grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[
                  { label: "Total XP",        val: xp.toLocaleString(),          Icon: Zap,      color: "#f59e0b", bg: "#fffbeb" },
                  { label: "Balance",          val: `$${balance.toFixed(0)}`,     Icon: DollarSign,color: "#76AD25",bg: "#e8f5d0" },
                  { label: "Net Worth",        val: `$${netWorth.toFixed(0)}`,    Icon: TrendingUp,color: "#3B82F6",bg: "#eff6ff" },
                  { label: "Lessons Done",     val: completedLessons.length,      Icon: BookOpen,  color: "#76AD25",bg: "#e8f5d0" },
                  { label: "Day Streak",       val: streak,                       Icon: Flame,     color: "#EF4444",bg: "#fef2f2" },
                  { label: "Badges",           val: badges.length,                Icon: Award,     color: "#a78bfa",bg: "#faf5ff" },
                ].map(s => (
                  <div key={s.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                      <s.Icon size={15} color={s.color} />
                    </div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: T.text }}>{s.val}</div>
                    <div style={{ fontSize: "0.7rem", color: T.text3, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* XP progress */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px" }}>
                <h3 style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                  <Target size={15} color="#76AD25" /> XP Progress
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {unlocksWithStatus.map((u, i) => (
                    <div key={u.xp} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                        background: u.done ? "#76AD25" : "#e2e8f0",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {u.done && <Check size={11} color="#fff" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: u.done ? "#0d1526" : "#94a3b8" }}>{u.label}</span>
                          <span style={{ fontSize: "0.7rem", color: T.text3 }}>{u.xp === 0 ? "Free" : `${u.xp} XP`}</span>
                        </div>
                        {!u.done && nextUnlock?.xp === u.xp && (
                          <div style={{ background: T.bg, borderRadius: 99, height: 4, overflow: "hidden" }}>
                            <div style={{ background: "#76AD25", height: 4, borderRadius: 99, width: `${xpProgress}%`, transition: "width .4s" }} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px" }}>
                <h3 style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                  <Trophy size={15} color="#f59e0b" /> Badges ({badges.length})
                </h3>
                {badges.length === 0 ? (
                  <p style={{ color: T.text3, fontSize: "0.825rem" }}>No badges yet. Complete lessons to earn your first badge.</p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                    {badges.map(badge => {
                      const meta = BADGE_META[badge] ?? { label: badge, desc: "", color: "#6b7280", bg: "#f1f5f9" };
                      return (
                        <div key={badge} style={{ background: meta.bg, border: `1px solid ${meta.color}30`, borderRadius: 10, padding: "12px", textAlign: "center" }}>
                          <Award size={22} color={meta.color} style={{ margin: "0 auto 6px", display: "block" }} />
                          <div style={{ fontWeight: 700, fontSize: "0.78rem", color: T.text }}>{meta.label}</div>
                          <div style={{ fontSize: "0.68rem", color: T.text2, marginTop: 2 }}>{meta.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Locked badges */}
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: "0.72rem", color: T.text3, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".04em" }}>
                    Locked
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {Object.entries(BADGE_META).filter(([key]) => !badges.includes(key)).map(([key, meta]) => (
                      <div key={key} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 10px", opacity: 0.6 }}>
                        <div style={{ fontSize: "0.72rem", color: T.text2, fontWeight: 600 }}>{meta.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Current job */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px" }}>
                <h3 style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <Briefcase size={14} color="#3B82F6" /> Career
                </h3>
                {currentJobLabel ? (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.875rem", color: T.text, marginBottom: 2 }}>
                      {currentJobLabel.split("—")[0].trim()}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: T.text2, marginBottom: 8 }}>
                      {currentJobLabel.split("—")[1]?.trim()}
                    </div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: isDark ? "rgba(118,173,37,.12)" : "rgba(90,154,26,.08)", padding: "4px 10px", borderRadius: 99 }}>
                      <DollarSign size={12} color="#76AD25" />
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#5d8a1c" }}>${currentJobSalary}/day</span>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: T.text3, fontSize: "0.825rem" }}>No job yet. Visit the Career Centre to apply.</p>
                )}
              </div>

              {/* Portfolio summary */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px" }}>
                <h3 style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <TrendingUp size={14} color="#76AD25" /> Portfolio
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                    <span style={{ color: T.text2 }}>Cash</span>
                    <span style={{ fontWeight: 700, color: "#76AD25" }}>${balance.toFixed(0)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                    <span style={{ color: T.text2 }}>Stocks ({stocks.length})</span>
                    <span style={{ fontWeight: 700, color: "#3B82F6" }}>
                      ${stocks.reduce((s, st) => s + (st.currentValue ?? 0) * (st.quantity ?? 0), 0).toFixed(0)}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                    <span style={{ color: T.text2 }}>Property ({properties.length})</span>
                    <span style={{ fontWeight: 700, color: "#a78bfa" }}>
                      ${properties.reduce((s, p) => s + (p.currentValue ?? 0), 0).toFixed(0)}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                    <span style={{ color: T.text2 }}>Assets ({assets.length})</span>
                    <span style={{ fontWeight: 700, color: "#6b7280" }}>
                      ${assets.reduce((s, a) => s + (a.currentValue ?? 0), 0).toFixed(0)}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                    <span style={{ color: T.text2 }}>Debt ({loans.length} loans)</span>
                    <span style={{ fontWeight: 700, color: "#EF4444" }}>
                      -${loans.reduce((s, l) => s + (l.balance ?? 0), 0).toFixed(0)}
                    </span>
                  </div>
                  <div style={{ height: 1, background: T.bg, margin: "4px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                    <span style={{ fontWeight: 700 }}>Net Worth</span>
                    <span style={{ fontWeight: 800, color: netWorth >= 5000 ? "#76AD25" : "#EF4444" }}>
                      ${netWorth.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Account info */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px" }}>
                <h3 style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <Calendar size={14} color="#94a3b8" /> Account
                </h3>
                <div style={{ fontSize: "0.78rem", color: T.text2, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Email</span>
                    <span style={{ fontWeight: 600, color: T.text }}>{user?.email}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Last active</span>
                    <span style={{ fontWeight: 600, color: T.text }}>
                      {joinedDaysAgo === 0 ? "Today" : `${joinedDaysAgo}d ago`}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Total earned</span>
                    <span style={{ fontWeight: 600, color: "#76AD25" }}>${(state.totalEarned ?? 0).toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Educator Application Card ── */}
          {!isApproved && (
            <div style={{ maxWidth: 860, margin: "0 auto 32px", padding: "0 1.5rem" }}>
              <div style={{
                background: isTeacher && isPending
                  ? "linear-gradient(135deg,#0a1f3a,#0d2848)"
                  : "linear-gradient(135deg,#0d1526,#0f2318)",
                border: `1.5px solid ${isPending ? "rgba(59,130,246,.35)" : "rgba(118,173,37,.25)"}`,
                borderRadius: 16, padding: "20px 24px",
                display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap",
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: isPending ? "rgba(59,130,246,.15)" : "rgba(118,173,37,.15)", border: `1px solid ${isPending ? "rgba(59,130,246,.3)" : "rgba(118,173,37,.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {isPending ? <Clock size={20} color="#60a5fa" /> : <GraduationCap size={20} color="#76AD25" />}
                </div>

                <div style={{ flex: 1, minWidth: 200 }}>
                  {isPending ? (
                    <>
                      <div style={{ fontWeight: 800, color: T.text, fontSize: "0.95rem", marginBottom: 4 }}>
                        Teacher Request Pending
                      </div>
                      <p style={{ color: T.text3, fontSize: "0.8rem", margin: 0, lineHeight: 1.5 }}>
                        Your request to {myRequest?.school ? `teach at ${myRequest.school}` : "become a teacher"} is awaiting admin approval. You will get access to the Class Dashboard once approved.
                      </p>
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight: 800, color: T.text, fontSize: "0.95rem", marginBottom: 4 }}>
                        Are you a teacher?
                      </div>
                      <p style={{ color: T.text3, fontSize: "0.8rem", margin: 0, lineHeight: 1.5 }}>
                        Apply for educator access to get a class dashboard, student analytics, class challenges, XP tools and more.
                      </p>
                    </>
                  )}
                </div>

                {!isPending && !showTeacherForm && !submitted && (
                  <button onClick={() => setShowTeacherForm(true)} className="btn-3d-green" style={{ padding: "9px 20px", fontSize: "0.82rem", flexShrink: 0 }}>
                    Apply for Educator Access
                  </button>
                )}
                {(submitted || (isPending && !showTeacherForm)) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#60a5fa", fontSize: "0.8rem", flexShrink: 0 }}>
                    <Clock size={14} /> Pending review
                  </div>
                )}
              </div>

              {/* Application form */}
              {showTeacherForm && (
                <div style={{ background: T.card, border: "1.5px solid rgba(59,130,246,.2)", borderRadius: 14, padding: "20px 24px", marginTop: 10, animation: "pw-slide-up .3s ease" }}>
                  <h3 style={{ fontWeight: 700, color: T.text, fontSize: "0.9rem", marginBottom: 14 }}>Educator Application</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.7rem", color: T.text2, fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: ".04em" }}>School *</label>
                      <input value={school} onChange={e => setSchool(e.target.value)} placeholder="e.g. Auckland Grammar School" className="pw-input" style={{ width: "100%", fontSize: "0.875rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.7rem", color: T.text2, fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: ".04em" }}>Message to admin (optional)</label>
                      <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Brief note about how you plan to use PocketWise..." rows={2} className="pw-input" style={{ width: "100%", resize: "none", fontSize: "0.875rem" }} />
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <button onClick={submitTeacherRequest} disabled={!school.trim() || submitting} className={school.trim() && !submitting ? "btn-3d-blue" : ""} style={{ flex: 1, padding: "11px", fontSize: "0.875rem", background: !school.trim() ? "#1e3a5f" : undefined, color: !school.trim() ? "#4a6a8a" : undefined, border: "none", borderRadius: 10, fontWeight: 700, cursor: !school.trim() ? "not-allowed" : "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <Send size={13} /> {submitting ? "Submitting..." : "Submit Application"}
                      </button>
                      <button onClick={() => setShowTeacherForm(false)} className="btn-3d-ghost" style={{ padding: "11px 18px", fontSize: "0.875rem" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

function Check({ size, color, style }: { size: number; color: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
