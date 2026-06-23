// ─────────────────────────────────────────────────────────────────────────────
// NZX STOCK REGISTRY
//
// Each stock is a pure data object that fully describes its simulated behaviour.
// All prices are NZD. All values are intentionally rough — close to reality but
// fictional, since the simulation does not connect to a live data feed.
//
// The deterministic engine in ./engine.ts consumes this registry and produces
// the same prices and events for every student at every moment.
// ─────────────────────────────────────────────────────────────────────────────

export type LiquidityTier = "high" | "mid" | "low";

export type StockMeta = {
  symbol: string;
  name: string;
  sector: string;
  about: string;            // one-liner about the company, shown in info panel
  basePrice: number;        // anchor price the OU process reverts to (NZD)
  volatilityDaily: number;  // daily stddev as fraction of price (e.g. 0.018 = 1.8%)
  driftAnnual: number;      // expected annual return (e.g. 0.05 = 5%)
  meanReversion: number;    // OU pull strength toward basePrice (0..1 per day)
  shareCount: number;       // shares outstanding — for market cap
  baseEPS: number;          // annual earnings per share (NZD) — for P/E ratio
  divYieldAnnual: number;   // dividend yield (e.g. 0.045 = 4.5% per year)
  divDayOfWeek: 1|2|3|4|5;  // weekday dividend pays (1=Mon … 5=Fri)
  liquidityTier: LiquidityTier; // determines bid/ask spread
  type?: "stock" | "etf";       // defaults to "stock"
};

// Bid/ask spread (round-trip) by liquidity tier — applied as half above/below mid
export const SPREAD_BY_TIER: Record<LiquidityTier, number> = {
  high: 0.0015, // 0.15% spread (highly liquid blue chips)
  mid:  0.003,  // 0.30%
  low:  0.005,  // 0.50% (thinly traded)
};

// Brokerage fee per trade (each side) — 0.5%
export const BROKERAGE_PCT = 0.005;

// ─────────────────────────────────────────────────────────────────────────────
// 15 NZX companies covering telecom, healthcare, utilities, infrastructure,
// retail, logistics, tourism, construction, and consumer staples.
// ─────────────────────────────────────────────────────────────────────────────
export const NZX_STOCKS: StockMeta[] = [
  {
    symbol: "SPK", name: "Spark New Zealand", sector: "Telecommunications",
    about: "NZ's largest telecommunications and digital services company.",
    basePrice: 3.20, volatilityDaily: 0.012, driftAnnual: 0.03, meanReversion: 0.04,
    shareCount: 1_840_000_000, baseEPS: 0.21, divYieldAnnual: 0.085,
    divDayOfWeek: 3, liquidityTier: "high",
  },
  {
    symbol: "AIR", name: "Air New Zealand", sector: "Airlines",
    about: "National flag carrier airline operating domestic and international routes.",
    basePrice: 0.55, volatilityDaily: 0.025, driftAnnual: 0.02, meanReversion: 0.03,
    shareCount: 3_380_000_000, baseEPS: 0.04, divYieldAnnual: 0.05,
    divDayOfWeek: 4, liquidityTier: "high",
  },
  {
    symbol: "FPH", name: "Fisher & Paykel Healthcare", sector: "Healthcare",
    about: "Designs and manufactures medical devices for respiratory care and surgery.",
    basePrice: 36.00, volatilityDaily: 0.018, driftAnnual: 0.09, meanReversion: 0.025,
    shareCount: 580_000_000, baseEPS: 0.62, divYieldAnnual: 0.012,
    divDayOfWeek: 2, liquidityTier: "high",
  },
  {
    symbol: "ATM", name: "A2 Milk Company", sector: "Consumer Staples",
    about: "Produces A1-protein-free dairy products, with major exports to China.",
    basePrice: 5.50, volatilityDaily: 0.028, driftAnnual: 0.04, meanReversion: 0.035,
    shareCount: 720_000_000, baseEPS: 0.21, divYieldAnnual: 0.0,
    divDayOfWeek: 5, liquidityTier: "high",
  },
  {
    symbol: "MEL", name: "Meridian Energy", sector: "Utilities",
    about: "NZ's largest electricity generator — 100% renewable hydro and wind.",
    basePrice: 5.80, volatilityDaily: 0.014, driftAnnual: 0.04, meanReversion: 0.04,
    shareCount: 2_580_000_000, baseEPS: 0.16, divYieldAnnual: 0.045,
    divDayOfWeek: 3, liquidityTier: "high",
  },
  {
    symbol: "MCY", name: "Mercury NZ", sector: "Utilities",
    about: "Generates electricity from geothermal, hydro and wind, and retails to homes.",
    basePrice: 6.30, volatilityDaily: 0.013, driftAnnual: 0.04, meanReversion: 0.04,
    shareCount: 1_400_000_000, baseEPS: 0.18, divYieldAnnual: 0.038,
    divDayOfWeek: 1, liquidityTier: "mid",
  },
  {
    symbol: "CEN", name: "Contact Energy", sector: "Utilities",
    about: "Major electricity generator and retailer with geothermal and hydro assets.",
    basePrice: 8.90, volatilityDaily: 0.014, driftAnnual: 0.05, meanReversion: 0.04,
    shareCount: 745_000_000, baseEPS: 0.32, divYieldAnnual: 0.04,
    divDayOfWeek: 4, liquidityTier: "high",
  },
  {
    symbol: "AIA", name: "Auckland International Airport", sector: "Infrastructure",
    about: "Operator of New Zealand's largest airport and surrounding property.",
    basePrice: 8.20, volatilityDaily: 0.015, driftAnnual: 0.05, meanReversion: 0.03,
    shareCount: 1_500_000_000, baseEPS: 0.22, divYieldAnnual: 0.022,
    divDayOfWeek: 2, liquidityTier: "high",
  },
  {
    symbol: "IFT", name: "Infratil", sector: "Infrastructure",
    about: "Invests in infrastructure assets across energy, data centres and transport.",
    basePrice: 10.50, volatilityDaily: 0.019, driftAnnual: 0.08, meanReversion: 0.028,
    shareCount: 800_000_000, baseEPS: 0.35, divYieldAnnual: 0.018,
    divDayOfWeek: 5, liquidityTier: "high",
  },
  {
    symbol: "POT", name: "Port of Tauranga", sector: "Infrastructure",
    about: "NZ's largest port — handles bulk exports including logs, dairy and kiwifruit.",
    basePrice: 5.40, volatilityDaily: 0.012, driftAnnual: 0.04, meanReversion: 0.03,
    shareCount: 680_000_000, baseEPS: 0.16, divYieldAnnual: 0.028,
    divDayOfWeek: 3, liquidityTier: "mid",
  },
  {
    symbol: "FBU", name: "Fletcher Building", sector: "Construction",
    about: "Manufactures building materials and runs major construction projects.",
    basePrice: 2.80, volatilityDaily: 0.024, driftAnnual: 0.0, meanReversion: 0.035,
    shareCount: 780_000_000, baseEPS: -0.05, divYieldAnnual: 0.0,
    divDayOfWeek: 2, liquidityTier: "mid",
  },
  {
    symbol: "RYM", name: "Ryman Healthcare", sector: "Retirement Living",
    about: "Builds and operates retirement villages and aged-care facilities.",
    basePrice: 4.40, volatilityDaily: 0.022, driftAnnual: 0.03, meanReversion: 0.03,
    shareCount: 700_000_000, baseEPS: 0.15, divYieldAnnual: 0.0,
    divDayOfWeek: 4, liquidityTier: "mid",
  },
  {
    symbol: "SUM", name: "Summerset Group", sector: "Retirement Living",
    about: "Operator of retirement villages across New Zealand and Australia.",
    basePrice: 9.80, volatilityDaily: 0.02, driftAnnual: 0.06, meanReversion: 0.03,
    shareCount: 230_000_000, baseEPS: 0.42, divYieldAnnual: 0.013,
    divDayOfWeek: 1, liquidityTier: "mid",
  },
  {
    symbol: "MFT", name: "Mainfreight", sector: "Logistics",
    about: "Global freight, transport and logistics company headquartered in Auckland.",
    basePrice: 67.00, volatilityDaily: 0.017, driftAnnual: 0.08, meanReversion: 0.025,
    shareCount: 100_000_000, baseEPS: 3.40, divYieldAnnual: 0.022,
    divDayOfWeek: 3, liquidityTier: "high",
  },
  {
    symbol: "KMD", name: "KMD Brands", sector: "Retail",
    about: "Owner of Kathmandu, Rip Curl and Oboz outdoor brands.",
    basePrice: 0.50, volatilityDaily: 0.03, driftAnnual: -0.02, meanReversion: 0.04,
    shareCount: 715_000_000, baseEPS: 0.02, divYieldAnnual: 0.04,
    divDayOfWeek: 5, liquidityTier: "low",
  },
  {
    symbol: "HLG", name: "Hallenstein Glasson", sector: "Retail",
    about: "Operates Hallensteins and Glassons fashion retail chains.",
    basePrice: 5.20, volatilityDaily: 0.022, driftAnnual: 0.03, meanReversion: 0.035,
    shareCount: 60_000_000, baseEPS: 0.50, divYieldAnnual: 0.075,
    divDayOfWeek: 4, liquidityTier: "low",
  },
  {
    symbol: "THL", name: "Tourism Holdings", sector: "Tourism",
    about: "Operates campervan rentals and tourism services in NZ, Australia and the US.",
    basePrice: 3.40, volatilityDaily: 0.026, driftAnnual: 0.04, meanReversion: 0.035,
    shareCount: 200_000_000, baseEPS: 0.18, divYieldAnnual: 0.04,
    divDayOfWeek: 2, liquidityTier: "low",
  },
  // ─── ETFs and Managed Funds ─────────────────────────────────────────────
  // Lower volatility because they hold many companies. Slightly higher drift
  // because diversification smooths returns. P/E shows n/a (baseEPS = 0).
  {
    symbol: "USF", name: "Smartshares S&P 500 ETF", sector: "US Large Cap ETF",
    about: "Tracks the S&P 500 index — the 500 largest US companies, including Apple, Microsoft, Amazon, and Google.",
    basePrice: 15.20, volatilityDaily: 0.008, driftAnnual: 0.09, meanReversion: 0.015,
    shareCount: 90_000_000, baseEPS: 0, divYieldAnnual: 0.015,
    divDayOfWeek: 3, liquidityTier: "high", type: "etf",
  },
  {
    symbol: "USG", name: "Smartshares Total World ETF", sector: "Global ETF",
    about: "Tracks global share markets across developed and emerging economies. The most diversified equity option.",
    basePrice: 12.50, volatilityDaily: 0.007, driftAnnual: 0.07, meanReversion: 0.015,
    shareCount: 60_000_000, baseEPS: 0, divYieldAnnual: 0.022,
    divDayOfWeek: 4, liquidityTier: "high", type: "etf",
  },
  {
    symbol: "NZG", name: "Smartshares NZ Top 50 ETF", sector: "NZ Index ETF",
    about: "Tracks the NZX 50 — the 50 largest companies on the New Zealand stock exchange.",
    basePrice: 3.50, volatilityDaily: 0.009, driftAnnual: 0.06, meanReversion: 0.02,
    shareCount: 180_000_000, baseEPS: 0, divYieldAnnual: 0.035,
    divDayOfWeek: 5, liquidityTier: "high", type: "etf",
  },
  {
    symbol: "AGG", name: "Smartshares Global Bond ETF", sector: "Bond ETF",
    about: "Holds government and corporate bonds globally. Much lower risk and lower return than shares.",
    basePrice: 2.80, volatilityDaily: 0.003, driftAnnual: 0.035, meanReversion: 0.03,
    shareCount: 120_000_000, baseEPS: 0, divYieldAnnual: 0.04,
    divDayOfWeek: 2, liquidityTier: "high", type: "etf",
  },
  {
    symbol: "MFG", name: "Milford Active Growth Fund", sector: "Managed Fund",
    about: "Actively managed NZ fund mixing shares, property and bonds. Aims to return 5%+ above inflation over the long term.",
    basePrice: 5.20, volatilityDaily: 0.008, driftAnnual: 0.085, meanReversion: 0.018,
    shareCount: 250_000_000, baseEPS: 0, divYieldAnnual: 0.025,
    divDayOfWeek: 3, liquidityTier: "mid", type: "etf",
  },
  {
    symbol: "MFD", name: "Milford Diversified Income Fund", sector: "Managed Fund",
    about: "Income-focused Milford fund holding mostly bonds and dividend-paying shares. Lower risk than growth funds.",
    basePrice: 4.80, volatilityDaily: 0.005, driftAnnual: 0.055, meanReversion: 0.025,
    shareCount: 200_000_000, baseEPS: 0, divYieldAnnual: 0.045,
    divDayOfWeek: 1, liquidityTier: "mid", type: "etf",
  },
];

export const STOCK_BY_SYMBOL: Record<string, StockMeta> =
  Object.fromEntries(NZX_STOCKS.map(s => [s.symbol, s]));

// Simulation epoch — t=0. All deterministic generation is anchored here.
// Set in the past so the platform launches with visible history.
export const MARKET_EPOCH_MS = Date.UTC(2026, 1, 1); // 1 Feb 2026 UTC
