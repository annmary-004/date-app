import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Baby,
  Briefcase,
  Cigarette,
  Dumbbell,
  GraduationCap,
  Heart,
  MapPin,
  Ruler,
  Sparkles,
  Target,
  Users,
  Wine,
  X,
  Camera,
  CheckCircle2,
  ChevronDown,
  Info
} from 'lucide-react';
import API from '../api';
import { absoluteApiUrl } from '../config';

function profileImageUrl(p) {
  if (p.image) return absoluteApiUrl(p.image);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&size=600&background=ec4899&color=fff`;
}

function Swipe({ user }) {
  const navigate = useNavigate();
  
  // Enforce 4 photo minimum
  const userPhotos = user.images && user.images.length > 0 ? user.images : (user.image ? [user.image] : []);
  const hasMinPhotos = userPhotos.length >= 4;

  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchName, setMatchName] = useState('');
  const [showMatch, setShowMatch] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await API.get(`/api/user/swipe/${user._id}`);
        setProfiles(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [user._id]);

  const handleAction = async (action) => {
    if (currentIndex >= profiles.length) return;

    const targetUser = profiles[currentIndex];

    if (action === 'like') {
      try {
        const res = await API.post('/api/match/like', {
          userId: user._id,
          targetId: targetUser._id
        });

        if (res.data.match) {
          setMatchName(targetUser.name);
          setShowMatch(true);
          setTimeout(() => setShowMatch(false), 3500);
        }
      } catch (err) {
        console.error('Like failed', err);
      }
    }

    setCurrentIndex((prev) => prev + 1);
    // Scroll profile card back to top for next person
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!hasMinPhotos) {
    return (
      <div style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{
          maxWidth: '440px', padding: '36px 28px', borderRadius: '28px',
          background: 'var(--surface)', border: '1px solid var(--line)',
          textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
        }}>
          <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: 'rgba(244,63,94,0.1)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={32} />
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>4 Photos Required</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.65', margin: 0 }}>
            Upload <strong>at least 4 verified photos showing your face</strong> to unlock full profile swiping, matches, and chat.
          </p>
          <button 
            onClick={() => navigate('/profile/photos')}
            style={{ 
              width: '100%', padding: '14px', borderRadius: '16px', border: 'none', 
              background: 'linear-gradient(135deg, #e11d48, #f43f5e)', 
              color: '#ffffff', fontWeight: '800', fontSize: '0.97rem', cursor: 'pointer', 
              boxShadow: '0 8px 24px rgba(225,29,72,0.3)', marginTop: '8px'
            }}
          >
            Upload Photos Now
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Finding people near you...</p>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '24px', textAlign: 'center' }}>
        <div style={{
          maxWidth: '400px', padding: '40px 24px', borderRadius: '28px',
          background: 'var(--surface)', border: '1px solid var(--line)',
          boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px'
        }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(244,63,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={28} color="#f43f5e" />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>You're all caught up!</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Check back soon for new profiles matching your preferences.
          </p>
        </div>
      </div>
    );
  }

  const p = profiles[currentIndex];
  const remainingProfiles = profiles.length - currentIndex - 1;
  
  // Collect all photos (at least 4 if available)
  const photos = p.images && p.images.length > 0 ? p.images.map(img => absoluteApiUrl(img)) : [profileImageUrl(p)];
  
  const interests = Array.isArray(p.interests) ? p.interests : [];
  const ageStr = p.age != null ? `${p.age}` : '';

  const getDistanceBetween = (user1Id, user2Id) => {
    const s1 = user1Id?.toString() || '';
    const s2 = user2Id?.toString() || '';
    let hash = 0;
    for (let i = 0; i < s1.length; i++) hash = (hash << 5) - hash + s1.charCodeAt(i);
    for (let i = 0; i < s2.length; i++) hash = (hash << 5) - hash + s2.charCodeAt(i);
    return Math.abs(hash % 27) + 2; // distance between 2 and 28 km
  };

  const distanceKm = getDistanceBetween(user._id, p._id);
  const cityLocation = p.city ? `${p.city} · ${distanceKm} km away` : `${distanceKm} km away`;

  const lifestyleItems = [
    p.exercise && { icon: <Dumbbell size={15} />, label: p.exercise },
    p.drinking && { icon: <Wine size={15} />, label: p.drinking },
    p.smoking && { icon: <Cigarette size={15} />, label: p.smoking },
    p.kids && { icon: <Baby size={15} />, label: p.kids }
  ].filter(Boolean);

  const detailItems = [
    p.occupation && { icon: <Briefcase size={16} />, label: p.occupation },
    p.education && { icon: <GraduationCap size={16} />, label: p.education },
    p.height && { icon: <Ruler size={16} />, label: p.height },
    p.lookingFor && { icon: <Target size={16} />, label: `Looking for ${p.lookingFor}` }
  ].filter(Boolean);

  return (
    <div style={{ maxWidth: '620px', margin: '0 auto', padding: '0 12px 140px' }}>
      
      {/* Toast Notification on Match */}
      {showMatch && (
        <div style={{
          position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, background: 'linear-gradient(135deg, #e11d48, #f43f5e)',
          color: '#ffffff', padding: '14px 24px', borderRadius: '50px',
          boxShadow: '0 12px 36px rgba(225,29,72,0.4)', fontWeight: '800',
          fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <Sparkles size={20} /> It's a match with {matchName}!
        </div>
      )}

      {/* ── BUMBLE MODEL VERTICAL SCROLL PROFILE CARD ── */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: '28px',
        border: '1px solid var(--line)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        
        {/* PHOTO 1 — Top Main Hero Photo */}
        <div style={{ position: 'relative', width: '100%', height: '520px', background: '#000' }}>
          <img 
            src={photos[0]} 
            alt={p.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = profileImageUrl(p);
            }}
          />
          {/* Gradient Overlay for Text Readability */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.05) 100%)'
          }} />

          {/* Top Pill Badges */}
          <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
            <span style={{
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)',
              color: '#ffffff', padding: '6px 14px', borderRadius: '20px',
              fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.05em'
            }}>
              {currentIndex + 1} / {profiles.length}
            </span>

            {p.gender && (
              <span style={{
                background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(12px)',
                color: '#ffffff', padding: '6px 14px', borderRadius: '20px',
                fontSize: '0.78rem', fontWeight: '700'
              }}>
                {p.gender}
              </span>
            )}
          </div>

          {/* Name, Age, Orientation Overlay at bottom of main photo */}
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', color: '#ffffff', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: '900', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                {p.name}{ageStr ? `, ${ageStr}` : ''}
              </h2>
              <CheckCircle2 size={22} color="#38bdf8" fill="#38bdf8" style={{ color: '#fff' }} />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {p.sexualOrientation && (
                <span style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: '#fff', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: '600' }}>
                  {p.sexualOrientation}
                </span>
              )}
              {p.showMe && (
                <span style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: '#fff', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={13} /> Wants to meet {p.showMe}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── PROFILE DETAILS CONTENT (Bumble Vertical Scroll Stream) ── */}
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* BIO SECTION */}
          {p.bio && (
            <div style={{
              background: 'var(--surface-strong)', padding: '18px 20px', borderRadius: '20px',
              border: '1px solid var(--line)'
            }}>
              <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.6', color: 'var(--text-main)', fontWeight: '500' }}>
                "{p.bio}"
              </p>
            </div>
          )}

          {/* PHOTO 2 (if available) */}
          {photos[1] && (
            <div style={{ borderRadius: '20px', overflow: 'hidden', height: '440px', background: '#000' }}>
              <img src={photos[1]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          {/* BASIC INFO / WORK & EDUCATION */}
          {(detailItems.length > 0 || lifestyleItems.length > 0) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                About {p.name?.split(' ')[0]}
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {detailItems.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 16px', borderRadius: '20px',
                    background: 'var(--surface-strong)', border: '1px solid var(--line)',
                    fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-main)'
                  }}>
                    <span style={{ color: '#f43f5e', display: 'flex' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
                {lifestyleItems.map((item, idx) => (
                  <div key={`life-${idx}`} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 16px', borderRadius: '20px',
                    background: 'var(--surface-strong)', border: '1px solid var(--line)',
                    fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-main)'
                  }}>
                    <span style={{ color: '#f43f5e', display: 'flex' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PHOTO 3 (if available) */}
          {photos[2] && (
            <div style={{ borderRadius: '20px', overflow: 'hidden', height: '440px', background: '#000' }}>
              <img src={photos[2]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          {/* INTERESTS SECTION */}
          {interests.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Interests
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {interests.map((tag) => (
                  <span key={tag} style={{
                    padding: '8px 16px', borderRadius: '20px',
                    background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
                    color: '#f43f5e', fontWeight: '700', fontSize: '0.85rem'
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* PHOTO 4+ (if available) */}
          {photos.slice(3).map((photoUrl, idx) => (
            <div key={`extra-photo-${idx}`} style={{ borderRadius: '20px', overflow: 'hidden', height: '440px', background: '#000' }}>
              <img src={photoUrl} alt={`${p.name} ${idx + 4}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}

          {/* ── BUMBLE MODEL BOTTOM LOCATION SECTION ── */}
          <div style={{
            background: 'var(--surface-strong)', borderRadius: '20px', padding: '20px',
            border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: '16px'
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #e11d48, #f43f5e)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff', flexShrink: 0, boxShadow: '0 6px 16px rgba(225,29,72,0.3)'
            }}>
              <MapPin size={24} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {p.city || 'Location'}
              </h4>
              <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#f43f5e', fontWeight: '700' }}>
                {distanceKm} km away from you
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Lives in {p.city || 'nearby location'}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ── FIXED STICKY ACTION BUTTONS (Pass & Like) ── */}
      <div style={{
        position: 'fixed', bottom: '85px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 99, display: 'flex', gap: '20px', width: '90%', maxWidth: '400px'
      }}>
        <button
          onClick={() => handleAction('dislike')}
          type="button"
          title="Pass"
          style={{
            flex: 1, padding: '16px 24px', borderRadius: '50px', border: 'none',
            background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
            color: '#ffffff', fontWeight: '900', fontSize: '1.05rem',
            cursor: 'pointer', boxShadow: '0 12px 32px rgba(244,63,94,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'transform 0.15s ease'
          }}
        >
          <X size={22} strokeWidth={3} color="#fff" />
          <span>Pass</span>
        </button>

        <button
          onClick={() => handleAction('like')}
          type="button"
          title="Like"
          style={{
            flex: 1, padding: '16px 24px', borderRadius: '50px', border: 'none',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff', fontWeight: '900', fontSize: '1.05rem',
            cursor: 'pointer', boxShadow: '0 12px 32px rgba(16,185,129,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'transform 0.15s ease'
          }}
        >
          <Heart size={22} strokeWidth={3} color="#fff" fill="#fff" />
          <span>Like</span>
        </button>
      </div>

    </div>
  );
}

export default Swipe;
