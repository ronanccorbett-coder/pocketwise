"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTheme } from "@/lib/theme";
import { useGame } from "@/lib/gameContext";
import {
  AlertTriangle, ChevronUp, ChevronDown, BarChart2,
  Plus, Minus, Check, X, BookOpen, Zap,
} from "lucide-react";

const FONT = "Inter, system-ui, sans-serif";

// ── Realistic price engine ────────────────────────────────────────────────
interface SimState {
  price: number; trend: number; trendDur: number; momentum: number; vol: number;
}

function initSim(base: number, vol: number): SimState {
  return { price: base, trend: (Math.random()-0.5)*0.3, trendDur: 30+Math.floor(Math.random()*50), momentum: 0, vol };
}

function stepPrice(s: SimState, baseVol: number): { price: number; s: SimState } {
  let { price, trend, trendDur, momentum, vol } = s;
  // Volatility clustering
  vol = Math.random() < 0.03 ? baseVol*(0.5+Math.random()*3) : vol*0.92+baseVol*0.08;
  // Trend cycle
  if (--trendDur <= 0) {
    trend = trend*0.25 + (Math.random()-0.5)*0.7;
    trend = Math.max(-0.55, Math.min(0.55, trend));
    trendDur = 12 + Math.floor(Math.random()*70);
  }
  const move = trend*vol*0.28 + (Math.random()-0.5)*vol*1.6 + momentum*0.22;
  momentum = move * 0.35;
  const p = Math.max(price*0.001, price*(1+move));
  return { price: p, s: { price: p, trend, trendDur, momentum, vol } };
}

function buildCandles(base: number, vol: number, n: number): { candles: Candle[]; state: SimState } {
  let s = initSim(base, vol);
  const candles: Candle[] = [];
  const now = Date.now();
  for (let i = n-1; i >= 0; i--) {
    const o = s.price;
    let h=o, l=o, c=o;
    for (let j=0; j<10; j++) {
      const r = stepPrice(s, vol); s=r.s;
      h=Math.max(h,r.price); l=Math.min(l,r.price); c=r.price;
    }
    candles.push({ t: now-i*60000, o, h, l, c, v: Math.floor(40000+Math.random()*180000) });
  }
  return { candles, state: s };
}

type Candle = { t:number; o:number; h:number; l:number; c:number; v:number };
type Order  = { id:string; symbol:string; side:"buy"|"sell"; type:"market"|"limit"|"stop"; qty:number; price:number; sl?:number; tp?:number; status:"open"|"filled"|"cancelled"; openTime:number; pnl?:number };

// ── Instruments ───────────────────────────────────────────────────────────
const INSTRUMENTS = [
  { symbol:"NZX50",  name:"NZX 50",          base:11800, vol:0.007, type:"index" },
  { symbol:"AIR",    name:"Air New Zealand",  base:0.62,  vol:0.016, type:"stock" },
  { symbol:"ATM",    name:"A2 Milk",          base:6.40,  vol:0.020, type:"stock" },
  { symbol:"FPH",    name:"Fisher & Paykel",  base:28.50, vol:0.011, type:"stock" },
  { symbol:"XAUUSD", name:"Gold (oz)",        base:2340,  vol:0.005, type:"commodity" },
  { symbol:"NZDUSD", name:"NZD/USD",          base:0.608, vol:0.004, type:"forex" },
  { symbol:"BTC",    name:"Bitcoin",          base:67000, vol:0.030, type:"crypto" },
];

// ── Tutorial slides ───────────────────────────────────────────────────────
const DT_TUTORIAL = [
  { title:"What is Day Trading?", body:"Day trading means buying and selling financial instruments within the same day — sometimes within minutes. Unlike long-term investing, you aim to profit from short-term price movements. It is high risk and requires discipline.", highlight:"Day trading = profiting from short-term price swings" },
  { title:"Reading a Candlestick Chart", body:"Each candle represents one minute of trading. The body shows the open and close price. Green candles mean price went UP (close above open). Red candles mean price went DOWN. The wicks show the highest and lowest price reached during that minute.", highlight:"Green candle = price rose. Red = price fell." },
  { title:"Market vs Limit Orders", body:"Market order: executes immediately at the current price. Limit order: only executes when price reaches YOUR chosen level. Market orders guarantee execution but not price. Limit orders guarantee price but may not fill.", highlight:"Market = instant fill. Limit = your price, maybe." },
  { title:"Stop Loss and Take Profit", body:"Stop Loss (SL): automatically closes your trade if price moves AGAINST you by a set amount, limiting your loss. Take Profit (TP): automatically closes when price moves IN YOUR FAVOUR. Always set both — never trade without a stop loss.", highlight:"SL limits losses. TP locks in gains. Always use both." },
  { title:"Leverage", body:"Leverage lets you control a larger position than your cash. 5x leverage means $1,000 controls $5,000 of assets. This amplifies BOTH gains and losses. At 5x, a 1% price move = 5% gain or loss on your capital. Never use high leverage without a stop loss.", highlight:"Leverage amplifies wins AND losses equally." },
  { title:"Bid and Ask (the Spread)", body:"The BID price is what buyers will pay. The ASK price is what sellers want. The difference is the SPREAD — this is the broker's fee. When you BUY you pay the higher ASK. When you SELL you get the lower BID. The spread is an instant cost the moment you enter.", highlight:"You always buy at ASK, sell at BID." },
  { title:"Quiz", body:"", quiz: { q:"You buy 10 shares at $5.00 with 2x leverage and a stop loss at $4.75. The price drops to $4.75. What is your approximate loss?", opts:["$2.50","$5.00","$25.00","$50.00"], correct:1, exp:"Position size = 10 x $5 x 2 (leverage) = $100. Price dropped 5%. Loss = $100 x 5% = $5.00. Stop loss saved you from a larger loss." } },
];

// ── Chart with draggable SL/TP lines ──────────────────────────────────────
function TradingChart({
  candles, slPrice, tpPrice, entryPrice, side,
  onSlChange, onTpChange, isDark
}: {
  candles: Candle[]; slPrice: number; tpPrice: number; entryPrice: number; side: "buy"|"sell";
  onSlChange: (p:number)=>void; onTpChange: (p:number)=>void; isDark: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<"sl"|"tp"|null>(null);
  const [dims, setDims] = useState({ w: 700, h: 320 });

  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setDims({ w: e.contentRect.width, h: 320 }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const view = candles.slice(-60);
  if (view.length < 2) return <div style={{ height: dims.h, background: isDark ? "#080e1e" : "#f8fafc", borderRadius: 8 }} />;

  const pad = { top: 12, bottom: 28, left: 4, right: 68 };
  const chartW = dims.w - pad.left - pad.right;
  const chartH = dims.h - pad.top - pad.bottom;

  const allPrices = view.flatMap(c => [c.h, c.l]);
  if (slPrice > 0) allPrices.push(slPrice);
  if (tpPrice > 0) allPrices.push(tpPrice);
  if (entryPrice > 0) allPrices.push(entryPrice);
  const minP = Math.min(...allPrices) * 0.9995;
  const maxP = Math.max(...allPrices) * 1.0005;
  const range = maxP - minP || 1;

  const dec = view[0]?.c > 100 ? 2 : view[0]?.c > 1 ? 3 : 5;
  const cw = chartW / view.length;
  const candleW = Math.max(1.5, cw * 0.65);

  function py(p: number) { return pad.top + ((maxP - p) / range) * chartH; }
  function priceFromY(y: number) { return maxP - ((y - pad.top) / chartH) * range; }

  // Grid
  const gridLines: number[] = [];
  const step = range / 5;
  for (let i = 0; i <= 5; i++) gridLines.push(minP + step * i);

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const p = Math.max(minP, Math.min(maxP, priceFromY(y)));
    if (dragging === "sl") onSlChange(parseFloat(p.toFixed(dec)));
    else onTpChange(parseFloat(p.toFixed(dec)));
  }

  function handleMouseUp() { setDragging(null); }

  const lines = [
    slPrice > 0 && { price: slPrice, color: "#ef5350", label: `SL ${slPrice.toFixed(dec)}`, key: "sl" as const },
    tpPrice > 0 && { price: tpPrice, color: "#26a69a", label: `TP ${tpPrice.toFixed(dec)}`, key: "tp" as const },
    entryPrice > 0 && { price: entryPrice, color: "#f59e0b", label: `Entry ${entryPrice.toFixed(dec)}`, key: null },
  ].filter(Boolean) as { price: number; color: string; label: string; key: "sl"|"tp"|null }[];

  return (
    <svg ref={svgRef} width={dims.w} height={dims.h}
      onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
      style={{ display: "block", cursor: dragging ? "ns-resize" : "default", userSelect: "none" }}>
      <rect width={dims.w} height={dims.h} fill={isDark ? "#080e1e" : "#f8fafc"} rx="6" />

      {/* Grid lines */}
      {gridLines.map((p, i) => (
        <g key={i}>
          <line x1={pad.left} y1={py(p)} x2={dims.w-pad.right} y2={py(p)}
            stroke={isDark?"rgba(255,255,255,.05)":"rgba(0,0,0,.06)"} strokeDasharray="3,4" />
          <text x={dims.w-pad.right+4} y={py(p)+4} fill={isDark?"#4a6a8a":"#94a3b8"} fontSize="9" fontFamily="monospace">
            {p.toFixed(dec)}
          </text>
        </g>
      ))}

      {/* Candles */}
      {view.map((c, i) => {
        const x = pad.left + i*cw + cw/2;
        const up = c.c >= c.o;
        const col = up ? "#26a69a" : "#ef5350";
        const bodyT = py(Math.max(c.o,c.c));
        const bodyH = Math.max(1, Math.abs(py(c.o)-py(c.c)));
        return (
          <g key={i}>
            <line x1={x} y1={py(c.h)} x2={x} y2={py(c.l)} stroke={col} strokeWidth="1" />
            <rect x={x-candleW/2} y={bodyT} width={candleW} height={bodyH} fill={col}
              opacity={i === view.length-1 ? 1 : 0.85} />
          </g>
        );
      })}

      {/* Time labels */}
      {view.filter((_,i) => i%12===0).map((c, _, arr) => {
        const i = view.indexOf(c);
        const x = pad.left + i*cw + cw/2;
        return <text key={i} x={x} y={dims.h-8} fill={isDark?"#4a6a8a":"#94a3b8"} fontSize="9" textAnchor="middle" fontFamily="monospace">
          {new Date(c.t).toLocaleTimeString("en-NZ",{hour:"2-digit",minute:"2-digit"})}
        </text>;
      })}

      {/* SL / TP / Entry lines */}
      {lines.map(line => {
        const y = py(line.price);
        const isDraggable = line.key !== null;
        return (
          <g key={line.label}>
            <line x1={pad.left} y1={y} x2={dims.w-pad.right} y2={y}
              stroke={line.color} strokeWidth={isDraggable?1.5:1} strokeDasharray={isDraggable?"6,3":"4,2"} opacity="0.9" />
            {/* Drag handle */}
            {isDraggable && (
              <g onMouseDown={e => { e.preventDefault(); setDragging(line.key!); }}
                style={{ cursor: "ns-resize" }}>
                <rect x={pad.left} y={y-10} width={dims.w-pad.right-pad.left} height={20} fill="transparent" />
                <rect x={dims.w-pad.right-36} y={y-9} width={34} height={18} rx="4"
                  fill={line.color} opacity="0.15" />
                <rect x={dims.w-pad.right-36} y={y-9} width={34} height={18} rx="4"
                  fill="none" stroke={line.color} strokeWidth="1" opacity="0.6" />
              </g>
            )}
            {/* Label */}
            <rect x={dims.w-pad.right+1} y={y-9} width={66} height={18} fill={line.color} rx="3" />
            <text x={dims.w-pad.right+34} y={y+4} fill="#fff" fontSize="9" textAnchor="middle"
              fontFamily="monospace" fontWeight="bold">{line.label}</text>
          </g>
        );
      })}

      {/* Current price ticker */}
      {view.length > 0 && (() => {
        const last = view[view.length-1];
        const y = py(last.c);
        const up = last.c >= (view[view.length-2]?.c ?? last.c);
        const col = up ? "#26a69a" : "#ef5350";
        return (
          <g>
            <line x1={pad.left} y1={y} x2={dims.w-pad.right} y2={y}
              stroke={col} strokeWidth="1" strokeDasharray="2,4" opacity="0.5" />
            <rect x={dims.w-pad.right+1} y={y-9} width={66} height={18} fill={col} rx="3" />
            <text x={dims.w-pad.right+34} y={y+4} fill="#fff" fontSize="9" textAnchor="middle"
              fontFamily="monospace" fontWeight="bold">{last.c.toFixed(dec)}</text>
          </g>
        );
      })()}
    </svg>
  );
}

// ── Tutorial modal ────────────────────────────────────────────────────────
function DayTradingTutorial({ onComplete, isDark }: { onComplete: ()=>void; isDark: boolean }) {
  const [step, setStep] = useState(0);
  const [ans, setAns]   = useState<number|null>(null);
  const [done, setDone] = useState(false);
  const T = { card: isDark?"#111c30":"#fff", text: isDark?"#fff":"#0d1526", text2: isDark?"#8b9dc3":"#475569", text3: isDark?"#4a6a8a":"#94a3b8", border: isDark?"rgba(255,255,255,.08)":"rgba(0,0,0,.08)", bg3: isDark?"#1a2540":"#f8fafc", accent: "#f59e0b" };
  const slide = DT_TUTORIAL[step];
  const total = DT_TUTORIAL.length;
  const isQuiz = !!slide.quiz;
  const canNext = !isQuiz || done;

  function handleAns(i: number) {
    if (ans !== null) return;
    setAns(i);
    if (i === slide.quiz!.correct) setTimeout(() => setDone(true), 800);
  }

  function next() {
    if (!canNext) return;
    if (step < total-1) { setStep(s=>s+1); setAns(null); setDone(false); }
    else onComplete();
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:700, background:"rgba(0,0,0,.75)", display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", fontFamily:FONT }}>
      <div style={{ background:T.card, border:`1.5px solid ${T.accent}33`, borderRadius:20, width:"100%", maxWidth:520, boxShadow:"0 24px 64px rgba(0,0,0,.5)", overflow:"hidden" }}>
        {/* Progress bar */}
        <div style={{ height:3, background:isDark?"#1a2540":"#f1f5f9" }}>
          <div style={{ height:3, background:T.accent, width:`${(step/(total-1))*100}%`, transition:"width .5s cubic-bezier(.34,1.56,.64,1)", boxShadow:`0 0 8px ${T.accent}` }} />
        </div>
        <div style={{ padding:"20px 24px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <BarChart2 size={18} color={T.accent} />
              <span style={{ fontWeight:800, color:T.text, fontSize:"0.95rem" }}>{slide.title}</span>
            </div>
            <span style={{ fontSize:"0.72rem", color:T.text3 }}>{step+1}/{total}</span>
          </div>
          {!isQuiz ? (
            <>
              <p style={{ color:T.text2, fontSize:"0.875rem", lineHeight:1.7, marginBottom:14 }}>{slide.body}</p>
              {slide.highlight && (
                <div style={{ background:`${T.accent}12`, border:`1.5px solid ${T.accent}30`, borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"center", gap:8 }}>
                  <Zap size={14} color={T.accent} fill={T.accent} />
                  <span style={{ fontWeight:700, color:T.accent, fontSize:"0.82rem" }}>{slide.highlight}</span>
                </div>
              )}
            </>
          ) : (
            <>
              <p style={{ color:T.text2, fontSize:"0.875rem", marginBottom:14 }}>Test your knowledge before you start trading.</p>
              <div style={{ background:T.bg3, borderRadius:10, padding:"14px", marginBottom:12 }}>
                <p style={{ fontWeight:700, color:T.text, fontSize:"0.875rem", marginBottom:12 }}>{slide.quiz!.q}</p>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {slide.quiz!.opts.map((opt, i) => {
                    const isCorrect = i===slide.quiz!.correct;
                    const isSel = ans===i;
                    const show = ans!==null;
                    let bg=T.bg3, border=T.border, col=T.text2;
                    if (show&&isCorrect){ bg="rgba(38,166,154,.12)"; border="rgba(38,166,154,.4)"; col="#26a69a"; }
                    else if (show&&isSel&&!isCorrect){ bg="rgba(239,83,80,.1)"; border="rgba(239,83,80,.3)"; col="#ef5350"; }
                    return (
                      <button key={i} onClick={()=>handleAns(i)} disabled={ans!==null} style={{ textAlign:"left", padding:"9px 12px", borderRadius:8, background:bg, border:`1.5px solid ${border}`, color:col, fontWeight:isSel||isCorrect?700:500, fontSize:"0.82rem", cursor:ans!==null?"default":"pointer", fontFamily:FONT, display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ width:20,height:20,borderRadius:"50%",background:"rgba(255,255,255,.05)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.7rem",fontWeight:800,flexShrink:0 }}>
                          {show&&isCorrect?<Check size={11}/>:String.fromCharCode(65+i)}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {ans!==null&&(
                  <div style={{ marginTop:10, padding:"8px 10px", background:ans===slide.quiz!.correct?"rgba(38,166,154,.08)":"rgba(239,83,80,.06)", borderRadius:8, fontSize:"0.75rem", color:T.text2 }}>
                    <strong style={{ color:ans===slide.quiz!.correct?"#26a69a":"#ef5350" }}>{ans===slide.quiz!.correct?"Correct!":"Not quite — "}</strong>{" "}{slide.quiz!.exp}
                    {ans!==slide.quiz!.correct&&<button onClick={()=>{setAns(null);}} style={{ marginLeft:8, background:"none", border:"none", color:"#60a5fa", fontWeight:700, fontSize:"0.75rem", cursor:"pointer", fontFamily:FONT }}>Try again</button>}
                  </div>
                )}
              </div>
            </>
          )}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:16 }}>
            <button onClick={()=>{if(step>0){setStep(s=>s-1);setAns(null);setDone(false);}}} disabled={step===0} style={{ background:"none", border:"none", color:step===0?T.text3:T.text2, fontWeight:600, fontSize:"0.82rem", cursor:step===0?"default":"pointer", fontFamily:FONT }}>
              Back
            </button>
            <div style={{ display:"flex", gap:5 }}>
              {DT_TUTORIAL.map((_,i)=>(
                <div key={i} style={{ width:i===step?18:6, height:6, borderRadius:99, background:i<step?T.accent:i===step?T.accent:T.border, opacity:i<step?0.5:1, transition:"all .3s cubic-bezier(.34,1.56,.64,1)" }} />
              ))}
            </div>
            <button onClick={next} disabled={!canNext} className={canNext?"btn-3d-amber":""} style={{ padding:"9px 20px", fontSize:"0.82rem", fontWeight:700, background:!canNext?T.bg3:undefined, color:!canNext?T.text3:undefined, border:"none", borderRadius:10, cursor:!canNext?"not-allowed":"pointer", fontFamily:FONT }}>
              {step<total-1?"Next →":"Start Trading"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Day Trading Component (embedded in portfolio) ────────────────────
export default function DayTradingTerminal() {
  const { isDark } = useTheme();
  const { state, addBalance } = useGame() as any;
  const balance = state?.balance ?? 0;

  const T = {
    bg:     isDark?"#080e1e":"#f0f4f8",
    bg2:    isDark?"#0d1526":"#fff",
    bg3:    isDark?"#111c30":"#f8fafc",
    card:   isDark?"#111c30":"#fff",
    panel:  isDark?"#0a1426":"#fff",
    text:   isDark?"#fff":"#0d1526",
    text2:  isDark?"#8b9dc3":"#475569",
    text3:  isDark?"#4a6a8a":"#94a3b8",
    border: isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)",
    border2:isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.16)",
    input:  isDark?"rgba(255,255,255,.06)":"#f8fafc",
    green:  "#26a69a", red: "#ef5350", gold: "#f59e0b",
  };

  const [sym, setSym]             = useState("NZX50");
  const [candles, setCandles]     = useState<Candle[]>([]);
  const [simState, setSimState]   = useState<any>(null);
  const [side, setSide]           = useState<"buy"|"sell">("buy");
  const [orderType, setOrderType] = useState<"market"|"limit"|"stop">("market");
  const [qty, setQty]             = useState(1);
  const [limitPx, setLimitPx]     = useState(0);
  const [slPrice, setSlPrice]     = useState(0);
  const [tpPrice, setTpPrice]     = useState(0);
  const [leverage, setLeverage]   = useState(1);
  const [orders, setOrders]       = useState<Order[]>([]);
  const [activePanel, setActivePanel] = useState<"positions"|"history">("positions");
  const [notif, setNotif]         = useState<string|null>(null);
  const [showTutorial, setShowTutorial] = useState(() => localStorage.getItem("pw_dt_tutorial") !== "1");
  const tickRef = useRef<any>(null);

  const inst = INSTRUMENTS.find(i => i.symbol === sym)!;
  const price = candles.length>0 ? candles[candles.length-1].c : inst.base;
  const prevC = candles.length>1 ? candles[candles.length-2].c : price;
  const change = price-prevC;
  const changePct = prevC>0?(change/prevC)*100:0;
  const spread = price*0.00018;
  const bid = price-spread, ask = price+spread;
  const dec = price>100?2:price>1?3:5;

  // Init candles on symbol change
  useEffect(() => {
    const { candles: c, state: s } = buildCandles(inst.base, inst.vol, 80);
    setCandles(c);
    setSimState(s);
    setSlPrice(parseFloat((inst.base*(side==="buy"?0.983:1.017)).toFixed(dec)));
    setTpPrice(parseFloat((inst.base*(side==="buy"?1.025:0.975)).toFixed(dec)));
    setLimitPx(parseFloat(inst.base.toFixed(dec)));
  }, [sym]);

  // Update SL/TP defaults when side changes
  useEffect(() => {
    if (price > 0) {
      setSlPrice(parseFloat((price*(side==="buy"?0.983:1.017)).toFixed(dec)));
      setTpPrice(parseFloat((price*(side==="buy"?1.025:0.975)).toFixed(dec)));
    }
  }, [side]);

  // Tick price
  useEffect(() => {
    if (!simState) return;
    tickRef.current = setInterval(() => {
      setSimState((s: any) => {
        if (!s) return s;
        const { price: p, s: newS } = stepPrice(s, inst.vol);
        setCandles(prev => {
          if (!prev.length) return prev;
          const last = prev[prev.length-1];
          const now = Date.now();
          if (now-last.t > 60000) {
            return [...prev.slice(-99), { t:now, o:last.c, h:p, l:p, c:p, v:Math.floor(Math.random()*80000) }];
          }
          const up = { ...last, c:p, h:Math.max(last.h,p), l:Math.min(last.l,p), v:last.v+Math.floor(Math.random()*500) };
          return [...prev.slice(0,-1), up];
        });
        return newS;
      });
    }, 900);
    return () => clearInterval(tickRef.current);
  }, [sym, simState===null]);

  // Tick open positions — check SL/TP
  useEffect(() => {
    setOrders(prev => prev.map(o => {
      if (o.status !== "open") return o;
      const pnl = o.side==="buy" ? (bid-o.price)*o.qty*leverage : (o.price-ask)*o.qty*leverage;
      if (o.sl && o.side==="buy" && bid<=o.sl) { notify(`SL hit — ${o.symbol} closed`); addBalance(pnl); return {...o,status:"filled",pnl}; }
      if (o.tp && o.side==="buy" && bid>=o.tp)  { notify(`TP hit +$${pnl.toFixed(2)}`);  addBalance(pnl); return {...o,status:"filled",pnl}; }
      if (o.sl && o.side==="sell" && ask>=o.sl) { notify(`SL hit — ${o.symbol} closed`); addBalance(pnl); return {...o,status:"filled",pnl}; }
      if (o.tp && o.side==="sell" && ask<=o.tp) { notify(`TP hit +$${pnl.toFixed(2)}`);  addBalance(pnl); return {...o,status:"filled",pnl}; }
      return {...o,pnl};
    }));
  }, [candles.length, price]);

  function notify(msg: string) { setNotif(msg); setTimeout(()=>setNotif(null),3500); }

  function placeOrder() {
    const execPx = orderType==="market"?(side==="buy"?ask:bid):limitPx;
    const cost = execPx*qty;
    if (orderType==="market" && cost>balance) { notify("Insufficient balance"); return; }
    const o: Order = { id:Math.random().toString(36).slice(2,8), symbol:sym, side, type:orderType, qty, price:execPx, sl:slPrice||undefined, tp:tpPrice||undefined, status:"open", openTime:Date.now() };
    if (orderType==="market") addBalance(-cost);
    setOrders(p=>[o,...p]);
    notify(`${side.toUpperCase()} ${qty} ${sym} @ ${execPx.toFixed(dec)}`);
  }

  function closePos(o: Order) {
    const closePx = o.side==="buy"?bid:ask;
    const pnl = o.side==="buy" ? (closePx-o.price)*o.qty*leverage : (o.price-closePx)*o.qty*leverage;
    addBalance(o.price*o.qty+pnl);
    setOrders(p=>p.map(x=>x.id===o.id?{...x,status:"filled",pnl}:x));
    notify(`Closed — ${pnl>=0?"+":" "}$${pnl.toFixed(2)}`);
  }

  const openPos = orders.filter(o=>o.status==="open");
  const totalPnL = openPos.reduce((s,o)=>s+(o.pnl??0),0);

  const entryPrice = openPos.find(o=>o.symbol===sym)?.price ?? 0;

  return (
    <div style={{ background:T.bg, borderRadius:16, overflow:"hidden", border:`1px solid ${T.border}`, fontFamily:FONT }}>
      {showTutorial && (
        <DayTradingTutorial isDark={isDark} onComplete={()=>{ localStorage.setItem("pw_dt_tutorial","1"); setShowTutorial(false); }} />
      )}

      {notif && (
        <div style={{ position:"absolute", top:60, right:12, zIndex:50, background:T.card, border:`1px solid ${T.border2}`, borderRadius:10, padding:"10px 16px", fontSize:"0.82rem", color:T.text, boxShadow:"0 8px 24px rgba(0,0,0,.3)", animation:"pw-slide-up .3s ease", maxWidth:280, pointerEvents:"none" }}>
          {notif}
        </div>
      )}

      {/* Instrument tabs */}
      <div style={{ background:T.panel, borderBottom:`1px solid ${T.border}`, display:"flex", overflowX:"auto" as const, paddingLeft:4 }}>
        {INSTRUMENTS.map(i=>(
          <button key={i.symbol} onClick={()=>setSym(i.symbol)} style={{ padding:"10px 14px", background:"none", border:"none", borderBottom:sym===i.symbol?`2px solid ${T.gold}`:"2px solid transparent", color:sym===i.symbol?T.text:T.text3, fontWeight:sym===i.symbol?700:400, fontSize:"0.75rem", cursor:"pointer", fontFamily:FONT, whiteSpace:"nowrap" as const, flexShrink:0 }}>
            <span style={{ color:sym===i.symbol?T.gold:T.text2, fontWeight:800 }}>{i.symbol}</span>
            <span style={{ marginLeft:4, fontSize:"0.62rem", color:T.text3 }}>{i.type}</span>
          </button>
        ))}
        {/* Tutorial reset */}
        <button onClick={()=>setShowTutorial(true)} style={{ marginLeft:"auto", padding:"8px 12px", background:"none", border:"none", color:T.text3, cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:"0.72rem", flexShrink:0 }}>
          <BookOpen size={12}/> Tutorial
        </button>
      </div>

      {/* Price header */}
      <div style={{ background:T.panel, borderBottom:`1px solid ${T.border}`, padding:"10px 14px", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
        <div>
          <div style={{ fontWeight:900, color:T.text, fontSize:"1.5rem", lineHeight:1, fontFamily:"monospace" }}>{price.toFixed(dec)}</div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:2 }}>
            <span style={{ color:changePct>=0?T.green:T.red, fontWeight:700, fontSize:"0.8rem", display:"flex", alignItems:"center", gap:2 }}>
              {changePct>=0?<ChevronUp size={12}/>:<ChevronDown size={12}/>}
              {changePct>=0?"+":""}{changePct.toFixed(3)}%
            </span>
          </div>
        </div>
        {[
          {l:"BID",v:bid.toFixed(dec),c:T.red},{l:"ASK",v:ask.toFixed(dec),c:T.green},
          {l:"HIGH",v:candles.length>0?Math.max(...candles.slice(-60).map(c=>c.h)).toFixed(dec):"-",c:T.green},
          {l:"LOW",v:candles.length>0?Math.min(...candles.slice(-60).map(c=>c.l)).toFixed(dec):"-",c:T.red},
        ].map(s=>(
          <div key={s.l}>
            <div style={{ fontSize:"0.58rem", color:T.text3, textTransform:"uppercase" as const, letterSpacing:".04em" }}>{s.l}</div>
            <div style={{ fontWeight:700, color:s.c, fontSize:"0.8rem", fontFamily:"monospace" }}>{s.v}</div>
          </div>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", gap:12, flexShrink:0 }}>
          <div><div style={{ fontSize:"0.58rem", color:T.text3 }}>Balance</div><div style={{ fontWeight:800, color:T.text, fontSize:"0.875rem" }}>${balance.toFixed(2)}</div></div>
          {openPos.length>0&&<div><div style={{ fontSize:"0.58rem", color:T.text3 }}>P&L</div><div style={{ fontWeight:800, color:totalPnL>=0?T.green:T.red, fontSize:"0.875rem" }}>{totalPnL>=0?"+":""}${totalPnL.toFixed(2)}</div></div>}
        </div>
      </div>

      {/* Chart + order panel */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px" }}>
        {/* Chart */}
        <div>
          <div style={{ position:"relative" }}>
            <TradingChart candles={candles} slPrice={slPrice} tpPrice={tpPrice} entryPrice={entryPrice} side={side} onSlChange={setSlPrice} onTpChange={setTpPrice} isDark={isDark} />
            <div style={{ position:"absolute", top:6, left:8, fontSize:"0.65rem", color:T.text3, fontFamily:"monospace" }}>
              1m · Drag SL/TP lines on chart
            </div>
          </div>

          {/* Positions panel */}
          <div style={{ borderTop:`1px solid ${T.border}` }}>
            <div style={{ display:"flex", borderBottom:`1px solid ${T.border}` }}>
              {(["positions","history"] as const).map(t=>(
                <button key={t} onClick={()=>setActivePanel(t)} style={{ padding:"7px 14px", background:"none", border:"none", borderBottom:activePanel===t?`2px solid ${T.gold}`:"2px solid transparent", color:activePanel===t?T.text:T.text3, fontWeight:activePanel===t?700:400, fontSize:"0.72rem", cursor:"pointer", fontFamily:FONT, textTransform:"capitalize" as const }}>
                  {t} {t==="positions"&&openPos.length>0&&`(${openPos.length})`}
                </button>
              ))}
            </div>
            <div style={{ maxHeight:130, overflowY:"auto" as const, padding:"6px 8px" }}>
              {activePanel==="positions"&&(
                openPos.length===0
                  ?<div style={{ textAlign:"center", color:T.text3, fontSize:"0.75rem", padding:"14px 0" }}>No open positions</div>
                  :openPos.map(o=>(
                    <div key={o.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 6px", borderRadius:7, background:T.bg3, marginBottom:3, fontSize:"0.72rem" }}>
                      <span style={{ background:o.side==="buy"?"rgba(38,166,154,.15)":"rgba(239,83,80,.1)", color:o.side==="buy"?T.green:T.red, padding:"1px 6px", borderRadius:4, fontWeight:800, fontSize:"0.62rem" }}>{o.side.toUpperCase()}</span>
                      <span style={{ fontWeight:700, color:T.text }}>{o.symbol}</span>
                      <span style={{ color:T.text2 }}>x{o.qty}</span>
                      <span style={{ color:T.text3 }}>@ {o.price.toFixed(dec)}</span>
                      <span style={{ fontWeight:700, color:(o.pnl??0)>=0?T.green:T.red, marginLeft:"auto" }}>{(o.pnl??0)>=0?"+":" "}${(o.pnl??0).toFixed(2)}</span>
                      {o.sl&&<span style={{ color:T.red, fontSize:"0.62rem" }}>SL:{o.sl.toFixed(dec)}</span>}
                      {o.tp&&<span style={{ color:T.green, fontSize:"0.62rem" }}>TP:{o.tp.toFixed(dec)}</span>}
                      <button onClick={()=>closePos(o)} style={{ background:"rgba(239,83,80,.1)", border:"1px solid rgba(239,83,80,.2)", borderRadius:5, padding:"2px 7px", color:T.red, fontSize:"0.62rem", fontWeight:700, cursor:"pointer", fontFamily:FONT, flexShrink:0 }}>Close</button>
                    </div>
                  ))
              )}
              {activePanel==="history"&&(
                orders.filter(o=>o.status!=="open").length===0
                  ?<div style={{ textAlign:"center", color:T.text3, fontSize:"0.75rem", padding:"14px 0" }}>No closed orders</div>
                  :orders.filter(o=>o.status!=="open").slice(0,15).map(o=>(
                    <div key={o.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 6px", borderRadius:7, background:T.bg3, marginBottom:3, fontSize:"0.72rem" }}>
                      <span style={{ background:o.side==="buy"?"rgba(38,166,154,.1)":"rgba(239,83,80,.08)", color:o.side==="buy"?T.green:T.red, padding:"1px 6px", borderRadius:4, fontWeight:800, fontSize:"0.62rem" }}>{o.side.toUpperCase()}</span>
                      <span style={{ fontWeight:700, color:T.text }}>{o.symbol} x{o.qty}</span>
                      <span style={{ fontWeight:700, color:(o.pnl??0)>=0?T.green:T.red, marginLeft:"auto" }}>{(o.pnl??0)>=0?"+":" "}${(o.pnl??0).toFixed(2)}</span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Order panel */}
        <div style={{ borderLeft:`1px solid ${T.border}`, display:"flex", flexDirection:"column" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr" }}>
            <button onClick={()=>setSide("buy")} style={{ padding:"12px", background:side==="buy"?"rgba(38,166,154,.12)":"transparent", color:side==="buy"?T.green:T.text3, fontWeight:800, fontSize:"0.9rem", border:"none", borderBottom:`2px solid ${side==="buy"?T.green:"transparent"}`, cursor:"pointer", fontFamily:FONT, transition:"all .15s" }}>BUY</button>
            <button onClick={()=>setSide("sell")} style={{ padding:"12px", background:side==="sell"?"rgba(239,83,80,.1)":"transparent", color:side==="sell"?T.red:T.text3, fontWeight:800, fontSize:"0.9rem", border:"none", borderBottom:`2px solid ${side==="sell"?T.red:"transparent"}`, cursor:"pointer", fontFamily:FONT, transition:"all .15s" }}>SELL</button>
          </div>

          <div style={{ padding:"14px", display:"flex", flexDirection:"column", gap:12, flex:1 }}>
            {/* Order type */}
            <div>
              <label style={{ display:"block", fontSize:"0.6rem", color:T.text3, fontWeight:600, marginBottom:5, textTransform:"uppercase" as const, letterSpacing:".04em" }}>Order Type</label>
              <div style={{ display:"flex", background:T.bg3, border:`1px solid ${T.border}`, borderRadius:8, padding:2, gap:2 }}>
                {(["market","limit","stop"] as const).map(t=>(
                  <button key={t} onClick={()=>setOrderType(t)} style={{ flex:1, padding:"6px 4px", borderRadius:6, background:orderType===t?T.card:"transparent", color:orderType===t?T.text:T.text3, fontWeight:orderType===t?700:400, fontSize:"0.68rem", border:"none", cursor:"pointer", fontFamily:FONT, transition:"all .15s", textTransform:"capitalize" as const }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Qty */}
            <div>
              <label style={{ display:"block", fontSize:"0.6rem", color:T.text3, fontWeight:600, marginBottom:5, textTransform:"uppercase" as const, letterSpacing:".04em" }}>Quantity</label>
              <div style={{ display:"flex", alignItems:"center", background:T.input, border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden" }}>
                <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{ padding:"7px 10px", background:"none", border:"none", color:T.text2, cursor:"pointer", display:"flex" }}><Minus size={12}/></button>
                <input type="number" value={qty} min={1} onChange={e=>setQty(Math.max(1,parseInt(e.target.value)||1))} style={{ flex:1, background:"none", border:"none", color:T.text, fontFamily:"monospace", fontSize:"0.875rem", fontWeight:700, textAlign:"center" as const, outline:"none" }} />
                <button onClick={()=>setQty(q=>q+1)} style={{ padding:"7px 10px", background:"none", border:"none", color:T.text2, cursor:"pointer", display:"flex" }}><Plus size={12}/></button>
              </div>
            </div>

            {/* Limit price */}
            {orderType!=="market"&&(
              <div>
                <label style={{ display:"block", fontSize:"0.6rem", color:T.text3, fontWeight:600, marginBottom:5, textTransform:"uppercase" as const, letterSpacing:".04em" }}>{orderType==="limit"?"Limit Price":"Stop Price"}</label>
                <input type="number" value={limitPx} step="0.0001" onChange={e=>setLimitPx(parseFloat(e.target.value))} style={{ width:"100%", padding:"7px 10px", background:T.input, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, fontFamily:"monospace", fontSize:"0.875rem", outline:"none" }} />
              </div>
            )}

            {/* SL */}
            <div>
              <label style={{ display:"block", fontSize:"0.6rem", color:T.red, fontWeight:700, marginBottom:5, textTransform:"uppercase" as const, letterSpacing:".04em" }}>Stop Loss <span style={{ color:T.text3, fontWeight:400 }}>(drag on chart)</span></label>
              <input type="number" value={slPrice} step="0.0001" onChange={e=>setSlPrice(parseFloat(e.target.value))} style={{ width:"100%", padding:"7px 10px", background:"rgba(239,83,80,.06)", border:"1px solid rgba(239,83,80,.2)", borderRadius:8, color:T.red, fontFamily:"monospace", fontSize:"0.875rem", outline:"none" }} />
            </div>

            {/* TP */}
            <div>
              <label style={{ display:"block", fontSize:"0.6rem", color:T.green, fontWeight:700, marginBottom:5, textTransform:"uppercase" as const, letterSpacing:".04em" }}>Take Profit <span style={{ color:T.text3, fontWeight:400 }}>(drag on chart)</span></label>
              <input type="number" value={tpPrice} step="0.0001" onChange={e=>setTpPrice(parseFloat(e.target.value))} style={{ width:"100%", padding:"7px 10px", background:"rgba(38,166,154,.06)", border:"1px solid rgba(38,166,154,.2)", borderRadius:8, color:T.green, fontFamily:"monospace", fontSize:"0.875rem", outline:"none" }} />
            </div>

            {/* Leverage */}
            <div>
              <label style={{ display:"block", fontSize:"0.6rem", color:T.text3, fontWeight:600, marginBottom:5, textTransform:"uppercase" as const, letterSpacing:".04em" }}>Leverage: {leverage}x</label>
              <input type="range" min={1} max={10} step={1} value={leverage} onChange={e=>setLeverage(parseInt(e.target.value))} className="pw-range" style={{ width:"100%" }} />
              {leverage>4&&<div style={{ marginTop:4, display:"flex", alignItems:"center", gap:4, fontSize:"0.65rem", color:T.red }}><AlertTriangle size={10}/> High risk</div>}
            </div>

            {/* Summary */}
            <div style={{ background:T.bg3, border:`1px solid ${T.border}`, borderRadius:8, padding:"8px 10px", fontSize:"0.68rem" }}>
              {[
                ["Price",`${orderType==="market"?(side==="buy"?ask:bid).toFixed(dec):limitPx.toFixed(dec)}`],
                ["Cost",`$${((orderType==="market"?(side==="buy"?ask:bid):limitPx)*qty).toFixed(2)}`],
                ["Leverage",`${leverage}x (exposure: $${((orderType==="market"?(side==="buy"?ask:bid):limitPx)*qty*leverage).toFixed(2)})`],
              ].map(([l,v])=>(
                <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ color:T.text3 }}>{l}</span>
                  <span style={{ fontWeight:700, color:T.text, fontFamily:"monospace" }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Place order */}
            <button onClick={placeOrder} style={{ width:"100%", padding:"12px", background:side==="buy"?T.green:T.red, color:"#fff", border:"none", borderRadius:10, fontWeight:900, fontSize:"0.9rem", cursor:"pointer", fontFamily:FONT, boxShadow:`0 4px 0 ${side==="buy"?"#1a7a72":"#b52d2a"}, 0 6px 16px ${side==="buy"?"rgba(38,166,154,.3)":"rgba(239,83,80,.3)"}`, transition:"transform .08s, box-shadow .08s" }}
              onMouseDown={e=>{(e.currentTarget as any).style.transform="translateY(3px)";(e.currentTarget as any).style.boxShadow="none";}}
              onMouseUp={e=>{(e.currentTarget as any).style.transform="";(e.currentTarget as any).style.boxShadow=`0 4px 0 ${side==="buy"?"#1a7a72":"#b52d2a"}`;}} >
              {side==="buy"?"Buy":"Sell"} {inst.symbol}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
