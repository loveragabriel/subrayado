'use client'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/default-layout/lib/styles/index.css'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Highlight } from '@/types/highlights'
import GlossarySidebar from '@/components/GlossarySidebar'
import SummaryPanel from '@/components/SummaryPanel'

const PdfViewer = dynamic(() => import('@/components/PdfViewer'), {
  ssr: false,
  loading: () => <p className="text-center p-10">Cargando visor de PDF...</p>
})

interface Room {
  id: string
  title: string
  bookUrl: string
  accessPin: string
  startDate: string | null
  endDate: string | null
  highlights: Highlight[]
}

const roomCopy = {
  es: {
    loading: 'Cargando sala...',
    glossary: 'Glosario',
    exit: 'Salir',
    daysLeft: 'días',
    lastDay: 'Último día',
    summaryBtn: 'Generar resumen',
  },
  en: {
    loading: 'Loading room...',
    glossary: 'Glossary',
    exit: 'Exit',
    daysLeft: 'days left',
    lastDay: 'Last day',
    summaryBtn: 'Generate summary',
  },
}

/** Days between today and a YYYY-MM-DD date string, parsed in local timezone */
function daysUntil(isoDate: string): number {
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number)
  const end = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default function RoomPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const lang = (searchParams.get('lang') === 'en' ? 'en' : 'es') as 'es' | 'en'
  const [room, setRoom] = useState<Room | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [glossaryEntries, setGlossaryEntries] = useState<Highlight[]>([])
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)

  const [adminToken] = useState<string | null>(() => typeof window !== 'undefined' ? localStorage.getItem(`adminToken:${params.id}`) : null)

  const t = roomCopy[lang]

  //UseEffect Socket
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rooms/${params.id}`)
        if (!response.ok) return
        const data: Room = await response.json()
        setRoom(data)
        setGlossaryEntries(data.highlights.filter((h) => h.type === 'glossary'))
      } catch (err) {
        console.error('Error cargando sala:', err)
      }
    }
    if (params.id) fetchRoom()
  }, [params.id])

  useEffect(() => {
    if (!params.id) return

    const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL}`, { transports: ['websocket'], auth: { adminToken} })

    newSocket.on('connect', () => {
      console.log('🔌 Socket conectado')
      newSocket.emit('joinRoom', params.id)
    })

    newSocket.on('newGlossaryEntry', (entry: Highlight) => {
      setGlossaryEntries((current) => [...current, entry])
    })

    setSocket(newSocket)

    return () => { newSocket.disconnect() }
  }, [params.id, adminToken])

  if (!room) return <div className="p-10 text-center">{t.loading}</div>

  const daysLeft = room.endDate ? daysUntil(room.endDate) : null
  const isLastDay = daysLeft === 0
  const isAdmin = Boolean(adminToken)

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center h-16">
        <h1 className="text-xl font-bold truncate">{room.title}</h1>

        <div className="flex items-center gap-2">
          {/* Days remaining badge */}
          {daysLeft !== null && daysLeft >= 0 && (
            <div className={`px-2.5 py-1 rounded text-xs font-semibold ${
              isLastDay
                ? 'bg-red-500 text-white'
                : daysLeft <= 3
                  ? 'bg-amber-400 text-slate-900'
                  : 'bg-blue-800 text-blue-100'
            }`}>
              {isLastDay ? t.lastDay : `${daysLeft} ${t.daysLeft}`}
            </div>
          )}

          {/* Admin summary button — only visible on last day */}
          {isAdmin && isLastDay && (
            <button
              onClick={() => setIsSummaryOpen(true)}
              className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 px-3 py-1 rounded text-sm font-semibold transition-colors"
              title={t.summaryBtn}
              aria-label={t.summaryBtn}
            >
              <SparklesIcon />
              <span className="hidden sm:inline">{t.summaryBtn}</span>
            </button>
          )}

          <div className="bg-blue-800 px-3 py-1 rounded text-sm">PIN: {room.accessPin}</div>

          <button
            onClick={() => setIsGlossaryOpen(true)}
            className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-400 px-3 py-1 rounded text-sm transition-colors relative"
            aria-label="Abrir glosario"
          >
            <BookIcon />
            <span>{t.glossary}</span>
            {glossaryEntries.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-900 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {glossaryEntries.length > 9 ? '9+' : glossaryEntries.length}
              </span>
            )}
          </button>

          <Link href="/" className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm transition-colors">
            {t.exit}
          </Link>
        </div>
      </header>

      <main className="flex-1 overflow-hidden bg-slate-200">
        <PdfViewer
          fileUrl={room.bookUrl}
          roomId={room.id}
          socket={socket}
          initialHighlights={room.highlights}
          lang={lang}
        />
      </main>

      <GlossarySidebar
        entries={glossaryEntries}
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />

      {isSummaryOpen && (
        <SummaryPanel
          highlights={room.highlights}
          lang={lang}
          onClose={() => setIsSummaryOpen(false)}
        />
      )}
    </div>
  )
}

function BookIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function SparklesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
      <path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>
    </svg>
  )
}
