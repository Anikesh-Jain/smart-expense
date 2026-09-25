import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  contributeToGoal,
} from '../../features/savings/savingsSlice';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ProgressBar from '../../components/ui/ProgressBar';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  FiTarget,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiDollarSign,
  FiCalendar,
  FiClock,
  FiAward,
  FiTrendingUp
} from 'react-icons/fi';
import toast from 'react-hot-toast';

import { getCurrencySymbol, formatCurrency, SUPPORTED_CURRENCIES } from '../../utils/currency';
import { formatFullDate, isValidDate } from '../../utils/date';

const SavingsPage = () => {
  const dispatch = useDispatch();

  const { goals, loading } = useSelector((state) => state.savings);
  const { user } = useSelector((state) => state.auth);

  const currencyCode = user?.currency || 'INR';

  // Filter state
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, completed

  // Modal states
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalFormData, setGoalFormData] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '',
    currency: user?.currency || 'INR',
    targetDate: '',
    description: '',
  });

  const [contributeGoal, setContributeGoal] = useState(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contribCurrency, setContribCurrency] = useState(user?.currency || 'INR');
  const [modalLoading, setModalLoading] = useState(false);

  // Delete modal state
  const [deletingGoalId, setDeletingGoalId] = useState(null);

  useEffect(() => {
    dispatch(fetchSavingsGoals({ displayCurrency: currencyCode }));
  }, [dispatch, currencyCode]);

  // Open Create modal
  const handleOpenCreate = () => {
    setEditingGoal(null);
    setGoalFormData({
      title: '',
      targetAmount: '',
      currentAmount: '',
      currency: user?.currency || 'INR',
      targetDate: '',
      description: '',
    });
    setIsGoalModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (goal) => {
    setEditingGoal(goal);
    setGoalFormData({
      title: goal.title,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount || '',
      currency: goal.currency || user?.currency || 'INR',
      targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '',
      description: goal.description || '',
    });
    setIsGoalModalOpen(true);
  };

  // Save Goal (Create or Edit)
  const handleSaveGoal = async (e) => {
    e.preventDefault();
    if (!goalFormData.title.trim()) {
      toast.error('Please enter a goal title');
      return;
    }
    if (!goalFormData.targetAmount || Number(goalFormData.targetAmount) <= 0) {
      toast.error('Target amount must be greater than 0');
      return;
    }

    setModalLoading(true);
    const payload = {
      title: goalFormData.title.trim(),
      targetAmount: Number(goalFormData.targetAmount),
      currentAmount: Number(goalFormData.currentAmount) || 0,
      currency: goalFormData.currency || user?.currency || 'INR',
      targetDate: goalFormData.targetDate || undefined,
      description: goalFormData.description.trim(),
    };

    let result;
    if (editingGoal) {
      result = await dispatch(updateSavingsGoal({ id: editingGoal._id, data: payload }));
    } else {
      result = await dispatch(createSavingsGoal(payload));
    }
    setModalLoading(false);

    if (
      (editingGoal && updateSavingsGoal.fulfilled.match(result)) ||
      (!editingGoal && createSavingsGoal.fulfilled.match(result))
    ) {
      toast.success(editingGoal ? 'Goal updated successfully' : 'Savings goal created!');
      setIsGoalModalOpen(false);
    } else {
      toast.error(result.payload || 'Failed to save goal');
    }
  };

  // Handle Contribution
  const handleAddContribution = async (e) => {
    e.preventDefault();
    const amount = Number(contributionAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid contribution amount');
      return;
    }

    setModalLoading(true);
    const result = await dispatch(contributeToGoal({
      id: contributeGoal._id,
      amount,
      currency: contribCurrency
    }));
    setModalLoading(false);

    if (contributeToGoal.fulfilled.match(result)) {
      toast.success(`Contributed ${getCurrencySymbol(contribCurrency)}${amount} to ${contributeGoal.title}!`);
      setContributeGoal(null);
      setContributionAmount('');
    } else {
      toast.error(result.payload || 'Failed to add contribution');
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!deletingGoalId) return;
    const result = await dispatch(deleteSavingsGoal(deletingGoalId));
    setDeletingGoalId(null);
    if (deleteSavingsGoal.fulfilled.match(result)) {
      toast.success('Goal deleted');
    } else {
      toast.error(result.payload || 'Failed to delete goal');
    }
  };

  // Filtered goals
  const filteredGoals = goals.filter((g) => {
    if (filterStatus === 'active') return g.status !== 'completed';
    if (filterStatus === 'completed') return g.status === 'completed';
    return true;
  });

  // Summary statistics
  const totalSavedAllGoals = goals.reduce((sum, g) => {
    if (g.currentAmountInDisplayCurrency !== undefined && g.currentAmountInDisplayCurrency !== null) {
      return sum + Number(g.currentAmountInDisplayCurrency);
    }
    return sum + (Number(g.currentAmount) || 0);
  }, 0);
  const activeGoalsCount = goals.filter((g) => g.status !== 'completed').length;
  const completedGoalsCount = goals.filter((g) => g.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Savings Goals</h2>
          <p className="text-xs sm:text-sm text-dark-400 mt-1">
            Track targets for tech gadgets, semester fees, hostel deposits, and emergency reserves.
          </p>
        </div>
        <Button variant="primary" icon={FiPlus} onClick={handleOpenCreate} className="w-full sm:w-auto shrink-0">
          New Savings Goal
        </Button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <Card>
          <div className="flex items-center justify-between text-dark-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Saved Across Goals</span>
            <FiTrendingUp className="text-income-400" />
          </div>
          <p className="text-2xl font-bold text-income-400 tracking-tight truncate">
            {formatCurrency(totalSavedAllGoals, currencyCode, currencyCode !== 'JPY')}
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between text-dark-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Goals</span>
            <FiTarget className="text-info-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{activeGoalsCount}</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between text-dark-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
            <FiAward className="text-warning-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{completedGoalsCount}</p>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-dark-800 pb-3 overflow-x-auto no-scrollbar whitespace-nowrap -mx-1 sm:mx-0 px-1 sm:px-0">
        <button
          type="button"
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 min-h-[34px] ${
            filterStatus === 'all'
              ? 'bg-info-600/20 text-info-400 border border-info-500/30'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          All Goals ({goals.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('active')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 min-h-[34px] ${
            filterStatus === 'active'
              ? 'bg-info-600/20 text-info-400 border border-info-500/30'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          In Progress ({activeGoalsCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('completed')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 min-h-[34px] ${
            filterStatus === 'completed'
              ? 'bg-info-600/20 text-info-400 border border-info-500/30'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          Completed ({completedGoalsCount})
        </button>
      </div>

      {/* Goals Grid */}
      {loading && goals.length === 0 ? (
        <div className="py-20 text-center">
          <LoadingSpinner size="lg" message="Loading your savings goals..." />
        </div>
      ) : filteredGoals.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={FiTarget}
              title={filterStatus === 'all' ? 'No Savings Goals Yet' : `No ${filterStatus} goals`}
              description="Create a dedicated savings target to automatically receive monthly savings pace calculations and milestone celebration."
              action={
                filterStatus === 'all' ? (
                  <Button variant="primary" icon={FiPlus} onClick={handleOpenCreate}>
                    Create Your First Goal
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={() => setFilterStatus('all')}>
                    View All Goals
                  </Button>
                )
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGoals.map((goal) => {
            const goalCur = goal.currency || 'INR';
            const targetAmount = Number(goal.targetAmount) || 1;
            const currentAmount = Number(goal.currentAmount) || 0;
            const isCompleted = goal.status === 'completed' || currentAmount >= targetAmount;
            const percentage = Math.min(100, Math.round((currentAmount / targetAmount) * 100));
            const remaining = Math.max(0, targetAmount - currentAmount);

            // Target date calculations
            let daysRemaining = null;
            let requiredDaily = null;
            let requiredMonthly = null;
            if (goal.targetDate && isValidDate(goal.targetDate) && !isCompleted) {
              const diffMs = new Date(goal.targetDate) - new Date();
              daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
              requiredDaily = remaining / daysRemaining;
              requiredMonthly = requiredDaily * 30.4;
            }

            return (
              <Card key={goal._id} className="flex flex-col justify-between p-5 space-y-4 relative overflow-hidden">
                {isCompleted && (
                  <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden">
                    <div className="bg-income-500 text-dark-950 font-bold text-[10px] text-center py-1 rotate-45 transform translate-x-4 -translate-y-2 shadow-sm">
                      DONE
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3 pr-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-white tracking-tight break-words">{goal.title}</h3>
                        <Badge variant="neutral" size="sm">{goalCur}</Badge>
                      </div>
                      {goal.description && (
                        <p className="text-xs text-dark-400 mt-0.5 line-clamp-2 break-words">{goal.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Amount Progress */}
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-dark-400 block">Saved</span>
                      <span className="text-lg font-bold text-white">
                        {formatCurrency(currentAmount, goalCur, goalCur !== 'JPY')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-dark-400 block">Target</span>
                      <span className="text-sm font-semibold text-dark-200">
                        {formatCurrency(targetAmount, goalCur, goalCur !== 'JPY')}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <ProgressBar
                    value={percentage}
                    max={100}
                    color={isCompleted ? 'emerald' : percentage > 50 ? 'blue' : 'amber'}
                    size="md"
                    showValue
                  />

                  {/* Target Date & Savings Requirements */}
                  {goal.targetDate && (
                    <div className="p-3 rounded-xl bg-dark-900 border border-dark-750 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-dark-300">
                        <span className="flex items-center gap-1">
                          <FiCalendar className="text-info-400" /> Target Date:
                        </span>
                        <span className="font-semibold text-white">
                          {formatFullDate(goal.targetDate)}
                        </span>
                      </div>

                      {!isCompleted && daysRemaining !== null && (
                        <div className="flex items-center justify-between text-dark-400 pt-1 border-t border-dark-750/60">
                          <span className="flex items-center gap-1">
                            <FiClock /> Days Left:
                          </span>
                          <span className="text-warning-400 font-medium">
                            {daysRemaining} days (~{formatCurrency(requiredMonthly, goalCur)}/mo)
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-dark-750/70 flex items-center justify-between gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={FiDollarSign}
                    disabled={isCompleted}
                    onClick={() => {
                      setContributeGoal(goal);
                      setContribCurrency(user?.currency || goal.currency || 'INR');
                      setContributionAmount('');
                    }}
                  >
                    Contribute
                  </Button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(goal)}
                      className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
                      title="Edit Goal"
                    >
                      <FiEdit2 className="text-sm" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingGoalId(goal._id)}
                      className="p-1.5 rounded-lg text-dark-400 hover:text-expense-400 hover:bg-dark-700 transition-colors"
                      title="Delete Goal"
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Goal Modal */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title={editingGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}
        description="Set a target amount and optional deadline to budget your savings."
        size="md"
      >
        <form onSubmit={handleSaveGoal} className="space-y-4">
          <Input
            label="Goal Title"
            type="text"
            placeholder="e.g. Laptop fund, Semester excursion"
            icon={FiTarget}
            value={goalFormData.title}
            onChange={(e) => setGoalFormData((prev) => ({ ...prev, title: e.target.value }))}
            required
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Goal Currency"
              value={goalFormData.currency}
              onChange={(e) => setGoalFormData((prev) => ({ ...prev, currency: e.target.value }))}
              disabled={!!editingGoal}
            >
              {SUPPORTED_CURRENCIES.map((cur) => (
                <option key={cur.code} value={cur.code}>
                  {cur.label}
                </option>
              ))}
            </Select>

            <Input
              label={`Target Amount (${getCurrencySymbol(goalFormData.currency)})`}
              type="number"
              min="1"
              step="any"
              placeholder="e.g. 15000"
              icon={FiDollarSign}
              value={goalFormData.targetAmount}
              onChange={(e) => setGoalFormData((prev) => ({ ...prev, targetAmount: e.target.value }))}
              required
            />
          </div>

          <Input
            label={`Current Saved Amount (${getCurrencySymbol(goalFormData.currency)})`}
            type="number"
            min="0"
            step="any"
            placeholder="e.g. 2500"
            icon={FiDollarSign}
            value={goalFormData.currentAmount}
            onChange={(e) => setGoalFormData((prev) => ({ ...prev, currentAmount: e.target.value }))}
            helperText="Amount you have already put aside for this goal"
          />

          <Input
            label="Target Date (Optional)"
            type="date"
            icon={FiCalendar}
            value={goalFormData.targetDate}
            onChange={(e) => setGoalFormData((prev) => ({ ...prev, targetDate: e.target.value }))}
            min={new Date().toISOString().split('T')[0]}
            helperText="Deadline to help calculate daily/monthly required savings"
          />

          <Input
            label="Notes / Description (Optional)"
            type="text"
            placeholder="e.g. Need for next academic semester project"
            value={goalFormData.description}
            onChange={(e) => setGoalFormData((prev) => ({ ...prev, description: e.target.value }))}
          />

          <div className="pt-3 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsGoalModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={modalLoading}>
              {editingGoal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Contribution Modal */}
      <Modal
        isOpen={!!contributeGoal}
        onClose={() => setContributeGoal(null)}
        title={`Contribute to ${contributeGoal?.title}`}
        description="Add funds to accelerate your progress towards this goal."
        size="sm"
      >
        {contributeGoal && (
          <form onSubmit={handleAddContribution} className="space-y-4">
            <div className="p-3 rounded-xl bg-dark-900 border border-dark-750 text-xs space-y-2">
              <div className="flex justify-between text-dark-300">
                <span>Goal Target ({contributeGoal.currency || 'INR'})</span>
                <span className="font-semibold text-white">
                  {formatCurrency(contributeGoal.currentAmount || 0, contributeGoal.currency || 'INR', (contributeGoal.currency || 'INR') !== 'JPY')} / {formatCurrency(contributeGoal.targetAmount, contributeGoal.currency || 'INR', (contributeGoal.currency || 'INR') !== 'JPY')}
                </span>
              </div>
              <ProgressBar
                value={Math.round(((contributeGoal.currentAmount || 0) / contributeGoal.targetAmount) * 100)}
                max={100}
                size="sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Contribution Currency"
                value={contribCurrency}
                onChange={(e) => setContribCurrency(e.target.value)}
              >
                {SUPPORTED_CURRENCIES.map((cur) => (
                  <option key={cur.code} value={cur.code}>
                    {cur.label}
                  </option>
                ))}
              </Select>

              <Input
                label={`Contribution Amount (${getCurrencySymbol(contribCurrency)})`}
                type="number"
                min="0.01"
                step="any"
                placeholder="e.g. 500"
                icon={FiDollarSign}
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                required
                autoFocus
              />
            </div>

            {contribCurrency !== (contributeGoal.currency || 'INR') && (
              <div className="text-xs text-info-400 bg-info-500/10 border border-info-500/20 p-2.5 rounded-lg">
                Your contribution in {contribCurrency} will be converted to {contributeGoal.currency || 'INR'} at authoritative backend exchange rates.
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setContributeGoal(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={modalLoading}>
                Add Contribution
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingGoalId}
        onClose={() => setDeletingGoalId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Savings Goal"
        message="Are you sure you want to delete this savings goal? Any contribution progress recorded on it will be removed."
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
};

export default SavingsPage;
