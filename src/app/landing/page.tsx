"use client";
import Link from "next/link";
import Image from "next/image";

const stats = [
  { val: "4",      label: "Year Curriculum" },
  { val: "19+",    label: "Modules" },
  { val: "178+",   label: "Lessons" },
  { val: "8,900+", label: "XP to Earn" },
];

const features = [
  { title: "NCEA-Aligned Modules",   desc: "Four years of structured content aligned to NZ curriculum standards, from money basics to wealth building." },
  { title: "XP and Gamification",    desc: "Earn XP, unlock badges, build streaks and compete on school leaderboards as you level up your financial skills." },
  { title: "Virtual Career Centre",  desc: "Apply for jobs, earn a weekly salary and watch your portfolio grow as you progress through your career." },
  { title: "Portfolio Simulator",    desc: "Trade stocks, buy property, manage loans and grow your net worth using real NZX data and market conditions." },
  { title: "Casino and Risk Lessons",desc: "Learn why the house always wins through our gamified casino — slots, blackjack, roulette and more." },
  { title: "Classroom Tools",        desc: "Educators can create classes, assign modules, track progress and assess students all in one place." },
];

const pricing = [
  { name: "Student Free", price: "$0",  period: "/month", featured: false, cta: "Get Started",
    features: ["Core modules access","Virtual portfolio basics","Leaderboard access","3 badges to earn"] },
  { name: "Student Pro",  price: "$9",  period: "/month", featured: true,  cta: "Upgrade to Pro",
    features: ["All free features","Full portfolio simulator","Career Centre access","Casino simulator","Premium badges"] },
  { name: "Educator",     price: "$29", period: "/month", featured: false, cta: "Start Free Trial",
    features: ["Unlimited students","Full classroom tools","Analytics dashboard","Custom module builder","Assessment tools"] },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      {/* NAV */}
      <nav style={{
        background: "#fff", borderBottom: "1px solid #e2e8f0",
        height: 56, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 2rem",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Image src="/logo.png" alt="PocketWise" width={30} height={30} style={{ objectFit: "contain" }} />
          <span style={{ fontWeight: 800, fontSize: "1rem", color: "#0d1526" }}>PocketWise</span>
        </div>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {["Features","Curriculum","Pricing","About"].map(l => (
            <a key={l} href="#" style={{ fontSize: "0.875rem", color: "#64748b", textDecoration: "none", fontWeight: 500 }}>{l}</a>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/curriculum" style={{
            background: "#0d1526", color: "#fff", padding: "8px 20px",
            borderRadius: 8, fontSize: "0.875rem", fontWeight: 600, textDecoration: "none",
          }}>Get Started</Link>
          <Link href="/curriculum" style={{ fontSize: "0.875rem", color: "#475569", textDecoration: "none", fontWeight: 500 }}>
            Educator
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="plus-grid" style={{ padding: "100px 1rem 80px", textAlign: "center" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", fontWeight: 900, lineHeight: 1.05, color: "#fff", marginBottom: 24 }}>
            Financial literacy<br />
            <span style={{ color: "#76AD25" }}>for every Kiwi student</span>
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "1.1rem", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 40px" }}>
            PocketWise is New Zealand's gamified financial education platform. A four-year NCEA-aligned journey from money basics to wealth building, built by students, for students.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 72 }}>
            <Link href="/curriculum" style={{
              background: "#EF4444", color: "#fff", padding: "14px 32px",
              borderRadius: 9999, fontSize: "1rem", fontWeight: 700, textDecoration: "none",
            }}>Start Learning Free</Link>
            <a href="#features" style={{
              background: "rgba(255,255,255,.12)", color: "#fff", padding: "14px 32px",
              borderRadius: 9999, fontSize: "1rem", fontWeight: 700, textDecoration: "none",
              border: "1px solid rgba(255,255,255,.15)",
            }}>See How It Works</a>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {stats.map(s => (
              <div key={s.label} style={{
                background: "rgba(255,255,255,.08)", borderRadius: 14,
                padding: "18px 32px", minWidth: 120, textAlign: "center",
              }}>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff" }}>{s.val}</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: "80px 1rem", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-block", background: "#e8f5d0", color: "#76AD25", padding: "4px 14px", borderRadius: 99, fontSize: "0.8rem", fontWeight: 600, marginBottom: 12 }}>
            Platform Features
          </div>
          <h2 style={{ fontSize: "2.25rem", fontWeight: 800, color: "#0d1526" }}>Everything students need</h2>
        </div>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {features.map((f, i) => (
            <div key={f.title} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px" }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", marginBottom: 14,
                background: i % 3 === 0 ? "#76AD25" : i % 3 === 1 ? "#3B82F6" : "#EF4444",
              }} />
              <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "#0d1526", marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: "0.875rem", color: "#64748b", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: "80px 1rem", background: "#f8fafc" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "2.25rem", fontWeight: 800, color: "#0d1526", marginBottom: 12 }}>Simple pricing</h2>
            <p style={{ color: "#64748b" }}>Start free, upgrade when you are ready.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
            {pricing.map(p => (
              <div key={p.name} style={{
                background: "#fff", border: `1.5px solid ${p.featured ? "#EF4444" : "#e2e8f0"}`,
                borderRadius: 16, padding: "28px", position: "relative",
              }}>
                {p.featured && (
                  <div style={{
                    position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                    background: "#EF4444", color: "#fff", padding: "3px 16px",
                    borderRadius: 99, fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap",
                  }}>Most Popular</div>
                )}
                <h3 style={{ fontWeight: 700, marginBottom: 8, color: "#0d1526" }}>{p.name}</h3>
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: "2.5rem", fontWeight: 900, color: "#0d1526" }}>{p.price}</span>
                  <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>{p.period}</span>
                </div>
                <ul style={{ listStyle: "none", marginBottom: 24 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ fontSize: "0.875rem", color: "#475569", padding: "5px 0", display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ color: "#76AD25", fontWeight: 700, fontSize: "0.9rem" }}>+</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/curriculum" style={{
                  display: "block", textAlign: "center", padding: "11px", borderRadius: 10,
                  background: p.featured ? "#EF4444" : "#0d1526",
                  color: "#fff", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none",
                }}>{p.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#0d1526", color: "#64748b", padding: "40px 2rem", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
          <Image src="/logo.png" alt="PocketWise" width={24} height={24} style={{ objectFit: "contain" }} />
          <span style={{ color: "#fff", fontWeight: 700 }}>PocketWise</span>
        </div>
        <p style={{ fontSize: "0.875rem" }}>Built for New Zealand students · NCEA Aligned · 2025 PocketWise</p>
      </footer>
    </div>
  );
}
