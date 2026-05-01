import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Camera } from 'lucide-react';
import API from '../api';

function EditPhotos({ user, setUser }) {
  const navigate = useNavigate();
  const [images, setImages] = useState(user.images && user.images.length > 0 ? user.images : (user.image ? [user.image] : []));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    if (images.length + files.length > 6) {
      setError('You can only have up to 6 photos.');
      return;
    }

    setLoading(true);
    setError('');

    const data = new FormData();
    files.forEach(f => data.append('images', f));

    try {
      const res = await API.post(`/api/user/photos/${user._id}`, data);
      setImages(res.data.images);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload photos');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = async (imageUrl) => {
    if (images.length <= 1) {
      setError('You must have at least one photo.');
      return;
    }

    setLoading(true);
    try {
      const res = await API.delete(`/api/user/photos/${user._id}`, { data: { imageUrl } });
      setImages(res.data.images);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete photo');
    } finally {
      setLoading(false);
    }
  };

  const emptySlots = Math.max(0, 6 - images.length);

  return (
    <div className="screen profile-screen">
      <section className="glass-panel profile-panel edit-panel">
        <div className="edit-top">
          <button className="btn-icon" type="button" onClick={() => navigate('/profile')}>
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          <h2>Edit Photos</h2>
        </div>

        <p style={{color: 'var(--text-muted)', marginBottom: '24px'}}>Add up to 6 photos. The first photo will be your main profile picture.</p>
        
        {error && <p className="form-alert" style={{marginBottom: '16px'}}>{error}</p>}

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
              borderRadius: '12px',
              overflow: 'hidden',
              background: 'var(--surface-strong)',
              border: '1px solid var(--line)'
            }}>
              <img src={img} alt={`Profile ${idx}`} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              <button 
                onClick={() => handleDeletePhoto(img)}
                disabled={loading}
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  background: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
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
                  color: '#fff',
                  fontSize: '0.65rem',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontWeight: '800'
                }}>MAIN</span>
              )}
            </div>
          ))}

          {Array.from({ length: emptySlots }).map((_, idx) => (
            <label key={`empty-${idx}`} className="photo-slot-empty" style={{
              aspectRatio: '2/3',
              borderRadius: '12px',
              border: '2px dashed rgba(236, 72, 153, 0.3)',
              background: 'rgba(236, 72, 153, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: 'var(--accent-soft)',
              transition: 'all 0.2s'
            }}>
              <Plus size={32} />
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

        {loading && <p style={{textAlign: 'center', color: 'var(--text-muted)'}}>Processing...</p>}
      </section>
    </div>
  );
}

export default EditPhotos;
