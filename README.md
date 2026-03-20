# Subrayado

Collaborative PDF reading app for book clubs. Create a room, upload a PDF, share a PIN, and see each other's highlights in real time.

## Features

- **Room-based sessions** — Upload a PDF or ePub, get an 8-character PIN to share with your group (up to 20 concurrent users per room).
- **Real-time highlights** — See other members' highlights appear instantly via WebSockets.
- **Glossary** — Mark words as glossary entries; a shared sidebar collects all terms with quick dictionary links.
- **Persistent storage** — Highlights and glossary entries are saved in PostgreSQL. They survive page refreshes and reconnections.
- **Bilingual UI** — Switch between Spanish and English from the home page.
- **Admin access** — Room creator receives a secure admin token stored in localStorage. Passed via Socket.IO auth handshake to identify coordinator privileges.
- **Reading schedule** — Optional start/end dates to keep the club on track.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| PDF rendering | pdfjs-dist 3.4, @react-pdf-viewer 3.12 |
| Backend | NestJS 11, TypeScript 5.7 |
| Database | PostgreSQL 15, Prisma ORM 6 |
| Real-time | Socket.IO 4.8 (WebSocket transport) |
| File storage | Cloudinary (PDFs and ePubs) |
| Rate limiting | @nestjs/throttler (REST + WebSocket) |

## Architecture

```
subrayado/
├── backend/          # NestJS REST API + Socket.IO gateway (port 3000)
│   ├── src/
│   │   ├── rooms/    # Controller, service, gateway, DTOs
│   │   ├── prisma/   # PrismaService singleton
│   │   └── config/   # Cloudinary + Multer configuration
│   └── prisma/
│       └── schema.prisma   # Room, User, Highlight, Glossary models
├── frontend/         # Next.js client (port 3001)
│   └── src/
│       ├── app/      # Pages: home, room/[id]
│       └── components/  # PdfViewer, GlossarySidebar, SummaryPanel
└── docker-compose.yml
```

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended)
- Or: [Node.js](https://nodejs.org/) 18+, [PostgreSQL](https://www.postgresql.org/) 15+

## Quick Start (Docker)

**1. Clone the repo:**

```bash
git clone https://github.com/loveragabriel/subrayado.git
cd subrayado
```

**2. Create a `.env` file in the project root:**

```env
DATABASE_URL="postgresql://postgres:password@db:5432/subrayado"
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ALLOWED_ORIGIN=http://localhost:3001
```

**3. Build and start:**

```bash
docker-compose up --build
```

The app will be available at:
- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000

## Local Development (without Docker)

**Backend:**

```bash
cd backend
cp .env.example .env          # Fill in your credentials
npm install
npx prisma migrate dev        # Apply migrations
npm run start:dev             # Starts on port 3000 with hot reload
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev                   # Starts on port 3001
```

## Useful Commands

| Command | Location | Description |
|---------|----------|-------------|
| `npm run start:dev` | backend/ | Dev server with hot reload |
| `npm run build` | backend/ | Compile TypeScript |
| `npm run start:prod` | backend/ | Run compiled output |
| `npm run lint` | backend/ | ESLint with auto-fix |
| `npm run test` | backend/ | Jest unit tests |
| `npm run dev` | frontend/ | Next.js dev server |
| `npm run build` | frontend/ | Production build |
| `npx prisma studio` | backend/ | Visual database browser |
| `npx prisma migrate dev` | backend/ | Apply pending migrations |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary account name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `ALLOWED_ORIGIN` | Yes | Frontend URL for CORS (e.g. `http://localhost:3001`) |
| `PORT` | No | Backend port (default: `3000`) |
| `NEXT_PUBLIC_API_URL` | Yes | Backend URL for frontend (default: `http://localhost:3000`) |
| `THROTTLE_TTL` | No | Rate limit window in ms |
| `THROTTLE_LIMIT` | No | Max requests per window |
| `THROTTLE_ROOMS_LIMIT` | No | Max room creations per window (default: `5`) |
| `THROTTLE_HIGHLIGHT_LIMIT` | No | Max highlights per minute per socket (default: `30`) |
| `THROTTLE_WORD_LIMIT` | No | Max glossary words per minute per socket (default: `20`) |

## Data Models

- **Room** — Title, book URL, access PIN, admin token, optional reading schedule
- **User** — Username, email
- **RoomMember** — Join table linking users to rooms
- **Highlight** — Page number, text content, coordinates (JSON), type (`underline` | `glossary`)
- **Glossary** — Term, page number, coordinates, linked to room

## How It Works

1. A coordinator creates a room by uploading a PDF/ePub and setting a title.
2. The app generates an **8-character PIN** and a **secure admin token**.
3. Members join by entering the PIN on the home page.
4. Everyone connects to the same Socket.IO room. Text selections emit highlights that appear on all clients in real time.
5. Glossary entries can be added and shared across the group via a sidebar panel.

## License

UNLICENSED
