"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useGame } from "@/lib/gameContext";
import { ChevronRight, TrendingUp, Trophy, BookOpen, Zap, DollarSign, Home } from "lucide-react";

const FONT = "Inter, system-ui, sans-serif";

const SLIDES = [
  {
    title: "Welcome to PocketWise",
    subtitle: "NZ financial literacy for the real world",
    body: "PocketWise teaches you how money actually works — investing, property, debt, budgeting and more. You earn XP for every lesson, unlock new tools, and compete on the class leaderboard.",
    icon: "logo",
    color: "#76AD25",
    items: [
      { Icon: BookOpen, text: "Work through structured lessons aligned to NCEA Commerce" },
      { Icon: Zap, text: "Earn XP and level up as you learn" },
      { Icon: Trophy, text: "Compete with your class on the leaderboard" },
    ],
  },
  {
    title: "Your Virtual Finances",
    subtitle: "Start with $5,000 and grow your wealth",
    body: "You start with $5,000 in virtual cash. Get a job, invest in the NZX stock market, buy property, manage loans, and build a portfolio. Every decision teaches you something real.",
    icon: "finance",
    color: "#3B82F6",
    items: [
      { Icon: DollarSign, text: "Invest in real NZX-listed companies" },
      { Icon: Home, text: "Buy and rent out investment properties" },
      { Icon: TrendingUp, text: "Watch your net worth grow over time" },
    ],
  },
  {
    title: "You are ready",
    subtitle: "Start your first lesson now",
    body: "Your teacher has set up your class. Work through the modules, complete activities, and check back daily to keep your streak alive. Good luck — and remember, the best investment you can make is in your own knowledge.",
    icon: "ready",
    color: "#f59e0b",
    items: [
      { Icon: BookOpen, text: "Start with Module 1 in the Curriculum tab" },
      { Icon: Zap, text: "Complete activities for bonus XP" },
      { Icon: Trophy, text: "Check the Leaderboard to see your rank" },
    ],
  },
];

export default function OnboardingPage() {
  const [step, setStep]     = useState(0);
  const [exiting, setExit]  = useState(false);
  const { addBadge }        = useGame();
  const router              = useRouter();
  const slide = SLIDES[step];

  function next() {
    if (step < SLIDES.length - 1) {
      setExit(true);
      setTimeout(() => { setStep(s => s + 1); setExit(false); }, 250);
    } else {
      addBadge("onboarded");
      router.replace("/curriculum");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0d1526 0%, #0a1f38 50%, #0d1526 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: FONT, position: "relative", overflow: "hidden" }}>

      {/* Background particles */}
      {[...Array(12)].map((_, i) => (
        <div key={i} style={{ position: "fixed", left: `${(i * 29 + 5) % 100}%`, top: `${(i * 41 + 8) % 100}%`, width: 2, height: 2, borderRadius: "50%", background: slide.color, opacity: 0.2, animation: `pw-float ${2 + i % 3}s ease-in-out infinite`, animationDelay: `${i * 0.3}s`, pointerEvents: "none" }} />
      ))}

      {/* Step dots */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32, position: "relative", zIndex: 1 }}>
        {SLIDES.map((_, i) => (
          <div key={i} style={{ width: i === step ? 28 : 8, height: 8, borderRadius: 99, background: i <= step ? slide.color : "rgba(255,255,255,.12)", transition: "all .4s cubic-bezier(.34,1.56,.64,1)", boxShadow: i === step ? `0 0 12px ${slide.color}88` : "none" }} />
        ))}
      </div>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 480, position: "relative", zIndex: 1,
        opacity: exiting ? 0 : 1, transform: exiting ? "translateY(12px)" : "translateY(0)",
        transition: "opacity .25s ease, transform .25s ease",
      }}>
        {/* Icon area */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          {slide.icon === "logo" ? (
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 80, height: 80, borderRadius: 22, background: `${slide.color}18`, border: `2px solid ${slide.color}33`, marginBottom: 0 }}>
              <Image src="/logo.png" alt="PocketWise" width={52} height={52} style={{ objectFit: "contain", filter: "brightness(10)" }} />
            </div>
          ) : slide.icon === "finance" ? (
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 80, height: 80, borderRadius: 22, background: `${slide.color}18`, border: `2px solid ${slide.color}33` }}>
              <TrendingUp size={38} color={slide.color} />
            </div>
          ) : (
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 80, height: 80, borderRadius: 22, background: `${slide.color}18`, border: `2px solid ${slide.color}33` }}>
              <Trophy size={38} color={slide.color} />
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ background: "#111c30", border: `1.5px solid ${slide.color}25`, borderRadius: 20, padding: "28px 24px", animation: "pw-slide-up .4s ease" }}>
          <div style={{ fontSize: "0.7rem", color: slide.color, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: ".08em", marginBottom: 6 }}>{slide.subtitle}</div>
          <h1 style={{ color: "#fff", fontWeight: 900, fontSize: "1.4rem", marginBottom: 12, lineHeight: 1.2 }}>{slide.title}</h1>
          <p style={{ color: "#8b9dc3", fontSize: "0.875rem", lineHeight: 1.7, marginBottom: 22 }}>{slide.body}</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {slide.items.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 10, padding: "10px 14px", animation: `pw-slide-up .4s ease ${i * 0.08}s both` }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${slide.color}18`, border: `1px solid ${slide.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <item.Icon size={15} color={slide.color} />
                </div>
                <span style={{ color: "#c8d5e8", fontSize: "0.83rem", lineHeight: 1.4 }}>{item.text}</span>
              </div>
            ))}
          </div>

          <button onClick={next} style={{
            width: "100%", padding: "14px", borderRadius: 12,
            background: slide.color, color: "#fff", border: "none",
            fontWeight: 800, fontSize: "0.95rem", cursor: "pointer",
            fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: `0 5px 0 ${slide.color}88, 0 8px 20px ${slide.color}40`,
            transition: "transform .08s, box-shadow .08s",
          }}
            onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = `0 5px 0 ${slide.color}88`; }}>
            {step < SLIDES.length - 1 ? "Next" : "Get Started"} <ChevronRight size={18} />
          </button>

          {step > 0 && (
            <button onClick={() => { setExit(true); setTimeout(() => { setStep(s => s - 1); setExit(false); }, 250); }} style={{ width: "100%", marginTop: 10, padding: "10px", background: "none", border: "none", color: "#4a6a8a", fontSize: "0.82rem", cursor: "pointer", fontFamily: FONT }}>
              Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
