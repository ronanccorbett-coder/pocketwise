"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { useTheme } from "@/lib/theme";
import { useGame } from "@/lib/gameContext";
import { DollarSign, TrendingUp, TrendingDown, Zap } from "lucide-react";

type GameTab = "Slots"|"Blackjack"|"Roulette"|"Sports"|"Mines"|"Crash";
const GAME_TABS: GameTab[] = ["Slots","Blackjack","Roulette","Sports","Mines","Crash"];
const FONT = "Inter, system-ui, sans-serif";

// ── Shared bet selector ───────────────────────────────────────────────────
function BetSelector({ bet, setBet, max, bets = [1,2,5,10,25,50] }: { bet: number; setBet: (n: number) => void; max: number; bets?: number[] }) {
  const { isDark } = useTheme();
  const T = { bg: isDark?"#0d1526":"#f0f4f8", bg2: isDark?"#111c30":"#ffffff", bg3: isDark?"#1a2540":"#f8fafc", card: isDark?"#111c30":"#ffffff", text: isDark?"#ffffff":"#0d1526", text2: isDark?"#8b9dc3":"#475569", text3: isDark?"#4a6a8a":"#94a3b8", border: isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)", border2: isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.16)", input: isDark?"rgba(255,255,255,.06)":"#f8fafc", inputBorder: isDark?"rgba(255,255,255,.12)":"rgba(0,0,0,.14)", shadow: isDark?"rgba(0,0,0,.4)":"rgba(0,0,0,.08)", green: isDark?"#76AD25":"#5a9a1a", accent: isDark?"#f59e0b":"#d97706", strip: isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
      <span style={{ color: T.text3, fontSize: "0.82rem" }}>Bet:</span>
      {bets.filter(b => b <= Math.max(max, 1)).map(b => (
        <button key={b} onClick={() => setBet(b)} style={{ padding: "5px 12px", borderRadius: 9999, background: bet === b ? "#f59e0b" : "rgba(255,255,255,.08)", color: bet === b ? "#000" : "#94a3b8", border: `1px solid ${bet === b ? "#f59e0b" : "#1a4030"}`, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", fontFamily: FONT }}>
          ${b}
        </button>
      ))}
      <input type="number" value={bet} min={1} max={max} onChange={e => setBet(Math.min(max, Math.max(1, parseInt(e.target.value)||1)))} style={{ width: 64, padding: "5px 8px", borderRadius: 8, background: T.input, border: "1px solid #1a4030", color: T.text, fontFamily: FONT, fontSize: "0.78rem", outline: "none" }} />
    </div>
  );
}

// ── SLOTS ─────────────────────────────────────────────────────────────────
const SYMBOLS = ["CH","LM","OR","GR","BL","ST","7X","DM"];
const SYMBOL_LABELS: Record<string,string> = { CH:"Cherry", LM:"Lemon", OR:"Orange", GR:"Grape", BL:"Bell", ST:"Star", "7X":"7", DM:"Gem" };
const SYMBOL_COLORS: Record<string,string> = { CH:"#EF4444", LM:"#f59e0b", OR:"#f97316", GR:"#a78bfa", BL:"#3B82F6", ST:"#f59e0b", "7X":"#EF4444", DM:"#22d3ee" };
const WEIGHTS  = [22,  18,  16,  14,  12,  10,  5,   3];
const PAYS: Record<string,number> = { "DMDMDM":100,"7X7X7X":30,"STSTST":15,"BLBLBL":8,"GRGRGR":5,"OROROR":4,"LMLMLM":3,"CHCHCH":2 };

function weightedSym() {
  const total = WEIGHTS.reduce((a,b) => a+b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < SYMBOLS.length; i++) { r -= WEIGHTS[i]; if (r <= 0) return SYMBOLS[i]; }
  return SYMBOLS[0];
}
function spin3() { return [weightedSym(), weightedSym(), weightedSym()]; }
function calcWin(reels: string[], bet: number) {
  const key = reels.join("");
  if (PAYS[key]) return bet * PAYS[key];
  if (reels[0]===reels[1] || reels[1]===reels[2] || reels[0]===reels[2]) return bet;
  return 0;
}

function SlotsGame({ balance, onWin, onLoss }: { balance: number; onWin: (n:number)=>void; onLoss: (n:number)=>void }) {
  const { isDark } = useTheme();
  const T = { bg: isDark?"#0d1526":"#f0f4f8", bg2: isDark?"#111c30":"#ffffff", bg3: isDark?"#1a2540":"#f8fafc", card: isDark?"#111c30":"#ffffff", text: isDark?"#ffffff":"#0d1526", text2: isDark?"#8b9dc3":"#475569", text3: isDark?"#4a6a8a":"#94a3b8", border: isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)", border2: isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.16)", input: isDark?"rgba(255,255,255,.06)":"#f8fafc", inputBorder: isDark?"rgba(255,255,255,.12)":"rgba(0,0,0,.14)", shadow: isDark?"rgba(0,0,0,.4)":"rgba(0,0,0,.08)", green: isDark?"#76AD25":"#5a9a1a", accent: isDark?"#f59e0b":"#d97706", strip: isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)" };
  const [bet, setBet] = useState(2);
  const [reels, setReels] = useState(["DM","7X","ST"]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{msg:string;win:boolean;tier?:string}|null>(null);
  const [jackpot] = useState(() => Math.floor(Math.random()*800+400));

  const handleSpin = useCallback(() => {
    if (spinning || balance < bet) return;
    setSpinning(true); setResult(null);
    onLoss(bet);
    let ticks = 0;
    const iv = setInterval(() => {
      setReels(spin3()); ticks++;
      if (ticks >= 14) {
        clearInterval(iv);
        const final = spin3(); setReels(final);
        const win = calcWin(final, bet);
        if (win > 0) {
          onWin(win);
          const tier = win >= bet * 30 ? "JACKPOT" : win >= bet * 10 ? "BIG WIN" : win >= bet * 3 ? "NICE WIN" : "WIN";
          setResult({ msg: `${tier}! +$${win.toFixed(2)}`, win: true, tier });
        }
        else setResult({ msg: "No win. Better luck next spin.", win: false });
        setSpinning(false);
      }
    }, 70);
  }, [spinning, balance, bet, onWin, onLoss]);

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: "0.7rem", color: "#f59e0b", fontWeight: 700, letterSpacing: ".1em", marginBottom: 4 }}>JACKPOT</div>
        <div style={{ fontSize: "2rem", fontWeight: 900, color: "#f59e0b" }}>${jackpot}</div>
      </div>
      <div className={result?.win ? (result.tier === "JACKPOT" ? "pw-jackpot-flash" : "pw-win-flash") : ""} style={{ background: "rgba(0,0,0,.5)", border: `2px solid ${result?.win ? (result.tier==="JACKPOT"?"#f59e0b":"#76AD25") : "#f59e0b"}`, borderRadius: 18, padding: "24px", marginBottom: 14, transition: "border-color .3s" }}>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 18 }}>
          {reels.map((sym, i) => (
            <div key={i} style={{
              width: "28%", aspectRatio: "0.9",
              background: spinning ? "#0d2218" : `radial-gradient(circle at 40% 35%, ${SYMBOL_COLORS[sym] ?? "#1a4030"}33, #0d2218)`,
              border: `2px solid ${spinning ? "#1a4030" : SYMBOL_COLORS[sym] ?? "#1a4030"}`,
              borderRadius: 12,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              transition: "all .25s ease",
              boxShadow: spinning ? "none" : `0 0 20px ${SYMBOL_COLORS[sym] ?? "#1a4030"}44, inset 0 1px 0 rgba(255,255,255,.1)`,
              animation: spinning ? `pw-slot-blur 0.08s steps(1) infinite` : result?.win ? `pw-pop 0.4s cubic-bezier(.34,1.56,.64,1)` : "none",
              animationDelay: spinning ? `${i * 0.05}s` : `${i * 0.1}s`,
              filter: spinning ? "blur(1px)" : "none",
              transform: result?.win && !spinning ? "scale(1.05)" : "scale(1)",
            }}>
              <div style={{ fontSize: "1.8rem", fontWeight: 900, color: SYMBOL_COLORS[sym] ?? "#fff", fontFamily: "Inter, sans-serif", lineHeight: 1, textShadow: spinning ? "none" : `0 0 12px ${SYMBOL_COLORS[sym]}88` }}>
                {sym === "7X" ? "7" : sym}
              </div>
              <div style={{ fontSize: "0.55rem", color: SYMBOL_COLORS[sym] ?? "#8b9dc3", fontWeight: 700, marginTop: 3, textTransform: "uppercase", letterSpacing: ".05em" }}>
                {SYMBOL_LABELS[sym]}
              </div>
            </div>
          ))}
        </div>
        {result && (
          <div style={{
            textAlign: "center", marginBottom: 12,
            color: result.win ? (result.tier === "JACKPOT" ? "#f59e0b" : result.tier === "BIG WIN" ? "#22d3ee" : "#76AD25") : "#EF4444",
            fontWeight: 900,
            fontSize: result.tier === "JACKPOT" ? "1.5rem" : result.tier === "BIG WIN" ? "1.25rem" : result.win ? "1.1rem" : "0.95rem",
            animation: result.win
              ? result.tier === "JACKPOT" ? "pw-jackpot-flash .8s ease, pw-bounce .4s ease infinite alternate"
              : result.tier === "BIG WIN" ? "pw-pop .4s cubic-bezier(.34,1.56,.64,1), pw-bounce .5s ease 0.4s infinite alternate"
              : "pw-pop .3s cubic-bezier(.34,1.56,.64,1)"
              : "pw-shake .4s ease",
            textShadow: result.tier === "JACKPOT" ? "0 0 30px #f59e0b" : result.tier === "BIG WIN" ? "0 0 20px #22d3ee" : "none",
          }}>
            {result.win && result.tier === "JACKPOT" && <div style={{ fontSize: "0.9rem", letterSpacing: ".15em", marginBottom: 4 }}>★ ★ ★</div>}
            {result.msg}
            {result.win && result.tier === "JACKPOT" && <div style={{ fontSize: "0.9rem", letterSpacing: ".15em", marginTop: 4 }}>★ ★ ★</div>}
          </div>
        )}
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <span style={{ color: T.text3, fontSize: "0.875rem" }}>Balance: <strong style={{ color: "#f59e0b" }}>${balance.toFixed(2)}</strong></span>
        </div>
        <div style={{ marginBottom: 14, display: "flex", justifyContent: "center" }}>
          <BetSelector bet={bet} setBet={setBet} max={Math.min(balance, 50)} />
        </div>
        <button onClick={handleSpin} disabled={spinning || balance < bet}
          className={spinning || balance < bet ? "" : "btn-3d-amber"}
          style={{ width: "100%", padding: "15px", background: spinning || balance < bet ? "#374151" : undefined, color: spinning || balance < bet ? "#6b7280" : undefined, border: spinning || balance < bet ? "none" : undefined, borderRadius: 10, fontSize: "1rem", fontWeight: 900, letterSpacing: ".1em", cursor: spinning || balance < bet ? "not-allowed" : "pointer", fontFamily: FONT }}>
          {spinning ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ display: "inline-block", animation: "pw-spin 0.4s linear infinite" }}>◆</span>
              SPINNING...
              <span style={{ display: "inline-block", animation: "pw-spin 0.4s linear infinite reverse" }}>◆</span>
            </span>
          ) : `SPIN — $${bet}`}
        </button>
      </div>
      <div style={{ background: "rgba(0,0,0,.4)", border: "1px solid #1a4030", borderRadius: 12, padding: "14px 18px", marginBottom: 10 }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, color: T.text2, letterSpacing: ".08em", marginBottom: 10 }}>PAY TABLE</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
          {Object.entries(PAYS).map(([combo, mult]) => {
            const sym = combo.slice(0, 2);
            const color = SYMBOL_COLORS[sym] ?? "#f59e0b";
            const label = SYMBOL_LABELS[sym] ?? sym;
            return (
              <div key={combo} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: "0.8rem" }}>
                <span style={{ color, fontWeight: 700 }}>3× {label}</span>
                <span style={{ color: "#f59e0b", fontWeight: 700 }}>{mult}x</span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 12, padding: "12px 16px" }}>
        <div style={{ fontWeight: 700, color: "#fca5a5", fontSize: "0.82rem", marginBottom: 4 }}>RTP: 85% — House Edge: 15%</div>
        <p style={{ color: T.text3, fontSize: "0.78rem", lineHeight: 1.6 }}>For every $100 wagered, the machine pays back $85 on average. Each spin is independent — a losing streak does not increase your odds of winning.</p>
      </div>
    </div>
  );
}

// ── BLACKJACK ─────────────────────────────────────────────────────────────
const DECK = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
function cardVal(c: string) { if (c==="A") return 11; if (["J","Q","K"].includes(c)) return 10; return parseInt(c); }
function dealCard(deck: string[]) { return deck.splice(Math.floor(Math.random()*deck.length), 1)[0]; }
function makeDecks(n=2) { const d: string[] = []; for (let i=0;i<n;i++) DECK.forEach(c => d.push(c)); return d; }
function handVal(hand: string[]) {
  let total = 0, aces = 0;
  hand.forEach(c => { total += cardVal(c); if (c==="A") aces++; });
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function BJCard({ card, hidden }: { card: string; hidden?: boolean }) {
  const { isDark } = useTheme();
  const T = { bg: isDark?"#0d1526":"#f0f4f8", bg2: isDark?"#111c30":"#ffffff", bg3: isDark?"#1a2540":"#f8fafc", card: isDark?"#111c30":"#ffffff", text: isDark?"#ffffff":"#0d1526", text2: isDark?"#8b9dc3":"#475569", text3: isDark?"#4a6a8a":"#94a3b8", border: isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)", border2: isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.16)", input: isDark?"rgba(255,255,255,.06)":"#f8fafc", inputBorder: isDark?"rgba(255,255,255,.12)":"rgba(0,0,0,.14)", shadow: isDark?"rgba(0,0,0,.4)":"rgba(0,0,0,.08)", green: isDark?"#76AD25":"#5a9a1a", accent: isDark?"#f59e0b":"#d97706", strip: isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)" };
  const isRed = ["H","D"].includes(card.slice(-1));
  return (
    <div style={{ width: 52, height: 76, borderRadius: 8, background: hidden ? "#1a4030" : "#fff", border: "1.5px solid rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: hidden ? "1.5rem" : "1.25rem", fontWeight: 900, color: hidden ? "#1a4030" : "#1a1a1a", boxShadow: "0 2px 8px rgba(0,0,0,.4)", flexShrink: 0 }}>
      {hidden ? "?" : card}
    </div>
  );
}

function BlackjackGame({ balance, onWin, onLoss }: { balance: number; onWin: (n:number)=>void; onLoss: (n:number)=>void }) {
  const { isDark } = useTheme();
  const T = { bg: isDark?"#0d1526":"#f0f4f8", bg2: isDark?"#111c30":"#ffffff", bg3: isDark?"#1a2540":"#f8fafc", card: isDark?"#111c30":"#ffffff", text: isDark?"#ffffff":"#0d1526", text2: isDark?"#8b9dc3":"#475569", text3: isDark?"#4a6a8a":"#94a3b8", border: isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)", border2: isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.16)", input: isDark?"rgba(255,255,255,.06)":"#f8fafc", inputBorder: isDark?"rgba(255,255,255,.12)":"rgba(0,0,0,.14)", shadow: isDark?"rgba(0,0,0,.4)":"rgba(0,0,0,.08)", green: isDark?"#76AD25":"#5a9a1a", accent: isDark?"#f59e0b":"#d97706", strip: isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)" };
  const [bet, setBet] = useState(5);
  const [deck, setDeck] = useState<string[]>([]);
  const [playerHand, setPlayerHand] = useState<string[]>([]);
  const [dealerHand, setDealerHand] = useState<string[]>([]);
  const [phase, setPhase] = useState<"bet"|"play"|"dealer"|"result">("bet");
  const [result, setResult] = useState<string>("");
  const [hideDealer, setHideDealer] = useState(true);

  function startGame() {
    const d = makeDecks(2);
    const p = [dealCard(d), dealCard(d)];
    const dl = [dealCard(d), dealCard(d)];
    setDeck(d); setPlayerHand(p); setDealerHand(dl);
    setHideDealer(true); setPhase("play"); setResult("");
    onLoss(bet);
    if (handVal(p) === 21) { endGame(p, dl, d, true); }
  }

  function hit() {
    const d = [...deck]; const p = [...playerHand, dealCard(d)];
    setDeck(d); setPlayerHand(p);
    if (handVal(p) > 21) endGame(p, dealerHand, d, false);
  }

  function stand() { runDealer(dealerHand, deck); }

  function double() {
    if (balance < bet) return;
    onLoss(bet);
    const d = [...deck]; const p = [...playerHand, dealCard(d)];
    setDeck(d); setPlayerHand(p);
    if (handVal(p) > 21) endGame(p, dealerHand, d, false, true);
    else runDealer(dealerHand, d, true);
  }

  function runDealer(dh: string[], d: string[], doubled = false) {
    setHideDealer(false);
    let hand = [...dh]; let deck2 = [...d];
    while (handVal(hand) < 17) hand.push(dealCard(deck2));
    setDealerHand(hand); setDeck(deck2);
    endGame(playerHand, hand, deck2, false, doubled);
  }

  function endGame(p: string[], d: string[], dk: string[], naturalBJ: boolean, doubled = false) {
    setHideDealer(false); setPhase("result");
    const pv = handVal(p), dv = handVal(d);
    const betMult = doubled ? 2 : 1;
    if (naturalBJ && pv === 21) { onWin(bet * betMult * 2.5); setResult("Blackjack! You win 2.5x"); return; }
    if (pv > 21) { setResult("Bust! Dealer wins."); return; }
    if (dv > 21 || pv > dv) { onWin(bet * betMult * 2); setResult(`You win! ${pv} vs ${dv}`); return; }
    if (pv === dv) { onWin(bet * betMult); setResult(`Push — ${pv} each`); return; }
    setResult(`Dealer wins. ${dv} vs ${pv}`);
  }

  const pv = handVal(playerHand), dv = handVal(dealerHand);
  const canDouble = phase === "play" && playerHand.length === 2 && balance >= bet;

  return (
    <div>
      <div style={{ background: "#0a2118", border: "1px solid #1a4030", borderRadius: 18, padding: "24px", marginBottom: 14 }}>
        {phase === "bet" ? (
          <div style={{ textAlign: "center" }}>
            <h3 style={{ color: T.text, fontWeight: 700, marginBottom: 8 }}>Place Your Bet</h3>
            <p style={{ color: T.text2, fontSize: "0.85rem", marginBottom: 20 }}>Beat the dealer. Get closer to 21 without going over.</p>
            <div style={{ marginBottom: 20 }}>
              <BetSelector bet={bet} setBet={setBet} max={Math.min(balance, 100)} bets={[5,10,25,50,100]} />
            </div>
            <button onClick={startGame} disabled={balance < bet} style={{ padding: "13px 40px", background: "#f59e0b", color: "#000", border: "none", borderRadius: 10, fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", fontFamily: FONT }}>
              Deal Cards — ${bet}
            </button>
          </div>
        ) : (
          <div>
            {/* Dealer hand */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: "0.72rem", color: T.text2, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>
                Dealer {!hideDealer ? `— ${dv}` : ""}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {dealerHand.map((c, i) => <BJCard key={i} card={c} hidden={hideDealer && i === 1} />)}
              </div>
            </div>
            {/* Player hand */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: "0.72rem", color: T.text2, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>
                You — {pv} {pv === 21 ? "★" : pv > 21 ? "BUST" : ""}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {playerHand.map((c, i) => <BJCard key={i} card={c} />)}
              </div>
            </div>
            {result && (
              <div style={{ textAlign: "center", padding: "12px", background: result.includes("win") || result.includes("Blackjack") || result.includes("Push") ? "rgba(118,173,37,.15)" : "rgba(239,68,68,.12)", borderRadius: 10, marginBottom: 14, color: result.includes("win") || result.includes("Blackjack") || result.includes("Push") ? "#76AD25" : "#EF4444", fontWeight: 700 }}>
                {result}
              </div>
            )}
            {phase === "play" && (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={hit} style={{ flex: 1, padding: "12px", background: "#3B82F6", color: T.text, border: "none", borderRadius: 9, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Hit</button>
                <button onClick={stand} style={{ flex: 1, padding: "12px", background: "#64748b", color: T.text, border: "none", borderRadius: 9, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Stand</button>
                {canDouble && <button onClick={double} style={{ flex: 1, padding: "12px", background: "#f59e0b", color: "#000", border: "none", borderRadius: 9, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Double</button>}
              </div>
            )}
            {phase === "result" && (
              <button onClick={() => setPhase("bet")} style={{ width: "100%", padding: "12px", background: "#f59e0b", color: "#000", border: "none", borderRadius: 9, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
                New Hand
              </button>
            )}
          </div>
        )}
      </div>
      <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 12, padding: "12px 16px" }}>
        <div style={{ fontWeight: 700, color: "#fca5a5", fontSize: "0.82rem", marginBottom: 4 }}>House Edge: ~0.5% with perfect strategy</div>
        <p style={{ color: T.text3, fontSize: "0.78rem", lineHeight: 1.6 }}>Blackjack has the lowest house edge of any casino game — but only if you play perfectly. Most players make mistakes and give the house 2-4%. Always stand on 17+, double on 11.</p>
      </div>
    </div>
  );
}

// ── ROULETTE ──────────────────────────────────────────────────────────────
const RED_NUMS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

function RouletteGame({ balance, onWin, onLoss }: { balance: number; onWin: (n:number)=>void; onLoss: (n:number)=>void }) {
  const { isDark } = useTheme();
  const T = { bg: isDark?"#0d1526":"#f0f4f8", bg2: isDark?"#111c30":"#ffffff", bg3: isDark?"#1a2540":"#f8fafc", card: isDark?"#111c30":"#ffffff", text: isDark?"#ffffff":"#0d1526", text2: isDark?"#8b9dc3":"#475569", text3: isDark?"#4a6a8a":"#94a3b8", border: isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)", border2: isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.16)", input: isDark?"rgba(255,255,255,.06)":"#f8fafc", inputBorder: isDark?"rgba(255,255,255,.12)":"rgba(0,0,0,.14)", shadow: isDark?"rgba(0,0,0,.4)":"rgba(0,0,0,.08)", green: isDark?"#76AD25":"#5a9a1a", accent: isDark?"#f59e0b":"#d97706", strip: isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)" };
  const [bet, setBet] = useState(5);
  const [betType, setBetType] = useState<"red"|"black"|"odd"|"even"|"1-18"|"19-36"|null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{num:number;color:string;win:boolean;msg:string}|null>(null);
  const [history, setHistory] = useState<{num:number;color:string}[]>([]);

  function spin() {
    if (!betType || balance < bet) return;
    setSpinning(true); setResult(null);
    onLoss(bet);
    setTimeout(() => {
      const num = Math.floor(Math.random()*37); // 0-36
      const color = num === 0 ? "green" : RED_NUMS.includes(num) ? "red" : "black";
      let win = false;
      if (betType === "red" && color === "red") win = true;
      if (betType === "black" && color === "black") win = true;
      if (betType === "odd" && num > 0 && num % 2 === 1) win = true;
      if (betType === "even" && num > 0 && num % 2 === 0) win = true;
      if (betType === "1-18" && num >= 1 && num <= 18) win = true;
      if (betType === "19-36" && num >= 19 && num <= 36) win = true;
      if (win) { onWin(bet * 2); }
      const msg = win ? `${num} ${color} — You win $${(bet*2).toFixed(0)}!` : `${num} ${color} — You lose $${bet}`;
      setResult({ num, color, win, msg });
      setHistory(h => [{ num, color }, ...h.slice(0,11)]);
      setSpinning(false);
    }, 1800);
  }

  const colourMap: Record<string,string> = { red: "#EF4444", black: "#1f2937", green: "#76AD25" };
  const BETS_ROW: { label: string; key: typeof betType }[] = [
    { label: "Red", key: "red" }, { label: "Black", key: "black" },
    { label: "Odd", key: "odd" }, { label: "Even", key: "even" },
    { label: "1-18", key: "1-18" }, { label: "19-36", key: "19-36" },
  ];

  return (
    <div>
      <div style={{ background: "#0a2118", border: "1px solid #1a4030", borderRadius: 18, padding: "24px", marginBottom: 14 }}>
        {/* Wheel display */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          {spinning ? (
            <div style={{ position: "relative", width: 110, height: 110, margin: "0 auto" }}>
              <div style={{
                width: 110, height: 110, borderRadius: "50%",
                background: "conic-gradient(#EF4444 0deg, #1f2937 20deg, #EF4444 40deg, #1f2937 60deg, #76AD25 80deg, #EF4444 100deg, #1f2937 120deg, #EF4444 140deg, #1f2937 160deg, #EF4444 180deg, #1f2937 200deg, #EF4444 220deg, #1f2937 240deg, #EF4444 260deg, #1f2937 280deg, #EF4444 300deg, #1f2937 320deg, #EF4444 340deg, #1f2937 360deg)",
                border: "4px solid #f59e0b",
                animation: "pw-spin 0.3s linear infinite",
                boxShadow: "0 0 30px rgba(245,158,11,.4)",
              }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#f59e0b", boxShadow: "0 0 10px #f59e0b" }} />
              </div>
            </div>
          ) : result ? (
            <div style={{
              width: 110, height: 110, borderRadius: "50%",
              background: colourMap[result.color],
              border: "4px solid #f59e0b",
              margin: "0 auto",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "2rem", fontWeight: 900, color: T.text,
              animation: "pw-pop 0.5s cubic-bezier(.34,1.56,.64,1)",
              boxShadow: `0 0 30px ${colourMap[result.color]}88`,
              transition: "all .3s"
            }}>
              {result.num}
            </div>
          ) : (
            <div style={{ width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,.05)", border: "3px dashed rgba(255,255,255,.15)", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", color: "#4a5a7a", fontSize: "0.8rem" }}>
              Spin
            </div>
          )}
          {result && <div style={{ marginTop: 12, fontWeight: 700, color: result.win ? "#76AD25" : "#EF4444", fontSize: "0.95rem" }}>{result.msg}</div>}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div style={{ display: "flex", gap: 5, marginBottom: 16, flexWrap: "wrap", justifyContent: "center" }}>
            {history.map((h,i) => (
              <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", background: colourMap[h.color], display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, color: T.text }}>{h.num}</div>
            ))}
          </div>
        )}

        {/* Bet type */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
          {BETS_ROW.map(b => (
            <button key={b.key} onClick={() => setBetType(b.key)} style={{ padding: "10px", borderRadius: 9, background: betType === b.key ? (b.key === "red" ? "#EF4444" : b.key === "black" ? "#374151" : "#f59e0b") : "rgba(255,255,255,.06)", color: betType === b.key ? (b.key === "black" ? "#fff" : "#000") : "#8b9dc3", border: `1px solid ${betType === b.key ? "rgba(255,255,255,.3)" : "#1a4030"}`, fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", fontFamily: FONT }}>
              {b.label}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 14, display: "flex", justifyContent: "center" }}>
          <BetSelector bet={bet} setBet={setBet} max={Math.min(balance, 100)} bets={[5,10,25,50,100]} />
        </div>

        <button onClick={spin} disabled={spinning || !betType || balance < bet} style={{ width: "100%", padding: "14px", background: spinning || !betType || balance < bet ? "#374151" : "linear-gradient(135deg,#f59e0b,#d97706)", color: spinning || !betType || balance < bet ? "#6b7280" : "#000", border: "none", borderRadius: 10, fontWeight: 900, fontSize: "0.95rem", cursor: spinning || !betType || balance < bet ? "not-allowed" : "pointer", fontFamily: FONT }}>
          {spinning ? "SPINNING..." : betType ? `Bet ${betType.toUpperCase()} — $${bet}` : "Select a bet type"}
        </button>
      </div>
      <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 12, padding: "12px 16px" }}>
        <div style={{ fontWeight: 700, color: "#fca5a5", fontSize: "0.82rem", marginBottom: 4 }}>House Edge: 2.7% (European Roulette)</div>
        <p style={{ color: T.text3, fontSize: "0.78rem", lineHeight: 1.6 }}>Even-money bets like Red/Black win just under 50% of the time — not 50% — because of the green zero. That small edge is how casinos profit from millions of spins.</p>
      </div>
    </div>
  );
}

// ── SPORTS BETTING ────────────────────────────────────────────────────────
const NZ_FIXTURES = [
  { home: "All Blacks", away: "Australia", sport: "Rugby", oddsHome: 1.45, oddsAway: 2.80, oddsDraw: 14.0 },
  { home: "Chiefs", away: "Blues", sport: "Super Rugby", oddsHome: 1.90, oddsAway: 1.95, oddsDraw: null },
  { home: "Wellington Phoenix", away: "Perth Glory", sport: "A-League", oddsHome: 2.10, oddsAway: 3.20, oddsDraw: 3.40 },
  { home: "Blackcaps", away: "England", sport: "Cricket", oddsHome: 2.50, oddsAway: 1.65, oddsDraw: null },
  { home: "Silver Ferns", away: "Australia Diamonds", sport: "Netball", oddsHome: 1.80, oddsAway: 2.10, oddsDraw: null },
];

function SportsGame({ balance, onWin, onLoss }: { balance: number; onWin: (n:number)=>void; onLoss: (n:number)=>void }) {
  const { isDark } = useTheme();
  const T = { bg: isDark?"#0d1526":"#f0f4f8", bg2: isDark?"#111c30":"#ffffff", bg3: isDark?"#1a2540":"#f8fafc", card: isDark?"#111c30":"#ffffff", text: isDark?"#ffffff":"#0d1526", text2: isDark?"#8b9dc3":"#475569", text3: isDark?"#4a6a8a":"#94a3b8", border: isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)", border2: isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.16)", input: isDark?"rgba(255,255,255,.06)":"#f8fafc", inputBorder: isDark?"rgba(255,255,255,.12)":"rgba(0,0,0,.14)", shadow: isDark?"rgba(0,0,0,.4)":"rgba(0,0,0,.08)", green: isDark?"#76AD25":"#5a9a1a", accent: isDark?"#f59e0b":"#d97706", strip: isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)" };
  const [bet, setBet] = useState(10);
  const [selected, setSelected] = useState<{fixture:number;pick:"home"|"away"|"draw";odds:number}|null>(null);
  const [result, setResult] = useState<{msg:string;win:boolean}|null>(null);
  const [loading, setLoading] = useState(false);

  function placeBet() {
    if (!selected || balance < bet) return;
    setLoading(true); setResult(null);
    onLoss(bet);
    setTimeout(() => {
      // Simulate outcome based on odds (implied probability)
      const fixture = NZ_FIXTURES[selected.fixture];
      const totalOdds = 1/fixture.oddsHome + 1/fixture.oddsAway + (fixture.oddsDraw ? 1/fixture.oddsDraw : 0);
      const homeProb = (1/fixture.oddsHome) / totalOdds;
      const awayProb = (1/fixture.oddsAway) / totalOdds;
      const r = Math.random();
      let outcome: "home"|"away"|"draw";
      if (r < homeProb) outcome = "home";
      else if (r < homeProb + awayProb) outcome = "away";
      else outcome = "draw";
      const win = outcome === selected.pick;
      if (win) {
        const payout = bet * selected.odds;
        onWin(payout);
        setResult({ msg: `Winner! ${fixture[outcome === "home" ? "home" : "away"]} won. You win $${payout.toFixed(2)}`, win: true });
        setResult({ msg: `${win ? "✅ Winner!" : ""} ${fixture[outcome === "home" ? "home" : "away"]} won. You win $${payout.toFixed(2)}`, win: true });
        setResult({ msg: `${fixture[outcome === "home" ? "home" : "away"]} won. You lose $${bet}.`, win: false });
      }
      setLoading(false); setSelected(null);
    }, 2000);
  }

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
        {NZ_FIXTURES.map((f, fi) => (
          <div key={fi} style={{ background: "#0a2118", border: "1px solid #1a4030", borderRadius: 12, padding: "14px" }}>
            <div style={{ fontSize: "0.65rem", color: T.text2, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>{f.sport}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ flex: 1, fontWeight: 600, fontSize: "0.875rem", color: T.text }}>{f.home}</span>
              <span style={{ fontSize: "0.72rem", color: T.text2 }}>vs</span>
              <span style={{ flex: 1, fontWeight: 600, fontSize: "0.875rem", color: T.text, textAlign: "right" }}>{f.away}</span>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button onClick={() => setSelected({ fixture: fi, pick: "home", odds: f.oddsHome })} style={{ flex: 1, padding: "7px", borderRadius: 7, background: selected?.fixture === fi && selected.pick === "home" ? "#f59e0b" : "rgba(255,255,255,.06)", color: selected?.fixture === fi && selected.pick === "home" ? "#000" : "#e2e8f0", border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", fontFamily: FONT }}>
                {f.home.split(" ")[0]} {f.oddsHome.toFixed(2)}
              </button>
              {f.oddsDraw && (
                <button onClick={() => setSelected({ fixture: fi, pick: "draw", odds: f.oddsDraw! })} style={{ flex: 1, padding: "7px", borderRadius: 7, background: selected?.fixture === fi && selected.pick === "draw" ? "#f59e0b" : "rgba(255,255,255,.06)", color: selected?.fixture === fi && selected.pick === "draw" ? "#000" : "#e2e8f0", border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", fontFamily: FONT }}>
                  Draw {f.oddsDraw.toFixed(2)}
                </button>
              )}
              <button onClick={() => setSelected({ fixture: fi, pick: "away", odds: f.oddsAway })} style={{ flex: 1, padding: "7px", borderRadius: 7, background: selected?.fixture === fi && selected.pick === "away" ? "#f59e0b" : "rgba(255,255,255,.06)", color: selected?.fixture === fi && selected.pick === "away" ? "#000" : "#e2e8f0", border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", fontFamily: FONT }}>
                {f.away.split(" ")[0]} {f.oddsAway.toFixed(2)}
              </button>
            </div>
          </div>
        ))}
      </div>
      {result && (
        <div style={{ background: result.win ? "rgba(118,173,37,.12)" : "rgba(239,68,68,.1)", border: `1px solid ${result.win ? "rgba(118,173,37,.3)" : "rgba(239,68,68,.2)"}`, borderRadius: 10, padding: "12px 16px", marginBottom: 12, fontWeight: 700, color: result.win ? "#76AD25" : "#EF4444", fontSize: "0.9rem" }}>
          {result.msg}
        </div>
      )}
      {selected && (
        <div style={{ background: "#0a2118", border: "1px solid #f59e0b", borderRadius: 12, padding: "14px", marginBottom: 12 }}>
          <div style={{ fontSize: "0.8rem", color: T.text2, marginBottom: 8 }}>
            Bet slip: <strong style={{ color: T.text }}>{NZ_FIXTURES[selected.fixture][selected.pick === "home" ? "home" : selected.pick === "away" ? "away" : "home"]} ({selected.pick})</strong> @ {selected.odds.toFixed(2)}
          </div>
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}>
            <BetSelector bet={bet} setBet={setBet} max={Math.min(balance, 200)} bets={[5,10,25,50,100,200]} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: 10 }}>
            <span style={{ color: T.text2 }}>Potential return</span>
            <span style={{ fontWeight: 700, color: "#76AD25" }}>${(bet * selected.odds).toFixed(2)}</span>
          </div>
          <button onClick={placeBet} disabled={loading} style={{ width: "100%", padding: "12px", background: loading ? "#374151" : "#f59e0b", color: loading ? "#6b7280" : "#000", border: "none", borderRadius: 9, fontWeight: 800, fontSize: "0.9rem", cursor: loading ? "not-allowed" : "pointer", fontFamily: FONT }}>
            {loading ? "Settling..." : `Place Bet — $${bet}`}
          </button>
        </div>
      )}
      <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 12, padding: "12px 16px" }}>
        <div style={{ fontWeight: 700, color: "#fca5a5", fontSize: "0.82rem", marginBottom: 4 }}>The Overround: How Bookies Always Win</div>
        <p style={{ color: T.text3, fontSize: "0.78rem", lineHeight: 1.6 }}>Notice how the odds do not add up to 100%? The total implied probability is always over 100% — that is the bookmaker's margin (overround), typically 5-15%. Over thousands of bets, this guarantees profit.</p>
      </div>
    </div>
  );
}

// ── MINES ─────────────────────────────────────────────────────────────────
function MinesGame({ balance, onWin, onLoss }: { balance: number; onWin: (n:number)=>void; onLoss: (n:number)=>void }) {
  const { isDark } = useTheme();
  const T = { bg: isDark?"#0d1526":"#f0f4f8", bg2: isDark?"#111c30":"#ffffff", bg3: isDark?"#1a2540":"#f8fafc", card: isDark?"#111c30":"#ffffff", text: isDark?"#ffffff":"#0d1526", text2: isDark?"#8b9dc3":"#475569", text3: isDark?"#4a6a8a":"#94a3b8", border: isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)", border2: isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.16)", input: isDark?"rgba(255,255,255,.06)":"#f8fafc", inputBorder: isDark?"rgba(255,255,255,.12)":"rgba(0,0,0,.14)", shadow: isDark?"rgba(0,0,0,.4)":"rgba(0,0,0,.08)", green: isDark?"#76AD25":"#5a9a1a", accent: isDark?"#f59e0b":"#d97706", strip: isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)" };
  const [bet, setBet] = useState(5);
  const [mineCount, setMineCount] = useState(5);
  const [board, setBoard] = useState<("hidden"|"safe"|"mine")[]>(Array(25).fill("hidden"));
  const [mines, setMines] = useState<Set<number>>(new Set());
  const [phase, setPhase] = useState<"bet"|"play"|"lost"|"cashed">("bet");
  const [safeCount, setSafeCount] = useState(0);
  const [multiplier, setMultiplier] = useState(1);

  function calcMult(safe: number, totalMines: number) {
    let m = 1;
    for (let i = 0; i < safe; i++) m *= (25 - totalMines - i) / (25 - i) > 0 ? 1 / ((25 - totalMines - i) / (25 - i)) * 0.97 : 1;
    return Math.max(1, parseFloat(m.toFixed(2)));
  }

  function startGame() {
    const m = new Set<number>();
    while (m.size < mineCount) m.add(Math.floor(Math.random() * 25));
    setMines(m); setBoard(Array(25).fill("hidden"));
    setSafeCount(0); setMultiplier(1); setPhase("play");
    onLoss(bet);
  }

  function reveal(i: number) {
    if (phase !== "play" || board[i] !== "hidden") return;
    if (mines.has(i)) {
      // Hit a mine — reveal all
      setBoard(b => b.map((c, j) => mines.has(j) ? "mine" : c === "hidden" ? "safe" : c));
      setPhase("lost");
    } else {
      const sc = safeCount + 1;
      setSafeCount(sc);
      const m = calcMult(sc, mineCount);
      setMultiplier(m);
      setBoard(b => b.map((c, j) => j === i ? "safe" : c));
    }
  }

  function cashOut() {
    onWin(bet * multiplier);
    setBoard(b => b.map((c, j) => mines.has(j) ? "mine" : c));
    setPhase("cashed");
  }

  return (
    <div>
      {phase === "bet" && (
        <div style={{ background: "#0a2118", border: "1px solid #1a4030", borderRadius: 14, padding: "24px", marginBottom: 14 }}>
          <h3 style={{ color: T.text, fontWeight: 700, marginBottom: 4 }}>Mines</h3>
          <p style={{ color: T.text2, fontSize: "0.85rem", marginBottom: 20 }}>Reveal tiles to multiply your bet. Hit a mine and lose everything.</p>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: "0.75rem", color: T.text2, marginBottom: 6 }}>Mines: {mineCount}</label>
            <input type="range" className="pw-range" min={1} max={20} value={mineCount} onChange={e => setMineCount(parseInt(e.target.value))} style={{ width: "100%" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#4a5a7a" }}><span>1 mine (easy)</span><span>20 mines (reckless)</span></div>
          </div>
          <div style={{ marginBottom: 20, display: "flex", justifyContent: "center" }}>
            <BetSelector bet={bet} setBet={setBet} max={Math.min(balance, 100)} bets={[5,10,25,50,100]} />
          </div>
          <button onClick={startGame} disabled={balance < bet} style={{ width: "100%", padding: "13px", background: "#f59e0b", color: "#000", border: "none", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontFamily: FONT }}>
            Start — ${bet}
          </button>
        </div>
      )}
      {(phase === "play" || phase === "lost" || phase === "cashed") && (
        <div style={{ background: "#0a2118", border: "1px solid #1a4030", borderRadius: 14, padding: "16px", marginBottom: 14 }}>
          {phase === "play" && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: "0.7rem", color: T.text2 }}>Current multiplier</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#f59e0b" }}>{multiplier}x</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.7rem", color: T.text2 }}>Cash out value</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#76AD25" }}>${(bet * multiplier).toFixed(2)}</div>
              </div>
            </div>
          )}
          {phase === "lost" && <div style={{ textAlign: "center", color: "#EF4444", fontWeight: 700, marginBottom: 12, fontSize: "1rem" }}>Mine hit! You lost ${bet}</div>}
          {phase === "cashed" && <div style={{ textAlign: "center", color: "#76AD25", fontWeight: 700, marginBottom: 12, fontSize: "1rem" }}>Cashed out ${(bet * multiplier).toFixed(2)}!</div>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, marginBottom: 14 }}>
            {board.map((cell, i) => (
              <button key={i} onClick={() => reveal(i)} style={{
                aspectRatio: "1", borderRadius: 10, border: "none",
                cursor: cell === "hidden" && phase === "play" ? "pointer" : "default",
                background: cell === "mine" ? "linear-gradient(135deg,#7f1d1d,#EF4444)" : cell === "safe" ? "linear-gradient(135deg,#166534,#76AD25)" : "rgba(255,255,255,.07)",
                fontSize: "1.3rem",
                transition: "all .15s cubic-bezier(.34,1.56,.64,1)",
                boxShadow: cell === "safe" ? "0 0 12px rgba(118,173,37,.5), inset 0 1px 0 rgba(255,255,255,.2)" : cell === "mine" ? "0 0 12px rgba(239,68,68,.5)" : "0 2px 4px rgba(0,0,0,.3)",
                animation: cell !== "hidden" ? "pw-pop 0.3s cubic-bezier(.34,1.56,.64,1)" : "none",
                transform: cell === "hidden" && phase === "play" ? undefined : undefined,
              }}
              onMouseEnter={e => { if (cell === "hidden" && phase === "play") (e.currentTarget as HTMLElement).style.transform = "scale(1.08) translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; }}
              >
                {cell === "mine" ? "✕" : cell === "safe" ? "◆" : ""}
              </button>
            ))}
          </div>
          {phase === "play" && safeCount > 0 && (
            <button onClick={cashOut} style={{ width: "100%", padding: "12px", background: "#76AD25", color: T.text, border: "none", borderRadius: 9, fontWeight: 800, cursor: "pointer", fontFamily: FONT }}>
              Cash Out ${(bet * multiplier).toFixed(2)}
            </button>
          )}
          {(phase === "lost" || phase === "cashed") && (
            <button onClick={() => setPhase("bet")} style={{ width: "100%", padding: "12px", background: "#f59e0b", color: "#000", border: "none", borderRadius: 9, fontWeight: 800, cursor: "pointer", fontFamily: FONT }}>
              Play Again
            </button>
          )}
        </div>
      )}
      <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 12, padding: "12px 16px" }}>
        <div style={{ fontWeight: 700, color: "#fca5a5", fontSize: "0.82rem", marginBottom: 4 }}>Greed is the enemy</div>
        <p style={{ color: T.text3, fontSize: "0.78rem", lineHeight: 1.6 }}>Every tile you reveal feels like a win — but your risk of ruin grows with every click. Knowing when to walk away is the most important financial skill in any gamble.</p>
      </div>
    </div>
  );
}

// ── CRASH ─────────────────────────────────────────────────────────────────
function CrashGame({ balance, onWin, onLoss }: { balance: number; onWin: (n:number)=>void; onLoss: (n:number)=>void }) {
  const { isDark } = useTheme();
  const T = { bg: isDark?"#0d1526":"#f0f4f8", bg2: isDark?"#111c30":"#ffffff", bg3: isDark?"#1a2540":"#f8fafc", card: isDark?"#111c30":"#ffffff", text: isDark?"#ffffff":"#0d1526", text2: isDark?"#8b9dc3":"#475569", text3: isDark?"#4a6a8a":"#94a3b8", border: isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)", border2: isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.16)", input: isDark?"rgba(255,255,255,.06)":"#f8fafc", inputBorder: isDark?"rgba(255,255,255,.12)":"rgba(0,0,0,.14)", shadow: isDark?"rgba(0,0,0,.4)":"rgba(0,0,0,.08)", green: isDark?"#76AD25":"#5a9a1a", accent: isDark?"#f59e0b":"#d97706", strip: isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)" };
  const [bet, setBet] = useState(5);
  const [autoCashout, setAutoCashout] = useState(2.0);
  const [phase, setPhase] = useState<"bet"|"running"|"crashed"|"cashed">("bet");
  const [multiplier, setMultiplier] = useState(1.00);
  const [crashAt, setCrashAt] = useState(1.00);
  const [cashedAt, setCashedAt] = useState<number|null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const intervalRef = useRef<NodeJS.Timeout|null>(null);

  function generateCrash() {
    // House edge ~5% — exponential distribution
    const r = Math.random();
    if (r < 0.05) return 1.00; // instant crash 5% of the time
    return parseFloat((0.99 / (1 - Math.random() * 0.99)).toFixed(2));
  }

  function startGame() {
    const crash = generateCrash();
    setCrashAt(crash); setMultiplier(1.00); setCashedAt(null);
    setPhase("running"); onLoss(bet);
    let current = 1.00;
    intervalRef.current = setInterval(() => {
      current = parseFloat((current + current * 0.02).toFixed(2));
      setMultiplier(current);
      if (current >= autoCashout) { cashOutAt(current, crash, bet); return; }
      if (current >= crash) {
        setMultiplier(crash); setPhase("crashed");
        setHistory(h => [crash, ...h.slice(0,9)]);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 100);
  }

  function cashOutAt(at: number, crash: number, betAmt: number) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (at >= crash) { setPhase("crashed"); setHistory(h => [crash, ...h.slice(0,9)]); return; }
    const payout = betAmt * at;
    onWin(payout); setCashedAt(at); setPhase("cashed");
    setHistory(h => [crash, ...h.slice(0,9)]);
  }

  function manualCashout() {
    if (phase !== "running") return;
    cashOutAt(multiplier, crashAt, bet);
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return (
    <div>
      <div style={{ background: "#0a2118", border: "1px solid #1a4030", borderRadius: 14, padding: "24px", marginBottom: 14 }}>
        {/* Multiplier display */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{
            fontSize: "4.5rem", fontWeight: 900, fontFamily: "monospace",
            color: phase === "crashed" ? "#EF4444" : phase === "cashed" ? "#76AD25" : multiplier > 3 ? "#f59e0b" : multiplier > 2 ? "#22d3ee" : "#fff",
            transition: "color .1s",
            textShadow: phase === "running" ? `0 0 30px ${multiplier > 3 ? "#f59e0b" : "#22d3ee"}88` : "none",
            animation: phase === "crashed" ? "pw-shake 0.4s ease" : phase === "running" && multiplier > 5 ? "pw-pulse-glow 0.5s ease infinite" : "none",
            transform: phase === "running" ? `scale(${Math.min(1 + (multiplier - 1) * 0.02, 1.15)})` : "scale(1)",
          }}>
            {multiplier.toFixed(2)}x
          </div>
          {phase === "crashed" && <div style={{ color: "#EF4444", fontWeight: 700, animation: "pw-slide-up .3s ease" }}>CRASHED at {crashAt.toFixed(2)}x</div>}
          {phase === "cashed" && <div style={{ color: "#76AD25", fontWeight: 700, animation: "pw-pop .4s cubic-bezier(.34,1.56,.64,1)" }}>Cashed out at {cashedAt?.toFixed(2)}x — won ${(bet * (cashedAt??1)).toFixed(2)}</div>}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div style={{ display: "flex", gap: 5, marginBottom: 16, flexWrap: "wrap", justifyContent: "center" }}>
            {history.map((h,i) => (
              <span key={i} style={{ padding: "2px 8px", borderRadius: 99, background: h < 2 ? "rgba(239,68,68,.2)" : "rgba(118,173,37,.2)", color: h < 2 ? "#EF4444" : "#76AD25", fontSize: "0.72rem", fontWeight: 700 }}>
                {h.toFixed(2)}x
              </span>
            ))}
          </div>
        )}

        {phase === "bet" || phase === "crashed" || phase === "cashed" ? (
          <div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: "0.75rem", color: T.text2, marginBottom: 6 }}>Auto cash-out at: {autoCashout.toFixed(1)}x</label>
              <input type="range" className="pw-range" min={1.1} max={10} step={0.1} value={autoCashout} onChange={e => setAutoCashout(parseFloat(e.target.value))} style={{ width: "100%" }} />
            </div>
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
              <BetSelector bet={bet} setBet={setBet} max={Math.min(balance, 100)} bets={[5,10,25,50,100]} />
            </div>
            <button onClick={startGame} disabled={balance < bet} style={{ width: "100%", padding: "14px", background: "#f59e0b", color: "#000", border: "none", borderRadius: 10, fontWeight: 900, cursor: "pointer", fontFamily: FONT }}>
              {phase === "bet" ? `Launch — $${bet}` : `Play Again — $${bet}`}
            </button>
          </div>
        ) : (
          <button onClick={manualCashout} style={{ width: "100%", padding: "14px", background: "#76AD25", color: T.text, border: "none", borderRadius: 10, fontWeight: 900, fontSize: "1rem", cursor: "pointer", fontFamily: FONT, animation: "pulse 1s infinite" }}>
            CASH OUT ${(bet * multiplier).toFixed(2)}
          </button>
        )}
      </div>
      <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 12, padding: "12px 16px" }}>
        <div style={{ fontWeight: 700, color: "#fca5a5", fontSize: "0.82rem", marginBottom: 4 }}>FOMO: The Most Expensive Emotion</div>
        <p style={{ color: T.text3, fontSize: "0.78rem", lineHeight: 1.6 }}>Crash games are designed to make you hold too long. The multiplier climbing feels amazing — right until it does not. Set an auto cash-out target and stick to it. Discipline beats instinct every time.</p>
      </div>
      <style>{`@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.01)} }`}</style>
    </div>
  );
}

// ── MAIN CASINO PAGE ──────────────────────────────────────────────────────
export default function CasinoPage() {
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

  const { state, casinoWin, casinoLoss } = useGame();
  const balance = state?.balance ?? 5000;
  const [gameTab, setGameTab] = useState("Slots" as GameTab);

  const stats = [
    { label: "Balance", val: `$${balance.toFixed(2)}`, color: "#f59e0b" },
    { label: "Session", val: gameTab, color: T.text2 },
  ];

  return (
    <AuthGuard>
      <div style={{ minHeight: "100vh", background: T.bg }}>
        <Nav />

        <div style={{ padding: "28px 1rem 16px", textAlign: "center", maxWidth: 780, margin: "0 auto" }}>
          <h1 style={{ fontSize: "clamp(1.5rem,4vw,2.25rem)", fontWeight: 900, color: T.text, marginBottom: 6, fontFamily: FONT }}>
            PocketWise Casino
          </h1>
          <p style={{ color: T.text2, fontSize: "0.875rem", marginBottom: 16, fontFamily: FONT }}>
            Learn why the house always wins — with your real portfolio balance at stake.
          </p>
          <div style={{ display: "inline-flex", gap: 16, background: "rgba(0,0,0,.3)", border: "1px solid #1a4030", borderRadius: 12, padding: "10px 20px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.65rem", color: T.text2, textTransform: "uppercase", letterSpacing: ".05em" }}>Balance</div>
              <div style={{ fontWeight: 800, color: "#f59e0b", fontSize: "1.1rem", fontFamily: FONT }}>${balance.toFixed(2)}</div>
            </div>
            <div style={{ width: 1, background: "#1a4030" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.65rem", color: T.text2, textTransform: "uppercase", letterSpacing: ".05em" }}>Game</div>
              <div style={{ fontWeight: 800, color: T.text, fontSize: "1.1rem", fontFamily: FONT }}>{gameTab}</div>
            </div>
          </div>
        </div>

        {/* Game tabs */}
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 1rem 20px" }}>
          <div style={{ background: "rgba(0,0,0,.4)", border: "1px solid #1a4030", borderRadius: 9999, padding: 4, display: "flex", gap: 2, overflowX: "auto" }}>
            {GAME_TABS.map(t => (
              <button key={t} onClick={() => setGameTab(t)} style={{ padding: "8px 16px", borderRadius: 9999, whiteSpace: "nowrap", background: gameTab === t ? "#f59e0b" : "transparent", color: gameTab === t ? "#000" : "#8b9dc3", border: "none", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", fontFamily: FONT, transition: "all .2s cubic-bezier(.34,1.56,.64,1)", transform: gameTab === t ? "scale(1.06)" : "scale(1)", boxShadow: gameTab === t ? "0 4px 14px rgba(245,158,11,.4)" : "none" }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 580, margin: "0 auto", padding: "0 1rem 60px", fontFamily: FONT }}>
          {gameTab === "Slots"     && <SlotsGame     balance={balance} onWin={casinoWin} onLoss={casinoLoss} />}
          {gameTab === "Blackjack" && <BlackjackGame balance={balance} onWin={casinoWin} onLoss={casinoLoss} />}
          {gameTab === "Roulette"  && <RouletteGame  balance={balance} onWin={casinoWin} onLoss={casinoLoss} />}
          {gameTab === "Sports"    && <SportsGame    balance={balance} onWin={casinoWin} onLoss={casinoLoss} />}
          {gameTab === "Mines"     && <MinesGame     balance={balance} onWin={casinoWin} onLoss={casinoLoss} />}
          {gameTab === "Crash"     && <CrashGame     balance={balance} onWin={casinoWin} onLoss={casinoLoss} />}
        </div>

        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </AuthGuard>
  );
}
