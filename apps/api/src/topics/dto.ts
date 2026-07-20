import { IsString, MinLength, MaxLength } from 'class-validator'

export class CreateTopicDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description: string

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  category: string
}

export class CreateSubtopicDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string
}
