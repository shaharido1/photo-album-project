import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/apiClient';
import { getIdToken } from '@/services/authService';
import {
  API_ENDPOINTS,
  type FeedbackResponse,
} from '@photo-album/types';

interface FeedbackType {
  id: 'bug' | 'feature' | 'general';
  name: string;
  description: string;
}

const FEEDBACK_TYPES: FeedbackType[] = [
  {
    id: 'bug',
    name: 'Bug Report',
    description: 'Something is not working correctly',
  },
  {
    id: 'feature',
    name: 'Feature Request',
    description: 'Suggest a new feature or improvement',
  },
  {
    id: 'general',
    name: 'General Feedback',
    description: 'Share your thoughts or comments',
  },
];

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDialog({
  open,
  onOpenChange,
}: FeedbackDialogProps): JSX.Element {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [feedbackType, setFeedbackType] = React.useState<FeedbackType>(
    FEEDBACK_TYPES[2]
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<FeedbackResponse['issue'] | null>(
    null
  );

  const resetForm = (): void => {
    setTitle('');
    setDescription('');
    setFeedbackType(FEEDBACK_TYPES[2]);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (): Promise<void> => {
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const token = await getIdToken();
      if (!token) {
        setError('You must be logged in to submit feedback');
        return;
      }

      const data = await api.post<FeedbackResponse>(
        API_ENDPOINTS.FEEDBACK,
        {
          title: title.trim(),
          description: description.trim(),
          feedbackType: feedbackType.id,
        },
        { authenticated: true }
      );

      setSuccess(data.issue);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to submit feedback'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean): void => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleClose = (): void => {
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Help us improve by sharing your feedback. This will create a GitHub
            issue for review.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">
              Thank you for your feedback!
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Issue #{success.number} has been created.
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={() => window.open(success.url, '_blank')}>
                View Issue
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Feedback Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {FEEDBACK_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFeedbackType(type)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-lg border-2 p-2 text-center transition-colors hover:bg-accent',
                        feedbackType.id === type.id
                          ? 'border-primary bg-accent'
                          : 'border-muted'
                      )}
                    >
                      <div className="text-xs font-semibold">{type.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="feedback-title">Title</Label>
                <Input
                  id="feedback-title"
                  placeholder="Brief summary of your feedback"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="feedback-description">Description</Label>
                <Textarea
                  id="feedback-description"
                  placeholder="Please provide as much detail as possible..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                  rows={5}
                />
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!title.trim() || !description.trim() || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
