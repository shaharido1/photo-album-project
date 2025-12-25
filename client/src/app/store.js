import { configureStore } from '@reduxjs/toolkit';
import greetingReducer from '../features/greeting/greetingSlice';
import fooReducer from '../features/foo/fooSlice';
import versionReducer from '../features/version/versionSlice';

export const store = configureStore({
  reducer: {
    greeting: greetingReducer,
    foo: fooReducer,
    version: versionReducer,
  },
});
