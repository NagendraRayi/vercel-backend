import express from 'express';
import { db } from '../database.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import { sendNotificationEmail } from '../index.js';

const router = express.Router();

// Helper to calculate total business days between dates
const getDurationInDays = (startStr, endStr) => {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive of start/end days
};

// File a new leave request (Employee)
router.post('/request', verifyToken, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'All fields (leaveType, startDate, endDate, reason) are required.' });
    }

    const employee = await db.users.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee profile not found.' });
    }

    // Validate dates
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ message: 'Start date cannot be after end date.' });
    }

    const duration = getDurationInDays(startDate, endDate);
    const typeKey = leaveType.toLowerCase(); // 'casual', 'sick', 'annual'
    
    // Check leave balance availability
    const balance = employee.leavesRemaining[typeKey];
    if (balance === undefined) {
      return res.status(400).json({ message: `Invalid leave type: ${leaveType}` });
    }

    if (balance < duration) {
      return res.status(400).json({ 
        message: `Insufficient leave balance. You requested ${duration} days, but only have ${balance} ${typeKey} leaves remaining.` 
      });
    }

    // Create leave request
    const leaveRequest = await db.leaves.create({
      employeeId,
      employeeName: employee.name,
      leaveType,
      startDate,
      endDate,
      reason,
      status: 'Pending',
      managerComment: '',
      appliedDate: new Date().toISOString().split('T')[0]
    });

    // Send email notification to Admin
    const emailSubject = `New Leave Request - ${employee.name}`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #6366f1;">New Leave Request</h2>
        <p><strong>Employee:</strong> ${employee.name} (${employee.department})</p>
        <p><strong>Type:</strong> ${leaveType} Leave</p>
        <p><strong>Duration:</strong> ${startDate} to ${endDate} (${duration} day(s))</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
        <p>Please log in to the Employee Portal to approve or reject this request.</p>
      </div>
    `;
    // We send email to admin@company.com
    await sendNotificationEmail('admin@company.com', emailSubject, emailBody);

    res.status(201).json(leaveRequest);
  } catch (err) {
    console.error('Submit leave request error:', err);
    res.status(500).json({ message: 'Server error processing leave request.' });
  }
});

// Get user's own leave requests
router.get('/my-requests', verifyToken, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const list = await db.leaves.find({ employeeId });
    list.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
    res.json(list);
  } catch (err) {
    console.error('Fetch my leaves error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get all leave requests (Admin only)
router.get('/all-requests', verifyToken, isAdmin, async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    let list = await db.leaves.find();

    if (status && status !== 'All') {
      list = list.filter(r => r.status === status);
    }
    if (employeeId) {
      list = list.filter(r => r.employeeId === employeeId);
    }

    // Enrich requests with current department information
    const enrichedList = await Promise.all(
      list.map(async reqObj => {
        const emp = await db.users.findById(reqObj.employeeId);
        return {
          ...reqObj,
          department: emp ? emp.department : 'N/A',
          designation: emp ? emp.designation : 'N/A',
          balanceRemaining: emp ? emp.leavesRemaining[reqObj.leaveType.toLowerCase()] : 0
        };
      })
    );

    // Sort descending by applied date
    enrichedList.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));

    res.json(enrichedList);
  } catch (err) {
    console.error('Fetch all leaves error:', err);
    res.status(500).json({ message: 'Server error retrieving leave requests.' });
  }
});

// Approve or Reject a leave request (Admin only)
router.put('/action/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, managerComment } = req.body; // status must be 'Approved' or 'Rejected'

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be Approved or Rejected.' });
    }

    const leaveRequest = await db.leaves.findById(id);
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found.' });
    }

    if (leaveRequest.status !== 'Pending') {
      return res.status(400).json({ message: `Leave request has already been ${leaveRequest.status.toLowerCase()}.` });
    }

    const employee = await db.users.findById(leaveRequest.employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee associated with request not found.' });
    }

    const duration = getDurationInDays(leaveRequest.startDate, leaveRequest.endDate);
    const typeKey = leaveRequest.leaveType.toLowerCase();

    // If approved, verify balance once more and deduct
    if (status === 'Approved') {
      const balance = employee.leavesRemaining[typeKey];
      if (balance < duration) {
        return res.status(400).json({
          message: `Cannot approve request. Employee only has ${balance} days of ${typeKey} leaves remaining.`
        });
      }

      // Deduct leaves
      const updatedBalance = { ...employee.leavesRemaining };
      updatedBalance[typeKey] = balance - duration;
      await db.users.findByIdAndUpdate(employee.id, { leavesRemaining: updatedBalance });
    }

    // Update status of leave request
    const updatedRequest = await db.leaves.findByIdAndUpdate(id, {
      status,
      managerComment: managerComment || ''
    });

    // Send email notification to Employee
    const emailSubject = `Leave Request ${status} - ${leaveRequest.leaveType}`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: ${status === 'Approved' ? '#10b981' : '#f43f5e'};">Leave Request ${status}</h2>
        <p>Dear ${employee.name},</p>
        <p>Your request for <strong>${leaveRequest.leaveType} Leave</strong> from <strong>${leaveRequest.startDate}</strong> to <strong>${leaveRequest.endDate}</strong> (${duration} day(s)) has been <strong>${status.toLowerCase()}</strong>.</p>
        ${managerComment ? `<div style="background: #f3f4f6; border-left: 4px solid #6366f1; padding: 12px; margin: 15px 0;"><strong>Manager's Comment:</strong> ${managerComment}</div>` : ''}
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
        <p>This is a simulated notification system dispatch.</p>
      </div>
    `;
    await sendNotificationEmail(employee.email, emailSubject, emailBody);

    res.json(updatedRequest);
  } catch (err) {
    console.error('Update leave request status error:', err);
    res.status(500).json({ message: 'Server error processing leave approval.' });
  }
});

export default router;
