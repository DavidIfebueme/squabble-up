import { io, Socket } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:3000'
const HEARTBEAT_INTERVAL_MS = 30_000

let socket: Socket | null = null
let heartbeatTimer: ReturnType<typeof setInterval> | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: false,
    })
  }
  return socket
}

export function connectSocket() {
  const s = getSocket()
  if (!s.connected) {
    s.connect()
  }
  return s
}

export function disconnectSocket() {
  stopHeartbeat()
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function joinDebateRoom(debateId: string) {
  const s = connectSocket()
  s.emit('join-debate', { debate_id: debateId })
}

export function leaveDebateRoom(debateId: string) {
  stopHeartbeat()
  const s = getSocket()
  s.emit('leave-debate', { debate_id: debateId })
}

export function sendHeartbeat(debateId: string) {
  const s = getSocket()
  s.emit('heartbeat', { debate_id: debateId })
}

export function startHeartbeat(debateId: string) {
  stopHeartbeat()
  heartbeatTimer = setInterval(() => {
    sendHeartbeat(debateId)
  }, HEARTBEAT_INTERVAL_MS)
}

export function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

export function onDebateEvent(event: string, callback: (data: any) => void) {
  const s = getSocket()
  s.on(event, callback)
  return () => { s.off(event, callback) }
}
