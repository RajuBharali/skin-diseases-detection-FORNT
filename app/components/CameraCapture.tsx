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

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const lastFrameRef = useRef<ImageData | null>(null)
  const lastResultsRef = useRef<string[]>([])
  const predictingRef = useRef(false)

  const [cameraReady, setCameraReady] = useState(false)
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [autoCaptured, setAutoCaptured] = useState(false)

  const [movementScore, setMovementScore] = useState(0)
  const [blurScore, setBlurScore] = useState(0)
  const [skinRatio, setSkinRatio] = useState(0)

  const SIZE = 224

  /* =========================
      CAMERA START
  ========================== */

  useEffect(() => {

    startCamera()

    return () => {
      stopCamera()
    }

  }, [])

  useEffect(() => {

    if (!cameraReady || autoCaptured) return

    const interval = setInterval(scanFrame, 1200)

    return () => clearInterval(interval)

  }, [cameraReady, autoCaptured])


  async function startCamera() {

    try {

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

    } catch (err) {

      console.error(err)
      setError("Camera permission denied or unavailable.")

    }

  }


  function stopCamera() {

    if (!streamRef.current) return

    streamRef.current.getTracks().forEach(track => track.stop())
    streamRef.current = null

  }


  /* =========================
      MOVEMENT DETECTION
  ========================== */

  function detectMovement(frame: ImageData) {

    if (!lastFrameRef.current) {

      lastFrameRef.current = frame
      return 0

    }

    let diff = 0
    const prev = lastFrameRef.current.data
    const curr = frame.data

    for (let i = 0; i < curr.length; i += 16) {
      diff += Math.abs(curr[i] - prev[i])
    }

    const score = diff / (curr.length / 16)

    lastFrameRef.current = frame
    setMovementScore(score)

    return score
  }


  /* =========================
      BLUR DETECTION
  ========================== */

  function detectBlur(frame: ImageData) {

    const d = frame.data
    let sum = 0

    for (let i = 0; i < d.length; i += 4) {

      const gray = (d[i] + d[i + 1] + d[i + 2]) / 3
      sum += gray * gray

    }

    const variance = sum / (d.length / 4)

    setBlurScore(variance)

    return variance
  }


  /* =========================
      SKIN DETECTION
  ========================== */

  function detectSkin(frame: ImageData) {

    const d = frame.data
    let skin = 0
    const total = d.length / 4

    for (let i = 0; i < d.length; i += 4) {

      const r = d[i]
      const g = d[i + 1]
      const b = d[i + 2]

      if (
        r > 95 &&
        g > 40 &&
        b > 20 &&
        r > g &&
        r > b &&
        Math.abs(r - g) > 15
      ) {
        skin++
      }

    }

    const ratio = skin / total

    setSkinRatio(ratio)

    return ratio
  }


  /* =========================
      MAIN FRAME SCAN
  ========================== */

  async function scanFrame() {

    if (!videoRef.current || !canvasRef.current) return
    if (predictingRef.current || autoCaptured) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    canvas.width = SIZE
    canvas.height = SIZE

    ctx.drawImage(videoRef.current, 0, 0, SIZE, SIZE)

    const frame = ctx.getImageData(0, 0, SIZE, SIZE)

    const movement = detectMovement(frame)
    const blur = detectBlur(frame)
    const skin = detectSkin(frame)

    /* Skip bad frames */

    if (movement > 35) return
    if (blur < 400) return
    if (skin < 0.15) return

    predictingRef.current = true

    canvas.toBlob(async blob => {

      if (!blob) {

        predictingRef.current = false
        return

      }

      try {

        const file = new File([blob], "scan.jpg", { type: "image/jpeg" })

        const result: PredictionResponse = await predictImage(file)

        setPrediction(result)

        const confidence = result.final_decision.confidence_percent
        const label = result.final_decision.result

        const history = [...lastResultsRef.current, label].slice(-3)
        lastResultsRef.current = history

        const stable = history.length === 3 && history.every(r => r === label)

        let secondBest = 0

        if (result.stage3) {

          const vals = Object.values(result.stage3)
          const sorted = [...vals].sort((a, b) => b - a)
          secondBest = sorted[1] * 100

        }

        const diff = confidence - secondBest

        if (
          confidence >= 85 ||
          (confidence >= 50 && diff >= 10) ||
          stable
        ) {

          setAutoCaptured(true)

          stopCamera()

          const preview = canvas.toDataURL("image/jpeg")

          sessionStorage.setItem("lastPrediction", JSON.stringify(result))
          sessionStorage.setItem("lastPreview", preview)

          onResult(result)

          router.push("/result")

        }

      } catch (err) {

        console.error("Prediction error:", err)

      }

      predictingRef.current = false

    }, "image/jpeg", 0.75)

  }


  /* =========================
      UI
  ========================== */

  return (

    <div className="flex flex-col items-center gap-4">

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <div className="relative w-full max-w-sm rounded-xl overflow-hidden shadow-lg">

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onLoadedMetadata={() => setCameraReady(true)}
          className="w-full h-[320px] object-cover bg-black"
        />

        <canvas ref={canvasRef} className="hidden" />

        {/* Scanner Frame */}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

          <div className="w-44 h-44 border-2 border-green-400 rounded-lg relative">

            <div className="absolute left-0 right-0 h-[2px] bg-green-400 animate-scan" />

          </div>

        </div>

        {/* Status */}

        <div className="absolute top-3 left-3 text-xs text-white bg-black/60 px-2 py-1 rounded">

          {movementScore > 35 && "Hold camera steady"}
          {blurScore < 400 && "Image blurry"}
          {skinRatio < 0.15 && "Place skin inside scanner"}

        </div>

        {/* Live Prediction */}

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
          className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded transition"
        >
          Upload Image
        </button>

      )}

    </div>

  )

}