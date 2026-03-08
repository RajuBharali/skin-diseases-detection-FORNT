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
  const [autoCaptured, setAutoCaptured] = useState(false)

  /* =============================
     Start Camera
  ==============================*/

  useEffect(() => {

    startCamera()

    return () => stopCamera()

  }, [])

  /* =============================
     Scanner Loop
  ==============================*/

  useEffect(() => {

    if (!cameraReady || autoCaptured) return

    const interval = setInterval(() => {
      scanFrame()
    }, 2000)

    return () => clearInterval(interval)

  }, [cameraReady, autoCaptured])


  /* =============================
     Camera Controls
  ==============================*/

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
          width: { ideal: 640 },
          height: { ideal: 480 }
        }

      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

    } catch {

      setError("Unable to access camera.")

    }

  }

  /* =============================
     Scan Frame (Auto Detection)
  ==============================*/

  async function scanFrame() {

    if (!videoRef.current || !canvasRef.current) return
    if (loading || autoCaptured) return

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

        const result: PredictionResponse = await predictImage(file)

        setPrediction(result)

        const confidence =
          result?.final_decision?.confidence_percent || 0

        /* AUTO DETECT RESULT */

        if (confidence > 85 && !autoCaptured) {

          setAutoCaptured(true)

          stopCamera()

          const preview = canvas.toDataURL("image/jpeg")

          sessionStorage.setItem(
            "lastPrediction",
            JSON.stringify(result)
          )

          sessionStorage.setItem(
            "lastPreview",
            preview
          )

          onResult(result)

          router.push("/result")

        }

      } catch (err) {

        console.error("Prediction failed:", err)

      }

    }, "image/jpeg", 0.7)

  }


  /* =============================
     Manual Capture
  ==============================*/

  async function capture() {

    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    canvas.width = 224
    canvas.height = 224

    ctx.drawImage(video, 0, 0, 224, 224)

    const preview = canvas.toDataURL("image/jpeg")

    canvas.toBlob(async blob => {

      if (!blob) return

      setLoading(true)

      try {

        const file = new File([blob], "capture.jpg", {
          type: "image/jpeg"
        })

        const result: PredictionResponse = await predictImage(file)

        sessionStorage.setItem(
          "lastPrediction",
          JSON.stringify(result)
        )

        sessionStorage.setItem(
          "lastPreview",
          preview
        )

        onResult(result)

        stopCamera()

        router.push("/result")

      } catch {

        setError("Prediction failed.")

      }

      setLoading(false)

    }, "image/jpeg", 0.7)

  }


  /* =============================
     UI
  ==============================*/

  return (

    <div className="flex flex-col items-center gap-5 w-full">

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {/* Camera */}

      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-xl border border-gray-200">

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onLoadedMetadata={() => setCameraReady(true)}
          className="w-full h-[320px] object-cover bg-black"
        />

        {/* Scanner Overlay */}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

          <div className="relative w-44 h-44 border-2 border-green-400 rounded-xl">

            {/* Corners */}

            <div className="absolute -top-1 -left-1 w-5 h-5 border-l-4 border-t-4 border-green-400"></div>
            <div className="absolute -top-1 -right-1 w-5 h-5 border-r-4 border-t-4 border-green-400"></div>
            <div className="absolute -bottom-1 -left-1 w-5 h-5 border-l-4 border-b-4 border-green-400"></div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 border-r-4 border-b-4 border-green-400"></div>

            {/* Scan line */}

            <div className="absolute left-0 right-0 animate-scan"></div>

          </div>

        </div>


        {/* Live Prediction */}

        {prediction?.final_decision && (

          <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur text-white rounded-lg px-3 py-2 shadow">

            <div className="flex justify-between text-sm font-semibold">

              <span>
                {prediction.final_decision.result}
              </span>

              <span className="text-green-300">
                {prediction.final_decision.confidence_percent.toFixed(1)}%
              </span>

            </div>

            <div className="text-xs opacity-80 mt-1">

              {prediction.final_decision.medical_advice}

            </div>

          </div>

        )}

      </div>


      <canvas ref={canvasRef} className="hidden" />


      {/* Buttons */}

      <div className="flex gap-3">

        <button
          onClick={capture}
          disabled={loading || !cameraReady}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow"
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