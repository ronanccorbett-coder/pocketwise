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
  {
    name: "Mia's Uni Life",
    income: 560,
    items: [
      { label: "Student loan repayment", amount: 0, category: "Need", correct: "Need" },
      { label: "Hall of residence share", amount: 220, category: "Need", correct: "Need" },
      { label: "Netflix & Disney+", amount: 28, category: "Want", correct: "Want" },
      { label: "Textbooks", amount: 85, category: "Need", correct: "Need" },
      { label: "KiwiSaver 3% contribution", amount: 17, category: "Save", correct: "Save" },
      { label: "Takeaways (4x/week)", amount: 120, category: "Want", correct: "Want" },
      { label: "High-interest savings account", amount: 50, category: "Save", correct: "Save" },
      { label: "Clothing", amount: 65, category: "Want", correct: "Want" },
    ],
  },
  {
    name: "Hemi's Trade Apprentice",
    income: 780,
    items: [
      { label: "Car loan repayment", amount: 85, category: "Need", correct: "Need" },
      { label: "Petrol", amount: 70, category: "Need", correct: "Need" },
      { label: "Rent (family home)", amount: 150, category: "Need", correct: "Need" },
      { label: "Tools for work", amount: 40, category: "Need", correct: "Need" },
      { label: "Sky Sport subscription", amount: 49, category: "Want", correct: "Want" },
      { label: "Emergency fund", amount: 100, category: "Save", correct: "Save" },
      { label: "Gym membership", amount: 35, category: "Want", correct: "Want" },
      { label: "House deposit savings", amount: 150, category: "Save", correct: "Save" },
    ],
  },
  {
    name: "Lena's Café Shifts",
    income: 490,
    items: [
      { label: "Rent share (3 flatmates)", amount: 160, category: "Need", correct: "Need" },
      { label: "Groceries", amount: 70, category: "Need", correct: "Need" },
      { label: "Afterpay purchase", amount: 55, category: "Want", correct: "Want" },
      { label: "Internet share", amount: 20, category: "Need", correct: "Need" },
      { label: "Savings account", amount: 80, category: "Save", correct: "Save" },
      { label: "Concert tickets", amount: 95, category: "Want", correct: "Want" },
      { label: "Phone plan", amount: 30, category: "Need", correct: "Need" },
    ],
  },
  {
    name: "James's Remote Work",
    income: 1200,
    items: [
      { label: "Mortgage repayment", amount: 380, category: "Need", correct: "Need" },
      { label: "Power & internet", amount: 90, category: "Need", correct: "Need" },
      { label: "Investment portfolio", amount: 200, category: "Save", correct: "Save" },
      { label: "Groceries (family)", amount: 180, category: "Need", correct: "Need" },
      { label: "Dining out (weekly)", amount: 110, category: "Want", correct: "Want" },
      { label: "KiwiSaver 8%", amount: 96, category: "Save", correct: "Save" },
      { label: "Streaming services x4", amount: 55, category: "Want", correct: "Want" },
      { label: "Children's activities", amount: 80, category: "Want", correct: "Want" },
    ],
  },
];

function BudgetChallenge({
  onComplete, onBack }: { onComplete: (xp: number) => void; onBack: () => void }) {

  const { isDark } = useTheme();
  const T = { bg: isDark?"#0d1526":"#f0f4f8", bg2: isDark?"#111c30":"#ffffff", bg3: isDark?"#1a2540":"#f8fafc", card: isDark?"#111c30":"#ffffff", text: isDark?"#ffffff":"#0d1526", text2: isDark?"#8b9dc3":"#475569", text3: isDark?"#4a6a8a":"#94a3b8", border: isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)", border2: isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.16)", input: isDark?"rgba(255,255,255,.06)":"#f8fafc", inputBorder: isDark?"rgba(255,255,255,.12)":"rgba(0,0,0,.14)", shadow: isDark?"rgba(0,0,0,.4)":"rgba(0,0,0,.08)", green: isDark?"#76AD25":"#5a9a1a", accent: isDark?"#f59e0b":"#d97706", strip: isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)" };
  const [scenario] = useState(() => BUDGET_SCENARIOS[Math.floor(Math.random() * BUDGET_SCENARIOS.length)]);
  
  // Daily lock — only completable once per day
  const todayKey = `pw_budget_done_${new Date().toDateString()}`;
  const [alreadyDone] = useState(() => localStorage.getItem(todayKey) === "1");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  if (alreadyDone) return (
    <div style={{ background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 18, padding: "40px 32px", textAlign: "center" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>✅</div>
      <h3 style={{ fontWeight: 800, color: T.text, fontSize: "1.1rem", marginBottom: 8 }}>Budget tracked today!</h3>
      <p style={{ color: T.text2, fontSize: "0.875rem", marginBottom: 20, lineHeight: 1.6 }}>You've already completed the Budget Tracker today. Come back tomorrow for a new scenario and more XP.</p>
      <div style={{ background: isDark ? "rgba(118,173,37,.1)" : "rgba(90,154,26,.08)", border: `1px solid ${isDark ? "rgba(118,173,37,.2)" : "rgba(90,154,26,.15)"}`, borderRadius: 10, padding: "10px 16px", fontSize: "0.82rem", color: T.green, marginBottom: 20 }}>Next reset: midnight tonight</div>
      <button onClick={onBack} className="btn-3d-green" style={{ padding: "11px 32px", fontSize: "0.875rem" }}>Back to Activities</button>
    </div>
  );
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
        <button onClick={onBack} style={{ background: "rgba(128,128,128,.08)", border: `1px solid ${T.border2}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#fff", display: "flex" }}>
          <X size={16} />
        </button>
        <div>
          <div style={{ fontSize: "0.7rem", color: "#76AD25", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Budget Challenge</div>
          <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>{scenario.name}</div>
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
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#fff" }}>${total}</div>
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
                  <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#fff" }}>{item.label}</span>
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
                      color: answers[i] === cat ? catColors[cat] : "#64748b",
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
          <button onClick={check} disabled={!allAnswered} style={{ width: "100%", padding: "14px", background: allAnswered ? "#76AD25" : "rgba(255,255,255,.06)", color: allAnswered ? "#fff" : "#4a5a7a", border: "none", borderRadius: 12, fontWeight: 800, fontSize: "0.95rem", cursor: allAnswered ? "pointer" : "not-allowed", fontFamily: FONT }}>
            Check My Budget
          </button>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fff", marginBottom: 4 }}>{score}/{scenario.items.length} correct</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 20 }}>
              <Zap size={16} color="#f59e0b" />
              <span style={{ fontWeight: 800, color: "#f59e0b", fontSize: "1.1rem" }}>+{xpEarned} XP</span>
            </div>
            <button onClick={() => onComplete(xpEarned)} style={{ width: "100%", padding: "14px", background: "#76AD25", color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", fontFamily: FONT }}>
              Collect XP <ArrowRight size={16} style={{ display: "inline" }} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Compound Interest Calculator Challenge ────────────────────────────────
const INTEREST_QUESTIONS = [
  { question: "You invest $2,000 at 5% annual interest for 3 years. What is the compound interest earned?", principal: 2000, rate: 5, years: 3, answer: 315.25 },
  { question: "You put $500 in a savings account at 4.8% for 2 years compounded annually. What is the final balance?", principal: 500, rate: 4.8, years: 2, answer: 548.95 },
  { question: "A $1,000 KiwiSaver contribution grows at 6% for 5 years. What is the final value?", principal: 1000, rate: 6, years: 5, answer: 1338.23 },
];

function InterestChallenge({
  onComplete, onBack }: { onComplete: (xp: number) => void; onBack: () => void }) {

  const { isDark } = useTheme();
  const T = { bg: isDark?"#0d1526":"#f0f4f8", bg2: isDark?"#111c30":"#ffffff", bg3: isDark?"#1a2540":"#f8fafc", card: isDark?"#111c30":"#ffffff", text: isDark?"#ffffff":"#0d1526", text2: isDark?"#8b9dc3":"#475569", text3: isDark?"#4a6a8a":"#94a3b8", border: isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)", border2: isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.16)", input: isDark?"rgba(255,255,255,.06)":"#f8fafc", inputBorder: isDark?"rgba(255,255,255,.12)":"rgba(0,0,0,.14)", shadow: isDark?"rgba(0,0,0,.4)":"rgba(0,0,0,.08)", green: isDark?"#76AD25":"#5a9a1a", accent: isDark?"#f59e0b":"#d97706", strip: isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)" };
  const [qIdx, setQIdx] = useState(0);
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("");
  const [years, setYears] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const q = INTEREST_QUESTIONS[qIdx];

  function calculate() {
    const p = parseFloat(principal) || q.principal;
    const r = parseFloat(rate) / 100 || q.rate / 100;
    const n = parseFloat(years) || q.years;
    const calc = p * Math.pow(1 + r, n);
    setResult(parseFloat(calc.toFixed(2)));
    setChecked(true);
    const isClose = Math.abs(calc - q.answer) < 1;
    if (isClose) setScore(s => s + 1);
  }

  function next() {
    if (qIdx < INTEREST_QUESTIONS.length - 1) {
      setQIdx(i => i + 1);
      setPrincipal(""); setRate(""); setYears("");
      setResult(null); setChecked(false);
    } else {
      onComplete(Math.round((score / INTEREST_QUESTIONS.length) * 60));
    }
  }

  const inputStyle = { width: "100%", background: T.input, border: "1.5px solid rgba(255,255,255,.12)", borderRadius: 10, padding: "12px 14px", color: "#fff", fontFamily: FONT, fontSize: "0.95rem", outline: "none" } as React.CSSProperties;

  return (
    <div style={{ minHeight: "100vh", background: "#0a1628", fontFamily: FONT, paddingBottom: 40 }}>
      <div style={{ background: "rgba(10,22,40,.95)", borderBottom: `1px solid ${T.border}`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "rgba(128,128,128,.08)", border: `1px solid ${T.border2}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#fff" }}>
          <X size={16} />
        </button>
        <div>
          <div style={{ fontSize: "0.7rem", color: "#3B82F6", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Interest Calculator</div>
          <div style={{ fontWeight: 700, color: "#fff" }}>Question {qIdx + 1} of {INTEREST_QUESTIONS.length}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
          <Zap size={14} color="#f59e0b" /><span style={{ fontWeight: 700, color: "#f59e0b", fontSize: "0.85rem" }}>60 XP</span>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "28px 20px" }}>
        <div style={{ background: "rgba(59,130,246,.08)", border: "1px solid rgba(59,130,246,.2)", borderRadius: 14, padding: "20px", marginBottom: 24 }}>
          <p style={{ color: "#e2e8f0", fontSize: "0.95rem", lineHeight: 1.7 }}>{q.question}</p>
        </div>

        <div style={{ background: "rgba(255,255,255,.04)", borderRadius: 14, padding: "18px 20px", border: `1px solid ${T.border}`, marginBottom: 20 }}>
          <div style={{ fontSize: "0.72rem", color: T.text2, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 12 }}>
            Formula: A = P × (1 + r)ⁿ
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Principal (P) $", val: principal, set: setPrincipal, placeholder: String(q.principal) },
              { label: "Annual Rate (r) %", val: rate, set: setRate, placeholder: String(q.rate) },
              { label: "Years (n)", val: years, set: setYears, placeholder: String(q.years) },
            ].map(f => (
              <div key={f.label}>
                <label style={{ fontSize: "0.75rem", color: T.text2, display: "block", marginBottom: 5 }}>{f.label}</label>
                <input type="number" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} disabled={checked} style={inputStyle} />
              </div>
            ))}
          </div>
        </div>

        {!checked ? (
          <button onClick={calculate} style={{ width: "100%", padding: "14px", background: "#3B82F6", color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", fontFamily: FONT }}>
            Calculate
          </button>
        ) : (
          <div>
            <div style={{ background: Math.abs((result ?? 0) - q.answer) < 1 ? "rgba(118,173,37,.1)" : "rgba(239,68,68,.08)", border: `1px solid ${Math.abs((result ?? 0) - q.answer) < 1 ? "rgba(118,173,37,.3)" : "rgba(239,68,68,.2)"}`, borderRadius: 12, padding: "16px", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: T.text2, fontSize: "0.825rem" }}>Your answer</span>
                <span style={{ fontWeight: 700, color: "#fff" }}>${result?.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: T.text2, fontSize: "0.825rem" }}>Correct answer</span>
                <span style={{ fontWeight: 700, color: "#76AD25" }}>${q.answer.toFixed(2)}</span>
              </div>
            </div>
            <button onClick={next} style={{ width: "100%", padding: "14px", background: "#76AD25", color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", fontFamily: FONT }}>
              {qIdx < INTEREST_QUESTIONS.length - 1 ? "Next Question" : "Finish"} <ChevronRight size={16} style={{ display: "inline" }} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── NZ Financial Quiz ─────────────────────────────────────────────────────
const QUIZ_QUESTIONS = [
  { q: "What is the minimum KiwiSaver contribution rate for an employee in NZ?", options: ["1%", "2%", "3%", "5%"], correct: 2, exp: "The minimum employee contribution rate is 3% of gross salary, with employers required to contribute at least 3% as well." },
  { q: "What does IRD stand for in New Zealand?", options: ["Inland Revenue Department", "International Revenue Division", "Individual Revenue Department", "Inland Rate Division"], correct: 0, exp: "Inland Revenue Department (IRD) is the NZ government agency responsible for tax collection and administration." },
  { q: "What is the current GST rate in New Zealand?", options: ["10%", "12.5%", "15%", "17.5%"], correct: 2, exp: "GST (Goods and Services Tax) in New Zealand is 15%, added to most goods and services." },
  { q: "What is an OCR in the NZ financial system?", options: ["Official Cash Rate", "Ordinary Credit Ratio", "Outgoing Capital Reserve", "Official Currency Rate"], correct: 0, exp: "The Official Cash Rate (OCR) is set by the Reserve Bank of NZ. It influences interest rates across the economy including mortgages and savings." },
  { q: "The RBNZ's primary goal is to keep inflation between which range?", options: ["0-1%", "1-3%", "2-4%", "3-5%"], correct: 1, exp: "The Reserve Bank of NZ targets inflation between 1-3% on average over the medium term, with a focus on keeping it near 2%." },
  { q: "Which NZ government scheme helps first home buyers with a deposit?", options: ["KiwiBond", "Kāinga Ora First Home Grant", "HomeStart NZ", "First Home Scheme"], correct: 1, exp: "Kāinga Ora administers the First Home Grant, which gives eligible buyers up to $10,000 towards a first home deposit." },
  { q: "What does a credit score measure?", options: ["How much money you have", "Your likelihood to repay debt", "Your net worth", "Your annual income"], correct: 1, exp: "A credit score measures your creditworthiness — how likely you are to repay borrowed money based on your history of repayments." },
  { q: "If you earn $60,000 per year in NZ, approximately what tax rate applies to income above $48,000?", options: ["17.5%", "30%", "33%", "39%"], correct: 1, exp: "NZ income between $48,001 and $70,000 is taxed at 30%. This is a marginal rate — only the income in that band is taxed at 30%." },
];

function NZQuiz({
  onComplete, onBack }: { onComplete: (xp: number) => void; onBack: () => void }) {

  const { isDark } = useTheme();
  const T = { bg: isDark?"#0d1526":"#f0f4f8", bg2: isDark?"#111c30":"#ffffff", bg3: isDark?"#1a2540":"#f8fafc", card: isDark?"#111c30":"#ffffff", text: isDark?"#ffffff":"#0d1526", text2: isDark?"#8b9dc3":"#475569", text3: isDark?"#4a6a8a":"#94a3b8", border: isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)", border2: isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.16)", input: isDark?"rgba(255,255,255,.06)":"#f8fafc", inputBorder: isDark?"rgba(255,255,255,.12)":"rgba(0,0,0,.14)", shadow: isDark?"rgba(0,0,0,.4)":"rgba(0,0,0,.08)", green: isDark?"#76AD25":"#5a9a1a", accent: isDark?"#f59e0b":"#d97706", strip: isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)" };
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = QUIZ_QUESTIONS[qIdx];

  function answer(i: number) {
    if (locked) return;
    setSelected(i);
    setLocked(true);
    if (i === q.correct) setScore(s => s + 1);
  }

  function next() {
    if (qIdx < QUIZ_QUESTIONS.length - 1) {
      setQIdx(i => i + 1);
      setSelected(null);
      setLocked(false);
    } else {
      setDone(true);
    }
  }

  const xpEarned = Math.round((score / QUIZ_QUESTIONS.length) * 80);
  const progress = ((qIdx + (locked ? 1 : 0)) / QUIZ_QUESTIONS.length) * 100;

  if (done) return (
    <div style={{ minHeight: "100vh", background: "#0a1628", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: FONT, textAlign: "center" }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(118,173,37,.2)", border: "2px solid #76AD25", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <Star size={36} color="#76AD25" fill="#76AD25" />
      </div>
      <h2 style={{ fontWeight: 900, fontSize: "1.75rem", color: "#fff", marginBottom: 8 }}>{score}/{QUIZ_QUESTIONS.length} Correct</h2>
      <p style={{ color: T.text2, marginBottom: 24, fontSize: "0.9rem" }}>
        {score >= 6 ? "Excellent NZ financial knowledge!" : score >= 4 ? "Good effort — keep learning!" : "Keep studying — you'll get there!"}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(245,158,11,.15)", border: "1px solid rgba(245,158,11,.3)", borderRadius: 12, padding: "12px 24px", marginBottom: 28 }}>
        <Zap size={18} color="#f59e0b" />
        <span style={{ fontWeight: 900, fontSize: "1.25rem", color: "#f59e0b" }}>+{xpEarned} XP</span>
      </div>
      <button onClick={() => onComplete(xpEarned)} style={{ padding: "14px 32px", background: "#76AD25", color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", fontFamily: FONT }}>
        Collect XP
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a1628", fontFamily: FONT }}>
      <div style={{ background: "rgba(10,22,40,.95)", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ height: 5, background: T.input }}>
          <div style={{ height: 5, background: "#76AD25", width: `${progress}%`, transition: "width .4s", borderRadius: "0 99px 99px 0" }} />
        </div>
        <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} style={{ background: "rgba(128,128,128,.08)", border: `1px solid ${T.border2}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#fff" }}>
            <X size={16} />
          </button>
          <div style={{ fontWeight: 700, color: "#fff" }}>NZ Finance Quiz</div>
          <div style={{ marginLeft: "auto", fontSize: "0.8rem", color: T.text2 }}>{qIdx + 1}/{QUIZ_QUESTIONS.length}</div>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px" }}>
        <h2 style={{ fontWeight: 700, fontSize: "clamp(1rem, 2.5vw, 1.25rem)", color: "#fff", marginBottom: 28, lineHeight: 1.4 }}>
          {q.q}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {q.options.map((opt, i) => {
            const isCorrect = locked && i === q.correct;
            const isWrong = locked && i === selected && i !== q.correct;
            return (
              <button key={i} onClick={() => answer(i)} style={{
                padding: "15px 18px", borderRadius: 12, textAlign: "left",
                background: isCorrect ? "rgba(118,173,37,.2)" : isWrong ? "rgba(239,68,68,.15)" : selected === i && !locked ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.06)",
                border: `1.5px solid ${isCorrect ? "#76AD25" : isWrong ? "#EF4444" : "rgba(255,255,255,.1)"}`,
                color: isCorrect ? "#76AD25" : isWrong ? "#EF4444" : "#fff",
                fontWeight: 600, fontSize: "0.9rem", cursor: locked ? "default" : "pointer",
                fontFamily: FONT, display: "flex", alignItems: "center", gap: 12, transition: "all .12s",
              }}>
                <span style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(128,128,128,.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 800, flexShrink: 0 }}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
                {isCorrect && <Check size={16} style={{ marginLeft: "auto" }} />}
                {isWrong && <X size={16} style={{ marginLeft: "auto" }} />}
              </button>
            );
          })}
        </div>
        {locked && (
          <div style={{ background: selected === q.correct ? "rgba(118,173,37,.08)" : "rgba(239,68,68,.06)", border: `1px solid ${selected === q.correct ? "rgba(118,173,37,.25)" : "rgba(239,68,68,.2)"}`, borderRadius: 12, padding: "14px 18px", marginBottom: 16, fontSize: "0.85rem", color: T.text3, lineHeight: 1.6, animation: "fadeIn 0.3s ease" }}>
            {q.exp}
          </div>
        )}
        {locked && (
          <button onClick={next} style={{ width: "100%", padding: "14px", background: "#76AD25", color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", fontFamily: FONT }}>
            {qIdx < QUIZ_QUESTIONS.length - 1 ? "Next" : "See Results"} <ChevronRight size={16} style={{ display: "inline" }} />
          </button>
        )}
      </div>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

// ── Daily Word Challenge ──────────────────────────────────────────────────
const WORD_CLUES = [
  // Core concepts
  { word: "INFLATION", clue: "When prices rise over time and your money buys less", hint: "I _ _ _ _ _ _ _ _ " },
  { word: "DIVIDEND", clue: "A share of company profits paid to shareholders", hint: "D _ _ _ _ _ _ _ " },
  { word: "MORTGAGE", clue: "A property loan secured against your home", hint: "M _ _ _ _ _ _ _ " },
  { word: "COMPOUND", clue: "This type of interest earns interest on interest — Einstein called it the eighth wonder of the world", hint: "C _ _ _ _ _ _ _ " },
  { word: "DEPRECIATION", clue: "The reduction in value of an asset over time — a new car loses this the moment you drive it off the lot", hint: "D _ _ _ _ _ _ _ _ _ _ _ " },
  { word: "LIQUIDITY", clue: "How quickly and easily an asset can be converted into cash", hint: "L _ _ _ _ _ _ _ _ " },
  { word: "KIWISAVER", clue: "NZ's voluntary workplace retirement savings scheme with employer contributions", hint: "K _ _ _ _ _ _ _ _ " },
  // Investing
  { word: "PORTFOLIO", clue: "A collection of investments held by an individual or institution", hint: "P _ _ _ _ _ _ _ _ " },
  { word: "DIVERSIFY", clue: "Spreading investments across different assets to reduce risk — don't put all eggs in one basket", hint: "D _ _ _ _ _ _ _ _ " },
  { word: "EQUITY", clue: "Ownership stake in a company or the value of an asset minus what you owe", hint: "E _ _ _ _ _ " },
  { word: "INTEREST", clue: "The cost of borrowing money, or the reward for saving it", hint: "I _ _ _ _ _ _ _ " },
  { word: "CAPITAL", clue: "Wealth in the form of money or assets used to generate more wealth", hint: "C _ _ _ _ _ _ " },
  { word: "CASHFLOW", clue: "Money coming in minus money going out — the lifeblood of any budget", hint: "C _ _ _ _ _ _ _ " },
  { word: "LEVERAGE", clue: "Using borrowed money to increase potential returns (and risks)", hint: "L _ _ _ _ _ _ _ " },
  // NZ specific
  { word: "RESERVE", clue: "The _______ Bank of New Zealand sets the official cash rate", hint: "R _ _ _ _ _ _ " },
  { word: "NETWORTH", clue: "Total assets minus total liabilities — your real financial score", hint: "N _ _ _ _ _ _ _ " },
  { word: "FIRSTHOME", clue: "KiwiSaver HomeStart grant helps with this purchase", hint: "F _ _ _ _ H _ _ _ " },
  // Debt
  { word: "PRINCIPAL", clue: "The original amount borrowed before interest is added", hint: "P _ _ _ _ _ _ _ _ " },
  { word: "OVERDRAFT", clue: "Spending more than you have in your bank account — bank charges apply", hint: "O _ _ _ _ _ _ _ _ " },
  { word: "COLLATERAL", clue: "An asset pledged as security for a loan — your house for a mortgage", hint: "C _ _ _ _ _ _ _ _ _ " },
  { word: "AMORTISE", clue: "To gradually pay off a debt through regular payments", hint: "A _ _ _ _ _ _ _ " },
  // Tax & NZ
  { word: "PAYE", clue: "NZ pay-as-you-earn income tax deducted automatically from your wages", hint: "P _ _ _ " },
  { word: "FIFO", clue: "First In, First Out — a stock valuation method used in accounting", hint: "F _ _ _ " },
  { word: "BUDGET", clue: "A plan for how you will spend and save your money each period", hint: "B _ _ _ _ _ " },
  { word: "RECESSION", clue: "Two consecutive quarters of negative economic growth", hint: "R _ _ _ _ _ _ _ _ " },
  { word: "AUCKLAND", clue: "NZ city with the highest average house prices — median over $1 million", hint: "A _ _ _ _ _ _ _ " },
];

function WordChallenge({
  onComplete, onBack }: { onComplete: (xp: number) => void; onBack: () => void }) {

  const { isDark } = useTheme();
  const T = { bg: isDark?"#0d1526":"#f0f4f8", bg2: isDark?"#111c30":"#ffffff", bg3: isDark?"#1a2540":"#f8fafc", card: isDark?"#111c30":"#ffffff", text: isDark?"#ffffff":"#0d1526", text2: isDark?"#8b9dc3":"#475569", text3: isDark?"#4a6a8a":"#94a3b8", border: isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)", border2: isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.16)", input: isDark?"rgba(255,255,255,.06)":"#f8fafc", inputBorder: isDark?"rgba(255,255,255,.12)":"rgba(0,0,0,.14)", shadow: isDark?"rgba(0,0,0,.4)":"rgba(0,0,0,.08)", green: isDark?"#76AD25":"#5a9a1a", accent: isDark?"#f59e0b":"#d97706", strip: isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)" };
  const [clue] = useState(() => WORD_CLUES[Math.floor(Math.random() * WORD_CLUES.length)]);
  const [input, setInput] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState<"correct" | "wrong" | "gave-up" | null>(null);

  function submit() {
    if (input.trim().toUpperCase() === clue.word) {
      setResult("correct");
    } else {
      const att = attempts + 1;
      setAttempts(att);
      if (att >= 3) setResult("wrong");
    }
    setInput("");
  }

  const xpEarned = result === "correct" ? (attempts === 0 ? 40 : attempts === 1 ? 25 : 15) : 5;

  return (
    <div style={{ minHeight: "100vh", background: "#0a1628", fontFamily: FONT }}>
      <div style={{ background: "rgba(10,22,40,.95)", borderBottom: `1px solid ${T.border}`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "rgba(128,128,128,.08)", border: `1px solid ${T.border2}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#fff" }}>
          <X size={16} />
        </button>
        <div>
          <div style={{ fontSize: "0.7rem", color: "#a78bfa", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Word Challenge</div>
          <div style={{ fontWeight: 700, color: "#fff" }}>Guess the Term</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
          <Zap size={14} color="#f59e0b" /><span style={{ fontWeight: 700, color: "#f59e0b", fontSize: "0.85rem" }}>Up to 40 XP</span>
        </div>
      </div>

      <div style={{ maxWidth: 460, margin: "0 auto", padding: "40px 20px", textAlign: "center" }}>
        {/* Letter boxes */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
          {clue.word.split("").map((letter, i) => (
            <div key={i} style={{
              width: 38, height: 44, borderRadius: 8,
              background: result ? "rgba(118,173,37,.2)" : "rgba(255,255,255,.07)",
              border: `2px solid ${result ? "#76AD25" : "rgba(255,255,255,.15)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, fontSize: "1.1rem", color: "#fff",
            }}>
              {result ? letter : i === 0 ? letter : ""}
            </div>
          ))}
        </div>

        <div style={{ background: "rgba(167,139,250,.08)", border: "1px solid rgba(167,139,250,.2)", borderRadius: 14, padding: "20px", marginBottom: 28 }}>
          <div style={{ fontSize: "0.7rem", color: "#a78bfa", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Clue</div>
          <p style={{ color: "#e2e8f0", fontSize: "1rem", lineHeight: 1.6 }}>{clue.clue}</p>
          <div style={{ marginTop: 12, fontSize: "0.78rem", color: T.text2 }}>Hint: {clue.hint}</div>
        </div>

        {!result ? (
          <>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 16 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i < attempts ? "#EF4444" : "rgba(255,255,255,.1)" }} />
              ))}
            </div>
            <div style={{ fontSize: "0.75rem", color: T.text2, marginBottom: 16 }}>{3 - attempts} attempts remaining</div>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && input.trim() && submit()}
              placeholder="Type your answer..."
              autoFocus
              style={{ width: "100%", background: T.input, border: "1.5px solid rgba(255,255,255,.15)", borderRadius: 12, padding: "14px", color: "#fff", fontFamily: FONT, fontSize: "1rem", outline: "none", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center" }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={submit} disabled={!input.trim()} style={{ flex: 2, padding: "13px", background: input.trim() ? "#a78bfa" : "rgba(255,255,255,.06)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: "0.9rem", cursor: input.trim() ? "pointer" : "not-allowed", fontFamily: FONT }}>
                Submit
              </button>
              <button onClick={() => setResult("gave-up")} style={{ flex: 1, padding: "13px", background: "rgba(255,255,255,.05)", color: T.text2, border: `1px solid ${T.border}`, borderRadius: 12, fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: FONT }}>
                Give Up
              </button>
            </div>
          </>
        ) : (
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: result === "correct" ? "#76AD25" : "#EF4444", marginBottom: 8 }}>
              {result === "correct" ? "Correct!" : `The answer was: ${clue.word}`}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginBottom: 20 }}>
              <Zap size={16} color="#f59e0b" />
              <span style={{ fontWeight: 900, color: "#f59e0b", fontSize: "1.1rem" }}>+{xpEarned} XP</span>
            </div>
            <button onClick={() => onComplete(xpEarned)} style={{ width: "100%", padding: "14px", background: "#76AD25", color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", fontFamily: FONT }}>
              Collect XP
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Net Worth Tracker Challenge ───────────────────────────────────────────
function NetWorthChallenge({
  onComplete, onBack }: { onComplete: (xp: number) => void; onBack: () => void }) {

  const { isDark } = useTheme();
  const T = { bg: isDark?"#0d1526":"#f0f4f8", bg2: isDark?"#111c30":"#ffffff", bg3: isDark?"#1a2540":"#f8fafc", card: isDark?"#111c30":"#ffffff", text: isDark?"#ffffff":"#0d1526", text2: isDark?"#8b9dc3":"#475569", text3: isDark?"#4a6a8a":"#94a3b8", border: isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)", border2: isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.16)", input: isDark?"rgba(255,255,255,.06)":"#f8fafc", inputBorder: isDark?"rgba(255,255,255,.12)":"rgba(0,0,0,.14)", shadow: isDark?"rgba(0,0,0,.4)":"rgba(0,0,0,.08)", green: isDark?"#76AD25":"#5a9a1a", accent: isDark?"#f59e0b":"#d97706", strip: isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)" };
  const scenarios = [
    {
      name: "Wiremu's Finances",
      items: [
        { label: "Savings account", amount: 3200, type: "asset" },
        { label: "Car (Toyota Corolla)", amount: 14500, type: "asset" },
        { label: "KiwiSaver balance", amount: 8400, type: "asset" },
        { label: "Student loan", amount: 12000, type: "liability" },
        { label: "Car loan balance", amount: 6800, type: "liability" },
        { label: "Phone on finance", amount: 840, type: "liability" },
        { label: "Shares portfolio", amount: 2100, type: "asset" },
      ],
    },
    {
      name: "Mia's Balance Sheet",
      items: [
        { label: "Term deposit", amount: 5000, type: "asset" },
        { label: "Jewellery", amount: 1200, type: "asset" },
        { label: "Credit card debt", amount: 2400, type: "liability" },
        { label: "KiwiSaver", amount: 6200, type: "asset" },
        { label: "Student loan", amount: 15000, type: "liability" },
        { label: "Laptop", amount: 900, type: "asset" },
        { label: "Furniture", amount: 3400, type: "asset" },
      ],
    },
  ];
  const [scenario] = useState(() => scenarios[Math.floor(Math.random() * scenarios.length)]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  const [checked, setChecked] = useState(false);

  const correctAssets = scenario.items.filter(i => i.type === "asset").reduce((s, i) => s + i.amount, 0);
  const correctLiabilities = scenario.items.filter(i => i.type === "liability").reduce((s, i) => s + i.amount, 0);
  const correctNW = correctAssets - correctLiabilities;

  const userAssets = scenario.items.reduce((s, item, i) => answers[i] === "asset" ? s + item.amount : s, 0);
  const userLiabilities = scenario.items.reduce((s, item, i) => answers[i] === "liability" ? s + item.amount : s, 0);
  const userNW = userAssets - userLiabilities;

  const correctCount = scenario.items.filter((item, i) => answers[i] === item.type).length;
  const xpEarned = Math.round((correctCount / scenario.items.length) * 65);

  return (
    <div style={{ minHeight: "100vh", background: "#0a1628", fontFamily: FONT, paddingBottom: 100 }}>
      <div style={{ background: "rgba(10,22,40,.95)", borderBottom: `1px solid ${T.border}`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "rgba(128,128,128,.08)", border: `1px solid ${T.border2}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#fff" }}>
          <X size={16} />
        </button>
        <div>
          <div style={{ fontSize: "0.7rem", color: "#f59e0b", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Net Worth Tracker</div>
          <div style={{ fontWeight: 700, color: "#fff" }}>{scenario.name}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
          <Zap size={14} color="#f59e0b" /><span style={{ fontWeight: 700, color: "#f59e0b", fontSize: "0.85rem" }}>65 XP</span>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 20px" }}>
        <p style={{ color: T.text2, fontSize: "0.875rem", marginBottom: 20 }}>Label each item as an Asset or Liability to calculate the net worth.</p>

        {/* Live net worth display */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[
            { label: "Assets", val: userAssets, color: "#76AD25", bg: "rgba(118,173,37,.12)" },
            { label: "Liabilities", val: userLiabilities, color: "#EF4444", bg: "rgba(239,68,68,.1)" },
            { label: "Net Worth", val: userNW, color: userNW >= 0 ? "#76AD25" : "#EF4444", bg: "rgba(255,255,255,.05)" },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: s.bg, borderRadius: 10, padding: "10px", textAlign: "center" }}>
              <div style={{ fontSize: "0.65rem", color: T.text2, fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: s.color }}>${s.val.toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {scenario.items.map((item, i) => {
            const isCorrect = checked && answers[i] === item.type;
            const isWrong = checked && answers[i] !== item.type;
            return (
              <div key={i} style={{ background: isCorrect ? "rgba(118,173,37,.08)" : isWrong ? "rgba(239,68,68,.06)" : "rgba(255,255,255,.04)", border: `1px solid ${isCorrect ? "rgba(118,173,37,.25)" : isWrong ? "rgba(239,68,68,.2)" : "rgba(255,255,255,.08)"}`, borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#fff" }}>{item.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontWeight: 700, color: T.text2 }}>${item.amount.toLocaleString()}</span>
                    {checked && (isCorrect ? <Check size={14} color="#76AD25" /> : <span style={{ fontSize: "0.68rem", color: "#EF4444" }}>→ {item.type}</span>)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {["asset", "liability"].map(t => (
                    <button key={t} onClick={() => { if (!checked) setAnswers(a => ({ ...a, [i]: t })); }} style={{
                      flex: 1, padding: "7px", borderRadius: 8,
                      background: answers[i] === t ? (t === "asset" ? "rgba(118,173,37,.2)" : "rgba(239,68,68,.15)") : "rgba(255,255,255,.05)",
                      border: `1px solid ${answers[i] === t ? (t === "asset" ? "#76AD25" : "#EF4444") : "rgba(255,255,255,.1)"}`,
                      color: answers[i] === t ? (t === "asset" ? "#76AD25" : "#EF4444") : "#64748b",
                      fontWeight: 700, fontSize: "0.78rem", cursor: checked ? "default" : "pointer", fontFamily: FONT,
                      textTransform: "capitalize",
                    }}>{t}</button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {!checked ? (
          <button onClick={() => setChecked(true)} disabled={Object.keys(answers).length < scenario.items.length} style={{ width: "100%", padding: "14px", background: Object.keys(answers).length >= scenario.items.length ? "#76AD25" : "rgba(255,255,255,.06)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", fontFamily: FONT }}>
            Calculate Net Worth
          </button>
        ) : (
          <div>
            <div style={{ background: "rgba(255,255,255,.05)", borderRadius: 12, padding: "16px", marginBottom: 16, textAlign: "center" }}>
              <div style={{ fontSize: "0.8rem", color: T.text2, marginBottom: 4 }}>Correct Net Worth</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: correctNW >= 0 ? "#76AD25" : "#EF4444" }}>${correctNW.toLocaleString()}</div>
              <div style={{ fontSize: "0.8rem", color: T.text2, marginTop: 4 }}>{correctCount}/{scenario.items.length} items correct</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 16 }}>
              <Zap size={16} color="#f59e0b" />
              <span style={{ fontWeight: 900, color: "#f59e0b", fontSize: "1.1rem" }}>+{xpEarned} XP</span>
            </div>
            <button onClick={() => onComplete(xpEarned)} style={{ width: "100%", padding: "14px", background: "#76AD25", color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", fontFamily: FONT }}>
              Collect XP
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Daily Spending Diary ──────────────────────────────────────────────────
function SpendingDiary({
  onComplete, onBack }: { onComplete: (xp: number) => void; onBack: () => void }) {

  const { isDark } = useTheme();
  const T = { bg: isDark?"#0d1526":"#f0f4f8", bg2: isDark?"#111c30":"#ffffff", bg3: isDark?"#1a2540":"#f8fafc", card: isDark?"#111c30":"#ffffff", text: isDark?"#ffffff":"#0d1526", text2: isDark?"#8b9dc3":"#475569", text3: isDark?"#4a6a8a":"#94a3b8", border: isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)", border2: isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.16)", input: isDark?"rgba(255,255,255,.06)":"#f8fafc", inputBorder: isDark?"rgba(255,255,255,.12)":"rgba(0,0,0,.14)", shadow: isDark?"rgba(0,0,0,.4)":"rgba(0,0,0,.08)", green: isDark?"#76AD25":"#5a9a1a", accent: isDark?"#f59e0b":"#d97706", strip: isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)" };

  const STORAGE_KEY = "pw_spending_diary";
  const todayStr = new Date().toDateString();

  type Entry = { desc: string; amount: string; category: string; date: string };

  // Load persisted entries
  const [allEntries, setAllEntries] = useState<Entry[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
  });
  const todayEntries = allEntries.filter(e => e.date === todayStr);
  const [entries, setEntries] = useState<{ desc: string; amount: string; category: string }[]>(
    todayEntries.length > 0
      ? todayEntries.map(e => ({ desc: e.desc, amount: e.amount, category: e.category }))
      : [{ desc: "", amount: "", category: "Food" }]
  );
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<"today" | "history">("today");
  const cats = ["Food", "Transport", "Entertainment", "Savings", "Clothing", "Health", "Other"];

  function addRow() { setEntries(e => [...e, { desc: "", amount: "", category: "Food" }]); }
  function removeRow(i: number) { setEntries(e => e.filter((_, j) => j !== i)); }

  const total = entries.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const catTotals = cats.map(cat => ({
    cat, total: entries.filter(e => e.category === cat).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0),
  })).filter(c => c.total > 0);

  // Past 7 days totals
  const last7: { date: string; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toDateString();
    const dayTotal = allEntries.filter(e => e.date === ds).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    last7.push({ date: ds, total: dayTotal });
  }
  const maxDay = Math.max(...last7.map(d => d.total), 1);

  function save() {
    if (!entries.some(e => e.desc && e.amount)) return;
    const newEntries: Entry[] = entries
      .filter(e => e.desc && e.amount)
      .map(e => ({ ...e, date: todayStr }));
    // Replace today's entries
    const kept = allEntries.filter(e => e.date !== todayStr);
    const updated = [...kept, ...newEntries];
    setAllEntries(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSubmitted(true);
    onComplete(30);
  }

  const CAT_COLORS: Record<string, string> = {
    Food: "#f97316", Transport: "#3B82F6", Entertainment: "#a78bfa",
    Savings: "#76AD25", Clothing: "#f59e0b", Health: "#22d3ee", Other: "#94a3b8"
  };

  return (
    <div style={{ background: T.bg, fontFamily: FONT, borderRadius: 18, overflow: "hidden", border: `1.5px solid ${T.border}` }}>
      {/* Header */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: T.text, display: "flex" }}>
          <X size={16} />
        </button>
        <div>
          <div style={{ fontSize: "0.65rem", color: T.green, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Daily Diary</div>
          <div style={{ fontWeight: 800, color: T.text, fontSize: "0.95rem" }}>Track Your Spending</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
          <Zap size={14} color="#f59e0b" fill="#f59e0b" /><span style={{ fontWeight: 700, color: "#f59e0b", fontSize: "0.85rem" }}>30 XP</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: T.bg3, borderBottom: `1px solid ${T.border}`, padding: "4px 16px", gap: 4 }}>
        {(["today", "history"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "7px 18px", borderRadius: 8, background: activeTab === tab ? T.card : "transparent", color: activeTab === tab ? T.text : T.text3, fontWeight: 700, fontSize: "0.8rem", border: activeTab === tab ? `1px solid ${T.border}` : "1px solid transparent", cursor: "pointer", fontFamily: FONT, textTransform: "capitalize" }}>
            {tab}
          </button>
        ))}
      </div>

      <div style={{ padding: "20px" }}>
        {activeTab === "today" && !submitted && (
          <>
            <p style={{ color: T.text2, fontSize: "0.82rem", marginBottom: 16, lineHeight: 1.6 }}>
              Record everything you spent today. Entries are saved across sessions.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {entries.map((entry, i) => (
                <div key={i} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 12, padding: "10px 12px", display: "flex", gap: 8, alignItems: "center", animation: "pw-pop .2s ease" }}>
                  <input
                    placeholder="What did you spend on?"
                    value={entry.desc}
                    onChange={e => setEntries(en => en.map((r, j) => j === i ? { ...r, desc: e.target.value } : r))}
                    style={{ flex: 2, background: "none", border: "none", color: T.text, fontFamily: FONT, fontSize: "0.82rem", outline: "none" }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                    <span style={{ color: T.text3, fontSize: "0.82rem" }}>$</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={entry.amount}
                      onChange={e => setEntries(en => en.map((r, j) => j === i ? { ...r, amount: e.target.value } : r))}
                      style={{ width: 70, background: "none", border: "none", color: T.text, fontFamily: FONT, fontSize: "0.82rem", fontWeight: 700, outline: "none" }}
                    />
                  </div>
                  <select
                    value={entry.category}
                    onChange={e => setEntries(en => en.map((r, j) => j === i ? { ...r, category: e.target.value } : r))}
                    style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 7, color: T.text, fontFamily: FONT, fontSize: "0.75rem", padding: "4px 8px", outline: "none", cursor: "pointer" }}
                  >
                    {cats.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {entries.length > 1 && (
                    <button onClick={() => removeRow(i)} style={{ background: "none", border: "none", cursor: "pointer", color: T.text3, display: "flex", padding: 2 }}><X size={14} /></button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addRow} style={{ width: "100%", padding: "9px", background: T.bg3, border: `1.5px dashed ${T.border2}`, borderRadius: 10, color: T.text2, fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", marginBottom: 16, fontFamily: FONT }}>
              + Add Expense
            </button>

            {catTotals.length > 0 && (
              <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px", marginBottom: 16 }}>
                <div style={{ fontSize: "0.72rem", color: T.text2, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: ".04em" }}>Today's breakdown</div>
                {catTotals.map(c => (
                  <div key={c.cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: CAT_COLORS[c.cat] ?? "#8b9dc3", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.8rem", color: T.text2 }}>{c.cat}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 80, height: 5, background: T.border, borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: 5, borderRadius: 99, background: CAT_COLORS[c.cat] ?? "#8b9dc3", width: `${(c.total / total) * 100}%` }} />
                      </div>
                      <span style={{ fontWeight: 700, color: T.text, fontSize: "0.82rem", minWidth: 50, textAlign: "right" }}>${c.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 8, marginTop: 8, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: T.text2 }}>Total today</span>
                  <span style={{ fontWeight: 900, color: T.text, fontSize: "1rem" }}>${total.toFixed(2)}</span>
                </div>
              </div>
            )}

            <button onClick={save} disabled={!entries.some(e => e.desc && e.amount)} className={entries.some(e => e.desc && e.amount) ? "btn-3d-green" : ""} style={{ width: "100%", padding: "12px", borderRadius: 12, fontWeight: 800, fontSize: "0.9rem", background: !entries.some(e => e.desc && e.amount) ? T.bg3 : undefined, color: !entries.some(e => e.desc && e.amount) ? T.text3 : undefined, border: "none", cursor: !entries.some(e => e.desc && e.amount) ? "not-allowed" : "pointer", fontFamily: FONT }}>
              Save & Earn 30 XP
            </button>
          </>
        )}

        {activeTab === "today" && submitted && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>✅</div>
            <h3 style={{ fontWeight: 800, color: T.text, fontSize: "1.1rem", marginBottom: 6 }}>Diary saved!</h3>
            <p style={{ color: T.text2, fontSize: "0.875rem", marginBottom: 20 }}>Total spent today: <strong style={{ color: T.text }}>${total.toFixed(2)}</strong></p>
            <button onClick={onBack} className="btn-3d-green" style={{ padding: "11px 32px", fontSize: "0.875rem" }}>Back to Activities</button>
          </div>
        )}

        {activeTab === "history" && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: "0.72rem", color: T.text2, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 12 }}>Last 7 Days</div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 80 }}>
                {last7.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ fontSize: "0.62rem", color: T.text3 }}>${d.total > 0 ? d.total.toFixed(0) : ""}</div>
                    <div style={{ width: "100%", background: d.date === todayStr ? T.green : T.border, borderRadius: 4, height: `${Math.max((d.total / maxDay) * 60, d.total > 0 ? 4 : 0)}px`, minHeight: d.total > 0 ? 4 : 0, transition: "height .4s ease" }} />
                    <div style={{ fontSize: "0.58rem", color: T.text3, whiteSpace: "nowrap" }}>{d.date === todayStr ? "Today" : new Date(d.date).toLocaleDateString("en-NZ", { weekday: "short" })}</div>
                  </div>
                ))}
              </div>
            </div>
            {allEntries.length === 0 ? (
              <p style={{ color: T.text3, fontSize: "0.82rem", textAlign: "center", padding: "24px 0" }}>No entries yet. Start tracking today!</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Array.from(new Set(allEntries.map(e => e.date))).sort((a,b) => new Date(b).getTime() - new Date(a).getTime()).slice(0, 7).map(date => {
                  const dayEntries = allEntries.filter(e => e.date === date);
                  const dayTotal = dayEntries.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
                  return (
                    <div key={date} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, color: T.text, fontSize: "0.82rem" }}>{date === todayStr ? "Today" : new Date(date).toLocaleDateString("en-NZ", { weekday: "long", day: "numeric", month: "short" })}</span>
                        <span style={{ fontWeight: 800, color: T.text }}>${dayTotal.toFixed(2)}</span>
                      </div>
                      {dayEntries.map((e, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: T.text2, padding: "2px 0" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 7, height: 7, borderRadius: "50%", background: CAT_COLORS[e.category] ?? "#8b9dc3", flexShrink: 0 }} />
                            {e.desc}
                          </div>
                          <span>${parseFloat(e.amount).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


function XPCelebration({ xp, onDone }: { xp: number; onDone: () => void }) {
  const { isDark } = useTheme();
  const T = { bg: isDark?"#0d1526":"#f0f4f8", bg2: isDark?"#111c30":"#ffffff", bg3: isDark?"#1a2540":"#f8fafc", card: isDark?"#111c30":"#ffffff", text: isDark?"#ffffff":"#0d1526", text2: isDark?"#8b9dc3":"#475569", text3: isDark?"#4a6a8a":"#94a3b8", border: isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)", border2: isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.16)", input: isDark?"rgba(255,255,255,.06)":"#f8fafc", inputBorder: isDark?"rgba(255,255,255,.12)":"rgba(0,0,0,.14)", shadow: isDark?"rgba(0,0,0,.4)":"rgba(0,0,0,.08)", green: isDark?"#76AD25":"#5a9a1a", accent: isDark?"#f59e0b":"#d97706", strip: isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)" };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(6,13,26,.92)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: FONT }}>
      <Confetti active />
      <div style={{ width: 90, height: 90, borderRadius: "50%", background: "linear-gradient(135deg, #76AD25, #22c55e)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 0 40px rgba(118,173,37,.5)" }}>
        <Zap size={44} color="#fff" fill="#fff" />
      </div>
      <div style={{ fontSize: "0.875rem", color: "#76AD25", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>Activity Complete</div>
      <div style={{ fontSize: "3.5rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>
        +<XPCounter target={xp} />
      </div>
      <div style={{ fontSize: "1.1rem", color: T.text2, marginBottom: 32, marginTop: 4 }}>XP earned</div>
      <button onClick={onDone} style={{ padding: "14px 40px", background: "#76AD25", color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: "1rem", cursor: "pointer", fontFamily: FONT, boxShadow: "0 4px 20px rgba(118,173,37,.4)" }}>
        Continue
      </button>
    </div>
  );
}

// ── Main Activities Hub ───────────────────────────────────────────────────
export default function ActivitiesPage() {
  const { isDark } = useTheme();
  const T = {
    bg:      isDark ? "#0d1526" : "#f0f4f8",
    bg2:     isDark ? "#111c30" : "#ffffff",
    bg3:     isDark ? "#1a2540" : "#f8fafc",
    text:    isDark ? "#ffffff" : "#0d1526",
    text2:   isDark ? "#8b9dc3" : "#475569",
    text3:   isDark ? "#4a6a8a" : "#94a3b8",
    border:  isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.08)",
    border2: isDark ? "rgba(255,255,255,.14)" : "rgba(0,0,0,.16)",
    card:    isDark ? "#111c30" : "#ffffff",
    input:   isDark ? "rgba(255,255,255,.06)" : "#f8fafc",
    inputBorder: isDark ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.14)",
    shadow:  isDark ? "rgba(0,0,0,.4)" : "rgba(0,0,0,.08)",
    green:   isDark ? "#76AD25" : "#5a9a1a",
    accent:  isDark ? "#f59e0b" : "#d97706",
    strip:   isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.02)",
  };

  const [filter, setFilter] = useState("all");
  const [activeActivity, setActiveActivity] = useState<ActivityDef | null>(null);
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
              <h1 style={{ fontWeight: 900, fontSize: "1.4rem", color: "#fff", fontFamily: FONT }}>Activities</h1>
            </div>
            <p style={{ color: T.text2, fontSize: "0.875rem", marginBottom: 18, fontFamily: FONT }}>Earn XP through quizzes, simulations, and daily challenges</p>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ background: "rgba(245,158,11,.15)", border: "1px solid rgba(245,158,11,.25)", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 6 }}>
                <Zap size={15} color="#f59e0b" />
                <div>
                  <div style={{ fontSize: "0.65rem", color: "#f59e0b", fontWeight: 700, textTransform: "uppercase" }}>Your XP</div>
                  <div style={{ fontWeight: 900, color: "#fff", fontSize: "1rem", fontFamily: FONT }}>{xp.toLocaleString()}</div>
                </div>
              </div>
              <div style={{ background: "rgba(128,128,128,.08)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 6 }}>
                <Star size={15} color="#a78bfa" />
                <div>
                  <div style={{ fontSize: "0.65rem", color: "#a78bfa", fontWeight: 700, textTransform: "uppercase" }}>Activities</div>
                  <div style={{ fontWeight: 900, color: "#fff", fontSize: "1rem", fontFamily: FONT }}>{ACTIVITIES.length} available</div>
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
                background: filter === key ? "#0d1526" : "#fff",
                color: filter === key ? "#fff" : "#475569",
                border: `1px solid ${filter === key ? "#0d1526" : "#e2e8f0"}`,
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
                  background: T.card, border: `1.5px solid ${locked ? "#f1f5f9" : "#e2e8f0"}`,
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
                      {locked ? <Lock size={20} color="#94a3b8" /> : <Icon size={22} color={activity.iconColor} />}
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
                          <Timer size={11} color="#94a3b8" />
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
