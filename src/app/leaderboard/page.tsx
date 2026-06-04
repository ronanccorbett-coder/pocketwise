"use client";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { useGame } from "@/lib/gameContext";
import { db } from "@/lib/db";
import { Trophy, Zap, Flame } from "lucide-react";

const COLORS = ["#EF4444","#3B82F6","#76AD25","#6b7280","#3B82F6","#f59e0b","#0891b2","#76AD25"];

export default function LeaderboardPage() {
  const { user, state } = useGame();
  const { data } = db.useQuery({ userState: {} });
  const { data: usersData } = db.useQuery({ $users: {} });

  const allStates = (data?.userState ?? []) as any[];
  const allUsers = (usersData?.$users ?? []) as any[];
  const sorted = [...allStates].sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0)).slice(0, 20);

  const userRank = sorted.findIndex(s => s.userId === user?.id);

  function getDisplayName(userId: string, isMe: boolean): string {
    if (isMe) return "You";
    const found = allUsers.find((u: any) => u.id === userId);
    if (found?.email) {
      // Show first part of email before @, capitalised
      const name = found.email.split("@")[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return `Student ${userId?.slice(0, 6) ?? "?"}`;
  }

  const rankLabel = (i: number) =>
    i === 0 ? "1st" : i === 1 ? "2nd" : i === 2 ? "3rd" : `#${i + 1}`;

  function getDisplayName(userId: string, isMe: boolean): string {
    if (isMe) return "You";
    const found = allUsers.find((u: any) => u.id === userId);
    if (found?.email) {
      const name = found.email.split("@")[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return `Student ${userId?.slice(0, 6) ?? "?"}`;
  }

  function getInitials(userId: string): string {
    const found = allUsers.find((u: any) => u.id === userId);
    if (found?.email) return found.email.slice(0, 2).toUpperCase();
    return userId?.slice(0, 2).toUpperCase() ?? "??";
  }

  return (
    <AuthGuard>
      <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>
        <Nav />

        <div style={{ background: "linear-gradient(135deg,#0d1526,#111c30)", padding: "28px 2rem" }}>
          <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
              <Trophy size={22} color="#f59e0b" />
              <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff" }}>Leaderboard</h1>
            </div>
            <p style={{ color: "#8b9dc3", fontSize: "0.875rem" }}>Top students ranked by XP earned</p>
            {userRank >= 0 && (
              <div style={{ marginTop: 10, display: "inline-block", background: "rgba(118,173,37,.15)", color: "#76AD25", border: "1px solid rgba(118,173,37,.3)", padding: "4px 14px", borderRadius: 99, fontSize: "0.78rem", fontWeight: 700 }}>
                You are ranked {rankLabel(userRank)}
              </div>
            )}
          </div>
        </div>

        <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 1.5rem" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {["All Students", "This Week"].map((t, i) => (
              <button key={t} style={{ padding: "7px 18px", borderRadius: 9999, background: i === 0 ? "#0d1526" : "#fff", color: i === 0 ? "#fff" : "#475569", border: `1px solid ${i === 0 ? "#0d1526" : "#e2e8f0"}`, fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>{t}</button>
            ))}
          </div>

          {sorted.length === 0 ? (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "48px", textAlign: "center" }}>
              <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>No students on the leaderboard yet. Complete lessons to appear here.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sorted.map((s, i) => {
                const isMe = s.userId === user?.id;
                return (
                  <div key={s.id ?? i} style={{
                    background: isMe ? "#f0fdf4" : "#fff",
                    border: `1px solid ${isMe ? "#76AD25" : i < 3 ? "#e2e8f0" : "#e2e8f0"}`,
                    borderRadius: 12, padding: "14px 18px",
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <div style={{ width: 36, textAlign: "center", fontWeight: 800, fontSize: "0.82rem", color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7f32" : "#94a3b8" }}>
                      {rankLabel(i)}
                    </div>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: COLORS[i % COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.78rem", flexShrink: 0 }}>
                      {getInitials(s.userId)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0d1526" }}>
                        {getDisplayName(s.userId, isMe)}
                        {isMe && <span style={{ color: "#76AD25", fontSize: "0.75rem", fontWeight: 500, marginLeft: 6 }}>(You)</span>}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 1 }}>
                        {(s.completedLessons?.length ?? 0)} lessons completed
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {(s.streak ?? 0) > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <Flame size={13} color="#f59e0b" />
                          <span style={{ fontSize: "0.75rem", color: "#f59e0b", fontWeight: 600 }}>{s.streak}</span>
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Zap size={13} color="#3B82F6" />
                        <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#3B82F6" }}>
                          {(s.xp ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
