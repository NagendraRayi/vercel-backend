import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Search, Download, FileText, CheckCircle } from 'lucide-react';

const Reports = () => {
  const { apiFetch, user } = useAuth();
  const [reportsData, setReportsData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [department, setDepartment] = useState('All');
  const [search, setSearch] = useState('');

  const isAdmin = user && user.role === 'admin';

  const fetchFiltersAndData = async () => {
    try {
      setLoading(true);
      
      // Load departments for filter dropdown
      const depts = await apiFetch('/departments');
      setDepartments(depts);

      // Load initial historical records
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (department !== 'All') queryParams.append('department', department);

      const records = await apiFetch(`/attendance/all-history?${queryParams.toString()}`);
      setReportsData(records);
    } catch (err) {
      console.error('Failed to load reports dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchFiltersAndData();
    }
  }, [startDate, endDate, department, isAdmin]);

  // Apply keyword search locally for real-time responsiveness
  const filteredData = reportsData.filter(row => {
    if (search) {
      const s = search.toLowerCase();
      return (
        row.employeeName.toLowerCase().includes(s) ||
        row.designation.toLowerCase().includes(s) ||
        row.status.toLowerCase().includes(s) ||
        row.location.toLowerCase().includes(s) ||
        row.date.includes(s)
      );
    }
    return true;
  });

  const exportCSV = () => {
    if (filteredData.length === 0) return;

    // Header
    const headers = ['Employee Name', 'Department', 'Designation', 'Date', 'Clock In', 'Clock Out', 'Status', 'Location'];
    const rows = filteredData.map(row => [
      `"${row.employeeName.replace(/"/g, '""')}"`,
      `"${row.department.replace(/"/g, '""')}"`,
      `"${row.designation.replace(/"/g, '""')}"`,
      row.date,
      row.clockIn,
      row.clockOut || 'N/A',
      row.status,
      `"${row.location.replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `staff_attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAdmin) {
    return (
      <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--danger)' }}>
        <p>Access Denied. You do not have permissions to access administrative reports.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '700' }}>Operations Reports</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Query complete clock-in entries across the workforce and audit compliance logs.
          </p>
        </div>

        <button 
          onClick={exportCSV} 
          disabled={filteredData.length === 0} 
          className="btn btn-primary"
        >
          <Download size={16} /> Export to CSV
        </button>
      </div>

      {/* Query Filters */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '25px', textAlign: 'left' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Department Branch</label>
            <select
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="form-input"
            >
              <option value="All">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Search Query</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search staff, location..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '34px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table container */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <p style={{ padding: '40px', color: 'var(--text-secondary)' }}>Querying operation logs...</p>
        ) : filteredData.length === 0 ? (
          <p style={{ padding: '40px', color: 'var(--text-muted)' }}>No operations logs match your current search.</p>
        ) : (
          <div className="table-container" style={{ margin: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Status</th>
                  <th>Verification GPS</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, index) => (
                  <tr key={index}>
                    <td><strong>{row.employeeName}</strong></td>
                    <td>{row.department}</td>
                    <td>{row.designation}</td>
                    <td>{row.date}</td>
                    <td>{row.clockIn}</td>
                    <td>{row.clockOut || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Missed / Active</span>}</td>
                    <td>
                      <span className={`badge badge-${row.status.toLowerCase()}`}>{row.status}</span>
                    </td>
                    <td style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{row.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
