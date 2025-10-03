import React, { useEffect, useState } from 'react'
import '../../styles/reels.css'
import axios from 'axios'
import ReelFeed from '../../components/ReelFeed'

const Saved = () => {
    const [ videos, setVideos ] = useState([])
    const API_BASE = import.meta.env?.VITE_API_BASE || 'https://foodgram-backend.vercel.app'

    useEffect(() => {
        let cancelled = false

        async function fetchSaved() {
          try {
            const { data } = await axios.get(`${API_BASE}/api/food/save`, { withCredentials: true })
            const list = (data.savedFoods || []).map(item => ({
              _id: item.food._id,
              name: item.food.name,
              video: item.food.video || item.food.videoUrl,
              description: item.food.description,
              price: item.food.price,
              likeCount: item.food.likeCount ?? item.food.likesCount ?? 0,
              savesCount: item.food.savesCount ?? item.food.saveCount ?? 0,
              commentsCount: item.food.commentsCount ?? 0,
              foodPartner: item.food.foodPartner,
            }))
            if (!cancelled) setVideos(list)

            // If API returned none, try local fallback (offline / different role)
            if (!cancelled && list.length === 0) {
              await loadLocalFallback()
            }
          } catch {
            if (!cancelled) {
              setVideos([])
              await loadLocalFallback()
            }
          }
        }

        async function loadLocalFallback() {
          try {
            const raw = localStorage.getItem('savedLocal')
            if (!raw) return
            const ids = JSON.parse(raw).filter(Boolean)
            if (!ids.length) return
            // fetch each food item in parallel (ignore failures)
            const results = await Promise.all(ids.map(id =>
              axios.get(`${API_BASE}/api/food/${id}`).then(r => r.data.food).catch(()=>null)
            ))
            const cleaned = results.filter(Boolean).map(f => ({
              _id: f._id,
              name: f.name,
              video: f.video || f.videoUrl,
              description: f.description,
              price: f.price,
              likeCount: f.likeCount ?? 0,
              savesCount: f.savesCount ?? 0,
              commentsCount: f.commentsCount ?? 0,
              foodPartner: f.foodPartner
            }))
            if (cleaned.length && !cancelled) setVideos(cleaned)
          } catch {/* ignore */}
        }

        fetchSaved()
        return () => { cancelled = true }
    }, [API_BASE]) // fixed: add dependency array

    const removeSaved = async (item) => {
        try {
            const { data } = await axios.post(`${API_BASE}/api/food/save`, { foodId: item._id }, { withCredentials: true })
            const nowSaved = !!data.saved || !!data.save
            if (!nowSaved) {
                setVideos(prev => prev.filter(v => v._id !== item._id))
            } else {
                setVideos(prev => prev.map(v =>
                  v._id === item._id ? { ...v, savesCount: (v.savesCount ?? 0) + 1 } : v
                ))
            }
            // sync local fallback store
            try {
              const raw = localStorage.getItem('savedLocal')
              const set = new Set(raw ? JSON.parse(raw) : [])
              if (nowSaved) set.add(item._id); else set.delete(item._id)
              const arr = Array.from(set)
              localStorage.setItem('savedLocal', JSON.stringify(arr))
              window.dispatchEvent(new CustomEvent('saved:count', { detail: arr.length }))
            } catch {}
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
