import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('guest_sessions')
export class GuestSession {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  session_token: string

  @Column()
  debate_id: string

  @Column({ type: 'varchar', length: 20 })
  participant_role: 'creator' | 'opponent'

  @Column()
  expires_at: Date

  @CreateDateColumn()
  created_at: Date
}
