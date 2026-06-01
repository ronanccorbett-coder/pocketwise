"use client";
import { useState } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { useGame, XP_GATES } from "@/lib/gameContext";
import { Briefcase, Zap, Trophy, ChevronLeft, Check } from "lucide-react";
import Link from "next/link";

const CAREERS = [
  { id:"barista",       title:"Barista",               company:"Mojo Coffee",      salary:320,  xpReq:XP_GATES.jobEntry,    level:"Entry",    category:"Hospitality", hours:15 },
  { id:"cashier",       title:"Supermarket Cashier",   company:"Pak'nSave",        salary:420,  xpReq:XP_GATES.jobEntry,    level:"Entry",    category:"Retail",      hours:20 },
  { id:"retail",        title:"Retail Assistant",      company:"The Warehouse",    salary:380,  xpReq:XP_GATES.jobEntry,    level:"Entry",    category:"Retail",      hours:18 },
  { id:"teacher-aide",  title:"Teacher Aide",          company:"Auckland Schools", salary:520,  xpReq:XP_GATES.jobEntry,    level:"Entry",    category:"Education",   hours:25 },
  { id:"admin",         title:"Administration Officer",company:"IRD",              salary:680,  xpReq:XP_GATES.jobJunior,   level:"Junior",   category:"Government",  hours:35 },
  { id:"marketing",     title:"Marketing Coordinator", company:"Tourism NZ",       salary:1050, xpReq:XP_GATES.jobGraduate, level:"Graduate", category:"Marketing",   hours:40 },
  { id:"accounts",      title:"Accounts Assistant",    company:"Deloitte NZ",      salary:1100, xpReq:XP_GATES.jobGraduate, level:"Graduate", category:"Finance",     hours:40 },
  { id:"developer",     title:"Junior Developer",      company:"Xero",             salary:1400, xpReq:XP_GATES.jobGraduate, level:"Graduate", category:"Technology",  hours:40 },
  { id:"engineer",      title:"Software Engineer",     company:"Spark NZ",         salary:1800, xpReq:XP_GATES.jobSenior,   level:"Senior",   category:"Technology",  hours:40 },
  { id:"analyst",       title:"Financial Analyst",     company:"ANZ Bank",         salary:1650, xpReq:XP_GATES.jobSenior,   level:"Senior",   category:"Finance",     hours:40 },
];

const LEVEL_COLORS: Record<string, string> = {
  Entry: "#76AD25", Junior: "#3B82F6", Graduate: "#f59e0b", Senior: "#EF4444",
};

export default function JobsPage() {
  const { state, applyForJob, canAccess } = useGame();
  const [notif, setNotif] = useState<string | null>(null);
  const xp = state?.xp ?? 0;
  const currentJobId = state?.currentJobId?.split(":")?.[0] ?? null;

  function notify(m: string) { setNotif(m); setTimeout(() => setNotif(null), 3000); }

  function handleApply(job: typeof CAREERS[0]) {
    if (job.xpReq > xp) return;
    applyForJob(job.id, job.salary);
    notify(`You are now working as ${job.title} at ${job.company}. Salary: $${job.salary}/wk`);
  }

  const currentJob = CAREERS.find(j => j.id === currentJobId);

  return (
    <AuthGuard>
      <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>
        <Nav />
        {notif && (
          <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 100, background: "#0d1526", color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: "0.85rem", fontWeight: 600, border: "1px solid #76AD25", boxShadow: "0 4px 20px rgba(0,0,0,.3)", maxWidth: 320 }}>
            {notif}
          </div>
        )}

        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg,#0d1526,#111c30)", padding: "28px 2rem" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <Link href="/portfolio" style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#8b9dc3", fontSize: "0.82rem", textDecoration: "none", marginBottom: 14 }}>
              <ChevronLeft size={14} /> Portfolio
            </Link>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <Briefcase size={22} color="#3B82F6" />
                  <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff" }}>Career Centre</h1>
                </div>
                <p style={{ color: "#8b9dc3", fontSize: "0.875rem" }}>Apply for jobs and earn a weekly salary to grow your portfolio.</p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ background: "rgba(255,255,255,.08)", borderRadius: 12, padding: "12px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: "0.68rem", color: "#8b9dc3", marginBottom: 2 }}>Balance</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#76AD25" }}>${(state?.balance ?? 5000).toFixed(0)}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,.08)", borderRadius: 12, padding: "12px 18px", textAlign: "center" }}>
                  <div style={{ fontSize: "0.68rem", color: "#8b9dc3", marginBottom: 2 }}>Your XP</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                    <Zap size={14} color="#f59e0b" />
                    <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#f59e0b" }}>{xp.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 1.5rem" }}>

          {/* Current job */}
          {currentJob && (
            <div style={{ background: "#0d1526", border: "1px solid #76AD25", borderRadius: 14, padding: "18px 22px", marginBottom: 22, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: "0.72rem", color: "#8b9dc3", marginBottom: 3 }}>Current Job</div>
                <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>{currentJob.title} at {currentJob.company}</div>
                <div style={{ fontSize: "0.78rem", color: "#76AD25", marginTop: 2 }}>+${currentJob.salary}/wk · paid every 7 minutes of play</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Trophy size={15} color="#f59e0b" />
                <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: "0.875rem" }}>Employed</span>
              </div>
            </div>
          )}

          {/* XP level banner */}
          <div style={{ background: "#0d1526", borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: "0.72rem", color: "#8b9dc3", marginBottom: 3 }}>Your XP Level</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Zap size={18} color="#f59e0b" />
                <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff" }}>{xp.toLocaleString()} XP</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "Entry", req: 0 },
                { label: "Junior", req: XP_GATES.jobJunior },
                { label: "Graduate", req: XP_GATES.jobGraduate },
                { label: "Senior", req: XP_GATES.jobSenior },
              ].map(tier => (
                <div key={tier.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.68rem", color: xp >= tier.req ? LEVEL_COLORS[tier.label] : "#2a3a5c", fontWeight: 700, marginBottom: 2 }}>{tier.label}</div>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: xp >= tier.req ? LEVEL_COLORS[tier.label] : "#2a3a5c", margin: "0 auto" }} />
                </div>
              ))}
            </div>
          </div>

          {/* Job cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {CAREERS.map(job => {
              const locked = job.xpReq > xp;
              const isCurrent = job.id === currentJobId;
              const levelColor = LEVEL_COLORS[job.level];
              return (
                <div key={job.id} style={{
                  background: isCurrent ? "#f0fdf4" : "#fff",
                  border: `1px solid ${isCurrent ? "#76AD25" : locked ? "#f1f5f9" : "#e2e8f0"}`,
                  borderRadius: 12, padding: "16px 20px",
                  display: "flex", alignItems: "center", gap: 14,
                  opacity: locked ? 0.65 : 1, flexWrap: "wrap",
                }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: locked ? "#f1f5f9" : `${levelColor}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Briefcase size={17} color={locked ? "#94a3b8" : levelColor} />
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0d1526" }}>{job.title}</div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 2 }}>{job.company} · {job.hours}hrs/wk</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                      <span style={{ background: "#e8f5d0", color: "#5d8a1c", padding: "2px 8px", borderRadius: 99, fontSize: "0.7rem", fontWeight: 600 }}>
                        ${job.salary}/wk
                      </span>
                      <span style={{ background: "#eff6ff", color: "#1e40af", padding: "2px 8px", borderRadius: 99, fontSize: "0.7rem", fontWeight: 600 }}>
                        {job.category}
                      </span>
                      <span style={{ background: `${levelColor}15`, color: levelColor, padding: "2px 8px", borderRadius: 99, fontSize: "0.7rem", fontWeight: 700 }}>
                        {job.level}
                      </span>
                      {job.xpReq > 0 && (
                        <span style={{ background: locked ? "#fef2f2" : "#f0fdf4", color: locked ? "#EF4444" : "#76AD25", padding: "2px 8px", borderRadius: 99, fontSize: "0.7rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                          {locked ? "" : <Check size={10} />}
                          {job.xpReq} XP {locked ? "required" : "met"}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    disabled={locked || isCurrent}
                    onClick={() => handleApply(job)}
                    style={{
                      padding: "8px 20px", borderRadius: 9999,
                      background: isCurrent ? "#76AD25" : locked ? "#f1f5f9" : "#0d1526",
                      color: isCurrent ? "#fff" : locked ? "#94a3b8" : "#fff",
                      border: "none", fontWeight: 600, fontSize: "0.8rem",
                      cursor: locked || isCurrent ? "not-allowed" : "pointer",
                      flexShrink: 0, fontFamily: "Inter, sans-serif",
                    }}>
                    {isCurrent ? "Current Job" : locked ? `Need ${job.xpReq} XP` : "Apply"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
