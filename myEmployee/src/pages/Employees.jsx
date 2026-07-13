import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, UserPlus, Edit2, Trash2, Filter, AlertTriangle } from 'lucide-react';

const Employees = () => {
  const { apiFetch } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' or 'edit'
  const [selectedEmpId, setSelectedEmpId] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [casualLeaves, setCasualLeaves] = useState(10);
  const [sickLeaves, setSickLeaves] = useState(8);
  const [annualLeaves, setAnnualLeaves] = useState(15);
  const [status, setStatus] = useState('active');

  const [formError, setFormError] = useState('');

  // Delete Dialog States
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchEmployeesAndDepts = async () => {
    try {
      setLoading(true);
      const emps = await apiFetch(`/employees`);
      setEmployees(emps);

      const depts = await apiFetch('/departments');
      setDepartments(depts);
      if (depts.length > 0 && !department) {
        setDepartment(depts[0].name);
      }
    } catch (err) {
      console.error('Failed to load employee directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeesAndDepts();
  }, []);

  const openAddModal = () => {
    setModalType('add');
    setSelectedEmpId(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('employee');
    if (departments.length > 0) {
      setDepartment(departments[0].name);
    } else {
      setDepartment('Engineering');
    }
    setDesignation('');
    setJoinDate(new Date().toISOString().split('T')[0]);
    setCasualLeaves(10);
    setSickLeaves(8);
    setAnnualLeaves(15);
    setStatus('active');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (emp) => {
    setModalType('edit');
    setSelectedEmpId(emp.id);
    setName(emp.name);
    setEmail(emp.email);
    setPassword(''); // leave blank unless changing
    setRole(emp.role);
    setDepartment(emp.department);
    setDesignation(emp.designation);
    setJoinDate(emp.joinDate || '');
    setCasualLeaves(emp.leavesRemaining?.casual ?? 10);
    setSickLeaves(emp.leavesRemaining?.sick ?? 8);
    setAnnualLeaves(emp.leavesRemaining?.annual ?? 15);
    setStatus(emp.status || 'active');
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name || !email) {
      setFormError('Name and Email are required.');
      return;
    }

    if (modalType === 'add' && !password) {
      setFormError('Password is required for new accounts.');
      return;
    }

    const payload = {
      name,
      email,
      role,
      department,
      designation,
      joinDate,
      leavesRemaining: {
        casual: Number(casualLeaves),
        sick: Number(sickLeaves),
        annual: Number(annualLeaves)
      },
      status
    };

    if (password) {
      payload.password = password;
    }

    try {
      if (modalType === 'add') {
        await apiFetch('/employees', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch(`/employees/${selectedEmpId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      }
      setModalOpen(false);
      fetchEmployeesAndDepts();
    } catch (err) {
      setFormError(err.message || 'Error processing request.');
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await apiFetch(`/employees/${deleteId}`, {
        method: 'DELETE'
      });
      setDeleteOpen(false);
      setDeleteId(null);
      fetchEmployeesAndDepts();
    } catch (err) {
      alert(err.message || 'Error deleting employee profile.');
    }
  };

  // Apply filters client-side to dynamically render the table
  const filteredEmployees = employees.filter(emp => {
    if (deptFilter !== 'All' && emp.department !== deptFilter) return false;
    if (statusFilter !== 'All' && emp.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        emp.name.toLowerCase().includes(s) ||
        emp.email.toLowerCase().includes(s) ||
        emp.designation.toLowerCase().includes(s)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading employee registry...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '700' }}>Employee Registry</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Maintain details, departments, roles, and leave allocations for active personnel.
          </p>
        </div>
        
        <button onClick={openAddModal} className="btn btn-primary">
          <UserPlus size={16} /> Enroll Employee
        </button>
      </div>

      {/* Filter Options */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '25px', textAlign: 'left' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Search staff</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search name, email, role..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '34px' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Department</label>
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="form-input"
            >
              <option value="All">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="form-input"
            >
              <option value="All">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employee List Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div className="table-container" style={{ margin: 0 }}>
          {filteredEmployees.length === 0 ? (
            <p style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No staff match your filter options.</p>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee Info</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Role</th>
                  <th>Join Date</th>
                  <th>Leave Balances (C/S/A)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{emp.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.email}</div>
                    </td>
                    <td>{emp.department}</td>
                    <td>{emp.designation}</td>
                    <td>
                      <span style={{ fontSize: '12px', fontWeight: '500', textTransform: 'capitalize' }}>
                        {emp.role}
                      </span>
                    </td>
                    <td>{emp.joinDate || 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', fontSize: '12px', fontWeight: 600 }}>
                        <span style={{ color: 'var(--accent-primary)' }} title="Casual">{emp.leavesRemaining?.casual ?? 10}C</span>
                        <span style={{ color: 'var(--success)' }} title="Sick">{emp.leavesRemaining?.sick ?? 8}S</span>
                        <span style={{ color: 'var(--info)' }} title="Annual">{emp.leavesRemaining?.annual ?? 15}A</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${emp.status === 'active' ? 'badge-approved' : 'badge-rejected'}`}>
                        {emp.status === 'active' ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => openEditModal(emp)}
                          className="btn btn-secondary"
                          style={{ padding: '6px', borderRadius: '6px' }}
                          title="Edit Profile"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => confirmDelete(emp.id)}
                          className="btn btn-secondary"
                          style={{ padding: '6px', borderRadius: '6px', color: 'var(--danger)' }}
                          title="Delete Profile"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Enroll / Update Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '550px', textAlign: 'left', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">{modalType === 'add' ? 'Enroll New Employee' : 'Edit Employee Profile'}</h3>
              <button onClick={() => setModalOpen(false)} className="modal-close">×</button>
            </div>

            {formError && (
              <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Password {modalType === 'edit' && '(blank to keep)'}</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="form-input"
                    placeholder="••••••••"
                    required={modalType === 'add'}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Role Type</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="form-input"
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Department</label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="form-input"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    className="form-input"
                    placeholder="e.g. UX Designer"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Join Date</label>
                  <input
                    type="date"
                    value={joinDate}
                    onChange={e => setJoinDate(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Account Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="form-input"
                  >
                    <option value="active">Active / Active Duty</option>
                    <option value="inactive">Suspended / Deactivated</option>
                  </select>
                </div>
              </div>

              {/* Leaves Allowances */}
              <div style={{ marginTop: '10px' }}>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Initial Annual Leave Allowances (Days)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Casual Leave</label>
                    <input
                      type="number"
                      value={casualLeaves}
                      onChange={e => setCasualLeaves(e.target.value)}
                      className="form-input"
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Sick Leave</label>
                    <input
                      type="number"
                      value={sickLeaves}
                      onChange={e => setSickLeaves(e.target.value)}
                      className="form-input"
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Annual Leave</label>
                    <input
                      type="number"
                      value={annualLeaves}
                      onChange={e => setAnnualLeaves(e.target.value)}
                      className="form-input"
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
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
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Alert Modal */}
      {deleteOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '400px', textAlign: 'left' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                <AlertTriangle size={20} /> Delete Profile
              </h3>
              <button onClick={() => setDeleteOpen(false)} className="modal-close">×</button>
            </div>
            
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px' }}>
              Are you absolutely sure you want to delete this employee profile? This action is permanent and will delete all associated logs.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteOpen(false)}
                className="btn btn-secondary"
              >
                Keep Profile
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-danger"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
