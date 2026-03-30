"use client"

import UploadBox from "../components/UploadBox"
import CameraCapture from "../components/CameraCapture"
import Link from "next/link"
import { useState } from "react"

export default function PredictPage() {
  const [mode, setMode] = useState<"upload" | "camera">("upload")

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
              <span className="text-[10px] sm:text-xs text-blue-200/80 uppercase tracking-widest font-semibold flex items-center gap-1">Diagnostic Mode</span>
            </div>
          </Link>
          
          <Link href="/" className="flex items-center gap-2 text-white/80 hover:text-white font-medium text-sm sm:text-base transition-colors bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
             <span className="material-icons text-lg">arrow_back</span>
             <span className="hidden sm:inline">Back to Home</span>
          </Link>
        </header>

        {/* Title & Toggles */}
        <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 text-center mt-8 sm:mt-12">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
             AI Diagnostic Scanner
          </h1>
          <p className="text-blue-200 text-sm md:text-base font-medium mb-10 max-w-2xl mx-auto">
             Upload a high-quality photo of your skin concern, or use your live camera for instant neural-network analysis.
          </p>
          
          {/* Custom Modern Tabs */}
          <div className="inline-flex items-center justify-center bg-[#074791] p-1.5 rounded-full shadow-inner border border-white/10">
            <button
              onClick={() => setMode("upload")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                mode === "upload" 
                  ? "bg-white text-[#023b7a] shadow-md" 
                  : "text-blue-200 hover:text-white hover:bg-white/10"
              }`}
            >
              <span className="material-icons text-lg">cloud_upload</span>
              Upload Photo
            </button>
            <button
              onClick={() => setMode("camera")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                mode === "camera" 
                  ? "bg-white text-[#023b7a] shadow-md" 
                  : "text-blue-200 hover:text-white hover:bg-white/10"
              }`}
            >
              <span className="material-icons text-lg">photo_camera</span>
              Live Camera
            </button>
          </div>
        </div>
      </div>

      {/* ===================== SCANNER CONTAINER ===================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-30 -mt-16 sm:-mt-20 mb-24">
         <div className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-[2rem] sm:rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-4 sm:p-10 mb-10 overflow-hidden">
            
            {/* Component Integration */}
            <div className="relative">
              {mode === "upload" ? (
                <UploadBox onSwitchToCamera={() => setMode("camera")} />
              ) : (
                <CameraCapture onFallback={() => setMode("upload")} onResult={() => {}} />
              )}
            </div>

         </div>
         
         {/* Footer Disclaimer */}
         <div className="text-center bg-blue-50/50 rounded-2xl p-6 border border-blue-100 max-w-4xl mx-auto shadow-sm">
            <p className="flex items-center justify-center gap-2 font-bold text-slate-700 text-xs sm:text-sm mb-2">
              <span className="material-icons text-base text-yellow-600">warning</span> Important Medical Disclaimer
            </p>
            <p className="text-xs text-slate-500 leading-relaxed max-w-3xl mx-auto">
              Onelife.ai is an experimental diagnostic tool intended for informational purposes only. The neural network's assessment is based on visual patterns and may produce inaccurate results. It does not replace professional medical advice, diagnosis, or treatment. Always seek the advice of a qualified healthcare provider regarding any suspected skin condition.
            </p>
         </div>
      </div>

    </div>
  )
}