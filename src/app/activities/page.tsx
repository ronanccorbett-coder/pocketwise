"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { useTheme } from "@/lib/theme";
import { useGame } from "@/lib/gameContext";
import Confetti from "@/components/Confetti";
import XPCounter from "@/components/XPCounter";
import {
  Zap, Check, X, ArrowRight, RefreshCw,
  TrendingUp, PiggyBank, Calculator, Globe,
  DollarSign, Target, BookOpen, Brain,
  ChevronRight, Star, Lock, Timer
} from "lucide-react";

const FONT = "Inter, system-ui, sans-serif";

// ── Activity definitions ──────────────────────────────────────────────────
type ActivityDef = {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  xpRequired: number;
  category: "knowledge" | "simulation" | "challenge" | "daily";
  estimatedMins: number;
  Icon: any;
  iconColor: string;
  iconBg: string;
  badge?: string;
  component: React.FC<{ onComplete: (xp: number) => void; onBack: () => void }>;
};

// ── Daily Budget Challenge ─────────────────────────────────────────────────
const BUDGET_SCENARIOS = [
  {
    name: "Aroha's First Flat",
    income: 650,
    items: [
      { label: "Rent (flatmates)", amount: 180, category: "Need", correct: "Need" },
      { label: "Spotify Premium", amount: 12, category: "Want", correct: "Want" },
      { label: "Groceries", amount: 90, category: "Need", correct: "Need" },
      { label: "KiwiSaver contribution", amount: 26, category: "Save", correct: "Save" },
      { label: "New sneakers", amount: 120, category: "Want", correct: "Want" },
      { label: "Power bill share", amount: 45, category: "Need", correct: "Need" },
      { label: "Emergency fund deposit", amount: 50, category: "Save", correct: "Save" },
      { label: "Eating out x3", amount: 75, category: "Want", correct: "Want" },
    ],
  },
  {
    name: "Tama's Weekend Job",
    income: 420,
    items: [
      { label: "Bus pass (monthly share)", amount: 55, category: "Need", correct: "Need" },
      { label: "Phone plan", amount: 35, category: "Need", correct: "Need" },
      { label: "Video game", amount: 89, category: "Want", correct: "Want" },
      { label: "Term deposit deposit", amount: 80, category: "Save", correct: "Save" },
      { label: "Haircut", amount: 25, category: "Need", correct: "Need" },
      { label: "Birthday gift for friend", amount: 40, category: "Want", correct: "Want" },
      { label: "Savings account", amount: 60, category: "Save", correct: "Save" },
    ],
  },
];

function BudgetChallenge({
  onComplete, onBack }: { onComplete: (xp: number) => void; onBack: () => void }) {

  const { isDark } = useTheme();
  const T = { bg: isDark?"#0d1526":"#f0f4f8", bg2: isDark?"#111c30":"#ffffff", bg3: isDark?"#1a2540":"#f8fafc", card: isDark?"#111c30":"#ffffff", text: isDark?"#ffffff":"#0d1526", text2: isDark?"#8b9dc3":"#475569", text3: isDark?"#4a6a8a":"#94a3b8", border: isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)", border2: isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.16)", input: isDark?"rgba(255,255,255,.06)":"#f8fafc", shadow: isDark?"rgba(0,0,0,.4)":"rgba(0,0,0,.08)", green: isDark?"#76AD25":"#5a9a1a", accent: isDark?"#f59e0b":"#d97706", strip: isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)" };
  const [scenario] = useState(() => BUDGET_SCENARIOS[Math.floor(Math.random() * BUDGET_SCENARIOS.length)]);
  const [answers, setAnswers] = useState({} as Record<number,string>);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);

  function assign(i: number, cat: string) {
    if (checked) return;
    setAnswers(a => ({ ...a, [i]: cat }));
  }

  function check() {
    let correct = 0;
    scenario.items.forEach((item, i) => {
      if (answers[i] === item.correct) correct++;
    });
    setScore(correct);
    setChecked(true);
  }

  const allAnswered = scenario.items.every((_, i) => answers[i]);
  const xpEarned = Math.round((score / scenario.items.length) * 75);

  const cats = ["Need", "Want", "Save"];
  const catColors: Record<string, string> = { Need: "#3B82F6", Want: "#EF4444", Save: "#76AD25" };
  const catBg: Record<string, string> = { Need: "rgba(59,130,246,.15)", Want: "rgba(239,68,68,.12)", Save: "rgba(118,173,37,.12)" };

  return (
    <div style={{ minHeight: "100vh", background: "#0a1628", fontFamily: FONT, paddingBottom: 100 }}>
      <div style={{ background: "rgba(10,22,40,.95)", borderBottom: `1px solid ${T.border}`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "rgba(128,128,128,.08)", border: `1px solid ${T.border2}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: T.text, display: "flex" }}>
          <X size={16} />
        </button>
        <div>
          <div style={{ fontSize: "0.7rem", color: "#76AD25", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Budget Challenge</div>
          <div style={{ fontWeight: 700, color: T.text, fontSize: "0.95rem" }}>{scenario.name}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
          <Zap size={14} color="#f59e0b" />
          <span style={{ fontWeight: 700, color: "#f59e0b", fontSize: "0.85rem" }}>75 XP</span>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ background: T.input, borderRadius: 14, padding: "16px 20px", marginBottom: 24, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: "0.72rem", color: T.text2, marginBottom: 4 }}>Weekly take-home income</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#76AD25" }}>${scenario.income}</div>
          <div style={{ fontSize: "0.78rem", color: T.text2, marginTop: 4 }}>Drag each expense into the right category: Need, Want, or Save</div>
        </div>

        {/* Category totals */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {cats.map(cat => {
            const total = scenario.items.reduce((s, item, i) => answers[i] === cat ? s + item.amount : s, 0);
            const pct = Math.round((total / scenario.income) * 100);
            return (
              <div key={cat} style={{ flex: 1, background: catBg[cat], border: `1px solid ${catColors[cat]}30`, borderRadius: 10, padding: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "0.65rem", color: catColors[cat], fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>{cat}</div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: T.text }}>${total}</div>
                <div style={{ fontSize: "0.65rem", color: T.text2 }}>{pct}%</div>
              </div>
            );
          })}
        </div>

        {/* Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {scenario.items.map((item, i) => {
            const isCorrect = checked && answers[i] === item.correct;
            const isWrong = checked && answers[i] !== item.correct;
            return (
              <div key={i} style={{ background: isCorrect ? "rgba(118,173,37,.1)" : isWrong ? "rgba(239,68,68,.08)" : "rgba(255,255,255,.05)", border: `1px solid ${isCorrect ? "rgba(118,173,37,.3)" : isWrong ? "rgba(239,68,68,.2)" : "rgba(255,255,255,.08)"}`, borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600, color: T.text }}>{item.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#f59e0b" }}>${item.amount}</span>
                    {checked && (isCorrect ? <Check size={16} color="#76AD25" /> : <X size={16} color="#EF4444" />)}
                    {checked && isWrong && <span style={{ fontSize: "0.7rem", color: "#EF4444" }}>→ {item.correct}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {cats.map(cat => (
                    <button key={cat} onClick={() => assign(i, cat)} style={{
                      flex: 1, padding: "6px", borderRadius: 7, border: `1px solid ${answers[i] === cat ? catColors[cat] : "rgba(255,255,255,.1)"}`,
                      background: answers[i] === cat ? catBg[cat] : "transparent",
                      color: answers[i] === cat ? catColors[cat] : T.text2,
                      fontWeight: 700, fontSize: "0.72rem", cursor: checked ? "default" : "pointer", fontFamily: FONT,
                      transition: "all .12s",
                    }}>{cat}</button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {!checked ? (
          <button
            onClick={check}
            disabled={!allAnswered}
            style={{
              width: "100%", padding: "14px", borderRadius: 12,
              background: allAnswered ? "#76AD25" : "rgba(255,255,255,.08)",
              color: allAnswered ? "#fff" : T.text3,
              border: "none", fontWeight: 800, fontSize: "0.95rem",
              cursor: allAnswered ? "pointer" : "not-allowed", fontFamily: FONT,
              transition: "all .15s",
            }}>
            {allAnswered ? "Check Answers" : `${Object.keys(answers).length}/${scenario.items.length} categorised`}
          </button>
        ) : (
          <div style={{ background: "rgba(118,173,37,.1)", border: "1px solid rgba(118,173,37,.3)", borderRadius: 14, padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: 6 }}>
              {score === scenario.items.length ? "🎉" : score >= scenario.items.length * 0.7 ? "👍" : "📚"}
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: T.text, marginBottom: 4 }}>
              {score}/{scenario.items.length} correct
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 16 }}>
              <Zap size={15} color="#f59e0b" />
              <span style={{ fontWeight: 800, color: "#f59e0b", fontSize: "1rem" }}>+{xpEarned} XP</span>
            </div>
            <button
              onClick={() => onComplete(xpEarned)}
              style={{
                padding: "10px 28px", borderRadius: 10, background: "#76AD25",
                color: T.text, border: "none", fontWeight: 800, fontSize: "0.9rem",
                cursor: "pointer", fontFamily: FONT,
              }}>
              Collect XP <ArrowRight size={14} style={{ display: "inline", verticalAlign: "middle" }} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Interest Rate Quiz ─────────────────────────────────────────────────────
const INTEREST_QUESTIONS = [
  {
    q: "You borrow $1,000 at 5% annual interest. How much interest do you owe after 1 year?",
    options: ["$5", "$50", "$500", "$150"],
    answer: 1,
    explanation: "5% of $1,000 = $50. Interest = Principal × Rate × Time.",
  },
  {
    q: "What does 'compound interest' mean?",
    options: [
      "Interest only on the original amount",
      "Interest on both principal and previously earned interest",
      "A fixed fee charged each month",
      "Interest that decreases over time",
    ],
    answer: 1,
    explanation: "Compound interest grows faster because you earn interest on your interest too — that's why starting to save early matters so much.",
  },
  {
    q: "You invest $500 at 10% compound interest. After 2 years, you have approximately:",
    options: ["$550", "$600", "$605", "$650"],
    answer: 2,
    explanation: "Year 1: $500 × 1.10 = $550. Year 2: $550 × 1.10 = $605. Compounding adds that extra $5.",
  },
  {
    q: "Which is better for a borrower?",
    options: [
      "Simple interest",
      "Compound interest",
      "They're always the same",
      "It depends on the term",
    ],
    answer: 0,
    explanation: "Simple interest is cheaper for borrowers — you only pay interest on the original amount, not on accumulated interest.",
  },
  {
    q: "The Rule of 72 says your money doubles when you divide 72 by the interest rate. At 6% annually, money doubles in roughly:",
    options: ["6 years", "10 years", "12 years", "18 years"],
    answer: 2,
    explanation: "72 ÷ 6 = 12 years. This is a handy mental maths shortcut for estimating investment growth.",
  },
];

function InterestQuiz({ onComplete, onBack }: { onComplete: (xp: number) => void; onBack: () => void }) {
  const { isDark } = useTheme();
  const T = { bg: isDark?"#0d1526":"#f0f4f8", card: isDark?"#111c30":"#ffffff", text: isDark?"#ffffff":"#0d1526", text2: isDark?"#8b9dc3":"#475569", text3: isDark?"#4a6a8a":"#94a3b8", border: isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)", border2: isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.16)", input: isDark?"rgba(255,255,255,.06)":"#f8fafc" };
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = INTEREST_QUESTIONS[current];

  function pick(i: number) {
    if (selected !== null) return;
    setSelected(i);
    if (i === q.answer) setScore(s => s + 1);
  }

  function next() {
    if (current + 1 >= INTEREST_QUESTIONS.length) {
      setDone(true);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
    }
  }

  const xpEarned = Math.round((score / INTEREST_QUESTIONS.length) * 80);

  if (done) return (
    <div style={{ minHeight: "100vh", background: "#0a1628", fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: 32 }}>
        <div style={{ fontSize: "3rem", marginBottom: 12 }}>
          {score >= 4 ? "🏆" : score >= 3 ? "⭐" : "📖"}
        </div>
        <div style={{ fontSize: "1.4rem", fontWeight: 900, color: T.text, marginBottom: 6 }}>
          {score}/{INTEREST_QUESTIONS.length} correct
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 24 }}>
          <Zap size={16} color="#f59e0b" />
          <span style={{ fontWeight: 800, color: "#f59e0b", fontSize: "1.1rem" }}>+{xpEarned} XP</span>
        </div>
        <button onClick={() => onComplete(xpEarned)} style={{ padding: "12px 32px", borderRadius: 12, background: "#76AD25", color: T.text, border: "none", fontWeight: 800, fontSize: "1rem", cursor: "pointer", fontFamily: FONT }}>
          Collect XP
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a1628", fontFamily: FONT, paddingBottom: 100 }}>
      <div style={{ background: "rgba(10,22,40,.95)", borderBottom: `1px solid ${T.border}`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "rgba(128,128,128,.08)", border: `1px solid ${T.border2}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: T.text, display: "flex" }}>
          <X size={16} />
        </button>
        <div>
          <div style={{ fontSize: "0.7rem", color: "#3B82F6", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Knowledge Quiz</div>
          <div style={{ fontWeight: 700, color: T.text, fontSize: "0.95rem" }}>Interest Rates</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: "0.8rem", color: T.text2 }}>{current + 1} / {INTEREST_QUESTIONS.length}</div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: "rgba(255,255,255,.08)" }}>
        <div style={{ height: 4, width: `${((current + 1) / INTEREST_QUESTIONS.length) * 100}%`, background: "#3B82F6", transition: "width .4s ease" }} />
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ fontWeight: 800, fontSize: "1.1rem", color: T.text, lineHeight: 1.5, marginBottom: 28 }}>{q.q}</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {q.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = selected !== null && i === q.answer;
            const isWrong = isSelected && i !== q.answer;
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                style={{
                  textAlign: "left", padding: "14px 16px", borderRadius: 12,
                  background: isCorrect ? "rgba(118,173,37,.15)" : isWrong ? "rgba(239,68,68,.1)" : isSelected ? "rgba(59,130,246,.1)" : "rgba(255,255,255,.05)",
                  border: `1.5px solid ${isCorrect ? "#76AD25" : isWrong ? "#EF4444" : isSelected ? "#3B82F6" : "rgba(255,255,255,.1)"}`,
                  color: T.text, fontWeight: 600, fontSize: "0.9rem",
                  cursor: selected !== null ? "default" : "pointer", fontFamily: FONT,
                  transition: "all .12s",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                <span>{opt}</span>
                {isCorrect && <Check size={16} color="#76AD25" />}
                {isWrong && <X size={16} color="#EF4444" />}
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <div style={{ marginTop: 16, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: "0.78rem", color: T.text2, lineHeight: 1.6 }}>{q.explanation}</div>
            <button
              onClick={next}
              style={{
                marginTop: 12, padding: "8px 20px", borderRadius: 9, background: "#3B82F6",
                color: T.text, border: "none", fontWeight: 700, fontSize: "0.85rem",
                cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", gap: 6,
              }}>
              {current + 1 >= INTEREST_QUESTIONS.length ? "See Results" : "Next Question"} <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Savings Simulator ─────────────────────────────────────────────────────
function SavingsSimulator({ onComplete, onBack }: { onComplete: (xp: number) => void; onBack: () => void }) {
  const { isDark } = useTheme();
  const T = { bg: isDark?"#0d1526":"#f0f4f8", card: isDark?"#111c30":"#ffffff", text: isDark?"#ffffff":"#0d1526", text2: isDark?"#8b9dc3":"#475569", text3: isDark?"#4a6a8a":"#94a3b8", border: isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)", border2: isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.16)", input: isDark?"rgba(255,255,255,.06)":"#f8fafc" };
  const [weekly, setWeekly] = useState(20);
  const [rate, setRate] = useState(5);
  const [years, setYears] = useState(5);
  const [done, setDone] = useState(false);

  const annualContrib = weekly * 52;
  const r = rate / 100;
  let balance = 0;
  for (let y = 0; y < years; y++) {
    balance = (balance + annualContrib) * (1 + r);
  }
  const totalContrib = annualContrib * years;
  const interestEarned = balance - totalContrib;

  return (
    <div style={{ minHeight: "100vh", background: "#0a1628", fontFamily: FONT, paddingBottom: 100 }}>
      <div style={{ background: "rgba(10,22,40,.95)", borderBottom: `1px solid ${T.border}`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "rgba(128,128,128,.08)", border: `1px solid ${T.border2}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: T.text, display: "flex" }}>
          <X size={16} />
        </button>
        <div>
          <div style={{ fontSize: "0.7rem", color: "#76AD25", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Simulation</div>
          <div style={{ fontWeight: 700, color: T.text, fontSize: "0.95rem" }}>Savings Calculator</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
          <Zap size={14} color="#f59e0b" />
          <span style={{ fontWeight: 700, color: "#f59e0b", fontSize: "0.85rem" }}>60 XP</span>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "28px 20px" }}>
        {/* Result card */}
        <div style={{ background: "linear-gradient(135deg, rgba(118,173,37,.15), rgba(34,197,94,.08))", border: "1px solid rgba(118,173,37,.3)", borderRadius: 16, padding: "24px", marginBottom: 28, textAlign: "center" }}>
          <div style={{ fontSize: "0.72rem", color: "#76AD25", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>After {years} year{years !== 1 ? "s" : ""}</div>
          <div style={{ fontSize: "2.5rem", fontWeight: 900, color: T.text, lineHeight: 1 }}>
            ${Math.round(balance).toLocaleString()}
          </div>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 14 }}>
            <div>
              <div style={{ fontSize: "0.65rem", color: T.text2, marginBottom: 2 }}>You put in</div>
              <div style={{ fontWeight: 800, color: "#3B82F6" }}>${totalContrib.toLocaleString()}</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,.1)" }} />
            <div>
              <div style={{ fontSize: "0.65rem", color: T.text2, marginBottom: 2 }}>Interest earned</div>
              <div style={{ fontWeight: 800, color: "#76AD25" }}>${Math.round(interestEarned).toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Sliders */}
        {[
          { label: "Weekly savings", value: weekly, min: 5, max: 200, step: 5, set: setWeekly, format: (v: number) => `$${v}` },
          { label: "Annual interest rate", value: rate, min: 1, max: 15, step: 0.5, set: setRate, format: (v: number) => `${v}%` },
          { label: "Years", value: years, min: 1, max: 40, step: 1, set: setYears, format: (v: number) => `${v} yr${v !== 1 ? "s" : ""}` },
        ].map(({ label, value, min, max, step, set, format }) => (
          <div key={label} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: "0.825rem", color: T.text2, fontWeight: 600 }}>{label}</span>
              <span style={{ fontSize: "0.825rem", fontWeight: 800, color: T.text }}>{format(value)}</span>
            </div>
            <input
              type="range" min={min} max={max} step={step} value={value}
              onChange={e => set(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#76AD25" }}
            />
          </div>
        ))}

        {!done ? (
          <button
            onClick={() => { setDone(true); onComplete(60); }}
            style={{ width: "100%", padding: "14px", borderRadius: 12, background: "#76AD25", color: T.text, border: "none", fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", fontFamily: FONT }}>
            Complete Simulation <ArrowRight size={14} style={{ display: "inline", verticalAlign: "middle" }} />
          </button>
        ) : (
          <div style={{ textAlign: "center", padding: "12px", color: "#76AD25", fontWeight: 700 }}>✓ XP collected!</div>
        )}
      </div>
    </div>
  );
}

// ── Tax Basics Quiz ────────────────────────────────────────────────────────
const TAX_QUESTIONS = [
  {
    q: "In New Zealand, what is the tax rate on income between $14,001 and $48,000?",
    options: ["10.5%", "17.5%", "30%", "33%"],
    answer: 1,
    explanation: "NZ income between $14,001–$48,000 is taxed at 17.5%. The first $14,000 is taxed at 10.5%.",
  },
  {
    q: "What does 'PAYE' stand for?",
    options: ["Pay As You Earn", "Personal Annual Yearly Earnings", "Public Account Year End", "Pre-Approved Yearly Estimate"],
    answer: 0,
    explanation: "PAYE (Pay As You Earn) means tax is automatically deducted from your wages by your employer before you receive your pay.",
  },
  {
    q: "What is GST in New Zealand?",
    options: ["Government Savings Tax", "Goods and Services Tax at 15%", "General Sales Tax at 10%", "Gross Salary Tax"],
    answer: 1,
    explanation: "GST is a 15% tax added to most goods and services in NZ. It's included in the price you pay at the register.",
  },
  {
    q: "KiwiSaver contributions from your employer are:",
    options: [
      "Optional for employers",
      "At least 3% of your gross salary",
      "Taken from your existing pay",
      "Only available to those under 25",
    ],
    answer: 1,
    explanation: "Employers must contribute at least 3% of your gross pay to KiwiSaver — this is on top of your own contribution, not from it.",
  },
];

function TaxQuiz({ onComplete, onBack }: { onComplete: (xp: number) => void; onBack: () => void }) {
  const { isDark } = useTheme();
  const T = { bg: isDark?"#0d1526":"#f0f4f8", card: isDark?"#111c30":"#ffffff", text: isDark?"#ffffff":"#0d1526", text2: isDark?"#8b9dc3":"#475569", text3: isDark?"#4a6a8a":"#94a3b8", border: isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)", border2: isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.16)", input: isDark?"rgba(255,255,255,.06)":"#f8fafc" };
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = TAX_QUESTIONS[current];

  function pick(i: number) {
    if (selected !== null) return;
    setSelected(i);
    if (i === q.answer) setScore(s => s + 1);
  }

  function next() {
    if (current + 1 >= TAX_QUESTIONS.length) setDone(true);
    else { setCurrent(c => c + 1); setSelected(null); }
  }

  const xpEarned = Math.round((score / TAX_QUESTIONS.length) * 70);

  if (done) return (
    <div style={{ minHeight: "100vh", background: "#0a1628", fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: 32 }}>
        <div style={{ fontSize: "3rem", marginBottom: 12 }}>{score >= 3 ? "🎉" : "📚"}</div>
        <div style={{ fontSize: "1.4rem", fontWeight: 900, color: T.text, marginBottom: 6 }}>{score}/{TAX_QUESTIONS.length} correct</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 24 }}>
          <Zap size={16} color="#f59e0b" />
          <span style={{ fontWeight: 800, color: "#f59e0b", fontSize: "1.1rem" }}>+{xpEarned} XP</span>
        </div>
        <button onClick={() => onComplete(xpEarned)} style={{ padding: "12px 32px", borderRadius: 12, background: "#76AD25", color: T.text, border: "none", fontWeight: 800, fontSize: "1rem", cursor: "pointer", fontFamily: FONT }}>
          Collect XP
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a1628", fontFamily: FONT, paddingBottom: 100 }}>
      <div style={{ background: "rgba(10,22,40,.95)", borderBottom: `1px solid ${T.border}`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "rgba(128,128,128,.08)", border: `1px solid ${T.border2}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: T.text, display: "flex" }}>
          <X size={16} />
        </button>
        <div>
          <div style={{ fontSize: "0.7rem", color: "#a78bfa", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Knowledge Quiz</div>
          <div style={{ fontWeight: 700, color: T.text, fontSize: "0.95rem" }}>Tax & KiwiSaver Basics</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: "0.8rem", color: T.text2 }}>{current + 1} / {TAX_QUESTIONS.length}</div>
      </div>
      <div style={{ height: 4, background: "rgba(255,255,255,.08)" }}>
        <div style={{ height: 4, width: `${((current + 1) / TAX_QUESTIONS.length) * 100}%`, background: "#a78bfa", transition: "width .4s ease" }} />
      </div>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ fontWeight: 800, fontSize: "1.1rem", color: T.text, lineHeight: 1.5, marginBottom: 28 }}>{q.q}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {q.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = selected !== null && i === q.answer;
            const isWrong = isSelected && i !== q.answer;
            return (
              <button key={i} onClick={() => pick(i)} style={{
                textAlign: "left", padding: "14px 16px", borderRadius: 12,
                background: isCorrect ? "rgba(118,173,37,.15)" : isWrong ? "rgba(239,68,68,.1)" : "rgba(255,255,255,.05)",
                border: `1.5px solid ${isCorrect ? "#76AD25" : isWrong ? "#EF4444" : "rgba(255,255,255,.1)"}`,
                color: T.text, fontWeight: 600, fontSize: "0.9rem",
                cursor: selected !== null ? "default" : "pointer", fontFamily: FONT,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span>{opt}</span>
                {isCorrect && <Check size={16} color="#76AD25" />}
                {isWrong && <X size={16} color="#EF4444" />}
              </button>
            );
          })}
        </div>
        {selected !== null && (
          <div style={{ marginTop: 16, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: "0.78rem", color: T.text2, lineHeight: 1.6 }}>{q.explanation}</div>
            <button onClick={next} style={{ marginTop: 12, padding: "8px 20px", borderRadius: 9, background: "#a78bfa", color: T.text, border: "none", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", gap: 6 }}>
              {current + 1 >= TAX_QUESTIONS.length ? "See Results" : "Next Question"} <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── XP Celebration ─────────────────────────────────────────────────────────
function XPCelebration({ xp, onDone }: { xp: number; onDone: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0a1628", fontFamily: FONT, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <Confetti active={true} />
      <div style={{ fontSize: "3.5rem" }}>🎉</div>
      <div style={{ fontSize: "1.5rem", fontWeight: 900, color: T.text }}>Activity Complete!</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Zap size={24} color="#f59e0b" fill="#f59e0b" />
        <span style={{ fontSize: "2rem", fontWeight: 900, color: "#f59e0b" }}>+{xp} XP</span>
      </div>
      <XPCounter target={xp} />
      <button
        onClick={onDone}
        style={{ marginTop: 12, padding: "12px 32px", borderRadius: 12, background: "#76AD25", color: T.text, border: "none", fontWeight: 800, fontSize: "1rem", cursor: "pointer", fontFamily: FONT }}>
        Back to Activities
      </button>
    </div>
  );
}

// ── Activity registry ──────────────────────────────────────────────────────
const CAT_LABELS: Record<string, string> = {
  all: "All",
  daily: "Daily",
  knowledge: "Knowledge",
  simulation: "Simulation",
  challenge: "Challenge",
};

const ACTIVITIES: ActivityDef[] = [
  {
    id: "budget-challenge",
    title: "Budget Challenge",
    description: "Categorise a weekly budget into Needs, Wants, and Savings. Can you nail the 50/30/20 rule?",
    xpReward: 75,
    xpRequired: 0,
    category: "daily",
    estimatedMins: 5,
    Icon: PiggyBank,
    iconColor: "#76AD25",
    iconBg: "rgba(118,173,37,.12)",
    badge: "Daily",
    component: BudgetChallenge,
  },
  {
    id: "interest-quiz",
    title: "Interest Rates Quiz",
    description: "Test your knowledge of simple vs compound interest, the Rule of 72, and how interest affects your savings.",
    xpReward: 80,
    xpRequired: 0,
    category: "knowledge",
    estimatedMins: 7,
    Icon: TrendingUp,
    iconColor: "#3B82F6",
    iconBg: "rgba(59,130,246,.12)",
    badge: "Hot",
    component: InterestQuiz,
  },
  {
    id: "savings-simulator",
    title: "Savings Simulator",
    description: "Tweak weekly contributions, interest rates, and time to see how compound growth works in real numbers.",
    xpReward: 60,
    xpRequired: 0,
    category: "simulation",
    estimatedMins: 8,
    Icon: Calculator,
    iconColor: "#10b981",
    iconBg: "rgba(16,185,129,.12)",
    component: SavingsSimulator,
  },
  {
    id: "tax-quiz",
    title: "Tax & KiwiSaver Basics",
    description: "Learn NZ tax brackets, PAYE, GST, and how KiwiSaver employer contributions work.",
    xpReward: 70,
    xpRequired: 50,
    category: "knowledge",
    estimatedMins: 6,
    Icon: BookOpen,
    iconColor: "#a78bfa",
    iconBg: "rgba(167,139,250,.12)",
    component: TaxQuiz,
  },
  {
    id: "global-economy",
    title: "Global Economy Challenge",
    description: "Explore exchange rates, inflation, and how international events affect your wallet.",
    xpReward: 100,
    xpRequired: 150,
    category: "challenge",
    estimatedMins: 12,
    Icon: Globe,
    iconColor: "#f59e0b",
    iconBg: "rgba(245,158,11,.12)",
    badge: "New",
    component: ({ onBack }) => (
      <div style={{ minHeight: "100vh", background: "#0a1628", fontFamily: FONT, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <Brain size={48} color="#f59e0b" />
        <div style={{ color: T.text, fontWeight: 800, fontSize: "1.2rem" }}>Coming Soon</div>
        <div style={{ color: T.text2, fontSize: "0.875rem" }}>This activity is being built</div>
        <button onClick={onBack} style={{ marginTop: 8, padding: "10px 24px", borderRadius: 10, background: "rgba(255,255,255,.08)", color: T.text, border: "1px solid rgba(255,255,255,.15)", fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Go Back</button>
      </div>
    ),
  },
  {
    id: "goal-setter",
    title: "Financial Goal Setter",
    description: "Set a savings goal, break it into weekly targets, and learn about prioritising short vs long-term goals.",
    xpReward: 90,
    xpRequired: 200,
    category: "simulation",
    estimatedMins: 10,
    Icon: Target,
    iconColor: "#EF4444",
    iconBg: "rgba(239,68,68,.12)",
    component: ({ onBack }) => (
      <div style={{ minHeight: "100vh", background: "#0a1628", fontFamily: FONT, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <Target size={48} color="#EF4444" />
        <div style={{ color: T.text, fontWeight: 800, fontSize: "1.2rem" }}>Coming Soon</div>
        <div style={{ color: T.text2, fontSize: "0.875rem" }}>Unlock at 200 XP</div>
        <button onClick={onBack} style={{ marginTop: 8, padding: "10px 24px", borderRadius: 10, background: "rgba(255,255,255,.08)", color: T.text, border: "1px solid rgba(255,255,255,.15)", fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Go Back</button>
      </div>
    ),
  },
];

// ── Main page ──────────────────────────────────────────────────────────────
export default function ActivitiesPage() {
  const { isDark } = useTheme();
  const T = { bg: isDark?"#0d1526":"#f0f4f8", bg2: isDark?"#111c30":"#ffffff", bg3: isDark?"#1a2540":"#f8fafc", card: isDark?"#111c30":"#ffffff", text: isDark?"#ffffff":"#0d1526", text2: isDark?"#8b9dc3":"#475569", text3: isDark?"#4a6a8a":"#94a3b8", border: isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)", border2: isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.16)", input: isDark?"rgba(255,255,255,.06)":"#f8fafc", shadow: isDark?"rgba(0,0,0,.4)":"rgba(0,0,0,.08)", green: isDark?"#76AD25":"#5a9a1a", accent: isDark?"#f59e0b":"#d97706", strip: isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)" };

  const [filter, setFilter] = useState("all");
  const [activeActivity, setActiveActivity] = useState(null as ActivityDef | null);
  const [celebration, setCelebration] = useState<number | null>(null);
  const { state, addXp } = useGame();
  const xp = state?.xp ?? 0;

  function handleComplete(earnedXp: number) {
    addXp(earnedXp);
    setActiveActivity(null);
    setCelebration(earnedXp);
  }

  if (celebration !== null) return (
    <XPCelebration xp={celebration} onDone={() => setCelebration(null)} />
  );

  if (activeActivity) return (
    <activeActivity.component
      onComplete={handleComplete}
      onBack={() => setActiveActivity(null)}
    />
  );

  const filtered = filter === "all" ? ACTIVITIES : ACTIVITIES.filter(a => a.category === filter);

  return (
    <AuthGuard>
      <div style={{ minHeight: "100vh", background: T.bg }}>
        <Nav />

        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg, #0d1526, #111c30)", padding: "28px 1.5rem" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <Star size={22} color="#f59e0b" fill="#f59e0b" />
              <h1 style={{ fontWeight: 900, fontSize: "1.4rem", color: T.text, fontFamily: FONT }}>Activities</h1>
            </div>
            <p style={{ color: T.text2, fontSize: "0.875rem", marginBottom: 18, fontFamily: FONT }}>Earn XP through quizzes, simulations, and daily challenges</p>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ background: "rgba(245,158,11,.15)", border: "1px solid rgba(245,158,11,.25)", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 6 }}>
                <Zap size={15} color="#f59e0b" />
                <div>
                  <div style={{ fontSize: "0.65rem", color: "#f59e0b", fontWeight: 700, textTransform: "uppercase" }}>Your XP</div>
                  <div style={{ fontWeight: 900, color: T.text, fontSize: "1rem", fontFamily: FONT }}>{xp.toLocaleString()}</div>
                </div>
              </div>
              <div style={{ background: "rgba(128,128,128,.08)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 6 }}>
                <Star size={15} color="#a78bfa" />
                <div>
                  <div style={{ fontSize: "0.65rem", color: "#a78bfa", fontWeight: 700, textTransform: "uppercase" }}>Activities</div>
                  <div style={{ fontWeight: 900, color: T.text, fontSize: "1rem", fontFamily: FONT }}>{ACTIVITIES.length} available</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 1.5rem" }}>
          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
            {Object.entries(CAT_LABELS).map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)} style={{
                padding: "6px 16px", borderRadius: 9999,
                background: filter === key ? T.bg : "#fff",
                color: filter === key ? "#fff" : T.text2,
                border: `1px solid ${filter === key ? T.bg : "#e2e8f0"}`,
                fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", fontFamily: FONT,
                transition: "all .12s",
              }}>{label}</button>
            ))}
          </div>

          {/* Activity grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {filtered.map(activity => {
              const locked = xp < activity.xpRequired;
              const Icon = activity.Icon;
              return (
                <div key={activity.id} style={{
                  background: T.card, border: `1.5px solid ${locked ? T.bg3 : "#e2e8f0"}`,
                  borderRadius: 16, padding: "20px", opacity: locked ? 0.65 : 1,
                  display: "flex", flexDirection: "column", gap: 0,
                  transition: "transform .15s, box-shadow .15s",
                  cursor: locked ? "not-allowed" : "pointer",
                  boxShadow: "0 1px 4px rgba(0,0,0,.05)",
                }}
                  onMouseEnter={e => { if (!locked) { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,.1)"; } }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,.05)"; }}
                  onClick={() => !locked && setActiveActivity(activity)}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 12, background: activity.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {locked ? <Lock size={20} color={T.text3} /> : <Icon size={22} color={activity.iconColor} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <h3 style={{ fontWeight: 700, fontSize: "0.9rem", color: T.text, fontFamily: FONT }}>{activity.title}</h3>
                        {activity.badge && !locked && (
                          <span style={{ background: activity.badge === "Daily" ? "#e8f5d0" : activity.badge === "Hot" ? "#fef2f2" : "#f0f9ff", color: activity.badge === "Daily" ? "#5d8a1c" : activity.badge === "Hot" ? "#ef4444" : "#0284c7", padding: "1px 7px", borderRadius: 99, fontSize: "0.62rem", fontWeight: 700 }}>
                            {activity.badge}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <Zap size={12} color="#f59e0b" />
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f59e0b" }}>Up to {activity.xpReward} XP</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <Timer size={11} color={T.text3} />
                          <span style={{ fontSize: "0.72rem", color: T.text3 }}>{activity.estimatedMins} min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: "0.8rem", color: T.text2, lineHeight: 1.6, flex: 1, fontFamily: FONT, marginBottom: 14 }}>
                    {activity.description}
                  </p>
                  {locked ? (
                    <div style={{ background: T.bg3, borderRadius: 8, padding: "8px 12px", fontSize: "0.75rem", color: T.text3, display: "flex", alignItems: "center", gap: 4 }}>
                      <Lock size={11} /> Requires {activity.xpRequired} XP to unlock
                    </div>
                  ) : (
                    <button style={{ width: "100%", padding: "10px", background: activity.iconBg, color: activity.iconColor, border: `1px solid ${activity.iconColor}30`, borderRadius: 9, fontWeight: 700, fontSize: "0.825rem", cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      Start Activity <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
