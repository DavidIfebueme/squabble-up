import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)

  constructor(private readonly config: ConfigService) {}

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const apiKey = this.config.get<string>('BREVO_API_KEY')
    const senderEmail = this.config.get<string>('BREVO_SENDER_EMAIL')
    const baseUrl = this.config.get<string>('APP_URL', 'http://localhost:3000')

    if (!apiKey || !senderEmail) {
      this.logger.warn('Brevo not configured — skipping verification email')
      return
    }

    const verifyUrl = `${baseUrl}/api/v1/auth/verify-email/${token}`

    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { email: senderEmail, name: 'Squabble Up' },
          to: [{ email: to }],
          subject: 'Verify your email - Squabble Up',
          htmlContent: `
            <h1>Welcome to Squabble Up!</h1>
            <p>Click the link below to verify your email address:</p>
            <a href="${verifyUrl}">Verify Email</a>
            <p>This link expires in 24 hours.</p>
          `,
        }),
      })

      if (!res.ok) {
        this.logger.error(`Brevo API returned ${res.status}: ${res.statusText}`)
      }
    } catch (err) {
      this.logger.error('Failed to send verification email', err)
    }
  }
}
