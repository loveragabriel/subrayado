'use client'
import { useEffect } from 'react'
import { Highlight } from '../types/highlights'

interface GlossarySidebarProps {
  entries: Highlight[]
  isOpen: boolean
  onClose: () => void
}

export default function GlossarySidebar({ entries, isOpen, onClose }: GlossarySidebarProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/20 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Glosario"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BookIcon />
            <h2 className="font-semibold text-slate-800 text-sm tracking-widest uppercase">
              Glosario
            </h2>
            {entries.length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs font-bold rounded-full px-2 py-0.5">
                {entries.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition rounded-md p-1 hover:bg-slate-100"
            aria-label="Cerrar glosario"
          >
            <XIcon />
          </button>
        </div>

        {/* Word list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 gap-3 pb-16">
              <BookIcon size={32} muted />
              <p className="text-sm">Aún no hay palabras en el glosario.</p>
              <p className="text-xs leading-relaxed max-w-[200px]">
                Selecciona texto en el PDF para añadir términos.
              </p>
            </div>
          ) : (
            entries.map((entry) => (
              <a
                key={entry.id}
                href={`https://www.google.com/search?q=define+${encodeURIComponent(entry.content ?? '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg px-4 py-3 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 group-hover:text-blue-700 transition-colors truncate">
                    {entry.content}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Pág. {entry.page + 1}</p>
                </div>
                <ExternalLinkIcon />
              </a>
            ))
          )}
        </div>
      </aside>
    </>
  )
}

function BookIcon({ size = 16, muted = false }: { size?: number; muted?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={muted ? 'text-slate-300' : 'text-slate-600'}
      aria-hidden="true"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0 ml-2"
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}
