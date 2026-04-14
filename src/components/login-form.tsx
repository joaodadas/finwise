'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-client'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await authClient.signIn.email({
      email: emailRef.current!.value,
      password: passwordRef.current!.value,
    })

    if (result.error) {
      toast.error('Login failed', {
        description: result.error.message,
      })
      setLoading(false)
      return
    }

    toast.success('Logged in successfully!')
    router.push('/dashboard')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              ref={emailRef}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              ref={passwordRef}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{' '}
            <a href="/sign-up" className="underline text-foreground">
              Sign up
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
