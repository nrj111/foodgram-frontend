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

    const likeVideo = async (item) => {
        if (localStorage.getItem('profileType') !== 'user') {
            window.toast?.('Sign in as a user to like reels', { type: 'info' })
            return { ok: false, unauthorized: true }
        }
        try {
            const { data } = await axios.post(`${API_BASE}/api/food/like`, { foodId: item._id }, { withCredentials: true })
            const liked = !!data.liked
            const likeCount = data.likeCount
            setVideos(prev => prev.map(v => v._id === item._id ? { ...v, likeCount } : v))
            try {
              const raw = localStorage.getItem('likedLocal')
              const set = new Set(raw ? JSON.parse(raw) : [])
              if (liked) set.add(item._id); else set.delete(item._id)
              localStorage.setItem('likedLocal', JSON.stringify(Array.from(set)))
            } catch {}
            return { ok: true, liked, likeCount }
        } catch (err) {
            if (err?.response?.status === 401) {
                window.toast?.('Session expired. Please sign in again.', { type: 'warning' })
                return { ok: false, unauthorized: true }
            }
            window.toast?.('Like failed', { type: 'error' })
            return { ok: false }
        }
    }

    const removeSaved = async (item) => {
        if (localStorage.getItem('profileType') !== 'user') {
            window.toast?.('Sign in as a user to save reels', { type: 'info' })
            return { ok: false, unauthorized: true }
        }
        try {
            const { data } = await axios.post(`${API_BASE}/api/food/save`, { foodId: item._id }, { withCredentials: true })
            const saved = !!data.saved
            const savesCount = data.savesCount
            if (!saved) {
                setVideos(prev => prev.filter(v => v._id !== item._id))
            } else {
                setVideos(prev => prev.map(v => v._id === item._id ? { ...v, savesCount } : v))
            }
            // sync local saved set
            try {
              const raw = localStorage.getItem('savedLocal')
              const set = new Set(raw ? JSON.parse(raw) : [])
              if (saved) set.add(item._id); else set.delete(item._id)
              const arr = Array.from(set)
              localStorage.setItem('savedLocal', JSON.stringify(arr))
              window.dispatchEvent(new CustomEvent('saved:count', { detail: arr.length }))
            } catch {}
            return { ok: true, saved, savesCount }
        } catch (err) {
            if (err?.response?.status === 401) {
                window.toast?.('Session expired. Please sign in again.', { type: 'warning' })
                return { ok: false, unauthorized: true }
            }
            window.toast?.('Failed to update saved state', { type: 'error' })
            return { ok: false }
        }
    }

    return (
        <ReelFeed
            items={videos}
            onLike={likeVideo}
            onSave={removeSaved}
            emptyMessage="No saved videos yet."
            allSaved={true}
        />
    )
}

export default Saved
