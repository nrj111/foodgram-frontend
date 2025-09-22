import React, { useState, useEffect} from 'react'
import '../../styles/profile.css'
import { useParams } from 'react-router-dom'
import axios from 'axios'

const Profile = () => {
    const { id } = useParams()
    const [ profile, setProfile ] = useState(null)
    const [ videos, setVideos ] = useState([])

    useEffect(() => {
        axios.get(`http://localhost:3000/api/food-partner/${id}`, { withCredentials: true })
            .then(response => {
                setProfile(response.data.foodPartner)
                setVideos(response.data.foodPartner.foodItems || [])
            })
            .catch(() => { /* noop */ })
    }, [ id ])

    const postsCount = videos.length
    const totalLikes = videos.reduce((sum, v) => sum + (v.likeCount || 0), 0)
    const totalSaves = videos.reduce((sum, v) => sum + (v.savesCount || 0), 0)

    return (
        <main className="profile-page">
            {/* IG-like header */}
            <section className="profile-header ig-profile-header">
                <div className="ig-profile-meta">
                    <img
                        className="ig-profile-avatar"
                        src="https://images.unsplash.com/photo-1754653099086-3bddb9346d37?w=500&auto=format&fit=crop&q=60"
                        alt=""
                    />
                    <div className="ig-profile-stats" role="list" aria-label="Stats">
                        <div className="ig-profile-stat" role="listitem">
                            <div className="value">{postsCount}</div>
                            <div className="label">Meals</div>
                        </div>
                        <div className="ig-profile-stat" role="listitem">
                            <div className="value">{totalLikes}</div>
                            <div className="label">Likes</div>
                        </div>
                        <div className="ig-profile-stat" role="listitem">
                            <div className="value">{totalSaves}</div>
                            <div className="label">Saves</div>
                        </div>
                    </div>
                </div>

                <div className="ig-profile-info">
                    <h1 className="ig-profile-name">{profile?.name}</h1>
                    <p className="ig-profile-address">{profile?.address}</p>
                </div>
            </section>

            <hr className="profile-sep" />

            {/* Instagram-like 3-column grid of uploaded reels */}
            <section className="profile-grid" aria-label="Videos">
                {videos.map((v) => (
                    <div key={v._id || v.id} className="profile-grid-item">
                        {/* Each tile is a square looping preview */}
                        <video
                            className="profile-grid-video"
                            src={v.video}
                            muted
                            playsInline
                            loop
                            preload="metadata"
                            aria-label={v.name || 'Uploaded reel'}
                        />
                    </div>
                ))}
                {videos.length === 0 && (
                  <div className="profile-grid-item" style={{ aspectRatio:'1/1', display:'grid', placeItems:'center', color:'var(--color-text-secondary)' }}>
                    No uploads yet
                  </div>
                )}
            </section>
        </main>
    )
}

export default Profile