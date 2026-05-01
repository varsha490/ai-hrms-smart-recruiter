import React, { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'https://ai-hrms-smart-recruiter.onrender.com';
const authHeaders = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API}/dashboard/`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch dashboard');
      setData(await res.json());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    setSubmitting(true); setSuccess(''); setError('');
    const form = e.target;
    const candidate = {
      name: form.name.value, email: form.email.value,
      status: form.status.value,
      resume_score: parseInt(form.resume_score.value) || 0,
      interview_score: parseInt(form.interview_score.value) || 0,
    };
    try {
      const res = await fetch(`${API}/candidates/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(candidate) });
      if (!res.ok) throw new Error('Failed to add candidate');
      setSuccess('Candidate added successfully!');
      form.reset();
      await fetchDashboard();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const avgScore = data?.candidates?.length
    ? Math.round(data.candidates.reduce((a, c) => a + (c.total_score || 0), 0) / data.candidates.length)
    : 0;

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      Loading dashboard...
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>HR Dashboard</h1>
          <p>Manage candidates and track recruitment performance</p>
        </div>
      </div>

      {success && <div className="success-banner">✅ {success}</div>}
      {error && <div className="error-banner">⚠️ {error}</div>}

      {/* Stat Cards */}
      <div className="grid-cards">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(79,142,247,0.15)' }}>👥</div>
          <div className="stat-card-title">Total Candidates</div>
          <div className="stat-card-value">{data?.candidates?.length || 0}</div>
          <div className="stat-card-sub">In the pipeline</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(34,211,160,0.15)' }}>📈</div>
          <div className="stat-card-title">Average Score</div>
          <div className="stat-card-value">{avgScore}<span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-secondary)' }}>/100</span></div>
          <div className="stat-card-sub">Across all candidates</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(245,166,35,0.15)' }}>⭐</div>
          <div className="stat-card-title">Top Performer</div>
          <div className="stat-card-value" style={{ color: 'var(--accent)' }}>{data?.top_candidate?.total_score ?? '--'}</div>
          <div className="stat-card-sub">{data?.top_candidate?.name || 'No candidates yet'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(245,83,106,0.15)' }}>🎯</div>
          <div className="stat-card-title">Shortlisted</div>
          <div className="stat-card-value">{data?.candidates?.filter(c => c.status === 'Shortlisted').length || 0}</div>
          <div className="stat-card-sub">Ready for offer</div>
        </div>
      </div>

      {/* Top Candidate Spotlight */}
      {data?.top_candidate && (
        <div className="panel top-candidate" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>⭐ Top Candidate Spotlight</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{data.top_candidate.name}</h2>
              <span className={`badge badge-${data.top_candidate.rating.toLowerCase()}`}>{data.top_candidate.rating}</span>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>{data.top_candidate.email}</div>
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1.5rem' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Resume: <strong style={{ color: 'var(--text-primary)' }}>{data.top_candidate.resume_score}</strong></div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Interview: <strong style={{ color: 'var(--text-primary)' }}>{data.top_candidate.interview_score}</strong></div>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{data.top_candidate.total_score}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>Total Score / 100</div>
          </div>
        </div>
      )}

      {/* Add Candidate Form */}
      <div className="panel" style={{ borderColor: 'var(--border-accent)' }}>
        <div className="panel-title">
          <div className="panel-title-icon" style={{ background: 'rgba(79,142,247,0.15)' }}>➕</div>
          Add New Candidate
        </div>
        <form onSubmit={handleAddCandidate}>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <input name="name" required placeholder="John Doe" />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input name="email" type="email" required placeholder="john@example.com" />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status">
                <option value="Applied">Applied</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div className="form-group">
              <label>Resume Score (0–100)</label>
              <input name="resume_score" type="number" defaultValue="0" min="0" max="100" />
            </div>
            <div className="form-group">
              <label>Interview Score (0–100)</label>
              <input name="interview_score" type="number" defaultValue="0" min="0" max="100" />
            </div>
            <div className="form-group" style={{ justifyContent: 'flex-end' }}>
              <label>&nbsp;</label>
              <button type="submit" disabled={submitting}>
                {submitting ? 'Adding...' : '+ Add Candidate'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Candidates Table */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>All Candidates</h2>
      <div className="table-container">
        {!data?.candidates?.length ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <h3>No candidates yet</h3>
            <p>Add your first candidate using the form above</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Status</th>
                <th>Resume</th>
                <th>Interview</th>
                <th>Total Score</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {data.candidates.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{c.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.email}</div>
                  </td>
                  <td>
                    <span className={`badge badge-${c.status?.toLowerCase()}`}>{c.status}</span>
                  </td>
                  <td>
                    <div>{c.resume_score}</div>
                    <div className="score-bar-wrap">
                      <div className="score-bar-track">
                        <div className="score-bar-fill" style={{ width: `${c.resume_score}%`, background: 'var(--accent)' }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>{c.interview_score}</div>
                    <div className="score-bar-wrap">
                      <div className="score-bar-track">
                        <div className="score-bar-fill" style={{ width: `${c.interview_score}%`, background: 'var(--green)' }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, fontSize: '1.05rem' }}>{c.total_score}</td>
                  <td>
                    <span className={`badge badge-${c.rating?.toLowerCase()}`}>{c.rating}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
      
     
