import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator'

export class RegisterDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  display_name: string
}

export class LoginDto {
  @IsEmail()
  email: string

  @IsString()
  password: string
}

export class GoogleAuthDto {
  @IsString()
  sub: string

  @IsEmail()
  email: string

  @IsString()
  @MaxLength(100)
  name: string

  @IsString()
  @MaxLength(500)
  picture: string
}
