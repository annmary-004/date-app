import React, { useEffect, useState } from 'react';
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
  X
} from 'lucide-react';
import API from '../api';

function profileImageUrl(p) {
  if (p.image) return p.image.startsWith('http') ? p.image : `http://localhost:5000${p.image}`;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&size=600&background=ec4899&color=fff`;
}

function Swipe({ user }) {
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

  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    setPhotoIndex(0);
  }, [currentIndex]);

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
  };

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
  const remainingProfiles = profiles.length - currentIndex - 1;
  const userImages = p.images && p.images.length > 0 ? p.images : (p.image ? [p.image] : []);
  const imgSrc = userImages.length > 0 ? (userImages[photoIndex].startsWith('http') ? userImages[photoIndex] : `http://localhost:5000${userImages[photoIndex]}`) : profileImageUrl(p);
  
  const interests = Array.isArray(p.interests) ? p.interests : [];
  const ageStr = p.age != null ? `${p.age}` : '';

  const lifestyle = [
    p.exercise && { icon: <Dumbbell size={15} />, label: p.exercise },
    p.drinking && { icon: <Wine size={15} />, label: p.drinking },
    p.smoking && { icon: <Cigarette size={15} />, label: p.smoking },
    p.kids && { icon: <Baby size={15} />, label: p.kids }
  ].filter(Boolean);

  const detailRows = [
    p.occupation && {
      icon: <Briefcase size={16} strokeWidth={2.25} />,
      text: p.occupation
    },
    p.education && {
      icon: <GraduationCap size={16} strokeWidth={2.25} />,
      text: p.education
    },
    p.city && {
      icon: <MapPin size={16} strokeWidth={2.25} />,
      text: p.city
    },
    p.height && {
      icon: <Ruler size={16} strokeWidth={2.25} />,
      text: p.height
    },
    p.lookingFor && {
      icon: <Target size={16} strokeWidth={2.25} />,
      text: p.lookingFor
    }
  ].filter(Boolean);

  const nextPhoto = (e) => {
    e.stopPropagation();
    if (photoIndex < userImages.length - 1) setPhotoIndex(prev => prev + 1);
  };

  const prevPhoto = (e) => {
    e.stopPropagation();
    if (photoIndex > 0) setPhotoIndex(prev => prev - 1);
  };

  return (
    <div className="screen">
      {showMatch && (
        <div className="match-toast">
          It is a match with <strong>{matchName}</strong>
        </div>
      )}

      <section className="screen-hero screen-hero-compact">
        <div className="hero-copy">
          <span className="eyebrow">Discover</span>
          <h2>Full profiles, not just a photo.</h2>
          <p>Gender, orientation, who they want to meet, lifestyle, and intent—up front on every card.</p>
        </div>

        <div className="glass-panel hero-stat hero-stat-min">
          <span className="stat-label">Stack</span>
          <strong>
            {currentIndex + 1} / {profiles.length}
          </strong>
          <p>{remainingProfiles} left</p>
        </div>
      </section>

      <div className="discover-layout discover-layout-swipe discover-single">
        <section className="discover-main discover-main-full">
          <div className="swipe-container">
            <div className="swipe-card swipe-card-rich">
              <div style={{position: 'relative', width: '100%', height: '100%'}}>
                <img src={imgSrc} alt={p.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                {userImages.length > 1 && (
                  <div style={{position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', gap: '4px', padding: '8px', zIndex: 10}}>
                    {userImages.map((_, i) => (
                      <div key={i} style={{flex: 1, height: '4px', background: i === photoIndex ? '#fff' : 'rgba(255,255,255,0.4)', borderRadius: '2px'}} />
                    ))}
                  </div>
                )}
                {userImages.length > 1 && (
                  <>
                    <div onClick={prevPhoto} style={{position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', zIndex: 5, cursor: 'pointer'}} />
                    <div onClick={nextPhoto} style={{position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', zIndex: 5, cursor: 'pointer'}} />
                  </>
                )}
              </div>
              <div className="swipe-photo-shine" aria-hidden />
              <div className="swipe-badge">Profile</div>
              <div className="card-info card-info-rich">
                <div className="profile-identity-row">
                  {p.gender ? <span className="pill-gender">{p.gender}</span> : null}
                  {p.sexualOrientation ? <span className="pill-soft">{p.sexualOrientation}</span> : null}
                </div>

                {p.showMe ? (
                  <div className="profile-meet-row">
                    <Users size={17} strokeWidth={2.25} className="profile-meet-icon" aria-hidden />
                    <span>
                      Wants to meet <strong>{p.showMe}</strong>
                    </span>
                  </div>
                ) : null}

                <div className="card-pill-row">
                  <span className="card-pill">
                    {p.name}
                    {ageStr ? `, ${ageStr}` : ''}
                  </span>
                  {remainingProfiles > 0 ? (
                    <span className="card-pill card-pill-soft">{remainingProfiles} more</span>
                  ) : null}
                </div>

                {lifestyle.length > 0 ? (
                  <div className="lifestyle-strip" aria-label="Lifestyle">
                    {lifestyle.map((item) => (
                      <span key={item.label} className="lifestyle-chip">
                        <span className="lifestyle-chip-icon">{item.icon}</span>
                        {item.label}
                      </span>
                    ))}
                  </div>
                ) : null}

                {detailRows.length > 0 ? (
                  <ul className="card-details-list">
                    {detailRows.map((row) => (
                      <li key={row.text}>
                        <span className="card-detail-icon">{row.icon}</span>
                        <span>{row.text}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {interests.length > 0 ? (
                  <div className="card-interests" aria-label="Interests">
                    {interests.map((tag) => (
                      <span key={tag} className="interest-chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                <p className="card-bio">{p.bio || 'No bio yet—say hi with something from their profile.'}</p>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn-icon dislike" onClick={() => handleAction('dislike')} type="button" title="Pass">
              <X size={24} />
              <span>Pass</span>
            </button>
            <button className="btn-icon like" onClick={() => handleAction('like')} type="button" title="Like">
              <Heart size={24} />
              <span>Like</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Swipe;
