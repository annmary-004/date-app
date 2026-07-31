import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, CheckCircle2, ArrowRight } from 'lucide-react';
import API from '../api';
import { absoluteApiUrl } from '../config';

function EditPhotos({ user, setUser }) {
  const navigate = useNavigate();
  const [images, setImages] = useState(user.images && user.images.length > 0 ? user.images : (user.image ? [user.image] : []));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setLoading(true);
    setError('');

    const data = new FormData();
    files.forEach(f => data.append('images', f));

    try {
      const res = await API.post(`/api/user/photos/${user._id}`, data);
      const updatedUser = res.data;
      const newImgs = updatedUser.images && updatedUser.images.length > 0 ? updatedUser.images : (updatedUser.image ? [updatedUser.image] : []);
      setImages(newImgs);
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload photos. Please try uploading clear face photos.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = async (imageUrl) => {
    if (images.length <= 1) {
      setError('You must have at least 1 photo.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await API.delete(`/api/user/photos/${user._id}`, { data: { imageUrl } });
      const updatedUser = res.data;
      const newImgs = updatedUser.images && updatedUser.images.length > 0 ? updatedUser.images : (updatedUser.image ? [updatedUser.image] : []);
      setImages(newImgs);
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete photo');
    } finally {
      setLoading(false);
    }
  };

  const emptySlots = 1;
  const hasMinPhotos = images.length >= 4;

  return (
    <div className="screen profile-screen">
      <section className="glass-panel profile-panel edit-panel" style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div className="edit-top">
          <button className="btn-icon" type="button" onClick={() => {
            if (images.length < 4) {
              setError('You must add at least 4 photos before going back.');
            } else {
              navigate('/profile');
            }
          }}>
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          <h2>Edit Photos</h2>
        </div>

        <p style={{ color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5' }}>
          Add as many photos as you want. <strong>At least 4 verified photos showing your face clearly are required</strong> to use Heartly. The first photo will be your main profile picture.
        </p>

        {error && <p className="form-alert" style={{ marginBottom: '16px' }}>{error}</p>}

        <div className="photos-grid" style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '12px',
          marginBottom: '24px'
        }}>
          {images.map((img, idx) => (
            <div key={idx} className="photo-slot" style={{
              position: 'relative', 
              aspectRatio: '2/3', 
              borderRadius: '14px',
              overflow: 'hidden',
              background: 'var(--surface-strong)',
              border: '1px solid var(--line)'
            }}>
              <img 
                src={absoluteApiUrl(img)} 
                alt={`Profile ${idx + 1}`} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Photo')}&size=300&background=f43f5e&color=fff`;
                }}
              />
              <button 
                type="button"
                onClick={() => handleDeletePhoto(img)}
                disabled={loading}
                title="Delete photo"
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  background: '#ffffff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  cursor: 'pointer',
                  color: '#e11d48'
                }}
              >
                <X size={16} strokeWidth={3} />
              </button>
              {idx === 0 && (
                <span style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  background: 'var(--gradient)',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontWeight: '800',
                  letterSpacing: '0.05em'
                }}>MAIN</span>
              )}
            </div>
          ))}

          {Array.from({ length: emptySlots }).map((_, idx) => (
            <label key={`empty-${idx}`} className="photo-slot-empty" style={{
              aspectRatio: '2/3',
              borderRadius: '14px',
              border: '2px dashed rgba(236, 72, 153, 0.35)',
              background: 'rgba(236, 72, 153, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: 'var(--accent-soft)',
              transition: 'all 0.2s ease'
            }}>
              <Plus size={30} />
              <span style={{ fontSize: '0.72rem', fontWeight: '700' }}>Add Photo</span>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="sr-only" 
                disabled={loading}
                onChange={handleFileUpload} 
              />
            </label>
          ))}
        </div>

        {loading && <p style={{ textAlign: 'center', color: 'var(--accent)', fontWeight: '600', marginBottom: '16px' }}>Uploading and verifying photos...</p>}

        {hasMinPhotos ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              padding: '14px 16px',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              borderRadius: '14px',
              color: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: '700',
              fontSize: '0.92rem'
            }}>
              <CheckCircle2 size={18} />
              <span>4+ Photos Verified! You can now swipe & chat.</span>
            </div>

            <button 
              type="button" 
              onClick={() => navigate('/')} 
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)',
                color: '#ffffff',
                fontWeight: '800',
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 8px 22px rgba(225, 29, 72, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'transform 0.2s ease'
              }}
            >
              <span>Start Swiping Now</span>
              <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <div style={{
            padding: '14px 16px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '14px',
            color: '#f43f5e',
            textAlign: 'center',
            fontSize: '0.88rem',
            fontWeight: '600'
          }}>
            Please upload at least {4 - images.length} more photo(s) showing your face to unlock Discover and Chat features.
          </div>
        )}
      </section>
    </div>
  );
}

export default EditPhotos;
