import express from 'express';
import { db } from '../database.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all departments
router.get('/', verifyToken, async (req, res) => {
  try {
    const list = await db.departments.find();
    
    // Add employee counts per department dynamically
    const enrichedList = await Promise.all(
      list.map(async dept => {
        const empCount = await db.users.countDocuments({ department: dept.name });
        return {
          ...dept,
          employeeCount: empCount
        };
      })
    );

    res.json(enrichedList);
  } catch (err) {
    console.error('List departments error:', err);
    res.status(500).json({ message: 'Server error retrieving departments.' });
  }
});

// Create new department (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, code, manager, description } = req.body;
    if (!name || !code) {
      return res.status(400).json({ message: 'Department name and code are required.' });
    }

    const existingDept = await db.departments.findOne({ name });
    if (existingDept) {
      return res.status(400).json({ message: 'Department name already exists.' });
    }

    const newDept = await db.departments.create({
      name,
      code: code.toUpperCase().trim(),
      manager: manager || 'Unassigned',
      description: description || ''
    });

    res.status(201).json(newDept);
  } catch (err) {
    console.error('Create department error:', err);
    res.status(500).json({ message: 'Server error creating department.' });
  }
});

// Delete department (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const dept = await db.departments.findById(id);
    if (!dept) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    // Check if department has employees assigned. If so, block delete or allow it?
    // Let's check how many employees are in this department
    const empCount = await db.users.countDocuments({ department: dept.name });
    if (empCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete department. There are ${empCount} employees assigned to this department. Please reassign them first.` 
      });
    }

    await db.departments.findByIdAndDelete(id);
    res.json({ message: 'Department deleted successfully.' });
  } catch (err) {
    console.error('Delete department error:', err);
    res.status(500).json({ message: 'Server error deleting department.' });
  }
});

export default router;
