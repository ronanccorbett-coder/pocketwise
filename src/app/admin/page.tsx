"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/db";
import { id } from "@instantdb/react";
import {
  Users, BookOpen, BarChart2, LogOut,
  Search, Zap, DollarSign, Edit2, Check, X,
  Upload, Shield, TrendingUp, Award,
  ChevronDown, ChevronUp, RefreshCw, Home,
} from "lucide-react";

const ADMIN_EMAILS = [
  "admin@pocketwise.nz",
  "ronan@pocketwise.nz",
  "ronancorbett@gmail.com",
  "ronanccorbett@gmail.com",
];

type AdminTab = "overview" | "users" | "modules" | "permissions";

type EditField = { userId: string; field: "xp" | "balance"; value: string };

export default function AdminPage() {
  const { user, isLoading } = db.useAuth();
  const router = useRouter();
  const [tab, setTab]             = useState<AdminTab>("overview");
  const [search, setSearch]       = useState("");
  const [editing, setEditing]     = useState<EditField | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [notif, setNotif]         = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadLog, setUploadLog] = useState<string[]>([]);

  const { data: stateData }    = db.useQuery({ userState: {} });
  const { data: usersData }    = db.useQuery({ $users: {} });
  const { data: stockData }    = db.useQuery({ userStocks: {} });
  const { data: loanData }     = db.useQuery({ userLoans: {} });
  const { data: propData }     = db.useQuery({ userProperties: {} });
  const { data: classData }    = db.useQuery({ classrooms: {} });
  const { data: reqData }      = db.useQuery({ teacherRequests: {} });
  const { data: subQueryData } = db.useQuery({ subscriptions: {} });
  const allSubscriptions = (subQueryData?.subscriptions ?? []) as any[];

  const [newPlanType, setNewPlanType]   = useState("monthly");
  const [newPlanLimit, setNewPlanLimit] = useState(35);
  const [genLoading, setGenLoading]     = useState(false);
  const [genCode, setGenCode]           = useState("");

  function generatePlanCode() {
    const seg = () => Math.random().toString(36).substring(2,6).toUpperCase();
    return `${seg()}-${seg()}-${seg()}`;
  }

  async function createPlanCode() {
    setGenLoading(true);
    const code = generatePlanCode();
    const expiryDays = newPlanType === "annual" ? 365 : newPlanType === "trial" ? 14 : 30;
    await db.transact(
      (db as any).tx.subscriptions[id()].update({
        planCode: code,
        status: "unused",
        plan: newPlanType,
        studentLimit: newPlanLimit,
        createdAt: Date.now(),
        expiresAt: Date.now() + expiryDays * 24 * 60 * 60 * 1000,
      })
    );
    setGenCode(code);
    setGenLoading(false);
  }

  const allStates       = (stateData?.userState ?? []) as any[];
  const allUsers        = (usersData?.$users ?? []) as any[];
  const allStocks       = (stockData?.userStocks ?? []) as any[];
  const allLoans        = (loanData?.userLoans ?? []) as any[];
  const allProperties   = (propData?.userProperties ?? []) as any[];
  const allClassrooms   = (classData?.classrooms ?? []) as any[];
  const teacherRequests = (reqData?.teacherRequests ?? []) as any[];
  const pendingRequests = teacherRequests.filter(r => r.status === "pending");

  async function approveTeacher(req: any) {
    // Mark request approved first
    await db.transact((db as any).tx.teacherRequests[req.id].update({ status: "approved", reviewedAt: Date.now() }));

    // Find ALL userState rows matching this teacher (by userId OR email)
    const matchingRows = allStates.filter(s =>
      s.userId === req.userId || s.email === req.email
    );

    console.log("approveTeacher: req=", req, "matchingRows=", matchingRows, "allStates count=", allStates.length);

    if (matchingRows.length === 0) {
      alert(`No userState found for ${req.email} (userId: ${req.userId}). Total states loaded: ${allStates.length}. They may need to log in first.`);
      return;
    }

    // Update all matching rows
    const txns = matchingRows.map(us =>
      (db as any).tx.userState[us.id].update({
        teacherApproved: true,
        role: "teacher",
        pendingNews: JSON.stringify({
          id: "teacher_approved_" + Date.now(),
          headline: "Your educator access has been approved!",
          body: "You now have full access to the Class Dashboard. Click 'My Class' in the navigation bar to create your first class and start tracking your students.",
          category: "opportunity",
          sentiment: "positive",
          date: Date.now(),
        }),
      })
    );
    await db.transact(txns);
    alert(`Approved! Updated ${matchingRows.length} row(s) for ${req.email}.`);
  }

  async function rejectTeacher(req: any) {
    await db.transact((db as any).tx.teacherRequests[req.id].update({ status: "rejected", reviewedAt: Date.now() }));
  }

  function getUserDisplay(userId: string) {
    const found = allUsers.find((u: any) => u.id === userId);
    return found?.email ?? found?.fullName ?? `${userId?.slice(0, 12)}...`;
  }

  function getUserInitials(userId: string) {
    const found = allUsers.find((u: any) => u.id === userId);
    if (found?.email) return found.email.slice(0, 2).toUpperCase();
    return userId?.slice(0, 2).toUpperCase() ?? "??";
  }

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

  const totalXp      = allStates.reduce((s: number, u: any) => s + (u.xp ?? 0), 0);
  const totalBalance = allStates.reduce((s: number, u: any) => s + (u.balance ?? 0), 0);
  const totalLessons = allStates.reduce((s: number, u: any) => s + (u.completedLessons?.length ?? 0), 0);
  const activeUsers  = allStates.filter((u: any) => (u.xp ?? 0) > 0).length;

  const filteredUsers = allStates
    .filter((u: any) => {
      if (search === "") return true;
      const display = getUserDisplay(u.userId).toLowerCase();
      return display.includes(search.toLowerCase()) || u.userId?.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a: any, b: any) => (b.xp ?? 0) - (a.xp ?? 0));

  async function saveEdit() {
    if (!editing) return;
    const val = parseFloat(editing.value);
    if (isNaN(val) || val < 0) { notify("Invalid value"); return; }
    const u = allStates.find((s: any) => s.userId === editing.userId);
    if (!u) return;
    await db.transact(
      (db as any).tx.userState[u.id].update({
        [editing.field]: val,
        netWorth: editing.field === "balance"
          ? val + (u.totalInvested ?? 0) - (u.totalDebt ?? 0)
          : u.netWorth,
      })
    );
    setEditing(null);
    notify(`Updated ${editing.field}`);
  }

  async function resetUser(userId: string) {
    if (!confirm("Reset this user to $5,000 and 0 XP?")) return;
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
    notify("User reset");
  }

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
        log.push(res.ok ? `Saved: ${file.name}` : `Failed: ${file.name} — ${result.error}`);
      } catch {
        log.push(`Error: ${file.name} — invalid JSON`);
      }
      setUploadLog([...log]);
    }
    setUploading(false);
    notify(`Processed ${files.length} file${files.length > 1 ? "s" : ""}`);
  }

  const TABS = [
    { key: "overview" as AdminTab,    Icon: Home,      label: "Overview" },
    { key: "users" as AdminTab,       Icon: Users,     label: "Users" },
    { key: "modules" as AdminTab,     Icon: BookOpen,  label: "Modules" },
    { key: "permissions" as AdminTab, Icon: Shield,    label: "Permissions" },
  ];

  const s = { fontFamily: "Inter, sans-serif" };

  return (
    <div style={{ minHeight: "100vh", background: "#0d1526", color: "#e2e8f0", ...s }}>

      {notif && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 100, background: "#1a2540", color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: "0.85rem", fontWeight: 600, border: "1px solid #76AD25" }}>
          {notif}
        </div>
      )}

      <div style={{ display: "flex", minHeight: "100vh" }}>

        {/* Sidebar */}
        <div style={{ width: 220, background: "#111c30", borderRight: "1px solid #2a3a5c", display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0 }}>
          <div style={{ padding: "20px 16px", borderBottom: "1px solid #2a3a5c", display: "flex", alignItems: "center", gap: 10 }}>
            <Image src="/logo.png" alt="PocketWise" width={28} height={28} style={{ objectFit: "contain", borderRadius: 8, background: "transparent" }} />
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
                ...s, textAlign: "left",
              }}>
                <Icon size={15} /> {label}
              </button>
            ))}
            <button onClick={() => router.push("/curriculum")} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 8, marginTop: 8,
              background: "transparent", color: "#8b9dc3",
              border: "1px solid transparent", fontWeight: 600, fontSize: "0.825rem",
              cursor: "pointer", ...s, textAlign: "left",
            }}>
              <BarChart2 size={15} /> Back to Site
            </button>
          </nav>

          <div style={{ padding: "12px 8px", borderTop: "1px solid #2a3a5c" }}>
            <div style={{ padding: "8px 12px", marginBottom: 4 }}>
              <div style={{ fontSize: "0.7rem", color: "#8b9dc3", marginBottom: 2 }}>Signed in as</div>
              <div style={{ fontSize: "0.78rem", color: "#fff", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
            </div>
            <button onClick={() => { db.auth.signOut(); router.push("/login"); }} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 8,
              background: "transparent", color: "#8b9dc3",
              border: "none", fontWeight: 600, fontSize: "0.825rem",
              cursor: "pointer", ...s,
            }}>
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>

        {/* Main */}
        <div style={{ marginLeft: 220, flex: 1, padding: "28px 32px" }}>

          {/* OVERVIEW */}
          {tab === "overview" && (
            <div>
              <h1 style={{ fontWeight: 800, fontSize: "1.4rem", marginBottom: 4 }}>Dashboard Overview</h1>
              <p style={{ color: "#8b9dc3", fontSize: "0.875rem", marginBottom: 24 }}>Real-time platform statistics</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>
                {[
                  { label: "Total Users",      val: allStates.length,              Icon: Users,      color: "#3B82F6", bg: "rgba(59,130,246,.1)" },
                  { label: "Active Users",      val: activeUsers,                   Icon: TrendingUp, color: "#76AD25", bg: "rgba(118,173,37,.1)" },
                  { label: "Total XP Earned",   val: totalXp.toLocaleString(),      Icon: Zap,        color: "#f59e0b", bg: "rgba(245,158,11,.1)" },
                  { label: "Total Balance",     val: `$${totalBalance.toFixed(0)}`, Icon: DollarSign, color: "#76AD25", bg: "rgba(118,173,37,.1)" },
                  { label: "Lessons Completed", val: totalLessons,                  Icon: BookOpen,   color: "#3B82F6", bg: "rgba(59,130,246,.1)" },
                  { label: "Classes",           val: allClassrooms.length,          Icon: Award,      color: "#a78bfa", bg: "rgba(167,139,250,.1)" },
                ].map(stat => (
                  <div key={stat.label} style={{ background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 12, padding: "18px" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                      <stat.Icon size={17} color={stat.color} />
                    </div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff" }}>{stat.val}</div>
                    <div style={{ fontSize: "0.75rem", color: "#8b9dc3", marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #2a3a5c", fontWeight: 700, fontSize: "0.9rem" }}>
                  Top 10 Students by XP
                </div>
                {allStates.length === 0 && (
                  <div style={{ padding: "32px", textAlign: "center", color: "#8b9dc3", fontSize: "0.875rem" }}>No users yet.</div>
                )}
                {allStates
                  .sort((a: any, b: any) => (b.xp ?? 0) - (a.xp ?? 0))
                  .slice(0, 10)
                  .map((u: any, i: number) => (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", borderBottom: "1px solid #1a2540" }}>
                      <div style={{ width: 28, fontWeight: 800, fontSize: "0.82rem", color: i < 3 ? "#f59e0b" : "#8b9dc3" }}>#{i + 1}</div>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#2a3a5c", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.75rem", color: "#8b9dc3", flexShrink: 0 }}>
                        {getUserInitials(u.userId)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.825rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {getUserDisplay(u.userId)}
                        </div>
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
              <p style={{ color: "#8b9dc3", fontSize: "0.875rem", marginBottom: 20 }}>Click XP or Balance to edit. Click the arrow to expand full details.</p>

              {/* Teacher Requests */}
              {pendingRequests.length > 0 && (
                <div style={{ background: "rgba(59,130,246,.1)", border: "1.5px solid rgba(59,130,246,.3)", borderRadius: 14, padding: "16px 20px", marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B82F6", animation: "pw-pulse-glow 2s ease infinite", color: "#3B82F6" }} />
                    <h3 style={{ fontWeight: 800, color: "#60a5fa", fontSize: "0.9rem" }}>Teacher Requests ({pendingRequests.length} pending)</h3>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {pendingRequests.map((req: any) => (
                      <div key={req.id} style={{ background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.875rem" }}>{req.email}</div>
                          {req.school && <div style={{ fontSize: "0.75rem", color: "#8b9dc3", marginTop: 2 }}>School: {req.school}</div>}
                          {req.message && <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 4, fontStyle: "italic" }}>"{req.message}"</div>}
                          <div style={{ fontSize: "0.65rem", color: "#4a5a7a", marginTop: 4, fontFamily: "monospace" }}>
                            userId: {req.userId || "MISSING"} · reqId: {req.id?.slice(0,8)}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "#4a5a7a", marginTop: 2 }}>{new Date(req.createdAt).toLocaleDateString("en-NZ")}</div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button onClick={() => approveTeacher(req)} className="btn-3d-green" style={{ padding: "7px 16px", fontSize: "0.78rem" }}>Approve</button>
                          <button onClick={() => rejectTeacher(req)} className="btn-3d-red" style={{ padding: "7px 12px", fontSize: "0.78rem" }}>Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual teacher approval tool */}
              <div style={{ background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
                <div style={{ fontWeight: 700, color: "#8b9dc3", fontSize: "0.8rem", marginBottom: 10 }}>Manual Teacher Approval (by email)</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    id="manualApproveEmail"
                    placeholder="teacher@email.com"
                    style={{ flex: 1, padding: "8px 12px", background: "#0d1526", border: "1px solid #2a3a5c", borderRadius: 8, color: "#fff", fontFamily: "Inter,sans-serif", fontSize: "0.875rem", outline: "none" }}
                  />
                  <button
                    className="btn-3d-blue"
                    style={{ padding: "8px 18px", fontSize: "0.8rem" }}
                    onClick={async () => {
                      const email = (document.getElementById("manualApproveEmail") as HTMLInputElement)?.value?.trim();
                      if (!email) return;
                      const rows = allStates.filter(s => s.email === email);
                      if (rows.length === 0) { alert(`No userState found for ${email}`); return; }
                      await db.transact(rows.map(us =>
                        (db as any).tx.userState[us.id].update({ teacherApproved: true, role: "teacher" })
                      ));
                      alert(`Done! Set teacherApproved=true on ${rows.length} row(s) for ${email}`);
                    }}>
                    Force Approve
                  </button>
                </div>
              </div>

              {/* Plan Code Generator */}
              <div style={{ background: "linear-gradient(135deg,#0a2010,#0f2818)", border: "1.5px solid rgba(118,173,37,.25)", borderRadius: 14, padding: "18px 20px", marginBottom: 24 }}>
                <div style={{ fontWeight: 700, color: "#76AD25", fontSize: "0.875rem", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <Shield size={14} color="#76AD25" /> Generate Plan Code
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.65rem", color: "#4a6a8a", fontWeight: 600, marginBottom: 4, textTransform: "uppercase" }}>Plan Type</label>
                    <select value={newPlanType} onChange={e => setNewPlanType(e.target.value)} style={{ padding: "8px 12px", background: "#0d1526", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, color: "#fff", fontFamily: "Inter,sans-serif", fontSize: "0.82rem", outline: "none" }}>
                      <option value="trial" style={{ background: "#0d1526" }}>Trial (14 days)</option>
                      <option value="monthly" style={{ background: "#0d1526" }}>Monthly (30 days)</option>
                      <option value="annual" style={{ background: "#0d1526" }}>Annual (365 days)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.65rem", color: "#4a6a8a", fontWeight: 600, marginBottom: 4, textTransform: "uppercase" }}>Student limit</label>
                    <input type="number" value={newPlanLimit} onChange={e => setNewPlanLimit(parseInt(e.target.value))} style={{ width: 80, padding: "8px 10px", background: "#0d1526", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, color: "#fff", fontFamily: "Inter,sans-serif", fontSize: "0.82rem", outline: "none" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end" }}>
                    <button onClick={createPlanCode} disabled={genLoading} className={!genLoading ? "btn-3d-green" : ""} style={{ padding: "8px 20px", fontSize: "0.82rem", background: genLoading ? "#1e3a5f" : undefined, color: genLoading ? "#4a6a8a" : undefined, border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif" }}>
                      {genLoading ? "Generating..." : "Generate Code"}
                    </button>
                  </div>
                </div>
                {genCode && (
                  <div style={{ background: "rgba(118,173,37,.1)", border: "1px solid rgba(118,173,37,.2)", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", animation: "pw-pop .3s ease" }}>
                    <div>
                      <div style={{ fontSize: "0.65rem", color: "#76AD25", fontWeight: 700, marginBottom: 2 }}>NEW CODE — SEND TO TEACHER</div>
                      <div style={{ fontWeight: 900, fontSize: "1.2rem", color: "#fff", letterSpacing: ".1em", fontFamily: "monospace" }}>{genCode}</div>
                    </div>
                    <button onClick={() => navigator.clipboard.writeText(genCode)} style={{ background: "rgba(118,173,37,.15)", border: "1px solid rgba(118,173,37,.3)", borderRadius: 8, padding: "6px 12px", color: "#76AD25", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer", fontFamily: "Inter,sans-serif" }}>
                      Copy
                    </button>
                  </div>
                )}
              </div>

              {/* All subscriptions */}
              {allSubscriptions.length > 0 && (
                <div style={{ background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
                  <div style={{ fontWeight: 700, color: "#8b9dc3", fontSize: "0.8rem", marginBottom: 10 }}>All Subscriptions ({allSubscriptions.length})</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {allSubscriptions.slice().sort((a:any,b:any) => (b.createdAt??0)-(a.createdAt??0)).slice(0,10).map((s: any) => (
                      <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.78rem" }}>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#fff", minWidth: 140 }}>{s.planCode}</span>
                        <span style={{ background: s.status === "active" ? "rgba(118,173,37,.15)" : s.status === "unused" ? "rgba(59,130,246,.15)" : "rgba(239,68,68,.12)", color: s.status === "active" ? "#76AD25" : s.status === "unused" ? "#60a5fa" : "#f87171", padding: "2px 7px", borderRadius: 99, fontSize: "0.65rem", fontWeight: 700 }}>{s.status}</span>
                        <span style={{ color: "#4a6a8a" }}>{s.plan}</span>
                        <span style={{ color: "#4a6a8a" }}>{s.ownerEmail ?? "—"}</span>
                        {s.expiresAt && <span style={{ color: "#4a6a8a", marginLeft: "auto" }}>exp {new Date(s.expiresAt).toLocaleDateString("en-NZ")}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ position: "relative", marginBottom: 20, maxWidth: 400 }}>
                <Search size={15} color="#8b9dc3" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  placeholder="Search by email or ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: "100%", background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 9, padding: "10px 14px 10px 36px", color: "#fff", ...s, fontSize: "0.875rem", outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filteredUsers.length === 0 && (
                  <div style={{ background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 12, padding: "48px", textAlign: "center", color: "#8b9dc3" }}>
                    No users found.
                  </div>
                )}
                {filteredUsers.map((u: any) => {
                  const isExpanded = expandedUser === u.userId;
                  const userStocks = allStocks.filter((s: any) => s.userId === u.userId);
                  const userLoans  = allLoans.filter((l: any) => l.userId === u.userId);
                  const userProps  = allProperties.filter((p: any) => p.userId === u.userId);
                  const displayName = getUserDisplay(u.userId);
                  const initials = getUserInitials(u.userId);

                  return (
                    <div key={u.id} style={{ background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 12, overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", flexWrap: "wrap" }}>

                        {/* Avatar */}
                        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#2a3a5c", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.78rem", color: "#8b9dc3", flexShrink: 0 }}>
                          {initials}
                        </div>

                        {/* Name/email */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {displayName}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "#8b9dc3", marginTop: 1 }}>
                            {u.completedLessons?.length ?? 0} lessons · {u.streak ?? 0} day streak · {u.badges?.length ?? 0} badges
                          </div>
                        </div>

                        {/* XP edit */}
                        <div style={{ minWidth: 100 }}>
                          {editing !== null && editing.userId === u.userId && editing.field === "xp" ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <input
                                type="number"
                                value={editing.value}
                                onChange={e => setEditing({ ...editing, value: e.target.value })}
                                autoFocus
                                style={{ width: 70, background: "#0d1526", border: "1px solid #76AD25", borderRadius: 6, padding: "4px 6px", color: "#fff", ...s, fontSize: "0.8rem", outline: "none" }}
                              />
                              <button onClick={saveEdit} style={{ background: "#76AD25", border: "none", borderRadius: 5, padding: "5px 7px", cursor: "pointer" }}><Check size={12} color="#fff" /></button>
                              <button onClick={() => setEditing(null)} style={{ background: "#EF4444", border: "none", borderRadius: 5, padding: "5px 7px", cursor: "pointer" }}><X size={12} color="#fff" /></button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }} onClick={() => setEditing({ userId: u.userId, field: "xp", value: String(u.xp ?? 0) })}>
                              <Zap size={13} color="#f59e0b" />
                              <span style={{ fontWeight: 700, color: "#f59e0b", fontSize: "0.875rem" }}>{(u.xp ?? 0).toLocaleString()}</span>
                              <Edit2 size={11} color="#4a5a7a" />
                            </div>
                          )}
                        </div>

                        {/* Balance edit */}
                        <div style={{ minWidth: 110 }}>
                          {editing !== null && editing.userId === u.userId && editing.field === "balance" ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <input
                                type="number"
                                value={editing.value}
                                onChange={e => setEditing({ ...editing, value: e.target.value })}
                                autoFocus
                                style={{ width: 80, background: "#0d1526", border: "1px solid #76AD25", borderRadius: 6, padding: "4px 6px", color: "#fff", ...s, fontSize: "0.8rem", outline: "none" }}
                              />
                              <button onClick={saveEdit} style={{ background: "#76AD25", border: "none", borderRadius: 5, padding: "5px 7px", cursor: "pointer" }}><Check size={12} color="#fff" /></button>
                              <button onClick={() => setEditing(null)} style={{ background: "#EF4444", border: "none", borderRadius: 5, padding: "5px 7px", cursor: "pointer" }}><X size={12} color="#fff" /></button>
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

                      {/* Expanded details */}
                      {isExpanded && (
                        <div style={{ borderTop: "1px solid #2a3a5c", padding: "14px 18px", background: "#111c30" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8, marginBottom: 12 }}>
                            {[
                              { label: "Net Worth",      val: `$${(u.netWorth ?? 0).toFixed(0)}` },
                              { label: "Total Invested", val: `$${(u.totalInvested ?? 0).toFixed(0)}` },
                              { label: "Total Debt",     val: `$${(u.totalDebt ?? 0).toFixed(0)}` },
                              { label: "Total Earned",   val: `$${(u.totalEarned ?? 0).toFixed(0)}` },
                              { label: "Job",            val: u.currentJobId?.split(":")?.[0] ?? "None" },
                              { label: "Badges",         val: (u.badges ?? []).length.toString() },
                            ].map(stat => (
                              <div key={stat.label} style={{ background: "#1a2540", borderRadius: 8, padding: "8px 12px" }}>
                                <div style={{ fontSize: "0.68rem", color: "#8b9dc3", marginBottom: 2 }}>{stat.label}</div>
                                <div style={{ fontSize: "0.825rem", fontWeight: 600 }}>{stat.val}</div>
                              </div>
                            ))}
                          </div>

                          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#8b9dc3", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>
                            Completed Lessons ({u.completedLessons?.length ?? 0})
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                            {(u.completedLessons ?? []).length === 0
                              ? <span style={{ fontSize: "0.78rem", color: "#4a5a7a" }}>None yet</span>
                              : (u.completedLessons ?? []).slice(0, 20).map((l: string) => (
                                <span key={l} style={{ background: "#2a3a5c", color: "#94a3b8", padding: "2px 8px", borderRadius: 4, fontSize: "0.68rem" }}>{l}</span>
                              ))
                            }
                          </div>

                          {userStocks.length > 0 && (
                            <>
                              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#8b9dc3", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>
                                Stocks ({userStocks.length})
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                                {userStocks.map((stock: any) => (
                                  <span key={stock.id} style={{ background: "rgba(59,130,246,.15)", color: "#3B82F6", padding: "2px 8px", borderRadius: 4, fontSize: "0.7rem" }}>
                                    {stock.symbol} x{stock.quantity}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}

                          {userLoans.length > 0 && (
                            <>
                              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#8b9dc3", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>
                                Loans ({userLoans.length})
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {userLoans.map((loan: any) => (
                                  <span key={loan.id} style={{ background: "rgba(239,68,68,.15)", color: "#EF4444", padding: "2px 8px", borderRadius: 4, fontSize: "0.7rem" }}>
                                    {loan.name}: ${(loan.balance ?? 0).toFixed(0)}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODULES */}
          {tab === "modules" && (
            <div>
              <h1 style={{ fontWeight: 800, fontSize: "1.4rem", marginBottom: 4 }}>Module Management</h1>
              <p style={{ color: "#8b9dc3", fontSize: "0.875rem", marginBottom: 24 }}>Upload lesson JSON files to add or update curriculum content</p>

              <div style={{ background: "#1a2540", border: "2px dashed #2a3a5c", borderRadius: 14, padding: "40px", textAlign: "center", marginBottom: 24 }}>
                <Upload size={32} color="#8b9dc3" style={{ margin: "0 auto 12px", display: "block" }} />
                <h3 style={{ fontWeight: 700, marginBottom: 6 }}>Upload Module Files</h3>
                <p style={{ color: "#8b9dc3", fontSize: "0.825rem", marginBottom: 20 }}>
                  Upload module.json and lesson-X.json files directly.
                </p>
                <label style={{ display: "inline-block", padding: "10px 24px", background: uploading ? "#2a3a5c" : "#76AD25", color: "#fff", borderRadius: 8, fontWeight: 700, fontSize: "0.875rem", cursor: uploading ? "not-allowed" : "pointer" }}>
                  {uploading ? "Uploading..." : "Choose JSON Files"}
                  <input type="file" accept=".json" multiple onChange={handleModuleUpload} style={{ display: "none" }} disabled={uploading} />
                </label>
              </div>

              {uploadLog.length > 0 && (
                <div style={{ background: "#111c30", border: "1px solid #2a3a5c", borderRadius: 12, padding: "16px", marginBottom: 24 }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8b9dc3", marginBottom: 8, textTransform: "uppercase" }}>Upload Log</div>
                  {uploadLog.map((line, i) => (
                    <div key={i} style={{ fontSize: "0.78rem", fontFamily: "monospace", color: line.includes("Failed") || line.includes("Error") ? "#EF4444" : "#76AD25", padding: "2px 0" }}>
                      {line}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PERMISSIONS */}
          {tab === "permissions" && (
            <div>
              <h1 style={{ fontWeight: 800, fontSize: "1.4rem", marginBottom: 4 }}>Permissions</h1>
              <p style={{ color: "#8b9dc3", fontSize: "0.875rem", marginBottom: 24 }}>Admin access management</p>

              <div style={{ background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 12, padding: "20px", marginBottom: 16 }}>
                <h3 style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 12 }}>Admin Emails</h3>
                <p style={{ color: "#8b9dc3", fontSize: "0.8rem", marginBottom: 14, lineHeight: 1.6 }}>
                  To add more admins, update the ADMIN_EMAILS array at the top of <code style={{ background: "#0d1526", padding: "1px 5px", borderRadius: 4 }}>src/app/admin/page.tsx</code>.
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
                <h3 style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 12 }}>All Registered Users ({allUsers.length})</h3>
                {allUsers.map((u: any) => (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderBottom: "1px solid #2a3a5c" }}>
                    <div style={{ fontSize: "0.825rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {u.email ?? u.fullName ?? u.id}
                    </div>
                    <span style={{
                      background: ADMIN_EMAILS.includes(u.email ?? "") ? "rgba(118,173,37,.15)" : "rgba(59,130,246,.1)",
                      color: ADMIN_EMAILS.includes(u.email ?? "") ? "#76AD25" : "#3B82F6",
                      padding: "2px 8px", borderRadius: 99, fontSize: "0.7rem", fontWeight: 700,
                    }}>
                      {ADMIN_EMAILS.includes(u.email ?? "") ? "Admin" : "Student"}
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
