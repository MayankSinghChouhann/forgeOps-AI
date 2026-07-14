import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { LoginPage } from "@/pages/LoginPage"
import { RegisterPage } from "@/pages/RegisterPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Redirect root to login for now */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* Mock dashboard route to test navigation */}
        <Route path="/dashboard" element={<div className="p-8 font-mono text-primary bg-background min-h-screen">Logged in successfully. <a href="/login" className="text-accent underline">Logout</a></div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
