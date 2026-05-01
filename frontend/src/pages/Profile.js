import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, GraduationCap, MapPin, Settings, UserPen, Camera, Shield } from 'lucide-react';

function avatarOf(user) {
  if (user.image) return user.image.startsWith('http') ? user.image : `http://localhost:5000${user.image}`;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&size=300&background=f43f5e&color=fff`;
}

function Profile({ user }) {
  const chips = useMemo(() => {
    const items = [];
    if (user.gender) items.push(user.gender);
    if (user.sexualOrientation) items.push(user.sexualOrientation);
    if (user.showMe) items.push(`Into ${user.showMe}`);
    if (user.lookingFor) items.push(user.lookingFor);
    return items;
  }, [user]);

  const interests = Array.isArray(user.interests) ? user.interests : [];
  
  const [photoIndex, setPhotoIndex] = React.useState(0);
  const userImages = user.images && user.images.length > 0 ? user.images : (user.image ? [user.image] : []);
  const imgSrc = userImages.length > 0 ? (userImages[photoIndex].startsWith('http') ? userImages[photoIndex] : `http://localhost:5000${userImages[photoIndex]}`) : avatarOf(user);

  const nextPhoto = (e) => {
    e.stopPropagation();
    if (photoIndex < userImages.length - 1) setPhotoIndex(prev => prev + 1);
  };

  const prevPhoto = (e) => {
    e.stopPropagation();
    if (photoIndex > 0) setPhotoIndex(prev => prev - 1);
  };

  return (
    <div className="screen profile-screen">
      <section className="glass-panel profile-hero">
        <div className="profile-avatar" style={{position: 'relative', overflow: 'hidden', padding: 0}}>
          <img src={imgSrc} alt={user.name} style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit'}} />
          {userImages.length > 1 && (
            <div style={{position: 'absolute', top: '8px', left: 0, right: 0, display: 'flex', gap: '4px', padding: '0 12px', zIndex: 10, justifyContent: 'center'}}>
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
        <div className="profile-hero-copy">
          <span className="eyebrow">Profile</span>
          <h2>
            {user.name}
            {user.age ? `, ${user.age}` : ''}
          </h2>
          <p>{user.bio || 'Add a bio so people can know your vibe.'}</p>
          {chips.length > 0 && (
            <div className="profile-chip-row">
              {chips.map((chip) => (
                <span key={chip} className="profile-chip">
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="profile-grid">
        <article className="glass-panel profile-panel">
          <h3>About</h3>
          <ul className="profile-list">
            <li>
              <MapPin size={16} />
              <span>{user.city || 'City not set'}</span>
            </li>
            <li>
              <Briefcase size={16} />
              <span>{user.occupation || 'Occupation not set'}</span>
            </li>
            <li>
              <GraduationCap size={16} />
              <span>{user.education || 'Education not set'}</span>
            </li>
          </ul>
        </article>

        <article className="glass-panel profile-panel">
          <h3>Interests</h3>
          {interests.length > 0 ? (
            <div className="profile-chip-row">
              {interests.map((item) => (
                <span key={item} className="profile-chip profile-chip-soft">
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <p className="profile-muted">No interests added yet.</p>
          )}
        </article>

        <article className="glass-panel profile-panel profile-panel-actions">
          <h3>Profile actions</h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px'}}>
            <Link to="/profile/photos" className="btn-icon profile-action-link" style={{justifyContent: 'flex-start', padding: '12px 16px', background: 'var(--surface-strong)', color: 'var(--text-main)', border: '1px solid var(--line)'}}>
              <Camera size={18} />
              <span>Edit photos</span>
            </Link>
            <Link to="/profile/edit" className="btn-icon profile-action-link" style={{justifyContent: 'flex-start', padding: '12px 16px', background: 'var(--surface-strong)', color: 'var(--text-main)', border: '1px solid var(--line)'}}>
              <UserPen size={18} />
              <span>Edit profile details</span>
            </Link>
            <Link to="/settings" className="btn-icon profile-action-link" style={{justifyContent: 'flex-start', padding: '12px 16px', background: 'var(--surface-strong)', color: 'var(--text-main)', border: '1px solid var(--line)'}}>
              <Settings size={18} />
              <span>Preferences (Distance & Age)</span>
            </Link>
            <Link to="/security" className="btn-icon profile-action-link" style={{justifyContent: 'flex-start', padding: '12px 16px', background: 'var(--surface-strong)', color: 'var(--text-main)', border: '1px solid var(--line)'}}>
              <Shield size={18} />
              <span>Privacy & Security</span>
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}

export default Profile;
