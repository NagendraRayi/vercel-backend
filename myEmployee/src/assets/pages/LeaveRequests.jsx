import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, FileText, CheckCircle, XCircle, Search, Clock, ShieldAlert } from 'lucide-react';

const LeaveRequests = () => {
  const { apiFetch, user, setUser } = useAuth();
  const [myRequests, setMyRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states (Employee)
  const [leaveType, setLeaveType] = useState('Casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Admin filter states
  const [adminStatusFilter, setAdminStatusFilter] = useState('All');
  const [adminSearch, setAdminSearch] = useState('');

  // Modal Action states (Admin)
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [managerComment, setManagerComment] = useState('');
  const [modalActionType, setModalActionType] = useState(''); // 'Approved' or 'Rejected'

  const isAdmin = user && user.role === 'admin';

  const fetchData = async () => {
    try {
      setLoading(true);
      if (isAdmin) {
        const res = await apiFetch(`/leaves/all-requests`);
        setAllRequests(res);
      } else {
        const res = await apiFetch('/leaves/my-requests');
        setMyRequests(res);
        // Also refresh user data to get updated balances
        const refreshedUser = await apiFetch('/auth/me');
        setUser(refreshedUser);
      }
    } catch (err) {
      console.error('Failed to load leave request records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin]);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!startDate || !endDate || !reason) {
      setFormError('Please fill out all request parameters.');
      return;
    }

    try {
      setActionLoading(true);
      await apiFetch('/leaves/request', {
        method: 'POST',
        body: JSON.stringify({ leaveType, startDate, endDate, reason })
      });
      
      setFormSuccess('Leave request filed successfully! Admin has been notified.');
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchData(); // Refresh history list
    } catch (err) {
      setFormError(err.message || 'Failed to submit leave request.');
    } finally {
      setActionLoading(false);
    }
  };

  const openActionModal = (request, type) => {
    setSelectedRequest(request);
    setModalActionType(type);
    setManagerComment('');
    setActionModalOpen(true);
  };

  const handleAdminDecision = async () => {
    if (!selectedRequest) return;
    
    try {
      setActionLoading(true);
      await apiFetch(`/leaves/action/${selectedRequest.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: modalActionType,
          managerComment
        })
      });
      
      setActionModalOpen(false);
      setSelectedRequest(null);
      fetchData(); // Refresh admin request queue
    } catch (err) {
      alert(err.message || 'Failed to execute leave approval decision.');
    } finally {
      setActionLoading(false);
    }
  };

  // Duration Calculator Helper
  const getDuration = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.abs(e - s);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  // Admin Queue Filtering
  const filteredAllRequests = allRequests.filter(req => {
    if (adminStatusFilter !== 'All' && req.status !== adminStatusFilter) return false;
    if (adminSearch) {
      const s = adminSearch.toLowerCase();
      return (
        req.employeeName.toLowerCase().includes(s) ||
        req.leaveType.toLowerCase().includes(s) ||
        req.reason.toLowerCase().includes(s)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading leave requests logs...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ margin: '0 0 5px 0', fontSize: '26px', fontWeight: '700', textAlign: 'left' }}>
        Leave Management
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'left', marginBottom: '25px' }}>
        {isAdmin ? 'Review and manage company-wide leave applications.' : 'Apply for leaves and view history logs.'}
      </p>

      {isAdmin ? (
        // ------------------ ADMIN QUEUE VIEW ------------------
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Leave Approvals Queue</h3>
            
            {/* Quick Stats Summary */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <span className="badge badge-pending">Pending: {allRequests.filter(r => r.status === 'Pending').length}</span>
              <span className="badge badge-approved">Approved: {allRequests.filter(r => r.status === 'Approved').length}</span>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Filter Status</label>
              <select
                value={adminStatusFilter}
                onChange={e => setAdminStatusFilter(e.target.value)}
                className="form-input"
              >
                <option value="All">All Requests</option>
                <option value="Pending">Pending Approvals</option>
                <option value="Approved">Approved Applications</option>
                <option value="Rejected">Rejected Applications</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Search Staff</label>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search staff, reasons..."
                  value={adminSearch}
                  onChange={e => setAdminSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '34px' }}
                />
              </div>
            </div>
          </div>

          {/* Admin Table */}
          <div className="table-container">
            {filteredAllRequests.length === 0 ? (
              <p style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No leave requests found.</p>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAllRequests.map((req) => (
                    <tr key={req.id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{req.employeeName}</div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{req.department} • {req.designation}</span>
                      </td>
                      <td>{req.leaveType}</td>
                      <td>
                        <div style={{ fontSize: '13px' }}>{req.startDate}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>to {req.endDate}</div>
                      </td>
                      <td>{getDuration(req.startDate, req.endDate)}</td>
                      <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.reason}>
                        {req.reason}
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', fontWeight: '500' }}>
                          {req.balanceRemaining} days left
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${req.status.toLowerCase()}`}>{req.status}</span>
                      </td>
                      <td>
                        {req.status === 'Pending' ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => openActionModal(req, 'Approved')}
                              className="btn btn-primary"
                              style={{ padding: '6px 12px', fontSize: '11px' }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openActionModal(req, 'Rejected')}
                              className="btn btn-danger"
                              style={{ padding: '6px 12px', fontSize: '11px' }}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {req.managerComment ? `"${req.managerComment}"` : 'No comment'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        // ------------------ EMPLOYEE VIEW ------------------
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '20px', textAlign: 'left' }}>
          {/* Leave request form */}
          <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} style={{ color: 'var(--accent-primary)' }} /> Request Leave
            </h3>

            {formError && (
              <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px' }}>
                {formError}
              </div>
            )}
            {formSuccess && (
              <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px' }}>
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={e => setLeaveType(e.target.value)}
                  className="form-input"
                >
                  <option value="Casual">Casual Leave ({user.leavesRemaining.casual} left)</option>
                  <option value="Sick">Sick Leave ({user.leavesRemaining.sick} left)</option>
                  <option value="Annual">Annual Leave ({user.leavesRemaining.annual} left)</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Reason Description</label>
                <textarea
                  placeholder="Provide details about your request..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="form-input"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={actionLoading}
                style={{ width: '100%', marginTop: '5px' }}
              >
                {actionLoading ? 'Filing Application...' : 'File Application'}
              </button>
            </form>
          </div>

          {/* Personal leave history list */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '18px' }}>My Applications History</h3>
            
            <div className="table-container">
              {myRequests.length === 0 ? (
                <p style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No previous leave requests.</p>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Dates Range</th>
                      <th>Days</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myRequests.map((req) => (
                      <tr key={req.id}>
                        <td><strong>{req.leaveType}</strong></td>
                        <td style={{ fontSize: '13px' }}>
                          <div>{req.startDate}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>to {req.endDate}</div>
                        </td>
                        <td>{getDuration(req.startDate, req.endDate)}</td>
                        <td style={{ fontSize: '13px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.reason}>
                          {req.reason}
                        </td>
                        <td>
                          <span className={`badge badge-${req.status.toLowerCase()}`}>{req.status}</span>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          {req.managerComment || <span style={{ color: 'var(--text-muted)' }}>--</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Action Comments Modal */}
      {actionModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ textAlign: 'left' }}>
            <div className="modal-header">
              <h3 className="modal-title">Leave Request - {modalActionType}</h3>
              <button onClick={() => setActionModalOpen(false)} className="modal-close">×</button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                You are about to <strong>{modalActionType === 'Approved' ? 'APPROVE' : 'REJECT'}</strong> the leave requested by <strong>{selectedRequest?.employeeName}</strong>.
              </p>
              <div style={{ fontSize: '13px', background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '8px', margin: '12px 0', borderLeft: '3px solid var(--accent-primary)' }}>
                <strong>Dates:</strong> {selectedRequest?.startDate} to {selectedRequest?.endDate} ({selectedRequest && getDuration(selectedRequest.startDate, selectedRequest.endDate)} days)
                <br />
                <strong>Reason:</strong> {selectedRequest?.reason}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Review comments (Optional)</label>
              <textarea
                placeholder="Write message for the employee..."
                value={managerComment}
                onChange={e => setManagerComment(e.target.value)}
                className="form-input"
                style={{ minHeight: '80px', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setActionModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAdminDecision}
                disabled={actionLoading}
                className={modalActionType === 'Approved' ? 'btn btn-primary' : 'btn btn-danger'}
              >
                {actionLoading ? 'Processing...' : `Confirm ${modalActionType}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequests;
