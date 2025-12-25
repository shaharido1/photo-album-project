import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchGreeting,
  selectGreeting,
  selectGreetingStatus,
  selectGreetingError,
} from './greetingSlice';

function Greeting(): JSX.Element | null {
  const dispatch = useAppDispatch();
  const message = useAppSelector(selectGreeting);
  const status = useAppSelector(selectGreetingStatus);
  const error = useAppSelector(selectGreetingError);

  useEffect(() => {
    if (status === 'idle') {
      void dispatch(fetchGreeting());
    }
  }, [status, dispatch]);

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (status === 'failed') {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  return (
    <div>
      <h1>{message}</h1>
      <p>From the API server with React-Redux</p>
    </div>
  );
}

export default Greeting;
