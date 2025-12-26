# Developer Role

The developer role is the base role for implementing features and fixing bugs. This document provides guidelines for effective development workflow.

## Before Starting Any Feature

### 1. Understand the Task
- Read the requirements carefully
- Use TodoWrite to break down complex tasks into smaller steps
- Ask clarifying questions if requirements are ambiguous

### 2. Research Third-Party Libraries
**IMPORTANT:** Before implementing anything that uses a third-party library, framework, or API:
- Use Context7 MCP to get up-to-date documentation
- Check for breaking changes in recent versions
- Look for official examples and best practices

```
Examples of when to use Context7:
- Adding a new React hook pattern
- Using Firebase SDK methods
- Implementing Redux patterns
- Working with Playwright APIs
- Using Express middleware
```

### 3. Check Existing Patterns
- Look at how similar features are implemented in the codebase
- Follow established naming conventions and file structure
- Reuse existing utilities and components when possible

## During Implementation

### Code Quality
- Write TypeScript with proper typing (no `any` unless absolutely necessary)
- Run lint and typecheck frequently as you code:
  ```bash
  npx eslint . --fix
  npx tsc --noEmit
  ```
- Keep functions small and focused (< 50 lines ideally)
- Use meaningful variable and function names

### Task Tracking
- Use TodoWrite to track progress on multi-step tasks
- Mark todos as completed as you finish each step
- Add new todos if you discover additional work needed

### Testing Mindset
- Think about how you'll test the feature while implementing
- Consider edge cases and error scenarios
- Don't leave testing for "later"

## Before Handoff

**CRITICAL:** Before marking a feature as ready for review, you MUST:

### 1. Run Type Check
```bash
npx tsc --noEmit
```

### 2. Run Linting
```bash
npx eslint .
npx prettier --check "**/*.{js,jsx,ts,tsx,json}"
```

### 3. Fix Any Issues
```bash
npx eslint . --fix
npx prettier --write "**/*.{js,jsx,ts,tsx,json}"
```

### 4. Verify It Works
- Manually test the feature in the browser
- Check browser console for errors
- Verify API calls work correctly

## Handoff to Review Pipeline

Once the above checks pass, the feature moves through the review pipeline:

```
Developer (you) → /review → /qa → /ux → /docs → /deploy
```

You can initiate this by running `/feature` which will run all roles in sequence.

## Key Files

| File | Purpose |
|------|---------|
| [architecture.md](./architecture.md) | Tech stack, project structure |
| [firebase.md](./firebase.md) | Database and authentication |
| [third-party.md](./third-party.md) | Third-party library guidelines |

## Quick Commands

```bash
# Start development server
npm run dev

# Run type check
npx tsc --noEmit

# Run linting
npx eslint .

# Fix formatting
npx prettier --write .

# Run unit tests
npm test

# Run E2E tests
npm run test:e2e
```
