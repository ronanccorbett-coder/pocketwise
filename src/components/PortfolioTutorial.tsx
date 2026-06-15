"use client";
import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme";
import { ChevronRight, ChevronLeft, Check, BookOpen, TrendingUp, Home, CreditCard, Package, Zap } from "lucide-react";

const FONT = "Inter, system-ui, sans-serif";

type TutorialSlide = {
  title: string;
  content: string;
  highlight?: string;
  visual?: "stocks" | "property" | "loans" | "assets";
  quiz?: { q: string; options: string[]; correct: number; explanation: string };
};

const TUTORIALS: Record<string, { title: string; icon: any; color: string; slides: TutorialSlide[] }> = {

  Markets: {
    title: "Stock Market", icon: TrendingUp, color: "#76AD25",
    slides: [
      {
        title: "What is a share?",
        content: "When a company wants to grow, it can sell small pieces of ownership called shares. When you buy a share, you become a part-owner of that company. If the company does well, your shares become more valuable. New Zealand's stock exchange is called the NZX.",
        highlight: "Shares = Ownership in a company",
      },
      {
        title: "How share prices move",
        content: "Share prices change every second based on supply and demand. If more people want to buy a share than sell it, the price goes up. Bad news about a company (or the economy) causes prices to fall. This is completely normal — prices fluctuate constantly.",
        highlight: "Price up = more buyers than sellers",
      },
      {
        title: "Making money from shares",
        content: "There are two ways to profit: Capital gains — you buy at $5 and sell at $8, earning $3 per share. Dividends — some companies pay a portion of their profits to shareholders regularly, like a quarterly cash payment, even if you never sell.",
        highlight: "Profit = Capital Gains + Dividends",
      },
      {
        title: "Risk and diversification",
        content: "All investments carry risk — prices can fall as well as rise. The golden rule is diversification: never put all your money in one company. If that company fails, you lose everything. Spreading across different sectors (tech, retail, banking) reduces your risk.",
        highlight: "Never put all eggs in one basket",
      },
      {
        title: "Reading a stock listing",
        content: "When you look at a stock, you see: Price (current value per share), Change % (how much it moved today), Dividend yield (annual dividends as a % of price), and Volume (how many shares traded today). Focus on fundamentals, not just daily movements.",
        highlight: "Price, Change, Yield, Volume",
        visual: "stocks",
      },
      {
        title: "Quiz time",
        content: "Let's check your understanding before you start trading.",
        quiz: {
          q: "A company's share price falls 10% in one day. What does this most likely mean?",
          options: ["The company is bankrupt", "More people wanted to sell than buy", "The government banned the company", "Dividends were paid"],
          correct: 1,
          explanation: "A price drop means sellers outnumbered buyers — could be bad news, a market downturn, or profit-taking. It does not mean the company is bankrupt.",
        },
      },
    ],
  },

  Property: {
    title: "Property Investment", icon: Home, color: "#3B82F6",
    slides: [
      {
        title: "Why invest in property?",
        content: "Property is New Zealand's most popular investment. Unlike shares, you can borrow money (a mortgage) to buy property, meaning you only need a 20% deposit. This leverage amplifies both gains and losses. Auckland median house prices have risen around 7% per year over the last 30 years.",
        highlight: "NZ property is a leveraged investment",
      },
      {
        title: "How a mortgage works",
        content: "A mortgage is a long-term loan secured against your property. You borrow 80% of the purchase price from the bank, put in 20% yourself (the deposit), then repay weekly over 25-30 years. The bank charges interest on the outstanding balance — currently around 6-7% in NZ.",
        highlight: "Mortgage = Bank loan secured on property",
      },
      {
        title: "Rental income and cashflow",
        content: "If you rent your property, tenants pay you weekly rent. Your cashflow is rent minus mortgage repayments. Most NZ investment properties are negatively geared — rent is less than mortgage, meaning you top up the difference from your salary. You profit from capital gains when you eventually sell.",
        highlight: "Cashflow = Rent minus Mortgage",
      },
      {
        title: "The costs of property",
        content: "Property has ongoing costs: rates (council tax, ~$3,000/year), insurance (~$1,500/year), maintenance (budget 1% of property value), property management fees if you hire a manager (8-10% of rent), and potential vacancy periods when the property is empty.",
        highlight: "Factor in rates, insurance, maintenance",
      },
      {
        title: "Capital gains",
        content: "New Zealand does not have a general capital gains tax (though the bright-line test taxes profits if you sell within 2 years). This means the profit you make when selling a property is mostly tax-free. This is why property has been so popular as a long-term investment.",
        highlight: "NZ: No general capital gains tax",
        visual: "property",
      },
      {
        title: "Quiz time",
        content: "Test your property knowledge.",
        quiz: {
          q: "A property costs $600,000. What is the minimum deposit you typically need to buy it in NZ?",
          options: ["$30,000 (5%)", "$60,000 (10%)", "$120,000 (20%)", "$180,000 (30%)"],
          correct: 2,
          explanation: "NZ banks typically require a 20% deposit for investment properties — that's $120,000 on a $600,000 property. The bank lends the remaining $480,000.",
        },
      },
    ],
  },

  Loans: {
    title: "Debt and Loans", icon: CreditCard, color: "#EF4444",
    slides: [
      {
        title: "What is interest?",
        content: "Interest is the cost of borrowing money. If you borrow $1,000 at 10% annual interest, you pay $100 extra per year just for having the loan. Interest rates are expressed as APR (Annual Percentage Rate). The higher the rate, the more expensive the debt.",
        highlight: "Interest = The price of borrowed money",
      },
      {
        title: "Good debt vs bad debt",
        content: "Not all debt is equal. Good debt (like a student loan or mortgage) helps you build assets or earn more income. Bad debt (like credit cards or payday loans) funds consumption and charges high interest. The difference is whether the debt helps you build wealth or drains it.",
        highlight: "Good debt builds assets. Bad debt drains wealth.",
      },
      {
        title: "Compound interest works against you",
        content: "On a credit card at 22% interest, if you only pay the minimum each month, a $3,000 balance takes over 10 years to pay off and costs you $5,000+ in interest alone. Compound interest builds on itself — interest on unpaid interest. Pay off high-interest debt as fast as possible.",
        highlight: "Compound interest can trap you in debt",
      },
      {
        title: "The debt snowball vs avalanche",
        content: "Two strategies for paying off multiple debts. Snowball: pay off smallest balance first for quick wins and motivation. Avalanche: pay highest interest rate first to save the most money mathematically. Both work — choose the one you will actually stick to.",
        highlight: "Snowball = motivation. Avalanche = optimal.",
      },
      {
        title: "NZ student loans",
        content: "NZ student loans are interest-free while you live in NZ — this is unique and very valuable. Repayments start automatically at 12 cents per dollar earned above $22,828/year through PAYE. If you move overseas, interest applies at around 3.5%. Never take a payday loan to cover a student loan.",
        highlight: "NZ student loans are interest-free in NZ",
        visual: "loans",
      },
      {
        title: "Quiz time",
        content: "Final check before exploring loans.",
        quiz: {
          q: "A payday loan charges 365% APR. You borrow $200 for 2 weeks. Approximately how much do you repay?",
          options: ["$202", "$215", "$228", "$276"],
          correct: 2,
          explanation: "365% APR = 1% per day. 14 days = 14% extra. $200 x 1.14 = $228. Payday loans are extremely expensive for short-term borrowing.",
        },
      },
    ],
  },

  Assets: {
    title: "Assets and Depreciation", icon: Package, color: "#a78bfa",
    slides: [
      {
        title: "What is an asset?",
        content: "An asset is something you own that has value. Assets can be physical (car, equipment, property) or financial (shares, KiwiSaver). On your balance sheet, assets appear on one side and liabilities (debts) on the other. Net worth = Total Assets minus Total Liabilities.",
        highlight: "Net Worth = Assets minus Liabilities",
      },
      {
        title: "Appreciating vs depreciating assets",
        content: "Some assets go up in value over time (property, shares) — these are appreciating assets. Others lose value (cars, electronics, machinery) — these are depreciating assets. A new car loses around 20% of its value the moment you drive it off the lot. This is called depreciation.",
        highlight: "Cars depreciate. Property appreciates.",
      },
      {
        title: "Income-generating assets",
        content: "The best assets generate income. A rental property earns rent. Shares pay dividends. A vending machine earns weekly cash. Even a delivery scooter generates income. Building a portfolio of income-generating assets is the foundation of financial independence — money working for you.",
        highlight: "Build assets that generate income",
      },
      {
        title: "Opportunity cost",
        content: "Every purchase has an opportunity cost — what else could you have done with that money? Spending $1,000 on a gaming setup means you cannot invest that $1,000. If the investment grew at 8% annually, after 30 years it would be $10,063. Every spending decision has a hidden long-term cost.",
        highlight: "Every dollar spent cannot be invested",
      },
      {
        title: "Building your asset base",
        content: "Financial success comes from systematically converting income into assets. The formula: Earn money, spend less than you earn, invest the difference in appreciating or income-generating assets, repeat. Over time, your assets generate their own income, reducing your dependence on a job.",
        highlight: "Earn → Save → Invest → Repeat",
        visual: "assets",
      },
      {
        title: "Quiz time",
        content: "Last check before exploring assets.",
        quiz: {
          q: "Which of the following is a depreciating asset?",
          options: ["Investment property in Auckland", "Shares in a growing company", "A 3-year-old car", "A KiwiSaver fund"],
          correct: 2,
          explanation: "Cars lose value over time due to wear, age, and new models. Property and shares typically appreciate. KiwiSaver grows through contributions and returns.",
        },
      },
    ],
  },
};

type TutorialProps = {
  section: string;
  onComplete: () => void;
};

export default function PortfolioTutorial({ section, onComplete }: TutorialProps) {
  const { isDark } = useTheme();
  const T = {
    bg: isDark ? "#0d1526" : "#f0f4f8", card: isDark ? "#111c30" : "#ffffff",
    text: isDark ? "#ffffff" : "#0d1526", text2: isDark ? "#8b9dc3" : "#475569",
    text3: isDark ? "#4a6a8a" : "#94a3b8", border: isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.08)",
    bg3: isDark ? "#1a2540" : "#f8fafc",
  };

  const tutorial = TUTORIALS[section];
  const [step, setStep]         = useState(0);
  const [quizAnswer, setQuiz]   = useState<number | null>(null);
  const [quizDone, setQuizDone] = useState(false);
  const [entered, setEntered]   = useState(false);

  useEffect(() => { setTimeout(() => setEntered(true), 50); }, []);

  if (!tutorial) { onComplete(); return null; }

  const slide = tutorial.slides[step];
  const total = tutorial.slides.length;
  const isLast = step === total - 1;
  const isQuiz = !!slide.quiz;
  const Icon = tutorial.icon;
  const pct = ((step) / (total - 1)) * 100;
  const canNext = !isQuiz || quizDone;

  function next() {
    if (!canNext) return;
    if (isLast) { onComplete(); return; }
    setStep(s => s + 1);
    setQuiz(null); setQuizDone(false);
  }

  function handleQuiz(i: number) {
    if (quizDone) return;
    setQuiz(i);
    if (i === slide.quiz!.correct) setTimeout(() => setQuizDone(true), 1200);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 600, background: "rgba(7,14,26,.88)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem",
      fontFamily: FONT, animation: "pw-fade-in .3s ease",
    }}>
      <div style={{
        background: "#111c30", border: `1.5px solid ${tutorial.color}33`,
        borderRadius: 22, width: "100%", maxWidth: 560,
        boxShadow: `0 24px 64px rgba(0,0,0,.5), 0 0 0 1px ${tutorial.color}22`,
        transform: entered ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
        transition: "transform .4s cubic-bezier(.34,1.56,.64,1), opacity .3s",
        opacity: entered ? 1 : 0,
        overflow: "hidden",
      }}>

        {/* Progress bar */}
        <div style={{ height: 3, background: "#1a2540" }}>
          <div style={{ height: 3, background: tutorial.color, width: `${pct}%`, transition: "width .5s cubic-bezier(.34,1.56,.64,1)", boxShadow: `0 0 8px ${tutorial.color}` }} />
        </div>

        {/* Header */}
        <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${tutorial.color}18`, border: `1.5px solid ${tutorial.color}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={20} color={tutorial.color} />
          </div>
          <div>
            <div style={{ fontSize: "0.65rem", color: tutorial.color, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: ".06em" }}>Tutorial — {tutorial.title}</div>
            <div style={{ fontWeight: 800, color: "#ffffff", fontSize: "0.9rem" }}>{slide.title}</div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: "0.72rem", color: "#4a6a8a", flexShrink: 0 }}>{step + 1} / {total}</div>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px" }}>

          {!isQuiz ? (
            <>
              <p style={{ color: "#8b9dc3", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: 16 }}>{slide.content}</p>
              {slide.highlight && (
                <div style={{ background: `${tutorial.color}12`, border: `1.5px solid ${tutorial.color}30`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                  <Zap size={15} color={tutorial.color} fill={tutorial.color} style={{ flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, color: tutorial.color, fontSize: "0.85rem" }}>{slide.highlight}</span>
                </div>
              )}
            </>
          ) : (
            <>
              <p style={{ color: "#8b9dc3", fontSize: "0.875rem", marginBottom: 16 }}>{slide.content}</p>
              <div style={{ background: "#1a2540", border: `1px solid ${"rgba(255,255,255,.07)"}`, borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                <div style={{ fontWeight: 700, color: "#ffffff", fontSize: "0.875rem", marginBottom: 12 }}>{slide.quiz!.q}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {slide.quiz!.options.map((opt, i) => {
                    const isCorrect = i === slide.quiz!.correct;
                    const isSelected = quizAnswer === i;
                    const showResult = quizAnswer !== null;
                    let bg = "#1a2540", border = "rgba(255,255,255,.07)", color = "#8b9dc3";
                    if (showResult && isCorrect) { bg = "rgba(118,173,37,.15)"; border = "rgba(118,173,37,.4)"; color = "#76AD25"; }
                    else if (showResult && isSelected && !isCorrect) { bg = "rgba(239,68,68,.1)"; border = "rgba(239,68,68,.3)"; color = "#EF4444"; }
                    return (
                      <button key={i} onClick={() => handleQuiz(i)} disabled={quizDone || quizAnswer !== null} style={{
                        textAlign: "left" as const, padding: "10px 14px", borderRadius: 9,
                        background: bg, border: `1.5px solid ${border}`, color,
                        fontWeight: isSelected || (showResult && isCorrect) ? 700 : 500,
                        fontSize: "0.82rem", cursor: quizAnswer !== null ? "default" : "pointer",
                        fontFamily: FONT, transition: "all .25s",
                        display: "flex", alignItems: "center", gap: 8,
                      }}>
                        <span style={{ width: 22, height: 22, borderRadius: "50%", background: showResult && isCorrect ? "rgba(118,173,37,.2)" : showResult && isSelected ? "rgba(239,68,68,.15)" : "#0d1526", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800, flexShrink: 0, color: showResult && isCorrect ? "#76AD25" : showResult && isSelected ? "#EF4444" : "#4a6a8a" }}>
                          {showResult && isCorrect ? <Check size={12} /> : String.fromCharCode(65 + i)}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {quizAnswer !== null && (
                  <div style={{ marginTop: 12, padding: "10px 12px", background: quizAnswer === slide.quiz!.correct ? "rgba(118,173,37,.08)" : "rgba(239,68,68,.06)", borderRadius: 8, fontSize: "0.78rem", color: "#8b9dc3", lineHeight: 1.5, animation: "pw-slide-up .3s ease" }}>
                    <strong style={{ color: quizAnswer === slide.quiz!.correct ? "#76AD25" : "#EF4444" }}>
                      {quizAnswer === slide.quiz!.correct ? "Correct!" : "Not quite —"}
                    </strong>{" "}
                    {slide.quiz!.explanation}
                    {quizAnswer !== slide.quiz!.correct && (
                      <div style={{ marginTop: 8 }}>
                        <button onClick={() => { setQuiz(null); }} style={{ background: "none", border: "none", color: "#3B82F6", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", fontFamily: FONT }}>
                          Try again
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "0 24px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => { if (step > 0) { setStep(s => s - 1); setQuiz(null); setQuizDone(false); } }} disabled={step === 0} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: step === 0 ? "#4a6a8a" : "#8b9dc3", fontWeight: 600, fontSize: "0.82rem", cursor: step === 0 ? "default" : "pointer", fontFamily: FONT }}>
            <ChevronLeft size={16} /> Back
          </button>

          {/* Step dots */}
          <div style={{ display: "flex", gap: 5 }}>
            {tutorial.slides.map((_, i) => (
              <div key={i} style={{ width: i === step ? 20 : 7, height: 7, borderRadius: 99, background: i < step ? tutorial.color : i === step ? tutorial.color : "rgba(255,255,255,.07)", transition: "all .3s cubic-bezier(.34,1.56,.64,1)", opacity: i < step ? 0.5 : 1 }} />
            ))}
          </div>

          <button onClick={next} disabled={!canNext} className={canNext ? "btn-3d-green" : ""} style={{
            padding: "9px 20px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
            background: !canNext ? "#1a2540" : undefined, color: !canNext ? "#4a6a8a" : undefined,
            border: "none", borderRadius: 10, cursor: !canNext ? "not-allowed" : "pointer", fontFamily: FONT,
          }}>
            {isLast ? <><Check size={14} /> Start Trading</> : <>Next <ChevronRight size={14} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

export { TUTORIALS };
