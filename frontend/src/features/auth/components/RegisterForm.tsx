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

const registerSchema = z.object({ email: z.string().email("Please enter a valid email address."), password: z.string().min(12, "Password must be at least 12 characters.").max(128, "Password must not exceed 128 characters.").regex(/[A-Z]/, "Password must contain at least one uppercase letter.").regex(/[0-9]/, "Password must contain at least one number."), confirmPassword: z.string() }).refine((data) => data.password === data.confirmPassword, { message: "Passwords do not match.", path: ["confirmPassword"] })
type RegisterFormValues = z.infer<typeof registerSchema>

export function RegisterForm() {
  const { register: registerAuth } = useAuth()
  const [serverError, setServerError] = React.useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null)
    try { await registerAuth({ email: data.email, password: data.password }) }
    catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const responseData = (err as { response?: { data?: string | { message?: string } } }).response?.data
        setServerError(typeof responseData === "string" ? responseData : responseData?.message || "Registration failed. Please try again.")
      } else setServerError("Unable to connect to server. Please try again.")
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4"><CardTitle className="text-2xl">Create your account</CardTitle><CardDescription>Set up access to your ForgeOps workspace.</CardDescription></CardHeader>
      <CardContent><form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {serverError && <div role="alert" className="flex items-start gap-2 rounded-md border border-status-failed/30 bg-status-failed/10 p-3 text-sm text-status-failed"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{serverError}</div>}
        <div className="space-y-1.5"><label className="text-sm font-medium text-text-secondary" htmlFor="reg-email">Email</label><Input id="reg-email" type="email" autoComplete="email" placeholder="engineer@company.com" aria-invalid={Boolean(errors.email)} {...register("email")} />{errors.email && <p className="text-xs text-status-failed">{errors.email.message}</p>}</div>
        <div className="space-y-1.5"><label className="text-sm font-medium text-text-secondary" htmlFor="reg-password">Password</label><Input id="reg-password" type="password" autoComplete="new-password" placeholder="At least 12 characters" aria-invalid={Boolean(errors.password)} {...register("password")} />{errors.password && <p className="text-xs text-status-failed">{errors.password.message}</p>}</div>
        <div className="space-y-1.5"><label className="text-sm font-medium text-text-secondary" htmlFor="reg-confirm-password">Confirm password</label><Input id="reg-confirm-password" type="password" autoComplete="new-password" placeholder="Repeat your password" aria-invalid={Boolean(errors.confirmPassword)} {...register("confirmPassword")} />{errors.confirmPassword && <p className="text-xs text-status-failed">{errors.confirmPassword.message}</p>}</div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Creating account…" : "Create account"}</Button>
      </form></CardContent>
      <CardFooter className="justify-center border-t border-border pt-5"><p className="text-sm text-text-muted">Already have an account? <Link to="/login" className="font-medium text-accent hover:text-accent-hover">Sign in</Link></p></CardFooter>
    </Card>
  )
}
