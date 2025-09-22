import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import '../../styles/auth-shared.css';

const UserLogin = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const API_BASE = import.meta.env?.VITE_API_BASE || 'https://foodgram-backend.vercel.app'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE}/api/auth/user/login`,
        { email, password },
        { withCredentials: true }
      );

      if (response.status === 200) {
        window.toast?.("Signed in successfully", { type: "success" });
        try {
          localStorage.setItem('profileName', response.data?.fullName || '')
          localStorage.setItem('profileEmail', response.data?.email || '')
          localStorage.setItem('profileType', 'user')
        } catch (error) { console.error(error) }
        navigate("/");
      } else {
        const msg = response.data?.message || "Login failed";
        setError(msg);
        window.toast?.(msg, { type: "error" });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      setError(msg);
      window.toast?.(msg, { type: "error" });
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
          <button className="auth-submit" type="submit">Sign In</button>
        </form>
        <div className="auth-alt-action">
          New here? <a href="/user/register">Create account</a>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
