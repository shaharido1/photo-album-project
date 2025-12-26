# Test Coverage Guidelines

This document defines what needs to be tested and coverage expectations.

## What Must Be Tested

### Server (Backend)

| Component | Must Test | Example |
|-----------|-----------|---------|
| API Routes | All endpoints | GET /api/albums returns albums |
| Middleware | Auth checks | Unauthenticated requests rejected |
| Services | Business logic | Album creation validates input |
| Error Handling | Error responses | Invalid ID returns 404 |

### Client (Frontend)

| Component | Must Test | Example |
|-----------|-----------|---------|
| Components | Render states | Button renders with correct label |
| User Interactions | Click handlers | Form submission triggers action |
| Redux Slices | All reducers | fetchAlbums updates state correctly |
| Async Operations | Loading/error states | Shows spinner while loading |

### E2E

| Flow | Must Test | Example |
|------|-----------|---------|
| Auth | Login/logout | User can sign in with Google |
| CRUD | Create, read, update, delete | User can create and delete album |
| Navigation | Page transitions | User can navigate between pages |
| Error Recovery | Error handling | Shows error message on API failure |

## Test Structure

### Unit Tests

Test in isolation with mocked dependencies:

```typescript
// Good: Isolated unit test
describe('calculateTotal', () => {
  it('sums item prices', () => {
    const items = [{ price: 10 }, { price: 20 }];
    expect(calculateTotal(items)).toBe(30);
  });
});
```

### Integration Tests

Test components working together:

```typescript
// Good: Tests API route with real middleware
describe('GET /api/albums', () => {
  it('returns user albums when authenticated', async () => {
    const response = await request(app)
      .get('/api/albums')
      .set('X-Test-User-Id', 'test-user');

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });
});
```

### E2E Tests

Test complete user flows:

```typescript
// Good: Full user journey
test('user can create an album', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Album' }).click();
  await page.getByLabel('Name').fill('My Album');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByText('My Album')).toBeVisible();
});
```

## Edge Cases to Cover

### Input Validation

```typescript
describe('input validation', () => {
  it('handles empty string', () => { ... });
  it('handles null', () => { ... });
  it('handles undefined', () => { ... });
  it('handles special characters', () => { ... });
  it('handles max length', () => { ... });
});
```

### API States

```typescript
describe('API handling', () => {
  it('shows loading state', () => { ... });
  it('shows success state', () => { ... });
  it('shows error state', () => { ... });
  it('handles network timeout', () => { ... });
  it('handles 404 not found', () => { ... });
  it('handles 500 server error', () => { ... });
});
```

### Auth States

```typescript
describe('auth states', () => {
  it('shows login button when unauthenticated', () => { ... });
  it('shows user menu when authenticated', () => { ... });
  it('redirects to login for protected routes', () => { ... });
  it('handles token expiration', () => { ... });
});
```

## Coverage Metrics

While we don't enforce coverage percentages, aim for:

| Metric | Target |
|--------|--------|
| New functions | 100% tested |
| New components | Render + key interactions tested |
| New API routes | Happy path + error cases tested |
| Critical paths | E2E tests required |

## Running Coverage Reports

```bash
# Server coverage
cd server && npm test -- --coverage

# Client coverage
cd client && npm test -- --coverage
```

## What NOT to Test

- Third-party library internals
- Simple pass-through functions
- CSS/styling (unless behavior-related)
- Auto-generated code

## Test Maintenance

- Delete tests for removed features
- Update tests when behavior changes
- Keep tests focused and readable
- Avoid testing implementation details
