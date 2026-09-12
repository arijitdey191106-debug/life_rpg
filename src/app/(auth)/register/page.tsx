"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Loader2, UserPlus, Sparkles } from "lucide-react"

export default function RegisterPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    setError("")

    if (!username.trim() || username.trim().length < 3) {
      setError("Callsign must be at least 3 characters")
      return
    }

    if (!password || password.length < 6) {
      setError("Encryption key must be at least 6 characters")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || "Registration failed")
      } else {
        router.push("/login")
      }
    } catch {
      setError("Connection failed. Try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 absolute inset-0 z-50 bg-[#05050A]">
      {/* Ambient gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-primary/10 opacity-30" aria-hidden="true" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-[120px]" aria-hidden="true" />
      <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-[100px]" aria-hidden="true" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass-panel p-8 md:p-12 w-full max-w-md relative z-10 glow-border"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-secondary/20 border border-secondary/30 flex items-center justify-center"
          >
            <Sparkles className="w-8 h-8 text-secondary" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-widest glow-text">NEW CHARACTER</h1>
          <p className="text-gray-400 mt-2 tracking-wide text-sm">CREATE YOUR AVATAR</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            role="alert"
            className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="space-y-2">
            <label htmlFor="register-username" className="text-xs uppercase tracking-widest text-gray-400 block">
              Callsign (Username)
            </label>
            <input 
              id="register-username"
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all placeholder:text-gray-600"
              placeholder="Choose your callsign (min. 3 chars)"
              autoComplete="username"
              aria-required="true"
              aria-describedby="username-help"
              disabled={isLoading}
            />
            <p id="username-help" className="text-xs text-gray-600">Minimum 3 characters</p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="register-password" className="text-xs uppercase tracking-widest text-gray-400 block">
              Encryption Key (Password)
            </label>
            <input 
              id="register-password"
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all placeholder:text-gray-600"
              placeholder="Create your encryption key (min. 6 chars)"
              autoComplete="new-password"
              aria-required="true"
              aria-describedby="password-help"
              disabled={isLoading}
            />
            <p id="password-help" className="text-xs text-gray-600">Minimum 6 characters</p>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-lg bg-secondary text-white font-bold tracking-widest uppercase hover:opacity-90 transition-colors glow-border relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                CREATING...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Initialize
                <UserPlus className="w-5 h-5" />
              </span>
            )}
            <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500 skew-x-12" aria-hidden="true" />
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Already registered?{" "}
          <Link href="/login" className="text-secondary hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-[#05050A] rounded">
            Authenticate
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
