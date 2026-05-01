import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login({ setToken }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });
      const text = await response.text();
      let data = null;
      try { data = JSON.parse(text); } catch (_) { data = null }
      if (!response.ok) {
        const detail = data?.detail || text || 'Invalid credentials';
        console.error('Login failed:', response.status, detail);
        throw new Error(detail);
      }
      // store raw token string in localStorage and update App's token
      const token = data?.access_token || text;
      localStorage.setItem('token', token);
      setToken(token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🧠</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>SmartRecruiter</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>AI HRMS Platform</div>
          </div>
        </div>

        <h1>Welcome back</h1>
        <p>Sign in to your account to continue</p>

        {error && <div className="error-banner">⚠️ {error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-full" style={{ marginTop: '0.5rem' }}>
            {loading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</> : '→ Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <Link to="/register">Create one →</Link>
        </div>

        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: 10, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--accent)' }}>Demo credentials:</strong><br />
          Username: <code style={{ color: 'var(--text-primary)' }}>testuser</code> &nbsp;|&nbsp; Password: <code style={{ color: 'var(--text-primary)' }}>password123</code>
        </div>
      </div>
    </div>
  );
}
