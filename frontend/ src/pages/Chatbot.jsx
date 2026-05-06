import React, { useState } from 'react';

const API = 'http://127.0.0.1:8000';
const authHeaders = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });

export default function Chatbot() {
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingEval, setLoadingEval] = useState(false);

  const generateQuestions = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true); setFeedback(null); setAnswer(''); setCurrentQuestion('');
    try {
      const res = await fetch(`${API}/chatbot/generate-questions/`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify({ topic }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to generate questions');
      }
      const data = await res.json();
      setQuestions(data.questions || []);
      setCurrentQuestion(data.questions?.[0] || '');
    } catch (err) { setQuestions([]); setError(err.message || 'Failed to generate'); }
    finally { setLoading(false); }
  };

  const evaluateAnswer = async (e) => {
    e.preventDefault();
    if (!answer.trim() || !currentQuestion) return;
    setLoadingEval(true); setFeedback(null);
    try {
      const res = await fetch(`${API}/chatbot/evaluate-answer/`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify({ question: currentQuestion, answer }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Evaluation failed');
      }
      setFeedback(await res.json());
    } catch (err) { setError(err.message || 'Evaluation failed'); }
    finally { setLoadingEval(false); }
  };

  const scoreColor = (s) => s >= 80 ? 'var(--green)' : s >= 60 ? 'var(--yellow)' : 'var(--red)';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>🤖 AI Interview Simulator</h1>
          <p>Generate technical interview questions and get AI-powered feedback on your answers</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left: Generate */}
        <div>
          <div className="panel">
            <div className="panel-title">
              <div className="panel-title-icon" style={{ background: 'rgba(79,142,247,0.15)' }}>🎯</div>
              Generate Questions
            </div>
            <form onSubmit={generateQuestions}>
              <div className="form-group">
                <label>Topic / Skill / Role</label>
                <input type="text" placeholder="e.g. React, Python, DevOps..." value={topic} onChange={(e) => setTopic(e.target.value)} />
              </div>
              <button type="submit" disabled={loading || !topic.trim()} className="btn-full">
                {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating...</> : '⚡ Generate Questions'}
              </button>
            </form>
          </div>

          {questions.length > 0 && (
            <div className="panel" style={{ marginTop: 0 }}>
              <div className="panel-title">📋 Questions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {questions.map((q, i) => (
                  <div
                    key={i}
                    onClick={() => { setCurrentQuestion(q); setFeedback(null); setAnswer(''); }}
                    style={{
                      padding: '0.75rem 1rem', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', lineHeight: 1.5,
                      background: currentQuestion === q ? 'rgba(79,142,247,0.1)' : 'var(--bg-dark)',
                      border: `1px solid ${currentQuestion === q ? 'var(--accent)' : 'var(--border)'}`,
                      color: currentQuestion === q ? 'var(--accent)' : 'var(--text-primary)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>Q{i + 1}.</span> {q}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Simulator */}
        <div className="panel" style={{ minHeight: 400 }}>
          <div className="panel-title">
            <div className="panel-title-icon" style={{ background: 'rgba(34,211,160,0.15)' }}>💬</div>
            Interview Simulator
          </div>

          {currentQuestion ? (
            <div>
              <div style={{ background: 'var(--bg-dark)', borderLeft: '3px solid var(--accent)', padding: '1rem 1.25rem', borderRadius: '0 8px 8px 0', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Question</div>
                <div style={{ fontSize: '1rem', lineHeight: 1.6 }}>{currentQuestion}</div>
              </div>

              <form onSubmit={evaluateAnswer}>
                <div className="form-group">
                  <label>Your Answer</label>
                  <textarea rows="6" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type your detailed answer here..." style={{ resize: 'vertical' }} />
                </div>
                <button type="submit" disabled={loadingEval || !answer.trim()}>
                  {loadingEval ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Evaluating...</> : '✅ Submit for AI Evaluation'}
                </button>
              </form>

              {feedback && (
                <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'var(--bg-dark)', borderRadius: 10, border: '1px solid var(--border)', animation: 'slideUp 0.3s ease-out' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>🤖 AI Evaluation</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: '2.5rem', fontWeight: 800, color: scoreColor(feedback.score), lineHeight: 1 }}>{feedback.score}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>/100</span>
                    </div>
                  </div>
                  <div className="score-bar-wrap" style={{ marginBottom: '1rem' }}>
                    <div className="score-bar-track">
                      <div className="score-bar-fill" style={{ width: `${feedback.score}%`, background: scoreColor(feedback.score) }} />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{feedback.feedback}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state" style={{ border: '2px dashed var(--border)' }}>
              <div className="empty-state-icon">🤖</div>
              <h3>Ready to simulate</h3>
              <p>Generate questions on the left, then select one to begin the interview</p>
            </div>
          )}
          {error && <div className="error-banner" style={{ marginTop: 12 }}>⚠️ {error}</div>}
        </div>
      </div>
    </div>
  );
}
