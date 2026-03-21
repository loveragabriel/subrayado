import { Socket } from 'socket.io-client';
import { Highlight } from './highlights';

export interface PdfViewerProps {
  fileUrl: string;
  roomId: string;
  socket: Socket | null;
  initialHighlights: Highlight[];
  lang?: 'es' | 'en';
}