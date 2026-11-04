import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, GraduationCap, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-art">
        <div className="login-brand"><span className="brand-mark"><GraduationCap size={24} /></span><strong>fpis</strong></div>
        <div className="login-message">
          <span className="eyebrow light">FACULTY PERFORMANCE INTELLIGENCE</span>
          <h1>Great work deserves to be <em>seen.</em></h1>
          <p>One thoughtful view of teaching, mentorship, research, and the people behind it.</p>
        </div>
        <div className="login-foot"><ShieldCheck size={17} /> Secure access for your academic community</div>
      </section>
      <section className="login-form-side">
        <form className="login-form" onSubmit={submit}>
          <div className="eyebrow">WELCOME BACK</div>
          <h2>Sign in to FPIS</h2>
          <p className="muted">Use your institutional account to continue.</p>
          {error && <div className="alert error" role="alert">{error}</div>}
          <label>Email address<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@university.edu" /></label>
          <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /></label>
          <button className="button primary wide" disabled={busy}>{busy ? "Signing in…" : <>Continue <ArrowRight size={17} /></>}</button>
          <small className="login-note">Your role determines which faculty data and tools are available.</small>
        </form>
      </section>
    </main>
  );
}
