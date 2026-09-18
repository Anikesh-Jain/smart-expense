/**
 * Comprehensive Backend API Test Suite
 * Uses Node.js built-in test runner (node:test)
 * 
 * Run: node --test server/tests/api.test.js
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
  name: 'QA Test User',
  email: `qatest_${Date.now()}@test.com`,
  password: 'TestPass123!'
};
const TEST_USER_2 = {
  name: 'QA Isolation User',
  email: `qatest2_${Date.now()}@test.com`,
  password: 'TestPass456!'
};

let token = '';
let userId = '';
let token2 = '';
let userId2 = '';
let transactionId = '';
let incomeTransactionId = '';
let budgetId = '';
let categoryId = '';
let savingsGoalId = '';

// Helper to make HTTP requests
async function api(method, path, body = null, authToken = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, ok: res.ok, headers: res.headers };
}

// =============================================================
// HEALTH CHECK
// =============================================================
describe('Health Check', () => {
  it('GET /health returns 200', async () => {
    const res = await api('GET', '/health');
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(res.data.timestamp);
  });
});

// =============================================================
// AUTH — Registration, Login, Profile, Password, Logout
// =============================================================
describe('Authentication', () => {
  it('POST /auth/register — creates new user', async () => {
    const res = await api('POST', '/auth/register', TEST_USER);
    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
    assert.ok(res.data.data.token);
    assert.ok(res.data.data.user);
    assert.equal(res.data.data.user.name, TEST_USER.name);
    assert.equal(res.data.data.user.email, TEST_USER.email.toLowerCase());
    assert.ok(!res.data.data.user.password, 'Password should NOT be in response');
    token = res.data.data.token;
    userId = res.data.data.user._id;
  });

  it('POST /auth/register — duplicate email fails', async () => {
    const res = await api('POST', '/auth/register', TEST_USER);
    assert.equal(res.status, 400);
    assert.equal(res.data.success, false);
  });

  it('POST /auth/register — validation: missing name', async () => {
    const res = await api('POST', '/auth/register', { email: 'x@y.com', password: '123456' });
    assert.equal(res.status, 400);
  });

  it('POST /auth/register — validation: short password', async () => {
    const res = await api('POST', '/auth/register', { name: 'X', email: 'x@y.com', password: '12' });
    assert.equal(res.status, 400);
  });

  it('POST /auth/register — validation: invalid email', async () => {
    const res = await api('POST', '/auth/register', { name: 'X', email: 'notanemail', password: '123456' });
    assert.equal(res.status, 400);
  });

  it('POST /auth/login — valid credentials', async () => {
    const res = await api('POST', '/auth/login', { email: TEST_USER.email, password: TEST_USER.password });
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(res.data.data.token);
    token = res.data.data.token; // refresh
  });

  it('POST /auth/login — wrong password', async () => {
    const res = await api('POST', '/auth/login', { email: TEST_USER.email, password: 'WrongPass' });
    assert.equal(res.status, 401);
  });

  it('POST /auth/login — nonexistent email', async () => {
    const res = await api('POST', '/auth/login', { email: 'nobody@nowhere.com', password: '123456' });
    assert.equal(res.status, 401);
  });

  it('GET /auth/me — returns current user', async () => {
    const res = await api('GET', '/auth/me', null, token);
    assert.equal(res.status, 200);
    assert.equal(res.data.data._id, userId);
    assert.ok(!res.data.data.password, 'Password must not be returned');
  });

  it('GET /auth/me — no token returns 401', async () => {
    const res = await api('GET', '/auth/me');
    assert.equal(res.status, 401);
  });

  it('GET /auth/me — invalid token returns 401', async () => {
    const res = await api('GET', '/auth/me', null, 'invalid.jwt.token');
    assert.equal(res.status, 401);
  });

  it('PUT /auth/profile — update financial setup', async () => {
    const res = await api('PUT', '/auth/profile', {
      monthlyIncome: 25000,
      fixedExpenses: 8000,
      savingsTarget: 5000,
      incomeDay: 1,
      currency: 'INR',
      onboardingCompleted: true
    }, token);
    assert.equal(res.status, 200);
    assert.equal(res.data.data.monthlyIncome, 25000);
    assert.equal(res.data.data.fixedExpenses, 8000);
    assert.equal(res.data.data.savingsTarget, 5000);
    assert.equal(res.data.data.onboardingCompleted, true);
  });

  it('PUT /auth/profile — rejects negative income', async () => {
    const res = await api('PUT', '/auth/profile', { monthlyIncome: -500 }, token);
    assert.equal(res.status, 400);
  });

  it('PUT /auth/password — change password', async () => {
    const res = await api('PUT', '/auth/password', {
      currentPassword: TEST_USER.password,
      newPassword: 'NewPass123!'
    }, token);
    assert.equal(res.status, 200);
    // Change back
    await api('PUT', '/auth/password', { currentPassword: 'NewPass123!', newPassword: TEST_USER.password }, token);
  });

  it('PUT /auth/password — wrong current password', async () => {
    const res = await api('PUT', '/auth/password', {
      currentPassword: 'wrongpass',
      newPassword: 'NewPass123!'
    }, token);
    assert.equal(res.status, 401);
  });

  it('POST /auth/logout — returns success', async () => {
    const res = await api('POST', '/auth/logout', null, token);
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
  });

  // Register second user for cross-user isolation tests
  it('Register second test user for isolation', async () => {
    const res = await api('POST', '/auth/register', TEST_USER_2);
    assert.equal(res.status, 201);
    token2 = res.data.data.token;
    userId2 = res.data.data.user._id;
  });
});

// =============================================================
// CATEGORIES
// =============================================================
describe('Categories', () => {
  it('GET /categories — returns default categories for new user', async () => {
    const res = await api('GET', '/categories', null, token);
    assert.equal(res.status, 200);
    assert.ok(res.data.data.length >= 20, `Expected >=20 default categories, got ${res.data.data.length}`);
    // Check we have both income and expense
    const types = new Set(res.data.data.map(c => c.type));
    assert.ok(types.has('income'));
    assert.ok(types.has('expense'));
  });

  it('GET /categories?type=expense — filters by type', async () => {
    const res = await api('GET', '/categories?type=expense', null, token);
    assert.equal(res.status, 200);
    res.data.data.forEach(c => assert.equal(c.type, 'expense'));
  });

  it('POST /categories — create custom category', async () => {
    const res = await api('POST', '/categories', {
      name: 'QA Test Category',
      type: 'expense',
      icon: '🧪'
    }, token);
    assert.equal(res.status, 201);
    assert.equal(res.data.data.name, 'QA Test Category');
    assert.equal(res.data.data.isDefault, false);
    categoryId = res.data.data._id;
  });

  it('POST /categories — duplicate category fails', async () => {
    const res = await api('POST', '/categories', {
      name: 'QA Test Category',
      type: 'expense'
    }, token);
    assert.equal(res.status, 400);
  });

  it('PUT /categories/:id — update custom category', async () => {
    const res = await api('PUT', `/categories/${categoryId}`, {
      name: 'QA Updated Cat',
      icon: '✅'
    }, token);
    assert.equal(res.status, 200);
    assert.equal(res.data.data.name, 'QA Updated Cat');
  });

  it('DELETE default category — should fail', async () => {
    const cats = await api('GET', '/categories', null, token);
    const defaultCat = cats.data.data.find(c => c.isDefault);
    assert.ok(defaultCat, 'Should have a default category');
    const res = await api('DELETE', `/categories/${defaultCat._id}`, null, token);
    assert.equal(res.status, 400);
  });

  it('DELETE /categories/:id — delete custom category', async () => {
    const res = await api('DELETE', `/categories/${categoryId}`, null, token);
    assert.equal(res.status, 200);
  });
});

// =============================================================
// TRANSACTIONS
// =============================================================
describe('Transactions', () => {
  it('POST /transactions — create expense', async () => {
    const res = await api('POST', '/transactions', {
      type: 'expense',
      amount: 500,
      category: 'Food',
      description: 'QA test expense',
      date: new Date().toISOString()
    }, token);
    assert.equal(res.status, 201);
    assert.equal(res.data.data.amount, 500);
    assert.equal(res.data.data.type, 'expense');
    transactionId = res.data.data._id;
  });

  it('POST /transactions — create income', async () => {
    const res = await api('POST', '/transactions', {
      type: 'income',
      amount: 25000,
      category: 'Pocket Money',
      description: 'QA test income',
      date: new Date().toISOString()
    }, token);
    assert.equal(res.status, 201);
    incomeTransactionId = res.data.data._id;
  });

  // Create additional expenses for analytics
  it('POST /transactions — create more expenses for analytics', async () => {
    const expenses = [
      { type: 'expense', amount: 200, category: 'Snacks', description: 'test snacks', date: new Date().toISOString() },
      { type: 'expense', amount: 1500, category: 'Shopping', description: 'test shopping', date: new Date().toISOString() },
      { type: 'expense', amount: 300, category: 'Entertainment', description: 'test fun', date: new Date().toISOString() },
    ];
    for (const exp of expenses) {
      const res = await api('POST', '/transactions', exp, token);
      assert.equal(res.status, 201);
    }
  });

  it('POST /transactions — validation: missing amount', async () => {
    const res = await api('POST', '/transactions', {
      type: 'expense', category: 'Food', date: new Date().toISOString()
    }, token);
    assert.equal(res.status, 400);
  });

  it('POST /transactions — validation: invalid type', async () => {
    const res = await api('POST', '/transactions', {
      type: 'refund', amount: 100, category: 'Food', date: new Date().toISOString()
    }, token);
    assert.equal(res.status, 400);
  });

  it('POST /transactions — no auth returns 401', async () => {
    const res = await api('POST', '/transactions', {
      type: 'expense', amount: 100, category: 'Food', date: new Date().toISOString()
    });
    assert.equal(res.status, 401);
  });

  it('GET /transactions — returns paginated list', async () => {
    const res = await api('GET', '/transactions', null, token);
    assert.equal(res.status, 200);
    assert.ok(res.data.data.length > 0);
    assert.ok(res.data.pagination);
    assert.ok(res.data.pagination.totalCount >= 5);
  });

  it('GET /transactions?type=expense — filter by type', async () => {
    const res = await api('GET', '/transactions?type=expense', null, token);
    assert.equal(res.status, 200);
    res.data.data.forEach(t => assert.equal(t.type, 'expense'));
  });

  it('GET /transactions?search=shopping — search', async () => {
    const res = await api('GET', '/transactions?search=shopping', null, token);
    assert.equal(res.status, 200);
    assert.ok(res.data.data.length >= 1);
  });

  it('GET /transactions?sort=amount:asc — sorting', async () => {
    const res = await api('GET', '/transactions?sort=amount:asc', null, token);
    assert.equal(res.status, 200);
    for (let i = 1; i < res.data.data.length; i++) {
      assert.ok(res.data.data[i].amount >= res.data.data[i-1].amount);
    }
  });

  it('GET /transactions?page=1&limit=2 — pagination', async () => {
    const res = await api('GET', '/transactions?page=1&limit=2', null, token);
    assert.equal(res.status, 200);
    assert.ok(res.data.data.length <= 2);
    assert.ok(res.data.pagination.totalPages >= 1);
  });

  it('GET /transactions/:id — get single', async () => {
    const res = await api('GET', `/transactions/${transactionId}`, null, token);
    assert.equal(res.status, 200);
    assert.equal(res.data.data._id, transactionId);
  });

  it('PUT /transactions/:id — update', async () => {
    const res = await api('PUT', `/transactions/${transactionId}`, {
      amount: 750,
      description: 'Updated QA test'
    }, token);
    assert.equal(res.status, 200);
    assert.equal(res.data.data.amount, 750);
    assert.equal(res.data.data.description, 'Updated QA test');
  });

  // --- Currency-aware transaction controller tests ---

  it('POST /transactions — explicit currency stores currency, baseAmountUSD, historicalRateToUSD', async () => {
    const res = await api('POST', '/transactions', {
      type: 'expense',
      amount: 100,
      category: 'Food',
      description: 'USD expense',
      date: new Date().toISOString(),
      currency: 'USD'
    }, token);
    assert.equal(res.status, 201);
    const t = res.data.data;
    assert.equal(t.amount, 100);
    assert.equal(t.currency, 'USD');
    assert.equal(typeof t.baseAmountUSD, 'number');
    assert.ok(t.baseAmountUSD > 0, 'baseAmountUSD must be positive');
    assert.equal(typeof t.historicalRateToUSD, 'number');
    assert.ok(t.historicalRateToUSD > 0, 'historicalRateToUSD must be positive');
    // For USD, baseAmountUSD should equal the original amount
    assert.equal(t.baseAmountUSD, 100);
    // Clean up
    await api('DELETE', `/transactions/${t._id}`, null, token);
  });

  it('POST /transactions — omitted currency defaults to user currency', async () => {
    const res = await api('POST', '/transactions', {
      type: 'expense',
      amount: 200,
      category: 'Food',
      description: 'default currency test',
      date: new Date().toISOString()
    }, token);
    assert.equal(res.status, 201);
    const t = res.data.data;
    assert.equal(t.amount, 200);
    // User currency was set to INR in the profile test
    assert.equal(t.currency, 'INR');
    assert.equal(typeof t.baseAmountUSD, 'number');
    assert.ok(t.baseAmountUSD > 0, 'baseAmountUSD must be positive');
    assert.equal(typeof t.historicalRateToUSD, 'number');
    // Clean up
    await api('DELETE', `/transactions/${t._id}`, null, token);
  });

  it('PUT /transactions/:id — updating only currency preserves original amount', async () => {
    // Create a transaction in INR
    const createRes = await api('POST', '/transactions', {
      type: 'expense',
      amount: 500,
      category: 'Shopping',
      description: 'currency change test',
      date: new Date().toISOString(),
      currency: 'INR'
    }, token);
    assert.equal(createRes.status, 201);
    const txnId = createRes.data.data._id;

    // Update only currency to USD — amount must stay 500
    const updateRes = await api('PUT', `/transactions/${txnId}`, {
      currency: 'USD'
    }, token);
    assert.equal(updateRes.status, 200);
    const updated = updateRes.data.data;
    assert.equal(updated.amount, 500, 'Amount must NOT change when only currency is updated');
    assert.equal(updated.currency, 'USD');
    assert.equal(typeof updated.baseAmountUSD, 'number');
    // For USD, baseAmountUSD should now equal the amount
    assert.equal(updated.baseAmountUSD, 500);
    // Clean up
    await api('DELETE', `/transactions/${txnId}`, null, token);
  });

  it('PUT /transactions/:id — updating amount recalculates USD fields', async () => {
    // Create a transaction in INR
    const createRes = await api('POST', '/transactions', {
      type: 'expense',
      amount: 1000,
      category: 'Food',
      description: 'amount update recalc test',
      date: new Date().toISOString(),
      currency: 'INR'
    }, token);
    assert.equal(createRes.status, 201);
    const txnId = createRes.data.data._id;
    const originalUSD = createRes.data.data.baseAmountUSD;

    // Double the amount
    const updateRes = await api('PUT', `/transactions/${txnId}`, {
      amount: 2000
    }, token);
    assert.equal(updateRes.status, 200);
    const updated = updateRes.data.data;
    assert.equal(updated.amount, 2000);
    assert.equal(updated.currency, 'INR');
    // baseAmountUSD should roughly double
    assert.ok(
      Math.abs(updated.baseAmountUSD - originalUSD * 2) < 0.01,
      `baseAmountUSD should approximately double: got ${updated.baseAmountUSD}, expected ~${originalUSD * 2}`
    );
    // Clean up
    await api('DELETE', `/transactions/${txnId}`, null, token);
  });

  it('CROSS-USER ISOLATION — user2 cannot access user1 transaction', async () => {
    const res = await api('GET', `/transactions/${transactionId}`, null, token2);
    assert.equal(res.status, 404);
  });

  it('CROSS-USER ISOLATION — user2 cannot update user1 transaction', async () => {
    const res = await api('PUT', `/transactions/${transactionId}`, { amount: 1 }, token2);
    assert.equal(res.status, 404);
  });

  it('CROSS-USER ISOLATION — user2 cannot delete user1 transaction', async () => {
    const res = await api('DELETE', `/transactions/${transactionId}`, null, token2);
    assert.equal(res.status, 404);
  });

  // --- CSV Export Tests ---

  it('GET /transactions/export — 401 unauthorized when no token provided', async () => {
    const res = await api('GET', '/transactions/export');
    assert.equal(res.status, 401);
  });

  it('GET /transactions/export — returns 200 with text/csv header and valid column row', async () => {
    const res = await api('GET', '/transactions/export', null, token);
    assert.equal(res.status, 200);
    const contentType = res.headers ? res.headers.get('content-type') : '';
    assert.ok(contentType.includes('text/csv'), `Expected Content-Type text/csv, got ${contentType}`);
    
    assert.equal(typeof res.data, 'string');
    const lines = res.data.split('\r\n');
    assert.ok(lines.length >= 2, 'Should contain header and at least one data row');
    assert.equal(lines[0], '"Date","Type","Amount","Currency","Display Amount","Category","Description"');
    assert.ok(res.data.includes('QA test expense') || res.data.includes('Updated QA test'));
  });

  it('GET /transactions/export?type=income — respects filter and returns only income', async () => {
    const res = await api('GET', '/transactions/export?type=income', null, token);
    assert.equal(res.status, 200);
    const lines = res.data.split('\r\n').filter(Boolean);
    assert.ok(lines.length >= 2);
    for (let i = 1; i < lines.length; i++) {
      assert.ok(lines[i].includes('"income"'));
      assert.ok(!lines[i].includes('"expense"'));
    }
  });

  it('GET /transactions/export?search=shopping — respects search filter', async () => {
    const res = await api('GET', '/transactions/export?search=shopping', null, token);
    assert.equal(res.status, 200);
    const lines = res.data.split('\r\n').filter(Boolean);
    assert.ok(lines.length >= 2);
    for (let i = 1; i < lines.length; i++) {
      assert.ok(lines[i].toLowerCase().includes('shopping'));
    }
  });

  it('GET /transactions/export — user isolation and empty results return CSV header gracefully', async () => {
    // User2 has no transactions created yet
    const res = await api('GET', '/transactions/export', null, token2);
    assert.equal(res.status, 200);
    const lines = res.data.split('\r\n').filter(Boolean);
    assert.equal(lines.length, 1, 'Empty transaction list should return only the header row');
    assert.equal(lines[0], '"Date","Type","Amount","Currency","Display Amount","Category","Description"');
    assert.ok(!res.data.includes('QA test expense'));
    assert.ok(!res.data.includes('QA test income'));
  });

  it('GET /transactions/export — properly escapes quotes and commas in CSV values', async () => {
    const specialTx = await api('POST', '/transactions', {
      type: 'expense',
      amount: 123.45,
      category: 'Food',
      description: 'Special "quoted", with comma & note',
      date: new Date().toISOString()
    }, token);
    assert.equal(specialTx.status, 201);
    const specialId = specialTx.data.data._id;

    const res = await api('GET', '/transactions/export?search=quoted', null, token);
    assert.equal(res.status, 200);
    assert.ok(res.data.includes('"Special ""quoted"", with comma & note"'), 'Should properly escape quotes per RFC 4180');

    // Clean up
    await api('DELETE', `/transactions/${specialId}`, null, token);
  });
});

// =============================================================
// BUDGETS
// =============================================================
describe('Budgets', () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  it('POST /budgets — create budget for current month', async () => {
    const res = await api('POST', '/budgets', {
      month, year, totalBudget: 15000,
      categoryBudgets: [
        { category: 'Food', amount: 5000 },
        { category: 'Shopping', amount: 3000 }
      ]
    }, token);
    assert.ok([200, 201].includes(res.status));
    assert.ok(res.data.data.totalBudget === 15000);
    budgetId = res.data.data._id;
  });

  it('POST /budgets — upsert same month updates', async () => {
    const res = await api('POST', '/budgets', {
      month, year, totalBudget: 18000
    }, token);
    assert.equal(res.status, 200);
    assert.equal(res.data.data.totalBudget, 18000);
  });

  it('GET /budgets/current — returns current month budget', async () => {
    const res = await api('GET', '/budgets/current', null, token);
    assert.equal(res.status, 200);
    assert.ok(res.data.data);
    assert.equal(res.data.data.month, month);
    assert.equal(res.data.data.year, year);
  });

  it('GET /budgets — returns all budgets', async () => {
    const res = await api('GET', '/budgets', null, token);
    assert.equal(res.status, 200);
    assert.ok(res.data.data.length >= 1);
  });

  it('GET /budgets/:id — get single', async () => {
    const res = await api('GET', `/budgets/${budgetId}`, null, token);
    assert.equal(res.status, 200);
    assert.equal(res.data.data._id, budgetId);
  });

  it('PUT /budgets/:id — update budget', async () => {
    const res = await api('PUT', `/budgets/${budgetId}`, {
      totalBudget: 20000
    }, token);
    assert.equal(res.status, 200);
    assert.equal(res.data.data.totalBudget, 20000);
  });

  it('CROSS-USER ISOLATION — user2 cannot access user1 budget', async () => {
    const res = await api('GET', `/budgets/${budgetId}`, null, token2);
    assert.equal(res.status, 404);
  });
});

// =============================================================
// SAVINGS GOALS
// =============================================================
describe('Savings Goals', () => {
  it('POST /savings-goals — create goal', async () => {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + 3);
    const res = await api('POST', '/savings-goals', {
      title: 'QA Test Savings Goal',
      targetAmount: 10000,
      currentAmount: 0,
      targetDate: targetDate.toISOString(),
      description: 'Test goal'
    }, token);
    assert.equal(res.status, 201);
    assert.equal(res.data.data.status, 'active');
    savingsGoalId = res.data.data._id;
  });

  it('GET /savings-goals — returns goals', async () => {
    const res = await api('GET', '/savings-goals', null, token);
    assert.equal(res.status, 200);
    assert.ok(res.data.data.length >= 1);
  });

  it('GET /savings-goals/:id — get single', async () => {
    const res = await api('GET', `/savings-goals/${savingsGoalId}`, null, token);
    assert.equal(res.status, 200);
  });

  it('PUT /savings-goals/:id — update goal', async () => {
    const res = await api('PUT', `/savings-goals/${savingsGoalId}`, {
      targetAmount: 12000
    }, token);
    assert.equal(res.status, 200);
    assert.equal(res.data.data.targetAmount, 12000);
  });

  it('PUT /savings-goals/:id/contribute — add contribution', async () => {
    const res = await api('PUT', `/savings-goals/${savingsGoalId}/contribute`, {
      amount: 3000
    }, token);
    assert.equal(res.status, 200);
    assert.equal(res.data.data.currentAmount, 3000);
    assert.equal(res.data.data.status, 'active');
  });

  it('PUT /savings-goals/:id/contribute — auto-completion', async () => {
    const res = await api('PUT', `/savings-goals/${savingsGoalId}/contribute`, {
      amount: 15000
    }, token);
    assert.equal(res.status, 200);
    assert.equal(res.data.data.currentAmount, 18000);
    assert.equal(res.data.data.status, 'completed');
  });

  it('PUT /savings-goals/:id/contribute — invalid amount', async () => {
    const res = await api('PUT', `/savings-goals/${savingsGoalId}/contribute`, {
      amount: -100
    }, token);
    assert.equal(res.status, 400);
  });

  it('CROSS-USER ISOLATION — user2 cannot access user1 goal', async () => {
    const res = await api('GET', `/savings-goals/${savingsGoalId}`, null, token2);
    assert.equal(res.status, 404);
  });
});

// =============================================================
// ANALYTICS
// =============================================================
describe('Analytics', () => {
  it('GET /analytics/overview — dashboard data', async () => {
    const res = await api('GET', '/analytics/overview', null, token);
    assert.equal(res.status, 200);
    const d = res.data.data;
    assert.ok(d.totalIncome !== undefined);
    assert.ok(d.totalExpenses !== undefined);
    assert.ok(d.currentBalance !== undefined);
    assert.ok(d.monthlyIncome !== undefined);
    assert.ok(d.monthlyExpenses !== undefined);
    assert.ok(Array.isArray(d.recentTransactions));
    assert.ok(Array.isArray(d.categorySummaries));
    assert.ok(d.userProfile);
    // Verify math: balance = totalIncome - totalExpenses
    assert.equal(d.currentBalance, +(d.totalIncome - d.totalExpenses).toFixed(2));
  });

  it('GET /analytics/monthly — monthly trends', async () => {
    const res = await api('GET', '/analytics/monthly?months=6', null, token);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.data));
    assert.ok(res.data.data.length <= 6);
    // Check structure
    const item = res.data.data[0];
    assert.ok(item.label);
    assert.ok(item.monthKey);
    assert.ok(item.income !== undefined);
    assert.ok(item.expenses !== undefined);
    assert.ok(item.netSavings !== undefined);
  });

  it('GET /analytics/categories — category breakdown', async () => {
    const res = await api('GET', '/analytics/categories', null, token);
    assert.equal(res.status, 200);
    assert.ok(res.data.data.categories);
    assert.ok(res.data.data.grandTotal !== undefined);
  });

  it('GET /analytics/spending-pace — spending pace', async () => {
    const res = await api('GET', '/analytics/spending-pace', null, token);
    assert.equal(res.status, 200);
    const d = res.data.data;
    assert.ok(d.status);
    assert.ok(d.averageDailySpending !== undefined);
    assert.ok(d.safeDailyLimit !== undefined);
    assert.ok(d.message);
  });

  it('GET /analytics/money-last — money projection', async () => {
    const res = await api('GET', '/analytics/money-last', null, token);
    assert.equal(res.status, 200);
    const d = res.data.data;
    assert.ok(d.status);
    assert.ok(d.daysSupported !== undefined);
    assert.ok(d.explanation);
  });

  it('GET /analytics/financial-health — health score', async () => {
    const res = await api('GET', '/analytics/financial-health', null, token);
    assert.equal(res.status, 200);
    const d = res.data.data;
    assert.ok(d.score >= 0 && d.score <= 100, `Score ${d.score} out of range`);
    assert.ok(d.grade);
    assert.ok(d.summary);
    assert.ok(d.factors);
    assert.ok(d.factors.budgetAdherence);
    assert.ok(d.factors.spendingPace);
    assert.ok(d.factors.savingsProgress);
    assert.ok(d.factors.balanceHealth);
    assert.ok(d.factors.expenseConsistency);
  });

  it('GET /analytics/suggestions — smart suggestions', async () => {
    const res = await api('GET', '/analytics/suggestions', null, token);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.data));
  });

  it('POST /analytics/saving-plan — generate plan', async () => {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + 6);
    const res = await api('POST', '/analytics/saving-plan', {
      targetAmount: 50000,
      targetDate: targetDate.toISOString()
    }, token);
    assert.equal(res.status, 200);
    const d = res.data.data;
    assert.equal(d.targetAmount, 50000);
    assert.ok(d.requiredSavings);
    assert.ok(d.requiredSavings.daily > 0);
    assert.ok(d.feasibility);
  });

  it('POST /analytics/saving-plan — past date fails', async () => {
    const res = await api('POST', '/analytics/saving-plan', {
      targetAmount: 50000,
      targetDate: '2020-01-01'
    }, token);
    assert.equal(res.status, 400);
  });

  it('Analytics — no auth returns 401', async () => {
    const res = await api('GET', '/analytics/overview');
    assert.equal(res.status, 401);
  });
});

// =============================================================
// REGRESSION: DASHBOARD BASELINE FINANCIAL INTEGRATION
// =============================================================
describe('Regression: Dashboard Baseline Financial Values Integration', () => {
  const REG_USER = {
    name: 'Regression Baseline User',
    email: `reg_baseline_${Date.now()}@test.com`,
    password: 'BaselinePass123!'
  };
  let regToken = '';
  let regIncomeTxnId = '';
  let regExpenseTxnId = '';

  it('1. Register user and configure baseline financial settings (30k income, 10k fixed, 5k savings)', async () => {
    const regRes = await api('POST', '/auth/register', REG_USER);
    assert.equal(regRes.status, 201);
    regToken = regRes.data.data.token;

    const profRes = await api('PUT', '/auth/profile', {
      monthlyIncome: 30000,
      fixedExpenses: 10000,
      savingsTarget: 5000,
      currency: 'INR',
      onboardingCompleted: true
    }, regToken);
    assert.equal(profRes.status, 200);
    assert.equal(profRes.data.data.monthlyIncome, 30000);
    assert.equal(profRes.data.data.fixedExpenses, 10000);
    assert.equal(profRes.data.data.savingsTarget, 5000);
  });

  it('2. Zero transactions: Dashboard overview reflects baseline values without fake transactions', async () => {
    const res = await api('GET', '/analytics/overview', null, regToken);
    assert.equal(res.status, 200);
    const d = res.data.data;

    assert.equal(d.monthlyIncome, 30000, 'Monthly Income must reflect configured baseline 30,000');
    assert.equal(d.monthlyExpenses, 0, 'Total Spent must be 0 with zero transactions');
    assert.equal(d.totalIncome, 30000, 'Total Income must reflect baseline income 30,000');
    assert.equal(d.totalExpenses, 15000, 'Total Expenses must reflect baseline obligations 15,000 (10k fixed + 5k savings)');
    assert.equal(d.currentBalance, 15000, 'Available Balance must be 15,000 (30k - 10k - 5k)');
    assert.equal(d.currentBalance, +(d.totalIncome - d.totalExpenses).toFixed(2));
    assert.equal(d.recentTransactions.length, 0, 'No fake transactions should be created');
    assert.equal(d.categorySummaries.length, 0);
  });

  it('3. Zero transactions: Safe Daily Limit reflects baseline available balance', async () => {
    const res = await api('GET', '/analytics/spending-pace', null, regToken);
    assert.equal(res.status, 200);
    const d = res.data.data;

    assert.equal(d.totalSpentThisMonth, 0);
    assert.equal(d.availableBalance, 15000);
    assert.ok(d.safeDailyLimit > 0, 'Safe daily limit must be greater than 0 with baseline balance');
    assert.equal(d.status, 'on_track');
  });

  it('4. Transaction integration: actual income/expense transactions adjust on top of baseline', async () => {
    // Add income transaction: +₹2,000
    const incRes = await api('POST', '/transactions', {
      title: 'Freelance Design',
      amount: 2000,
      type: 'income',
      category: 'Income',
      date: new Date().toISOString()
    }, regToken);
    assert.equal(incRes.status, 201);
    regIncomeTxnId = incRes.data.data._id;

    // Add expense transaction: -₹1,500
    const expRes = await api('POST', '/transactions', {
      title: 'Groceries',
      amount: 1500,
      type: 'expense',
      category: 'Food & Dining',
      date: new Date().toISOString()
    }, regToken);
    assert.equal(expRes.status, 201);
    regExpenseTxnId = expRes.data.data._id;

    const res = await api('GET', '/analytics/overview', null, regToken);
    assert.equal(res.status, 200);
    const d = res.data.data;

    assert.equal(d.monthlyIncome, 32000, 'Monthly Income should be 30,000 baseline + 2,000 txn');
    assert.equal(d.monthlyExpenses, 1500, 'Monthly Expenses should be 1,500 txn');
    assert.equal(d.totalIncome, 32000);
    assert.equal(d.totalExpenses, 16500, 'Total Expenses should be 15,000 baseline obligations + 1,500 txn');
    assert.equal(d.currentBalance, 15500, 'Available Balance should be 32,000 - 16,500 = 15,500');
    assert.equal(d.recentTransactions.length, 2);
  });

  it('5. Multi-currency architecture: baseline converted correctly when user switches display currency', async () => {
    await api('PUT', '/auth/profile', { currency: 'USD' }, regToken);

    const res = await api('GET', '/analytics/overview', null, regToken);
    assert.equal(res.status, 200);
    const d = res.data.data;

    // BASELINE_RATES.INR = 96.0; USD base = 1.0
    // baseline 30,000 INR = $312.50
    // baseline obligations 15,000 INR = $156.25
    assert.equal(d.userProfile.currency, 'USD');
    assert.ok(d.userProfile.monthlyIncome >= 300 && d.userProfile.monthlyIncome <= 330, `monthlyIncome ${d.userProfile.monthlyIncome} should be ~312 USD`);
    assert.ok(d.userProfile.fixedExpenses >= 95 && d.userProfile.fixedExpenses <= 115, `fixedExpenses ${d.userProfile.fixedExpenses} should be ~104 USD`);
    assert.ok(d.userProfile.savingsTarget >= 45 && d.userProfile.savingsTarget <= 60, `savingsTarget ${d.userProfile.savingsTarget} should be ~52 USD`);
    assert.equal(d.currentBalance, +(d.totalIncome - d.totalExpenses).toFixed(2));
  });

  it('6. Cleanup regression test user and transactions', async () => {
    if (regIncomeTxnId) await api('DELETE', `/transactions/${regIncomeTxnId}`, null, regToken);
    if (regExpenseTxnId) await api('DELETE', `/transactions/${regExpenseTxnId}`, null, regToken);
    await api('DELETE', '/auth/me', null, regToken);
  });
});

// =============================================================
// CURRENCY INTEGRATION TESTS
// =============================================================
describe('Currency Integration', () => {
  let currTestTxnId = '';
  let currTestBudgetId = '';
  let currTestGoalId = '';

  it('₹900 INR → USD is NOT $900 (must normalize via baseAmountUSD)', async () => {
    // Create a ₹900 INR transaction
    const res = await api('POST', '/transactions', {
      type: 'expense',
      amount: 900,
      category: 'Food',
      description: 'INR to USD test',
      date: new Date().toISOString(),
      currency: 'INR'
    }, token);
    assert.equal(res.status, 201);
    const t = res.data.data;
    assert.equal(t.amount, 900);
    assert.equal(t.currency, 'INR');
    // baseAmountUSD should be much less than 900 (INR/USD rate is ~96)
    assert.ok(t.baseAmountUSD < 900, `baseAmountUSD ${t.baseAmountUSD} should be much less than 900`);
    assert.ok(t.baseAmountUSD > 0, 'baseAmountUSD should be positive');
    // Rough check: at ~96 INR/USD, 900/96 ≈ 9.375
    assert.ok(t.baseAmountUSD < 20, `baseAmountUSD ${t.baseAmountUSD} should be around ~9.375, not 900`);
    currTestTxnId = t._id;
    // Cleanup
    await api('DELETE', `/transactions/${currTestTxnId}`, null, token);
  });

  it('Mixed-currency analytics: USD+INR transactions aggregate correctly', async () => {
    // Create a $100 USD and ₹9600 INR expense (both ~$100 USD at baseline rate 96)
    const [usdRes, inrRes] = await Promise.all([
      api('POST', '/transactions', {
        type: 'expense', amount: 100, category: 'Test',
        description: 'USD mixed test', date: new Date().toISOString(), currency: 'USD'
      }, token),
      api('POST', '/transactions', {
        type: 'expense', amount: 9600, category: 'Test',
        description: 'INR mixed test', date: new Date().toISOString(), currency: 'INR'
      }, token)
    ]);
    assert.equal(usdRes.status, 201);
    assert.equal(inrRes.status, 201);

    // The USD expense should have baseAmountUSD = 100
    assert.equal(usdRes.data.data.baseAmountUSD, 100);
    // The INR expense baseAmountUSD should be ~100 (9600/96)
    assert.ok(
      Math.abs(inrRes.data.data.baseAmountUSD - 100) < 5,
      `INR baseAmountUSD should be ~100, got ${inrRes.data.data.baseAmountUSD}`
    );

    // Clean up
    await api('DELETE', `/transactions/${usdRes.data.data._id}`, null, token);
    await api('DELETE', `/transactions/${inrRes.data.data._id}`, null, token);
  });

  it('₹5,000 budget → USD view does not mutate stored INR value', async () => {
    const now = new Date();
    const testMonth = now.getMonth() + 1;
    const testYear = now.getFullYear();

    // Delete any existing budget for this month to avoid collision
    const existing = await api('GET', '/budgets/current', null, token);
    if (existing.data.data) {
      await api('DELETE', `/budgets/${existing.data.data._id}`, null, token);
    }

    // Create ₹5000 INR budget
    const createRes = await api('POST', '/budgets', {
      month: testMonth, year: testYear,
      totalBudget: 5000, currency: 'INR'
    }, token);
    assert.ok([200, 201].includes(createRes.status));
    currTestBudgetId = createRes.data.data._id;
    const budget = createRes.data.data;
    assert.equal(budget.totalBudget, 5000, 'Stored budget must be 5000');
    assert.equal(budget.currency, 'INR', 'Stored currency must be INR');
    assert.ok(budget.baseBudgetUSD > 0, 'baseBudgetUSD should be computed');
    assert.ok(budget.baseBudgetUSD < 5000, 'baseBudgetUSD should be less than 5000 (INR→USD)');

    // Now update user currency to USD (simulating display change)
    await api('PUT', '/auth/profile', { currency: 'USD' }, token);

    // Re-fetch the budget — the stored totalBudget must STILL be 5000 INR
    const fetchRes = await api('GET', `/budgets/${currTestBudgetId}`, null, token);
    assert.equal(fetchRes.status, 200);
    assert.equal(fetchRes.data.data.totalBudget, 5000, 'Budget totalBudget must NOT be mutated to $5000');
    assert.equal(fetchRes.data.data.currency, 'INR', 'Budget currency must remain INR');

    // Restore user currency
    await api('PUT', '/auth/profile', { currency: 'INR' }, token);

    // Clean up
    await api('DELETE', `/budgets/${currTestBudgetId}`, null, token);
  });

  it('Savings contribution conversion snapshot is recorded correctly', async () => {
    // Create a savings goal in INR
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + 3);
    const goalRes = await api('POST', '/savings-goals', {
      title: 'Currency Contrib Test',
      targetAmount: 10000,
      currentAmount: 0,
      targetDate: targetDate.toISOString(),
      currency: 'INR'
    }, token);
    assert.equal(goalRes.status, 201);
    currTestGoalId = goalRes.data.data._id;
    assert.equal(goalRes.data.data.currency, 'INR');

    // Contribute $10 USD to an INR goal
    const contribRes = await api('PUT', `/savings-goals/${currTestGoalId}/contribute`, {
      amount: 10,
      currency: 'USD'
    }, token);
    assert.equal(contribRes.status, 200);
    const goal = contribRes.data.data;

    // Verify contribution snapshot
    assert.ok(goal.contributions.length >= 1, 'Should have at least 1 contribution');
    const contrib = goal.contributions[goal.contributions.length - 1];
    assert.equal(contrib.amount, 10, 'Original contribution amount preserved');
    assert.equal(contrib.currency, 'USD', 'Original contribution currency preserved');
    assert.ok(contrib.convertedAmountToGoalCurrency > 0, 'Converted amount should be positive');
    // $10 at ~96 INR/USD should give ~960 INR
    assert.ok(
      contrib.convertedAmountToGoalCurrency > 500,
      `Converted amount to INR should be >500, got ${contrib.convertedAmountToGoalCurrency}`
    );
    assert.ok(typeof contrib.exchangeRate === 'number', 'exchangeRate should be a number');
    assert.ok(contrib.rateTimestamp, 'rateTimestamp should be recorded');
    assert.ok(contrib.rateProvider, 'rateProvider should be recorded');

    // currentAmount should equal the converted amount (since initial was 0)
    assert.ok(
      Math.abs(goal.currentAmount - contrib.convertedAmountToGoalCurrency) < 0.01,
      'currentAmount should equal converted contribution'
    );

    // Message should NOT contain ₹ (contribution was in USD)
    assert.ok(
      contribRes.data.message.includes('$'),
      `Message should use $ for USD contribution: "${contribRes.data.message}"`
    );
    assert.ok(
      !contribRes.data.message.includes('₹'),
      `Message should NOT use ₹ for USD contribution: "${contribRes.data.message}"`
    );
  });

  it('Contribution remains unchanged after exchange rate changes', async () => {
    // Fetch the goal from the previous test
    const goalRes = await api('GET', `/savings-goals/${currTestGoalId}`, null, token);
    assert.equal(goalRes.status, 200);
    const contrib = goalRes.data.data.contributions[goalRes.data.data.contributions.length - 1];
    const originalConverted = contrib.convertedAmountToGoalCurrency;
    const originalRate = contrib.exchangeRate;
    const originalTimestamp = contrib.rateTimestamp;

    // Make another contribution — this does NOT change the previous one
    const contrib2Res = await api('PUT', `/savings-goals/${currTestGoalId}/contribute`, {
      amount: 5,
      currency: 'USD'
    }, token);
    assert.equal(contrib2Res.status, 200);

    // Verify the FIRST contribution is unchanged
    const updatedGoal = contrib2Res.data.data;
    const firstContrib = updatedGoal.contributions[updatedGoal.contributions.length - 2];
    assert.equal(firstContrib.convertedAmountToGoalCurrency, originalConverted, 'Earlier contribution must be immutable');
    assert.equal(firstContrib.exchangeRate, originalRate, 'Earlier contribution rate must be immutable');
    assert.equal(
      new Date(firstContrib.rateTimestamp).toISOString(),
      new Date(originalTimestamp).toISOString(),
      'Earlier contribution timestamp must be immutable'
    );

    // Clean up
    await api('DELETE', `/savings-goals/${currTestGoalId}`, null, token);
  });

  it('Analytics messages with non-INR currency contain no incorrect ₹', async () => {
    // Switch user to USD
    await api('PUT', '/auth/profile', { currency: 'USD' }, token);

    // Create a USD transaction to ensure analytics have data
    const txnRes = await api('POST', '/transactions', {
      type: 'expense', amount: 50, category: 'Food',
      description: 'USD analytics test', date: new Date().toISOString(), currency: 'USD'
    }, token);
    assert.equal(txnRes.status, 201);

    // Fetch spending pace — messages should use $ not ₹
    const paceRes = await api('GET', '/analytics/spending-pace', null, token);
    assert.equal(paceRes.status, 200);
    if (paceRes.data.data.message) {
      assert.ok(
        !paceRes.data.data.message.includes('₹'),
        `Spending pace message should NOT contain ₹ when user currency is USD: "${paceRes.data.data.message}"`
      );
    }

    // Fetch money-last — explanation should use $ not ₹
    const moneyRes = await api('GET', '/analytics/money-last', null, token);
    assert.equal(moneyRes.status, 200);
    if (moneyRes.data.data.explanation) {
      assert.ok(
        !moneyRes.data.data.explanation.includes('₹'),
        `Money-last explanation should NOT contain ₹ when user currency is USD: "${moneyRes.data.data.explanation}"`
      );
    }

    // Cleanup: delete test transaction, restore currency
    await api('DELETE', `/transactions/${txnRes.data.data._id}`, null, token);
    await api('PUT', '/auth/profile', { currency: 'INR' }, token);
  });

  it('INR savings goal with USD display currency converts total saved across goals (does NOT treat ₹15,000 as $15,000)', async () => {
    // 1. Switch user currency to USD
    await api('PUT', '/auth/profile', { currency: 'USD' }, token);

    // 2. Create savings goal "New Laptop" with native currency INR, target ₹60,000, current ₹15,000
    const createRes = await api('POST', '/savings-goals', {
      title: 'New Laptop',
      targetAmount: 60000,
      currentAmount: 15000,
      currency: 'INR'
    }, token);
    assert.equal(createRes.status, 201);
    const createdGoalId = createRes.data.data._id;

    // Verify stored amounts & currency are strictly preserved
    assert.equal(createRes.data.data.currency, 'INR');
    assert.equal(createRes.data.data.currentAmount, 15000);
    assert.equal(createRes.data.data.targetAmount, 60000);

    // Verify decorated display fields are converted properly
    assert.equal(createRes.data.data.displayCurrency, 'USD');
    assert.ok(
      createRes.data.data.currentAmountInDisplayCurrency > 150 && createRes.data.data.currentAmountInDisplayCurrency < 165,
      `currentAmountInDisplayCurrency should be ~156 USD, got ${createRes.data.data.currentAmountInDisplayCurrency}`
    );
    assert.notEqual(createRes.data.data.currentAmountInDisplayCurrency, 15000, 'Must NOT display ₹15,000 as $15,000');

    // 3. Fetch all savings goals via GET /api/savings-goals
    const listRes = await api('GET', '/savings-goals', null, token);
    assert.equal(listRes.status, 200);
    assert.ok(Array.isArray(listRes.data.data));

    const foundGoal = listRes.data.data.find(g => g._id === createdGoalId);
    assert.ok(foundGoal);
    assert.equal(foundGoal.currency, 'INR', 'Native currency must be preserved');
    assert.equal(foundGoal.currentAmount, 15000, 'Native current amount must be preserved');
    assert.equal(foundGoal.targetAmount, 60000, 'Native target amount must be preserved');

    // Display fields
    assert.equal(foundGoal.displayCurrency, 'USD');
    assert.ok(
      foundGoal.currentAmountInDisplayCurrency > 150 && foundGoal.currentAmountInDisplayCurrency < 165,
      `Converted display amount should be ~156 USD, got ${foundGoal.currentAmountInDisplayCurrency}`
    );
    assert.notEqual(foundGoal.currentAmountInDisplayCurrency, 15000, 'Must NOT treat ₹15,000 as $15,000');

    // Summary verification
    assert.ok(listRes.data.summary, 'Summary object should be present');
    assert.equal(listRes.data.summary.displayCurrency, 'USD');
    assert.ok(
      listRes.data.summary.totalSavedInDisplayCurrency > 150,
      `totalSavedInDisplayCurrency should be properly converted in USD, got ${listRes.data.summary.totalSavedInDisplayCurrency}`
    );
    assert.notEqual(listRes.data.summary.totalSavedInDisplayCurrency, 15000);

    // 4. Clean up goal & restore currency
    await api('DELETE', `/savings-goals/${createdGoalId}`, null, token);
    await api('PUT', '/auth/profile', { currency: 'INR' }, token);
  });
});

// =============================================================
// REGRESSION — Display Currency Switch on Transactions & Budgets
// =============================================================
describe('Regression: Display Currency Switch on Transactions & Budgets', () => {
  let usdTxId;
  let inrTxId;
  let inrBudgetId;

  it('Create USD $10 and INR ₹500 transactions and verify display fields in INR', async () => {
    // Ensure active currency is INR
    await api('PUT', '/auth/profile', { currency: 'INR' }, token);

    // 1. Create USD $10 transaction
    const usdTxRes = await api('POST', '/transactions', {
      type: 'expense',
      amount: 10,
      currency: 'USD',
      category: 'Food & Dining',
      description: 'USD test lunch',
      date: new Date().toISOString()
    }, token);

    assert.equal(usdTxRes.status, 201);
    usdTxId = usdTxRes.data.data._id;
    assert.equal(usdTxRes.data.data.amount, 10);
    assert.equal(usdTxRes.data.data.currency, 'USD');
    assert.equal(usdTxRes.data.data.displayCurrency, 'INR');
    assert.ok(
      usdTxRes.data.data.displayAmount >= 900 && usdTxRes.data.data.displayAmount <= 1000,
      `Expected displayAmount ~960 INR, got ${usdTxRes.data.data.displayAmount}`
    );

    // 2. Create INR ₹500 transaction
    const inrTxRes = await api('POST', '/transactions', {
      type: 'expense',
      amount: 500,
      currency: 'INR',
      category: 'Food & Dining',
      description: 'INR test snack',
      date: new Date().toISOString()
    }, token);

    assert.equal(inrTxRes.status, 201);
    inrTxId = inrTxRes.data.data._id;
    assert.equal(inrTxRes.data.data.amount, 500);
    assert.equal(inrTxRes.data.data.currency, 'INR');
    assert.equal(inrTxRes.data.data.displayCurrency, 'INR');
    assert.equal(inrTxRes.data.data.displayAmount, 500);

    // 3. Query GET /transactions with INR active
    const listRes = await api('GET', '/transactions?limit=20', null, token);
    assert.equal(listRes.status, 200);

    const foundUsd = listRes.data.data.find(t => t._id === usdTxId);
    const foundInr = listRes.data.data.find(t => t._id === inrTxId);

    assert.ok(foundUsd, 'USD transaction should be in list');
    assert.equal(foundUsd.amount, 10, 'Original amount must remain 10');
    assert.equal(foundUsd.currency, 'USD', 'Original currency must remain USD');
    assert.equal(foundUsd.displayCurrency, 'INR');
    assert.ok(foundUsd.displayAmount >= 900 && foundUsd.displayAmount <= 1000);

    assert.ok(foundInr, 'INR transaction should be in list');
    assert.equal(foundInr.amount, 500);
    assert.equal(foundInr.currency, 'INR');
    assert.equal(foundInr.displayCurrency, 'INR');
    assert.equal(foundInr.displayAmount, 500);
  });

  it('Switch active display currency to USD and verify transactions update immediately', async () => {
    // Switch currency to USD
    const profileRes = await api('PUT', '/auth/profile', { currency: 'USD' }, token);
    assert.equal(profileRes.status, 200);
    assert.equal(profileRes.data.data.currency, 'USD');

    // Fetch transactions
    const listRes = await api('GET', '/transactions?limit=20', null, token);
    assert.equal(listRes.status, 200);

    const foundUsd = listRes.data.data.find(t => t._id === usdTxId);
    const foundInr = listRes.data.data.find(t => t._id === inrTxId);

    // USD tx in USD display
    assert.equal(foundUsd.amount, 10);
    assert.equal(foundUsd.currency, 'USD');
    assert.equal(foundUsd.displayCurrency, 'USD');
    assert.equal(foundUsd.displayAmount, 10);

    // INR tx in USD display
    assert.equal(foundInr.amount, 500);
    assert.equal(foundInr.currency, 'INR');
    assert.equal(foundInr.displayCurrency, 'USD');
    assert.ok(
      foundInr.displayAmount >= 5.0 && foundInr.displayAmount <= 5.5,
      `Expected INR 500 in USD to be ~5.21, got ${foundInr.displayAmount}`
    );
  });

  it('Verify native INR budget displays converted total in USD without mutating stored budget', async () => {
    // 1. Create native INR budget for month 11 / 2099
    const createRes = await api('POST', '/budgets', {
      month: 11,
      year: 2099,
      totalBudget: 10000,
      currency: 'INR'
    }, token);

    assert.equal(createRes.status, 201);
    inrBudgetId = createRes.data.data._id;
    assert.equal(createRes.data.data.totalBudget, 10000);
    assert.equal(createRes.data.data.currency, 'INR');
    // Since user display currency is currently USD:
    assert.equal(createRes.data.data.displayCurrency, 'USD');
    assert.ok(
      createRes.data.data.displayTotalBudget >= 100 && createRes.data.data.displayTotalBudget <= 110,
      `Expected displayTotalBudget ~104.17 USD, got ${createRes.data.data.displayTotalBudget}`
    );

    // 2. Fetch list of budgets
    const listRes = await api('GET', '/budgets', null, token);
    const foundBudget = listRes.data.data.find(b => b._id === inrBudgetId);
    assert.ok(foundBudget);
    assert.equal(foundBudget.totalBudget, 10000);
    assert.equal(foundBudget.currency, 'INR');
    assert.equal(foundBudget.displayCurrency, 'USD');
    assert.notEqual(foundBudget.displayTotalBudget, 10000, 'Must NOT display 10,000 INR as 10,000 USD');

    // 3. Switch user display currency back to INR
    await api('PUT', '/auth/profile', { currency: 'INR' }, token);

    // 4. Fetch list of budgets again in INR
    const listInrRes = await api('GET', '/budgets', null, token);
    const foundBudgetInr = listInrRes.data.data.find(b => b._id === inrBudgetId);
    assert.ok(foundBudgetInr);
    assert.equal(foundBudgetInr.displayCurrency, 'INR');
    assert.equal(foundBudgetInr.displayTotalBudget, 10000);
  });

  it('Clean up currency switching regression test data', async () => {
    if (usdTxId) await api('DELETE', `/transactions/${usdTxId}`, null, token);
    if (inrTxId) await api('DELETE', `/transactions/${inrTxId}`, null, token);
    if (inrBudgetId) await api('DELETE', `/budgets/${inrBudgetId}`, null, token);
    await api('PUT', '/auth/profile', { currency: 'INR' }, token);
  });
});

// =============================================================
// CLEANUP — Delete test data
// =============================================================
describe('Cleanup', () => {
  it('Delete test transactions', async () => {
    // Get all test user's transactions and delete them
    const res = await api('GET', '/transactions?limit=100', null, token);
    for (const t of res.data.data) {
      await api('DELETE', `/transactions/${t._id}`, null, token);
    }
  });

  it('Delete test budget', async () => {
    if (budgetId) {
      await api('DELETE', `/budgets/${budgetId}`, null, token);
    }
  });

  it('Delete test savings goal', async () => {
    if (savingsGoalId) {
      await api('DELETE', `/savings-goals/${savingsGoalId}`, null, token);
    }
  });

  // Note: We can't delete users via API (no endpoint), but test users 
  // have unique emails so they won't interfere with real usage
});

console.log('\n=== Backend API Test Suite Complete ===\n');

