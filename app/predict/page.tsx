"use client"

import UploadBox from "../components/UploadBox"
import CameraCapture from "../components/CameraCapture"
import Link from "next/link"
import NavBar from "../components/NavBar"
import { useState } from "react"

export default function PredictPage() {
  const [mode, setMode] = useState<"upload" | "camera">("upload")

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-white pt-24">
      <NavBar
        title="Skin Disease Detector"
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/predict", label: "Analysis" },
        ]}
      />

      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* Header with mode toggle */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md text-blue-600 hover:bg-blue-600 hover:text-white transition"
          >
            ←
          </Link>

          <div className="flex flex-col items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
              {mode === "upload" ? "Upload Skin Image" : "Capture Skin Image"}
            </h1>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setMode("upload")}
                className={`px-3 py-1 rounded-full text-sm ${
                  mode === "upload"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-blue-600 border border-blue-200"
                }`}
              >
                Upload
              </button>
              <button
                onClick={() => setMode("camera")}
                className={`px-3 py-1 rounded-full text-sm ${
                  mode === "camera"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-blue-600 border border-blue-200"
                }`}
              >
                Camera
              </button>
            </div>
          </div>

          <div className="w-10" />
        </div>

        {/* content area */}
        {mode === "upload" ? (
          <UploadBox onSwitchToCamera={() => setMode("camera")} />
        ) : (
          <CameraCapture onFallback={() => setMode("upload")} onResult={() => {}} />
        )}

      </div>
    </div>
  )
}