import * as React from "react"
import { Link } from "react-router-dom"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"

export function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Access</CardTitle>
        <CardDescription>
          ForgeOps AI is currently in private beta.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center pb-6">
        <p className="text-sm text-text-muted mb-4">
          Please contact your administrator to request an invitation link to the platform.
        </p>
        <Link to="/login" className="text-brand-blue hover:text-brand-cyan transition-colors text-sm">
          Return to Sign In
        </Link>
      </CardContent>
    </Card>
  )
}
