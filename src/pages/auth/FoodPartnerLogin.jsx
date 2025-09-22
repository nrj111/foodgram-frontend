import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import '../../styles/auth-shared.css';

const FoodPartnerLogin = () => {
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
        `${API_BASE}/api/auth/foodPartner/login`,
        { email, password },
        { withCredentials: true }
      );

      if (response.status === 200) {
        window.toast?.("Partner signed in", { type: "success" });
        try {
          const p = response.data?.foodPartner || {};
          localStorage.setItem('profileName', p.fullName || p.name || '')
          localStorage.setItem('profileEmail', p.email || '')
          localStorage.setItem('profileType', 'partner')
        } catch (error) { 
          console.error(error)
        }
        navigate("/food-partner/profile");
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
          <button className="auth-submit" type="submit">Sign In</button>
        </form>
        <div className="auth-alt-action">
          New partner? <a href="/food-partner/register">Create an account</a>
        </div>
      </div>
    </div>
  );
};

export default FoodPartnerLogin;
