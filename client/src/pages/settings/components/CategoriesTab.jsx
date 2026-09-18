import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories, createCategory, deleteCategory } from '../../../features/categories/categorySlice';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Badge from '../../../components/ui/Badge';
import { FiPlus, FiTrash2, FiLock, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';

const COMMON_EMOJIS = ['🍔', '☕', '📚', '🏋️', '💻', '🎮', '👕', '🚕', '🎬', '💊', '🏠', '⚡', '🎓', '✈️', '💰', '🎁'];

const CategoriesTab = () => {
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.categories);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCatData, setNewCatData] = useState({
    name: '',
    type: 'expense',
    icon: '🏷️',
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState(null);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setModalLoading(true);
    const result = await dispatch(
      createCategory({
        name: newCatData.name.trim(),
        type: newCatData.type,
        icon: newCatData.icon.trim() || '🏷️',
      })
    );
    setModalLoading(false);

    if (createCategory.fulfilled.match(result)) {
      toast.success('Custom category created!');
      setIsModalOpen(false);
      setNewCatData({ name: '', type: 'expense', icon: '🏷️' });
    } else {
      toast.error(result.payload || 'Failed to create category');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCatId) return;
    const result = await dispatch(deleteCategory(deletingCatId));
    setDeletingCatId(null);
    if (deleteCategory.fulfilled.match(result)) {
      toast.success('Category removed');
    } else {
      toast.error(result.payload || 'Failed to delete category');
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const expenseCats = filteredCategories.filter((c) => c.type === 'expense');
  const incomeCats = filteredCategories.filter((c) => c.type === 'income');

  return (
    <div className="space-y-6">
      {/* Category Management Card */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Custom Categories</CardTitle>
            <CardDescription>
              Manage custom expense and income tags used to categorize your transactions and budgets.
            </CardDescription>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={FiPlus}
            onClick={() => setIsModalOpen(true)}
          >
            Add Category
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Search */}
          <div className="max-w-md">
            <Input
              type="text"
              placeholder="Search categories..."
              icon={FiSearch}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Expense Categories */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-dark-300">
                  Expense Categories
                </span>
                <Badge variant="danger">{expenseCats.length}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {expenseCats.map((cat) => (
                <div
                  key={cat._id || cat.name}
                  className="p-2.5 rounded-xl bg-dark-900 border border-dark-750 flex items-center justify-between gap-2 transition-colors hover:border-dark-600"
                >
                  <span className="text-xs font-medium text-white truncate flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0">{cat.icon || '🏷️'}</span>
                    <span className="truncate">{cat.name}</span>
                  </span>
                  {cat.isDefault ? (
                    <span title="Default category cannot be deleted">
                      <FiLock className="text-dark-500 text-xs shrink-0" />
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeletingCatId(cat._id)}
                      className="text-dark-400 hover:text-expense-400 p-1 rounded transition-colors"
                      title="Delete custom category"
                      aria-label={`Delete ${cat.name}`}
                    >
                      <FiTrash2 className="text-xs shrink-0" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Income Categories */}
          <div className="pt-4 border-t border-dark-750/70">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-dark-300">
                  Income Categories
                </span>
                <Badge variant="success">{incomeCats.length}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {incomeCats.map((cat) => (
                <div
                  key={cat._id || cat.name}
                  className="p-2.5 rounded-xl bg-dark-900 border border-dark-750 flex items-center justify-between gap-2 transition-colors hover:border-dark-600"
                >
                  <span className="text-xs font-medium text-white truncate flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0">{cat.icon || '💰'}</span>
                    <span className="truncate">{cat.name}</span>
                  </span>
                  {cat.isDefault ? (
                    <span title="Default category cannot be deleted">
                      <FiLock className="text-dark-500 text-xs shrink-0" />
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeletingCatId(cat._id)}
                      className="text-dark-400 hover:text-expense-400 p-1 rounded transition-colors"
                      title="Delete custom category"
                      aria-label={`Delete ${cat.name}`}
                    >
                      <FiTrash2 className="text-xs shrink-0" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Custom Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Category"
        description="Add a personalized spending or earnings tag to your budget tracking."
        size="sm"
      >
        <form onSubmit={handleAddCategory} className="space-y-4">
          <div>
            <label className="label mb-1.5">Category Type</label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-dark-900 border border-dark-750">
              <button
                type="button"
                onClick={() => setNewCatData((prev) => ({ ...prev, type: 'expense' }))}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  newCatData.type === 'expense'
                    ? 'bg-expense-500/20 text-expense-400 border border-expense-500/30'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setNewCatData((prev) => ({ ...prev, type: 'income' }))}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  newCatData.type === 'income'
                    ? 'bg-income-500/20 text-income-400 border border-income-500/30'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          <Input
            label="Category Name"
            type="text"
            placeholder="e.g. Gym, Library, Freelance"
            value={newCatData.name}
            onChange={(e) => setNewCatData((prev) => ({ ...prev, name: e.target.value }))}
            required
            autoFocus
          />

          <div>
            <label className="label mb-1.5">Emoji Icon</label>
            <div className="flex items-center gap-2 mb-2">
              <Input
                type="text"
                value={newCatData.icon}
                onChange={(e) => setNewCatData((prev) => ({ ...prev, icon: e.target.value }))}
                maxLength={4}
                className="w-20 text-center text-lg"
              />
              <span className="text-xs text-dark-400">Select an icon or type any emoji</span>
            </div>
            {/* Quick Emoji Suggestions */}
            <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-dark-900/60 border border-dark-750">
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setNewCatData((prev) => ({ ...prev, icon: emoji }))}
                  className="w-8 h-8 rounded-lg hover:bg-dark-750 text-base flex items-center justify-center transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={modalLoading}>
              Save Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Category Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingCatId}
        onClose={() => setDeletingCatId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Custom Category"
        message="Are you sure you want to delete this custom category? Your past transaction records will retain their category name."
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
};

export default CategoriesTab;
