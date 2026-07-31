import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import Swipe from './pages/Swipe';
import Matches from './pages/Matches';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Settings from './pages/Settings';
import Security from './pages/Security';
import Payment from './pages/Payment';
import EditPhotos from './pages/EditPhotos';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import MatchProfile from './pages/MatchProfile';
import Navbar from './components/Navbar';
import './index.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      localStorage.removeItem('user');
    }
  }, []);

  useEffect(() => {
    const applyTheme = () => {
      const themePref = localStorage.getItem('themePreference') || 'system';
      const root = document.documentElement;
      
      root.classList.remove('dark-theme');
      document.body.classList.remove('dark-theme');
      
      if (themePref === 'dark') {
        root.classList.add('dark-theme');
        document.body.classList.add('dark-theme');
      } else if (themePref === 'system') {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.classList.add('dark-theme');
          document.body.classList.add('dark-theme');
        }
      }
    };

    applyTheme();
    window.addEventListener('themeChange', applyTheme);
    window.addEventListener('storage', applyTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const themePref = localStorage.getItem('themePreference') || 'system';
      if (themePref === 'system') {
        applyTheme();
      }
    };
    mediaQuery.addEventListener('change', handleSystemChange);

    return () => {
      window.removeEventListener('themeChange', applyTheme);
      window.removeEventListener('storage', applyTheme);
      mediaQuery.removeEventListener('change', handleSystemChange);
    };
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'there';
  const needsOnboarding = Boolean(user) && !user.profileCompleted;

  return (
    <Router>
      <div className={`app-container ${user ? 'is-signed-in' : 'is-guest'}`}>
        <div className="app-orb orb-one" />
        <div className="app-orb orb-two" />
        <div className="app-orb orb-three" />
        <div className="app-noise" />

        <main className={`main-content ${user ? 'main-content-auth' : 'main-content-guest'}`}>
          <Routes>
            <Route path="/" element={user ? (needsOnboarding ? <Navigate to="/onboarding" /> : <Swipe user={user} />) : <Landing />} />
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login setUser={setUser} />} />
            <Route path="/register" element={user ? <Navigate to="/" /> : <Register setUser={setUser} />} />
            <Route
              path="/onboarding"
              element={
                user ? (needsOnboarding ? <Onboarding user={user} setUser={setUser} /> : <Navigate to="/" />) : <Navigate to="/login" />
              }
            />
            <Route path="/matches" element={user ? (needsOnboarding ? <Navigate to="/onboarding" /> : <Matches user={user} />) : <Navigate to="/login" />} />
            <Route path="/chat/:matchId" element={user ? (needsOnboarding ? <Navigate to="/onboarding" /> : <Chat user={user} />) : <Navigate to="/login" />} />
            <Route path="/match-profile/:id" element={user ? (needsOnboarding ? <Navigate to="/onboarding" /> : <MatchProfile user={user} />) : <Navigate to="/login" />} />
            <Route path="/profile" element={user ? (needsOnboarding ? <Navigate to="/onboarding" /> : <Profile user={user} />) : <Navigate to="/login" />} />
            <Route path="/profile/edit" element={user ? (needsOnboarding ? <Navigate to="/onboarding" /> : <EditProfile user={user} setUser={setUser} />) : <Navigate to="/login" />} />
            <Route path="/profile/photos" element={user ? (needsOnboarding ? <Navigate to="/onboarding" /> : <EditPhotos user={user} setUser={setUser} />) : <Navigate to="/login" />} />
            <Route path="/settings" element={user ? (needsOnboarding ? <Navigate to="/onboarding" /> : <Settings user={user} setUser={setUser} />) : <Navigate to="/login" />} />
            <Route path="/payment" element={user ? (needsOnboarding ? <Navigate to="/onboarding" /> : <Payment user={user} setUser={setUser} />) : <Navigate to="/login" />} />
            <Route path="/security" element={user ? (needsOnboarding ? <Navigate to="/onboarding" /> : <Security user={user} />) : <Navigate to="/login" />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard user={user} />} />
          </Routes>
        </main>

        {user && !needsOnboarding && <Navbar setUser={setUser} />}
      </div>
    </Router>
  );
}

export default App;
