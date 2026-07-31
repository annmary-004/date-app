import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Baby,
  Briefcase,
  Cigarette,
  Dumbbell,
  GraduationCap,
  Heart,
  MapPin,
  MessageCircle,
  Ruler,
  Sparkles,
  Target,
  Users,
  Wine,
  CheckCircle2,
  Crown
} from 'lucide-react';
import API from '../api';
import { absoluteApiUrl } from '../config';

function MatchProfile({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get(`/api/user/${id}`);
        setProfile(res.data);
      } catch (err) {
        console.error(err);
        setError('Unable to load user profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ maxWidth: '500px', margin: '40px auto', padding: '24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>{error || 'User profile not found.'}</p>
        <button onClick={() => navigate(-1)} style={{
          marginTop: '16px', padding: '10px 20px', borderRadius: '12px', border: 'none',
          background: 'var(--gradient)', color: '#fff', fontWeight: '700', cursor: 'pointer'
        }}>Go Back</button>
      </div>
    );
  }

  const p = profile;
  const photos = p.images && p.images.length > 0
    ? p.images.map(img => absoluteApiUrl(img))
    : (p.image ? [absoluteApiUrl(p.image)] : [`https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&size=600&background=f43f5e&color=fff`]);

  const interests = Array.isArray(p.interests) ? p.interests : [];
  const ageStr = p.age != null ? `${p.age}` : '';

  const getDistanceBetween = (user1Id, user2Id) => {
    const s1 = user1Id?.toString() || '';
    const s2 = user2Id?.toString() || '';
    let hash = 0;
    for (let i = 0; i < s1.length; i++) hash = (hash << 5) - hash + s1.charCodeAt(i);
    for (let i = 0; i < s2.length; i++) hash = (hash << 5) - hash + s2.charCodeAt(i);
    return Math.abs(hash % 27) + 2;
  };

  const distanceKm = getDistanceBetween(user?._id, p._id);

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
    <div style={{ maxWidth: '620px', margin: '0 auto', padding: '16px 12px 140px' }}>
      
      {/* Top Floating Back Button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          position: 'fixed', top: '20px', left: '20px', zIndex: 100,
          width: '42px', height: '42px', borderRadius: '50%', border: 'none',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)',
          color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
        }}
      >
        <ArrowLeft size={22} />
      </button>

      {/* ── BUMBLE MODEL PROFILE CARD CONTAINER ── */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: '28px',
        border: '1px solid var(--line)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
        overflow: 'hidden',
        position: 'relative'
      }}>

        {/* PHOTO 1 — Main Hero Photo */}
        <div style={{ position: 'relative', width: '100%', height: '520px', background: '#000' }}>
          <img
            src={photos[0]}
            alt={p.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {/* Overlay Gradient */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.05) 100%)'
          }} />

          {/* Gender Badge */}
          <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
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

          {/* Name & Age Overlay */}
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

        {/* ── PROFILE DETAILS CONTENT ── */}
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

          {/* PHOTO 2 */}
          {photos[1] && (
            <div style={{ borderRadius: '20px', overflow: 'hidden', height: '440px', background: '#000' }}>
              <img src={photos[1]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          {/* BASIC INFO / WORK & LIFESTYLE */}
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

          {/* PHOTO 3 */}
          {photos[2] && (
            <div style={{ borderRadius: '20px', overflow: 'hidden', height: '440px', background: '#000' }}>
              <img src={photos[2]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          {/* INTERESTS */}
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

          {/* PHOTO 4+ */}
          {photos.slice(3).map((photoUrl, idx) => (
            <div key={`extra-photo-${idx}`} style={{ borderRadius: '20px', overflow: 'hidden', height: '440px', background: '#000' }}>
              <img src={photoUrl} alt={`${p.name} ${idx + 4}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}

          {/* BUMBLE MODEL LOCATION CARD */}
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

      {/* ── STICKY CHAT BUTTON AT BOTTOM ── */}
      <div style={{
        position: 'fixed', bottom: '85px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 99, width: '90%', maxWidth: '400px'
      }}>
        <button
          onClick={() => navigate(`/chat/${p._id}`)}
          style={{
            width: '100%', padding: '16px', borderRadius: '50px', border: 'none',
            background: 'linear-gradient(135deg, #e11d48, #f43f5e)',
            color: '#ffffff', fontWeight: '900', fontSize: '1.05rem',
            cursor: 'pointer', boxShadow: '0 12px 32px rgba(225,29,72,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
          }}
        >
          <MessageCircle size={22} fill="#fff" />
          <span>Chat with {p.name?.split(' ')[0]}</span>
        </button>
      </div>

    </div>
  );
}

export default MatchProfile;
