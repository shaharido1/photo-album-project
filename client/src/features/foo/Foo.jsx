import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchFoo,
  selectFoo,
  selectFooStatus,
  selectFooError,
} from './fooSlice';

function Foo() {
  const dispatch = useDispatch();
  const value = useSelector(selectFoo);
  const status = useSelector(selectFooStatus);
  const error = useSelector(selectFooError);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchFoo());
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
