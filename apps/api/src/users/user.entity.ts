import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id: string

  @Column({ unique: true })
  email: string

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
