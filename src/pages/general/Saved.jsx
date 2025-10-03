import React, { useEffect, useState } from 'react'
import '../../styles/reels.css'
import axios from 'axios'
import ReelFeed from '../../components/ReelFeed'

const Saved = () => {
    const [ videos, setVideos ] = useState([])
    const API_BASE = import.meta.env?.VITE_API_BASE || 'https://foodgram-backend.vercel.app'

    useEffect(() => {
        axios.get(`${API_BASE}/api/food/save`, { withCredentials: true })
            .then(response => {
                const savedFoods = (response.data.savedFoods || []).map((item) => ({
                    _id: item.food._id,
                    name: item.food.name,
                    video: item.food.video || item.food.videoUrl, // fallback
                    description: item.food.description,
                    price: item.food.price,
                    likeCount: item.food.likeCount ?? item.food.likesCount ?? 0,
                    savesCount: item.food.savesCount ?? item.food.saveCount ?? 0,
                    commentsCount: item.food.commentsCount ?? 0,
                    foodPartner: item.food.foodPartner,
                }))
                setVideos(savedFoods)
            })
            .catch(() => {
                setVideos([])
            })
    }, [API_BASE]) // fixed: add dependency array

    const removeSaved = async (item) => {
        try {
            const { data } = await axios.post(`${API_BASE}/api/food/save`, { foodId: item._id }, { withCredentials: true })
            // If toggle result is unsaved, remove from list
            if (data && data.save === false) {
                setVideos(prev => prev.filter(v => v._id !== item._id))
            } else {
                // still saved (server re-saved) just update count
                setVideos(prev => prev.map(v =>
                  v._id === item._id ? { ...v, savesCount: (v.savesCount ?? 0) + 1 } : v
                ))
            }
        } catch {
            window.toast?.('Failed to update saved state', { type: 'error' })
        }
    }

    return (
        <ReelFeed
            items={videos}
            onSave={removeSaved}
            emptyMessage="No saved videos yet."
            allSaved={true}
        />
    )
}

export default Saved
