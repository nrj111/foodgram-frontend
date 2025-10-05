import React from 'react'

import './App.css'
import './styles/theme.css'
import AppRoutes from './routes/AppRoutes'

function App() {
  const [toasts, setToasts] = React.useState([])
  const [themePref, setThemePref] = React.useState(() => {
    try { return localStorage.getItem('themePreference') || 'system' } catch { return 'system' }
  })

  React.useEffect(() => {
    document.documentElement.classList.add('app-prep')
    requestAnimationFrame(() => {
      document.documentElement.classList.add('app-ready')
    })
    return () => {
      document.documentElement.classList.remove('app-prep','app-ready')
    }
  }, [])

  React.useEffect(() => {
    window.toast = (message, opts = {}) => {
      const id = Date.now() + Math.random()
      const type = opts.type || 'info'
      setToasts(prev => [...prev, { id, message, type }])
      const duration = Math.max(1500, Math.min(6000, opts.duration || 3000))
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
    window.toastError = (err, fallback = 'Operation failed') => {
      try {
        const msg =
          err?.response?.data?.message ||
          err?.data?.message ||
          err?.message ||
          (typeof err === 'string' ? err : '') ||
          fallback
        window.toast?.(msg || fallback, { type: 'error' })
      } catch {
        window.toast?.(fallback, { type: 'error' })
      }
    }
    return () => { delete window.toast; delete window.toastError }
  }, [])

  // THEME: apply preference + react to system changes
  React.useEffect(() => {
    const root = document.documentElement
    const mql = window.matchMedia('(prefers-color-scheme: dark)')

    function apply(pref) {
      root.removeAttribute('data-theme')
      if (pref === 'light') root.setAttribute('data-theme', 'light')
      else if (pref === 'dark') root.setAttribute('data-theme', 'dark')
      // if system: no data-theme -> media query in CSS handles it
    }

    function handleSystemChange() {
      if (themePref === 'system') apply('system')
    }

    apply(themePref)
    mql.addEventListener('change', handleSystemChange)
    return () => mql.removeEventListener('change', handleSystemChange)
  }, [themePref])

  // Expose setter globally for settings panel
  React.useEffect(() => {
    window.setThemePreference = (pref) => {
      try { localStorage.setItem('themePreference', pref) } catch {}
      setThemePref(pref)
      // notify any listeners (e.g., ReelFeed) to sync local radio state
      window.dispatchEvent(new CustomEvent('theme-updated', { detail: pref }))
    }
    return () => { delete window.setThemePreference }
  }, [])

  return (
    <>
      <AppRoutes />
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`} role="status">
            {t.message}
          </div>
        ))}
      </div>
    </>
  )
}


export default App