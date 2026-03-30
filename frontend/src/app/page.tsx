'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CreateRoomCard from '@/components/CreateRoomCard'
import JoinRoomCard from '@/components/JoinRoomCard'
import ConfirmationScreen from '@/components/ConfirmationScreen'
import { ConfirmedRoom, EmailSentResponse } from '@/types/room'

const subtitle = {
  es: 'Un lugar para compartir, debatir y aprender de otras perspectivas',
  en: 'A place to share, debate and learn from other perspectives',
}


function GlobeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

export default function Home() {
  const [lang, setLang] = useState<'es' | 'en'>('es')
  const [confirmedRoom, setConfirmedRoom] = useState<ConfirmedRoom | null>(null)
  const [emailSent, setEmailSent] = useState<EmailSentResponse | null>(null)
  const router = useRouter()

  const handleRoomCreated = (result: ConfirmedRoom | EmailSentResponse) => {
    if ('emailSent' in result) {
      setEmailSent(result)
    } else {
      setConfirmedRoom(result)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">

      <header className="relative flex flex-col items-center pt-16 pb-10 px-6">
        <button
          onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
          className="absolute top-6 right-6 flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition text-sm font-medium animate-fade-up [animation-delay:500ms]"
          aria-label="Switch language"
        >
          <GlobeIcon />
          <span>{lang === 'es' ? 'EN' : 'ES'}</span>
        </button>

        <h1 className="text-5xl font-extrabold text-blue-700 tracking-tight animate-fade-up [animation-delay:0ms]">
          Subrayado
        </h1>
        <p className="mt-3 text-slate-500 text-center max-w-md text-base animate-fade-up [animation-delay:150ms]">
          {subtitle[lang]}
        </p>
      </header>

      <main className="flex-1 flex items-start justify-center px-6 pb-16">
        {emailSent ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-blue-700 mb-3">
              {lang === 'es' ? '¡Ya casi!' : 'Almost there!'}
            </h2>
            <p className="text-slate-500">
              {lang === 'es' ? 'Enviamos un link a' : 'We sent a link to'}
            </p>
            <p className="font-medium text-slate-800 mt-1">{emailSent.email}</p>
            <p className="text-slate-400 text-sm mt-4">
              {lang === 'es' ? 'Hacé click en el link para activar tu sala.' : 'Click the link to activate your room.'}
            </p>
          </div>
        ) : confirmedRoom ? (
          <ConfirmationScreen
            room={confirmedRoom}
            lang={lang}
            onEnter={() => router.push(`/room/${confirmedRoom.id}?lang=${lang}`)}
          />
        ) : (
          <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8">
            <CreateRoomCard lang={lang} onSuccess={handleRoomCreated} />
            <JoinRoomCard lang={lang} onJoin={(roomId) => router.push(`/room/${roomId}?lang=${lang}`)} />
          </div>
        )}
      </main>
      <footer className="fixed bottom-2.5 left-2.5 right-2.5 rounded-xl bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm py-3 px-6 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 z-50">
        <p className="text-sm text-slate-500 text-center">
          {lang === 'es'
            ? '¿Querés probar Subrayado? Usá este PIN de acceso:'
            : 'Want to try Subrayado? Use this access PIN:'}
        </p>
        <span className="font-mono font-bold text-blue-700 text-xl tracking-widest">
          YQK51NKC
        </span>
      </footer>
    </div>
  )
}
