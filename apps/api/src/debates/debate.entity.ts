import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('debates')
export class Debate {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  topic_id: string

  @Column({ nullable: true })
  creator_id: string | null

  @Column({ nullable: true })
  opponent_id: string | null

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'active' | 'completed' | 'abandoned' | 'scoring_failed'

  @Column({ nullable: true })
  winner_id: string | null

  @CreateDateColumn()
  created_at: Date

  @Column({ nullable: true })
  completed_at: Date | null

  @Column({ type: 'jsonb', nullable: true })
  ai_scores: {
    creator: { logic: number; persuasiveness: number; evidence: number; delivery: number }
    opponent: { logic: number; persuasiveness: number; evidence: number; delivery: number }
    reasoning: string
  } | null
}
