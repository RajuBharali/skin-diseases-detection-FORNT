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

  /* start camera */

  useEffect(()=>{
    startCamera()
    return ()=>stopCamera()
  },[])

  /* auto capture after 6 sec */

  useEffect(()=>{

    if(!cameraReady) return

    setScanning(true)

    const timer = setTimeout(()=>{

      capture()

    },6000)

    return ()=>clearTimeout(timer)

  },[cameraReady])

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

      try{

        const file = new File([blob],"capture.jpg",{type:"image/jpeg"})

        const result:PredictionResponse = await predictImage(file)

        const preview = canvas.toDataURL("image/jpeg")

        sessionStorage.setItem("lastPrediction",JSON.stringify(result))
        sessionStorage.setItem("lastPreview",preview)

        stopCamera()

        onResult(result)

        router.push("/result")

      }catch(e){
        console.error(e)
        setError("Prediction failed")
      }

      setLoading(false)

    },"image/jpeg",0.8)

  }

  return(

    <div className="flex flex-col items-center gap-4">

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {/* Camera container */}

      <div className="relative w-full max-w-xs rounded-xl overflow-hidden shadow-lg">

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onLoadedMetadata={()=>setCameraReady(true)}
          className="w-full h-[260px] object-cover bg-black"
        />

        {/* focus box */}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

          <div className="w-40 h-40 border-2 border-green-400 rounded-lg relative">

            <div className="absolute left-0 right-0 h-[2px] bg-green-400 animate-scan"></div>

          </div>

        </div>

        {/* scanning overlay */}

        {scanning && !loading && (

          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">

            <div className="w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full animate-spin mb-3"/>

            <p className="text-sm font-semibold">
              AI scanning skin...
            </p>

            <p className="text-xs opacity-80">
              Hold camera steady
            </p>

          </div>

        )}

      </div>

      <canvas ref={canvasRef} className="hidden"/>

      {/* manual capture */}

      <div className="flex gap-3">

        <button
          onClick={capture}
          disabled={loading || !cameraReady}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Capture Now"}
        </button>

        {onFallback && (
          <button
            onClick={onFallback}
            className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
          >
            Upload
          </button>
        )}

      </div>

    </div>

  )

}