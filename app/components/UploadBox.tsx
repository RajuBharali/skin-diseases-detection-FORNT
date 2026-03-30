"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { predictImage } from "@/app/lib/api"
import Cropper from "react-easy-crop"
import { getCroppedImg } from "@/app/lib/cropImage"

interface UploadBoxProps {
  onSwitchToCamera?: () => void
}

export default function UploadBox({ onSwitchToCamera }: UploadBoxProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cropping State
  const [isCropping, setIsCropping] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [preCropImage, setPreCropImage] = useState<string | null>(null)

  const formatBytes = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  /* Handle file selection, opens cropper instead of setting to analyze */
  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) {
      setError("Please upload an image file.")
      return
    }

    const imgUrl = URL.createObjectURL(f)
    setPreCropImage(imgUrl)
    setIsCropping(true)
    setError(null)
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const clearImage = () => {
    setFile(null)
    setPreview(null)
    setPreCropImage(null)
    setError(null)
    setIsCropping(false)
    if (inputRef.current) inputRef.current.value = ""
  }

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  /* Finalize Crop and return to Preview Upload Box */
  const handleCropResult = async () => {
    if (!preCropImage || !croppedAreaPixels) return
    try {
      const croppedFile = await getCroppedImg(preCropImage, croppedAreaPixels)
      setFile(croppedFile)
      setPreview(URL.createObjectURL(croppedFile))
      setIsCropping(false) // Close cropper UI
    } catch (e) {
      console.error(e)
      setError("Failed to crop image.")
    }
  }

  /* Send real file directly to API */
  const analyze = async () => {
    if (!file) return
    setLoading(true)
    setError(null)

    try {
      const result = await predictImage(file)
      sessionStorage.setItem("lastPrediction", JSON.stringify(result))
      if (preview) {
        sessionStorage.setItem("lastPreview", preview)
      }
      router.push("/result")
    } catch {
      setError("Analysis failed. Please try again.")
    }

    setLoading(false)
  }

  // Render the Cropping UI exactly matching the screenshot reference
  if (isCropping && preCropImage) {
    return (
      <div className="flex flex-col items-center max-w-2xl mx-auto py-4 bg-white rounded-3xl w-full">
        <h2 className="text-2xl font-bold text-[#023b7a] mb-6">Let's crop the photo!</h2>
        
        <div className="relative w-full h-[300px] mb-8 bg-black rounded-lg overflow-hidden">
          <Cropper
            image={preCropImage}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        
        <div className="w-full max-w-md flex items-center gap-4 mb-8 text-[#00bcd4]">
          <button onClick={() => setZoom(Math.max(1, zoom - 0.2))} className="material-icons border border-[#00bcd4] p-0.5 rounded-full hover:bg-cyan-50">remove</button>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-[#00bcd4]"
          />
          <button onClick={() => setZoom(Math.min(3, zoom + 0.2))} className="material-icons border border-[#00bcd4] p-0.5 rounded-full hover:bg-cyan-50">add</button>
        </div>
        
        <button 
          onClick={handleCropResult}
          className="w-full max-w-md bg-[#00bcd4] hover:bg-[#00acc1] text-white font-bold py-4 rounded-xl shadow-[0_4px_15px_rgba(0,188,212,0.4)] transition-colors mb-4"
        >
          Crop Photo
        </button>
        
        <p className="text-xs text-slate-500 max-w-md text-center">
          Zoom in the skin mark in the center of the crop field. The photo should be in focus and free of foreign objects.
        </p>

        <button onClick={clearImage} className="mt-8 text-slate-400 text-sm hover:underline">Cancel Upload</button>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start p-4">

        {/* LEFT IMAGE UPLOAD */}
        <div className="bg-slate-50 rounded-3xl border-2 border-dashed border-blue-200 p-2 overflow-hidden shadow-inner group">
          <div
            onClick={() => !preview && inputRef.current?.click()}
            className={`
              relative w-full rounded-2xl overflow-hidden
              ${preview
                ? "bg-black"
                : "bg-white hover:bg-blue-50"}
              flex items-center justify-center cursor-pointer
              aspect-[4/3] transition-colors shadow-sm
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
                  <div className="absolute bottom-4 left-4 text-[10px] font-bold text-slate-800 bg-white/90 backdrop-blur px-3 py-1.5 rounded uppercase shadow-lg">
                    {formatBytes(file.size)}
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    clearImage()
                  }}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow-xl flex items-center justify-center text-slate-700 hover:text-red-500 hover:scale-105 transition-all"
                >
                  <span className="material-icons text-xl">delete</span>
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setPreCropImage(preview)
                    setIsCropping(true)
                  }}
                  className="absolute bottom-4 right-4 bg-[#00bcd4] hover:bg-[#00acc1] text-white px-4 py-2 font-bold rounded shadow-lg flex items-center gap-2 transition-colors text-sm"
                >
                  <span className="material-icons text-[18px]">crop</span> Crop File
                </button>
              </>
            ) : (
              <div className="text-center px-6 flex flex-col items-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-icons text-4xl text-blue-600">add_photo_alternate</span>
                </div>
                <h3 className="text-xl font-extrabold text-[#023b7a]">Select Image</h3>
                <p className="text-sm text-slate-500 mt-2 font-medium">Click to browse your device files.</p>
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
        <div className="flex flex-col gap-6 pt-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm">
            <h3 className="text-xs tracking-widest font-extrabold text-[#023b7a] mb-6 uppercase">How to Get Results</h3>
            <div className="space-y-6 text-slate-600 font-medium text-sm">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-base shrink-0 border border-blue-100 shadow-inner">1</div>
                <p>Upload a focused skin image natively or scan via camera.</p>
              </div>
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center font-bold text-base shrink-0 border border-cyan-100 shadow-inner">2</div>
                <p>Use the cropping tool to isolate the specific bump or mole.</p>
              </div>
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-base shrink-0 border border-indigo-100 shadow-inner">3</div>
                <p>Our neural network immediately evaluates the risk profile.</p>
              </div>
            </div>
          </div>

          <button
            onClick={analyze}
            disabled={!file || loading}
            className={`w-full py-5 rounded-2xl font-extrabold text-lg text-white transition-all duration-300 flex items-center justify-center gap-3 ${
              file && !loading
                ? "bg-[#ff1e38] hover:bg-[#e00020] hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(255,30,56,0.4)] cursor-pointer"
                : "bg-slate-300 cursor-not-allowed text-slate-500"
            }`}
          >
             {loading ? <span className="material-icons animate-spin">refresh</span> : null}
             {loading ? "ANALYZING TISSUE..." : "ANALYZE TISSUE NOW"}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center gap-2 text-sm font-bold shadow-sm">
              <span className="material-icons text-red-500">error_outline</span> {error}
            </div>
          )}

          {onSwitchToCamera && (
            <div className="text-center mt-2">
              <button onClick={onSwitchToCamera} className="text-blue-500 hover:text-[#023b7a] font-bold text-sm tracking-wide transition-colors uppercase border-b border-transparent hover:border-[#023b7a]">
                Or scan via Live Camera →
              </button>
            </div>
          )}
        </div>

      </div>
    </>
  )
}