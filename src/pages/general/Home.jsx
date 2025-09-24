import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { Link } from 'react-router-dom'
import '../../styles/reels.css'
import ReelFeed from '../../components/ReelFeed'

const Home = () => {
    const [ videos, setVideos ] = useState([])
    const [ loading, setLoading ] = useState(true)
    const API_BASE = import.meta.env?.VITE_API_BASE || 'https://foodgram-backend.vercel.app'
    const LOGO_URL = 'https://ik.imagekit.io/nrj/Foodgram%20Logo_3xjVvij1vu?updatedAt=1758693456925'

    useEffect(() => {
        setLoading(true)
        axios.get(`${API_BASE}/api/food`)
            .then(response => { setVideos(response.data.foodItems) })
            .catch(() => { /* noop */ })
            .finally(() => setLoading(false))
    }, [API_BASE])

    async function likeVideo(item) {
        const response = await axios.post(`${API_BASE}/api/food/like`, { foodId: item._id }, { withCredentials: true })
        if (response.data.like) {
            setVideos(prev => prev.map(v => v._id === item._id ? { ...v, likeCount: v.likeCount + 1 } : v))
        } else {
            setVideos(prev => prev.map(v => v._id === item._id ? { ...v, likeCount: v.likeCount - 1 } : v))
        }
    }

    async function saveVideo(item) {
        const response = await axios.post(`${API_BASE}/api/food/save`, { foodId: item._id }, { withCredentials: true })
        if (response.data.save) {
            setVideos(prev => prev.map(v => v._id === item._id ? { ...v, savesCount: v.savesCount + 1 } : v))
        } else {
            setVideos(prev => prev.map(v => v._id === item._id ? { ...v, savesCount: v.savesCount - 1 } : v))
        }
    }

    // Signed-out detection (local, fast)
    const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem('profileType')

    // Show a hero when signed out and no videos to show
    if (!isAuthed && !loading && videos.length === 0) {
        return (
            <section className="landing-hero" role="region" aria-label="Welcome">
                <div className="landing-hero__card">
                    <div className="landing-hero__brand" aria-hidden="true">
                        <img src={LOGO_URL} alt="" />
                    </div>
                    <h1 className="landing-hero__title">Discover delicious reels near you</h1>
                    <p className="landing-hero__subtitle">
                        Scroll through bite-sized videos from food partners. Like, save, and add to cart in a tap.
                    </p>

                    <div className="landing-hero__badges" aria-label="Highlights">
                        <span className="badge">Fast</span>
                        <span className="badge">Tasty</span>
                        <span className="badge">Local</span>
                    </div>

                    <ul className="landing-hero__features" aria-label="Why you’ll love it">
                        <li>Explore reels tailored to your taste</li>
                        <li>Save your favorites for later</li>
                        <li>Order directly from partners</li>
                    </ul>

                    <div className="landing-hero__actions">
                        <Link to="/user/login" className="btn">Sign in</Link>
                        <Link to="/register" className="btn btn-primary">Create account</Link>
                    </div>

                    <div className="landing-hero__alt">
                        Are you a food partner? <Link to="/food-partner/register" className="btn btn-outline">Become a partner</Link>
                    </div>
                </div>
            </section>
        )
    }

    // Optional lightweight loading
    if (loading && videos.length === 0) {
        return (
            <section className="landing-hero" role="status" aria-busy="true">
                <div className="landing-hero__card">
                    <h2 className="landing-hero__title">Loading…</h2>
                    <p className="landing-hero__subtitle">Fetching the latest food reels.</p>
                </div>
            </section>
        )
    }

    return (
        <ReelFeed
            items={videos}
            onLike={likeVideo}
            onSave={saveVideo}
            emptyMessage="No videos available."
        />
    )
}

export default Home