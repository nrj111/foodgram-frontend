import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import '../../styles/profile.css'

const UserProfile = () => {
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const API_BASE = (import.meta.env?.VITE_API_BASE || '').replace(/\/$/, '')

  const [name] = useState(() => localStorage.getItem('profileName') || 'Your Profile')
  const [email] = useState(() => localStorage.getItem('profileEmail') || '')
  const [avatar, setAvatar] = useState(() => localStorage.getItem('avatarUrl') || '')

  // Food Partner role detection
  const [isPartner, setIsPartner] = useState(false)
  const [checkingRole, setCheckingRole] = useState(true)

  useEffect(() => {
    let active = true
    async function checkPartner() {
      try {
        // quick local fallback
        const localType = (typeof window !== 'undefined' && localStorage.getItem('profileType')) || ''
        if (localType === 'partner') {
          if (active) { setIsPartner(true); setCheckingRole(false) }
          return
        }
        // remote check (optional)
        if (API_BASE) {
          await axios.get(`${API_BASE}/api/auth/foodPartner/me`, { withCredentials: true })
          if (active) setIsPartner(true)
        } else {
          if (active) setIsPartner(false)
        }
      } catch {
        if (active) setIsPartner(false)
      } finally {
        if (active) setCheckingRole(false)
      }
    }
    checkPartner()
    return () => { active = false }
  }, [API_BASE])

  const handlePick = () => inputRef.current?.click()

  const onFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      window.toast?.('Please select an image', { type: 'error' })
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const url = String(reader.result || '')
      setAvatar(url)
      try {
        localStorage.setItem('avatarUrl', url)
      } catch(err){
        console.error('Failed to save avatar URL', err)
      }
      window.toast?.('Profile photo updated', { type: 'success' })
    }
    reader.readAsDataURL(f)
  }

  const goExplore = () => navigate('/')
  const goUpload = () => navigate('/create-food') // fixed path

  return (
    <main className="user-profile-page fade-page">
      {/* Partner action bar (Explore, Upload Reel) */}
      {!checkingRole && isPartner && (
        <nav className="partner-actions" aria-label="Partner actions" style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
          <button onClick={goExplore} className="btn" aria-label="Explore">Explore</button>
          <button onClick={goUpload} className="btn btn-primary" aria-label="Upload Reel">Upload Reel</button>
        </nav>
      )}

      <section className="user-profile-card">
        <div className="user-avatar-wrap">
          <div className="user-avatar">
            {avatar
              ? <img src={avatar} alt="" />
              : <span>{name?.trim()?.charAt(0)?.toUpperCase() || 'U'}</span>}
          </div>
          {!avatar && (
            <button className="user-avatar-add" onClick={handlePick} aria-label="Add profile photo">
              +
            </button>
          )}
          <input ref={inputRef} type="file" accept="image/*" onChange={onFile} hidden />
        </div>

        <div className="user-info">
          <h1 className="user-name" title={name}>{name}</h1>
          {email && <div className="user-handle">@{email.split('@')[0]}</div>}
        </div>
      </section>
    </main>
  )
}

export default UserProfile
