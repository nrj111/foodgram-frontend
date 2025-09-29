import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import '../styles/bottom-nav.css'

const BottomNav = () => {
  const [authed, setAuthed] = useState(() => {
    if (typeof window === 'undefined') return false
    return !!localStorage.getItem('profileType')
  })
  const [cartCount, setCartCount] = useState(0)
  const [savedCount, setSavedCount] = useState(0)

  useEffect(() => {
    const update = () => {
      try { setAuthed(!!localStorage.getItem('profileType')) } catch {}
    }
    const syncCart = () => {
      try {
        const c = JSON.parse(localStorage.getItem('cart') || '[]')
        setCartCount(c.reduce((n, it) => n + (it.qty || 0), 0))
      } catch { setCartCount(0) }
    }
    window.addEventListener('focus', update)
    window.addEventListener('storage', update)
    window.addEventListener('focus', syncCart)
    window.addEventListener('storage', syncCart)
    return () => {
      window.removeEventListener('focus', update)
      window.removeEventListener('storage', update)
      window.removeEventListener('focus', syncCart)
      window.removeEventListener('storage', syncCart)
    }
  }, [])

  useEffect(() => {
    const handleSaved = (e) => {
      if (typeof e.detail === 'number') setSavedCount(e.detail)
    }
    window.addEventListener('saved:count', handleSaved)
    // initial attempt to derive saved count
    ;(async () => {
      try {
        const t = localStorage.getItem('profileType')
        if (t !== 'user') return
        const r = await fetch((import.meta.env?.VITE_API_BASE || 'https://foodgram-backend.vercel.app') + '/api/food/save', { credentials: 'include' })
        if (!r.ok) return
        const j = await r.json()
        setSavedCount((j.savedFoods || []).length)
      } catch {}
    })()
    return () => window.removeEventListener('saved:count', handleSaved)
  }, [])

  if (!authed) return null

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Primary">
      <div className="bottom-nav__inner">
        {/* Saved */}
        <NavLink to="/saved" className={({ isActive }) => `bottom-nav__item ${isActive ? 'is-active' : ''}`}>
          <span className="bottom-nav__icon" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/>
            </svg>
            {savedCount > 0 && (
              <span className="bottom-nav__badge" aria-label={`${savedCount} saved`}>
                {savedCount > 99 ? '99+' : savedCount}
              </span>
            )}
          </span>
          <span className="bottom-nav__label">Saved</span>
          <span className="bottom-nav__underline" />
        </NavLink>

        {/* Home */}
        <NavLink to="/" end className={({ isActive }) => `bottom-nav__item ${isActive ? 'is-active' : ''}`}>
          <span className="bottom-nav__icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 10.5 12 3l9 7.5"/>
              <path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10"/>
            </svg>
          </span>
          <span className="bottom-nav__label">Home</span>
          <span className="bottom-nav__underline" />
        </NavLink>

        {/* Cart */}
        <NavLink to="/cart" className={({ isActive }) => `bottom-nav__item ${isActive ? 'is-active' : ''}`}>
          <span className="bottom-nav__icon" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 7h12l-1 12H7L6 7z" />
              <path d="M9 7V5a3 3 0 0 1 6 0v2" />
            </svg>
            {cartCount > 0 && (
              <span className="bottom-nav__badge" aria-label={`${cartCount} items in cart`}>
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </span>
          <span className="bottom-nav__label">Cart</span>
          <span className="bottom-nav__underline" />
        </NavLink>
      </div>
    </nav>
  )
}

export default BottomNav
