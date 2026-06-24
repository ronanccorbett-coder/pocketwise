"use client";
import { createContext, useContext, useEffect, useRef, useCallback, ReactNode } from "react";
import { id } from "@instantdb/react";
import { db } from "./db";
import { generateWeeklyNews, generateLifeEvent, shouldFireLifeEvent } from "./events";
import { STOCK_BY_SYMBOL, buyCost as calcBuyCost, sellProceeds as calcSellProceeds } from "./stockSimulator";

// ── XP Gates ──────────────────────────────────────────────────────────────
export const XP_GATES = {
  buyStock:    100,
  buyAsset:    150,
  takeLoan:    300,
  dayTrading:  500,
  buyProperty: 800,
  jobEntry:    0,
  jobJunior:   200,
  jobGraduate: 500,
  jobSenior:   1500,
  casino:      10000,
} as const;

// ── Daily tick — 24 real hours ────────────────────────────────────────────
const DAY_MS = 24 * 60 * 60 * 1000;

// ── Types ──────────────────────────────────────────────────────────────────
export type GameUser = {
  id: string;
  email: string;
  role: "student" | "educator" | "admin";
};

export type UserState = {
  id: string;
  userId: string;
  xp: number;
  balance: number;
  totalEarned: number;
  totalInvested: number;
  totalDebt: number;
  netWorth: number;
  streak: number;
  lastActivityDate: number;
  completedLessons: string[];
  completedModules: string[];
  badges: string[];
  currentJobId: string | null;
  lastSalaryPaid: number;
  lastWeeklyTick: number;
  pendingLifeEvent: string | null;
  pendingNews: string | null;
  goals: string | null;
};

export type Stock = {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: number;
  currentValue: number;
  dividendsEarned: number;
};

export type Property = {
  id: string;
  userId: string;
  name: string;
  purchasePrice: number;
  currentValue: number;
  purchaseDate: number;
  weeklyRent: number;
  mortgageWeekly: number;
  mortgageBalance: number;
};

export type Loan = {
  id: string;
  userId: string;
  name: string;
  principal: number;
  balance: number;
  interestRate: number;
  weeklyRepayment: number;
  startDate: number;
};

export type Asset = {
  id: string;
  userId: string;
  name: string;
  category: string;
  purchasePrice: number;
  currentValue: number;
  depreciationRate: number;
  purchaseDate: number;
};

type GameCtx = {
  user: GameUser | null;
  state: UserState | null;
  stocks: Stock[];
  properties: Property[];
  loans: Loan[];
  assets: Asset[];
  isLoading: boolean;
  isNewUser: boolean;
  canAccess: (gate: keyof typeof XP_GATES) => boolean;
  addXp: (amount: number) => void;
  addBalance: (amount: number) => void;
  completeLesson: (lessonId: string, xpReward: number, cashReward?: number, lessonTitle?: string) => void;
  applyForJob: (jobId: string, salary: number) => void;
  updateStockPrice: (stockId: string, newPrice: number) => void;
  buyStock: (symbol: string, name: string, qty: number, price: number) => boolean;
  sellStock: (stockId: string, qtyOrPrice: number, maybePrice?: number) => void;
  buyProperty: (name: string, price: number, weeklyRent: number, mortgageWeekly: number) => boolean;
  takeLoan: (name: string, principal: number, rate: number, weeklyRepayment: number) => boolean;
  repayLoan: (loanId: string, amount: number) => void;
  buyAsset: (name: string, category: string, price: number, depRate: number) => boolean;
  casinoWin: (amount: number) => void;
  casinoLoss: (amount: number) => void;
  completeOnboarding: (name: string) => void;
  clearPendingEvent: () => void;
  clearPendingNews: () => void;
  setGoals: (goals: any[]) => void;
  signOut: () => void;
};

const Ctx = createContext<GameCtx | null>(null);
export function useGame() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const { user: authUser, isLoading: authLoading } = db.useAuth();

  const { data: stateData } = db.useQuery(
    authUser ? { userState: { $: { where: { userId: authUser.id } } } } : null
  );
  const { data: stockData } = db.useQuery(
    authUser ? { userStocks: { $: { where: { userId: authUser.id } } } } : null
  );
  const { data: propData } = db.useQuery(
    authUser ? { userProperties: { $: { where: { userId: authUser.id } } } } : null
  );
  const { data: loanData } = db.useQuery(
    authUser ? { userLoans: { $: { where: { userId: authUser.id } } } } : null
  );
  const { data: assetData } = db.useQuery(
    authUser ? { userAssets: { $: { where: { userId: authUser.id } } } } : null
  );

  const allStates = (stateData?.userState ?? []) as UserState[];
  const rawState  = allStates[0] ?? null;
  const stocks    = (stockData?.userStocks ?? []) as Stock[];
  const properties = (propData?.userProperties ?? []) as Property[];
  const loans     = (loanData?.userLoans ?? []) as Loan[];
  const assets    = (assetData?.userAssets ?? []) as Asset[];

  // Sync email to userState so leaderboard can show names
  useEffect(() => {
    if (!authUser || !rawState || !authUser.email) return;
    if ((rawState as any).email === authUser.email) return;
    db.transact((db as any).tx.userState[rawState.id].update({ email: authUser.email }));
  }, [authUser?.email, rawState?.id]);

  // Clean up duplicate userState rows — keep the one with the most XP
  const bootstrapRef = useRef(false);
  useEffect(() => {
    if (!authUser || authLoading || stateData === undefined) return;
    if (allStates.length > 1) {
      // Keep highest XP row, delete the rest
      const sorted = [...allStates].sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0));
      const toDelete = sorted.slice(1);
      db.transact(toDelete.map(s => (db as any).tx.userState[s.id].delete()));
      return;
    }
  }, [allStates.length, authUser, authLoading]);

  // Track whether this is a brand new user (no state record yet)
  const isNewUser = !authLoading && !!authUser && allStates.length === 0 && stateData !== undefined;

  // Bootstrap new user — guarded by ref to prevent double-fire
  useEffect(() => {
    if (!authUser || authLoading || stateData === undefined) return;
    if (allStates.length > 0) return;
    if (bootstrapRef.current) return;
    bootstrapRef.current = true;
    // Check if they signed up as teacher (stored pre-login)
    const pendingRole = typeof window !== "undefined" ? localStorage.getItem("pw_pending_role") : null;
    const pendingSchool = typeof window !== "undefined" ? localStorage.getItem("pw_pending_school") : null;
    const pendingMsg = typeof window !== "undefined" ? localStorage.getItem("pw_pending_msg") : null;
    const isTeacher = pendingRole === "teacher";
    db.transact(
      (db as any).tx.userState[id()].update({
        userId: authUser.id,
        email: authUser.email ?? "",
        role: isTeacher ? "teacher" : "student",
        teacherApproved: false,
        xp: 0,
        balance: 5000,
        totalEarned: 5000,
        totalInvested: 0,
        totalDebt: 0,
        netWorth: 5000,
        streak: 0,
        lastActivityDate: Date.now(),
        completedLessons: [],
        completedModules: [],
        badges: [],
        currentJobId: null,
        lastSalaryPaid: Date.now(),
        lastWeeklyTick: Date.now(),
      })
    );
    // Submit teacher request
    if (isTeacher) {
      db.transact(
        (db as any).tx.teacherRequests[id()].update({
          userId: authUser.id,
          email: authUser.email ?? "",
          fullName: authUser.email?.split("@")[0] ?? "",
          school: pendingSchool ?? "",
          message: pendingMsg ?? "",
          status: "pending",
          createdAt: Date.now(),
        })
      );
      localStorage.removeItem("pw_pending_role");
      localStorage.removeItem("pw_pending_school");
      localStorage.removeItem("pw_pending_msg");
    }
  }, [authUser, rawState, authLoading, stateData]);

  // ── Daily tick — runs every 60 seconds, triggers if 24hrs have passed ──
  const tickRef = useRef(false);
  useEffect(() => {
    if (!rawState) return;
    const interval = setInterval(async () => {
      if (tickRef.current) return;
      const now = Date.now();
      const lastTick = rawState.lastWeeklyTick ?? 0;
      if (now - lastTick < DAY_MS) return;

      tickRef.current = true;
      try {
        let balanceDelta = 0;
        const txns: any[] = [];

        // Salary — paid daily
        if (rawState.currentJobId) {
          const jobSalary = parseInt(rawState.currentJobId.split(":")[1] || "0");
          if (jobSalary > 0) balanceDelta += jobSalary;
        }

        // Loan repayments — daily portion
        loans.forEach(loan => {
          if ((loan.balance ?? 0) > 0) {
            const dailyRepay = (loan.weeklyRepayment ?? 0) / 7;
            const dailyInterest = (loan.balance ?? 0) * ((loan.interestRate ?? 0) / 365 / 100);
            const newBalance = Math.max(0, (loan.balance ?? 0) - dailyRepay + dailyInterest);
            balanceDelta -= dailyRepay;
            txns.push(
              (db as any).tx.userLoans[loan.id].update({ balance: newBalance })
            );
          }
        });

        // Stock dividends — daily portion (annualised yield ÷ 365)
        stocks.forEach(stock => {
          const meta = STOCK_BY_SYMBOL[stock.symbol];
          if (meta && meta.divYieldAnnual > 0) {
            const dailyDiv = ((stock.currentValue ?? meta.basePrice) * (stock.quantity ?? 0) * meta.divYieldAnnual) / 365;
            balanceDelta += dailyDiv;
            txns.push(
              (db as any).tx.userStocks[stock.id].update({
                dividendsEarned: (stock.dividendsEarned ?? 0) + dailyDiv,
              })
            );
          }
        });

        // Property rent and mortgage — daily portion
        properties.forEach(prop => {
          balanceDelta += (prop.weeklyRent ?? 0) / 7;
          balanceDelta -= (prop.mortgageWeekly ?? 0) / 7;
        });

        const newBalance = Math.max(0, (rawState.balance ?? 5000) + balanceDelta);
        const totalDebt = loans.reduce((s, l) => s + (l.balance ?? 0), 0);
        const stockInvested = stocks.reduce((s, st) => s + (st.currentValue ?? 0) * (st.quantity ?? 0), 0);
        const propInvested = properties.reduce((s, p) => s + (p.currentValue ?? 0), 0);
        const totalInvested = stockInvested + propInvested;

        // Fire random life event ~40% of days
        let lifeEventDelta = 0;
        let pendingEvent = null;
        if (shouldFireLifeEvent()) {
          const ev = generateLifeEvent();
          lifeEventDelta = ev.balanceChange;
          pendingEvent = ev;
        }

        // Fire weekly news ~once every 7 days
        const daysSinceTick = (now - lastTick) / DAY_MS;
        let pendingNews = null;
        if (Math.random() < (daysSinceTick / 7)) {
          pendingNews = generateWeeklyNews();
        }

        const finalBalance = Math.max(0, newBalance + lifeEventDelta);

        await db.transact([
          (db as any).tx.userState[rawState.id].update({
            balance: finalBalance,
            totalEarned: (rawState.totalEarned ?? 0) + Math.max(0, balanceDelta + lifeEventDelta),
            totalDebt,
            totalInvested,
            netWorth: finalBalance + totalInvested - totalDebt,
            lastWeeklyTick: now,
            pendingLifeEvent: pendingEvent ? JSON.stringify(pendingEvent) : null,
            pendingNews: pendingNews ? JSON.stringify(pendingNews) : null,
          }),
          ...txns,
        ]);

        // Fire salary toast if meaningful income
        if (balanceDelta > 0) {
          window.dispatchEvent(new CustomEvent("pw:salary", { detail: { amount: balanceDelta } }));
        }
      } finally {
        tickRef.current = false;
      }
    }, 60000); // check every 60 seconds

    return () => clearInterval(interval);
  }, [rawState?.id, rawState?.lastWeeklyTick, rawState?.currentJobId, loans.length, stocks.length, properties.length]);

  // ── Helpers ──
  function sid(): string { return rawState?.id ?? ""; }

  const canAccess = useCallback((gate: keyof typeof XP_GATES) => {
    return (rawState?.xp ?? 0) >= XP_GATES[gate];
  }, [rawState?.xp]);

  const addXp = useCallback((amount: number) => {
    if (!rawState || !sid()) return;
    const newXp = (rawState.xp ?? 0) + amount;
    const badges = [...(rawState.badges as string[] ?? [])];
    if (newXp >= 100  && !badges.includes("first_hundred"))  badges.push("first_hundred");
    if (newXp >= 500  && !badges.includes("five_hundred"))   badges.push("five_hundred");
    if (newXp >= 1000 && !badges.includes("one_thousand"))   badges.push("one_thousand");
    if (newXp >= 5000 && !badges.includes("five_thousand"))  badges.push("five_thousand");
    db.transact((db as any).tx.userState[sid()].update({ xp: newXp, badges, lastActivityDate: Date.now() }));
  }, [rawState]);

  // Keep a ref to rawState so async callbacks (casino games, intervals, etc.)
  // always read the latest balance instead of a stale closure snapshot.
  // This fixes the casino payout bug where bet + winnings stacked together.
  const rawStateRef = useRef(rawState);
  useEffect(() => { rawStateRef.current = rawState; }, [rawState]);

  const addBalance = useCallback((amount: number) => {
    const rs = rawStateRef.current;
    const userStateId = rs?.id;
    if (!rs || !userStateId) return;
    const newBal = Math.max(0, (rs.balance ?? 0) + amount);
    db.transact((db as any).tx.userState[userStateId].update({
      balance: newBal,
      netWorth: newBal + (rs.totalInvested ?? 0) - (rs.totalDebt ?? 0),
    }));
  }, []);

  const completeLesson = useCallback((lessonId: string, xpReward: number, cashReward = 50, lessonTitle?: string) => {
    if (!rawState || !sid()) return;
    const completed = (rawState.completedLessons as string[]) ?? [];
    if (completed.includes(lessonId)) return;

    const newCompleted = [...completed, lessonId];
    const newXp = (rawState.xp ?? 0) + xpReward;
    const newBal = (rawState.balance ?? 0) + cashReward;

    // Streak logic — only increment once per calendar day
    const lastDate = new Date(rawState.lastActivityDate ?? 0);
    const today = new Date();
    const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dayDiff = Math.floor((todayDay.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));
    // dayDiff 0 = already had activity today (no increment)
    // dayDiff 1 = yesterday (continue streak)
    // dayDiff 2+ = missed a day (reset to 1)
    const newStreak = dayDiff === 0
      ? (rawState.streak ?? 1)
      : dayDiff === 1
        ? (rawState.streak ?? 0) + 1
        : 1;

    // Badge checks
    const badges = [...(rawState.badges as string[] ?? [])];
    if (newStreak >= 7  && !badges.includes("week_streak"))    badges.push("week_streak");
    if (newStreak >= 30 && !badges.includes("month_streak"))   badges.push("month_streak");
    if (newCompleted.length >= 10  && !badges.includes("ten_lessons"))    badges.push("ten_lessons");
    if (newCompleted.length >= 25  && !badges.includes("twenty_five"))    badges.push("twenty_five");
    if (newCompleted.length >= 50  && !badges.includes("fifty_lessons"))  badges.push("fifty_lessons");
    if (newXp >= 100  && !badges.includes("first_hundred"))   badges.push("first_hundred");
    if (newXp >= 500  && !badges.includes("five_hundred"))    badges.push("five_hundred");
    if (newXp >= 1000 && !badges.includes("one_thousand"))    badges.push("one_thousand");

    db.transact((db as any).tx.userState[sid()].update({
      xp: newXp,
      balance: newBal,
      completedLessons: newCompleted,
      streak: newStreak,
      lastActivityDate: Date.now(),
      totalEarned: (rawState.totalEarned ?? 0) + cashReward,
      badges,
      netWorth: newBal + (rawState.totalInvested ?? 0) - (rawState.totalDebt ?? 0),
    }));

    // Fire XP toast
    window.dispatchEvent(new CustomEvent("pw:xp", { detail: { amount: xpReward, reason: lessonTitle ?? "Lesson complete" } }));
    // Fire badge toasts for any new badges
    const prevBadges = rawState.badges as string[] ?? [];
    badges.filter(b => !prevBadges.includes(b)).forEach(b => {
      window.dispatchEvent(new CustomEvent("pw:badge", { detail: { name: b.replace(/_/g, " ") } }));
    });
  }, [rawState]);

  const applyForJob = useCallback((jobId: string, salary: number) => {
    if (!rawState || !sid()) return;
    db.transact((db as any).tx.userState[sid()].update({
      currentJobId: `${jobId}:${salary}`,
      lastSalaryPaid: Date.now(),
    }));
  }, [rawState]);

  // Update a stock's current price in the database
  const updateStockPrice = useCallback((stockId: string, newPrice: number) => {
    db.transact((db as any).tx.userStocks[stockId].update({ currentValue: newPrice }));
  }, []);

  const buyStock = useCallback((symbol: string, name: string, qty: number, midPrice: number): boolean => {
    if (!rawState || !authUser || !sid()) return false;
    if (!canAccess("buyStock")) return false;
    // Compute total cost at ask + brokerage
    const { ask, total } = calcBuyCost(symbol, qty, midPrice);
    if ((rawState.balance ?? 0) < total) return false;

    const newBal = (rawState.balance ?? 0) - total;
    const newInvested = (rawState.totalInvested ?? 0) + total;

    // Look for existing position in this symbol → merge with weighted-avg cost
    const existing = stocks.find(s => s.symbol === symbol);
    const txns: any[] = [
      (db as any).tx.userState[sid()].update({
        balance: newBal,
        totalInvested: newInvested,
        netWorth: newBal + newInvested - (rawState.totalDebt ?? 0),
      }),
    ];
    if (existing) {
      const oldQty = existing.quantity ?? 0;
      const oldAvg = existing.purchasePrice ?? ask;
      const newQty = oldQty + qty;
      const newAvg = ((oldAvg * oldQty) + (ask * qty)) / newQty;
      txns.push(
        (db as any).tx.userStocks[existing.id].update({
          quantity: newQty,
          purchasePrice: newAvg,
          currentValue: midPrice,
        })
      );
    } else {
      txns.push(
        (db as any).tx.userStocks[id()].update({
          userId: authUser.id, symbol, name, quantity: qty,
          purchasePrice: ask, purchaseDate: Date.now(),
          currentValue: midPrice, dividendsEarned: 0,
        })
      );
    }
    db.transact(txns);
    return true;
  }, [rawState, authUser, canAccess, stocks]);

  // Sell shares — supports partial quantities. If qty omitted, sells the entire holding (legacy callers).
  const sellStock = useCallback((stockId: string, qtyOrPrice: number, maybePrice?: number) => {
    if (!rawState || !sid()) return;
    const stock = stocks.find(s => s.id === stockId);
    if (!stock) return;
    const holdingQty = stock.quantity ?? 0;
    if (holdingQty <= 0) return;
    // Detect old signature: sellStock(id, price) → sell all at price
    // vs new signature: sellStock(id, qty, midPrice)
    let sellQty: number, midPrice: number;
    if (typeof maybePrice === "number") {
      sellQty = Math.min(qtyOrPrice, holdingQty);
      midPrice = maybePrice;
    } else {
      sellQty = holdingQty;
      midPrice = qtyOrPrice;
    }
    if (sellQty <= 0) return;

    const { net } = calcSellProceeds(stock.symbol, sellQty, midPrice);
    const newBal = (rawState.balance ?? 0) + net;
    const costBasisRemoved = (stock.purchasePrice ?? 0) * sellQty;
    const newInvested = Math.max(0, (rawState.totalInvested ?? 0) - costBasisRemoved);

    const txns: any[] = [
      (db as any).tx.userState[sid()].update({
        balance: newBal,
        totalInvested: newInvested,
        netWorth: newBal + newInvested - (rawState.totalDebt ?? 0),
      }),
    ];
    if (sellQty >= holdingQty) {
      txns.push((db as any).tx.userStocks[stockId].delete());
    } else {
      txns.push(
        (db as any).tx.userStocks[stockId].update({
          quantity: holdingQty - sellQty,
          currentValue: midPrice,
        })
      );
    }
    db.transact(txns);
  }, [rawState, stocks]);

  const buyProperty = useCallback((name: string, price: number, weeklyRent: number, mortgageWeekly: number): boolean => {
    if (!rawState || !authUser || !sid() || !canAccess("buyProperty")) return false;
    const deposit = price * 0.2;
    if ((rawState.balance ?? 0) < deposit) return false;
    const mortgageBalance = price - deposit;
    const newBal = (rawState.balance ?? 0) - deposit;
    const newDebt = (rawState.totalDebt ?? 0) + mortgageBalance;
    const newInvested = (rawState.totalInvested ?? 0) + price;
    db.transact([
      (db as any).tx.userState[sid()].update({
        balance: newBal, totalDebt: newDebt,
        totalInvested: newInvested,
        netWorth: newBal + newInvested - newDebt,
      }),
      (db as any).tx.userProperties[id()].update({
        userId: authUser.id, name, purchasePrice: price,
        currentValue: price, purchaseDate: Date.now(),
        weeklyRent, mortgageWeekly, mortgageBalance,
      }),
    ]);
    return true;
  }, [rawState, authUser, canAccess]);

  const takeLoan = useCallback((name: string, principal: number, rate: number, weeklyRepayment: number): boolean => {
    if (!rawState || !authUser || !sid() || !canAccess("takeLoan")) return false;
    const newBal = (rawState.balance ?? 0) + principal;
    const newDebt = (rawState.totalDebt ?? 0) + principal;
    db.transact([
      (db as any).tx.userState[sid()].update({
        balance: newBal, totalDebt: newDebt,
        netWorth: newBal + (rawState.totalInvested ?? 0) - newDebt,
      }),
      (db as any).tx.userLoans[id()].update({
        userId: authUser.id, name, principal,
        balance: principal, interestRate: rate,
        weeklyRepayment, startDate: Date.now(),
      }),
    ]);
    return true;
  }, [rawState, authUser, canAccess]);

  const repayLoan = useCallback((loanId: string, amount: number) => {
    if (!rawState || !sid()) return;
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;
    const pay = Math.min(amount, loan.balance ?? 0, rawState.balance ?? 0);
    if (pay <= 0) return;
    const newLoanBal = (loan.balance ?? 0) - pay;
    const newBal = (rawState.balance ?? 0) - pay;
    const newDebt = Math.max(0, (rawState.totalDebt ?? 0) - pay);
    const txns: any[] = [
      (db as any).tx.userState[sid()].update({
        balance: newBal, totalDebt: newDebt,
        netWorth: newBal + (rawState.totalInvested ?? 0) - newDebt,
      }),
    ];
    if (newLoanBal <= 0.01) {
      txns.push((db as any).tx.userLoans[loanId].delete());
    } else {
      txns.push((db as any).tx.userLoans[loanId].update({ balance: newLoanBal }));
    }
    db.transact(txns);
  }, [rawState, loans]);

  const buyAsset = useCallback((name: string, category: string, price: number, depRate: number): boolean => {
    if (!rawState || !authUser || !sid() || !canAccess("buyAsset")) return false;
    if ((rawState.balance ?? 0) < price) return false;
    const newBal = (rawState.balance ?? 0) - price;
    db.transact([
      (db as any).tx.userState[sid()].update({
        balance: newBal,
        netWorth: newBal + (rawState.totalInvested ?? 0) - (rawState.totalDebt ?? 0),
      }),
      (db as any).tx.userAssets[id()].update({
        userId: authUser.id, name, category,
        purchasePrice: price, currentValue: price,
        depreciationRate: depRate, purchaseDate: Date.now(),
      }),
    ]);
    return true;
  }, [rawState, authUser, canAccess]);

  const casinoWin  = useCallback((amount: number) => addBalance(amount),  [addBalance]);
  const casinoLoss = useCallback((amount: number) => addBalance(-amount), [addBalance]);

  const completeOnboarding = useCallback((name: string) => {
    if (!rawState || !sid()) return;
    const badges = [...(rawState.badges as string[] ?? [])];
    if (!badges.includes("onboarded")) badges.push("onboarded");
    db.transact((db as any).tx.userState[sid()].update({ badges }));
  }, [rawState]);

  const clearPendingEvent = useCallback(() => {
    if (!rawState || !sid()) return;
    db.transact((db as any).tx.userState[sid()].update({ pendingLifeEvent: null }));
  }, [rawState]);

  const clearPendingNews = useCallback(() => {
    if (!rawState || !sid()) return;
    db.transact((db as any).tx.userState[sid()].update({ pendingNews: null }));
  }, [rawState]);

  const setGoals = useCallback((goals: any[]) => {
    if (!rawState || !sid()) return;
    db.transact((db as any).tx.userState[sid()].update({ goals: JSON.stringify(goals) }));
  }, [rawState]);

  // Activity ping — updates lastActivityDate at most once per 30s
  useEffect(() => {
    if (!authUser || !sid()) return;
    let last = 0;
    function ping() {
      const now = Date.now();
      if (now - last < 30000) return;
      last = now;
      try { db.transact((db as any).tx.userState[sid()].update({ lastActivityDate: now })); } catch {}
    }
    ping();
    window.addEventListener("click", ping);
    window.addEventListener("keydown", ping);
    window.addEventListener("touchstart", ping);
    return () => {
      window.removeEventListener("click", ping);
      window.removeEventListener("keydown", ping);
      window.removeEventListener("touchstart", ping);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  const signOut = useCallback(() => { db.auth.signOut(); }, []);

  const user: GameUser | null = authUser
    ? { id: authUser.id, email: authUser.email ?? "", role: "student" }
    : null;

  return (
    <Ctx.Provider value={{
      user, state: rawState, stocks, properties, loans, assets,
      isLoading: authLoading, isNewUser,
      canAccess, addXp, addBalance, completeLesson,
      applyForJob, updateStockPrice,
      buyStock, sellStock, buyProperty, takeLoan, repayLoan, buyAsset,
      casinoWin, casinoLoss, completeOnboarding,
      clearPendingEvent, clearPendingNews, setGoals,
      signOut,
    }}>
      {children}
    </Ctx.Provider>
  );
}

// ── NZX Stock metadata ────────────────────────────────────────────────────
// Re-exported from the new market registry so every consumer gets the same
// 17-stock list. Old shape fields (basePrice, dividendYield) are preserved
// via the adapter below for backwards compatibility with any callers that
// still reference them.
import { NZX_STOCKS as REGISTRY } from "./market/registry";
export const NZX_STOCKS = REGISTRY.map(s => ({
  symbol: s.symbol,
  name: s.name,
  sector: s.sector,
  basePrice: s.basePrice,
  volatility: s.volatilityDaily,
  dividendYield: s.divYieldAnnual,
}));
