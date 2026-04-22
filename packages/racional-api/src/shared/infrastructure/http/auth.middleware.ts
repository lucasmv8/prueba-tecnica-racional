import { createClient } from '@supabase/supabase-js'
import type { NextFunction, Request, Response } from 'express'

import { prisma } from '../prisma/prisma-client'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

declare module 'express-serve-static-core' {
  interface Request {
    user: { id: string; email: string }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    res.status(401).json({ error: 'Missing authorization token' })
    return
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  // Ensure user row exists in our database (first-time sync with Supabase Auth)
  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      full_name: user.user_metadata?.full_name ?? user.email ?? '',
    },
  })

  req.user = { id: user.id, email: user.email! }
  next()
}
