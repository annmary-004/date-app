import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { Users, UserCheck, Calendar, Clock, LogOut } from 'lucide-react';

function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalUsers: 0, activeToday: 0 });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin');
      return;
    }

    const fetchAdminData = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          API.get('/api/admin/stats', { headers: { 'user-id': user._id } }),
          API.get('/api/admin/users', { headers: { 'user-id': user._id } })
        ]);
        setStats(statsRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        console.error('Failed to fetch admin data', err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/admin');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/admin';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading Dashboard...</div>;
  }

  return (
    <div className="admin-dashboard" style={{ minHeight: '100vh', background: '#f5f5f4', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#1c1917', margin: 0 }}>Admin Dashboard</h1>
            <p style={{ color: '#57534e', marginTop: '4px' }}>Welcome back, {user?.name}</p>
          </div>
          <button 
            onClick={handleLogout}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', borderRadius: '12px', border: '1px solid #e7e5e4',
              background: '#ffffff', color: '#1c1917', fontWeight: '600', cursor: 'pointer'
            }}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', background: '#ffffff', border: '1px solid #e7e5e4', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(225,29,72,0.1)', color: '#e11d48', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Users size={28} />
            </div>
            <div>
              <p style={{ color: '#78716c', fontSize: '0.9rem', fontWeight: '600', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Registrations</p>
              <h2 style={{ fontSize: '2.4rem', fontWeight: '800', color: '#1c1917', margin: '4px 0 0 0' }}>{stats.totalUsers}</h2>
            </div>
          </div>
          
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', background: '#ffffff', border: '1px solid #e7e5e4', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <UserCheck size={28} />
            </div>
            <div>
              <p style={{ color: '#78716c', fontSize: '0.9rem', fontWeight: '600', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Today</p>
              <h2 style={{ fontSize: '2.4rem', fontWeight: '800', color: '#1c1917', margin: '4px 0 0 0' }}>{stats.activeToday}</h2>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="glass-panel" style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e7e5e4', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid #e7e5e4' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1c1917', margin: 0 }}>Registered Users</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f5f5f4' }}>
                  <th style={{ padding: '16px 24px', color: '#57534e', fontWeight: '600', fontSize: '0.9rem' }}>User</th>
                  <th style={{ padding: '16px 24px', color: '#57534e', fontWeight: '600', fontSize: '0.9rem' }}>Photos</th>
                  <th style={{ padding: '16px 24px', color: '#57534e', fontWeight: '600', fontSize: '0.9rem' }}>Joined Date</th>
                  <th style={{ padding: '16px 24px', color: '#57534e', fontWeight: '600', fontSize: '0.9rem' }}>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: '#78716c' }}>No users found</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} style={{ borderBottom: '1px solid #e7e5e4' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ 
                            width: '40px', height: '40px', borderRadius: '50%', background: '#e7e5e4', 
                            backgroundImage: `url(${u.image || u.images?.[0] || `https://ui-avatars.com/api/?name=${u.name}`})`,
                            backgroundSize: 'cover', backgroundPosition: 'center'
                          }} />
                          <div>
                            <div style={{ fontWeight: '600', color: '#1c1917' }}>{u.name}</div>
                            <div style={{ fontSize: '0.85rem', color: '#78716c' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', color: '#57534e' }}>
                        {u.images && u.images.length > 0 ? u.images.length : (u.image ? 1 : 0)}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#57534e' }}>
                          <Calendar size={16} /> {formatDate(u.createdAt)}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', color: '#57534e' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={14} /> {formatDate(u.lastLogin)}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#78716c' }}>
                            <Clock size={14} /> {formatTime(u.lastLogin)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
