import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { Flame } from 'lucide-react';
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
import EditPhotos from './pages/EditPhotos';
import Navbar from './components/Navbar';
import './index.css';

function profileChips(user) {
  if (!user) return [];
  const chips = [];
  if (user.gender) chips.push(user.gender);
  if (user.showMe) chips.push(`Into ${user.showMe.toLowerCase()}`);
  if (user.sexualOrientation) chips.push(user.sexualOrientation);
  return chips;
}

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

  const firstName = user?.name?.split(' ')[0] || 'there';
  const chips = profileChips(user);
  const needsOnboarding = Boolean(user) && !user.profileCompleted;

  return (
    <Router>
      <div className={`app-container ${user ? 'is-signed-in' : 'is-guest'}`}>
        <div className="app-orb orb-one" />
        <div className="app-orb orb-two" />
        <div className="app-orb orb-three" />
        <div className="app-noise" />

        <main className={`main-content ${user ? 'main-content-auth' : 'main-content-guest'}`}>
          {user && !needsOnboarding && (
            <header className="app-topbar-simple">
              <h1>Hi, {firstName}</h1>
            </header>
          )}

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
            <Route path="/profile" element={user ? (needsOnboarding ? <Navigate to="/onboarding" /> : <Profile user={user} />) : <Navigate to="/login" />} />
            <Route path="/profile/edit" element={user ? (needsOnboarding ? <Navigate to="/onboarding" /> : <EditProfile user={user} setUser={setUser} />) : <Navigate to="/login" />} />
            <Route path="/profile/photos" element={user ? (needsOnboarding ? <Navigate to="/onboarding" /> : <EditPhotos user={user} setUser={setUser} />) : <Navigate to="/login" />} />
            <Route path="/settings" element={user ? (needsOnboarding ? <Navigate to="/onboarding" /> : <Settings user={user} setUser={setUser} />) : <Navigate to="/login" />} />
            <Route path="/security" element={user ? (needsOnboarding ? <Navigate to="/onboarding" /> : <Security user={user} />) : <Navigate to="/login" />} />
          </Routes>
        </main>

        {user && !needsOnboarding && <Navbar setUser={setUser} />}
      </div>
    </Router>
  );
}

export default App;
