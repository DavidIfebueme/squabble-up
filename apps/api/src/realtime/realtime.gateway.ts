import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({ cors: { origin: '*' } })
export class RealtimeGateway {
  @WebSocketServer()
  server: Server

  @SubscribeMessage('join-debate')
  handleJoinDebate(@ConnectedSocket() client: Socket, @MessageBody() data: { debate_id: string }) {
    const room = `debate:${data.debate_id}`
    client.join(room)
    this.server.to(room).emit('user-joined', {
      debate_id: data.debate_id,
      user_id: client.id,
      timestamp: new Date().toISOString(),
    })
    return { success: true, room }
  }

  @SubscribeMessage('leave-debate')
  handleLeaveDebate(@ConnectedSocket() client: Socket, @MessageBody() data: { debate_id: string }) {
    const room = `debate:${data.debate_id}`
    client.leave(room)
    this.server.to(room).emit('user-left', {
      debate_id: data.debate_id,
      user_id: client.id,
      timestamp: new Date().toISOString(),
    })
    return { success: true }
  }

  emitDebateEvent(debateId: string, event: string, payload: Record<string, unknown>) {
    const room = `debate:${debateId}`
    this.server.to(room).emit(event, {
      debate_id: debateId,
      payload,
      timestamp: new Date().toISOString(),
    })
  }
}
