"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useGame } from "@/lib/gameContext";
import { ChevronRight, Zap, DollarSign, BookOpen, Trophy, Briefcase, Spade, Check } from "lucide-react";

const STEPS = [
  {
    id: "welcome",
    title: "Welcome to PocketWise",
    subtitle: "New Zealand's financial literacy platform",
    content: null,
  },
  {
    id: "what",
    title: "What is PocketWise?",
    subtitle: "A gamified financial education platform built for NZ students",
    content: null,
  },
  {
    id: "features",
    title: "Here's what you can do",
    subtitle: "Everything you need to master money",
    content: null,
  },
  {
    id: "xp",
    title: "How XP works",
    subtitle: "Earn XP to unlock more features",
    content: null,
  },
  {
    id: "ready",
    title: "You're all set",
    subtitle: "Your $5,000 virtual NZD is waiting",
    content: null,
  },
];

const FEATURES = [
  { Icon: BookOpen,  color: "#76AD25", bg: "#e8f5d0", title: "NCEA Curriculum",    desc: "20 modules aligned to Year 11-13 standards" },
  { Icon: DollarSign,color: "#3B82F6", bg: "#eff6ff", title: "Virtual Portfolio",  desc: "Buy stocks, property and assets with $5,000 NZD" },
  { Icon: Briefcase, color: "#f59e0b", bg: "#fffbeb", title: "Career Centre",      desc: "Apply for jobs and earn a weekly salary" },
  { Icon: Spade,     color: "#EF4444", bg: "#fef2f2", title: "Casino Simulator",   desc: "Learn why the house always wins" },
  { Icon: Trophy,    color: "#a78bfa", bg: "#faf5ff", title: "Leaderboard",        desc: "Compete with students across NZ" },
];

const XP_UNLOCKS = [
  { xp: 0,    label: "Start here",      desc: "Curriculum access, basic portfolio" },
  { xp: 100,  label: "Buy Stocks",      desc: "Invest in NZX companies" },
  { xp: 150,  label: "Buy Assets",      desc: "Cars, tech, equipment" },
  { xp: 300,  label: "Take Loans",      desc: "Borrow and manage debt" },
  { xp: 500,  label: "Day Trading",     desc: "Advanced trading tools" },
  { xp: 800,  label: "Property Market", desc: "Buy NZ houses and earn rent" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const { completeOnboarding, state } = useGame();
  const router = useRouter();

  function next() {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      completeOnboarding(name);
      router.replace("/curriculum");
    }
  }

  const currentStep = STEPS[step];
  const progress = ((step) / (STEPS.length - 1)) * 100;

  return (
    <div className="plus-grid" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1rem" }}>

      {/* Progress bar */}
      <div style={{ width: "100%", maxWidth: 560, marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{
              width: 28, height: 28, borderRadius: "50%",
              background: i <= step ? "#76AD25" : "rgba(255,255,255,.1)",
              border: `2px solid ${i <= step ? "#76AD25" : "rgba(255,255,255,.2)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all .3s",
            }}>
              {i < step
                ? <Check size={13} color="#fff" />
                : <span style={{ fontSize: "0.7rem", fontWeight: 700, color: i === step ? "#fff" : "#8b9dc3" }}>{i + 1}</span>
              }
            </div>
          ))}
        </div>
        <div style={{ background: "rgba(255,255,255,.1)", borderRadius: 99, height: 3 }}>
          <div style={{ background: "#76AD25", height: 3, borderRadius: 99, width: `${progress}%`, transition: "width .4s" }} />
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 560 }}>

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div style={{ textAlign: "center" }}>
            <Image src="/logo.png" alt="PocketWise" width={80} height={80} style={{ objectFit: "contain", marginBottom: 20, borderRadius: 12, background: "#fff", padding: 4 }} />
            <h1 style={{ fontWeight: 900, fontSize: "2.25rem", color: "#fff", marginBottom: 12, lineHeight: 1.1 }}>
              Welcome to<br /><span style={{ color: "#76AD25" }}>PocketWise</span>
            </h1>
            <p style={{ color: "#8b9dc3", fontSize: "1rem", lineHeight: 1.7, marginBottom: 32, maxWidth: 400, margin: "0 auto 32px" }}>
              New Zealand's gamified financial literacy platform. Learn real money skills while earning XP, building a portfolio, and competing with students across the country.
            </p>
            <div style={{ background: "rgba(118,173,37,.1)", border: "1px solid rgba(118,173,37,.3)", borderRadius: 12, padding: "16px 20px", marginBottom: 32, display: "inline-flex", alignItems: "center", gap: 12 }}>
              <DollarSign size={20} color="#76AD25" />
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.9rem" }}>Your starting balance</div>
                <div style={{ color: "#76AD25", fontWeight: 800, fontSize: "1.25rem" }}>$5,000.00 Virtual NZD</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 1 — What is PocketWise */}
        {step === 1 && (
          <div>
            <h2 style={{ fontWeight: 900, fontSize: "1.75rem", color: "#fff", marginBottom: 8, textAlign: "center" }}>
              {currentStep.title}
            </h2>
            <p style={{ color: "#8b9dc3", textAlign: "center", marginBottom: 28 }}>{currentStep.subtitle}</p>
            <div style={{ background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 16, padding: "24px", marginBottom: 16 }}>
              <p style={{ color: "#e2e8f0", fontSize: "0.925rem", lineHeight: 1.8, marginBottom: 16 }}>
                PocketWise is built around the NZ school curriculum. You complete lessons, earn XP, and unlock real financial simulations — stocks, property, jobs, and even a casino to learn why gambling is a bad idea.
              </p>
              <p style={{ color: "#e2e8f0", fontSize: "0.925rem", lineHeight: 1.8, marginBottom: 16 }}>
                Every dollar you earn, every stock you buy, and every loan you take is tracked in your virtual portfolio. Make good decisions and grow your wealth. Make bad ones and learn why.
              </p>
              <p style={{ color: "#8b9dc3", fontSize: "0.825rem", lineHeight: 1.7 }}>
                All content is aligned to NCEA Level 1, 2, and 3 Commerce standards — so what you learn here directly supports your assessments.
              </p>
            </div>
          </div>
        )}

        {/* Step 2 — Features */}
        {step === 2 && (
          <div>
            <h2 style={{ fontWeight: 900, fontSize: "1.75rem", color: "#fff", marginBottom: 8, textAlign: "center" }}>
              {currentStep.title}
            </h2>
            <p style={{ color: "#8b9dc3", textAlign: "center", marginBottom: 24 }}>{currentStep.subtitle}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {FEATURES.map(f => (
                <div key={f.title} style={{ background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: f.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <f.Icon size={19} color={f.color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.9rem" }}>{f.title}</div>
                    <div style={{ color: "#8b9dc3", fontSize: "0.8rem", marginTop: 2 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — XP system */}
        {step === 3 && (
          <div>
            <h2 style={{ fontWeight: 900, fontSize: "1.75rem", color: "#fff", marginBottom: 8, textAlign: "center" }}>
              {currentStep.title}
            </h2>
            <p style={{ color: "#8b9dc3", textAlign: "center", marginBottom: 24 }}>{currentStep.subtitle}</p>
            <div style={{ background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 16, padding: "20px", marginBottom: 16 }}>
              <p style={{ color: "#8b9dc3", fontSize: "0.825rem", marginBottom: 16 }}>
                Complete lessons to earn XP. More XP unlocks more features. Here is what each level unlocks:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {XP_UNLOCKS.map((u, i) => (
                  <div key={u.xp} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#111c30", borderRadius: 9, border: "1px solid #2a3a5c" }}>
                    <div style={{
                      width: 52, height: 24, borderRadius: 99,
                      background: i === 0 ? "rgba(118,173,37,.2)" : "rgba(245,158,11,.15)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Zap size={11} color={i === 0 ? "#76AD25" : "#f59e0b"} />
                        <span style={{ fontSize: "0.68rem", fontWeight: 800, color: i === 0 ? "#76AD25" : "#f59e0b" }}>
                          {u.xp === 0 ? "Free" : u.xp}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.825rem", color: "#fff" }}>{u.label}</div>
                      <div style={{ fontSize: "0.72rem", color: "#8b9dc3", marginTop: 1 }}>{u.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4 — Ready */}
        {step === 4 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "4rem", marginBottom: 16 }}>
              <Check size={64} color="#76AD25" style={{ margin: "0 auto", display: "block" }} />
            </div>
            <h2 style={{ fontWeight: 900, fontSize: "2rem", color: "#fff", marginBottom: 12 }}>
              {currentStep.title}
            </h2>
            <p style={{ color: "#8b9dc3", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: 32 }}>
              Your account is ready. Head to the curriculum to start your first lesson and earn your first XP.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
              {[
                { Icon: Zap,         val: "0 XP",    label: "Starting XP",     color: "#f59e0b" },
                { Icon: DollarSign,  val: "$5,000",  label: "Starting Balance", color: "#76AD25" },
                { Icon: Trophy,      val: "0",       label: "Badges Earned",    color: "#a78bfa" },
              ].map(s => (
                <div key={s.label} style={{ background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 12, padding: "16px 20px", textAlign: "center", minWidth: 120 }}>
                  <s.Icon size={18} color={s.color} style={{ margin: "0 auto 6px", display: "block" }} />
                  <div style={{ fontWeight: 800, fontSize: "1.1rem", color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: "0.72rem", color: "#8b9dc3", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: step === 0 ? "center" : "space-between", alignItems: "center", marginTop: 28 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={{
              background: "rgba(255,255,255,.08)", color: "#8b9dc3",
              border: "1px solid rgba(255,255,255,.15)", borderRadius: 10,
              padding: "12px 24px", fontWeight: 600, fontSize: "0.9rem",
              cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}>
              Back
            </button>
          )}
          <button onClick={next} style={{
            background: "#76AD25", color: "#fff",
            border: "none", borderRadius: 10,
            padding: "12px 32px", fontWeight: 700, fontSize: "0.9rem",
            cursor: "pointer", fontFamily: "Inter, sans-serif",
            display: "flex", alignItems: "center", gap: 8,
            minWidth: 160, justifyContent: "center",
          }}>
            {step === STEPS.length - 1 ? "Start Learning" : "Next"}
            {step < STEPS.length - 1 && <ChevronRight size={16} />}
          </button>
        </div>

        {/* Skip */}
        {step < STEPS.length - 1 && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button onClick={() => {
              completeOnboarding(name);
              router.replace("/curriculum");
            }} style={{ background: "none", border: "none", color: "#4a5a7a", fontSize: "0.78rem", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
              Skip tour
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
