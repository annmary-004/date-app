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
  CheckCircle2
} from 'lucide-react';
import API from '../api';
import { absoluteApiUrl } from '../config';

function profileImageUrl(p) {
  if (p.image) return absoluteApiUrl(p.image);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&size=600&background=ec4899&color=fff`;
}

function getDistanceBetween(user1Id, user2Id) {
  const s1 = user1Id?.toString() || '';
  const s2 = user2Id?.toString() || '';
  let hash = 0;
  for (let i = 0; i < s1.length; i++) hash = (hash << 5) - hash + s1.charCodeAt(i);
  for (let i = 0; i < s2.length; i++) hash = (hash << 5) - hash + s2.charCodeAt(i);
  return Math.abs(hash % 27) + 2;
}

function Swipe({ user }) {
  const navigate = useNavigate();

  // Enforce 4 photo limit
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
          setTimeout(() => setShowMatch(false), 3000);
        }
      } catch (err) {
        console.error('Like failed', err);
      }
    }

    setCurrentIndex((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!hasMinPhotos) {
    return (
      <div className="state-wrap" style={{ minHeight: '65vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="glass-panel state-card" style={{ maxWidth: '440px', padding: '36px 30px', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(225, 29, 72, 0.08)', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={30} />
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>4 Photos Required</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.6', margin: 0 }}>
            To view other profiles, swipe, and match, you must upload <strong>at least 4 verified photos of your face</strong>. This keeps Heartly safe, real, and fake-free!
          </p>
          <button 
            onClick={() => navigate('/profile/photos')}
            style={{ 
              width: '100%', 
              padding: '14px', 
              borderRadius: '14px', 
              border: 'none', 
              background: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)', 
              color: '#ffffff', 
              fontWeight: '700', 
              fontSize: '0.95rem',
              cursor: 'pointer', 
              boxShadow: '0 8px 20px rgba(225,29,72,0.2)',
              marginTop: '8px'
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
      <div className="state-wrap">
        <div className="glass-panel state-card">
          <div className="state-kicker">
            <Sparkles size={26} />
          </div>
          <div className="spinner" />
          <h3>Loading people</h3>
          <p>Fetching full profiles for you.</p>
        </div>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="state-wrap">
        <div className="glass-panel state-card">
          <div className="state-kicker">
            <Heart size={26} />
          </div>
          <h3>You are all caught up</h3>
          <p>Check back later for new profiles.</p>
        </div>
      </div>
    );
  }

  const p = profiles[currentIndex];
  const userImages = p.images && p.images.length > 0 ? p.images : (p.image ? [p.image] : []);
  const mainImgSrc = userImages.length > 0 ? absoluteApiUrl(userImages[0]) : profileImageUrl(p);
  const interests = Array.isArray(p.interests) ? p.interests : [];
  const ageStr = p.age != null ? `${p.age}` : '';
  const distKm = getDistanceBetween(user._id, p._id);

  return (
    <div style={{ maxWidth: '540px', margin: '0 auto', padding: '16px 12px 120px' }}>
      {showMatch && (
        <div className="match-toast">
          It is a match with <strong>{matchName}</strong>
        </div>
      )}

      {/* BUMBLE SCROLLABLE PROFILE FEED */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── CARD 1: MAIN PHOTO + NAME & AGE ── */}
        <div style={{
          position: 'relative',
          borderRadius: '28px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
          height: '560px',
          background: 'var(--surface-strong)'
        }}>
          <img
            src={mainImgSrc}
            alt={p.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />

          {/* Gradient Overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 45%, transparent 75%)',
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            padding: '28px 24px', color: '#fff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.02em' }}>
                {p.name}{ageStr ? `, ${ageStr}` : ''}
              </h1>
              <CheckCircle2 size={24} color="#f43f5e" fill="#fff" />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
              {p.gender && (
                <span style={{
                  padding: '6px 14px', borderRadius: '20px',
                  background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(10px)',
                  fontSize: '0.82rem', fontWeight: '700', color: '#fff'
                }}>
                  {p.gender}
                </span>
              )}
              {p.sexualOrientation && (
                <span style={{
                  padding: '6px 14px', borderRadius: '20px',
                  background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(10px)',
                  fontSize: '0.82rem', fontWeight: '700', color: '#fff'
                }}>
                  {p.sexualOrientation}
                </span>
              )}
              {p.showMe && (
                <span style={{
                  padding: '6px 14px', borderRadius: '20px',
                  background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(10px)',
                  fontSize: '0.82rem', fontWeight: '700', color: '#fff',
                  display: 'flex', alignItems: 'center', gap: '5px'
                }}>
                  <Users size={14} /> Wants to meet {p.showMe}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── ABOUT ME / BIO BLOCK ── */}
        {p.bio && (
          <div style={{
            background: 'var(--surface)',
            borderRadius: '24px',
            padding: '24px',
            border: '1px solid var(--line)',
            boxShadow: 'var(--shadow)'
          }}>
            <h4 style={{
              margin: '0 0 12px', fontSize: '0.8rem', fontWeight: '800',
              textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)'
            }}>
              About Me
            </h4>
            <p style={{ margin: 0, fontSize: '1.05rem', lineHeight: '1.6', color: 'var(--text-main)', fontWeight: '500' }}>
              {p.bio}
            </p>
          </div>
        )}

        {/* ── PHOTO 2 CARD ── */}
        {userImages[1] && (
          <div style={{
            borderRadius: '28px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow)',
            height: '460px',
            background: 'var(--surface-strong)'
          }}>
            <img
              src={absoluteApiUrl(userImages[1])}
              alt={`${p.name} 2`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* ── MY BASICS / LIFESTYLE BLOCK ── */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: '24px',
          padding: '24px',
          border: '1px solid var(--line)',
          boxShadow: 'var(--shadow)'
        }}>
          <h4 style={{
            margin: '0 0 16px', fontSize: '0.8rem', fontWeight: '800',
            textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)'
          }}>
            My Basics
          </h4>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {p.occupation && (
              <span className="bumble-chip">
                <Briefcase size={15} color="#f43f5e" />
                <span>{p.occupation}</span>
              </span>
            )}
            {p.education && (
              <span className="bumble-chip">
                <GraduationCap size={15} color="#f43f5e" />
                <span>{p.education}</span>
              </span>
            )}
            {p.height && (
              <span className="bumble-chip">
                <Ruler size={15} color="#f43f5e" />
                <span>{p.height}</span>
              </span>
            )}
            {p.lookingFor && (
              <span className="bumble-chip">
                <Target size={15} color="#f43f5e" />
                <span>{p.lookingFor}</span>
              </span>
            )}
            {p.exercise && (
              <span className="bumble-chip">
                <Dumbbell size={15} color="#f43f5e" />
                <span>{p.exercise}</span>
              </span>
            )}
            {p.drinking && (
              <span className="bumble-chip">
                <Wine size={15} color="#f43f5e" />
                <span>{p.drinking}</span>
              </span>
            )}
            {p.smoking && (
              <span className="bumble-chip">
                <Cigarette size={15} color="#f43f5e" />
                <span>{p.smoking}</span>
              </span>
            )}
            {p.kids && (
              <span className="bumble-chip">
                <Baby size={15} color="#f43f5e" />
                <span>{p.kids}</span>
              </span>
            )}
          </div>
        </div>

        {/* ── PHOTO 3 CARD ── */}
        {userImages[2] && (
          <div style={{
            borderRadius: '28px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow)',
            height: '460px',
            background: 'var(--surface-strong)'
          }}>
            <img
              src={absoluteApiUrl(userImages[2])}
              alt={`${p.name} 3`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* ── INTERESTS BLOCK ── */}
        {interests.length > 0 && (
          <div style={{
            background: 'var(--surface)',
            borderRadius: '24px',
            padding: '24px',
            border: '1px solid var(--line)',
            boxShadow: 'var(--shadow)'
          }}>
            <h4 style={{
              margin: '0 0 16px', fontSize: '0.8rem', fontWeight: '800',
              textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)'
            }}>
              Interests
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {interests.map((tag) => (
                <span key={tag} style={{
                  padding: '8px 16px', borderRadius: '20px',
                  background: 'rgba(244, 63, 94, 0.08)',
                  color: '#f43f5e', fontSize: '0.88rem', fontWeight: '700'
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── EXTRA PHOTOS (Photo 4, 5, 6...) ── */}
        {userImages.slice(3).map((img, idx) => (
          <div key={idx} style={{
            borderRadius: '28px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow)',
            height: '460px',
            background: 'var(--surface-strong)'
          }}>
            <img
              src={absoluteApiUrl(img)}
              alt={`${p.name} ${idx + 4}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ))}

        {/* ── LOCATION CARD AT THE VERY BOTTOM (Bumble Style Location Detail) ── */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: '24px',
          padding: '24px',
          border: '1px solid var(--line)',
          boxShadow: 'var(--shadow)'
        }}>
          <h4 style={{
            margin: '0 0 14px', fontSize: '0.8rem', fontWeight: '800',
            textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)'
          }}>
            Location
          </h4>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '16px',
              background: 'rgba(244, 63, 94, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <MapPin size={24} color="#f43f5e" />
            </div>

            <div>
              <div style={{ fontWeight: '900', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                {p.city || 'Kochi'}
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '2px' }}>
                {distKm} km away from you
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── STICKY FLOATING ACTION BAR AT THE BOTTOM ── */}
      <div style={{
        position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)', maxWidth: '440px', zIndex: 90,
        display: 'flex', gap: '16px'
      }}>
        <button
          className="btn-icon dislike"
          onClick={() => handleAction('dislike')}
          type="button"
          title="Pass"
          style={{
            flex: 1, padding: '16px', borderRadius: '24px',
            border: 'none', background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
            color: '#fff', fontSize: '1.05rem', fontWeight: '800',
            cursor: 'pointer', boxShadow: '0 12px 32px rgba(244,63,94,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
          }}
        >
          <X size={24} strokeWidth={2.5} />
          <span>Pass</span>
        </button>

        <button
          className="btn-icon like"
          onClick={() => handleAction('like')}
          type="button"
          title="Like"
          style={{
            flex: 1, padding: '16px', borderRadius: '24px',
            border: 'none', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff', fontSize: '1.05rem', fontWeight: '800',
            cursor: 'pointer', boxShadow: '0 12px 32px rgba(16,185,129,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
          }}
        >
          <Heart size={24} strokeWidth={2.5} />
          <span>Like</span>
        </button>
      </div>
    </div>
  );
}

export default Swipe;
