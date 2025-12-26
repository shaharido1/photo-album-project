import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

interface FeedbackRequest {
  title: string;
  description: string;
  feedbackType?: 'bug' | 'feature' | 'general';
}

router.post(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const {
        title,
        description,
        feedbackType = 'general',
      } = req.body as FeedbackRequest;

      if (!title || !description) {
        res.status(400).json({ error: 'Title and description are required' });
        return;
      }

      const githubToken = process.env.GITHUB_TOKEN;
      if (!githubToken) {
        res.status(500).json({ error: 'Feedback service not configured' });
        return;
      }

      const owner = 'shaharido1';
      const repo = 'photo-album-project';

      const labels = ['feedback'];
      if (feedbackType === 'bug') labels.push('bug');
      if (feedbackType === 'feature') labels.push('enhancement');

      const issueBody = `## Feedback from User

**Submitted by:** ${req.user?.email || 'Unknown user'}
**Type:** ${feedbackType}

---

${description}

---
*This issue was automatically created via the feedback form.*`;

      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/issues`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
          body: JSON.stringify({
            title: `[Feedback] ${title}`,
            body: issueBody,
            labels,
          }),
        }
      );

      if (!response.ok) {
        res.status(500).json({ error: 'Failed to create feedback issue' });
        return;
      }

      const issue = (await response.json()) as {
        number: number;
        html_url: string;
      };

      res.status(201).json({
        success: true,
        issue: {
          number: issue.number,
          url: issue.html_url,
        },
      });
    } catch {
      res.status(500).json({ error: 'Failed to submit feedback' });
    }
  }
);

export default router;
