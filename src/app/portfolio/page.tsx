"use client";
import PortfolioTutorial from "@/components/PortfolioTutorial";
import DayTradingTerminal from "@/components/DayTradingTerminal";
import { useTheme } from "@/lib/theme";
import MarketsTab from "@/components/MarketsTab";
import { useState, useCallback } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { useGame, NZX_STOCKS } from "@/lib/gameContext";
import { useStockSimulator, sparklinePath } from "@/lib/stockSimulator";
import {
  DollarSign, TrendingUp, Car, AlertTriangle, Wallet, ChevronRight,
  BarChart2, Plus, Minus, Wrench, Zap, TrendingDown,
  Package, Cpu, Music, Camera, Bike, ShoppingBag, Star, BookOpen,
} from "lucide-react";

type Tab = "Overview"|"Markets"|"Day Trading"|"Property"|"Loans"|"Assets";
const TABS: Tab[] = ["Overview","Markets","Day Trading","Property","Loans","Assets"];

// ── Asset catalogue ──────────────────────────────────────────────────────
type AssetProduct = {
  name: string;
  category: string;
  price: number;
  dep: number;
  income?: number;
  xpReq?: number;
  allowMultiple?: boolean;
  description: string;
  icon: any;
  iconColor: string;
  iconBg: string;
  tip: string;
};


const ASSET_CATEGORIES = ["All", "Vehicle", "Technology", "Recreation", "Business", "Creative", "Collectible"];

const ASSET_PRODUCTS: AssetProduct[] = [
  // Vehicles
  {
    name: "Toyota Corolla 2022",
    category: "Vehicle", price: 22000, dep: 15,
    description: "Reliable hatchback. Great for getting to work.",
    icon: Car, iconColor: "#3B82F6", iconBg: "#eff6ff",
    tip: "Cars depreciate fast — 15% per year means it loses $3,300 in value annually.",
  },
  {
    name: "Honda Civic 2019",
    category: "Vehicle", price: 16500, dep: 12,
    description: "Popular used car, good fuel economy.",
    icon: Car, iconColor: "#6b7280", iconBg: "#f1f5f9",
    tip: "Older cars depreciate more slowly but may need more maintenance.",
  },
  {
    name: "Delivery Scooter",
    category: "Vehicle", price: 3200, dep: 18, income: 85,
    allowMultiple: true,
    description: "Use for Uber Eats or Delivereasy deliveries.",
    icon: Bike, iconColor: "#76AD25", iconBg: "#e8f5d0",
    tip: "Income-generating asset. The $85/week delivery income offsets the depreciation.",
  },
  {
    name: "Road Bike",
    category: "Vehicle", price: 1800, dep: 8,
    description: "Commute for free. Save on petrol.",
    icon: Bike, iconColor: "#f59e0b", iconBg: "#fffbeb",
    tip: "Low depreciation and no running costs. Smart choice if you live close to work or school.",
  },
  {
    name: "Ford Mustang GT 2021",
    category: "Vehicle", price: 68000, dep: 14,
    description: "5.0L V8. Pure performance, high depreciation.",
    icon: Car, iconColor: "#EF4444", iconBg: "#fef2f2",
    tip: "High-end cars lose more in absolute dollars even at similar depreciation rates. $68k at 14% = $9,520/year lost.",
  },
  {
    name: "Classic Mini Cooper 1975",
    category: "Vehicle", price: 28000, dep: -3,
    description: "Restored classic. Appreciates over time if maintained.",
    icon: Car, iconColor: "#a78bfa", iconBg: "#faf5ff",
    tip: "Classic cars in good condition can appreciate — rare exception to the depreciation rule. Condition and provenance are everything.",
  },

  // Technology
  {
    name: "MacBook Pro M3",
    category: "Technology", price: 3800, dep: 22, income: 40,
    description: "Freelance from anywhere. Rent it out for $40/week.",
    icon: Cpu, iconColor: "#6366f1", iconBg: "#eef2ff",
    tip: "Tech depreciates fast but can earn income. Use it for freelancing to offset the cost.",
  },
  {
    name: "Gaming PC Setup",
    category: "Technology", price: 2200, dep: 25,
    description: "High-end gaming rig. Fun but depreciates quickly.",
    icon: Cpu, iconColor: "#EF4444", iconBg: "#fef2f2",
    tip: "25% depreciation is high. This is a want, not an investment. Worth it for fun, not for returns.",
  },
  {
    name: "Smartphone (Latest)",
    category: "Technology", price: 1400, dep: 30,
    description: "Top of the range — but it loses value fast.",
    icon: Cpu, iconColor: "#94a3b8", iconBg: "#f8fafc",
    tip: "Phones depreciate 30% per year. The moment you unbox it, it's worth less.",
  },
  {
    name: "3D Printer",
    category: "Technology", price: 1100, dep: 15, income: 60,
    description: "Print and sell custom products from home.",
    icon: Package, iconColor: "#0891b2", iconBg: "#ecfeff",
    tip: "Income-generating asset. The $60/week income comes from selling prints on Etsy or locally.",
  },
  {
    name: "Professional Drone",
    category: "Technology", price: 4200, dep: 18, income: 110,
    description: "Real estate and event aerial photography.",
    icon: Cpu, iconColor: "#06b6d4", iconBg: "#ecfeff",
    tip: "Licensed drone pilots earn $80-200 per booking. With 1-2 jobs per week this easily covers depreciation.",
  },

  // Creative
  {
    name: "Photography Kit",
    category: "Creative", price: 2800, dep: 12, income: 75,
    description: "DSLR + lenses. Shoot events and portraits.",
    icon: Camera, iconColor: "#a78bfa", iconBg: "#faf5ff",
    tip: "Good income potential. Event photographers in NZ earn $75-200/hour.",
  },
  {
    name: "Music Production Setup",
    category: "Creative", price: 1600, dep: 10, income: 30,
    description: "DAW + interface + monitors. Produce tracks.",
    icon: Music, iconColor: "#ec4899", iconBg: "#fdf2f8",
    tip: "Slow depreciation and passive income potential from licensing tracks.",
  },
  {
    name: "DJing Equipment",
    category: "Creative", price: 2400, dep: 14, income: 120,
    description: "DJ Controller + speakers. Play gigs.",
    icon: Music, iconColor: "#f59e0b", iconBg: "#fffbeb",
    tip: "High income potential — $120/week assumes 1 gig per week at an average NZ rate.",
  },

  // Business
  {
    name: "Lawnmower + Trailer",
    category: "Business", price: 1800, dep: 10, income: 180,
    description: "Start a lawn mowing round in your neighbourhood.",
    icon: Wrench, iconColor: "#76AD25", iconBg: "#e8f5d0",
    tip: "Best ROI on this list. $180/week income on a $1,800 investment = 10-week payback period.",
  },
  {
    name: "Pressure Washer",
    category: "Business", price: 900, dep: 12, income: 95,
    allowMultiple: true,
    description: "Wash driveways and decks. Easy weekend income.",
    icon: Wrench, iconColor: "#3B82F6", iconBg: "#eff6ff",
    tip: "Low entry cost, decent income. Popular in NZ suburbs — most homeowners want this done.",
  },
  {
    name: "Vending Machine",
    category: "Business", price: 4500, dep: 8, income: 95,
    allowMultiple: true,
    description: "Place in an office or school. Passive income.",
    icon: ShoppingBag, iconColor: "#f59e0b", iconBg: "#fffbeb",
    tip: "Passive income asset. Find a good location and it earns while you sleep.",
  },
  {
    name: "Commercial Coffee Machine",
    category: "Business", price: 8500, dep: 10, income: 220,
    description: "Rent to a café or run a coffee cart.",
    icon: Wrench, iconColor: "#92400e", iconBg: "#fef3c7",
    tip: "Coffee machines rented to cafés earn $200-300/week. High upfront cost but strong passive returns.",
  },

  // Recreation
  {
    name: "Surfboard + Wetsuit",
    category: "Recreation", price: 800, dep: 6,
    description: "NZ surf culture. Low depreciation.",
    icon: Zap, iconColor: "#0891b2", iconBg: "#ecfeff",
    tip: "Very low depreciation. Well looked-after surfboards hold their value well in NZ.",
  },
  {
    name: "Kayak",
    category: "Recreation", price: 1200, dep: 5, income: 25,
    description: "Explore NZ waterways. Rent it out casually.",
    icon: Zap, iconColor: "#3B82F6", iconBg: "#eff6ff",
    tip: "Lowest depreciation on the list. Kayaks last decades if stored properly.",
  },

  // Collectibles — rare, high-value, appreciation potential
  {
    name: "Signed All Blacks Jersey (RWC 2023)",
    category: "Collectible", price: 4800, dep: -5,
    description: "Full team signatures. Certificate of authenticity.",
    icon: Star, iconColor: "#f59e0b", iconBg: "#fffbeb",
    tip: "Sports memorabilia from winning teams appreciates over time. Storage and authentication are critical to value.",
  },
  {
    name: "First Edition Pokémon Cards (Sealed)",
    category: "Collectible", price: 12000, dep: -8,
    description: "Base Set booster box. Never opened. Grading certified.",
    icon: Star, iconColor: "#EF4444", iconBg: "#fef2f2",
    tip: "Sealed first edition Pokémon cards have appreciated 300%+ over the past decade. Condition is everything.",
  },
  {
    name: "NZ Mint Gold Coin Collection",
    category: "Collectible", price: 6500, dep: -2,
    description: "Limited edition gold coins. Inflation hedge.",
    icon: DollarSign, iconColor: "#f59e0b", iconBg: "#fffbeb",
    tip: "Gold holds value against inflation. NZ Mint coins carry a premium over spot gold price due to collectibility.",
  },
  {
    name: "Vintage Rolex Submariner (1985)",
    category: "Collectible", price: 28000, dep: -10,
    description: "Serviced, original bracelet. Vintage luxury watch.",
    icon: Star, iconColor: "#6b7280", iconBg: "#f8fafc",
    tip: "Vintage Rolex watches have massively outperformed stocks over 20 years. But liquidity is low — hard to sell quickly.",
  },
  {
    name: "Original Colin McCahon Painting",
    category: "Collectible", price: 85000, dep: -6,
    description: "Authenticated NZ fine art. Museum-quality provenance.",
    icon: Star, iconColor: "#a78bfa", iconBg: "#faf5ff",
    tip: "NZ fine art by established artists like McCahon has appreciated significantly at auction. But the market is illiquid and requires expertise.",
  },
  {
    name: "Factory Sealed Nintendo 64 (PAL)",
    category: "Collectible", price: 3200, dep: -12,
    description: "New in box, never opened. 1996 PAL version.",
    icon: Cpu, iconColor: "#76AD25", iconBg: "#e8f5d0",
    tip: "Sealed retro gaming hardware appreciates because supply is fixed and nostalgia demand grows. Grading services like WATA verify authenticity.",
  },
  {
    name: "Rare NZ Postage Stamp Collection",
    category: "Collectible", price: 2200, dep: -3,
    description: "Pre-decimal NZ stamps, expertly catalogued.",
    icon: BookOpen, iconColor: "#0891b2", iconBg: "#ecfeff",
    tip: "Philately (stamp collecting) is a niche market but rare NZ stamps have consistent auction demand from specialist collectors.",
  },
  {
    name: "Limited Edition Air Jordan 1 Retro",
    category: "Collectible", price: 1800, dep: -15,
    description: "DS (deadstock). Original box. Grail colourway.",
    icon: ShoppingBag, iconColor: "#EF4444", iconBg: "#fef2f2",
    tip: "Sneaker resale is a real market. Limited releases can double in value within weeks — but trends shift fast and storage matters.",
  },
];


const PROPERTIES = [
  // Rentable residential
  { name:"Auckland City Apartment",   price:520000, deposit:104000, weeklyRent:560, mortgageWeekly:665, suburb:"CBD",          type:"Apartment",  bedrooms:1, cashflow:-105, info:"Studio apartment in Auckland CBD. High rent but mortgage is higher — negative cashflow. Capital gains potential is strong." },
  { name:"Ponsonby Apartment",        price:485000, deposit:97000,  weeklyRent:490, mortgageWeekly:620, suburb:"Ponsonby",     type:"Apartment",  bedrooms:2, cashflow:-130, info:"Character apartment in an inner-city suburb. Trendy location means low vacancy risk but tight cashflow." },
  { name:"Wellington Terrace House",  price:620000, deposit:124000, weeklyRent:540, mortgageWeekly:795, suburb:"Te Aro",       type:"Terrace",    bedrooms:3, cashflow:-255, info:"3-bedroom terrace in central Wellington. Strong rental demand from government workers. Negative cashflow but solid capital growth." },
  { name:"Hamilton Family Home",      price:580000, deposit:116000, weeklyRent:500, mortgageWeekly:745, suburb:"Flagstaff",    type:"House",      bedrooms:4, cashflow:-245, info:"4-bedroom family home in a fast-growing Hamilton suburb. Good for long-term tenants." },
  { name:"Christchurch Bungalow",     price:420000, deposit:84000,  weeklyRent:430, mortgageWeekly:540, suburb:"Riccarton",    type:"House",      bedrooms:3, cashflow:-110, info:"Solid 3-bed bungalow. Christchurch has had strong post-earthquake capital growth. Better cashflow than Auckland." },
  { name:"Dunedin Student Flat",      price:340000, deposit:68000,  weeklyRent:600, mortgageWeekly:435, suburb:"North Dunedin",type:"House",      bedrooms:5, cashflow:+165, info:"5-bedroom student flat near Otago University. High rent per room makes this positively geared — rare in NZ! High management effort." },
  { name:"Tauranga Beach House",      price:780000, deposit:156000, weeklyRent:680, mortgageWeekly:1000,suburb:"Mount Maunganui",type:"House",     bedrooms:4, cashflow:-320, info:"Holiday home near the beach. Can Airbnb short-term for much higher income but more volatile. Lifestyle investment." },
  { name:"Rotorua Rental",            price:390000, deposit:78000,  weeklyRent:430, mortgageWeekly:500, suburb:"Rotorua",      type:"House",      bedrooms:3, cashflow:-70,  info:"Affordable rental market. Close to geothermal tourism means good long-term demand. Near breakeven cashflow." },
  { name:"Palmerston North House",    price:360000, deposit:72000,  weeklyRent:410, mortgageWeekly:460, suburb:"Palmy North",  type:"House",      bedrooms:3, cashflow:-50,  info:"One of NZ's most affordable cities. Almost breakeven cashflow. Good for first investment property." },
  { name:"Nelson Bach",               price:290000, deposit:58000,  weeklyRent:350, mortgageWeekly:372, suburb:"Nelson",       type:"Bach",       bedrooms:2, cashflow:-22,  info:"Small holiday bach near the beach. Nearly cashflow neutral. Can holiday let in summer for extra income." },
  { name:"Queenstown Apartment",      price:920000, deposit:184000, weeklyRent:900, mortgageWeekly:1180,suburb:"Queenstown",   type:"Apartment",  bedrooms:2, cashflow:-280, info:"Premium ski/lake resort market. High rents but very expensive. Potential for strong short-term Airbnb income." },
  { name:"Commercial Retail Unit",    price:450000, deposit:135000, weeklyRent:820, mortgageWeekly:580, suburb:"Auckland",     type:"Commercial", bedrooms:0, cashflow:+240, info:"Small retail shop. Commercial leases are longer (3-5 years) and tenants pay rates/insurance. Better cashflow than residential." },
  { name:"Industrial Warehouse",      price:680000, deposit:204000, weeklyRent:1100,mortgageWeekly:875, suburb:"South Auckland",type:"Commercial",bedrooms:0, cashflow:+225, info:"Light industrial unit. Strong demand from logistics/storage businesses. Commercial property with good yields." },
];

const LOAN_PRODUCTS = [
  { name:"Student Loan",           principal:8000,  rate:0,    weekly:0,   note:"Interest-free while living in NZ. Repayments start at 12% of income over $22,828/yr.",       category:"Education" },
  { name:"Graduate Student Loan",  principal:25000, rate:0,    weekly:0,   note:"For full degree study. Same interest-free terms. Average NZ student debt is $21k.",           category:"Education" },
  { name:"Car Loan (Dealership)",  principal:15000, rate:12.5, weekly:85,  note:"Dealer finance is convenient but expensive. Always compare with your bank first.",             category:"Vehicle" },
  { name:"Car Loan (Bank)",        principal:15000, rate:8.9,  weekly:68,  note:"Bank rates beat dealer finance. Same car, $17/week cheaper — $884 saved per year.",           category:"Vehicle" },
  { name:"Personal Loan",         principal:5000,  rate:18.9, weekly:55,  note:"High interest unsecured lending. Only use for emergencies. Debt snowballs fast at this rate.", category:"Personal" },
  { name:"Credit Card",           principal:3000,  rate:22.9, weekly:35,  note:"Most expensive debt available. 22.9% means $3k grows to $3,687 if you only pay minimums.",    category:"Personal" },
  { name:"KiwiSaver HomeStart",   principal:10000, rate:0,    weekly:0,   note:"Government grant for first home buyers. Up to $10k for existing homes, $20k for new builds.", category:"Home" },
  { name:"Home Equity Loan",      principal:50000, rate:7.2,  weekly:280, note:"Borrow against your property equity. Lower rate because secured against your home.",           category:"Home" },
  { name:"Business Loan",         principal:20000, rate:9.5,  weekly:155, note:"For starting or expanding a business. Lender will want a business plan and financial projections.", category:"Business" },
  { name:"Buy Now Pay Later",     principal:1200,  rate:0,    weekly:50,  note:"0% if paid in full before period ends — then 25.9% kicks in. Designed to make you forget.",   category:"Personal" },
  { name:"Payday Loan",           principal:500,   rate:365,  weekly:120, note:"WARNING: 365% APR. Predatory lending. $500 borrowed = $690 owed in just 2 weeks. Avoid.",     category:"Personal" },
];


// ── Info tooltip dot ──────────────────────────────────────────────────────
function InfoDot({ text }: { text: string }) {
  return (
    <span className="pw-tooltip-wrap" style={{ marginLeft: 5, cursor: "help" }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ display:"block" }}>
        <circle cx="7" cy="7" r="6.5" stroke="rgba(255,255,255,.25)" strokeWidth="1"/>
        <text x="7" y="11" textAnchor="middle" fill="rgba(255,255,255,.5)" fontSize="9" fontWeight="700" fontFamily="Inter,sans-serif">i</text>
      </svg>
      <span className="pw-tooltip">{text}</span>
    </span>
  );
}

// Light variant for light backgrounds
function InfoDotDark({ text }: { text: string }) {
  return (
    <span className="pw-tooltip-wrap" style={{ marginLeft: 5, cursor: "help" }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ display:"block" }}>
        <circle cx="7" cy="7" r="6.5" stroke="rgba(0,0,0,.25)" strokeWidth="1"/>
        <text x="7" y="11" textAnchor="middle" fill="rgba(0,0,0,.4)" fontSize="9" fontWeight="700" fontFamily="Inter,sans-serif">i</text>
      </svg>
      <div className="pw-tooltip" style={{ background:"#0d1526" }}>{text}</div>
    </span>
  );
}

// ── Stock Chart ────────────────────────────────────────────────────────────
function StockChart({
  history, isUp, width = 200, height = 60, showLabels = false }: { history: number[]; isUp: boolean; width?: number; height?: number; showLabels?: boolean }) {
  const { isDark } = useTheme();
  const T = { bg: isDark?"#0d1526":"#f0f4f8", bg2: isDark?"#111c30":"#ffffff", bg3: isDark?"#1a2540":"#f8fafc", card: isDark?"#111c30":"#ffffff", text: isDark?"#ffffff":"#0d1526", text2: isDark?"#8b9dc3":"#475569", text3: isDark?"#4a6a8a":"#94a3b8", border: isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)", border2: isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.16)", input: isDark?"rgba(255,255,255,.06)":"#f8fafc", inputBorder: isDark?"rgba(255,255,255,.12)":"rgba(0,0,0,.14)", shadow: isDark?"rgba(0,0,0,.4)":"rgba(0,0,0,.08)", green: isDark?"#76AD25":"#5a9a1a", accent: isDark?"#f59e0b":"#d97706", strip: isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)" };
  if (history.length < 2) return <div style={{ width, height, background: T.bg3, borderRadius: 8 }} />;
  const min = Math.min(...history) * 0.998;
  const max = Math.max(...history) * 1.002;
  const range = max - min || 1;
  const padTop = showLabels ? 8 : 4;
  const padBottom = showLabels ? 20 : 4;
  const padLeft = showLabels ? 48 : 0;
  const chartW = width - padLeft;
  const chartH = height - padTop - padBottom;

  const pts = history.map((p, i) => {
    const x = padLeft + (i / (history.length - 1)) * chartW;
    const y = padTop + chartH - ((p - min) / range) * chartH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const linePath = `M ${pts.join(" L ")}`;
  const areaPath = `M ${padLeft},${padTop + chartH} L ${pts.join(" L ")} L ${padLeft + chartW},${padTop + chartH} Z`;
  const color = isUp ? "#76AD25" : "#EF4444";
  const lastPt = pts[pts.length - 1].split(",");

  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg-${isUp}-${width}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
        <clipPath id={`clip-${width}`}>
          <rect x={padLeft} y={padTop} width={chartW} height={chartH} />
        </clipPath>
      </defs>

      {/* Background */}
      <rect x={padLeft} y={padTop} width={chartW} height={chartH} fill={isDark ? (isUp ? "rgba(118,173,37,.08)" : "rgba(239,68,68,.08)") : (isUp ? "#f0fdf4" : "#fef2f2")} rx="6" />

      {/* Grid lines */}
      {showLabels && [0, 0.25, 0.5, 0.75, 1].map(t => {
        const y = padTop + chartH * t;
        const val = max - t * range;
        return (
          <g key={t}>
            <line x1={padLeft} y1={y} x2={padLeft + chartW} y2={y} stroke="rgba(0,0,0,.06)" strokeWidth="1" strokeDasharray="3,3" />
            <text x={padLeft - 4} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize="9" fontFamily="Inter,sans-serif">
              ${val < 10 ? val.toFixed(2) : val.toFixed(0)}
            </text>
          </g>
        );
      })}

      {/* Time labels */}
      {showLabels && (() => {
        const labels = ["80 ticks ago", "60", "40", "20", "Now"];
        return labels.map((l, i) => {
          const x = padLeft + (i / (labels.length - 1)) * chartW;
          return (
            <text key={l} x={x} y={height - 4} textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="Inter,sans-serif">{l}</text>
          );
        });
      })()}

      {/* Area fill */}
      <path d={areaPath} fill={`url(#sg-${isUp}-${width})`} clipPath={`url(#clip-${width})`} />

      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth={showLabels ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" clipPath={`url(#clip-${width})`} />

      {/* Current price dot */}
      <circle cx={parseFloat(lastPt[0])} cy={parseFloat(lastPt[1])} r={showLabels ? 4 : 3} fill={color} style={{ filter: `drop-shadow(0 0 4px ${color}88)` }} />
    </svg>
  );
}

// ── Stock Market Component ─────────────────────────────────────────────────
function StockMarket({ prices, stocks, buyQty, setBuyQty, balance, marketEvent, onBuy, onSell }: {
  prices: any; stocks: any[]; buyQty: Record<string,number>;
  setBuyQty: any; balance: number; marketEvent: string | null;
  onBuy: (sym:string, name:string, qty:number, price:number) => void;
  onSell: (id:string, price:number) => void;
}) {
  const { isDark } = useTheme();
  const T = { bg: isDark?"#0d1526":"#f0f4f8", bg2: isDark?"#111c30":"#ffffff", bg3: isDark?"#1a2540":"#f8fafc", card: isDark?"#111c30":"#ffffff", text: isDark?"#ffffff":"#0d1526", text2: isDark?"#8b9dc3":"#475569", text3: isDark?"#4a6a8a":"#94a3b8", border: isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)", border2: isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.16)", input: isDark?"rgba(255,255,255,.06)":"#f8fafc", inputBorder: isDark?"rgba(255,255,255,.12)":"rgba(0,0,0,.14)", shadow: isDark?"rgba(0,0,0,.4)":"rgba(0,0,0,.08)", green: isDark?"#76AD25":"#5a9a1a", accent: isDark?"#f59e0b":"#d97706", strip: isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)" };
  const [selected, setSelected] = useState(null as string|null);
  const [justBought, setJustBought] = useState(null as string|null);

  function handleBuy(sym: string, name: string) {
    const p = prices[sym]; if (!p) return;
    const qty = buyQty[sym] || 1;
    onBuy(sym, name, qty, p.price);
    setJustBought(sym);
    setTimeout(() => setJustBought(null), 1500);
    window.dispatchEvent(new CustomEvent("pw:xp", { detail: { amount: 10, reason: `Bought ${sym} shares` } }));
  }

  const selectedPrice = selected ? prices[selected] : null;
  const selectedMeta = NZX_STOCKS.find(s => s.symbol === selected);
  const selectedOwned = selected ? stocks.find(s => s.symbol === selected) : null;

  return (
    <div>
      {marketEvent && (
        <div style={{ background: "linear-gradient(135deg,#fffbeb,#fef9ec)", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: "0.82rem", color: "#92400e", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, animation: "pw-slide-up .3s ease" }}>
          <TrendingUp size={14} color="#f59e0b" /> Market Update: {marketEvent}
        </div>
      )}

      {/* Big chart for selected stock */}
      {selected && selectedPrice && selectedMeta && (
        <div style={{ background: T.bg, border: "1.5px solid #1e3a5f", borderRadius: 16, padding: "20px", marginBottom: 16, animation: "pw-pop .3s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ background: "#1e3a5f", borderRadius: 8, padding: "4px 10px", fontWeight: 900, fontSize: "0.85rem", color: "#60a5fa" }}>{selectedMeta.symbol}</div>
                <span style={{ color: T.text, fontWeight: 700, fontSize: "1rem" }}>{selectedMeta.name}</span>
              </div>
              <div style={{ fontSize: "0.72rem", color: T.text2, marginTop: 4 }}>{selectedMeta.sector} · NZX</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.75rem", fontWeight: 900, color: T.text, lineHeight: 1 }}>${selectedPrice.price.toFixed(2)}</div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: selectedPrice.changePct >= 0 ? "#76AD25" : "#EF4444", marginTop: 2 }}>
                {selectedPrice.changePct >= 0 ? "+" : ""}{selectedPrice.changePct.toFixed(2)}%
              </div>
            </div>
          </div>
          <StockChart history={selectedPrice.history} isUp={selectedPrice.changePct >= 0} width={540} height={120} showLabels />
          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            {selectedMeta.dividendYield > 0 && (
              <div style={{ background: "rgba(118,173,37,.12)", border: "1px solid rgba(118,173,37,.2)", borderRadius: 8, padding: "6px 12px", fontSize: "0.75rem" }}>
                <span style={{ color: T.text2 }}>Dividend yield: </span>
                <span style={{ color: "#76AD25", fontWeight: 700 }}>{(selectedMeta.dividendYield * 100).toFixed(1)}% p.a.</span>
              </div>
            )}
            <div style={{ background: T.input, borderRadius: 8, padding: "6px 12px", fontSize: "0.75rem" }}>
              <span style={{ color: T.text2 }}>52w range: </span>
              <span style={{ color: T.text, fontWeight: 700 }}>${(selectedPrice.price * 0.82).toFixed(2)} – ${(selectedPrice.price * 1.18).toFixed(2)}</span>
            </div>
            {selectedOwned && (
              <div style={{ background: "rgba(118,173,37,.12)", border: "1px solid rgba(118,173,37,.2)", borderRadius: 8, padding: "6px 12px", fontSize: "0.75rem" }}>
                <span style={{ color: T.text2 }}>You own: </span>
                <span style={{ color: "#76AD25", fontWeight: 700 }}>{selectedOwned.quantity} shares (${((selectedOwned.quantity ?? 0) * selectedPrice.price).toFixed(0)})</span>
              </div>
            )}
          </div>
          {/* Buy controls */}
          <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", background: T.input, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border2}` }}>
              <button onClick={() => setBuyQty((q: any) => ({ ...q, [selected]: Math.max(1, (q[selected]||1) - 1) }))} className="btn-3d-ghost" style={{ padding: "8px 14px", borderRadius: 0, boxShadow: "none", border: "none", borderRight: `1px solid ${T.border2}` }}><Minus size={13} /></button>
              <input type="number" value={buyQty[selected]||1} min={1} max={999}
                onChange={e => setBuyQty((q: any) => ({ ...q, [selected]: Math.max(1, parseInt(e.target.value)||1) }))}
                className="pw-input"
                style={{ width: 60, textAlign: "center", border: "none", borderRadius: 0, background: "transparent" }} />
              <button onClick={() => setBuyQty((q: any) => ({ ...q, [selected]: (q[selected]||1) + 1 }))} className="btn-3d-ghost" style={{ padding: "8px 14px", borderRadius: 0, boxShadow: "none", border: "none", borderLeft: `1px solid ${T.border2}` }}><Plus size={13} /></button>
            </div>
            <div style={{ flex: 1, minWidth: 100 }}>
              <div style={{ fontSize: "0.7rem", color: T.text2 }}>Total cost</div>
              <div style={{ fontWeight: 800, color: T.text, fontSize: "0.95rem" }}>${((buyQty[selected]||1) * selectedPrice.price).toFixed(2)}</div>
            </div>
            <button
              onClick={() => handleBuy(selected, selectedMeta.name)}
              disabled={balance < selectedPrice.price}
              className={balance >= selectedPrice.price ? "btn-3d-green" : ""}
              style={{ padding: "10px 24px", fontWeight: 700, borderRadius: 10, fontSize: "0.875rem", background: balance < selectedPrice.price ? "#374151" : undefined, color: balance < selectedPrice.price ? "#6b7280" : undefined, cursor: balance < selectedPrice.price ? "not-allowed" : "pointer", border: "none", fontFamily: "Inter,sans-serif", ...(justBought === selected ? { animation: "pw-pop .4s ease" } : {}) }}>
              {justBought === selected ? "Bought!" : `Buy ${buyQty[selected]||1} share${(buyQty[selected]||1)>1?"s":""}`}
            </button>
            {selectedOwned && (
              <button onClick={() => onSell(selectedOwned.id, selectedPrice.price)} className="btn-3d-red" style={{ padding: "10px 20px", fontWeight: 700, borderRadius: 10, fontSize: "0.875rem" }}>
                Sell All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stock list */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontWeight: 800, fontSize: "0.95rem", color: T.text }}>NZX Live Prices</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#76AD25", animation: "pw-pulse-glow 2s ease infinite", color: "#76AD25" }} />
            <span style={{ fontSize: "0.7rem", color: T.text3 }}>Updates every 30s</span>
          </div>
        </div>
        {NZX_STOCKS.map(meta => {
          const p = prices[meta.symbol]; if (!p) return null;
          const isUp = p.changePct >= 0;
          const owned = stocks.find(s => s.symbol === meta.symbol);
          const isSelected = selected === meta.symbol;
          return (
            <div key={meta.symbol}
              onClick={() => setSelected(isSelected ? null : meta.symbol)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 20px",
                borderBottom: "1px solid #f8fafc", cursor: "pointer",
                background: isSelected ? "#f0fdf4" : "white",
                transition: "background .15s, transform .15s",
                borderLeft: isSelected ? "3px solid #76AD25" : "3px solid transparent",
              }}
              onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
              onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "white"; }}
            >
              {/* Symbol badge */}
              <div style={{ width: 44, height: 44, background: isUp ? "#e8f5d0" : "#fef2f2", border: `1.5px solid ${isUp ? "#76AD25" : "#EF4444"}22`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "0.68rem", color: isUp ? "#5d8a1c" : "#b91c1c", flexShrink: 0 }}>
                {meta.symbol}
              </div>
              {/* Name */}
              <div style={{ flex: 1, minWidth: 100 }}>
                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: T.text }}>{meta.name}</div>
                <div style={{ fontSize: "0.7rem", color: T.text3, marginTop: 1 }}>{meta.sector}</div>
              </div>
              {/* Mini chart */}
              <StockChart history={p.history} isUp={isUp} width={120} height={36} />
              {/* Price + change */}
              <div style={{ textAlign: "right", minWidth: 80 }}>
                <div style={{ fontWeight: 800, fontSize: "0.9rem", color: T.text }}>${p.price.toFixed(2)}</div>
                <div style={{ fontSize: "0.72rem", color: isUp ? "#76AD25" : "#EF4444", fontWeight: 700 }}>
                  {isUp ? "▲" : "▼"} {Math.abs(p.changePct).toFixed(2)}%
                </div>
              </div>
              {/* Owned badge */}
              {owned && (
                <div style={{ background: "#e8f5d0", color: "#5d8a1c", padding: "3px 8px", borderRadius: 99, fontSize: "0.65rem", fontWeight: 700, flexShrink: 0 }}>
                  {owned.quantity} owned
                </div>
              )}
              <ChevronRight size={14} color={isSelected ? "#76AD25" : "#cbd5e1"} style={{ transition: "transform .2s", transform: isSelected ? "rotate(90deg)" : "none", flexShrink: 0 }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PortfolioPage(){
  const { isDark } = useTheme();
  const T = {
    bg:      isDark ? "#0d1526" : "#f0f4f8",
    bg2:     isDark ? "#111c30" : "#ffffff",
    bg3:     isDark ? "#1a2540" : "#f8fafc",
    text:    isDark ? "#ffffff" : "#0d1526",
    text2:   isDark ? "#8b9dc3" : "#475569",
    text3:   isDark ? "#4a6a8a" : "#94a3b8",
    border:  isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.08)",
    border2: isDark ? "rgba(255,255,255,.14)" : "rgba(0,0,0,.16)",
    card:    isDark ? "#111c30" : "#ffffff",
    input:   isDark ? "rgba(255,255,255,.06)" : "#f8fafc",
    inputBorder: isDark ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.14)",
    shadow:  isDark ? "rgba(0,0,0,.4)" : "rgba(0,0,0,.08)",
    green:   isDark ? "#76AD25" : "#5a9a1a",
    accent:  isDark ? "#f59e0b" : "#d97706",
    strip:   isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.02)",
  };

  const [tab, setTab]     = useState("Overview" as Tab);
  const [buyQty, setBuyQty] = useState({} as Record<string,number>);
  const [notif, setNotif]   = useState(null as string|null);
  const [assetCat, setAssetCat] = useState("All");
  const [assetSort, setAssetSort] = useState("price" as "price"|"income"|"dep");

  const { state, stocks, properties, loans, assets, buyStock, sellStock,
    buyProperty, takeLoan, buyAsset, canAccess, updateStockPrice } = useGame();

  const handlePriceUpdate = useCallback((symbol: string, newPrice: number) => {
    const owned = stocks.find(s => s.symbol === symbol);
    if (owned) updateStockPrice(owned.id, newPrice);
  }, [stocks, updateStockPrice]);

  const { prices, marketEvent } = useStockSimulator(5000, handlePriceUpdate);

  const [activeTutorial, setActiveTutorial] = useState(null as string | null);
  const [completedTutorials, setCompletedTutorials] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("pw_tutorials_done") ?? "[]"); } catch { return []; }
  });

  function completeTutorial(section: string) {
    const updated = [...completedTutorials, section];
    setCompletedTutorials(updated);
    localStorage.setItem("pw_tutorials_done", JSON.stringify(updated));
    setActiveTutorial(null);
  }

  function needsTutorial(section: string) {
    return !completedTutorials.includes(section);
  }

  function tryOpenTab(tab: Tab) {
    const tutorialSections: {[key: string]: string} = {
      Markets: "Markets", Property: "Property", Loans: "Loans", Assets: "Assets",
    };
    const ts = tutorialSections[tab];
    if (ts && needsTutorial(ts)) {
      setActiveTutorial(ts);
      setTab(tab);
    } else {
      setTab(tab);
    }
  }

  function notify(m: string) { setNotif(m); setTimeout(() => setNotif(null), 3500); }

  const balance       = state?.balance ?? 5000;
  const netWorth      = state?.netWorth ?? 5000;
  const totalInvested = state?.totalInvested ?? 0;
  const totalDebt     = state?.totalDebt ?? 0;

  // Asset calculations
  const ownedAssets = assets;
  const totalAssetValue = ownedAssets.reduce((s, a) => s + (a.currentValue ?? 0), 0);
  const weeklyAssetIncome = ASSET_PRODUCTS
    .filter(ap => ownedAssets.find(a => a.name === ap.name) && ap.income)
    .reduce((s, ap) => s + (ap.income ?? 0), 0);

  const filteredAssets = ASSET_PRODUCTS.filter(ap => assetCat === "All" || ap.category === assetCat).sort((a, b) => assetSort === "price" ? a.price - b.price : assetSort === "income" ? (b.income ?? 0) - (a.income ?? 0) : a.dep - b.dep);

  return (
    <AuthGuard>
      <div style={{ minHeight: "100vh", background: T.bg }}>
        <Nav />

        {notif && (
          <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 100, background: T.bg, color: T.text, padding: "12px 20px", borderRadius: 10, fontSize: "0.85rem", fontWeight: 600, border: "1px solid #76AD25", boxShadow: "0 4px 20px rgba(0,0,0,.3)", maxWidth: 320 }}>
            {notif}
          </div>
        )}

        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg,#0d1526,#111c30)", padding: "28px 2rem" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <BarChart2 size={22} color="#76AD25" />
                <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: T.text }}>PocketWise Portfolio</h1>
              </div>
              <p style={{ color: T.text2, fontSize: "0.85rem" }}>Simulate real investing with virtual NZD. Learn by doing.</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(128,128,128,.08)", borderRadius: 12, padding: "12px 20px", textAlign: "center" }}>
                <div style={{ fontSize: "0.68rem", color: T.text2, marginBottom: 2 }}>Cash Balance</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#76AD25" }}>${balance.toFixed(2)}</div>
                <div style={{ fontSize: "0.68rem", color: T.text2, marginTop: 2 }}>Virtual NZD</div>
              </div>
              <div style={{ background: "rgba(128,128,128,.08)", borderRadius: 12, padding: "12px 18px", textAlign: "center" }}>
                <div style={{ fontSize: "0.68rem", color: T.text2, marginBottom: 2 }}>Net Worth</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: netWorth >= 5000 ? "#76AD25" : "#EF4444" }}>${netWorth.toFixed(0)}</div>
              </div>
              <div style={{ background: "rgba(128,128,128,.08)", borderRadius: 12, padding: "12px 18px", textAlign: "center" }}>
                <div style={{ fontSize: "0.68rem", color: T.text2, marginBottom: 2 }}>Streak</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f59e0b" }}>{state?.streak ?? 0}</div>
                <div style={{ fontSize: "0.68rem", color: T.text2, marginTop: 2 }}>{Math.max(1, state?.streak ?? 1)}x XP</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 1.5rem" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
            {TABS.map(t => (
              <button key={t} onClick={() => tryOpenTab(t as Tab)} style={{
                padding: "7px 16px", borderRadius: 9999,
                background: tab === t ? T.bg : T.card,
                color: tab === t ? "#fff" : "#475569",
                border: `1px solid ${tab === t ? "#0d1526" : "#e2e8f0"}`,
                fontWeight: 600, fontSize: "0.8rem", cursor: "pointer",
                fontFamily: "Inter, sans-serif",
              }}>{t}</button>
            ))}
          </div>

          {/* OVERVIEW */}
          {tab === "Overview" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Cash Balance",    val: `$${balance.toFixed(2)}`,       color: "#76AD25", Icon: DollarSign,    bg: "#e8f5d0", ic: "#76AD25" },
                  { label: "Investments",     val: `$${totalInvested.toFixed(2)}`, color: "#3B82F6", Icon: TrendingUp,    bg: "#eff6ff", ic: "#3B82F6" },
                  { label: "Physical Assets", val: `$${totalAssetValue.toFixed(2)}`,color:"#6b7280", Icon: Car,           bg: "#f1f5f9", ic: "#6b7280" },
                  { label: "Total Debt",      val: `$${totalDebt.toFixed(2)}`,     color: "#EF4444", Icon: AlertTriangle, bg: "#fef2f2", ic: "#EF4444" },
                  { label: "Net Worth",       val: `$${netWorth.toFixed(2)}`,      color: netWorth >= 5000 ? "#76AD25" : "#EF4444", Icon: Wallet, bg: "#e8f5d0", ic: "#76AD25" },
                ].map(c => (
                  <div key={c.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                      <c.Icon size={17} color={c.ic} />
                    </div>
                    <div style={{ fontSize: "0.78rem", color: T.text3, marginBottom: 4 }}>{c.label}</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: c.color }}>{c.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px" }}>
                  <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: "0.9rem" }}>Active Holdings</h3>
                  {stocks.length === 0 ? <p style={{ color: T.text3, fontSize: "0.825rem" }}>No investments yet. Head to Markets.</p>
                  : stocks.map(s => {
                    const live = prices[s.symbol];
                    const gain = live ? (live.price - s.purchasePrice) * s.quantity : 0;
                    return <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f8fafc", fontSize: "0.82rem" }}>
                      <span style={{ fontWeight: 600 }}>{s.symbol} x{s.quantity}</span>
                      <span style={{ color: gain >= 0 ? "#76AD25" : "#EF4444", fontWeight: 600 }}>{gain >= 0 ? "+" : ""}${gain.toFixed(2)}</span>
                    </div>;
                  })}
                </div>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px" }}>
                  <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: "0.9rem" }}>Active Loans</h3>
                  {loans.length === 0 ? <p style={{ color: T.text3, fontSize: "0.825rem" }}>No loans. You are debt-free.</p>
                  : loans.map(l => <div key={l.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f8fafc", fontSize: "0.82rem" }}>
                    <span style={{ fontWeight: 600 }}>{l.name}</span>
                    <span style={{ color: "#EF4444", fontWeight: 600 }}>${l.balance.toFixed(0)}</span>
                  </div>)}
                </div>
              </div>
            </>
          )}

          {/* MARKETS */}
          {tab === "Markets" && (
            <MarketsTab
                stocks={stocks}
                balance={balance}
                marketEvent={marketEvent ?? null}
                onBuy={(symbol, name, qty, midPrice) => {
                  const ok = buyStock(symbol, name, qty, midPrice);
                  if (ok) notify(`Bought ${qty} ${symbol} @ ~$${midPrice.toFixed(2)}`);
                  else notify("Insufficient balance");
                }}
                onSell={(stockId, qty, midPrice) => sellStock(stockId, qty, midPrice)}
              />
          )}

          {tab === "Day Trading" && (
            <div style={{ position: "relative" }}>
              <DayTradingTerminal />
            </div>
          )}

          {/* PROPERTY */}
          {tab === "Property" && (
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:16 }}>
                <h3 style={{ fontWeight:700, color:T.text, fontSize:"0.9rem" }}>NZ Property Market</h3>
                <InfoDot text="Property investing means buying real estate to earn rental income and capital gains. You need a 20% deposit upfront." />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                {PROPERTIES.map(prop => {
                  const owned = properties.find(p => p.name === prop.name);
                  const canAfford = balance >= prop.deposit;
                  const net = prop.weeklyRent - prop.mortgageWeekly;
                  return (
                    <div key={prop.name} className="pw-dark-card" style={{
                      background: owned ? "linear-gradient(135deg,#0a2010,#0f2818)" : "#111c30",
                      border: `1.5px solid ${owned ? "rgba(118,173,37,.3)" : "rgba(255,255,255,.07)"}`,
                      borderRadius: 16, padding: "18px", position: "relative", overflow: "hidden",
                    }}>
                      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background: net>=0 ? "linear-gradient(90deg,#76AD25,#22c55e)" : "linear-gradient(90deg,#EF4444,#f97316)", borderRadius:"16px 16px 0 0" }}/>
                      <div style={{ position:"absolute", top:10, right:12, background:"rgba(255,255,255,.06)", color: T.text2, padding:"2px 8px", borderRadius:99, fontSize:"0.6rem", fontWeight:700 }}>{prop.type}</div>
                      <div style={{ marginTop:4, marginBottom:10 }}>
                        <div style={{ fontWeight:800, fontSize:"0.875rem", color: T.text, display:"flex", alignItems:"center", paddingRight:60 }}>
                          {prop.name}<InfoDot text={prop.info} />
                        </div>
                        <div style={{ fontSize:"0.7rem", color: T.text3, marginTop:2 }}>{prop.suburb} {prop.bedrooms > 0 ? `· ${prop.bedrooms} bed` : "· Commercial"}</div>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:14 }}>
                        {[
                          { l:"Purchase Price", v:`$${prop.price.toLocaleString()}`, tip:"The full market value you pay." },
                          { l:"Deposit (20%)", v:`$${prop.deposit.toLocaleString()}`, c:canAfford?"#76AD25":"#EF4444", tip:"Upfront cash needed. Bank lends the remaining 80%." },
                          { l:"Weekly Rent", v:prop.weeklyRent>0?`$${prop.weeklyRent}/wk`:"N/A", c:"#76AD25", tip:"Income from tenants each week. Your main revenue stream." },
                          { l:"Mortgage", v:`-$${prop.mortgageWeekly}/wk`, c:"#EF4444", tip:"Weekly loan repayment to the bank covering interest and principal." },
                          { l:"Net Cashflow", v:`${net>=0?"+":""}$${net}/wk`, c:net>=0?"#76AD25":"#EF4444", tip:net>=0?"Positive — rent exceeds mortgage. Rare in NZ!":"Negative — you top up the difference. Common in NZ cities." },
                        ].map(row => (
                          <div key={row.l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 0", borderBottom:"1px solid rgba(255,255,255,.04)" }}>
                            <span style={{ fontSize:"0.73rem", color: T.text3, display:"flex", alignItems:"center" }}>{row.l}<InfoDot text={row.tip}/></span>
                            <span style={{ fontWeight:700, fontSize:"0.8rem", color:row.c||"#fff" }}>{row.v}</span>
                          </div>
                        ))}
                      </div>
                      <button disabled={!!owned||!canAfford} onClick={() => { const ok=buyProperty(prop.name,prop.price,prop.weeklyRent,prop.mortgageWeekly); if(ok)notify(`Purchased ${prop.name}`); else notify("Insufficient balance for deposit"); }}
                        className={!owned&&canAfford?"btn-3d-green":""}
                        style={{ width:"100%", padding:"10px", borderRadius:10, fontWeight:700, fontSize:"0.78rem",
                          background:owned?"rgba(118,173,37,.12)":!canAfford?"rgba(239,68,68,.08)":undefined,
                          color:owned?"#76AD25":!canAfford?"#EF4444":undefined,
                          border:owned?"1px solid rgba(118,173,37,.2)":!canAfford?"1px solid rgba(239,68,68,.15)":"none",
                          cursor:owned||!canAfford?"not-allowed":"pointer", fontFamily:"Inter,sans-serif" }}>
                        {owned?"Owned":!canAfford?`Need $${(prop.deposit-balance).toLocaleString()} more`:"Purchase Property"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "Loans" && (
            <div>
                {loans.length > 0 && (
                  <div style={{ background:"#111c30", border:`1px solid ${T.border}`, borderRadius:14, padding:"16px 20px", marginBottom:20 }}>
                    <h3 style={{ fontWeight:700, fontSize:"0.875rem", color: T.text, marginBottom:12, display:"flex", alignItems:"center", gap:4 }}>Active Loans<InfoDot text="Your current debt. Loans reduce your net worth and require weekly repayments from your balance." /></h3>
                    {loans.map(l => (
                      <div key={l.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,.04)", fontSize:"0.82rem" }}>
                        <div><div style={{ fontWeight:700, color: T.text }}>{l.name}</div><div style={{ color: T.text3, marginTop:2, fontSize:"0.7rem" }}>{l.interestRate}% p.a. · ${l.weeklyRepayment}/wk</div></div>
                        <div style={{ textAlign:"right" }}><div style={{ color:"#EF4444", fontWeight:800 }}>${(l.balance??0).toFixed(0)}</div><div style={{ fontSize:"0.62rem", color: T.text3 }}>owing</div></div>
                      </div>
                    ))}
                  </div>
                )}
                {["Education","Vehicle","Home","Business","Personal"].map(cat => {
                  const catLoans = LOAN_PRODUCTS.filter(lp => lp.category === cat);
                  const colors: Record<string,string> = { Education:"#3B82F6", Vehicle:"#f59e0b", Home:"#76AD25", Business:"#a78bfa", Personal:"#EF4444" };
                  const color = colors[cat];
                  return (
                    <div key={cat} style={{ marginBottom:20 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                        <div style={{ height:3, width:20, background:color, borderRadius:99 }}/>
                        <h3 style={{ fontWeight:700, color: T.text, fontSize:"0.85rem" }}>{cat} Loans</h3>
                        {cat==="Personal" && <span style={{ background:"rgba(239,68,68,.15)", color:"#EF4444", padding:"2px 8px", borderRadius:99, fontSize:"0.62rem", fontWeight:800 }}>HIGH RISK</span>}
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:10 }}>
                        {catLoans.map(lp => {
                          const have = loans.find(l => l.name === lp.name);
                          const isDangerous = lp.rate > 50;
                          return (
                            <div key={lp.name} className="pw-dark-card" style={{ padding:"16px", borderColor:isDangerous?"rgba(239,68,68,.25)":"rgba(255,255,255,.07)" }}>
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                                <div style={{ fontWeight:800, fontSize:"0.875rem", color: T.text, display:"flex", alignItems:"center", gap:4, flex:1 }}>{lp.name}<InfoDot text={lp.note}/></div>
                                {have && <span style={{ background:"rgba(239,68,68,.15)", color:"#EF4444", padding:"2px 7px", borderRadius:99, fontSize:"0.6rem", fontWeight:800 }}>Active</span>}
                              </div>
                              <div style={{ display:"flex", gap:14, marginBottom:12 }}>
                                <div><div style={{ fontSize:"0.6rem", color: T.text3, textTransform:"uppercase" }}>Amount</div><div style={{ fontWeight:800, color: T.text }}>${lp.principal.toLocaleString()}</div></div>
                                <div><div style={{ fontSize:"0.6rem", color: T.text3, textTransform:"uppercase", display:"flex", alignItems:"center" }}>Rate<InfoDot text="Annual interest rate. Higher = more expensive debt." /></div><div style={{ fontWeight:800, color:lp.rate===0?"#76AD25":lp.rate>20?"#EF4444":"#f59e0b" }}>{lp.rate===0?"0%":lp.rate>100?`${lp.rate}% ⚠`:`${lp.rate}%`}</div></div>
                                {lp.weekly>0&&<div><div style={{ fontSize:"0.6rem", color: T.text3, textTransform:"uppercase" }}>Weekly</div><div style={{ fontWeight:800, color:"#EF4444" }}>-${lp.weekly}</div></div>}
                              </div>
                              <button disabled={!!have} onClick={() => { const ok=takeLoan(lp.name,lp.principal,lp.rate,lp.weekly); if(ok)notify(`${lp.name} approved`); }}
                                className={!have?(isDangerous?"btn-3d-red":"btn-3d-navy"):""}
                                style={{ width:"100%", padding:"9px", borderRadius:9, fontWeight:700, fontSize:"0.78rem", background:have?"rgba(255,255,255,.05)":undefined, color:have?"#4a6a8a":undefined, border:"none", cursor:have?"not-allowed":"pointer", fontFamily:"Inter,sans-serif" }}>
                                {have?"Active":"Apply Now"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
          )}

          {tab === "Assets" && (
            <div>
                {/* Owned assets summary */}
                {ownedAssets.length > 0 && (
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px", marginBottom: 20 }}>
                    <h3 style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 14 }}>Your Assets</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 14 }}>
                      {ownedAssets.map(a => {
                        const meta = ASSET_PRODUCTS.find(ap => ap.name === a.name);
                        const Icon = meta?.icon ?? Package;
                        const annualLoss = (a.currentValue ?? 0) * ((meta?.dep ?? 10) / 100);
                        return (
                          <div key={a.id} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                              <div style={{ width: 30, height: 30, borderRadius: 7, background: meta?.iconBg ?? "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <Icon size={14} color={meta?.iconColor ?? "#64748b"} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: "0.78rem", color: T.text }}>{a.name}</div>
                                <div style={{ fontSize: "0.68rem", color: T.text3 }}>{a.category}</div>
                              </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: 2 }}>
                              <span style={{ color: T.text2 }}>Current value</span>
                              <span style={{ fontWeight: 700, color: T.text }}>${(a.currentValue ?? 0).toFixed(0)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: 2 }}>
                              <span style={{ color: T.text2 }}>Annual loss</span>
                              <span style={{ fontWeight: 700, color: "#EF4444" }}>-${annualLoss.toFixed(0)}</span>
                            </div>
                            {meta?.income && (
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                                <span style={{ color: T.text2 }}>Weekly income</span>
                                <span style={{ fontWeight: 700, color: "#76AD25" }}>+${meta.income}/wk</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", gap: 12, padding: "12px", background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0" }}>
                      <div style={{ textAlign: "center", flex: 1 }}>
                        <div style={{ fontSize: "0.68rem", color: T.text2, marginBottom: 2 }}>Total Value</div>
                        <div style={{ fontWeight: 800, color: T.text, fontSize: "0.9rem" }}>${totalAssetValue.toFixed(0)}</div>
                      </div>
                      <div style={{ textAlign: "center", flex: 1 }}>
                        <div style={{ fontSize: "0.68rem", color: T.text2, marginBottom: 2 }}>Weekly Income</div>
                        <div style={{ fontWeight: 800, color: "#76AD25", fontSize: "0.9rem" }}>${weeklyAssetIncome}/wk</div>
                      </div>
                      <div style={{ textAlign: "center", flex: 1 }}>
                        <div style={{ fontSize: "0.68rem", color: T.text2, marginBottom: 2 }}>Assets Owned</div>
                        <div style={{ fontWeight: 800, color: T.text, fontSize: "0.9rem" }}>{ownedAssets.length}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Filters */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {ASSET_CATEGORIES.map(cat => (
                      <button key={cat} onClick={() => setAssetCat(cat)} style={{
                        padding: "5px 12px", borderRadius: 9999,
                        background: assetCat === cat ? "#0d1526" : "#fff",
                        color: assetCat === cat ? "#fff" : "#475569",
                        border: `1px solid ${assetCat === cat ? "#0d1526" : "#e2e8f0"}`,
                        fontWeight: 600, fontSize: "0.75rem", cursor: "pointer",
                        fontFamily: "Inter, sans-serif",
                      }}>{cat}</button>
                    ))}
                  </div>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 4, alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", color: T.text2 }}>Sort by:</span>
                    {[["price", "Price"], ["income", "Income"], ["dep", "Depreciation"]].map(([val, label]) => (
                      <button key={val} onClick={() => setAssetSort(val as any)} style={{
                        padding: "4px 10px", borderRadius: 6,
                        background: assetSort === val ? "#76AD25" : "#f1f5f9",
                        color: assetSort === val ? "#fff" : "#475569",
                        border: "none", fontWeight: 600, fontSize: "0.72rem",
                        cursor: "pointer", fontFamily: "Inter, sans-serif",
                      }}>{label}</button>
                    ))}
                  </div>
                </div>

                {/* Asset grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                  {filteredAssets.map(ap => {
                    const owned = ownedAssets.find(a => a.name === ap.name);
                    const ownedBlocked = owned && !ap.allowMultiple;
                    const canAfford = balance >= ap.price;
                    const Icon = ap.icon;
                    const locked = ap.xpReq && (state?.xp ?? 0) < ap.xpReq;
                    const annualDepLoss = ap.price * (ap.dep / 100);
                    const weeklyNet = (ap.income ?? 0) - (annualDepLoss / 52);
                    return (
                      <div key={ap.name}
                        className={!locked && !owned ? "pw-lift" : ""}
                        style={{
                          background: T.card,
                          border: `2px solid ${owned ? "#76AD25" : locked ? "#f1f5f9" : "#e2e8f0"}`,
                          borderRadius: 14, padding: "18px",
                          opacity: locked ? 0.6 : 1,
                          position: "relative",
                          transition: "all .2s cubic-bezier(.34,1.56,.64,1)",
                          boxShadow: owned ? "0 4px 16px rgba(118,173,37,.2)" : "0 2px 8px rgba(0,0,0,.04)",
                        }}>
                        {owned && (
                          <div style={{ position: "absolute", top: 12, right: 12, background: "#76AD25", color: T.text, padding: "2px 8px", borderRadius: 99, fontSize: "0.65rem", fontWeight: 700 }}>
                            Owned
                          </div>
                        )}
                        {ap.income && !owned && (
                          <div style={{ position: "absolute", top: 12, right: 12, background: "#e8f5d0", color: "#5d8a1c", padding: "2px 8px", borderRadius: 99, fontSize: "0.65rem", fontWeight: 700 }}>
                            Income
                          </div>
                        )}

                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 10, background: ap.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Icon size={20} color={ap.iconColor} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "0.875rem", color: T.text }}>{ap.name}</div>
                            <div style={{ fontSize: "0.72rem", color: T.text3 }}>{ap.category}</div>
                          </div>
                        </div>

                        <p style={{ fontSize: "0.78rem", color: T.text2, lineHeight: 1.5, marginBottom: 12 }}>{ap.description}</p>

                        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                            <span style={{ color: T.text2 }}>Purchase price</span>
                            <span style={{ fontWeight: 700 }}>${ap.price.toLocaleString()}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                            <span style={{ color: T.text2, display: "flex", alignItems: "center", gap: 3 }}>
                              <TrendingDown size={11} /> Depreciation
                            </span>
                            <span style={{ fontWeight: 700, color: "#EF4444" }}>-{ap.dep}%/yr (${annualDepLoss.toFixed(0)}/yr)</span>
                          </div>
                          {ap.income && (
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                              <span style={{ color: T.text2, display: "flex", alignItems: "center", gap: 3 }}>
                                <DollarSign size={11} /> Weekly income
                              </span>
                              <span style={{ fontWeight: 700, color: "#76AD25" }}>+${ap.income}/wk</span>
                            </div>
                          )}
                          {ap.income && (
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", paddingTop: 4, borderTop: `1px solid ${T.border}` }}>
                              <span style={{ color: T.text2 }}>Net weekly</span>
                              <span style={{ fontWeight: 700, color: weeklyNet >= 0 ? "#76AD25" : "#EF4444" }}>
                                {weeklyNet >= 0 ? "+" : ""}${weeklyNet.toFixed(0)}/wk
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Educational tip */}
                        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 10px", marginBottom: 12 }}>
                          <p style={{ fontSize: "0.7rem", color: "#92400e", lineHeight: 1.5 }}>{ap.tip}</p>
                        </div>

                        {locked ? (
                          <div style={{ background: T.bg3, borderRadius: 8, padding: "8px", textAlign: "center", fontSize: "0.75rem", color: T.text3 }}>
                            <Zap size={12} style={{ display: "inline", marginRight: 4 }} />
                            Requires {ap.xpReq} XP
                          </div>
                        ) : (
                          <button
                            disabled={!!ownedBlocked || !canAfford}
                            onClick={() => {
                              const ok = buyAsset(ap.name, ap.category, ap.price, ap.dep);
                              if (ok) { notify(`Purchased ${ap.name}`); window.dispatchEvent(new CustomEvent("pw:xp", { detail: { amount: 5, reason: `Bought ${ap.name}` } })); }
                              else notify("Insufficient balance");
                            }}
                            className={!ownedBlocked && canAfford ? "btn-3d-navy" : ""}
                            style={{
                              width: "100%", padding: "9px",
                              background: ownedBlocked ? "#e2e8f0" : !canAfford ? "#fef2f2" : undefined,
                              color: ownedBlocked ? "#94a3b8" : !canAfford ? "#EF4444" : undefined,
                              border: "none", borderRadius: 8,
                              fontWeight: 600, fontSize: "0.8rem",
                              cursor: ownedBlocked || !canAfford ? "not-allowed" : "pointer",
                              fontFamily: "Inter, sans-serif",
                            }}>
                            {ownedBlocked ? "Owned" : !canAfford ? `Need $${(ap.price - balance).toFixed(0)} more` : owned && ap.allowMultiple ? `Buy Another — $${ap.price.toLocaleString()}` : `Buy — $${ap.price.toLocaleString()}`}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
          )}
        </div>
      </div>
      {activeTutorial && (
        <PortfolioTutorial
          section={activeTutorial}
          onComplete={() => completeTutorial(activeTutorial)}
        />
      )}
    </AuthGuard>
  );
}
