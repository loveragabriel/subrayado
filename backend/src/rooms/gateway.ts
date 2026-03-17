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
import { WS_ERRORS } from './constants/ws-erros.constants';

@WebSocketGateway({
  cors: { origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000' },
})
export class RoomsGateway {
  @WebSocketServer()
  server: Server;

  constructor(private roomService: RoomsService) {}

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
