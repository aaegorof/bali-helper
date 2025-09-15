import React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"

interface UserSwitcherProps {
  currentUser: string
  recentUsers: string[]
  onSwitch: (email: string) => void
  onLogout: () => void
}

export function UserSwitcher({ currentUser, recentUsers, onSwitch, onLogout }: UserSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex gap-2">
          <User className="h-4 w-4" />
          <span>{currentUser}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {recentUsers.map((email) => (
          <DropdownMenuItem
            key={email}
            onClick={() => onSwitch(email)}
          >
            {email}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          className="text-destructive"
          onClick={onLogout}
        >
          Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 