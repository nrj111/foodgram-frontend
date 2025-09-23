import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import '../../styles/auth-shared.css';

const FoodPartnerRegister = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const API_BASE = import.meta.env?.VITE_API_BASE || 'https://foodgram-backend.vercel.app'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const name = e.target.businessName.value.trim();
    const contactName = e.target.contactName.value.trim();
    const phone = e.target.phone.value.trim();
    const address = e.target.address.value.trim();
    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    if (!name || !contactName || !phone || !address || !email || !password) {
      setError("All fields are required");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE}/api/auth/foodPartner/register`,
        { name, contactName, phone, address, email, password },
        { withCredentials: true }
      );

      if (response.status === 201 || response.status === 200) {
        window.toast?.("Partner account created", { type: "success" });
        try {
          const p = response.data?.foodPartner || {};
          localStorage.setItem('profileName', p.name || name)
          localStorage.setItem('profileEmail', p.email || email)
          localStorage.setItem('profileType', 'partner')
          const pid = p.id || p._id
          if (pid) localStorage.setItem('partnerId', pid)
        } catch (error) { console.error(error) }
        navigate("/"); // go to feed
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
      <div className="auth-card" role="region" aria-labelledby="partner-register-title">
        <header>
          <h1 id="partner-register-title" className="auth-title">Partner sign up</h1>
          <p className="auth-subtitle">Grow your business with our platform.</p>
        </header>

        <nav className="auth-switch" aria-label="Register as">
          <Link to="/user/register" className="auth-switch__btn">User</Link>
          <Link to="/food-partner/register" className="auth-switch__btn is-active">Food partner</Link>
        </nav>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label htmlFor="businessName">Business Name</label>
            <input id="businessName" name="businessName" placeholder="Tasty Bites" autoComplete="organization" />
          </div>
          <div className="two-col">
            <div className="field-group">
              <label htmlFor="contactName">Contact Name</label>
              <input id="contactName" name="contactName" placeholder="Jane Doe" autoComplete="name" />
            </div>
            <div className="field-group">
              <label htmlFor="phone">Phone</label>
              <input id="phone" name="phone" placeholder="+1 555 123 4567" autoComplete="tel" />
            </div>
          </div>
            <div className="field-group">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" placeholder="business@example.com" autoComplete="email" />
            </div>
          <div className="field-group">
            <label htmlFor="password">Password</label>
            <div className="field-group password-group">
              <input id="password" name="password" type={showPwd ? "text" : "password"} placeholder="Create password" autoComplete="new-password" />
              <button type="button" className="toggle-password" onClick={() => setShowPwd(v => !v)} aria-label={showPwd ? "Hide password" : "Show password"}>
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <div className="field-group">
            <label htmlFor="address">Address</label>
            <input id="address" name="address" placeholder="123 Market Street" autoComplete="street-address" />
            <p className="small-note">Full address helps customers find you faster.</p>
          </div>
          {error && <div className="error-message" role="alert">{error}</div>}
          <button className="auth-submit" type="submit">Create Partner Account</button>
        </form>
        <div className="auth-alt-action">
          Already a partner? <Link to="/food-partner/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default FoodPartnerRegister;
