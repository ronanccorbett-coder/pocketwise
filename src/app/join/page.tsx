"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { db } from "@/lib/db";
import { useGame } from "@/lib/gameContext";
import { id } from "@instantdb/react";
import { Users, Check, AlertCircle, BookOpen } from "lucide-react";

const FONT = "Inter, system-ui, sans-serif";

export default function JoinClassPage() {
  const { user, state } = useGame();
  const router = useRouter();
  const [code, setCode]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  const { data: enrollData } = db.useQuery({ classEnrollments: {} });
  const myEnrolls = (enrollData?.classEnrollments ?? []).filter((e: any) => e.studentEmail === user?.email) as any[];

  const { data: classData } = db.useQuery({ classrooms: {} });
  const allClassrooms = (classData?.classrooms ?? []) as any[];
  const myClasses = myEnrolls.map(e => allClassrooms.find(c => c.id === e.classroomId)).filter(Boolean);

  async function joinClass() {
    if (!code.trim() || !user) return;
    setLoading(true); setError("");
    const classroom = allClassrooms.find(c => c.joinCode === code.trim().toUpperCase());
    if (!classroom) { setError("Class not found. Check the code and try again."); setLoading(false); return; }
    const already = myEnrolls.find(e => e.classroomId === classroom.id);
    if (already) { setError("You're already enrolled in this class."); setLoading(false); return; }
    await db.transact(
      (db as any).tx.classEnrollments[id()].update({
        classroomId: classroom.id,
        studentEmail: user.email,
        studentId: user.id,
        joinedDate: Date.now(),
      })
    );
    setSuccess(`Joined "${classroom.name}"!`);
    setCode(""); setLoading(false);
    window.dispatchEvent(new CustomEvent("pw:xp", { detail: { amount: 25, reason: "Joined a class!" } }));
  }

  return (
    <AuthGuard>
      <div style={{ minHeight: "100vh", background: "#0d1526", fontFamily: FONT }}>
        <Nav />
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 1.5rem" }}>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <Users size={22} color="#3B82F6" />
            <h1 style={{ fontWeight: 900, fontSize: "1.4rem", color: "#fff" }}>Join a Class</h1>
          </div>

          {/* Join form */}
          <div style={{ background: "#111c30", border: "1.5px solid rgba(59,130,246,.2)", borderRadius: 18, padding: "24px", marginBottom: 24 }}>
            <p style={{ color: "#8b9dc3", fontSize: "0.875rem", marginBottom: 16 }}>Enter the 6-character code your teacher gave you.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === "Enter") joinClass(); }}
                placeholder="ABC123"
                maxLength={6}
                className="pw-input"
                style={{ flex: 1, fontSize: "1.4rem", letterSpacing: ".2em", fontWeight: 900, textAlign: "center", fontFamily: "monospace" }}
              />
              <button onClick={joinClass} disabled={code.length < 6 || loading} className={code.length >= 6 && !loading ? "btn-3d-blue" : ""} style={{ padding: "0 24px", fontSize: "0.9rem", background: code.length < 6 ? "#1e3a5f" : undefined, color: code.length < 6 ? "#4a6a8a" : undefined, border: "none", borderRadius: 12, fontWeight: 700, cursor: code.length < 6 ? "not-allowed" : "pointer", fontFamily: FONT }}>
                {loading ? "Joining..." : "Join"}
              </button>
            </div>
            {error   && <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, color: "#EF4444", fontSize: "0.8rem" }}><AlertCircle size={13} />{error}</div>}
            {success && <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, color: "#76AD25", fontSize: "0.8rem", animation: "pw-pop .4s ease" }}><Check size={13} />{success} +25 XP bonus!</div>}
          </div>

          {/* My classes */}
          {myClasses.length > 0 && (
            <div>
              <h2 style={{ fontWeight: 700, color: "#fff", fontSize: "0.9rem", marginBottom: 12 }}>My Classes</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {myClasses.map((cls: any) => (
                  <div key={cls.id} style={{ background: "#111c30", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(59,130,246,.15)", border: "1px solid rgba(59,130,246,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <BookOpen size={18} color="#60a5fa" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.875rem" }}>{cls.name}</div>
                      <div style={{ fontSize: "0.72rem", color: "#4a6a8a" }}>{cls.subject} · {cls.yearLevel}</div>
                      {cls.announcement && (
                        <div style={{ fontSize: "0.72rem", color: "#60a5fa", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B82F6", flexShrink: 0 }} />
                          {cls.announcement}
                        </div>
                      )}
                    </div>
                    <div style={{ background: "rgba(118,173,37,.1)", color: "#76AD25", padding: "3px 10px", borderRadius: 99, fontSize: "0.65rem", fontWeight: 700 }}>Enrolled</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
