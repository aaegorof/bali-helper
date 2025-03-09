"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { setTheme, theme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <Button
      size="icon"
      variant="outline"
      onClick={toggleTheme}
      className="relative"
    >
      <Sun 
        className={`h-[1.2rem] w-[1.2rem] transition-all duration-300 ease-in-out
          ${theme === 'dark' ? 'rotate-[-180deg] opacity-0' : 'rotate-0 opacity-100'}`}
      />
      <Moon 
        className={`absolute top-1/2 left-1/2 h-[1.2rem] w-[1.2rem] -translate-x-1/2 -translate-y-1/2 
          transition-all duration-300 ease-in-out
          ${theme === 'dark' ? 'rotate-0 opacity-100' : 'rotate-180 opacity-0'}`}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
} 