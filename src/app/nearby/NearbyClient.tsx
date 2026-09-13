"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { updateLocation, getNearbyPlayers } from "@/app/actions/nearby"
import { updateUserSettings } from "@/actions/settings"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MapPin, ShieldOff, Loader2 } from "lucide-react"
import { challengeFriend } from "@/app/actions/duels"

export default function NearbyClient({ initialOptIn }: { initialOptIn: boolean }) {
  const router = useRouter()
  const [optIn, setOptIn] = useState(initialOptIn)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [players, setPlayers] = useState<any[]>([])

  const [challengingId, setChallengingId] = useState<string | null>(null)

  useEffect(() => {
    if (optIn) {
      refreshNearby()
    }
  }, []) // Only run on mount — toggle handler calls refreshNearby directly after DB write

  const refreshNearby = async () => {
    setLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.")
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude

          // Save location to DB (race-condition-safe: no longer guarded by locationOptIn in updateLocation)
          await updateLocation(lat, lng)

          const res = await getNearbyPlayers()
          if (res.success && res.nearby) {
            setPlayers(res.nearby)
            // Check if the server reports location was not yet recorded
            if ((res as any).noLocationYet) {
              setError("Location recorded. Tap Refresh to scan for nearby players.")
            }
          } else {
            setError(res.error || "Failed to fetch nearby players.")
          }
        } catch (err) {
          setError("Unable to determine your location. Please try again.")
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        // Map GeolocationPositionError codes to clear messages
        if (err.code === err.PERMISSION_DENIED) {
          setError(
            "Location access is required to discover nearby players. Please enable location in your browser settings and refresh."
          )
          // Turn off optIn locally if permission was denied
          handleToggleOptIn(false)
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError("Unable to determine your location. Please try again.")
        } else if (err.code === err.TIMEOUT) {
          setError("Location request timed out. Please try again.")
        } else {
          setError("Failed to get location. Please try again.")
        }
        setLoading(false)
      },
      {
        timeout: 10000,         // 10 s timeout to prevent silent hanging
        maximumAge: 60000,      // Accept cached position up to 1 min old
        enableHighAccuracy: false // Low accuracy is sufficient and faster
      }
    )
  }

  const handleToggleOptIn = async (newOptIn: boolean) => {
    setOptIn(newOptIn)
    // Await the DB write FIRST so that updateLocation won't race against the opt-in flag
    await updateUserSettings({ locationOptIn: newOptIn })
    if (!newOptIn) {
      setPlayers([])
      setError(null)
    } else {
      // DB write is done — now it's safe to get location and scan
      refreshNearby()
    }
  }

  const handleChallenge = async (playerId: string) => {
    try {
      setChallengingId(playerId)
      await challengeFriend(playerId, "STREAK", 0)
      router.push("/duels")
    } catch (err: any) {
      alert(err.message || "Failed to send challenge")
    } finally {
      setChallengingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold mb-1">Visibility</h3>
          <p className="text-white/60 text-sm">Visible to Nearby Players (Approximate Distance Only)</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={optIn}
            onChange={(e) => handleToggleOptIn(e.target.checked)}
          />
          <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
        </label>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3">
          <ShieldOff className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {optIn && !error && (
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MapPin className="text-[var(--primary)]" /> Players within 1 KM
            </h2>
            <button
              onClick={refreshNearby}
              disabled={loading}
              className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded transition-colors disabled:opacity-50"
            >
              {loading ? "Scanning..." : "Refresh"}
            </button>
          </div>

          {loading && players.length === 0 ? (
            <div className="glass-panel p-12 flex flex-col items-center justify-center text-white/50">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-[var(--primary)]" />
              <p>Scanning local area...</p>
            </div>
          ) : players.length === 0 ? (
            <div className="glass-panel p-12 text-center text-white/50">
              <p>No players within 1 KM are currently visible.</p>
              <p className="text-sm mt-2">Check back later or invite friends to join your party.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {players.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel p-4 flex flex-col justify-between gap-4 border border-[var(--primary)]/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
                        {p.avatars?.[0]?.avatar ? (
                          <img src={p.avatars[0].avatar.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-gray-400 text-xl">{p.username[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-tight">{p.username}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-white/60">
                          <span className="text-[var(--primary)]">Level {p.level}</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {p.distance >= 1000
                              ? `~${(p.distance / 1000).toFixed(1)} km away`
                              : `~${p.distance} m away`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/party/${p.username}`}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-center py-2 rounded font-medium transition-colors text-sm"
                      >
                        VIEW PROFILE
                      </Link>
                      <button
                        onClick={() => handleChallenge(p.id)}
                        disabled={challengingId === p.id}
                        className="flex-1 bg-[var(--secondary)]/20 hover:bg-[var(--secondary)]/40 text-[var(--secondary)] border border-[var(--secondary)]/50 py-2 rounded font-bold transition-all text-sm"
                      >
                        {challengingId === p.id ? "..." : "CHALLENGE"}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
