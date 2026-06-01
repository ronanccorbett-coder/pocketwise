"use client";
import { ReactNode } from "react";
import { Lock, Zap } from "lucide-react";
import { useGame, XP_GATES } from "@/lib/gameContext";

type Props = {
  gate: keyof typeof XP_GATES;
  children: ReactNode;
  label?: string;
};

export default function XPGate({ gate, children, label }: Props) {
  const { canAccess, state } = useGame();
  const required = XP_GATES[gate];
  const current = state?.xp ?? 0;
  const unlocked = canAccess(gate);

  if (unlocked) return <>{children}</>;

  return (
    <div style={{ position: "relative" }}>
      {/* Greyed out content underneath */}
      <div style={{ opacity: 0.35, pointerEvents: "none", userSelect: "none", filter: "grayscale(0.5)" }}>
        {children}
      </div>
      {/* Lock overlay */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(2px)",
        borderRadius: "inherit",
        gap: 8,
      }}>
        <div style={{
          background: "#0d1526", border: "1px solid #2a3a5c",
          borderRadius: 12, padding: "12px 20px",
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: 6,
        }}>
          <Lock size={20} color="#EF4444" />
          <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "#fff" }}>
            {label ?? "Locked"}
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "rgba(245,158,11,.15)", padding: "3px 10px",
            borderRadius: 99,
          }}>
            <Zap size={12} color="#f59e0b" />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f59e0b" }}>
              {required.toLocaleString()} XP required
            </span>
          </div>
          <div style={{ fontSize: "0.7rem", color: "#8b9dc3" }}>
            You have {current.toLocaleString()} XP
          </div>
          <div style={{ background: "#1a2540", borderRadius: 99, height: 4, width: 120, overflow: "hidden" }}>
            <div style={{
              background: "#f59e0b", height: 4, borderRadius: 99,
              width: `${Math.min(100, (current / required) * 100)}%`,
              transition: "width .3s",
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
