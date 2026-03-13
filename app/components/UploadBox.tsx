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

  const [file,setFile] = useState<File | null>(null)
  const [preview,setPreview] = useState<string | null>(null)
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState<string | null>(null)

  const formatBytes = (bytes:number)=>{
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  /* Handle file selection */

  const handleFile = (f:File)=>{

    if(!f.type.startsWith("image/")){
      setError("Please upload an image file.")
      return
    }

    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError(null)

  }

  const onInputChange = (e:React.ChangeEvent<HTMLInputElement>)=>{
    const f = e.target.files?.[0]
    if(f) handleFile(f)
  }

  const clearImage = ()=>{
    setFile(null)
    setPreview(null)
    setError(null)
    if(inputRef.current) inputRef.current.value=""
  }

  /* Send real file directly */

  const analyze = async ()=>{

    if(!file) return

    setLoading(true)
    setError(null)

    try{

      const result = await predictImage(file)

      sessionStorage.setItem(
        "lastPrediction",
        JSON.stringify(result)
      )

      if(preview){
        sessionStorage.setItem("lastPreview",preview)
      }

      router.push("/result")

    }catch{

      setError("Analysis failed. Please try again.")

    }

    setLoading(false)

  }

  return (

    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

        {/* LEFT IMAGE UPLOAD */}

        <div className="bg-white rounded-3xl shadow-xl p-6 lg:p-8">

          <div
            onClick={()=>!preview && inputRef.current?.click()}
            className={`
              relative w-full rounded-3xl overflow-hidden
              ${preview
                ? "border border-slate-200"
                : "border-2 border-dashed border-blue-300 hover:border-blue-500"}
              bg-slate-50 flex items-center justify-center cursor-pointer
              aspect-[4/3]
            `}
          >

            {preview ? (

              <>
                <img
                  src={preview}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain"
                />

                {file && (
                  <div className="absolute bottom-4 left-4 text-xs text-slate-500 bg-white/80 px-2 py-1 rounded">
                    {formatBytes(file.size)}
                  </div>
                )}

                <button
                  onClick={(e)=>{
                    e.stopPropagation()
                    clearImage()
                  }}
                  className="absolute top-4 right-4 w-9 h-9 bg-white rounded-full shadow flex items-center justify-center text-slate-600 hover:text-red-500"
                >
                  ✕
                </button>

              </>

            ) : (

              <div className="text-center px-6">

                <span
                  className="material-icons"
                  style={{fontSize:"64px",color:"#2563eb"}}
                >
                  science
                </span>

                <p className="text-lg font-semibold text-slate-700">
                  Upload Skin Image
                </p>

                <p className="text-sm text-slate-400 mt-2">
                  Click to browse files
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

        {/* RIGHT INFO */}

        <div className="flex flex-col gap-8">

          <div className="bg-white rounded-2xl shadow-lg p-8">

            <h3 className="text-xs tracking-widest font-bold text-blue-600 mb-6 uppercase">
              How It Works
            </h3>

            <div className="space-y-6 text-slate-600">

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
                  1
                </div>
                Upload skin image.
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
                  2
                </div>
                AI analyzes the image.
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
                  3
                </div>
                Receive diagnosis result.
              </div>

            </div>

          </div>

          {/* ANALYZE BUTTON */}

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

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl">
              {error}
            </div>
          )}

          {onSwitchToCamera && (
            <div className="mt-4 text-center">
              <button
                onClick={onSwitchToCamera}
                className="text-blue-600 hover:underline text-sm"
              >
                Use live camera instead
              </button>
            </div>
          )}

        </div>

      </div>
    </>
  )

}