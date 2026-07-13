import express from 'express';
import { db } from '../database.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Helper to get current Date string in YYYY-MM-DD
const getLocalDateString = () => {
  return new Date().toISOString().split('T')[0];
};

// Helper to get current Time string in HH:MM:SS
const getLocalTimeString = () => {
  const now = new Date();
  return now.toTimeString().split(' ')[0];
};

// Clock In Endpoint
router.post('/clock-in', verifyToken, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const date = getLocalDateString();
    const clockIn = getLocalTimeString();
    const { location } = req.body;

    // Check if already checked in today
    const existingRecord = await db.attendance.findOne({ employeeId, date });
    if (existingRecord) {
      return res.status(400).json({ message: 'You have already checked in today.' });
    }

    // Determine status: Late if clock-in is past 09:15 AM
    const [hours, minutes] = clockIn.split(':').map(Number);
    let status = 'Present';
    if (hours > 9 || (hours === 9 && minutes > 15)) {
      status = 'Late';
    }

    const attendanceRecord = await db.attendance.create({
      employeeId,
      date,
      clockIn,
      clockOut: '',
      location: location || 'Unknown Location',
      status
    });

    res.status(201).json(attendanceRecord);
  } catch (err) {
    console.error('Clock in error:', err);
    res.status(500).json({ message: 'Server error during clock in.' });
  }
});

// Clock Out Endpoint
router.post('/clock-out', verifyToken, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const date = getLocalDateString();
    const clockOut = getLocalTimeString();

    // Find active attendance record for today
    const record = await db.attendance.findOne({ employeeId, date });
    if (!record) {
      return res.status(400).json({ message: 'No clock-in record found for today.' });
    }

    if (record.clockOut) {
      return res.status(400).json({ message: 'You have already clocked out today.' });
    }

    const updatedRecord = await db.attendance.findByIdAndUpdate(record.id, {
      clockOut
    });

    res.json(updatedRecord);
  } catch (err) {
    console.error('Clock out error:', err);
    res.status(500).json({ message: 'Server error during clock out.' });
  }
});

// Get user's today status
router.get('/today', verifyToken, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const date = getLocalDateString();
    const record = await db.attendance.findOne({ employeeId, date });
    res.json(record || null);
  } catch (err) {
    console.error('Fetch today status error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get personal attendance logs
router.get('/my-history', verifyToken, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const history = await db.attendance.find({ employeeId });
    // Sort descending by date
    history.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(history);
  } catch (err) {
    console.error('Fetch personal history error:', err);
    res.status(500).json({ message: 'Server error retrieving attendance history.' });
  }
});

// Get all attendance logs for today (Admin only)
router.get('/all-today', verifyToken, isAdmin, async (req, res) => {
  try {
    const date = getLocalDateString();
    const list = await db.attendance.find({ date });
    
    // Enrich with employee names and details
    const enrichedList = await Promise.all(
      list.map(async record => {
        const emp = await db.users.findById(record.employeeId);
        return {
          ...record,
          employeeName: emp ? emp.name : 'Unknown User',
          department: emp ? emp.department : 'General',
          designation: emp ? emp.designation : 'N/A'
        };
      })
    );

    res.json(enrichedList);
  } catch (err) {
    console.error('Fetch today all error:', err);
    res.status(500).json({ message: 'Server error retrieving today logs.' });
  }
});

// Get overall logs (Admin only, with filters)
router.get('/all-history', verifyToken, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;
    let list = await db.attendance.find();

    // Date range filter
    if (startDate) {
      list = list.filter(r => r.date >= startDate);
    }
    if (endDate) {
      list = list.filter(r => r.date <= endDate);
    }

    // Enrich with employee names and filter by department
    let enrichedList = await Promise.all(
      list.map(async record => {
        const emp = await db.users.findById(record.employeeId);
        return {
          ...record,
          employeeName: emp ? emp.name : 'Unknown User',
          department: emp ? emp.department : 'General',
          designation: emp ? emp.designation : 'N/A'
        };
      })
    );

    if (department && department !== 'All') {
      enrichedList = enrichedList.filter(r => r.department === department);
    }

    // Sort descending by date
    enrichedList.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(enrichedList);
  } catch (err) {
    console.error('Fetch all history error:', err);
    res.status(500).json({ message: 'Server error retrieving historical logs.' });
  }
});

export default router;
