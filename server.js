require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

// ─── In-memory stores (replace with DB in production) ────────────────────────
const users = {};       // { email: { username, passwordHash } }
const otpStore = {};    // { email: { otp, expiresAt, pendingUser } }

// ─── Nodemailer transporter ───────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify SMTP connection on start
transporter.verify((err) => {
  if (err) console.error('❌ SMTP Error:', err.message);
  else console.log('✅ SMTP ready — thestockdesk@gmail.com');
});

// ─── Helper: generate 6-digit OTP ─────────────────────────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Route: Send OTP for Sign Up ──────────────────────────────────────────────
app.post('/api/auth/send-otp', async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password)
    return res.status(400).json({ message: 'All fields are required.' });

  if (users[email])
    return res.status(409).json({ message: 'Email already registered. Please sign in.' });

  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  const passwordHash = await bcrypt.hash(password, 12);

  otpStore[email] = { otp, expiresAt, pendingUser: { username, passwordHash } };

  try {
    await transporter.sendMail({
      from: `"Stock Sense" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Your Stock Sense OTP Verification Code',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f1117; color: #e2e8f0; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; letter-spacing: -0.5px;">📦 Stock Sense</h1>
            <p style="margin: 8px 0 0; opacity: 0.85; font-size: 14px;">Stock Inventory Management System</p>
          </div>
          <div style="padding: 36px 32px;">
            <p style="font-size: 16px; margin: 0 0 24px;">Hi <strong>${username}</strong>, welcome aboard! 🎉</p>
            <p style="color: #94a3b8; margin: 0 0 24px; font-size: 14px;">Use the OTP below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
            <div style="background: #1e2130; border: 1px solid #6366f1; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px;">Your OTP Code</p>
              <p style="margin: 0; font-size: 42px; font-weight: 700; letter-spacing: 12px; color: #818cf8;">${otp}</p>
            </div>
            <p style="color: #64748b; font-size: 12px; margin: 0;">If you didn't request this, please ignore this email.</p>
          </div>
        </div>
      `,
    });
    res.json({ message: 'OTP sent successfully. Check your email.' });
  } catch (err) {
    console.error('Mail error:', err);
    res.status(500).json({ message: 'Failed to send OTP. Try again.' });
  }
});

// ─── Route: Verify OTP & Register User ────────────────────────────────────────
app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp)
    return res.status(400).json({ message: 'Email and OTP are required.' });

  const record = otpStore[email];
  if (!record)
    return res.status(400).json({ message: 'No OTP found for this email. Please sign up again.' });

  if (Date.now() > record.expiresAt) {
    delete otpStore[email];
    return res.status(400).json({ message: 'OTP has expired. Please sign up again.' });
  }

  if (record.otp !== otp)
    return res.status(400).json({ message: 'Invalid OTP. Please try again.' });

  // Register the user
  users[email] = record.pendingUser;
  delete otpStore[email];

  res.json({ message: 'Email verified! Your account has been created. Please sign in.' });
});

// ─── Route: Sign In ───────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required.' });

  const user = users[email];
  if (!user)
    return res.status(401).json({ message: 'No account found with this email.' });

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch)
    return res.status(401).json({ message: 'Incorrect password.' });

  const token = jwt.sign(
    { email, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, username: user.username, email });
});

// ─── Route: Verify Token (for protected routes) ────────────────────────────────
app.get('/api/auth/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token.' });

  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    res.json({ username: decoded.username, email: decoded.email });
  } catch {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
});

// ─── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
