import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchVersion,
  selectVersion,
  selectVersionStatus,
  selectVersionError,
} from './versionSlice';

function Version(): JSX.Element | null {
  const dispatch = useAppDispatch();
  const version = useAppSelector(selectVersion);
  const status = useAppSelector(selectVersionStatus);
  const error = useAppSelector(selectVersionError);

  useEffect(() => {
    if (status === 'idle') {
      void dispatch(fetchVersion());
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
