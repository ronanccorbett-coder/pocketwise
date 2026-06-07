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

export function KiwiMascot({
  mood = "happy",
  size = 80,
  animate = true,
}: {
  mood?: Mood;
  size?: number;
  animate?: boolean;
}) {
  const isSad      = mood === "sad";
  const isExcited  = mood === "excited" || mood === "celebrating" || mood === "love";
  const isSleeping = mood === "sleeping";

  const anim = !animate ? "none"
    : isExcited  ? "km-bounce 0.5s ease-in-out infinite alternate"
    : isSleeping ? "km-sway 4s ease-in-out infinite"
    : isSad      ? "km-shake 0.5s ease 3"
    : "km-float 3s ease-in-out infinite";

  // Colour palette
  const body  = isSad ? "#7ab020" : "#88c028";
  const light = isSad ? "#aed050" : "#c4e840";
  const dark  = isSad ? "#5a8010" : "#608010";
  const beak  = "#e09020";
  const beakD = "#b06810";

  return (
    <svg
      width={size} height={size}
      viewBox="0 0 100 100"
      style={{ animation: anim, overflow: "visible", display: "block" }}
    >
      {/* ── BODY: round plump egg shape ── */}
      <ellipse cx="50" cy="72" rx="26" ry="22" fill={body} />
      {/* belly patch */}
      <ellipse cx="50" cy="75" rx="16" ry="14" fill={light} opacity="0.6" />

      {/* ── LEGS ── short stubs */}
      <rect x="38" y="90" width="8" height="7" rx="3" fill={dark} />
      <rect x="54" y="90" width="8" height="7" rx="3" fill={dark} />
      {/* feet - 3 toes each */}
      <path d="M36 97 L31 100 M36 97 L36 101 M36 97 L41 100" stroke={beak} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M64 97 L59 100 M64 97 L64 101 M64 97 L69 100" stroke={beak} strokeWidth="2.5" strokeLinecap="round" fill="none"/>

      {/* ── HEAD: sits on top of body, touching it ── */}
      <circle cx="50" cy="42" r="24" fill={body} />
      {/* head highlight */}
      <ellipse cx="42" cy="32" rx="9" ry="6" fill="rgba(255,255,255,.14)" />

      {/* ── BEAK: long kiwi beak pointing right ── */}
      <path d="M68 40 L90 35 L68 46 Z" fill={beak}/>
      {/* lower jaw shading */}
      <path d="M68 43 L90 40 L90 35 L68 40 Z" fill={beakD} opacity="0.45"/>
      {/* nostril */}
      <circle cx="84" cy="37" r="1.8" fill={beakD}/>

      {/* ── EYES: high on head, large and expressive ── */}
      {isSleeping ? (
        <>
          {/* Closed eye arcs */}
          <path d="M36 38 Q40 43 44 38" stroke={dark} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <path d="M52 38 Q56 43 60 38" stroke={dark} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          {/* Zzz */}
          <text x="66" y="24" fill="#8b9dc3" fontSize="7" fontWeight="bold" fontFamily="Inter,sans-serif">z</text>
          <text x="73" y="17" fill="#8b9dc3" fontSize="9" fontWeight="bold" fontFamily="Inter,sans-serif">Z</text>
        </>
      ) : isSad ? (
        <>
          {/* Sad eyes — slightly smaller, inner corners raised */}
          <ellipse cx="40" cy="37" rx="6" ry="6.5" fill="#1a1a2e"/>
          <ellipse cx="58" cy="37" rx="6" ry="6.5" fill="#1a1a2e"/>
          {/* shines */}
          <circle cx="42" cy="34.5" r="2.2" fill="white"/>
          <circle cx="60" cy="34.5" r="2.2" fill="white"/>
          <circle cx="43" cy="35" r="1.1" fill="#1a1a2e"/>
          <circle cx="61" cy="35" r="1.1" fill="#1a1a2e"/>
          {/* worried brows */}
          <path d="M35 29 Q40 26 44 29" stroke={dark} strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M54 29 Q58 26 63 29" stroke={dark} strokeWidth="2" fill="none" strokeLinecap="round"/>
          {/* tears */}
          <ellipse cx="37" cy="45" rx="1.8" ry="3" fill="#7dd3fc" opacity="0.8"/>
          <ellipse cx="63" cy="45" rx="1.8" ry="3" fill="#7dd3fc" opacity="0.8"/>
        </>
      ) : isExcited ? (
        <>
          {/* Big wide excited eyes */}
          <ellipse cx="40" cy="37" rx="7" ry="7.5" fill="#1a1a2e"/>
          <ellipse cx="58" cy="37" rx="7" ry="7.5" fill="#1a1a2e"/>
          <circle cx="42.5" cy="34" r="2.8" fill="white"/>
          <circle cx="60.5" cy="34" r="2.8" fill="white"/>
          <circle cx="44" cy="34.5" r="1.4" fill="#1a1a2e"/>
          <circle cx="62" cy="34.5" r="1.4" fill="#1a1a2e"/>
          {/* sparkles */}
          <path d="M16 22 L17.5 17 L19 22 L24 23.5 L19 25 L17.5 30 L16 25 L11 23.5Z" fill="#f59e0b" opacity="0.9"/>
          <path d="M76 14 L77 11 L78 14 L81 15 L78 16 L77 19 L76 16 L73 15Z" fill="#f59e0b" opacity="0.75"/>
        </>
      ) : (
        <>
          {/* Normal happy eyes */}
          <ellipse cx="40" cy="37" rx="6.5" ry="7" fill="#1a1a2e"/>
          <ellipse cx="58" cy="37" rx="6.5" ry="7" fill="#1a1a2e"/>
          {/* large shine for cuteness */}
          <circle cx="42.5" cy="34" r="2.5" fill="white"/>
          <circle cx="60.5" cy="34" r="2.5" fill="white"/>
          {/* pupil */}
          <circle cx="43.5" cy="34.5" r="1.2" fill="#1a1a2e"/>
          <circle cx="61.5" cy="34.5" r="1.2" fill="#1a1a2e"/>
          {/* tiny lower shine */}
          <circle cx="42" cy="40" r="1" fill="white" opacity="0.35"/>
          <circle cx="60" cy="40" r="1" fill="white" opacity="0.35"/>
        </>
      )}

      {/* ── MOUTH ── */}
      {!isSleeping && (
        isSad ? (
          <path d="M42 52 Q50 48 58 52" stroke={dark} strokeWidth="2" fill="none" strokeLinecap="round"/>
        ) : isExcited ? (
          <>
            <path d="M39 51 Q50 60 61 51" fill="rgba(180,60,60,.25)" stroke={dark} strokeWidth="2" strokeLinecap="round"/>
          </>
        ) : mood === "thinking" ? (
          <path d="M43 51 Q47 48 50 51 Q53 48 57 51" stroke={dark} strokeWidth="2" fill="none" strokeLinecap="round"/>
        ) : (
          <path d="M40 51 Q50 59 60 51" stroke={dark} strokeWidth="2" fill="none" strokeLinecap="round"/>
        )
      )}

      {/* love hearts */}
      {mood === "love" && (
        <>
          <path d="M12 20 C12 17.5 8.5 15 6 18 C3.5 15 0 17.5 0 20 C0 23.5 6 28 6 28 C6 28 12 23.5 12 20Z"
            fill="#ec4899" opacity="0.9" transform="translate(10,6) scale(0.75)"/>
          <path d="M12 20 C12 17.5 8.5 15 6 18 C3.5 15 0 17.5 0 20 C0 23.5 6 28 6 28 C6 28 12 23.5 12 20Z"
            fill="#ec4899" opacity="0.7" transform="translate(74,2) scale(0.55)"/>
        </>
      )}

      {/* ── WING NUBS ── small stubby side wings */}
      <path d="M24 68 Q14 60 18 50 Q26 62 24 68Z" fill={dark} opacity="0.85"/>
      <path d="M76 68 Q86 60 82 50 Q74 62 76 68Z" fill={dark} opacity="0.85"/>

      <style>{`
        @keyframes km-float  { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-7px)} }
        @keyframes km-bounce { from{transform:translateY(0) scale(1)} to{transform:translateY(-10px) scale(1.07)} }
        @keyframes km-sway   { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(-8deg)} 75%{transform:rotate(8deg)} }
        @keyframes km-shake  { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
      `}</style>
    </svg>
  );
}

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
        <div style={{ position:"absolute", left:-10, top:10, width:0, height:0,
          borderTop:"8px solid transparent", borderBottom:"8px solid transparent",
          borderRight:"10px solid rgba(255,255,255,.22)" }}/>
        <p style={{ color:"#fff", fontSize:"0.825rem", lineHeight:1.55, margin:0, fontFamily:"Inter,sans-serif", fontWeight:500 }}>
          {name ? messages[msgIdx].replace("Kia ora!", `Kia ora, ${name}!`) : messages[msgIdx]}
        </p>
      </div>
    </div>
  );
}

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
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:600, display:"flex", alignItems:"flex-end", gap:10,
      transform:`translateY(${ty}px)`, transition:"transform 0.5s cubic-bezier(.34,1.56,.64,1)" }}>
      <div style={{ background:"#0d1526", border:"2px solid #76AD25", borderRadius:"16px 16px 4px 16px",
        padding:"10px 16px", maxWidth:200, boxShadow:"0 8px 24px rgba(0,0,0,.4)" }}>
        <p style={{ color:"#fff", fontSize:"0.825rem", lineHeight:1.5, margin:0, fontFamily:"Inter,sans-serif", fontWeight:600 }}>{message}</p>
      </div>
      <KiwiMascot mood="celebrating" size={80} animate />
    </div>
  );
}

export function SadKiwiOverlay({ onDismiss, onLeave }: { onDismiss: () => void; onLeave?: () => void }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:800, background:"rgba(7,14,26,.92)", display:"flex",
      flexDirection:"column", alignItems:"center", justifyContent:"center", animation:"pw-fade-in .3s ease", fontFamily:"Inter,sans-serif" }}>
      <div style={{ animation:"pw-slide-up .4s ease", textAlign:"center" }}>
        <KiwiMascot mood="sad" size={130} animate />
        <h2 style={{ color:"#fff", fontWeight:900, fontSize:"1.5rem", marginTop:16, marginBottom:8 }}>Out of hearts!</h2>
        <p style={{ color:"#8b9dc3", fontSize:"0.9rem", marginBottom:28, lineHeight:1.6 }}>
          No worries — even the best investors make mistakes.<br/>Try this lesson again when you're ready.
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
