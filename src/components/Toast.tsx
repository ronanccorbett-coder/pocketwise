"use client";
import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { DollarSign, BookOpen, Target, Zap, Bell, X, TrendingUp, Star } from "lucide-react";

export type ToastType = "salary" | "xp" | "module" | "goal" | "streak" | "badge" | "info" | "warning";

export type Toast = {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  amount?: number;
};

type ToastCtx = {
  addToast: (t: Omit<Toast, "id">) => void;
  salaryToast: (amount: number) => void;
  xpToast: (amount: number, reason: string) => void;
  moduleToast: (title: string) => void;
  badgeToast: (name: string) => void;
  goalToast: (label: string) => void;
};

const Ctx = createContext<ToastCtx>({
  addToast: () => {},
  salaryToast: () => {},
  xpToast: () => {},
  moduleToast: () => {},
  badgeToast: () => {},
  goalToast: () => {},
});

export function useToast() { return useContext(Ctx); }

const ICONS: Record<ToastType, any> = {
  salary:  DollarSign,
  xp:      Zap,
  module:  BookOpen,
  goal:    Target,
  streak:  Star,
  badge:   Star,
  info:    Bell,
  warning: Bell,
};

const COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  salary:  { bg: "#0f2a1a", border: "#76AD25", icon: "#76AD25" },
  xp:      { bg: "#1a1a0a", border: "#f59e0b", icon: "#f59e0b" },
  module:  { bg: "#0a1a2a", border: "#3B82F6", icon: "#3B82F6" },
  goal:    { bg: "#1a0a1a", border: "#a78bfa", icon: "#a78bfa" },
  streak:  { bg: "#1a1a0a", border: "#f97316", icon: "#f97316" },
  badge:   { bg: "#1a1a2a", border: "#ec4899", icon: "#ec4899" },
  info:    { bg: "#0d1526", border: "#8b9dc3", icon: "#8b9dc3" },
  warning: { bg: "#1a0a00", border: "#f97316", icon: "#f97316" },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const [visible, setVisible] = useState(false);
  const c = COLORS[toast.type];
  const Icon = ICONS[toast.type];

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => { setVisible(false); setTimeout(onRemove, 350); }, 4500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(onRemove, 350); }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: c.bg,
        border: `1.5px solid ${c.border}`,
        borderRadius: 14,
        padding: "12px 14px",
        cursor: "pointer",
        minWidth: 260,
        maxWidth: 320,
        boxShadow: `0 8px 24px rgba(0,0,0,.5), 0 0 0 1px ${c.border}22`,
        transform: visible ? "translateX(0) scale(1)" : "translateX(120%) scale(0.95)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.35s cubic-bezier(.34,1.56,.64,1), opacity 0.3s ease",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: `${c.icon}22`, border: `1px solid ${c.icon}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={17} color={c.icon} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.82rem", marginBottom: 2 }}>
          {toast.title}
        </div>
        <div style={{ color: "#8b9dc3", fontSize: "0.75rem", lineHeight: 1.4 }}>
          {toast.message}
        </div>
      </div>
      {toast.amount != null && (
        <div style={{ fontWeight: 900, color: c.icon, fontSize: "0.95rem", flexShrink: 0 }}>
          {toast.type === "salary" ? `+$${toast.amount.toFixed(2)}` : `+${toast.amount}`}
        </div>
      )}
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([] as Toast[]);

  const addToast = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-3), { ...t, id }]);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const salaryToast  = useCallback((amount: number) => addToast({ type: "salary", title: "Salary paid!", message: "Your daily earnings just hit your balance.", amount }), [addToast]);
  const xpToast      = useCallback((amount: number, reason: string) => addToast({ type: "xp", title: "XP earned!", message: reason, amount }), [addToast]);
  const moduleToast  = useCallback((title: string) => addToast({ type: "module", title: "New module available!", message: title }), [addToast]);
  const badgeToast   = useCallback((name: string) => addToast({ type: "badge", title: "Badge unlocked!", message: name }), [addToast]);
  const goalToast    = useCallback((label: string) => addToast({ type: "goal", title: "Goal reached!", message: label }), [addToast]);

  // Listen for custom events fired from gameContext
  useEffect(() => {
    const onSalary = (e: Event) => {
      const amt = (e as CustomEvent).detail?.amount;
      if (amt > 0) salaryToast(Math.round(amt * 100) / 100);
    };
    const onBadge = (e: Event) => badgeToast((e as CustomEvent).detail?.name ?? "New badge");
    const onGoal  = (e: Event) => goalToast((e as CustomEvent).detail?.label ?? "Goal complete");
    const onXp    = (e: Event) => xpToast((e as CustomEvent).detail?.amount, (e as CustomEvent).detail?.reason ?? "Lesson complete");

    window.addEventListener("pw:salary", onSalary);
    window.addEventListener("pw:badge",  onBadge);
    window.addEventListener("pw:goal",   onGoal);
    window.addEventListener("pw:xp",     onXp);
    return () => {
      window.removeEventListener("pw:salary", onSalary);
      window.removeEventListener("pw:badge",  onBadge);
      window.removeEventListener("pw:goal",   onGoal);
      window.removeEventListener("pw:xp",     onXp);
    };
  }, [salaryToast, badgeToast, goalToast, xpToast]);

  return (
    <Ctx.Provider value={{ addToast, salaryToast, xpToast, moduleToast, badgeToast, goalToast }}>
      <div style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 700,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "flex-end",
        pointerEvents: "none",
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: "auto" }}>
            <ToastItem toast={t} onRemove={() => remove(t.id)} />
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
