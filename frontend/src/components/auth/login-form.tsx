import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export function LoginForm({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      onLogin(email.toLowerCase().trim())
    }
  }

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Войти</CardTitle>
        <CardDescription>
          Введите email для входа в систему
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit">Войти</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 