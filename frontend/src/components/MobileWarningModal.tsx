'use client'
import { useEffect, useState } from 'react'

const copy = {
  es: {
    title: 'Mejor experiencia en desktop',
    body: 'Subrayado está optimizado para computadoras. Desde un teléfono móvil no podrás subrayar el PDF correctamente. Te recomendamos ingresar desde una computadora o tablet.',
    button: 'Entendido, continuar igual',
    switchLang: 'EN',
  },
  en: {
    title: 'Better experience on desktop',
    body: "Subrayado is optimized for desktop. On a mobile device you won't be able to highlight the PDF correctly. We recommend accessing from a computer or tablet.",
    button: 'Got it, continue anyway',
    switchLang: 'ES',
  },
}

function GlobeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

interface MobileWarningModalProps {
  lang: 'es' | 'en'
}

export default function MobileWarningModal({ lang: initialLang }: MobileWarningModalProps) {
  const [visible, setVisible] = useState(false)
  const [lang, setLang] = useState<'es' | 'en'>(initialLang)
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-blue-700">{t.title}</h2>
          <button
            onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition text-xs font-medium"
            aria-label="Switch language"
          >
            <GlobeIcon />
            <span>{t.switchLang}</span>
          </button>
        </div>
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
