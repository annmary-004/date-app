import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import API from '../api';

function EditProfile({ user, setUser }) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    age: user.age || '',
    gender: user.gender || '',
    sexualOrientation: user.sexualOrientation || '',
    showMe: user.showMe || '',
    lookingFor: user.lookingFor || '',
    occupation: user.occupation || '',
    education: user.education || '',
    city: user.city || '',
    height: user.height || '',
    exercise: user.exercise || '',
    drinking: user.drinking || '',
    smoking: user.smoking || '',
    kids: user.kids || '',
    bio: user.bio || '',
    interests: Array.isArray(user.interests) ? user.interests.join(', ') : user.interests || ''
  });

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await API.put(`/api/user/profile/${user._id}`, form);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save profile');
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
          <h2>Edit profile</h2>
        </div>

        {error && <p className="form-alert">{error}</p>}

        <form onSubmit={onSave} className="auth-form">
          <div className="field-row">
            <label className="field-group">
              <span>Age</span>
              <input className="input-field" type="number" min={18} max={120} value={form.age} onChange={update('age')} />
            </label>
            <label className="field-group">
              <span>City</span>
              <input className="input-field" value={form.city} onChange={update('city')} />
            </label>
          </div>

          <div className="field-row">
            <label className="field-group">
              <span>Gender</span>
              <select className="input-field input-select" value={form.gender} onChange={update('gender')}>
                <option value="">Select</option>
                <option value="Woman">Woman</option>
                <option value="Man">Man</option>
                <option value="Non-binary">Non-binary</option>
              </select>
            </label>
            <label className="field-group">
              <span>Orientation</span>
              <input className="input-field" value={form.sexualOrientation} onChange={update('sexualOrientation')} />
            </label>
          </div>

          <div className="field-row">
            <label className="field-group">
              <span>Show me</span>
              <select className="input-field input-select" value={form.showMe} onChange={update('showMe')}>
                <option value="">Select</option>
                <option value="Women">Women</option>
                <option value="Men">Men</option>
                <option value="Everyone">Everyone</option>
                <option value="Non-binary people">Non-binary people</option>
              </select>
            </label>
            <label className="field-group">
              <span>Looking for</span>
              <input className="input-field" value={form.lookingFor} onChange={update('lookingFor')} />
            </label>
          </div>

          <div className="field-row">
            <label className="field-group">
              <span>Occupation</span>
              <input className="input-field" value={form.occupation} onChange={update('occupation')} />
            </label>
            <label className="field-group">
              <span>Education</span>
              <input className="input-field" value={form.education} onChange={update('education')} />
            </label>
          </div>

          <label className="field-group">
            <span>Interests</span>
            <input className="input-field" value={form.interests} onChange={update('interests')} placeholder="music, gym, coffee" />
          </label>
          <label className="field-group">
            <span>Bio</span>
            <textarea className="input-field input-area" value={form.bio} onChange={update('bio')} />
          </label>

          <button className="btn-primary" type="submit" disabled={saving}>
            <Save size={18} />
            <span>{saving ? 'Saving...' : 'Save changes'}</span>
          </button>
        </form>
      </section>
    </div>
  );
}

export default EditProfile;
