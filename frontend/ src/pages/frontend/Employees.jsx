import React, { useState, useEffect } from 'react';

const API = 'http://127.0.0.1:8001';
const authHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` });

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/employees/`, { headers: authHeaders() });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || `Failed to fetch employees (status ${res.status})`);
      }
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true); setError(''); setSuccess('');
    const form = e.target;
    const emp = {
      name: form.name.value,
      email: form.email.value,
      department: form.department.value || '',
      role: form.role.value || 'Employee',
      username: form.username.value || undefined
    };
    try {
      const res = await fetch(`${API}/employees/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(emp) });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || `Failed to add employee (status ${res.status})`);
      }
      setSuccess('Employee added successfully');
      form.reset();
      await fetchEmployees();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); }
    finally { setAdding(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Employee Directory</h1>
          <p>Manage your organization's talent — {employees.length} employees</p>
        </div>
      </div>

      {success && <div className="success-banner">✅ {success}</div>}
      {error && <div className="error-banner">⚠️ {error}</div>}

      <div className="grid-cards">
        <div className="stat-card">
          <div className="stat-card-icon">👥</div>
          <div className="stat-card-title">Total Employees</div>
          <div className="stat-card-value">{employees.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">🏢</div>
          <div className="stat-card-title">Departments</div>
          <div className="stat-card-value">{[...new Set(employees.map(e => e.department).filter(Boolean))].length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">🧾</div>
          <div className="stat-card-title">Unique Roles</div>
          <div className="stat-card-value">{[...new Set(employees.map(e => e.role).filter(Boolean))].length}</div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: '1rem' }}>
        <form onSubmit={handleAdd}>
          <div className="form-grid">
            <div className="form-group"><label>Full name</label><input name="name" required placeholder="Jane Doe" /></div>
            <div className="form-group"><label>Email</label><input name="email" type="email" required placeholder="jane@example.com" /></div>
            <div className="form-group"><label>Username (optional)</label><input name="username" placeholder="link to existing user" /></div>
            <div className="form-group"><label>Department</label><input name="department" placeholder="Engineering" /></div>
            <div className="form-group"><label>Role</label><input name="role" defaultValue="Employee" /></div>
            <div className="form-group" style={{ justifyContent: 'flex-end' }}>
              <label>&nbsp;</label>
              <button type="submit" disabled={adding}>{adding ? 'Adding...' : '+ Add New Employee'}</button>
            </div>
          </div>
        </form>
      </div>

      <h2 style={{ marginTop: '1.25rem' }}>All Employees</h2>
      {loading ? (
        <div className="loading-screen"><div className="spinner" /> Loading employees...</div>
      ) : (
        <div className="table-container">
          {!employees.length ? (
            <div className="empty-state"><div className="empty-state-icon">👥</div><h3>No employees yet</h3></div>
          ) : (
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Department</th><th>Role</th></tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp._id || emp.id || emp.email}>
                    <td>{emp.name}</td>
                    <td>{emp.email}</td>
                    <td>{emp.department || '-'}</td>
                    <td>{emp.role || 'Employee'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
