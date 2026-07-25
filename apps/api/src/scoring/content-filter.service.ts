import { Injectable } from '@nestjs/common'

const HATE_SPEECH_PATTERNS = [
  /\b(hate|kill|die)\s+(all|every|those)\s+\w+\b/i,
  /\b(slay|murder|exterminate)\s+\w+/i,
  /\byou\s+(should|must|need to)\s+(die|kill|delete yourself)\b/i,
]

const PROFANITY_KEYWORDS = [
  'fuck', 'shit', 'asshole', 'bastard', 'bitch',
  'cunt', 'dick', 'piss', 'slut', 'whore',
]

const THREAT_PATTERNS = [
  /\bi\s+(will|'ll|shall)\s+(kill|hurt|destroy|end)\s+(you|your)/i,
  /\byou(?:'re| are)\s+(dead|finished|toast)\b/i,
]

@Injectable()
export class ContentFilterService {
  filter(content: string): { flagged: boolean; reasons: string[] } {
    if (!content || !content.trim()) {
      return { flagged: false, reasons: [] }
    }

    const reasons: string[] = []

    for (const pattern of HATE_SPEECH_PATTERNS) {
      if (pattern.test(content)) {
        reasons.push('Hate speech detected')
        break
      }
    }

    for (const keyword of PROFANITY_KEYWORDS) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i')
      if (regex.test(content)) {
        reasons.push('Profanity detected')
        break
      }
    }

    for (const pattern of THREAT_PATTERNS) {
      if (pattern.test(content)) {
        reasons.push('Threat detected')
        break
      }
    }

    return { flagged: reasons.length > 0, reasons }
  }
}
