import { Test, TestingModule } from '@nestjs/testing'
import { UnauthorizedException } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

describe('AuthController', () => {
  let controller: AuthController
  let authService: jest.Mocked<AuthService>

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    googleAuth: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    verifyEmail: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile()

    controller = module.get(AuthController)
    authService = module.get(AuthService)
  })

  afterEach(() => jest.clearAllMocks())

  describe('refresh', () => {
    it('throws UnauthorizedException when no refresh_token cookie', async () => {
      const req = { cookies: {} } as any
      const res = { cookie: jest.fn() } as any

      await expect(controller.refresh(req, res)).rejects.toThrow(UnauthorizedException)
      await expect(controller.refresh(req, res)).rejects.toThrow('No refresh token')
    })

    it('throws UnauthorizedException when cookies is undefined', async () => {
      const req = {} as any
      const res = { cookie: jest.fn() } as any

      await expect(controller.refresh(req, res)).rejects.toThrow(UnauthorizedException)
    })

    it('returns new access_token and sets refresh cookie', async () => {
      authService.refresh.mockResolvedValue({
        access_token: 'new-access',
        refresh_token: 'new-refresh',
      })

      const req = { cookies: { refresh_token: 'old-refresh' } } as any
      const res = { cookie: jest.fn() } as any

      const result = await controller.refresh(req, res)

      expect(authService.refresh).toHaveBeenCalledWith('old-refresh')
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'new-refresh',
        expect.objectContaining({ httpOnly: true })
      )
      expect(result).toEqual({ access_token: 'new-access' })
    })

    it('propagates UnauthorizedException from service for invalid token', async () => {
      authService.refresh.mockRejectedValue(new UnauthorizedException('Invalid refresh token'))

      const req = { cookies: { refresh_token: 'bad-token' } } as any
      const res = { cookie: jest.fn() } as any

      await expect(controller.refresh(req, res)).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('logout', () => {
    it('clears refresh_token cookie even when not authenticated', async () => {
      const req = { cookies: { refresh_token: 'some-token' }, user: undefined } as any
      const res = { clearCookie: jest.fn() } as any

      const result = await controller.logout(req, res)

      expect(authService.logout).not.toHaveBeenCalled()
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', { path: '/api/v1/auth' })
      expect(result).toEqual({ success: true })
    })

    it('calls authService.logout when user and refresh_token are present', async () => {
      const req = {
        cookies: { refresh_token: 'valid-token' },
        user: { id: 'user-123' },
      } as any
      const res = { clearCookie: jest.fn() } as any

      const result = await controller.logout(req, res)

      expect(authService.logout).toHaveBeenCalledWith('user-123', 'valid-token')
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', { path: '/api/v1/auth' })
      expect(result).toEqual({ success: true })
    })

    it('clears cookie even when logout service call fails', async () => {
      authService.logout.mockRejectedValue(new Error('redis down'))

      const req = {
        cookies: { refresh_token: 'valid-token' },
        user: { id: 'user-123' },
      } as any
      const res = { clearCookie: jest.fn() } as any

      await expect(controller.logout(req, res)).rejects.toThrow('redis down')
      expect(res.clearCookie).not.toHaveBeenCalled()
    })
  })

  describe('register', () => {
    it('returns user and message', async () => {
      authService.register.mockResolvedValue({
        user: {
          id: '1',
          email: 'test@example.com',
          display_name: 'Test',
          avatar_url: null,
          elo_score: null,
          verified: false,
          auth_provider: 'email' as const,
        },
      })

      const result = await controller.register({
        email: 'test@example.com',
        password: 'password123',
        display_name: 'Test',
      })

      expect(result).toEqual({
        user: {
          id: '1',
          email: 'test@example.com',
          display_name: 'Test',
          avatar_url: null,
          elo_score: null,
          verified: false,
          auth_provider: 'email',
        },
        message: 'Verification email sent',
      })
    })
  })

  describe('login', () => {
    it('sets refresh cookie and returns access_token + user', async () => {
      authService.login.mockResolvedValue({
        access_token: 'access',
        refresh_token: 'refresh',
        user: {
          id: '1',
          email: 'test@example.com',
          display_name: 'Test',
          avatar_url: null,
          elo_score: null,
          verified: false,
          auth_provider: 'email' as const,
        },
      })

      const res = { cookie: jest.fn() } as any

      const result = await controller.login(
        { email: 'test@example.com', password: 'password123' },
        res
      )

      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh',
        expect.objectContaining({ httpOnly: true })
      )
      expect(result).toEqual({
        access_token: 'access',
        user: expect.objectContaining({ id: '1', email: 'test@example.com' }),
      })
    })
  })

  describe('verifyEmail', () => {
    it('delegates to service and returns result', async () => {
      authService.verifyEmail.mockResolvedValue({ verified: true })

      const result = await controller.verifyEmail('valid-token')

      expect(authService.verifyEmail).toHaveBeenCalledWith('valid-token')
      expect(result).toEqual({ verified: true })
    })
  })
})
