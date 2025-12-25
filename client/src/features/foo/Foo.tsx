import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchFoo,
  selectFoo,
  selectFooStatus,
  selectFooError,
} from './fooSlice';

function Foo(): JSX.Element | null {
  const dispatch = useAppDispatch();
  const value = useAppSelector(selectFoo);
  const status = useAppSelector(selectFooStatus);
  const error = useAppSelector(selectFooError);

  useEffect(() => {
    if (status === 'idle') {
      void dispatch(fetchFoo());
    }
  }, [status, dispatch]);

  if (status === 'loading') {
    return <p>Loading foo...</p>;
  }

  if (status === 'failed') {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  return (
    <div>
      <h2>Foo from server: {value}</h2>
    </div>
  );
}

export default Foo;
