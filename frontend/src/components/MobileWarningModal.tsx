'use client'
import { useEffect, useState } from 'react'

const copy = {
  es: {
    title: 'Mejor experiencia en desktop',
    body: 'Subrayado está optimizado para computadoras. Desde un teléfono móvil no podrás subrayar el PDF correctamente. Te recomendamos ingresar desde una computadora o tablet.',
    button: 'Entendido, continuar igual',
  },
  en: {
    title: 'Better experience on desktop',
    body: 'Subrayado is optimized for desktop. On a mobile device you won\'t be able to highlight the PDF correctly. We recommend accessing from a computer or tablet.',
    button: 'Got it, continue anyway',
  },
}

interface MobileWarningModalProps {
  lang: 'es' | 'en'
}

export default function MobileWarningModal({ lang }: MobileWarningModalProps) {
  const [visible, setVisible] = useState(false)
  const t = copy[lang]

  useEffect(() => {
    if (window.innerWidth < 768) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-6">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        <h2 className="text-lg font-bold text-blue-700 mb-3">{t.title}</h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-6">{t.body}</p>
        <button
          onClick={() => setVisible(false)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
        >
          {t.button}
        </button>
      </div>
    </div>
  )
}
