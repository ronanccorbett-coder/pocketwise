"use client";
import { useState, useEffect, useRef } from "react";
import { useGame } from "@/lib/gameContext";
import { LifeEvent, NewsEvent } from "@/lib/events";
import { X, Zap, DollarSign, TrendingUp, TrendingDown, Newspaper, Star, Trophy } from "lucide-react";
import Confetti from "./Confetti";
import XPCounter from "./XPCounter";

const FONT = "Inter, system-ui, sans-serif";

const MILESTONES = [
  { value: 10000,  label: "$10,000",  message: "Five figures! You've doubled your starting balance.",        color: "#76AD25" },
  { value: 25000,  label: "$25,000",  message: "A quarter of $100k. Compound growth is working for you.",   color: "#3B82F6" },
  { value: 50000,  label: "$50,000",  message: "Halfway to $100k. Most people never get here at your age.", color: "#f59e0b" },
  { value: 100000, label: "$100,000", message: "Six figures. You're in the top 1% of students on PocketWise.", color: "#a78bfa" },
  { value: 250000, label: "$250,000", message: "A quarter million. Investment income is now compounding fast.", color: "#ec4899" },
  { value: 500000, label: "$500,000", message: "Half a million. You could buy a house in Hamilton outright.", color: "#EF4444" },
  { value: 1000000, label: "$1,000,000", message: "A millionaire. The 1%. Your putake got you here.", color: "#f59e0b" },
];

// ── Life Event Modal ──────────────────────────────────────────────────────
function LifeEventModal({ event, onDismiss }: { event: LifeEvent; onDismiss: () => void }) {
  const isPositive = event.balanceChange >= 0;
  const isXpOnly = event.type === "mixed" && event.balanceChange === 0;

  const catColors: Record<string, string> = {
    car: "#f59e0b", health: "#EF4444", work: "#76AD25",
    social: "#3B82F6", opportunity: "#76AD25", surprise: "#a78bfa",
  };
  const accent = catColors[event.category] ?? "#8b9dc3";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", fontFamily: FONT }}>
      <div style={{ background: "#111c30", border: `1.5px solid ${accent}40`, borderRadius: 20, maxWidth: 420, width: "100%", overflow: "hidden", animation: "slideUp 0.35s ease" }}>

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${accent}22, transparent)`, padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: "2rem" }}>{event.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.65rem", color: accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>
                Life Event
              </div>
              <h3 style={{ fontWeight: 800, color: "#fff", fontSize: "1rem", lineHeight: 1.3 }}>{event.title}</h3>
            </div>
            <button onClick={onDismiss} style={{ background: "rgba(255,255,255,.08)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: "#8b9dc3", display: "flex" }}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={{ padding: "18px 20px" }}>
          <p style={{ color: "#cbd5e1", fontSize: "0.875rem", lineHeight: 1.7, marginBottom: 16 }}>
            {event.description}
          </p>

          {/* Impact */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            {event.balanceChange !== 0 && (
              <div style={{ flex: 1, background: isPositive ? "rgba(118,173,37,.12)" : "rgba(239,68,68,.1)", border: `1px solid ${isPositive ? "rgba(118,173,37,.3)" : "rgba(239,68,68,.2)"}`, borderRadius: 10, padding: "12px", textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 4 }}>
                  <DollarSign size={14} color={isPositive ? "#76AD25" : "#EF4444"} />
                  <span style={{ fontSize: "0.68rem", color: "#8b9dc3", fontWeight: 700, textTransform: "uppercase" }}>Balance</span>
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 900, color: isPositive ? "#76AD25" : "#EF4444" }}>
                  {isPositive ? "+" : ""}{event.balanceChange < 0 ? "-" : ""}${Math.abs(event.balanceChange).toFixed(0)}
                </div>
              </div>
            )}
            {event.xpChange > 0 && (
              <div style={{ flex: 1, background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.25)", borderRadius: 10, padding: "12px", textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 4 }}>
                  <Zap size={14} color="#f59e0b" />
                  <span style={{ fontSize: "0.68rem", color: "#8b9dc3", fontWeight: 700, textTransform: "uppercase" }}>XP</span>
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#f59e0b" }}>+{event.xpChange}</div>
              </div>
            )}
          </div>

          {/* Tip */}
          <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
            <p style={{ fontSize: "0.78rem", color: "#8b9dc3", lineHeight: 1.6, fontStyle: "italic" }}>{event.tip}</p>
          </div>

          <button onClick={onDismiss} style={{ width: "100%", padding: "12px", background: accent, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", fontFamily: FONT }}>
            Got it
          </button>
        </div>
      </div>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

// ── News Modal ────────────────────────────────────────────────────────────
function NewsModal({ news, onDismiss }: { news: NewsEvent; onDismiss: () => void }) {
  const sentimentColor = news.sentiment === "positive" ? "#76AD25" : news.sentiment === "negative" ? "#EF4444" : "#8b9dc3";
  const sentimentBg = news.sentiment === "positive" ? "rgba(118,173,37,.08)" : news.sentiment === "negative" ? "rgba(239,68,68,.06)" : "rgba(255,255,255,.04)";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", fontFamily: FONT }}>
      <div style={{ background: "#111c30", border: "1.5px solid rgba(255,255,255,.1)", borderRadius: 20, maxWidth: 460, width: "100%", overflow: "hidden", animation: "slideUp 0.35s ease" }}>

        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: sentimentBg, border: `1px solid ${sentimentColor}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Newspaper size={17} color={sentimentColor} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.65rem", color: sentimentColor, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>
              Weekly Market Update
            </div>
            <h3 style={{ fontWeight: 800, color: "#fff", fontSize: "0.975rem", lineHeight: 1.3 }}>{news.headline}</h3>
          </div>
          <button onClick={onDismiss} style={{ background: "rgba(255,255,255,.08)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: "#8b9dc3", display: "flex", flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "16px 20px" }}>
          <p style={{ color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.75, marginBottom: 16 }}>
            {news.body}
          </p>

          {/* Stock effects */}
          {news.stockEffects && Object.keys(news.stockEffects).length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: "0.7rem", color: "#8b9dc3", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
                Market Impact
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.entries(news.stockEffects).map(([sym, mult]) => {
                  const pct = ((mult - 1) * 100).toFixed(1);
                  const up = mult >= 1;
                  return (
                    <div key={sym} style={{ display: "flex", alignItems: "center", gap: 5, background: up ? "rgba(118,173,37,.12)" : "rgba(239,68,68,.1)", border: `1px solid ${up ? "rgba(118,173,37,.25)" : "rgba(239,68,68,.2)"}`, borderRadius: 8, padding: "5px 10px" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.8rem", color: "#fff" }}>{sym}</span>
                      {up ? <TrendingUp size={12} color="#76AD25" /> : <TrendingDown size={12} color="#EF4444" />}
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: up ? "#76AD25" : "#EF4444" }}>
                        {up ? "+" : ""}{pct}%
                      </span>
                    </div>
                  );
                })}
                {news.propertyEffect && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, background: news.propertyEffect >= 1 ? "rgba(118,173,37,.12)" : "rgba(239,68,68,.1)", border: `1px solid ${news.propertyEffect >= 1 ? "rgba(118,173,37,.25)" : "rgba(239,68,68,.2)"}`, borderRadius: 8, padding: "5px 10px" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.8rem", color: "#fff" }}>Property</span>
                    {news.propertyEffect >= 1 ? <TrendingUp size={12} color="#76AD25" /> : <TrendingDown size={12} color="#EF4444" />}
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: news.propertyEffect >= 1 ? "#76AD25" : "#EF4444" }}>
                      {news.propertyEffect >= 1 ? "+" : ""}{((news.propertyEffect - 1) * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <button onClick={onDismiss} style={{ width: "100%", padding: "11px", background: "#1a2540", color: "#8b9dc3", border: "1px solid #2a3a5c", borderRadius: 10, fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", fontFamily: FONT }}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Milestone Modal ───────────────────────────────────────────────────────
function MilestoneModal({ milestone, onDismiss }: { milestone: typeof MILESTONES[0]; onDismiss: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", fontFamily: FONT }}>
      <Confetti active />
      <div style={{ background: "#111c30", border: `2px solid ${milestone.color}`, borderRadius: 20, maxWidth: 380, width: "100%", padding: "32px 24px", textAlign: "center", animation: "slideUp 0.4s ease" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: `${milestone.color}22`, border: `2px solid ${milestone.color}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: `0 0 30px ${milestone.color}44` }}>
          <Trophy size={36} color={milestone.color} />
        </div>
        <div style={{ fontSize: "0.75rem", color: milestone.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>
          Milestone Reached
        </div>
        <h2 style={{ fontWeight: 900, fontSize: "2.25rem", color: "#fff", marginBottom: 8 }}>{milestone.label}</h2>
        <p style={{ color: "#8b9dc3", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: 24 }}>{milestone.message}</p>
        <button onClick={onDismiss} style={{ padding: "12px 32px", background: milestone.color, color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", fontFamily: FONT }}>
          Keep Going
        </button>
      </div>
    </div>
  );
}

// ── News ticker bar ───────────────────────────────────────────────────────
export function NewsTicker({ headline, sentiment, onExpand }: { headline: string; sentiment: string; onExpand: () => void }) {
  const color = sentiment === "positive" ? "#76AD25" : sentiment === "negative" ? "#EF4444" : "#f59e0b";
  return (
    <div onClick={onExpand} style={{ background: "#0d1526", borderBottom: "1px solid rgba(255,255,255,.06)", padding: "6px 16px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", overflow: "hidden" }}>
      <div style={{ background: color, color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", flexShrink: 0 }}>
        Market Update
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div style={{ animation: "ticker 20s linear infinite", whiteSpace: "nowrap", fontSize: "0.78rem", color: "#cbd5e1", fontFamily: FONT }}>
          {headline}
        </div>
      </div>
      <Newspaper size={14} color={color} style={{ flexShrink: 0 }} />
      <style>{`@keyframes ticker { 0%{transform:translateX(100%)} 100%{transform:translateX(-100%)} }`}</style>
    </div>
  );
}

// ── Main overlay manager ──────────────────────────────────────────────────
export default function EventOverlay() {
  const { state, clearPendingEvent, clearPendingNews, addXp } = useGame();
  const [shownMilestones, setShownMilestones] = useState<Set<number>>(new Set());
  const [activeMilestone, setActiveMilestone] = useState<typeof MILESTONES[0] | null>(null);
  const [showLife, setShowLife] = useState(false);
  const [showNews, setShowNews] = useState(false);
  const prevNetWorth = useRef(0);

  const netWorth = state?.netWorth ?? 0;
  const pendingLife = state?.pendingLifeEvent ? (() => { try { return JSON.parse(state.pendingLifeEvent!); } catch { return null; } })() as LifeEvent | null : null;
  const pendingNews = state?.pendingNews ? (() => { try { return JSON.parse(state.pendingNews!); } catch { return null; } })() as NewsEvent | null : null;

  // Show life event when it arrives
  useEffect(() => {
    if (pendingLife && !showLife) setShowLife(true);
  }, [pendingLife?.id]);

  // Show news when it arrives
  useEffect(() => {
    if (pendingNews && !showNews) setShowNews(true);
  }, [pendingNews?.id]);

  // Net worth milestone detection
  useEffect(() => {
    if (!netWorth || !prevNetWorth.current) { prevNetWorth.current = netWorth; return; }
    const milestone = MILESTONES.find(m => prevNetWorth.current < m.value && netWorth >= m.value && !shownMilestones.has(m.value));
    if (milestone) {
      setActiveMilestone(milestone);
      setShownMilestones(s => new Set([...s, milestone.value]));
    }
    prevNetWorth.current = netWorth;
  }, [netWorth]);

  // Apply XP from life event
  function dismissLife() {
    if (pendingLife?.xpChange) addXp(pendingLife.xpChange);
    clearPendingEvent();
    setShowLife(false);
  }

  function dismissNews() {
    clearPendingNews();
    setShowNews(false);
  }

  return (
    <>
      {showLife && pendingLife && <LifeEventModal event={pendingLife} onDismiss={dismissLife} />}
      {showNews && pendingNews && !showLife && <NewsModal news={pendingNews} onDismiss={dismissNews} />}
      {activeMilestone && !showLife && !showNews && <MilestoneModal milestone={activeMilestone} onDismiss={() => setActiveMilestone(null)} />}
    </>
  );
}
