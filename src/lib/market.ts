// Simulated NZX stock market
// Uses geometric Brownian motion for realistic price simulation

export type Stock = {
  symbol: string;
  name: string;
  sector: string;
  basePrice: number;
  volatility: number;   // daily volatility as decimal e.g. 0.02 = 2%
  drift: number;        // daily drift e.g. 0.0003 = ~7.5% annual
  price: number;
  previousPrice: number;
  change: number;
  changePct: number;
  high52w: number;
  low52w: number;
  dividendYield: number;
  marketCap: string;
};

export const NZX_STOCKS: Omit<Stock, "price" | "previousPrice" | "change" | "changePct">[] = [
  { symbol: "ANZ",  name: "ANZ Bank New Zealand",  sector: "Finance",       basePrice: 29.40, volatility: 0.015, drift: 0.0003, high52w: 32.10, low52w: 25.80, dividendYield: 5.2, marketCap: "$18.2B" },
  { symbol: "FBU",  name: "Fletcher Building",     sector: "Construction",  basePrice: 4.85,  volatility: 0.025, drift: 0.0001, high52w: 6.20,  low52w: 3.90,  dividendYield: 3.1, marketCap: "$2.4B"  },
  { symbol: "SPK",  name: "Spark New Zealand",     sector: "Telecom",       basePrice: 3.72,  volatility: 0.012, drift: 0.0002, high52w: 4.10,  low52w: 3.20,  dividendYield: 8.1, marketCap: "$6.8B"  },
  { symbol: "MFT",  name: "Mainfreight",           sector: "Logistics",     basePrice: 68.20, volatility: 0.018, drift: 0.0004, high52w: 78.50, low52w: 55.00, dividendYield: 1.8, marketCap: "$12.1B" },
  { symbol: "AIR",  name: "Air New Zealand",       sector: "Aviation",      basePrice: 0.71,  volatility: 0.035, drift: 0.0001, high52w: 0.98,  low52w: 0.52,  dividendYield: 0.0, marketCap: "$1.1B"  },
  { symbol: "MEL",  name: "Meridian Energy",       sector: "Energy",        basePrice: 5.42,  volatility: 0.013, drift: 0.0003, high52w: 6.10,  low52w: 4.80,  dividendYield: 4.9, marketCap: "$9.8B"  },
  { symbol: "KPG",  name: "Kiwi Property Group",  sector: "Property",      basePrice: 0.98,  volatility: 0.016, drift: 0.0002, high52w: 1.15,  low52w: 0.82,  dividendYield: 6.8, marketCap: "$1.3B"  },
  { symbol: "SCL",  name: "Scales Corporation",   sector: "Horticulture",  basePrice: 3.15,  volatility: 0.022, drift: 0.0002, high52w: 3.80,  low52w: 2.60,  dividendYield: 5.5, marketCap: "$0.5B"  },
  { symbol: "XRO",  name: "Xero Limited",         sector: "Technology",    basePrice: 138.50,volatility: 0.028, drift: 0.0005, high52w: 165.00,low52w: 105.00,dividendYield: 0.0, marketCap: "$21.8B" },
  { symbol: "MCY",  name: "Mercury NZ",           sector: "Energy",        basePrice: 6.81,  volatility: 0.014, drift: 0.0003, high52w: 7.50,  low52w: 6.00,  dividendYield: 4.2, marketCap: "$7.2B"  },
];

// Seed-based deterministic random for consistent daily prices
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Generate price history using GBM
export function generatePriceHistory(stock: typeof NZX_STOCKS[0], days: number = 90, seed: number = 0): number[] {
  const prices: number[] = [stock.basePrice];
  for (let i = 1; i < days; i++) {
    const r = seededRandom(seed + i + stock.basePrice * 100);
    const normalRandom = Math.sqrt(-2 * Math.log(r + 0.0001)) * Math.cos(2 * Math.PI * seededRandom(seed + i + 1));
    const dailyReturn = stock.drift + stock.volatility * normalRandom;
    prices.push(Math.max(0.01, prices[i - 1] * (1 + dailyReturn)));
  }
  return prices;
}

// Get current simulated prices (changes every "session" based on time)
export function getCurrentStocks(sessionSeed?: number): Stock[] {
  const seed = sessionSeed ?? Math.floor(Date.now() / (1000 * 60 * 15)); // changes every 15 min

  return NZX_STOCKS.map((s, idx) => {
    const r1 = seededRandom(seed + idx * 7 + 1);
    const r2 = seededRandom(seed + idx * 7 + 2);
    const normalRandom = Math.sqrt(-2 * Math.log(r1 + 0.0001)) * Math.cos(2 * Math.PI * r2);
    const dailyReturn = s.drift + s.volatility * normalRandom;
    const price = Math.max(0.01, s.basePrice * (1 + dailyReturn));
    const previousPrice = s.basePrice;
    const change = price - previousPrice;
    const changePct = (change / previousPrice) * 100;
    return { ...s, price: Math.round(price * 100) / 100, previousPrice, change: Math.round(change * 100) / 100, changePct: Math.round(changePct * 100) / 100 };
  });
}

// Calculate portfolio value of held stocks
export function calcPortfolioValue(
  holdings: { symbol: string; quantity: number; purchasePrice: number }[],
  currentPrices: Stock[]
): { totalValue: number; totalCost: number; gainLoss: number; gainLossPct: number } {
  let totalValue = 0;
  let totalCost = 0;
  for (const h of holdings) {
    const stock = currentPrices.find(s => s.symbol === h.symbol);
    const currentPrice = stock?.price ?? h.purchasePrice;
    totalValue += currentPrice * h.quantity;
    totalCost += h.purchasePrice * h.quantity;
  }
  const gainLoss = totalValue - totalCost;
  const gainLossPct = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
  return { totalValue: Math.round(totalValue * 100) / 100, totalCost: Math.round(totalCost * 100) / 100, gainLoss: Math.round(gainLoss * 100) / 100, gainLossPct: Math.round(gainLossPct * 100) / 100 };
}

// NZ Property market simulation
export const NZ_PROPERTIES = [
  { id: "akl-apt",    name: "Auckland City Apartment",  suburb: "Auckland CBD",     price: 485000, weeklyRent: 450, yield: 4.8, minXp: 500  },
  { id: "wgtn-house", name: "Wellington Terraced House",suburb: "Mount Victoria",   price: 620000, weeklyRent: 520, yield: 4.4, minXp: 800  },
  { id: "chch-section",name: "Christchurch Section",   suburb: "Rolleston",        price: 290000, weeklyRent: 0,   yield: 0,   minXp: 300  },
  { id: "akl-house",  name: "Auckland Family Home",     suburb: "Manukau",          price: 820000, weeklyRent: 680, yield: 4.3, minXp: 1500 },
  { id: "tga-unit",   name: "Tauranga Investment Unit", suburb: "Mount Maunganui",  price: 540000, weeklyRent: 490, yield: 4.7, minXp: 600  },
  { id: "dun-flat",   name: "Dunedin Student Flat",     suburb: "North Dunedin",    price: 380000, weeklyRent: 560, yield: 7.7, minXp: 400  },
];

// Loan products
export const LOAN_PRODUCTS = [
  { id: "student",  name: "Student Loan",       type: "student",  maxAmount: 20000, interestRate: 0,    weeklyRepaymentPct: 0.12, minXp: 0   },
  { id: "car",      name: "Car Loan",           type: "personal", maxAmount: 30000, interestRate: 12.5, weeklyRepaymentPct: 0.05,  minXp: 200 },
  { id: "personal", name: "Personal Loan",      type: "personal", maxAmount: 15000, interestRate: 15.9, weeklyRepaymentPct: 0.06,  minXp: 300 },
  { id: "mortgage", name: "Home Mortgage",      type: "mortgage", maxAmount: 600000,interestRate: 6.8,  weeklyRepaymentPct: 0.008, minXp: 800 },
  { id: "business", name: "Business Loan",      type: "business", maxAmount: 50000, interestRate: 9.5,  weeklyRepaymentPct: 0.04,  minXp: 1000},
];

export const PHYSICAL_ASSETS = [
  { id: "corolla",    name: "2022 Toyota Corolla",  category: "Vehicle",  price: 32000, depRate: 0.08, minXp: 200  },
  { id: "macbook",    name: "MacBook Pro 14\"",     category: "Tech",     price: 3200,  depRate: 0.20, minXp: 0    },
  { id: "motorbike",  name: "Honda CB500F",         category: "Vehicle",  price: 8500,  depRate: 0.12, minXp: 300  },
  { id: "iphone",     name: "iPhone 15 Pro",        category: "Tech",     price: 1800,  depRate: 0.30, minXp: 0    },
  { id: "suv",        name: "2023 Toyota RAV4",     category: "Vehicle",  price: 55000, depRate: 0.10, minXp: 800  },
  { id: "boat",       name: "Fishing Boat 5m",      category: "Leisure",  price: 25000, depRate: 0.07, minXp: 1500 },
];
