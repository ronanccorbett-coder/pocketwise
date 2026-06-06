"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/db";
import { Mail, ArrowRight, KeyRound, User, GraduationCap, BookOpen, ChevronLeft } from "lucide-react";
import { id } from "@instantdb/react";

const FONT = "Inter, system-ui, sans-serif";

type Tab  = "signin" | "signup";
type Role = "student" | "teacher" | null;

export default function LoginPage() {
  const [tab,      setTab]      = useState<Tab>("signin");
  const [role,     setRole]     = useState<Role>(null);
  const [email,    setEmail]    = useState("");
  const [fullName, setFullName] = useState("");
  const [school,   setSchool]   = useState("");
  const [message,  setMessage]  = useState("");
  const [code,     setCode]     = useState("");
  const [sent,     setSent]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const { user }               = db.useAuth();
  const router                  = useRouter();

  useEffect(() => {
    if (user) router.replace("/curriculum");
  }, [user, router]);

  function handleGoogleLogin() {
    // Save teacher role data before redirect
    if (role === "teacher") {
      localStorage.setItem("pw_pending_role", "teacher");
      localStorage.setItem("pw_pending_school", school);
      localStorage.setItem("pw_pending_msg", message);
    } else {
      localStorage.removeItem("pw_pending_role");
    }
    const url = db.auth.createAuthorizationURL({
      clientName: "google-web",
      redirectURL: window.location.href,
    });
    window.location.href = url;
  }

  async function sendCode() {
    if (tab === "signup" && !fullName.trim()) { setError("Please enter your name."); return; }
    if (!email.trim()) { setError("Please enter your email."); return; }
    setLoading(true); setError("");
    // Save teacher role data for bootstrap
    if (role === "teacher") {
      localStorage.setItem("pw_pending_role", "teacher");
      localStorage.setItem("pw_pending_school", school);
      localStorage.setItem("pw_pending_msg", message);
    }
    try {
      await db.auth.sendMagicCode({ email: email.trim() });
      setSent(true);
    } catch (e: any) {
      setError(e.body?.message ?? e.message ?? "Failed to send code.");
    } finally { setLoading(false); }
  }

  async function verify() {
    if (!code.trim()) return;
    setLoading(true); setError("");
    try {
      await db.auth.signInWithMagicCode({ email: email.trim(), code: code.trim() });
      // Teacher request is submitted in the teacher-pending page after login
    } catch {
      setError("Invalid code. Please check your email and try again.");
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%", padding: "13px 16px", borderRadius: 12,
    background: "rgba(255,255,255,.07)", border: "1.5px solid rgba(255,255,255,.12)",
    color: "#fff", fontFamily: FONT, fontSize: "0.9rem", outline: "none",
    boxShadow: "inset 0 2px 4px rgba(0,0,0,.3)",
    transition: "border-color .15s",
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0d1526 0%,#0f2318 50%,#0d1526 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: FONT }}>

      {/* Bg dots */}
      {[...Array(12)].map((_,i) => (
        <div key={i} style={{ position:"fixed", left:`${(i*29+5)%100}%`, top:`${(i*37+8)%100}%`, width:2, height:2, borderRadius:"50%", background:"#76AD25", opacity:0.15, animation:`pw-float ${2+i%3}s ease-in-out infinite`, animationDelay:`${i*0.25}s`, pointerEvents:"none" }} />
      ))}

      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 6 }}>
            <Image src="/logo.png" alt="PocketWise" width={44} height={44} style={{ objectFit: "contain", borderRadius: 10, background: "#fff", padding: 3 }} />
            <span style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fff" }}>PocketWise</span>
          </div>
          <p style={{ color: "#4a6a8a", fontSize: "0.82rem" }}>NZ Financial Literacy for Secondary Students</p>
        </div>

        {/* Role selector — shown before email form on signup */}
        {tab === "signup" && !role && !sent && (
          <div style={{ background: "#111c30", border: "1.5px solid rgba(255,255,255,.08)", borderRadius: 20, padding: "28px 24px", animation: "pw-slide-up .35s ease" }}>
            <h2 style={{ textAlign: "center", fontWeight: 800, color: "#fff", fontSize: "1.1rem", marginBottom: 6 }}>Who are you?</h2>
            <p style={{ textAlign: "center", color: "#4a6a8a", fontSize: "0.82rem", marginBottom: 24 }}>Choose your role to get started</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {([
                { key: "student", label: "Student", sub: "I'm here to learn", Icon: GraduationCap, color: "#76AD25" },
                { key: "teacher", label: "Teacher", sub: "I'm running a class", Icon: BookOpen, color: "#3B82F6" },
              ] as const).map(r => (
                <button key={r.key} onClick={() => setRole(r.key)} style={{
                  background: "rgba(255,255,255,.05)", border: `2px solid rgba(255,255,255,.08)`,
                  borderRadius: 14, padding: "20px 14px", cursor: "pointer",
                  transition: "all .2s cubic-bezier(.34,1.56,.64,1)", textAlign: "center",
                  fontFamily: FONT,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.cssText += `border-color:${r.color}44;transform:scale(1.04);box-shadow:0 8px 24px ${r.color}22`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.cssText += `border-color:rgba(255,255,255,.08);transform:scale(1);box-shadow:none`; }}>
                  <r.Icon size={28} color={r.color} style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontWeight: 800, color: "#fff", fontSize: "0.9rem" }}>{r.label}</div>
                  <div style={{ fontSize: "0.72rem", color: "#4a6a8a", marginTop: 2 }}>{r.sub}</div>
                </button>
              ))}
            </div>
            <button onClick={() => { setTab("signin"); setRole(null); }} style={{ width: "100%", textAlign: "center", background: "none", border: "none", color: "#4a6a8a", fontSize: "0.8rem", cursor: "pointer", fontFamily: FONT }}>
              Already have an account? Sign in
            </button>
          </div>
        )}

        {/* Main card — shown after role selection or on sign in */}
        {(tab === "signin" || role) && (
          <div style={{ background: "#111c30", border: "1.5px solid rgba(255,255,255,.08)", borderRadius: 20, padding: "28px 24px", animation: "pw-slide-up .35s ease" }}>

            {/* Tabs */}
            {!role && (
              <div style={{ display: "flex", background: "rgba(255,255,255,.05)", borderRadius: 12, padding: 4, marginBottom: 24 }}>
                {(["signin", "signup"] as Tab[]).map(t => (
                  <button key={t} onClick={() => { setTab(t); setRole(null); setSent(false); setError(""); }} style={{
                    flex: 1, padding: "9px", borderRadius: 9, background: tab === t ? "#fff" : "transparent",
                    color: tab === t ? "#0d1526" : "#8b9dc3", border: "none", fontWeight: 700,
                    fontSize: "0.82rem", cursor: "pointer", fontFamily: FONT,
                    transition: "all .2s", boxShadow: tab === t ? "0 2px 8px rgba(0,0,0,.2)" : "none",
                  }}>
                    {t === "signin" ? "Sign In" : "Create Account"}
                  </button>
                ))}
              </div>
            )}

            {/* Teacher label */}
            {role === "teacher" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <button onClick={() => setRole(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4a6a8a", display: "flex" }}><ChevronLeft size={16} /></button>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <BookOpen size={16} color="#3B82F6" />
                  <span style={{ fontWeight: 700, color: "#3B82F6", fontSize: "0.82rem" }}>Teacher Registration</span>
                </div>
              </div>
            )}

            {!sent ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {(tab === "signup" || role) && (
                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", color: "#8b9dc3", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>Full Name</label>
                    <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" style={inputStyle as any} />
                  </div>
                )}
                {role === "teacher" && (
                  <>
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", color: "#8b9dc3", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>School</label>
                      <input value={school} onChange={e => setSchool(e.target.value)} placeholder="e.g. Auckland Grammar School" style={inputStyle as any} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", color: "#8b9dc3", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>Why do you want to use PocketWise? (optional)</label>
                      <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Brief note to admin..." rows={2} style={{ ...inputStyle as any, resize: "none" }} />
                    </div>
                  </>
                )}
                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", color: "#8b9dc3", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>Email</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@email.com" style={inputStyle as any}
                    onKeyDown={e => { if (e.key === "Enter") sendCode(); }} />
                </div>
                {error && <p style={{ color: "#EF4444", fontSize: "0.78rem", margin: 0 }}>{error}</p>}
                <button onClick={sendCode} disabled={loading} className={loading ? "" : "btn-3d-green"} style={{ padding: "13px", fontSize: "0.9rem", fontWeight: 800, borderRadius: 12, background: loading ? "#1e3a5f" : undefined, color: loading ? "#4a6a8a" : undefined, border: "none", cursor: loading ? "not-allowed" : "pointer", fontFamily: FONT }}>
                  {loading ? "Sending..." : "Send Magic Code"}
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.08)" }} />
                  <span style={{ color: "#4a6a8a", fontSize: "0.75rem" }}>or</span>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.08)" }} />
                </div>

                <button onClick={handleGoogleLogin} style={{ padding: "12px", background: "#fff", color: "#0d1526", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 0 #c8d5e3, 0 6px 12px rgba(0,0,0,.15)", transition: "transform .08s ease, box-shadow .08s ease" }}
                  onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 0 #c8d5e3"; }}
                  onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
                  <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
                  Continue with Google
                </button>

                {!role && (
                  <p style={{ textAlign: "center", color: "#4a6a8a", fontSize: "0.78rem", margin: 0 }}>
                    {tab === "signin" ? "New here? " : "Have an account? "}
                    <button onClick={() => { setTab(tab === "signin" ? "signup" : "signin"); setRole(null); setSent(false); setError(""); }} style={{ background: "none", border: "none", color: "#76AD25", fontWeight: 700, cursor: "pointer", fontFamily: FONT, fontSize: "0.78rem" }}>
                      {tab === "signin" ? "Create account" : "Sign in"}
                    </button>
                  </p>
                )}
                {tab === "signin" && !role && (
                  <p style={{ textAlign: "center", margin: 0 }}>
                    <button onClick={() => { setTab("signup"); setRole("teacher"); setSent(false); setError(""); }} style={{ background: "none", border: "none", color: "#3B82F6", fontWeight: 600, cursor: "pointer", fontFamily: FONT, fontSize: "0.75rem" }}>
                      Are you a teacher? Register here →
                    </button>
                  </p>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ textAlign: "center", marginBottom: 8 }}>
                  <Mail size={32} color="#76AD25" style={{ margin: "0 auto 10px" }} />
                  <h3 style={{ fontWeight: 800, color: "#fff", fontSize: "1rem", marginBottom: 4 }}>Check your email</h3>
                  <p style={{ color: "#4a6a8a", fontSize: "0.8rem" }}>We sent a 6-digit code to <strong style={{ color: "#fff" }}>{email}</strong></p>
                </div>
                <input value={code} onChange={e => setCode(e.target.value)} placeholder="000000" maxLength={6} style={{ ...inputStyle as any, textAlign: "center", fontSize: "1.4rem", letterSpacing: ".3em", fontWeight: 800 }}
                  onKeyDown={e => { if (e.key === "Enter") verify(); }} />
                {error && <p style={{ color: "#EF4444", fontSize: "0.78rem", margin: 0, textAlign: "center" }}>{error}</p>}
                <button onClick={verify} disabled={loading || code.length < 6} className={!loading && code.length >= 6 ? "btn-3d-green" : ""} style={{ padding: "13px", fontSize: "0.9rem", fontWeight: 800, borderRadius: 12, background: loading || code.length < 6 ? "#1e3a5f" : undefined, color: loading || code.length < 6 ? "#4a6a8a" : undefined, border: "none", cursor: "pointer", fontFamily: FONT }}>
                  {loading ? "Verifying..." : "Verify Code"}
                </button>
                <button onClick={() => { setSent(false); setCode(""); setError(""); }} style={{ background: "none", border: "none", color: "#4a6a8a", fontSize: "0.78rem", cursor: "pointer", fontFamily: FONT, textAlign: "center" }}>
                  Try a different email
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        input:focus { border-color: #76AD25 !important; }
        textarea:focus { border-color: #76AD25 !important; }
        @keyframes pw-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pw-slide-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
