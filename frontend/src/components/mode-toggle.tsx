import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import React from "react"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <Button
      size="icon"
      variant="hollow"
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
