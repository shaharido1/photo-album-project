import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchVersion,
  selectVersion,
  selectVersionStatus,
  selectVersionError,
} from './versionSlice';

function Version() {
  const dispatch = useDispatch();
  const version = useSelector(selectVersion);
  const status = useSelector(selectVersionStatus);
  const error = useSelector(selectVersionError);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchVersion());
    }
  }, [status, dispatch]);

  if (status === 'loading') {
    return null;
  }

  if (status === 'failed') {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          fontSize: '12px',
          color: '#999',
        }}
      >
        Version: Error ({error})
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        fontSize: '12px',
        color: '#999',
      }}
    >
      v{version}
    </div>
  );
}

export default Version;
