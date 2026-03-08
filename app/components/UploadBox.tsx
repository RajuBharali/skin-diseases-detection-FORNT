"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { predictImage } from "@/app/lib/api"
import { PredictionResponse } from "@/app/types/prediction"

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

  /* -----------------------------
     Helper: File size format
  -----------------------------*/
  const formatBytes = (bytes: number) =>
    `${(bytes / 1024 / 1024).toFixed(2)} MB`

  /* -----------------------------
     Blur Detection
  -----------------------------*/
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

        const data = ctx.getImageData(0,0,w,h).data

        const gray:number[] = []

        for(let i=0;i<data.length;i+=4){
          gray.push((data[i]+data[i+1]+data[i+2])/3)
        }

        let sum=0,sum2=0
        const stride=w

        for(let y=1;y<h-1;y++){
          for(let x=1;x<w-1;x++){

            const idx=y*stride+x

            const val =
              8*gray[idx]
              -gray[idx-1]
              -gray[idx+1]
              -gray[idx-stride]
              -gray[idx+stride]

            sum+=val
            sum2+=val*val
          }
        }

        const n=(w-2)*(h-2)
        const variance=sum2/n-(sum/n)*(sum/n)

        resolve(variance < 100)

      }

      img.onerror=()=>resolve(true)
      img.src=URL.createObjectURL(file)

    })

  }

  /* -----------------------------
     Handle Upload
  -----------------------------*/
  const handleFile = async (f:File) => {

    if(!f.type.startsWith("image/")){
      setError("Please upload an image.")
      return
    }

    if(f.size > 5*1024*1024){
      setError("Image must be below 5MB.")
      return
    }

    setQualityLoading(true)
    setError(null)

    const blurry = await isImageBlurry(f)

    setQualityLoading(false)

    if(blurry){
      setError("Image is blurry. Upload a clearer photo.")
      return
    }

    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const onInputChange=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0]
    if(f) handleFile(f)
  }

  const clearImage=()=>{
    setFile(null)
    setPreview(null)
    setError(null)
    if(inputRef.current) inputRef.current.value=""
  }

  /* -----------------------------
     AI Analyze
  -----------------------------*/
  const analyze = async () => {

    if(!file) return

    setLoading(true)
    setError(null)

    try{

      const result:PredictionResponse = await predictImage(file)

      const decision = result.final_decision

      /* Save for result page */

      sessionStorage.setItem(
        "lastPrediction",
        JSON.stringify(result)
      )

      if(preview){
        sessionStorage.setItem("lastPreview", preview)
      }

      /* Small delay for UX */

      await new Promise(r=>setTimeout(r,1000))

      router.push("/result")

    }catch(err){

      console.error(err)
      setError("AI analysis failed.")

    }finally{

      setLoading(false)

    }

  }

  /* -----------------------------
     UI
  -----------------------------*/

  return (

  <div className="grid lg:grid-cols-2 gap-14 items-start">

  {/* IMAGE UPLOAD */}

  <div className="bg-white rounded-3xl shadow-xl p-8">

    <div
      onClick={()=>!preview && inputRef.current?.click()}
      className={`relative aspect-[4/3] rounded-3xl flex items-center justify-center cursor-pointer
      ${preview ? "border border-slate-200":"border-2 border-dashed border-blue-300 hover:border-blue-500"}
      bg-slate-50`}
    >

      {preview ? (

      <>
        <img
          src={preview}
          alt="preview"
          className="max-w-full max-h-full object-contain"
        />

        <button
          onClick={(e)=>{
            e.stopPropagation()
            clearImage()
          }}
          className="absolute top-4 right-4 bg-white shadow rounded-full w-8 h-8"
        >
          ✕
        </button>

      </>

      ) : (

      <div className="text-center">

        <div className="text-6xl text-blue-600 mb-3">🧬</div>

        <p className="font-semibold">
          Upload Skin Image
        </p>

        <p className="text-sm text-slate-400">
          JPG, PNG — max 5MB
        </p>

      </div>

      )}

      {qualityLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
          Checking quality...
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


  {/* INFO + ACTION */}

  <div className="flex flex-col gap-8">

    <div className="bg-white rounded-2xl shadow-lg p-8">

      <h3 className="font-bold text-blue-600 mb-6 uppercase text-xs tracking-widest">
        How AI Works
      </h3>

      <div className="space-y-5 text-slate-600">

        <div>1. Upload skin image</div>
        <div>2. AI detects lesion</div>
        <div>3. Multi-stage diagnosis</div>

      </div>

    </div>


    {/* ANALYZE BUTTON */}

    <button
      onClick={analyze}
      disabled={!file || loading || qualityLoading}
      className={`py-5 rounded-2xl text-white font-bold
      ${file ? "bg-blue-600 hover:bg-blue-700":"bg-gray-300"}`}
    >

      {loading ? "Analyzing..." : "Analyze Skin Image"}

    </button>


    {error && (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl">
        {error}
      </div>
    )}


    {onSwitchToCamera && (

      <button
        onClick={onSwitchToCamera}
        className="text-blue-600 text-sm"
      >
        Use Camera Instead
      </button>

    )}

  </div>

  </div>

  )

}