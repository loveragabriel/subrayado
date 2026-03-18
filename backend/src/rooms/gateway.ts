import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService } from './rooms.service';
import { SendHighlightDto } from './dto/send-highlight.dto';
import { AddWordDto } from './dto/add-word.dto';
import { WS_ERRORS } from './constants/ws-errors.constants';

@WebSocketGateway({
  cors: { origin: process.env.ALLOWED_ORIGIN },
})
export class RoomsGateway {
  @WebSocketServer()
  server: Server;
  private readonly rateLimits = new Map<
    string,
    { count: number; resetAt: number }
  >();

  constructor(private roomService: RoomsService) {}

  private checkRateLimit(socketId: string, limit: number): boolean {
    const now = Date.now();
    const entry = this.rateLimits.get(socketId);

    if (!entry || now > entry.resetAt) {
      this.rateLimits.set(socketId, { count: 1, resetAt: now + 60000 });
      return true;
    }

    if (entry.count >= limit) return false;

    entry.count++;
    return true;
  }

  // Check with a user connects
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const room = await this.roomService.findOne(roomId);
    if (!room) {
      client.emit('error', WS_ERRORS.ROOM_NOT_FOUND);
      return;
    }
    // Count the number of users connected to the room
    const userConnectes = await this.server.in(roomId).fetchSockets();

    // If there are more than 20 users, send an error message to the client
    if (userConnectes.length >= 20) {
      client.emit('error', WS_ERRORS.ROOM_FULL);
      return;
    }
    // If everything is ok, join the room
    await client.join(roomId);
  }

  // Looks for new highlights from users
  @SubscribeMessage('sendHighlight')
  async handleSendHighlight(
    @MessageBody() data: SendHighlightDto,
    @ConnectedSocket() client: Socket,
  ) {
    // Check rate limit
    if (
      !this.checkRateLimit(
        client.id,
        parseInt(process.env.THROTTLE_HIGHLIGHT_LIMIT || '30'),
      )
    ) {
      client.emit('error', WS_ERRORS.RATE_LIMIT_EXCEEDED);
      return;
    }
    const room = await this.roomService.findOne(data.roomId);
    if (!room) {
      client.emit('error', WS_ERRORS.ROOM_NOT_FOUND);
      return;
    }
    try {
      const newHighlight = await this.roomService.createHighlight(data);
      this.server.to(data.roomId).emit('receivedHighlight', newHighlight);
      return newHighlight;
    } catch {
      client.emit('error', WS_ERRORS.HIGHLIGHT_ERROR);
    }
  }

  @SubscribeMessage('addWord')
  async handleAddWord(
    @MessageBody() data: AddWordDto,
    @ConnectedSocket() client: Socket,
  ) {
    //Check rate limit
    if (
      !this.checkRateLimit(
        client.id,
        parseInt(process.env.THROTTLE_WORD_LIMIT || '20'),
      )
    ) {
      client.emit('error', WS_ERRORS.RATE_LIMIT_EXCEEDED);
      return;
    }
    const room = await this.roomService.findOne(data.roomId);
    if (!room) {
      client.emit('error', WS_ERRORS.ROOM_NOT_FOUND);
      return;
    }
    try {
      const newEntry = await this.roomService.addWordToGlossary(data);
      this.server.to(data.roomId).emit('newGlossaryEntry', newEntry);
      return newEntry;
    } catch {
      client.emit('error', WS_ERRORS.ADD_WORD_ERROR);
    }
  }
}
