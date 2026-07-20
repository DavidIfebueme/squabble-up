import { IsString, MaxLength } from 'class-validator'

export class CreateTopicDto {
  @IsString()
  @MaxLength(100)
  title: string

  @IsString()
  @MaxLength(500)
  description: string

  @IsString()
  @MaxLength(50)
  category: string
}

export class CreateSubtopicDto {
  @IsString()
  @MaxLength(100)
  name: string
}
