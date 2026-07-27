import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Camera, Crown, Clock, Sparkles, ChevronRight } from 'lucide-react';
import API from '../api';
import { absoluteApiUrl } from '../config';

function getDistanceBetween(id1, id2) {
  const s1 = id1?.toString() || '';
  const s2 = id2?.toString() || '';
  let hash = 0;
  for (let i = 0; i < s1.length; i++) hash = (hash << 5) - hash + s1.charCodeAt(i);
  for (let i = 0; i < s2.length; i++) hash = (hash << 5) - hash + s2.charCodeAt(i);
  return Math.abs(hash % 27) + 2;
}

function getTimeLeft(matchedAt) {
  if (!matchedAt) return null;
  const elapsed = Date.now() - new Date(matchedAt).getTime();
  const total = 24 * 60 * 60 * 1000;
  const remaining = total - elapsed;
  if (remaining <= 0) return null;
  const hrs = Math.floor(remaining / (60 * 60 * 1000));
  const mins = Math.floor((remaining % (60 * 60 * 1000)) / 60000);
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
}

function Matches({ user }) {
  const navigate = useNavigate();

  const userPhotos = user.images && user.images.length > 0 ? user.images : (user.image ? [user.image] : []);
  const hasMinPhotos = userPhotos.length >= 4;

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        if (!hasMinPhotos) { setLoading(false); return; }
        const res = await API.get(`/api/user/matches/${user._id}`);
        setMatches(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [user._id, hasMinPhotos]);

  // Update timer every minute
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!hasMinPhotos) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{
          maxWidth: '420px', padding: '40px 32px', borderRadius: '28px',
          background: 'var(--surface)', border: '1px solid var(--line)',
          textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)'
        }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '22px', background: 'rgba(244,63,94,0.1)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={32} />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>4 Photos Required</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.93rem', lineHeight: '1.65', margin: 0 }}>
            Upload <strong>at least 4 verified face photos</strong> to unlock matches and chat.
          </p>
          <button onClick={() => navigate('/profile/photos')} style={{
            width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
            background: 'linear-gradient(135deg, #e11d48, #f43f5e)',
            color: '#fff', fontWeight: '800', fontSize: '0.97rem', cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(225,29,72,0.25)'
          }}>
            Upload Photos
          </button>
        </div>
      </div>
    );
  }

  const getAvatar = (m) => {
    if (m.image) return absoluteApiUrl(m.image);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&size=300&background=f43f5e&color=fff`;
  };

  const openChat = (id) => navigate(`/chat/${id}`);

  // Separate: new matches (no messages yet — simulated by matchedAt present) vs conversations
  const newMatches = matches.filter(m => !m.isExpired);

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 0 100px' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 8px' }}>
        <h2 style={{ fontSize: '1.7rem', fontWeight: '900', margin: 0 }}>
          Matches
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0' }}>
          {matches.length} {matches.length === 1 ? 'connection' : 'connections'} total
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', flexDirection: 'column', gap: '16px' }}>
          <div className="spinner" />
          <p style={{ color: 'var(--text-muted)' }}>Loading your matches...</p>
        </div>
      ) : matches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💫</div>
          <h3 style={{ fontWeight: '800', margin: '0 0 8px' }}>No matches yet</h3>
          <p style={{ fontSize: '0.9rem', margin: 0 }}>Keep swiping to find your match!</p>
          <button onClick={() => navigate('/')} style={{
            marginTop: '20px', padding: '12px 28px', borderRadius: '50px', border: 'none',
            background: 'linear-gradient(135deg, #e11d48, #f43f5e)',
            color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '0.93rem'
          }}>Start Swiping</button>
        </div>
      ) : (
        <>
          {/* NEW MATCHES ROW — Bumble-style bubbles with countdown timer */}
          {newMatches.length > 0 && (
            <div style={{ padding: '12px 20px 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Sparkles size={15} style={{ color: '#f43f5e' }} />
                <span style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f43f5e' }}>
                  New Matches
                </span>
              </div>
              <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
                {newMatches.map((match) => {
                  const timer = getTimeLeft(match.matchedAt);
                  return (
                    <div key={match._id} onClick={() => openChat(match._id)} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                      cursor: 'pointer', flexShrink: 0, width: '74px'
                    }}>
                      {/* Circle avatar with animated ring */}
                      <div style={{ position: 'relative' }}>
                        <div style={{
                          width: '68px', height: '68px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, #e11d48, #f43f5e, #fb923c)',
                          padding: '3px',
                          boxShadow: '0 4px 16px rgba(244,63,94,0.35)'
                        }}>
                          <img
                            src={getAvatar(match)}
                            alt={match.name}
                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--bg)' }}
                          />
                        </div>
                        {/* Timer badge */}
                        {timer && (
                          <div style={{
                            position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)',
                            background: '#f43f5e', color: '#fff', fontSize: '0.58rem', fontWeight: '800',
                            padding: '2px 5px', borderRadius: '8px', whiteSpace: 'nowrap',
                            border: '1.5px solid var(--bg)', display: 'flex', alignItems: 'center', gap: '2px'
                          }}>
                            <Clock size={8} />
                            {timer}
                          </div>
                        )}
                      </div>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-main)',
                        textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap', width: '100%'
                      }}>
                        {match.name?.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Divider */}
          <div style={{ height: '1px', background: 'var(--line)', margin: '16px 20px' }} />

          {/* CHAT LIST — Bumble-style conversations */}
          <div style={{ padding: '0 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '0 8px' }}>
              <MessageCircle size={15} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                Conversations
              </span>
            </div>

            {matches.map((match) => {
              const distKm = getDistanceBetween(user._id, match._id);
              const cityText = match.city ? `${match.city} · ${distKm} km away` : '';

              return (
                <div
                  key={match._id}
                  onClick={() => match.isExpired ? null : openChat(match._id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 12px', borderRadius: '18px',
                    background: 'transparent',
                    cursor: match.isExpired ? 'default' : 'pointer',
                    transition: 'background 0.18s ease',
                    opacity: match.isExpired ? 0.65 : 1
                  }}
                  onMouseEnter={e => { if (!match.isExpired) e.currentTarget.style.background = 'var(--surface)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img
                      src={getAvatar(match)}
                      alt={match.name}
                      style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--line)' }}
                    />
                    {match.isExpired && (
                      <div style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.45)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Crown size={16} style={{ color: '#fbbf24' }} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.97rem', color: 'var(--text-main)' }}>
                        {match.name}{match.age ? `, ${match.age}` : ''}
                      </span>
                      {match.isExpired && (
                        <span style={{
                          fontSize: '0.65rem', padding: '2px 8px', borderRadius: '20px',
                          background: 'rgba(251,191,36,0.15)', color: '#d97706', fontWeight: '700'
                        }}>Expired</span>
                      )}
                    </div>
                    <p style={{
                      margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                      {match.isExpired
                        ? '🔒 Upgrade to Premium to continue chatting'
                        : (match.bio || cityText || 'Tap to start chatting...')}
                    </p>
                  </div>

                  {/* Arrow or Premium lock */}
                  <div style={{ flexShrink: 0 }}>
                    {match.isExpired ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate('/payment'); }}
                        style={{
                          padding: '6px 12px', borderRadius: '20px', border: 'none',
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          color: '#fff', fontWeight: '700', fontSize: '0.72rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '4px'
                        }}
                      >
                        <Crown size={11} /> Premium
                      </button>
                    ) : (
                      <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default Matches;
