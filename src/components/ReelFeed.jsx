import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

// Reusable feed for vertical reels
// Props:
// - items: Array of video items { _id, video, description, likeCount, savesCount, commentsCount, comments, foodPartner }
// - onLike: (item) => void | Promise<void>
// - onSave: (item) => void | Promise<void>
// - emptyMessage: string
const ReelFeed = ({ items = [], onLike, onSave, emptyMessage = 'No videos yet.', focusId, allSaved = false }) => {
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
  const [commentSheet, setCommentSheet] = useState({ open: false, foodId: null })
  const [comments, setComments] = useState([])        // current list
  const [commentText, setCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentLikes, setCommentLikes] = useState({}) // commentId => true
  const [muted, setMuted] = useState({})              // per-reel: true = muted, false = unmuted (default now false)
  const [noAudioNotified, setNoAudioNotified] = useState({})
  const [manualPaused, setManualPaused] = useState({}) // id => true if user paused
  const [shareFlash, setShareFlash] = useState({})     // id => true right after share
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
      entries => {
        entries.forEach(entry => {
          const video = entry.target
          if (!(video instanceof HTMLVideoElement)) return
          const id = video.dataset.id
          const isManuallyPaused = id && manualPaused[id]
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            if (!isManuallyPaused) {
              const p = video.play()
              if (p && p.catch) {
                p.catch(err => {
                  if (!video.muted) {
                    // Autoplay with sound blocked: fallback to muted then retry
                    video.muted = true
                    setMuted(prev => ({ ...prev, [id]: true }))
                    video.play().catch(()=>{})
                  }
                })
              }
            }
          } else {
            video.pause()
          }
        })
      },
      { threshold: [0, .25, .6, .9, 1] }
    )
    videoRefs.current.forEach(v => observer.observe(v))
    return () => observer.disconnect()
  }, [items, manualPaused])

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

  const setVideoRef = id => el => {
    if (!el) { videoRefs.current.delete(id); return }
    el.dataset.id = id
    videoRefs.current.set(id, el)
    // default: unmuted (audible)
    setMuted(prev => prev[id] === undefined ? { ...prev, [id]: false } : prev)
  }

  function toggleAudio(id) {
    const vid = videoRefs.current.get(id)
    setMuted(prev => {
      const current = prev[id] ?? false
      const next = !current
      if (vid) {
        vid.muted = next
        if (!next) {
          const p = vid.play?.()
          if (p && p.catch) p.catch(()=>{})
        }
      }
      return { ...prev, [id]: next }
    })
  }

  function togglePause(id) {
    const vid = videoRefs.current.get(id)
    setManualPaused(prev => {
      const nowPaused = !prev[id]
      if (vid) {
        if (nowPaused) {
          vid.pause()
          vid.classList.add('is-paused')
        } else {
          vid.classList.remove('is-paused')
          const p = vid.play?.()
          if (p && p.catch) p.catch(()=>{})
        }
      }
      return { ...prev, [id]: nowPaused }
    })
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

  async function openComments(foodId) {
    setCommentSheet({ open: true, foodId })
    setComments([])
    setLoadingComments(true)
    try {
      const res = await fetch(`${API_BASE}/api/food/comments/${foodId}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
        const likedMap = {}
        data.comments?.forEach(c => { if (c.liked) likedMap[c._id] = true })
        setCommentLikes(likedMap)
      }
    } catch {/* noop */} finally {
      setLoadingComments(false)
    }
  }

  function closeComments() {
    setCommentSheet({ open: false, foodId: null })
    setCommentText('')
  }

  async function submitComment(e) {
    e.preventDefault()
    if (!commentText.trim() || !commentSheet.foodId) return
    const tempId = 'tmp_' + Date.now()
    const optimistic = {
      _id: tempId,
      text: commentText.trim(),
      likeCount: 0,
      liked: false,
      user: { name: profileName },
      relTime: 'now'
    }
    setComments(prev => [optimistic, ...prev])
    setCommentText('')
    // increment local count on reel
    // (shallow update—only visual)
    try {
      const res = await fetch(`${API_BASE}/api/food/comment`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodId: commentSheet.foodId, text: optimistic.text })
      })
      if (res.ok) {
        const data = await res.json()
        setComments(prev => prev.map(c => c._id === tempId ? data.comment : c))
      } else {
        setComments(prev => prev.filter(c => c._id !== tempId))
        window.toast?.('Failed to post comment', { type: 'error' })
      }
    } catch {
      setComments(prev => prev.filter(c => c._id !== tempId))
      window.toast?.('Failed to post comment', { type: 'error' })
    }
  }

  async function toggleCommentLike(comment) {
    const id = comment._id
    const optimisticLiked = !commentLikes[id]
    setCommentLikes(prev => ({ ...prev, [id]: optimisticLiked }))
    setComments(prev => prev.map(c => c._id === id
      ? { ...c, likeCount: Math.max(0, (c.likeCount || 0) + (optimisticLiked ? 1 : -1)) }
      : c))
    try {
      await fetch(`${API_BASE}/api/food/comment/like`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId: id })
      })
    } catch {
      // revert on failure
      setCommentLikes(prev => ({ ...prev, [id]: !optimisticLiked }))
      setComments(prev => prev.map(c => c._id === id
        ? { ...c, likeCount: Math.max(0, (c.likeCount || 0) + (!optimisticLiked ? 1 : -1)) }
        : c))
    }
  }

  function handleShare(item) {
    try {
      const origin = (typeof window !== 'undefined' && window.location?.origin) || 'https://foodgram.app'
      const url = `${origin}/?v=${encodeURIComponent(item._id)}`
      const title = item.name || 'Check this reel on Foodgram'
      const text = item.description ? item.description.slice(0, 120) : 'Delicious food reel'
      const doFlash = () => {
        setShareFlash(prev => ({ ...prev, [item._id]: true }))
        setTimeout(() => setShareFlash(prev => {
          const n = { ...prev }; delete n[item._id]; return n
        }), 900)
      }

      if (navigator.share) {
        navigator.share({ title, text, url })
          .then(() => {
            window.toast?.('Shared', { type: 'success' })
            doFlash()
          })
          .catch(err => {
            if (err?.name !== 'AbortError') fallbackCopy()
          })
      } else {
        fallbackCopy()
      }

      function fallbackCopy() {
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(url)
            .then(() => {
              window.toast?.('Link copied', { type: 'success' })
              doFlash()
            })
            .catch(() => {
              window.toast?.('Copy failed', { type: 'error' })
            })
        } else {
          // legacy fallback
            const ta = document.createElement('textarea')
            ta.value = url
            ta.style.position = 'fixed'
            ta.style.opacity = '0'
            document.body.appendChild(ta)
            ta.select()
            try { document.execCommand('copy'); window.toast?.('Link copied', { type: 'success' }); doFlash() }
            catch { window.toast?.('Copy failed', { type: 'error' }) }
            finally { document.body.removeChild(ta) }
        }
      }
    } catch {
      window.toast?.('Share unavailable', { type: 'error' })
    }
  }

  useEffect(() => {
    if (!allSaved || !items.length) return
    setSaved(prev => {
      let changed = false
      const next = { ...prev }
      items.forEach(it => {
        if (next[it._id] === undefined) {
          next[it._id] = true
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [items, allSaved])

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
              muted={!!muted[item._id]}
              playsInline
              loop
              preload="metadata"
              // clicking video pauses/plays only; does not affect mute
              onClick={() => togglePause(item._id)}
              onKeyDown={e => {
                if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); togglePause(item._id) }
              }}
              tabIndex={0}
            />

            <div className="reel-overlay">
              <div className="reel-overlay-gradient" aria-hidden="true" />
              {/* Paused overlay (absolute, no layout shift) */}
              {manualPaused[item._id] && (
                <div className="reel-paused-indicator" aria-label="Paused">
                  <div className="reel-paused-circle">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 5v14l11-7z" fill="currentColor" />
                    </svg>
                  </div>
                  <span className="reel-paused-hint">Tap to play</span>
                </div>
              )}

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
                  <button
                    className="reel-action"
                    aria-label="Comments"
                    onClick={() => openComments(item._id)}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                    </svg>
                  </button>
                  <div className="reel-action__count">{item.commentsCount ?? (Array.isArray(item.comments) ? item.comments.length : 0)}</div>
                </div>

                <div className="reel-action-group">
                  <button
                    className={`reel-action share-action ${shareFlash[item._id] ? 'is-flash' : ''}`}
                    aria-label="Share reel"
                    onClick={() => handleShare(item)}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2">
                      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/>
                      <path d="M12 16V3"/>
                      <path d="M8 7l4-4 4 4"/>
                    </svg>
                  </button>
                  <div className="reel-action__count" aria-hidden="true">Share</div>
                </div>

                <div className="reel-action-group">
                  <button
                    className={`reel-action audio-action ${muted[item._id] === false ? 'is-on' : ''}`}
                    aria-label={muted[item._id] === false ? 'Mute' : 'Unmute'}
                    aria-pressed={muted[item._id] === false}
                    onClick={() => toggleAudio(item._id)}
                  >
                    {muted[item._id] === false ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2">
                        <path d="M5 9v6h4l5 5V4L9 9H5z"/><path d="M16 8.82a4 4 0 0 1 0 6.36"/><path d="M18.8 6a8 8 0 0 1 0 12"/>
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2">
                        <path d="M5 9v6h4l5 5V4L9 9H5z"/><path d="m18 9-4 4"/><path d="m14 9 4 4"/>
                      </svg>
                    )}
                  </button>
                  <div className="reel-action__count" aria-hidden="true">
                    {muted[item._id] === false ? 'On' : 'Off'}
                  </div>
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

      {/* Comment sheet overlay */}
      {commentSheet.open && (
        <div className="comments-layer" role="dialog" aria-modal="true" aria-label="Comments">
          <div className="comments-backdrop" onClick={closeComments} />
          <div className="comments-panel">
            <header className="comments-head">
              <button className="comments-close" onClick={closeComments} aria-label="Close comments">✕</button>
              <h2 className="comments-title">Comments</h2>
            </header>
            <div className="comments-scroll">
              {loadingComments && <div className="comments-loading">Loading…</div>}
              {!loadingComments && comments.length === 0 && (
                <div className="comments-empty">No comments yet. Be first!</div>
              )}
              {!loadingComments && comments.map(c => {
                const letter = (c.user?.name || 'U').trim().charAt(0).toUpperCase()
                const liked = !!commentLikes[c._id]
                return (
                  <div key={c._id} className="comment-row">
                    <div className="comment-avatar" aria-hidden="true">{letter}</div>
                    <div className="comment-body">
                      <div className="comment-meta">
                        <span className="comment-user">{c.user?.name || 'User'}</span>
                        <span className="comment-dot">•</span>
                        <span className="comment-time">{c.relTime || ''}</span>
                      </div>
                      <p className="comment-text">{c.text}</p>
                      <div className="comment-actions">
                        <button
                          type="button"
                          className={`comment-like-btn ${liked ? 'is-liked' : ''}`}
                          aria-label={liked ? 'Unlike comment' : 'Like comment'}
                          aria-pressed={liked}
                          onClick={() => toggleCommentLike(c)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>
                          </svg>
                          <span>{c.likeCount || 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <form className="comments-input-bar" onSubmit={submitComment}>
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={500}
                aria-label="Add a comment"
              />
              <button type="submit" disabled={!commentText.trim()} className="comments-send">Post</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


export default ReelFeed
export default ReelFeed
                      <p className="comment-text">{c.text}</p>
                      <div className="comment-actions">
                        <button
                          type="button"
                          className={`comment-like-btn ${liked ? 'is-liked' : ''}`}
                          aria-label={liked ? 'Unlike comment' : 'Like comment'}
                          aria-pressed={liked}
                          onClick={() => toggleCommentLike(c)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>
                          </svg>
                          <span>{c.likeCount || 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <form className="comments-input-bar" onSubmit={submitComment}>
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={500}
                aria-label="Add a comment"
              />
              <button type="submit" disabled={!commentText.trim()} className="comments-send">Post</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


export default ReelFeed
