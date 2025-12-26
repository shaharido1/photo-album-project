import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import { api, API_ENDPOINTS } from '@/services/apiClient';

interface VersionState {
  value: string;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: VersionState = {
  value: '',
  status: 'idle',
  error: null,
};

export const fetchVersion = createAsyncThunk<string>(
  'version/fetchVersion',
  async () => {
    const data = await api.get<{ version: string }>(API_ENDPOINTS.VERSION);
    return data.version;
  }
);

const versionSlice = createSlice({
  name: 'version',
  initialState,
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
        state.error = action.error.message ?? 'Unknown error';
      });
  },
});

export const selectVersion = (state: RootState): string => state.version.value;
export const selectVersionStatus = (state: RootState): VersionState['status'] =>
  state.version.status;
export const selectVersionError = (state: RootState): string | null =>
  state.version.error;

export default versionSlice.reducer;
