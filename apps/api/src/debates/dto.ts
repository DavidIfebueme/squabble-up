import { IsString, IsOptional, IsIn } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateDebateDto {
  @ApiProperty({ description: 'Topic UUID' })
  @IsString()
  topic_id: string

  @ApiPropertyOptional({ enum: ['creator', 'opponent'], description: 'Participant role' })
  @IsOptional()
  @IsIn(['creator', 'opponent'])
  participant_role?: 'creator' | 'opponent'
}
