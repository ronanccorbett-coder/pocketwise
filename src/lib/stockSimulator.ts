"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  NZX_STOCKS, STOCK_BY_SYMBOL, StockMeta, BROKERAGE_PCT, SPREAD_BY_TIER,
} from "./market/registry";
import {
  snapshotStock, priceSeries, HistoryRange, StockSnapshot,
  isMarketOpen, dailyEvents, tradingDayIndex, bidAsk,
} from "./market/engine";

export type StockPrice = {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  prevPrice: number;
  prevClose: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  history: number[];
  dividendYield: number;
  volume: number;
  basePrice: number;
  bid: number;
  ask: number;
  marketCap: number;
  peRatio: number | null;
  about: string;
  liquidityTier: string;
  headlines: { day: number; headline: string; magnitude: number }[];
};

function snapshotToOldShape(snap: StockSnapshot, base: number): StockPrice {
  const volume = Math.round(
    (snap.marketCap / Math.max(1, snap.price)) * 0.002 * (1 + Math.abs(snap.changePct) * 10)
  );
  return {
    symbol: snap.symbol,
    name: snap.name,
    sector: snap.sector,
    price: snap.price,
    prevPrice: snap.prevClose,
    prevClose: snap.prevClose,
    change: snap.change,
    changePct: snap.changePct,
    high: snap.dayHigh,
    low: snap.dayLow,
    history: snap.history,
    dividendYield: snap.dividendYield,
    volume,
    basePrice: base,
    bid: snap.bid,
    ask: snap.ask,
    marketCap: snap.marketCap,
    peRatio: snap.peRatio,
    about: snap.about,
    liquidityTier: snap.liquidityTier,
    headlines: snap.headlines,
  };
}

function useMarketTick(intervalMs = 5000): number {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function pickMarketEvent(ts: number): string | null {
  const day = tradingDayIndex(ts);
  let best: { magnitude: number; headline: string } | null = null;
  for (const stock of NZX_STOCKS) {
    for (const e of dailyEvents(stock, day)) {
      if (e.type === "calm") continue;
      if (!best || Math.abs(e.magnitude) > Math.abs(best.magnitude)) {
        best = { magnitude: e.magnitude, headline: e.headline };
      }
    }
  }
  return best?.headline ?? null;
}

export function useStockSimulator(
  intervalMs: number = 5000,
  onPriceUpdate?: (symbol: string, newPrice: number) => void,
): { prices: Record<string, StockPrice>; marketEvent: string | null; isOpen: boolean } {
  const now = useMarketTick(intervalMs);
  const result = useMemo(() => {
    const prices: Record<string, StockPrice> = {};
    for (const stock of NZX_STOCKS) {
      const snap = snapshotStock(stock, now);
      prices[stock.symbol] = snapshotToOldShape(snap, stock.basePrice);
    }
    return {
      prices,
      marketEvent: pickMarketEvent(now),
      isOpen: isMarketOpen(now),
    };
  }, [now]);

  const callbackRef = useRef(onPriceUpdate);
  callbackRef.current = onPriceUpdate;
  useEffect(() => {
    const cb = callbackRef.current;
    if (!cb) return;
    for (const sym of Object.keys(result.prices)) {
      cb(sym, result.prices[sym].price);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  return result;
}

export function useStockSnapshots(): { snapshots: Record<string, StockSnapshot>; isOpen: boolean; now: number } {
  const now = useMarketTick(5000);
  return useMemo(() => {
    const snapshots: Record<string, StockSnapshot> = {};
    for (const stock of NZX_STOCKS) snapshots[stock.symbol] = snapshotStock(stock, now);
    return { snapshots, isOpen: isMarketOpen(now), now };
  }, [now]);
}

export function useStockHistory(symbol: string | null, range: HistoryRange): { t: number; price: number }[] {
  const now = useMarketTick(5000);
  return useMemo(() => {
    if (!symbol) return [];
    const stock = STOCK_BY_SYMBOL[symbol];
    if (!stock) return [];
    return priceSeries(stock, now, range);
  }, [symbol, range, now]);
}

export function sparklinePath(history: number[], w = 60, h = 20): string {
  if (!history || history.length < 2) return "";
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;
  const stepX = w / (history.length - 1);
  return history
    .map((p, i) => {
      const x = i * stepX;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export function buyCost(symbol: string, qty: number, midPrice: number): {
  ask: number; gross: number; brokerage: number; total: number;
} {
  const stock = STOCK_BY_SYMBOL[symbol];
  const ask = stock ? bidAsk(stock, midPrice).ask : midPrice;
  const gross = ask * qty;
  const brokerage = gross * BROKERAGE_PCT;
  return { ask, gross, brokerage, total: gross + brokerage };
}

export function sellProceeds(symbol: string, qty: number, midPrice: number): {
  bid: number; gross: number; brokerage: number; net: number;
} {
  const stock = STOCK_BY_SYMBOL[symbol];
  const bid = stock ? bidAsk(stock, midPrice).bid : midPrice;
  const gross = bid * qty;
  const brokerage = gross * BROKERAGE_PCT;
  return { bid, gross, brokerage, net: gross - brokerage };
}

export { NZX_STOCKS, STOCK_BY_SYMBOL, BROKERAGE_PCT, SPREAD_BY_TIER };
export type { StockMeta, StockSnapshot, HistoryRange };
