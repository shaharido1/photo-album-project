import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';

interface FooState {
  value: string;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: FooState = {
  value: '',
  status: 'idle',
  error: null,
};

export const fetchFoo = createAsyncThunk<string>('foo/fetchFoo', async () => {
  const response = await fetch('/api/foo');
  if (!response.ok) {
    throw new Error('Failed to fetch foo');
  }
  const data = (await response.json()) as { value: string };
  return data.value;
});

const fooSlice = createSlice({
  name: 'foo',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFoo.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchFoo.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.value = action.payload;
      })
      .addCase(fetchFoo.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Unknown error';
      });
  },
});

export const selectFoo = (state: RootState): string => state.foo.value;
export const selectFooStatus = (state: RootState): FooState['status'] =>
  state.foo.status;
export const selectFooError = (state: RootState): string | null =>
  state.foo.error;

export default fooSlice.reducer;
