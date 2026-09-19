import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';
import { updateProfile } from '../auth/authSlice';

// Monthly trends
export const fetchMonthlyTrends = createAsyncThunk(
  'analytics/fetchMonthlyTrends',
  async (params = 6, { rejectWithValue }) => {
    try {
      const queryParams = typeof params === 'number'
        ? { months: params }
        : { months: 6, ...params };
      const response = await API.get('/analytics/monthly', { params: queryParams });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch monthly trends');
    }
  }
);

// Category breakdown
export const fetchCategoryBreakdown = createAsyncThunk(
  'analytics/fetchCategoryBreakdown',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/analytics/categories', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch category breakdown');
    }
  }
);

// Spending pace
export const fetchSpendingPace = createAsyncThunk(
  'analytics/fetchSpendingPace',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/analytics/spending-pace', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch spending pace');
    }
  }
);

// Will my money last
export const fetchWillMoneyLast = createAsyncThunk(
  'analytics/fetchWillMoneyLast',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/analytics/money-last', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch money projection');
    }
  }
);

// Financial health score
export const fetchFinancialHealth = createAsyncThunk(
  'analytics/fetchFinancialHealth',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/analytics/financial-health', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch financial health score');
    }
  }
);

// Smart suggestions
export const fetchSmartSuggestions = createAsyncThunk(
  'analytics/fetchSmartSuggestions',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/analytics/suggestions', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch smart suggestions');
    }
  }
);

// Smart saving plan
export const generateSavingPlan = createAsyncThunk(
  'analytics/generateSavingPlan',
  async (planParams, { rejectWithValue }) => {
    try {
      const response = await API.post('/analytics/saving-plan', planParams);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate saving plan');
    }
  }
);

const initialState = {
  monthlyTrends: [],
  categoryBreakdown: null,
  spendingPace: null,
  willMoneyLast: null,
  financialHealth: null,
  suggestions: [],
  savingPlan: null,
  loading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSavingPlan: (state) => {
      state.savingPlan = null;
    },
    clearAnalyticsData: (state) => {
      state.monthlyTrends = [];
      state.categoryBreakdown = null;
      state.spendingPace = null;
      state.willMoneyLast = null;
      state.financialHealth = null;
      state.suggestions = [];
      state.savingPlan = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Monthly Trends
      .addCase(fetchMonthlyTrends.fulfilled, (state, action) => {
        state.monthlyTrends = action.payload;
      })
      // Category Breakdown
      .addCase(fetchCategoryBreakdown.fulfilled, (state, action) => {
        state.categoryBreakdown = action.payload;
      })
      // Spending Pace
      .addCase(fetchSpendingPace.fulfilled, (state, action) => {
        state.spendingPace = action.payload;
      })
      // Will Money Last
      .addCase(fetchWillMoneyLast.fulfilled, (state, action) => {
        state.willMoneyLast = action.payload;
      })
      // Financial Health
      .addCase(fetchFinancialHealth.fulfilled, (state, action) => {
        state.financialHealth = action.payload;
      })
      // Suggestions
      .addCase(fetchSmartSuggestions.fulfilled, (state, action) => {
        state.suggestions = action.payload;
      })
      // Saving Plan
      .addCase(generateSavingPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateSavingPlan.fulfilled, (state, action) => {
        state.loading = false;
        state.savingPlan = action.payload;
      })
      .addCase(generateSavingPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Invalidate and reset stale analytics data when display currency is updated
      .addCase(updateProfile.fulfilled, (state, action) => {
        if (action.payload?.currency) {
          state.monthlyTrends = [];
          state.categoryBreakdown = null;
          state.spendingPace = null;
          state.willMoneyLast = null;
          state.financialHealth = null;
          state.suggestions = [];
          state.savingPlan = null;
        }
      });
  },
});

export const { clearError, clearSavingPlan, clearAnalyticsData } = analyticsSlice.actions;
export default analyticsSlice.reducer;
