import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

// Reusable feed for vertical reels
// Props:
// - items: Array of video items { _id, video, description, likeCount, savesCount, commentsCount, comments, foodPartner }
// - onLike: (item) => void | Promise<void>
// - onSave: (item) => void | Promise<void>
// - emptyMessage: string
const ReelFeed = ({ items = [], onLike, onSave, emptyMessage = 'No videos yet.', focusId }) => {
  const videoRefs = useRef(new Map())
  const [sheetOpen, setSheetOpen] = useState(false)
  const [added, setAdded] = useState({}) // id => true for brief animation
  const [expanded, setExpanded] = useState({}) // id => true when description expanded
  const [following, setFollowing] = useState({}) // id => followed?
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [themePref, setThemePref] = useState(() =>
    (typeof window !== 'undefined' && localStorage.getItem('themePreference')) || 'system'
  )
  const [liked, setLiked] = useState({})        // _id => true
  const [saved, setSaved] = useState({})        // _id => true
  const navigate = useNavigate()
  const API_BASE = import.meta.env?.VITE_API_BASE || 'https://foodgram-backend.vercel.app'
  const LOGO_URL = 'https://ik.imagekit.io/nrj/Foodgram%20Logo_3xjVvij1vu?updatedAt=1758693456925'

  // derive profile display
  const profileName = typeof window !== 'undefined' ? (localStorage.getItem('profileName') || 'Your Profile') : 'Your Profile'
  const profileEmail = typeof window !== 'undefined' ? (localStorage.getItem('profileEmail') || '') : ''
  const avatarUrl = typeof window !== 'undefined' ? localStorage.getItem('avatarUrl') : ''
  const handle = profileEmail ? '@' + profileEmail.split('@')[0] : '@you'
  const avatarLetter = profileName?.trim()?.charAt(0)?.toUpperCase() || 'U'

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target
          if (!(video instanceof HTMLVideoElement)) return
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            video.play().catch(() => { /* ignore autoplay errors */ })
          } else {
            video.pause()
          }
        })
      },
      { threshold: [0, 0.25, 0.6, 0.9, 1] }
    )

    videoRefs.current.forEach((vid) => observer.observe(vid))
    return () => observer.disconnect()
  }, [items])

  useEffect(() => {
    if (!focusId) return
    const el = document.getElementById(`reel-${focusId}`)
    if (el) {
      el.scrollIntoView({ block: 'start', behavior: 'smooth' })
      // attempt play after slight delay
      setTimeout(() => {
        const vid = el.querySelector('video')
        vid?.play?.()
      }, 400)
    }
  }, [focusId, items])

  useEffect(() => {
    // Apply stored theme preference
    function apply(pref) {
      const root = document.documentElement
      root.removeAttribute('data-theme')
      if (pref === 'light') root.setAttribute('data-theme', 'light')
      else if (pref === 'dark') root.setAttribute('data-theme', 'dark')
    }
    apply(themePref)
  }, [themePref])

  const setVideoRef = (id) => (el) => {
    if (!el) { videoRefs.current.delete(id); return }
    videoRefs.current.set(id, el)
  }

  function updateTheme(pref) {
    setThemePref(pref)
    try { localStorage.setItem('themePreference', pref) } catch {}
    window.toast?.(`Theme: ${pref}`, { type: 'info' })
  }

  async function handleLogout() {
    try {
      await Promise.allSettled([
        fetch(`${API_BASE}/api/auth/user/logout`, { credentials: 'include' }),
        fetch(`${API_BASE}/api/auth/foodPartner/logout`, { credentials: 'include' }),
      ])
    } catch (error) {
      console.error('Logout error:', error)
    }
    // clear cookies client-side (works even if server typo)
    document.cookie = 'userToken=; Max-Age=0; path=/;'
    document.cookie = 'partnerToken=; Max-Age=0; path=/;'
    document.cookie = 'token=; Max-Age=0; path=/;'
    // clear local profile cache
    try {
      localStorage.removeItem('profileName')
      localStorage.removeItem('profileEmail')
      localStorage.removeItem('avatarUrl')
      localStorage.removeItem('profileType')
    } catch {
      console.error('Failed to clear localStorage during logout')
    }
    window.toast?.('Logged out', { type: 'success' })
    setSheetOpen(false)
    navigate('/user/login')
  }

  function addToCart(item) {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      const idx = cart.findIndex((x) => x._id === item._id)
      const toStore = {
        _id: item._id,
        name: item.name || 'Food item',
        description: item.description || '',
        video: item.video,
        price: item.price ?? 0,
        qty: 1,
      }
      if (idx >= 0) cart[idx].qty = (cart[idx].qty || 0) + 1
      else cart.push(toStore)
      localStorage.setItem('cart', JSON.stringify(cart))
      window.toast?.('Added to cart', { type: 'success' })
      setAdded(prev => ({ ...prev, [item._id]: true }))
      setTimeout(() => setAdded(prev => {
        const next = { ...prev }; delete next[item._id]; return next
      }), 1200)
    } catch (e) {
      console.error('Cart error:', e)
      window.toast?.('Failed to add to cart', { type: 'error' })
    }
  }

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  const toggleFollow = (id) => setFollowing(prev => ({ ...prev, [id]: !prev[id] }))

  const formatINR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(n || 0));

  function handleUploadClick() {
    try {
      const type = localStorage.getItem('profileType')
      if (type !== 'partner') {
        window.toast?.('Please sign in as food partner', { type: 'info' })
        navigate('/food-partner/login')
        return
      }
      navigate('/create-food')
    } catch {
      navigate('/food-partner/login')
    }
  }

  function clearCart() {
    try { localStorage.removeItem('cart'); window.toast?.('Cart cleared', { type: 'success' }) } catch {}
  }
  function clearProfileCache() {
    try {
      ['profileName','profileEmail','avatarUrl','partnerAvatarUrl','profileType','partnerId']
        .forEach(k => localStorage.removeItem(k))
      window.toast?.('Local profile cache cleared', { type: 'success' })
    } catch {}
  }
  function clearSavedLocal() {
    try {
      localStorage.removeItem('saved') // placeholder if used
      window.toast?.('Saved (local) cleared', { type: 'success' })
    } catch {}
  }

  function handleLike(item) {
    setLiked(prev => ({ ...prev, [item._id]: !prev[item._id] }))
    onLike && onLike(item)
  }
  function handleSave(item) {
    setSaved(prev => ({ ...prev, [item._id]: !prev[item._id] }))
    onSave && onSave(item)
  }

  return (
    <div className="reels-page">
      {/* IG-like top header */}
      <header className="ig-header" role="banner" aria-label="Top bar">
        <div className="ig-brand" aria-label="Foodgram">
          <img className="ig-brand-logo" src={LOGO_URL} alt="Foodgram logo" />
        </div>
        <div className="ig-actions">
          {/* Upload button now guarded */}
          <button
            type="button"
            className="ig-icon-btn"
            aria-label="Upload reel"
            onClick={handleUploadClick}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <button className="ig-icon-btn" aria-label="Open menu" onClick={() => setSheetOpen(true)}>
            <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </header>

      <div className="reels-feed" role="list">
        {items.length === 0 && (
          <div className="empty-state">
            <p>{emptyMessage}</p>
          </div>
        )}

        {items.map((item) => (
          <section
            key={item._id}
            id={`reel-${item._id}`}
            className="reel"
            role="listitem"
          >
            <video
              ref={setVideoRef(item._id)}
              className="reel-video"
              src={item.video}
              muted
              playsInline
              loop
              preload="metadata"
            />

            <div className="reel-overlay">
              <div className="reel-overlay-gradient" aria-hidden="true" />
              <div className="reel-actions">
                <div className="reel-action-group">
                  <button
                    onClick={onLike ? () => handleLike(item) : undefined}
                    className={`reel-action like-action ${liked[item._id] ? 'is-liked' : ''}`}
                    aria-label="Like"
                    aria-pressed={!!liked[item._id]}
                  >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                    </svg>
                  </button>
                  <div className="reel-action__count">{item.likeCount ?? item.likesCount ?? item.likes ?? 0}</div>
                </div>

                <div className="reel-action-group">
                  <button
                    className={`reel-action save-action ${saved[item._id] ? 'is-saved' : ''}`}
                    onClick={onSave ? () => handleSave(item) : undefined}
                    aria-label="Bookmark"
                    aria-pressed={!!saved[item._id]}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
                    </svg>
                  </button>
                  <div className="reel-action__count">{item.savesCount ?? item.bookmarks ?? item.saves ?? 0}</div>
                </div>

                <div className="reel-action-group">
                  <button className="reel-action" aria-label="Comments">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                    </svg>
                  </button>
                  <div className="reel-action__count">{item.commentsCount ?? (Array.isArray(item.comments) ? item.comments.length : 0)}</div>
                </div>
              </div>

              <div className="reel-content">
                {/* Author row (Business name + Follow) */}
                {(() => {
                  const displayName =
                    item.foodPartner && typeof item.foodPartner === 'object' && item.foodPartner?.name
                      ? item.foodPartner.name
                      : item.partnerName ||
                        item.businessName ||
                        item.storeName ||
                        item.authorName ||
                        (item.foodPartner ? `Store ${String(item.foodPartner).slice(-4)}` : 'Store');
                  const letter = (displayName || 'S').trim().charAt(0).toUpperCase();
                  const isFollowing = !!following[item._id];
                  const partnerId = (() => {
                    if (item.foodPartner && typeof item.foodPartner === 'object') return item.foodPartner._id || item.foodPartner.id;
                    if (typeof item.foodPartner === 'string') return item.foodPartner;
                    return null;
                  })();
                  return (
                    <div className="reel-author">
                      <div className="reel-avatar" aria-hidden="true">{letter}</div>
                      {partnerId ? (
                        <Link
                          to={`/food-partner/${partnerId}`}
                          className="reel-author-name"
                          title={displayName}
                          aria-label={`Visit ${displayName} profile`}
                          onClick={(e)=>e.stopPropagation()}
                        >
                          {displayName}
                        </Link>
                      ) : (
                        <div className="reel-author-name" title={displayName}>{displayName}</div>
                      )}
                      <button
                        type="button"
                        className={`btn-follow ${isFollowing ? 'is-following' : ''}`}
                        onClick={() => toggleFollow(item._id)}
                        aria-pressed={isFollowing}
                        aria-label={isFollowing ? 'Unfollow' : 'Follow'}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  )
                })()}

                {/* Price just below author row */}
                <div className="reel-price">{formatINR(item.price)}</div>

                {/* Title above description */}
                <h3 className="reel-title">{item.name || 'Untitled'}</h3>

                {/* Truncated description with ... more / less */}
                {(() => {
                  const full = String(item.description || '')
                  const limit = 140
                  const isExpanded = !!expanded[item._id]
                  const needsClamp = full.length > limit
                  const preview = needsClamp ? full.slice(0, limit).trim() : full
                  return (
                    <p className={`reel-description ${isExpanded ? 'is-expanded' : ''}`} title={full}>
                      {isExpanded ? full : preview}
                      {needsClamp && !isExpanded && (
                        <>
                          ... <button className="reel-more" type="button" onClick={() => toggleExpand(item._id)}>more</button>
                        </>
                      )}
                      {needsClamp && isExpanded && (
                        <>
                          {' '}<button className="reel-more" type="button" onClick={() => toggleExpand(item._id)}>less</button>
                        </>
                      )}
                    </p>
                  )
                })()}

                <div className="reel-ctas">
                  <button
                    type="button"
                    className={`btn-cta primary ${added[item._id] ? 'is-added' : ''}`}
                    onClick={() => addToCart(item)}
                    aria-label="Add to cart"
                  >
                    {added[item._id] ? 'Added!' : 'Add to Cart'}
                  </button>
                  {(item.foodPartner && (typeof item.foodPartner === 'string' ? item.foodPartner : item.foodPartner?._id)) && (
                    <Link
                      className="btn-cta secondary"
                      to={`/food-partner/${typeof item.foodPartner === 'string' ? item.foodPartner : item.foodPartner._id}`}
                      aria-label="Visit store"
                    >
                      Visit Store
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Bottom-sheet menu */}
      {sheetOpen && (
        <>
          {/* ...existing profile sheet backdrop & panel... */}
          <div className="sheet-backdrop" onClick={() => { setSheetOpen(false); setSettingsOpen(false) }} aria-hidden="true" />
          <aside className="sheet" role="dialog" aria-modal="true" aria-label="Profile menu">
            {/* ...existing sheet-head... */}
            <header className="sheet-head">
              <div className="sheet-avatar" aria-hidden="true">
                {avatarUrl
                  ? <img src={avatarUrl} alt="" style={{width:'100%',height:'100%',borderRadius:'999px',objectFit:'cover'}} />
                  : avatarLetter}
              </div>
              <div className="sheet-meta">
                <div className="sheet-name">{profileName}</div>
                <div className="sheet-handle">{handle}</div>
              </div>
              <button className="sheet-close" onClick={() => { setSheetOpen(false); setSettingsOpen(false) }} aria-label="Close">✕</button>
            </header>
            {!settingsOpen && (
              <nav className="sheet-items">
                <Link to="/profile" className="sheet-item" onClick={() => setSheetOpen(false)}>Profile</Link>
                <Link to="/create-food" className="sheet-item" onClick={() => setSheetOpen(false)}>Upload Reel</Link>
                <Link to="/cart" className="sheet-item" onClick={() => setSheetOpen(false)}>Cart</Link>
                <Link to="/saved" className="sheet-item" onClick={() => setSheetOpen(false)}>Saved</Link>
                <button
                  type="button"
                  className="sheet-item sheet-item-settings"
                  onClick={() => setSettingsOpen(true)}
                  aria-label="Open settings"
                >
                  Settings
                </button>
                <button type="button" className="sheet-item danger" onClick={handleLogout}>Log out</button>
              </nav>
            )}

            {settingsOpen && (
              <div className="settings-panel" role="group" aria-label="Settings">
                <div className="settings-head">
                  <h2 className="settings-title">Settings</h2>
                  <button
                    type="button"
                    className="settings-close-btn"
                    aria-label="Back to menu"
                    onClick={() => setSettingsOpen(false)}
                  >←</button>
                </div>

                <div className="settings-section">
                  <h3>Appearance</h3>
                  <div className="settings-radio-group" role="radiogroup" aria-label="Theme">
                    {['system','light','dark'].map(opt => (
                      <label key={opt} className="settings-radio">
                        <input
                          type="radio"
                          name="theme"
                          value={opt}
                          checked={themePref === opt}
                          onChange={() => updateTheme(opt)}
                        />
                        <span className="settings-radio-label">{opt.charAt(0).toUpperCase()+opt.slice(1)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="settings-section">
                  <h3>Data</h3>
                  <button type="button" className="settings-btn" onClick={clearCart}>Clear cart</button>
                  <button type="button" className="settings-btn" onClick={clearSavedLocal}>Clear saved (local)</button>
                  <button type="button" className="settings-btn" onClick={clearProfileCache}>Clear profile cache</button>
                </div>

                <div className="settings-section">
                  <h3>Session</h3>
                  <button type="button" className="settings-btn" onClick={handleLogout}>Logout</button>
                </div>

                <div className="settings-section danger-zone">
                  <h3>Danger Zone</h3>
                  <button
                    type="button"
                    className="settings-btn danger"
                    onClick={() => {
                      clearCart(); clearProfileCache(); handleLogout();
                    }}
                  >
                    Reset & Logout
                  </button>
                </div>
              </div>
            )}
          </aside>
        </>
      )}
    </div>
  )
}


export default ReelFeed
