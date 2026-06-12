"use client";
import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useGame } from "@/lib/gameContext";
import { db } from "@/lib/db";
import Image from "next/image";
import { Users, BookOpen, GraduationCap, RefreshCw } from "lucide-react";

const FONT = "Inter, system-ui, sans-serif";

// Pages that bypass the access wall entirely
const PUBLIC_PATHS = ["/login", "/onboarding", "/join", "/landing"];
// Admin emails always get through
const ADMIN_EMAILS = ["ronancorbett@gmail.com", "ronanccorbett@gmail.com", "admin@pocketwise.nz"];

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading, state } = useGame();
  const router = useRouter();
  const path = usePathname();

  // Fetch access data — enrollments and their classrooms + subscriptions
  const { data: enrollData } = db.useQuery(
    user ? { classEnrollments: { $: { where: { studentEmail: user.email ?? "" } } } } : null
  );
  const { data: classData } = db.useQuery({ classrooms: {} });
  const { data: subData }   = db.useQuery({ subscriptions: {} });

  const [accessChecked, setAccessChecked] = useState(false);

  const isPublicPath  = PUBLIC_PATHS.some(p => path.startsWith(p));
  const isAdmin       = ADMIN_EMAILS.includes(user?.email ?? "");
  const isTeacher     = (state as any)?.role === "teacher";

  // Compute access
  const enrollments   = (enrollData?.classEnrollments ?? []) as any[];
  const allClassrooms = (classData?.classrooms ?? []) as any[];
  const allSubs       = (subData?.subscriptions ?? []) as any[];
  const now           = Date.now();

  // Find classes the student is enrolled in
  const myClassrooms  = enrollments
    .map(e => allClassrooms.find((c: any) => c.id === e.classroomId))
    .filter(Boolean) as any[];

  // Check if any of their classrooms has an active subscription
  const activeClassroom = myClassrooms.find(cls => {
    const sub = allSubs.find((s: any) =>
      s.classroomId === cls.id && s.status === "active" && (s.expiresAt ?? 0) > now
    );
    return !!sub;
  });

  const hasAccess = isAdmin || isTeacher || !!activeClassroom;

  // Mark access checked once queries have loaded
  useEffect(() => {
    if (!isLoading && enrollData !== undefined && classData !== undefined && subData !== undefined) {
      setAccessChecked(true);
    }
  }, [isLoading, enrollData, classData, subData]);

  // Auth redirect
  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace("/login"); return; }
    if (state && !(state.badges as string[])?.includes("onboarded") && path !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [user, isLoading, state, path, router]);

  // Loading state
  if (isLoading || !user || !accessChecked) {
    return (
      <div style={{ minHeight: "100vh", background: "#0d1526", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: FONT }}>
        <Image src="/logo.png" alt="PocketWise" width={48} height={48} style={{ objectFit: "contain", filter: "brightness(10)" }} />
        <div style={{ color: "#4a6a8a", fontSize: "0.875rem" }}>Loading...</div>
      </div>
    );
  }

  // Bypass for public pages, admins, teachers
  if (isPublicPath || isAdmin || isTeacher) {
    return <>{children}</>;
  }

  // ── ACCESS WALL ──────────────────────────────────────────────────────────
  if (!hasAccess) {
    return <AccessWall
      user={user}
      myClassrooms={myClassrooms}
      allSubs={allSubs}
      now={now}
      onRefresh={() => setAccessChecked(false)}
    />;
  }

  return <>{children}</>;
}

// ── Access wall component ─────────────────────────────────────────────────
function AccessWall({ user, myClassrooms, allSubs, now, onRefresh }: {
  user: any;
  myClassrooms: any[];
  allSubs: any[];
  now: number;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const hasClasses = myClassrooms.length > 0;
  const expiredClasses = myClassrooms.filter(cls => {
    const sub = allSubs.find((s: any) => s.classroomId === cls.id);
    return sub && (sub.status === "expired" || (sub.expiresAt ?? 0) < now);
  });

  function refresh() {
    setRefreshing(true);
    setTimeout(() => { onRefresh(); setRefreshing(false); }, 1200);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0d1526", fontFamily: FONT, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", position: "relative", overflow: "hidden" }}>

      {/* Bg dots */}
      {[...Array(10)].map((_, i) => (
        <div key={i} style={{ position: "fixed", left: `${(i*29+5)%100}%`, top: `${(i*41+8)%100}%`, width: 2, height: 2, borderRadius: "50%", background: "#76AD25", opacity: 0.15, animation: `pw-float ${2+i%3}s ease-in-out infinite`, animationDelay: `${i*0.3}s`, pointerEvents: "none" }} />
      ))}

      <div style={{ width: "100%", maxWidth: 480, position: "relative", zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Image src="/logo.png" alt="PocketWise" width={52} height={52} style={{ objectFit: "contain", filter: "brightness(10)", marginBottom: 10 }} />
          <div style={{ fontWeight: 900, fontSize: "1.4rem", color: "#fff" }}>PocketWise</div>
          <div style={{ color: "#4a6a8a", fontSize: "0.82rem", marginTop: 4 }}>NZ Financial Literacy</div>
        </div>

        {/* Main card */}
        <div style={{ background: "#111c30", border: "1.5px solid rgba(255,255,255,.08)", borderRadius: 20, padding: "28px 24px", animation: "pw-slide-up .4s ease" }}>

          {!hasClasses ? (
            // ── No class at all ──
            <>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(59,130,246,.12)", border: "1px solid rgba(59,130,246,.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <Users size={24} color="#60a5fa" />
                </div>
                <h2 style={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem", marginBottom: 8 }}>You're not in a class yet</h2>
                <p style={{ color: "#4a6a8a", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
                  PocketWise is available to students who are part of an active class. Ask your teacher for a 6-character class code to get started.
                </p>
              </div>

              <div style={{ background: "rgba(59,130,246,.08)", border: "1px solid rgba(59,130,246,.15)", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
                <div style={{ fontSize: "0.7rem", color: "#60a5fa", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 }}>How to join</div>
                {[
                  "Ask your teacher for your class code",
                  'Click "Join Class" in the navigation bar',
                  "Enter the 6-character code",
                  "You're in — enjoy PocketWise!",
                ].map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: i < 3 ? 8 : 0 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(59,130,246,.2)", color: "#60a5fa", fontSize: "0.7rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i+1}</div>
                    <div style={{ fontSize: "0.82rem", color: "#8b9dc3", lineHeight: 1.5 }}>{step}</div>
                  </div>
                ))}
              </div>

              <button onClick={() => router.push("/join")} className="btn-3d-blue" style={{ width: "100%", padding: "13px", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <BookOpen size={16} /> Join a Class
              </button>
            </>
          ) : expiredClasses.length === myClassrooms.length ? (
            // ── All classes expired ──
            <>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <GraduationCap size={24} color="#f87171" />
                </div>
                <h2 style={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem", marginBottom: 8 }}>Your class subscription has expired</h2>
                <p style={{ color: "#4a6a8a", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
                  Your teacher's PocketWise subscription needs to be renewed. Let them know and they can re-activate the class.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {expiredClasses.map(cls => (
                  <div key={cls.id} style={{ background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.12)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.82rem" }}>{cls.name}</div>
                      <div style={{ fontSize: "0.72rem", color: "#4a6a8a", marginTop: 2 }}>{cls.subject}</div>
                    </div>
                    <span style={{ background: "rgba(239,68,68,.15)", color: "#f87171", padding: "3px 8px", borderRadius: 99, fontSize: "0.65rem", fontWeight: 700 }}>Expired</span>
                  </div>
                ))}
              </div>
              <button onClick={refresh} style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, color: "#8b9dc3", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <RefreshCw size={14} style={{ animation: refreshing ? "pw-spin 1s linear infinite" : "none" }} />
                {refreshing ? "Checking..." : "Check Again"}
              </button>
            </>
          ) : (
            // ── In a class but no active subscription (teacher hasn't activated yet) ──
            <>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <GraduationCap size={24} color="#fbbf24" />
                </div>
                <h2 style={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem", marginBottom: 8 }}>Waiting for class activation</h2>
                <p style={{ color: "#4a6a8a", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
                  You're enrolled in a class but your teacher hasn't activated their subscription yet. Check back soon or ask your teacher to activate PocketWise.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {myClassrooms.map(cls => (
                  <div key={cls.id} style={{ background: "rgba(245,158,11,.06)", border: "1px solid rgba(245,158,11,.12)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.82rem" }}>{cls.name}</div>
                      <div style={{ fontSize: "0.72rem", color: "#4a6a8a", marginTop: 2 }}>{cls.subject}</div>
                    </div>
                    <span style={{ background: "rgba(245,158,11,.15)", color: "#fbbf24", padding: "3px 8px", borderRadius: 99, fontSize: "0.65rem", fontWeight: 700 }}>Pending</span>
                  </div>
                ))}
              </div>
              <button onClick={refresh} style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, color: "#8b9dc3", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <RefreshCw size={14} style={{ animation: refreshing ? "pw-spin 1s linear infinite" : "none" }} />
                {refreshing ? "Checking..." : "Check Again"}
              </button>
            </>
          )}

          <p style={{ textAlign: "center", marginTop: 16, marginBottom: 0, color: "#4a6a8a", fontSize: "0.75rem" }}>
            Logged in as <span style={{ color: "#8b9dc3" }}>{user?.email}</span>
            {" · "}
            <button onClick={() => { db.auth.signOut(); }} style={{ background: "none", border: "none", color: "#4a6a8a", fontSize: "0.75rem", cursor: "pointer", fontFamily: FONT, textDecoration: "underline" }}>
              Sign out
            </button>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pw-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pw-slide-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pw-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
