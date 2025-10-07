import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import '../../styles/auth-shared.css';

const UserLogin = () => {
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
        `${API_BASE}/api/auth/user/login`,
        { email, password },
        { 
          withCredentials: true,
          timeout: 10000 // 10-second timeout
        }
      );

      if (response.status === 200) {
        window.toast?.("Signed in successfully", { type: "success" });
        try {
          localStorage.setItem('profileName', response.data?.fullName || '')
          localStorage.setItem('profileEmail', response.data?.email || '')
          localStorage.setItem('profileType', 'user')
          await fetch(`${API_BASE}/api/auth/foodPartner/logout`, { credentials: 'include' })
        } catch (error) { console.error(error) }
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
      <div className="auth-card" role="region" aria-labelledby="user-login-title">
        <header>
          <h1 id="user-login-title" className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to continue your food journey.</p>
        </header>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" />
          </div>
          <div className="field-group">
            <label htmlFor="password">Password</label>
            <div className="field-group password-group">
              <input id="password" name="password" type={showPwd ? "text" : "password"} placeholder="••••••••" autoComplete="current-password" />
              <button type="button" className="toggle-password" onClick={() => setShowPwd(v => !v)} aria-label={showPwd ? "Hide password" : "Show password"}>
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          {error && <div className="error-message" role="alert">{error}</div>}
          <button className="auth-submit" type="submit" disabled={loading}>Sign In</button>
        </form>
        <div className="auth-alt-action">
          New here? <Link to="/user/register">Create account</Link>
        </div>
      </div>
      {loading && (
        <div className="auth-loading-overlay" role="alert" aria-busy="true" aria-live="polite">
          <div className="auth-spinner" aria-hidden="true"></div>
          <div>Signing in…</div>
        </div>
      )}
    </div>
  );
};

export default UserLogin;
