# Course Designer - Comprehensive Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Key Features](#key-features)
4. [Technology Stack](#technology-stack)
5. [Design Decisions](#design-decisions)
6. [API Endpoints](#api-endpoints)
7. [Data Flow](#data-flow)
8. [Known Issues & Limitations](#known-issues--limitations)
9. [Setup & Configuration](#setup--configuration)
10. [Future Improvements](#future-improvements)

## Overview

### Project Goal
The Course Designer is an AI-powered educational content creation platform that enables users to generate comprehensive, multimedia courses on any topic. The application leverages OpenAI's GPT models for content generation and DALL-E for image creation, providing an intuitive interface for creating structured educational materials.

### Core Value Proposition
- **Rapid Course Creation**: Generate full courses with modules, slides, and quizzes in minutes
- **AI-Enhanced Content**: Leverage OpenAI for intelligent content structuring and generation
- **Visual Learning**: Automatic image generation for each slide to enhance comprehension
- **Flexible Depth**: Support for different content depth levels (Low, Medium, High)
- **Persistent Storage**: Courses saved locally and images stored in AWS S3

## Architecture

### High-Level Architecture
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│   Next.js App   │────▶│  API Routes     │────▶│  External APIs  │
│   (React UI)    │     │  (Backend)      │     │  (OpenAI, S3)   │
│                 │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                         
        │                        │                         
        ▼                        ▼                         
┌─────────────────┐     ┌──────────────────┐              
│                 │     │                  │              
│  Local Storage  │     │  TypeScript     │              
│  (Browser)      │     │  Types & Utils  │              
│                 │     │                  │              
└─────────────────┘     └──────────────────┘              
```

### Component Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── course/           # Course-specific components
│   ├── layout/           # Layout components
│   ├── providers/        # Context providers
│   └── ui/              # Reusable UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and services
│   ├── api-client.ts    # Frontend API client
│   ├── app-reducer.ts   # State management
│   ├── s3.ts           # S3 upload utilities
│   ├── storage.ts      # Local storage handling
│   ├── types.ts        # TypeScript types
│   └── utils.ts        # Helper functions
```

## Key Features

### 1. Multi-Stage Course Creation Flow
- **Prompt Stage**: User inputs topic and preferences
- **Outline Review**: AI generates and user reviews course structure
- **Generation Stage**: Full course content and images are created
- **Course Viewing**: Interactive course player with navigation

### 2. Content Generation
- Dynamic module and slide generation based on topic
- Contextual quiz questions for each module
- Intelligent content depth adjustment

### 3. Image Generation & Storage
- Automatic image generation for course cover and each slide
- Batch image generation for efficiency
- S3 storage for persistent image hosting
- Fallback handling for failed image generations

### 4. Local Persistence
- Courses saved in browser's localStorage
- Course listing and management
- Progress tracking capabilities

## Technology Stack

### Frontend
- **Next.js 15.3.4**: React framework with App Router
- **TypeScript**: Type safety and better developer experience
- **Tailwind CSS**: Utility-first CSS framework
- **React Hooks**: State management and side effects

### Backend
- **Next.js API Routes**: Serverless functions
- **OpenAI API**: GPT-4 for content, DALL-E 2 for images
- **AWS SDK**: S3 client for image storage

### Infrastructure
- **AWS S3**: Image storage and CDN
- **Vercel**: Deployment platform (assumed)

### Development Tools
- **Playwright**: E2E testing framework
- **ESLint**: Code quality
- **Turbopack**: Fast bundler (Next.js dev)

## Design Decisions

### 1. Why Next.js with App Router?
- **Server-side capabilities**: API routes in the same project
- **Modern React patterns**: Server Components, improved performance
- **Built-in optimizations**: Image optimization, code splitting
- **TypeScript first**: Excellent TS support out of the box

### 2. Local Storage vs Database
- **Simplicity**: No backend infrastructure required
- **Privacy**: User data stays on their device
- **Instant access**: No network latency for saved courses
- **Trade-off**: Limited to single device, no cross-device sync

### 3. S3 for Image Storage
- **Persistence**: Images remain available after generation
- **Performance**: CDN capabilities for fast global access
- **Cost-effective**: Only pay for storage and bandwidth used
- **Separation of concerns**: Decouple image hosting from app hosting

### 4. Batch Image Generation
- **Efficiency**: Reduce API calls and latency
- **Cost optimization**: Minimize OpenAI API usage
- **Better UX**: Faster overall course generation

### 5. State Management with useReducer
- **Predictable updates**: Clear action-based state changes
- **Complex state**: Handle multi-stage flow elegantly
- **Debugging**: Easy to track state transitions
- **No external dependencies**: Built into React

## API Endpoints

### `/api/generate-outline`
- **Method**: POST
- **Purpose**: Generate course outline from user prompt
- **Payload**: `{ prompt, numModules, depth }`
- **Response**: Array of module objects

### `/api/generate-course`
- **Method**: POST
- **Purpose**: Generate full course content with images
- **Payload**: `{ prompt, outline, depth }`
- **Response**: Complete course object with S3 image URLs

### `/api/generate-image`
- **Method**: POST
- **Purpose**: Batch generate images using DALL-E
- **Payload**: `{ prompts, size }`
- **Response**: Array of image URLs

## Data Flow

### Course Creation Flow
```
1. User Input (prompt, modules, depth)
       ↓
2. Generate Outline (GPT-4)
       ↓
3. User Reviews/Approves Outline
       ↓
4. Generate Course Content (GPT-4)
       ↓
5. Generate Image Prompts
       ↓
6. Batch Generate Images (DALL-E 2)
       ↓
7. Upload Images to S3
       ↓
8. Return Complete Course
       ↓
9. Save to Local Storage
```

### Image Processing Pipeline
```
1. Extract image requirements from course
2. Generate contextual prompts for each image
3. Batch API call to DALL-E
4. Download generated images
5. Upload to S3 with structured keys
6. Replace temporary URLs with S3 URLs
7. Return updated course data
```

## Known Issues & Limitations

### Current Issues
1. **Environment Variable Caching**: Next.js dev server requires restart after `.env.local` changes
2. **Hydration Warnings**: Minor React hydration mismatches (cosmetic issue)
3. **No Cross-Device Sync**: Courses only available on device where created
4. **Limited Error Recovery**: Some edge cases in image generation not fully handled

### Recently Fixed Issues
1. **S3 Credentials Caching** (FIXED): The S3 client was caching environment variables at module load time, causing old AWS credentials to persist even after updating `.env.local` and restarting the server. This has been fixed by creating a new S3 client for each operation, ensuring fresh credentials are always used. See `docs/S3-CREDENTIALS-FIX.md` for details.

### Technical Limitations
1. **Image Size**: Fixed at 256x256 for cost optimization
2. **No User Authentication**: Public access only
3. **Storage Limits**: Constrained by browser localStorage limits (~10MB)
4. **No Course Editing**: Courses are immutable after generation

### API Constraints
1. **OpenAI Rate Limits**: May hit limits with heavy usage
2. **S3 Costs**: Image storage costs scale with usage
3. **Generation Time**: Large courses can take 30+ seconds

## Setup & Configuration

### Required Environment Variables
```env
# OpenAI API Configuration
OPENAI_API_KEY=your-api-key-here

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-west-2
S3_BUCKET_NAME=course-creator-images

# Optional
SKIP_IMAGE_GENERATION=true  # For faster testing
```

### S3 Bucket Requirements
- Public read access for images
- CORS configuration for browser uploads
- Appropriate IAM permissions for the AWS credentials

### Next.js Configuration
- Image domains must be whitelisted in `next.config.ts`
- Both OpenAI (blob.core.windows.net) and S3 domains required

## Possible Future Improvements

### Planned Features
1. **User Authentication**: Save courses to user accounts
2. **Course Editing**: Modify existing courses
4. **Collaborative Features**: Share and co-edit courses

### Technical Enhancements
1. **Progressive Web App**: Offline access to courses
2. **Database Backend**: PostgreSQL for scalability
3. **Image Optimization**: Multiple sizes, WebP format
4. **Caching Layer**: Redis for API responses
5. **WebSocket Support**: Real-time generation updates

### UX Improvements
1. **Mobile Optimization**: Better touch controls
3. **Internationalization**: Multi-language support
4. **Interactive Elements**: Embedded exercises
5. **Analytics**: Learning progress tracking

## Conclusion

The Course Designer represents a modern approach to educational content creation, leveraging AI to democratize course development. While currently focused on rapid prototyping and individual use, the architecture supports evolution into a full-featured platform. The modular design, clear separation of concerns, and modern tech stack provide a solid foundation for future enhancements.

The immediate priority should be addressing the current limitations around error handling and user feedback, while the longer-term vision involves transitioning from a local-storage-based app to a full SaaS platform with user accounts, collaboration, and advanced course management features. 