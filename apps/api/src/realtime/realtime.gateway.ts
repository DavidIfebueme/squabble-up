import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

const RECONNECT_WINDOW_MS = 2 * 60 * 1000
const COUNTDOWN_TICK_MS = 1000

@WebSocketGateway({ cors: { origin: '*' } })
export class RealtimeGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private clientDebates = new Map<string, string>()
  private clientHeartbeats = new Map<string, number>()
  private reconnectTimers = new Map<string, ReturnType<typeof setInterval>>()

  @SubscribeMessage('join-debate')
  handleJoinDebate(@ConnectedSocket() client: Socket, @MessageBody() data: { debate_id: string }) {
    const room = `debate:${data.debate_id}`
    client.join(room)
    this.clientDebates.set(client.id, data.debate_id)
    this.clientHeartbeats.set(client.id, Date.now())

    if (this.reconnectTimers.has(data.debate_id)) {
      this.clearReconnectTimer(data.debate_id)
      this.server.to(room).emit('opponent-reconnected', {
        debate_id: data.debate_id,
        user_id: client.id,
        timestamp: new Date().toISOString(),
      })
    } else {
      this.server.to(room).emit('user-joined', {
        debate_id: data.debate_id,
        user_id: client.id,
        timestamp: new Date().toISOString(),
      })
    }

    return { success: true, room }
  }

  @SubscribeMessage('leave-debate')
  handleLeaveDebate(@ConnectedSocket() client: Socket, @MessageBody() data: { debate_id: string }) {
    const room = `debate:${data.debate_id}`
    client.leave(room)
    this.clientDebates.delete(client.id)
    this.clientHeartbeats.delete(client.id)
    this.server.to(room).emit('user-left', {
      debate_id: data.debate_id,
      user_id: client.id,
      timestamp: new Date().toISOString(),
    })
    return { success: true }
  }

  @SubscribeMessage('heartbeat')
  handleHeartbeat(@ConnectedSocket() client: Socket, @MessageBody() data: { debate_id: string }) {
    this.clientHeartbeats.set(client.id, Date.now())

    if (this.reconnectTimers.has(data.debate_id)) {
      this.clearReconnectTimer(data.debate_id)
      this.server.to(`debate:${data.debate_id}`).emit('opponent-reconnected', {
        debate_id: data.debate_id,
        user_id: client.id,
        timestamp: new Date().toISOString(),
      })
    }

    this.server.to(`debate:${data.debate_id}`).emit('heartbeat-ack', {
      debate_id: data.debate_id,
      user_id: client.id,
      timestamp: new Date().toISOString(),
    })
    return { success: true }
  }

  handleDisconnect(client: Socket) {
    const debateId = this.clientDebates.get(client.id)
    if (!debateId) return

    this.clientDebates.delete(client.id)
    this.clientHeartbeats.delete(client.id)

    this.server.to(`debate:${debateId}`).emit('opponent-disconnected', {
      debate_id: debateId,
      user_id: client.id,
      timestamp: new Date().toISOString(),
    })

    let remaining = RECONNECT_WINDOW_MS
    const startTime = Date.now()

    this.server.to(`debate:${debateId}`).emit('reconnect-window', {
      debate_id: debateId,
      remaining_ms: remaining,
      timestamp: new Date().toISOString(),
    })

    const timer = setInterval(() => {
      remaining = RECONNECT_WINDOW_MS - (Date.now() - startTime)

      if (remaining <= 0) {
        this.reconnectTimers.delete(debateId)
        this.server.to(`debate:${debateId}`).emit('debate-abandoned', {
          debate_id: debateId,
          reason: 'reconnect_timeout',
          timestamp: new Date().toISOString(),
        })
        return
      }

      this.server.to(`debate:${debateId}`).emit('reconnect-window', {
        debate_id: debateId,
        remaining_ms: remaining,
        timestamp: new Date().toISOString(),
      })
    }, COUNTDOWN_TICK_MS)

    this.reconnectTimers.set(debateId, timer)
  }

  emitDebateEvent(debateId: string, event: string, payload: Record<string, unknown>) {
    const room = `debate:${debateId}`
    this.server.to(room).emit(event, {
      debate_id: debateId,
      payload,
      timestamp: new Date().toISOString(),
    })
  }

  private clearReconnectTimer(debateId: string) {
    const timer = this.reconnectTimers.get(debateId)
    if (timer) {
      clearInterval(timer)
      this.reconnectTimers.delete(debateId)
    }
  }
}
