import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchVersion = createAsyncThunk(
  'version/fetchVersion',
  async () => {
    const response = await fetch('/api/version');
    if (!response.ok) {
      throw new Error('Failed to fetch version');
    }
    const data = await response.json();
    return data.version;
  }
);

const versionSlice = createSlice({
  name: 'version',
  initialState: {
    value: '',
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVersion.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchVersion.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.value = action.payload;
      })
      .addCase(fetchVersion.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const selectVersion = (state) => state.version.value;
export const selectVersionStatus = (state) => state.version.status;
export const selectVersionError = (state) => state.version.error;

export default versionSlice.reducer;
