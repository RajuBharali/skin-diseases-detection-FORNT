"use client"

import UploadBox from "../components/UploadBox"
import Link from "next/link"
import NavBar from "../components/NavBar"

export default function PredictPage() {
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

        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Link
            href="/"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md text-blue-600 hover:bg-blue-600 hover:text-white transition"
          >
            ←
          </Link>

          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            Upload Skin Image
          </h1>

          <div className="w-10" />
        </div>

        <UploadBox />

      </div>
    </div>
  )
}