import express from 'express';
import { db } from '../database.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Retrieve all sent email notifications (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const list = await db.emails.find();
    res.json(list);
  } catch (err) {
    console.error('Fetch simulated emails error:', err);
    res.status(500).json({ message: 'Server error retrieving notification logs.' });
  }
});

export default router;
