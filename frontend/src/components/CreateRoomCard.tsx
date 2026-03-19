'use client'
import { useState } from 'react'
import { ConfirmedRoom } from '@/types/room'

const MAX_FILE_SIZE = 50 * 1024 * 1024

const copy = {
  es: {
    title: 'Crear Sala',
    desc: 'Sube un libro y comparte el PIN con otros.',
    bookPlaceholder: 'Título de la Sala',
    startDate: 'Fecha de inicio',
    endDate: 'Fecha de cierre',
    uploading: 'Subiendo...',
    createBtn: 'Crear Sala',
    errTitle: 'El título del libro es obligatorio.',
    errFile: 'Debes adjuntar un archivo PDF o ePub.',
    errFileSize: 'El archivo supera el límite de 50 MB.',
    errEndWithoutStart: 'No puedes definir una fecha de cierre sin una fecha de inicio.',
    errStartPast: 'La fecha de inicio no puede ser anterior a hoy.',
    errEndBeforeStart: 'La fecha de cierre debe ser posterior a la fecha de inicio.',
    errServer: 'El servidor no devolvió un ID válido.',
  },
  en: {
    title: 'Create Room',
    desc: 'Upload a book and share the PIN with others.',
    bookPlaceholder: 'Room Title',
    startDate: 'Start date',
    endDate: 'End date',
    uploading: 'Uploading...',
    createBtn: 'Create Room',
    errTitle: 'Book title is required.',
    errFile: 'You must attach a PDF or ePub file.',
    errFileSize: 'File exceeds the 50 MB limit.',
    errEndWithoutStart: 'You cannot set an end date without a start date.',
    errStartPast: 'Start date cannot be before today.',
    errEndBeforeStart: 'End date must be after the start date.',
    errServer: 'Server did not return a valid ID.',
  },
}

/** Returns today's date as YYYY-MM-DD in local timezone — safe for string comparison with date input values */
function localTodayStr(): string {
  return new Date().toLocaleDateString('en-CA')
}

interface Props {
  lang: 'es' | 'en'
  onSuccess: (room: ConfirmedRoom) => void
}

export default function CreateRoomCard({ lang, onSuccess }: Props) {
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = copy[lang]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null
    if (selected && selected.size > MAX_FILE_SIZE) {
      setError(t.errFileSize)
      e.target.value = ''
      return
    }
    setError(null)
    setFile(selected)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title) return setError(t.errTitle)
    if (!file) return setError(t.errFile)
    if (endDate && !startDate) return setError(t.errEndWithoutStart)
    if (startDate) {
      // Compare YYYY-MM-DD strings directly — no timezone drift
      if (startDate < localTodayStr()) return setError(t.errStartPast)
      if (endDate && endDate <= startDate) return setError(t.errEndBeforeStart)
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('title', title)
    formData.append('file', file)
    if (startDate) formData.append('startDate', startDate)
    if (endDate) formData.append('endDate', endDate)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rooms`, { method: 'POST', body: formData })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Error al crear sala')
      }
      const newRoom = await response.json()
      if (!newRoom?.id) return setError(t.errServer)
        localStorage.setItem(`adminToken:${newRoom.id}`, newRoom.adminToken);
      onSuccess(newRoom)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      aria-labelledby="crear-sala-heading"
      className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 animate-fade-up [animation-delay:300ms]"
    >
      <h2 id="crear-sala-heading" className="text-2xl font-bold text-blue-600 mb-2">{t.title}</h2>
      <p className="text-slate-500 mb-6 text-sm">{t.desc}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            <input id="pdf-upload" type="file" accept=".pdf,.epub" className="sr-only" onChange={handleFileChange} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="start-date" className="text-xs text-slate-500 mb-1 block">{t.startDate}</label>
            <input
              id="start-date"
              type="date"
              min={localTodayStr()}
              className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black text-sm"
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="end-date" className="text-xs text-slate-500 mb-1 block">{t.endDate}</label>
            <input
              id="end-date"
              type="date"
              min={startDate || localTodayStr()}
              className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black text-sm"
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
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
  )
}
