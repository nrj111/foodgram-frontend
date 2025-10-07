import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import '../../styles/auth-shared.css';

const FoodPartnerLogin = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const API_BASE = import.meta.env?.VITE_API_BASE || 'https://foodgram-backend.vercel.app'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    if (!email || !password) {
      setError("Email and password are required");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE}/api/auth/foodPartner/login`,
        { email, password },
        { 
          withCredentials: true,
          timeout: 10000 // 10-second timeout
        }
      );

      if (response.status === 200) {
        window.toast?.("Partner signed in", { type: "success" });
        try {
          const p = response.data?.foodPartner || {};
          localStorage.setItem('profileName', p.fullName || p.name || '')
          localStorage.setItem('profileEmail', p.email || '')
          localStorage.setItem('profileType', 'partner')
          const pid = p.id || p._id
          if (pid) localStorage.setItem('partnerId', pid)
        } catch (error) { 
          console.error(error)
        }
        try {
          await fetch(`${API_BASE}/api/auth/user/logout`, { credentials: 'include' })
        } catch {}
        navigate("/");
      } else {
        const msg = response.data?.message || "Login failed";
        setError(msg);
        window.toast?.(msg, { type: "error" });
      }
    } catch (err) {
      console.error('Login error details:', err);
      
      let errorMessage = "Login failed";
      if (err.response) {
        // Server responded with an error
        errorMessage = err.response.data?.message || `Error: ${err.response.status}`;
      } else if (err.request && !err.response) {
        // No response from server
        errorMessage = "Server not responding. Please check your connection and try again.";
      } else {
        // Request setup error
        errorMessage = err.message || "Unknown error during login";
      }
      
      setError(errorMessage);
      window.toast?.(errorMessage, { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card" role="region" aria-labelledby="partner-login-title">
        <header>
          <h1 id="partner-login-title" className="auth-title">Partner login</h1>
          <p className="auth-subtitle">Access your dashboard and manage orders.</p>
        </header>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" placeholder="business@example.com" autoComplete="email" />
          </div>
          <div className="field-group">
            <label htmlFor="password">Password</label>
            <div className="field-group password-group">
              <input id="password" name="password" type={showPwd ? "text" : "password"} placeholder="Password" autoComplete="current-password" />
              <button type="button" className="toggle-password" onClick={() => setShowPwd(v => !v)} aria-label={showPwd ? "Hide password" : "Show password"}>
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          {error && <div className="error-message" role="alert">{error}</div>}
          <button className="auth-submit" type="submit" disabled={loading}>Sign In</button>
        </form>
        <div className="auth-alt-action">
          New partner? <Link to="/food-partner/register">Create an account</Link>
        </div>
        {loading && (
          <div className="auth-loading-overlay" role="alert" aria-busy="true" aria-live="polite">
            <div className="auth-spinner" aria-hidden="true"></div>
            <div>Signing in…</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodPartnerLogin;
