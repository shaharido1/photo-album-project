import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import greetingReducer from './features/greeting/greetingSlice';
import fooReducer from './features/foo/fooSlice';
import App from './App';

const createTestStore = (preloadedState) => {
  return configureStore({
    reducer: {
      greeting: greetingReducer,
      foo: fooReducer,
    },
    preloadedState,
  });
};

describe('App', () => {
  it('renders loading state initially', () => {
    const store = createTestStore({
      greeting: { message: '', status: 'idle', error: null },
      foo: { value: '', status: 'idle', error: null },
    });

    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders greeting message when loaded', () => {
    const store = createTestStore({
      greeting: { message: 'Hello World', status: 'succeeded', error: null },
      foo: { value: 'foo', status: 'succeeded', error: null },
    });

    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(
      screen.getByText('From the API server with React-Redux')
    ).toBeInTheDocument();
  });

  it('renders error state when fetch fails', () => {
    const store = createTestStore({
      greeting: {
        message: '',
        status: 'failed',
        error: 'Failed to fetch greeting',
      },
      foo: { value: '', status: 'succeeded', error: null },
    });

    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    expect(
      screen.getByText('Error: Failed to fetch greeting')
    ).toBeInTheDocument();
  });

  it('renders foo value when loaded', () => {
    const store = createTestStore({
      greeting: { message: 'Hello World', status: 'succeeded', error: null },
      foo: { value: 'foo', status: 'succeeded', error: null },
    });

    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    expect(screen.getByText('Foo from server: foo')).toBeInTheDocument();
  });
});
