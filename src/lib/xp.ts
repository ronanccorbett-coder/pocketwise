// XP required per level
export const LEVELS = [
  { level: 1,  xpRequired: 0,    title: "Beginner",     color: "#94a3b8" },
  { level: 2,  xpRequired: 200,  title: "Learner",      color: "#76AD25" },
  { level: 3,  xpRequired: 500,  title: "Saver",        color: "#76AD25" },
  { level: 4,  xpRequired: 1000, title: "Investor",     color: "#3B82F6" },
  { level: 5,  xpRequired: 2000, title: "Trader",       color: "#3B82F6" },
  { level: 6,  xpRequired: 3500, title: "Analyst",      color: "#6b7280" },
  { level: 7,  xpRequired: 5000, title: "Strategist",   color: "#f59e0b" },
  { level: 8,  xpRequired: 7500, title: "Financier",    color: "#f59e0b" },
  { level: 9,  xpRequired: 10000,"title": "Wealth Builder", color: "#EF4444" },
  { level: 10, xpRequired: 15000,title: "PocketWise Pro", color: "#EF4444" },
];

export function getLevel(xp: number) {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.xpRequired) current = l;
    else break;
  }
  const nextLevel = LEVELS.find(l => l.xpRequired > xp);
  const progress = nextLevel
    ? ((xp - current.xpRequired) / (nextLevel.xpRequired - current.xpRequired)) * 100
    : 100;
  return { ...current, nextLevel, progress, xp };
}

// XP gates for features
export const XP_GATES = {
  // Portfolio
  PORTFOLIO_STOCKS:    0,      // free
  PORTFOLIO_PROPERTY:  500,    // Level 3
  PORTFOLIO_LOANS:     200,    // Level 2
  PORTFOLIO_ASSETS:    200,    // Level 2
  PORTFOLIO_DAYTRADING:1000,   // Level 4
  PORTFOLIO_MARKETS:   0,      // free

  // Casino
  CASINO_SLOTS:        0,      // free
  CASINO_BLACKJACK:    500,
  CASINO_ROULETTE:     1000,
  CASINO_SPORTS:       2000,
  CASINO_MINES:        1500,
  CASINO_CRASH:        3000,
};

export const BADGES = [
  { id: "first_lesson",    label: "First Steps",      desc: "Complete your first lesson",        xpBonus: 50  },
  { id: "week_streak",     label: "Week Warrior",     desc: "7-day learning streak",             xpBonus: 100 },
  { id: "first_invest",    label: "First Investment", desc: "Buy your first stock",              xpBonus: 75  },
  { id: "debt_free",       label: "Debt Free",        desc: "Pay off all your loans",            xpBonus: 150 },
  { id: "level_5",         label: "Trader",           desc: "Reach Level 5",                     xpBonus: 200 },
  { id: "module_complete", label: "Module Master",    desc: "Complete a full module",            xpBonus: 300 },
  { id: "casino_win",      label: "Lucky Break",      desc: "Win at the casino",                 xpBonus: 50  },
  { id: "net_worth_10k",   label: "Ten Thousand",     desc: "Reach $10,000 net worth",           xpBonus: 250 },
];

export function checkBadges(
  progress: { completedLessons?: string[]; completedModules?: string[]; streakDays?: number; badges?: string[] },
  finance: { netWorth?: number; totalDebt?: number },
  investments: unknown[]
): string[] {
  const earned = [...(progress.badges as string[] ?? [])];
  const add = (id: string) => { if (!earned.includes(id)) earned.push(id); };

  if ((progress.completedLessons as string[] ?? []).length >= 1) add("first_lesson");
  if ((progress.streakDays ?? 0) >= 7) add("week_streak");
  if (investments.length >= 1) add("first_invest");
  if ((finance.totalDebt ?? 0) === 0 && (finance.netWorth ?? 0) > 0) add("debt_free");
  if ((finance.netWorth ?? 0) >= 10000) add("net_worth_10k");
  if ((progress.completedModules as string[] ?? []).length >= 1) add("module_complete");

  return earned;
}
