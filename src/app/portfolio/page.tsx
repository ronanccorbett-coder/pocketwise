"use client";
import { useState } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import XPGate from "@/components/XPGate";
import { useGame, NZX_STOCKS } from "@/lib/gameContext";
import { useStockSimulator, sparklinePath } from "@/lib/stockSimulator";
import { DollarSign, TrendingUp, Car, AlertTriangle, Wallet, BarChart2, Plus, Minus } from "lucide-react";

type Tab = "Overview"|"Markets"|"Day Trading"|"Property"|"Loans"|"Assets";
const TABS:Tab[]=["Overview","Markets","Day Trading","Property","Loans","Assets"];

const PROPERTIES=[
  {name:"Auckland Apartment",price:485000,deposit:97000,weeklyRent:460,mortgageWeekly:620,suburb:"Ponsonby"},
  {name:"Wellington Terrace",price:620000,deposit:124000,weeklyRent:520,mortgageWeekly:790,suburb:"Te Aro"},
  {name:"Christchurch Section",price:290000,deposit:58000,weeklyRent:0,mortgageWeekly:370,suburb:"Riccarton"},
  {name:"Hamilton House",price:580000,deposit:116000,weeklyRent:480,mortgageWeekly:740,suburb:"Flagstaff"},
];
const LOAN_PRODUCTS=[
  {name:"Student Loan",principal:8000,rate:0,weekly:0,note:"Interest-free while in NZ"},
  {name:"Car Loan",principal:15000,rate:12.5,weekly:85,note:"Unsecured personal loan"},
  {name:"Personal Loan",principal:5000,rate:18.9,weekly:55,note:"High interest — use carefully"},
];
const ASSET_PRODUCTS=[
  {name:"Toyota Corolla 2020",category:"Vehicle",price:18500,dep:8},
  {name:"MacBook Pro",category:"Technology",price:2800,dep:20},
  {name:"Road Bike",category:"Recreation",price:1200,dep:10},
  {name:"Photography Kit",category:"Technology",price:900,dep:15},
  {name:"Delivery Scooter",category:"Vehicle",price:4500,dep:12},
];

export default function PortfolioPage(){
  const [tab,setTab]=useState<Tab>("Overview");
  const [buyQty,setBuyQty]=useState<Record<string,number>>({});
  const [notif,setNotif]=useState<string|null>(null);
  const {state,stocks,properties,loans,assets,buyStock,sellStock,buyProperty,takeLoan,buyAsset,canAccess}=useGame();
  const {prices,marketEvent}=useStockSimulator(30000);

  function notify(m:string){setNotif(m);setTimeout(()=>setNotif(null),3000);}

  const balance=state?.balance??5000;
  const netWorth=state?.netWorth??5000;
  const totalInvested=state?.totalInvested??0;
  const totalDebt=state?.totalDebt??0;

  return(
    <AuthGuard>
      <div style={{minHeight:"100vh",background:"#f1f5f9"}}>
        <Nav/>
        {notif&&<div style={{position:"fixed",bottom:24,right:24,zIndex:100,background:"#0d1526",color:"#fff",padding:"12px 20px",borderRadius:10,fontSize:"0.85rem",fontWeight:600,border:"1px solid #76AD25",boxShadow:"0 4px 20px rgba(0,0,0,.3)"}}>{notif}</div>}

        <div style={{background:"linear-gradient(135deg,#0d1526,#111c30)",padding:"28px 2rem"}}>
          <div style={{maxWidth:1200,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:16}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                <BarChart2 size={22} color="#76AD25"/>
                <h1 style={{fontSize:"1.4rem",fontWeight:800,color:"#fff"}}>PocketWise Portfolio</h1>
              </div>
              <p style={{color:"#8b9dc3",fontSize:"0.85rem"}}>Simulate real investing with virtual NZD. Learn by doing.</p>
            </div>
            <div style={{display:"flex",gap:10}}>
              <div style={{background:"rgba(255,255,255,.08)",borderRadius:12,padding:"12px 20px",textAlign:"center"}}>
                <div style={{fontSize:"0.68rem",color:"#8b9dc3",marginBottom:2}}>Cash Balance</div>
                <div style={{fontSize:"1.4rem",fontWeight:800,color:"#76AD25"}}>${balance.toFixed(2)}</div>
                <div style={{fontSize:"0.68rem",color:"#8b9dc3",marginTop:2}}>Virtual NZD</div>
              </div>
              <div style={{background:"rgba(255,255,255,.08)",borderRadius:12,padding:"12px 18px",textAlign:"center"}}>
                <div style={{fontSize:"0.68rem",color:"#8b9dc3",marginBottom:2}}>Net Worth</div>
                <div style={{fontSize:"1.4rem",fontWeight:800,color:netWorth>=5000?"#76AD25":"#EF4444"}}>${netWorth.toFixed(0)}</div>
              </div>
              <div style={{background:"rgba(255,255,255,.08)",borderRadius:12,padding:"12px 18px",textAlign:"center"}}>
                <div style={{fontSize:"0.68rem",color:"#8b9dc3",marginBottom:2}}>Streak</div>
                <div style={{fontSize:"1.4rem",fontWeight:800,color:"#f59e0b"}}>{state?.streak??0}</div>
                <div style={{fontSize:"0.68rem",color:"#8b9dc3",marginTop:2}}>{Math.max(1,state?.streak??1)}x XP</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{maxWidth:1200,margin:"0 auto",padding:"24px 1.5rem"}}>
          <div style={{display:"flex",gap:6,marginBottom:24,flexWrap:"wrap"}}>
            {TABS.map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{padding:"7px 16px",borderRadius:9999,background:tab===t?"#0d1526":"#fff",color:tab===t?"#fff":"#475569",border:`1px solid ${tab===t?"#0d1526":"#e2e8f0"}`,fontWeight:600,fontSize:"0.8rem",cursor:"pointer",fontFamily:"Inter,sans-serif"}}>{t}</button>
            ))}
          </div>

          {tab==="Overview"&&(
            <>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:12,marginBottom:20}}>
                {[
                  {label:"Cash Balance",val:`$${balance.toFixed(2)}`,color:"#76AD25",Icon:DollarSign,bg:"#e8f5d0",ic:"#76AD25"},
                  {label:"Investments",val:`$${totalInvested.toFixed(2)}`,color:"#3B82F6",Icon:TrendingUp,bg:"#eff6ff",ic:"#3B82F6"},
                  {label:"Physical Assets",val:`$${assets.reduce((s,a)=>s+a.currentValue,0).toFixed(2)}`,color:"#6b7280",Icon:Car,bg:"#f1f5f9",ic:"#6b7280"},
                  {label:"Total Debt",val:`$${totalDebt.toFixed(2)}`,color:"#EF4444",Icon:AlertTriangle,bg:"#fef2f2",ic:"#EF4444"},
                  {label:"Net Worth",val:`$${netWorth.toFixed(2)}`,color:netWorth>=5000?"#76AD25":"#EF4444",Icon:Wallet,bg:"#e8f5d0",ic:"#76AD25"},
                ].map(c=>(
                  <div key={c.label} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"18px"}}>
                    <div style={{width:36,height:36,borderRadius:9,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:10}}>
                      <c.Icon size={17} color={c.ic}/>
                    </div>
                    <div style={{fontSize:"0.78rem",color:"#94a3b8",marginBottom:4}}>{c.label}</div>
                    <div style={{fontSize:"1.2rem",fontWeight:800,color:c.color}}>{c.val}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"20px"}}>
                  <h3 style={{fontWeight:700,marginBottom:12,fontSize:"0.9rem"}}>Active Holdings</h3>
                  {stocks.length===0?<p style={{color:"#94a3b8",fontSize:"0.825rem"}}>No investments yet. Head to Markets to buy your first stock.</p>
                  :stocks.map(s=>{
                    const live=prices[s.symbol];
                    const gain=live?(live.price-s.purchasePrice)*s.quantity:0;
                    return<div key={s.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f8fafc",fontSize:"0.82rem"}}>
                      <span style={{fontWeight:600}}>{s.symbol} x{s.quantity}</span>
                      <span style={{color:gain>=0?"#76AD25":"#EF4444",fontWeight:600}}>{gain>=0?"+":""}${gain.toFixed(2)}</span>
                    </div>;
                  })}
                </div>
                <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"20px"}}>
                  <h3 style={{fontWeight:700,marginBottom:12,fontSize:"0.9rem"}}>Active Loans</h3>
                  {loans.length===0?<p style={{color:"#94a3b8",fontSize:"0.825rem"}}>No loans. You are debt-free.</p>
                  :loans.map(l=><div key={l.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f8fafc",fontSize:"0.82rem"}}>
                    <span style={{fontWeight:600}}>{l.name}</span>
                    <span style={{color:"#EF4444",fontWeight:600}}>${l.balance.toFixed(0)}</span>
                  </div>)}
                </div>
              </div>
            </>
          )}

          {tab==="Markets"&&(
            <XPGate gate="buyStock" label="Stock Market">
              <div>
                {marketEvent&&<div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:"10px 16px",marginBottom:16,fontSize:"0.82rem",color:"#92400e",fontWeight:600}}>Market Update: {marketEvent}</div>}
                <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,overflow:"hidden"}}>
                  <div style={{padding:"14px 20px",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <h2 style={{fontWeight:700,fontSize:"0.95rem"}}>NZX Prices</h2>
                    <span style={{fontSize:"0.72rem",color:"#94a3b8"}}>Updates every 30s · Simulated</span>
                  </div>
                  {NZX_STOCKS.map(meta=>{
                    const p=prices[meta.symbol];if(!p)return null;
                    const isUp=p.changePct>=0;
                    const owned=stocks.find(s=>s.symbol===meta.symbol);
                    const qty=buyQty[meta.symbol]||1;
                    return(
                      <div key={meta.symbol} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 20px",borderBottom:"1px solid #f8fafc",flexWrap:"wrap"}}>
                        <div style={{width:44,height:44,background:"#f1f5f9",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:"0.7rem",color:"#3B82F6",flexShrink:0}}>{meta.symbol}</div>
                        <div style={{flex:1,minWidth:110}}>
                          <div style={{fontWeight:600,fontSize:"0.85rem"}}>{meta.name}</div>
                          <div style={{fontSize:"0.7rem",color:"#94a3b8"}}>{meta.sector}</div>
                        </div>
                        <svg width={72} height={22} style={{flexShrink:0}}>
                          <path d={sparklinePath(p.history,72,22)} fill="none" stroke={isUp?"#76AD25":"#EF4444"} strokeWidth="1.5"/>
                        </svg>
                        <div style={{textAlign:"right",minWidth:72}}>
                          <div style={{fontWeight:700,fontSize:"0.875rem"}}>${p.price.toFixed(meta.basePrice<1?3:2)}</div>
                          <div style={{fontSize:"0.7rem",color:isUp?"#76AD25":"#EF4444",fontWeight:600}}>{isUp?"+":""}{p.changePct.toFixed(2)}%</div>
                        </div>
                        {meta.dividendYield>0&&<div style={{fontSize:"0.7rem",color:"#94a3b8",minWidth:50}}>{(meta.dividendYield*100).toFixed(1)}% div</div>}
                        <div style={{display:"flex",alignItems:"center",gap:5}}>
                          <button onClick={()=>setBuyQty(q=>({...q,[meta.symbol]:Math.max(1,(q[meta.symbol]||1)-1)}))} style={{width:24,height:24,border:"1px solid #e2e8f0",borderRadius:5,background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Minus size={10}/></button>
                          <span style={{width:22,textAlign:"center",fontSize:"0.78rem",fontWeight:700}}>{qty}</span>
                          <button onClick={()=>setBuyQty(q=>({...q,[meta.symbol]:(q[meta.symbol]||1)+1}))} style={{width:24,height:24,border:"1px solid #e2e8f0",borderRadius:5,background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Plus size={10}/></button>
                          <button onClick={()=>{
                            const ok=buyStock(meta.symbol,meta.name,qty,p.price);
                            if(ok)notify(`Bought ${qty} ${meta.symbol} at $${p.price.toFixed(2)}`);
                            else notify(!canAccess("buyStock")?"Need 100 XP to buy stocks":"Insufficient balance");
                          }} style={{padding:"5px 12px",borderRadius:6,background:"#76AD25",color:"#fff",border:"none",fontWeight:600,fontSize:"0.75rem",cursor:"pointer",fontFamily:"Inter,sans-serif"}}>
                            Buy ${(p.price*qty).toFixed(0)}
                          </button>
                          {owned&&<button onClick={()=>sellStock(owned.id,p.price)} style={{padding:"5px 12px",borderRadius:6,background:"#EF4444",color:"#fff",border:"none",fontWeight:600,fontSize:"0.75rem",cursor:"pointer",fontFamily:"Inter,sans-serif"}}>Sell</button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </XPGate>
          )}

          {tab==="Day Trading"&&<XPGate gate="dayTrading" label="Day Trading"><div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"32px",textAlign:"center"}}><h3 style={{fontWeight:700,fontSize:"1rem",marginBottom:8}}>Day Trading</h3><p style={{color:"#94a3b8",fontSize:"0.875rem"}}>Advanced trading tools. Keep earning XP to unlock.</p></div></XPGate>}

          {tab==="Property"&&(
            <XPGate gate="buyProperty" label="Property Market">
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14}}>
                {PROPERTIES.map(prop=>{
                  const owned=properties.find(p=>p.name===prop.name);
                  const canAfford=balance>=prop.deposit;
                  const net=prop.weeklyRent-prop.mortgageWeekly;
                  return(
                    <div key={prop.name} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"18px"}}>
                      <div style={{fontWeight:700,fontSize:"0.875rem",marginBottom:2}}>{prop.name}</div>
                      <div style={{fontSize:"0.75rem",color:"#94a3b8",marginBottom:12}}>{prop.suburb}</div>
                      {[["Price",`$${prop.price.toLocaleString()}`,null],[`20% Deposit`,`$${prop.deposit.toLocaleString()}`,canAfford?"#76AD25":"#EF4444"],["Weekly Rent",`$${prop.weeklyRent}/wk`,"#76AD25"],["Mortgage",`-$${prop.mortgageWeekly}/wk`,"#EF4444"],["Net cashflow",`${net>=0?"+":""}$${net}/wk`,net>=0?"#76AD25":"#EF4444"]].map(([l,v,c])=>(
                        <div key={l as string} style={{display:"flex",justifyContent:"space-between",fontSize:"0.78rem",padding:"3px 0",borderBottom:"1px solid #f8fafc"}}>
                          <span style={{color:"#64748b"}}>{l}</span>
                          <span style={{fontWeight:700,color:c as string||"#0d1526"}}>{v}</span>
                        </div>
                      ))}
                      <button disabled={!!owned||!canAfford} onClick={()=>{const ok=buyProperty(prop.name,prop.price,prop.weeklyRent,prop.mortgageWeekly);if(ok)notify(`Purchased ${prop.name}`);else notify("Insufficient balance for deposit");}} style={{width:"100%",marginTop:12,padding:"8px",background:owned?"#e2e8f0":canAfford?"#0d1526":"#fef2f2",color:owned?"#94a3b8":canAfford?"#fff":"#EF4444",border:"none",borderRadius:8,fontWeight:600,fontSize:"0.78rem",cursor:owned||!canAfford?"not-allowed":"pointer",fontFamily:"Inter,sans-serif"}}>
                        {owned?"Already Owned":!canAfford?"Insufficient Balance":"Buy Property"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </XPGate>
          )}

          {tab==="Loans"&&(
            <XPGate gate="takeLoan" label="Loans">
              <div>
                {loans.length>0&&<div style={{marginBottom:20}}>{loans.map(l=><div key={l.id} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:"14px 18px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"0.82rem"}}><div><div style={{fontWeight:700}}>{l.name}</div><div style={{color:"#94a3b8",marginTop:2}}>{l.interestRate}% p.a. · ${l.weeklyRepayment}/wk</div></div><span style={{color:"#EF4444",fontWeight:700}}>${l.balance.toFixed(0)} owing</span></div>)}</div>}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12}}>
                  {LOAN_PRODUCTS.map(lp=>{
                    const have=loans.find(l=>l.name===lp.name);
                    return<div key={lp.name} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:"16px"}}>
                      <div style={{fontWeight:700,fontSize:"0.875rem",marginBottom:3}}>{lp.name}</div>
                      <div style={{fontSize:"0.72rem",color:"#94a3b8",marginBottom:10}}>{lp.note}</div>
                      <div style={{fontSize:"0.78rem",display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{color:"#64748b"}}>Amount</span><span style={{fontWeight:700}}>${lp.principal.toLocaleString()}</span></div>
                      <div style={{fontSize:"0.78rem",display:"flex",justifyContent:"space-between",marginBottom:12}}><span style={{color:"#64748b"}}>Rate</span><span style={{fontWeight:700,color:lp.rate===0?"#76AD25":"#EF4444"}}>{lp.rate===0?"Interest free":`${lp.rate}% p.a.`}</span></div>
                      <button disabled={!!have} onClick={()=>{const ok=takeLoan(lp.name,lp.principal,lp.rate,lp.weekly);if(ok)notify(`${lp.name} approved`);}} style={{width:"100%",padding:"7px",background:have?"#e2e8f0":"#0d1526",color:have?"#94a3b8":"#fff",border:"none",borderRadius:7,fontWeight:600,fontSize:"0.75rem",cursor:have?"not-allowed":"pointer",fontFamily:"Inter,sans-serif"}}>{have?"Active":"Apply"}</button>
                    </div>;
                  })}
                </div>
              </div>
            </XPGate>
          )}

          {tab==="Assets"&&(
            <XPGate gate="buyAsset" label="Assets">
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
                {ASSET_PRODUCTS.map(ap=>{
                  const owned=assets.find(a=>a.name===ap.name);
                  const canAfford=balance>=ap.price;
                  return<div key={ap.name} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:"16px"}}>
                    <div style={{fontWeight:700,fontSize:"0.875rem",marginBottom:2}}>{ap.name}</div>
                    <div style={{fontSize:"0.72rem",color:"#94a3b8",marginBottom:10}}>{ap.category}</div>
                    <div style={{fontSize:"0.78rem",display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{color:"#64748b"}}>Price</span><span style={{fontWeight:700}}>${ap.price.toLocaleString()}</span></div>
                    <div style={{fontSize:"0.78rem",display:"flex",justifyContent:"space-between",marginBottom:12}}><span style={{color:"#64748b"}}>Depreciation</span><span style={{fontWeight:700,color:"#EF4444"}}>-{ap.dep}%/yr</span></div>
                    <button disabled={!!owned||!canAfford} onClick={()=>{const ok=buyAsset(ap.name,ap.category,ap.price,ap.dep);if(ok)notify(`Purchased ${ap.name}`);else notify("Insufficient balance");}} style={{width:"100%",padding:"7px",background:owned?"#e2e8f0":canAfford?"#0d1526":"#fef2f2",color:owned?"#94a3b8":canAfford?"#fff":"#EF4444",border:"none",borderRadius:7,fontWeight:600,fontSize:"0.75rem",cursor:owned||!canAfford?"not-allowed":"pointer",fontFamily:"Inter,sans-serif"}}>
                      {owned?"Owned":!canAfford?"Insufficient Balance":"Buy"}
                    </button>
                  </div>;
                })}
              </div>
            </XPGate>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
