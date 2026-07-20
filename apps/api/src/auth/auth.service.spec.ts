import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { JwtService } from '@nestjs/jwt'
import { ConflictException, UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { AuthService } from './auth.service'
import { User } from '../users/user.entity'
import { EmailService } from '../email/email.service'
import { RedisService } from '../redis/redis.service'
import { Repository, UpdateResult } from 'typeorm'

jest.mock('bcrypt')

describe('AuthService', () => {
  let service: AuthService
  let userRepo: jest.Mocked<Repository<User>>
  let jwtService: jest.Mocked<JwtService>
  let emailService: jest.Mocked<EmailService>
  let redisService: jest.Mocked<RedisService>

  const mockUser: User = {
    id: 'test-uuid-123',
    email: 'test@example.com',
    display_name: 'Test User',
    avatar_url: null,
    elo_score: null,
    verified: false,
    auth_provider: 'email',
    created_at: new Date(),
    updated_at: new Date(),
    password_hash: 'hashed-password',
  }

  const mockGoogleUser: User = {
    id: 'google-uid-456',
    email: 'test@example.com',
    display_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
    elo_score: null,
    verified: true,
    auth_provider: 'google',
    created_at: new Date(),
    updated_at: new Date(),
    password_hash: null,
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendVerificationEmail: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            set: jest.fn(),
            get: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get(AuthService)
    userRepo = module.get(getRepositoryToken(User))
    jwtService = module.get(JwtService)
    emailService = module.get(EmailService)
    redisService = module.get(RedisService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('register', () => {
    it('creates user with hashed password and auth_provider=email', async () => {
      userRepo.findOne.mockResolvedValue(null)
      userRepo.create.mockReturnValue(mockUser)
      userRepo.save.mockResolvedValue(mockUser)
      jwtService.sign.mockReturnValue('mock-token')
      emailService.sendVerificationEmail.mockResolvedValue()

      const result = await service.register('test@example.com', 'password123', 'Test User')

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          display_name: 'Test User',
          auth_provider: 'email',
          verified: false,
        })
      )
      expect(result.user).not.toHaveProperty('password_hash')
      expect(result.user.auth_provider).toBe('email')
      expect(result.user.verified).toBe(false)
    })

    it('throws ConflictException if email already exists', async () => {
      userRepo.findOne.mockResolvedValue(mockUser)

      await expect(
        service.register('test@example.com', 'password123', 'Test User')
      ).rejects.toThrow(ConflictException)
    })

    it('sends verification email via brevo', async () => {
      userRepo.findOne.mockResolvedValue(null)
      userRepo.create.mockReturnValue(mockUser)
      userRepo.save.mockResolvedValue(mockUser)
      jwtService.sign.mockReturnValue('verify-token')
      emailService.sendVerificationEmail.mockResolvedValue()

      await service.register('test@example.com', 'password123', 'Test User')

      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        'verify-token'
      )
    })

    it('generates JWT verification token with 24h expiry', async () => {
      userRepo.findOne.mockResolvedValue(null)
      userRepo.create.mockReturnValue(mockUser)
      userRepo.save.mockResolvedValue(mockUser)
      jwtService.sign.mockReturnValue('verify-token')
      emailService.sendVerificationEmail.mockResolvedValue()

      await service.register('test@example.com', 'password123', 'Test User')

      expect(jwtService.sign).toHaveBeenCalledWith(
        { uid: mockUser.id, purpose: 'email_verification' },
        { expiresIn: '24h' }
      )
    })

    it('never returns password_hash in response', async () => {
      userRepo.findOne.mockResolvedValue(null)
      userRepo.create.mockReturnValue(mockUser)
      userRepo.save.mockResolvedValue(mockUser)
      jwtService.sign.mockReturnValue('verify-token')
      emailService.sendVerificationEmail.mockResolvedValue()

      const result = await service.register('test@example.com', 'password123', 'Test User')

      expect(result.user).not.toHaveProperty('password_hash')
    })

    it('still returns user even if email service fails', async () => {
      userRepo.findOne.mockResolvedValue(null)
      userRepo.create.mockReturnValue(mockUser)
      userRepo.save.mockResolvedValue(mockUser)
      jwtService.sign.mockReturnValue('verify-token')
      emailService.sendVerificationEmail.mockRejectedValue(new Error('SMTP down'))

      const result = await service.register('test@example.com', 'password123', 'Test User')

      expect(result.user.email).toBe('test@example.com')
    })
  })

  describe('login', () => {
    it('returns access token + user with valid email/password', async () => {
      userRepo.findOne.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      jwtService.sign.mockReturnValue('access-token')

      const result = await service.login('test@example.com', 'password123')

      expect(result.access_token).toBe('access-token')
      expect(result.user.email).toBe('test@example.com')
    })

    it('throws UnauthorizedException with invalid password', async () => {
      userRepo.findOne.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await expect(
        service.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow(UnauthorizedException)
    })

    it('throws UnauthorizedException with non-existent email', async () => {
      userRepo.findOne.mockResolvedValue(null)

      await expect(
        service.login('nonexistent@example.com', 'password123')
      ).rejects.toThrow(UnauthorizedException)
    })

    it('succeeds with unverified email (unverified can browse)', async () => {
      const unverifiedUser = { ...mockUser, verified: false }
      userRepo.findOne.mockResolvedValue(unverifiedUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      jwtService.sign.mockReturnValue('access-token')

      const result = await service.login('test@example.com', 'password123')

      expect(result.access_token).toBe('access-token')
    })

    it('throws if google auth_provider tries email login', async () => {
      userRepo.findOne.mockResolvedValue(mockGoogleUser)

      await expect(
        service.login('test@example.com', 'password123')
      ).rejects.toThrow('Use social login for this account')
    })
  })

  describe('googleAuth', () => {
    it('creates new user with auth_provider=google and verified=true', async () => {
      userRepo.findOne.mockResolvedValue(null)
      userRepo.create.mockReturnValue(mockGoogleUser)
      userRepo.save.mockResolvedValue(mockGoogleUser)
      jwtService.sign.mockReturnValue('google-token')

      const result = await service.googleAuth({
        sub: 'google-uid-456',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
      })

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          auth_provider: 'google',
          verified: true,
        })
      )
      expect(result.user.verified).toBe(true)
    })

    it('returns existing google user with tokens', async () => {
      userRepo.findOne.mockResolvedValue(mockGoogleUser)
      jwtService.sign.mockReturnValue('google-token')

      const result = await service.googleAuth({
        sub: 'google-uid-456',
        email: 'test@example.com',
      })

      expect(result.user.auth_provider).toBe('google')
    })

    it('merges email user to google on first google login', async () => {
      userRepo.findOne.mockResolvedValue(mockUser)
      userRepo.save.mockResolvedValue({ ...mockUser, auth_provider: 'google', verified: true })
      jwtService.sign.mockReturnValue('merged-token')

      const result = await service.googleAuth({
        sub: 'google-uid-456',
        email: 'test@example.com',
        name: 'Test User',
      })

      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          auth_provider: 'google',
          verified: true,
        })
      )
      expect(result.user.verified).toBe(true)
    })

    it('never sends verification email for google users', async () => {
      userRepo.findOne.mockResolvedValue(null)
      userRepo.create.mockReturnValue(mockGoogleUser)
      userRepo.save.mockResolvedValue(mockGoogleUser)
      jwtService.sign.mockReturnValue('google-token')

      await service.googleAuth({
        sub: 'google-uid-456',
        email: 'test@example.com',
      })

      expect(emailService.sendVerificationEmail).not.toHaveBeenCalled()
    })
  })

  describe('refresh', () => {
    it('returns new access token with valid refresh token', async () => {
      redisService.get.mockResolvedValue('user-id-123')
      jwtService.verify.mockReturnValue({ sub: 'user-id-123', email: 'test@example.com' })
      jwtService.sign.mockReturnValue('new-access-token')

      const result = await service.refresh('valid-refresh-token')

      expect(result.access_token).toBe('new-access-token')
    })

    it('throws UnauthorizedException with expired refresh token', async () => {
      redisService.get.mockResolvedValue(null)

      await expect(service.refresh('expired-token')).rejects.toThrow(UnauthorizedException)
    })

    it('throws UnauthorizedException with non-existent refresh token', async () => {
      redisService.get.mockResolvedValue(null)

      await expect(service.refresh('nonexistent-token')).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('logout', () => {
    it('clears refresh token from redis', async () => {
      redisService.get.mockResolvedValue('some-refresh-token')
      redisService.del.mockResolvedValue()

      await service.logout('user-id-123')

      expect(redisService.del).toHaveBeenCalledWith('refresh_token:some-refresh-token')
      expect(redisService.del).toHaveBeenCalledWith('user_refresh:user-id-123')
    })
  })

  describe('verifyEmail', () => {
    it('marks user as verified with valid token', async () => {
      jwtService.verify.mockReturnValue({ uid: 'user-id-123', purpose: 'email_verification' })
      userRepo.update.mockResolvedValue({ affected: 1 } as UpdateResult)

      const result = await service.verifyEmail('valid-token')

      expect(userRepo.update).toHaveBeenCalledWith(
        { id: 'user-id-123' },
        { verified: true }
      )
      expect(result.verified).toBe(true)
    })

    it('throws UnauthorizedException with expired token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired')
      })

      await expect(service.verifyEmail('expired-token')).rejects.toThrow(UnauthorizedException)
    })

    it('throws UnauthorizedException with invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid signature')
      })

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(UnauthorizedException)
    })

    it('throws UnauthorizedException with wrong purpose token', async () => {
      jwtService.verify.mockReturnValue({ uid: 'user-id-123', purpose: 'wrong_purpose' })

      await expect(service.verifyEmail('wrong-purpose-token')).rejects.toThrow(
        UnauthorizedException
      )
    })

    it('is idempotent for already-verified users', async () => {
      jwtService.verify.mockReturnValue({ uid: 'user-id-123', purpose: 'email_verification' })
      userRepo.update.mockResolvedValue({ affected: 0 } as UpdateResult)

      const result = await service.verifyEmail('valid-token')

      expect(result.verified).toBe(true)
    })
  })

  describe('verification guard logic', () => {
    it('unverified email user is blocked from creating debates', () => {
      const emailUser: User = {
        id: 'test-uuid-123',
        email: 'test@example.com',
        display_name: 'Test User',
        avatar_url: null,
        elo_score: null,
        verified: false,
        auth_provider: 'email',
        created_at: new Date(),
        updated_at: new Date(),
        password_hash: 'hashed-password',
      }

      expect(emailUser.verified).toBe(false)
      expect(emailUser.auth_provider).toBe('email')
    })

    it('google user is always verified from creation', () => {
      expect(mockGoogleUser.verified).toBe(true)
      expect(mockGoogleUser.auth_provider).toBe('google')
    })
  })
})
