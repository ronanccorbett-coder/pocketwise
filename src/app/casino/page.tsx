"use client";
import { useState, useCallback } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { useGame } from "@/lib/gameContext";

type GameTab = "Slots" | "Blackjack" | "Roulette" | "Sports" | "Mines" | "Crash";
const GAME_TABS: GameTab[] = ["Slots", "Blackjack", "Roulette", "Sports", "Mines", "Crash"];

const SLOT_MACHINES = [
  { name: "Classic Reels",  desc: "3-reel fruit machine, low variance" },
  { name: "Diamond Rush",   desc: "5-reel high-stakes, jackpots up to 200x" },
  { name: "Lucky 7s",       desc: "3-reel, any 7 combination pays" },
  { name: "Megaways",       desc: "4-reel, 6 symbols, match 3 or more in a row" },
];

const SYMBOLS = ["CH", "LM", "OR", "GR", "BL", "ST", "7", "DI"];
const SYMBOL_LABELS: Record<string, string> = {
  CH: "Cherry", LM: "Lemon", OR: "Orange", GR: "Grape",
  BL: "Bell", ST: "Star", "7": "Seven", DI: "Diamond",
};
const BETS = [1, 2, 5, 10];

const PAY_TABLE = [
  { combo: "DI + DI + DI", mult: "50x" },
  { combo: "7 + 7 + 7",    mult: "20x" },
  { combo: "ST + ST + ST", mult: "10x" },
  { combo: "BL + BL + BL", mult: "5x"  },
  { combo: "Any 3 match",  mult: "3x"  },
  { combo: "Any 2 match",  mult: "1x"  },
];

function spin3() {
  return [0, 0, 0].map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
}

function calcWin(reels: string[], bet: number): number {
  if (reels[0] === "DI" && reels[1] === "DI" && reels[2] === "DI") return bet * 50;
  if (reels[0] === "7"  && reels[1] === "7"  && reels[2] === "7")  return bet * 20;
  if (reels[0] === "ST" && reels[1] === "ST" && reels[2] === "ST") return bet * 10;
  if (reels[0] === "BL" && reels[1] === "BL" && reels[2] === "BL") return bet * 5;
  if (reels[0] === reels[1] && reels[1] === reels[2]) return bet * 3;
  if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) return bet;
  return 0;
}

export default function CasinoPage() {
  const { state, casinoWin, casinoLoss } = useGame();
  const balance = state?.balance ?? 5000;

  const [gameTab, setGameTab] = useState<GameTab>("Slots");
  const [machine, setMachine] = useState("Classic Reels");
  const [bet, setBet] = useState(1);
  const [reels, setReels] = useState(["---", "---", "---"]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSpin = useCallback(() => {
    if (spinning || balance < bet) return;
    setSpinning(true);
    setResult(null);
    casinoLoss(bet);
    let ticks = 0;
    const iv = setInterval(() => {
      setReels(spin3());
      ticks++;
      if (ticks >= 12) {
        clearInterval(iv);
        const final = spin3();
        setReels(final);
        const win = calcWin(final, bet);
        if (win > 0) {
          casinoWin(win);
          setResult(`You won $${win.toFixed(2)}`);
        } else {
          setResult("No win. The house wins again.");
        }
        setSpinning(false);
      }
    }, 80);
  }, [spinning, balance, bet, casinoWin, casinoLoss]);

  return (
    <AuthGuard>
      <div style={{ minHeight: "100vh" }} className="casino-bg">
        <Nav />

        <div style={{ padding: "40px 1rem 20px", textAlign: "center" }}>
          <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 800, color: "#fff", marginBottom: 8 }}>
            PocketWise Casino
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.925rem" }}>
            Your real portfolio balance is at stake. Learn why the house always wins.
          </p>
        </div>

        {/* Game tabs */}
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 1rem 20px" }}>
          <div style={{
            background: "rgba(0,0,0,.4)", border: "1px solid #1a4030",
            borderRadius: 9999, padding: 4,
            display: "flex", gap: 2, overflowX: "auto",
          }}>
            {GAME_TABS.map(t => (
              <button key={t} onClick={() => setGameTab(t)} style={{
                padding: "8px 20px", borderRadius: 9999, whiteSpace: "nowrap",
                background: gameTab === t ? "#f59e0b" : "transparent",
                color: gameTab === t ? "#000" : "#8b9dc3",
                border: "none", fontWeight: 700, fontSize: "0.85rem",
                cursor: "pointer", fontFamily: "Inter, sans-serif",
                transition: "all .15s",
              }}>{t}</button>
            ))}
          </div>
        </div>

        {gameTab === "Slots" && (
          <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 1rem 40px" }}>

            {/* Machine selector */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>
              {SLOT_MACHINES.map(m => (
                <button key={m.name} onClick={() => setMachine(m.name)} style={{
                  background: machine === m.name ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.3)",
                  border: `1.5px solid ${machine === m.name ? "#f59e0b" : "#1a4030"}`,
                  borderRadius: 10, padding: "12px",
                  cursor: "pointer", textAlign: "left",
                  transition: "all .15s",
                }}>
                  <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#fff", marginBottom: 3 }}>{m.name}</div>
                  <div style={{ fontSize: "0.7rem", color: "#94a3b8", lineHeight: 1.4 }}>{m.desc}</div>
                </button>
              ))}
            </div>

            {/* Slot machine */}
            <div style={{
              background: "rgba(0,0,0,.5)", border: "1px solid #1a4030",
              borderRadius: 18, padding: "24px",
            }}>
              <div style={{ textAlign: "center", fontSize: "0.7rem", fontWeight: 700, color: "#8b9dc3", letterSpacing: ".1em", marginBottom: 18 }}>
                {machine.toUpperCase()} — 3 REELS
              </div>

              {/* Reels */}
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 20 }}>
                {reels.map((sym, i) => (
                  <div key={i} style={{
                    width: "30%", aspectRatio: "1.1",
                    background: "#0d2218", border: "1.5px solid #f59e0b",
                    borderRadius: 12, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    fontWeight: 900, color: sym === "---" ? "#475569" : "#fff",
                    fontSize: sym === "---" ? "1.5rem" : "1.75rem",
                  }}>
                    {sym}
                    {sym !== "---" && (
                      <div style={{ fontSize: "0.6rem", color: "#94a3b8", marginTop: 4 }}>
                        {SYMBOL_LABELS[sym]}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Result */}
              {result && (
                <div style={{
                  textAlign: "center", marginBottom: 14,
                  color: result.includes("won") ? "#76AD25" : "#EF4444",
                  fontWeight: 700, fontSize: "0.95rem",
                }}>
                  {result}
                </div>
              )}

              {/* Balance and bet */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center", marginBottom: 14, flexWrap: "wrap" }}>
                <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>
                  Balance: <strong style={{ color: "#f59e0b", fontSize: "1.05rem" }}>${balance.toFixed(2)}</strong>
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#94a3b8", fontSize: "0.82rem" }}>Bet:</span>
                  {BETS.map(b => (
                    <button key={b} onClick={() => setBet(b)} style={{
                      padding: "5px 12px", borderRadius: 9999,
                      background: bet === b ? "#f59e0b" : "rgba(255,255,255,.08)",
                      color: bet === b ? "#000" : "#94a3b8",
                      border: `1px solid ${bet === b ? "#f59e0b" : "#1a4030"}`,
                      fontWeight: 700, fontSize: "0.78rem", cursor: "pointer",
                      fontFamily: "Inter, sans-serif",
                    }}>${b}</button>
                  ))}
                </div>
              </div>

              {/* Spin */}
              <button
                onClick={handleSpin}
                disabled={spinning || balance < bet}
                style={{
                  width: "100%", padding: "16px",
                  background: spinning || balance < bet ? "#374151" : "#f59e0b",
                  color: spinning || balance < bet ? "#6b7280" : "#000",
                  border: "none", borderRadius: 10,
                  fontSize: "1rem", fontWeight: 900, letterSpacing: ".1em",
                  cursor: spinning || balance < bet ? "not-allowed" : "pointer",
                  fontFamily: "Inter, sans-serif", transition: "all .15s",
                }}>
                {spinning ? "SPINNING..." : "SPIN"}
              </button>
            </div>

            {/* Pay table */}
            <div style={{
              background: "rgba(0,0,0,.4)", border: "1px solid #1a4030",
              borderRadius: 12, padding: "18px", marginTop: 14,
            }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#8b9dc3", letterSpacing: ".08em", marginBottom: 12 }}>
                PAY TABLE — CLASSIC REELS
              </div>
              {PAY_TABLE.map(row => (
                <div key={row.combo} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,.04)",
                  fontSize: "0.8rem",
                }}>
                  <span style={{ color: "#e2e8f0" }}>{row.combo}</span>
                  <span style={{ color: "#f59e0b", fontWeight: 700 }}>{row.mult}</span>
                </div>
              ))}
            </div>

            {/* Educational callout */}
            <div style={{
              background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)",
              borderRadius: 12, padding: "14px 18px", marginTop: 12,
            }}>
              <div style={{ fontWeight: 700, color: "#fca5a5", fontSize: "0.82rem", marginBottom: 4 }}>
                Why does the house always win?
              </div>
              <p style={{ color: "#94a3b8", fontSize: "0.78rem", lineHeight: 1.6 }}>
                Every spin has a built-in house edge. Classic Reels has an RTP of approximately 85 percent,
                meaning for every $100 you bet you get back $85 on average. Gambling is entertainment, not income.
              </p>
            </div>
          </div>
        )}

        {gameTab !== "Slots" && (
          <div style={{ maxWidth: 540, margin: "0 auto", padding: "0 1rem 40px" }}>
            <div style={{
              background: "rgba(0,0,0,.4)", border: "1px solid #1a4030",
              borderRadius: 18, padding: "48px", textAlign: "center",
            }}>
              <h3 style={{ color: "#fff", fontWeight: 700, marginBottom: 8, fontSize: "1.1rem" }}>{gameTab}</h3>
              <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
                Coming soon. Complete more lessons to unlock.
              </p>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

