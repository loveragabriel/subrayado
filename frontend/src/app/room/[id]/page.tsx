'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/default-layout/lib/styles/index.css'
import dynamic from 'next/dynamic'

const PdfViewer = dynamic(() => import('@/components/PdfViewer'), { 
  ssr: false,
  loading: () => <p className="text-center p-10">Cargando visor de PDF...</p>
})

interface Room {
  id: string
  title: string
  bookUrl: string
  accessPin: string
}

export default function RoomPage() {
  const params = useParams()
  const [room, setRoom] = useState<Room | null>(null)

  useEffect(() => {
  const fetchRoom = async () => {
    try {
      const response = await fetch(`http://localhost:3000/rooms/${params.id}`);
      
      if (!response.ok) {
        const errorText = await response.text(); 
        console.error(`Error del servidor (${response.status}):`, errorText);
        return;
      }

      const text = await response.text();
      if (text) {
        setRoom(JSON.parse(text));
      } else {
        console.warn("El servidor respondió con un cuerpo vacío.");
      }
    } catch (err) {
      console.error("Error de red o conexión:", err);
    }
  };

  if (params.id) {
    fetchRoom();
  }
}, [params.id]);

  if (!room) return <div className="p-10 text-center">Cargando sala...</div>

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center h-16">
        <h1 className="text-xl font-bold">{room.title}</h1>
        <div className="bg-blue-800 px-3 py-1 rounded">PIN: {room.accessPin}</div>
      </header>
      <main className="flex-1 overflow-hidden bg-slate-200">
        <PdfViewer fileUrl={room.bookUrl} />
      </main>
    </div>
  )
}