import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Compass, Heart, LogOut, UserCircle2 } from 'lucide-react';

function Navbar({ setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
        <Compass size={22} />
        <span>Discover</span>
      </NavLink>
      <NavLink to="/matches" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Heart size={22} />
        <span>Matches</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <UserCircle2 size={22} />
        <span>Profile</span>
      </NavLink>
      <button className="nav-item nav-logout" onClick={handleLogout}>
        <LogOut size={22} />
        <span>Logout</span>
      </button>
    </nav>
  );
}

export default Navbar;
