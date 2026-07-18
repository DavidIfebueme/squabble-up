import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('topics')
export class Topic {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  title: string

  @Column({ type: 'text' })
  description: string

  @Column()
  category: string

  @Column({ nullable: true })
  created_by: string | null

  @Column({ default: 0 })
  debate_count: number

  @CreateDateColumn()
  created_at: Date
}
