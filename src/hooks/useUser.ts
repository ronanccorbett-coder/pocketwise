"use client";
import { db } from "@/lib/db";
import { id } from "@instantdb/react";
import { getLevel } from "@/lib/xp";

export function useUser() {
  const { user, isLoading: authLoading } = db.useAuth();

  const { data: progressData } = db.useQuery(
    user ? { userProgress: { $: { where: { userId: user.id } } } } : null
  );
  const { data: financeData } = db.useQuery(
    user ? { userFinance: { $: { where: { userId: user.id } } } } : null
  );

  const progress = progressData?.userProgress?.[0];
  const finance = financeData?.userFinance?.[0];

  const xp = (progress?.totalXp as number) ?? 0;
  const levelInfo = getLevel(xp);

  // Ensure records exist
  function ensureRecords() {
    if (!user) return;
    if (!progress) {
      db.transact(db.tx.userProgress[id()].update({
        userId: user.id,
        totalXp: 0,
        completedLessons: [],
        completedModules: [],
        badges: [],
        streakDays: 0,
        level: 1,
        lastActivityDate: Date.now(),
      }));
    }
    if (!finance) {
      db.transact(db.tx.userFinance[id()].update({
        userId: user.id,
        balance: 5000,
        totalEarned: 0,
        totalInvested: 0,
        totalDebt: 0,
        netWorth: 5000,
        weeklyIncome: 0,
        lastPassiveRun: Date.now(),
      }));
    }
  }

  function awardXp(amount: number, reason?: string) {
    if (!user || !progress) return;
    const newXp = xp + amount;
    const newLevel = getLevel(newXp).level;
    db.transact(
      db.tx.userProgress[progress.id].update({
        totalXp: newXp,
        level: newLevel,
        lastActivityDate: Date.now(),
      })
    );
  }

  function completeLesson(lessonId: string, xpReward: number) {
    if (!user || !progress) return;
    const done = (progress.completedLessons as string[]) ?? [];
    if (done.includes(lessonId)) return;
    awardXp(xpReward);
    db.transact(
      db.tx.userProgress[progress.id].update({
        completedLessons: [...done, lessonId],
        lastActivityDate: Date.now(),
      })
    );
  }

  function updateFinance(updates: Partial<{
    balance: number; totalEarned: number; totalInvested: number;
    totalDebt: number; netWorth: number; weeklyIncome: number;
  }>) {
    if (!user || !finance) return;
    db.transact(db.tx.userFinance[finance.id].update(updates));
  }

  function updateBalance(delta: number) {
    if (!finance) return;
    const newBalance = ((finance.balance as number) ?? 0) + delta;
    const newNetWorth = ((finance.netWorth as number) ?? 0) + delta;
    updateFinance({ balance: newBalance, netWorth: newNetWorth });
  }

  return {
    user,
    authLoading,
    progress,
    finance,
    xp,
    levelInfo,
    balance: (finance?.balance as number) ?? 5000,
    ensureRecords,
    awardXp,
    completeLesson,
    updateFinance,
    updateBalance,
  };
}
