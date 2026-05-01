import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, UserX } from 'lucide-react';
import API from '../api';

function Security({ user }) {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [changing, setChanging] = useState(false);

  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(true);

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        const res = await API.get(`/api/user/blocked/${user._id}`);
        setBlockedUsers(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingBlocked(false);
      }
    };
    fetchBlockedUsers();
  }, [user._id]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordErr('');
    setChanging(true);

    if (newPassword.length < 6) {
      setPasswordErr('New password must be at least 6 characters.');
      setChanging(false);
      return;
    }

    try {
      const res = await API.put(`/api/user/password/${user._id}`, { currentPassword, newPassword });
      setPasswordMsg(res.data.msg);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordErr(err.response?.data?.error || 'Failed to change password');
    } finally {
      setChanging(false);
    }
  };

  const handleUnblock = async (targetId) => {
    try {
      await API.delete(`/api/user/block/${user._id}/${targetId}`);
      setBlockedUsers(blockedUsers.filter((u) => u._id !== targetId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="screen profile-screen">
      <section className="glass-panel profile-panel edit-panel">
        <div className="edit-top">
          <button className="btn-icon" type="button" onClick={() => navigate('/profile')}>
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          <h2>Privacy & Security</h2>
        </div>

        <div className="security-section">
          <h3>
            <Lock size={18} /> Change Password
          </h3>
          {passwordErr && <p className="form-alert" style={{marginBottom: '12px'}}>{passwordErr}</p>}
          {passwordMsg && <p className="form-alert" style={{marginBottom: '12px', borderColor: '#86efac', background: '#dcfce7', color: '#166534'}}>{passwordMsg}</p>}
          
          <form onSubmit={handleChangePassword} className="auth-form">
            <label className="field-group">
              <span>Current Password</span>
              <input
                className="input-field"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </label>
            <label className="field-group">
              <span>New Password</span>
              <input
                className="input-field"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>
            <button className="btn-primary" type="submit" disabled={changing} style={{marginTop: '8px'}}>
              <span>{changing ? 'Updating...' : 'Update Password'}</span>
            </button>
          </form>
        </div>

        <div className="security-section" style={{marginTop: '36px'}}>
          <h3>
            <UserX size={18} /> Blocked Contacts
          </h3>
          <p className="section-desc">Blocked users will not see your profile, and you will not see theirs.</p>

          <div className="blocked-list" style={{marginTop: '16px'}}>
            {loadingBlocked ? (
              <p>Loading...</p>
            ) : blockedUsers.length === 0 ? (
              <p style={{color: 'var(--text-muted)'}}>You haven't blocked anyone.</p>
            ) : (
              blockedUsers.map((u) => (
                <div key={u._id} className="blocked-user-item" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--surface-strong)', borderRadius: '12px', marginBottom: '8px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <img src={u.image || '/default-avatar.png'} alt={u.name} style={{width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover'}} />
                    <strong>{u.name}</strong>
                  </div>
                  <button type="button" className="btn-icon" onClick={() => handleUnblock(u._id)} style={{fontSize: '0.8rem', padding: '6px 12px'}}>
                    Unblock
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </section>
    </div>
  );
}

export default Security;
