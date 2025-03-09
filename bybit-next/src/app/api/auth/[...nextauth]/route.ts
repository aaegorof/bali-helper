import NextAuth from "next-auth"
import { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/app/lib/db"
import { z } from "zod"

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is not defined')
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email?: string | null
    }
  }
  interface User {
    id: string
    email?: string | null
  }
}

const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null

        const emailSchema = z.string().email()
        const validatedEmail = emailSchema.safeParse(credentials.email)

        if (!validatedEmail.success) return null

        try {
          // Find or create user
          const user: any = await new Promise((resolve, reject) => {
            db.get(
              'SELECT id, email FROM users WHERE email = ?',
              [credentials.email],
              async (err, row) => {
                if (err) reject(err)
                if (row) {
                  resolve(row)
                } else {
                  // Create new user if doesn't exist
                  db.run(
                    'INSERT INTO users (email) VALUES (?)',
                    [credentials.email],
                    function(err) {
                      if (err) reject(err)
                      resolve({ id: this.lastID, email: credentials.email })
                    }
                  )
                }
              }
            )
          })

          return {
            id: String(user.id),
            email: user.email,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: "/login", // Using our custom login page
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      console.log("jwt", token, user, trigger, session)
        
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }