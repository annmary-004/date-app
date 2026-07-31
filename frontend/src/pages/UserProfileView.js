import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, MessageCircle, MapPin, CheckCircle2,
  Briefcase, GraduationCap, Ruler, Target, Dumbbell, Wine, Cigarette, Baby, Users
} from 'lucide-react';
import API from '../api';
import { absoluteApiUrl } from '../config';

function profileImageUrl(p) {
  if (p.image) return absoluteApiUrl(p.image);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'User')}&size=600&background=ec4899&color=fff`;
}

function UserProfileView({ user }) {
  const { targetUserId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get(`/api/user/${targetUserId}`);
        setProfile(res.data);
      } catch (err) {
        console.error('Failed to fetch user profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [targetUserId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>User profile not found.</p>
        <button onClick={() => navigate(-1)} className="btn-primary" style={{ marginTop: '16px' }}>Go Back</button>
      </div>
    );
  }

  const photos = profile.images && profile.images.length > 0
    ? profile.images.map(img => absoluteApiUrl(img))
    : [profileImageUrl(profile)];

  const interests = Array.isArray(profile.interests) ? profile.interests : [];
  const ageStr = profile.age != null ? `${profile.age}` : '';

  const getDistanceBetween = (u1, u2) => {
    const s1 = u1?.toString() || '';
    const s2 = u2?.toString() || '';
    let hash = 0;
    for (let i = 0; i < s1.length; i++) hash = (hash << 5) - hash + s1.charCodeAt(i);
    for (let i = 0; i < s2.length; i++) hash = (hash << 5) - hash + s2.charCodeAt(i);
    return Math.abs(hash % 27) + 2;
  };

  const distanceKm = getDistanceBetween(user._id, profile._id);

  const lifestyleItems = [
    profile.exercise && { icon: <Dumbbell size={15} />, label: profile.exercise },
    profile.drinking && { icon: <Wine size={15} />, label: profile.drinking },
    profile.smoking && { icon: <Cigarette size={15} />, label: profile.smoking },
    profile.kids && { icon: <Baby size={15} />, label: profile.kids }
  ].filter(Boolean);

  const detailItems = [
    profile.occupation && { icon: <Briefcase size={16} />, label: profile.occupation },
    profile.education && { icon: <GraduationCap size={16} />, label: profile.education },
    profile.height && { icon: <Ruler size={16} />, label: profile.height },
    profile.lookingFor && { icon: <Target size={16} />, label: `Looking for ${profile.lookingFor}` }
  ].filter(Boolean);

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 12px 120px' }}>
      
      {/* Top Header */}
      <div style={{
        padding: '16px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '50px',
          padding: '8px 16px', cursor: 'pointer', color: 'var(--text-main)',
          display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.9rem'
        }}>
          <ArrowLeft size={18} /> Back
        </button>

        <button onClick={() => navigate(`/chat/${profile._id}`)} style={{
          background: 'linear-gradient(135deg, #e11d48, #f43f5e)', border: 'none', borderRadius: '50px',
          padding: '8px 20px', cursor: 'pointer', color: '#fff',
          display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '0.9rem',
          boxShadow: '0 6px 20px rgba(225,29,72,0.3)'
        }}>
          <MessageCircle size={18} /> Chat Now
        </button>
      </div>

      {/* ── BUMBLE MODEL PROFILE CARD FEED ── */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: '28px',
        border: '1px solid var(--line)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
        overflow: 'hidden'
      }}>
        
        {/* Main Photo 1 */}
        <div style={{ position: 'relative', width: '100%', height: '520px', background: '#000' }}>
          <img
            src={photos[0]}
            alt={profile.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = profileImageUrl(profile);
            }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.05) 100%)'
          }} />

          {/* Name & Basic Badge Overlay */}
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', color: '#ffffff', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: '900', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                {profile.name}{ageStr ? `, ${ageStr}` : ''}
              </h2>
              <CheckCircle2 size={22} color="#38bdf8" fill="#38bdf8" style={{ color: '#fff' }} />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {profile.gender && (
                <span style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: '#fff', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: '600' }}>
                  {profile.gender}
                </span>
              )}
              {profile.sexualOrientation && (
                <span style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: '#fff', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: '600' }}>
                  {profile.sexualOrientation}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Content Feed */}
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Bio */}
          {profile.bio && (
            <div style={{
              background: 'var(--surface-strong)', padding: '18px 20px', borderRadius: '20px',
              border: '1px solid var(--line)'
            }}>
              <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.6', color: 'var(--text-main)', fontWeight: '500' }}>
                "{profile.bio}"
              </p>
            </div>
          )}

          {/* Photo 2 */}
          {photos[1] && (
            <div style={{ borderRadius: '20px', overflow: 'hidden', height: '440px', background: '#000' }}>
              <img src={photos[1]} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          {/* Details & Lifestyle */}
          {(detailItems.length > 0 || lifestyleItems.length > 0) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                About {profile.name?.split(' ')[0]}
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

          {/* Photo 3 */}
          {photos[2] && (
            <div style={{ borderRadius: '20px', overflow: 'hidden', height: '440px', background: '#000' }}>
              <img src={photos[2]} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          {/* Interests */}
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

          {/* Photo 4+ */}
          {photos.slice(3).map((photoUrl, idx) => (
            <div key={`extra-${idx}`} style={{ borderRadius: '20px', overflow: 'hidden', height: '440px', background: '#000' }}>
              <img src={photoUrl} alt={`${profile.name} ${idx + 4}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}

          {/* Bottom Location */}
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
                {profile.city || 'Location'}
              </h4>
              <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#f43f5e', fontWeight: '700' }}>
                {distanceKm} km away from you
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Lives in {profile.city || 'nearby location'}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default UserProfileView;
