"use client";
import { useState, useEffect, useRef } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { useTheme } from "@/lib/theme";
import { useGame } from "@/lib/gameContext";
import { db } from "@/lib/db";
import { id } from "@instantdb/react";
import {
  Target, Plus, Trash2, Check, DollarSign, TrendingUp, Home, Car,
  PiggyBank, Plane, GraduationCap, Star, Shield, Briefcase, Zap, Trophy,
  Send, ChevronRight,
} from "lucide-react";

const FONT = "Inter, system-ui, sans-serif";

type Goal = { label: string; target: number; iconKey: string; created: number };

const GOAL_ICONS: Record<string, any> = {
  home: Home, car: Car, plane: Plane, chart: TrendingUp,
  graduate: GraduationCap, work: Briefcase, shield: Shield,
  target: Target, savings: PiggyBank, dollar: DollarSign,
  star: Star, zap: Zap,
};

const GOAL_COLORS: Record<string, { accent: string; shadow: string; glow: string }> = {
  home:     { accent: "#3B82F6", shadow: "rgba(59,130,246,.35)",  glow: "#3B82F6" },
  car:      { accent: "#f59e0b", shadow: "rgba(245,158,11,.35)",  glow: "#f59e0b" },
  plane:    { accent: "#22d3ee", shadow: "rgba(34,211,238,.35)",  glow: "#22d3ee" },
  chart:    { accent: "#76AD25", shadow: "rgba(118,173,37,.35)",  glow: "#76AD25" },
  graduate: { accent: "#a78bfa", shadow: "rgba(167,139,250,.35)", glow: "#a78bfa" },
  work:     { accent: "#f97316", shadow: "rgba(249,115,22,.35)",  glow: "#f97316" },
  shield:   { accent: "#76AD25", shadow: "rgba(118,173,37,.35)",  glow: "#76AD25" },
  target:   { accent: "#EF4444", shadow: "rgba(239,68,68,.35)",   glow: "#EF4444" },
  savings:  { accent: "#06b6d4", shadow: "rgba(6,182,212,.35)",   glow: "#06b6d4" },
  dollar:   { accent: "#76AD25", shadow: "rgba(118,173,37,.35)",  glow: "#76AD25" },
  star:     { accent: "#f59e0b", shadow: "rgba(245,158,11,.35)",  glow: "#f59e0b" },
  zap:      { accent: "#f59e0b", shadow: "rgba(245,158,11,.35)",  glow: "#f59e0b" },
};

const GOAL_TEMPLATES = [
  { label: "Emergency Fund",       target: 3000,   iconKey: "shield",   desc: "3 months expenses" },
  { label: "House Deposit (20%)",  target: 100000, iconKey: "home",     desc: "Auckland apartment" },
  { label: "New Car",              target: 20000,  iconKey: "car",      desc: "Reliable used car" },
  { label: "OE Fund",              target: 15000,  iconKey: "plane",    desc: "12 months overseas" },
  { label: "Investment Portfolio", target: 50000,  iconKey: "chart",    desc: "Diversified stocks" },
  { label: "Student Loan Free",    target: 25000,  iconKey: "graduate", desc: "Pay off debt" },
  { label: "KiwiSaver Boost",      target: 10000,  iconKey: "savings",  desc: "First home top-up" },
  { label: "Business Startup",     target: 30000,  iconKey: "work",     desc: "Seed capital" },
];

const ICON_OPTIONS = Object.keys(GOAL_ICONS);

// ── Animated ring ──────────────────────────────────────────────────────────
function Ring({ pct, color, size = 72, thickness = 7 }: { pct: number; color: string; size?: number; thickness?: number }) {
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct / 100, 1) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.input} strokeWidth={thickness} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={thickness}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.34,1.56,.64,1)", filter: `drop-shadow(0 0 8px ${color}88)` }}
      />
    </svg>
  );
}

// ── Particle burst ─────────────────────────────────────────────────────────
function Burst({ color, trigger }: { color: string; trigger: boolean }) {
  if (!trigger) return null;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: 18, overflow: "hidden" }}>
      {[...Array(10)].map((_, i) => (
        <div key={i} style={{
          position: "absolute", top: "50%", left: "50%",
          width: i % 2 === 0 ? 8 : 5, height: i % 2 === 0 ? 8 : 5,
          borderRadius: "50%", background: color,
          animation: `pw-star-burst 0.7s cubic-bezier(.34,1.56,.64,1) forwards`,
          animationDelay: `${i * 0.04}s`,
          transform: `rotate(${i * 36}deg) translateX(${20 + (i % 3) * 12}px)`,
        }} />
      ))}
    </div>
  );
}

// ── Animated number ────────────────────────────────────────────────────────
function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(value);
  const [key, setKey] = useState(0);
  const prev = useRef(value);

  useEffect(() => {
    if (value !== prev.current) {
      prev.current = value;
      setKey(k => k + 1);
      const start = display;
      const diff = value - start;
      const dur = 800;
      const startTime = performance.now();
      const step = (now: number) => {
        const t = Math.min((now - startTime) / dur, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        setDisplay(Math.round(start + diff * ease));
        if (t < 1) requestAnimationFrame(step);
        else setDisplay(value);
      };
      requestAnimationFrame(step);
    }
  }, [value]);

  return (
    <span key={key} style={{ display: "inline-block", animation: "pw-count-update .4s ease" }}>
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  );
}

export default function GoalsPage() {
  const { isDark } = useTheme();
  const T = { bg: isDark?"#0d1526":"#f0f4f8", bg2: isDark?"#111c30":"#ffffff", bg3: isDark?"#1a2540":"#f8fafc", card: isDark?"#111c30":"#ffffff", text: isDark?"#ffffff":"#0d1526", text2: isDark?"#8b9dc3":"#475569", text3: isDark?"#4a6a8a":"#94a3b8", border: isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)", border2: isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.16)", input: isDark?"rgba(255,255,255,.06)":"#f8fafc", shadow: isDark?"rgba(0,0,0,.4)":"rgba(0,0,0,.08)", green: isDark?"#76AD25":"#5a9a1a", accent: isDark?"#f59e0b":"#d97706", strip: isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)" };

  const { state, setGoals } = useGame();
  const balance  = state?.balance ?? 0;
  const netWorth = state?.netWorth ?? 0;

  const savedGoals: Goal[] = (() => {
    try { return state?.goals ? JSON.parse(state.goals as string) : []; }
    catch { return []; }
  })();

  const [showAdd,    setShowAdd]    = useState(false);
  const [newLabel,   setNewLabel]   = useState("");
  const [newTarget,  setNewTarget]  = useState("");
  const [newIcon,    setNewIcon]    = useState("target");
  const [justAdded,  setJustAdded]  = useState<number | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [prevNW,     setPrevNW]     = useState(netWorth);
  const [nwPing,     setNWPing]     = useState<number[]>([]);

  // Detect net worth increases and ping affected goals
  useEffect(() => {
    if (netWorth > prevNW) {
      const pinged = savedGoals.reduce<number[]>((acc, g, i) => {
        const wasBelowNow = prevNW < g.target && netWorth >= g.target;
        const isCloser = Math.floor(netWorth / g.target * 10) > Math.floor(prevNW / g.target * 10);
        if (wasBelowNow || isCloser) acc.push(i);
        return acc;
      }, []);
      if (pinged.length) {
        setNWPing(pinged);
        setTimeout(() => setNWPing([]), 1200);
      }
    }
    setPrevNW(netWorth);
  }, [netWorth]);

  function addGoal(label: string, target: number, iconKey: string) {
    const updated = [...savedGoals, { label, target, iconKey, created: Date.now() }];
    setGoals(updated);
    setJustAdded(updated.length - 1);
    setTimeout(() => setJustAdded(null), 1500);
    setShowAdd(false); setNewLabel(""); setNewTarget(""); setNewIcon("target");
    window.dispatchEvent(new CustomEvent("pw:xp", { detail: { amount: 5, reason: "Goal set!" } }));
  }

  function removeGoal(i: number) { setGoals(savedGoals.filter((_, j) => j !== i)); }

  function pct(target: number) { return Math.min(100, (netWorth / target) * 100); }

  const goalsCompleted = savedGoals.filter(g => netWorth >= g.target).length;

  return (
    <AuthGuard>
      <div style={{ minHeight: "100vh", background: T.bg, fontFamily: FONT }}>
        <Nav />

        {/* ── Hero ── */}
        <div style={{ background: "linear-gradient(135deg,#0d1526 0%,#0f2318 55%,#0d1526 100%)", borderBottom: `1px solid ${T.border}`, padding: "28px 1.5rem 24px", position: "relative", overflow: "hidden" }}>
          {[...Array(12)].map((_, i) => (
            <div key={i} style={{ position: "absolute", left: `${(i*29+5)%100}%`, top: `${(i*41+8)%100}%`, width: 2, height: 2, borderRadius: "50%", background: "#76AD25", opacity: 0.2, animation: `pw-float ${2+i%3}s ease-in-out infinite`, animationDelay: `${i*0.25}s`, pointerEvents: "none" }} />
          ))}
          <div style={{ maxWidth: 920, margin: "0 auto", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <Target size={24} color="#76AD25" />
              <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fff" }}>Financial Goals</h1>
            </div>
            <p style={{ color: T.text3, fontSize: "0.875rem", marginBottom: 22 }}>Set targets. Watch them fill up as your wealth grows.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { label: "Net Worth",  val: netWorth,          prefix: "$", Icon: TrendingUp, color: "#76AD25" },
                { label: "Cash",       val: balance,           prefix: "$", Icon: DollarSign, color: "#3B82F6" },
                { label: "Goals Set",  val: savedGoals.length, prefix: "",  Icon: Target,     color: "#f59e0b" },
                { label: "Completed",  val: goalsCompleted,    prefix: "",  Icon: Trophy,     color: "#a78bfa" },
              ].map(s => (
                <div key={s.label} style={{ background: T.input, border: `1px solid ${T.border2}`, borderRadius: 12, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <s.Icon size={15} color={s.color} />
                  <div>
                    <div style={{ fontSize: "0.6rem", color: T.text3, textTransform: "uppercase", letterSpacing: ".04em" }}>{s.label}</div>
                    <div style={{ fontWeight: 900, color: "#fff", fontSize: "1rem" }}>
                      <AnimatedNumber value={s.val} prefix={s.prefix} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 920, margin: "0 auto", padding: "24px 1.5rem 60px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>

            {/* ── Left: goals ── */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#fff" }}>Your Goals</h2>
                <button onClick={() => setShowAdd(s => !s)} className="btn-3d-green" style={{ padding: "8px 18px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 6 }}>
                  <Plus size={14} /> {showAdd ? "Cancel" : "Add Goal"}
                </button>
              </div>

              {/* ── Add form ── */}
              {showAdd && (
                <div style={{ background: T.card, border: "1.5px solid rgba(118,173,37,.3)", borderRadius: 18, padding: "20px", marginBottom: 16, animation: "pw-slide-up .3s ease" }}>
                  <h3 style={{ fontWeight: 700, fontSize: "0.9rem", color: "#fff", marginBottom: 16 }}>New Goal</h3>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: "0.7rem", color: T.text2, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".04em" }}>Choose Icon</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {ICON_OPTIONS.map(ico => {
                        const I = GOAL_ICONS[ico]; const c = GOAL_COLORS[ico]; const sel = newIcon === ico;
                        return (
                          <button key={ico} onClick={() => setNewIcon(ico)} style={{
                            width: 40, height: 40, borderRadius: 10,
                            border: `2px solid ${sel ? c.accent : "rgba(255,255,255,.1)"}`,
                            background: sel ? `${c.accent}22` : "rgba(255,255,255,.05)",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all .15s cubic-bezier(.34,1.56,.64,1)",
                            transform: sel ? "scale(1.2)" : "scale(1)",
                            boxShadow: sel ? `0 0 14px ${c.shadow}` : "none",
                          }}>
                            <I size={16} color={sel ? c.accent : T.text2} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.7rem", color: T.text2, fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: ".04em" }}>Goal Name</label>
                      <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="e.g. Emergency Fund" className="pw-input" style={{ width: "100%", fontSize: "0.875rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.7rem", color: T.text2, fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: ".04em" }}>Target ($NZD)</label>
                      <input type="number" value={newTarget} onChange={e => setNewTarget(e.target.value)} placeholder="10000" className="pw-input" style={{ width: "100%", fontSize: "0.875rem" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { if (newLabel && newTarget) addGoal(newLabel, parseFloat(newTarget), newIcon); }} disabled={!newLabel || !newTarget}
                      className={newLabel && newTarget ? "btn-3d-green" : ""} style={{ flex: 1, padding: "11px", fontSize: "0.875rem", background: !newLabel || !newTarget ? "#1e3a5f" : undefined, color: !newLabel || !newTarget ? T.text3 : undefined, border: "none", borderRadius: 10, fontWeight: 700, cursor: !newLabel || !newTarget ? "not-allowed" : "pointer", fontFamily: FONT }}>
                      Save Goal
                    </button>
                    <button onClick={() => setShowAdd(false)} className="btn-3d-ghost" style={{ padding: "11px 18px", fontSize: "0.875rem" }}>Cancel</button>
                  </div>
                </div>
              )}

              {/* ── Empty state ── */}
              {savedGoals.length === 0 && !showAdd && (
                <div style={{ background: T.card, border: "2px dashed rgba(255,255,255,.08)", borderRadius: 18, padding: "52px 32px", textAlign: "center", animation: "pw-fade-in .4s ease" }}>
                  <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(118,173,37,.08)", border: "1px solid rgba(118,173,37,.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <Target size={26} color="#1e4a2a" />
                  </div>
                  <p style={{ color: T.text3, fontSize: "0.875rem", marginBottom: 20 }}>No goals yet. Pick a template or create your own.</p>
                  <button onClick={() => setShowAdd(true)} className="btn-3d-green" style={{ padding: "11px 28px", fontSize: "0.875rem" }}>Set Your First Goal</button>
                </div>
              )}

              {/* ── Goal cards ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {savedGoals.map((goal, i) => {
                  const progress  = pct(goal.target);
                  const done      = progress >= 100;
                  const remaining = Math.max(0, goal.target - netWorth);
                  const c         = GOAL_COLORS[goal.iconKey] ?? GOAL_COLORS.target;
                  const Icon      = GOAL_ICONS[goal.iconKey] ?? Target;
                  const isHov     = hoveredIdx === i;
                  const isNew     = justAdded === i;
                  const isPinging = nwPing.includes(i);

                  return (
                    <div key={i}
                      onMouseEnter={() => setHoveredIdx(i)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      style={{
                        background: done ? `linear-gradient(135deg,#0a2010,#0f2a18)` : T.card,
                        border: `2px solid ${done ? c.accent : isHov ? `${c.accent}55` : T.input}`,
                        borderRadius: 18, padding: "20px", position: "relative", overflow: "hidden",
                        transition: "all .2s cubic-bezier(.34,1.56,.64,1)",
                        transform: isPinging ? "scale(1.025)" : isHov ? "translateY(-3px) scale(1.005)" : "none",
                        boxShadow: done ? `0 8px 32px ${c.shadow}, 0 0 0 1px ${c.accent}22`
                          : isPinging ? `0 0 0 4px ${c.accent}44, 0 8px 24px ${c.shadow}`
                          : isHov ? `0 8px 28px rgba(0,0,0,.4), 0 0 0 1px ${c.accent}22`
                          : "0 2px 8px rgba(0,0,0,.3)",
                        animation: isNew ? "pw-unlock .6s cubic-bezier(.34,1.56,.64,1)" : isPinging ? "pw-goal-ping .8s ease" : "none",
                      }}>

                      {/* Top colour strip */}
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${c.accent}, ${c.accent}44)`, borderRadius: "18px 18px 0 0" }} />

                      {/* Particle burst */}
                      <Burst color={c.accent} trigger={isNew && done} />

                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        {/* Ring with icon */}
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <Ring pct={progress} color={c.accent} size={68} />
                          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {done
                              ? <Check size={18} color={c.accent} style={{ filter: `drop-shadow(0 0 6px ${c.accent})` }} />
                              : <Icon size={16} color={c.accent} />}
                          </div>
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <h3 style={{ fontWeight: 800, fontSize: "0.95rem", color: "#fff", lineHeight: 1.2 }}>{goal.label}</h3>
                              <div style={{ fontSize: "0.72rem", color: T.text3, marginTop: 2 }}>
                                Target: <span style={{ color: c.accent, fontWeight: 700 }}>${goal.target.toLocaleString()}</span>
                                {!done && <span style={{ marginLeft: 10, color: "#EF4444" }}>Need ${remaining.toLocaleString()} more</span>}
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                              {done && (
                                <span style={{ background: `${c.accent}22`, color: c.accent, padding: "3px 10px", borderRadius: 99, fontSize: "0.65rem", fontWeight: 800, border: `1px solid ${c.accent}44`, animation: "pw-pop .4s ease" }}>
                                  Complete!
                                </span>
                              )}
                              <button onClick={() => removeGoal(i)} style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.15)", borderRadius: 7, width: 28, height: 28, cursor: "pointer", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,.25)"}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,.1)"}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div style={{ marginTop: 10 }}>
                            <div style={{ background: T.input, borderRadius: 99, height: 8, overflow: "hidden", position: "relative" }}>
                              <div style={{
                                height: 8, borderRadius: 99,
                                background: done ? `linear-gradient(90deg, ${c.accent}, ${c.accent}cc)` : `linear-gradient(90deg, ${c.accent}88, ${c.accent})`,
                                width: `${progress}%`,
                                transition: "width 1.2s cubic-bezier(.34,1.56,.64,1)",
                                boxShadow: `0 0 10px ${c.accent}66`,
                                position: "relative",
                              }}>
                                {/* Shimmer on progress bar */}
                                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.3), transparent)", animation: "pw-shimmer 2s infinite", backgroundSize: "200% 100%" }} />
                              </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: "0.68rem" }}>
                              <span style={{ color: T.text3 }}><AnimatedNumber value={Math.round(netWorth)} prefix="$" /> net worth</span>
                              <span style={{ fontWeight: 800, color: done ? c.accent : "#fff" }}>{Math.round(progress)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Sidebar: templates ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <h2 style={{ fontWeight: 700, fontSize: "0.9rem", color: "#fff", marginBottom: 4 }}>Quick Add</h2>
              {GOAL_TEMPLATES.map(t => {
                const added = savedGoals.some(g => g.label === t.label);
                const c = GOAL_COLORS[t.iconKey];
                const Icon = GOAL_ICONS[t.iconKey] ?? Target;
                return (
                  <div key={t.label} style={{
                    background: T.card, border: `1.5px solid ${added ? "rgba(118,173,37,.25)" : T.input}`,
                    borderRadius: 14, padding: "11px 14px", display: "flex", alignItems: "center", gap: 10,
                    opacity: added ? 0.7 : 1, transition: "all .18s cubic-bezier(.34,1.56,.64,1)",
                    cursor: added ? "default" : "pointer",
                  }}
                    onMouseEnter={e => { if (!added) (e.currentTarget as HTMLElement).style.cssText += `transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.4),0 0 0 1px ${c.accent}22;border-color:${c.accent}44`; }}
                    onMouseLeave={e => { if (!added) (e.currentTarget as HTMLElement).style.cssText += `transform:none;box-shadow:none;border-color:rgba(255,255,255,.06)`; }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: `${c.accent}18`, border: `1px solid ${c.accent}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={15} color={c.accent} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.78rem", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.label}</div>
                      <div style={{ fontSize: "0.65rem", color: T.text3 }}>{t.desc} · <span style={{ color: c.accent, fontWeight: 700 }}>${t.target.toLocaleString()}</span></div>
                    </div>
                    <button
                      onClick={() => !added && addGoal(t.label, t.target, t.iconKey)}
                      disabled={added}
                      className={!added ? "btn-3d-green" : ""}
                      style={{ padding: "5px 10px", fontSize: "0.7rem", fontWeight: 700, background: added ? "rgba(118,173,37,.12)" : undefined, color: added ? "#76AD25" : undefined, border: added ? "1px solid rgba(118,173,37,.2)" : "none", borderRadius: 7, cursor: added ? "default" : "pointer", fontFamily: FONT, flexShrink: 0 }}>
                      {added ? <Check size={12} /> : "+ Add"}
                    </button>
                  </div>
                );
              })}

              {/* Tip */}
              <div style={{ background: "linear-gradient(135deg,#0a2010,#0f2818)", border: "1px solid rgba(118,173,37,.2)", borderRadius: 14, padding: "16px", marginTop: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Zap size={13} color="#76AD25" fill="#76AD25" />
                  <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#76AD25", textTransform: "uppercase", letterSpacing: ".05em" }}>Did you know?</span>
                </div>
                <p style={{ fontSize: "0.775rem", color: "#4a8a6a", lineHeight: 1.6, margin: 0 }}>
                  People who write down specific goals are 42% more likely to achieve them. Your net worth bar updates in real time as you earn and invest.
                </p>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes pw-goal-ping {
            0%   { transform: scale(1);    box-shadow: 0 0 0 0 currentColor; }
            50%  { transform: scale(1.03); box-shadow: 0 0 0 12px rgba(118,173,37,0); }
            100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(118,173,37,0); }
          }
        `}</style>
      </div>
    </AuthGuard>
  );
}
