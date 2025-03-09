"use client"

import { Session } from "next-auth"
import { signOut } from "next-auth/react"
import { Button } from "./ui/button"

export function UserSwitcher({ session }: { session: Session | null }) {
  if (!session?.user?.email) return null

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{session.user.email}</span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        Выйти
      </Button>
    </div>
  )
} 