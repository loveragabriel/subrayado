'use client'
import { useState, useEffect } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { highlightPlugin, RenderHighlightsProps } from '@react-pdf-viewer/highlight';

export default function PdfViewer({ fileUrl, roomId, socket, initialHighlights }: any) {
  const [highlights, setHighlights] = useState<any[]>(initialHighlights || []);

  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  // Highlight on realtime
  useEffect(() => {
    if (!socket) return;

    // set when someone highlight something
    socket.on('receivedHighlight', (newHighlight: any) => {
      setHighlights((current) => [...current, newHighlight]);
    });

    return () => { socket.off('receivedHighlight'); };
  }, [socket]);

  // render the highlights 
  const highlightPluginInstance = highlightPlugin({
    renderHighlights: (props: RenderHighlightsProps) => (
      <div>
        {highlights
          .filter((h) => h.page === props.pageIndex) // Just show highlights of the current page
          .map((h, index) => (
            <div
              key={index}
              style={Object.assign(
                {},
                {
                  //Highlihgt
                  background: 'rgba(255, 226, 0, 0.4)',
                  //Underline
                  borderBottom: '3px solid #d4af37',
                  opacity: 0.4,
                  pointerEvents: 'none',
                  position: 'absolute',
                },
                props.getCssProperties(h.coords, props.rotation) // Change coordinates to CSS properties
              )}
            />
          ))}
      </div>
    ),
    renderHighlightTarget: (props) => (
      <button
        className="bg-yellow-400 text-black px-2 py-1 rounded shadow-lg text-sm font-bold"
        style={{
          position: 'absolute',
          left: `${props.selectionRegion.left}%`,
          top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
          zIndex: 10,
        }}
        onClick={() => {
          const highlightData = {
            roomId,
            page: props.selectionRegion.pageIndex,
            coords: props.selectionRegion,
            content: props.selectedText,
          };

          socket?.emit('sendHighlight', highlightData);

          // Add the currently user's highlight locally immediately for better UX
          setHighlights((current) => [...current, highlightData]);
          props.toggle();
        }}
      >
        Subrayar
      </button>
    ),
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