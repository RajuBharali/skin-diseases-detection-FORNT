import { PredictionResponse } from "@/app/types/prediction"
import ProbabilityBar from "./ProbabilityBar"
import RiskBadge from "./RiskBadge"

export default function ResultCard({ data }: { data: PredictionResponse }) {
  const { final_decision } = data

  return (
    <div className="bg-white shadow-xl rounded-xl p-4 mt-6 w-full max-w-sm mx-auto">
      <div className="bg-gray-50 rounded-md p-3 mb-4">
        <div className="text-sm text-gray-700 font-semibold">Analysis Complete!</div>
        <div className="mt-1 text-base text-gray-600">You may have</div>
        <div className="mt-2 text-2xl font-bold text-orange-600">{final_decision.result}</div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <div className="text-sm text-gray-600">Confidence</div>
          <ProbabilityBar value={final_decision.confidence_percent / 100} />
          <div className="text-sm text-gray-700 mt-1">{final_decision.confidence_percent}%</div>
        </div>
      </div>

      <div className="bg-white rounded-md p-3 shadow-inner mb-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 text-sm text-gray-700">
            <div className="font-semibold mb-2">Recommended Action:</div>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Consult a Dermatologist</li>
              <li>Keep skin moisturized</li>
              <li>Avoid scratching</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button className="bg-blue-600 text-white px-5 py-2 rounded-lg">Learn More</button>
      </div>
    </div>
  )
}