import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  email: string

  @Column({ nullable: true })
  password_hash: string | null

  @Column()
  display_name: string

  @Column({ nullable: true })
  avatar_url: string | null

  @Column({ type: 'int', default: null, nullable: true })
  elo_score: number | null

  @Column({ default: false })
  verified: boolean

  @Column({ type: 'varchar', length: 20 })
  auth_provider: 'google' | 'email'

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
