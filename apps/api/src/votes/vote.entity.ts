import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm'

@Entity('votes')
@Unique(['debate_id', 'voter_id'])
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  debate_id: string

  @Column()
  voter_id: string

  @Column({ type: 'varchar', length: 20 })
  vote_type: 'creator' | 'opponent'

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  logic_score: number | null

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  evidence_score: number | null

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  delivery_score: number | null

  @CreateDateColumn()
  created_at: Date
}
