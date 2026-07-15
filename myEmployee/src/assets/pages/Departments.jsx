import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Landmark, Plus, Trash2, ShieldAlert, Award } from 'lucide-react';

const Departments = () => {
  const { apiFetch, user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [manager, setManager] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  const isAdmin = user && user.role === 'admin';

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const list = await apiFetch('/departments');
      setDepartments(list);
    } catch (err) {
      console.error('Failed to load departments list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreateDept = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name || !code) {
      setFormError('Department Name and Code are required.');
      return;
    }

    try {
      await apiFetch('/departments', {
        method: 'POST',
        body: JSON.stringify({ name, code, manager, description })
      });
      setModalOpen(false);
      setName('');
      setCode('');
      setManager('');
      setDescription('');
      fetchDepartments();
    } catch (err) {
      setFormError(err.message || 'Failed to create department.');
    }
  };

  const handleDeleteDept = async (id) => {
    try {
      await apiFetch(`/departments/${id}`, {
        method: 'DELETE'
      });
      fetchDepartments();
    } catch (err) {
      alert(err.message || 'Failed to delete department.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading departments registry...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '700' }}>Departments</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Configure organizational branches, designate managers, and view headcounts.
          </p>
        </div>
        
        {isAdmin && (
          <button onClick={() => { setModalOpen(true); setFormError(''); }} className="btn btn-primary">
            <Plus size={16} /> Add Department
          </button>
        )}
      </div>

      {/* Departments Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', textAlign: 'left' }}>
        {departments.map(dept => (
          <div key={dept.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '10px', borderRadius: '10px' }}>
                    <Landmark size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>{dept.name}</h3>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>CODE: {dept.code}</span>
                  </div>
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => handleDeleteDept(dept.id)}
                    className="btn btn-secondary" 
                    style={{ padding: '6px', borderRadius: '6px', color: 'var(--danger)' }}
                    title="Delete Department"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '15px' }}>
                {dept.description || 'No description provided.'}
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontWeight: '500' }}>
                <Award size={14} style={{ color: 'var(--warning)' }} />
                <span>Mgr: <strong>{dept.manager || 'Unassigned'}</strong></span>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', padding: '4px 10px', borderRadius: '8px', fontWeight: '600', color: 'var(--accent-primary)', fontSize: '12px' }}>
                {dept.employeeCount} {dept.employeeCount === 1 ? 'staff' : 'staff'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Department Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '450px', textAlign: 'left' }}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Department</h3>
              <button onClick={() => setModalOpen(false)} className="modal-close">×</button>
            </div>

            {formError && (
              <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateDept} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Department Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Quality Assurance"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Code</label>
                  <input
                    type="text"
                    placeholder="e.g. QA"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Department Manager</label>
                <input
                  type="text"
                  placeholder="Manager Full Name"
                  value={manager}
                  onChange={e => setManager(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Description</label>
                <textarea
                  placeholder="Briefly state scope and responsibilities..."
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
                  Create Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
