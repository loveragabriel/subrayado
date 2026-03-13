import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService } from './rooms.service';

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
    // Count the number of users connected to the room
    const userConnectes = await this.server.in(roomId).fetchSockets();

    // If there are more than 20 users, send an error message to the client
    if (userConnectes.length >= 20) {
      client.emit('error', 'La sala alcanzó el límite de usuarios');
      return;
    }
    // If everything is ok, join the room
    await client.join(roomId);
  }

  // Looks for new highlights from users
  @SubscribeMessage('sendHighlight')
  async handleSendHighlight(
    @MessageBody()
    data: { roomId: string; page: number; coords: any; content?: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const newHighlight = await this.roomService.createHighlight(data);
      this.server.to(data.roomId).emit('receivedHighlight', newHighlight);
      return newHighlight;
    } catch {
      client.emit('error', 'Error al guardar subrayado');
    }
  }

  @SubscribeMessage('addWord')
  async handleAddWord(
    @MessageBody() 
    data: { roomId: string; term: string; page: number; coords: any },
    @ConnectedSocket() client: Socket, 
  ) {
    try {
      const newEntry = await this.roomService.addWordToGlossary(data);
      this.server.to(data.roomId).emit('newGlossaryEntry', newEntry);
      return newEntry;
    } catch (error) {
      console.error('❌ Error al agregar palabra:', error);
      client.emit('error', 'Error al agregar palabra al glosario');
    }
  }
}
