import { configureStore } from '@reduxjs/toolkit';
import greetingReducer from '../features/greeting/greetingSlice';
import fooReducer from '../features/foo/fooSlice';
import versionReducer from '../features/version/versionSlice';
import photosReducer from '../features/photos/photosSlice';
import albumReducer from '../features/album/albumSlice';
import authReducer from '../features/auth/authSlice';
import googlePhotosReducer from '../features/googlePhotos/googlePhotosSlice';
import settingsReducer from '../features/settings/settingsSlice';

export const store = configureStore({
  reducer: {
    greeting: greetingReducer,
    foo: fooReducer,
    version: versionReducer,
    photos: photosReducer,
    album: albumReducer,
    auth: authReducer,
    googlePhotos: googlePhotosReducer,
    settings: settingsReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
