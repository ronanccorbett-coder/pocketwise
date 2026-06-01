"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/db";
import { Mail, ArrowRight, KeyRound } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = db.useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/curriculum");
  }, [user, router]);

  async function sendCode() {
    if (!email.trim()) return;
    setLoading(true); setError("");
    try {
      await db.auth.sendMagicCode({ email: email.trim() });
      setSent(true);
    } catch (e: any) {
      setError(e.message ?? "Failed to send code. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    if (!code.trim()) return;
    setLoading(true); setError("");
    try {
      await db.auth.signInWithMagicCode({ email: email.trim(), code: code.trim() });
    } catch {
      setError("Invalid code. Check your email and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="plus-grid" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Image src="/logo.png" alt="PocketWise" width={56} height={56} style={{ objectFit: "contain", marginBottom: 12 }} />
          <h1 style={{ fontWeight: 900, fontSize: "1.5rem", color: "#fff", marginBottom: 4 }}>PocketWise</h1>
          <p style={{ color: "#8b9dc3", fontSize: "0.875rem" }}>NZ Financial Literacy Platform</p>
        </div>

        <div style={{ background: "#1a2540", border: "1px solid #2a3a5c", borderRadius: 16, padding: "28px" }}>
          {!sent ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Mail size={18} color="#76AD25" />
                <h2 style={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>Sign in with email</h2>
              </div>
              <p style={{ color: "#8b9dc3", fontSize: "0.825rem", marginBottom: 20, lineHeight: 1.5 }}>
                Enter your school email. We will send you a one-time sign-in code.
              </p>
              <input
                type="email"
                placeholder="you@school.nz"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendCode()}
                style={{
                  width: "100%", background: "#0d1526",
                  border: "1.5px solid #2a3a5c", borderRadius: 10,
                  padding: "12px 14px", color: "#fff",
                  fontFamily: "Inter, sans-serif", fontSize: "0.9rem",
                  outline: "none", marginBottom: 12,
                }}
                onFocus={e => e.target.style.borderColor = "#76AD25"}
                onBlur={e => e.target.style.borderColor = "#2a3a5c"}
              />
              {error && <p style={{ color: "#EF4444", fontSize: "0.78rem", marginBottom: 10 }}>{error}</p>}
              <button
                onClick={sendCode}
                disabled={loading || !email.trim()}
                style={{
                  width: "100%", padding: "13px",
                  background: loading || !email.trim() ? "#2a3a5c" : "#76AD25",
                  color: "#fff", border: "none", borderRadius: 10,
                  fontSize: "0.9rem", fontWeight: 700, cursor: "pointer",
                  fontFamily: "Inter, sans-serif", display: "flex",
                  alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                {loading ? "Sending..." : <><span>Send Sign-In Code</span> <ArrowRight size={16} /></>}
              </button>
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <KeyRound size={18} color="#76AD25" />
                <h2 style={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>Enter your code</h2>
              </div>
              <p style={{ color: "#8b9dc3", fontSize: "0.825rem", marginBottom: 20 }}>
                Code sent to <strong style={{ color: "#fff" }}>{email}</strong>
              </p>
              <input
                type="text"
                placeholder="000000"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={e => e.key === "Enter" && verify()}
                maxLength={6}
                style={{
                  width: "100%", background: "#0d1526",
                  border: "1.5px solid #2a3a5c", borderRadius: 10,
                  padding: "12px 14px", color: "#fff",
                  fontFamily: "Inter, sans-serif", fontSize: "1.5rem",
                  fontWeight: 700, letterSpacing: "0.4em",
                  outline: "none", marginBottom: 12, textAlign: "center",
                }}
                onFocus={e => e.target.style.borderColor = "#76AD25"}
                onBlur={e => e.target.style.borderColor = "#2a3a5c"}
              />
              {error && <p style={{ color: "#EF4444", fontSize: "0.78rem", marginBottom: 10 }}>{error}</p>}
              <button
                onClick={verify}
                disabled={loading || code.length < 6}
                style={{
                  width: "100%", padding: "13px",
                  background: loading || code.length < 6 ? "#2a3a5c" : "#76AD25",
                  color: "#fff", border: "none", borderRadius: 10,
                  fontSize: "0.9rem", fontWeight: 700, cursor: "pointer",
                  fontFamily: "Inter, sans-serif", marginBottom: 10,
                }}>
                {loading ? "Verifying..." : "Sign In"}
              </button>
              <button
                onClick={() => { setSent(false); setCode(""); setError(""); }}
                style={{
                  width: "100%", padding: "9px",
                  background: "transparent", color: "#8b9dc3",
                  border: "none", fontSize: "0.8rem", cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                }}>
                Use a different email
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
