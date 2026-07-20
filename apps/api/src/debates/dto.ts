import { IsOptional, IsIn, IsUUID } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateDebateDto {
  @ApiProperty({ description: 'Topic UUID' })
  @IsUUID()
  topic_id: string

  @ApiPropertyOptional({ enum: ['creator', 'opponent'], description: 'Participant role' })
  @IsOptional()
  @IsIn(['creator', 'opponent'])
  participant_role?: 'creator' | 'opponent'
}
