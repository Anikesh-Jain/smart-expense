const Category = require('../models/Category');

// @desc    Get all categories for current user
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res, next) => {
  try {
    const { type } = req.query;

    const query = { user: req.user._id };
    if (type && ['income', 'expense'].includes(type)) {
      query.type = type;
    }

    const categories = await Category.find(query)
      .sort({ isDefault: -1, name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a custom category
// @route   POST /api/categories
// @access  Private
const createCategory = async (req, res, next) => {
  try {
    const { name, type, icon } = req.body;

    const trimmedName = name.trim();

    // Check if category with same name (case-insensitive) and type already exists for this user
    const existing = await Category.findOne({
      user: req.user._id,
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
      type
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A ${type} category named "${trimmedName}" already exists`
      });
    }

    const category = await Category.create({
      user: req.user._id,
      name: trimmedName,
      type,
      icon: icon ? icon.trim() : '📦',
      isDefault: false
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category (custom category or icon for default)
// @route   PUT /api/categories/:id
// @access  Private
const updateCategory = async (req, res, next) => {
  try {
    let category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const { name, icon } = req.body;

    if (name !== undefined) {
      const trimmedName = name.trim();

      // Check for duplicate name if renaming
      if (trimmedName.toLowerCase() !== category.name.toLowerCase()) {
        const existing = await Category.findOne({
          user: req.user._id,
          name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
          type: category.type,
          _id: { $ne: category._id }
        });

        if (existing) {
          return res.status(400).json({
            success: false,
            message: `A ${category.type} category named "${trimmedName}" already exists`
          });
        }
      }

      category.name = trimmedName;
    }

    if (icon !== undefined) {
      category.icon = icon.trim() || '📦';
    }

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete custom category
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Protect default categories from being deleted
    if (category.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Default system categories cannot be deleted'
      });
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
