import React, { useState, useEffect} from 'react'
import '../../styles/profile.css'
import { useParams } from 'react-router-dom'
import axios from 'axios'

const Profile = () => {
    const { id } = useParams()
    const [ profile, setProfile ] = useState(null)
    const [ videos, setVideos ] = useState([])
    const [ following, setFollowing ] = useState(false)               // new local follow state
    const [ activeTab, setActiveTab ] = useState('reels')             // future-ready
    const API_BASE = import.meta.env?.VITE_API_BASE || 'https://foodgram-backend.vercel.app'

    useEffect(() => {
        axios.get(`${API_BASE}/api/food-partner/${id}`)
            .then(response => {
                setProfile(response.data.foodPartner)
                setVideos(response.data.foodPartner.foodItems || [])
            })
            .catch(() => { /* noop */ })
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

    const postsCount = videos.length
    const totalLikes = videos.reduce((sum, v) => sum + (v.likeCount || 0), 0)
    const totalSaves = videos.reduce((sum, v) => sum + (v.savesCount || 0), 0)

    return (
        <main className="profile-page">
            {/* Instagram-like header */}
            <section className="profile-header ig-profile-header">
                <div className="ig-profile-top">
                    <div className="ig-profile-avatar-wrap">
                        <img
                            className="ig-profile-avatar"
                            src="https://images.unsplash.com/photo-1754653099086-3bddb9346d37?w=500&auto=format&fit=crop&q=60"
                            alt=""
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
                            <p className="ig-profile-address">{profile?.address || 'No address provided'}</p>
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
                      <div key={v._id || v.id} className="profile-grid-item">
                          <video
                              className="profile-grid-video"
                              src={v.video}
                              muted
                              playsInline
                              loop
                              preload="metadata"
                              aria-label={v.name || 'Uploaded reel'}
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
                      </div>
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