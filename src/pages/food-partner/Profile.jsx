import React, { useState, useEffect, useRef } from 'react'
import '../../styles/profile.css'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const Profile = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const avatarInputRef = useRef(null)
    const [ profile, setProfile ] = useState(null)
    const [ videos, setVideos ] = useState([])
    const [ following, setFollowing ] = useState(false)               // new local follow state
    const [ activeTab, setActiveTab ] = useState('reels')             // future-ready
    const [ avatar, setAvatar ] = useState(() => localStorage.getItem('partnerAvatarUrl') || '')
    const [ loadingProfile, setLoadingProfile ] = useState(true) // NEW
    const API_BASE = import.meta.env?.VITE_API_BASE || 'https://foodgram-backend.vercel.app'

    useEffect(() => {
        setLoadingProfile(true) // NEW
        axios.get(`${API_BASE}/api/food-partner/${id}`)
            .then(response => {
                setProfile(response.data.foodPartner)
                setVideos(response.data.foodPartner.foodItems || [])
            })
            .catch(err => {
                window.toastError?.(err, 'Failed to load partner profile')
            })
            .finally(()=> setLoadingProfile(false)) // NEW
    }, [ id, API_BASE ])

    const isOwner = (() => {
        try {
            const localPid = localStorage.getItem('partnerId')
            return localPid && profile?._id && localPid === String(profile._id)
        } catch { return false }
    })()

    const handleFollow = () => {
        if (isOwner) return
        setFollowing(f => !f)
        window.toast?.(following ? 'Unfollowed' : 'Followed', { type: 'info' })
    }

    const handleAvatarPick = () => {
        if (!isOwner) return
        avatarInputRef.current?.click()
    }
    const onAvatarFile = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            window.toast?.('Please select an image', { type: 'error' })
            return
        }
        const reader = new FileReader()
        reader.onload = () => {
            const url = String(reader.result || '')
            setAvatar(url)
            try { localStorage.setItem('partnerAvatarUrl', url) } catch {}
            window.toast?.('Profile photo updated', { type: 'success' })
        }
        reader.readAsDataURL(file)
    }

    const postsCount = videos.length
    const totalLikes = videos.reduce((sum, v) => sum + (v.likeCount || 0), 0)
    const totalSaves = videos.reduce((sum, v) => sum + (v.savesCount || 0), 0)

    if (loadingProfile) {
      return (
        <main className="profile-page fade-page">
          <section className="profile-header ig-profile-header">
            <div className="ig-profile-top">
              <div className="ig-profile-avatar-wrap">
                <div className="ig-profile-avatar skeleton" />
              </div>
              <div className="ig-profile-main">
                <div className="skeleton line lg" style={{width:'40%'}} />
                <div className="ig-profile-stats-line" aria-hidden="true">
                  <div className="skeleton pill" style={{width:70,height:18}} />
                  <div className="skeleton pill" style={{width:70,height:18}} />
                  <div className="skeleton pill" style={{width:70,height:18}} />
                </div>
                <div className="skeleton line" style={{width:'60%'}} />
                <div className="skeleton line" style={{width:'50%'}} />
              </div>
            </div>
            <nav className="ig-profile-tabs" aria-hidden="true">
              <div className="skeleton pill" style={{width:72,height:28}} />
              <div className="skeleton pill" style={{width:72,height:28}} />
            </nav>
          </section>
          <hr className="profile-sep" />
          <section className="profile-grid" aria-label="Loading videos">
            {Array.from({length:6}).map((_,i)=>(
              <div key={i} className="profile-grid-item">
                <div className="skeleton" style={{width:'100%',height:'100%'}} />
              </div>
            ))}
          </section>
        </main>
      )
    }

    return (
        <main className="profile-page fade-page">
            {/* Instagram-like header */}
            <section className="profile-header ig-profile-header">
                <div className="ig-profile-top">
                    <div
                      className="ig-profile-avatar-wrap"
                      onClick={isOwner ? handleAvatarPick : undefined}
                    >
                      {avatar ? (
                        <img className="ig-profile-avatar" src={avatar} alt="" />
                      ) : (
                        isOwner ? (
                          <div className="ig-profile-avatar is-empty" aria-label="No avatar">
                            <span className="avatar-letter">
                              {(profile?.name || 'P').charAt(0).toUpperCase()}
                            </span>
                            <button
                              type="button"
                              className="avatar-add-btn"
                              aria-label="Add profile photo"
                              onClick={(e) => { e.stopPropagation(); handleAvatarPick(); }}
                            >+</button>
                          </div>
                        ) : (
                          <div
                            className="ig-profile-avatar placeholder"
                            aria-label="No avatar"
                          >
                            <span className="avatar-letter">
                              {(profile?.name || 'P').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )
                      )}
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={onAvatarFile}
                      />
                    </div>
                    <div className="ig-profile-main">
                        <div className="ig-profile-row">
                            <h1 className="ig-profile-username">{profile?.name || 'Partner'}</h1>
                            <div className="ig-profile-actions">
                                <button
                                  type="button"
                                  className={`ig-action-btn ${isOwner ? 'outline' : (following ? 'secondary' : 'primary')}`}
                                  onClick={handleFollow}
                                  aria-pressed={!isOwner && following}
                                  aria-label={isOwner ? 'Edit profile' : (following ? 'Unfollow' : 'Follow')}
                                >
                                  {isOwner ? 'Edit Profile' : (following ? 'Following' : 'Follow')}
                                </button>
                            </div>
                        </div>

                        <ul className="ig-profile-stats-line" aria-label="Stats">
                            <li><span className="value">{postsCount}</span> posts</li>
                            <li><span className="value">{totalLikes}</span> likes</li>
                            <li><span className="value">{totalSaves}</span> saves</li>
                        </ul>

                        <div className="ig-profile-bio">
                            <p className="ig-profile-address">
                              <svg className="loc-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 21s6-5.2 6-11a6 6 0 0 0-12 0c0 5.8 6 11 6 11z"/><circle cx="12" cy="10" r="2.5"/>
                              </svg>
                              {profile?.address || 'No address provided'}
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="ig-profile-tabs" role="tablist" aria-label="Profile sections">
                    <button
                      role="tab"
                      aria-selected={activeTab === 'reels'}
                      className={`ig-profile-tab ${activeTab === 'reels' ? 'is-active' : ''}`}
                      onClick={()=>setActiveTab('reels')}
                    >
                      Reels
                    </button>
                    {/* Future tabs (e.g., About, Menu) can go here */}
                </nav>
            </section>

            <hr className="profile-sep" />

            {activeTab === 'reels' && (
              <section className="profile-grid" aria-label="Videos">
                  {videos.map((v) => (
                      <button
                        key={v._id || v.id}
                        type="button"
                        className="profile-grid-item as-button"
                        onClick={() => navigate(`/?v=${encodeURIComponent(v._id || v.id)}`)}
                        aria-label="Open reel in feed"
                      >
                          <video
                              className="profile-grid-video"
                              src={v.video}
                              muted
                              playsInline
                              loop
                              preload="metadata"
                              aria-hidden="true"
                          />
                          <div className="profile-grid-overlay">
                            <div className="overlay-stats">
                              <span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 
                                  4.42 3 7.5 3c1.74 0 3.41.81 
                                  4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 
                                  22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 
                                  11.54L12 21.35z"/>
                                </svg>
                                {v.likeCount || 0}
                              </span>
                              <span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
                                </svg>
                                {v.savesCount || 0}
                              </span>
                            </div>
                          </div>
                      </button>
                  ))}
                  {videos.length === 0 && (
                    <div className="profile-grid-item empty" style={{ display:'grid', placeItems:'center', color:'var(--color-text-secondary)' }}>
                      No uploads yet
                    </div>
                  )}
              </section>
            )}
        </main>
    )
}

export default Profile