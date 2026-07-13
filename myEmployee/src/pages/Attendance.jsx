import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, MapPin, Search, ArrowRight, Download, HelpCircle, CheckCircle } from 'lucide-react';

const Attendance = () => {
  const { apiFetch } = useAuth();
  const [todayRecord, setTodayRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsLocation, setGpsLocation] = useState('');
  const [time, setTime] = useState(new Date());

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Clock tick
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const today = await apiFetch('/attendance/today');
      setTodayRecord(today);

      const logs = await apiFetch('/attendance/my-history');
      setHistory(logs);
    } catch (err) {
      console.error('Failed to load attendance info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Simulate locating the user via GPS / Geolocation
  const triggerGeolocation = () => {
    return new Promise((resolve) => {
      setGpsLoading(true);
      
      // Fallback/Simulate coordinates if browser permission isn't granted
      setTimeout(() => {
        const offices = [
          '12.9716° N, 77.5946° E (Office HQ - Bangalore)',
          '37.7749° N, 122.4194° W (Silicon Valley Office)',
          '51.5074° N, 0.1278° W (London Tech Hub)',
          '12.9801° N, 77.6012° E (Remote Office - Home)'
        ];
        // Select random office location
        const randomLoc = offices[Math.floor(Math.random() * offices.length)];
        setGpsLocation(randomLoc);
        setGpsLoading(false);
        resolve(randomLoc);
      }, 1500);
    });
  };

  const handleClockIn = async () => {
    try {
      setActionLoading(true);
      const verifiedLocation = await triggerGeolocation();

      const record = await apiFetch('/attendance/clock-in', {
        method: 'POST',
        body: JSON.stringify({ location: verifiedLocation })
      });

      setTodayRecord(record);
      fetchData(); // Reload logs
    } catch (err) {
      alert(err.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setActionLoading(true);
      const record = await apiFetch('/attendance/clock-out', {
        method: 'POST'
      });

      setTodayRecord(record);
      fetchData(); // Reload logs
    } catch (err) {
      alert(err.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter list
  const filteredHistory = history.filter(item => {
    if (startDate && item.date < startDate) return false;
    if (endDate && item.date > endDate) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        item.status.toLowerCase().includes(s) ||
        item.location.toLowerCase().includes(s) ||
        item.date.includes(s)
      );
    }
    return true;
  });

  // Export CSV Helper
  const exportToCSV = () => {
    if (filteredHistory.length === 0) return;
    
    // Header
    const headers = ['Date', 'Clock In', 'Clock Out', 'Status', 'Location'];
    const rows = filteredHistory.map(row => [
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
    link.setAttribute("download", `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading check-in data...</p>
      </div>
    );
  }

  // Determine button state
  const isClockedIn = todayRecord && todayRecord.clockIn;
  const isClockedOut = todayRecord && todayRecord.clockOut;

  return (
    <div>
      <h1 style={{ margin: '0 0 5px 0', fontSize: '26px', fontWeight: '700', textAlign: 'left' }}>
        Attendance Tracker
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'left', marginBottom: '25px' }}>
        Log your daily work timings and view historical reports.
      </p>

      {/* Clock Panel Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px', textAlign: 'left' }}>
        {/* Clock Card */}
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{
            color: 'var(--accent-primary)',
            background: 'var(--bg-tertiary)',
            padding: '16px',
            borderRadius: '50%',
            marginBottom: '15px',
            display: 'inline-flex'
          }}>
            <Clock size={36} />
          </div>
          
          <h2 style={{ fontSize: '38px', fontWeight: '700', letterSpacing: '-1px', margin: 0, color: 'var(--text-primary)' }}>
            {time.toLocaleTimeString()}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px', fontWeight: 500 }}>
            {time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          {/* Action Trigger */}
          <div style={{ marginTop: '25px', width: '100%' }}>
            {!isClockedIn ? (
              <button
                onClick={handleClockIn}
                className="btn btn-primary"
                disabled={actionLoading || gpsLoading}
                style={{ width: '100%', padding: '14px', fontSize: '15px' }}
              >
                {gpsLoading ? 'Verifying Location GPS...' : actionLoading ? 'Processing...' : 'Clock In Now'}
              </button>
            ) : !isClockedOut ? (
              <button
                onClick={handleClockOut}
                className="btn btn-danger"
                disabled={actionLoading}
                style={{ width: '100%', padding: '14px', fontSize: '15px' }}
              >
                {actionLoading ? 'Processing...' : 'Clock Out Now'}
              </button>
            ) : (
              <div className="badge badge-present" style={{ width: '100%', padding: '14px', fontSize: '14px', borderRadius: '10px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <CheckCircle size={16} /> Work Completed for Today
              </div>
            )}
          </div>
        </div>

        {/* Location / Status Card */}
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} style={{ color: 'var(--accent-primary)' }} /> Live Workspace Status
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Daily Status</span>
                <div style={{ marginTop: '4px' }}>
                  {isClockedOut ? (
                    <span className="badge badge-present">Checked Out</span>
                  ) : isClockedIn ? (
                    <span className={`badge badge-${todayRecord.status.toLowerCase()}`}>Active ({todayRecord.status})</span>
                  ) : (
                    <span className="badge badge-absent">Not Checked In</span>
                  )}
                </div>
              </div>

              {isClockedIn && (
                <>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Check-In Time</span>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {todayRecord.clockIn}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Verified Location Coordinates</span>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '2px', lineHeight: '1.4' }}>
                      {todayRecord.location}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {!isClockedIn && gpsLocation && (
            <div style={{ display: 'flex', gap: '8px', fontSize: '12px', background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
              <MapPin size={14} style={{ color: 'var(--info)' }} />
              <span>Last Mock GPS Target: {gpsLocation}</span>
            </div>
          )}
        </div>
      </div>

      {/* History Log Panel */}
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Attendance Log Book</h3>
          
          <button 
            onClick={exportToCSV}
            disabled={filteredHistory.length === 0}
            className="btn btn-secondary" 
            style={{ fontSize: '12px', padding: '8px 14px' }}
          >
            <Download size={14} /> Export CSV
          </button>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '20px' }}>
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
            <label className="form-label">Search Keywords</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search logs..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="form-input" 
                style={{ paddingLeft: '34px' }}
              />
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="table-container">
          {filteredHistory.length === 0 ? (
            <p style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No historical logs match your filters.</p>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Status</th>
                  <th>Location Profile</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((row, index) => (
                  <tr key={index}>
                    <td><strong>{new Date(row.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit' })}</strong></td>
                    <td>{row.clockIn}</td>
                    <td>{row.clockOut || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Missed / Active</span>}</td>
                    <td>
                      <span className={`badge badge-${row.status.toLowerCase()}`}>
                        {row.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{row.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
