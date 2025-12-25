import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';

interface GreetingState {
  message: string;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: GreetingState = {
  message: '',
  status: 'idle',
  error: null,
};

export const fetchGreeting = createAsyncThunk<string>(
  'greeting/fetchGreeting',
  async () => {
    const response = await fetch('/api/hello');
    if (!response.ok) {
      throw new Error('Failed to fetch greeting');
    }
    const data = (await response.json()) as { message: string };
    return data.message;
  }
);

const greetingSlice = createSlice({
  name: 'greeting',
  initialState,
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
        state.error = action.error.message ?? 'Unknown error';
      });
  },
});

export const selectGreeting = (state: RootState): string => state.greeting.message;
export const selectGreetingStatus = (state: RootState): GreetingState['status'] =>
  state.greeting.status;
export const selectGreetingError = (state: RootState): string | null =>
  state.greeting.error;

export default greetingSlice.reducer;
