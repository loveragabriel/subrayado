'use client'
import { useState } from 'react'

const copy = {
  es: {
    title: 'Unirse a Sala',
    desc: '¿Tienes un código? Introdúcelo para empezar.',
    joinBtn: 'Entrar a la Sala',
    errPinLength: 'El PIN debe tener 8 caracteres.',
    errNotFound: 'PIN inválido o sala inexistente.',
  },
  en: {
    title: 'Join Room',
    desc: 'Have a code? Enter it to get started.',
    joinBtn: 'Enter Room',
    errPinLength: 'PIN must be 8 characters.',
    errNotFound: 'Invalid PIN or room not found.',
  },
}

interface Props {
  lang: 'es' | 'en'
  onJoin: (roomId: string) => void
}

export default function JoinRoomCard({ lang, onJoin }: Props) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const t = copy[lang]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (pin.length < 8) return setError(t.errPinLength)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rooms/join/${pin.toUpperCase()}`)
      if (!response.ok) throw new Error()
      const room = await response.json()
      onJoin(room.id)
    } catch {
      setError(t.errNotFound)
    }
  }

  return (
    <section
      aria-labelledby="unirse-sala-heading"
      className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 flex flex-col justify-center animate-fade-up [animation-delay:450ms]"
    >
      <h2 id="unirse-sala-heading" className="text-2xl font-bold text-emerald-600 mb-2">{t.title}</h2>
      <p className="text-slate-500 mb-6 text-sm">{t.desc}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Ej: R73EMU12"
          maxLength={8}
          className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-center font-mono text-xl uppercase text-black"
          onChange={(e) => { setError(null); setPin(e.target.value) }}
        />
        {error && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <button className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition">
          {t.joinBtn}
        </button>
      </form>
    </section>
  )
}
