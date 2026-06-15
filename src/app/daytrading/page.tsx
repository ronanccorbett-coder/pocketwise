"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/lib/theme";
import { useGame } from "@/lib/gameContext";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import {
  TrendingUp, TrendingDown, AlertTriangle, ChevronUp, ChevronDown,
  Zap, DollarSign, BarChart2, Activity, Clock, Target,
  Plus, Minus, X, Check, RefreshCw, BookOpen,
} from "lucide-react";

const FONT = "Inter, system-ui, sans-serif";

// ── Instruments ─────────────────────────────────────────────────────────────
const INSTRUMENTS = [
  { symbol: "NZX50",  name: "NZX 50 Index",     basePrice: 11800, volatility: 0.008, type: "index"  },
  { symbol: "AIR",    name: "Air New Zealand",   basePrice: 0.62,  volatility: 0.018, type: "stock"  },
  { symbol: "ATM",    name: "A2 Milk",           basePrice: 6.40,  volatility: 0.022, type: "stock"  },
  { symbol: "FPH",    name: "Fisher & Paykel",   basePrice: 28.50, volatility: 0.012, type: "stock"  },
  { symbol: "XAUUSD", name: "Gold (USD/oz)",     basePrice: 2340,  volatility: 0.006, type: "commodity" },
  { symbol: "NZDUSD", name: "NZD/USD",           basePrice: 0.608, volatility: 0.005, type: "forex"  },
  { symbol: "BTC",    name: "Bitcoin (USD)",     basePrice: 67000, volatility: 0.035, type: "crypto" },
];

type Candle = { t: number; o: number; h: number; l: number; c: number; v: number };
type Order  = { id: string; symbol: string; side: "buy"|"sell"; type: "market"|"limit"|"stop"; qty: number; price: number; sl?: number; tp?: number; status: "open"|"filled"|"cancelled"; openTime: number; pnl?: number };

function useSimulator(symbol: string) {
  const inst = INSTRUMENTS.find(i => i.symbol === symbol) ?? INSTRUMENTS[0];
  const [candles, setCandles] = useState([] as Candle[]);
  const [tick, setTick]       = useState(0);
  const priceRef = useRef(inst.basePrice);

  useEffect(() => {
    priceRef.current = inst.basePrice;
    // Generate initial 80 candles
    const initial: Candle[] = [];
    let p = inst.basePrice * (0.92 + Math.random() * 0.08);
    const now = Date.now();
    for (let i = 79; i >= 0; i--) {
      const o = p;
      const move = (Math.random() - 0.49) * inst.volatility;
      const c = Math.max(0.001, p * (1 + move));
      const h = Math.max(o, c) * (1 + Math.random() * inst.volatility * 0.5);
      const l = Math.min(o, c) * (1 - Math.random() * inst.volatility * 0.5);
      initial.push({ t: now - i * 60000, o, h, l, c, v: Math.floor(Math.random() * 100000 + 10000) });
      p = c;
    }
    priceRef.current = initial[initial.length - 1].c;
    setCandles(initial);
  }, [symbol]);

  useEffect(() => {
    const interval = setInterval(() => {
      const move = (Math.random() - 0.49) * inst.volatility;
      const newPrice = Math.max(0.001, priceRef.current * (1 + move));
      priceRef.current = newPrice;
      setTick(t => t + 1);
      setCandles(prev => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        const now = Date.now();
        // New candle every 60 seconds
        if (now - last.t > 60000) {
          const c = { t: now, o: last.c, h: newPrice, l: newPrice, c: newPrice, v: Math.floor(Math.random() * 50000) };
          return [...prev.slice(-99), c];
        }
        const updated = { ...last, c: newPrice, h: Math.max(last.h, newPrice), l: Math.min(last.l, newPrice), v: last.v + Math.floor(Math.random() * 1000) };
        return [...prev.slice(0, -1), updated];
      });
    }, 800);
    return () => clearInterval(interval);
  }, [symbol, inst.volatility]);

  const price = candles.length > 0 ? candles[candles.length - 1].c : inst.basePrice;
  const prev  = candles.length > 1 ? candles[candles.length - 2].c : price;
  const change = price - prev;
  const changePct = prev > 0 ? (change / prev) * 100 : 0;
  const spread = price * 0.0002;

  return { candles, price, change, changePct, spread, bid: price - spread, ask: price + spread };
}

// ── Candlestick chart ────────────────────────────────────────────────────────
function CandleChart({ candles, width = 600, height = 280 }: { candles: Candle[]; width?: number; height?: number }) {
  const { isDark } = useTheme();
  if (candles.length < 2) return <div style={{ width, height, background: isDark ? "#0a1528" : "#f8fafc", borderRadius: 8 }} />;

  const view = candles.slice(-60);
  const prices = view.flatMap(c => [c.h, c.l]);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const range = maxP - minP || 1;
  const pad = { top: 10, bottom: 28, left: 8, right: 60 };
  const cw = (width - pad.left - pad.right) / view.length;
  const candleW = Math.max(2, cw * 0.6);

  function y(p: number) { return pad.top + ((maxP - p) / range) * (height - pad.top - pad.bottom); }

  // Price grid lines
  const gridPrices: number[] = [];
  const step = range / 5;
  for (let i = 0; i <= 5; i++) gridPrices.push(minP + step * i);

  const decimals = minP > 100 ? 2 : minP > 1 ? 3 : 4;

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <rect width={width} height={height} fill={isDark ? "#080e1e" : "#f8fafc"} rx="6" />

      {/* Grid */}
      {gridPrices.map((p, i) => (
        <g key={i}>
          <line x1={pad.left} y1={y(p)} x2={width - pad.right} y2={y(p)} stroke={isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.06)"} strokeDasharray="3,3" />
          <text x={width - pad.right + 4} y={y(p) + 4} fill={isDark ? "#4a6a8a" : "#94a3b8"} fontSize="9" fontFamily="monospace">{p.toFixed(decimals)}</text>
        </g>
      ))}

      {/* Candles */}
      {view.map((c, i) => {
        const x = pad.left + i * cw + cw / 2;
        const isUp = c.c >= c.o;
        const color = isUp ? "#26a69a" : "#ef5350";
        const bodyTop = y(Math.max(c.o, c.c));
        const bodyH = Math.max(1, Math.abs(y(c.o) - y(c.c)));
        return (
          <g key={i}>
            <line x1={x} y1={y(c.h)} x2={x} y2={y(c.l)} stroke={color} strokeWidth="1" />
            <rect x={x - candleW / 2} y={bodyTop} width={candleW} height={bodyH} fill={color} />
          </g>
        );
      })}

      {/* Time labels */}
      {view.filter((_, i) => i % 10 === 0).map((c, i, arr) => {
        const origI = view.indexOf(c);
        const x = pad.left + origI * cw + cw / 2;
        const label = new Date(c.t).toLocaleTimeString("en-NZ", { hour: "2-digit", minute: "2-digit" });
        return <text key={i} x={x} y={height - 8} fill={isDark ? "#4a6a8a" : "#94a3b8"} fontSize="9" textAnchor="middle" fontFamily="monospace">{label}</text>;
      })}

      {/* Current price line */}
      {candles.length > 0 && (
        <>
          <line x1={pad.left} y1={y(candles[candles.length-1].c)} x2={width-pad.right} y2={y(candles[candles.length-1].c)} stroke="#f59e0b" strokeWidth="1" strokeDasharray="4,2" opacity="0.7" />
          <rect x={width-pad.right+1} y={y(candles[candles.length-1].c)-8} width={58} height={16} fill="#f59e0b" rx="3" />
          <text x={width-pad.right+30} y={y(candles[candles.length-1].c)+4} fill="#000" fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{candles[candles.length-1].c.toFixed(decimals)}</text>
        </>
      )}
    </svg>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function DayTradingPage() {
  const { isDark } = useTheme();
  const { state, addBalance } = useGame();
  const balance = state?.balance ?? 0;

  const T = {
    bg:     isDark ? "#080e1e" : "#f0f4f8",
    bg2:    isDark ? "#0d1526" : "#ffffff",
    bg3:    isDark ? "#111c30" : "#f8fafc",
    card:   isDark ? "#111c30" : "#ffffff",
    panel:  isDark ? "#0d1a30" : "#ffffff",
    text:   isDark ? "#ffffff" : "#0d1526",
    text2:  isDark ? "#8b9dc3" : "#475569",
    text3:  isDark ? "#4a6a8a" : "#94a3b8",
    border: isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.08)",
    green:  "#26a69a", red: "#ef5350",
    gold:   "#f59e0b",
  };

  const [selectedSymbol, setSelectedSymbol] = useState("NZX50");
  const { candles, price, change, changePct, spread, bid, ask } = useSimulator(selectedSymbol);
  const inst = INSTRUMENTS.find(i => i.symbol === selectedSymbol)!;

  // Order form
  const [side,      setSide]      = useState<"buy"|"sell">("buy");
  const [orderType, setOrderType] = useState<"market"|"limit"|"stop">("market");
  const [qty,       setQty]       = useState(1);
  const [limitPx,   setLimitPx]   = useState(0);
  const [slPx,      setSlPx]      = useState(0);
  const [tpPx,      setTpPx]      = useState(0);
  const [leverage,  setLeverage]  = useState(1);
  const [orders,    setOrders]    = useState([] as Order[]);
  const [activeTab, setActiveTab] = useState<"chart"|"orders"|"positions">("chart");
  const [notification, setNotif]  = useState<string|null>(null);
  const [chartWidth, setChartWidth] = useState(600);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (limitPx === 0) setLimitPx(parseFloat(price.toFixed(4)));
    if (slPx === 0) setSlPx(parseFloat((price * (side === "buy" ? 0.985 : 1.015)).toFixed(4)));
    if (tpPx === 0) setTpPx(parseFloat((price * (side === "buy" ? 1.03 : 0.97)).toFixed(4)));
  }, [price, side]);

  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setChartWidth(e.contentRect.width);
    });
    if (chartRef.current) ro.observe(chartRef.current);
    return () => ro.disconnect();
  }, []);

  // Tick open positions
  useEffect(() => {
    setOrders(prev => prev.map(o => {
      if (o.status !== "open") return o;
      const pnl = o.side === "buy"
        ? (bid - o.price) * o.qty * leverage
        : (o.price - ask) * o.qty * leverage;
      // Check SL/TP
      if (o.sl && o.side === "buy" && bid <= o.sl) {
        notify(`Stop loss hit on ${o.symbol} — closed at $${bid.toFixed(4)}`);
        addBalance(pnl);
        return { ...o, status: "filled", pnl };
      }
      if (o.tp && o.side === "buy" && bid >= o.tp) {
        notify(`Take profit hit on ${o.symbol} — +$${pnl.toFixed(2)}`);
        addBalance(pnl);
        return { ...o, status: "filled", pnl };
      }
      if (o.sl && o.side === "sell" && ask >= o.sl) {
        notify(`Stop loss hit on ${o.symbol}`);
        addBalance(pnl);
        return { ...o, status: "filled", pnl };
      }
      if (o.tp && o.side === "sell" && ask <= o.tp) {
        notify(`Take profit hit on ${o.symbol} — +$${pnl.toFixed(2)}`);
        addBalance(pnl);
        return { ...o, status: "filled", pnl };
      }
      return { ...o, pnl };
    }));
  }, [bid, ask]);

  function notify(msg: string) { setNotif(msg); setTimeout(() => setNotif(null), 4000); }

  function placeOrder() {
    const execPrice = orderType === "market" ? (side === "buy" ? ask : bid) : limitPx;
    const cost = execPrice * qty;
    if (orderType === "market" && cost > balance) { notify("Insufficient balance"); return; }

    const o: Order = {
      id: Math.random().toString(36).slice(2, 8),
      symbol: selectedSymbol, side, type: orderType, qty,
      price: execPrice,
      sl: slPx || undefined, tp: tpPx || undefined,
      status: orderType === "market" ? "open" : "open",
      openTime: Date.now(),
    };

    if (orderType === "market") addBalance(-cost);
    setOrders(prev => [o, ...prev]);
    notify(`${orderType === "market" ? "Market" : "Limit"} order placed — ${side.toUpperCase()} ${qty} ${selectedSymbol} @ ${execPrice.toFixed(4)}`);
  }

  function closePosition(o: Order) {
    const closePx = o.side === "buy" ? bid : ask;
    const pnl = o.side === "buy"
      ? (closePx - o.price) * o.qty * leverage
      : (o.price - closePx) * o.qty * leverage;
    const returned = o.price * o.qty + pnl;
    addBalance(returned);
    setOrders(prev => prev.map(x => x.id === o.id ? { ...x, status: "filled", pnl } : x));
    notify(`Position closed — ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`);
  }

  const openPositions = orders.filter(o => o.status === "open");
  const totalPnL = openPositions.reduce((s, o) => s + (o.pnl ?? 0), 0);
  const decimals = price > 100 ? 2 : price > 1 ? 3 : 4;

  return (
    <AuthGuard>
      <div style={{ minHeight: "100vh", background: T.bg, fontFamily: FONT, display: "flex", flexDirection: "column" }}>
        <Nav />

        {/* Notification */}
        {notification && (
          <div style={{ position: "fixed", top: 68, right: 16, zIndex: 600, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 16px", fontSize: "0.82rem", color: T.text, boxShadow: "0 8px 24px rgba(0,0,0,.3)", animation: "pw-slide-up .3s ease", maxWidth: 320 }}>
            {notification}
          </div>
        )}

        {/* Top bar */}
        <div style={{ background: T.panel, borderBottom: `1px solid ${T.border}`, padding: "0 1rem", display: "flex", alignItems: "center", gap: 0, overflowX: "auto" as const }}>
          {INSTRUMENTS.map(inst => (
            <button key={inst.symbol} onClick={() => setSelectedSymbol(inst.symbol)} style={{
              padding: "10px 16px", background: "none", border: "none", cursor: "pointer",
              borderBottom: selectedSymbol === inst.symbol ? `2px solid ${T.gold}` : "2px solid transparent",
              color: selectedSymbol === inst.symbol ? T.text : T.text3,
              fontWeight: selectedSymbol === inst.symbol ? 700 : 500,
              fontSize: "0.78rem", fontFamily: FONT, whiteSpace: "nowrap" as const,
              transition: "all .15s",
            }}>
              <span style={{ color: selectedSymbol === inst.symbol ? T.gold : T.text2, fontWeight: 800 }}>{inst.symbol}</span>
              <span style={{ marginLeft: 6, fontSize: "0.68rem", color: T.text3 }}>{inst.type}</span>
            </button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16, padding: "0 8px", flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: "0.62rem", color: T.text3 }}>Balance</div>
              <div style={{ fontWeight: 800, color: T.text, fontSize: "0.875rem" }}>${balance.toFixed(2)}</div>
            </div>
            {openPositions.length > 0 && (
              <div>
                <div style={{ fontSize: "0.62rem", color: T.text3 }}>Unrealised P&L</div>
                <div style={{ fontWeight: 800, color: totalPnL >= 0 ? T.green : T.red, fontSize: "0.875rem" }}>
                  {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main layout */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 300px", overflow: "hidden" }}>

          {/* Left: chart + bottom panel */}
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Price header */}
            <div style={{ background: T.panel, borderBottom: `1px solid ${T.border}`, padding: "10px 16px", display: "flex", alignItems: "center", gap: 16 }}>
              <div>
                <div style={{ fontWeight: 800, color: T.text, fontSize: "1.4rem", lineHeight: 1 }}>{price.toFixed(decimals)}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                  <span style={{ color: changePct >= 0 ? T.green : T.red, fontWeight: 700, fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 3 }}>
                    {changePct >= 0 ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {changePct >= 0 ? "+" : ""}{changePct.toFixed(3)}%
                  </span>
                  <span style={{ color: T.text3, fontSize: "0.72rem" }}>{change >= 0 ? "+" : ""}{change.toFixed(decimals)}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 14 }}>
                {[
                  { l: "BID", v: bid.toFixed(decimals), c: T.red },
                  { l: "ASK", v: ask.toFixed(decimals), c: T.green },
                  { l: "SPREAD", v: (ask - bid).toFixed(decimals), c: T.text2 },
                  { l: "HIGH", v: candles.length > 0 ? Math.max(...candles.slice(-60).map(c => c.h)).toFixed(decimals) : "-", c: T.green },
                  { l: "LOW",  v: candles.length > 0 ? Math.min(...candles.slice(-60).map(c => c.l)).toFixed(decimals) : "-", c: T.red },
                ].map(s => (
                  <div key={s.l}>
                    <div style={{ fontSize: "0.6rem", color: T.text3, textTransform: "uppercase" as const, letterSpacing: ".04em" }}>{s.l}</div>
                    <div style={{ fontWeight: 700, color: s.c, fontSize: "0.82rem", fontFamily: "monospace" }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart */}
            <div ref={chartRef} style={{ flex: 1, overflow: "hidden", minHeight: 260 }}>
              <CandleChart candles={candles} width={chartWidth || 600} height={280} />
            </div>

            {/* Bottom tabs */}
            <div style={{ background: T.panel, borderTop: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", borderBottom: `1px solid ${T.border}` }}>
                {(["positions", "orders"] as const).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)} style={{ padding: "8px 16px", background: "none", border: "none", borderBottom: activeTab === t ? `2px solid ${T.gold}` : "2px solid transparent", color: activeTab === t ? T.text : T.text3, fontWeight: activeTab === t ? 700 : 500, fontSize: "0.78rem", cursor: "pointer", fontFamily: FONT, textTransform: "capitalize" as const }}>
                    {t} {t === "positions" && openPositions.length > 0 && `(${openPositions.length})`}
                  </button>
                ))}
              </div>
              <div style={{ maxHeight: 160, overflowY: "auto" as const, padding: "8px" }}>
                {activeTab === "positions" && (
                  openPositions.length === 0
                    ? <div style={{ textAlign: "center", color: T.text3, fontSize: "0.78rem", padding: "16px 0" }}>No open positions</div>
                    : openPositions.map(o => (
                      <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderRadius: 7, background: T.bg3, marginBottom: 4, fontSize: "0.75rem" }}>
                        <span style={{ background: o.side === "buy" ? "rgba(38,166,154,.15)" : "rgba(239,83,80,.12)", color: o.side === "buy" ? T.green : T.red, padding: "2px 7px", borderRadius: 4, fontWeight: 800, fontSize: "0.65rem" }}>{o.side.toUpperCase()}</span>
                        <span style={{ fontWeight: 700, color: T.text }}>{o.symbol}</span>
                        <span style={{ color: T.text2 }}>x{o.qty}</span>
                        <span style={{ color: T.text3 }}>@ {o.price.toFixed(decimals)}</span>
                        <span style={{ fontWeight: 700, color: (o.pnl ?? 0) >= 0 ? T.green : T.red, marginLeft: "auto" }}>
                          {(o.pnl ?? 0) >= 0 ? "+" : ""}${(o.pnl ?? 0).toFixed(2)}
                        </span>
                        {o.sl && <span style={{ color: T.red, fontSize: "0.65rem" }}>SL:{o.sl.toFixed(decimals)}</span>}
                        {o.tp && <span style={{ color: T.green, fontSize: "0.65rem" }}>TP:{o.tp.toFixed(decimals)}</span>}
                        <button onClick={() => closePosition(o)} style={{ background: "rgba(239,83,80,.12)", border: "1px solid rgba(239,83,80,.25)", borderRadius: 5, padding: "3px 8px", color: T.red, fontSize: "0.65rem", fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Close</button>
                      </div>
                    ))
                )}
                {activeTab === "orders" && (
                  orders.filter(o => o.status === "filled" || o.status === "cancelled").length === 0
                    ? <div style={{ textAlign: "center", color: T.text3, fontSize: "0.78rem", padding: "16px 0" }}>No closed orders</div>
                    : orders.filter(o => o.status !== "open").slice(0, 20).map(o => (
                      <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderRadius: 7, background: T.bg3, marginBottom: 4, fontSize: "0.75rem" }}>
                        <span style={{ background: o.side === "buy" ? "rgba(38,166,154,.1)" : "rgba(239,83,80,.1)", color: o.side === "buy" ? T.green : T.red, padding: "2px 7px", borderRadius: 4, fontWeight: 800, fontSize: "0.65rem" }}>{o.side.toUpperCase()}</span>
                        <span style={{ fontWeight: 700, color: T.text }}>{o.symbol}</span>
                        <span style={{ color: T.text2 }}>x{o.qty} @ {o.price.toFixed(decimals)}</span>
                        <span style={{ fontWeight: 700, color: (o.pnl ?? 0) >= 0 ? T.green : T.red, marginLeft: "auto" }}>
                          {(o.pnl ?? 0) >= 0 ? "+" : ""}${(o.pnl ?? 0).toFixed(2)}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

          {/* Right: order panel */}
          <div style={{ background: T.panel, borderLeft: `1px solid ${T.border}`, display: "flex", flexDirection: "column", overflow: "auto" as const }}>

            {/* Buy/Sell toggle */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <button onClick={() => setSide("buy")} style={{ padding: "14px", background: side === "buy" ? "rgba(38,166,154,.15)" : "transparent", color: side === "buy" ? T.green : T.text3, fontWeight: 800, fontSize: "0.9rem", border: "none", borderBottom: `2px solid ${side === "buy" ? T.green : "transparent"}`, cursor: "pointer", fontFamily: FONT, transition: "all .15s" }}>BUY</button>
              <button onClick={() => setSide("sell")} style={{ padding: "14px", background: side === "sell" ? "rgba(239,83,80,.12)" : "transparent", color: side === "sell" ? T.red : T.text3, fontWeight: 800, fontSize: "0.9rem", border: "none", borderBottom: `2px solid ${side === "sell" ? T.red : "transparent"}`, cursor: "pointer", fontFamily: FONT, transition: "all .15s" }}>SELL</button>
            </div>

            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>

              {/* Order type */}
              <div>
                <label style={{ display: "block", fontSize: "0.65rem", color: T.text3, fontWeight: 600, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".04em" }}>Order Type</label>
                <div style={{ display: "flex", background: T.bg3, borderRadius: 8, padding: 3, gap: 2 }}>
                  {(["market", "limit", "stop"] as const).map(t => (
                    <button key={t} onClick={() => setOrderType(t)} style={{ flex: 1, padding: "6px 4px", borderRadius: 6, background: orderType === t ? T.card : "transparent", color: orderType === t ? T.text : T.text3, fontWeight: orderType === t ? 700 : 500, fontSize: "0.72rem", border: "none", cursor: "pointer", fontFamily: FONT, transition: "all .15s", textTransform: "capitalize" as const }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label style={{ display: "block", fontSize: "0.65rem", color: T.text3, fontWeight: 600, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".04em" }}>Quantity</label>
                <div style={{ display: "flex", alignItems: "center", background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ padding: "8px 12px", background: "none", border: "none", color: T.text2, cursor: "pointer", display: "flex" }}><Minus size={14} /></button>
                  <input type="number" value={qty} min={1} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))} style={{ flex: 1, background: "none", border: "none", color: T.text, fontFamily: "monospace", fontSize: "0.9rem", fontWeight: 700, textAlign: "center" as const, outline: "none" }} />
                  <button onClick={() => setQty(q => q + 1)} style={{ padding: "8px 12px", background: "none", border: "none", color: T.text2, cursor: "pointer", display: "flex" }}><Plus size={14} /></button>
                </div>
              </div>

              {/* Limit/Stop price */}
              {orderType !== "market" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.65rem", color: T.text3, fontWeight: 600, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".04em" }}>{orderType === "limit" ? "Limit Price" : "Stop Price"}</label>
                  <input type="number" value={limitPx} step="0.0001" onChange={e => setLimitPx(parseFloat(e.target.value))} className="pw-input" style={{ width: "100%", fontSize: "0.875rem", fontFamily: "monospace" }} />
                </div>
              )}

              {/* Stop Loss */}
              <div>
                <label style={{ display: "block", fontSize: "0.65rem", color: T.red, fontWeight: 600, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".04em" }}>Stop Loss</label>
                <input type="number" value={slPx} step="0.0001" onChange={e => setSlPx(parseFloat(e.target.value))} style={{ width: "100%", padding: "8px 12px", background: "rgba(239,83,80,.06)", border: `1px solid rgba(239,83,80,.2)`, borderRadius: 8, color: T.red, fontFamily: "monospace", fontSize: "0.875rem", outline: "none" }} />
              </div>

              {/* Take Profit */}
              <div>
                <label style={{ display: "block", fontSize: "0.65rem", color: T.green, fontWeight: 600, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".04em" }}>Take Profit</label>
                <input type="number" value={tpPx} step="0.0001" onChange={e => setTpPx(parseFloat(e.target.value))} style={{ width: "100%", padding: "8px 12px", background: "rgba(38,166,154,.06)", border: `1px solid rgba(38,166,154,.2)`, borderRadius: 8, color: T.green, fontFamily: "monospace", fontSize: "0.875rem", outline: "none" }} />
              </div>

              {/* Leverage */}
              <div>
                <label style={{ display: "block", fontSize: "0.65rem", color: T.text3, fontWeight: 600, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".04em" }}>Leverage: {leverage}x</label>
                <input type="range" min={1} max={10} step={1} value={leverage} onChange={e => setLeverage(parseInt(e.target.value))} className="pw-range" style={{ width: "100%" }} />
                {leverage > 3 && (
                  <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 5, fontSize: "0.68rem", color: T.red }}>
                    <AlertTriangle size={11} /> High leverage — losses are also amplified
                  </div>
                )}
              </div>

              {/* Order summary */}
              <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: 4 }}>
                  <span style={{ color: T.text3 }}>Execution price</span>
                  <span style={{ fontWeight: 700, color: T.text, fontFamily: "monospace" }}>
                    {orderType === "market" ? (side === "buy" ? ask : bid).toFixed(decimals) : limitPx.toFixed(decimals)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: 4 }}>
                  <span style={{ color: T.text3 }}>Position size</span>
                  <span style={{ fontWeight: 700, color: T.text }}>{qty} units x {leverage}x</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem" }}>
                  <span style={{ color: T.text3 }}>Required margin</span>
                  <span style={{ fontWeight: 700, color: orderType === "market" && ((side === "buy" ? ask : bid) * qty) > balance ? T.red : T.text, fontFamily: "monospace" }}>
                    ${((orderType === "market" ? (side === "buy" ? ask : bid) : limitPx) * qty).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Place order button */}
              <button onClick={placeOrder} style={{
                width: "100%", padding: "14px",
                background: side === "buy" ? T.green : T.red,
                color: T.text, border: "none", borderRadius: 10,
                fontWeight: 900, fontSize: "0.95rem", cursor: "pointer",
                fontFamily: FONT, letterSpacing: ".02em",
                boxShadow: `0 4px 0 ${side === "buy" ? "#1a7a72" : "#b52d2a"}, 0 6px 16px ${side === "buy" ? "rgba(38,166,154,.3)" : "rgba(239,83,80,.3)"}`,
                transition: "transform .08s, box-shadow .08s",
              }}
                onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 0 ${side === "buy" ? "#1a7a72" : "#b52d2a"}`; }}>
                {side === "buy" ? "Buy" : "Sell"} {inst.symbol}
              </button>

              {/* Educational note */}
              <div style={{ background: "rgba(245,158,11,.06)", border: "1px solid rgba(245,158,11,.15)", borderRadius: 8, padding: "10px 12px", fontSize: "0.72rem", color: T.text2, lineHeight: 1.5 }}>
                <strong style={{ color: T.gold }}>Learning note:</strong> This is a simulation. Real trading involves broker fees, slippage, and much more volatility. Never invest money you cannot afford to lose.
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
