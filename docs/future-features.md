# Future Features

This document tracks planned features and improvements. Items here are for future consideration - they don't block current work.

> **Note:** Consider moving this to GitHub Issues for better tracking and collaboration.

## Roles & Process

### Additional Reviewer Roles

- [ ] **Security Reviewer** - Check for vulnerabilities (XSS, injection, auth issues)
- [ ] **Performance Auditor** - Profile performance, check bundle size, N+1 queries
- [ ] **Accessibility (a11y) Reviewer** - ARIA labels, keyboard navigation, color contrast

### Process Improvements

- [ ] **Move feature tracking to GitHub Issues** - Better collaboration, linking to PRs
- [ ] **Add GitHub Project Board** - Visual kanban for feature tracking

## Architecture

### Shared Model System

Create a single source of truth for data models across DB, server, and client:

**Options to explore:**
1. Shared types package (`packages/shared/types.ts`)
2. Code generation from schema (e.g., from Firestore rules or JSON schema)
3. Runtime validation with Zod/Yup with type inference

**Benefits:**
- Type safety across boundaries
- Single place to update models
- Automatic validation

**Considerations:**
- Build complexity
- How to handle DB vs API vs client differences
- Versioning of shared types

### API Contract Validation

- [ ] Generate OpenAPI spec from Express routes
- [ ] Validate client requests against spec
- [ ] Auto-generate TypeScript types from spec

## Monitoring & Observability

- [ ] **Uptime monitoring** - UptimeRobot or similar
- [ ] **Error tracking** - Sentry integration
- [ ] **Performance monitoring** - Core Web Vitals tracking
- [ ] **Alerting** - Slack/email alerts for errors

## Testing

- [ ] **Visual regression testing** - Percy or Chromatic
- [ ] **Load testing** - k6 or Artillery for API load tests
- [ ] **Coverage enforcement** - Minimum coverage thresholds in CI

## Developer Experience

- [ ] **Pre-commit hooks** - Run lint/format before commit (not just pre-push)
- [ ] **Commit message linting** - Conventional commits enforcement
- [ ] **Branch naming conventions** - Automated checks

## Infrastructure

- [ ] **Staging environment** - Preview deployments for PRs
- [ ] **Database migrations** - Formalized migration process
- [ ] **Feature flags** - Gradual rollout capability

---

## How to Propose Features

1. Add to this document with description
2. Discuss in PR or conversation
3. When ready to implement, create proper task

## Priority Legend

When prioritizing, consider:
- **P0** - Blocking current work
- **P1** - Important for near-term
- **P2** - Nice to have
- **P3** - Future consideration
