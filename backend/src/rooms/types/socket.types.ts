import { Socket } from 'socket.io';
import type { Highlight, Glossary } from '@prisma/client';
import type { HighlightAreaDto } from '../dto/highlight-area.dto';
import type { AddWordDto } from '../dto/add-word.dto';

export interface ClientToServerEvents {
  joinRoom: (roomId: string) => void;
  sendHighlight: (data: {
    roomId: string;
    page: number;
    coords: HighlightAreaDto[];
    content?: string;
  }) => void;
  addToGlossary: (data: AddWordDto) => void;
}

export interface ServerToClientEvents {
  joinedRoom: (data: { isAdmin: boolean }) => void;
  receivedHighlight: (highlight: Highlight) => void;
  newGlossaryEntry: (word: Glossary) => void;
  error: (error: { code: string; message: string }) => void;
}

export interface SocketData {
  isAdmin: boolean;
}

export type RoomSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  never,
  SocketData
>;
