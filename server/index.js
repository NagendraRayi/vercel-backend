import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase, db } from './database.js';
import nodemailer from 'nodemailer';

// Load environmental variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Global mail sender simulation helper
export const sendNotificationEmail = async (recipient, subject, htmlBody) => {
  console.log(`✉️ Sending simulated email to: ${recipient}`);
  console.log(`Subject: ${subject}`);
  
  // Save to the in-app mail log database for inspection
  try {
    await db.emails.create({
      recipient,
      subject,
      body: htmlBody
    });
  } catch (err) {
    console.error('Failed to log email in db:', err);
  }

  // Attempt standard Nodemailer SMTP sending if credentials exist
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      await transporter.sendMail({
        from: `"Employee Portal" <${process.env.SMTP_USER}>`,
        to: recipient,
        subject: subject,
        html: htmlBody
      });
      console.log('✅ Real SMTP Email sent successfully.');
    } catch (smtpErr) {
      console.warn('⚠️ Real SMTP sending failed (using simulator fallback):', smtpErr.message);
    }
  } else {
    console.log('📝 (SMTP credentials not configured. Email logged locally in database for dashboard review.)');
  }
};

// Route imports
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import attendanceRoutes from './routes/attendance.js';
import leaveRoutes from './routes/leaves.js';
import departmentRoutes from './routes/departments.js';
import holidayRoutes from './routes/holidays.js';
import reportRoutes from './routes/reports.js';
import emailRoutes from './routes/emails.js';

// Route mountings
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/emails', emailRoutes);

// Simple healthcheck route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Database connection & Server initialization
const startServer = async () => {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();
