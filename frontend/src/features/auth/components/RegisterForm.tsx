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

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number."),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
})

type RegisterFormValues = z.infer<typeof registerSchema>

/**
 * RegisterForm — handles new user account creation against the Spring Boot backend.
 *
 * On submit, calls useAuth().register() which:
 * 1. POSTs to /api/auth/register (backend returns plain string on success)
 * 2. Auto-logs in by calling /api/auth/login with the same credentials
 * 3. Saves tokens + email to localStorage
 * 4. Navigates to /dashboard/overview
 *
 * Backend errors (email already taken, validation failures) are caught and
 * displayed inline above the form fields.
 */
export function RegisterForm() {
  const { register: registerAuth } = useAuth()
  const [serverError, setServerError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null)
    try {
      await registerAuth({ email: data.email, password: data.password })
      // Navigation is handled inside useAuth().register() → login() → navigate()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: string | { message?: string } } }
        const responseData = axiosError.response?.data
        if (typeof responseData === 'string') {
          setServerError(responseData)
        } else {
          setServerError(responseData?.message || "Registration failed. Please try again.")
        }
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
          <CardTitle className="text-2xl font-semibold tracking-tight">Request Access</CardTitle>
          <CardDescription className="text-sm">
            Create your account to get started with ForgeOps.
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
              <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider font-semibold" htmlFor="reg-email">
                Email
              </label>
              <Input
                id="reg-email"
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
              <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider font-semibold" htmlFor="reg-password">
                Password
              </label>
              <Input
                id="reg-password"
                type="password"
                placeholder="••••••••"
                className="bg-page border-border/50 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-status-failed mt-1 font-medium">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider font-semibold" htmlFor="reg-confirm-password">
                Confirm Password
              </label>
              <Input
                id="reg-confirm-password"
                type="password"
                placeholder="••••••••"
                className="bg-page border-border/50 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-status-failed mt-1 font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t border-border/50 mt-2 pt-5 pb-5 bg-elevated/50">
          <p className="text-xs text-text-muted font-medium">
            Already have an account?{" "}
            <Link to="/login" className="text-text-primary hover:text-brand-cyan transition-colors">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
