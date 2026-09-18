import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import transactionReducer from '../features/transactions/transactionSlice';
import budgetReducer from '../features/budgets/budgetSlice';
import categoryReducer from '../features/categories/categorySlice';
import savingsReducer from '../features/savings/savingsSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import analyticsReducer from '../features/analytics/analyticsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    transactions: transactionReducer,
    budgets: budgetReducer,
    categories: categoryReducer,
    savings: savingsReducer,
    dashboard: dashboardReducer,
    analytics: analyticsReducer,
  },
});

export default store;
