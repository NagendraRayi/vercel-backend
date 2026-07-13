import express from 'express';
import { db } from '../database.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all holidays
router.get('/', verifyToken, async (req, res) => {
  try {
    const list = await db.holidays.find();
    // Sort chronological
    list.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json(list);
  } catch (err) {
    console.error('List holidays error:', err);
    res.status(500).json({ message: 'Server error retrieving holidays.' });
  }
});

// Create new holiday (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, date, description } = req.body;
    if (!name || !date) {
      return res.status(400).json({ message: 'Holiday name and date are required.' });
    }

    const newHoliday = await db.holidays.create({
      name,
      date,
      description: description || ''
    });

    res.status(201).json(newHoliday);
  } catch (err) {
    console.error('Create holiday error:', err);
    res.status(500).json({ message: 'Server error creating holiday.' });
  }
});

// Update holiday (Admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date, description } = req.body;

    const holiday = await db.holidays.findById(id);
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found.' });
    }

    const updatedHoliday = await db.holidays.findByIdAndUpdate(id, {
      name,
      date,
      description
    });

    res.json(updatedHoliday);
  } catch (err) {
    console.error('Update holiday error:', err);
    res.status(500).json({ message: 'Server error updating holiday.' });
  }
});

// Delete holiday (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const holiday = await db.holidays.findById(id);
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found.' });
    }

    await db.holidays.findByIdAndDelete(id);
    res.json({ message: 'Holiday deleted successfully.' });
  } catch (err) {
    console.error('Delete holiday error:', err);
    res.status(500).json({ message: 'Server error deleting holiday.' });
  }
});

export default router;
