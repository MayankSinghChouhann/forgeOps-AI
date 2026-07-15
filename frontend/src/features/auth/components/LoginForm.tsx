import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion } from "framer-motion"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Link, useNavigate } from "react-router-dom"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const navigate = useNavigate()

  const onSubmit = async (data: LoginFormValues) => {
    // Mock API call
    console.log("Submitting:", data)
    await new Promise(resolve => setTimeout(resolve, 1000))
    // Redirect to the mock dashboard
    navigate("/dashboard")
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
                <Link to="/forgot-password" className="text-xs text-text-muted hover:text-brand-cyan transition-colors">
                  Forgot password?
                </Link>
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
