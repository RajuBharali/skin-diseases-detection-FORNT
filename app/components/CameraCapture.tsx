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

  const [loading, setLoading] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  useEffect(() => {
    requestCameraAccess()

    return () => stopCamera()
  }, [])

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  async function requestCameraAccess() {
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

    } catch (err: any) {

      if (
        err?.name === "NotAllowedError" ||
        err?.name === "PermissionDeniedError"
      ) {
        setPermissionDenied(true)
        setError("Camera permission denied.")
      } else {
        setError("Camera access failed.")
      }
    }
  }

  async function capture() {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    ctx.drawImage(video, 0, 0)

    canvas.toBlob(async blob => {

      if (!blob) return

      setLoading(true)

      try {
        const file = new File([blob], "capture.jpg", { type: "image/jpeg" })

        const result = await predictImage(file)

        sessionStorage.setItem("lastPrediction", JSON.stringify(result))

        onResult(result)

        router.push("/result")

      } catch (e) {
        console.error(e)
      }

      setLoading(false)

    }, "image/jpeg")
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full">

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {/* Camera Container */}

      <div className="relative w-full max-w-md rounded-xl overflow-hidden">

        {/* VIDEO */}

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onLoadedMetadata={() => setCameraReady(true)}
          className="w-full h-auto bg-black"
        />

        {/* SCANNER OVERLAY */}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

          {/* Focus Box */}

          <div className="relative w-56 h-56 border-2 border-green-400 rounded-lg shadow-lg">

            {/* Corners */}

            <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-green-400"></div>
            <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-green-400"></div>
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-green-400"></div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-green-400"></div>

            {/* Scan Line */}

            <div className="absolute left-0 right-0 h-[2px] bg-green-400 animate-scan"></div>

          </div>

        </div>

      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* CAPTURE BUTTON */}

      <button
        onClick={capture}
        disabled={!cameraReady || loading}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "Capture & Analyze"}
      </button>

    </div>
  )
}