import { AuthLayout } from "@/features/auth/components/AuthLayout"
import { LoginForm } from "@/features/auth/components/LoginForm"

export function LoginPage() {
  return (
    <AuthLayout 
      title="ForgeOps AI" 
      subtitle="Sign in to access your intelligence platform"
    >
      <LoginForm />
    </AuthLayout>
  )
}
