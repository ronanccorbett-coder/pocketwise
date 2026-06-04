"use client";
import { createContext, useContext, useEffect, useRef, useCallback, ReactNode } from "react";
import { id } from "@instantdb/react";
import { db } from "./db";
import { generateWeeklyNews, generateLifeEvent, shouldFireLifeEvent } from "./events";

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
  completeLesson: (lessonId: string, xpReward: number, cashReward?: number) => void;
  applyForJob: (jobId: string, salary: number) => void;
  updateStockPrice: (stockId: string, newPrice: number) => void;
  buyStock: (symbol: string, name: string, qty: number, price: number) => boolean;
  sellStock: (stockId: string, currentPrice: number) => void;
  buyProperty: (name: string, price: number, weeklyRent: number, mortgageWeekly: number) => boolean;
  takeLoan: (name: string, principal: number, rate: number, weeklyRepayment: number) => boolean;
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

  const rawState  = (stateData?.userState?.[0] ?? null) as UserState | null;
  const stocks    = (stockData?.userStocks ?? []) as Stock[];
  const properties = (propData?.userProperties ?? []) as Property[];
  const loans     = (loanData?.userLoans ?? []) as Loan[];
  const assets    = (assetData?.userAssets ?? []) as Asset[];

  // Track whether this is a brand new user (no state record yet)
  const isNewUser = !authLoading && !!authUser && !rawState && stateData !== undefined;

  // Bootstrap new user
  useEffect(() => {
    if (!authUser || rawState || authLoading || stateData === undefined) return;
    db.transact(
      (db as any).tx.userState[id()].update({
        userId: authUser.id,
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

        // Stock dividends — daily portion
        stocks.forEach(stock => {
          const meta = NZX_STOCKS.find(s => s.symbol === stock.symbol);
          if (meta && meta.dividendYield > 0) {
            const dailyDiv = ((stock.currentValue ?? meta.basePrice) * (stock.quantity ?? 0) * meta.dividendYield) / 365;
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

  const addBalance = useCallback((amount: number) => {
    if (!rawState || !sid()) return;
    const newBal = Math.max(0, (rawState.balance ?? 0) + amount);
    db.transact((db as any).tx.userState[sid()].update({
      balance: newBal,
      netWorth: newBal + (rawState.totalInvested ?? 0) - (rawState.totalDebt ?? 0),
    }));
  }, [rawState]);

  const completeLesson = useCallback((lessonId: string, xpReward: number, cashReward = 50) => {
    if (!rawState || !sid()) return;
    const completed = (rawState.completedLessons as string[]) ?? [];
    if (completed.includes(lessonId)) return;

    const newCompleted = [...completed, lessonId];
    const newXp = (rawState.xp ?? 0) + xpReward;
    const newBal = (rawState.balance ?? 0) + cashReward;

    // Streak logic
    const lastDate = new Date(rawState.lastActivityDate ?? 0);
    const today = new Date();
    const dayDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    const newStreak = dayDiff <= 1 ? (rawState.streak ?? 0) + 1 : 1;

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

  const buyStock = useCallback((symbol: string, name: string, qty: number, price: number): boolean => {
    if (!rawState || !authUser || !sid()) return false;
    if ((rawState.balance ?? 0) < price * qty) return false;
    if (!canAccess("buyStock")) return false;
    const cost = price * qty;
    const newBal = (rawState.balance ?? 0) - cost;
    const newInvested = (rawState.totalInvested ?? 0) + cost;
    db.transact([
      (db as any).tx.userState[sid()].update({
        balance: newBal,
        totalInvested: newInvested,
        netWorth: newBal + newInvested - (rawState.totalDebt ?? 0),
      }),
      (db as any).tx.userStocks[id()].update({
        userId: authUser.id, symbol, name, quantity: qty,
        purchasePrice: price, purchaseDate: Date.now(),
        currentValue: price, dividendsEarned: 0,
      }),
    ]);
    return true;
  }, [rawState, authUser, canAccess]);

  const sellStock = useCallback((stockId: string, currentPrice: number) => {
    if (!rawState || !sid()) return;
    const stock = stocks.find(s => s.id === stockId);
    if (!stock) return;
    const proceeds = currentPrice * (stock.quantity ?? 0);
    const newBal = (rawState.balance ?? 0) + proceeds;
    const newInvested = Math.max(0, (rawState.totalInvested ?? 0) - (stock.purchasePrice ?? 0) * (stock.quantity ?? 0));
    db.transact([
      (db as any).tx.userState[sid()].update({
        balance: newBal,
        totalInvested: newInvested,
        netWorth: newBal + newInvested - (rawState.totalDebt ?? 0),
      }),
      (db as any).tx.userStocks[stockId].delete(),
    ]);
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
      buyStock, sellStock, buyProperty, takeLoan, buyAsset,
      casinoWin, casinoLoss, completeOnboarding,
      clearPendingEvent, clearPendingNews, setGoals,
      signOut,
    }}>
      {children}
    </Ctx.Provider>
  );
}

// ── NZX Stock metadata ────────────────────────────────────────────────────
export const NZX_STOCKS = [
  { symbol: "ANZ",  name: "ANZ Banking Group",  sector: "Finance",     basePrice: 29.40, volatility: 0.012, dividendYield: 0.058 },
  { symbol: "FBU",  name: "Fletcher Building",  sector: "Construction",basePrice: 4.85,  volatility: 0.022, dividendYield: 0.045 },
  { symbol: "SPK",  name: "Spark New Zealand",  sector: "Telecom",     basePrice: 3.72,  volatility: 0.010, dividendYield: 0.072 },
  { symbol: "MFT",  name: "Mainfreight",         sector: "Logistics",   basePrice: 68.20, volatility: 0.018, dividendYield: 0.022 },
  { symbol: "AIR",  name: "Air New Zealand",     sector: "Aviation",    basePrice: 0.71,  volatility: 0.035, dividendYield: 0.000 },
  { symbol: "MEL",  name: "Meridian Energy",     sector: "Utilities",   basePrice: 5.84,  volatility: 0.009, dividendYield: 0.048 },
  { symbol: "XRO",  name: "Xero Limited",        sector: "Technology",  basePrice: 142.00,volatility: 0.028, dividendYield: 0.000 },
  { symbol: "NZX",  name: "NZX Limited",         sector: "Finance",     basePrice: 1.28,  volatility: 0.015, dividendYield: 0.055 },
];
