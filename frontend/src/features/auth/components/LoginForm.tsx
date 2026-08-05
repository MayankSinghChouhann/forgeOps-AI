import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion } from "framer-motion"
import { AlertCircle } from "lucide-react"
import { Link } from "react-router-dom"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useAuth } from "@/features/auth/hooks/useAuth"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
})

type LoginFormValues = z.infer<typeof loginSchema>

/**
 * LoginForm — handles user authentication against the Spring Boot backend.
 *
 * On submit, calls useAuth().login() which:
 * 1. POSTs to /api/auth/login
 * 2. Saves tokens + email to localStorage
 * 3. Updates global auth state
 * 4. Navigates to /dashboard/overview
 *
 * Backend errors (wrong credentials, network issues) are caught and
 * displayed inline under the form fields.
 */
export function LoginForm() {
  const { login } = useAuth()
  const [serverError, setServerError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null)
    try {
      await login({ email: data.email, password: data.password })
      // Navigation is handled inside useAuth().login() → navigate('/dashboard/overview')
    } catch (err: unknown) {
      // Extract the backend error message if available, or show a generic fallback
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } }
        setServerError(axiosError.response?.data?.message || "Invalid email or password.")
      } else {
        setServerError("Unable to connect to server. Please try again.")
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="border-border/50 shadow-2xl shadow-brand-blue/5">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-semibold tracking-tight">Authenticate</CardTitle>
          <CardDescription className="text-sm">
            Enter your credentials to access the deployment environment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Server-side error banner */}
            {serverError && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-status-failed/10 border border-status-failed/30 text-status-failed text-sm">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider font-semibold" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="engineer@forgeops.ai"
                className="bg-page border-border/50 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-status-failed mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider font-semibold" htmlFor="password">
                  Password
                </label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="bg-page border-border/50 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-status-failed mt-1 font-medium">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
              {isSubmitting ? "Authenticating..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t border-border/50 mt-2 pt-5 pb-5 bg-elevated/50">
          <p className="text-xs text-text-muted font-medium">
            Don't have an account?{" "}
            <Link to="/register" className="text-text-primary hover:text-brand-cyan transition-colors">
              Request Access
            </Link>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
