'use client'
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

interface PdfViewerProps {
  fileUrl: string;
}

export default function PdfViewer({ fileUrl }: PdfViewerProps) {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const secureUrl = fileUrl.replace('http://', 'https://');

  return (
    <div className="h-full">
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
        <Viewer 
          fileUrl={secureUrl} 
          plugins={[defaultLayoutPluginInstance]} 
          httpHeaders={{
            'Access-Control-Allow-Origin': '*',
          }}
        />
      </Worker>
    </div>
  );
}