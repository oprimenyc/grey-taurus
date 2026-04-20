import { useEffect, useState, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { api } from "./lib/api.ts";
import Layout from "./components/Layout.tsx";
import Login from "./pages/Login.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Grants from "./pages/Grants.tsx";
import Subcontracts from "./pages/Subcontracts.tsx";
import RedditIntel from "./pages/RedditIntel.tsx";
import Opportunities from "./pages/Opportunities.tsx";
import Pipeline from "./pages/Pipeline.tsx";
import Proposals from "./pages/Proposals.tsx";
import Outreach from "./pages/Outreach.tsx";
import Agents from "./pages/Agents.tsx";
import Settings from "./pages/Settings.tsx";

function AuthGuard({ children }: { children: ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.auth
      .session()
      .then((s) => {
        setAuthed(s.authenticated);
        setChecked(true);
        if (!s.authenticated) navigate("/login");
      })
      .catch(() => {
        setChecked(true);
        navigate("/login");
      });
  }, [navigate]);

  if (!checked) return null;
  if (!authed) return null;
  return <>{children}</>;
}

function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <Layout>{children}</Layout>
    </AuthGuard>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
        <Route path="/opportunities" element={<ProtectedLayout><Opportunities /></ProtectedLayout>} />
        <Route path="/pipeline" element={<ProtectedLayout><Pipeline /></ProtectedLayout>} />
        <Route path="/grants" element={<ProtectedLayout><Grants /></ProtectedLayout>} />
        <Route path="/subcontracts" element={<ProtectedLayout><Subcontracts /></ProtectedLayout>} />
        <Route path="/proposals" element={<ProtectedLayout><Proposals /></ProtectedLayout>} />
        <Route path="/outreach" element={<ProtectedLayout><Outreach /></ProtectedLayout>} />
        <Route path="/reddit-intel" element={<ProtectedLayout><RedditIntel /></ProtectedLayout>} />
        <Route path="/agents" element={<ProtectedLayout><Agents /></ProtectedLayout>} />
        <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
