import { z } from 'zod'

export const createDebateSchema = z.object({
  topic_id: z.string().uuid(),
  participant_role: z.enum(['creator', 'opponent']).optional(),
})

export const submitVoteSchema = z.object({
  debate_id: z.string().uuid(),
  vote_type: z.enum(['creator', 'opponent']),
  logic_score: z.number().min(0).max(10),
  evidence_score: z.number().min(0).max(10),
  delivery_score: z.number().min(0).max(10),
})

export const createTopicSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  category: z.string().min(1).max(100),
})

export const createCommentSchema = z.object({
  debate_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
})

export const joinDebateSchema = z.object({
  debate_id: z.string().uuid(),
})

export const uploadRoundSchema = z.object({
  debate_id: z.string().uuid(),
  round_number: z.number().int().min(1).max(3),
})

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  display_name: z.string().min(2).max(50),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
