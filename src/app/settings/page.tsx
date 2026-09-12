"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { updateUserSettings } from "@/actions/settings"
import { useAudio } from "@/components/AudioProvider"
import { Volume2, VolumeX, Settings as SettingsIcon } from "lucide-react"

export default function SettingsPage() {
  const audio = useAudio()
  const [formData, setFormData] = useState({
    masterVolume: 100,
    uiVolume: 100,
    ambientVolume: 100,
    rewardVolume: 100,
    isMuted: false,
    reducedMotion: false,
    locationOptIn: false,
  } as any)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (audio.settings) {
      setFormData(audio.settings)
    }
  }, [audio.settings])

  const handleChange = (field: keyof typeof formData, value: any) => {
    const newForm = { ...formData, [field]: value }
    setFormData(newForm)
    audio.updateVolume(newForm)
    audio.playClick()
  }

  const handleSave = async () => {
    setSaving(true)
    audio.playClick()
    try {
      await updateUserSettings(formData)
      setSaved(true)
      audio.playSuccess()
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 p-6 lg:p-12 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <header className="flex items-center space-x-4">
          <SettingsIcon className="w-10 h-10 text-[var(--primary)]" />
          <h1 className="text-3xl font-bold tracking-tight text-white glow-text">Settings</h1>
        </header>

        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-8 rounded-xl space-y-8"
        >
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <h2 className="text-xl font-semibold text-white">Audio & Preferences</h2>
            <button 
              onClick={() => handleChange("isMuted", !formData.isMuted)}
              className={`p-2 rounded-lg transition-colors ${formData.isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'}`}
              aria-label={formData.isMuted ? "Unmute all" : "Mute all"}
            >
              {formData.isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <label htmlFor="masterVolume" className="text-sm font-medium text-white/80">Master Volume</label>
                <span className="text-sm text-white/50">{formData.masterVolume}%</span>
              </div>
              <input 
                type="range" 
                id="masterVolume"
                min="0" max="100" 
                value={formData.masterVolume}
                onChange={(e) => handleChange("masterVolume", parseInt(e.target.value))}
                className="w-full accent-[var(--primary)]"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label htmlFor="uiVolume" className="text-sm font-medium text-white/80">UI Sounds</label>
                <span className="text-sm text-white/50">{formData.uiVolume}%</span>
              </div>
              <input 
                type="range" 
                id="uiVolume"
                min="0" max="100" 
                value={formData.uiVolume}
                onChange={(e) => handleChange("uiVolume", parseInt(e.target.value))}
                className="w-full accent-[var(--secondary)]"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label htmlFor="ambientVolume" className="text-sm font-medium text-white/80">Ambient Music</label>
                <span className="text-sm text-white/50">{formData.ambientVolume}%</span>
              </div>
              <input 
                type="range" 
                id="ambientVolume"
                min="0" max="100" 
                value={formData.ambientVolume}
                onChange={(e) => handleChange("ambientVolume", parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label htmlFor="rewardVolume" className="text-sm font-medium text-white/80">Reward & FX</label>
                <span className="text-sm text-white/50">{formData.rewardVolume}%</span>
              </div>
              <input 
                type="range" 
                id="rewardVolume"
                min="0" max="100" 
                value={formData.rewardVolume}
                onChange={(e) => handleChange("rewardVolume", parseInt(e.target.value))}
                className="w-full accent-green-500"
              />
            </div>


            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white/80">Reduced Motion</h3>
                <p className="text-xs text-white/50">Minimize animations and visual effects</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={formData.reducedMotion}
                  onChange={(e) => handleChange("reducedMotion", e.target.checked)}
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
              </label>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white/80">Visible to Nearby Players</h3>
                <p className="text-xs text-white/50">Allow others to see your approximate distance</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={(formData as any).locationOptIn || false}
                  onChange={(e) => handleChange("locationOptIn", e.target.checked)}
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
              </label>
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-[var(--primary)] hover:bg-[#9b4dff] text-white rounded-lg font-medium transition-colors glow-border flex items-center space-x-2 disabled:opacity-50"
            >
              {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </motion.section>
      </div>
    </div>
  )
}
