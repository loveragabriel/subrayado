import { Socket } from 'socket.io-client';

export interface PdfViewerProps {
  fileUrl: string;
  roomId: string;
  socket: Socket | null;
  initialHighlights: Highlight[];
  lang?: 'es' | 'en';
}