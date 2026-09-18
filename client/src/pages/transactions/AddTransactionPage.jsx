import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createTransaction } from '../../features/transactions/transactionSlice';
import { fetchCategories } from '../../features/categories/categorySlice';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { FiArrowLeft, FiDollarSign, FiCalendar, FiFileText, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getCurrencySymbol, SUPPORTED_CURRENCIES } from '../../utils/currency';

const AddTransactionPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { categories, loading: categoriesLoading } = useSelector((state) => state.categories);
  const { loading: submitting } = useSelector((state) => state.transactions);
  const { user } = useSelector((state) => state.auth);
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: today,
    currency: user?.currency || 'INR',
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Filter categories matching current type
  const filteredCategories = categories.filter((c) => c.type === formData.type);
  const activeCategory = formData.category || (filteredCategories.length > 0 ? filteredCategories[0].name : '');

  const handleTypeChange = (newType) => {
    const matching = categories.filter((c) => c.type === newType);
    setFormData((prev) => ({
      ...prev,
      type: newType,
      category: matching.length > 0 ? matching[0].name : '',
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.amount || Number(formData.amount) <= 0) {
      errors.amount = 'Please enter a valid amount greater than 0';
    }
    if (!activeCategory) {
      errors.category = 'Please select a category';
    }
    if (!formData.date) {
      errors.date = 'Please select a transaction date';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      type: formData.type,
      amount: Number(formData.amount),
      currency: formData.currency || user?.currency || 'INR',
      category: activeCategory,
      description: formData.description.trim(),
      date: formData.date,
    };

    const resultAction = await dispatch(createTransaction(payload));
    if (createTransaction.fulfilled.match(resultAction)) {
      toast.success(`${formData.type === 'income' ? 'Income' : 'Expense'} recorded successfully!`);
      navigate('/transactions');
    } else {
      toast.error(resultAction.payload || 'Failed to save transaction');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          icon={FiArrowLeft}
          onClick={() => navigate('/transactions')}
        >
          Back
        </Button>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Record Transaction
          </h2>
          <p className="text-xs sm:text-sm text-dark-400 mt-0.5">
            Keep track of your hostel spends, bills, or incoming pocket money.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>Fill in the form to record a new entry</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Type Switcher */}
            <div>
              <label className="label mb-2">Transaction Type</label>
              <div className="grid grid-cols-2 gap-3 p-1 rounded-xl bg-dark-900 border border-dark-750">
                <button
                  type="button"
                  onClick={() => handleTypeChange('expense')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                    formData.type === 'expense'
                      ? 'bg-expense-500/20 text-expense-400 border border-expense-500/30 shadow-sm'
                      : 'text-dark-400 hover:text-dark-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-expense-500" />
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('income')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                    formData.type === 'income'
                      ? 'bg-income-500/20 text-income-400 border border-income-500/30 shadow-sm'
                      : 'text-dark-400 hover:text-dark-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-income-500" />
                  Income / Allowance
                </button>
              </div>
            </div>

            {/* Currency & Amount Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Transaction Currency"
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
              >
                {SUPPORTED_CURRENCIES.map((cur) => (
                  <option key={cur.code} value={cur.code} className="bg-dark-900 text-dark-100 py-1">
                    {cur.label}
                  </option>
                ))}
              </Select>

              <Input
                label={`Amount (${getCurrencySymbol(formData.currency)})`}
                id="amount"
                name="amount"
                type="number"
                min="0.01"
                step="any"
                placeholder="e.g. 250"
                icon={FiDollarSign}
                value={formData.amount}
                onChange={handleChange}
                error={formErrors.amount}
                required
                autoFocus
              />
            </div>

            {/* Category Select */}
            <div>
              <Select
                label="Category"
                id="category"
                name="category"
                value={activeCategory}
                onChange={handleChange}
                error={formErrors.category}
                disabled={categoriesLoading}
              >
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <option key={cat._id || cat.name} value={cat.name} className="bg-dark-900 text-dark-100 py-1">
                      {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled className="bg-dark-900 text-dark-400">
                    No categories found for {formData.type}
                  </option>
                )}
              </Select>
            </div>

            {/* Date */}
            <Input
              label="Transaction Date"
              id="date"
              name="date"
              type="date"
              icon={FiCalendar}
              value={formData.date}
              onChange={handleChange}
              error={formErrors.date}
              max={today}
              required
            />

            {/* Description / Notes */}
            <Input
              label="Description / Note (Optional)"
              id="description"
              name="description"
              type="text"
              placeholder="e.g. Canteen lunch with friends, Books for lab"
              icon={FiFileText}
              value={formData.description}
              onChange={handleChange}
              maxLength={150}
            />

            <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                className="w-full sm:w-auto order-2 sm:order-1"
                onClick={() => navigate('/transactions')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                icon={FiCheck}
                className="w-full sm:flex-1 order-1 sm:order-2"
              >
                Save Transaction
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddTransactionPage;
