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
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)

  useEffect(() => {
    requestCameraAccess()

    return () => {
      stopCamera()
    }
  }, [])

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  async function requestCameraAccess() {
    setError(null)
    setPermissionDenied(false)

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera API not supported in this browser.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // use rear camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err: any) {
      console.error(err)

      if (
        err?.name === "NotAllowedError" ||
        err?.name === "PermissionDeniedError"
      ) {
        setPermissionDenied(true)
        setError("Camera access was denied. Please allow camera permission.")
      } else if (
        err?.name === "NotFoundError" ||
        err?.name === "DevicesNotFoundError"
      ) {
        setError("No camera device found.")
      } else {
        setError("Unable to access camera.")
      }
    }
  }

  async function capture() {
    if (!videoRef.current || !canvasRef.current) return
    if (!cameraReady) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(async (blob) => {
      if (!blob) return

      setLoading(true)

      try {
        const file = new File([blob], "capture.jpg", { type: "image/jpeg" })

        const result = await predictImage(file)

        try {
          sessionStorage.setItem("lastPrediction", JSON.stringify(result))
          sessionStorage.removeItem("lastPreview")
        } catch {}

        onResult(result)

        router.push("/result")
      } catch (err) {
        console.error(err)
        setError("Prediction failed. Please try again.")
      } finally {
        setLoading(false)
      }
    }, "image/jpeg")
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">

      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}

      {permissionDenied && (
        <div className="w-full max-w-md bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">

          <p className="text-sm text-yellow-800 mb-3">
            Camera permission is required to capture an image.
          </p>

          <div className="flex justify-center gap-3">
            <button
              onClick={requestCameraAccess}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>

            <button
              onClick={() => onFallback?.()}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Upload Instead
            </button>
          </div>

          <p className="text-xs text-gray-600 mt-3">
            If permission was denied previously, enable camera access in
            browser site settings.
          </p>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onLoadedMetadata={() => setCameraReady(true)}
        className="w-full max-w-md rounded-lg bg-black"
      />

      <canvas ref={canvasRef} className="hidden" />

      <button
        onClick={capture}
        disabled={loading || !cameraReady}
        className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "Capture & Analyze"}
      </button>

    </div>
  )
}