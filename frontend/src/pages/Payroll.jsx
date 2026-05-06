import React, { useState, useEffect } from 'react';

const API = 'http://127.0.0.1:8000';
const authHeaders = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });

export default function Payroll() {
  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedEmp, setSelectedEmp] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API}/employees/`, { headers: authHeaders() });
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const fetchPayrollForEmp = async (empId) => {
    if (!empId) { setPayrolls([]); return; }
    try {
      const res = await fetch(`${API}/payroll/${encodeURIComponent(empId)}`, { headers: authHeaders() });
      const data = await res.json();
      setPayrolls(data.payrolls || []);
    } catch { setPayrolls([]); }
  };

  const handleEmpChange = (e) => {
    setSelectedEmp(e.target.value);
    fetchPayrollForEmp(e.target.value);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true); setSuccess(''); setError('');
    const form = e.target;
    const payload = { employee_id: form.employee_id.value, month: form.month.value, salary: parseFloat(form.salary.value) };
    try {
      const res = await fetch(`${API}/payroll/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed to save record');
      setSuccess('Payroll record saved!');
      form.reset();
      fetchPayrollForEmp(payload.employee_id);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const totalPayroll = payrolls.reduce((a, p) => a + (p.salary || 0), 0);

  if (loading) return <div className="loading-screen"><div className="spinner" />Loading payroll...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Payroll Management</h1>
          <p>Manage salary records and payment history</p>
        </div>
      </div>

      {success && <div className="success-banner">✅ {success}</div>}
      {error && <div className="error-banner">⚠️ {error}</div>}

      {/* Add Payroll */}
      <div className="panel" style={{ borderColor: 'var(--border-accent)' }}>
        <div className="panel-title">
          <div className="panel-title-icon" style={{ background: 'rgba(34,211,160,0.15)' }}>💰</div>
          Record Salary Payment
        </div>
        <form onSubmit={handleAdd}>
          <div className="form-grid">
            <div className="form-group">
              <label>Select Employee</label>
              <select name="employee_id" required onChange={handleEmpChange}>
                <option value="">-- Select Employee --</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.name} ({emp.department})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Payment Month</label>
              <input name="month" placeholder="e.g. April 2026" required />
            </div>
            <div className="form-group">
              <label>Amount (₹)</label>
              <input name="salary" type="number" step="0.01" min="0" placeholder="50000" required />
            </div>
            <div className="form-group" style={{ justifyContent: 'flex-end' }}>
              <label>&nbsp;</label>
              <button type="submit" disabled={submitting}>
                {submitting ? 'Processing...' : '💳 Record Payment'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Payroll History */}
      {selectedEmp && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Payment History — <span style={{ color: 'var(--accent)' }}>{selectedEmp}</span></h2>
            {payrolls.length > 0 && (
              <div style={{ background: 'var(--green-dim)', color: 'var(--green)', padding: '6px 16px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600 }}>
                Total: ₹{totalPayroll.toLocaleString()}
              </div>
            )}
          </div>
          <div className="table-container">
            {payrolls.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💸</div>
                <h3>No records found</h3>
                <p>No payroll records exist for this employee yet</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee</th>
                    <th>Month</th>
                    <th>Salary</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map((p, i) => (
                    <tr key={p._id}>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td style={{ fontWeight: 500 }}>{(() => {
                        const emp = employees.find(e => e._id === p.employee_id);
                        return emp ? emp.name : p.employee_id;
                      })()}</td>
                      <td>{p.month}</td>
                      <td style={{ fontWeight: 700, color: 'var(--green)' }}>₹{p.salary?.toLocaleString()}</td>
                      <td><span className="badge badge-excellent">Paid</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {!selectedEmp && (
        <div className="panel">
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <h3>Select an employee</h3>
            <p>Choose an employee above to view their payment history</p>
          </div>
        </div>
      )}
    </div>
  );
}
