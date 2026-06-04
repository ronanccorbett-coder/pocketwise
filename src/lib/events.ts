"use client";

// ── Weekly Financial News ─────────────────────────────────────────────────
export type NewsEvent = {
  id: string;
  headline: string;
  body: string;
  date: number;
  category: "market" | "economy" | "company" | "rate" | "property";
  stockEffects?: Record<string, number>; // symbol -> % change multiplier
  propertyEffect?: number; // % change on all property values
  sentiment: "positive" | "negative" | "neutral";
};

const NEWS_POOL: Omit<NewsEvent, "id" | "date">[] = [
  // Positive market news
  {
    headline: "Spark NZ wins $800M government broadband contract",
    body: "Spark New Zealand has been awarded a major government contract to expand rural broadband across the North Island. Analysts expect earnings to lift 12% this year.",
    category: "company", sentiment: "positive",
    stockEffects: { SPK: 1.06, NZX: 1.02 },
  },
  {
    headline: "Mainfreight posts record annual profit",
    body: "Mainfreight has reported a record net profit of $412M, beating analyst expectations by 8%. The logistics giant cited strong international freight volumes.",
    category: "company", sentiment: "positive",
    stockEffects: { MFT: 1.08, NZX: 1.01 },
  },
  {
    headline: "RBNZ cuts OCR by 25 basis points to 5.00%",
    body: "The Reserve Bank of New Zealand has cut the Official Cash Rate for the first time in two years, signalling easing inflation and a desire to stimulate economic growth.",
    category: "rate", sentiment: "positive",
    stockEffects: { ANZ: 1.04, MEL: 1.03, SPK: 1.02 },
    propertyEffect: 1.02,
  },
  {
    headline: "Air New Zealand resumes Pacific routes, shares surge",
    body: "Air New Zealand announced the resumption of direct Auckland to Los Angeles flights after a two-year hiatus. Load factors are already at 94%.",
    category: "company", sentiment: "positive",
    stockEffects: { AIR: 1.12, NZX: 1.01 },
  },
  {
    headline: "Xero signs major US enterprise deal worth $200M",
    body: "Xero has announced a landmark partnership with a major US retail chain to deploy its accounting platform across 4,000 locations. International revenue expected to double.",
    category: "company", sentiment: "positive",
    stockEffects: { XRO: 1.10, NZX: 1.02 },
  },
  {
    headline: "NZ GDP grows 0.8% — stronger than forecast",
    body: "Statistics NZ reported better-than-expected economic growth for the quarter, driven by construction, tourism, and dairy exports. Consumer confidence at a 3-year high.",
    category: "economy", sentiment: "positive",
    stockEffects: { ANZ: 1.03, FBU: 1.04, MEL: 1.02 },
  },
  {
    headline: "Auckland property values rise 4% in one quarter",
    body: "QV data shows Auckland median house prices have risen 4% in the past quarter as inventory tightens and migration accelerates. First-home buyers face renewed pressure.",
    category: "property", sentiment: "positive",
    propertyEffect: 1.04,
    stockEffects: { ANZ: 1.02, FBU: 1.03 },
  },
  {
    headline: "Meridian Energy reports record renewable output",
    body: "Meridian Energy's Lake Pukaki and Waitaki hydro stations have run at 98% capacity, producing record electricity output. The company raised its dividend forecast.",
    category: "company", sentiment: "positive",
    stockEffects: { MEL: 1.07, NZX: 1.01 },
  },

  // Negative market news
  {
    headline: "Fletcher Building loses $180M on Auckland apartment project",
    body: "Fletcher Building has taken a $180M write-down on a troubled apartment complex in Remuera, the third major loss on a residential project in four years.",
    category: "company", sentiment: "negative",
    stockEffects: { FBU: 0.91, NZX: 0.99 },
  },
  {
    headline: "RBNZ raises OCR to 5.75% — highest in 15 years",
    body: "The Reserve Bank surprised markets with an unexpected rate hike, citing persistent inflation in services and housing. Mortgage holders face immediate increases.",
    category: "rate", sentiment: "negative",
    stockEffects: { ANZ: 0.97, MEL: 0.96, FBU: 0.94 },
    propertyEffect: 0.97,
  },
  {
    headline: "Global tech selloff hits NZX — Xero drops 9%",
    body: "A sharp overnight selloff in US technology stocks has spread to the NZX, with Xero falling 9% in early trading as investors rotate out of growth stocks.",
    category: "market", sentiment: "negative",
    stockEffects: { XRO: 0.91, NZX: 0.97 },
  },
  {
    headline: "Air New Zealand grounds 12 aircraft — engine fault found",
    body: "Air New Zealand has grounded 12 Dreamliner aircraft after a fault was discovered during routine maintenance. The airline expects significant disruption over the next six weeks.",
    category: "company", sentiment: "negative",
    stockEffects: { AIR: 0.88, NZX: 0.99 },
  },
  {
    headline: "NZ recession confirmed — second consecutive quarter of negative growth",
    body: "Statistics NZ confirmed New Zealand has entered a technical recession for the first time since 2009. GDP contracted 0.3% in the latest quarter, led by weaker consumer spending.",
    category: "economy", sentiment: "negative",
    stockEffects: { ANZ: 0.95, FBU: 0.93, MEL: 0.97, SPK: 0.96 },
    propertyEffect: 0.97,
  },
  {
    headline: "Spark NZ loses 180,000 customers to rival MVNOs",
    body: "Spark has reported its worst customer retention quarter in a decade as budget mobile operators undercut on price. Market share fell from 39% to 36%.",
    category: "company", sentiment: "negative",
    stockEffects: { SPK: 0.93, NZX: 0.99 },
  },
  {
    headline: "Wellington property values fall for third straight month",
    body: "Wellington house prices have fallen 2.1% this month, extending a 6% decline from the peak. Experts cite rising mortgage rates and oversupply in the apartment sector.",
    category: "property", sentiment: "negative",
    propertyEffect: 0.98,
    stockEffects: { ANZ: 0.98, FBU: 0.97 },
  },

  // Neutral / informational
  {
    headline: "NZX announces new ESG reporting requirements for listed companies",
    body: "The NZX has mandated that all listed companies report on carbon emissions and climate risk from next financial year. Companies with poor ESG scores may face institutional selling.",
    category: "market", sentiment: "neutral",
    stockEffects: { MEL: 1.01, FBU: 0.99 },
  },
  {
    headline: "ANZ Bank posts steady results, maintains dividend",
    body: "ANZ New Zealand reported a net profit of $2.1B for the year, in line with analyst expectations. The bank maintained its dividend at 72 cents per share.",
    category: "company", sentiment: "neutral",
    stockEffects: { ANZ: 1.01, NZX: 1.00 },
  },
];

// ── Random Life Events ────────────────────────────────────────────────────
export type LifeEvent = {
  id: string;
  title: string;
  description: string;
  type: "expense" | "income" | "xp" | "mixed";
  balanceChange: number;
  xpChange: number;
  category: "car" | "health" | "work" | "social" | "opportunity" | "surprise";
  emoji: string;
  tip: string;
};

const LIFE_EVENT_POOL: Omit<LifeEvent, "id">[] = [
  // Expenses
  {
    title: "Car needs a WOF repair",
    description: "Your car failed its Warrant of Fitness. The mechanic found a cracked windscreen and worn brake pads. Repair bill: $480.",
    type: "expense", balanceChange: -480, xpChange: 10,
    category: "car", emoji: "🔧",
    tip: "Always keep an emergency fund. Unexpected car costs are one of the most common financial shocks for young Kiwis.",
  },
  {
    title: "Dentist visit — no insurance",
    description: "A routine checkup revealed two small cavities. Without dental insurance, the bill came to $320 out of pocket.",
    type: "expense", balanceChange: -320, xpChange: 10,
    category: "health", emoji: "🦷",
    tip: "Dental care in NZ is not subsidised for adults. Consider dental insurance or a dedicated savings fund for health costs.",
  },
  {
    title: "Phone screen shattered",
    description: "You dropped your phone on the footpath. No insurance. Screen replacement at iCare in Auckland: $260.",
    type: "expense", balanceChange: -260, xpChange: 5,
    category: "surprise", emoji: "📱",
    tip: "Phone insurance costs about $15/month. One screen replacement costs $260. The maths is worth it.",
  },
  {
    title: "Speeding fine on the Southern Motorway",
    description: "15km/h over the limit on the way to work. NZTA fine: $150. No demerit points this time.",
    type: "expense", balanceChange: -150, xpChange: 5,
    category: "car", emoji: "🚗",
    tip: "Traffic fines are entirely preventable. $150 is about 6 hours of work at minimum wage.",
  },
  {
    title: "Friend's birthday dinner — you offered to pay",
    description: "Big night out in Ponsonby. You generously covered the table. Total: $220.",
    type: "expense", balanceChange: -220, xpChange: 15,
    category: "social", emoji: "🍽️",
    tip: "Social spending is real spending. Budget for it in the 30% wants category so it does not catch you off guard.",
  },
  {
    title: "Gym membership auto-renewed",
    description: "You forgot to cancel your gym membership before the annual renewal. $540 charged to your account.",
    type: "expense", balanceChange: -540, xpChange: 10,
    category: "surprise", emoji: "💪",
    tip: "Set calendar reminders before subscription renewals. Subscriptions you forget about are pure wasted money.",
  },
  {
    title: "Trademe listing fee gone wrong",
    description: "You listed an item for too low a price and it sold before you could cancel. Net loss compared to market value: $180.",
    type: "expense", balanceChange: -180, xpChange: 20,
    category: "surprise", emoji: "💻",
    tip: "Always research market prices before listing anything for sale. Check what similar items have actually sold for.",
  },

  // Income / positive
  {
    title: "Sold old gear on Trademe",
    description: "You finally cleaned out your room and sold old sports equipment, games, and clothes on Trademe. Net proceeds: $340.",
    type: "income", balanceChange: 340, xpChange: 20,
    category: "opportunity", emoji: "📦",
    tip: "Decluttering = money. The average NZ household has over $3,000 worth of unused items that could be sold.",
  },
  {
    title: "Work paid you a surprise bonus",
    description: "Your manager recognised your extra effort this month. Discretionary bonus added to your pay: $250.",
    type: "income", balanceChange: 250, xpChange: 30,
    category: "work", emoji: "⭐",
    tip: "Going above expectations at work is one of the fastest ways to increase your income. Performance bonuses are real.",
  },
  {
    title: "Won a workplace raffle",
    description: "The office Christmas raffle — you won a $150 prezzy card.",
    type: "income", balanceChange: 150, xpChange: 10,
    category: "surprise", emoji: "🎁",
    tip: "Windfall money is a great opportunity to top up your emergency fund or savings before spending it.",
  },
  {
    title: "Cash job over the weekend",
    description: "You helped a neighbour move house and paint a room. Cash in hand: $200.",
    type: "income", balanceChange: 200, xpChange: 15,
    category: "work", emoji: "🏠",
    tip: "Side income adds up fast. Even one cash job per fortnight at $200 equals $5,200 extra per year.",
  },
  {
    title: "Family gifted you money for your birthday",
    description: "Your grandparents sent you $300 for your birthday with a note saying to save it wisely.",
    type: "income", balanceChange: 300, xpChange: 10,
    category: "social", emoji: "🎂",
    tip: "Gifts and windfalls are a chance to accelerate your goals. What does your pūtake say to do with this?",
  },
  {
    title: "Tax refund from IRD",
    description: "You were on the wrong tax code last year and overpaid. IRD processed your refund: $420.",
    type: "income", balanceChange: 420, xpChange: 25,
    category: "opportunity", emoji: "🏛️",
    tip: "Always check your tax code. Using the wrong code is one of the most common and easily fixed money mistakes in NZ.",
  },

  // Mixed / XP bonuses
  {
    title: "You negotiated a pay rise",
    description: "You asked for a pay review and made a compelling case. Your employer agreed to a $2/hr increase starting next pay cycle.",
    type: "mixed", balanceChange: 80, xpChange: 50,
    category: "work", emoji: "💼",
    tip: "Negotiating your salary is the highest-return financial skill you can develop. Most people never ask — those who do earn significantly more over their careers.",
  },
  {
    title: "Enrolled in KiwiSaver",
    description: "You finally enrolled in KiwiSaver. Your employer will now contribute 3% on top of your contributions. Long-term wealth building starts now.",
    type: "mixed", balanceChange: 0, xpChange: 75,
    category: "opportunity", emoji: "🥝",
    tip: "If you are not in KiwiSaver, you are leaving free money on the table. Your employer must contribute at least 3% on top of your own contributions.",
  },
  {
    title: "Opened a high-interest savings account",
    description: "You moved your emergency fund to a 4.8% savings account. Small action, big long-term impact.",
    type: "mixed", balanceChange: 0, xpChange: 40,
    category: "opportunity", emoji: "🏦",
    tip: "Money sitting in a transaction account earning 0.1% when savings accounts offer 4.8% is costing you real money every day.",
  },
];

// ── Generate functions ────────────────────────────────────────────────────

export function generateWeeklyNews(): NewsEvent {
  const item = NEWS_POOL[Math.floor(Math.random() * NEWS_POOL.length)];
  return {
    ...item,
    id: `news_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    date: Date.now(),
  };
}

export function generateLifeEvent(): LifeEvent {
  const item = LIFE_EVENT_POOL[Math.floor(Math.random() * LIFE_EVENT_POOL.length)];
  return {
    ...item,
    id: `event_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  };
}

// Determine which life events should fire this week (0-2 per week, random)
export function shouldFireLifeEvent(): boolean {
  return Math.random() < 0.4; // 40% chance each day check
}
