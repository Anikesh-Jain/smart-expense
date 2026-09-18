/**
 * Test Suite: Admin Authorization, Feedback System, and Cascade Account Deletion
 * Run: node --test server/tests/admin_feedback_deletion.test.js
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const dns = require('dns');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config({ path: path.join(__dirname, '../.env') });

const BASE_URL = 'http://localhost:5000/api';

const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const SavingsGoal = require('../models/SavingsGoal');
const Category = require('../models/Category');
const Feedback = require('../models/Feedback');

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

describe('Admin Authorization, Feedback System, and Account Deletion Suite', () => {
  let normalUser = {
    name: 'Normal Student',
    email: `student_${Date.now()}@university.edu`,
    password: 'Password123!'
  };
  let normalToken = '';
  let normalUserId = '';

  let adminUser = {
    name: 'System Administrator',
    email: `admin_${Date.now()}@university.edu`,
    password: 'AdminPassword123!'
  };
  let adminToken = '';
  let adminUserId = '';

  let createdFeedbackId = '';

  before(async () => {
    // Connect mongoose if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    }

    // 1. Register normal user
    const res1 = await api('POST', '/auth/register', normalUser);
    assert.equal(res1.status, 201, 'Normal user registration should succeed');
    normalToken = res1.data.data.token;
    normalUserId = res1.data.data.user._id || res1.data.data.user.id;

    // 2. Register admin user candidate
    const res2 = await api('POST', '/auth/register', adminUser);
    assert.equal(res2.status, 201, 'Admin user candidate registration should succeed');
    adminUserId = res2.data.data.user._id || res2.data.data.user.id;

    // 3. Promote admin user in database to role: 'admin'
    await User.updateOne({ _id: adminUserId }, { $set: { role: 'admin' } });

    // 4. Log in as admin to receive token reflecting admin role
    const resLogin = await api('POST', '/auth/login', {
      email: adminUser.email,
      password: adminUser.password
    });
    assert.equal(resLogin.status, 200);
    adminToken = resLogin.data.data.token;
  });

  after(async () => {
    // Cleanup any lingering admin test records
    if (adminUserId) {
      await User.findByIdAndDelete(adminUserId);
      await Feedback.deleteMany({ user: adminUserId });
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  // =========================================================================
  // ADMIN AUTHORIZATION TESTS
  // =========================================================================
  describe('Admin Authorization', () => {
    it('1. Normal user cannot access admin overview endpoints (returns 403)', async () => {
      const res = await api('GET', '/admin/overview', null, normalToken);
      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /administrator privileges/i);
    });

    it('1b. Normal user cannot access admin users endpoint (returns 403)', async () => {
      const res = await api('GET', '/admin/users', null, normalToken);
      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
    });

    it('2. Admin can access admin endpoints (returns 200)', async () => {
      const res = await api('GET', '/admin/overview', null, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok('totalUsers' in res.data.data);
      assert.ok('totalTransactions' in res.data.data);
      assert.ok('totalBudgets' in res.data.data);
      assert.ok('totalSavingsGoals' in res.data.data);
      assert.ok('totalFeedback' in res.data.data);
      assert.ok('unresolvedFeedback' in res.data.data);
    });

    it('2b. Admin can access paginated users list without sensitive fields', async () => {
      const res = await api('GET', '/admin/users?page=1&limit=5', null, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.total >= 2);

      // Verify no password hashes or sensitive authentication secrets are returned
      for (const u of res.data.data) {
        assert.equal(u.password, undefined);
        assert.equal(u.passwordHash, undefined);
        assert.equal(u.jwt, undefined);
      }
    });

    it('3. Missing or invalid authentication is rejected (returns 401)', async () => {
      const noAuthRes = await api('GET', '/admin/overview');
      assert.equal(noAuthRes.status, 401);

      const invalidTokenRes = await api('GET', '/admin/overview', null, 'malformed.jwt.token');
      assert.equal(invalidTokenRes.status, 401);
    });
  });

  // =========================================================================
  // FEEDBACK SYSTEM TESTS
  // =========================================================================
  describe('Feedback System', () => {
    it('4. Authenticated user can submit feedback', async () => {
      const payload = {
        category: 'bug',
        subject: 'Runway indicator rounding glitch',
        message: 'The daily limit runway shows 0 days when remaining balance is small.'
      };
      const res = await api('POST', '/feedback', payload, normalToken);
      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.subject, payload.subject);
      assert.equal(res.data.data.category, 'bug');
      assert.equal(res.data.data.status, 'new');
      assert.equal(res.data.data.user.toString(), normalUserId.toString());
      createdFeedbackId = res.data.data._id;
    });

    it('5. Invalid feedback is rejected (missing subject or too short message)', async () => {
      // Missing subject
      const res1 = await api('POST', '/feedback', { message: 'This message is valid but subject is missing' }, normalToken);
      assert.equal(res1.status, 400);

      // Short message (< 10 chars)
      const res2 = await api('POST', '/feedback', { subject: 'Short', message: 'Too short' }, normalToken);
      assert.equal(res2.status, 400);
    });

    it('6. Feedback is stored in MongoDB source of truth', async () => {
      assert.ok(createdFeedbackId);
      const foundInDb = await Feedback.findById(createdFeedbackId);
      assert.ok(foundInDb, 'Feedback record must exist in MongoDB collection');
      assert.equal(foundInDb.status, 'new');
      assert.equal(foundInDb.user.toString(), normalUserId.toString());
    });

    it('7. Admin can retrieve feedback list and detail', async () => {
      const listRes = await api('GET', '/admin/feedback', null, adminToken);
      assert.equal(listRes.status, 200);
      assert.equal(listRes.data.success, true);
      assert.ok(listRes.data.data.length >= 1);

      const itemRes = await api('GET', `/admin/feedback/${createdFeedbackId}`, null, adminToken);
      assert.equal(itemRes.status, 200);
      assert.equal(itemRes.data.data.subject, 'Runway indicator rounding glitch');
      assert.ok(itemRes.data.data.user.email);
    });

    it('8. Admin can update feedback status', async () => {
      const updateRes = await api('PATCH', `/admin/feedback/${createdFeedbackId}`, {
        status: 'reviewing',
        adminNotes: 'Investigating runway algorithm formula'
      }, adminToken);

      assert.equal(updateRes.status, 200);
      assert.equal(updateRes.data.success, true);
      assert.equal(updateRes.data.data.status, 'reviewing');
      assert.equal(updateRes.data.data.adminNotes, 'Investigating runway algorithm formula');
    });

    it('9. Normal user cannot access admin feedback endpoints (returns 403)', async () => {
      const resList = await api('GET', '/admin/feedback', null, normalToken);
      assert.equal(resList.status, 403);

      const resPatch = await api('PATCH', `/admin/feedback/${createdFeedbackId}`, { status: 'resolved' }, normalToken);
      assert.equal(resPatch.status, 403);
    });
  });

  // =========================================================================
  // DELETE ACCOUNT TESTS
  // =========================================================================
  describe('Delete Account', () => {
    it('10 & 12. Authenticated user can delete own account with cascade data cleanup', async () => {
      // 1. Create a transaction for normal user
      const tRes = await api('POST', '/transactions', {
        type: 'expense',
        amount: 250,
        category: 'Food',
        description: 'Cascade test expense',
        date: new Date().toISOString()
      }, normalToken);
      assert.equal(tRes.status, 201, 'Transaction creation should succeed');

      // 2. Create a budget for normal user
      const now = new Date();
      const bRes = await api('POST', '/budgets', {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        totalBudget: 5000
      }, normalToken);
      assert.ok([200, 201].includes(bRes.status), 'Budget creation should succeed');

      // 3. Create a savings goal for normal user
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + 6);
      const gRes = await api('POST', '/savings-goals', {
        title: 'Cascade Laptop Goal',
        targetAmount: 30000,
        targetDate: targetDate.toISOString()
      }, normalToken);
      assert.equal(gRes.status, 201, 'Savings goal creation should succeed');

      // Verify records exist
      const txnCountBefore = await Transaction.countDocuments({ user: normalUserId });
      const budgetCountBefore = await Budget.countDocuments({ user: normalUserId });
      const goalCountBefore = await SavingsGoal.countDocuments({ user: normalUserId });
      assert.ok(txnCountBefore > 0, 'User should have at least 1 transaction');
      assert.ok(budgetCountBefore > 0, 'User should have at least 1 budget');
      assert.ok(goalCountBefore > 0, 'User should have at least 1 goal');

      // Execute self-deletion endpoint
      const deleteRes = await api('DELETE', '/users/me', null, normalToken);
      assert.equal(deleteRes.status, 200);
      assert.equal(deleteRes.data.success, true);

      // Verify all owned data cascade deleted
      const txnCountAfter = await Transaction.countDocuments({ user: normalUserId });
      const budgetCountAfter = await Budget.countDocuments({ user: normalUserId });
      const goalCountAfter = await SavingsGoal.countDocuments({ user: normalUserId });
      const feedbackCountAfter = await Feedback.countDocuments({ user: normalUserId });
      const userAfter = await User.findById(normalUserId);

      assert.equal(txnCountAfter, 0, 'All transactions must be cascade-deleted');
      assert.equal(budgetCountAfter, 0, 'All budgets must be cascade-deleted');
      assert.equal(goalCountAfter, 0, 'All savings goals must be cascade-deleted');
      assert.equal(feedbackCountAfter, 0, 'All personal feedback must be cascade-deleted');
      assert.equal(userAfter, null, 'User record must be completely deleted');
    });

    it('11. User cannot delete another user account through the self-deletion endpoint', async () => {
      // Register third user
      const victim = {
        name: 'Victim User',
        email: `victim_${Date.now()}@test.com`,
        password: 'Password123!'
      };
      const resV = await api('POST', '/auth/register', victim);
      const victimId = resV.data.data.user._id || resV.data.data.user.id;
      const victimToken = resV.data.data.token;

      // Register attacker
      const attacker = {
        name: 'Attacker User',
        email: `attacker_${Date.now()}@test.com`,
        password: 'Password123!'
      };
      const resA = await api('POST', '/auth/register', attacker);
      const attackerId = resA.data.data.user._id || resA.data.data.user.id;
      const attackerToken = resA.data.data.token;

      // Attacker tries to pass victim's ID in query or body
      await api('DELETE', `/users/me?id=${victimId}`, { userId: victimId }, attackerToken);

      // Victim MUST still exist in database unharmed
      const victimStillExists = await User.findById(victimId);
      assert.ok(victimStillExists, 'Victim user must not be deleted by attacker');

      // Attacker was self-deleted
      const attackerDeleted = await User.findById(attackerId);
      assert.equal(attackerDeleted, null, 'Attacker self-deleted');

      // Clean up victim
      await User.findByIdAndDelete(victimId);
    });

    it('13. Deleted user can no longer authenticate or use expired credentials', async () => {
      // Attempt login with normalUser credentials (deleted in test 10)
      const loginRes = await api('POST', '/auth/login', {
        email: normalUser.email,
        password: normalUser.password
      });
      assert.equal(loginRes.status, 401, 'Deleted user cannot log in');

      // Attempt using old normalToken on protected endpoint
      const meRes = await api('GET', '/auth/me', null, normalToken);
      assert.equal(meRes.status, 401, 'Old token of deleted user is rejected');
    });
  });
});
