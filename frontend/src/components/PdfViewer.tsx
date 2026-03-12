'use client'
import { useState, useEffect } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { highlightPlugin, RenderHighlightsProps } from '@react-pdf-viewer/highlight';
import { Socket } from 'socket.io-client';
import { Highlight } from '../types/highlights';

const uiCopy = {
  es: { underline: 'Subrayar', glossary: 'Glosario' },
  en: { underline: 'Underline', glossary: 'Glossary' },
}

function isSingleWord(text: string): boolean {
  return /^\S+$/.test(text.trim())
}

export default function PdfViewer({ fileUrl, roomId, socket, initialHighlights, lang = 'es' }: { fileUrl: string; roomId: string; socket: Socket | null; initialHighlights: Highlight[]; lang?: 'es' | 'en' }) {
  const [highlights, setHighlights] = useState<Highlight[]>(initialHighlights || []);
  const t = uiCopy[lang];

  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  // Sync real-time events from other users in the room
  useEffect(() => {
    if (!socket) return;
    socket.on('receivedHighlight', (newHighlight: Highlight) => {
      setHighlights((current) => [...current, newHighlight]);
    });
    socket.on('newGlossaryEntry', (newEntry: Highlight) => {
      setHighlights((current) => [...current, newEntry]);
    });
    return () => {
      socket.off('receivedHighlight');
      socket.off('newGlossaryEntry');
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
        const glossaryData = {
          roomId,
          page: pageIndex,
          coords: props.highlightAreas,
          content: props.selectedText,
          type: 'glossary',
        };
        socket?.emit('addWord', { roomId, term: props.selectedText, page: pageIndex, coords: props.highlightAreas });
        // Optimistic update — show blue overlay immediately without waiting for server roundtrip
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
    </div>
  );
}