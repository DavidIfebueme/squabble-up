import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('subtopics')
export class Subtopic {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ unique: true })
  slug: string

  @Column()
  topic_id: string

  @CreateDateColumn()
  created_at: Date
}
