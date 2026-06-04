"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/db";
import { Mail, ArrowRight, KeyRound, User } from "lucide-react";

type Tab = "signin" | "signup";

export default function LoginPage() {
  const [tab, setTab]           = useState<Tab>("signin");
  const [email, setEmail]       = useState("");
  const [fullName, setFullName] = useState("");
  const [code, setCode]         = useState("");
  const [sent, setSent]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const { user }                = db.useAuth();
  const router                  = useRouter();

  useEffect(() => {
    if (user) router.replace("/curriculum");
  }, [user, router]);

  function handleGoogleLogin() {
    const url = db.auth.createAuthorizationURL({
      clientName: "google-web",
      redirectURL: window.location.href,
    });
    window.location.href = url;
  }

  async function sendCode() {
    if (tab === "signup" && !fullName.trim()) {
      setError("Please enter your name."); return;
    }
    if (!email.trim()) { setError("Please enter your email."); return; }
    setLoading(true); setError("");
    try {
      await db.auth.sendMagicCode({ email: email.trim() });
      setSent(true);
    } catch (e: any) {
      setError(e.body?.message ?? e.message ?? "Failed to send code. Please try again.");
    } finally { setLoading(false); }
  }

  async function verify() {
    if (!code.trim()) return;
    setLoading(true); setError("");
    try {
      await db.auth.signInWithMagicCode({
        email: email.trim(),
        code: code.trim(),
      });
    } catch {
      setError("Invalid code. Please check your email and try again.");
      setLoading(false);
    }
  }

  const inputBase = {
    width: "100%",
    background: "#0d1526",
    border: "1.5px solid #2a3a5c",
    borderRadius: 10,
    padding: "12px 14px 12px 42px",
    color: "#fff",
    fontFamily: "Inter, sans-serif",
    fontSize: "0.9rem",
    outline: "none",
    marginBottom: 14,
    display: "block",
    transition: "border-color .15s",
  } as React.CSSProperties;

  return (
    <div className="plus-grid" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Image src="/logo.png" alt="PocketWise" width={60} height={60} style={{ objectFit: "contain", marginBottom: 10, borderRadius: 12, background: "#fff", padding: 4 }} />
          <h1 style={{ fontWeight: 900, fontSize: "1.5rem", color: "#fff", marginBottom: 4 }}>PocketWise</h1>
          <p style={{ color: "#8b9dc3", fontSize: "0.825rem" }}>NZ Financial Literacy Platform</p>
        </div>

        <div style={{ background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 16, overflow: "hidden" }}>

          {/* Tabs */}
          {!sent && (
            <div style={{ display: "flex", borderBottom: "1px solid #2a3a5c" }}>
              {(["signin", "signup"] as Tab[]).map(t => (
                <button key={t} onClick={() => { setTab(t); setError(""); }} style={{
                  flex: 1, padding: "14px",
                  background: tab === t ? "#111c30" : "transparent",
                  color: tab === t ? "#fff" : "#8b9dc3",
                  border: "none",
                  borderBottom: tab === t ? "2px solid #76AD25" : "2px solid transparent",
                  fontWeight: 700, fontSize: "0.875rem", cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                }}>
                  {t === "signin" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>
          )}

          <div style={{ padding: "28px" }}>
            {!sent ? (
              <>
                {/* Google button */}
                <button
                  onClick={handleGoogleLogin}
                  style={{
                    width: "100%", padding: "12px",
                    background: "#fff", color: "#0d1526",
                    border: "none", borderRadius: 10,
                    fontSize: "0.9rem", fontWeight: 700,
                    cursor: "pointer", fontFamily: "Inter, sans-serif",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    marginBottom: 16,
                  }}>
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    <path fill="none" d="M0 0h48v48H0z"/>
                  </svg>
                  {tab === "signin" ? "Sign in with Google" : "Sign up with Google"}
                </button>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ flex: 1, height: 1, background: "#2a3a5c" }} />
                  <span style={{ fontSize: "0.75rem", color: "#4a5a7a" }}>or use email</span>
                  <div style={{ flex: 1, height: 1, background: "#2a3a5c" }} />
                </div>

                <p style={{ color: "#8b9dc3", fontSize: "0.78rem", lineHeight: 1.6, marginBottom: 16 }}>
                  {tab === "signin"
                    ? "Enter your email and we will send you a one-time sign-in code."
                    : "Create your free account. We will send a verification code to your email."}
                </p>

                {/* Name — signup only */}
                {tab === "signup" && (
                  <div style={{ position: "relative" }}>
                    <User size={15} color="#8b9dc3" style={{ position: "absolute", left: 14, top: 14, pointerEvents: "none" }} />
                    <input
                      type="text"
                      placeholder="Your full name"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      style={inputBase}
                      onFocus={e => e.target.style.borderColor = "#76AD25"}
                      onBlur={e => e.target.style.borderColor = "#2a3a5c"}
                    />
                  </div>
                )}

                {/* Email */}
                <div style={{ position: "relative" }}>
                  <Mail size={15} color="#8b9dc3" style={{ position: "absolute", left: 14, top: 14, pointerEvents: "none" }} />
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendCode()}
                    style={inputBase}
                    onFocus={e => e.target.style.borderColor = "#76AD25"}
                    onBlur={e => e.target.style.borderColor = "#2a3a5c"}
                  />
                </div>

                {error && (
                  <p style={{ color: "#EF4444", fontSize: "0.78rem", marginBottom: 12, marginTop: -8 }}>{error}</p>
                )}

                <button onClick={sendCode} disabled={loading || !email.trim()} style={{
                  width: "100%", padding: "12px",
                  background: loading || !email.trim() ? "#2a3a5c" : "#76AD25",
                  color: "#fff", border: "none", borderRadius: 10,
                  fontSize: "0.875rem", fontWeight: 700,
                  cursor: loading || !email.trim() ? "not-allowed" : "pointer",
                  fontFamily: "Inter, sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  {loading ? "Sending..." : (
                    <><Mail size={15} /> Send Code <ArrowRight size={15} /></>
                  )}
                </button>

                <p style={{ textAlign: "center", marginTop: 14, fontSize: "0.78rem", color: "#8b9dc3" }}>
                  {tab === "signin" ? "New to PocketWise? " : "Already have an account? "}
                  <button onClick={() => { setTab(tab === "signin" ? "signup" : "signin"); setError(""); }}
                    style={{ background: "none", border: "none", color: "#76AD25", fontWeight: 700, cursor: "pointer", fontSize: "0.78rem", fontFamily: "Inter, sans-serif" }}>
                    {tab === "signin" ? "Create a free account" : "Sign in instead"}
                  </button>
                </p>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <KeyRound size={18} color="#76AD25" />
                  <h2 style={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>Check your email</h2>
                </div>
                <p style={{ color: "#8b9dc3", fontSize: "0.8rem", marginBottom: 20, lineHeight: 1.6 }}>
                  We sent a 6-digit code to <strong style={{ color: "#fff" }}>{email}</strong>. It expires in 10 minutes.
                </p>

                <input
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={e => e.key === "Enter" && verify()}
                  maxLength={6}
                  autoFocus
                  style={{
                    width: "100%", background: "#0d1526",
                    border: "1.5px solid #2a3a5c", borderRadius: 10,
                    padding: "14px", color: "#fff",
                    fontFamily: "Inter, sans-serif", fontSize: "1.75rem",
                    fontWeight: 800, letterSpacing: "0.4em",
                    outline: "none", marginBottom: 14, textAlign: "center",
                    display: "block",
                  }}
                  onFocus={e => e.target.style.borderColor = "#76AD25"}
                  onBlur={e => e.target.style.borderColor = "#2a3a5c"}
                />

                {error && <p style={{ color: "#EF4444", fontSize: "0.78rem", marginBottom: 12 }}>{error}</p>}

                <button onClick={verify} disabled={loading || code.length < 6} style={{
                  width: "100%", padding: "12px",
                  background: loading || code.length < 6 ? "#2a3a5c" : "#76AD25",
                  color: "#fff", border: "none", borderRadius: 10,
                  fontSize: "0.875rem", fontWeight: 700,
                  cursor: loading || code.length < 6 ? "not-allowed" : "pointer",
                  fontFamily: "Inter, sans-serif", marginBottom: 10,
                }}>
                  {loading ? "Verifying..." : tab === "signup" ? "Create My Account" : "Sign In"}
                </button>

                <button onClick={() => { setSent(false); setCode(""); setError(""); }} style={{
                  width: "100%", padding: "9px",
                  background: "transparent", color: "#8b9dc3",
                  border: "1px solid #2a3a5c", borderRadius: 10,
                  fontSize: "0.8rem", cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                }}>
                  Use a different email
                </button>
              </>
            )}
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: "0.72rem", color: "#4a5a7a", marginTop: 14 }}>
          By continuing you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
