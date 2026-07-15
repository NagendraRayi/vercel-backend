import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, Shield, User, Sun, Moon, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { login, theme, toggleTheme } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('employee'); // employee or admin
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState('login'); // 'login' | 'forgot' | 'reset'
  const [resetToken, setResetToken] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      setView('reset');
      // Clean query parameters from URL without reloading page
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError('Please fill in all credentials.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(trimmedEmail, password, selectedRole);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000/api'
        : 'http://54.163.58.47/api';
      const res = await fetch(`${apiBase}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server error: Received non-JSON response (${res.status}). Ensure the backend is running.`);
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send reset link.');
      }
      setSuccessMessage('Password reset link sent! Check the Email log in your Dashboard.');
      setError('');
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
      setSuccessMessage('');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000/api'
        : 'http://54.163.58.47/api';
      const res = await fetch(`${apiBase}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password })
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server error: Received non-JSON response (${res.status}). Ensure the backend is running.`);
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password.');
      }
      setSuccessMessage('Password reset successful! Redirecting to login...');
      setError('');
      setTimeout(() => {
        setSuccessMessage('');
        setView('login');
        setPassword('');
      }, 3000);
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
      setSuccessMessage('');
    } finally {
      setLoading(false);
    }
  };

  const autofillDemo = (role) => {
    setSelectedRole(role);
    if (role === 'admin') {
      setEmail('admin@company.com');
      setPassword('admin123');
    } else {
      setEmail('employee@company.com');
      setPassword('employee123');
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      position: 'relative',
      background: 'var(--bg-primary)'
    }}>
      {/* Theme Toggle in Login */}
      <button
        onClick={toggleTheme}
        className="btn btn-secondary"
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '10px',
          borderRadius: '50%'
        }}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Background glowing blobs for aesthetic depth */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(0,0,0,0) 70%)',
        top: '20%',
        left: '25%',
        filter: 'blur(50px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(0,0,0,0) 70%)',
        bottom: '20%',
        right: '25%',
        filter: 'blur(50px)',
        pointerEvents: 'none'
      }} />

      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '40px 30px',
        zIndex: 5,
        textAlign: 'center'
      }}>
        {/* Render View: login */}
        {view === 'login' && (
          <>
            {/* Portal Header */}
            <div style={{ marginBottom: '30px' }}>
              <div style={{
                display: 'inline-flex',
                padding: '14px',
                borderRadius: '16px',
                background: 'var(--bg-tertiary)',
                color: 'var(--accent-primary)',
                marginBottom: '15px'
              }}>
                <LogIn size={28} />
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
                Welcome Back
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Enter details to access your workspace
              </p>
            </div>

            {/* Role Selector Tabs */}
            {/* <div style={{
              display: 'flex',
              background: 'var(--bg-tertiary)',
              padding: '4px',
              borderRadius: '10px',
              marginBottom: '25px'
            }}>
              <button
                onClick={() => { setSelectedRole('employee'); setError(''); setSuccessMessage(''); }}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: 'none',
                  borderRadius: '8px',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: selectedRole === 'employee' ? 'var(--accent-primary)' : 'transparent',
                  color: selectedRole === 'employee' ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease'
                }}
              >
                <User size={14} /> Employee
              </button>
              <button
                onClick={() => { setSelectedRole('admin'); setError(''); setSuccessMessage(''); }}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: 'none',
                  borderRadius: '8px',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: selectedRole === 'admin' ? 'var(--accent-primary)' : 'transparent',
                  color: selectedRole === 'admin' ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Shield size={14} /> Administrator
              </button>
            </div> */}

            {error && (
              <div style={{
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                marginBottom: '20px',
                textAlign: 'left'
              }}>
                {error}
              </div>
            )}

            {successMessage && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                marginBottom: '20px',
                textAlign: 'left'
              }}>
                {successMessage}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }} />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '42px' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Password</label>
                  <a
                    onClick={() => { setView('forgot'); setError(''); setSuccessMessage(''); }}
                    style={{
                      fontSize: '12px',
                      color: 'var(--accent-primary)',
                      cursor: 'pointer',
                      fontWeight: 500,
                      textDecoration: 'none'
                    }}
                  >
                    Forgot Password?
                  </a>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '42px', paddingRight: '42px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', padding: '12px', marginTop: '5px' }}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            {/* Demo Accounts Panel */}
            <div style={{
              marginTop: '30px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-color)'
            }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 500 }}>
                DEMO ACCESS QUICK CONNECT
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => autofillDemo('employee')}
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '11px', padding: '8px' }}
                >
                  Fill Employee
                </button>
                <button
                  onClick={() => autofillDemo('admin')}
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '11px', padding: '8px' }}
                >
                  Fill Admin
                </button>
              </div>
            </div>
          </>
        )}

        {/* Render View: forgot */}
        {view === 'forgot' && (
          <>
            {/* Header */}
            <div style={{ marginBottom: '30px' }}>
              <div style={{
                display: 'inline-flex',
                padding: '14px',
                borderRadius: '16px',
                background: 'var(--bg-tertiary)',
                color: 'var(--accent-primary)',
                marginBottom: '15px'
              }}>
                <Lock size={28} />
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
                Forgot Password
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Enter your email address to receive a simulated reset link
              </p>
            </div>

            {error && (
              <div style={{
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                marginBottom: '20px',
                textAlign: 'left'
              }}>
                {error}
              </div>
            )}

            {successMessage && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                marginBottom: '20px',
                textAlign: 'left'
              }}>
                {successMessage}
              </div>
            )}

            {/* Forgot Form */}
            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }} />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '42px' }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', padding: '12px', marginTop: '5px' }}
              >
                {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
              </button>
            </form>

            <div style={{ marginTop: '20px' }}>
              <a
                onClick={() => { setView('login'); setError(''); setSuccessMessage(''); }}
                style={{
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.color = 'var(--text-primary)'}
                onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}
              >
                Back to Sign In
              </a>
            </div>
          </>
        )}

        {/* Render View: reset */}
        {view === 'reset' && (
          <>
            {/* Header */}
            <div style={{ marginBottom: '30px' }}>
              <div style={{
                display: 'inline-flex',
                padding: '14px',
                borderRadius: '16px',
                background: 'var(--bg-tertiary)',
                color: 'var(--accent-primary)',
                marginBottom: '15px'
              }}>
                <Shield size={28} />
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
                Reset Password
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Please choose a new secure password
              </p>
            </div>

            {error && (
              <div style={{
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                marginBottom: '20px',
                textAlign: 'left'
              }}>
                {error}
              </div>
            )}

            {successMessage && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                marginBottom: '20px',
                textAlign: 'left'
              }}>
                {successMessage}
              </div>
            )}

            {/* Reset Form */}
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '42px', paddingRight: '42px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', padding: '12px', marginTop: '5px' }}
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>

            <div style={{ marginTop: '20px' }}>
              <a
                onClick={() => { setView('login'); setError(''); setSuccessMessage(''); }}
                style={{
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.color = 'var(--text-primary)'}
                onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}
              >
                Back to Sign In
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
