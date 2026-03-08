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

  const [cameraReady, setCameraReady] = useState(false)
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null)

  const [autoCaptured, setAutoCaptured] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* AI checks */

  const [lastFrame, setLastFrame] = useState<ImageData | null>(null)
  const [movementScore, setMovementScore] = useState(0)
  const [blurScore, setBlurScore] = useState(0)
  const [skinRatio, setSkinRatio] = useState(0)

  const [lastResults, setLastResults] = useState<string[]>([])

  const SIZE = 224


  /* -------------------------
     Start Camera
  --------------------------*/

  useEffect(() => {

    startCamera()

    return () => stopCamera()

  }, [])


  /* -------------------------
     Scan Loop
  --------------------------*/

  useEffect(() => {

    if (!cameraReady || autoCaptured) return

    const interval = setInterval(() => {

      scanFrame()

    }, 2000)

    return () => clearInterval(interval)

  }, [cameraReady, autoCaptured])


  /* -------------------------
     Camera Controls
  --------------------------*/

  function stopCamera() {

    if (streamRef.current) {

      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null

    }

  }


  async function startCamera() {

    try {

      const stream = await navigator.mediaDevices.getUserMedia({

        video: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 }
        }

      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

    } catch {

      setError("Camera access denied.")

    }

  }


  /* -------------------------
     Movement Detection
  --------------------------*/

  function detectMovement(frame: ImageData) {

    if (!lastFrame) {

      setLastFrame(frame)
      return 0

    }

    let diff = 0

    for (let i = 0; i < frame.data.length; i += 16) {

      diff += Math.abs(frame.data[i] - lastFrame.data[i])

    }

    const score = diff / (frame.data.length / 16)

    setMovementScore(score)
    setLastFrame(frame)

    return score

  }


  /* -------------------------
     Blur Detection
  --------------------------*/

  function detectBlur(frame: ImageData) {

    const data = frame.data

    let variance = 0

    for (let i = 0; i < data.length; i += 4) {

      const gray = (data[i] + data[i+1] + data[i+2]) / 3
      variance += gray * gray

    }

    variance = variance / (data.length / 4)

    setBlurScore(variance)

    return variance

  }


  /* -------------------------
     Skin Detection
  --------------------------*/

  function detectSkin(frame: ImageData) {

    const data = frame.data

    let skin = 0
    let total = data.length / 4

    for (let i = 0; i < data.length; i += 4) {

      const r = data[i]
      const g = data[i+1]
      const b = data[i+2]

      if (

        r > 95 &&
        g > 40 &&
        b > 20 &&
        r > g &&
        r > b &&
        Math.abs(r-g) > 15

      ) {

        skin++

      }

    }

    const ratio = skin / total

    setSkinRatio(ratio)

    return ratio

  }


  /* -------------------------
     Scan Frame
  --------------------------*/

  async function scanFrame() {

    if (!videoRef.current || !canvasRef.current) return
    if (loading || autoCaptured) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    canvas.width = SIZE
    canvas.height = SIZE

    ctx.drawImage(video, 0, 0, SIZE, SIZE)

    const frame = ctx.getImageData(0,0,SIZE,SIZE)

    const move = detectMovement(frame)
    const blur = detectBlur(frame)
    const skin = detectSkin(frame)

    /* Skip bad frames */

    if (move > 25) return
    if (blur < 500) return
    if (skin < 0.2) return

    canvas.toBlob(async blob => {

      if (!blob) return

      try {

        const file = new File([blob], "scan.jpg", { type:"image/jpeg" })

        const result: PredictionResponse = await predictImage(file)

        setPrediction(result)

        const conf = result.final_decision.confidence_percent
        const name = result.final_decision.result

        /* Stable result detection */

        const updated = [...lastResults, name].slice(-3)
        setLastResults(updated)

        const stable =
          updated.length === 3 &&
          updated.every(r => r === name)

        /* second probability */

        let second = 0

        if (result.stage3) {

          const vals = Object.values(result.stage3)
          const sorted = [...vals].sort((a,b)=>b-a)

          second = sorted[1] * 100

        }

        const diff = conf - second

        /* Smart Capture */

        if (

          conf >= 85 ||

          (conf >= 50 && diff >= 10) ||

          stable

        ) {

          if (!autoCaptured) {

            setAutoCaptured(true)

            stopCamera()

            const preview = canvas.toDataURL("image/jpeg")

            sessionStorage.setItem("lastPrediction", JSON.stringify(result))
            sessionStorage.setItem("lastPreview", preview)

            onResult(result)

            router.push("/result")

          }

        }

      } catch(e) {

        console.error(e)

      }

    },"image/jpeg",0.7)

  }


  /* -------------------------
     UI
  --------------------------*/

  return (

    <div className="flex flex-col items-center gap-4">

      {error && (
        <div className="text-red-500">{error}</div>
      )}

      <div className="relative w-full max-w-sm rounded-xl overflow-hidden shadow">

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onLoadedMetadata={() => setCameraReady(true)}
          className="w-full h-[320px] object-cover bg-black"
        />

        {/* Scanner */}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

          <div className="relative w-44 h-44 border-2 border-green-400 rounded-lg">

            <div className="absolute left-0 right-0 animate-scan h-[2px] bg-green-400"/>

          </div>

        </div>

        {/* Status */}

        <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded">

          {movementScore > 25 && "Hold camera steady"}

          {blurScore < 500 && "Image blurry"}

          {skinRatio < 0.2 && "Place skin inside scanner"}

        </div>

        {/* Live prediction */}

        {prediction && (

          <div className="absolute bottom-3 left-3 right-3 bg-black/70 text-white text-xs px-3 py-2 rounded">

            {prediction.final_decision.result}
            {" "}
            ({prediction.final_decision.confidence_percent.toFixed(1)}%)

          </div>

        )}

      </div>

      {onFallback && (

        <button
          onClick={onFallback}
          className="bg-gray-200 px-4 py-2 rounded"
        >
          Upload Image
        </button>

      )}

    </div>

  )

}