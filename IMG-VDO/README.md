# Image-to-Video Visual Storybook

A comprehensive platform for converting images into cinematic videos with built-in NSFW content detection and management.

## Features

✨ **Core Features**
- Image-to-video generation using AI (Runway ML, Pika Labs, CogVideoX)
- Real-time NSFW content detection and filtering
- Visual storybook interface with timeline editor
- Batch processing support
- Video gallery and archive management
- Progress tracking and webhooks

🔒 **Security & Compliance**
- NSFW detection using multiple models
- Content filtering and moderation
- User access controls
- Audit logging

🚀 **Performance**
- Async job processing with Bull Queue
- Redis caching
- Optimized video encoding
- CDN integration ready

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/samredwings/image-video-storybook.git
cd image-video-storybook

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Run migrations
npm run db:migrate

# Start development server
npm run dev
```

### Docker Setup

```bash
docker-compose up -d
npm run db:migrate
npm run dev
```

## Project Structure

```
.
├── apps/
│   ├── api/              # Backend API (Express/Node.js)
│   ├── web/              # Frontend (Next.js/React)
│   └── worker/           # Job processing worker
├── packages/
│   ├── shared/           # Shared types and utilities
│   ├── nsfw-filter/      # NSFW detection module
│   └── video-generator/  # Video generation integrations
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

## Architecture

### Tech Stack

**Frontend:**
- Next.js 14
- React 18
- TypeScript
- TailwindCSS
- Framer Motion (animations)
- FFmpeg.wasm (client-side video handling)

**Backend:**
- Node.js + Express
- TypeScript
- PostgreSQL + Prisma ORM
- Redis + Bull Queue
- AWS S3/MinIO

**AI/ML:**
- Runway ML API
- Pika Labs API
- CogVideoX (open-source)
- TensorFlow.js (NSFW detection)
- OpenAI Moderation API (backup)

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/image_video_storybook

# Redis
REDIS_URL=redis://localhost:6379

# AWS S3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=video-storage

# API Keys
RUNWAY_API_KEY=your_key
PIKA_API_KEY=your_key

# NSFW Settings
NSFW_DETECTION_ENABLED=true
NSFW_THRESHOLD=0.5
NSFW_MODEL=tensorflow

# Application
NEXT_PUBLIC_API_URL=http://localhost:3000
JWT_SECRET=your_secret_key
```

## API Documentation

### Video Generation

```bash
POST /api/videos/generate
Content-Type: application/json

{
  "imageUrl": "https://example.com/image.jpg",
  "prompt": "cinematic pan across mountains",
  "duration": 5,
  "provider": "runway",
  "motionStrength": 0.7,
  "skipNsfwCheck": false
}
```

### NSFW Detection

```bash
POST /api/content/check-nsfw
Content-Type: application/json

{
  "imageUrl": "https://example.com/image.jpg",
  "videoUrl": "https://example.com/video.mp4",
  "models": ["tensorflow", "openai"]
}
```

### Storyboard Management

```bash
GET /api/storyboards
POST /api/storyboards
GET /api/storyboards/:id
PUT /api/storyboards/:id
DELETE /api/storyboards/:id
```

## NSFW Detection

The platform uses multiple detection models:

1. **TensorFlow.js NSFW Model** - Client-side detection
2. **OpenAI Moderation API** - Server-side fallback
3. **Custom ML Pipeline** - Custom training on flagged content

### Configuration

```typescript
const nsfwConfig = {
  enabled: true,
  threshold: 0.5, // 0-1, higher = stricter
  models: ['tensorflow', 'openai'],
  action: 'flag', // 'flag' | 'block' | 'blur'
  blurIntensity: 15,
};
```

## Development

### Running Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

### Code Quality

```bash
# Lint
npm run lint

# Format
npm run format

# Type check
npm run type-check
```

## Deployment

### Production Build

```bash
npm run build
npm run start
```

### Docker Build

```bash
docker build -t image-video-storybook:latest .
docker push your-registry/image-video-storybook:latest
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

- 📖 [Documentation](https://docs.example.com)
- 💬 [Discord Community](https://discord.gg/example)
- 🐛 [Issue Tracker](https://github.com/samredwings/image-video-storybook/issues)
- 📧 support@example.com
