import 'dotenv/config'
import { Pool } from 'pg'
import { v4 as uuid } from 'uuid'

const TOPICS = [
  { title: 'Social Media Should Require ID Verification', category: 'Technology' },
  { title: 'Universal Basic Income Is the Future of Work', category: 'Economics' },
  { title: 'College Athletes Should Be Paid', category: 'Sports' },
  { title: 'The Electoral College Should Be Abolished', category: 'Politics' },
  { title: 'AI Art Is Not Real Art', category: 'Technology' },
  { title: 'School Should Start Later for Teenagers', category: 'Education' },
  { title: 'Remote Work Is Better Than Office Work', category: 'Business' },
  { title: 'Censorship on Social Media Does More Harm Than Good', category: 'Technology' },
  { title: 'Veganism Is the Only Ethical Diet', category: 'Lifestyle' },
  { title: 'Pit Bulls Should Not Be Banned', category: 'Lifestyle' },
  { title: 'The Death Penalty Should Be Abolished Worldwide', category: 'Politics' },
  { title: 'Homework Should Be Banned in Schools', category: 'Education' },
  { title: 'Space Exploration Is a Waste of Money', category: 'Science' },
  { title: 'Professional Athletes Are Overpaid', category: 'Sports' },
  { title: 'Zoos Should Be Phased Out', category: 'Lifestyle' },
  { title: 'Genetically Modified Food Is Safe and Necessary', category: 'Science' },
  { title: 'The Four-Day Work Week Should Be Standard', category: 'Business' },
  { title: 'Voting Should Be Mandatory', category: 'Politics' },
  { title: 'Single-Use Plastics Should Be Banned Globally', category: 'Environment' },
  { title: 'Nuclear Energy Is the Key to Fighting Climate Change', category: 'Environment' },
  { title: 'The Minimum Wage Should Be a Living Wage', category: 'Economics' },
  { title: 'Streaming Services Are Worse Than Traditional TV', category: 'Entertainment' },
  { title: 'Social Media Makes Us More Lonely', category: 'Technology' },
  { title: 'Year-Round School Is Better Than Summer Break', category: 'Education' },
  { title: 'Animal Testing Should Be Banned Completely', category: 'Science' },
  { title: 'Term Limits Should Be Imposed on Supreme Court Justices', category: 'Politics' },
  { title: 'The Internet Should Be a Public Utility', category: 'Technology' },
  { title: 'Beauty Standards Do More Harm Than Good', category: 'Lifestyle' },
  { title: 'College Should Be Free for Everyone', category: 'Education' },
  { title: 'Video Games Are a Form of Art', category: 'Entertainment' },
]

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  let created = 0
  let skipped = 0

  for (const t of TOPICS) {
    const slug = generateSlug(t.title)
    const existing = await pool.query('SELECT id FROM topics WHERE slug = $1', [slug])
    if (existing.rows.length > 0) {
      skipped++
      continue
    }
    await pool.query(
      `INSERT INTO topics (id, title, slug, description, category, debate_count, created_at)
       VALUES ($1, $2, $3, $4, $5, 0, NOW())`,
      [
        uuid(),
        t.title,
        slug,
        `A debate topic about ${t.category.toLowerCase()}: "${t.title}". Share your arguments and vote on the best points.`,
        t.category,
      ],
    )
    created++
  }

  console.log(`Seeded ${created} topics (${skipped} skipped — already exist)`)
  await pool.end()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
