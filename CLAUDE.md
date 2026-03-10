# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Subrayado** is a collaborative PDF reading app for book clubs. Users create rooms by uploading a PDF (stored on Cloudinary), share a 6-character PIN with others, and see each other's highlights in real time via WebSockets. Highlights are persisted in PostgreSQL.

## Architecture

Two independent apps under one repo:

- `backend/` — NestJS REST API + Socket.IO WebSocket server (port 3000)
- `frontend/` — Next.js 14 App Router client (port 3001)

### Backend (`backend/src/`)

- `app.module.ts` — Root module; imports `RoomsModule` and `PrismaModule` (global ConfigModule)
- `rooms/` — Single feature module handling all business logic:
  - `rooms.controller.ts` — REST endpoints: `POST /rooms` (upload PDF + create room), `GET /rooms/join/:pin`, `GET /rooms/:id`
  - `rooms.service.ts` — Prisma queries: room CRUD, highlight creation, glossary management
  - `gateway.ts` — Socket.IO gateway: `joinRoom`, `sendHighlight`, `addWord` events; emits `receivedHighlight` and `newGlossaryEntry` to room members
  - `dto/` — `CreateRoomDto`, `UpdateRoomDto`
- `config/cloudinary/config.ts` — Cloudinary client config + Multer storage (PDFs stored in `subrayado_books/` folder)
- `prisma/` — `PrismaService` singleton wrapping `@prisma/client`
- `prisma/schema.prisma` — Data models: `Room`, `User`, `RoomMember`, `Highlight` (coords stored as JSON), `Glossary`

Room creation generates a random 6-character uppercase PIN (`Math.random().toString(36).substring(2, 8).toUpperCase()`).

### Frontend (`frontend/src/`)

- `app/page.tsx` — Home page: create room (upload PDF via form) or join by PIN
- `app/room/[id]/page.tsx` — Room page: fetches room data, establishes Socket.IO connection, renders `PdfViewer`
- `components/PdfViewer.tsx` — Core UI: `@react-pdf-viewer` with highlight plugin; emits `sendHighlight` on text selection, listens for `receivedHighlight` to update state in real time
- `types/highlights.ts` — `Highlight` type shared across frontend

**Important**: `PdfViewer` is loaded with `dynamic()` (SSR disabled) because `@react-pdf-viewer` is browser-only. The PDF.js worker is loaded from unpkg CDN at version `3.4.120` — must match `pdfjs-dist` package version.

All API calls are hardcoded to `http://localhost:3000`. In Docker the frontend uses `NEXT_PUBLIC_API_URL` env var but the code currently has the URL hardcoded.

## Development Commands

### Backend (run from `backend/`)
```bash
npm run start:dev      # Watch mode (hot reload)
npm run build          # Compile TypeScript
npm run start:prod     # Run compiled output
npm run lint           # ESLint with auto-fix
npm run test           # Jest unit tests
npm run test:e2e       # End-to-end tests
```

### Frontend (run from `frontend/`)
```bash
npm run dev            # Dev server on port 3001 (webpack mode)
npm run build          # Production build
npm run lint           # ESLint
```

### Database
```bash
# From backend/
npx prisma migrate dev         # Apply migrations in development
npx prisma migrate deploy      # Apply migrations in production
npx prisma studio              # Visual DB browser
npx prisma generate            # Regenerate Prisma client after schema changes
```

### Docker (from repo root)
```bash
docker-compose up --build                              # Build and start all services
docker-compose exec backend npx prisma migrate dev     # Initialize DB (first run only)
```

## Environment Variables

Backend requires a `.env` file in `backend/` (or root when using Docker):

```
DATABASE_URL="postgresql://postgres:password@db:5432/subrayado"
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Known Issues / In-Progress

- Frontend API URL is hardcoded to `http://localhost:3000` instead of using `NEXT_PUBLIC_API_URL`
