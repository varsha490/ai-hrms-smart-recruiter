import React, { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [saveForm, setSaveForm] = useState({ name: '', email: '' });
  const [showSaveForm, setShowSaveForm] = useState(false);

  const handleFile = (f) => {
    if (f && f.type === 'application/pdf') setFile(f);
    else setError('Please select a valid PDF file.');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true); setError(''); setSuccess(''); setResult(null); setShowSaveForm(false);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API}/upload-resume/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Upload failed'); }
      const data = await res.json();
      setResult(data.analysis);
      setSuccess('Resume analyzed successfully!');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const candidate = { name: saveForm.name, email: saveForm.email, status: 'Applied', resume_score: result.score, interview_score: 0, resume_text: result.summary };
    try {
      const res = await fetch(`${API}/candidates/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(candidate),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Failed to save (status ${res.status})`);
      }
      setSuccess('Candidate added to recruitment pipeline! ✅');
      setResult(null); setFile(null); setShowSaveForm(false);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1>📄 AI Resume Analyzer</h1>
          <p>Upload a PDF resume — our AI extracts skills, scores the candidate, and generates insights</p>
        </div>
      </div>

      {success && <div className="success-banner">✅ {success}</div>}
      {error && <div className="error-banner">⚠️ {error}</div>}

      <div className="panel">
        <form onSubmit={handleUpload}>
          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => document.getElementById('file-upload').click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--accent)' : file ? 'var(--green)' : 'var(--border)'}`,
              borderRadius: 12, padding: '2.5rem', textAlign: 'center', cursor: 'pointer',
              background: dragOver ? 'var(--accent-glow)' : file ? 'var(--green-dim)' : 'var(--bg-dark)',
              transition: 'all 0.2s', marginBottom: '1.5rem',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{file ? '📄' : '☁️'}</div>
            <div style={{ fontWeight: 600, marginBottom: 6, color: file ? 'var(--green)' : 'var(--text-primary)' }}>
              {file ? file.name : 'Drop PDF here or click to browse'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Supports PDF files only'}
            </div>
            <input id="file-upload" type="file" accept=".pdf" onChange={(e) => handleFile(e.target.files[0])} style={{ display: 'none' }} />
          </div>

          <button type="submit" disabled={!file || loading} className="btn-full" style={{ fontSize: '1rem', padding: '0.85rem' }}>
            {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> AI is analyzing resume...</> : '🔍 Analyze Resume'}
          </button>
        </form>

        {result && (
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', animation: 'slideDown 0.4s ease-out' }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem' }}>🤖 AI Insights</div>

            {/* Score */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', padding: '1.25rem', background: 'var(--bg-dark)', borderRadius: 10 }}>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: '3rem', fontWeight: 800, color: result.score >= 80 ? 'var(--green)' : result.score >= 60 ? 'var(--yellow)' : 'var(--red)', lineHeight: 1 }}>{result.score}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/ 100</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Resume Match Score</div>
                <div className="score-bar-track">
                  <div className="score-bar-fill" style={{ width: `${result.score}%` }} />
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  {result.score >= 80 ? 'Excellent candidate' : result.score >= 60 ? 'Good potential' : 'Needs improvement'}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div style={{ marginBottom: '1.25rem', padding: '1.25rem', background: 'var(--bg-dark)', borderRadius: 10, borderLeft: '3px solid var(--accent)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Summary</div>
              <div style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{result.summary}</div>
            </div>

            {/* Skills */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Detected Skills</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {result.skills?.map((skill, i) => (
                  <span key={i} className="badge badge-role" style={{ padding: '5px 12px', fontSize: '0.82rem' }}>{skill}</span>
                ))}
              </div>
            </div>

            {/* Save to Pipeline */}
            {!showSaveForm ? (
              <button onClick={() => setShowSaveForm(true)} className="btn-full">➕ Add to Recruitment Pipeline</button>
            ) : (
              <form onSubmit={handleSave} style={{ padding: '1.25rem', background: 'var(--bg-dark)', borderRadius: 10, border: '1px solid var(--border-accent)' }}>
                <div style={{ fontWeight: 600, marginBottom: '1rem' }}>Save Candidate Details</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input value={saveForm.name} onChange={(e) => setSaveForm({ ...saveForm, name: e.target.value })} placeholder="John Doe" required />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={saveForm.email} onChange={(e) => setSaveForm({ ...saveForm, email: e.target.value })} placeholder="john@example.com" required />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" disabled={saving}>{saving ? 'Saving...' : '✅ Save to Pipeline'}</button>
                  <button type="button" className="btn-secondary" onClick={() => setShowSaveForm(false)}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
