import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchGreeting = createAsyncThunk(
  'greeting/fetchGreeting',
  async () => {
    const response = await fetch('/api/hello');
    if (!response.ok) {
      throw new Error('Failed to fetch greeting');
    }
    const data = await response.json();
    return data.message;
  }
);

const greetingSlice = createSlice({
  name: 'greeting',
  initialState: {
    message: '',
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGreeting.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchGreeting.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.message = action.payload;
      })
      .addCase(fetchGreeting.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const selectGreeting = (state) => state.greeting.message;
export const selectGreetingStatus = (state) => state.greeting.status;
export const selectGreetingError = (state) => state.greeting.error;

export default greetingSlice.reducer;
