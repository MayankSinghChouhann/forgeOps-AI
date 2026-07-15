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
      <Card>
        <CardHeader>
          <CardTitle>Authenticate</CardTitle>
          <CardDescription>
            Enter your credentials to access your deployment environment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-mono text-text-muted uppercase tracking-wider" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="engineer@forgeops.ai"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-status-failed mt-1">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-text-muted uppercase tracking-wider" htmlFor="password">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-brand-blue hover:text-brand-cyan transition-colors">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-status-failed mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
              {isSubmitting ? "Authenticating..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t border-border mt-2 pt-6">
          <p className="text-sm text-text-muted">
            Don't have an account?{" "}
            <Link to="/register" className="text-brand-teal hover:text-brand-cyan transition-colors font-medium">
              Request Access
            </Link>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
