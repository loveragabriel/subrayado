# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Subrayado** is a collaborative PDF reading app for book clubs. Users create rooms by uploading a PDF or ePub (stored on Cloudinary), share an **8-character PIN** with others, and see each other's highlights in real time via WebSockets. Highlights are persisted in PostgreSQL. Room creation requires email verification via a magic link (SendGrid).

## Architecture

Two independent apps under one repo:

- `backend/` — NestJS REST API + Socket.IO WebSocket server (port 3000)
- `frontend/` — Next.js 16 App Router client (port 3001)

### Backend (`backend/src/`)

- `app.module.ts` — Root module; imports `RoomsModule`, `PrismaModule`, global `ConfigModule`, `ThrottlerModule`
- `main.ts` — Bootstrap: CORS from `ALLOWED_ORIGIN`, global `ValidationPipe` (whitelist, forbidNonWhitelisted, transform)
- `rooms/` — Single feature module handling all business logic:
  - `rooms.controller.ts` — REST endpoints:
    - `POST /rooms` — upload PDF/ePub ≤50 MB + create room; throttled at `THROTTLE_ROOMS_LIMIT`
    - `GET /rooms/join/:pin` — find room by PIN (excludes adminToken)
    - `GET /rooms/verify?token=` — verify magic token, mark room as `verified`, return `{ adminToken, roomId }`
    - `GET /rooms/:id` — get full room data including highlights and glossaries
  - `rooms.service.ts` — Prisma queries: room CRUD, highlight creation, glossary management, magic token lifecycle; validates `startDate`/`endDate` (past date, end before start, missing start) throwing `BadRequestException` with specific messages
  - `gateway.ts` — Socket.IO gateway: `joinRoom`, `sendHighlight`, `addWord` events; emits `receivedHighlight` and `newGlossaryEntry` to room members; room capped at 20 concurrent users; in-memory per-socket rate limiting (Map-based, 60s windows)
  - `dto/` — `CreateRoomDto` (title, coordinatorEmail, startDate?, endDate?, lang?), `SendHighlightDto`, `AddWordDto`, `HighlightAreaDto`
  - `constants/` — `rest-errors.constants.ts`, `ws-errors.constants.ts` (all error strings in Spanish)
- `email/` — `MailModule` + `MailService`:
  - Uses `@sendgrid/mail` via HTTPS (no SMTP)
  - Initialized via `OnModuleInit` — calls `getOrThrow('SENDGRID_API_KEY')` and `getOrThrow('SENDGRID_FROM_EMAIL')` so app **fails at startup** if either var is missing
  - `sendMagicLinkEmail(dto: SendMagicLinkDto)` — bilingual (ES/EN via `dto.lang ?? 'es'`), 15-min expiry link
- `config/cloudinary/config.ts` — Cloudinary + Multer storage; lazy-initialized (`ensureConfigured()` called on first upload to avoid race with `ConfigModule`); PDFs as `resource_type: image`, ePub as `resource_type: raw` in `subrayado_books/` folder
- `prisma/` — `PrismaService` singleton wrapping `@prisma/client`
- `prisma/schema.prisma` — Data models: `Room` (includes `adminToken`, `coordinatorEmail`, `verified`, `startDate`, `endDate`), `MagicToken` (token, expiry, used flag, 1:1 with Room), `User`, `RoomMember`, `Highlight` (coords stored as JSON), `Glossary`

Room creation:
- Generates a cryptographically secure **8-character** uppercase alphanumeric PIN using rejection sampling to avoid modulo bias (`PIN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'`, `PIN_MAX_BYTE = 252`)
- Generates `adminToken` via `randomBytes(32).toString('hex')` (64-char hex)
- Creates a `MagicToken` (expires in 15 minutes), sends magic link to `coordinatorEmail`
- Returns `{ message: 'email_sent', email }` — **does not** return PIN or adminToken until email is verified

Magic link verification (`GET /rooms/verify?token=`):
- Validates token exists, not expired, not used
- Sets `room.verified = true`, `magicToken.used = true`
- Returns `{ adminToken, roomId }`

### Frontend (`frontend/src/`)

- `app/page.tsx` — Home page: bilingual (ES/EN) language switcher, `CreateRoomCard` + `JoinRoomCard` side by side, confirmation screen after creation, fixed footer with demo PIN and link to `/terms`
- `app/activate/page.tsx` — Magic link landing: reads `?token=` from URL, calls `GET /rooms/verify`, stores `adminToken` in `localStorage` as `adminToken:{roomId}`, redirects to `/room/{roomId}`
- `app/room/[id]/page.tsx` — Room page: fetches room data, establishes Socket.IO connection (auth handshake passes `adminToken`), renders `PdfViewer`, `GlossarySidebar`, `SummaryPanel`; `adminToken` is read from localStorage inside `useEffect` (SSR-safe)
- `app/terms/page.tsx` — Static bilingual Terms & Conditions page; reads `?lang=` from URL via `useSearchParams` wrapped in `Suspense`; includes language switcher
- `components/CreateRoomCard/` — Form: coordinator email, title, file upload (.pdf/.epub ≤50 MB), optional start/end dates; submits `FormData` to `POST /rooms`; handles `email_sent` response
- `components/JoinRoomCard.tsx` — PIN entry (8 chars, uppercase); calls `GET /rooms/join/:pin`; navigates to room on success
- `components/ConfirmationScreen.tsx` — Shows PIN and admin link with copy buttons after email verification
- `components/PdfViewer.tsx` — Core UI: `@react-pdf-viewer` with highlight plugin; emits `sendHighlight` on text selection, `addWord` for glossary (single-word check via `/^\S+$/`); listens for `receivedHighlight` and `newGlossaryEntry`; duplicate word detection; `coords` stored as `HighlightAreaDto[]` (array always); rendered as absolute `div` overlays
- `components/GlossarySidebar.tsx` — Slide-in sidebar showing glossary entries; each entry links to Google "define:" search; Escape key + backdrop to close
- `components/SummaryPanel.tsx` — Admin-only, visible only on last reading day; shows highlight stats (total underlines, glossary entries, pages with highlights); "Generate AI summary" button (placeholder)
- `types/highlights.ts` — `Highlight` type with `coords` as `{ top, left, width, height, pageIndex }`
- `types/room.ts` — `ConfirmedRoom`, `EmailSentResponse` interfaces

**Important**: `PdfViewer` is loaded with `dynamic()` (SSR disabled) because `@react-pdf-viewer` is browser-only. The PDF.js worker is loaded from unpkg CDN at version `3.4.120` — must match `pdfjs-dist` package version exactly.

All API calls use `process.env.NEXT_PUBLIC_API_URL` (set at build time for Docker, falls back to `http://localhost:3000` in local dev via `frontend/.env`).

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
npm run dev            # Dev server on port 3001
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

Backend `.env` (or root `.env` for Docker):

```
DATABASE_URL=postgresql://postgres:postgres@db:5432/subrayado
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ALLOWED_ORIGIN=http://localhost:3001
FRONTEND_URL=http://localhost:3001
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_verified_sender@email.com
THROTTLE_TTL=60000
THROTTLE_ROOMS_LIMIT=5
THROTTLE_HIGHLIGHT_LIMIT=30
THROTTLE_WORD_LIMIT=20
```

Frontend `.env`:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Known Issues / Limitations

- `Room.verified` is set to `true` after magic link click but is **not enforced** on join/read endpoints — members can technically join an unverified room if they have the PIN
- `BookIcon` and `SparklesIcon` are defined inline in `room/[id]/page.tsx`; icon components are also duplicated across `GlossarySidebar` and other components
- Socket event names (`joinRoom`, `sendHighlight`, `addWord`, `receivedHighlight`, `newGlossaryEntry`) are plain strings with no shared type contract between gateway and frontend
- Gateway rate limiting uses an in-memory `Map` — resets on server restart and does not scale across multiple instances
- `SummaryPanel` AI summary button is a placeholder (not yet implemented)
