"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { predictImage } from "@/app/lib/api"

interface UploadBoxProps {
  onSwitchToCamera?: () => void
}

export default function UploadBox({ onSwitchToCamera }: UploadBoxProps) {

  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [qualityLoading, setQualityLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // quick helper to format bytes
  const formatBytes = (bytes: number, inKB = false) => {
    if (inKB) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  /**
   * Simple blur detection using the variance of the Laplacian method.
   * We draw the image to a small canvas, convert to grayscale, apply the
   * Laplacian kernel, then compute variance. A low variance means the image
   * is relatively flat (i.e. blurry). Threshold is tuned empirically.
   */
  const isImageBlurry = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")!
        const w = 100
        const h = Math.round((img.height / img.width) * 100)
        canvas.width = w
        canvas.height = h
        ctx.drawImage(img, 0, 0, w, h)
        const imageData = ctx.getImageData(0, 0, w, h)
        const data = imageData.data
        const gray: number[] = []
        for (let i = 0; i < data.length; i += 4) {
          gray.push((data[i] + data[i + 1] + data[i + 2]) / 3)
        }
        let sum = 0
        let sum2 = 0
        const stride = w
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = y * stride + x
            const val =
              8 * gray[idx] -
              gray[idx - 1] -
              gray[idx + 1] -
              gray[idx - stride] -
              gray[idx + stride] -
              gray[idx - stride - 1] -
              gray[idx - stride + 1] -
              gray[idx + stride - 1] -
              gray[idx + stride + 1]
            sum += val
            sum2 += val * val
          }
        }
        const n = (w - 2) * (h - 2)
        const variance = sum2 / n - (sum / n) * (sum / n)
        // threshold approx 100; tweak as needed
        resolve(variance < 100)
      }
      img.onerror = () => resolve(true)
      img.src = URL.createObjectURL(file)
    })
  }

  const handleFile = async (f: File) => {
    if (!f.type.startsWith("image/")) {
      setError("Please upload a valid image file.")
      return
    }

    if (f.size > 5 * 1024 * 1024) {
      setError(`Maximum file size is 5MB (${formatBytes(f.size, true)}).`)
      return
    }

    // perform blur check
    setQualityLoading(true)
    setError(null)
    const blurry = await isImageBlurry(f)
    setQualityLoading(false)
    if (blurry) {
      setError("Image appears too blurry. Please upload a clearer photo.")
      return
    }

    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError(null)
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const clearImage = () => {
    setFile(null)
    setPreview(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  const analyze = async () => {
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const result = await predictImage(file)

      sessionStorage.setItem("lastPrediction", JSON.stringify(result))
      if (preview) sessionStorage.setItem("lastPreview", preview)

      await new Promise(r => setTimeout(r, 1200))
      router.push("/result")

    } catch {
      setError("Analysis failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

        {/* ================= LEFT - IMAGE ================= */}
        <div className="bg-white rounded-3xl shadow-xl p-6 lg:p-8">

          <div
            onClick={() => !preview && inputRef.current?.click()}
            className={`
              relative w-full rounded-3xl overflow-hidden
              ${preview
                ? "border border-slate-200"
                : "border-2 border-dashed border-blue-300 hover:border-blue-500"}
              bg-slate-50
              transition-all duration-300
              flex items-center justify-center
              cursor-pointer
              aspect-[4/3] lg:aspect-[16/10]
            `}
          >
            {preview ? (
              <>
                {/* AUTO ADJUST IMAGE */}
                <img
                  src={preview}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain"
                />

                {/* Size info (MB and KB) */}
                {file && (
                  <div className="absolute bottom-4 left-4 text-xs text-slate-500 bg-white/80 px-2 py-1 rounded">
                    {formatBytes(file.size)} ({formatBytes(file.size, true)})
                  </div>
                )}

                {/* Clear Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    clearImage()
                  }}
                  className="absolute top-4 right-4 w-9 h-9 bg-white/90 backdrop-blur-md rounded-full shadow flex items-center justify-center text-slate-600 hover:text-red-500 transition"
                >
                  ✕
                </button>
              </>
            ) : (
              <div className="text-center px-6">
                <span className="material-icons" style={{ fontSize: "64px", color: "#2563eb" }}>science</span>
                <div className="mb-4"></div>
                <p className="text-lg font-semibold text-slate-700">
                  Drag & Drop Skin Image
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  or click to browse files
                </p>
                <p className="text-xs text-slate-400 mt-4">
                  JPG, PNG, WEBP — Max 5MB
                </p>
              </div>
            )}

            {/* overlay during quality check */}
            {qualityLoading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="ml-3 text-blue-600 font-semibold">
                  Checking image quality...
                </span>
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={onInputChange}
            className="hidden"
          />
        </div>

        {/* ================= RIGHT - INFO ================= */}
        <div className="flex flex-col gap-8">

          {/* Info Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-xs tracking-widest font-bold text-blue-600 mb-6 uppercase">
              How It Works
            </h3>

            <div className="space-y-6 text-slate-600">

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
                  1
                </div>
                Upload a clear image of the affected area.
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
                  2
                </div>
                AI analyzes patterns using deep learning.
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
                  3
                </div>
                Receive a detailed AI-generated report.
              </div>

            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={analyze}
            disabled={!file || loading || qualityLoading}
            className={
              `w-full py-5 rounded-2xl font-bold text-lg text-white
              transition-all duration-300
              ${file && !loading && !qualityLoading
                ? "bg-gradient-to-r from-blue-600 to-blue-800 hover:-translate-y-1 hover:shadow-xl"
                : "bg-slate-300 cursor-not-allowed"}
            `}
          >
            {loading
              ? "Analyzing..."
              : qualityLoading
              ? "Checking quality..."
              : "Analyze Skin Image"}
          </button>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl">
              {error}
            </div>
          )}

          {/* camera switch link */}
          {onSwitchToCamera && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onSwitchToCamera}
                className="text-blue-600 hover:underline text-sm"
              >
                Use live camera instead
              </button>
            </div>
          )}

        </div>

      </div>

      {/* ================= LOADING OVERLAY ================= */}
      {loading && (
        <div className="fixed inset-0 bg-gradient-to-b from-blue-50/95 to-white/95 backdrop-blur-sm flex items-center justify-center z-50">
          <style>{`
            @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
            @keyframes spin-slow { to { transform: rotate(360deg); } }
            @keyframes pulse-icon { 0%, 100% { opacity: 0.6; scale: 1; } 50% { opacity: 1; scale: 1.05; } }
            @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
            .lab-spinner { animation: spin-slow 2s linear infinite; }
            .pulse-dot { animation: pulse-icon 1.5s ease-in-out infinite; }
            .float-icon { animation: float 3s ease-in-out infinite; }
            .material-icons { font-family: 'Material Icons'; font-weight: normal; font-style: normal; font-size: 28px; display: inline-flex; align-items: center; justify-content: center; user-select: none; }
          `}</style>

          <div className="flex flex-col items-center gap-8 max-w-md">
            
            {/* Animated Lab Icons Container */}
            <div className="relative w-28 h-28">
              {/* Center spinner ring */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 border-4 border-blue-200 border-t-blue-600 rounded-full lab-spinner"></div>
              </div>

              {/* Orbiting icons */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Microscope icon (top) */}
                <div
                  className="absolute w-8 h-8 flex items-center justify-center lab-spinner"
                  style={{
                    top: "-8px",
                    animation: "spin-slow 2s linear infinite",
                  }}
                >
                  <span className="material-icons text-blue-600">science</span>
                </div>

                {/* Test tube icon (right) */}
                <div
                  className="absolute w-8 h-8 flex items-center justify-center lab-spinner"
                  style={{
                    right: "-8px",
                    animation: "spin-slow 2s linear infinite reverse",
                  }}
                >
                  <span className="material-icons text-blue-600">biotech</span>
                </div>

                {/* Beaker icon (bottom) */}
                <div
                  className="absolute w-8 h-8 flex items-center justify-center lab-spinner"
                  style={{
                    bottom: "-8px",
                    animation: "spin-slow 2s linear infinite",
                  }}
                >
                  <span className="material-icons text-blue-600">flask</span>
                </div>

                {/* Center pulse */}
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full pulse-dot"></div>
              </div>
            </div>

            {/* Text Content */}
            <div className="text-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                Analyzing Skin Sample
              </h2>
              <p className="text-slate-600 font-medium mb-4">
                Running AI diagnosis...
              </p>

              {/* Progress steps */}
              <div className="space-y-2 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full pulse-dot"></span>
                  <span>Processing image features</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-blue-400 rounded-full pulse-dot" style={{ animationDelay: "0.3s" }}></span>
                  <span>Comparing with trained models</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-blue-300 rounded-full pulse-dot" style={{ animationDelay: "0.6s" }}></span>
                  <span>Generating confidence score</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-6">
                This usually takes 5-10 seconds...
              </p>
            </div>
          </div>
        </div>
      )}

    </>
  )
}