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

// ── Clean cute Kiwi SVG ────────────────────────────────────────────────────
export function KiwiMascot({
  mood = "happy",
  size = 80,
  animate = true,
}: {
  mood?: Mood;
  size?: number;
  animate?: boolean;
}) {
  const isSad        = mood === "sad";
  const isExcited    = mood === "excited" || mood === "celebrating" || mood === "love";
  const isSleeping   = mood === "sleeping";
  const isHappy      = mood === "happy" || mood === "thinking";

  const anim = !animate ? "none"
    : isExcited   ? "kiwi-bounce 0.5s ease-in-out infinite alternate"
    : isSleeping  ? "kiwi-sway 4s ease-in-out infinite"
    : isSad       ? "kiwi-shake 0.5s ease 3"
    : "kiwi-float 3s ease-in-out infinite";

  // Body colour - slightly desaturated when sad
  const bodyColor  = isSad ? "#7ab020" : "#86bb26";
  const bellyColor = isSad ? "#b8d870" : "#c8ec50";
  const darkBody   = isSad ? "#5a8a10" : "#6a9a16";

  return (
    <svg
      width={size} height={size}
      viewBox="0 0 120 120"
      style={{ animation: anim, overflow: "visible", filter: "drop-shadow(0 4px 8px rgba(0,0,0,.2))" }}
    >
      <defs>
        <radialGradient id={`kg-body-${mood}`} cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor={bellyColor} stopOpacity="0.6" />
          <stop offset="100%" stopColor={darkBody} />
        </radialGradient>
        <radialGradient id={`kg-head-${mood}`} cx="40%" cy="30%" r="65%">
          <stop offset="0%" stopColor={bodyColor} />
          <stop offset="100%" stopColor={darkBody} />
        </radialGradient>
      </defs>

      {/* ── BODY ── */}
      {/* Main round body - slightly egg-shaped */}
      <ellipse cx="60" cy="80" rx="32" ry="28" fill={`url(#kg-body-${mood})`} />
      {/* Belly highlight - lighter oval */}
      <ellipse cx="58" cy="83" rx="18" ry="16" fill={bellyColor} opacity="0.55" />
      {/* Body shading */}
      <ellipse cx="72" cy="76" rx="8" ry="14" fill={darkBody} opacity="0.2" />

      {/* ── LEGS ── */}
      <rect x="45" y="103" width="10" height="10" rx="4" fill={darkBody} />
      <rect x="65" y="103" width="10" height="10" rx="4" fill={darkBody} />
      {/* Feet - little 3-toe feet */}
      <path d="M42 112 L38 116 M42 112 L42 117 M42 112 L46 116" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
      <path d="M78 112 L74 116 M78 112 L78 117 M78 112 L82 116" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />

      {/* ── HEAD ── */}
      <circle cx="60" cy="48" r="30" fill={`url(#kg-head-${mood})`} />
      {/* Head highlight */}
      <ellipse cx="50" cy="36" rx="10" ry="7" fill="rgba(255,255,255,.15)" />

      {/* ── BEAK ── long kiwi beak pointing right ── */}
      <path d="M 84 44 L 108 38 L 84 52 Z" fill="#e8a020" />
      {/* Beak ridge */}
      <path d="M 84 47 L 108 42 L 108 38 L 84 44 Z" fill="#c87010" opacity="0.5" />
      {/* Nostril */}
      <circle cx="102" cy="40" r="2" fill="#a05010" />

      {/* ── EYES ── large friendly eyes ── */}
      {isSleeping ? (
        <>
          {/* Closed crescent eyes */}
          <path d="M 46 51 Q 50 56 54 51" stroke={darkBody} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 64 51 Q 68 56 72 51" stroke={darkBody} strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Zzz */}
          <text x="82" y="32" fill="#8b9dc3" fontSize="9" fontWeight="bold" fontFamily="Inter,sans-serif" opacity="0.8">z</text>
          <text x="90" y="24" fill="#8b9dc3" fontSize="11" fontWeight="bold" fontFamily="Inter,sans-serif" opacity="0.8">z</text>
          <text x="99" y="16" fill="#8b9dc3" fontSize="13" fontWeight="bold" fontFamily="Inter,sans-serif" opacity="0.8">Z</text>
        </>
      ) : isSad ? (
        <>
          {/* Sad droopy eyes - bigger, still friendly looking */}
          <circle cx="50" cy="50" r="7" fill="#0d1526" />
          <circle cx="70" cy="50" r="7" fill="#0d1526" />
          <circle cx="52" cy="48" r="3" fill="white" />
          <circle cx="72" cy="48" r="3" fill="white" />
          <circle cx="53" cy="48.5" r="1.5" fill="#0d1526" />
          <circle cx="73" cy="48.5" r="1.5" fill="#0d1526" />
          {/* Worried eyebrows */}
          <path d="M 44 42 Q 50 38 55 42" stroke={darkBody} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 64 42 Q 69 38 75 42" stroke={darkBody} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Small tears */}
          <ellipse cx="47" cy="58" rx="2" ry="3" fill="#93c5fd" opacity="0.7" />
          <ellipse cx="73" cy="58" rx="2" ry="3" fill="#93c5fd" opacity="0.7" />
        </>
      ) : isExcited ? (
        <>
          {/* Big sparkling excited eyes */}
          <circle cx="50" cy="49" r="8" fill="#0d1526" />
          <circle cx="70" cy="49" r="8" fill="#0d1526" />
          <circle cx="52.5" cy="46.5" r="3" fill="white" />
          <circle cx="72.5" cy="46.5" r="3" fill="white" />
          <circle cx="54.5" cy="47" r="1.5" fill="#0d1526" />
          <circle cx="74.5" cy="47" r="1.5" fill="#0d1526" />
          {/* Sparkle stars */}
          <path d="M 18 26 L 20 20 L 22 26 L 28 28 L 22 30 L 20 36 L 18 30 L 12 28 Z" fill="#f59e0b" opacity="0.9" />
          <path d="M 98 14 L 100 9 L 102 14 L 107 16 L 102 18 L 100 23 L 98 18 L 93 16 Z" fill="#f59e0b" opacity="0.7" transform="scale(0.7) translate(43 4)" />
        </>
      ) : (
        <>
          {/* Normal happy eyes - large, friendly, expressive */}
          <circle cx="50" cy="50" r="7.5" fill="#0d1526" />
          <circle cx="70" cy="50" r="7.5" fill="#0d1526" />
          {/* Large eye shines for cuteness */}
          <circle cx="52.5" cy="47.5" r="3" fill="white" />
          <circle cx="72.5" cy="47.5" r="3" fill="white" />
          <circle cx="54" cy="48" r="1.5" fill="#0d1526" />
          <circle cx="74" cy="48" r="1.5" fill="#0d1526" />
          {/* Small lower shine */}
          <circle cx="53" cy="52" r="1" fill="white" opacity="0.4" />
          <circle cx="73" cy="52" r="1" fill="white" opacity="0.4" />
        </>
      )}

      {/* ── MOUTH ── */}
      {!isSleeping && (isSad ? (
        <path d="M 50 63 Q 60 58 70 63" stroke={darkBody} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      ) : isExcited ? (
        <>
          <path d="M 47 62 Q 60 72 73 62" stroke={darkBody} strokeWidth="2.5" fill="rgba(200,80,80,.2)" strokeLinecap="round" />
        </>
      ) : mood === "thinking" ? (
        <path d="M 50 63 Q 54 60 60 62 Q 66 60 70 63" stroke={darkBody} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M 48 62 Q 60 70 72 62" stroke={darkBody} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      ))}

      {/* Love hearts */}
      {mood === "love" && (
        <>
          <path d="M 16 16 C 16 13 12 10 8 14 C 4 10 0 13 0 16 C 0 20 8 26 8 26 C 8 26 16 20 16 16Z" fill="#ec4899" transform="translate(14,10) scale(0.7)" opacity="0.9" />
          <path d="M 16 16 C 16 13 12 10 8 14 C 4 10 0 13 0 16 C 0 20 8 26 8 26 C 8 26 16 20 16 16Z" fill="#ec4899" transform="translate(90,6) scale(0.5)" opacity="0.7" />
        </>
      )}

      {/* ── WING NUBS ── small stubby wings */}
      <path d="M 28 72 Q 18 64 22 54 Q 30 64 28 72Z" fill={darkBody} opacity="0.8" />
      <path d="M 92 72 Q 102 64 98 54 Q 90 64 92 72Z" fill={darkBody} opacity="0.8" />

      <style>{`
        @keyframes kiwi-float  { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-7px)} }
        @keyframes kiwi-bounce { from{transform:translateY(0) scale(1)} to{transform:translateY(-10px) scale(1.06)} }
        @keyframes kiwi-sway   { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-7deg)} 75%{transform:rotate(7deg)} }
        @keyframes kiwi-shake  { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
      `}</style>
    </svg>
  );
}

// ── Speech bubble mascot ───────────────────────────────────────────────────
export function MascotMessage({
  mood = "happy", xp = 0, streak = 0, name = "",
}: { mood?: Mood; xp?: number; streak?: number; name?: string }) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const messages = MESSAGES[mood];

  useEffect(() => { setMsgIdx(0); setVisible(true); }, [mood]);

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
        background: "rgba(255,255,255,.13)", border: "1.5px solid rgba(255,255,255,.22)",
        borderRadius: "4px 16px 16px 16px", padding: "10px 16px", maxWidth: 260,
        position: "relative", transition: "opacity 0.3s", opacity: visible ? 1 : 0,
      }}>
        <div style={{ position: "absolute", left: -10, top: 10, width: 0, height: 0,
          borderTop: "8px solid transparent", borderBottom: "8px solid transparent",
          borderRight: "10px solid rgba(255,255,255,.22)" }} />
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
  const ty = phase === "in" ? 120 : phase === "out" ? 120 : 0;
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:600, display:"flex", alignItems:"flex-end", gap:10, transform:`translateY(${ty}px)`, transition:"transform 0.5s cubic-bezier(.34,1.56,.64,1)" }}>
      <div style={{ background:"#0d1526", border:"2px solid #76AD25", borderRadius:"16px 16px 4px 16px", padding:"10px 16px", maxWidth:200, boxShadow:"0 8px 24px rgba(0,0,0,.4)" }}>
        <p style={{ color:"#fff", fontSize:"0.825rem", lineHeight:1.5, margin:0, fontFamily:"Inter, sans-serif", fontWeight:600 }}>{message}</p>
      </div>
      <KiwiMascot mood="celebrating" size={80} animate />
    </div>
  );
}

// ── Sad hearts-out overlay ─────────────────────────────────────────────────
export function SadKiwiOverlay({ onDismiss, onLeave }: { onDismiss: () => void; onLeave?: () => void }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:800, background:"rgba(7,14,26,.92)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", animation:"pw-fade-in .3s ease", fontFamily:"Inter, sans-serif" }}>
      <div style={{ animation:"pw-slide-up .4s ease", textAlign:"center" }}>
        <KiwiMascot mood="sad" size={130} animate />
        <h2 style={{ color:"#fff", fontWeight:900, fontSize:"1.5rem", marginTop:16, marginBottom:8 }}>Out of hearts!</h2>
        <p style={{ color:"#8b9dc3", fontSize:"0.9rem", marginBottom:28, lineHeight:1.6 }}>
          No worries — even the best investors make mistakes.<br />Try this lesson again when you're ready.
        </p>
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button onClick={onDismiss} className="btn-3d-green" style={{ padding:"13px 40px", fontSize:"0.95rem" }}>Try Again</button>
          {onLeave && <button onClick={onLeave} className="btn-3d-ghost" style={{ padding:"13px 24px", fontSize:"0.875rem" }}>Leave Lesson</button>}
        </div>
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
