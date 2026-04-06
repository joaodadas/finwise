import { LoginForm } from '@/components/login-form'

export default function SignInPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  )
}
