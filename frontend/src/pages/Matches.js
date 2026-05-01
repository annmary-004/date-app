import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import API from '../api';

function Matches({ user }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await API.get(`/api/user/matches/${user._id}`);
        setMatches(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [user._id]);

  const getAvatar = (match) => {
    if (match.image) return match.image.startsWith('http') ? match.image : `http://localhost:5000${match.image}`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(match.name)}&size=300&background=ff4b4b&color=fff`;
  };

  const openChat = (id) => navigate(`/chat/${id}`);

  return (
    <div className="screen">
      <section className="screen-hero">
        <div className="hero-copy">
          <span className="eyebrow">Matches</span>
          <h2>People who liked you back.</h2>
          <p>Open a chat—each card shows the same details you saw while swiping.</p>
        </div>

        <div className="glass-panel hero-stat">
          <span className="stat-label">Connections</span>
          <strong>{matches.length} {matches.length === 1 ? 'match' : 'matches'}</strong>
          <p>Open a chat while the interest is fresh.</p>
        </div>
      </section>

      {loading ? (
        <div className="state-wrap">
          <div className="glass-panel state-card">
            <div className="spinner" />
            <h3>Loading matches</h3>
            <p>Bringing your conversations into view.</p>
          </div>
        </div>
      ) : matches.length === 0 ? (
        <div className="state-wrap">
          <div className="glass-panel state-card">
            <div className="state-kicker">
              <Heart size={26} />
            </div>
            <h3>No matches yet</h3>
            <p>Keep swiping to find your match.</p>
          </div>
        </div>
      ) : (
        <div className="matches-grid">
          {matches.map((match) => (
            <div
              key={match._id}
              className="match-item"
              onClick={() => openChat(match._id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openChat(match._id);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <img src={getAvatar(match)} alt={match.name} />
              <div className="match-overlay">
                <div className="match-text">
                  <div className="name">
                    {match.name}
                    {match.age != null ? `, ${match.age}` : ''}
                  </div>
                  {(() => {
                    const meta = [
                      match.gender,
                      match.showMe ? `Into ${match.showMe}` : '',
                      match.sexualOrientation,
                      [match.occupation, match.city].filter(Boolean).join(' · ')
                    ].filter(Boolean);
                    return meta.length ? <div className="match-meta">{meta.join(' · ')}</div> : null;
                  })()}
                  <p>{match.bio || 'Open chat and break the ice.'}</p>
                </div>
                <div className="chat-icon">
                  <MessageCircle size={18} />
                  <span>Chat</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Matches;
