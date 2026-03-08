"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PredictionResponse } from "@/app/types/prediction"

/* ---------------------------
   Animated Counter
----------------------------*/

function Counter({ value }: { value: number }) {

  const [num, setNum] = useState(0)

  useEffect(() => {

    let start = 0
    const step = value / 60

    const i = setInterval(() => {

      start += step

      if (start >= value) {
        setNum(value)
        clearInterval(i)
      } else {
        setNum(start)
      }

    }, 16)

    return () => clearInterval(i)

  }, [value])

  return <>{num.toFixed(1)}</>

}


/* ---------------------------
   Probability Bar
----------------------------*/

function ProbBar({ label, value }: { label: string, value: number }) {

  return (

    <div className="mb-3">

      <div className="flex justify-between text-sm font-semibold mb-1">
        <span>{label}</span>
        <span>{(value * 100).toFixed(1)}%</span>
      </div>

      <div className="h-2 bg-slate-200 rounded overflow-hidden">

        <div
          className="h-full bg-blue-600"
          style={{ width: `${value * 100}%` }}
        />

      </div>

    </div>

  )

}


/* ---------------------------
   Main Page
----------------------------*/

export default function ResultPage() {

  const router = useRouter()

  const [data, setData] = useState<PredictionResponse | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {

    const raw = sessionStorage.getItem("lastPrediction")
    const prev = sessionStorage.getItem("lastPreview")

    if (!raw) {
      router.push("/predict")
      return
    }

    const parsed: PredictionResponse = JSON.parse(raw)

    setData(parsed)

    if (prev) setPreview(prev)

  }, [router])


  if (!data) return null

  const decision = data.final_decision
  const pct = decision.confidence_percent

  return (

    <div className="min-h-screen bg-slate-50">

      {/* NAVBAR */}

      <div className="border-b bg-white">

        <div className="max-w-6xl mx-auto flex justify-between items-center p-4">

          <div className="font-bold text-lg text-blue-600">
            DermAI Scanner
          </div>

          <Link
            href="/predict"
            className="text-sm text-blue-600 hover:underline"
          >
            New Scan
          </Link>

        </div>

      </div>


      {/* MAIN */}

      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 p-8">


        {/* LEFT COLUMN */}

        <div className="space-y-6">


          {/* RESULT CARD */}

          <div className="bg-white rounded-2xl shadow p-8">

            <h2 className="text-sm uppercase tracking-widest text-slate-400 mb-3">
              AI Diagnosis
            </h2>

            <h1 className="text-4xl font-bold text-blue-600 mb-2">
              {decision.result}
            </h1>

            <p className="text-slate-500 mb-6">
              AI detected possible signs of {decision.result.toLowerCase()}.
            </p>

            <div className="text-5xl font-bold text-slate-800">
              <Counter value={pct} />%
            </div>

            <p className="text-sm text-slate-400 mt-2">
              Confidence Score
            </p>

          </div>


          {/* IMAGE CARD */}

          <div className="bg-white rounded-2xl shadow p-6">

            <h3 className="font-semibold mb-4">
              Submitted Image
            </h3>

            {preview ? (
              <img
                src={preview}
                className="rounded-lg w-full"
              />
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-400">
                No preview available
              </div>
            )}

          </div>


          {/* PROBABILITY BREAKDOWN */}

          {data.stage3 && (

            <div className="bg-white rounded-2xl shadow p-6">

              <h3 className="font-semibold mb-4">
                AI Probability Breakdown
              </h3>

              {Object.entries(data.stage3).map(([k, v]) => (
                <ProbBar key={k} label={k} value={v} />
              ))}

            </div>

          )}

        </div>


        {/* RIGHT COLUMN */}

        <div className="space-y-6">


          {/* AI INFO */}

          <div className="bg-white rounded-2xl shadow p-6">

            <h3 className="font-semibold mb-4">
              AI Analysis Details
            </h3>

            <div className="space-y-3 text-sm">

              <div className="flex justify-between">
                <span className="text-slate-500">Detection Stage</span>
                <span className="font-semibold">
                  Stage {decision.stage}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Condition Type</span>
                <span className="font-semibold">
                  {decision.type}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Confidence</span>
                <span className="font-semibold">
                  {pct.toFixed(1)}%
                </span>
              </div>

            </div>

          </div>


          {/* MEDICAL ADVICE */}

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">

            <h3 className="font-semibold mb-2">
              Medical Advice
            </h3>

            <p className="text-sm text-slate-700">
              {decision.medical_advice}
            </p>

          </div>


          {/* RECOMMENDATIONS */}

          <div className="bg-white rounded-2xl shadow p-6">

            <h3 className="font-semibold mb-4">
              Recommended Actions
            </h3>

            <ul className="space-y-3 text-sm text-slate-600">

              <li>🩺 Consult a dermatologist for proper diagnosis</li>
              <li>💧 Keep skin moisturized regularly</li>
              <li>🚫 Avoid scratching the affected area</li>
              <li>🧴 Use gentle fragrance-free skincare</li>

            </ul>

          </div>


          {/* DISCLAIMER */}

          <div className="text-xs text-slate-400 leading-relaxed">

            ⚠️ This AI analysis is for informational purposes only and
            does not replace professional medical advice. Always consult
            a qualified healthcare provider.

          </div>

        </div>

      </div>

    </div>

  )

}