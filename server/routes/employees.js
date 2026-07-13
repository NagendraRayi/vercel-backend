import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../database.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all employees (Admin only, with search and filter)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { department, search, status } = req.query;
    let employees = await db.users.find();

    // Remove passwords before processing
    employees = employees.map(emp => {
      const { password, ...rest } = emp;
      return rest;
    });

    // Apply search keyword filter (names, emails, designations)
    if (search) {
      const kw = search.toLowerCase();
      employees = employees.filter(emp => 
        emp.name.toLowerCase().includes(kw) || 
        emp.email.toLowerCase().includes(kw) ||
        emp.designation.toLowerCase().includes(kw)
      );
    }

    // Apply department filter
    if (department && department !== 'All') {
      employees = employees.filter(emp => emp.department === department);
    }

    // Apply status filter
    if (status && status !== 'All') {
      employees = employees.filter(emp => emp.status === status);
    }

    res.json(employees);
  } catch (err) {
    console.error('List employees error:', err);
    res.status(500).json({ message: 'Server error retrieving employees.' });
  }
});

// Get single employee
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    // Allow users to view their own profile, or admins to view anyone's
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const employee = await db.users.findById(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    const { password, ...rest } = employee;
    res.json(rest);
  } catch (err) {
    console.error('Get employee error:', err);
    res.status(500).json({ message: 'Server error retrieving employee.' });
  }
});

// Create new employee (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, email, password, role, department, designation, joinDate, leavesRemaining, status } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const existingUser = await db.users.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'An employee with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newEmployee = await db.users.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role || 'employee',
      department: department || 'General',
      designation: designation || 'Associate',
      joinDate: joinDate || new Date().toISOString().split('T')[0],
      leavesRemaining: leavesRemaining || { casual: 10, sick: 8, annual: 15 },
      status: status || 'active'
    });

    const { password: _, ...rest } = newEmployee;
    res.status(201).json(rest);
  } catch (err) {
    console.error('Create employee error:', err);
    res.status(500).json({ message: 'Server error creating employee.' });
  }
});

// Update employee (Admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, department, designation, joinDate, leavesRemaining, status } = req.body;

    const employee = await db.users.findById(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    const updateFields = {
      name,
      email: email ? email.toLowerCase().trim() : undefined,
      role,
      department,
      designation,
      joinDate,
      leavesRemaining,
      status
    };

    // Filter out undefined keys
    Object.keys(updateFields).forEach(key => updateFields[key] === undefined && delete updateFields[key]);

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password, salt);
    }

    const updatedEmployee = await db.users.findByIdAndUpdate(id, updateFields);
    const { password: _, ...rest } = updatedEmployee;
    res.json(rest);
  } catch (err) {
    console.error('Update employee error:', err);
    res.status(500).json({ message: 'Server error updating employee.' });
  }
});

// Delete employee (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent admin deleting themselves
    if (req.user.id === id) {
      return res.status(400).json({ message: 'Admin cannot delete their own profile.' });
    }

    const employee = await db.users.findById(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    await db.users.findByIdAndDelete(id);
    res.json({ message: 'Employee profile deleted successfully.' });
  } catch (err) {
    console.error('Delete employee error:', err);
    res.status(500).json({ message: 'Server error deleting employee.' });
  }
});

export default router;
