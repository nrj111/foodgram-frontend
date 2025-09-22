import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/auth-shared.css";

const UserRegister = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const API_BASE = import.meta.env?.VITE_API_BASE || 'https://foodgram-backend.vercel.app'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const firstName = e.target.firstName.value.trim();
    const lastName = e.target.lastName.value.trim();
    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    if (!firstName || !lastName || !email || !password) {
      setError("All fields are required");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE}/api/auth/user/register`,
        {
          fullName: `${firstName} ${lastName}`,
          email,
          password,
        },
        { withCredentials: true }
      );

      if (response.status === 201 || response.status === 200) {
        window.toast?.("Account created successfully", { type: "success" });
        try {
          const u = response.data?.user || {};
          localStorage.setItem('profileName', u.fullName || `${firstName} ${lastName}`)
          localStorage.setItem('profileEmail', u.email || email)
          localStorage.setItem('profileType', 'user')
        } catch (error) { console.error(error) }
        navigate("/");
      } else {
        const msg = response.data?.message || "Registration failed";
        setError(msg);
        window.toast?.(msg, { type: "error" });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      setError(msg);
      window.toast?.(msg, { type: "error" });
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card" role="region" aria-labelledby="user-register-title">
        <header>
          <h1 id="user-register-title" className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Join to explore and enjoy delicious meals.</p>
        </header>

        <nav className="auth-switch" aria-label="Register as">
          <Link to="/user/register" className="auth-switch__btn is-active">User</Link>
          <Link to="/food-partner/register" className="auth-switch__btn">Food partner</Link>
        </nav>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="two-col">
            <div className="field-group">
              <label htmlFor="firstName">First Name</label>
              <input id="firstName" name="firstName" placeholder="Jane" autoComplete="given-name" />
            </div>
            <div className="field-group">
              <label htmlFor="lastName">Last Name</label>
              <input id="lastName" name="lastName" placeholder="Doe" autoComplete="family-name" />
            </div>
          </div>
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" />
          </div>
          <div className="field-group">
            <label htmlFor="password">Password</label>
            <div className="field-group password-group">
              <input id="password" name="password" type={showPwd ? "text" : "password"} placeholder="••••••••" autoComplete="new-password" />
              <button type="button" className="toggle-password" onClick={() => setShowPwd(v => !v)} aria-label={showPwd ? "Hide password" : "Show password"}>
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          {error && <div className="error-message" role="alert">{error}</div>}
          <button className="auth-submit" type="submit">Sign Up</button>
        </form>
        <div className="auth-alt-action">
          Already have an account? <Link to="/user/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default UserRegister;
