import express from 'express';
import { db } from '../database.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Helper to get past N dates formatted as YYYY-MM-DD
const getPastDates = (n) => {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

// GET /api/reports/stats
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    if (req.user.role === 'admin') {
      // 1. Admin Dashboard Stats
      const totalEmployees = await db.users.countDocuments({ role: 'employee' });
      const presentToday = await db.attendance.countDocuments({ date: today });
      
      // Calculate active approved leaves for today
      const allApprovedLeaves = await db.leaves.find({ status: 'Approved' });
      const onLeaveToday = allApprovedLeaves.filter(lv => {
        return lv.startDate <= today && lv.endDate >= today;
      }).length;

      const pendingLeaves = await db.leaves.countDocuments({ status: 'Pending' });

      // Department distribution
      const departmentsList = await db.departments.find();
      const deptDistribution = await Promise.all(
        departmentsList.map(async dept => {
          const count = await db.users.countDocuments({ department: dept.name, role: 'employee' });
          return { name: dept.name, count };
        })
      );

      // Attendance Trend (past 7 days check-in counts)
      const past7Dates = getPastDates(7);
      const attendanceTrend = await Promise.all(
        past7Dates.map(async date => {
          const count = await db.attendance.countDocuments({ date });
          // Format label as "Mon 07/07"
          const parsedDate = new Date(date);
          const label = parsedDate.toLocaleDateString('en-US', { weekday: 'short', month: '2-digit', day: '2-digit' });
          return { date, label, presentCount: count };
        })
      );

      res.json({
        totalEmployees,
        presentToday,
        onLeaveToday,
        pendingLeaves,
        deptDistribution,
        attendanceTrend
      });
    } else {
      // 2. Employee Dashboard Stats
      const employeeId = req.user.id;
      const employee = await db.users.findById(employeeId);

      if (!employee) {
        return res.status(404).json({ message: 'Employee not found.' });
      }

      const totalWorkedDays = await db.attendance.countDocuments({ employeeId });
      
      // Calculate late count
      const totalLateDays = await db.attendance.countDocuments({ employeeId, status: 'Late' });

      // Calculate attendance rate (mocking a baseline if they have worked zero days)
      const attendanceRate = totalWorkedDays > 0 
        ? Math.round(((totalWorkedDays - totalLateDays) / totalWorkedDays) * 100) 
        : 100;

      const pendingLeaves = await db.leaves.countDocuments({ employeeId, status: 'Pending' });
      
      // Approved leaves counts
      const approvedLeavesList = await db.leaves.find({ employeeId, status: 'Approved' });
      const totalLeavesTaken = approvedLeavesList.reduce((acc, lv) => {
        const start = new Date(lv.startDate);
        const end = new Date(lv.endDate);
        const diff = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
        return acc + diff;
      }, 0);

      // Past 7 days attendance summary for current user
      const past7Dates = getPastDates(7);
      const personalTrend = await Promise.all(
        past7Dates.map(async date => {
          const record = await db.attendance.findOne({ employeeId, date });
          const parsedDate = new Date(date);
          const label = parsedDate.toLocaleDateString('en-US', { weekday: 'short', month: '2-digit', day: '2-digit' });
          
          return {
            date,
            label,
            status: record ? record.status : 'Absent',
            clockIn: record ? record.clockIn : '--:--',
            clockOut: record ? record.clockOut : '--:--'
          };
        })
      );

      res.json({
        leavesRemaining: employee.leavesRemaining,
        totalWorkedDays,
        totalLateDays,
        attendanceRate,
        pendingLeaves,
        totalLeavesTaken,
        personalTrend
      });
    }
  } catch (err) {
    console.error('Fetch reports statistics error:', err);
    res.status(500).json({ message: 'Server error retrieving dashboard statistics.' });
  }
});

export default router;
