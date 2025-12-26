# Third-Party Library Guidelines

This document provides guidelines for working with third-party libraries, frameworks, and APIs.

## IMPORTANT: Use Context7 First

**Before implementing anything that uses a third-party library:**

1. Use Context7 MCP to fetch up-to-date documentation
2. Check for breaking changes in recent versions
3. Look for official examples and best practices
4. Verify the API hasn't changed since Claude's training data

## When to Use Context7

| Scenario | Example |
|----------|---------|
| Adding new library features | "Using Firebase Storage for file uploads" |
| Implementing patterns | "Redux async thunks with error handling" |
| Working with APIs | "Playwright locator strategies" |
| Updating dependencies | "React 18 concurrent features" |
| Debugging library issues | "Express middleware order matters" |

## Libraries in This Project

### Frontend

| Library | Version | Documentation |
|---------|---------|---------------|
| React | 18.x | reactjs.org |
| Redux Toolkit | 2.x | redux-toolkit.js.org |
| Vite | 5.x | vitejs.dev |
| Firebase JS SDK | 10.x | firebase.google.com/docs/web |

### Backend

| Library | Version | Documentation |
|---------|---------|---------------|
| Express | 4.x | expressjs.com |
| Firebase Admin SDK | 12.x | firebase.google.com/docs/admin |

### Testing

| Library | Version | Documentation |
|---------|---------|---------------|
| Jest | 29.x | jestjs.io |
| React Testing Library | 14.x | testing-library.com |
| Playwright | 1.x | playwright.dev |

## Best Practices

### 1. Pin Versions
Always use exact versions in package.json to avoid unexpected breaking changes:
```json
{
  "dependencies": {
    "react": "18.2.0",  // Good: exact version
    "react": "^18.2.0"  // Risky: allows minor updates
  }
}
```

### 2. Check Changelogs Before Updating
Before running `npm update`:
- Read the changelog for breaking changes
- Check if migration guides exist
- Test thoroughly after updating

### 3. Avoid Deprecated APIs
When Context7 shows deprecated warnings:
- Use the recommended replacement
- Don't rely on deprecated features even if they work

### 4. Follow Library Conventions
Each library has conventions:
- **React**: Hooks rules, component naming
- **Redux**: Action naming, selector patterns
- **Express**: Middleware order, error handling
- **Playwright**: Locator strategies, auto-waiting

## Adding New Dependencies

Before adding a new dependency:

1. **Check if it's necessary** - Can you use an existing library or native API?
2. **Evaluate the library**:
   - Is it actively maintained?
   - How many downloads/stars?
   - What's the bundle size impact?
3. **Use Context7** to understand proper usage
4. **Add to this document** if it's a significant dependency

## Common Patterns

### React + Redux

```typescript
// Use createAsyncThunk for API calls
export const fetchAlbums = createAsyncThunk(
  'albums/fetchAlbums',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getAlbums();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
```

### Firebase Auth

```typescript
// Always handle auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
  } else {
    // User is signed out
  }
});
```

### Playwright Testing

```typescript
// Prefer role-based locators
await page.getByRole('button', { name: 'Submit' }).click();

// Avoid CSS selectors when possible
await page.locator('.submit-btn').click(); // Less preferred
```
