import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, GraduationCap, MapPin, Settings, UserPen, Camera, Shield, Heart, ChevronRight } from 'lucide-react';
import { absoluteApiUrl } from '../config';
import './profile.css';

function avatarOf(user) {
  if (user.image) return absoluteApiUrl(user.image);
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
  const imgSrc = userImages.length > 0 ? absoluteApiUrl(userImages[photoIndex]) : avatarOf(user);

  const nextPhoto = (e) => {
    e.stopPropagation();
    if (photoIndex < userImages.length - 1) setPhotoIndex(prev => prev + 1);
  };

  const prevPhoto = (e) => {
    e.stopPropagation();
    if (photoIndex > 0) setPhotoIndex(prev => prev - 1);
  };

  const isPremium = user.subscriptionPlan && user.subscriptionPlan !== 'free';

  return (
    <div className="profile-screen-container">
      {/* Premium Profile Hero Card */}
      <section className="premium-profile-hero">
        <div className="profile-avatar-container">
          <img className="profile-avatar-image" src={imgSrc} alt={user.name} />
          
          {userImages.length > 1 && (
            <div className="profile-photo-indicators">
              {userImages.map((_, i) => (
                <div 
                  key={i} 
                  className="profile-photo-indicator"
                  style={{ background: i === photoIndex ? '#ffffff' : 'rgba(255,255,255,0.4)' }}
                />
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

        <div className="premium-profile-hero-info">
          <div className="profile-badge-row">
            {isPremium ? (
              <span className="profile-membership-badge premium">
                <Heart size={10} fill="currentColor" /> Premium
              </span>
            ) : (
              <span className="profile-membership-badge free">Free Member</span>
            )}
          </div>

          <h2 className="profile-name-age">
            {user.name}
            {user.age ? `, ${user.age}` : ''}
          </h2>

          <p className="profile-bio-text">{user.bio || 'Add a bio so people can know your vibe.'}</p>
          
          <div className="profile-subscription-detail">
            {isPremium && user.subscriptionExpiresAt ? (
              <span>
                Subscribed to <strong>{user.subscriptionPlan}</strong> plan until{' '}
                <strong>{new Date(user.subscriptionExpiresAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}</strong>
              </span>
            ) : (
              <span>Free tier access: unlimited swipes & basic matches.</span>
            )}
          </div>

          {chips.length > 0 && (
            <div className="profile-tags-container">
              {chips.map((chip) => (
                <span key={chip} className="premium-profile-tag">
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Profile Details & Actions Layout */}
      <div className="premium-profile-grid">
        {/* Left Column: About & Interests */}
        <div className="premium-profile-col">
          <article className="premium-profile-card">
            <h3>
              <MapPin size={18} /> About Me
            </h3>
            <ul className="premium-about-list">
              <li className="premium-about-item">
                <MapPin size={16} />
                <span className="premium-about-label">Lives in:</span>
                <span>{user.city || 'Not set'}</span>
              </li>
              <li className="premium-about-item">
                <Briefcase size={16} />
                <span className="premium-about-label">Occupation:</span>
                <span>{user.occupation || 'Not set'}</span>
              </li>
              <li className="premium-about-item">
                <GraduationCap size={16} />
                <span className="premium-about-label">Education:</span>
                <span>{user.education || 'Not set'}</span>
              </li>
            </ul>
          </article>

          <article className="premium-profile-card">
            <h3>
              <Heart size={18} fill="currentColor" /> Interests
            </h3>
            {interests.length > 0 ? (
              <div className="interests-grid-chips">
                {interests.map((item) => (
                  <span key={item} className="premium-interest-chip">
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="profile-empty-text">No interests added yet.</p>
            )}
          </article>
        </div>

        {/* Right Column: Actions */}
        <div className="premium-profile-col">
          <article className="premium-profile-card">
            <h3>Actions</h3>
            <div className="premium-actions-list">
              <Link to="/profile/photos" className="premium-action-card-link">
                <div className="action-content">
                  <div className="action-icon-wrapper">
                    <Camera size={18} />
                  </div>
                  <span>Edit photos</span>
                </div>
                <ChevronRight size={16} className="chevron-icon" />
              </Link>
              
              <Link to="/profile/edit" className="premium-action-card-link">
                <div className="action-content">
                  <div className="action-icon-wrapper">
                    <UserPen size={18} />
                  </div>
                  <span>Edit profile details</span>
                </div>
                <ChevronRight size={16} className="chevron-icon" />
              </Link>
              
              <Link to="/settings" className="premium-action-card-link">
                <div className="action-content">
                  <div className="action-icon-wrapper">
                    <Settings size={18} />
                  </div>
                  <span>Preferences (Distance & Age)</span>
                </div>
                <ChevronRight size={16} className="chevron-icon" />
              </Link>

              <Link to="/security" className="premium-action-card-link">
                <div className="action-content">
                  <div className="action-icon-wrapper">
                    <Shield size={18} />
                  </div>
                  <span>Privacy & Security</span>
                </div>
                <ChevronRight size={16} className="chevron-icon" />
              </Link>

              {!isPremium && (
                <Link to="/payment" className="premium-upgrade-card-link">
                  <div className="action-content">
                    <div className="action-icon-wrapper">
                      <Heart size={18} fill="currentColor" />
                    </div>
                    <span>Upgrade to Premium</span>
                  </div>
                  <ChevronRight size={16} className="chevron-icon" />
                </Link>
              )}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

export default Profile;
