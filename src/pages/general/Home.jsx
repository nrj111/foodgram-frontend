import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom'
import '../../styles/reels.css'
import ReelFeed from '../../components/ReelFeed'

const Home = () => {
    const [ videos, setVideos ] = useState([])
    const [ loading, setLoading ] = useState(true)
    const [ shareOnly, setShareOnly ] = useState(false)
    const API_BASE = import.meta.env?.VITE_API_BASE || 'https://foodgram-backend.vercel.app'
    const LOGO_URL = 'https://ik.imagekit.io/nrj/Foodgram%20Logo_3xjVvij1vu?updatedAt=1758693456925'
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const focusId = params.get('v') || ''

    const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem('profileType')

    useEffect(() => {
        async function fetchSingle(reelId, isPublic=false) {
            setLoading(true)
            try {
                const { data } = await axios.get(`${API_BASE}/api/food/${reelId}`)
                if (data?.food?._id) {
                    setVideos([data.food])
                    setShareOnly(true)
                    setLoading(false)
                    return
                }
                window.toast?.('Reel not found', { type:'error' })
            } catch (err) {
                window.toastError?.(err, 'Failed to load reel')
            }
            setShareOnly(false)
            if (!isPublic) fetchAll()
            else setLoading(false)
        }

        async function fetchAll() {
            setLoading(true)
            axios.get(`${API_BASE}/api/food`)
              .then(response => {
                let items = response.data.foodItems || []
                for (let i = items.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1))
                  ;[items[i], items[j]] = [items[j], items[i]]
                }
                setVideos(items)
              })
              .catch(err=>{
                window.toastError?.(err, 'Failed to load feed')
              })
              .finally(()=> setLoading(false))
        }

        if (!isAuthed) {
            if (focusId) {
                fetchSingle(focusId, true)   // public single reel
            } else {
                fetchAll()                   // NEW: load full public feed (read-only)
            }
            return
        }

        if (focusId) fetchSingle(focusId)
        else fetchAll()
    }, [API_BASE, focusId, isAuthed])

    function exitShareOnly() {
        // remove ?v= param without reload
        try {
            const url = new URL(window.location.href)
            url.searchParams.delete('v')
            window.history.replaceState({}, '', url.toString())
        } catch {}
        setShareOnly(false)
        // refetch full feed
        axios.get(`${API_BASE}/api/food`).then(r=>{
            setVideos(r.data.foodItems || [])
        }).catch(()=>{})
    }

    async function likeVideo(item) {
        // Guard: must be signed in as user
        if (localStorage.getItem('profileType') !== 'user') {
            window.toast?.('Sign in as a user to like reels', { type: 'info' })
            return { ok: false, unauthorized: true }
        }
        try {
            const { data } = await axios.post(`${API_BASE}/api/food/like`, { foodId: item._id }, { withCredentials: true })
            const liked = !!data.liked
            const likeCount = data.likeCount ?? item.likeCount
            setVideos(prev => prev.map(v => v._id === item._id ? { ...v, likeCount } : v))
            // persist local liked set
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

    async function saveVideo(item) {
        if (localStorage.getItem('profileType') !== 'user') {
            window.toast?.('Sign in as a user to save reels', { type: 'info' })
            return { ok: false, unauthorized: true }
        }
        try {
            const { data } = await axios.post(`${API_BASE}/api/food/save`, { foodId: item._id }, { withCredentials: true })
            const saved = !!data.saved
            const savesCount = data.savesCount ?? item.savesCount
            setVideos(prev => prev.map(v => v._id === item._id ? { ...v, savesCount } : v))
            // maintain local saved cache
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
            window.toast?.('Save failed', { type: 'error' })
            return { ok: false }
        }
    }

    async function deleteVideo(item) {
        const isPartner = localStorage.getItem('profileType') === 'partner'
        const localPid = localStorage.getItem('partnerId')
        const itemPid = typeof item.foodPartner === 'object' ? item.foodPartner?._id : item.foodPartner
        if (!isPartner || !localPid || String(localPid) !== String(itemPid)) {
            window.toast?.('Not authorized to delete this reel', { type: 'error' })
            return { ok: false, unauthorized: true }
        }
        try {
            const res = await fetch(`${API_BASE}/api/food/${item._id}`, {
                method: 'DELETE',
                credentials: 'include'
            })
            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    window.toast?.('Session expired or unauthorized', { type: 'warning' })
                    return { ok: false, unauthorized: true }
                }
                window.toast?.('Delete failed', { type: 'error' })
                return { ok: false }
            }
            setVideos(prev => prev.filter(v => v._id !== item._id))
            // clean local caches
            try {
                const likedSet = new Set(JSON.parse(localStorage.getItem('likedLocal') || '[]'))
                const savedSet = new Set(JSON.parse(localStorage.getItem('savedLocal') || '[]'))
                likedSet.delete(item._id); savedSet.delete(item._id)
                localStorage.setItem('likedLocal', JSON.stringify(Array.from(likedSet)))
                localStorage.setItem('savedLocal', JSON.stringify(Array.from(savedSet)))
            } catch {}
            window.toast?.('Reel deleted', { type: 'success' })
            return { ok: true }
        } catch {
            window.toast?.('Delete failed', { type: 'error' })
            return { ok: false }
        }
    }

    // Optional lightweight loading
    if (loading && videos.length === 0) {
        return (
            <div className="reels-page">
              <header className="ig-header" aria-hidden="true">
                <div className="ig-brand">
                  <img className="ig-brand-logo" src={LOGO_URL} alt="" />
                </div>
              </header>
              <div className="reels-feed is-loading" role="status" aria-busy="true" aria-label="Loading feed">
                {Array.from({length:3}).map((_,i)=>(
                  <div key={i} className="reel-skel">
                    <div className="reel-skel-video" />
                    <div className="reel-skel-lines">
                      <div className="skeleton-bar wide" />
                      <div className="skeleton-bar med" />
                      <div className="skeleton-bar small" />
                      <div className="skeleton-bar wide" style={{marginTop:'8px'}} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
        )
    }

    return (
        <>
            {shareOnly && isAuthed && (
                <div style={{ position:'fixed',top:8,left:8,zIndex:50,display:'flex',gap:'8px' }}>
                  <button
                    onClick={exitShareOnly}
                    className="btn btn-outline"
                    style={{padding:'0 14px',height:'38px'}}
                    aria-label="View full feed"
                  >← All Reels</button>
                </div>
              )}
            <ReelFeed
              items={videos}
              onLike={likeVideo}
              onSave={saveVideo}
              onDelete={deleteVideo}
              emptyMessage={shareOnly ? "Reel unavailable." : "No videos available."}
              focusId={shareOnly ? videos?.[0]?._id : focusId}
              publicSingle={!!focusId && !isAuthed}
              publicReadOnly={!isAuthed}          // NEW
            />
        </>
    )
}

export default Home