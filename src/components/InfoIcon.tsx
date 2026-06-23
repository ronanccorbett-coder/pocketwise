"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/lib/theme";

// Small (i) icon. Shows a tooltip on hover (desktop) or tap (mobile).
// Used throughout the Markets UI to explain financial concepts to students.
export default function InfoIcon({ text, size = 12 }: { text: string; size?: number }) {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // Close on outside click for mobile
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    window.addEventListener("touchstart", onDown);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  const tipBg = isDark ? "#1a2540" : "#0d1526";
  const tipText = "#ffffff";
  const iconBg = isDark ? "rgba(255,255,255,.10)" : "rgba(0,0,0,.08)";
  const iconColor = isDark ? "#8b9dc3" : "#475569";

  return (
    <span
      ref={ref}
      style={{ position: "relative", display: "inline-flex", alignItems: "center", lineHeight: 0, marginLeft: 4 }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
    >
      <span
        style={{
          width: size + 4, height: size + 4, borderRadius: "50%",
          background: iconBg, color: iconColor,
          fontSize: size - 1, fontWeight: 700, fontFamily: "serif",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          cursor: "help", userSelect: "none",
          fontStyle: "italic",
        }}
      >i</span>
      {open && (
        <span
          style={{
            position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
            transform: "translateX(-50%)",
            background: tipBg, color: tipText,
            padding: "8px 10px", borderRadius: 8,
            fontSize: "0.7rem", lineHeight: 1.4, fontWeight: 500,
            width: 220, textAlign: "left",
            zIndex: 1000, pointerEvents: "none",
            boxShadow: "0 6px 24px rgba(0,0,0,.3)",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {text}
          <span
            style={{
              position: "absolute", top: "100%", left: "50%",
              transform: "translateX(-50%)",
              width: 0, height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: `5px solid ${tipBg}`,
            }}
          />
        </span>
      )}
    </span>
  );
}

// Pre-written explainers for every financial concept used in the Markets UI.
// One source of truth so wording stays consistent.
export const INFO = {
  marketCap: "Market capitalisation: the total value of all the company's shares added together. Calculated as share price × total shares outstanding. A bigger market cap usually means a bigger, more established company.",
  peRatio: "Price-to-Earnings ratio: how much investors are paying for every $1 of the company's annual profit. A high P/E means investors expect strong growth. A low P/E may signal a bargain — or a struggling business.",
  dividendYield: "Dividend yield: the dividend you'd earn over a year as a percentage of the share price. A 5% yield means $5 in dividends for every $100 of shares. Yields rise when share prices fall.",
  bidAsk: "Bid is what buyers are offering to pay. Ask is what sellers want. The gap between them (spread) is a cost of trading — you buy at the higher ask and sell at the lower bid.",
  brokerage: "Brokerage: a fee the broker charges to execute your trade. On PocketWise it's 0.5% per trade. So buying $100 of shares costs you $100.50; selling $100 returns $99.50.",
  spread: "Spread: the gap between bid and ask. Smaller spreads (under 0.2%) mean a stock is easy to trade. Wider spreads (0.5%+) mean fewer buyers and sellers — and higher trading costs.",
  liquidityHigh: "High liquidity: this stock has lots of buyers and sellers every day. Easy to trade quickly without moving the price.",
  liquidityMid: "Medium liquidity: a normal amount of trading. Buying or selling small amounts is straightforward.",
  liquidityLow: "Low liquidity: fewer people trade this stock. Spreads are wider, and large orders can move the price.",
  dayRange: "Today's high and low: the highest and lowest prices the stock has traded at so far today.",
  prevClose: "Previous close: the last price the stock traded at when the market closed yesterday.",
  changePct: "Day change: how much the price has moved since yesterday's close, in dollars and as a percentage.",
  shareCount: "Shares outstanding: the total number of shares the company has issued. Multiplied by the share price, this gives the market cap.",
  eps: "Earnings per share: the company's annual profit divided by the number of shares. The 'E' in P/E ratio.",
  sector: "Sector: the industry the company operates in. Companies in the same sector often move together when industry conditions change.",
  costBasis: "Average cost basis: the average price you've paid per share, weighted across all your purchases. Used to calculate your gain or loss.",
  unrealisedPL: "Unrealised gain or loss: the profit (or loss) you'd make if you sold right now at the current bid. Becomes 'realised' only when you actually sell.",
  nextDividend: "Next dividend: when the company is next scheduled to pay shareholders. Each dividend payment is per share you own.",
};
