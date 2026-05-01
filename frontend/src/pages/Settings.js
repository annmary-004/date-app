import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, MapPin, User, EyeOff, Bell } from 'lucide-react';
import API from '../api';

function Settings({ user, setUser }) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    distancePreference: user.distancePreference ?? 30,
    minAgePreference: user.minAgePreference ?? 18,
    maxAgePreference: user.maxAgePreference ?? 40,
    showOnlineStatus: Boolean(user.showOnlineStatus ?? true),
    pushNotifications: Boolean(user.pushNotifications ?? true),
    emailNotifications: Boolean(user.emailNotifications ?? false),
    incognitoMode: Boolean(user.incognitoMode ?? false)
  });

  const setValue = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleMinAge = (e) => {
    const val = parseInt(e.target.value);
    if (val < form.maxAgePreference) {
      setForm(prev => ({ ...prev, minAgePreference: val }));
    }
  };

  const handleMaxAge = (e) => {
    const val = parseInt(e.target.value);
    if (val > form.minAgePreference) {
      setForm(prev => ({ ...prev, maxAgePreference: val }));
    }
  };

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await API.put(`/api/user/settings/${user._id}`, form);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save preferences');
    } finally {
      setSaving(false);
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
          <h2>Preferences</h2>
        </div>

        {error && <p className="form-alert">{error}</p>}

        <form onSubmit={onSave} className="auth-form" style={{display: 'flex', flexDirection: 'column', gap: '32px'}}>
          
          <div className="preference-block">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px'}}>
              <h3 style={{fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px'}}><MapPin size={18} /> Distance</h3>
              <span style={{fontWeight: '700', color: 'var(--accent)'}}>{form.distancePreference} km</span>
            </div>
            <input 
              type="range" 
              className="premium-slider" 
              min={1} 
              max={150} 
              value={form.distancePreference} 
              onChange={setValue('distancePreference')} 
            />
          </div>

          <div className="preference-block">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px'}}>
              <h3 style={{fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px'}}><User size={18} /> Age</h3>
              <span style={{fontWeight: '700', color: 'var(--accent)'}}>{form.minAgePreference} - {form.maxAgePreference}</span>
            </div>
            <div className="dual-slider-container">
              <div className="slider-track" style={{
                left: `${((form.minAgePreference - 18) / (100 - 18)) * 100}%`,
                right: `${100 - ((form.maxAgePreference - 18) / (100 - 18)) * 100}%`
              }}></div>
              <input type="range" className="premium-slider dual-thumb" min={18} max={100} value={form.minAgePreference} onChange={handleMinAge} />
              <input type="range" className="premium-slider dual-thumb" min={18} max={100} value={form.maxAgePreference} onChange={handleMaxAge} />
            </div>
          </div>

          <div className="preference-block">
            <h3 style={{fontSize: '1.1rem', marginBottom: '16px'}}>Privacy Controls</h3>
            <label className="setting-toggle">
              <input type="checkbox" checked={form.showOnlineStatus} onChange={setValue('showOnlineStatus')} />
              <span>Show my online status</span>
            </label>
            <label className="setting-toggle">
              <input type="checkbox" checked={form.incognitoMode} onChange={setValue('incognitoMode')} />
              <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>Incognito mode <EyeOff size={14}/></span>
            </label>
          </div>

          <div className="preference-block">
            <h3 style={{fontSize: '1.1rem', marginBottom: '16px'}}>Notifications</h3>
            <label className="setting-toggle">
              <input type="checkbox" checked={form.pushNotifications} onChange={setValue('pushNotifications')} />
              <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>Push notifications <Bell size={14}/></span>
            </label>
            <label className="setting-toggle">
              <input type="checkbox" checked={form.emailNotifications} onChange={setValue('emailNotifications')} />
              <span>Email notifications</span>
            </label>
          </div>

          <button className="btn-primary" type="submit" disabled={saving} style={{marginTop: '16px'}}>
            <Save size={18} />
            <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </form>
      </section>
    </div>
  );
}

export default Settings;
