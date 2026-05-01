import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Chatbot from './pages/Chatbot';
import Employees from './pages/Employees';
import MyProfile from './pages/MyProfile';
import Register from './pages/Register';
import Payroll from './pages/Payroll';

const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) { return null; }
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (token) {
      const decodedToken = decodeToken(token);
      setUser(decodedToken);
      setRole(decodedToken?.role);
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setRole(null);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  // Auth pages should NOT be inside page-container
  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div className="app-container">
      <nav className="navbar">
        {/* Brand */}
        <div className="navbar-brand">
          <div className="navbar-brand-icon">🧠</div>
          <span className="navbar-brand-text">SmartRecruiter</span>
        </div>

        {/* Nav Links */}
        {(role === 'Admin' || role === 'HR') && (
          <>
            <Link to="/" className={isActive('/')}>📊 Dashboard</Link>
            <Link to="/upload" className={isActive('/upload')}>📄 Resume AI</Link>
            <Link to="/employees" className={isActive('/employees')}>👥 Employees</Link>
            <Link to="/payroll" className={isActive('/payroll')}>💰 Payroll</Link>
            <Link to="/chatbot" className={isActive('/chatbot')}>🤖 AI Chatbot</Link>
          </>
        )}
        {role === 'Employee' && (
          <Link to="/my-profile" className={isActive('/my-profile')}>👤 My Profile</Link>
        )}

        <div className="navbar-spacer" />

        {/* User Info */}
        <div className="navbar-user">
          <div className="navbar-user-info">
            <div className="navbar-user-name">{user?.sub}</div>
            <div className="navbar-user-role">{role}</div>
          </div>
          <div className="avatar">{user?.sub?.[0]?.toUpperCase()}</div>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="page-container">
        <Routes>
          {(role === 'Admin' || role === 'HR') && (
            <>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/payroll" element={<Payroll />} />
              <Route path="/chatbot" element={<Chatbot />} />
            </>
          )}
          {role === 'Employee' && (
            <Route path="/my-profile" element={<MyProfile username={user?.sub} />} />
          )}
          {role === 'Employee' && <Route path="*" element={<Navigate to="/my-profile" />} />}
          {(role === 'Admin' || role === 'HR') && <Route path="*" element={<Navigate to="/" />} />}
        </Routes>
      </div>
    </div>
  );
}

export default App;
