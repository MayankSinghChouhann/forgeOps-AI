import * as React from "react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { FormField } from "@/components/ui/FormField"
import { authApi } from "../api/auth.api"
import { AlertCircle, Loader2 } from "lucide-react"

export function RegisterForm() {
  const navigate = useNavigate()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  const [fieldErrors, setFieldErrors] = React.useState<{email?: string, password?: string}>({})

  const validate = () => {
    const errors: {email?: string, password?: string} = {}
    if (!email) errors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Invalid email format"
    
    if (!password) errors.password = "Password is required"
    else if (password.length < 8) errors.password = "Password must be at least 8 characters"
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    
    setLoading(true)
    setError(null)
    
    try {
      await authApi.register({ email, passwordHash: password }) 
      navigate("/dashboard") // mock redirect
    } catch (err: any) {
      setError(err.message || "Failed to register")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 border border-error/50 bg-error/10 text-error rounded-sm text-sm flex items-start">
          <AlertCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="space-y-4">
        <FormField label="Email" error={fieldErrors.email}>
          <Input 
            type="email" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@forgeops.ai"
            disabled={loading}
          />
        </FormField>
        
        <FormField label="Password" error={fieldErrors.password}>
          <Input 
            type="password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={loading}
          />
        </FormField>
      </div>

      <Button type="submit" className="w-full font-mono" disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        {loading ? "Registering..." : "Register"}
      </Button>
      
      <p className="text-sm text-secondary text-center mt-6">
        Already have an account? <Link to="/login" className="text-primary hover:text-accent transition-colors">Sign in</Link>
      </p>
    </form>
  )
}
