# Subrayado
Web app designed to make books clubs more dynamic by encouraging structure participaction, discussion tracking, and collaborative reading experiences.

## Key Features
- **PIN-Protected Rooms**: Create a private session by uploading a PDF and generating a unique access code to share. 
- **Real-Time Synchronization**: See other users 'highlights instantly as they happen, powered by WebSockets. 
- **Persistent Data**: Highlights are stored in PostgreSQL database via Prisma, in order to remain available after refresing. 
- **Professional PDF Viewer**: @react-pdf-viewer for PDFs

## Tech Stack
- **Frontend**:
    - Framework: Next.js 14( App Router)
    - Styling Tailwind CSS
    - Real-time: Socket.oi-client
    - PDF Engine.js & React-PDF-Viewer
- **Backend**:
    - Framework: Nest.JS
    - ORM: Prisma
    - Database: PostgreSQL
    - Real-time: Socket.io (WebSockets)
    - File Storage: Claudinary API

## Quick Start with Docker

1. Clone and Enter: 
```bash
git clone https://github.com/loveragabriel/subrayado.git
cd subraydo
```
2. Enviroment Variables:
Create a .env file in the root with your Cloudinary credentials.
``` Code snippet
DATABASE_URL="postgresql://user:password@localhost:5432/db_name"
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
3. Lauch: 
``` Bash
docker-compose up --build
```
The app will be available at "hhtp://localhost:3001" (Frontend) and "http://localhost:3000" (Backend)