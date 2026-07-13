import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, UserCheck, Calendar, FileText, Clock, Percent, AlertCircle, Mail, Trash2 } from 'lucide-react';

const Dashboard = () => {
  const { apiFetch, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [emails, setEmailLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user && user.role === 'admin';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const statsData = await apiFetch('/reports/stats');
        setStats(statsData);

        if (isAdmin) {
          const emailLogs = await apiFetch('/emails');
          setEmailLogs(emailLogs);
        }
      } catch (err) {
        setError('Failed to load dashboard metrics.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAdmin]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--danger)' }}>
        <AlertCircle style={{ marginBottom: '10px' }} size={32} />
        <p>{error}</p>
      </div>
    );
  }

  // --- SVG Chart Helpers ---
  
  // Custom Area Chart for Attendance Trend
  const renderTrendChart = (trendData) => {
    if (!trendData || trendData.length === 0) return null;
    
    const chartHeight = 160;
    const chartWidth = 500;
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 25;
    
    const graphWidth = chartWidth - paddingLeft - paddingRight;
    const graphHeight = chartHeight - paddingTop - paddingBottom;
    
    const maxVal = Math.max(...trendData.map(d => d.presentCount), 4);
    
    // Generate coordinate pairs
    const coords = trendData.map((d, i) => {
      const x = paddingLeft + (i * (graphWidth / (trendData.length - 1)));
      const y = paddingTop + (graphHeight - (d.presentCount / maxVal) * graphHeight);
      return { x, y, val: d.presentCount, label: d.label };
    });

    // Make smooth curve path
    let pathD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i-1];
      const curr = coords[i];
      // control points for bezier
      const cp1x = prev.x + (curr.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (curr.x - prev.x) / 2;
      const cp2y = curr.y;
      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }

    // Path for gradient area fill underneath the curve
    const areaD = `${pathD} L ${coords[coords.length - 1].x} ${chartHeight - paddingBottom} L ${coords[0].x} ${chartHeight - paddingBottom} Z`;

    return (
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="100%">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map((ratio, index) => {
          const y = paddingTop + ratio * graphHeight;
          const gridVal = Math.round(maxVal * (1 - ratio));
          return (
            <g key={index}>
              <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
              <text x={paddingLeft - 8} y={y + 4} fill="var(--text-muted)" fontSize="10" textAnchor="end">{gridVal}</text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#areaGrad)" />

        {/* Stroke line */}
        <path d={pathD} fill="none" stroke="var(--accent-primary)" strokeWidth="3" />

        {/* X Axis Labels & Dots */}
        {coords.map((c, i) => (
          <g key={i}>
            <circle cx={c.x} cy={c.y} r="4" fill="var(--bg-secondary)" stroke="var(--accent-primary)" strokeWidth="2.5" />
            {/* Value indicator tooltip */}
            <text x={c.x} y={c.y - 8} fill="var(--text-primary)" fontSize="9" fontWeight="600" textAnchor="middle">{c.val}</text>
            {/* Axis Label */}
            <text x={c.x} y={chartHeight - 8} fill="var(--text-secondary)" fontSize="9" textAnchor="middle">
              {c.label.split(' ')[0]}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  // Custom Donut Chart for Departments
  const renderDonutChart = (deptData) => {
    if (!deptData || deptData.length === 0) return null;
    
    const totalCount = deptData.reduce((acc, d) => acc + d.count, 0);
    if (totalCount === 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '140px', color: 'var(--text-muted)' }}>
          No employees enrolled
        </div>
      );
    }

    const size = 150;
    const radius = 50;
    const strokeWidth = 14;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;
    
    let currentOffset = 0;
    const palette = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#ec4899'];

    const chartSlices = deptData.map((d, index) => {
      const percentage = (d.count / totalCount) * 100;
      const strokeDashoffset = circumference - (percentage / 100) * circumference;
      const rotation = (currentOffset / totalCount) * 360;
      currentOffset += d.count;

      return {
        ...d,
        percentage,
        strokeDashoffset,
        rotation,
        color: palette[index % palette.length]
      };
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {chartSlices.map((slice, i) => (
              <circle
                key={i}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={slice.strokeDashoffset}
                transform={`rotate(${slice.rotation - 90} ${center} ${center})`}
                style={{
                  transition: 'stroke-dashoffset 0.8s ease',
                  cursor: 'pointer'
                }}
              />
            ))}
            {/* Center label */}
            <circle cx={center} cy={center} r={radius - strokeWidth / 2} fill="var(--bg-secondary)" />
            <text x={center} y={center - 2} textAnchor="middle" fill="var(--text-secondary)" fontSize="10" fontWeight="500">
              TOTAL
            </text>
            <text x={center} y={center + 12} textAnchor="middle" fill="var(--text-primary)" fontSize="18" fontWeight="700">
              {totalCount}
            </text>
          </svg>
        </div>
        
        {/* Legend */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
          {chartSlices.map((slice, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: slice.color, flexShrink: 0 }} />
              <span style={{
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '90px'
              }} title={slice.name}>
                {slice.name}
              </span>
              <strong style={{ marginLeft: 'auto' }}>{slice.count}</strong>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '700', textAlign: 'left' }}>
            Welcome, {user ? user.name : 'User'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'left', marginTop: '4px' }}>
            {isAdmin ? 'System Administrative Dashboard' : `${user.designation} • ${user.department}`}
          </p>
        </div>
      </div>

      {isAdmin ? (
        // ------------------ ADMIN VIEW ------------------
        <>
          {/* Admin Metrics Grid */}
          <div className="metrics-grid">
            <div className="glass-panel metric-card">
              <div className="metric-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
                <Users size={22} />
              </div>
              <div className="metric-details">
                <span className="metric-title">Total Employees</span>
                <span className="metric-value">{stats.totalEmployees}</span>
              </div>
            </div>
            <div className="glass-panel metric-card">
              <div className="metric-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
                <UserCheck size={22} />
              </div>
              <div className="metric-details">
                <span className="metric-title">Present Today</span>
                <span className="metric-value">{stats.presentToday}</span>
              </div>
            </div>
            <div className="glass-panel metric-card">
              <div className="metric-icon" style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: 'var(--info)' }}>
                <Calendar size={22} />
              </div>
              <div className="metric-details">
                <span className="metric-title">On Leave Today</span>
                <span className="metric-value">{stats.onLeaveToday}</span>
              </div>
            </div>
            <div className="glass-panel metric-card">
              <div className="metric-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
                <FileText size={22} />
              </div>
              <div className="metric-details">
                <span className="metric-title">Pending Approvals</span>
                <span className="metric-value">{stats.pendingLeaves}</span>
              </div>
            </div>
          </div>

          {/* Admin Analytics Grid (Charts) */}
          <div className="charts-grid">
            <div className="glass-panel chart-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="chart-header">
                <h3 className="chart-title">Weekly Attendance Rate</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Daily Check-ins</span>
              </div>
              <div style={{ flexGrow: 1, minHeight: '180px', display: 'flex', alignItems: 'center' }}>
                {renderTrendChart(stats.attendanceTrend)}
              </div>
            </div>

            <div className="glass-panel chart-card">
              <div className="chart-header">
                <h3 className="chart-title">By Department</h3>
              </div>
              <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {renderDonutChart(stats.deptDistribution)}
              </div>
            </div>
          </div>

          {/* Simulated Email logs verification panel */}
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <Mail size={18} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Simulated Notifications Sent (Developer Mailbox Log)</h3>
            </div>
            
            {emails.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No email notifications sent yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '250px', overflowY: 'auto', paddingRight: '5px' }}>
                {emails.map((email, idx) => (
                  <div key={idx} style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    padding: '14px',
                    borderRadius: '10px',
                    fontSize: '13px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      <span><strong>To:</strong> {email.recipient}</span>
                      <span>{new Date(email.sentAt).toLocaleString()}</span>
                    </div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                      Subject: {email.subject}
                    </div>
                    <div 
                      style={{ 
                        color: 'var(--text-secondary)', 
                        padding: '10px', 
                        background: 'var(--bg-primary)', 
                        borderRadius: '6px', 
                        fontSize: '12px', 
                        lineHeight: '1.4'
                      }}
                      dangerouslySetInnerHTML={{ __html: email.body }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        // ------------------ EMPLOYEE VIEW ------------------
        <>
          {/* Employee Metrics Grid */}
          <div className="metrics-grid">
            <div className="glass-panel metric-card">
              <div className="metric-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
                <Clock size={22} />
              </div>
              <div className="metric-details">
                <span className="metric-title">Days Clocked In</span>
                <span className="metric-value">{stats.totalWorkedDays}</span>
              </div>
            </div>
            <div className="glass-panel metric-card">
              <div className="metric-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
                <AlertCircle size={22} />
              </div>
              <div className="metric-details">
                <span className="metric-title">Days Late</span>
                <span className="metric-value">{stats.totalLateDays}</span>
              </div>
            </div>
            <div className="glass-panel metric-card">
              <div className="metric-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
                <Percent size={22} />
              </div>
              <div className="metric-details">
                <span className="metric-title">Punctuality</span>
                <span className="metric-value">{stats.attendanceRate}%</span>
              </div>
            </div>
            <div className="glass-panel metric-card">
              <div className="metric-icon" style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: 'var(--info)' }}>
                <FileText size={22} />
              </div>
              <div className="metric-details">
                <span className="metric-title">Pending Requests</span>
                <span className="metric-value">{stats.pendingLeaves}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px', textAlign: 'left' }}>
            {/* Leaves remaining progress bar cards */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>Leave Balances Remaining</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span>Casual Leave</span>
                    <strong>{stats.leavesRemaining.casual} / 10 Days</strong>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(stats.leavesRemaining.casual / 10) * 100}%`, background: 'var(--accent-primary)', borderRadius: '4px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span>Sick Leave</span>
                    <strong>{stats.leavesRemaining.sick} / 8 Days</strong>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(stats.leavesRemaining.sick / 8) * 100}%`, background: 'var(--success)', borderRadius: '4px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span>Annual Leave</span>
                    <strong>{stats.leavesRemaining.annual} / 15 Days</strong>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(stats.leavesRemaining.annual / 15) * 100}%`, background: 'var(--info)', borderRadius: '4px' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Past 7 days attendance summary */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>Recent Attendance Log</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {stats.personalTrend.map((t, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    fontSize: '13px',
                    borderLeft: `4px solid ${
                      t.status === 'Present' ? 'var(--success)' : 
                      t.status === 'Late' ? 'var(--warning)' : 'var(--danger)'
                    }`
                  }}>
                    <div>
                      <div style={{ fontWeight: '500' }}>{new Date(t.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: '2-digit' })}</div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        In: {t.clockIn} • Out: {t.clockOut}
                      </span>
                    </div>
                    <div>
                      <span className={`badge badge-${t.status.toLowerCase()}`}>{t.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
