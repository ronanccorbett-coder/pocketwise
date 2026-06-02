"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/db";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";

type Tab = "signin" | "signup";

export default function LoginPage() {
  const [tab, setTab]             = useState<Tab>("signin");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [fullName, setFullName]   = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const { user }                  = db.useAuth();
  const router                    = useRouter();

  useEffect(() => {
    if (user) router.replace("/curriculum");
  }, [user, router]);

  async function handleSignUp() {
    if (!fullName.trim()) { setError("Please enter your name."); return; }
    if (!email.trim())    { setError("Please enter your email."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }

    setLoading(true); setError(""); setSuccess("");
    try {
      await db.auth.signUp({
        email: email.trim(),
        password,
        // Store name in the user's profile
      });
      setSuccess("Account created! You are being signed in...");
    } catch (e: any) {
      setError(e.body?.message ?? e.message ?? "Failed to create account. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn() {
    if (!email.trim())    { setError("Please enter your email."); return; }
    if (!password.trim()) { setError("Please enter your password."); return; }

    setLoading(true); setError(""); setSuccess("");
    try {
      await db.auth.signInWithEmail({
        email: email.trim(),
        password,
      });
    } catch (e: any) {
      setError(e.body?.message ?? e.message ?? "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit() {
    if (tab === "signup") handleSignUp();
    else handleSignIn();
  }

  const inputStyle = {
    width: "100%",
    background: "#0d1526",
    border: "1.5px solid #2a3a5c",
    borderRadius: 10,
    padding: "12px 14px 12px 40px",
    color: "#fff",
    fontFamily: "Inter, sans-serif",
    fontSize: "0.9rem",
    outline: "none",
    transition: "border-color .15s",
  } as React.CSSProperties;

  return (
    <div className="plus-grid" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Image src="/logo.png" alt="PocketWise" width={60} height={60} style={{ objectFit: "contain", marginBottom: 10 }} />
          <h1 style={{ fontWeight: 900, fontSize: "1.5rem", color: "#fff", marginBottom: 4 }}>PocketWise</h1>
          <p style={{ color: "#8b9dc3", fontSize: "0.825rem" }}>NZ Financial Literacy Platform</p>
        </div>

        <div style={{ background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 16, overflow: "hidden" }}>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #2a3a5c" }}>
            {(["signin", "signup"] as Tab[]).map(t => (
              <button key={t} onClick={() => { setTab(t); setError(""); setSuccess(""); }} style={{
                flex: 1, padding: "14px",
                background: tab === t ? "#111c30" : "transparent",
                color: tab === t ? "#fff" : "#8b9dc3",
                border: "none",
                borderBottom: tab === t ? "2px solid #76AD25" : "2px solid transparent",
                fontWeight: 700, fontSize: "0.875rem", cursor: "pointer",
                fontFamily: "Inter, sans-serif", transition: "all .15s",
              }}>
                {t === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <div style={{ padding: "28px" }}>

            {/* Name field — signup only */}
            {tab === "signup" && (
              <div style={{ position: "relative", marginBottom: 14 }}>
                <User size={16} color="#8b9dc3" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  type="text"
                  placeholder="Full name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#76AD25"}
                  onBlur={e => e.target.style.borderColor = "#2a3a5c"}
                />
              </div>
            )}

            {/* Email */}
            <div style={{ position: "relative", marginBottom: 14 }}>
              <Mail size={16} color="#8b9dc3" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#76AD25"}
                onBlur={e => e.target.style.borderColor = "#2a3a5c"}
              />
            </div>

            {/* Password */}
            <div style={{ position: "relative", marginBottom: 6 }}>
              <Lock size={16} color="#8b9dc3" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                type={showPass ? "text" : "password"}
                placeholder={tab === "signup" ? "Create a password (min 8 chars)" : "Password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                style={{ ...inputStyle, paddingRight: 42 }}
                onFocus={e => e.target.style.borderColor = "#76AD25"}
                onBlur={e => e.target.style.borderColor = "#2a3a5c"}
              />
              <button
                onClick={() => setShowPass(s => !s)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#8b9dc3", display: "flex", alignItems: "center" }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Forgot password — sign in only */}
            {tab === "signin" && (
              <div style={{ textAlign: "right", marginBottom: 16 }}>
                <button
                  onClick={async () => {
                    if (!email.trim()) { setError("Enter your email first."); return; }
                    setLoading(true);
                    try {
                      await db.auth.sendPasswordResetEmail({ email: email.trim() });
                      setSuccess("Password reset email sent. Check your inbox.");
                    } catch (e: any) {
                      setError(e.body?.message ?? "Failed to send reset email.");
                    } finally { setLoading(false); }
                  }}
                  style={{ background: "none", border: "none", color: "#76AD25", fontSize: "0.78rem", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                  Forgot password?
                </button>
              </div>
            )}

            {tab === "signup" && <div style={{ marginBottom: 16 }} />}

            {/* Error / success */}
            {error && (
              <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: "0.8rem", color: "#fca5a5" }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ background: "rgba(118,173,37,.1)", border: "1px solid rgba(118,173,37,.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: "0.8rem", color: "#a3e635" }}>
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: "100%", padding: "13px",
                background: loading ? "#2a3a5c" : "#76AD25",
                color: "#fff", border: "none", borderRadius: 10,
                fontSize: "0.9rem", fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "Inter, sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "background .15s",
              }}>
              {loading ? "Please wait..." : (
                <>
                  {tab === "signin" ? "Sign In" : "Create Account"}
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Toggle */}
            <p style={{ textAlign: "center", marginTop: 16, fontSize: "0.8rem", color: "#8b9dc3" }}>
              {tab === "signin" ? "New to PocketWise? " : "Already have an account? "}
              <button
                onClick={() => { setTab(tab === "signin" ? "signup" : "signin"); setError(""); setSuccess(""); }}
                style={{ background: "none", border: "none", color: "#76AD25", fontWeight: 700, cursor: "pointer", fontSize: "0.8rem", fontFamily: "Inter, sans-serif" }}>
                {tab === "signin" ? "Create a free account" : "Sign in instead"}
              </button>
            </p>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: "0.72rem", color: "#4a5a7a", marginTop: 14 }}>
          By continuing you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
