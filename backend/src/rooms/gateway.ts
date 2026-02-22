import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class RoomsGateway {
  @WebSocketServer()
  server: Server;

  constructor(private prisma: PrismaService) {}

  // Check with a user connects
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(roomId);
  }

  // Looks for new highlights from users
  @SubscribeMessage('sendHighlight')
  async handleSendHighlight(
    @MessageBody()
    data: { roomId: string; page: number; coords: any; content?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const newHighlight = await this.prisma.highlight.create({
      data: {
        roomId: data.roomId,
        userId: null,
        page: data.page,
        coords: data.coords,
        content: data.content,
      },
    });
    this.server.to(data.roomId).emit('receivedHighlight', newHighlight);
    return newHighlight;
  }
  catch(error) {
    console.error('❌ Error guardando subrayado:', error);
  }
}
