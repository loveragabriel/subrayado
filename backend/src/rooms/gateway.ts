import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoomsService } from './rooms.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class RoomsGateway {
  @WebSocketServer()
  server: Server;

  constructor(private prisma: PrismaService, private roomsService: RoomsService) {}

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
      client.emit('error', 'La sala a alcanzadoel límite de usuarios');
      return;
    }
    // If everything is ok, join the room
    client.join(roomId);
  }

  // Looks for new highlights from users
  @SubscribeMessage('sendHighlight')
  async handleSendHighlight(
    @MessageBody()
    data: { roomId: string; page: number; coords: any; content?: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('📩 sendHighlight recibido:', data); // ← acá sí va

    try {
    const newHighlight = await this.prisma.highlight.create({
      data: {
        roomId: data.roomId,
        userId: null,
        page: data.page,
        coords: data.coords,
        content: data.content,
        type: 'underline',
      },
    });
    console.log('📡 Emitiendo a room:', data.roomId);

    this.server.to(data.roomId).emit('receivedHighlight', newHighlight);
    return newHighlight;
  } catch (error) {
    client.emit('error', 'Error al guardar subrayado'); 
  };
}



  @SubscribeMessage('addWord')
  async handleAddWord(
    @MessageBody() 
    data: { roomId: string; term: string; page: number; coords: any },
    @ConnectedSocket() client: Socket, 
  ) {
    try {
      // Add the word to the glossary
      const newEntrey = await this.prisma.glossary.create({
        data: {
          roomId: data.roomId, 
          term: data.term, 
          page: data.page,
          coords: data.coords,
        },
      }); 
      // Emit the new entry to all clients in the room
      this.server.to(data.roomId).emit('newGlossaryEntry', newEntrey);
      return; 
  }
  catch(error) {
    console.error('❌ Error al agregar palabra:', error);
  }
}
}
