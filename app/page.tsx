"use client"

import NavBar from "./components/NavBar"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-white">

      <NavBar title="Skin Disease Detector" />

      <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">

        {/* ========== Desktop Layout ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* ================= LEFT SIDE ================= */}
          <div className="text-center lg:text-left">

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 leading-tight">
              AI-Powered <br className="hidden lg:block" />
              <span className="text-blue-600">
                Skin Disease Detection
              </span>
            </h1>

            <p className="mt-6 text-slate-600 text-base md:text-lg max-w-xl mx-auto lg:mx-0">
              Upload a skin image and receive instant AI-powered analysis
              for common dermatological conditions.
            </p>

            <Link
              href="/predict"
              className="inline-block mt-8 bg-gradient-to-r from-blue-600 to-blue-800 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              Get Started
            </Link>

            {/* Conditions row */}
            <div className="mt-12 grid grid-cols-4 gap-6 max-w-md mx-auto lg:mx-0">
              {[
                { name: "Acne", color: "bg-red-100" },
                { name: "Eczema", color: "bg-yellow-100" },
                { name: "Psoriasis", color: "bg-pink-100" },
                { name: "Melanoma", color: "bg-gray-300" },
              ].map((item) => (
                <div key={item.name} className="text-center">
                  <div className={`w-14 h-14 ${item.color} rounded-full mx-auto mb-2 shadow-sm`} />
                  <div className="text-xs text-slate-600 font-medium">
                    {item.name}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* ================= RIGHT SIDE ================= */}
          <div className="hidden lg:flex justify-center">

            <div className="relative bg-white p-8 rounded-3xl shadow-2xl w-[420px]">

              {/* Soft Glow */}
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-40"></div>

              <div className="relative">

                <div className="mx-auto w-56 h-48 bg-gradient-to-br from-blue-100 to-pink-100 rounded-2xl flex items-center justify-center">
                  <svg
                    width="80"
                    height="80"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="#2563eb"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M8 14s1.5-2 4-2 4 2 4 2"
                      stroke="#ef4444"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-500">
                    Secure · Fast · AI Powered
                  </p>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* ========== Mobile Illustration Card ========== */}
        <div className="lg:hidden mt-16">

          <div className="bg-white rounded-3xl shadow-xl p-6 text-center">

            <div className="mx-auto w-40 h-36 bg-gradient-to-br from-blue-100 to-pink-100 rounded-2xl flex items-center justify-center">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#2563eb"
                  strokeWidth="1.5"
                />
                <path
                  d="M8 14s1.5-2 4-2 4 2 4 2"
                  stroke="#ef4444"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <p className="mt-4 text-sm text-slate-500">
              Get instant results for common skin conditions
            </p>

          </div>

        </div>

      </main>
    </div>
  )
}