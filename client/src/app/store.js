import { configureStore } from '@reduxjs/toolkit';
import greetingReducer from '../features/greeting/greetingSlice';
import fooReducer from '../features/foo/fooSlice';
import versionReducer from '../features/version/versionSlice';
import photosReducer from '../features/photos/photosSlice';

export const store = configureStore({
  reducer: {
    greeting: greetingReducer,
    foo: fooReducer,
    version: versionReducer,
    photos: photosReducer,
  },
});
