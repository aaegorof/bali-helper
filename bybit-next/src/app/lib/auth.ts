import { z } from 'zod'
import { db } from './db'
import { createSession } from './session'

export const SignupFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
})

export type FormState = {
  errors?: {
    email?: string[]
    general?: string[]
  }
  success?: boolean
} | undefined

export async function signup(state: FormState, formData: FormData) {
  const validatedFields = SignupFormSchema.safeParse({
    email: formData.get('email'),
  })
 
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email } = validatedFields.data

  try {
    // Check if user exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err)
        resolve(row)
      })
    })

    if (existingUser) {
      return {
        errors: {
          email: ['User with this email already exists'],
        },
      }
    }

    // Create new user
    const result: any = await new Promise((resolve, reject) => {
      db.run('INSERT INTO users (email) VALUES (?)', [email], function(err) {
        if (err) reject(err)
        resolve({ id: this.lastID })
      })
    })

    // Create session
    await createSession(result.id)

    return { success: true }
  } catch (error) {
    console.error('Signup error:', error)
    return {
      errors: {
        general: ['An error occurred during signup'],
      },
    }
  }
}

export async function login(state: FormState, formData: FormData) {
  const validatedFields = SignupFormSchema.safeParse({
    email: formData.get('email'),
  })
 
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email } = validatedFields.data

  try {
    // Find user
    const user: any = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err)
        resolve(row)
      })
    })

    if (!user) {
      return {
        errors: {
          email: ['User not found'],
        },
      }
    }

    // Create session
    await createSession(user.id)

    return { success: true }
  } catch (error) {
    console.error('Login error:', error)
    return {
      errors: {
        general: ['An error occurred during login'],
      },
    }
  }
}