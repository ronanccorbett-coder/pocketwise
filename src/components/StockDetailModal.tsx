"use client";

import { useState, useMemo, useEffect } from "react";
import { X, TrendingUp, TrendingDown, Plus, Minus } from "lucide-react";
import { useTheme } from "@/lib/theme";
import {
  useStockHistory, buyCost, sellProceeds,
  StockSnapshot, HistoryRange,
} from "@/lib/stockSimulator";
import InfoIcon, { INFO } from "./InfoIcon";

const RANGES: HistoryRange[] = ["1D", "1W", "1M", "3M", "ALL"];

type OwnedStock = { id: string; symbol: string; quantity?: number; purchasePrice?: number; dividendsEarned?: number };

export default function StockDetailModal({
  snapshot, owned, balance, onClose, onBuy, onSell, initialMode = "buy",
}: {
  snapshot: StockSnapshot;
  owned: OwnedStock | undefined;
  balance: number;
  onClose: () => void;
  onBuy: (sym: string, name: string, qty: number, midPrice: number) => void;
  onSell: (stockId: string, qty: number, midPrice: number) => void;
  initialMode?: "buy" | "sell";
}) {
  const { isDark } = useTheme();
  const T = {
    bg:      isDark ? "#0d1526" : "#f0f4f8",
    card:    isDark ? "#111c30" : "#ffffff",
    text:    isDark ? "#ffffff" : "#0d1526",
    text2:   isDark ? "#8b9dc3" : "#475569",
    text3:   isDark ? "#4a6a8a" : "#94a3b8",
    border:  isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.08)",
    border2: isDark ? "rgba(255,255,255,.14)" : "rgba(0,0,0,.16)",
    input:   isDark ? "rgba(255,255,255,.06)" : "#f8fafc",
    strip:   isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.02)",
  };

  const [range, setRange] = useState<HistoryRange>("1M");
  const ownedQtyInitial = owned?.quantity ?? 0;
  const [mode, setMode] = useState<"buy" | "sell">(initialMode === "sell" && ownedQtyInitial > 0 ? "sell" : "buy");
  const [qty, setQty] = useState<number>(initialMode === "sell" && ownedQtyInitial > 0 ? ownedQtyInitial : 1);
  const [justDid, setJustDid] = useState<string | null>(null);

  const history = useStockHistory(snapshot.symbol, range);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const isUp = snapshot.changePct >= 0;
  const ownedQty = owned?.quantity ?? 0;
  const avgCost = owned?.purchasePrice ?? 0;
  const unrealisedPL = ownedQty > 0 ? (snapshot.bid - avgCost) * ownedQty : 0;
  const unrealisedPct = ownedQty > 0 && avgCost > 0 ? (snapshot.bid - avgCost) / avgCost : 0;

  // Cost breakdown
  const buyBreakdown = useMemo(() => buyCost(snapshot.symbol, qty, snapshot.price), [snapshot.symbol, snapshot.price, qty]);
  const sellBreakdown = useMemo(() => sellProceeds(snapshot.symbol, qty, snapshot.price), [snapshot.symbol, snapshot.price, qty]);

  const sellMax = ownedQty;
  const effectiveQty = mode === "sell" ? Math.min(qty, Math.max(0, sellMax)) : qty;
  const canBuy = mode === "buy" && balance >= buyBreakdown.total && qty > 0;
  const canSell = mode === "sell" && ownedQty >= qty && qty > 0;

  function fmtMoney(n: number, decimals = 2): string {
    return n.toLocaleString("en-NZ", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  function fmtBig(n: number): string {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    return `$${fmtMoney(n)}`;
  }

  function doBuy() {
    if (!canBuy) return;
    onBuy(snapshot.symbol, snapshot.name, qty, snapshot.price);
    setJustDid(`Bought ${qty} ${snapshot.symbol}`);
    setTimeout(() => setJustDid(null), 1800);
  }
  function doSell() {
    if (!canSell || !owned) return;
    onSell(owned.id, qty, snapshot.price);
    setJustDid(`Sold ${qty} ${snapshot.symbol}`);
    setTimeout(() => setJustDid(null), 1800);
  }

  const liqLabel = snapshot.liquidityTier === "high" ? "High liquidity"
    : snapshot.liquidityTier === "mid" ? "Medium liquidity" : "Low liquidity";
  const liqInfo = snapshot.liquidityTier === "high" ? INFO.liquidityHigh
    : snapshot.liquidityTier === "mid" ? INFO.liquidityMid : INFO.liquidityLow;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(0,0,0,.55)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "0",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.card, color: T.text,
          width: "100%", maxWidth: 720,
          maxHeight: "92vh", overflowY: "auto",
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          border: `1px solid ${T.border}`,
          fontFamily: "Inter, sans-serif",
          animation: "pw-slide-up .25s ease",
          boxShadow: "0 -10px 40px rgba(0,0,0,.4)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          padding: "18px 20px", borderBottom: `1px solid ${T.border}`,
          position: "sticky", top: 0, background: T.card, zIndex: 10,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <div style={{ background: "#1e3a5f", borderRadius: 8, padding: "4px 10px", fontWeight: 900, fontSize: "0.85rem", color: "#60a5fa" }}>
                {snapshot.symbol}
              </div>
              {snapshot.type === "etf" && (
                <span style={{ background: "rgba(168,85,247,.18)", color: "#c084fc", padding: "3px 8px", borderRadius: 6, fontWeight: 800, fontSize: "0.65rem", letterSpacing: "0.05em" }}>
                  ETF
                </span>
              )}
              <span style={{ fontWeight: 700, fontSize: "1rem" }}>{snapshot.name}</span>
            </div>
            <div style={{ fontSize: "0.72rem", color: T.text2, display: "flex", alignItems: "center", gap: 4 }}>
              {snapshot.sector} · NZX
              <InfoIcon text={INFO.sector} />
            </div>
          </div>
          <button onClick={onClose} aria-label="Close"
            style={{ background: T.input, border: "none", borderRadius: 8, padding: 8, cursor: "pointer", color: T.text }}>
            <X size={18} />
          </button>
        </div>

        {/* Price block */}
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "2rem", fontWeight: 900, lineHeight: 1 }}>
                ${fmtMoney(snapshot.price)}
              </div>
              <div style={{
                fontSize: "0.82rem", fontWeight: 700, marginTop: 4,
                color: isUp ? "#76AD25" : "#EF4444",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {isUp ? "+" : ""}${fmtMoney(snapshot.change)} ({isUp ? "+" : ""}{(snapshot.changePct * 100).toFixed(2)}%)
                <InfoIcon text={INFO.changePct} />
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.7rem", color: T.text2, marginBottom: 2, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                Bid / Ask
                <InfoIcon text={INFO.bidAsk} />
              </div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                <span style={{ color: "#EF4444" }}>${fmtMoney(snapshot.bid, 3)}</span>
                <span style={{ color: T.text3, margin: "0 6px" }}>/</span>
                <span style={{ color: "#76AD25" }}>${fmtMoney(snapshot.ask, 3)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart with range buttons */}
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {RANGES.map(r => (
              <button key={r} onClick={() => setRange(r)}
                style={{
                  padding: "5px 12px", borderRadius: 6,
                  background: range === r ? "#1e3a5f" : T.input,
                  color: range === r ? "#60a5fa" : T.text2,
                  border: "none", fontWeight: 700, fontSize: "0.72rem",
                  cursor: "pointer", fontFamily: "Inter, sans-serif",
                }}>{r}</button>
            ))}
          </div>
          <Chart points={history.map(p => p.price)} isUp={isUp} />
        </div>

        {/* About */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, fontSize: "0.82rem", color: T.text2, lineHeight: 1.5 }}>
          {snapshot.about}
        </div>

        {/* Fundamentals */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontWeight: 800, fontSize: "0.8rem", marginBottom: 10, color: T.text }}>Fundamentals</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <Metric label="Market Cap" info={INFO.marketCap} value={fmtBig(snapshot.marketCap)} T={T} />
            <Metric label="P/E Ratio" info={INFO.peRatio} value={snapshot.peRatio === null ? "n/a" : snapshot.peRatio.toFixed(1)} T={T} />
            <Metric label="Dividend Yield" info={INFO.dividendYield} value={`${(snapshot.dividendYield * 100).toFixed(2)}%`} T={T} />
            <Metric label="Day Range" info={INFO.dayRange} value={`$${fmtMoney(snapshot.dayLow)} – $${fmtMoney(snapshot.dayHigh)}`} T={T} />
            <Metric label="Prev Close" info={INFO.prevClose} value={`$${fmtMoney(snapshot.prevClose)}`} T={T} />
            <Metric label={liqLabel} info={liqInfo} value={`${(({ high: 0.15, mid: 0.30, low: 0.50 } as any)[snapshot.liquidityTier]).toFixed(2)}% spread`} T={T} />
          </div>
        </div>

        {/* Headlines */}
        {snapshot.headlines.length > 0 && (
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontWeight: 800, fontSize: "0.8rem", marginBottom: 10, color: T.text }}>Recent Headlines</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {snapshot.headlines.map((h, i) => {
                const positive = h.magnitude >= 0;
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 10px", borderRadius: 8,
                    background: positive ? "rgba(118,173,37,.10)" : "rgba(239,68,68,.10)",
                    border: `1px solid ${positive ? "rgba(118,173,37,.2)" : "rgba(239,68,68,.2)"}`,
                  }}>
                    <span style={{ color: positive ? "#76AD25" : "#EF4444", fontWeight: 800 }}>
                      {positive ? "▲" : "▼"}
                    </span>
                    <span style={{ fontSize: "0.78rem", color: T.text, flex: 1 }}>{h.headline}</span>
                    <span style={{ fontSize: "0.7rem", color: T.text3, fontWeight: 700 }}>
                      {positive ? "+" : ""}{(h.magnitude * 100).toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Holdings summary */}
        {ownedQty > 0 && (
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, background: T.strip }}>
            <div style={{ fontWeight: 800, fontSize: "0.8rem", marginBottom: 10, color: T.text }}>Your Holding</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
              <Metric label="Shares owned" value={ownedQty.toString()} T={T} />
              <Metric label="Avg cost" info={INFO.costBasis} value={`$${fmtMoney(avgCost)}`} T={T} />
              <Metric label="Current value" value={`$${fmtMoney(snapshot.bid * ownedQty)}`} T={T} />
              <Metric
                label="Unrealised P/L"
                info={INFO.unrealisedPL}
                value={`${unrealisedPL >= 0 ? "+" : ""}$${fmtMoney(unrealisedPL)} (${unrealisedPct >= 0 ? "+" : ""}${(unrealisedPct * 100).toFixed(1)}%)`}
                valueColor={unrealisedPL >= 0 ? "#76AD25" : "#EF4444"}
                T={T}
              />
              {(owned?.dividendsEarned ?? 0) > 0 && (
                <Metric label="Dividends paid" value={`$${fmtMoney(owned?.dividendsEarned ?? 0)}`} valueColor="#76AD25" T={T} />
              )}
            </div>
          </div>
        )}

        {/* Trade panel */}
        <div style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            <button onClick={() => { setMode("buy"); setQty(1); }}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 10,
                background: mode === "buy" ? "#76AD25" : T.input,
                color: mode === "buy" ? "#fff" : T.text2,
                border: "none", fontWeight: 800, fontSize: "0.85rem",
                cursor: "pointer", fontFamily: "Inter, sans-serif",
              }}>Buy</button>
            <button onClick={() => { setMode("sell"); setQty(Math.min(1, ownedQty)); }}
              disabled={ownedQty === 0}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 10,
                background: mode === "sell" ? "#EF4444" : T.input,
                color: mode === "sell" ? "#fff" : T.text2,
                border: "none", fontWeight: 800, fontSize: "0.85rem",
                cursor: ownedQty === 0 ? "not-allowed" : "pointer",
                opacity: ownedQty === 0 ? 0.5 : 1,
                fontFamily: "Inter, sans-serif",
              }}>Sell</button>
          </div>

          {/* Qty stepper */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: "0.78rem", color: T.text2, fontWeight: 600 }}>Quantity</span>
            <div style={{ display: "flex", alignItems: "center", background: T.input, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border2}` }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))}
                style={{ padding: "8px 14px", border: "none", borderRight: `1px solid ${T.border2}`, background: "transparent", color: T.text, cursor: "pointer" }}>
                <Minus size={13} />
              </button>
              <input type="number" value={qty} min={1}
                onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ width: 70, textAlign: "center", border: "none", background: "transparent", color: T.text, fontSize: "0.9rem", fontWeight: 700, padding: "8px 0", fontFamily: "Inter, sans-serif" }} />
              <button onClick={() => setQty(q => mode === "sell" ? Math.min(q + 1, sellMax) : q + 1)}
                style={{ padding: "8px 14px", border: "none", borderLeft: `1px solid ${T.border2}`, background: "transparent", color: T.text, cursor: "pointer" }}>
                <Plus size={13} />
              </button>
            </div>
            {mode === "sell" && (
              <button onClick={() => setQty(sellMax)}
                style={{ background: T.input, border: `1px solid ${T.border2}`, borderRadius: 8, padding: "6px 10px", fontSize: "0.72rem", fontWeight: 700, color: T.text2, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                Max ({sellMax})
              </button>
            )}
          </div>

          {/* Cost breakdown */}
          {mode === "buy" ? (
            <CostBreakdown
              rows={[
                { label: "Ask price", info: INFO.bidAsk, value: `$${fmtMoney(buyBreakdown.ask, 3)} × ${qty}` },
                { label: "Gross", value: `$${fmtMoney(buyBreakdown.gross)}` },
                { label: "Brokerage (0.5%)", info: INFO.brokerage, value: `$${fmtMoney(buyBreakdown.brokerage)}` },
                { label: "Total cost", value: `$${fmtMoney(buyBreakdown.total)}`, bold: true },
              ]} T={T}
            />
          ) : (
            <CostBreakdown
              rows={[
                { label: "Bid price", info: INFO.bidAsk, value: `$${fmtMoney(sellBreakdown.bid, 3)} × ${effectiveQty}` },
                { label: "Gross", value: `$${fmtMoney(sellBreakdown.gross)}` },
                { label: "Brokerage (0.5%)", info: INFO.brokerage, value: `$${fmtMoney(sellBreakdown.brokerage)}` },
                { label: "Net proceeds", value: `$${fmtMoney(sellBreakdown.net)}`, bold: true },
              ]} T={T}
            />
          )}

          {/* Confirm button */}
          <button
            onClick={mode === "buy" ? doBuy : doSell}
            disabled={mode === "buy" ? !canBuy : !canSell}
            style={{
              marginTop: 14, width: "100%", padding: "13px 0",
              borderRadius: 12, border: "none",
              background: (mode === "buy" ? canBuy : canSell)
                ? (mode === "buy" ? "#76AD25" : "#EF4444")
                : "#374151",
              color: (mode === "buy" ? canBuy : canSell) ? "#fff" : "#6b7280",
              fontWeight: 800, fontSize: "0.95rem",
              cursor: (mode === "buy" ? canBuy : canSell) ? "pointer" : "not-allowed",
              fontFamily: "Inter, sans-serif",
            }}>
            {justDid ?? (mode === "buy"
              ? canBuy ? `Buy ${qty} share${qty > 1 ? "s" : ""}` : balance < buyBreakdown.total ? "Insufficient balance" : "Buy"
              : canSell ? `Sell ${qty} share${qty > 1 ? "s" : ""}` : ownedQty === 0 ? "You don't own this stock" : `Only ${ownedQty} available`)
            }
          </button>
          <div style={{ marginTop: 10, fontSize: "0.72rem", color: T.text3, textAlign: "center" }}>
            Available balance: ${fmtMoney(balance)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Subcomponents ──────────────────────────────────────────────────────────

function Metric({ label, info, value, valueColor, T }: { label: string; info?: string; value: string; valueColor?: string; T: any }) {
  return (
    <div>
      <div style={{ fontSize: "0.7rem", color: T.text2, marginBottom: 3, display: "flex", alignItems: "center" }}>
        {label}
        {info && <InfoIcon text={info} />}
      </div>
      <div style={{ fontSize: "0.95rem", fontWeight: 800, color: valueColor ?? T.text }}>{value}</div>
    </div>
  );
}

function CostBreakdown({ rows, T }: { rows: { label: string; info?: string; value: string; bold?: boolean }[]; T: any }) {
  return (
    <div style={{ background: T.input, borderRadius: 10, padding: "12px 14px" }}>
      {rows.map((r, i) => (
        <div key={i} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontSize: r.bold ? "0.9rem" : "0.8rem",
          fontWeight: r.bold ? 800 : 500,
          padding: r.bold ? "8px 0 0" : "4px 0",
          borderTop: r.bold ? `1px solid ${T.border2}` : "none",
          marginTop: r.bold ? 6 : 0,
          color: r.bold ? T.text : T.text2,
        }}>
          <span style={{ display: "flex", alignItems: "center" }}>{r.label}{r.info && <InfoIcon text={r.info} />}</span>
          <span>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

function Chart({ points, isUp }: { points: number[]; isUp: boolean }) {
  const { isDark } = useTheme();
  const stroke = isUp ? "#76AD25" : "#EF4444";
  const grid = isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.06)";
  const text = isDark ? "#4a6a8a" : "#94a3b8";

  if (points.length < 2) {
    return <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: text, fontSize: "0.8rem" }}>Not enough data</div>;
  }

  const W = 640, H = 180;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = W / (points.length - 1);
  const path = points.map((p, i) => {
    const x = i * stepX;
    const y = H - ((p - min) / range) * (H - 20) - 10;
    return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
  const area = `${path} L${W},${H} L0,${H} Z`;

  // Y-axis labels
  const yLabels = [max, (max + min) / 2, min];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 180 }} preserveAspectRatio="none">
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(p => (
        <line key={p} x1="0" x2={W} y1={H * p} y2={H * p} stroke={grid} strokeDasharray="2 4" />
      ))}
      <defs>
        <linearGradient id="chartfill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#chartfill)" />
      <path d={path} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {/* Y-axis price labels */}
      {yLabels.map((y, i) => (
        <text key={i} x={W - 4} y={H * (i * 0.45) + 12} fill={text} fontSize="10" textAnchor="end" fontFamily="Inter">
          ${y.toFixed(2)}
        </text>
      ))}
    </svg>
  );
}
