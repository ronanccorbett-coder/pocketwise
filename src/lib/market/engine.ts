// ─────────────────────────────────────────────────────────────────────────────
// DETERMINISTIC MARKET ENGINE
//
// Given a symbol and a timestamp, this engine produces:
//   • the price at that moment
//   • the daily events that influenced that day
//   • the dividend paid that week
//   • the company fundamentals (market cap, P/E, etc.)
//
// Every output is a pure function of (registry data, timestamp). The same
// inputs always produce the same outputs, on every device, with no network
// required. This is how all students see the same market without a running
// server process.
// ─────────────────────────────────────────────────────────────────────────────

import { StockMeta, MARKET_EPOCH_MS, SPREAD_BY_TIER } from "./registry";

// ─── Seeded PRNG ────────────────────────────────────────────────────────────
// mulberry32 — small, fast, well-distributed for our purposes.

export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Hash any string to a 32-bit integer (FNV-1a). Used to derive seeds from
// (symbol, date) so each (stock, day) gets its own deterministic random stream.
export function hashStr(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Box-Muller transform: turn two uniform randoms into one normal random.
function gaussian(rng: () => number): number {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ─── NZ Time + Market Hours ─────────────────────────────────────────────────
// NZX trades 10:00 to 16:45 NZ local time, Monday to Friday (plus auction
// periods we treat as part of the session). Uses Intl to handle NZDT correctly.

export type NZWallClock = {
  year: number; month: number; day: number;
  hour: number; minute: number;
  dow: number;     // 1=Mon … 7=Sun
  dateStr: string; // "YYYY-MM-DD" in NZ local time
};

const NZ_FORMATTER = new Intl.DateTimeFormat("en-NZ", {
  timeZone: "Pacific/Auckland",
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit",
  hour12: false, weekday: "short",
});

const DOW_MAP: Record<string, number> = {
  Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7,
};

export function nzClock(ts: number): NZWallClock {
  const parts = NZ_FORMATTER.formatToParts(new Date(ts));
  const p: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") p[part.type] = part.value;
  }
  // Intl returns midnight as "24" in some locales — normalise to "00"
  let hour = parseInt(p.hour, 10);
  if (hour === 24) hour = 0;
  return {
    year:   parseInt(p.year, 10),
    month:  parseInt(p.month, 10),
    day:    parseInt(p.day, 10),
    hour,
    minute: parseInt(p.minute, 10),
    dow:    DOW_MAP[p.weekday] ?? 1,
    dateStr: `${p.year}-${p.month}-${p.day}`,
  };
}

// NZX market hours in minutes-from-midnight (NZ local)
const MARKET_OPEN_MIN  = 0;             // 24/7 mode
const MARKET_CLOSE_MIN = 24 * 60;       // 24/7 mode
export const TRADING_MINUTES_PER_DAY = MARKET_CLOSE_MIN - MARKET_OPEN_MIN; // 405

export function isWeekday(_dow: number): boolean {
  return true; // 24/7 mode
}

export function isMarketOpen(ts: number): boolean {
  const c = nzClock(ts);
  if (!isWeekday(c.dow)) return false;
  const mins = c.hour * 60 + c.minute;
  return mins >= MARKET_OPEN_MIN && mins < MARKET_CLOSE_MIN;
}

// Trading-day index since epoch. Used as a deterministic anchor — day 0 is
// the first trading day on or after MARKET_EPOCH_MS.
export function tradingDayIndex(ts: number): number {
  // 24/7 mode: every calendar day counts as a trading day
  const epochClock = nzClock(MARKET_EPOCH_MS);
  const nowClock = nzClock(ts);
  const epochDate = Date.UTC(epochClock.year, epochClock.month - 1, epochClock.day);
  const nowDate = Date.UTC(nowClock.year, nowClock.month - 1, nowClock.day);
  const calendarDays = Math.floor((nowDate - epochDate) / 86_400_000);
  return Math.max(0, calendarDays);
}

// Minutes elapsed in today's trading session. 0 before open, TRADING_MINUTES_PER_DAY at/after close.
export function minutesIntoSession(ts: number): number {
  const c = nzClock(ts);
  if (!isWeekday(c.dow)) return TRADING_MINUTES_PER_DAY; // weekend → frozen at close
  const mins = c.hour * 60 + c.minute;
  if (mins < MARKET_OPEN_MIN) return 0;
  if (mins >= MARKET_CLOSE_MIN) return TRADING_MINUTES_PER_DAY;
  return mins - MARKET_OPEN_MIN;
}

// ─── Daily Events ───────────────────────────────────────────────────────────
// Each (stock, trading day) deterministically produces 0–2 events. Events have
// a magnitude (signed percentage shock to that day's drift) and a headline.

export type MarketEventType =
  | "earnings_beat" | "earnings_miss"
  | "contract_win"  | "contract_loss"
  | "sector_tailwind" | "sector_headwind"
  | "exec_change"   | "guidance_raise" | "guidance_cut"
  | "analyst_upgrade" | "analyst_downgrade"
  | "regulatory" | "calm";

export type MarketEvent = {
  type: MarketEventType;
  magnitude: number; // signed shock as fraction of price (e.g. +0.03 = +3%)
  headline: string;
};

const HEADLINE_TEMPLATES: Record<MarketEventType, (name: string, sector: string) => string> = {
  earnings_beat:     (n) => `${n} posts profit ahead of analyst expectations`,
  earnings_miss:     (n) => `${n} earnings disappoint, profit below forecasts`,
  contract_win:      (n) => `${n} announces major new contract win`,
  contract_loss:     (n) => `${n} loses bid for key contract to competitor`,
  sector_tailwind:   (_, s) => `${s} sector lifts on positive industry data`,
  sector_headwind:   (_, s) => `${s} sector under pressure amid weak demand`,
  exec_change:       (n) => `${n} announces new chief executive`,
  guidance_raise:    (n) => `${n} raises full-year earnings guidance`,
  guidance_cut:      (n) => `${n} cuts guidance citing softer trading conditions`,
  analyst_upgrade:   (n) => `Broker upgrades ${n} to Buy on stronger outlook`,
  analyst_downgrade: (n) => `Broker downgrades ${n} citing valuation concerns`,
  regulatory:        (n) => `${n} flagged in new Commerce Commission review`,
  calm:              (n) => `${n} trading in line with broader NZX market`,
};

// ETF-specific templates — funds don't have CEOs, earnings, or contracts.
const ETF_HEADLINE_TEMPLATES: Partial<Record<MarketEventType, (name: string, sector: string) => string>> = {
  sector_tailwind:   (n) => `${n} rallies as global markets reach new highs`,
  sector_headwind:   (n) => `${n} slides amid broad market sell-off`,
  analyst_upgrade:   (_, s) => `Strategists forecast stronger outlook for ${s}`,
  analyst_downgrade: (_, s) => `Analysts caution on ${s} valuations`,
  guidance_raise:    (n) => `${n} sees inflows lift fund size to new record`,
  guidance_cut:      (n) => `Outflows hit ${n} as investors turn defensive`,
  calm:              (n) => `${n} steady alongside broader markets`,
};

// Build the day's events deterministically for a single stock.
export function dailyEvents(stock: StockMeta, tradingDay: number): MarketEvent[] {
  const seed = hashStr(`${stock.symbol}|day${tradingDay}`);
  const rng = mulberry32(seed);

  // ETFs have softer events: 50% one event, 5% two, 45% calm-only
  // Stocks: 70% one event, 15% two, 15% none
  const isETF = stock.type === "etf";
  const r = rng();
  const eventCount = isETF
    ? (r < 0.05 ? 2 : r < 0.55 ? 1 : 0)
    : (r < 0.15 ? 2 : r < 0.85 ? 1 : 0);
  if (eventCount === 0) return [];

  const stockTypes: MarketEventType[] = [
    "earnings_beat", "earnings_miss", "contract_win", "contract_loss",
    "sector_tailwind", "sector_headwind", "exec_change",
    "guidance_raise", "guidance_cut", "analyst_upgrade", "analyst_downgrade",
    "regulatory", "calm", "calm", "calm",
  ];
  const etfTypes: MarketEventType[] = [
    "sector_tailwind", "sector_headwind",
    "analyst_upgrade", "analyst_downgrade",
    "guidance_raise", "guidance_cut",
    "calm", "calm", "calm", "calm",
  ];
  const types = isETF ? etfTypes : stockTypes;

  const events: MarketEvent[] = [];
  for (let i = 0; i < eventCount; i++) {
    const type = types[Math.floor(rng() * types.length)];
    const sign = type.includes("miss") || type.includes("loss") ||
                 type.includes("headwind") || type.includes("cut") ||
                 type.includes("downgrade") || type === "regulatory" ? -1 : 1;
    const calmAdj = type === "calm" ? 0.2 : 1;
    const etfAdj = isETF ? 0.4 : 1;
    const base = (0.005 + rng() * 0.025) * calmAdj * etfAdj;
    const magnitude = sign * base;
    const template = (isETF && ETF_HEADLINE_TEMPLATES[type]) || HEADLINE_TEMPLATES[type];
    events.push({
      type,
      magnitude,
      headline: template(stock.name, stock.sector),
    });
  }
  return events;
}

// ─── Price Simulation ───────────────────────────────────────────────────────
// Daily closes evolve as: close[d] = close[d-1] * (1 + drift + eventShock + noise)
// where drift, eventShock and noise are all deterministic for that (stock, day).
//
// Intraday price interpolates between previous close and today's close along
// an Ornstein-Uhlenbeck path, also seeded deterministically.

const DAILY_DRIFT = (annualDrift: number) => annualDrift / 252; // 252 trading days/year

// We cache daily closes per stock to avoid recomputing the full chain each call.
// Cache is keyed by symbol and stored as an expanding array of closes.
const closeCache = new Map<string, { last: number; closes: number[] }>();

function ensureCloses(stock: StockMeta, uptoDay: number): number[] {
  const key = stock.symbol;
  let entry = closeCache.get(key);
  if (!entry) {
    entry = { last: -1, closes: [] };
    closeCache.set(key, entry);
  }
  if (entry.last >= uptoDay) return entry.closes;

  let prev = entry.last >= 0
    ? entry.closes[entry.last]
    : stock.basePrice;

  for (let d = entry.last + 1; d <= uptoDay; d++) {
    if (d === 0) {
      entry.closes[0] = stock.basePrice;
      prev = stock.basePrice;
      continue;
    }
    // Deterministic random for this day
    const rng = mulberry32(hashStr(`${stock.symbol}|close|${d}`));
    const z = gaussian(rng);
    const noise = stock.volatilityDaily * z;
    const drift = DAILY_DRIFT(stock.driftAnnual);
    const meanRev = stock.meanReversion * Math.log(stock.basePrice / prev);

    // Apply event shocks for the day
    const events = dailyEvents(stock, d);
    const eventShock = events.reduce((sum, e) => sum + e.magnitude, 0);

    const ret = drift + meanRev + noise + eventShock;
    let next = prev * (1 + ret);
    // Clamp to prevent runaway in degenerate seeds (very rare)
    next = Math.max(stock.basePrice * 0.15, Math.min(stock.basePrice * 5, next));
    entry.closes[d] = next;
    prev = next;
  }
  entry.last = uptoDay;
  return entry.closes;
}

// Get the close for a given trading day (will compute earlier days as needed)
export function closePrice(stock: StockMeta, tradingDay: number): number {
  if (tradingDay < 0) return stock.basePrice;
  const closes = ensureCloses(stock, tradingDay);
  return closes[tradingDay];
}

// Intraday price: OU walk from yesterday's close to today's close, seeded deterministically.
// At t=0 minutes we sit at prevClose. At t=TRADING_MINUTES_PER_DAY we sit at todaysClose.
// Between the two, we follow a noisy interpolation so the path is realistic.
export function priceAt(stock: StockMeta, ts: number): number {
  const c = nzClock(ts);
  const day = tradingDayIndex(ts);

  // If outside trading hours (or weekend), return the most recent close.
  if (!isWeekday(c.dow)) {
    // Find the previous trading day
    const lastTradingDay = previousTradingDay(c, day);
    return closePrice(stock, lastTradingDay);
  }

  const mins = c.hour * 60 + c.minute;
  if (mins < MARKET_OPEN_MIN) {
    // Before open today — show yesterday's close
    return closePrice(stock, day - 1);
  }
  if (mins >= MARKET_CLOSE_MIN) {
    // After close today — show today's close
    return closePrice(stock, day);
  }

  const prevClose = closePrice(stock, day - 1);
  const todayClose = closePrice(stock, day);
  const intoSession = mins - MARKET_OPEN_MIN; // 0..405
  const t = intoSession / TRADING_MINUTES_PER_DAY; // 0..1

  // Deterministic intraday wiggle around the linear interpolation
  // Quantize ts to 5-second buckets so ticks are stable across renders
  const bucket = Math.floor(ts / 5000);
  const wiggleRng = mulberry32(hashStr(`${stock.symbol}|wiggle|${day}|${bucket}`));
  const wiggle = (gaussian(wiggleRng)) * stock.volatilityDaily * 0.25; // small intraday noise

  const linear = prevClose + (todayClose - prevClose) * t;
  // Bell-shaped envelope so we converge to todayClose at end-of-day
  const envelope = Math.sin(Math.PI * t); // 0 at edges, 1 at midday
  const intraday = linear * (1 + wiggle * envelope);

  return Math.max(stock.basePrice * 0.1, intraday);
}

function previousTradingDay(c: NZWallClock, currentDay: number): number {
  // If today is Sat/Sun, the most recent trading day is the Friday before.
  // tradingDayIndex returns Friday's index for both Sat and Sun, so subtract.
  if (c.dow === 6) return currentDay; // Sat — tradingDayIndex already gave us Friday's idx
  if (c.dow === 7) return currentDay; // Sun — same
  return currentDay; // weekday outside hours — current day's close
}

// ─── Bid / Ask ──────────────────────────────────────────────────────────────
export function bidAsk(stock: StockMeta, mid: number): { bid: number; ask: number } {
  const spread = SPREAD_BY_TIER[stock.liquidityTier];
  return {
    bid: mid * (1 - spread / 2),
    ask: mid * (1 + spread / 2),
  };
}

// ─── Dividends ──────────────────────────────────────────────────────────────
// Paid weekly on the stock's divDayOfWeek. The amount is annualYield * price / 52,
// plus small deterministic noise so payments vary slightly week to week.
export function dividendPerShareForWeek(stock: StockMeta, weekStartDay: number): number {
  if (stock.divYieldAnnual <= 0) return 0;
  const price = closePrice(stock, weekStartDay);
  const baseWeekly = (stock.divYieldAnnual * price) / 52;
  const rng = mulberry32(hashStr(`${stock.symbol}|div|${weekStartDay}`));
  const variation = 0.85 + rng() * 0.3; // 0.85x–1.15x
  return baseWeekly * variation;
}

// ─── Fundamentals ───────────────────────────────────────────────────────────
export function marketCap(stock: StockMeta, price: number): number {
  return price * stock.shareCount;
}

export function peRatio(stock: StockMeta, price: number): number | null {
  if (stock.baseEPS <= 0) return null;
  return price / stock.baseEPS;
}

export function dividendYield(stock: StockMeta, price: number): number {
  if (stock.basePrice <= 0) return stock.divYieldAnnual;
  // Yield rises if price falls, falls if price rises (real-world dynamic)
  return stock.divYieldAnnual * (stock.basePrice / price);
}

// ─── Public Snapshot Type ───────────────────────────────────────────────────
export type StockSnapshot = {
  symbol: string;
  name: string;
  sector: string;
  about: string;
  type?: "stock" | "etf";
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
  bid: number;
  ask: number;
  dayHigh: number;
  dayLow: number;
  marketCap: number;
  peRatio: number | null;
  dividendYield: number;
  liquidityTier: string;
  history: number[];      // last ~60 minute bars within today (for sparkline)
  headlines: { day: number; headline: string; magnitude: number }[]; // recent headlines
};

// Build a complete snapshot of a single stock at `ts`
export function snapshotStock(stock: StockMeta, ts: number): StockSnapshot {
  const day = tradingDayIndex(ts);
  const price = priceAt(stock, ts);
  const prevClose = closePrice(stock, day - 1);

  // Day high/low: sample 8 points across today's session up to current time
  const c = nzClock(ts);
  const mins = isWeekday(c.dow) ? Math.max(0, Math.min(TRADING_MINUTES_PER_DAY,
    c.hour * 60 + c.minute - MARKET_OPEN_MIN)) : TRADING_MINUTES_PER_DAY;
  const samples: number[] = [];
  if (mins > 0) {
    const startTs = ts - mins * 60_000;
    const step = Math.max(60_000, (mins * 60_000) / 20);
    for (let t = startTs; t <= ts; t += step) samples.push(priceAt(stock, t));
  } else {
    samples.push(price);
  }
  const dayHigh = Math.max(...samples, price);
  const dayLow  = Math.min(...samples, price);

  // Sparkline: last 30 samples
  const history = samples.slice(-30);

  // Recent headlines: scan last 5 trading days
  const headlines: StockSnapshot["headlines"] = [];
  for (let d = day; d >= Math.max(0, day - 5); d--) {
    for (const e of dailyEvents(stock, d)) {
      if (e.type !== "calm") {
        headlines.push({ day: d, headline: e.headline, magnitude: e.magnitude });
      }
    }
  }

  const { bid, ask } = bidAsk(stock, price);

  return {
    symbol: stock.symbol,
    name: stock.name,
    sector: stock.sector,
    about: stock.about,
    type: stock.type ?? "stock",
    price,
    prevClose,
    change: price - prevClose,
    changePct: prevClose > 0 ? (price - prevClose) / prevClose : 0,
    bid,
    ask,
    dayHigh,
    dayLow,
    marketCap: marketCap(stock, price),
    peRatio: peRatio(stock, price),
    dividendYield: dividendYield(stock, price),
    liquidityTier: stock.liquidityTier,
    history,
    headlines: headlines.slice(0, 5),
  };
}

// ─── Historical Series (for chart) ──────────────────────────────────────────
export type HistoryRange = "1D" | "1W" | "1M" | "3M" | "ALL";

export function priceSeries(stock: StockMeta, ts: number, range: HistoryRange): { t: number; price: number }[] {
  const day = tradingDayIndex(ts);
  if (range === "1D") {
    // Minute bars across today's session
    const c = nzClock(ts);
    const mins = isWeekday(c.dow) ? Math.max(0, Math.min(TRADING_MINUTES_PER_DAY,
      c.hour * 60 + c.minute - MARKET_OPEN_MIN)) : TRADING_MINUTES_PER_DAY;
    if (mins <= 0) return [{ t: ts, price: closePrice(stock, day - 1) }];
    const startTs = ts - mins * 60_000;
    const out: { t: number; price: number }[] = [];
    for (let m = 0; m <= mins; m += 5) {
      const t = startTs + m * 60_000;
      out.push({ t, price: priceAt(stock, t) });
    }
    return out;
  }

  // Multi-day: one daily close per trading day, walking back from today
  const days = range === "1W" ? 7 : range === "1M" ? 22 : range === "3M" ? 66 : Math.max(0, day);
  const out: { t: number; price: number }[] = [];
  const tradingDaysBack = Math.min(day + 1, days);
  for (let i = tradingDaysBack - 1; i >= 0; i--) {
    const d = day - i;
    if (d < 0) continue;
    out.push({
      t: ts - i * 86_400_000, // approximate timestamp for the day (good enough for chart axis)
      price: closePrice(stock, d),
    });
  }
  return out;
}
