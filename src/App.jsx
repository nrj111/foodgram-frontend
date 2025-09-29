import React from 'react'

import './App.css'
import './styles/theme.css'
import AppRoutes from './routes/AppRoutes'

function App() {
  const [toasts, setToasts] = React.useState([]);

  React.useEffect(() => {
    document.documentElement.classList.add('app-prep');
    requestAnimationFrame(() => {
      document.documentElement.classList.add('app-ready');
    });
    return () => {
      document.documentElement.classList.remove('app-prep','app-ready');
    };
  }, []);

  React.useEffect(() => {
    // simple global toast: window.toast('msg', { type: 'success'|'error' })
    window.toast = (message, opts = {}) => {
      const id = Date.now() + Math.random();
      const type = opts.type || 'info';
      setToasts((prev) => [...prev, { id, message, type }]);
      const duration = Math.max(1500, Math.min(6000, opts.duration || 3000));
      setTimeout(() => {
        setToasts((prev) => prev.filter(t => t.id !== id));
      }, duration);
    };
    return () => { delete window.toast; };
  }, []);

  return (
    <>
      <AppRoutes />
      {/* Toasts */}
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
