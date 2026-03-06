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
  const [loading, setLoading] = useState(false)
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  useEffect(() => {
    if (!cameraReady) return

    const interval = setInterval(() => {
      scanFrame()
    }, 2000)

    return () => clearInterval(interval)

  }, [cameraReady])

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  async function startCamera() {
    try {

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

    } catch (err) {
      setError("Camera access failed")
    }
  }

  async function scanFrame() {

    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    const SIZE = 224

    canvas.width = SIZE
    canvas.height = SIZE

    ctx.drawImage(video, 0, 0, SIZE, SIZE)

    canvas.toBlob(async blob => {

      if (!blob) return

      try {

        const file = new File([blob], "frame.jpg", {
          type: "image/jpeg"
        })

        const result = await predictImage(file)

        setPrediction(result)

      } catch (err) {

        console.error(err)

      }

    }, "image/jpeg", 0.7)

  }

  async function capture() {

    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    canvas.width = 224
    canvas.height = 224

    ctx.drawImage(video, 0, 0, 224, 224)

    canvas.toBlob(async blob => {

      if (!blob) return

      setLoading(true)

      try {

        const file = new File([blob], "capture.jpg", {
          type: "image/jpeg"
        })

        const result = await predictImage(file)

        sessionStorage.setItem(
          "lastPrediction",
          JSON.stringify(result)
        )

        onResult(result)

        router.push("/result")

      } catch (err) {

        console.error(err)

      }

      setLoading(false)

    }, "image/jpeg", 0.7)

  }

  return (

    <div className="flex flex-col items-center gap-5 w-full">

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {/* Camera */}

      <div className="relative w-full max-w-md rounded-xl overflow-hidden shadow-lg">

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onLoadedMetadata={() => setCameraReady(true)}
          className="w-full bg-black"
        />

        {/* Scanner overlay */}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

          <div className="relative w-56 h-56 border-2 border-green-400 rounded-lg">

            <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-green-400"></div>
            <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-green-400"></div>
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-green-400"></div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-green-400"></div>

            <div className="absolute left-0 right-0 h-[2px] bg-green-400 animate-scan"></div>

          </div>

        </div>

        {/* Live AI result */}

        {prediction?.final_decision && (

          <div className="absolute bottom-3 left-3 bg-black/70 text-white text-sm px-3 py-2 rounded-lg">

            <div className="font-semibold">
              {prediction.final_decision.result}
            </div>

            <div className="text-xs opacity-80">
              {prediction.final_decision.confidence_percent.toFixed(1)}%
            </div>

            <div className="text-[11px] opacity-70 mt-1">
              {prediction.final_decision.medical_advice}
            </div>

          </div>

        )}

      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex gap-3">

        <button
          onClick={capture}
          disabled={loading || !cameraReady}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Capture & Analyze"}
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