import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { AlertCircle } from "lucide-react"
import { Link } from "react-router-dom"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useAuth } from "@/features/auth/hooks/useAuth"

const loginSchema = z.object({ email: z.string().email("Please enter a valid email address."), password: z.string().min(6, "Password must be at least 6 characters.") })
type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const { login } = useAuth()
  const [serverError, setServerError] = React.useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null)
    try { await login({ email: data.email, password: data.password }) }
    catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { data?: { message?: string } } }
        setServerError(axiosError.response?.data?.message || "Invalid email or password.")
      } else setServerError("Unable to connect to server. Please try again.")
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4"><CardTitle className="text-2xl">Sign in to ForgeOps</CardTitle><CardDescription>Use your workspace credentials to continue.</CardDescription></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {serverError && <div role="alert" className="flex items-start gap-2 rounded-md border border-status-failed/30 bg-status-failed/10 p-3 text-sm text-status-failed"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{serverError}</div>}
          <div className="space-y-1.5"><label className="text-sm font-medium text-text-secondary" htmlFor="email">Email</label><Input id="email" type="email" autoComplete="email" placeholder="engineer@company.com" aria-invalid={Boolean(errors.email)} {...register("email")} />{errors.email && <p className="text-xs text-status-failed">{errors.email.message}</p>}</div>
          <div className="space-y-1.5"><label className="text-sm font-medium text-text-secondary" htmlFor="password">Password</label><Input id="password" type="password" autoComplete="current-password" placeholder="Enter your password" aria-invalid={Boolean(errors.password)} {...register("password")} />{errors.password && <p className="text-xs text-status-failed">{errors.password.message}</p>}</div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Signing in…" : "Sign in"}</Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center border-t border-border pt-5"><p className="text-sm text-text-muted">New to ForgeOps? <Link to="/register" className="font-medium text-accent hover:text-accent-hover">Request access</Link></p></CardFooter>
    </Card>
  )
}
