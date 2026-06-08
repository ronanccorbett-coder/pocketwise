"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { BookOpen, BarChart2, Briefcase, Spade, Trophy, LogOut, Zap, DollarSign, Shield, User, Star, Target, GraduationCap, Users, Sun, Moon } from "lucide-react";
import { useGame } from "@/lib/gameContext";
import { useTheme } from "@/lib/theme";

const ADMIN_EMAILS = [
  "admin@pocketwise.nz",
  "ronan@pocketwise.nz",
  "ronancorbett@gmail.com",
  "ronanccorbett@gmail.com",
];

const links = [
  { href: "/curriculum",  label: "Curriculum",  Icon: BookOpen },
  { href: "/activities",  label: "Activities",  Icon: Star },
  { href: "/goals",       label: "Goals",       Icon: Target },
  { href: "/portfolio",   label: "Portfolio",   Icon: BarChart2 },
  { href: "/jobs",        label: "Jobs",        Icon: Briefcase },
  { href: "/casino",      label: "Casino",      Icon: Spade },
  { href: "/leaderboard", label: "Leaderboard", Icon: Trophy },
];

export default function Nav() {
  const path = usePathname();
  const router = useRouter();
  const { state, signOut, user } = useGame();
  const { isDark, toggle } = useTheme();
  const isAdmin   = ADMIN_EMAILS.includes(user?.email ?? "");
  const stateAny  = state as any;
  const isTeacher = stateAny?.role === "teacher" && stateAny?.teacherApproved === true;

  function handleSignOut() {
    signOut();
    router.replace("/login");
  }

  return (
    <nav style={{
      background: "var(--nav-bg)", borderBottom: "1px solid var(--nav-border)",
      backdropFilter: "blur(12px)",
      height: 56, display: "flex", alignItems: "center",
      justifyContent: "space-between", padding: "0 1.5rem",
      position: "sticky", top: 0, zIndex: 50,
    }}>
      <Link href="/curriculum" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <Image src="/logo.png" alt="PocketWise" width={30} height={30} style={{ objectFit: "contain", ...(isDark ? { filter: "brightness(10)" } : { mixBlendMode: "multiply" as any }) }} />
        <span style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text)" }}>PocketWise</span>
        {stateAny?.role && (
          <span style={{ fontSize: "0.6rem", background: stateAny.teacherApproved ? "var(--green-dim)" : "rgba(59,130,246,.1)", color: stateAny.teacherApproved ? "var(--green)" : "#3B82F6", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
            {stateAny.role}{stateAny.teacherApproved ? " ✓" : " pending"}
          </span>
        )}
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {links.map(({ href, label, Icon }) => {
          const active = path.startsWith(href);
          return (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 12px", borderRadius: 8,
              fontSize: "0.84rem", fontWeight: 500,
              color: active ? "var(--text)" : "var(--nav-text)",
              background: active ? "var(--nav-active)" : "transparent",
              textDecoration: "none",
            }}>
              <Icon size={14} />
              {label}
            </Link>
          );
        })}
        {isAdmin && (
          <Link href="/admin" style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 12px", borderRadius: 8,
            fontSize: "0.84rem", fontWeight: 500,
            color: path.startsWith("/admin") ? "#76AD25" : "var(--nav-text)",
            background: path.startsWith("/admin") ? "#e8f5d0" : "transparent",
            textDecoration: "none",
          }}>
            <Shield size={14} />
            Admin
          </Link>
        )}
        {isTeacher && (
          <Link href="/teacher" style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 14px", borderRadius: 8,
            fontSize: "0.84rem", fontWeight: 700,
            color: path.startsWith("/teacher") ? "#fff" : "#3B82F6",
            background: path.startsWith("/teacher") ? "#3B82F6" : "rgba(59,130,246,.1)",
            border: `1px solid ${path.startsWith("/teacher") ? "#3B82F6" : "rgba(59,130,246,.2)"}`,
            textDecoration: "none",
            boxShadow: path.startsWith("/teacher") ? "0 4px 0 #1e3a8a, 0 6px 12px rgba(59,130,246,.3)" : "none",
            transition: "all .15s",
          }}>
            <GraduationCap size={14} />
            My Class
          </Link>
        )}
        {!isTeacher && (
          <Link href="/join" style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 12px", borderRadius: 8,
            fontSize: "0.78rem", fontWeight: 600,
            color: path.startsWith("/join") ? "#3B82F6" : "#94a3b8",
            background: path.startsWith("/join") ? "rgba(59,130,246,.1)" : "transparent",
            textDecoration: "none", transition: "all .15s",
          }}>
            <Users size={13} />
            Join Class
          </Link>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(245,158,11,.1)", padding: "4px 10px", borderRadius: 99 }}>
          <Zap size={13} color="#f59e0b" />
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#f59e0b" }}>
            {(state?.xp ?? 0).toLocaleString()} XP
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(118,173,37,.1)", padding: "4px 10px", borderRadius: 99 }}>
          <DollarSign size={13} color="#76AD25" />
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#76AD25" }}>
            ${(state?.balance ?? 5000).toFixed(0)}
          </span>
        </div>
        <Link href="/profile" style={{
          background: path.startsWith("/profile") ? "var(--nav-active)" : "none",
          border: "none", cursor: "pointer", color: "#94a3b8",
          padding: 6, borderRadius: 6, display: "flex", alignItems: "center",
          textDecoration: "none",
        }}>
          <User size={15} color={path.startsWith("/profile") ? "#0d1526" : "#94a3b8"} />
        </Link>
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="pw-theme-toggle"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle theme"
        >
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: isDark ? "flex-start" : "flex-end", padding: "0 4px", pointerEvents: "none" }}>
            {isDark ? <Moon size={10} color="#f59e0b" /> : <Sun size={10} color="#d97706" />}
          </div>
        </button>

        <button onClick={handleSignOut} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 6, borderRadius: 6, display: "flex", alignItems: "center" }} title="Sign out">
          <LogOut size={15} />
        </button>
      </div>
    </nav>
  );
}
