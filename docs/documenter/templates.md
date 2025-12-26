# Documentation Templates

Use these templates when creating new documentation.

## Feature Documentation Template

```markdown
# Feature Name

Brief description of what this feature does.

## Overview

More detailed explanation of the feature's purpose and how it fits into the application.

## Usage

### Basic Usage

```typescript
// Code example showing basic usage
```

### Advanced Usage

```typescript
// Code example showing advanced options
```

## API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/feature` | Description |
| POST | `/api/feature` | Description |

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Feature ID |
| `options` | object | No | Additional options |

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `enabled` | true | Enable/disable feature |

## Examples

### Example 1: Common Use Case

```typescript
// Full working example
```

## Troubleshooting

### Common Issue 1

**Problem**: Description of issue
**Solution**: How to fix it

## Related

- [Related Feature](./related.md)
- [Architecture](./developer/architecture.md)
```

## API Endpoint Template

```markdown
## Endpoint Name

`METHOD /api/path`

Brief description.

### Request

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | Bearer token |

**Body:**
```json
{
  "field": "value"
}
```

### Response

**Success (200):**
```json
{
  "data": {}
}
```

**Error (400):**
```json
{
  "error": "Validation failed",
  "details": ["field is required"]
}
```

### Example

```bash
curl -X POST 'http://localhost:3001/api/path' \
  -H 'Authorization: Bearer token' \
  -H 'Content-Type: application/json' \
  -d '{"field": "value"}'
```
```

## Component Documentation Template

```markdown
# ComponentName

Brief description of the component.

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | string | Yes | - | Button label |
| `onClick` | () => void | No | - | Click handler |
| `disabled` | boolean | No | false | Disable button |

## Usage

```tsx
import { ComponentName } from '@/components/ComponentName';

function Example() {
  return (
    <ComponentName
      label="Click me"
      onClick={() => console.log('clicked')}
    />
  );
}
```

## Variants

### Primary

```tsx
<ComponentName variant="primary" label="Primary" />
```

### Secondary

```tsx
<ComponentName variant="secondary" label="Secondary" />
```

## Accessibility

- Keyboard navigable
- ARIA labels included
- Focus visible state

## Related Components

- [RelatedComponent](./RelatedComponent.md)
```

## Troubleshooting Guide Template

```markdown
# Troubleshooting: Feature Name

Common issues and solutions for [Feature Name].

## Quick Diagnostics

1. Check [thing] is running
2. Verify [configuration]
3. Look at [logs]

## Common Issues

### Issue: Error message text

**Symptoms:**
- What the user sees
- What behavior occurs

**Cause:**
Why this happens

**Solution:**
```bash
# Commands to fix
```

### Issue: Another common problem

**Symptoms:**
- Description

**Cause:**
- Explanation

**Solution:**
1. Step one
2. Step two
3. Step three

## Still Having Issues?

1. Check console for errors
2. Verify environment variables
3. Try clearing cache
4. [Create an issue](https://github.com/repo/issues)
```

## Changelog Entry Template

```markdown
## [Version] - YYYY-MM-DD

### Added
- New feature description

### Changed
- Modified behavior description

### Fixed
- Bug fix description

### Removed
- Deprecated feature removed
```

## Process Documentation Template

```markdown
# Process Name

## Overview

What this process accomplishes and when to use it.

## Prerequisites

- [ ] Prerequisite 1
- [ ] Prerequisite 2

## Steps

### Step 1: Description

Explanation of what this step does.

```bash
# Command to run
```

Expected output:
```
output here
```

### Step 2: Description

Continue with next steps...

## Verification

How to verify the process completed successfully:

```bash
# Verification command
```

## Rollback

If something goes wrong:

```bash
# Rollback command
```

## FAQ

**Q: Common question?**
A: Answer

**Q: Another question?**
A: Answer
```
