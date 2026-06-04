import React, { useState } from "react";
import { supabase } from "./storage";

const G = "#46f08a";
const GB = "#9bffc6";
const GG = "rgba(70,240,138,0.40)";

export default function AuthGate({ children, session }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (session) return children;

  const send = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(1200px 600px at 50% -10%, #14241a 0%, #0c1410 45%, #070b08 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'EB Garamond', Georgia, serif", color: "#e6f3ea" }}>
      <div style={{ width: "100%", maxWidth: 380, background: "rgba(10,18,13,0.85)", border: `1px solid ${GG}`, borderRadius: 18, padding: "32px 28px", boxShadow: `0 0 60px rgba(70,240,138,0.12)` }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.5em", fontSize: 11, color: G, marginBottom: 8 }}>⚔ LA TUA STORIA ⚔</div>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontWeight: 900, fontSize: 32, margin: 0, color: "#f0fff5" }}>
            CHAPTER <span style={{ color: G }}>THIRTY</span>
          </h1>
        </div>

        {sent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📬</div>
            <p style={{ color: GB, fontSize: 15, lineHeight: 1.6 }}>
              Link magico inviato a<br />
              <strong>{email}</strong>
            </p>
            <p style={{ color: "#6f9a80", fontSize: 13, fontStyle: "italic", marginTop: 8 }}>
              Controlla la posta e clicca il link per entrare.
            </p>
          </div>
        ) : (
          <form onSubmit={send}>
            <p style={{ color: "#8fb89f", fontSize: 14, fontStyle: "italic", margin: "0 0 20px", textAlign: "center", lineHeight: 1.5 }}>
              Inserisci la tua email per ricevere il link di accesso.
            </p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@email.com"
              style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 10, border: `1px solid ${GG}`, background: "rgba(10,18,13,0.7)", color: "#e6f3ea", fontSize: 15, fontFamily: "inherit", outline: "none", marginBottom: 14 }}
            />
            {error && <p style={{ color: "#ff9d9d", fontSize: 13, margin: "0 0 10px" }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", padding: "13px", borderRadius: 11, border: `1px solid ${GB}`, color: "#06140c", background: `linear-gradient(90deg,${G},${GB})`, fontFamily: "'Cinzel', serif", fontSize: 14, letterSpacing: "0.08em", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Invio…" : "INVIA LINK MAGICO"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
