"use client";

import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Search } from "lucide-react";
import { useTheme } from "@/lib/theme";
import {
  useStockSnapshots, sparklinePath,
  StockSnapshot,
} from "@/lib/stockSimulator";
import StockDetailModal from "./StockDetailModal";
import InfoIcon, { INFO } from "./InfoIcon";

type OwnedStock = {
  id: string; symbol: string; name?: string;
  quantity?: number; purchasePrice?: number;
  dividendsEarned?: number; currentValue?: number;
};

export default function MarketsTab({
  stocks, balance, marketEvent, onBuy, onSell,
}: {
  stocks: OwnedStock[];
  balance: number;
  marketEvent: string | null;
  onBuy: (sym: string, name: string, qty: number, midPrice: number) => void;
  onSell: (stockId: string, qty: number, midPrice: number) => void;
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
    chip:    isDark ? "rgba(96,165,250,.12)" : "rgba(59,130,246,.10)",
  };

  const { snapshots, isOpen } = useStockSnapshots();
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"alpha" | "gainers" | "losers" | "marketCap">("alpha");

  const ownedById = useMemo(() => {
    const m = new Map<string, OwnedStock>();
    for (const s of stocks) m.set(s.symbol, s);
    return m;
  }, [stocks]);

  const allSnaps = useMemo(() => Object.values(snapshots), [snapshots]);

  // Headlines across the market — most significant first, last 3 days
  const headlines = useMemo(() => {
    const all: { sym: string; name: string; headline: string; magnitude: number }[] = [];
    for (const s of allSnaps) {
      for (const h of s.headlines.slice(0, 1)) {
        all.push({ sym: s.symbol, name: s.name, headline: h.headline, magnitude: h.magnitude });
      }
    }
    return all.sort((a, b) => Math.abs(b.magnitude) - Math.abs(a.magnitude)).slice(0, 10);
  }, [allSnaps]);

  const filtered = useMemo(() => {
    let list = allSnaps;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(s =>
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    if (sortBy === "alpha") sorted.sort((a, b) => a.symbol.localeCompare(b.symbol));
    else if (sortBy === "gainers") sorted.sort((a, b) => b.changePct - a.changePct);
    else if (sortBy === "losers") sorted.sort((a, b) => a.changePct - b.changePct);
    else if (sortBy === "marketCap") sorted.sort((a, b) => b.marketCap - a.marketCap);
    return sorted;
  }, [allSnaps, query, sortBy]);

  const selectedSnap = selected ? snapshots[selected] : null;
  const selectedOwned = selected ? ownedById.get(selected) : undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Market status pill */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.72rem", color: T.text2 }}>
        <span style={{
          display: "inline-block", width: 8, height: 8, borderRadius: "50%",
          background: isOpen ? "#76AD25" : "#EF4444",
          boxShadow: isOpen ? "0 0 8px #76AD25" : "none",
        }} />
        <span style={{ fontWeight: 700, color: isOpen ? "#76AD25" : "#EF4444" }}>
          {isOpen ? "Market open" : "Market closed"}
        </span>
        <span style={{ color: T.text3 }}>· NZX · Prices update live</span>
      </div>

      {/* Market event banner */}
      {marketEvent && (
        <div style={{
          padding: "12px 14px", borderRadius: 12,
          background: isDark ? "rgba(96,165,250,.10)" : "rgba(59,130,246,.08)",
          border: `1px solid ${isDark ? "rgba(96,165,250,.25)" : "rgba(59,130,246,.25)"}`,
          fontSize: "0.85rem", fontWeight: 600, color: T.text,
        }}>
          <span style={{ color: "#60a5fa", fontWeight: 800, marginRight: 6 }}>Market Update:</span>
          {marketEvent}
        </div>
      )}

      {/* Headlines ticker */}
      {headlines.length > 0 && (
        <div style={{
          background: T.card, borderRadius: 12, padding: "10px 0",
          border: `1px solid ${T.border}`, overflow: "hidden",
        }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 800, color: T.text2, padding: "0 14px 6px", letterSpacing: "0.05em" }}>
            TODAY'S HEADLINES
          </div>
          <div style={{
            display: "flex", gap: 10, overflowX: "auto", padding: "0 14px",
            scrollbarWidth: "thin",
          }}>
            {headlines.map((h, i) => {
              const positive = h.magnitude >= 0;
              return (
                <button key={i} onClick={() => setSelected(h.sym)}
                  style={{
                    flexShrink: 0, padding: "8px 12px", borderRadius: 10,
                    background: positive ? "rgba(118,173,37,.10)" : "rgba(239,68,68,.10)",
                    border: `1px solid ${positive ? "rgba(118,173,37,.25)" : "rgba(239,68,68,.25)"}`,
                    color: T.text, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                    fontFamily: "Inter, sans-serif", textAlign: "left",
                    minWidth: 220,
                  }}>
                  <span style={{ fontWeight: 900, fontSize: "0.7rem", color: positive ? "#76AD25" : "#EF4444" }}>
                    {h.sym}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: T.text, flex: 1, lineHeight: 1.3 }}>
                    {h.headline}
                  </span>
                  <span style={{ fontSize: "0.65rem", fontWeight: 800, color: positive ? "#76AD25" : "#EF4444" }}>
                    {positive ? "+" : ""}{(h.magnitude * 100).toFixed(1)}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search + sort */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px", display: "flex", alignItems: "center", gap: 8, background: T.input, borderRadius: 10, padding: "8px 12px", border: `1px solid ${T.border2}` }}>
          <Search size={14} color={T.text3} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search symbol, name, or sector"
            style={{
              border: "none", outline: "none", background: "transparent",
              color: T.text, fontSize: "0.82rem", flex: 1,
              fontFamily: "Inter, sans-serif",
            }}
          />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
          style={{
            background: T.input, color: T.text, border: `1px solid ${T.border2}`,
            borderRadius: 10, padding: "8px 10px", fontSize: "0.78rem", fontWeight: 600,
            fontFamily: "Inter, sans-serif", cursor: "pointer",
          }}>
          <option value="alpha">A–Z</option>
          <option value="gainers">Top gainers</option>
          <option value="losers">Top losers</option>
          <option value="marketCap">Market cap</option>
        </select>
      </div>

      {/* Stock grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
        {filtered.map(s => (
          <StockCard key={s.symbol} snapshot={s} owned={ownedById.get(s.symbol)} onClick={() => setSelected(s.symbol)} T={T} />
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: "1 / -1", padding: 30, textAlign: "center", color: T.text3, fontSize: "0.85rem" }}>
            No stocks match your search
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedSnap && (
        <StockDetailModal
          snapshot={selectedSnap}
          owned={selectedOwned}
          balance={balance}
          onClose={() => setSelected(null)}
          onBuy={onBuy}
          onSell={onSell}
        />
      )}
    </div>
  );
}

// ── Stock card ──────────────────────────────────────────────────────────
function StockCard({ snapshot, owned, onClick, T }: { snapshot: StockSnapshot; owned?: OwnedStock; onClick: () => void; T: any }) {
  const isUp = snapshot.changePct >= 0;
  const ownedQty = owned?.quantity ?? 0;

  function fmtBig(n: number): string {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
    return `$${n.toLocaleString("en-NZ", { maximumFractionDigits: 0 })}`;
  }

  return (
    <button onClick={onClick}
      style={{
        textAlign: "left", padding: 14, borderRadius: 14,
        background: T.card, border: `1px solid ${T.border}`,
        cursor: "pointer", display: "flex", flexDirection: "column", gap: 10,
        fontFamily: "Inter, sans-serif", color: T.text,
        transition: "transform .12s ease, border-color .12s ease",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.borderColor = T.border2; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = T.border; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span style={{ background: "#1e3a5f", color: "#60a5fa", padding: "2px 8px", borderRadius: 6, fontWeight: 900, fontSize: "0.72rem" }}>
              {snapshot.symbol}
            </span>
            {ownedQty > 0 && (
              <span style={{ background: "rgba(118,173,37,.18)", color: "#76AD25", padding: "2px 8px", borderRadius: 6, fontWeight: 800, fontSize: "0.62rem" }}>
                OWN {ownedQty}
              </span>
            )}
          </div>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {snapshot.name}
          </div>
          <div style={{ fontSize: "0.66rem", color: T.text3, marginTop: 1 }}>{snapshot.sector}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 900, lineHeight: 1.1 }}>
            ${snapshot.price.toFixed(2)}
          </div>
          <div style={{
            fontSize: "0.72rem", fontWeight: 700, marginTop: 2,
            color: isUp ? "#76AD25" : "#EF4444",
            display: "inline-flex", alignItems: "center", gap: 2,
          }}>
            {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {isUp ? "+" : ""}{(snapshot.changePct * 100).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Sparkline */}
      <div style={{ background: T.input, borderRadius: 8, padding: "6px 8px" }}>
        <svg viewBox="0 0 100 24" style={{ width: "100%", height: 24, display: "block" }}>
          <path d={sparklinePath(snapshot.history, 100, 24)} fill="none" stroke={isUp ? "#76AD25" : "#EF4444"} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Mini fundamentals strip */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 4, fontSize: "0.65rem", color: T.text2 }}>
        <Mini label="Cap" info={INFO.marketCap} value={fmtBig(snapshot.marketCap)} />
        <Mini label="P/E" info={INFO.peRatio} value={snapshot.peRatio === null ? "n/a" : snapshot.peRatio.toFixed(1)} />
        <Mini label="Yield" info={INFO.dividendYield} value={`${(snapshot.dividendYield * 100).toFixed(1)}%`} />
      </div>
    </button>
  );
}

function Mini({ label, info, value }: { label: string; info: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", opacity: 0.8 }}>
        <span style={{ fontSize: "0.6rem", fontWeight: 600 }}>{label}</span>
        <InfoIcon text={info} size={10} />
      </div>
      <div style={{ fontWeight: 800, fontSize: "0.72rem" }}>{value}</div>
    </div>
  );
}
