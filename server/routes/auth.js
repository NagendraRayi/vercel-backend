import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../database.js';
import { verifyToken } from '../middleware/auth.js';
import { validateLogin } from '../middleware/validation.js';
import { sendNotificationEmail } from '../index.js';

const router = express.Router();

// User Login (Admin and Employee)
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await db.users.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact administration.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Verify role constraint if provided
    if (role && user.role !== role) {
      return res.status(403).json({ message: 'Access denied. Invalid credentials for the selected role.' });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret_key_123_abc_xyz',
      { expiresIn: '7d' }
    );

    // Exclude password from output
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      designation: user.designation,
      joinDate: user.joinDate,
      leavesRemaining: user.leavesRemaining
    };

    res.json({
      token,
      user: userResponse
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during authentication.' });
  }
});

// Get currently logged-in user profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await db.users.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      designation: user.designation,
      joinDate: user.joinDate,
      leavesRemaining: user.leavesRemaining
    };

    res.json(userResponse);
  } catch (err) {
    console.error('Fetch profile error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Request Password Reset (Forgot Password)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await db.users.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(404).json({ message: 'User with this email address was not found.' });
    }

    // Generate token
    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    // Save token and expiration to database
    await db.users.findByIdAndUpdate(user.id, {
      resetPasswordToken: token,
      resetPasswordExpires: expires
    });

    // Send reset email
    const resetUrl = `http://localhost:5173/?token=${token}`;
    const emailSubject = 'StaffPortal - Password Reset Request';
    const emailBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; margin-bottom: 20px;">Password Reset Request</h2>
        <p>Hello ${user.name},</p>
        <p>You are receiving this email because a password reset request was made for your StaffPortal account.</p>
        <p>Please click the button below to choose a new password. This link is valid for 1 hour:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Reset Password</a>
        </div>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">If you're having trouble clicking the button, copy and paste the URL below into your browser:</p>
        <p style="font-size: 12px; color: #4f46e5; word-break: break-all;">${resetUrl}</p>
      </div>
    `;

    await sendNotificationEmail(user.email, emailSubject, emailBody);

    res.json({ message: 'Password reset email sent successfully.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error requesting password reset.' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // Find valid user with non-expired token
    const user = await db.users.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password and clear reset token fields
    await db.users.findByIdAndUpdate(user.id, {
      password: hashedPassword,
      resetPasswordToken: '',
      resetPasswordExpires: null
    });

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error resetting password.' });
  }
});

export default router;
