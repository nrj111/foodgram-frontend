import React from "react";
import { useNavigate, Link } from "react-router-dom";
import '../../styles/auth-shared.css';

const ChooseRegister = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card" role="region" aria-labelledby="choose-register-title">
        <header>
          <h1 id="choose-register-title" className="auth-title">Register</h1>
          <p className="auth-subtitle">Pick how you want to join the platform.</p>
        </header>
        <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
          <button onClick={() => navigate("/user/register")} className="auth-submit" style={{textDecoration:'none'}}>
            Register as normal user
          </button>
          <button onClick={() => navigate("/food-partner/register")} className="auth-submit" style={{textDecoration:'none', background:'var(--color-surface-alt)', color:'var(--color-text)', border:'1px solid var(--color-border)'}}>
            Register as food partner
          </button>
        </div>
        <div className="auth-alt-action" style={{marginTop:'4px'}}>
          Already have an account? <Link to="/user/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default ChooseRegister;
