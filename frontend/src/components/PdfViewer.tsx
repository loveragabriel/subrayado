'use client'
import { useState, useEffect } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { highlightPlugin, RenderHighlightsProps } from '@react-pdf-viewer/highlight';
import { Socket } from 'socket.io-client';
import { Highlight } from '../types/highlights';

const uiCopy = {
  es: {
    underline: 'Subrayar',
    glossary: 'Glosario',
    duplicateTitle: 'Palabra ya en el glosario',
    duplicateMsg: (word: string) => `"${word}" ya está añadida al glosario.`,
    defineLink: 'Ver definición',
    close: 'Cerrar',
  },
  en: {
    underline: 'Underline',
    glossary: 'Glossary',
    duplicateTitle: 'Word already in glossary',
    duplicateMsg: (word: string) => `"${word}" is already in the glossary.`,
    defineLink: 'See definition',
    close: 'Close',
  },
}

function isSingleWord(text: string): boolean {
  return /^\S+$/.test(text.trim())
}

export default function PdfViewer({ fileUrl, roomId, socket, initialHighlights, lang = 'es' }: { fileUrl: string; roomId: string; socket: Socket | null; initialHighlights: Highlight[]; lang?: 'es' | 'en' }) {
  const [highlights, setHighlights] = useState<Highlight[]>(initialHighlights || []);
  const [duplicateWord, setDuplicateWord] = useState<string | null>(null);
  const t = uiCopy[lang];

  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  // Sync real-time events from other users in the room
  useEffect(() => {
    if (!socket) return;
    // Named handlers so socket.off only removes these specific listeners,
    // not any others registered externally (e.g. in the parent room page)
    const onHighlight = (h: Highlight) => setHighlights(c => [...c, h]);
    const onGlossary  = (h: Highlight) => setHighlights(c => [...c, h]);
    socket.on('receivedHighlight', onHighlight);
    socket.on('newGlossaryEntry', onGlossary);
    return () => {
      socket.off('receivedHighlight', onHighlight);
      socket.off('newGlossaryEntry', onGlossary);
    };
  }, [socket]);

  // render the highlights
  const highlightPluginInstance = highlightPlugin({
    renderHighlights: (props: RenderHighlightsProps) => (
      <div>
         {highlights
      .filter((h) => {
        return h.page === props.pageIndex;
      })
          .map((h, index) => (
            (Array.isArray(h.coords) ? h.coords : [h.coords])
            .filter((coord)=> coord.width > 0 && coord.height > 0)
            .map((coord, idx) => (
            <div
              key={`highlight-${index}-${idx}`}
              style={Object.assign(
                {},
                {
                  background: h.type === 'glossary' ? 'rgba(96, 165, 250, 0.35)' : 'rgba(255, 226, 0, 0.4)',
                  borderBottom: h.type === 'glossary' ? '3px solid #2563eb' : '3px solid #d4af37',
                  opacity: 0.5,
                  pointerEvents: 'none',
                  position: 'absolute',
                },
                props.getCssProperties(coord, props.rotation)
              )}
            />
            ))
          ))}
      </div>
    ),
    renderHighlightTarget: (props) => {
      const pageIndex = props.highlightAreas[0]?.pageIndex ?? 0;
      const singleWord = isSingleWord(props.selectedText);

      const handleUnderline = () => {
        const highlightData = {
          roomId,
          page: pageIndex,
          coords: props.highlightAreas,
          content: props.selectedText,
        };
        socket?.emit('sendHighlight', highlightData);
        setHighlights((current) => [...current, highlightData as unknown as Highlight]);
        props.toggle();
      };

      const handleGlossary = () => {
        const word = props.selectedText.trim();
        const alreadyExists = highlights.some(
          (h) => h.type === 'glossary' && h.content?.toLowerCase() === word.toLowerCase()
        );

        if (alreadyExists) {
          props.toggle();
          setDuplicateWord(word);
          return;
        }

        const glossaryData = {
          roomId,
          page: pageIndex,
          coords: props.highlightAreas,
          content: word,
          type: 'glossary',
        };
        socket?.emit('addWord', { roomId, term: word, page: pageIndex, coords: props.highlightAreas });
        // Optimistic update — show blue overlay immediately
        setHighlights((current) => [...current, glossaryData as unknown as Highlight]);
        props.toggle();
      };

      return (
        <div
          style={{
            position: 'absolute',
            left: `${props.selectionRegion.left}%`,
            top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
            zIndex: 10,
            display: 'flex',
            gap: '4px',
          }}
        >
          <button
            className="bg-yellow-400 text-black px-2 py-1 rounded shadow-lg text-sm font-bold hover:bg-yellow-300 transition-colors"
            onClick={handleUnderline}
          >
            {t.underline}
          </button>
          {singleWord && (
            <button
              className="bg-blue-600 text-white px-2 py-1 rounded shadow-lg text-sm font-bold hover:bg-blue-500 transition-colors"
              onClick={handleGlossary}
            >
              {t.glossary}
            </button>
          )}
        </div>
      );
    },
  });

  return (
    <div className="h-full">
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
        <Viewer
          fileUrl={fileUrl}
          plugins={[defaultLayoutPluginInstance, highlightPluginInstance]}
        />
      </Worker>

      {duplicateWord && (
        <DuplicateWordModal
          word={duplicateWord}
          t={t}
          onClose={() => setDuplicateWord(null)}
        />
      )}
    </div>
  );
}

function DuplicateWordModal({ word, t, onClose }: {
  word: string;
  t: typeof uiCopy['es'];
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const defineUrl = `https://www.google.com/search?q=define+${encodeURIComponent(word)}`

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dup-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 pointer-events-auto">
          {/* Icon + title */}
          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-100">
              <BookCheckIcon />
            </span>
            <h2 id="dup-title" className="font-bold text-slate-800 text-base leading-tight">
              {t.duplicateTitle}
            </h2>
          </div>

          {/* Message */}
          <p className="text-sm text-slate-500 mb-5">{t.duplicateMsg(word)}</p>

          {/* Actions */}
          <div className="flex gap-3">
            <a
              href={defineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              <ExternalLinkIcon />
              {t.defineLink}
            </a>
            <button
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {t.close}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function BookCheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <polyline points="9 11 11 13 15 9" />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}
