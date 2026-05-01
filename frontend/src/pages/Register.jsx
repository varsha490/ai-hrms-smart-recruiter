import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', role: 'HR', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Registration failed');
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1800);
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

        <h1>Create account</h1>
        <p>Join the AI-powered HR platform</p>

        {error && <div className="error-banner">⚠️ {error}</div>}
        {success && <div className="success-banner">✅ {success}</div>}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Username</label>
            <input name="username" value={form.username} onChange={handleChange} placeholder="Choose a username" required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@company.com" required />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="HR">HR</option>
              <option value="Admin">Admin</option>
              <option value="Employee">Employee</option>
            </select>
          </div>
          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Create a password" required />
          </div>
          <button type="submit" disabled={loading} className="btn-full" style={{ marginTop: '0.5rem' }}>
            {loading ? 'Creating account...' : '→ Create Account'}
          </button>
        </form>

        <div className="auth-divider">
          Already have an account? <Link to="/login">Sign in →</Link>
        </div>
      </div>
    </div>
  );
}
