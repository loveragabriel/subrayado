'use client'
import { useEffect } from 'react'
import { Highlight } from '@/types/highlights'

const copy = {
  es: {
    title: 'Resumen de la sala',
    subtitle: 'Todos los subrayados registrados durante la sesión',
    statsHighlights: 'Subrayados',
    statsGlossary: 'Glosario',
    statsPages: 'Páginas',
    sectionHighlights: 'Subrayados por página',
    sectionGlossary: 'Palabras del glosario',
    page: 'Pág.',
    noText: 'Sin texto seleccionado',
    noHighlights: 'Aún no hay subrayados en esta sala.',
    generateBtn: 'Generar resumen con IA',
    soon: 'Próximamente',
    close: 'Cerrar',
  },
  en: {
    title: 'Room Summary',
    subtitle: 'All highlights recorded during the session',
    statsHighlights: 'Highlights',
    statsGlossary: 'Glossary',
    statsPages: 'Pages',
    sectionHighlights: 'Highlights by page',
    sectionGlossary: 'Glossary words',
    page: 'P.',
    noText: 'No text selected',
    noHighlights: 'No highlights in this room yet.',
    generateBtn: 'Generate AI summary',
    soon: 'Coming soon',
    close: 'Close',
  },
}

interface Props {
  highlights: Highlight[]
  lang: 'es' | 'en'
  onClose: () => void
}

export default function SummaryPanel({ highlights, lang, onClose }: Props) {
  const t = copy[lang]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const underlines = highlights.filter((h) => h.type !== 'glossary' && h.content)
  const glossary   = highlights.filter((h) => h.type === 'glossary')
  const pages      = [...new Set(highlights.map((h) => h.page))].length

  // Group underlines by page (0-indexed → display as 1-indexed)
  const byPage = underlines.reduce<Record<number, Highlight[]>>((acc, h) => {
    const key = h.page + 1
    acc[key] = acc[key] ? [...acc[key], h] : [h]
    return acc
  }, {})
  const sortedPages = Object.keys(byPage).map(Number).sort((a, b) => a - b)

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className="fixed inset-y-0 right-0 w-full max-w-lg bg-white z-50 flex flex-col shadow-2xl"
        aria-label={t.title}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <SparklesIcon />
              <h2 className="font-bold text-lg leading-tight">{t.title}</h2>
            </div>
            <p className="text-blue-100 text-xs">{t.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white transition rounded p-1 ml-4 mt-0.5"
            aria-label={t.close}
          >
            <XIcon />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
          <Stat label={t.statsHighlights} value={underlines.length} color="blue" />
          <Stat label={t.statsGlossary}   value={glossary.length}   color="indigo" />
          <Stat label={t.statsPages}      value={pages}             color="slate" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {highlights.length === 0 ? (
            <p className="text-slate-400 text-sm text-center pt-10">{t.noHighlights}</p>
          ) : (
            <>
              {/* Underlines grouped by page */}
              {sortedPages.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                    {t.sectionHighlights}
                  </h3>
                  <div className="space-y-2">
                    {sortedPages.map((page) =>
                      byPage[page].map((h) => (
                        <div
                          key={h.id ?? `${page}-${h.content}`}
                          className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5"
                        >
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-100 rounded px-1.5 py-0.5 mt-0.5 whitespace-nowrap">
                            {t.page} {page}
                          </span>
                          <p className="text-sm text-slate-700 leading-snug">
                            {h.content || <span className="italic text-slate-400">{t.noText}</span>}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              )}

              {/* Glossary words */}
              {glossary.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                    {t.sectionGlossary}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {glossary.map((h) => (
                      <span
                        key={h.id ?? h.content}
                        className="bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium rounded-full px-3 py-1"
                      >
                        {h.content}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Generate button (placeholder) */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50">
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-xl font-semibold opacity-60 cursor-not-allowed"
            title={t.soon}
          >
            <SparklesIcon />
            {t.generateBtn}
            <span className="ml-auto text-[10px] font-bold bg-white/20 rounded-full px-2 py-0.5 uppercase tracking-wide">
              {t.soon}
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: 'blue' | 'indigo' | 'slate' }) {
  const colors = {
    blue:   'text-blue-600',
    indigo: 'text-indigo-600',
    slate:  'text-slate-600',
  }
  return (
    <div className="flex flex-col items-center py-3 px-2">
      <span className={`text-2xl font-extrabold ${colors[color]}`}>{value}</span>
      <span className="text-[11px] text-slate-400 mt-0.5 text-center leading-tight">{label}</span>
    </div>
  )
}

function SparklesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
      <path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
