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
  Plus, Trash2, FileJson, Eye, EyeOff, Download, Save, AlertCircle, GraduationCap,
} from "lucide-react";

const ADMIN_EMAILS = [
  "admin@pocketwise.nz",
  "ronan@pocketwise.nz",
  "ronancorbett@gmail.com",
  "ronanccorbett@gmail.com",
];

type AdminTab = "overview" | "users" | "access" | "modules" | "permissions";

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
  const { data: enrollData }   = db.useQuery({ classEnrollments: {} });
  const allSubscriptions = (subQueryData?.subscriptions ?? []) as any[];
  const allEnrollments   = (enrollData?.classEnrollments ?? []) as any[];

  const [newPlanType, setNewPlanType]   = useState("monthly");
  const [newPlanLimit, setNewPlanLimit] = useState(35);
  const [genLoading, setGenLoading]     = useState(false);
  const [genCode, setGenCode]           = useState("");

  // ── Module editor state ─────────────────────────────────────────────────
  // Fetched modules come from /api/modules listing
  const [modulesData, setModulesData]   = useState<any[]>([]);
  const [modLoading, setModLoading]     = useState(false);
  const [selectedMod, setSelectedMod]   = useState<any>(null);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [editorMode, setEditorMode]     = useState<"list"|"edit-module"|"edit-lesson"|"create-module"|"create-lesson">("list");
  const [editingJson, setEditingJson]   = useState("");
  const [jsonError, setJsonError]       = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [savingModule, setSavingModule] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string|null>(null);

  async function loadModules() {
    setModLoading(true);
    try {
      const res = await fetch("/api/modules");
      if (res.ok) { const d = await res.json(); setModulesData(d.modules ?? []); }
    } catch(e) { setModulesData([]); }
    setModLoading(false);
  }

  async function loadModule(folder: string) {
    try {
      const res = await fetch(`/api/modules?folder=${encodeURIComponent(folder)}`);
      if (res.ok) { const d = await res.json(); setSelectedMod(d); return d; }
    } catch(e) {}
    return null;
  }

  async function saveJson(folder: string, filename: string, jsonStr: string) {
    setSavingModule(true); setJsonError("");
    try {
      JSON.parse(jsonStr); // validate
    } catch(e: any) { setJsonError("Invalid JSON: " + e.message); setSavingModule(false); return; }
    try {
      const res = await fetch("/api/admin/upload-module", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder, filename, content: jsonStr }),
      });
      if (res.ok) { notify("Saved!"); await loadModules(); }
      else { setJsonError("Save failed: " + (await res.text())); }
    } catch(e: any) { setJsonError("Save failed: " + e.message); }
    setSavingModule(false);
  }

  async function deleteModule(folder: string) {
    try {
      await fetch(`/api/admin/upload-module?folder=${encodeURIComponent(folder)}`, { method: "DELETE" });
      notify("Module deleted");
      setSelectedMod(null); setEditorMode("list"); await loadModules();
    } catch(e) { notify("Delete failed"); }
    setDeleteConfirm(null);
  }

  async function deleteLesson(folder: string, filename: string) {
    try {
      await fetch(`/api/admin/upload-module?folder=${encodeURIComponent(folder)}&filename=${encodeURIComponent(filename)}`, { method: "DELETE" });
      notify("Lesson deleted");
      setSelectedLesson(null); setEditorMode("edit-module");
      const mod = await loadModule(folder); setSelectedMod(mod);
    } catch(e) { notify("Delete failed"); }
    setDeleteConfirm(null);
  }

  function downloadJson(data: any, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  }

  const BLANK_MODULE = {
    folder: "module-X-title", title: "Module Title", description: "Module description.",
    level: "Year 11", nceaStandard: "AS92028", xpReward: 200, colorTheme: "#76AD25", order: 99,
    lessons: [],
  };

  const BLANK_LESSON = {
    id: "mX-l1", title: "Lesson Title", order: 1, xpReward: 25, filename: "lesson-1.json",
    activities: [
      { type: "slide", id: "s1", title: "Slide title", content: "Slide content here.", notePrompt: "Reflection prompt." },
      { type: "quiz", id: "q1", questions: [{ question: "Question?", options: ["A","B","C","D"], correctIndex: 0, explanation: "Explanation." }] },
    ],
  };

  function generatePlanCode() {
    const seg = () => Math.random().toString(36).substring(2,6).toUpperCase();
    return `${seg()}-${seg()}-${seg()}`;
  }

  async function reactivateSub(sub: any) {
    const days = sub.plan === "annual" ? 365 : sub.plan === "trial" ? 14 : 30;
    const expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;
    if (!confirm(`Re-activate ${sub.planCode} for ${days} more days (until ${new Date(expiresAt).toLocaleDateString("en-NZ")})?`)) return;
    await db.transact(
      (db as any).tx.subscriptions[sub.id].update({
        status: "active",
        activatedAt: Date.now(),
        expiresAt,
      })
    );
    notify(`${sub.planCode} extended to ${new Date(expiresAt).toLocaleDateString("en-NZ")}`);
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
    // 1. Mark request approved
    await db.transact((db as any).tx.teacherRequests[req.id].update({ status: "approved", reviewedAt: Date.now() }));
    // 2. Try to update userState
    await forceApproveByEmail(req.email);
  }

  async function forceApproveByEmail(email: string) {
    if (!email) return;

    // Try from allStates first
    let matching = allStates.filter((s: any) => s.email === email);

    // If not found in allStates, try a fresh query
    if (matching.length === 0) {
      alert(`Not found in loaded data (${allStates.length} rows). Trying direct write via known row IDs... Check console.`);
      console.log("All states:", allStates.map((s:any) => ({ id: s.id, email: s.email, userId: s.userId })));
      return;
    }

    const approvalData = {
      teacherApproved: true,
      role: "teacher",
      email: email,
    };

    console.log("Approving:", matching.map((s:any) => s.id));
    try {
      await db.transact(matching.map((us: any) => (db as any).tx.userState[us.id].update(approvalData)));
      alert(`Done — wrote teacherApproved=true on ${matching.length} row(s) for ${email}. Check InstantDB Explorer to confirm.`);
    } catch(e: any) {
      alert(`Write FAILED: ${e.message ?? String(e)}`);
      console.error(e);
    }
  }

  async function forceApproveById(rowId: string) {
    if (!rowId) return;
    try {
      await db.transact((db as any).tx.userState[rowId].update({
        teacherApproved: true,
        role: "teacher",
      }));
      alert(`Done — wrote teacherApproved=true on row ${rowId}`);
    } catch(e: any) {
      alert(`Write FAILED: ${e.message ?? String(e)}`);
    }
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
    { key: "access" as AdminTab,      Icon: GraduationCap, label: "Access" },
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

              {/* Debug: userState roles */}
              <div style={{ background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 12, padding: "14px 20px", marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: "#8b9dc3", fontSize: "0.78rem", marginBottom: 8 }}>
                  UserState rows with role/teacher data ({allStates.filter((s:any) => s.role || s.email).length} have email or role)
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 140, overflowY: "auto" }}>
                  {allStates.filter((s:any) => s.email).map((s:any) => (
                    <div key={s.id} style={{ display: "flex", gap: 8, fontSize: "0.7rem", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ color: "#fff", minWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>{s.email ?? "no email"}</span>
                      <span style={{ color: "#4a5a7a", fontFamily: "monospace", fontSize: "0.6rem" }}>{s.id?.slice(0,8)}</span>
                      <span style={{ background: s.role === "teacher" ? "rgba(59,130,246,.2)" : "rgba(255,255,255,.05)", color: s.role === "teacher" ? "#60a5fa" : "#4a6a8a", padding: "1px 6px", borderRadius: 4, fontSize: "0.62rem" }}>{s.role ?? "student"}</span>
                      <span style={{ background: s.teacherApproved ? "rgba(118,173,37,.2)" : "rgba(255,255,255,.05)", color: s.teacherApproved ? "#76AD25" : "#4a6a8a", padding: "1px 6px", borderRadius: 4, fontSize: "0.62rem" }}>{s.teacherApproved ? "✓ approved" : "not approved"}</span>
                      <button onClick={() => forceApproveById(s.id)} style={{ background: "rgba(118,173,37,.15)", border: "1px solid rgba(118,173,37,.2)", borderRadius: 4, padding: "2px 8px", color: "#76AD25", fontSize: "0.62rem", cursor: "pointer", fontFamily: "Inter,sans-serif" }}>Approve by ID</button>
                    </div>
                  ))}
                </div>
              </div>

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
                      await forceApproveByEmail(email);
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

          {/* ACCESS — subscription → class troubleshooting */}
          {tab === "access" && (() => {
            const now = Date.now();
            const activeSubs = allSubscriptions.filter((s: any) => s.status === "active");
            const classroomById = (cid: string) => allClassrooms.find((c: any) => c.id === cid);
            const enrollsFor = (cid: string) => allEnrollments.filter((e: any) => e.classroomId === cid);

            // Replicate AuthGuard: a class grants access when a sub is active AND not past expiry AND linked to that class.
            const grants = (sub: any) => sub.status === "active" && !!sub.classroomId && (sub.expiresAt ?? 0) > now;

            return (
              <div>
                <h1 style={{ fontWeight: 800, fontSize: "1.4rem", marginBottom: 4 }}>Access & Subscriptions</h1>
                <p style={{ color: "#8b9dc3", fontSize: "0.875rem", marginBottom: 20, lineHeight: 1.6 }}>
                  Active subscriptions and the classes they unlock. Students only get access when their class is linked
                  to a subscription that is <strong>active</strong> <em>and</em> not past its expiry date. A sub can read
                  "active" on the dashboard but still be denied here if its expiry has passed or it isn't linked to a class —
                  that's the usual cause of a "subscription expired" message.
                </p>

                {/* Summary cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
                  {[
                    { label: "Active Subscriptions", val: activeSubs.length, color: "#76AD25", bg: "rgba(118,173,37,.1)", Icon: Shield },
                    { label: "Classes w/ Access",    val: activeSubs.filter(grants).length, color: "#3B82F6", bg: "rgba(59,130,246,.1)", Icon: GraduationCap },
                    { label: "Active but Expired",   val: activeSubs.filter((s:any) => (s.expiresAt ?? 0) <= now).length, color: "#f87171", bg: "rgba(239,68,68,.1)", Icon: AlertCircle },
                    { label: "Active, No Class",     val: activeSubs.filter((s:any) => !s.classroomId).length, color: "#fbbf24", bg: "rgba(245,158,11,.1)", Icon: AlertCircle },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 12, padding: "16px" }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                        <stat.Icon size={16} color={stat.color} />
                      </div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff" }}>{stat.val}</div>
                      <div style={{ fontSize: "0.72rem", color: "#8b9dc3", marginTop: 2 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {activeSubs.length === 0 && (
                  <div style={{ background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 12, padding: "40px", textAlign: "center", color: "#8b9dc3" }}>
                    No active subscriptions.
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {activeSubs
                    .slice()
                    .sort((a: any, b: any) => (b.activatedAt ?? b.createdAt ?? 0) - (a.activatedAt ?? a.createdAt ?? 0))
                    .map((sub: any) => {
                      const cls = sub.classroomId ? classroomById(sub.classroomId) : null;
                      const enrolls = cls ? enrollsFor(cls.id) : [];
                      const expiredByDate = (sub.expiresAt ?? 0) <= now;
                      const ok = grants(sub);

                      // Diagnostic reasons why access would be denied despite "active" status
                      const problems: string[] = [];
                      if (!sub.classroomId) problems.push("Not linked to any class — teacher must activate the code on a class.");
                      else if (!cls) problems.push(`Linked classroomId ${String(sub.classroomId).slice(0,8)}… no longer exists.`);
                      if (expiredByDate) problems.push(`Expiry date passed (${sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString("en-NZ") : "no date"}) — students see "expired" even though status is "active".`);

                      return (
                        <div key={sub.id} style={{ background: "#1a2540", border: `1px solid ${ok ? "rgba(118,173,37,.3)" : "rgba(239,68,68,.3)"}`, borderRadius: 12, overflow: "hidden" }}>
                          {/* Header row */}
                          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", flexWrap: "wrap" }}>
                            <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#fff", fontSize: "0.9rem", letterSpacing: ".05em" }}>{sub.planCode}</span>
                            <span style={{ background: "rgba(118,173,37,.15)", color: "#76AD25", padding: "2px 8px", borderRadius: 99, fontSize: "0.65rem", fontWeight: 700 }}>{sub.status}</span>
                            <span style={{ color: "#8b9dc3", fontSize: "0.75rem" }}>{sub.plan ?? "—"}</span>
                            <span style={{ color: "#8b9dc3", fontSize: "0.75rem" }}>{sub.ownerEmail ?? "no owner"}</span>
                            <span style={{
                              marginLeft: "auto",
                              background: ok ? "rgba(118,173,37,.15)" : "rgba(239,68,68,.15)",
                              color: ok ? "#76AD25" : "#f87171",
                              padding: "3px 10px", borderRadius: 99, fontSize: "0.68rem", fontWeight: 800,
                              display: "flex", alignItems: "center", gap: 5,
                            }}>
                              {ok ? <Check size={12} /> : <X size={12} />}
                              {ok ? "GRANTS ACCESS" : "ACCESS DENIED"}
                            </span>
                            <button
                              onClick={() => reactivateSub(sub)}
                              title="Reset status to active and push expiry out by the plan length"
                              style={{ display: "flex", alignItems: "center", gap: 5, background: expiredByDate ? "rgba(118,173,37,.15)" : "rgba(255,255,255,.05)", border: `1px solid ${expiredByDate ? "rgba(118,173,37,.3)" : "rgba(255,255,255,.1)"}`, borderRadius: 8, padding: "5px 12px", color: expiredByDate ? "#76AD25" : "#8b9dc3", fontWeight: 700, fontSize: "0.72rem", cursor: "pointer", fontFamily: "Inter,sans-serif" }}>
                              <RefreshCw size={12} /> {expiredByDate ? "Re-activate" : "Extend"}
                            </button>
                          </div>

                          {/* Detail body */}
                          <div style={{ borderTop: "1px solid #2a3a5c", padding: "14px 18px", background: "#111c30" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8, marginBottom: 12 }}>
                              <div style={{ background: "#1a2540", borderRadius: 8, padding: "8px 12px" }}>
                                <div style={{ fontSize: "0.68rem", color: "#8b9dc3", marginBottom: 2 }}>Linked Class</div>
                                <div style={{ fontSize: "0.825rem", fontWeight: 600, color: cls ? "#fff" : "#f87171" }}>{cls ? cls.name : "— none —"}</div>
                              </div>
                              <div style={{ background: "#1a2540", borderRadius: 8, padding: "8px 12px" }}>
                                <div style={{ fontSize: "0.68rem", color: "#8b9dc3", marginBottom: 2 }}>Join Code</div>
                                <div style={{ fontSize: "0.825rem", fontWeight: 600, fontFamily: "monospace" }}>{cls?.joinCode ?? "—"}</div>
                              </div>
                              <div style={{ background: "#1a2540", borderRadius: 8, padding: "8px 12px" }}>
                                <div style={{ fontSize: "0.68rem", color: "#8b9dc3", marginBottom: 2 }}>Enrolled Students</div>
                                <div style={{ fontSize: "0.825rem", fontWeight: 600 }}>{cls ? `${enrolls.length}${sub.studentLimit ? ` / ${sub.studentLimit}` : ""}` : "—"}</div>
                              </div>
                              <div style={{ background: "#1a2540", borderRadius: 8, padding: "8px 12px" }}>
                                <div style={{ fontSize: "0.68rem", color: "#8b9dc3", marginBottom: 2 }}>Expires</div>
                                <div style={{ fontSize: "0.825rem", fontWeight: 600, color: expiredByDate ? "#f87171" : "#fff" }}>
                                  {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString("en-NZ") : "—"}{expiredByDate ? " (passed)" : ""}
                                </div>
                              </div>
                            </div>

                            {/* Problems */}
                            {problems.length > 0 && (
                              <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.15)", borderRadius: 10, padding: "10px 14px", marginBottom: enrolls.length ? 12 : 0 }}>
                                <div style={{ fontSize: "0.7rem", color: "#f87171", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                                  <AlertCircle size={12} /> Why access is denied
                                </div>
                                {problems.map((p, i) => (
                                  <div key={i} style={{ fontSize: "0.78rem", color: "#fca5a5", lineHeight: 1.5, marginBottom: i < problems.length - 1 ? 4 : 0 }}>• {p}</div>
                                ))}
                              </div>
                            )}

                            {/* Enrolled students — verify the affected student's email is present & matches exactly */}
                            {cls && (
                              <>
                                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#8b9dc3", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>
                                  Students in this class ({enrolls.length})
                                </div>
                                {enrolls.length === 0
                                  ? <span style={{ fontSize: "0.78rem", color: "#4a5a7a" }}>No students enrolled yet.</span>
                                  : (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                      {enrolls.map((e: any) => (
                                        <span key={e.id} style={{ background: "#2a3a5c", color: "#94a3b8", padding: "2px 8px", borderRadius: 4, fontSize: "0.7rem", fontFamily: "monospace" }}>{e.studentEmail}</span>
                                      ))}
                                    </div>
                                  )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })()}

          {/* MODULES */}
          {tab === "modules" && (
            <div>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <h1 style={{ fontWeight: 800, fontSize: "1.4rem", marginBottom: 2 }}>Module Manager</h1>
                  <p style={{ color: "#8b9dc3", fontSize: "0.82rem" }}>Upload, edit, and manage all curriculum content</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setEditorMode("list"); loadModules(); }} style={{ padding: "8px 14px", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, color: "#8b9dc3", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer", fontFamily: "Inter,sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
                    <RefreshCw size={13} /> Refresh
                  </button>
                  <button onClick={() => { setEditingJson(JSON.stringify(BLANK_MODULE, null, 2)); setEditorMode("create-module"); setJsonError(""); }} className="btn-3d-green" style={{ padding: "8px 16px", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 5 }}>
                    <Plus size={13} /> New Module
                  </button>
                  <label className="btn-3d-blue" style={{ padding: "8px 16px", fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
                    <Upload size={13} /> Upload JSON
                    <input type="file" accept=".json" multiple style={{ display: "none" }} onChange={handleModuleUpload} />
                  </label>
                </div>
              </div>

              {/* Upload log */}
              {uploadLog.length > 0 && (
                <div style={{ background: "#111c30", border: "1px solid #2a3a5c", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: "0.75rem", fontFamily: "monospace" }}>
                  {uploadLog.map((l, i) => <div key={i} style={{ color: l.includes("Error") || l.includes("Failed") ? "#EF4444" : "#76AD25", padding: "1px 0" }}>{l}</div>)}
                </div>
              )}

              {/* List view */}
              {editorMode === "list" && (
                <div>
                  {modLoading ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "#8b9dc3" }}>Loading modules...</div>
                  ) : modulesData.length === 0 ? (
                    <div style={{ background: "#1a2540", border: "2px dashed #2a3a5c", borderRadius: 14, padding: "48px", textAlign: "center" }}>
                      <FileJson size={40} color="#4a6a8a" style={{ margin: "0 auto 12px", display: "block" }} />
                      <p style={{ color: "#8b9dc3", marginBottom: 16 }}>No modules loaded yet. Click Refresh or upload JSON files.</p>
                      <button onClick={loadModules} className="btn-3d-green" style={{ padding: "10px 24px", fontSize: "0.875rem" }}>Load Modules</button>
                    </div>
                  ) : (
                    <div>
                      <input value={moduleFilter} onChange={e => setModuleFilter(e.target.value)} placeholder="Filter modules..." className="pw-input" style={{ width: "100%", marginBottom: 14, fontSize: "0.875rem" }} />
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {modulesData.filter(m => !moduleFilter || m.title?.toLowerCase().includes(moduleFilter.toLowerCase()) || m.folder?.includes(moduleFilter)).map((mod: any) => (
                          <div key={mod.folder} style={{ background: "#111c30", border: "1px solid #2a3a5c", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 12, height: 12, borderRadius: "50%", background: mod.colorTheme || "#76AD25", flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{mod.title}</div>
                              <div style={{ fontSize: "0.72rem", color: "#8b9dc3", marginTop: 2 }}>{mod.folder} · {mod.lessons?.length ?? 0} lessons · {mod.level}</div>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => downloadJson(mod, `${mod.folder}.json`)} style={{ padding: "5px 10px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 6, color: "#8b9dc3", cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: 4 }}>
                                <Download size={11} /> JSON
                              </button>
                              <button onClick={async () => { const m = await loadModule(mod.folder); setSelectedMod(m); setEditingJson(JSON.stringify(m, null, 2)); setEditorMode("edit-module"); setJsonError(""); }} style={{ padding: "5px 10px", background: "rgba(59,130,246,.12)", border: "1px solid rgba(59,130,246,.25)", borderRadius: 6, color: "#60a5fa", cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: 4 }}>
                                <Edit2 size={11} /> Edit
                              </button>
                              {deleteConfirm === mod.folder ? (
                                <div style={{ display: "flex", gap: 4 }}>
                                  <button onClick={() => deleteModule(mod.folder)} style={{ padding: "5px 10px", background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 6, color: "#EF4444", cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: "0.72rem" }}>Confirm</button>
                                  <button onClick={() => setDeleteConfirm(null)} style={{ padding: "5px 10px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 6, color: "#8b9dc3", cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: "0.72rem" }}>Cancel</button>
                                </div>
                              ) : (
                                <button onClick={() => setDeleteConfirm(mod.folder)} style={{ padding: "5px 10px", background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 6, color: "#EF4444", cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: 4 }}>
                                  <Trash2 size={11} /> Delete
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Edit module view */}
              {(editorMode === "edit-module" || editorMode === "create-module") && selectedMod !== null || editorMode === "create-module" ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <button onClick={() => { setEditorMode("list"); setSelectedMod(null); setJsonError(""); }} style={{ padding: "6px 12px", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 7, color: "#8b9dc3", cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: "0.78rem" }}>
                      Back
                    </button>
                    <h2 style={{ fontWeight: 700, fontSize: "1rem" }}>{editorMode === "create-module" ? "Create New Module" : `Editing: ${selectedMod?.title ?? ""}`}</h2>
                    {editorMode === "edit-module" && selectedMod && (
                      <button onClick={() => { setEditingJson(JSON.stringify(BLANK_LESSON, null, 2)); setEditorMode("create-lesson"); setJsonError(""); }} className="btn-3d-green" style={{ marginLeft: "auto", padding: "7px 14px", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: 5 }}>
                        <Plus size={12} /> Add Lesson
                      </button>
                    )}
                  </div>

                  {/* Lesson list for existing module */}
                  {editorMode === "edit-module" && selectedMod?.lessons?.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: "0.72rem", color: "#8b9dc3", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>Lessons ({selectedMod.lessons.length})</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {selectedMod.lessons.map((lesson: any) => (
                          <div key={lesson.filename} style={{ background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 9, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(118,173,37,.15)", border: "1px solid rgba(118,173,37,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 800, color: "#76AD25", flexShrink: 0 }}>{lesson.order}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: "0.82rem" }}>{lesson.title}</div>
                              <div style={{ fontSize: "0.68rem", color: "#8b9dc3" }}>{lesson.filename} · {lesson.activities?.length ?? 0} activities · {lesson.xpReward} XP</div>
                            </div>
                            <div style={{ display: "flex", gap: 5 }}>
                              <button onClick={() => { setSelectedLesson(lesson); setEditingJson(JSON.stringify(lesson, null, 2)); setEditorMode("edit-lesson"); setJsonError(""); }} style={{ padding: "4px 9px", background: "rgba(59,130,246,.1)", border: "1px solid rgba(59,130,246,.2)", borderRadius: 5, color: "#60a5fa", cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: "0.68rem" }}>Edit</button>
                              <button onClick={() => downloadJson(lesson, lesson.filename)} style={{ padding: "4px 9px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 5, color: "#8b9dc3", cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: "0.68rem" }}>DL</button>
                              {deleteConfirm === lesson.filename ? (
                                <>
                                  <button onClick={() => deleteLesson(selectedMod.folder, lesson.filename)} style={{ padding: "4px 9px", background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 5, color: "#EF4444", cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: "0.68rem" }}>Sure?</button>
                                  <button onClick={() => setDeleteConfirm(null)} style={{ padding: "4px 9px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 5, color: "#8b9dc3", cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: "0.68rem" }}>No</button>
                                </>
                              ) : (
                                <button onClick={() => setDeleteConfirm(lesson.filename)} style={{ padding: "4px 9px", background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.15)", borderRadius: 5, color: "#EF4444", cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: "0.68rem" }}>Del</button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* JSON editor */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ fontSize: "0.72rem", color: "#8b9dc3", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>
                        {editorMode === "create-module" ? "module.json" : `module.json`}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { try { setEditingJson(JSON.stringify(JSON.parse(editingJson), null, 2)); setJsonError(""); } catch(e: any) { setJsonError(e.message); } }} style={{ padding: "4px 10px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 6, color: "#8b9dc3", cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: "0.72rem" }}>Format</button>
                        <button onClick={() => { const parsed = (() => { try { return JSON.parse(editingJson); } catch{ return null; } })(); if(parsed) downloadJson(parsed, "module.json"); }} style={{ padding: "4px 10px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 6, color: "#8b9dc3", cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: "0.72rem" }}>Download</button>
                      </div>
                    </div>
                    <textarea
                      value={editingJson}
                      onChange={e => { setEditingJson(e.target.value); setJsonError(""); }}
                      spellCheck={false}
                      style={{ width: "100%", minHeight: 360, background: "#080e1e", border: `1.5px solid ${jsonError ? "#EF4444" : "#2a3a5c"}`, borderRadius: 10, color: "#e2e8f0", fontFamily: "monospace", fontSize: "0.78rem", padding: "14px", lineHeight: 1.6, outline: "none", resize: "vertical" }}
                    />
                    {jsonError && <div style={{ color: "#EF4444", fontSize: "0.75rem", marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}><AlertCircle size={12} />{jsonError}</div>}
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button
                        onClick={() => {
                          try {
                            const parsed = JSON.parse(editingJson);
                            const folder = parsed.folder || selectedMod?.folder || "module-new";
                            const filename = "module.json";
                            saveJson(folder, filename, editingJson);
                          } catch(e: any) { setJsonError("Invalid JSON: " + e.message); }
                        }}
                        disabled={savingModule}
                        className={!savingModule ? "btn-3d-green" : ""}
                        style={{ padding: "10px 24px", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 6, background: savingModule ? "#1a2540" : undefined, color: savingModule ? "#8b9dc3" : undefined, border: "none", borderRadius: 10, fontWeight: 700, cursor: savingModule ? "not-allowed" : "pointer", fontFamily: "Inter,sans-serif" }}>
                        <Save size={14} /> {savingModule ? "Saving..." : "Save Module"}
                      </button>
                      <button onClick={() => { setEditorMode("list"); setSelectedMod(null); setJsonError(""); }} style={{ padding: "10px 20px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, color: "#8b9dc3", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", fontFamily: "Inter,sans-serif" }}>Cancel</button>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Edit lesson view */}
              {(editorMode === "edit-lesson" || editorMode === "create-lesson") && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <button onClick={() => { setEditorMode("edit-module"); setSelectedLesson(null); setJsonError(""); }} style={{ padding: "6px 12px", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 7, color: "#8b9dc3", cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: "0.78rem" }}>Back</button>
                    <h2 style={{ fontWeight: 700, fontSize: "1rem" }}>{editorMode === "create-lesson" ? "Create New Lesson" : `Editing: ${selectedLesson?.title ?? ""}`}</h2>
                  </div>
                  <div style={{ background: "#0d1a2e", border: "1px solid #1a3050", borderRadius: 10, padding: "12px 14px", marginBottom: 12, fontSize: "0.75rem", color: "#8b9dc3", lineHeight: 1.6 }}>
                    <strong style={{ color: "#76AD25" }}>Activity types:</strong> slide, quiz, truefalse, dragdrop, typed, matching
                    {" · "}Each activity needs a unique <code style={{ background: "#111c30", padding: "1px 4px", borderRadius: 3 }}>id</code>
                    {" · "}Slides need <code style={{ background: "#111c30", padding: "1px 4px", borderRadius: 3 }}>notePrompt</code>
                    {" · "}Quiz needs <code style={{ background: "#111c30", padding: "1px 4px", borderRadius: 3 }}>correctIndex</code>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ fontSize: "0.72rem", color: "#8b9dc3", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>
                      {editorMode === "create-lesson" ? "New lesson JSON" : selectedLesson?.filename}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => { try { setEditingJson(JSON.stringify(JSON.parse(editingJson), null, 2)); } catch(e: any){ setJsonError(e.message); } }} style={{ padding: "4px 10px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 6, color: "#8b9dc3", cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: "0.72rem" }}>Format</button>
                    </div>
                  </div>
                  <textarea
                    value={editingJson}
                    onChange={e => { setEditingJson(e.target.value); setJsonError(""); }}
                    spellCheck={false}
                    style={{ width: "100%", minHeight: 440, background: "#080e1e", border: `1.5px solid ${jsonError ? "#EF4444" : "#2a3a5c"}`, borderRadius: 10, color: "#e2e8f0", fontFamily: "monospace", fontSize: "0.78rem", padding: "14px", lineHeight: 1.6, outline: "none", resize: "vertical" }}
                  />
                  {jsonError && <div style={{ color: "#EF4444", fontSize: "0.75rem", marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}><AlertCircle size={12} />{jsonError}</div>}
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button
                      onClick={() => {
                        try {
                          const parsed = JSON.parse(editingJson);
                          const folder = selectedMod?.folder ?? "module-new";
                          const filename = parsed.filename || selectedLesson?.filename || "lesson-1.json";
                          saveJson(folder, filename, editingJson);
                        } catch(e: any) { setJsonError("Invalid JSON: " + e.message); }
                      }}
                      disabled={savingModule}
                      className={!savingModule ? "btn-3d-green" : ""}
                      style={{ padding: "10px 24px", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 6, background: savingModule ? "#1a2540" : undefined, color: savingModule ? "#8b9dc3" : undefined, border: "none", borderRadius: 10, fontWeight: 700, cursor: savingModule ? "not-allowed" : "pointer", fontFamily: "Inter,sans-serif" }}>
                      <Save size={14} /> {savingModule ? "Saving..." : "Save Lesson"}
                    </button>
                    <button onClick={() => { setEditorMode("edit-module"); setSelectedLesson(null); setJsonError(""); }} style={{ padding: "10px 20px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, color: "#8b9dc3", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", fontFamily: "Inter,sans-serif" }}>Cancel</button>
                  </div>
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
