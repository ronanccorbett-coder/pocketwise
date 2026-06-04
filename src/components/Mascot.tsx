"use client";
import { useState, useEffect } from "react";

export type Mood = "happy" | "excited" | "thinking" | "celebrating" | "sleeping" | "sad" | "love";

const MESSAGES: Record<Mood, string[]> = {
  happy: [
    "Kia ora! Ready to learn something awesome today?",
    "Every lesson gets you closer to financial freedom!",
    "Small steps, big results. Let's go!",
    "Your future self will thank you for this.",
    "Money skills = life skills. You've got this!",
  ],
  excited: [
    "YESSS! You're on a streak! Keep it going!",
    "Look at you go! Those XP points are stacking up!",
    "You're absolutely smashing it today!",
    "This is your moment. Don't stop now!",
    "Boom! Another lesson done. You legend!",
  ],
  thinking: [
    "Hmm, where should we start today?",
    "Big financial decisions start with small daily habits...",
    "Did you know? Most Kiwis don't have 3 months emergency savings.",
    "Fun fact: Starting KiwiSaver at 16 vs 25 could mean $100k+ more.",
    "The best time to learn about money was yesterday. Second best? Now.",
  ],
  celebrating: [
    "WAHOO! You absolute legend!",
    "That's what I'm talking about! Pure gold!",
    "Ka rawe! You're unstoppable!",
    "The leaderboard won't know what hit it!",
    "New level unlocked. What can't you do?!",
  ],
  sleeping: [
    "Psst... your portfolio is waiting...",
    "Zzz... come back, I miss you!",
    "Your streak is getting lonely...",
    "Log in daily for bonus XP! I'll be here waiting.",
  ],
  sad: [
    "Aww no! But every mistake is a lesson...",
    "Don't give up! Even Warren Buffett made losses.",
    "Pick yourself up — you've got this!",
    "Failure is just XP in disguise. Try again!",
  ],
  love: [
    "You're doing amazing, keep it up!",
    "So proud of your progress!",
    "You're my favourite student!",
  ],
};

// ── Core Kiwi SVG ──────────────────────────────────────────────────────────
export function KiwiMascot({
  mood = "happy",
  size = 80,
  animate = true,
}: {
  mood?: Mood;
  size?: number;
  animate?: boolean;
}) {
  const isSad = mood === "sad";
  const isExcited = mood === "excited" || mood === "celebrating" || mood === "love";
  const isSleeping = mood === "sleeping";

  const animStyle = animate
    ? isExcited
      ? "kiwi-bounce 0.45s ease-in-out infinite alternate"
      : isSleeping
      ? "kiwi-sway 4s ease-in-out infinite"
      : isSad
      ? "kiwi-shake 0.5s ease-in-out 3"
      : "kiwi-float 3s ease-in-out infinite"
    : "none";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 110"
      style={{ animation: animStyle, filter: "drop-shadow(0 4px 10px rgba(0,0,0,.25))", overflow: "visible" }}
    >
      <defs>
        <radialGradient id={`body-${mood}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={isSad ? "#8fad5a" : "#88c830"} />
          <stop offset="100%" stopColor={isSad ? "#5a7a20" : "#4a8a10"} />
        </radialGradient>
        <radialGradient id={`belly-${mood}`} cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor={isSad ? "#b8c890" : "#c8e860"} />
          <stop offset="100%" stopColor={isSad ? "#8aaa58" : "#9fd44a"} />
        </radialGradient>
      </defs>

      {/* === BODY === */}
      {/* Lower body / rump */}
      <ellipse cx="50" cy="78" rx="24" ry="20" fill={`url(#body-${mood})`} />
      {/* Upper body blending into neck */}
      <ellipse cx="50" cy="62" rx="20" ry="18" fill={`url(#body-${mood})`} />
      {/* Belly highlight */}
      <ellipse cx="50" cy="72" rx="13" ry="13" fill={`url(#belly-${mood})`} />
      {/* Body shading */}
      <ellipse cx="42" cy="68" rx="5" ry="8" fill="rgba(0,0,0,.06)" />

      {/* === FEET === */}
      {/* Left foot */}
      <path d="M 33 95 L 26 100 M 33 95 L 30 101 M 33 95 L 34 101" stroke="#d97706" strokeWidth="3.5" strokeLinecap="round" />
      {/* Right foot */}
      <path d="M 67 95 L 60 100 M 67 95 L 64 101 M 67 95 L 68 101" stroke="#d97706" strokeWidth="3.5" strokeLinecap="round" />
      {/* Leg stubs */}
      <rect x="30" y="90" width="7" height="8" rx="3" fill="#5a9a1a" />
      <rect x="63" y="90" width="7" height="8" rx="3" fill="#5a9a1a" />

      {/* === HEAD === */}
      <circle cx="50" cy="40" r="24" fill={`url(#body-${mood})`} />
      {/* Head shading */}
      <ellipse cx="44" cy="36" rx="6" ry="10" fill="rgba(0,0,0,.05)" />
      {/* Head highlight */}
      <ellipse cx="56" cy="30" rx="7" ry="5" fill="rgba(255,255,255,.12)" />

      {/* === BEAK === */}
      <path d="M 68 37 L 88 32 L 68 43 Z" fill="#f59e0b" />
      <path d="M 68 39.5 L 88 36 L 88 32 L 68 37 Z" fill="#e08800" opacity="0.5" />
      {/* Nostril */}
      <circle cx="82" cy="34" r="1.5" fill="#b45309" />

      {/* === EYES === */}
      {isSleeping ? (
        <>
          {/* Closed eyes — curved lines */}
          <path d="M 40 42 Q 43 46 46 42" stroke="#0d1526" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 54 42 Q 57 46 60 42" stroke="#0d1526" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Zzz */}
          <text x="66" y="28" fill="#94a3b8" fontSize="7" fontWeight="bold" fontFamily="Inter,sans-serif">z</text>
          <text x="72" y="20" fill="#94a3b8" fontSize="9" fontWeight="bold" fontFamily="Inter,sans-serif">z</text>
          <text x="78" y="13" fill="#94a3b8" fontSize="11" fontWeight="bold" fontFamily="Inter,sans-serif">Z</text>
        </>
      ) : isSad ? (
        <>
          {/* Sad droopy eyes */}
          <ellipse cx="43" cy="41" rx="5" ry="4" fill="#0d1526" />
          <ellipse cx="57" cy="41" rx="5" ry="4" fill="#0d1526" />
          <circle cx="44.5" cy="40" r="1.5" fill="white" />
          <circle cx="58.5" cy="40" r="1.5" fill="white" />
          {/* Sad eyebrows */}
          <path d="M 39 35 Q 43 32 46 35" stroke="#0d1526" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 54 35 Q 57 32 61 35" stroke="#0d1526" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Tears */}
          <ellipse cx="40" cy="47" rx="1.5" ry="2.5" fill="#93c5fd" opacity="0.8" />
          <ellipse cx="60" cy="47" rx="1.5" ry="2.5" fill="#93c5fd" opacity="0.8" />
        </>
      ) : isExcited ? (
        <>
          {/* Big excited eyes */}
          <ellipse cx="43" cy="40" rx="6" ry="7" fill="#0d1526" />
          <ellipse cx="57" cy="40" rx="6" ry="7" fill="#0d1526" />
          <circle cx="45" cy="38" r="2" fill="white" />
          <circle cx="59" cy="38" r="2" fill="white" />
          {/* Sparkles */}
          <text x="14" y="24" fill="#f59e0b" fontSize="10" fontFamily="sans-serif">★</text>
          <text x="66" y="20" fill="#f59e0b" fontSize="8" fontFamily="sans-serif">✦</text>
        </>
      ) : (
        <>
          {/* Normal happy eyes */}
          <ellipse cx="43" cy="41" rx="5" ry="5.5" fill="#0d1526" />
          <ellipse cx="57" cy="41" rx="5" ry="5.5" fill="#0d1526" />
          <circle cx="44.5" cy="39.5" r="1.8" fill="white" />
          <circle cx="58.5" cy="39.5" r="1.8" fill="white" />
        </>
      )}

      {/* === MOUTH === */}
      {isSleeping ? null : isSad ? (
        <path d="M 42 52 Q 50 48 58 52" stroke="#0d1526" strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : isExcited ? (
        <>
          <path d="M 40 51 Q 50 60 60 51" stroke="#0d1526" strokeWidth="2.5" fill="#ff6b8a" strokeLinecap="round" />
          <ellipse cx="50" cy="53" rx="8" ry="4" fill="#ff6b8a" opacity="0.3" />
        </>
      ) : (
        <path d="M 41 51 Q 50 58 59 51" stroke="#0d1526" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}

      {/* Love hearts */}
      {mood === "love" && (
        <>
          <text x="12" y="28" fill="#ec4899" fontSize="12" fontFamily="sans-serif">♥</text>
          <text x="70" y="22" fill="#ec4899" fontSize="9" fontFamily="sans-serif">♥</text>
        </>
      )}

      {/* Wing nubs */}
      <path d="M 26 62 Q 18 55 22 47 Q 28 56 26 62Z" fill="#4a8a10" />
      <path d="M 74 62 Q 82 55 78 47 Q 72 56 74 62Z" fill="#4a8a10" />

      <style>{`
        @keyframes kiwi-float {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-7px); }
        }
        @keyframes kiwi-bounce {
          from { transform: translateY(0) scale(1); }
          to   { transform: translateY(-10px) scale(1.06); }
        }
        @keyframes kiwi-sway {
          0%,100% { transform: rotate(0deg); }
          25%     { transform: rotate(-8deg); }
          75%     { transform: rotate(8deg); }
        }
        @keyframes kiwi-shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-6px); }
          40%     { transform: translateX(6px); }
          60%     { transform: translateX(-4px); }
          80%     { transform: translateX(4px); }
        }
      `}</style>
    </svg>
  );
}

// ── Speech bubble mascot ───────────────────────────────────────────────────
export function MascotMessage({
  mood = "happy",
  xp = 0,
  streak = 0,
  name = "",
}: {
  mood?: Mood;
  xp?: number;
  streak?: number;
  name?: string;
}) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const messages = MESSAGES[mood];

  useEffect(() => {
    setMsgIdx(0);
    setVisible(true);
  }, [mood]);

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setMsgIdx(i => (i + 1) % messages.length); setVisible(true); }, 300);
    }, 5000);
    return () => clearInterval(t);
  }, [mood, messages.length]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <KiwiMascot mood={mood} size={80} />
      <div style={{
        background: "rgba(255,255,255,.13)",
        border: "1.5px solid rgba(255,255,255,.22)",
        borderRadius: "4px 16px 16px 16px",
        padding: "10px 16px",
        maxWidth: 260,
        position: "relative",
        transition: "opacity 0.3s",
        opacity: visible ? 1 : 0,
      }}>
        <div style={{
          position: "absolute", left: -10, top: 10,
          width: 0, height: 0,
          borderTop: "8px solid transparent",
          borderBottom: "8px solid transparent",
          borderRight: "10px solid rgba(255,255,255,.22)",
        }} />
        <p style={{ color: "#fff", fontSize: "0.825rem", lineHeight: 1.55, margin: 0, fontFamily: "Inter, sans-serif", fontWeight: 500 }}>
          {name ? messages[msgIdx].replace("Kia ora!", `Kia ora, ${name}!`) : messages[msgIdx]}
        </p>
      </div>
    </div>
  );
}

// ── Corner celebration pop-out ─────────────────────────────────────────────
export function CornerCelebration({ message, onDone }: { message: string; onDone: () => void }) {
  const [phase, setPhase] = useState<"in"|"hold"|"out">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 600);
    const t2 = setTimeout(() => setPhase("out"), 4000);
    const t3 = setTimeout(() => onDone(), 4600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const translateY = phase === "in" ? 120 : phase === "out" ? 120 : 0;

  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      zIndex: 600,
      display: "flex",
      alignItems: "flex-end",
      gap: 10,
      transform: `translateY(${translateY}px)`,
      transition: "transform 0.5s cubic-bezier(.34,1.56,.64,1)",
    }}>
      <div style={{
        background: "#0d1526",
        border: "2px solid #76AD25",
        borderRadius: "16px 16px 4px 16px",
        padding: "10px 16px",
        maxWidth: 200,
        boxShadow: "0 8px 24px rgba(0,0,0,.4)",
      }}>
        <p style={{ color: "#fff", fontSize: "0.825rem", lineHeight: 1.5, margin: 0, fontFamily: "Inter, sans-serif", fontWeight: 600 }}>
          {message}
        </p>
      </div>
      <KiwiMascot mood="celebrating" size={80} animate />
    </div>
  );
}

// ── Sad hearts-out overlay ─────────────────────────────────────────────────
export function SadKiwiOverlay({ onDismiss, onLeave }: { onDismiss: () => void; onLeave?: () => void }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 800,
      background: "rgba(7,14,26,.9)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      animation: "fadeIn .3s ease",
      fontFamily: "Inter, sans-serif",
    }}>
      <div style={{ animation: "slideUp .4s ease", textAlign: "center" }}>
        <KiwiMascot mood="sad" size={120} animate />
        <h2 style={{ color: "#fff", fontWeight: 900, fontSize: "1.5rem", marginTop: 16, marginBottom: 8 }}>
          Out of hearts!
        </h2>
        <p style={{ color: "#8b9dc3", fontSize: "0.9rem", marginBottom: 28, lineHeight: 1.6 }}>
          No worries — even the best investors make mistakes.<br />
          Try this lesson again when you're ready.
        </p>
        <button
          onClick={onDismiss}
          className="btn-3d-green"
          style={{ padding: "13px 40px", fontSize: "0.95rem", marginRight: 10 }}
        >
          Try Again
        </button>
        {onLeave && (
          <button
            onClick={onLeave}
            className="btn-3d-ghost"
            style={{ padding: "13px 24px", fontSize: "0.875rem" }}
          >
            Leave Lesson
          </button>
        )}
      </div>
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{transform:translateY(30px);opacity:0} to{transform:translateY(0);opacity:1} }
      `}</style>
    </div>
  );
}

export function pickMood(xp: number, streak: number, recentlyCompleted: boolean): Mood {
  if (recentlyCompleted) return "celebrating";
  if (streak >= 7) return "excited";
  if (xp === 0) return "thinking";
  if (streak === 0) return "sleeping";
  return "happy";
}
