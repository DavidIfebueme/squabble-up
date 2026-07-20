import { IsUUID, IsInt, Min, Max, IsOptional, IsString } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { DEBATE_ROUNDS } from '@squabble-up/shared'

export class CreateRoundDto {
  @ApiProperty({ description: 'Debate UUID' })
  @IsUUID()
  debate_id: string

  @ApiProperty({ description: 'Round number (1-3)', minimum: 1, maximum: DEBATE_ROUNDS })
  @IsInt()
  @Min(1)
  @Max(DEBATE_ROUNDS)
  round_number: number
}

export class UpdateRoundDto {
  @ApiPropertyOptional({ description: 'Transcription text' })
  @IsOptional()
  @IsString()
  transcription?: string

  @ApiPropertyOptional({ description: 'Duration in seconds' })
  @IsOptional()
  @IsInt()
  duration?: number
}
