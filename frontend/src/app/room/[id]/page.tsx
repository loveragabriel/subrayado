'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
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
  const socketRef = useRef<Socket | null>(null)

  // Update data to the room from backend
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await fetch(`http://localhost:3000/rooms/${params.id}`);
        if (!response.ok) return;
        const data = await response.json();
        setRoom(data);
      } catch (err) {
        console.error("Error cargando sala:", err);
      }
    };
    if (params.id) fetchRoom();
  }, [params.id]);

  // Handling WebSocket connection and events
  useEffect(() => {
    if (!params.id) return;

    // Connection to Socket.IO server
    socketRef.current = io('http://localhost:3000', {
      transports: ['websocket']
    });

    socketRef.current.emit('joinRoom', params.id);

    // Looks for new highlights from other users
    socketRef.current.on('receiveHighlight', (data) => {
      console.log("Nuevo subrayado recibido:", data);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [params.id]);

  if (!room) return <div className="p-10 text-center">Cargando sala...</div>

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center h-16">
        <h1 className="text-xl font-bold">{room.title}</h1>
        <div className="bg-blue-800 px-3 py-1 rounded">PIN: {room.accessPin}</div>
      </header>
      <main className="flex-1 overflow-hidden bg-slate-200">
        <PdfViewer
          fileUrl={room.bookUrl}
          roomId={room.id}
          socket={socketRef.current}
          initialHighlights={room.highlights} // <--- Pasamos los que ya existen
        />      </main>
    </div>
  )
}