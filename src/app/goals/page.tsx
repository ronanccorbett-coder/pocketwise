"use client";
import { useState } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { useGame } from "@/lib/gameContext";
import { Target, Plus, Trash2, Check, DollarSign, TrendingUp, Home, Car, PiggyBank, Plane, GraduationCap, Star, Shield, Briefcase, BarChart2, Zap } from "lucide-react";

const FONT = "Inter, system-ui, sans-serif";

type Goal = { label: string; target: number; iconKey: string; created: number };

const GOAL_ICONS: Record<string, any> = {
  home: Home, car: Car, plane: Plane, chart: TrendingUp,
  graduate: GraduationCap, work: Briefcase, shield: Shield,
  target: Target, savings: PiggyBank, dollar: DollarSign,
  star: Star, zap: Zap,
};

const GOAL_TEMPLATES = [
  { label: "Emergency Fund",        target: 3000,   iconKey: "shield",   desc: "3 months of expenses covered" },
  { label: "House Deposit (20%)",   target: 100000, iconKey: "home",     desc: "Auckland apartment deposit" },
  { label: "New Car",               target: 20000,  iconKey: "car",      desc: "Reliable used car outright" },
  { label: "OE Fund",               target: 15000,  iconKey: "plane",    desc: "12 months overseas experience" },
  { label: "Investment Portfolio",  target: 50000,  iconKey: "chart",    desc: "Diversified stocks and funds" },
  { label: "Student Loan Free",     target: 25000,  iconKey: "graduate", desc: "Pay off student debt completely" },
  { label: "KiwiSaver Boost",       target: 10000,  iconKey: "savings",  desc: "Voluntary top-up for first home" },
  { label: "Business Startup",      target: 30000,  iconKey: "work",     desc: "Seed capital for your own venture" },
];

const ICON_OPTIONS = Object.keys(GOAL_ICONS);

export default function GoalsPage() {
  const { state, setGoals } = useGame();
  const balance = state?.balance ?? 0;
  const netWorth = state?.netWorth ?? 0;

  const savedGoals: Goal[] = (() => {
    try { return state?.goals ? JSON.parse(state.goals as string) : []; }
    catch { return []; }
  })();

  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newIcon, setNewIcon] = useState("target");

  function addGoal(label: string, target: number, icon: string) {
    const updated = [...savedGoals, { label, target, icon, created: Date.now() }];
    setGoals(updated);
    setShowAdd(false); setNewLabel(""); setNewTarget(""); setNewIcon("target");
  }

  function removeGoal(i: number) {
    const updated = savedGoals.filter((_, j) => j !== i);
    setGoals(updated);
  }

  function pct(target: number) { return Math.min(100, Math.round((netWorth / target) * 100)); }

  const totalGoalValue = savedGoals.reduce((s, g) => s + g.target, 0);
  const goalsCompleted = savedGoals.filter(g => netWorth >= g.target).length;

  return (
    <AuthGuard>
      <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: FONT }}>
        <Nav />

        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg, #0d1526, #111c30)", padding: "28px 1.5rem" }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <Target size={22} color="#76AD25" />
              <h1 style={{ fontWeight: 900, fontSize: "1.4rem", color: "#fff" }}>Financial Goals</h1>
            </div>
            <p style={{ color: "#8b9dc3", fontSize: "0.875rem", marginBottom: 20 }}>Set targets. Track progress. Build wealth with purpose.</p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                { label: "Net Worth",       val: `$${netWorth.toFixed(0)}`,   Icon: TrendingUp, color: "#76AD25" },
                { label: "Cash Balance",    val: `$${balance.toFixed(0)}`,    Icon: DollarSign, color: "#3B82F6" },
                { label: "Goals Set",       val: savedGoals.length,           Icon: Target,     color: "#f59e0b" },
                { label: "Goals Reached",   val: goalsCompleted,              Icon: Check,      color: "#a78bfa" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10 }}>
                  <s.Icon size={16} color={s.color} />
                  <div>
                    <div style={{ fontSize: "0.65rem", color: "#8b9dc3", textTransform: "uppercase", letterSpacing: ".04em" }}>{s.label}</div>
                    <div style={{ fontWeight: 800, color: "#fff", fontSize: "1rem" }}>{s.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>

            {/* Active goals */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#0d1526" }}>Your Goals</h2>
                <button onClick={() => setShowAdd(s => !s)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#76AD25", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", fontFamily: FONT }}>
                  <Plus size={14} /> Add Goal
                </button>
              </div>

              {/* Add goal form */}
              {showAdd && (
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px", marginBottom: 14 }}>
                  <h3 style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: 14, color: "#0d1526" }}>New Goal</h3>

                  {/* Icon picker */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b", fontWeight: 600, marginBottom: 6 }}>Icon</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {ICON_OPTIONS.map(ico => {
                        const I = GOAL_ICONS[ico] ?? Target;
                        return <button key={ico} onClick={() => setNewIcon(ico)} style={{ width: 36, height: 36, borderRadius: 8, border: `2px solid ${newIcon === ico ? "#76AD25" : "#e2e8f0"}`, background: newIcon === ico ? "#e8f5d0" : "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <I size={16} color={newIcon === ico ? "#76AD25" : "#94a3b8"} />
                        </button>;
                      })}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b", fontWeight: 600, marginBottom: 5 }}>Goal Name</label>
                      <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="e.g. Emergency Fund" style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontFamily: FONT, fontSize: "0.875rem", outline: "none", color: "#0d1526" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b", fontWeight: 600, marginBottom: 5 }}>Target ($)</label>
                      <input type="number" value={newTarget} onChange={e => setNewTarget(e.target.value)} placeholder="e.g. 10000" style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontFamily: FONT, fontSize: "0.875rem", outline: "none", color: "#0d1526" }} />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { if (newLabel && newTarget) addGoal(newLabel, parseFloat(newTarget), newIcon); }} disabled={!newLabel || !newTarget} style={{ flex: 1, padding: "10px", background: newLabel && newTarget ? "#76AD25" : "#e2e8f0", color: newLabel && newTarget ? "#fff" : "#94a3b8", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.875rem", cursor: newLabel && newTarget ? "pointer" : "not-allowed", fontFamily: FONT }}>
                      Save Goal
                    </button>
                    <button onClick={() => setShowAdd(false)} style={{ padding: "10px 16px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 8, fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", fontFamily: FONT }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {savedGoals.length === 0 && !showAdd ? (
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "48px", textAlign: "center" }}>
                  <Target size={36} color="#e2e8f0" style={{ margin: "0 auto 12px", display: "block" }} />
                  <p style={{ color: "#94a3b8", fontSize: "0.875rem", marginBottom: 16 }}>No goals set yet. Add your first goal or pick from the templates.</p>
                  <button onClick={() => setShowAdd(true)} style={{ padding: "10px 24px", background: "#76AD25", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", fontFamily: FONT }}>
                    Set a Goal
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {savedGoals.map((goal, i) => {
                    const progress = pct(goal.target);
                    const done = progress >= 100;
                    const remaining = Math.max(0, goal.target - netWorth);
                    return (
                      <div key={i} style={{ background: "#fff", border: `1.5px solid ${done ? "#76AD25" : "#e2e8f0"}`, borderRadius: 14, padding: "18px", transition: "border-color .2s" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 9, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {(() => { const I = GOAL_ICONS[goal.iconKey ?? "target"] ?? Target; return <I size={18} color="#76AD25" />; })()}
                            </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <h3 style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0d1526" }}>{goal.label}</h3>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {done && <span style={{ background: "#e8f5d0", color: "#5d8a1c", padding: "2px 8px", borderRadius: 99, fontSize: "0.65rem", fontWeight: 700 }}>Complete!</span>}
                                <button onClick={() => removeGoal(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#e2e8f0", padding: 2 }}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#64748b", marginTop: 2 }}>
                              <span>Target: <strong style={{ color: "#0d1526" }}>${goal.target.toLocaleString()}</strong></span>
                              {!done && <span>Still need: <strong style={{ color: "#EF4444" }}>${remaining.toLocaleString()}</strong></span>}
                            </div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div style={{ background: "#f1f5f9", borderRadius: 99, height: 10, overflow: "hidden", marginBottom: 6 }}>
                          <div style={{ height: 10, borderRadius: 99, background: done ? "#76AD25" : "linear-gradient(90deg, #76AD25, #22c55e)", width: `${progress}%`, transition: "width 0.6s ease" }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#94a3b8" }}>
                          <span>${netWorth.toFixed(0)} net worth</span>
                          <span style={{ fontWeight: 700, color: done ? "#76AD25" : "#0d1526" }}>{progress}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Templates sidebar */}
            <div>
              <h2 style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0d1526", marginBottom: 12 }}>Goal Templates</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {GOAL_TEMPLATES.map(t => {
                  const alreadyAdded = savedGoals.some(g => g.label === t.label);
                  return (
                    <div key={t.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {(() => { const I = GOAL_ICONS[t.iconKey] ?? Target; return <I size={14} color="#76AD25" />; })()}
                    </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "#0d1526" }}>{t.label}</div>
                        <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{t.desc}</div>
                        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#76AD25", marginTop: 2 }}>${t.target.toLocaleString()}</div>
                      </div>
                      <button
                        onClick={() => !alreadyAdded && addGoal(t.label, t.target, t.iconKey)}
                        disabled={alreadyAdded}
                        style={{ background: alreadyAdded ? "#f1f5f9" : "#e8f5d0", color: alreadyAdded ? "#94a3b8" : "#5d8a1c", border: "none", borderRadius: 7, padding: "5px 10px", fontSize: "0.72rem", fontWeight: 700, cursor: alreadyAdded ? "default" : "pointer", fontFamily: FONT, flexShrink: 0 }}>
                        {alreadyAdded ? "Added" : "+ Add"}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Tip */}
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px", marginTop: 14 }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#76AD25", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>Goal-Setting Tip</div>
                <p style={{ fontSize: "0.78rem", color: "#64748b", lineHeight: 1.6 }}>
                  Research shows people who write down specific financial goals are 42% more likely to achieve them. Your net worth is tracked automatically — as it grows, your goals update in real time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
