"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { BookOpen, BarChart2, Briefcase, Spade, Trophy, LogOut, Zap, DollarSign } from "lucide-react";
import { useGame } from "@/lib/gameContext";

const links = [
  { href: "/curriculum",  label: "Curriculum",  Icon: BookOpen },
  { href: "/portfolio",   label: "Portfolio",   Icon: BarChart2 },
  { href: "/jobs",        label: "Jobs",        Icon: Briefcase },
  { href: "/casino",      label: "Casino",      Icon: Spade },
  { href: "/leaderboard", label: "Leaderboard", Icon: Trophy },
];

export default function Nav() {
  const path = usePathname();
  const router = useRouter();
  const { state, signOut } = useGame();

  function handleSignOut() {
    signOut();
    router.replace("/login");
  }

  return (
    <nav style={{
      background: "#fff", borderBottom: "1px solid #e2e8f0",
      height: 56, display: "flex", alignItems: "center",
      justifyContent: "space-between", padding: "0 1.5rem",
      position: "sticky", top: 0, zIndex: 50,
    }}>
      <Link href="/curriculum" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <Image src="/logo.png" alt="PocketWise" width={30} height={30} style={{ objectFit: "contain" }} />
        <span style={{ fontWeight: 800, fontSize: "1rem", color: "#0d1526" }}>PocketWise</span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {links.map(({ href, label, Icon }) => {
          const active = path.startsWith(href);
          return (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 12px", borderRadius: 8,
              fontSize: "0.84rem", fontWeight: 500,
              color: active ? "#0d1526" : "#64748b",
              background: active ? "#f1f5f9" : "transparent",
              textDecoration: "none",
            }}>
              <Icon size={14} />
              {label}
            </Link>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* XP badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          background: "rgba(245,158,11,.1)", padding: "4px 10px",
          borderRadius: 99,
        }}>
          <Zap size={13} color="#f59e0b" />
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#f59e0b" }}>
            {(state?.xp ?? 0).toLocaleString()} XP
          </span>
        </div>
        {/* Balance badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          background: "rgba(118,173,37,.1)", padding: "4px 10px",
          borderRadius: 99,
        }}>
          <DollarSign size={13} color="#76AD25" />
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#76AD25" }}>
            ${(state?.balance ?? 5000).toFixed(0)}
          </span>
        </div>
        {/* Sign out */}
        <button onClick={handleSignOut} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#94a3b8", padding: 6, borderRadius: 6,
          display: "flex", alignItems: "center",
        }} title="Sign out">
          <LogOut size={15} />
        </button>
      </div>
    </nav>
  );
}
