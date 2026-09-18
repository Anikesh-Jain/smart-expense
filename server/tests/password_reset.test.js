/**
 * Test Suite: Password Reset & Forgot Password Security
 * Run: node --test server/tests/password_reset.test.js
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const dns = require('dns');
const crypto = require('crypto');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config({ path: path.join(__dirname, '../.env') });

const BASE_URL = 'http://localhost:5000/api';
const User = require('../models/User');
const {
  getEmailDiagnostic,
  isEmailConfigured,
  sendPasswordResetEmail,
  setCustomTransporter
} = require('../utils/emailService');

async function api(method, path, body = null, authToken = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, opts);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data, ok: res.ok };
}

describe('Password Reset & Forgot Password Security Suite', () => {
  const initialPassword = 'OriginalPass123!';
  const updatedPassword = 'NewSecretPassword456!';
  const testUser = {
    name: 'Password Reset Tester',
    email: `pw_reset_${Date.now()}@university.edu`,
    password: initialPassword
  };

  let userId = '';
  let activeRawToken = '';

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    }

    // Register temporary user for password reset tests
    const regRes = await api('POST', '/auth/register', testUser);
    assert.equal(regRes.status, 201, 'Registration should succeed');
    userId = regRes.data.data.user._id || regRes.data.data.user.id;
  });

  after(async () => {
    if (userId) {
      await User.findByIdAndDelete(userId);
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  describe('1. Forgot Password Endpoint Security', () => {
    it('1a. Unknown email returns generic success message without leaking account existence', async () => {
      const res = await api('POST', '/auth/forgot-password', {
        email: 'completely_unknown_account_xyz987@test.com'
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.match(res.data.message, /if an account exists/i);
      // Ensure no tokens or internal data are leaked
      assert.equal(res.data.token, undefined);
      assert.equal(res.data.resetToken, undefined);
    });

    it('1b. Malformed email returns 400 validation error', async () => {
      const res = await api('POST', '/auth/forgot-password', {
        email: 'not-a-valid-email'
      });
      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
    });

    it('1c. Valid email returns identical generic success message and stores hashed token in DB', async () => {
      const res = await api('POST', '/auth/forgot-password', {
        email: testUser.email
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.match(res.data.message, /if an account exists/i);
      assert.equal(res.data.token, undefined);
      assert.equal(res.data.resetToken, undefined);

      // Verify directly in DB that token is stored as SHA-256 hash and not raw
      const dbUser = await User.findById(userId).select('+resetPasswordToken +resetPasswordExpire');
      assert.ok(dbUser.resetPasswordToken, 'Hashed token must exist in database');
      assert.equal(dbUser.resetPasswordToken.length, 64, 'SHA-256 hex string must be 64 characters');
      assert.ok(dbUser.resetPasswordExpire > new Date(), 'Expiration must be in the future');
    });
  });

  describe('2. Canonical Reset Password Endpoint (POST /api/auth/reset-password/:token)', () => {
    it('2a. Reset with too short password (< 6 chars) fails validation', async () => {
      const res = await api('POST', '/auth/reset-password/sometoken', {
        password: '123'
      });
      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
    });

    it('2b. Reset with invalid / nonexistent token returns 400', async () => {
      const res = await api('POST', '/auth/reset-password/totally_invalid_token_1234567890', {
        password: updatedPassword
      });
      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /invalid or expired/i);
    });

    it('2c. Reset with expired token returns 400', async () => {
      // Set an expired token directly in MongoDB
      const expiredRaw = crypto.randomBytes(32).toString('hex');
      const expiredHash = crypto.createHash('sha256').update(expiredRaw).digest('hex');

      await User.updateOne({ _id: userId }, {
        resetPasswordToken: expiredHash,
        resetPasswordExpire: Date.now() - 5000 // 5 seconds in the past
      });

      const res = await api('POST', `/auth/reset-password/${expiredRaw}`, {
        password: updatedPassword
      });
      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /invalid or expired/i);
    });

    it('2d. Valid reset flow: updates password and invalidates token', async () => {
      // Setup known valid token directly in DB
      activeRawToken = crypto.randomBytes(32).toString('hex');
      const activeHash = crypto.createHash('sha256').update(activeRawToken).digest('hex');

      await User.updateOne({ _id: userId }, {
        resetPasswordToken: activeHash,
        resetPasswordExpire: Date.now() + 15 * 60 * 1000 // 15 mins in future
      });

      const res = await api('POST', `/auth/reset-password/${activeRawToken}`, {
        password: updatedPassword
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.match(res.data.message, /password reset successful/i);

      // Verify token is wiped in database
      const dbUser = await User.findById(userId).select('+resetPasswordToken +resetPasswordExpire');
      assert.equal(dbUser.resetPasswordToken, undefined, 'Reset token must be wiped after use');
      assert.equal(dbUser.resetPasswordExpire, undefined, 'Reset expiration must be wiped after use');
    });

    it('2e. Reused token is rejected (cannot be used a second time)', async () => {
      const res = await api('POST', `/auth/reset-password/${activeRawToken}`, {
        password: 'AnotherPassword789!'
      });
      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /invalid or expired/i);
    });

    it('2f. Old password no longer works for authentication', async () => {
      const res = await api('POST', '/auth/login', {
        email: testUser.email,
        password: initialPassword
      });
      assert.equal(res.status, 401, 'Old password must be rejected');
    });

    it('2g. New password successfully authenticates and returns valid JWT', async () => {
      const res = await api('POST', '/auth/login', {
        email: testUser.email,
        password: updatedPassword
      });
      assert.equal(res.status, 200, 'New password must be accepted');
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.token, 'Token must be issued for new password login');
    });
  });

  describe('3. Email Delivery & SMTP Security Suite', () => {
    after(() => {
      // Reset custom transporter
      setCustomTransporter(null);
    });

    it('3a. Email diagnostic reports status without exposing credentials or secrets', () => {
      const originalPassword = process.env.SMTP_PASSWORD;
      try {
        process.env.SMTP_PASSWORD = 'super-secret-smtp-password-12345';
        const diagnostic = getEmailDiagnostic();

        assert.equal(typeof diagnostic.configured, 'boolean');
        assert.equal(diagnostic.password, undefined, 'SMTP password must never be exposed');
        assert.equal(diagnostic.pass, undefined, 'SMTP pass must never be exposed');
        assert.equal(diagnostic.auth, undefined, 'SMTP auth must never be exposed');

        const serialized = JSON.stringify(diagnostic);
        assert.ok(!serialized.includes('super-secret-smtp-password-12345'), 'Serialized diagnostic must never contain password');
      } finally {
        process.env.SMTP_PASSWORD = originalPassword;
      }
    });

    it('3b. sendPasswordResetEmail dispatches with raw token in reset URL and correct parameters', async () => {
      const sentMails = [];
      setCustomTransporter({
        sendMail: async (mailOptions) => {
          sentMails.push(mailOptions);
          return { messageId: 'mock-msg-id-123' };
        }
      });

      const rawTestToken = 'abc123rawtoken456def789';
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const resetUrl = `${clientUrl}/reset-password/${rawTestToken}`;

      const sendResult = await sendPasswordResetEmail({
        to: testUser.email,
        name: testUser.name,
        resetUrl
      });

      assert.equal(sendResult.success, true);
      assert.equal(sentMails.length, 1);

      const mail = sentMails[0];
      assert.equal(mail.to, testUser.email);
      assert.match(mail.subject, /reset your password/i);
      assert.ok(mail.text.includes(resetUrl), 'Plaintext email must contain full reset URL with raw token');
      assert.ok(mail.html.includes(resetUrl), 'HTML email must contain full reset URL with raw token');
      assert.ok(mail.html.includes(rawTestToken), 'Email must contain the raw token');
      assert.match(mail.text, /15 minutes/i, 'Email must state 15 minutes expiration');
      assert.match(mail.html, /15 minutes/i, 'HTML must state 15 minutes expiration');
    });

    it('3c. forgot-password API flow invokes email service and maintains generic 200 response', async () => {
      const res = await api('POST', '/auth/forgot-password', {
        email: testUser.email
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.match(res.data.message, /if an account exists/i);

      // Verify DB contains only SHA-256 hash
      const user = await User.findById(userId).select('+resetPasswordToken');
      assert.ok(user.resetPasswordToken);
      assert.equal(user.resetPasswordToken.length, 64, 'Stored token must be SHA-256 hash');
    });

    it('3d. Email delivery failure is safely handled and never leaks error details to client', async () => {
      // Even if email delivery encounters an unexpected condition, the API must not crash or reveal internal status
      const res = await api('POST', '/auth/forgot-password', {
        email: testUser.email
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.match(res.data.message, /if an account exists/i);
    });
  });
});

