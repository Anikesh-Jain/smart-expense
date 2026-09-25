import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTransactions,
  updateTransaction,
  deleteTransaction,
  resetFilters,
} from '../../features/transactions/transactionSlice';
import { fetchCategories } from '../../features/categories/categorySlice';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import API from '../../api/axios';
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiTrash2,
  FiEdit2,
  FiArrowUpRight,
  FiArrowDownRight,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiCalendar,
  FiX,
  FiDownload
} from 'react-icons/fi';
import toast from 'react-hot-toast';

import { getCurrencySymbol, getTransactionCurrencyDisplay, SUPPORTED_CURRENCIES } from '../../utils/currency';
import { formatFullDate } from '../../utils/date';

const TransactionsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { transactions, pagination, filters, loading, error } = useSelector((state) => state.transactions);
  const { categories } = useSelector((state) => state.categories);
  const { user } = useSelector((state) => state.auth);

  const currencyCode = user?.currency || 'INR';

  // Local filter states
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search || '');
  const [selectedType, setSelectedType] = useState(filters.type || '');
  const [selectedCategory, setSelectedCategory] = useState(filters.category || '');
  const [startDate, setStartDate] = useState(filters.startDate || '');
  const [endDate, setEndDate] = useState(filters.endDate || '');
  const [sortBy, setSortBy] = useState(filters.sort || '-date');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search input by 350ms to prevent duplicate concurrent API requests on each keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Edit modal state
  const [editingTx, setEditingTx] = useState(null);
  const [editFormData, setEditFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: '',
    currency: 'INR',
  });
  const [editLoading, setEditLoading] = useState(false);

  // Delete modal state
  const [deletingTxId, setDeletingTxId] = useState(null);

  // Load transactions
  const loadData = useCallback(() => {
    const params = {
      page: currentPage,
      limit: 15,
      sort: sortBy,
      displayCurrency: currencyCode,
    };
    if (selectedType) params.type = selectedType;
    if (selectedCategory) params.category = selectedCategory;
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    dispatch(fetchTransactions(params));
  }, [dispatch, currentPage, sortBy, selectedType, selectedCategory, debouncedSearch, startDate, endDate, currencyCode]);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setDebouncedSearch(searchInput);
    setCurrentPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedType('');
    setSelectedCategory('');
    setStartDate('');
    setEndDate('');
    setSortBy('-date');
    setCurrentPage(1);
    dispatch(resetFilters());
  };

  // Open Edit modal
  const handleOpenEdit = (tx) => {
    setEditingTx(tx);
    setEditFormData({
      type: tx.type,
      amount: tx.amount,
      category: tx.category,
      description: tx.description || '',
      date: tx.date ? new Date(tx.date).toISOString().split('T')[0] : '',
      currency: tx.currency || user?.currency || 'INR',
    });
  };

  // Submit Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editFormData.amount || Number(editFormData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setEditLoading(true);
    const result = await dispatch(
      updateTransaction({
        id: editingTx._id,
        data: {
          type: editFormData.type,
          amount: Number(editFormData.amount),
          category: editFormData.category,
          description: editFormData.description.trim(),
          date: editFormData.date,
          currency: editFormData.currency || user?.currency || 'INR',
        },
      })
    );
    setEditLoading(false);

    if (updateTransaction.fulfilled.match(result)) {
      toast.success('Transaction updated');
      setEditingTx(null);
      loadData();
    } else {
      toast.error(result.payload || 'Failed to update transaction');
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingTxId) return;
    const result = await dispatch(deleteTransaction(deletingTxId));
    setDeletingTxId(null);
    if (deleteTransaction.fulfilled.match(result)) {
      toast.success('Transaction removed');
      loadData();
    } else {
      toast.error(result.payload || 'Failed to delete transaction');
    }
  };

  // Export CSV state & handler
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const params = {
        sort: sortBy,
        displayCurrency: currencyCode,
      };
      if (selectedType) params.type = selectedType;
      if (selectedCategory) params.category = selectedCategory;
      if (searchInput.trim()) params.search = searchInput.trim();
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await API.get('/transactions/export', {
        params,
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `transactions_${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Transactions exported to CSV');
    } catch {
      toast.error('Failed to export transactions. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Unique Category options for filter
  const uniqueCategoryNames = Array.from(new Set(categories.map((c) => c.name)));
  const categoryOptions = uniqueCategoryNames.map((name) => {
    const c = categories.find((cat) => cat.name === name);
    return {
      value: name,
      label: `${c?.icon ? c.icon + ' ' : ''}${name}`,
    };
  });

  const hasActiveFilters = searchInput || selectedType || selectedCategory || startDate || endDate || sortBy !== '-date';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Transactions History</h2>
          <p className="text-xs sm:text-sm text-dark-400 mt-1">
            Search, filter, sort, and manage all your hostel expenses and income.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            icon={FiDownload}
            onClick={handleExportCSV}
            loading={isExporting}
            disabled={isExporting}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            icon={FiPlus}
            onClick={() => navigate('/transactions/add')}
          >
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <form onSubmit={handleSearchSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search text */}
              <div className="relative">
                <Input
                  placeholder="Search description..."
                  icon={FiSearch}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>

              {/* Type Filter */}
              <Select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Types (Expense & Income)</option>
                <option value="expense">Expenses Only</option>
                <option value="income">Income Only</option>
              </Select>

              {/* Category Filter */}
              <Select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Categories</option>
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>

              {/* Sort selector */}
              <Select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="-date">Date: Newest First</option>
                <option value="date">Date: Oldest First</option>
                <option value="-amount">Amount: Highest First</option>
                <option value="amount">Amount: Lowest First</option>
              </Select>
            </div>

            {/* Date range filters + reset buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-dark-750/50">
              <div className="flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto">
                <span className="text-dark-400 flex items-center gap-1">
                  <FiCalendar /> Date Range:
                </span>
                <input
                  type="date"
                  className="input py-1 px-2 text-xs w-full sm:w-36 bg-dark-900 border-dark-750"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  title="From Date"
                />
                <span className="text-dark-400">to</span>
                <input
                  type="date"
                  className="input py-1 px-2 text-xs w-full sm:w-36 bg-dark-900 border-dark-750"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  title="To Date"
                />
              </div>

              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={FiX}
                    onClick={handleResetFilters}
                  >
                    Clear Filters
                  </Button>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={FiRefreshCw}
                  onClick={loadData}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Transactions</CardTitle>
            {pagination && (
              <span className="text-xs text-dark-400 bg-dark-900 px-2 py-0.5 rounded-full border border-dark-750">
                {pagination.totalCount} total
              </span>
            )}
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div className="text-xs text-dark-400">
              Page {pagination.page} of {pagination.totalPages}
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {loading && (
            <div className="py-16 text-center">
              <LoadingSpinner size="lg" message="Loading records..." />
            </div>
          )}

          {!loading && error && (
            <div className="p-6 text-center text-expense-400">
              <p className="text-sm font-medium">{error}</p>
              <Button variant="secondary" size="sm" onClick={loadData} className="mt-3">
                Try Again
              </Button>
            </div>
          )}

          {!loading && !error && transactions.length === 0 && (
            <div className="p-6">
              <EmptyState
                icon={FiFilter}
                title={hasActiveFilters ? 'No Matching Transactions' : 'No Transactions Recorded Yet'}
                description={
                  hasActiveFilters
                    ? 'No records match your active search or filter criteria. Try clearing filters.'
                    : 'Start tracking your spending and incoming allowances to see analytics and safe daily limits.'
                }
                action={
                  hasActiveFilters ? (
                    <Button variant="secondary" size="sm" onClick={handleResetFilters}>
                      Clear Filters
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={FiPlus}
                      onClick={() => navigate('/transactions/add')}
                    >
                      Record First Transaction
                    </Button>
                  )
                }
              />
            </div>
          )}

          {!loading && !error && transactions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-dark-200">
                <thead className="bg-dark-900/60 border-b border-dark-750 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-750/50">
                  {transactions.map((tx) => {
                    const isIncome = tx.type === 'income';
                    const txDate = formatFullDate(tx.date);

                    return (
                      <tr key={tx._id} className="hover:bg-dark-750/30 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Badge variant={isIncome ? 'success' : 'danger'} size="sm">
                            <span className="flex items-center gap-1">
                              {isIncome ? <FiArrowUpRight /> : <FiArrowDownRight />}
                              {isIncome ? 'Income' : 'Expense'}
                            </span>
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-white">
                          {tx.category}
                        </td>
                        <td className="py-3.5 px-4 text-dark-300 max-w-xs truncate">
                          {tx.description || <span className="text-dark-500 italic">No notes</span>}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-dark-400">
                          {txDate}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-right font-semibold">
                          {(() => {
                            const currDisplay = getTransactionCurrencyDisplay(tx, currencyCode);
                            return (
                              <div className={isIncome ? 'text-income-400' : 'text-expense-400'}>
                                <span>{isIncome ? '+' : '-'}{currDisplay.primaryText}</span>
                                {currDisplay.secondaryText && (
                                  <span className="block text-xs font-normal text-dark-400 mt-0.5">
                                    {currDisplay.secondaryText}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(tx)}
                              className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
                              title="Edit transaction"
                            >
                              <FiEdit2 className="text-sm" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingTxId(tx._id)}
                              className="p-1.5 rounded-lg text-dark-400 hover:text-expense-400 hover:bg-dark-700 transition-colors"
                              title="Delete transaction"
                            >
                              <FiTrash2 className="text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="p-4 border-t border-dark-750/70 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-dark-400">
                Showing {transactions.length} of {pagination.totalCount} items
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={FiChevronLeft}
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <span className="text-xs font-medium text-dark-300 px-2">
                  {currentPage} / {pagination.totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={FiChevronRight}
                  iconPosition="right"
                  disabled={currentPage >= pagination.totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Transaction Modal */}
      <Modal
        isOpen={!!editingTx}
        onClose={() => setEditingTx(null)}
        title="Edit Transaction"
        description="Update transaction details"
        size="md"
      >
        {editingTx && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="label mb-1.5">Type</label>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-dark-900 border border-dark-750">
                <button
                  type="button"
                  onClick={() => setEditFormData((prev) => ({ ...prev, type: 'expense' }))}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                    editFormData.type === 'expense'
                      ? 'bg-expense-500/20 text-expense-400 border border-expense-500/30'
                      : 'text-dark-400 hover:text-white'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setEditFormData((prev) => ({ ...prev, type: 'income' }))}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                    editFormData.type === 'income'
                      ? 'bg-income-500/20 text-income-400 border border-income-500/30'
                      : 'text-dark-400 hover:text-white'
                  }`}
                >
                  Income
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Currency"
                value={editFormData.currency || currencyCode}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, currency: e.target.value }))}
              >
                {SUPPORTED_CURRENCIES.map((cur) => (
                  <option key={cur.code} value={cur.code}>
                    {cur.label}
                  </option>
                ))}
              </Select>

              <Input
                label={`Amount (${getCurrencySymbol(editFormData.currency || currencyCode)})`}
                type="number"
                min="0.01"
                step="any"
                value={editFormData.amount}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>

            <Select
              label="Category"
              value={editFormData.category}
              onChange={(e) => setEditFormData((prev) => ({ ...prev, category: e.target.value }))}
              required
            >
              {categories
                .filter((c) => c.type === editFormData.type)
                .map((cat) => (
                  <option key={cat._id || cat.name} value={cat.name}>
                    {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                  </option>
                ))}
            </Select>

            <Input
              label="Date"
              type="date"
              value={editFormData.date}
              onChange={(e) => setEditFormData((prev) => ({ ...prev, date: e.target.value }))}
              required
            />

            <Input
              label="Description (Optional)"
              value={editFormData.description}
              onChange={(e) => setEditFormData((prev) => ({ ...prev, description: e.target.value }))}
            />

            <div className="pt-3 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditingTx(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={editLoading}>
                Update Transaction
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingTxId}
        onClose={() => setDeletingTxId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Transaction"
        message="Are you sure you want to permanently delete this transaction? This will update your balances and safe daily limit calculations."
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
};

export default TransactionsPage;
