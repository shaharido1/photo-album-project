import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchGreeting,
  selectGreeting,
  selectGreetingStatus,
  selectGreetingError,
} from './greetingSlice';

function Greeting() {
  const dispatch = useDispatch();
  const message = useSelector(selectGreeting);
  const status = useSelector(selectGreetingStatus);
  const error = useSelector(selectGreetingError);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchGreeting());
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
