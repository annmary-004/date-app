import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import '../auth-animated.css';

function Register({ setUser }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (formData.password.length < 6) {
        setError('Password is too weak. Please use at least 6 characters.');
        setLoading(false);
        return;
      }

      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('password', formData.password);
      if (imageFile) data.append('image', imageFile);

      await API.post('/api/auth/register', data);

      const res = await API.post('/api/auth/login', {
        email: formData.email,
        password: formData.password
      });

      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('token', res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const update = (key) => (e) => setFormData({ ...formData, [key]: e.target.value });

  return (
    <div className="auth-animated-page">
      <div className="auth-glass-container">
        
        <div className="auth-hero">
          <h1>Dating App</h1>
          <p>
            Join a vibrant community. Your perfect match is just a few clicks away.
            Sign up today and start your journey.
          </p>
        </div>

        <div className="auth-form-wrap">
          <h2>Create Account</h2>
          <p className="auth-subtitle">Set up your profile to get started.</p>

          {error && <div className="glass-alert">{error}</div>}

          <form onSubmit={handleRegister} className="glass-form">
            <div className="glass-field">
              <label>Name</label>
              <input
                type="text"
                placeholder="First name"
                className="glass-input"
                required
                value={formData.name}
                onChange={update('name')}
              />
            </div>

            <div className="glass-field">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@email.com"
                className="glass-input"
                required
                value={formData.email}
                onChange={update('email')}
              />
            </div>

            <div className="glass-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="Create a password"
                className="glass-input"
                required
                value={formData.password}
                onChange={update('password')}
              />
            </div>

            <label className="glass-file-upload" htmlFor="profile-photo">
              <div className="glass-file-icon">
                {/* Simple SVG icon instead of lucide-react to avoid emojis/logos */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </div>
              <div className="glass-file-upload-text">
                <strong>{imageFile ? 'Photo selected' : 'Profile photo'}</strong>
                <span>{imageFile ? imageFile.name : 'Main profile photo (required)'}</span>
              </div>
            </label>
            <input
              id="profile-photo"
              type="file"
              accept="image/*"
              required
              className="sr-only" /* Assuming sr-only is still in index.css */
              onChange={(e) => setImageFile(e.target.files[0])}
              style={{ display: 'none' }}
            />

            <button type="submit" className="glass-btn" disabled={loading}>
              {loading ? 'Creating...' : 'Create account'}
            </button>
          </form>

          <div className="glass-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Register;
