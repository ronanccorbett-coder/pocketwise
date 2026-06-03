"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/db";
import {
  Users, BookOpen, BarChart2, Settings, LogOut,
  Search, Zap, DollarSign, Edit2, Check, X,
  Upload, Trash2, Shield, TrendingUp, Award,
  ChevronDown, ChevronUp, RefreshCw,
} from "lucide-react";

const ADMIN_EMAILS = ["admin@pocketwise.nz", "ronanccorbet@gmail.com"];

type AdminTab = "overview" | "users" | "modules" | "permissions";

type EditField = {
  userId: string;
  field: "xp" | "balance";
  value: string;
};

export default function AdminPage() {
  const { user, isLoading } = db.useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<EditField | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [notif, setNotif] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadLog, setUploadLog] = useState<string[]>([]);

  // Queries
  const { data: stateData }    = db.useQuery({ userState: {} });
  const { data: stockData }    = db.useQuery({ userStocks: {} });
  const { data: loanData }     = db.useQuery({ userLoans: {} });
  const { data: propData }     = db.useQuery({ userProperties: {} });
  const { data: classData }    = db.useQuery({ classrooms: {} });
  const { data: enrollData }   = db.useQuery({ classEnrollments: {} });

  const allStates      = (stateData?.userState ?? []) as any[];
  const allStocks      = (stockData?.userStocks ?? []) as any[];
  const allLoans       = (loanData?.userLoans ?? []) as any[];
  const allProperties  = (propData?.userProperties ?? []) as any[];
  const allClassrooms  = (classData?.classrooms ?? []) as any[];
  const allEnrollments = (enrollData?.classEnrollments ?? []) as any[];

  // Auth check
  if (isLoading) return (
    <div style={{ minHeight: "100vh", background: "#0d1526", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#8b9dc3" }}>Loading...</div>
    </div>
  );

  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) return (
    <div style={{ minHeight: "100vh", background: "#0d1526", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <Shield size={48} color="#EF4444" />
      <h1 style={{ color: "#fff", fontWeight: 800, fontSize: "1.5rem" }}>Access Denied</h1>
      <p style={{ color: "#8b9dc3" }}>You do not have permission to view this page.</p>
      <button onClick={() => router.push("/curriculum")} style={{ background: "#76AD25", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
        Go to Curriculum
      </button>
    </div>
  );

  function notify(msg: string) { setNotif(msg); setTimeout(() => setNotif(null), 3000); }

  // Stats
  const totalXp = allStates.reduce((s: number, u: any) => s + (u.xp ?? 0), 0);
  const totalBalance = allStates.reduce((s: number, u: any) => s + (u.balance ?? 0), 0);
  const totalLessons = allStates.reduce((s: number, u: any) => s + (u.completedLessons?.length ?? 0), 0);
  const activeUsers = allStates.filter((u: any) => (u.xp ?? 0) > 0).length;

  // Filtered users
  const filteredUsers = allStates.filter((u: any) =>
    search === "" || u.userId?.toLowerCase().includes(search.toLowerCase())
  ).sort((a: any, b: any) => (b.xp ?? 0) - (a.xp ?? 0));

  // Edit user field
  async function saveEdit() {
    if (!editing) return;
    const val = parseFloat(editing.value);
    if (isNaN(val) || val < 0) { notify("Invalid value"); return; }
    const user = allStates.find((u: any) => u.userId === editing.userId);
    if (!user) return;
    await db.transact(
      (db as any).tx.userState[user.id].update({
        [editing.field]: val,
        netWorth: editing.field === "balance"
          ? val + (user.totalInvested ?? 0) - (user.totalDebt ?? 0)
          : user.netWorth,
      })
    );
    setEditing(null);
    notify(`Updated ${editing.field} for user`);
  }

  // Reset user
  async function resetUser(userId: string) {
    if (!confirm("Reset this user to $5,000 balance and 0 XP?")) return;
    const u = allStates.find((s: any) => s.userId === userId);
    if (!u) return;
    await db.transact(
      (db as any).tx.userState[u.id].update({
        xp: 0, balance: 5000, totalEarned: 5000,
        totalInvested: 0, totalDebt: 0, netWorth: 5000,
        streak: 0, completedLessons: [], completedModules: [],
        badges: [], currentJobId: null,
      })
    );
    notify("User reset successfully");
  }

  // Module file upload
  async function handleModuleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setUploadLog([]);
    const log: string[] = [];

    for (const file of files) {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        log.push(`Parsed: ${file.name}`);

        const res = await fetch("/api/admin/upload-module", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, data }),
        });
        const result = await res.json();
        if (res.ok) {
          log.push(`Saved: ${file.name}`);
        } else {
          log.push(`Failed: ${file.name} — ${result.error}`);
        }
      } catch (err) {
        log.push(`Error: ${file.name} — invalid JSON`);
      }
      setUploadLog([...log]);
    }
    setUploading(false);
    notify(`Uploaded ${files.length} file${files.length > 1 ? "s" : ""}`);
  }

  const TABS = [
    { key: "overview" as AdminTab,    Icon: BarChart2, label: "Overview" },
    { key: "users" as AdminTab,       Icon: Users,     label: "Users" },
    { key: "modules" as AdminTab,     Icon: BookOpen,  label: "Modules" },
    { key: "permissions" as AdminTab, Icon: Shield,    label: "Permissions" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0d1526", color: "#e2e8f0", fontFamily: "Inter, sans-serif" }}>

      {/* Notification */}
      {notif && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 100, background: "#1a2540", color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: "0.85rem", fontWeight: 600, border: "1px solid #76AD25" }}>
          {notif}
        </div>
      )}

      {/* Sidebar */}
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <div style={{ width: 220, background: "#111c30", borderRight: "1px solid #2a3a5c", display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0 }}>
          <div style={{ padding: "20px 16px", borderBottom: "1px solid #2a3a5c", display: "flex", alignItems: "center", gap: 10 }}>
            <Image src="/logo.png" alt="PocketWise" width={28} height={28} style={{ objectFit: "contain" }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.875rem", color: "#fff" }}>PocketWise</div>
              <div style={{ fontSize: "0.68rem", color: "#76AD25", fontWeight: 600 }}>Admin Panel</div>
            </div>
          </div>

          <nav style={{ flex: 1, padding: "12px 8px" }}>
            {TABS.map(({ key, Icon, label }) => (
              <button key={key} onClick={() => setTab(key)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 8, marginBottom: 2,
                background: tab === key ? "rgba(118,173,37,.15)" : "transparent",
                color: tab === key ? "#76AD25" : "#8b9dc3",
                border: `1px solid ${tab === key ? "rgba(118,173,37,.3)" : "transparent"}`,
                fontWeight: 600, fontSize: "0.825rem", cursor: "pointer",
                fontFamily: "Inter, sans-serif", textAlign: "left",
                transition: "all .12s",
              }}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </nav>

          <div style={{ padding: "12px 8px", borderTop: "1px solid #2a3a5c" }}>
            <button onClick={() => { db.auth.signOut(); router.push("/login"); }} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 8,
              background: "transparent", color: "#8b9dc3",
              border: "none", fontWeight: 600, fontSize: "0.825rem",
              cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}>
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>

        {/* Main content */}
        <div style={{ marginLeft: 220, flex: 1, padding: "28px 32px" }}>

          {/* OVERVIEW */}
          {tab === "overview" && (
            <div>
              <h1 style={{ fontWeight: 800, fontSize: "1.4rem", marginBottom: 4 }}>Dashboard Overview</h1>
              <p style={{ color: "#8b9dc3", fontSize: "0.875rem", marginBottom: 24 }}>Real-time platform statistics</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>
                {[
                  { label: "Total Users",       val: allStates.length,              Icon: Users,      color: "#3B82F6", bg: "rgba(59,130,246,.1)" },
                  { label: "Active Users",       val: activeUsers,                   Icon: TrendingUp, color: "#76AD25", bg: "rgba(118,173,37,.1)" },
                  { label: "Total XP Earned",    val: totalXp.toLocaleString(),      Icon: Zap,        color: "#f59e0b", bg: "rgba(245,158,11,.1)" },
                  { label: "Total Balance",      val: `$${totalBalance.toFixed(0)}`, Icon: DollarSign, color: "#76AD25", bg: "rgba(118,173,37,.1)" },
                  { label: "Lessons Completed",  val: totalLessons,                  Icon: BookOpen,   color: "#3B82F6", bg: "rgba(59,130,246,.1)" },
                  { label: "Active Classes",     val: allClassrooms.length,          Icon: Award,      color: "#a78bfa", bg: "rgba(167,139,250,.1)" },
                ].map(s => (
                  <div key={s.label} style={{ background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 12, padding: "18px" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                      <s.Icon size={17} color={s.color} />
                    </div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff" }}>{s.val}</div>
                    <div style={{ fontSize: "0.75rem", color: "#8b9dc3", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Top students */}
              <div style={{ background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #2a3a5c", fontWeight: 700, fontSize: "0.9rem" }}>
                  Top 10 Students by XP
                </div>
                {allStates
                  .sort((a: any, b: any) => (b.xp ?? 0) - (a.xp ?? 0))
                  .slice(0, 10)
                  .map((u: any, i: number) => (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", borderBottom: "1px solid #1a2540" }}>
                      <div style={{ width: 28, fontWeight: 800, fontSize: "0.82rem", color: i < 3 ? "#f59e0b" : "#8b9dc3" }}>#{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.825rem", fontWeight: 600 }}>{u.userId?.slice(0, 16)}...</div>
                        <div style={{ fontSize: "0.72rem", color: "#8b9dc3", marginTop: 1 }}>{u.completedLessons?.length ?? 0} lessons</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Zap size={13} color="#f59e0b" />
                        <span style={{ fontWeight: 700, color: "#f59e0b" }}>{(u.xp ?? 0).toLocaleString()}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <DollarSign size={13} color="#76AD25" />
                        <span style={{ fontWeight: 700, color: "#76AD25" }}>${(u.balance ?? 0).toFixed(0)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* USERS */}
          {tab === "users" && (
            <div>
              <h1 style={{ fontWeight: 800, fontSize: "1.4rem", marginBottom: 4 }}>User Management</h1>
              <p style={{ color: "#8b9dc3", fontSize: "0.875rem", marginBottom: 20 }}>View and edit any user's XP, balance, and progress</p>

              {/* Search */}
              <div style={{ position: "relative", marginBottom: 20, maxWidth: 400 }}>
                <Search size={15} color="#8b9dc3" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  placeholder="Search by user ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: "100%", background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 9, padding: "10px 14px 10px 36px", color: "#fff", fontFamily: "Inter, sans-serif", fontSize: "0.875rem", outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filteredUsers.map((u: any) => {
                  const isExpanded = expandedUser === u.userId;
                  const userStocks = allStocks.filter((s: any) => s.userId === u.userId);
                  const userLoans = allLoans.filter((l: any) => l.userId === u.userId);
                  const userProps = allProperties.filter((p: any) => p.userId === u.userId);

                  return (
                    <div key={u.id} style={{ background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 12, overflow: "hidden" }}>
                      {/* User header row */}
                      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px" }}>
                        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#2a3a5c", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.78rem", color: "#8b9dc3", flexShrink: 0 }}>
                          {u.userId?.slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {u.userId}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "#8b9dc3", marginTop: 1 }}>
                            {u.completedLessons?.length ?? 0} lessons · {u.streak ?? 0} day streak · {u.badges?.length ?? 0} badges
                          </div>
                        </div>

                        {/* XP display/edit */}
                        <div style={{ textAlign: "center", minWidth: 90 }}>
                          {editing !== null && editing.userId === u.userId && editing.field === "xp" ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <input
                                type="number"
                                value={editing.value}
                                onChange={e => setEditing({ ...editing, value: e.target.value })}
                                autoFocus
                                style={{ width: 70, background: "#0d1526", border: "1px solid #76AD25", borderRadius: 6, padding: "4px 6px", color: "#fff", fontFamily: "Inter, sans-serif", fontSize: "0.8rem", outline: "none" }}
                              />
                              <button onClick={saveEdit} style={{ background: "#76AD25", border: "none", borderRadius: 5, padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center" }}><Check size={12} color="#fff" /></button>
                              <button onClick={() => setEditing(null)} style={{ background: "#EF4444", border: "none", borderRadius: 5, padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center" }}><X size={12} color="#fff" /></button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }} onClick={() => setEditing({ userId: u.userId, field: "xp", value: String(u.xp ?? 0) })}>
                              <Zap size={13} color="#f59e0b" />
                              <span style={{ fontWeight: 700, color: "#f59e0b", fontSize: "0.875rem" }}>{(u.xp ?? 0).toLocaleString()}</span>
                              <Edit2 size={11} color="#4a5a7a" />
                            </div>
                          )}
                        </div>

                        {/* Balance display/edit */}
                        <div style={{ textAlign: "center", minWidth: 100 }}>
                          {editing !== null && editing.userId === u.userId && editing.field === "balance" ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <input
                                type="number"
                                value={editing.value}
                                onChange={e => setEditing({ ...editing, value: e.target.value })}
                                autoFocus
                                style={{ width: 80, background: "#0d1526", border: "1px solid #76AD25", borderRadius: 6, padding: "4px 6px", color: "#fff", fontFamily: "Inter, sans-serif", fontSize: "0.8rem", outline: "none" }}
                              />
                              <button onClick={saveEdit} style={{ background: "#76AD25", border: "none", borderRadius: 5, padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center" }}><Check size={12} color="#fff" /></button>
                              <button onClick={() => setEditing(null)} style={{ background: "#EF4444", border: "none", borderRadius: 5, padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center" }}><X size={12} color="#fff" /></button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }} onClick={() => setEditing({ userId: u.userId, field: "balance", value: String(u.balance ?? 5000) })}>
                              <DollarSign size={13} color="#76AD25" />
                              <span style={{ fontWeight: 700, color: "#76AD25", fontSize: "0.875rem" }}>${(u.balance ?? 0).toFixed(0)}</span>
                              <Edit2 size={11} color="#4a5a7a" />
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => resetUser(u.userId)} title="Reset user" style={{ background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 6, padding: "6px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                            <RefreshCw size={13} color="#EF4444" />
                          </button>
                          <button onClick={() => setExpandedUser(isExpanded ? null : u.userId)} style={{ background: "#2a3a5c", border: "1px solid #3a4a6c", borderRadius: 6, padding: "6px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                            {isExpanded ? <ChevronUp size={13} color="#8b9dc3" /> : <ChevronDown size={13} color="#8b9dc3" />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded user details */}
                      {isExpanded && (
                        <div style={{ borderTop: "1px solid #2a3a5c", padding: "14px 18px", background: "#111c30" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10, marginBottom: 14 }}>
                            {[
                              { label: "Net Worth",      val: `$${(u.netWorth ?? 0).toFixed(0)}` },
                              { label: "Total Invested", val: `$${(u.totalInvested ?? 0).toFixed(0)}` },
                              { label: "Total Debt",     val: `$${(u.totalDebt ?? 0).toFixed(0)}` },
                              { label: "Total Earned",   val: `$${(u.totalEarned ?? 0).toFixed(0)}` },
                              { label: "Current Job",    val: u.currentJobId?.split(":")?.[0] ?? "None" },
                              { label: "Badges",         val: (u.badges ?? []).join(", ") || "None" },
                            ].map(s => (
                              <div key={s.label} style={{ background: "#1a2540", borderRadius: 8, padding: "10px 12px" }}>
                                <div style={{ fontSize: "0.7rem", color: "#8b9dc3", marginBottom: 3 }}>{s.label}</div>
                                <div style={{ fontSize: "0.825rem", fontWeight: 600, color: "#fff" }}>{s.val}</div>
                              </div>
                            ))}
                          </div>

                          {/* Completed lessons */}
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8b9dc3", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>
                              Completed Lessons ({u.completedLessons?.length ?? 0})
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                              {(u.completedLessons ?? []).length === 0
                                ? <span style={{ fontSize: "0.78rem", color: "#4a5a7a" }}>None yet</span>
                                : (u.completedLessons ?? []).map((l: string) => (
                                  <span key={l} style={{ background: "#2a3a5c", color: "#94a3b8", padding: "2px 8px", borderRadius: 4, fontSize: "0.7rem" }}>{l}</span>
                                ))
                              }
                            </div>
                          </div>

                          {/* Holdings */}
                          {userStocks.length > 0 && (
                            <div style={{ marginBottom: 10 }}>
                              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8b9dc3", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>
                                Stock Holdings ({userStocks.length})
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                {userStocks.map((s: any) => (
                                  <span key={s.id} style={{ background: "rgba(59,130,246,.15)", color: "#3B82F6", padding: "2px 8px", borderRadius: 4, fontSize: "0.7rem" }}>
                                    {s.symbol} x{s.quantity}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Loans */}
                          {userLoans.length > 0 && (
                            <div>
                              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8b9dc3", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>
                                Active Loans ({userLoans.length})
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                {userLoans.map((l: any) => (
                                  <span key={l.id} style={{ background: "rgba(239,68,68,.15)", color: "#EF4444", padding: "2px 8px", borderRadius: 4, fontSize: "0.7rem" }}>
                                    {l.name}: ${(l.balance ?? 0).toFixed(0)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <div style={{ background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 12, padding: "48px", textAlign: "center" }}>
                    <p style={{ color: "#8b9dc3" }}>No users found.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODULES */}
          {tab === "modules" && (
            <div>
              <h1 style={{ fontWeight: 800, fontSize: "1.4rem", marginBottom: 4 }}>Module Management</h1>
              <p style={{ color: "#8b9dc3", fontSize: "0.875rem", marginBottom: 24 }}>Upload lesson JSON files to add or update curriculum content</p>

              {/* Upload zone */}
              <div style={{ background: "#1a2540", border: "2px dashed #2a3a5c", borderRadius: 14, padding: "40px", textAlign: "center", marginBottom: 24 }}>
                <Upload size={32} color="#8b9dc3" style={{ margin: "0 auto 12px", display: "block" }} />
                <h3 style={{ fontWeight: 700, marginBottom: 6 }}>Upload Module Files</h3>
                <p style={{ color: "#8b9dc3", fontSize: "0.825rem", marginBottom: 20 }}>
                  Upload module.json and lesson-X.json files. Files are saved to the curriculum-data folder.
                </p>
                <label style={{
                  display: "inline-block", padding: "10px 24px",
                  background: "#76AD25", color: "#fff", borderRadius: 8,
                  fontWeight: 700, fontSize: "0.875rem", cursor: "pointer",
                }}>
                  {uploading ? "Uploading..." : "Choose JSON Files"}
                  <input
                    type="file"
                    accept=".json"
                    multiple
                    onChange={handleModuleUpload}
                    style={{ display: "none" }}
                    disabled={uploading}
                  />
                </label>
              </div>

              {/* Upload log */}
              {uploadLog.length > 0 && (
                <div style={{ background: "#111c30", border: "1px solid #2a3a5c", borderRadius: 12, padding: "16px", marginBottom: 24 }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8b9dc3", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".04em" }}>
                    Upload Log
                  </div>
                  {uploadLog.map((line, i) => (
                    <div key={i} style={{ fontSize: "0.78rem", fontFamily: "monospace", color: line.includes("Failed") || line.includes("Error") ? "#EF4444" : "#76AD25", padding: "2px 0" }}>
                      {line}
                    </div>
                  ))}
                </div>
              )}

              {/* Instructions */}
              <div style={{ background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 12, padding: "20px" }}>
                <h3 style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 12 }}>File Structure</h3>
                <div style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#8b9dc3", lineHeight: 2 }}>
                  <div style={{ color: "#76AD25" }}>module-1-money-foundations/</div>
                  <div style={{ paddingLeft: 16 }}>module.json</div>
                  <div style={{ paddingLeft: 16 }}>lesson-1.json</div>
                  <div style={{ paddingLeft: 16 }}>lesson-2.json</div>
                  <div style={{ paddingLeft: 16 }}>...</div>
                  <div style={{ color: "#76AD25", marginTop: 4 }}>module-2-price-market/</div>
                  <div style={{ paddingLeft: 16 }}>module.json</div>
                  <div style={{ paddingLeft: 16 }}>...</div>
                </div>
              </div>
            </div>
          )}

          {/* PERMISSIONS */}
          {tab === "permissions" && (
            <div>
              <h1 style={{ fontWeight: 800, fontSize: "1.4rem", marginBottom: 4 }}>Permissions</h1>
              <p style={{ color: "#8b9dc3", fontSize: "0.875rem", marginBottom: 24 }}>Manage admin access</p>

              <div style={{ background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 12, padding: "20px", marginBottom: 16 }}>
                <h3 style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 12 }}>Admin Emails</h3>
                <p style={{ color: "#8b9dc3", fontSize: "0.8rem", marginBottom: 14, lineHeight: 1.6 }}>
                  These email addresses have full admin access. To add more admins, update the ADMIN_EMAILS array in <code style={{ background: "#0d1526", padding: "1px 5px", borderRadius: 4 }}>src/app/admin/page.tsx</code>.
                </p>
                {ADMIN_EMAILS.map(email => (
                  <div key={email} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#111c30", borderRadius: 8, marginBottom: 6 }}>
                    <Shield size={14} color="#76AD25" />
                    <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{email}</span>
                    <span style={{ marginLeft: "auto", background: "rgba(118,173,37,.15)", color: "#76AD25", padding: "2px 8px", borderRadius: 99, fontSize: "0.7rem", fontWeight: 700 }}>Admin</span>
                  </div>
                ))}
              </div>

              <div style={{ background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 12, padding: "20px" }}>
                <h3 style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 12 }}>All Users ({allStates.length})</h3>
                {allStates.map((u: any) => (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderBottom: "1px solid #2a3a5c" }}>
                    <div style={{ fontSize: "0.825rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {u.userId}
                    </div>
                    <span style={{
                      background: ADMIN_EMAILS.includes(u.userId) ? "rgba(118,173,37,.15)" : "rgba(59,130,246,.1)",
                      color: ADMIN_EMAILS.includes(u.userId) ? "#76AD25" : "#3B82F6",
                      padding: "2px 8px", borderRadius: 99, fontSize: "0.7rem", fontWeight: 700,
                    }}>
                      {ADMIN_EMAILS.includes(u.userId) ? "Admin" : "Student"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
