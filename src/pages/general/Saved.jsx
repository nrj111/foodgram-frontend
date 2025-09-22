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
                const savedFoods = response.data.savedFoods.map((item) => ({
                    _id: item.food._id,
                    name: item.food.name,              // add name
                    video: item.food.video,
                    description: item.food.description,
                    price: item.food.price,                  // <-- added
                    likeCount: item.food.likeCount,
                    savesCount: item.food.savesCount,
                    commentsCount: item.food.commentsCount,
                    foodPartner: item.food.foodPartner,
                }))
                setVideos(savedFoods)
            })
    }, [API_BASE]) // fixed: add dependency array

    const removeSaved = async (item) => {
        try {
            await axios.post(`${API_BASE}/api/food/save`, { foodId: item._id }, { withCredentials: true })
            setVideos((prev) => prev.map((v) => v._id === item._id ? { ...v, savesCount: Math.max(0, (v.savesCount ?? 1) - 1) } : v))
        } catch {
            // noop
        }
    }

    return (
        <ReelFeed
            items={videos}
            onSave={removeSaved}
            emptyMessage="No saved videos yet."
        />
    )
}

export default Saved
