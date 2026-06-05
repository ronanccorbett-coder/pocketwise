"use client";
import { useState } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { useGame, XP_GATES } from "@/lib/gameContext";
import { Briefcase, Zap, Trophy, Lock, Check, Star, TrendingUp } from "lucide-react";

import { Briefcase, Zap, Trophy, Lock, Check, Coffee, ShoppingCart, Store, BookOpen, Building, Megaphone, BarChart2, Code, Cpu, TrendingUp } from "lucide-react";

const FONT = "Inter, system-ui, sans-serif";

const JOB_ICONS: Record<string, any> = {
  barista: Coffee, cashier: ShoppingCart, retail: Store, "teacher-aide": BookOpen,
  admin: Building, marketing: Megaphone, accounts: BarChart2, developer: Code,
  engineer: Cpu, analyst: TrendingUp,
};

const CAREERS = [
  { id:"barista",      title:"Barista",               company:"Mojo Coffee",      salary:320,  xpReq:XP_GATES.jobEntry,    level:"Entry",    category:"Hospitality", hours:15 },
  { id:"cashier",      title:"Supermarket Cashier",   company:"Pak'nSave",        salary:420,  xpReq:XP_GATES.jobEntry,    level:"Entry",    category:"Retail",      hours:20 },
  { id:"retail",       title:"Retail Assistant",      company:"The Warehouse",    salary:380,  xpReq:XP_GATES.jobEntry,    level:"Entry",    category:"Retail",      hours:18 },
  { id:"teacher-aide", title:"Teacher Aide",          company:"Auckland Schools", salary:520,  xpReq:XP_GATES.jobEntry,    level:"Entry",    category:"Education",   hours:25 },
  { id:"admin",        title:"Administration Officer",company:"IRD",              salary:680,  xpReq:XP_GATES.jobJunior,   level:"Junior",   category:"Government",  hours:35 },
  { id:"marketing",    title:"Marketing Coordinator", company:"Tourism NZ",       salary:1050, xpReq:XP_GATES.jobGraduate, level:"Graduate", category:"Marketing",   hours:40 },
  { id:"accounts",     title:"Accounts Assistant",    company:"Deloitte NZ",      salary:1100, xpReq:XP_GATES.jobGraduate, level:"Graduate", category:"Finance",     hours:40 },
  { id:"developer",    title:"Junior Developer",      company:"Xero",             salary:1400, xpReq:XP_GATES.jobGraduate, level:"Graduate", category:"Technology",  hours:40 },
  { id:"engineer",     title:"Software Engineer",     company:"Spark NZ",         salary:1800, xpReq:XP_GATES.jobSenior,   level:"Senior",   category:"Technology",  hours:40 },
  { id:"analyst",      title:"Financial Analyst",     company:"ANZ Bank",         salary:1650, xpReq:XP_GATES.jobSenior,   level:"Senior",   category:"Finance",     hours:40 },
];

const LEVEL_COLORS: Record<string,string> = { Entry:"#76AD25", Junior:"#3B82F6", Graduate:"#f59e0b", Senior:"#EF4444" };
const LEVEL_SHADOWS: Record<string,string> = { Entry:"rgba(118,173,37,.3)", Junior:"rgba(59,130,246,.3)", Graduate:"rgba(245,158,11,.3)", Senior:"rgba(239,68,68,.3)" };

function UnlockBurst({ color }: { color: string }) {
  return (
    <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
      {[...Array(8)].map((_,i) => (
        <div key={i} style={{
          position:"absolute", width:6, height:6, borderRadius:"50%", background:color,
          animation:`pw-star-burst 0.5s ease forwards`,
          animationDelay:`${i*0.04}s`,
          transformOrigin:"center",
          transform:`rotate(${i*45}deg) translateX(30px)`,
        }} />
      ))}
    </div>
  );
}

export default function JobsPage() {
  const { state, applyForJob } = useGame();
  const [justApplied, setJustApplied] = useState<string|null>(null);
  const [hoveredId, setHoveredId] = useState<string|null>(null);
  const xp = state?.xp ?? 0;
  const currentJobId = state?.currentJobId?.split(":")?.[0] ?? null;
  const currentJob = CAREERS.find(j => j.id === currentJobId);

  function handleApply(job: typeof CAREERS[0]) {
    if (job.xpReq > xp) return;
    applyForJob(job.id, job.salary);
    setJustApplied(job.id);
    window.dispatchEvent(new CustomEvent("pw:salary", { detail: { amount: job.salary } }));
    setTimeout(() => setJustApplied(null), 2000);
  }

  return (
    <AuthGuard>
      <div style={{ minHeight:"100vh", background:"#f0f4f8", fontFamily:FONT }}>
        <Nav />

        {/* Hero */}
        <div style={{ background:"linear-gradient(135deg,#0d1526 0%,#0f2318 60%,#0d1526 100%)", padding:"28px 2rem", position:"relative", overflow:"hidden" }}>
          {/* Animated background grid dots */}
          {[...Array(16)].map((_,i) => (
            <div key={i} style={{ position:"absolute", left:`${(i*23+5)%100}%`, top:`${(i*31+10)%100}%`, width:2, height:2, borderRadius:"50%", background:"#76AD25", opacity:0.25, animation:`pw-float ${2.5+i%3}s ease-in-out infinite`, animationDelay:`${i*0.2}s` }} />
          ))}
          <div style={{ maxWidth:960, margin:"0 auto", position:"relative" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
              <Briefcase size={24} color="#3B82F6" />
              <h1 style={{ fontSize:"1.5rem", fontWeight:900, color:"#fff" }}>Career Centre</h1>
            </div>
            <p style={{ color:"#8b9dc3", fontSize:"0.875rem", marginBottom:20 }}>Earn a real weekly salary. More XP unlocks better jobs.</p>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              <div style={{ background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.1)", borderRadius:12, padding:"12px 20px", display:"flex", alignItems:"center", gap:8 }}>
                <Zap size={16} color="#f59e0b" fill="#f59e0b" />
                <div>
                  <div style={{ fontSize:"0.65rem", color:"#8b9dc3" }}>YOUR XP</div>
                  <div style={{ fontWeight:900, color:"#f59e0b", fontSize:"1.1rem" }}>{xp.toLocaleString()}</div>
                </div>
              </div>
              {currentJob && (
                <div style={{ background:"rgba(118,173,37,.15)", border:"1px solid rgba(118,173,37,.3)", borderRadius:12, padding:"12px 20px", display:"flex", alignItems:"center", gap:8, animation:"pw-slide-in-r .4s ease" }}>
                  <Trophy size={16} color="#76AD25" />
                  <div>
                    <div style={{ fontSize:"0.65rem", color:"#76AD25" }}>CURRENT JOB</div>
                    <div style={{ fontWeight:700, color:"#fff", fontSize:"0.875rem" }}>{currentJob.title} · ${currentJob.salary}/wk</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* XP tier tracker */}
        <div style={{ background:"#fff", borderBottom:"1px solid #f1f5f9", padding:"14px 2rem" }}>
          <div style={{ maxWidth:960, margin:"0 auto", display:"flex", alignItems:"center", gap:0 }}>
            {[
              { label:"Entry",    req:0,                     desc:"Any student" },
              { label:"Junior",   req:XP_GATES.jobJunior,    desc:`${XP_GATES.jobJunior} XP` },
              { label:"Graduate", req:XP_GATES.jobGraduate,  desc:`${XP_GATES.jobGraduate} XP` },
              { label:"Senior",   req:XP_GATES.jobSenior,    desc:`${XP_GATES.jobSenior} XP` },
            ].map((tier, i, arr) => {
              const unlocked = xp >= tier.req;
              const color = LEVEL_COLORS[tier.label];
              return (
                <div key={tier.label} style={{ flex:1, display:"flex", alignItems:"center" }}>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                    <div style={{
                      width:36, height:36, borderRadius:"50%",
                      background:unlocked ? color : "#f1f5f9",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      boxShadow:unlocked ? `0 0 14px ${LEVEL_SHADOWS[tier.label]}` : "none",
                      transition:"all .4s cubic-bezier(.34,1.56,.64,1)",
                      animation:unlocked ? "pw-pop .5s cubic-bezier(.34,1.56,.64,1)" : "none",
                    }}>
                      {unlocked ? <Check size={15} color="#fff" /> : <Lock size={13} color="#94a3b8" />}
                    </div>
                    <div style={{ fontSize:"0.65rem", fontWeight:700, color:unlocked ? color : "#94a3b8", whiteSpace:"nowrap" }}>{tier.label}</div>
                    <div style={{ fontSize:"0.6rem", color:"#94a3b8" }}>{tier.desc}</div>
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ flex:1, height:3, background:unlocked ? color : "#f1f5f9", borderRadius:99, transition:"background .4s ease", margin:"0 4px", marginBottom:24 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Job cards */}
        <div style={{ maxWidth:960, margin:"0 auto", padding:"24px 1.5rem 60px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
            {CAREERS.map(job => {
              const locked = job.xpReq > xp;
              const isCurrent = job.id === currentJobId;
              const justDone = justApplied === job.id;
              const isHovered = hoveredId === job.id;
              const color = LEVEL_COLORS[job.level];

              return (
                <div
                  key={job.id}
                  onMouseEnter={() => !locked && setHoveredId(job.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    background:"#fff",
                    border:`2px solid ${isCurrent ? color : locked ? "#f1f5f9" : isHovered ? color : "#e2e8f0"}`,
                    borderRadius:16,
                    padding:"18px 18px 16px",
                    position:"relative",
                    overflow:"hidden",
                    transition:"all .2s cubic-bezier(.34,1.56,.64,1)",
                    transform:locked ? "none" : isHovered ? "translateY(-4px) scale(1.01)" : "translateY(0) scale(1)",
                    boxShadow:locked ? "none" : isHovered ? `0 12px 32px ${LEVEL_SHADOWS[job.level]}` : isCurrent ? `0 4px 16px ${LEVEL_SHADOWS[job.level]}` : "0 2px 8px rgba(0,0,0,.06)",
                    animation: justDone ? "pw-unlock 0.6s cubic-bezier(.34,1.56,.64,1)" : "none",
                    opacity:locked ? 0.6 : 1,
                  }}>

                  {/* Colour strip */}
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:4, background:locked ? "#f1f5f9" : `linear-gradient(90deg,${color},${color}88)`, transition:"all .3s" }} />

                  {/* Lock overlay */}
                  {locked && (
                    <div style={{ position:"absolute", top:12, right:12, background:"#f1f5f9", borderRadius:"50%", width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Lock size={13} color="#94a3b8" />
                    </div>
                  )}
                  {isCurrent && (
                    <div style={{ position:"absolute", top:10, right:10, background:color, color:"#fff", padding:"2px 10px", borderRadius:99, fontSize:"0.62rem", fontWeight:800, textTransform:"uppercase", letterSpacing:".04em", animation:"pw-pop .4s ease" }}>
                      Hired
                    </div>
                  )}

                  {/* Job icon */}
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12, marginTop:8 }}>
                    <div style={{
                      width:48, height:48, borderRadius:12,
                      background:locked ? "#f8fafc" : `${color}15`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      boxShadow:!locked && isHovered ? `0 0 16px ${LEVEL_SHADOWS[job.level]}` : "none",
                      transition:"all .2s",
                      transform:isHovered && !locked ? "scale(1.1) rotate(-5deg)" : "scale(1) rotate(0)",
                    }}>
                      {(() => { const I = JOB_ICONS[job.id] ?? Briefcase; return <I size={22} color={locked ? "#94a3b8" : color} />; })()}
                    </div>
                    <div>
                      <div style={{ fontWeight:800, fontSize:"0.925rem", color:locked?"#94a3b8":"#0d1526", lineHeight:1.2 }}>{job.title}</div>
                      <div style={{ fontSize:"0.75rem", color:"#64748b", marginTop:2 }}>{job.company}</div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:14 }}>
                    <span style={{ background:`${color}15`, color:color, padding:"3px 10px", borderRadius:99, fontSize:"0.68rem", fontWeight:700 }}>{job.level}</span>
                    <span style={{ background:"#f1f5f9", color:"#64748b", padding:"3px 10px", borderRadius:99, fontSize:"0.68rem" }}>{job.category}</span>
                    <span style={{ background:"#f1f5f9", color:"#64748b", padding:"3px 10px", borderRadius:99, fontSize:"0.68rem" }}>{job.hours}h/wk</span>
                  </div>

                  {/* Salary */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                    <div>
                      <div style={{ fontSize:"0.65rem", color:"#94a3b8", textTransform:"uppercase", letterSpacing:".04em" }}>Weekly salary</div>
                      <div style={{ fontSize:"1.3rem", fontWeight:900, color:locked?"#94a3b8":color, textShadow:isHovered&&!locked?`0 0 12px ${LEVEL_SHADOWS[job.level]}`:"none" }}>
                        ${job.salary.toLocaleString()}
                      </div>
                    </div>
                    {job.xpReq > 0 && (
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:"0.65rem", color:"#94a3b8" }}>Required</div>
                        <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                          <Zap size={12} color={locked?"#EF4444":"#76AD25"} />
                          <span style={{ fontSize:"0.8rem", fontWeight:700, color:locked?"#EF4444":"#76AD25" }}>{job.xpReq.toLocaleString()} XP</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <button
                    disabled={locked || isCurrent}
                    onClick={() => handleApply(job)}
                    className={!locked && !isCurrent ? "btn-3d-green" : ""}
                    style={{
                      width:"100%", padding:"11px",
                      background:isCurrent ? `${color}18` : locked ? "#f1f5f9" : undefined,
                      color:isCurrent ? color : locked ? "#94a3b8" : undefined,
                      border:isCurrent ? `1.5px solid ${color}40` : locked ? "none" : undefined,
                      borderRadius:10, fontSize:"0.85rem", fontWeight:700,
                      cursor:locked||isCurrent?"not-allowed":"pointer", fontFamily:FONT,
                      display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                    }}>
                    {justDone ? (
                      <span style={{ animation:"pw-pop .3s ease", display:"flex", alignItems:"center", gap:5 }}>
                        <Check size={14} /> Applied!
                      </span>
                    ) : isCurrent ? (
                      <><Trophy size={13} /> Current Job</>
                    ) : locked ? (
                      <><Lock size={13} /> Need {job.xpReq.toLocaleString()} XP</>
                    ) : (
                      <><Briefcase size={13} /> Apply Now</>
                    )}
                  </button>

                  {/* Unlock burst when just applied */}
                  {justDone && <UnlockBurst color={color} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
