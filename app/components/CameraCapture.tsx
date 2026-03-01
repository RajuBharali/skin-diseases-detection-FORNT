"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { predictImage } from "@/app/lib/api"
import { PredictionResponse } from "@/app/types/prediction"

interface Props {
  onResult: (data: PredictionResponse) => void
}

export default function CameraCapture({ onResult, onFallback }: Props & { onFallback?: () => void }) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  useEffect(() => {
    requestCameraAccess()

    return () => {
      // clean up video stream
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((t) => t.stop())
      }
    }
  }, [])

  async function requestCameraAccess() {
    setError(null)
    setPermissionDenied(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err: any) {
      console.error(err)
      if (err && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        setPermissionDenied(true)
        setError('Camera access was denied. Please allow access to continue.')
      } else {
        setError('Unable to access camera')
      }
    }
  }

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(async (blob) => {
      if (!blob) return
      setLoading(true)
      try {
        const result = await predictImage(new File([blob], "capture.jpg", { type: blob.type }))
        try {
          sessionStorage.setItem('lastPrediction', JSON.stringify(result))
          sessionStorage.removeItem('lastPreview')
        } catch (e) {
          // ignore
        }
        onResult(result)
        try {
          router.push('/result')
        } catch (e) {
          // ignore navigation errors
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }, "image/jpeg")
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {error && <p className="text-red-500">{error}</p>}
      {permissionDenied && (
        <div className="w-full max-w-md bg-yellow-50 border border-yellow-200 rounded p-4 text-center mb-4">
          <p className="text-sm text-yellow-800 mb-3">We need permission to use your camera.</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => requestCameraAccess()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Retry
            </button>
            <button
              onClick={() => onFallback?.()}
              className="px-4 py-2 bg-gray-200 rounded-md"
            >
              Use Upload Instead
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-3">If you denied access previously, open your browser site settings and allow camera access for this site.</p>
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full max-w-md rounded-lg bg-black"
      />
      <canvas ref={canvasRef} className="hidden" />
      <button
        onClick={capture}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        {loading ? "Capturing..." : "Capture & Analyze"}
      </button>
    </div>
  )
}
