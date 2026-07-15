import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Plus, Trash2, CheckCircle, Clock } from 'lucide-react';

const Holidays = () => {
  const { apiFetch, user } = useAuth();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  const isAdmin = user && user.role === 'admin';
  const todayStr = new Date().toISOString().split('T')[0];

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const list = await apiFetch('/holidays');
      setHolidays(list);
    } catch (err) {
      console.error('Failed to load holiday list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleCreateHoliday = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name || !date) {
      setFormError('Holiday Name and Date are required.');
      return;
    }

    try {
      await apiFetch('/holidays', {
        method: 'POST',
        body: JSON.stringify({ name, date, description })
      });
      setModalOpen(false);
      setName('');
      setDate('');
      setDescription('');
      fetchHolidays();
    } catch (err) {
      setFormError(err.message || 'Failed to schedule holiday.');
    }
  };

  const handleDeleteHoliday = async (id) => {
    try {
      await apiFetch(`/holidays/${id}`, {
        method: 'DELETE'
      });
      fetchHolidays();
    } catch (err) {
      alert(err.message || 'Failed to delete holiday.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading calendar schedules...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '700' }}>Holiday Calendar</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Reference annual office closures and scheduled company leaves.
          </p>
        </div>
        
        {isAdmin && (
          <button onClick={() => { setModalOpen(true); setFormError(''); }} className="btn btn-primary">
            <Plus size={16} /> Schedule Holiday
          </button>
        )}
      </div>

      {/* Grid listing */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', textAlign: 'left' }}>
        {holidays.map(hol => {
          const isPast = hol.date < todayStr;
          const formattedDate = new Date(hol.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });

          return (
            <div 
              key={hol.id} 
              className="glass-panel" 
              style={{ 
                padding: '24px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                opacity: isPast ? 0.65 : 1,
                borderLeft: isPast ? '4px solid var(--text-muted)' : '4px solid var(--accent-primary)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: isPast ? 'var(--text-muted)' : 'var(--accent-primary)', fontWeight: '600', textTransform: 'uppercase' }}>
                    {isPast ? <CheckCircle size={12} /> : <Clock size={12} />}
                    {isPast ? 'Passed' : 'Upcoming'}
                  </span>
                  
                  {isAdmin && (
                    <button 
                      onClick={() => handleDeleteHoliday(hol.id)}
                      className="btn btn-secondary" 
                      style={{ padding: '4px', borderRadius: '4px', color: 'var(--danger)' }}
                      title="Delete Holiday"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>

                <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {hol.name}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '12px' }}>
                  {formattedDate}
                </p>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {hol.description || 'No additional details provided.'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Holiday Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '420px', textAlign: 'left' }}>
            <div className="modal-header">
              <h3 className="modal-title">Schedule Office closure</h3>
              <button onClick={() => setModalOpen(false)} className="modal-close">×</button>
            </div>

            {formError && (
              <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateHoliday} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Holiday Name</label>
                <input
                  type="text"
                  placeholder="e.g. Independence Day"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Closure Scope/Description</label>
                <textarea
                  placeholder="Details regarding holiday closure..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="form-input"
                  style={{ minHeight: '60px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Schedule Closure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Holidays;
