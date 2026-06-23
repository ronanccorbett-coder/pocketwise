"use client";
import { useState, useEffect, useRef } from "react";
import { NZX_STOCKS } from "./gameContext";

export type StockPrice = {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  prevPrice: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  history: number[];
  dividendYield: number;
  volume: number;
  basePrice: number;
};

function nextPrice(current: number, base: number, volatility: number): number {
  const meanReversion = 0.02;
  const randomShock = (Math.random() - 0.5) * 2 * volatility * current;
  const drift = meanReversion * (base - current);
  const next = current + drift + randomShock;
  return Math.max(base * 0.2, Math.min(base * 3, next));
}

function generateMarketEvent(): string | null {
  const events = [
    "RBNZ holds OCR at 5.25%",
    "NZ GDP growth beats expectations",
    "Global markets sell off overnight",
    "NZ inflation data released",
    "Strong dairy prices boost NZX",
    "US Federal Reserve signals rate cut",
    null, null, null, null, null, null,
  ];
  return events[Math.floor(Math.random() * events.length)];
}

export function useStockSimulator(
  intervalMs = 30000,
  onPriceUpdate?: (symbol: string, newPrice: number) => void
) {
  const initialPrices: Record<string, StockPrice> = {};
  NZX_STOCKS.forEach(s => {
    const startPrice = s.basePrice * (0.95 + Math.random() * 0.1);
    initialPrices[s.symbol] = {
      symbol: s.symbol, name: s.name, sector: s.sector,
      price: startPrice, prevPrice: startPrice,
      change: 0, changePct: 0,
      high: startPrice, low: startPrice,
      history: Array(30).fill(startPrice),
      dividendYield: s.dividendYield,
      volume: Math.floor(Math.random() * 500000) + 100000,
      basePrice: s.basePrice,
    };
  });

  const [prices, setPrices] = useState<Record<string, StockPrice>>(initialPrices);
  const [marketEvent, setMarketEvent] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const tickRef = useRef(0);
  const callbackRef = useRef(onPriceUpdate);
  callbackRef.current = onPriceUpdate;

  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current++;
      const event = generateMarketEvent();
      if (event) setMarketEvent(event);
      else if (tickRef.current % 3 === 0) setMarketEvent(null);

      const eventMultiplier = event ? (Math.random() > 0.5 ? 1.05 : 0.95) : 1.0;

      setPrices(prev => {
        const next: Record<string, StockPrice> = {};
        NZX_STOCKS.forEach(meta => {
          const cur = prev[meta.symbol];
          let vol = meta.volatility;
          if (event?.includes("RBNZ") && (meta.sector === "Finance" || meta.sector === "Utilities")) vol *= 1.5;
          if (event?.includes("Global")) vol *= 1.8;

          const raw = nextPrice(cur.price, meta.basePrice * eventMultiplier, vol);
          const price = parseFloat(raw.toFixed(meta.basePrice < 1 ? 3 : 2));
          const history = [...cur.history.slice(1), price];

          next[meta.symbol] = {
            ...cur,
            prevPrice: cur.price, price,
            change: parseFloat((price - cur.history[0]).toFixed(3)),
            changePct: parseFloat(((price - cur.history[0]) / cur.history[0] * 100).toFixed(2)),
            high: Math.max(cur.high, price),
            low: Math.min(cur.low, price),
            history,
            volume: Math.floor(Math.random() * 500000) + 100000,
          };

          // Notify parent to save to database
          if (callbackRef.current) {
            callbackRef.current(meta.symbol, price);
          }
        });
        return next;
      });
      setLastUpdate(Date.now());
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return { prices, marketEvent, lastUpdate };
}

export function sparklinePath(history: number[], width = 80, height = 24): string {
  if (history.length < 2) return "";
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;
  const points = history.map((p, i) => {
    const x = (i / (history.length - 1)) * width;
    const y = height - ((p - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `M ${points.join(" L ")}`;
}
