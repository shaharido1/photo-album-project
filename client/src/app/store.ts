import { configureStore } from '@reduxjs/toolkit';
import greetingReducer from '../features/greeting/greetingSlice';
import fooReducer from '../features/foo/fooSlice';
import versionReducer from '../features/version/versionSlice';
import photosReducer from '../features/photos/photosSlice';
import albumReducer from '../features/album/albumSlice';
import authReducer from '../features/auth/authSlice';

export const store = configureStore({
  reducer: {
    greeting: greetingReducer,
    foo: fooReducer,
    version: versionReducer,
    photos: photosReducer,
    album: albumReducer,
    auth: authReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
