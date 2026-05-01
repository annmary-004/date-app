import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Camera, Heart } from 'lucide-react';
import API from '../api';

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
    <div className="auth-page auth-page-login">
      <div className="login-shell glass-panel">
        <div className="login-brand">
          <div className="auth-brand-mark login-brand-icon">
            <Heart size={22} strokeWidth={2.5} fill="currentColor" />
          </div>
          <h1>Create account</h1>
          <p>Details like gender / who you want to date will be asked after login in step-by-step pages.</p>
        </div>

        {error && <p className="form-alert">{error}</p>}

        <form onSubmit={handleRegister} className="auth-form login-form">
          <label className="field-group">
            <span>Name</span>
            <input
              type="text"
              placeholder="First name"
              className="input-field"
              required
              value={formData.name}
              onChange={update('name')}
            />
          </label>
          <label className="field-group">
            <span>Email</span>
            <input
              type="email"
              placeholder="you@email.com"
              className="input-field"
              required
              value={formData.email}
              onChange={update('email')}
            />
          </label>
          <label className="field-group">
            <span>Password</span>
            <input
              type="password"
              placeholder="Create a password"
              className="input-field"
              required
              value={formData.password}
              onChange={update('password')}
            />
          </label>

          <label className="file-upload-label" htmlFor="profile-photo">
            <div className="auth-highlight-icon file-upload-icon">
              <Camera size={18} />
            </div>
            <div className="file-upload-copy">
              <strong>{imageFile ? 'Photo selected' : 'Profile photo'}</strong>
              <span>{imageFile ? imageFile.name : 'Main profile photo (required).'}</span>
            </div>
          </label>
          <input
            id="profile-photo"
            type="file"
            accept="image/*"
            required
            className="sr-only"
            onChange={(e) => setImageFile(e.target.files[0])}
          />

          <button type="submit" className="btn-primary" disabled={loading}>
            <span>{loading ? 'Creating...' : 'Create account'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
