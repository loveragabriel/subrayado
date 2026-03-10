'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

function GlobeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

const copy = {
  es: {
    subtitle: 'Un lugar para compartir, debatir y aprender de otras perspectivas',
    createTitle: 'Crear Sala',
    createDesc: 'Sube un libro y comparte el PIN con otros.',
    bookPlaceholder: 'Título del libro',
    startDate: 'Fecha de inicio',
    endDate: 'Fecha de cierre',
    uploading: 'Subiendo...',
    createBtn: 'Crear Sala',
    joinTitle: 'Unirse a Sala',
    joinDesc: '¿Tienes un código? Introdúcelo para empezar.',
    joinBtn: 'Entrar a la Sala',
    // Confirmation screen
    confirmTitle: '¡Sala creada!',
    confirmPin: 'PIN de acceso',
    confirmShare: 'Comparte este PIN con los participantes.',
    confirmAdminTitle: 'Link de administración (opcional)',
    confirmAdminDesc: 'Guarda este link para volver a gestionar la sala. Sin él no podrás recuperar el acceso de coordinador.',
    confirmEnter: 'Entrar a la Sala',
    copied: '¡Copiado!',
  },
  en: {
    subtitle: 'A place to share, debate and learn from other perspectives',
    createTitle: 'Create Room',
    createDesc: 'Upload a book and share the PIN with others.',
    bookPlaceholder: 'Book title',
    startDate: 'Start date',
    endDate: 'End date',
    uploading: 'Uploading...',
    createBtn: 'Create Room',
    joinTitle: 'Join Room',
    joinDesc: 'Have a code? Enter it to get started.',
    joinBtn: 'Enter Room',
    confirmTitle: 'Room created!',
    confirmPin: 'Access PIN',
    confirmShare: 'Share this PIN with participants.',
    confirmAdminTitle: 'Admin link (optional)',
    confirmAdminDesc: 'Save this link to manage the room later. Without it you cannot recover coordinator access.',
    confirmEnter: 'Enter Room',
    copied: 'Copied!',
  },
}

interface ConfirmedRoom {
  id: string
  title: string
  accessPin: string
  adminToken: string
}

function CopyButton({ text, label }: { text: string; label: string }) {
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
      <CopyIcon />
      {copied ? '¡Copiado!' : 'Copiar'}
    </button>
  )
}

export default function Home() {
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState<'es' | 'en'>('es')
  const [confirmedRoom, setConfirmedRoom] = useState<ConfirmedRoom | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const router = useRouter()
  const t = copy[lang]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null
    if (selected && selected.size > MAX_FILE_SIZE) {
      setCreateError('El archivo supera el límite de 50 MB.')
      e.target.value = ''
      return
    }
    setCreateError(null)
    setFile(selected)
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)

    if (!title) return setCreateError('El título del libro es obligatorio.')
    if (!file) return setCreateError('Debes adjuntar un archivo PDF o ePub.')

    // Client-side date validation
    if (endDate && !startDate) {
      return setCreateError('No puedes definir una fecha de cierre sin una fecha de inicio.')
    }
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const today = new Date(); today.setHours(0, 0, 0, 0)
      if (start < today) return setCreateError('La fecha de inicio no puede ser anterior a hoy.')
      if (end <= start) return setCreateError('La fecha de cierre debe ser posterior a la fecha de inicio.')
    }

    setLoading(true)

    const formData = new FormData()
    formData.append('title', title)
    formData.append('file', file)
    if (startDate) formData.append('startDate', startDate)
    if (endDate) formData.append('endDate', endDate)

    try {
      const response = await fetch('http://localhost:3000/rooms', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al crear sala')
      }

      const newRoom = await response.json()
      if (newRoom?.id) {
        setConfirmedRoom(newRoom)
      } else {
        setCreateError('El servidor no devolvió un ID válido.')
      }
    } catch (error: unknown) {
      setCreateError(error instanceof Error ? error.message : 'Error desconocido.')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setJoinError(null)
    if (pin.length < 6) return setJoinError('El PIN debe tener 6 caracteres.')

    try {
      const response = await fetch(`http://localhost:3000/rooms/join/${pin.toUpperCase()}`)
      if (!response.ok) throw new Error('Sala no encontrada')
      const room = await response.json()
      router.push(`/room/${room.id}`)
    } catch {
      setJoinError('PIN inválido o sala inexistente.')
    }
  }

  const adminLink = confirmedRoom
    ? `${window.location.origin}/room/${confirmedRoom.id}?adminToken=${confirmedRoom.adminToken}`
    : ''

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">

      <header className="relative flex flex-col items-center pt-16 pb-10 px-6">
        <button
          onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
          className="absolute top-6 right-6 flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition text-sm font-medium"
          aria-label="Switch language"
        >
          <GlobeIcon />
          <span>{lang === 'es' ? 'EN' : 'ES'}</span>
        </button>

        <h1 className="text-5xl font-extrabold text-blue-700 tracking-tight">Subrayado</h1>
        <p className="mt-3 text-slate-500 text-center max-w-md text-base">{t.subtitle}</p>
      </header>

      <main className="flex-1 flex items-start justify-center px-6 pb-16">

        {/* ── CONFIRMATION SCREEN ── */}
        {confirmedRoom ? (
          <section aria-labelledby="confirm-heading" className="bg-white p-10 rounded-2xl shadow-xl border border-slate-200 w-full max-w-md text-center">
            <h2 id="confirm-heading" className="text-2xl font-bold text-blue-700 mb-1">{t.confirmTitle}</h2>
            <p className="text-slate-500 text-sm mb-6">{confirmedRoom.title}</p>

            {/* PIN */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-2">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">{t.confirmPin}</p>
              <p className="text-5xl font-extrabold tracking-widest text-blue-700 font-mono">{confirmedRoom.accessPin}</p>
            </div>
            <div className="flex justify-center mb-6">
              <CopyButton text={confirmedRoom.accessPin} label="Copiar PIN" />
            </div>
            <p className="text-slate-500 text-sm mb-8">{t.confirmShare}</p>

            {/* Admin link */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs font-semibold text-amber-700 mb-1">{t.confirmAdminTitle}</p>
              <p className="text-xs text-amber-600 mb-3">{t.confirmAdminDesc}</p>
              <div className="flex items-center gap-2">
                <code className="text-xs text-slate-600 bg-white border rounded px-2 py-1 flex-1 truncate">{adminLink}</code>
                <CopyButton text={adminLink} label="Copiar link de administración" />
              </div>
            </div>

            <button
              onClick={() => router.push(`/room/${confirmedRoom.id}`)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
            >
              {t.confirmEnter}
            </button>
          </section>

        ) : (
          /* ── MAIN FORM ── */
          <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8">

            <section aria-labelledby="crear-sala-heading" className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
              <h2 id="crear-sala-heading" className="text-2xl font-bold text-blue-600 mb-2">{t.createTitle}</h2>
              <p className="text-slate-500 mb-6 text-sm">{t.createDesc}</p>

              <form onSubmit={handleCreateRoom} className="space-y-4">
                {/* Title + file icon */}
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder={t.bookPlaceholder}
                    className="w-full border p-3 pr-12 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <label
                    htmlFor="pdf-upload"
                    title={file ? file.name : 'Subir PDF / ePub'}
                    className={`absolute right-3 cursor-pointer transition ${file ? 'text-blue-600' : 'text-slate-400 hover:text-blue-500'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                    <input
                      id="pdf-upload"
                      type="file"
                      accept=".pdf,.epub"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="start-date" className="text-xs text-slate-500 mb-1 block">{t.startDate}</label>
                    <input
                      id="start-date"
                      type="date"
                      className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black text-sm"
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="end-date" className="text-xs text-slate-500 mb-1 block">{t.endDate}</label>
                    <input
                      id="end-date"
                      type="date"
                      className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black text-sm"
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                {createError && (
                  <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {createError}
                  </p>
                )}

                <button
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-slate-400"
                >
                  {loading ? t.uploading : t.createBtn}
                </button>
              </form>
            </section>

            <section aria-labelledby="unirse-sala-heading" className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 flex flex-col justify-center">
              <h2 id="unirse-sala-heading" className="text-2xl font-bold text-emerald-600 mb-2">{t.joinTitle}</h2>
              <p className="text-slate-500 mb-6 text-sm">{t.joinDesc}</p>

              <form onSubmit={handleJoinRoom} className="space-y-4">
                <input
                  type="text"
                  placeholder="Ej: R73EMU"
                  maxLength={6}
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-center font-mono text-xl uppercase text-black"
                  onChange={(e) => { setJoinError(null); setPin(e.target.value) }}
                />
                {joinError && (
                  <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {joinError}
                  </p>
                )}
                <button className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition">
                  {t.joinBtn}
                </button>
              </form>
            </section>

          </div>
        )}

      </main>
    </div>
  )
}
