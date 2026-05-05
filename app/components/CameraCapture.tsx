"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { predictImage } from "@/app/lib/api"
import { PredictionResponse } from "@/app/types/prediction"

interface Props {
  onResult: (data: PredictionResponse) => void
  onFallback?: () => void
}

export default function CameraCapture({ onResult, onFallback }: Props) {

  const router = useRouter()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [cameraReady,setCameraReady] = useState(false)
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState<string | null>(null)
  const [scanning,setScanning] = useState(false)

  // Patient / Client Details State
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [age, setAge] = useState<number | "">("")
  const [gender, setGender] = useState("")

  /* start camera */

  useEffect(()=>{
    startCamera()
    return ()=>stopCamera()
  },[])

  /* auto capture after 6 sec - DISABLED for manual flow with form */
  /* 
  useEffect(()=>{
    if(!cameraReady) return
    setScanning(true)
    const timer = setTimeout(()=>{
      capture()
    },6000)
    return ()=>clearTimeout(timer)
  },[cameraReady])
  */

  function stopCamera(){
    if(streamRef.current){
      streamRef.current.getTracks().forEach(t=>t.stop())
      streamRef.current=null
    }
  }

  async function startCamera(){
    try{
      const stream = await navigator.mediaDevices.getUserMedia({
        video:{
          facingMode:"environment",
          width:{ideal:720},
          height:{ideal:480}
        }
      })
      streamRef.current = stream
      if(videoRef.current){
        videoRef.current.srcObject = stream
      }
    }catch{
      setError("Camera access failed")
    }
  }

  /* capture center focus region */

  async function capture(){

    if(!videoRef.current || !canvasRef.current) return
    
    if (!name || !email || !phoneNumber || !age || !gender) {
      setError("Please fill out all patient details first.")
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if(!ctx) return

    const SIZE = 224
    canvas.width = SIZE
    canvas.height = SIZE

    /* center crop */
    const vw = video.videoWidth
    const vh = video.videoHeight
    const cropSize = Math.min(vw,vh) * 0.45
    const sx = vw/2 - cropSize/2
    const sy = vh/2 - cropSize/2

    ctx.drawImage(
      video,
      sx,sy,cropSize,cropSize,
      0,0,SIZE,SIZE
    )

    canvas.toBlob(async blob=>{

      if(!blob) return

      setLoading(true)
      setScanning(true)

      try{

        const file = new File([blob],"capture.jpg",{type:"image/jpeg"})

        const result:PredictionResponse = await predictImage(
          file, 
          name, 
          email, 
          phoneNumber, 
          Number(age), 
          gender
        )

        const preview = canvas.toDataURL("image/jpeg")

        sessionStorage.setItem("lastPrediction",JSON.stringify(result))
        sessionStorage.setItem("lastPreview",preview)
        sessionStorage.setItem("patientAge", String(age))
        sessionStorage.setItem("patientGender", gender)

        stopCamera()
        onResult(result)
        router.push("/result")

      }catch(e){
        console.error(e)
        setError("Prediction failed")
      }

      setLoading(false)
      setScanning(false)

    },"image/jpeg",0.8)

  }

  return(
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start p-4">

      {/* LEFT: CAMERA CAPTURE */}
      <div className="flex flex-col items-center gap-4">
        {error && (
          <p className="text-red-500 text-sm font-bold bg-red-50 p-2 rounded w-full text-center">{error}</p>
        )}

        <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl bg-black border-4 border-white/10">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            onLoadedMetadata={()=>setCameraReady(true)}
            className="w-full h-full object-cover"
          />

          {/* focus box */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 border-2 border-cyan-400 rounded-3xl relative shadow-[0_0_20px_rgba(34,211,238,0.5)]">
              <div className="absolute left-0 right-0 h-[2px] bg-cyan-400 animate-scan"></div>
              {/* Corner markings */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg"></div>
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg"></div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg"></div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-lg"></div>
            </div>
          </div>

          {/* scanning overlay */}
          {scanning && loading && (
            <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-white z-50">
              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"/>
              <p className="text-lg font-bold tracking-tight">AI ANALYZING SKIN...</p>
              <p className="text-xs text-blue-100 mt-1 uppercase tracking-widest opacity-80">Processing neural patterns</p>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden"/>

        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <button
            onClick={capture}
            disabled={loading || !cameraReady}
            className={`flex-[2] py-4 rounded-2xl font-extrabold text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
              cameraReady && !loading 
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-cyan-500/30 hover:-translate-y-0.5" 
                : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
            }`}
          >
            <span className="material-icons">{loading ? "refresh" : "photo_camera"}</span>
            {loading ? "Analyzing..." : "Capture & Analyze"}
          </button>

          {onFallback && (
            <button
              onClick={onFallback}
              className="flex-1 bg-white border border-slate-200 text-slate-600 px-6 py-4 rounded-2xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span className="material-icons text-lg">upload_file</span>
              Upload
            </button>
          )}
        </div>
      </div>

      {/* RIGHT: PATIENT INFO */}
      <div className="flex flex-col gap-6">
        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
              <span className="material-icons text-blue-600 text-sm">person</span>
            </div>
            <h3 className="text-[11px] tracking-[0.15em] font-black text-[#023b7a] uppercase">Patient Details</h3>
          </div>
          
          <div className="space-y-4 sm:space-y-5">
            <div className="group">
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 ml-1 transition-colors group-focus-within:text-blue-600">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter patient name"
                className="w-full bg-slate-50/50 border border-slate-100 text-slate-800 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm group-hover:border-slate-200"
              />
            </div>
            
            <div className="group">
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 ml-1 transition-colors group-focus-within:text-blue-600">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="patient@example.com"
                className="w-full bg-slate-50/50 border border-slate-100 text-slate-800 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm group-hover:border-slate-200"
              />
            </div>

            <div className="group">
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 ml-1 transition-colors group-focus-within:text-blue-600">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 234 567 890"
                className="w-full bg-slate-50/50 border border-slate-100 text-slate-800 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm group-hover:border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-5">
              <div className="group">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 ml-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Age"
                  className="w-full bg-slate-50/50 border border-slate-100 text-slate-800 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                />
              </div>
              <div className="group relative">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 ml-1">Gender</label>
                <div className="relative">
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-100 text-slate-800 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer pr-10"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">expand_more</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex items-start gap-3">
          <span className="material-icons text-blue-400 text-lg">info</span>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Please ensure all patient information is correct. This data is required for diagnostic logging and medical record matching.
          </p>
        </div>
      </div>
    </div>
  )
}