"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Loader2, ArrowRight, Shield } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    setError("")

    if (!username.trim() || !password.trim()) {
      setError("Both fields are required")
      return
    }

    setIsLoading(true)
    try {
      const res = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false
      })

      if (res?.error) {
        setError("Invalid identifier or passcode")
      } else {
        router.push("/")
        router.refresh()
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
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-30" aria-hidden="true" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" aria-hidden="true" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/5 rounded-full blur-[100px]" aria-hidden="true" />

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
            className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center"
          >
            <Shield className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-widest glow-text">ENTER YOUR WORLD</h1>
          <p className="text-gray-400 mt-2 tracking-wide text-sm">INITIALIZE SESSION</p>
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
            <label htmlFor="login-username" className="text-xs uppercase tracking-widest text-gray-400 block">
              Identifier
            </label>
            <input 
              id="login-username"
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-gray-600"
              placeholder="Enter your callsign"
              autoComplete="username"
              aria-required="true"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="login-password" className="text-xs uppercase tracking-widest text-gray-400 block">
              Passcode
            </label>
            <input 
              id="login-password"
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-gray-600"
              placeholder="Enter your encryption key"
              autoComplete="current-password"
              aria-required="true"
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 rounded-lg bg-primary text-white font-bold tracking-widest uppercase hover:bg-primary-hover transition-colors glow-border relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                AUTHENTICATING...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Authenticate
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
            <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500 skew-x-12" aria-hidden="true" />
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Unregistered?{" "}
          <Link href="/register" className="text-primary hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#05050A] rounded">
            Create Profile
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
