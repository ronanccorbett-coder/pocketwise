"use client";
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { id } from "@instantdb/react";
import { db } from "./db";

// ── XP Gates ──────────────────────────────────────────────────────────────
export const XP_GATES = {
  buyStock:       100,
  buyAsset:       150,
  takeLoan:       300,
  dayTrading:     500,
  buyProperty:    800,
  jobEntry:       0,
  jobJunior:      200,
  jobGraduate:    500,
  jobSenior:      1500,
} as const;

// ── Types ──────────────────────────────────────────────────────────────────
export type GameUser = {
  id: string;
  email: string;
  fullName?: string;
  role: "student" | "educator" | "admin";
};

export type UserState = {
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
  canAccess: (gate: keyof typeof XP_GATES) => boolean;
  addXp: (amount: number) => void;
  addBalance: (amount: number, reason?: string) => void;
  completeLesson: (lessonId: string, xpReward: number, cashReward?: number) => void;
  applyForJob: (jobId: string, salary: number) => void;
  buyStock: (symbol: string, name: string, qty: number, price: number) => boolean;
  sellStock: (stockId: string, currentPrice: number) => void;
  buyProperty: (name: string, price: number, weeklyRent: number, mortgageWeekly: number) => boolean;
  takeLoan: (name: string, principal: number, rate: number, weeklyRepayment: number) => boolean;
  buyAsset: (name: string, category: string, price: number, depRate: number) => boolean;
  casinoWin: (amount: number) => void;
  casinoLoss: (amount: number) => void;
  signOut: () => void;
};

const Ctx = createContext<GameCtx | null>(null);
export function useGame() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}

// ── Weekly tick interval (7 real minutes = 1 game week) ──────────────────
const WEEK_MS = 7 * 60 * 1000;

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

  const rawState = stateData?.userState?.[0] as UserState | undefined;
  const stocks = (stockData?.userStocks ?? []) as Stock[];
  const properties = (propData?.userProperties ?? []) as Property[];
  const loans = (loanData?.userLoans ?? []) as Loan[];
  const assets = (assetData?.userAssets ?? []) as Asset[];

  // Bootstrap new user
  useEffect(() => {
    if (!authUser || rawState || authLoading) return;
    db.transact(
      db.tx.userState[id()].update({
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
  }, [authUser, rawState, authLoading]);

  // Weekly tick — salary + investment returns + loan repayments
  useEffect(() => {
    if (!rawState) return;
    const tick = setInterval(() => {
      const now = Date.now();
      if (now - rawState.lastWeeklyTick < WEEK_MS) return;

      let balanceDelta = 0;
      const txns: any[] = [];

      // Salary
      if (rawState.currentJobId) {
        const jobSalary = parseInt(rawState.currentJobId.split(":")[1] || "0");
        balanceDelta += jobSalary;
      }

      // Loan repayments
      loans.forEach(loan => {
        if (loan.balance > 0) {
          const repay = Math.min(loan.weeklyRepayment, loan.balance);
          const interest = loan.balance * (loan.interestRate / 52 / 100);
          balanceDelta -= repay;
          txns.push(
            db.tx.userLoans[loan.id].update({
              balance: Math.max(0, loan.balance - repay + interest),
            })
          );
        }
      });

      // Dividends on stocks
      stocks.forEach(stock => {
        const stockMeta = NZX_STOCKS.find(s => s.symbol === stock.symbol);
        if (stockMeta && stockMeta.dividendYield > 0) {
          const weeklyDiv = (stock.currentValue * stock.quantity * stockMeta.dividendYield) / 52;
          balanceDelta += weeklyDiv;
          txns.push(
            db.tx.userStocks[stock.id].update({
              dividendsEarned: stock.dividendsEarned + weeklyDiv,
            })
          );
        }
      });

      // Property rent income
      properties.forEach(prop => {
        balanceDelta += prop.weeklyRent;
        balanceDelta -= prop.mortgageWeekly;
      });

      if (balanceDelta !== 0 || txns.length > 0) {
        const newBalance = rawState.balance + balanceDelta;
        const totalDebt = loans.reduce((s, l) => s + l.balance, 0);
        const totalInvested = stocks.reduce((s, st) => s + st.currentValue * st.quantity, 0)
          + properties.reduce((s, p) => s + p.currentValue, 0);
        db.transact([
          db.tx.userState[rawState.userId ? getStateId(stateData) : ""].update({
            balance: Math.max(0, newBalance),
            totalEarned: rawState.totalEarned + Math.max(0, balanceDelta),
            totalDebt,
            totalInvested,
            netWorth: Math.max(0, newBalance) + totalInvested - totalDebt,
            lastWeeklyTick: Date.now(),
          }),
          ...txns,
        ]);
      }
    }, 10000); // check every 10s
    return () => clearInterval(tick);
  }, [rawState, loans, stocks, properties]);

  function getStateId(data: any): string {
    return data?.userState?.[0]?.id ?? "";
  }

  function stateId(): string {
    return stateData?.userState?.[0]?.id ?? "";
  }

  const canAccess = useCallback((gate: keyof typeof XP_GATES) => {
    return (rawState?.xp ?? 0) >= XP_GATES[gate];
  }, [rawState]);

  const addXp = useCallback((amount: number) => {
    if (!rawState) return;
    const sid = stateId();
    if (!sid) return;
    const newXp = rawState.xp + amount;
    // Check badge unlocks
    const badges = [...(rawState.badges as string[])];
    if (newXp >= 100 && !badges.includes("first_hundred")) badges.push("first_hundred");
    if (newXp >= 500 && !badges.includes("five_hundred")) badges.push("five_hundred");
    if (newXp >= 1000 && !badges.includes("one_thousand")) badges.push("one_thousand");
    db.transact(db.tx.userState[sid].update({ xp: newXp, badges, lastActivityDate: Date.now() }));
  }, [rawState, stateData]);

  const addBalance = useCallback((amount: number) => {
    if (!rawState) return;
    const sid = stateId();
    if (!sid) return;
    const newBal = rawState.balance + amount;
    db.transact(db.tx.userState[sid].update({
      balance: Math.max(0, newBal),
      netWorth: Math.max(0, newBal) + rawState.totalInvested - rawState.totalDebt,
    }));
  }, [rawState, stateData]);

  const completeLesson = useCallback((lessonId: string, xpReward: number, cashReward = 0) => {
    if (!rawState) return;
    const sid = stateId();
    if (!sid) return;
    const completed = rawState.completedLessons as string[];
    if (completed.includes(lessonId)) return;
    const newCompleted = [...completed, lessonId];
    const newXp = rawState.xp + xpReward;
    const newBal = rawState.balance + cashReward;
    // Streak logic
    const lastDate = new Date(rawState.lastActivityDate);
    const today = new Date();
    const dayDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    const newStreak = dayDiff <= 1 ? rawState.streak + 1 : 1;
    const badges = [...(rawState.badges as string[])];
    if (newStreak >= 7 && !badges.includes("week_streak")) badges.push("week_streak");
    if (newCompleted.length >= 10 && !badges.includes("ten_lessons")) badges.push("ten_lessons");
    db.transact(db.tx.userState[sid].update({
      xp: newXp, balance: newBal,
      completedLessons: newCompleted,
      streak: newStreak, lastActivityDate: Date.now(),
      totalEarned: rawState.totalEarned + cashReward,
      badges,
    }));
  }, [rawState, stateData]);

  const applyForJob = useCallback((jobId: string, salary: number) => {
    if (!rawState) return;
    const sid = stateId();
    if (!sid) return;
    db.transact(db.tx.userState[sid].update({
      currentJobId: `${jobId}:${salary}`,
      lastSalaryPaid: Date.now(),
    }));
  }, [rawState, stateData]);

  const buyStock = useCallback((symbol: string, name: string, qty: number, price: number): boolean => {
    if (!rawState) return false;
    const cost = price * qty;
    if (rawState.balance < cost) return false;
    if (!canAccess("buyStock")) return false;
    const sid = stateId();
    if (!sid) return false;
    const newBal = rawState.balance - cost;
    const newInvested = rawState.totalInvested + cost;
    db.transact([
      db.tx.userState[sid].update({
        balance: newBal,
        totalInvested: newInvested,
        netWorth: newBal + newInvested - rawState.totalDebt,
      }),
      db.tx.userStocks[id()].update({
        userId: authUser!.id, symbol, name, quantity: qty,
        purchasePrice: price, purchaseDate: Date.now(),
        currentValue: price, dividendsEarned: 0,
      }),
    ]);
    return true;
  }, [rawState, stateData, canAccess, authUser]);

  const sellStock = useCallback((stockId: string, currentPrice: number) => {
    if (!rawState) return;
    const stock = stocks.find(s => s.id === stockId);
    if (!stock) return;
    const sid = stateId();
    if (!sid) return;
    const proceeds = currentPrice * stock.quantity;
    const newBal = rawState.balance + proceeds;
    const newInvested = Math.max(0, rawState.totalInvested - stock.purchasePrice * stock.quantity);
    db.transact([
      db.tx.userState[sid].update({
        balance: newBal,
        totalInvested: newInvested,
        netWorth: newBal + newInvested - rawState.totalDebt,
      }),
      db.tx.userStocks[stockId].delete(),
    ]);
  }, [rawState, stateData, stocks]);

  const buyProperty = useCallback((name: string, price: number, weeklyRent: number, mortgageWeekly: number): boolean => {
    if (!rawState || !canAccess("buyProperty")) return false;
    const deposit = price * 0.2;
    if (rawState.balance < deposit) return false;
    const sid = stateId();
    if (!sid) return false;
    const mortgageBalance = price - deposit;
    const newBal = rawState.balance - deposit;
    const newDebt = rawState.totalDebt + mortgageBalance;
    const newInvested = rawState.totalInvested + price;
    db.transact([
      db.tx.userState[sid].update({
        balance: newBal, totalDebt: newDebt,
        totalInvested: newInvested,
        netWorth: newBal + newInvested - newDebt,
      }),
      db.tx.userProperties[id()].update({
        userId: authUser!.id, name, purchasePrice: price,
        currentValue: price, purchaseDate: Date.now(),
        weeklyRent, mortgageWeekly, mortgageBalance,
      }),
    ]);
    return true;
  }, [rawState, stateData, canAccess, authUser]);

  const takeLoan = useCallback((name: string, principal: number, rate: number, weeklyRepayment: number): boolean => {
    if (!rawState || !canAccess("takeLoan")) return false;
    const sid = stateId();
    if (!sid) return false;
    const newBal = rawState.balance + principal;
    const newDebt = rawState.totalDebt + principal;
    db.transact([
      db.tx.userState[sid].update({
        balance: newBal, totalDebt: newDebt,
        netWorth: newBal + rawState.totalInvested - newDebt,
      }),
      db.tx.userLoans[id()].update({
        userId: authUser!.id, name, principal,
        balance: principal, interestRate: rate,
        weeklyRepayment, startDate: Date.now(),
      }),
    ]);
    return true;
  }, [rawState, stateData, canAccess, authUser]);

  const buyAsset = useCallback((name: string, category: string, price: number, depRate: number): boolean => {
    if (!rawState || !canAccess("buyAsset")) return false;
    if (rawState.balance < price) return false;
    const sid = stateId();
    if (!sid) return false;
    const newBal = rawState.balance - price;
    db.transact([
      db.tx.userState[sid].update({
        balance: newBal,
        netWorth: newBal + rawState.totalInvested - rawState.totalDebt,
      }),
      db.tx.userAssets[id()].update({
        userId: authUser!.id, name, category,
        purchasePrice: price, currentValue: price,
        depreciationRate: depRate, purchaseDate: Date.now(),
      }),
    ]);
    return true;
  }, [rawState, stateData, canAccess, authUser]);

  const casinoWin = useCallback((amount: number) => addBalance(amount), [addBalance]);
  const casinoLoss = useCallback((amount: number) => addBalance(-amount), [addBalance]);

  const signOut = useCallback(() => { db.auth.signOut(); }, []);

  const user: GameUser | null = authUser
    ? { id: authUser.id, email: authUser.email ?? "", role: "student" }
    : null;

  return (
    <Ctx.Provider value={{
      user, state: rawState ?? null,
      stocks, properties, loans, assets,
      isLoading: authLoading,
      canAccess, addXp, addBalance, completeLesson,
      applyForJob, buyStock, sellStock,
      buyProperty, takeLoan, buyAsset,
      casinoWin, casinoLoss, signOut,
    }}>
      {children}
    </Ctx.Provider>
  );
}

// ── NZX Stock metadata (used for dividends) ──────────────────────────────
export const NZX_STOCKS = [
  { symbol: "ANZ",  name: "ANZ Banking Group",    sector: "Finance",     basePrice: 29.40, volatility: 0.012, dividendYield: 0.058 },
  { symbol: "FBU",  name: "Fletcher Building",    sector: "Construction",basePrice: 4.85,  volatility: 0.022, dividendYield: 0.045 },
  { symbol: "SPK",  name: "Spark New Zealand",    sector: "Telecom",     basePrice: 3.72,  volatility: 0.010, dividendYield: 0.072 },
  { symbol: "MFT",  name: "Mainfreight",          sector: "Logistics",   basePrice: 68.20, volatility: 0.018, dividendYield: 0.022 },
  { symbol: "AIR",  name: "Air New Zealand",      sector: "Aviation",    basePrice: 0.71,  volatility: 0.035, dividendYield: 0.000 },
  { symbol: "MEL",  name: "Meridian Energy",      sector: "Utilities",   basePrice: 5.84,  volatility: 0.009, dividendYield: 0.048 },
  { symbol: "XRO",  name: "Xero Limited",         sector: "Technology",  basePrice: 142.00,volatility: 0.028, dividendYield: 0.000 },
  { symbol: "NZX",  name: "NZX Limited",          sector: "Finance",     basePrice: 1.28,  volatility: 0.015, dividendYield: 0.055 },
];
