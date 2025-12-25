import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchFoo = createAsyncThunk('foo/fetchFoo', async () => {
  const response = await fetch('/api/foo');
  if (!response.ok) {
    throw new Error('Failed to fetch foo');
  }
  const data = await response.json();
  return data.value;
});

const fooSlice = createSlice({
  name: 'foo',
  initialState: {
    value: '',
    status: 'idle',
    error: null,
  },
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
        state.error = action.error.message;
      });
  },
});

export const selectFoo = (state) => state.foo.value;
export const selectFooStatus = (state) => state.foo.status;
export const selectFooError = (state) => state.foo.error;

export default fooSlice.reducer;
