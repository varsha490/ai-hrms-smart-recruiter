import React, { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const authHeaders = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API}/employees/`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch employees');
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true); setSuccess(''); setError('');
    const form = e.target;
    const employee = { name: form.name.value, email: form.email.value, department: form.department.value, role: form.role.value };
    try {
      const res = await fetch(`${API}/employees/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(employee) });
      if (!res.ok) throw new Error('Failed to add employee');
      setSuccess('Employee added successfully!');
      form.reset();
      await fetchEmployees();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const deptColors = {
    Engineering: 'rgba(79,142,247,0.15)', HR: 'rgba(34,211,160,0.15)',
    Marketing: 'rgba(245,166,35,0.15)', Finance: 'rgba(139,92,246,0.15)',
    Sales: 'rgba(245,83,106,0.15)',
  };

  if (loading) return <div className="loading-screen"><div className="spinner" />Loading employees...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Employee Directory</h1>
          <p>Manage your organization's talent — {employees.length} employee{employees.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {success && <div className="success-banner">✅ {success}</div>}
      {error && <div className="error-banner">⚠️ {error}</div>}

      {/* Stats */}
      <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(79,142,247,0.15)' }}>👥</div>
          <div className="stat-card-title">Total Employees</div>
          <div className="stat-card-value">{employees.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(34,211,160,0.15)' }}>🏢</div>
          <div className="stat-card-title">Departments</div>
          <div className="stat-card-value">{new Set(employees.map(e => e.department)).size}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(245,166,35,0.15)' }}>💼</div>
          <div className="stat-card-title">Unique Roles</div>
          <div className="stat-card-value">{new Set(employees.map(e => e.role)).size}</div>
        </div>
      </div>

      {/* Add Employee Form */}
      <div className="panel" style={{ borderColor: 'var(--border-accent)' }}>
        <div className="panel-title">
          <div className="panel-title-icon" style={{ background: 'rgba(79,142,247,0.15)' }}>➕</div>
          Add New Employee
        </div>
        <form onSubmit={handleAdd}>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <input name="name" required placeholder="Jane Smith" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" required placeholder="jane@company.com" />
            </div>
            <div className="form-group">
              <label>Department</label>
              <input name="department" required placeholder="Engineering" />
            </div>
            <div className="form-group">
              <label>Role / Position</label>
              <input name="role" required placeholder="Senior Developer" />
            </div>
            <div className="form-group" style={{ justifyContent: 'flex-end' }}>
              <label>&nbsp;</label>
              <button type="submit" disabled={submitting}>{submitting ? 'Adding...' : '+ Add Employee'}</button>
            </div>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="table-container">
        {employees.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <h3>No employees yet</h3>
            <p>Add your first employee using the form above</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Role</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => (
                <tr key={emp._id}>
                  <td style={{ color: 'var(--text-muted)', width: 40 }}>{i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                        {emp.name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ fontWeight: 500 }}>{emp.name}</div>
                    </div>
                  </td>
                  <td>
                    <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, background: deptColors[emp.department] || 'rgba(255,255,255,0.08)', color: 'var(--text-primary)' }}>
                      {emp.department}
                    </span>
                  </td>
                  <td><span className="badge badge-role">{emp.role}</span></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{emp.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
