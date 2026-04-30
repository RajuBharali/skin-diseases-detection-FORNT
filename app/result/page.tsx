"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// ─── Types ────────────────────────────────────────────────────────────────────
interface FinalDecision {
  result: string
  confidence_percent: number
}
interface PredictionData {
  final_decision: FinalDecision
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimCounter({ target }: { target: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / 60
    const t = setInterval(() => {
      start += step
      if (start >= target) { setVal(target); clearInterval(t) }
      else setVal(Math.round(start * 10) / 10)
    }, 16)
    return () => clearInterval(t)
  }, [target])
  return <>{val.toFixed(1)}</>
}

// ─── Circular Gauge ───────────────────────────────────────────────────────────
function CircularGauge({ value }: { value: number }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { setTimeout(() => setAnimated(true), 200) }, [])

  const r = 88
  const cx = 110
  const cy = 110
  const circumference = 2 * Math.PI * r
  const pct = animated ? value / 100 : 0
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const offset = circumference - pct * circumference * 0.75
  const color = value >= 75 ? "#ef4444" : value >= 55 ? "#f97316" : "#2563eb"
  const track = "#e2e8f0"

  const polarToXY = (deg: number, radius: number) => {
    const rad = ((deg - 90) * Math.PI) / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }
  const arcPath = (startDeg: number, endDeg: number, rad: number) => {
    const s = polarToXY(startDeg, rad)
    const e = polarToXY(endDeg, rad)
    const large = endDeg - startDeg > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${rad} ${rad} 0 ${large} 1 ${e.x} ${e.y}`
  }

  const arcStart = -135
  const arcEnd = 135
  const fillEnd = arcStart + (arcEnd - arcStart) * (animated ? value / 100 : 0)

  return (
    <svg width="220" height="220" viewBox="0 0 220 220" className="overflow-visible">
      {/* Track */}
      <path d={arcPath(arcStart, arcEnd, r)} fill="none" stroke={track} strokeWidth="14" strokeLinecap="round" />
      {/* Fill */}
      <path
        d={arcPath(arcStart, fillEnd, r)}
        fill="none"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
      {/* Glow */}
      <path
        d={arcPath(arcStart, fillEnd, r)}
        fill="none"
        stroke={color}
        strokeWidth="24"
        strokeLinecap="round"
        opacity="0.15"
        className="transition-all duration-1000 ease-out blur-sm"
      />
      {/* Center text */}
      <text x={cx} y={cy - 10} textAnchor="middle" className="text-4xl font-extrabold" fill={color}>
        <AnimCounter target={value} />
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" className="text-sm font-semibold fill-slate-500">
        % confidence
      </text>
      <text x={cx} y={cy + 38} textAnchor="middle" className="text-[10px] font-bold fill-slate-400 tracking-widest uppercase">
        AI SCORE
      </text>
    </svg>
  )
}

// ─── Severity Badge ───────────────────────────────────────────────────────────
function SeverityBadge({ pct }: { pct: number }) {
  const level = pct >= 75 ? { label: "High Confidence", bg: "bg-red-50", color: "text-red-600", border: "border-red-200", dot: "bg-red-500" }
    : pct >= 55 ? { label: "Moderate Confidence", bg: "bg-orange-50", color: "text-orange-600", border: "border-orange-200", dot: "bg-orange-500" }
    : { label: "Low Confidence", bg: "bg-blue-50", color: "text-blue-600", border: "border-blue-200", dot: "bg-blue-500" }
    
  return (
    <span className={`inline-flex items-center gap-2 ${level.bg} ${level.color} border ${level.border} rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase`}>
      <span className={`w-1.5 h-1.5 rounded-full ${level.dot}`} />
      {level.label}
    </span>
  )
}

interface AIAction {
  icon: string
  label: string
  desc: string
}

export default function ResultPage() {
  const router = useRouter()
  const [data, setData] = useState<PredictionData | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [aiActions, setAiActions] = useState<AIAction[] | null>(null)
  const [loadingActions, setLoadingActions] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("lastPrediction")
      const prev = sessionStorage.getItem("lastPreview")
      if (raw) {
        const parsed: PredictionData = JSON.parse(raw)
        if (parsed.final_decision && parsed.final_decision.result) {
          setTimeout(() => {
            setData(parsed)
            if (prev) setPreview(prev)
          }, 0)

          // Fetch dynamic AI guidance
          setTimeout(() => setLoadingActions(true), 0)
          fetch('/api/guidance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ condition: parsed.final_decision.result })
          })
            .then(res => res.json())
            .then(resData => {
              if (resData.actions) {
                setAiActions(resData.actions)
              }
            })
            .catch(err => console.error("Error fetching AI guidance:", err))
            .finally(() => setLoadingActions(false))

        } else router.push("/predict")
      } else router.push("/predict")
    } catch {
      router.push("/predict")
    }
  }, [router])

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )

  const { final_decision } = data
  const pct = final_decision.confidence_percent

  const defaultActions = [
    { icon: "clinical_notes", label: "Consult a certified dermatologist", desc: "Book an appointment for professional evaluation" },
    { icon: "water_drop", label: "Keep affected skin moisturized", desc: "Use fragrance-free emollient creams twice daily" },
    { icon: "block", label: "Avoid scratching or irritation", desc: "Use cold compresses to soothe flare-ups" },
    { icon: "sanitizer", label: "Use gentle, unscented products", desc: "Switch to hypoallergenic cleansers and detergents" },
  ]
  
  const actionsToDisplay = aiActions || defaultActions

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-blue-500/30 overflow-hidden">
      
      {/* ===================== BLUE HERO HEADER ===================== */}
      <div className="relative bg-[#023b7a] pb-32 pt-6 rounded-br-[4rem] sm:rounded-br-[8rem] shadow-xl z-0 text-white">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute w-[120%] h-[150%] bg-[#074791] -rotate-12 -top-[60%] -left-[10%] opacity-80 mix-blend-screen"></div>
          <div className="absolute w-[80%] h-[120%] bg-[#0f53a1] rotate-12 -bottom-[40%] -right-[10%] opacity-80 mix-blend-screen"></div>
          <div className="absolute w-[50%] h-[200%] bg-blue-400/10 rotate-45 -top-[50%] left-[20%]"></div>
        </div>

        {/* Minimal Nav / Logo */}
        <header className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 mb-10 pt-2 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl shadow-lg flex items-center justify-center p-1.5 transition-transform group-hover:scale-105">
               <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg relative flex items-center justify-center overflow-hidden border border-blue-100">
                  <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center">
                       <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#023b7a] rounded-full relative">
                         <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-bold leading-none text-[8px] sm:text-[10px]">+</span>
                       </div>
                     </div>
                  </div>
               </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-2xl font-bold tracking-tight text-white leading-tight">
                Onelife<span className="text-blue-300">.ai</span>
              </span>
              <span className="text-[10px] sm:text-xs text-blue-200/80 uppercase tracking-widest font-semibold flex items-center gap-1">Analysis Results</span>
            </div>
          </Link>
          
          <Link href="/predict" className="flex items-center gap-2 text-white/80 hover:text-white font-medium text-sm sm:text-base transition-colors bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
             <span className="material-icons text-lg">add_circle</span>
             <span className="hidden sm:inline">New Analysis</span>
          </Link>
        </header>

        {/* Title */}
        <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 text-center mt-8 sm:mt-12">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-400/20 border border-blue-300/30 text-blue-100 text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-4 shadow-sm backdrop-blur">
            Clinical Assessment Complete
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
             Diagnostic Results
          </h1>
          <p className="text-blue-200 text-sm md:text-base font-medium max-w-2xl mx-auto">
             Your sample has been evaluated by our neural network. Please review the detailed breakdown securely below.
          </p>
        </div>
      </div>

      {/* ===================== SCANNER CONTAINER ===================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-30 -mt-16 sm:-mt-20 mb-24 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
         
         {/* LEFT COLUMN: Main results */}
         <div className="lg:col-span-8 flex flex-col gap-6 sm:gap-8">
            
            {/* Hero Result Card */}
            <div className="bg-white rounded-[2rem] shadow-xl p-6 sm:p-10 border border-slate-100 flex flex-col sm:flex-row items-center sm:items-start gap-8 transform hover:-translate-y-1 transition-transform duration-300">
               <div className="shrink-0 flex justify-center">
                 <CircularGauge value={pct} />
               </div>
               <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xs sm:text-sm font-extrabold tracking-widest text-slate-400 uppercase mb-4 flex items-center justify-center sm:justify-start gap-2">
                     <span className="w-6 sm:w-10 h-[2px] bg-slate-200"></span> Primary Finding
                  </h3>
                  <h2 className="text-2xl sm:text-4xl font-black text-slate-800 mb-4 leading-tight">
                     You may have <br className="hidden sm:block"/>
                     <span className="text-blue-600">{final_decision.result}</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed max-w-md">
                     Our AI model analyzed your skin sample and identified possible signs of {final_decision.result.toLowerCase()}. This is a baseline assessment and not a medical diagnosis.
                  </p>
                  <SeverityBadge pct={pct} />
               </div>
            </div>

            {/* Submitted Image Card */}
            <div className="bg-white rounded-[2rem] shadow-lg p-6 sm:p-8 border border-slate-100">
               <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#023b7a]">Submitted Sample</h3>
                  <span className="text-[9px] sm:text-[10px] font-bold tracking-widest text-slate-400 uppercase bg-slate-100 px-3 py-1 rounded-md">Processed</span>
               </div>
               
               <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
                  <div className="w-full sm:w-48 h-48 rounded-2xl overflow-hidden bg-slate-100 shadow-inner border-[4px] border-slate-50 shrink-0 relative">
                     {preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={preview} alt="Sample" className="w-full h-full object-cover" />
                     ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-30">🔬</div>
                     )}
                     <div className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded text-[10px] font-bold px-2 py-1 shadow text-[#023b7a]">AI Scanned</div>
                  </div>
                  
                  <div className="flex-1 w-full space-y-3 pt-2">
                     <div className="flex justify-between items-center bg-slate-50 p-2 sm:p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] sm:text-xs font-bold tracking-widest text-slate-400 uppercase">Detection</span>
                        <span className="text-xs sm:text-sm font-extrabold text-blue-600">{final_decision.result}</span>
                     </div>
                     <div className="flex justify-between items-center bg-slate-50 p-2 sm:p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] sm:text-xs font-bold tracking-widest text-slate-400 uppercase">Confidence</span>
                        <span className="text-xs sm:text-sm font-extrabold text-slate-800">{pct.toFixed(1)}%</span>
                     </div>
                     <div className="flex justify-between items-center bg-slate-50 p-2 sm:p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] sm:text-xs font-bold tracking-widest text-slate-400 uppercase">Model Type</span>
                        <span className="text-xs sm:text-sm font-extrabold text-slate-800">Deep Learning CNN</span>
                     </div>
                  </div>
               </div>
            </div>

         </div>

         {/* RIGHT COLUMN: Actions & CTA */}
         <div className="lg:col-span-4 flex flex-col gap-6 sm:gap-8">
            
            {/* Recommendations */}
            <div className="bg-white rounded-[2rem] shadow-lg p-6 sm:p-8 border border-slate-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-[100px] -z-0"></div>
               <h3 className="relative z-10 text-base sm:text-lg font-extrabold text-slate-800 mb-6 border-b border-slate-100 pb-4">Recommended Actions</h3>
               
               <div className="relative z-10 space-y-2">
                  {loadingActions ? (
                     <div className="flex justify-center items-center py-8">
                       <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                     </div>
                  ) : (
                     actionsToDisplay.map((a, i) => (
                        <div className="flex items-start gap-4 p-3 sm:p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group" key={i}>
                           <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                              <span className="material-icons text-lg sm:text-xl">{a.icon}</span>
                           </div>
                           <div>
                              <h4 className="text-xs sm:text-sm font-bold text-slate-800 mb-0.5 sm:mb-1">{a.label}</h4>
                              <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-relaxed">{a.desc}</p>
                           </div>
                        </div>
                     ))
                  )}
               </div>
            </div>

            {/* Information CTA */}
            <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 rounded-[2rem] p-6 sm:p-8 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
               <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
               <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
               
               <h3 className="relative z-10 text-lg sm:text-xl font-bold mb-3 leading-snug">
                  Learn about {final_decision.result}
               </h3>
               <p className="relative z-10 text-xs sm:text-sm text-blue-100 mb-6 sm:mb-8 font-medium leading-relaxed">
                  Explore symptoms, potential causes, treatment options, and how to safely manage this condition.
               </p>
               <button className="relative z-10 w-full bg-white text-blue-700 font-extrabold py-3 sm:py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-sm sm:text-base">
                  View Library <span className="material-icons text-base sm:text-lg">arrow_forward</span>
               </button>
            </div>

            {/* Connect with Doctor CTA */}
            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-[2rem] p-6 text-white shadow-xl shadow-teal-900/20 text-center relative overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-bl-[100px] z-0 pointer-events-none"></div>
               <div className="relative z-10 flex flex-col items-center">
                 <span className="material-icons mb-3 text-white/90 text-4xl">medical_services</span>
                 <h3 className="text-lg font-extrabold mb-2 leading-snug">Need Professional Help?</h3>
                 <p className="text-teal-50 text-xs sm:text-sm mb-6 leading-relaxed font-medium">
                   Skip the waiting room. Schedule a secure online consultation with a board-certified dermatologist right now.
                 </p>
                 <button className="w-full bg-white text-teal-700 hover:bg-teal-50 font-extrabold py-3.5 sm:py-4 rounded-xl shadow-lg transition-transform flex justify-center items-center gap-2 text-sm sm:text-base">
                   Get connected with doctor <span className="material-icons text-base sm:text-lg">open_in_new</span>
                 </button>
               </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 rounded-2xl p-4 sm:p-5 border border-amber-200/60 shadow-sm flex items-start gap-2 sm:gap-3">
               <span className="material-icons text-amber-600 text-lg sm:text-xl shrink-0 mt-0.5 border border-amber-200">report_problem</span>
               <p className="text-[10px] sm:text-xs text-amber-800 font-medium leading-relaxed">
                  <strong className="font-extrabold block mb-1">Medical Disclaimer:</strong> This AI analysis is intended solely for informational and educational purposes. It cannot replace professional medical advice, diagnosis, or treatment. Always consult a certified dermatologist.
               </p>
            </div>

         </div>

      </div>

    </div>
  )
}