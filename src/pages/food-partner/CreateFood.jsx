import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import '../../styles/create-food.css';
import { useNavigate } from 'react-router-dom';

const CreateFood = () => {
    const [ name, setName ] = useState('');
    const [ description, setDescription ] = useState('');
    const [ price, setPrice ] = useState('');                    // <-- added
    const [ videoFile, setVideoFile ] = useState(null);
    const [ videoURL, setVideoURL ] = useState('');
    const [ fileError, setFileError ] = useState('');
    const [ uploading, setUploading ] = useState(false);
    const fileInputRef = useRef(null);

    const navigate = useNavigate();
    const API_BASE = import.meta.env?.VITE_API_BASE || 'https://foodgram-backend.vercel.app'
    const IK_UPLOAD_ENDPOINT = 'https://upload.imagekit.io/api/v1/files/upload'; // fixed

    useEffect(() => {
        // Access control: only partners
        const localType = localStorage.getItem('profileType');
        if (localType !== 'partner') {
            navigate('/user/login');
            return;
        }
        // Validate server session (defense in depth)
        (async () => {
            try {
                await axios.get(`${API_BASE}/api/auth/foodPartner/me`, { withCredentials: true });
            } catch {
                // Session invalid -> clear local + force login
                try {
                    await fetch(`${API_BASE}/api/auth/foodPartner/logout`, { credentials: 'include' });
                } catch {}
                localStorage.removeItem('profileType');
                navigate('/food-partner/login');
            }
        })();
    }, [ API_BASE, navigate ]);

    useEffect(() => {
        if (!videoFile) {
            setVideoURL('');
            return;
        }
        const url = URL.createObjectURL(videoFile);
        setVideoURL(url);
        return () => URL.revokeObjectURL(url);
    }, [ videoFile ]);

    const onFileChange = (e) => {
        const file = e.target.files && e.target.files[ 0 ];
        if (!file) { setVideoFile(null); setFileError(''); return; }
        if (!file.type.startsWith('video/')) { setFileError('Please select a valid video file.'); return; }
        setFileError('');
        setVideoFile(file);
    };

    const onDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer?.files?.[ 0 ];
        if (!file) { return; }
        if (!file.type.startsWith('video/')) { setFileError('Please drop a valid video file.'); return; }
        setFileError('');
        setVideoFile(file);
    };

    const onDragOver = (e) => {
        e.preventDefault();
    };

    const openFileDialog = () => fileInputRef.current?.click();

    const onSubmit = async (e) => {
        e.preventDefault();
        setFileError('');
        if (!videoFile) { setFileError('Please select a video'); window.toast?.('Video required', { type:'error'}); return; }
        const nPrice = Number.parseFloat(price);
        if (Number.isNaN(nPrice) || nPrice < 0) {
            setFileError('Please enter a valid non-negative price');
            window.toast?.('Invalid price', { type:'error' });
            return;
        }
        try {
            setUploading(true);

            // 1) Get ImageKit auth from backend
            let auth;
            try {
                const { data } = await axios.get(`${API_BASE}/api/food/upload/auth`, { withCredentials: true });
                auth = data;
            } catch (err) {
                window.toastError?.(err,'Upload credential error');
                throw err;
            }

            // 2) Attempt direct client upload to ImageKit
            let remoteUrl = '';
            try {
                const fd = new FormData();
                fd.append('file', videoFile);
                fd.append('fileName', videoFile.name || 'upload.mp4');
                fd.append('publicKey', auth.publicKey);
                fd.append('signature', auth.signature);
                fd.append('expire', String(auth.expire));
                fd.append('token', auth.token);
                fd.append('useUniqueFileName', 'true');

                const ikRes = await fetch(IK_UPLOAD_ENDPOINT, { method: 'POST', body: fd });
                if (!ikRes.ok) {
                    const txt = await ikRes.text().catch(() => '');
                    throw new Error(`ImageKit upload failed (${ikRes.status}): ${txt.slice(0,180)}`);
                }
                const ikJson = await ikRes.json();
                if (!ikJson?.url) throw new Error('ImageKit did not return a url');
                remoteUrl = ikJson.url;
            } catch (err) {
                window.toast?.('Direct upload failed. Retrying via server…', { type:'warning' })
            }

            let response;
            if (remoteUrl) {
                // 3A) Create food with remote URL (JSON)
                response = await axios.post(`${API_BASE}/api/food`, {
                    name,
                    description,
                    price: nPrice,
                    videoUrl: remoteUrl
                }, { withCredentials: true });
            } else {
                // 3B) Fallback: send multipart with video file
                const fd2 = new FormData();
                fd2.append('name', name);
                fd2.append('description', description);
                fd2.append('price', String(nPrice));
                fd2.append('video', videoFile);
                response = await axios.post(`${API_BASE}/api/food`, fd2, { withCredentials: true });
            }

            if (response.status === 201) {
                // NEW: capture created food id (various possible response shapes)
                try {
                  const newId =
                    response.data?.food?._id ||
                    response.data?.foodItem?._id ||
                    response.data?.foodId ||
                    response.data?.id ||
                    response.data?._id;
                  if (newId) {
                    sessionStorage.setItem('recentUploadId', String(newId));
                    sessionStorage.setItem('recentUploadTs', String(Date.now()));
                  }
                } catch {}
                window.toast?.("Reel uploaded", { type: "success" });
                navigate("/");
            } else {
                const msg = response.data?.message || "Upload failed";
                setFileError(msg);
                window.toast?.(msg, { type: "error" });
            }
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || "Upload failed. Check network.";
            setFileError(msg);
            window.toastError?.(err, msg);
        } finally {
            setUploading(false);
        }
    };

    const isDisabled = useMemo(() => !name.trim() || !videoFile || price === '' || Number.isNaN(Number(price)), [ name, videoFile, price ]); // <-- updated

    return (
        <div className="create-food-page fade-page" data-uploading={uploading ? 'true':'false'}>
            <div className="create-food-card">
                <header className="create-food-header">
                    <h1 className="create-food-title">Create Food</h1>
                    <p className="create-food-subtitle">Upload a short video, set a price, give it a name, and add a description.</p> {/* <-- updated */}
                </header>

                <form className="create-food-form" onSubmit={onSubmit}>
                    <div className="field-group">
                        <label htmlFor="foodVideo">Food Video</label>
                        <input
                            id="foodVideo"
                            name="video"                      // <-- add name attribute
                            ref={fileInputRef}
                            className="file-input-hidden"
                            type="file"
                            accept="video/*"
                            onChange={onFileChange}
                        />

                        <div
                            className="file-dropzone"
                            role="button"
                            tabIndex={0}
                            onClick={openFileDialog}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFileDialog(); } }}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                        >
                            <div className="file-dropzone-inner">
                                <svg className="file-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path d="M10.8 3.2a1 1 0 0 1 .4-.08h1.6a1 1 0 0 1 1 1v1.6h1.6a1 1 0 0 1 1 1v1.6h1.6a1 1 0 0 1 1 1v7.2a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6.4a1 1 0 0 1 1-1h1.6V3.2a1 1 0 0 1 1-1h1.6a1 1 0 0 1 .6.2z" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M9 12.75v-1.5c0-.62.67-1 1.2-.68l4.24 2.45c.53.3.53 1.05 0 1.35L10.2 16.82c-.53.31-1.2-.06-1.2-.68v-1.5" fill="currentColor" />
                                </svg>
                                <div className="file-dropzone-text">
                                    <strong>Tap to upload</strong> or drag and drop
                                </div>
                                <div className="file-hint">MP4, WebM, MOV • Up to ~100MB</div>
                            </div>
                        </div>

                        {fileError && <p className="error-text" role="alert">{fileError}</p>}

                        {videoFile && (
                            <div className="file-chip" aria-live="polite">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                    <path d="M9 12.75v-1.5c0-.62.67-1 1.2-.68l4.24 2.45c.53.3.53 1.05 0 1.35L10.2 16.82c-.53.31-1.2-.06-1.2-.68v-1.5" />
                                </svg>
                                <span className="file-chip-name">{videoFile.name}</span>
                                <span className="file-chip-size">{(videoFile.size / 1024 / 1024).toFixed(1)} MB</span>
                                <div className="file-chip-actions">
                                    <button type="button" className="btn-ghost" onClick={openFileDialog}>Change</button>
                                    <button type="button" className="btn-ghost danger" onClick={() => { setVideoFile(null); setFileError(''); }}>Remove</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {videoURL && (
                        <div className="video-preview">
                            <video className="video-preview-el" src={videoURL} controls playsInline preload="metadata" />
                        </div>
                    )}

                    <div className="field-group">
                        <label htmlFor="foodName">Name</label>
                        <input
                            id="foodName"
                            type="text"
                            placeholder="e.g., Spicy Paneer Wrap"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="field-group"> {/* <-- added */}
                        <label htmlFor="foodPrice">Price (INR)</label>
                        <input
                            id="foodPrice"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            placeholder="e.g., 149"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                        />
                    </div>

                    <div className="field-group">
                        <label htmlFor="foodDesc">Description</label>
                        <textarea
                            id="foodDesc"
                            rows={4}
                            placeholder="Write a short description: ingredients, taste, spice level, etc."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="form-actions">
                        <button className="btn-primary" type="submit" disabled={isDisabled || uploading}>
                            {uploading ? 'Uploading...' : 'Save Food'}
                        </button>
                    </div>
                </form>
            </div>

            {uploading && (
              <div className="upload-overlay" role="alert" aria-busy="true" aria-live="assertive">
                <div className="spinner" aria-hidden="true"></div>
                <div>Uploading…</div>
              </div>
            )}
        </div>
    );
};

export default CreateFood;