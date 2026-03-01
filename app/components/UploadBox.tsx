"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { predictImage } from "@/app/lib/api"

export default function UploadBox() {

  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) {
      setError("Please upload a valid image file.")
      return
    }

    if (f.size > 5 * 1024 * 1024) {
      setError("Maximum file size is 5MB.")
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
                <div className="text-5xl mb-4">🔬</div>
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
            disabled={!file || loading}
            className={`
              w-full py-5 rounded-2xl font-bold text-lg text-white
              transition-all duration-300
              ${file && !loading
                ? "bg-gradient-to-r from-blue-600 to-blue-800 hover:-translate-y-1 hover:shadow-xl"
                : "bg-slate-300 cursor-not-allowed"}
            `}
          >
            {loading ? "Analyzing..." : "Analyze Skin Image"}
          </button>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl">
              {error}
            </div>
          )}

        </div>

      </div>

      {/* ================= LOADING OVERLAY ================= */}
      {loading && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-slate-800">
                Preparing AI Report
              </h2>
              <p className="text-sm text-slate-500">
                This usually takes a few seconds...
              </p>
            </div>
          </div>
        </div>
      )}

    </>
  )
}