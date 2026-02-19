import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import { isTest } from '../env.ts'
import { db } from './lib/db/connection.ts'
import { jobs } from './lib/db/schema.ts'
import { eq } from 'drizzle-orm'
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node'
import { auth } from './lib/auth.ts'
import { requireAuth } from './middleware/auth.ts'


const app = express()
app.all('/api/auth/{*any}', toNodeHandler(auth));
app.use(helmet())
app.use(cors())
app.use(
  morgan('dev', {
    skip: () => isTest(),
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/health', (req, res) => {
  res.json({ message: 'Hello there!' })
})

app.use('/v1', requireAuth)

// TOKEN SAVER: Check if job exists before n8n runs AI
app.get('/v1/jobs/check', async (req, res) => {
  const url = req.query.url as string
  const existing = await db.select().from(jobs).where(eq(jobs.url, url)).limit(1)

  return res.json({ exists: existing.length > 0 })
})

// GET ALL: Retrieve all saved jobs
app.get('/v1/jobs', async (req, res) => {
  try {
    const allJobs = await db.select().from(jobs)
    res.json(allJobs)
  } catch (error) {
    res.status(500).json({ error: 'Database error' })
  }
})

// INSERT: Save analyzed job from n8n
app.post('/v1/jobs', async (req, res) => {
  try {
    await db.insert(jobs)
      .values(req.body)
      .onConflictDoNothing({ target: jobs.url })

    res.status(201).json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Database error' })
  }
})


export default app
