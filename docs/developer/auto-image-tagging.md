# Auto Image Tagging Feature

## Overview

The Auto Image Tagging feature uses AI (Moondream2 vision language model) to automatically generate captions and tags for uploaded photos. This feature is optional and controlled by a user setting.

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (React)                           │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │  SettingsDialog │    │  PhotoUpload    │                    │
│  │  - Toggle UI    │    │  - Upload flow  │                    │
│  └────────┬────────┘    └────────┬────────┘                    │
│           │                      │                              │
│  ┌────────▼────────┐             │                              │
│  │  settingsSlice  │             │                              │
│  │  - Redux state  │             │                              │
│  └────────┬────────┘             │                              │
└───────────┼──────────────────────┼──────────────────────────────┘
            │                      │
            ▼                      ▼
┌───────────────────────────────────────────────────────────────┐
│                        Server (Express)                        │
│  ┌─────────────────┐    ┌─────────────────────────────────┐   │
│  │ /api/settings   │    │ /api/photos/upload/batch        │   │
│  │ - GET/PATCH     │    │ - After upload, triggers AI     │   │
│  └────────┬────────┘    └────────┬────────────────────────┘   │
│           │                      │                             │
│  ┌────────▼────────┐    ┌────────▼──────────────────────┐     │
│  │ settingsService │    │ imageAnalysisService          │     │
│  │ - Firestore     │    │ - Provider abstraction        │     │
│  └─────────────────┘    └────────┬──────────────────────┘     │
│                                  │                             │
│                         ┌────────▼──────────────────────┐     │
│                         │ MoondreamProvider             │     │
│                         │ - Local inference             │     │
│                         └────────┬──────────────────────┘     │
└──────────────────────────────────┼────────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │  Moondream Server        │
                    │  http://localhost:2020   │
                    └──────────────────────────┘
```

### Data Flow

1. **Settings Toggle**: User enables "Auto Image Tagging" in settings
2. **Photo Upload**: User uploads photos via drag-and-drop or file picker
3. **Upload Response**: Server returns photo metadata immediately (non-blocking)
4. **Background Processing**: Server checks user settings, if enabled:
   - Sends image to Moondream for analysis
   - Extracts caption and tags
   - Updates photo document in Firestore

### Key Files

| File | Description |
|------|-------------|
| `shared/types/src/settings.ts` | Settings types and schemas |
| `shared/types/src/firestore-types.ts` | Photo schema with AI fields |
| `server/src/services/imageAnalysis/types.ts` | Provider interface |
| `server/src/services/imageAnalysis/moondreamProvider.ts` | Moondream implementation |
| `server/src/services/imageAnalysis/index.ts` | Service factory |
| `server/src/routes/settings.ts` | Settings API endpoints |
| `server/src/routes/photos.ts` | Photo upload with AI integration |
| `client/src/features/settings/settingsSlice.ts` | Settings Redux state |
| `client/src/components/settings/SettingsDialog.tsx` | Settings UI |

## Provider System

The image analysis system uses an abstract provider interface for easy swapping between AI models.

### Interface

```typescript
interface ImageAnalysisProvider {
  readonly name: string;
  isAvailable(): Promise<boolean>;
  analyzeImage(imageBuffer: Buffer, options?: ImageAnalysisOptions): Promise<ImageAnalysisResult>;
}

interface ImageAnalysisResult {
  caption: string;      // AI-generated description
  tags: string[];       // Extracted keywords/tags
  provider: string;     // Provider name (e.g., 'moondream')
}
```

### Adding a New Provider

1. Create a new provider file in `server/src/services/imageAnalysis/`:

```typescript
// openaiProvider.ts
import { ImageAnalysisProvider, ImageAnalysisResult } from './types.js';

export class OpenAIProvider implements ImageAnalysisProvider {
  readonly name = 'openai';

  async isAvailable(): Promise<boolean> {
    // Check if API key is configured
    return !!process.env.OPENAI_API_KEY;
  }

  async analyzeImage(imageBuffer: Buffer): Promise<ImageAnalysisResult> {
    // Implementation using OpenAI Vision API
    // ...
    return { caption, tags, provider: this.name };
  }
}
```

2. Register in `server/src/services/imageAnalysis/index.ts`:

```typescript
export type ImageAnalysisProviderType = 'moondream' | 'openai' | 'none';

export function getImageAnalysisProvider(): ImageAnalysisProvider | null {
  switch (PROVIDER_TYPE) {
    case 'moondream':
      return getMoondreamProvider();
    case 'openai':
      return getOpenAIProvider();  // New provider
    case 'none':
      return null;
  }
}
```

3. Set environment variable:

```bash
IMAGE_ANALYSIS_PROVIDER=openai
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MOONDREAM_ENDPOINT` | `http://localhost:2020/v1` | Moondream server URL |
| `IMAGE_ANALYSIS_PROVIDER` | `moondream` | Active provider (`moondream`, `none`) |

### Docker Compose

The `docker-compose.yml` includes Moondream:

```yaml
services:
  moondream:
    image: vikhyat/moondream:latest
    ports:
      - "2020:2020"
    restart: unless-stopped

  server:
    # ...
    environment:
      - MOONDREAM_ENDPOINT=http://moondream:2020/v1
    depends_on:
      - moondream
```

## API Reference

### Settings Endpoints

#### GET /api/settings

Fetch user settings.

**Response:**
```json
{
  "settings": {
    "autoImageTagging": false
  }
}
```

#### PATCH /api/settings

Update user settings.

**Request:**
```json
{
  "autoImageTagging": true
}
```

**Response:**
```json
{
  "settings": {
    "autoImageTagging": true
  }
}
```

### Photo Schema Extensions

Photos now include optional AI fields:

```typescript
interface Photo {
  // ... existing fields
  caption?: string;          // AI-generated description
  tags?: string[];           // AI-extracted tags
  aiProcessed?: boolean;     // Whether AI processing completed
  aiProcessedAt?: string;    // ISO timestamp of processing
  aiProvider?: string;       // Provider used (e.g., 'moondream')
}
```

## Local Development

### Running Moondream Locally

**Option 1: Docker (Recommended)**
```bash
docker run -p 2020:2020 vikhyat/moondream:latest
```

**Option 2: Python**
```bash
pip install moondream
moondream serve --port 2020
```

**Option 3: Full Stack**
```bash
docker-compose up
```

### Testing

```bash
# Run all tests
npm test

# Server unit tests (includes settings and image analysis)
npm run test:server:unit

# Server integration tests
npm run test:server:integration

# Client tests (includes settingsSlice)
npm run test:client
```

## Error Handling

- **Moondream Unavailable**: Processing is skipped, upload succeeds
- **Analysis Failure**: Logged but doesn't fail the upload
- **Settings API Error**: Returns 500 with error message

The feature is designed to be non-blocking - photo uploads always succeed even if AI processing fails.

## Future Improvements

1. **Additional Providers**: OpenAI Vision, Google Vision API, Claude Vision
2. **Batch Processing**: Process existing photos in bulk
3. **Tag Search**: Search photos by AI-generated tags
4. **Caption Display**: Show captions in photo details view
5. **Manual Tag Editing**: Allow users to edit AI-generated tags
