/**
 * Login Button Component
 *
 * Opens auth dialog for sign-in options
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/app/hooks';
import { selectAuthStatus } from '@/features/auth/authSlice';
import { isAuthAvailable } from '@/services/authService';
import { AuthDialog } from './AuthDialog';

interface LoginButtonProps {
  className?: string;
  variant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost" | null | undefined;
  children?: React.ReactNode;
}

export function LoginButton({
  className,
  variant = "outline",
  children,
}: LoginButtonProps): JSX.Element | null {
  const [dialogOpen, setDialogOpen] = useState(false);
  const status = useAppSelector(selectAuthStatus);

  // Don't render if Firebase is not configured
  if (!isAuthAvailable()) {
    return null;
  }

  const isLoading = status === 'loading';

  return (
    <div className={className}>
      <Button
        variant={variant}
        size="sm"
        onClick={() => setDialogOpen(true)}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Signing in...
          </>
        ) : (
          children || 'Sign In'
        )}
      </Button>
      <AuthDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
