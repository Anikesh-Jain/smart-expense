import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// Fetch savings goals
export const fetchSavingsGoals = createAsyncThunk(
  'savings/fetchAll',
  async (status = '', { rejectWithValue }) => {
    try {
      const response = await API.get('/savings-goals', {
        params: status ? { status } : {}
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch savings goals');
    }
  }
);

// Fetch single savings goal
export const fetchSavingsGoalById = createAsyncThunk(
  'savings/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.get(`/savings-goals/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch savings goal');
    }
  }
);

// Create savings goal
export const createSavingsGoal = createAsyncThunk(
  'savings/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await API.post('/savings-goals', data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create savings goal');
    }
  }
);

// Update savings goal
export const updateSavingsGoal = createAsyncThunk(
  'savings/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/savings-goals/${id}`, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update savings goal');
    }
  }
);

// Delete savings goal
export const deleteSavingsGoal = createAsyncThunk(
  'savings/delete',
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/savings-goals/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete savings goal');
    }
  }
);

// Contribute to savings goal
export const contributeToGoal = createAsyncThunk(
  'savings/contribute',
  async ({ id, amount, currency }, { rejectWithValue }) => {
    try {
      const payload = { amount };
      if (currency) payload.currency = currency;
      const response = await API.put(`/savings-goals/${id}/contribute`, payload);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add contribution');
    }
  }
);

const initialState = {
  goals: [],
  currentGoal: null,
  loading: false,
  error: null,
};

const savingsSlice = createSlice({
  name: 'savings',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSavingsGoals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSavingsGoals.fulfilled, (state, action) => {
        state.loading = false;
        state.goals = action.payload;
      })
      .addCase(fetchSavingsGoals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createSavingsGoal.fulfilled, (state, action) => {
        state.goals.unshift(action.payload);
      })
      .addCase(updateSavingsGoal.fulfilled, (state, action) => {
        const index = state.goals.findIndex((g) => g._id === action.payload._id);
        if (index !== -1) {
          state.goals[index] = action.payload;
        }
      })
      .addCase(deleteSavingsGoal.fulfilled, (state, action) => {
        state.goals = state.goals.filter((g) => g._id !== action.payload);
      })
      .addCase(contributeToGoal.fulfilled, (state, action) => {
        const index = state.goals.findIndex((g) => g._id === action.payload._id);
        if (index !== -1) {
          state.goals[index] = action.payload;
        }
      });
  },
});

export const { clearError } = savingsSlice.actions;
export default savingsSlice.reducer;
