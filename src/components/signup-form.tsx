'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-client'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function SignupForm() {
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const router = useRouter()
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const roleRef = useRef<HTMLSelectElement>(null)
  const passwordRules = {
  length: password.length >= 8,
  uppercase: /[A-Z]/.test(password),
  number: /[0-9]/.test(password),
}

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    if (!passwordRules.length || !passwordRules.uppercase || !passwordRules.number) {
      toast.error('Invalid password', {
        description: 'Please meet all password requirements',
      })
      setLoading(false)
      return
    }
    const result = await authClient.signUp.email({
      name: nameRef.current!.value,
      email: emailRef.current!.value,
      password: passwordRef.current!.value,
      role: roleRef.current!.value,
    })

    if (result.error) {
      toast.error('Signup failed', {
        description: result.error.message,
      })
      setLoading(false)
      return
    }

    toast.success('Account created!')
    router.push('/dashboard')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Create Account</CardTitle>
        <CardDescription>
          Enter your information to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              ref={nameRef}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="role">Tipo de Conta</Label>
            <select
              id="role"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-background [&>option]:text-foreground"
              ref={roleRef}
              required
            >
              <option value="estudante">Estudante</option>
              <option value="investidor">Investidor</option>
            </select>
          </div>

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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <ul className="text-sm space-y-1">
            <li className={passwordRules.length ? 'text-green-500' : 'text-red-500'}>
              At least 8 characters
            </li>
            <li className={passwordRules.uppercase ? 'text-green-500' : 'text-red-500'}>
              At least one uppercase letter
            </li>
            <li className={passwordRules.number ? 'text-green-500' : 'text-red-500'}>
              At least one number
            </li>
          </ul>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <a href="/sign-in" className="underline text-foreground">
              Sign in
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
