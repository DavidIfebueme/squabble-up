import { Test, TestingModule } from '@nestjs/testing'
import { RealtimeGateway } from './realtime.gateway'
import { Server, Socket } from 'socket.io'

describe('RealtimeGateway', () => {
  let gateway: RealtimeGateway
  let mockServer: Partial<Server>

  beforeEach(async () => {
    jest.useFakeTimers()

    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [RealtimeGateway],
    }).compile()

    gateway = module.get<RealtimeGateway>(RealtimeGateway)
    gateway.server = mockServer as Server
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should be defined', () => {
    expect(gateway).toBeDefined()
  })

  describe('handleJoinDebate', () => {
    it('should join room and emit user-joined', () => {
      const mockClient = { join: jest.fn(), id: 'client-1' } as unknown as Socket
      const data = { debate_id: 'debate-1' }

      const result = gateway.handleJoinDebate(mockClient, data)

      expect(mockClient.join).toHaveBeenCalledWith('debate:debate-1')
      expect(mockServer.to).toHaveBeenCalledWith('debate:debate-1')
      expect(mockServer.emit).toHaveBeenCalledWith('user-joined', expect.objectContaining({
        debate_id: 'debate-1',
        user_id: 'client-1',
      }))
      expect(result).toEqual({ success: true, room: 'debate:debate-1' })
    })

    it('should clear reconnect timer when client reconnects', () => {
      const mockClient = { join: jest.fn(), id: 'client-1' } as unknown as Socket
      const timer = jest.fn()
      gateway['reconnectTimers'] = new Map([['client-1', timer as any]])

      gateway.handleJoinDebate(mockClient, { debate_id: 'debate-1' })

      expect(gateway['reconnectTimers'].has('client-1')).toBe(false)
    })
  })

  describe('handleLeaveDebate', () => {
    it('should leave room and emit user-left', () => {
      const mockClient = { leave: jest.fn(), id: 'client-1' } as unknown as Socket
      const data = { debate_id: 'debate-1' }

      const result = gateway.handleLeaveDebate(mockClient, data)

      expect(mockClient.leave).toHaveBeenCalledWith('debate:debate-1')
      expect(mockServer.to).toHaveBeenCalledWith('debate:debate-1')
      expect(mockServer.emit).toHaveBeenCalledWith('user-left', expect.objectContaining({
        debate_id: 'debate-1',
        user_id: 'client-1',
      }))
      expect(result).toEqual({ success: true })
    })
  })

  describe('handleHeartbeat', () => {
    it('should update last seen timestamp', () => {
      const mockClient = { id: 'client-1' } as unknown as Socket
      gateway['clientHeartbeats'] = new Map()

      gateway.handleHeartbeat(mockClient, { debate_id: 'debate-1' })

      const lastSeen = gateway['clientHeartbeats'].get('client-1')
      expect(lastSeen).toBeDefined()
      expect(Date.now() - lastSeen!).toBeLessThan(100)
    })

    it('should emit heartbeat-ack', () => {
      const mockClient = { id: 'client-1' } as unknown as Socket

      gateway.handleHeartbeat(mockClient, { debate_id: 'debate-1' })

      expect(mockServer.emit).toHaveBeenCalledWith('heartbeat-ack', expect.objectContaining({
        debate_id: 'debate-1',
        user_id: 'client-1',
      }))
    })

    it('should clear reconnect timer if client was disconnecting', () => {
      const mockClient = { id: 'client-1' } as unknown as Socket
      const timer = jest.fn()
      gateway['reconnectTimers'] = new Map([['client-1', timer as any]])

      gateway.handleHeartbeat(mockClient, { debate_id: 'debate-1' })

      expect(gateway['reconnectTimers'].has('client-1')).toBe(false)
    })
  })

  describe('emitDebateEvent', () => {
    it('should emit event to correct room', () => {
      gateway.emitDebateEvent('debate-1', 'round-started', { round_number: 1, speaker_id: 'user-1' })

      expect(mockServer.to).toHaveBeenCalledWith('debate:debate-1')
      expect(mockServer.emit).toHaveBeenCalledWith('round-started', expect.objectContaining({
        debate_id: 'debate-1',
        payload: { round_number: 1, speaker_id: 'user-1' },
      }))
    })

    it('should include timestamp in event', () => {
      gateway.emitDebateEvent('debate-1', 'test-event', {})

      const emittedPayload = (mockServer.emit as jest.Mock).mock.calls[0][1]
      expect(emittedPayload.timestamp).toBeDefined()
      expect(new Date(emittedPayload.timestamp).getTime()).not.toBeNaN()
    })

    it('should emit to room even if no clients are connected', () => {
      gateway.emitDebateEvent('debate-nonexistent', 'test-event', {})

      expect(mockServer.to).toHaveBeenCalledWith('debate:debate-nonexistent')
      expect(mockServer.emit).toHaveBeenCalledWith('test-event', expect.objectContaining({
        debate_id: 'debate-nonexistent',
      }))
    })
  })

  describe('handleDisconnect', () => {
    it('should emit opponent-disconnected when a participant disconnects', () => {
      const mockClient = { id: 'client-1' } as unknown as Socket

      gateway['clientDebates'] = new Map([['client-1', 'debate-1']])

      gateway.handleDisconnect(mockClient)

      expect(mockServer.to).toHaveBeenCalledWith('debate:debate-1')
      expect(mockServer.emit).toHaveBeenCalledWith('opponent-disconnected', expect.objectContaining({
        debate_id: 'debate-1',
      }))
    })

    it('should emit reconnect-window on disconnect', () => {
      const mockClient = { id: 'client-1' } as unknown as Socket
      gateway['clientDebates'] = new Map([['client-1', 'debate-1']])

      gateway.handleDisconnect(mockClient)

      expect(mockServer.emit).toHaveBeenCalledWith('reconnect-window', expect.objectContaining({
        debate_id: 'debate-1',
        remaining_ms: 120_000,
      }))
    })

    it('should emit debate-abandoned after reconnect timeout', () => {
      const mockClient = { id: 'client-1' } as unknown as Socket
      gateway['clientDebates'] = new Map([['client-1', 'debate-1']])

      gateway.handleDisconnect(mockClient)

      jest.advanceTimersByTime(120_000)

      expect(mockServer.emit).toHaveBeenCalledWith('debate-abandoned', expect.objectContaining({
        debate_id: 'debate-1',
        reason: 'reconnect_timeout',
      }))
    })

    it('should clean up client tracking after disconnect', () => {
      const mockClient = { id: 'client-1' } as unknown as Socket
      gateway['clientDebates'] = new Map([['client-1', 'debate-1']])
      gateway['clientHeartbeats'] = new Map([['client-1', Date.now()]])

      gateway.handleDisconnect(mockClient)

      expect(gateway['clientDebates'].has('client-1')).toBe(false)
      expect(gateway['clientHeartbeats'].has('client-1')).toBe(false)
    })

    it('should do nothing if client was not in a debate', () => {
      const mockClient = { id: 'client-unknown' } as unknown as Socket

      gateway.handleDisconnect(mockClient)

      expect(mockServer.emit).not.toHaveBeenCalled()
    })
  })
})
