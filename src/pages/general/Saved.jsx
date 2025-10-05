import React, { useEffect, useState } from 'react'
import '../../styles/reels.css'
import axios from 'axios'
import ReelFeed from '../../components/ReelFeed'
import { Link } from 'react-router-dom'

const Saved = () => {
    const [ videos, setVideos ] = useState([])
    const API_BASE = import.meta.env?.VITE_API_BASE || 'https://foodgram-backend.vercel.app'
    const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem('profileType')

    // NEW: auth gate (prevents loading saved list when logged out)
    if (!isAuthed) {
      return (
        <div className="reels-page" style={{display:'grid',placeItems:'center',padding:'32px'}}>
          <div style={{
            maxWidth:'480px',
            width:'100%',
            textAlign:'center',
            background:'var(--color-surface)',
            border:'1px solid var(--color-border)',
            borderRadius:'16px',
            padding:'32px',
            boxShadow:'var(--shadow-md)'
          }}>
            <h1 style={{margin:'0 0 12px',fontSize:'1.35rem',fontWeight:800}}>Sign in to view saved reels</h1>
            <p style={{margin:'0 0 20px',color:'var(--color-text-secondary)'}}>
              Your saved collection is available after you sign in.
            </p>
            <div style={{display:'flex',gap:'10px',justifyContent:'center'}}>
              <Link to="/user/login" className="btn btn-primary">Sign In</Link>
              <Link to="/register" className="btn">Register</Link>
            </div>
          </div>
        </div>
      )
    }

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

    const deleteVideo = async (item) => {
        const isPartner = localStorage.getItem('profileType') === 'partner'
        const localPid = localStorage.getItem('partnerId')
        const itemPid = typeof item.foodPartner === 'object' ? item.foodPartner?._id : item.foodPartner
        if (!isPartner || !localPid || String(localPid) !== String(itemPid)) {
            window.toast?.('Not authorized to delete', { type: 'error' })
            return { ok: false, unauthorized: true }
        }
        try {
            const res = await fetch(`${API_BASE}/api/food/${item._id}`, {
                method: 'DELETE',
                credentials: 'include'
            })
            if (!res.ok) {
                window.toast?.('Delete failed', { type: 'error' })
                return { ok: false }
            }
            setVideos(prev => prev.filter(v => v._id !== item._id))
            try {
              const savedSet = new Set(JSON.parse(localStorage.getItem('savedLocal') || '[]'))
              savedSet.delete(item._id)
              localStorage.setItem('savedLocal', JSON.stringify(Array.from(savedSet)))
            } catch {}
            window.toast?.('Reel deleted', { type: 'success' })
            return { ok: true }
        } catch {
            window.toast?.('Delete failed', { type: 'error' })
            return { ok: false }
        }
    }

    return (
        <ReelFeed
            items={videos}
            onLike={likeVideo}
            onSave={removeSaved}
            onDelete={deleteVideo}
            emptyMessage="No saved videos yet."
            allSaved={true}
        />
    )
}

export default Saved
