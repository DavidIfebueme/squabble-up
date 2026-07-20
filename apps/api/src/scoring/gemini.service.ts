import { Injectable, BadRequestException } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

const SCORING_PROMPT = `You are a debate judge. Score this debate on a 0-100 scale for each category.

Debate Topic: {{topic}}

Round 1 - Opening (Creator):
{{creator_round_1}}

Round 1 - Opening (Opponent):
{{opponent_round_1}}

Round 2 - Rebuttal (Creator):
{{creator_round_2}}

Round 2 - Rebuttal (Opponent):
{{opponent_round_2}}

Round 3 - Closing (Creator):
{{creator_round_3}}

Round 3 - Closing (Opponent):
{{opponent_round_3}}

Score each side on these criteria (0-100):
- logic: Logical reasoning, argument structure, validity of claims
- persuasiveness: Ability to convince, rhetorical skill, emotional appeal
- evidence: Use of facts, examples, data to support arguments
- delivery: Clarity, coherence, organization of speech

Return ONLY valid JSON with this exact structure:
{
  "creator": {
    "logic": <number>,
    "persuasiveness": <number>,
    "evidence": <number>,
    "delivery": <number>
  },
  "opponent": {
    "logic": <number>,
    "persuasiveness": <number>,
    "evidence": <number>,
    "delivery": <number>
  },
  "reasoning": "<2-3 sentence summary of why the winner won>"
}`

export interface ScoringResult {
  creator: { logic: number; persuasiveness: number; evidence: number; delivery: number }
  opponent: { logic: number; persuasiveness: number; evidence: number; delivery: number }
  reasoning: string
}

@Injectable()
export class GeminiService {
  constructor(private readonly httpService: HttpService) {}

  async scoreDebate(
    topic: string,
    transcripts: { round_number: number; speaker_id: string; transcription: string }[],
  ): Promise<ScoringResult> {
    if (!transcripts || transcripts.length < 6) {
      throw new BadRequestException('All 6 round transcripts are required for scoring')
    }

    const prompt = this.buildPrompt(topic, transcripts)
    const response = await this.callGemini(prompt)
    return this.parseResponse(response)
  }

  private buildPrompt(
    topic: string,
    transcripts: { round_number: number; speaker_id: string; transcription: string }[],
  ): string {
    const rounds: Record<string, string> = {}
    for (const t of transcripts) {
      const side = t.speaker_id
      const key = `round_${t.round_number}`
      rounds[`${side}_${key}`] = t.transcription || '[No transcription available]'
    }

    return SCORING_PROMPT
      .replace('{{topic}}', topic)
      .replace('{{creator_round_1}}', rounds['creator_round_1'] || '[Not provided]')
      .replace('{{opponent_round_1}}', rounds['opponent_round_1'] || '[Not provided]')
      .replace('{{creator_round_2}}', rounds['creator_round_2'] || '[Not provided]')
      .replace('{{opponent_round_2}}', rounds['opponent_round_2'] || '[Not provided]')
      .replace('{{creator_round_3}}', rounds['creator_round_3'] || '[Not provided]')
      .replace('{{opponent_round_3}}', rounds['opponent_round_3'] || '[Not provided]')
  }

  private async callGemini(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new BadRequestException('GEMINI_API_KEY not configured')
    }

    const { data } = await firstValueFrom(
      this.httpService.post(
        `${GEMINI_API_URL}?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          },
        },
        { timeout: 30000 },
      ),
    )

    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }

  private parseResponse(response: string): ScoringResult {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found in response')

      const parsed = JSON.parse(jsonMatch[0])

      const normalize = (val: unknown): number => {
        const n = Number(val)
        if (isNaN(n)) return 50
        return Math.max(0, Math.min(100, Math.round(n)))
      }

      return {
        creator: {
          logic: normalize(parsed.creator?.logic),
          persuasiveness: normalize(parsed.creator?.persuasiveness),
          evidence: normalize(parsed.creator?.evidence),
          delivery: normalize(parsed.creator?.delivery),
        },
        opponent: {
          logic: normalize(parsed.opponent?.logic),
          persuasiveness: normalize(parsed.opponent?.persuasiveness),
          evidence: normalize(parsed.opponent?.evidence),
          delivery: normalize(parsed.opponent?.delivery),
        },
        reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
      }
    } catch {
      return {
        creator: { logic: 50, persuasiveness: 50, evidence: 50, delivery: 50 },
        opponent: { logic: 50, persuasiveness: 50, evidence: 50, delivery: 50 },
        reasoning: 'Scoring completed but detailed reasoning was unavailable.',
      }
    }
  }
}
