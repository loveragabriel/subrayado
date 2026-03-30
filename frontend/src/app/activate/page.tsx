'use client'
import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ActivateContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setError('Token no encontrado.')
      return
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/rooms/verify?token=${token}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Token inválido.')
        localStorage.setItem(`adminToken:${data.roomId}`, data.adminToken)
        router.replace(`/room/${data.roomId}`)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Error al verificar el token.')
      })
  }, [searchParams, router])

  if (error) {
    return (
      <div className="text-center">
        <p className="text-red-600 text-lg font-medium">{error}</p>
        <Link href="/" className="mt-4 inline-block text-blue-600 underline">
          Volver al inicio
        </Link>
      </div>
    )
  }

  return <p className="text-slate-500 animate-pulse">Activando sala...</p>
}

export default function ActivatePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <Suspense fallback={<p className="text-slate-500">Cargando...</p>}>
        <ActivateContent />
      </Suspense>
    </main>
  )
}