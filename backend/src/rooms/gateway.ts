import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server } from 'socket.io';
import { RoomsService } from './rooms.service';
import { SendHighlightDto } from './dto/send-highlight.dto';
import { AddWordDto } from './dto/add-word.dto';
import { WS_ERRORS } from './constants/ws-errors.constants';
import type { RoomSocket } from './types/socket.types';
import { Logger } from '@nestjs/common/services/logger.service';
@WebSocketGateway({
  cors: { origin: process.env.ALLOWED_ORIGIN },
})
export class RoomsGateway {
  private readonly logger = new Logger(RoomsGateway.name);

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
    @ConnectedSocket() client: RoomSocket,
  ) {
    try {
      const room = await this.roomService.findOne(roomId);
      if (!room) {
        client.emit('error', WS_ERRORS.ROOM_NOT_FOUND);
        return;
      }

      const roomWithToken = await this.roomService.findOneWithToken(roomId);

      const userConnectes = await this.server.in(roomId).fetchSockets();
      if (userConnectes.length >= 20) {
        client.emit('error', WS_ERRORS.ROOM_FULL);
        return;
      }

      const clientToken = (client.handshake.auth as { adminToken?: string })
        ?.adminToken;
      client.data.isAdmin = !!(
        clientToken && clientToken === roomWithToken?.adminToken
      );

      await client.join(roomId);
      client.emit('joinedRoom', { isAdmin: client.data.isAdmin });
    } catch (error) {
      this.logger.error(`[handleJoinRoom] roomId=${roomId}`, error);
      client.emit('error', WS_ERRORS.INTERNAL_ERROR);
    }
  }

  // Looks for new highlights from users
  @SubscribeMessage('sendHighlight')
  async handleSendHighlight(
    @MessageBody() data: SendHighlightDto,
    @ConnectedSocket() client: RoomSocket,
  ) {
    try {
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
      const newHighlight = await this.roomService.createHighlight(data);
      this.server.to(data.roomId).emit('receivedHighlight', newHighlight);
    } catch (error) {
      this.logger.error(`[handleSendHighlight] roomId=${data.roomId}`, error);
      client.emit('error', WS_ERRORS.HIGHLIGHT_ERROR);
    }
  }

  @SubscribeMessage('addWord')
  async handleAddWord(
    @MessageBody() data: AddWordDto,
    @ConnectedSocket() client: RoomSocket,
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

    try {
      const room = await this.roomService.findOne(data.roomId);
      if (!room) {
        client.emit('error', WS_ERRORS.ROOM_NOT_FOUND);
        return;
      }

      const newEntry = await this.roomService.addWordToGlossary(data);
      this.server.to(data.roomId).emit('newGlossaryEntry', newEntry);
    } catch (error) {
      this.logger.error(`[handleAddWord] roomId=${data.roomId}`, error);
      client.emit('error', WS_ERRORS.ADD_WORD_ERROR);
    }
  }
}
