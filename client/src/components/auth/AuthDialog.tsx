/**
 * Auth Dialog Component
 *
 * Modal dialog for authentication with Google Sign-In and Email/Password options
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  signInWithGoogle,
  signInWithEmail,
  createAccount,
  resetPassword,
  selectAuthStatus,
  selectAuthError,
  clearError,
} from '@/features/auth/authSlice';

type AuthMode = 'signin' | 'signup' | 'reset';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps): JSX.Element {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const isLoading = status === 'loading';

  const handleGoogleSignIn = async (): Promise<void> => {
    if (error) dispatch(clearError());
    const result = await dispatch(signInWithGoogle());
    if (signInWithGoogle.fulfilled.match(result)) {
      onOpenChange(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (error) dispatch(clearError());
    const result = await dispatch(signInWithEmail({ email, password }));
    if (signInWithEmail.fulfilled.match(result)) {
      onOpenChange(false);
      resetForm();
    }
  };

  const handleCreateAccount = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (error) dispatch(clearError());
    const result = await dispatch(
      createAccount({ email, password, displayName: displayName || undefined })
    );
    if (createAccount.fulfilled.match(result)) {
      onOpenChange(false);
      resetForm();
    }
  };

  const handleResetPassword = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (error) dispatch(clearError());
    const result = await dispatch(resetPassword(email));
    if (resetPassword.fulfilled.match(result)) {
      setResetSent(true);
    }
  };

  const resetForm = (): void => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setResetSent(false);
  };

  const switchMode = (newMode: AuthMode): void => {
    setMode(newMode);
    if (error) dispatch(clearError());
    setResetSent(false);
  };

  const handleOpenChange = (newOpen: boolean): void => {
    onOpenChange(newOpen);
    if (!newOpen) {
      resetForm();
      setMode('signin');
      if (error) dispatch(clearError());
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'signin' && 'Sign In'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'reset' && 'Reset Password'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'signin' && 'Sign in to save and sync your albums'}
            {mode === 'signup' && 'Create a new account to get started'}
            {mode === 'reset' && 'Enter your email to receive a password reset link'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Google Sign-In (not shown on reset mode) */}
          {mode !== 'reset' && (
            <>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg
                  className="mr-2 h-4 w-4"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Email/Password Form */}
          <form
            onSubmit={
              mode === 'signin'
                ? handleEmailSignIn
                : mode === 'signup'
                  ? handleCreateAccount
                  : handleResetPassword
            }
            className="space-y-4"
          >
            {mode === 'signup' && (
              <Input
                type="text"
                placeholder="Display name (optional)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isLoading}
              />
            )}
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
            {mode !== 'reset' && (
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading}
              />
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            {resetSent && mode === 'reset' && (
              <p className="text-sm text-green-600">
                Password reset email sent! Check your inbox.
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                'Loading...'
              ) : mode === 'signin' ? (
                'Sign In'
              ) : mode === 'signup' ? (
                'Create Account'
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>

          {/* Mode switchers */}
          <div className="text-center text-sm">
            {mode === 'signin' && (
              <>
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => switchMode('reset')}
                >
                  Forgot password?
                </button>
                <span className="mx-2 text-muted-foreground">|</span>
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => switchMode('signup')}
                >
                  Create account
                </button>
              </>
            )}
            {mode === 'signup' && (
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => switchMode('signin')}
              >
                Already have an account? Sign in
              </button>
            )}
            {mode === 'reset' && (
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => switchMode('signin')}
              >
                Back to sign in
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
