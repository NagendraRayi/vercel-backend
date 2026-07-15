import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import LeaveRequests from './pages/LeaveRequests';
import Employees from './pages/Employees';
import Departments from './pages/Departments';
import Holidays from './pages/Holidays';
import Reports from './pages/Reports';

import { 
  LayoutDashboard, 
  Clock, 
  CalendarDays, 
  Users, 
  Building2, 
  CalendarRange, 
  FileSpreadsheet, 
  LogOut, 
  Sun, 
  Moon, 
  Menu, 
  UserCircle 
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout, theme, toggleTheme } = useAuth();
  
  const isAdmin = user && user.role === 'admin';

  return (
    <div className="sidebar">
      {/* Brand Logo */}
      <div className="sidebar-logo">
        <Clock size={24} />
        <span>StaffPortal</span>
      </div>

      {/* Nav List */}
      <ul className="sidebar-menu">
        <li>
          <a 
            onClick={() => setActiveTab('dashboard')} 
            className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} /> Dashboard
          </a>
        </li>
        <li>
          <a 
            onClick={() => setActiveTab('attendance')} 
            className={`sidebar-item ${activeTab === 'attendance' ? 'active' : ''}`}
          >
            <Clock size={18} /> Attendance
          </a>
        </li>
        <li>
          <a 
            onClick={() => setActiveTab('leaves')} 
            className={`sidebar-item ${activeTab === 'leaves' ? 'active' : ''}`}
          >
            <CalendarDays size={18} /> Leaves
          </a>
        </li>
        
        {/* Admin Specific */}
        {isAdmin && (
          <>
            <li style={{ height: '1px', background: 'var(--border-color)', margin: '10px 0' }} />
            <li style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, paddingLeft: '16px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Management
            </li>
            <li>
              <a 
                onClick={() => setActiveTab('employees')} 
                className={`sidebar-item ${activeTab === 'employees' ? 'active' : ''}`}
              >
                <Users size={18} /> Employees
              </a>
            </li>
            <li>
              <a 
                onClick={() => setActiveTab('departments')} 
                className={`sidebar-item ${activeTab === 'departments' ? 'active' : ''}`}
              >
                <Building2 size={18} /> Departments
              </a>
            </li>
            <li>
              <a 
                onClick={() => setActiveTab('reports')} 
                className={`sidebar-item ${activeTab === 'reports' ? 'active' : ''}`}
              >
                <FileSpreadsheet size={18} /> Reports
              </a>
            </li>
          </>
        )}

        {/* Global Holidays */}
        <li style={{ height: '1px', background: 'var(--border-color)', margin: '10px 0' }} />
        <li>
          <a 
            onClick={() => setActiveTab('holidays')} 
            className={`sidebar-item ${activeTab === 'holidays' ? 'active' : ''}`}
          >
            <CalendarRange size={18} /> Holiday List
          </a>
        </li>
      </ul>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        {/* User Card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '10px', textOverflow: 'ellipsis', overflow: 'hidden' }}>
          <UserCircle size={24} style={{ color: 'var(--text-secondary)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', overflow: 'hidden', width: '100%' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '140px' }} title={user?.name}>
              {user?.name}
            </span>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {user?.role} Mode
            </span>
          </div>
        </div>

        {/* Settings buttons row */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={toggleTheme} 
            className="btn btn-secondary" 
            style={{ flex: 1, padding: '8px 0' }}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />} Theme
          </button>
          
          <button 
            onClick={logout} 
            className="btn btn-secondary" 
            style={{ flex: 1, padding: '8px 0', color: 'var(--danger)' }}
            title="Logout"
          >
            <LogOut size={15} /> Exit
          </button>
        </div>
      </div>
    </div>
  );
};

const ContentPane = ({ activeTab }) => {
  switch (activeTab) {
    case 'dashboard':
      return <Dashboard />;
    case 'attendance':
      return <Attendance />;
    case 'leaves':
      return <LeaveRequests />;
    case 'employees':
      return <Employees />;
    case 'departments':
      return <Departments />;
    case 'holidays':
      return <Holidays />;
    case 'reports':
      return <Reports />;
    default:
      return <Dashboard />;
  }
};

const AppContent = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0b0f19',
        color: '#ffffff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(99, 102, 241, 0.2)',
            borderTop: '3px solid var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 15px'
          }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <p style={{ fontFamily: 'sans-serif', fontSize: '14px', color: '#94a3b8' }}>Restoring workspace session...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Login Portal
  if (!user) {
    return <Login />;
  }

  return (
    <div className="app-container">
      {/* Mobile Top Navbar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'none',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 200
      }} className="mobile-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: '700' }}>
          <Clock size={20} style={{ color: 'var(--accent-primary)' }} />
          <span>StaffPortal</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          <Menu size={22} />
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-nav {
            display: flex !important;
          }
          .sidebar {
            transform: translateX(${mobileMenuOpen ? '0' : '-100%'});
            top: 60px;
            width: 240px;
            box-shadow: 10px 0 30px rgba(0,0,0,0.3);
          }
        }
      `}</style>

      {/* Navigation Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setMobileMenuOpen(false); }} />

      {/* Main Page Workspace */}
      <div className="main-content">
        <ContentPane activeTab={activeTab} />
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
