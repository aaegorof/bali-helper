import 'server-only'
import { cache } from "react"
 
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { decrypt } from '@/app/lib/session'
import { getDb } from './db'
 
export const verifySession = cache(async () => {
  const cookie = (await cookies()).get('session')?.value
  const session = await decrypt(cookie)
 
  if (!session?.userId) {
    redirect('/login')
  }
 
  return { isAuth: true, userId: session.userId }
})

export const getUser = cache(async () => {
    const session = await verifySession()
    if (!session) return null
   
    try {
      const data = await getDb().all(`SELECT * FROM users WHERE id = ?`, [session.userId])
      console.log('data', data)
      const user = data?.[0] ?? null
      return user
    } catch (error) { 
      console.log('Failed to fetch user')
      return null
    }
  })