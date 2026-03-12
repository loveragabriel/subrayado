'use client'
import { useState } from 'react'
import { ConfirmedRoom } from '@/types/room'

const copy = {
  es: {
    title: '¡Sala creada!',
    pin: 'PIN de acceso',
    share: 'Comparte este PIN con los participantes.',
    adminTitle: 'Link de administración (opcional)',
    adminDesc: 'Guarda este link para volver a gestionar la sala. Sin él no podrás recuperar el acceso de coordinador.',
    enter: 'Entrar a la Sala',
    copy: 'Copiar',
    copied: '¡Copiado!',
  },
  en: {
    title: 'Room created!',
    pin: 'Access PIN',
    share: 'Share this PIN with participants.',
    adminTitle: 'Admin link (optional)',
    adminDesc: 'Save this link to manage the room later. Without it you cannot recover coordinator access.',
    enter: 'Enter Room',
    copy: 'Copy',
    copied: 'Copied!',
  },
}

function CopyButton({ text, label, copiedLabel }: { text: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition"
      aria-label={label}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
      {copied ? copiedLabel : label}
    </button>
  )
}

interface Props {
  room: ConfirmedRoom
  lang: 'es' | 'en'
  onEnter: () => void
}

export default function ConfirmationScreen({ room, lang, onEnter }: Props) {
  const t = copy[lang]
  const adminLink = `${window.location.origin}/room/${room.id}?adminToken=${room.adminToken}`

  return (
    <section
      aria-labelledby="confirm-heading"
      className="bg-white p-10 rounded-2xl shadow-xl border border-slate-200 w-full max-w-md text-center animate-fade-up [animation-delay:0ms]"
    >
      <h2 id="confirm-heading" className="text-2xl font-bold text-blue-700 mb-1">{t.title}</h2>
      <p className="text-slate-500 text-sm mb-6">{room.title}</p>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-2">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">{t.pin}</p>
        <p className="text-5xl font-extrabold tracking-widest text-blue-700 font-mono">{room.accessPin}</p>
      </div>
      <div className="flex justify-center mb-6">
        <CopyButton text={room.accessPin} label={t.copy} copiedLabel={t.copied} />
      </div>
      <p className="text-slate-500 text-sm mb-8">{t.share}</p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
        <p className="text-xs font-semibold text-amber-700 mb-1">{t.adminTitle}</p>
        <p className="text-xs text-amber-600 mb-3">{t.adminDesc}</p>
        <div className="flex items-center gap-2">
          <code className="text-xs text-slate-600 bg-white border rounded px-2 py-1 flex-1 truncate">{adminLink}</code>
          <CopyButton text={adminLink} label={t.copy} copiedLabel={t.copied} />
        </div>
      </div>

      <button
        onClick={onEnter}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
      >
        {t.enter}
      </button>
    </section>
  )
}
