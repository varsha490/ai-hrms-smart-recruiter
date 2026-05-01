import React, { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'https://ai-hrms-smart-recruiter.onrender.com';

export default function MyProfile({ username }) {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API}/payroll/me`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) setPayrolls((await res.json()).payrolls || []);
      } catch { }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, [username]);

  const total = payrolls.reduce((a, p) => a + (p.salary || 0), 0);
  const initials = username?.[0]?.toUpperCase() || '?';

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1>My Profile</h1>
          <p>View your account details and salary history</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.75rem', flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{username}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: 4 }}>Employee · AI HRMS Platform</div>
          {payrolls.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Earnings</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--green)' }}>₹{total.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pay Records</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{payrolls.length}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Salary History */}
      <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem' }}>Salary History</h2>
      <div className="table-container">
        {loading ? (
          <div className="loading-screen" style={{ height: 150 }}><div className="spinner" /></div>
        ) : payrolls.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💸</div>
            <h3>No payroll records</h3>
            <p>Your salary records will appear here once processed by HR</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Month</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.map((p, i) => (
                <tr key={p._id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td>{p.month}</td>
                  <td style={{ fontWeight: 700, color: 'var(--green)' }}>₹{p.salary?.toLocaleString()}</td>
                  <td><span className="badge badge-excellent">Credited</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
