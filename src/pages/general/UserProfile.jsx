import React, { useRef, useState } from 'react'
import '../../styles/profile.css'

const UserProfile = () => {
  const inputRef = useRef(null)
  const [name] = useState(() => localStorage.getItem('profileName') || 'Your Profile')
  const [email] = useState(() => localStorage.getItem('profileEmail') || '')
  const [avatar, setAvatar] = useState(() => localStorage.getItem('avatarUrl') || '')

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

  return (
    <main className="user-profile-page">
      <section className="user-profile-card">
        <div className="user-avatar-wrap">
          <div className="user-avatar">
            {avatar
              ? <img src={avatar} alt="" />
              : <span>{name?.trim()?.charAt(0)?.toUpperCase() || 'U'}</span>}
          </div>
          <button className="user-avatar-add" onClick={handlePick} aria-label="Add profile photo">
            +
          </button>
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
