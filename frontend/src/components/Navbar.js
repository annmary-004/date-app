import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Compass, CreditCard, Heart, LogOut, UserCircle2 } from 'lucide-react';

function Navbar({ setUser }) {
  const navigate = useNavigate();

  if (window.location.pathname.startsWith('/admin')) {
    return null;
  }

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
        <Compass size={20} />
        <span>Discover</span>
      </NavLink>
      <NavLink to="/matches" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Heart size={20} />
        <span>Matches</span>
      </NavLink>
      <NavLink to="/payment" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <CreditCard size={20} />
        <span>Premium</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <UserCircle2 size={20} />
        <span>Profile</span>
      </NavLink>
      <button className="nav-item nav-logout" onClick={handleLogout}>
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </nav>
  );
}

export default Navbar;
