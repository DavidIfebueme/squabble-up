import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('rounds')
export class Round {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  debate_id: string

  @Column({ type: 'smallint' })
  round_number: number

  @Column()
  speaker_id: string

  @Column({ nullable: true })
  audio_url: string | null

  @Column({ type: 'text', nullable: true })
  transcription: string | null

  @Column({ type: 'int', nullable: true })
  duration: number | null

  @CreateDateColumn()
  created_at: Date
}
