"use client";
import { useState, useEffect } from "react";

type Mood = "happy" | "excited" | "thinking" | "celebrating" | "sleeping";

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
    "🏆 The leaderboard won't know what hit it!",
    "New level unlocked. What can't you do?!",
  ],
  sleeping: [
    "Psst... your portfolio is waiting...",
    "Zzz... come back, I miss you!",
    "Your streak is getting lonely...",
    "Log in daily for bonus XP! I'll be here waiting.",
  ],
};

export function KiwiMascot({
  mood = "happy",
  size = 80,
  animate = true,
}: {
  mood?: Mood;
  size?: number;
  animate?: boolean;
}) {
  const eyeY = mood === "sleeping" ? 52 : mood === "excited" ? 48 : 50;
  const eyeH = mood === "sleeping" ? 3 : mood === "excited" ? 7 : 5;
  const mouthPath = mood === "happy" || mood === "excited" || mood === "celebrating"
    ? "M 36 62 Q 40 67 44 62"
    : mood === "sleeping"
    ? "M 37 63 L 43 63"
    : "M 37 62 Q 40 59 43 62";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      style={{
        animation: animate ? (mood === "excited" || mood === "celebrating" ? "bounce 0.5s ease infinite alternate" : "float 3s ease-in-out infinite") : "none",
        filter: "drop-shadow(0 4px 8px rgba(0,0,0,.2))",
      }}
    >
      {/* Body */}
      <ellipse cx="40" cy="52" rx="22" ry="20" fill="#76AD25" />
      {/* Belly */}
      <ellipse cx="40" cy="55" rx="13" ry="12" fill="#9fd44a" />
      {/* Head */}
      <circle cx="40" cy="36" r="18" fill="#76AD25" />
      {/* Beak */}
      <path d="M 52 33 L 64 30 L 52 37 Z" fill="#f59e0b" />
      {/* Nostril */}
      <circle cx="60" cy="31" r="1.2" fill="#d97706" />
      {/* Eyes */}
      <ellipse cx="36" cy={eyeY} rx="4" ry={eyeH / 2 + 1} fill="#0d1526" />
      <ellipse cx="44" cy={eyeY} rx="4" ry={eyeH / 2 + 1} fill="#0d1526" />
      {/* Eye shine */}
      {mood !== "sleeping" && (
        <>
          <circle cx="37.5" cy={eyeY - 1} r="1.2" fill="white" />
          <circle cx="45.5" cy={eyeY - 1} r="1.2" fill="white" />
        </>
      )}
      {/* Sleeping Zzz */}
      {mood === "sleeping" && (
        <>
          <text x="52" y="28" fill="#94a3b8" fontSize="7" fontWeight="bold">z</text>
          <text x="56" y="22" fill="#94a3b8" fontSize="9" fontWeight="bold">z</text>
          <text x="61" y="16" fill="#94a3b8" fontSize="11" fontWeight="bold">Z</text>
        </>
      )}
      {/* Excited stars */}
      {mood === "excited" && (
        <>
          <text x="56" y="22" fill="#f59e0b" fontSize="10">★</text>
          <text x="14" y="26" fill="#f59e0b" fontSize="8">✦</text>
        </>
      )}
      {/* Mouth */}
      <path d={mouthPath} stroke="#0d1526" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Feet */}
      <ellipse cx="32" cy="71" rx="7" ry="4" fill="#f59e0b" />
      <ellipse cx="48" cy="71" rx="7" ry="4" fill="#f59e0b" />
      {/* Wing hints */}
      <path d="M 20 50 Q 14 45 18 40 Q 22 48 20 50Z" fill="#5a9a1a" />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes bounce {
          from { transform: translateY(0px) scale(1); }
          to { transform: translateY(-8px) scale(1.05); }
        }
      `}</style>
    </svg>
  );
}

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
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIdx(i => (i + 1) % messages.length);
        setVisible(true);
      }, 300);
    }, 5000);
    return () => clearInterval(timer);
  }, [mood, messages.length]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <KiwiMascot mood={mood} size={72} />
      <div style={{
        background: "rgba(255,255,255,.12)",
        border: "1.5px solid rgba(255,255,255,.2)",
        borderRadius: "0 16px 16px 16px",
        padding: "10px 16px",
        maxWidth: 260,
        position: "relative",
        transition: "opacity 0.3s",
        opacity: visible ? 1 : 0,
      }}>
        {/* Speech bubble tail */}
        <div style={{
          position: "absolute", left: -10, top: 12,
          width: 0, height: 0,
          borderTop: "8px solid transparent",
          borderBottom: "8px solid transparent",
          borderRight: "10px solid rgba(255,255,255,.2)",
        }} />
        <p style={{
          color: "#fff", fontSize: "0.825rem",
          lineHeight: 1.5, margin: 0,
          fontFamily: "Inter, sans-serif",
          fontWeight: 500,
        }}>
          {name ? messages[msgIdx].replace("Kia ora!", `Kia ora, ${name}!`) : messages[msgIdx]}
        </p>
      </div>
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
