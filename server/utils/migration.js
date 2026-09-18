/**
 * Deterministic, idempotent multi-currency migration helper
 * 
 * Safely backfills legacy documents (Transaction, Budget, SavingsGoal, User)
 * created prior to multi-currency support, assigning currency = 'INR'.
 */

const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const SavingsGoal = require('../models/SavingsGoal');
const User = require('../models/User');
const { BASELINE_RATES } = require('./currencyService');

async function migrateLegacyCurrencyData() {
  try {
    const inrRate = BASELINE_RATES.INR || 96.0;

    // 1. Migrate Transactions lacking currency field
    const unmigratedTxns = await Transaction.find({
      $or: [
        { currency: { $exists: false } },
        { currency: null },
        { baseAmountUSD: { $exists: false } }
      ]
    });

    if (unmigratedTxns.length > 0) {
      const bulkOps = unmigratedTxns.map(t => ({
        updateOne: {
          filter: { _id: t._id },
          update: {
            $set: {
              currency: t.currency || 'INR',
              baseAmountUSD: t.baseAmountUSD !== undefined ? t.baseAmountUSD : (t.amount / inrRate),
              historicalRateToUSD: t.historicalRateToUSD || inrRate
            }
          }
        }
      }));
      await Transaction.bulkWrite(bulkOps);
    }

    // 2. Migrate Budgets lacking currency field
    await Budget.updateMany(
      { $or: [{ currency: { $exists: false } }, { currency: null }] },
      [
        {
          $set: {
            currency: 'INR',
            baseBudgetUSD: { $divide: ['$totalBudget', inrRate] }
          }
        }
      ]
    );

    // 3. Migrate SavingsGoals lacking currency field
    await SavingsGoal.updateMany(
      { $or: [{ currency: { $exists: false } }, { currency: null }] },
      { $set: { currency: 'INR' } }
    );

    // 4. Migrate Users lacking profileBaseCurrency
    await User.updateMany(
      { $or: [{ profileBaseCurrency: { $exists: false } }, { profileBaseCurrency: null }] },
      { $set: { profileBaseCurrency: 'INR' } }
    );

    return { success: true, migratedTxnCount: unmigratedTxns.length };
  } catch (error) {
    console.error('Migration error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { migrateLegacyCurrencyData };
