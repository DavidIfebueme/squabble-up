import { Test, TestingModule } from '@nestjs/testing'
import { RealtimeGateway } from './realtime.gateway'
import { Server, Socket } from 'socket.io'

describe('RealtimeGateway', () => {
  let gateway: RealtimeGateway
  let mockServer: Partial<Server>

  beforeEach(async () => {
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
  })

  describe('handleDisconnect', () => {
    it('should emit opponent-disconnected when a participant disconnects', () => {
      const mockClient = { id: 'client-1' } as unknown as Socket
      jest.spyOn(mockClient, 'id' as any).mockReturnValue('client-1')

      gateway['clientDebates'] = new Map([['client-1', 'debate-1']])

      gateway.handleDisconnect(mockClient)

      expect(mockServer.to).toHaveBeenCalledWith('debate:debate-1')
      expect(mockServer.emit).toHaveBeenCalledWith('opponent-disconnected', expect.objectContaining({
        debate_id: 'debate-1',
      }))
    })
  })
})
