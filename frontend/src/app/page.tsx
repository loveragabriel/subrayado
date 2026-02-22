'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return alert("Completa el título y sube un PDF");

    setLoading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:3000/rooms', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear sala");
      }

      const newRoom = await response.json();

      if (newRoom && newRoom.id) {
        router.push(`/room/${newRoom.id}`);
      } else {
        alert("El servidor no devolvió un ID válido");
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length < 6) return alert("El PIN debe tener 6 caracteres")

    try {
      const response = await fetch(`http://localhost:3000/rooms/join/${pin.toUpperCase()}`)

      if (!response.ok) throw new Error("Sala no encontrada");

      const room = await response.json()
      router.push(`/room/${room.id}`)
    } catch (error) {
      alert("PIN inválido o sala inexistente");
    }
  }
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8">

        {/* SECCIÓN: CREAR SALA */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
          <h2 className="text-2xl font-bold text-blue-600 mb-2">Crear Sala</h2>
          <p className="text-slate-500 mb-6 text-sm">Sube un libro y comparte el PIN con otros.</p>

          <form onSubmit={handleCreateRoom} className="space-y-4">
            <input
              type="text"
              placeholder="Título del libro"
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="border-2 border-dashed border-slate-200 p-4 rounded-lg">
              <input
                type="file"
                accept=".pdf"
                className="text-sm text-slate-600"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <button
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-slate-400"
            >
              {loading ? 'Subiendo...' : 'Crear Sala'}
            </button>
          </form>
        </div>

        {/* SECCIÓN: UNIRSE A SALA */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-emerald-600 mb-2">Unirse a Sala</h2>
          <p className="text-slate-500 mb-6 text-sm">¿Tienes un código? Introdúcelo para empezar.</p>

          <form onSubmit={handleJoinRoom} className="space-y-4">
            <input
              type="text"
              placeholder="Ej: R73EMU"
              maxLength={6}
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-center font-mono text-xl uppercase text-black"
              onChange={(e) => setPin(e.target.value)}
            />
            <button
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition"
            >
              Entrar a la Sala
            </button>
          </form>
        </div>

      </div>
    </main>
  )
}