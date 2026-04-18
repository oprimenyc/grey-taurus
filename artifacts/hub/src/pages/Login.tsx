import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.ts";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.auth.login(username, password);
      navigate("/dashboard");
    } catch {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0e0e0e",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: 12,
          padding: 40,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ color: "#c9a96e", fontWeight: 700, fontSize: 22, letterSpacing: 2 }}>
            GREY TAURUS
          </div>
          <div style={{ color: "#8a95a3", fontSize: 13, marginTop: 6 }}>
            Autonomous Contracting Platform
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#8a95a3", fontSize: 13, marginBottom: 6 }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "#111",
                border: "1px solid #2a2a2a",
                borderRadius: 6,
                color: "#e0e0e0",
                fontSize: 14,
                outline: "none",
              }}
              placeholder="admin"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", color: "#8a95a3", fontSize: 13, marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "#111",
                border: "1px solid #2a2a2a",
                borderRadius: 6,
                color: "#e0e0e0",
                fontSize: 14,
                outline: "none",
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div
              style={{
                color: "#ef4444",
                fontSize: 13,
                marginBottom: 16,
                padding: "8px 12px",
                background: "#1f0a0a",
                borderRadius: 6,
                border: "1px solid #3f1414",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "11px",
              background: loading ? "#7d6540" : "#c9a96e",
              color: "#0e0e0e",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: 1,
            }}
          >
            {loading ? "Signing in…" : "SIGN IN"}
          </button>
        </form>

        <div style={{ textAlign: "center", color: "#8a95a3", fontSize: 12, marginTop: 24 }}>
          Grey Taurus LLC · UEI: FMJFQ6R7B7P8 · CAGE: 1LXN7
        </div>
      </div>
    </div>
  );
}
