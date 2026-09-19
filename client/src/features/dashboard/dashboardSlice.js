import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';
import { updateProfile } from '../auth/authSlice';

// Fetch full dashboard overview
export const fetchDashboardOverview = createAsyncThunk(
  'dashboard/fetchOverview',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/analytics/overview', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load dashboard data');
    }
  }
);

const initialState = {
  overview: null,
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearDashboardOverview: (state) => {
      state.overview = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.overview = action.payload;
      })
      .addCase(fetchDashboardOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Clear stale dashboard overview when display currency changes
      .addCase(updateProfile.fulfilled, (state, action) => {
        if (action.payload?.currency) {
          state.overview = null;
        }
      });
  },
});

export const { clearError, clearDashboardOverview } = dashboardSlice.actions;
export default dashboardSlice.reducer;
