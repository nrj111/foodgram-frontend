import React, { useEffect, useState } from 'react'
import axios from 'axios';
import '../../styles/reels.css'
import ReelFeed from '../../components/ReelFeed'

const Home = () => {
    const [ videos, setVideos ] = useState([])
    const API_BASE = import.meta.env?.VITE_API_BASE || 'https://foodgram-backend.vercel.app'

    useEffect(() => {
        axios.get(`${API_BASE}/api/food`)
            .then(response => { setVideos(response.data.foodItems) })
            .catch(() => { /* noop */ })
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