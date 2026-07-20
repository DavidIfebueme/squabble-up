import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({ cors: { origin: '*' } })
export class RealtimeGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private clientDebates = new Map<string, string>()

  @SubscribeMessage('join-debate')
  handleJoinDebate(@ConnectedSocket() client: Socket, @MessageBody() data: { debate_id: string }) {
    const room = `debate:${data.debate_id}`
    client.join(room)
    this.clientDebates.set(client.id, data.debate_id)
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
    this.clientDebates.delete(client.id)
    this.server.to(room).emit('user-left', {
      debate_id: data.debate_id,
      user_id: client.id,
      timestamp: new Date().toISOString(),
    })
    return { success: true }
  }

  @SubscribeMessage('heartbeat')
  handleHeartbeat(@ConnectedSocket() client: Socket, @MessageBody() data: { debate_id: string }) {
    this.server.to(`debate:${data.debate_id}`).emit('heartbeat-ack', {
      debate_id: data.debate_id,
      user_id: client.id,
      timestamp: new Date().toISOString(),
    })
    return { success: true }
  }

  handleDisconnect(client: Socket) {
    const debateId = this.clientDebates.get(client.id)
    if (debateId) {
      this.server.to(`debate:${debateId}`).emit('opponent-disconnected', {
        debate_id: debateId,
        user_id: client.id,
        timestamp: new Date().toISOString(),
      })
      this.clientDebates.delete(client.id)
    }
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
