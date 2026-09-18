import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// Fetch all budgets
export const fetchBudgets = createAsyncThunk(
  'budgets/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/budgets');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch budgets');
    }
  }
);

// Fetch current month budget
export const fetchCurrentBudget = createAsyncThunk(
  'budgets/fetchCurrent',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/budgets/current');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch current budget');
    }
  }
);

// Create or upsert budget
export const createBudget = createAsyncThunk(
  'budgets/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await API.post('/budgets', data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save budget');
    }
  }
);

// Update budget by ID
export const updateBudget = createAsyncThunk(
  'budgets/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/budgets/${id}`, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update budget');
    }
  }
);

// Delete budget
export const deleteBudget = createAsyncThunk(
  'budgets/delete',
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/budgets/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete budget');
    }
  }
);

const initialState = {
  budgets: [],
  currentBudget: null,
  loading: false,
  error: null,
};

const budgetSlice = createSlice({
  name: 'budgets',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchBudgets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBudgets.fulfilled, (state, action) => {
        state.loading = false;
        state.budgets = action.payload;
      })
      .addCase(fetchBudgets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Current
      .addCase(fetchCurrentBudget.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentBudget.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBudget = action.payload;
      })
      .addCase(fetchCurrentBudget.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create / Upsert
      .addCase(createBudget.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBudget.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBudget = action.payload;
        const index = state.budgets.findIndex((b) => b._id === action.payload._id);
        if (index !== -1) {
          state.budgets[index] = action.payload;
        } else {
          state.budgets.unshift(action.payload);
        }
      })
      .addCase(createBudget.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update
      .addCase(updateBudget.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.budgets.findIndex((b) => b._id === action.payload._id);
        if (index !== -1) {
          state.budgets[index] = action.payload;
        }
        if (state.currentBudget?._id === action.payload._id) {
          state.currentBudget = action.payload;
        }
      })
      // Delete
      .addCase(deleteBudget.fulfilled, (state, action) => {
        state.loading = false;
        state.budgets = state.budgets.filter((b) => b._id !== action.payload);
        if (state.currentBudget?._id === action.payload) {
          state.currentBudget = null;
        }
      });
  },
});

export const { clearError } = budgetSlice.actions;
export default budgetSlice.reducer;
