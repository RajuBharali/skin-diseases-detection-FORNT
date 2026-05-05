"use client"

import { useState, useEffect } from "react"

export default function GlobalAlert() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show if user hasn't dismissed it this session
    const hasDismissed = sessionStorage.getItem("onelife_alert_dismissed")
    if (!hasDismissed) {
      const timer = setTimeout(() => setIsVisible(true), 500)
      return () => clearTimeout(timer)
    }
  }, [])

  if (!isVisible) return null

  const handleDismiss = () => {
    setIsVisible(false)
    sessionStorage.setItem("onelife_alert_dismissed", "true")
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-[fadeUp_0.5s_ease-out]">
      <div className="bg-white rounded-2xl shadow-2xl border border-red-100 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
        <div className="p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <span className="material-icons text-red-500 text-xl">gavel</span>
          </div>
          <div className="flex-1 pt-0.5">
            <h3 className="text-sm font-extrabold text-slate-800 mb-1 leading-tight">Project Testing Purposes Only</h3>
            <p className="text-xs font-medium text-slate-500 leading-relaxed mb-4">
              <strong className="text-slate-700">Onelife.ai</strong> is currently an experimental academic prototype. Results are <strong className="text-red-600">NOT 100% accurate</strong> and cannot replace diagnosis from a certified dermatologist.
            </p>
            <button 
              onClick={handleDismiss}
              className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-bold py-2.5 rounded-lg text-xs transition-colors"
            >
              I Understand & Agree
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
