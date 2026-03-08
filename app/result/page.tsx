"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// ─── Types ────────────────────────────────────────────────────────────────────
interface FinalDecision {
  result: string
  confidence_percent: number
}
interface PredictionData {
  final_decision: FinalDecision
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimCounter({ target }: { target: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / 60
    const t = setInterval(() => {
      start += step
      if (start >= target) { setVal(target); clearInterval(t) }
      else setVal(Math.round(start * 10) / 10)
    }, 16)
    return () => clearInterval(t)
  }, [target])
  return <>{val.toFixed(1)}</>
}

// ─── Circular Gauge ───────────────────────────────────────────────────────────
function CircularGauge({ value }: { value: number }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { setTimeout(() => setAnimated(true), 200) }, [])

  const r = 88
  const cx = 110
  const cy = 110
  const circumference = 2 * Math.PI * r
  const pct = animated ? value / 100 : 0
  const offset = circumference - pct * circumference * 0.75
  const startAngle = -225 // degrees, -225 = bottom-left start for 270° arc
  const hue = value >= 75 ? 0 : value >= 55 ? 24 : 200
  const color = value >= 75 ? "#ef4444" : value >= 55 ? "#f97316" : "#2563eb"
  const track = "#f1f5f9"

  // 270° arc path helpers
  const polarToXY = (deg: number, radius: number) => {
    const rad = ((deg - 90) * Math.PI) / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }
  const arcPath = (startDeg: number, endDeg: number, rad: number) => {
    const s = polarToXY(startDeg, rad)
    const e = polarToXY(endDeg, rad)
    const large = endDeg - startDeg > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${rad} ${rad} 0 ${large} 1 ${e.x} ${e.y}`
  }

  const arcStart = -135
  const arcEnd = 135
  const fillEnd = arcStart + (arcEnd - arcStart) * (animated ? value / 100 : 0)

  return (
    <svg width="220" height="220" viewBox="0 0 220 220" style={{ overflow: "visible" }}>
      {/* Track */}
      <path d={arcPath(arcStart, arcEnd, r)} fill="none" stroke={track} strokeWidth="14" strokeLinecap="round" />
      {/* Fill */}
      <path
        d={arcPath(arcStart, fillEnd, r)}
        fill="none"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
        style={{ transition: "all 1.2s cubic-bezier(0.16,1,0.3,1)" }}
      />
      {/* Glow */}
      <path
        d={arcPath(arcStart, fillEnd, r)}
        fill="none"
        stroke={color}
        strokeWidth="22"
        strokeLinecap="round"
        opacity="0.12"
        style={{ transition: "all 1.2s cubic-bezier(0.16,1,0.3,1)" }}
      />
      {/* Center text */}
      <text x={cx} y={cy - 10} textAnchor="middle" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 36, fontWeight: 800, fill: color }}>
        <AnimCounter target={value} />
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 600, fill: "#94a3b8" }}>
        % confidence
      </text>
      <text x={cx} y={cy + 36} textAnchor="middle" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 500, fill: "#cbd5e1", letterSpacing: "0.08em" }}>
        AI SCORE
      </text>
    </svg>
  )
}

// ─── Severity Badge ───────────────────────────────────────────────────────────
function SeverityBadge({ pct }: { pct: number }) {
  const level = pct >= 75 ? { label: "High Confidence", bg: "#fef2f2", color: "#dc2626", border: "#fecaca" }
    : pct >= 55 ? { label: "Moderate Confidence", bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" }
    : { label: "Low Confidence", bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" }
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: level.bg, color: level.color,
      border: `1px solid ${level.border}`,
      borderRadius: 99, padding: "4px 12px",
      fontSize: 11, fontWeight: 700, letterSpacing: "0.06em"
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: level.color }} />
      {level.label}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ResultPage() {
  const router = useRouter()
  const [data, setData] = useState<PredictionData | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("lastPrediction")
      const prev = sessionStorage.getItem("lastPreview")

      if (raw) {
        const parsed: PredictionData = JSON.parse(raw)
        // ensure we actually have a result; otherwise redirect back
        if (parsed.final_decision && parsed.final_decision.result) {
          setData(parsed)
          if (prev) setPreview(prev)
        } else {
          router.push("/predict")
          return
        }
      } else {
        router.push("/predict")
        return
      }
    } catch {
      router.push("/predict")
      return
    }

    setTimeout(() => setReady(true), 60)
  }, [router])

  if (!data) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
      <div style={{ width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
    </div>
  )

  const { final_decision } = data
  const pct = final_decision.confidence_percent

  const actions = [
    { icon: "🩺", label: "Consult a certified dermatologist", desc: "Book an appointment for professional evaluation" },
    { icon: "💧", label: "Keep affected skin moisturized", desc: "Use fragrance-free emollient creams twice daily" },
    { icon: "🚫", label: "Avoid scratching or irritation", desc: "Use cold compresses to soothe flare-ups" },
    { icon: "🧴", label: "Use gentle, unscented products", desc: "Switch to hypoallergenic cleansers and detergents" },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Lora:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #ffffff; font-family: 'Plus Jakarta Sans', sans-serif; -webkit-font-smoothing: antialiased; }

        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shimmer { 0%,100% { opacity: .6 } 50% { opacity: 1 } }

        .rp-root {
          min-height: 100vh;
          background: #ffffff;
          display: flex;
          flex-direction: column;
        }

        /* ── Top nav ──────────────────────────────────────── */
        .rp-nav {
          width: 100%;
          background: #ffffff;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 48px;
          height: 64px;
          position: sticky; top: 0; z-index: 50;
          box-shadow: 0 1px 0 #f1f5f9;
          animation: fadeIn .4s ease both;
        }
        .rp-nav-brand {
          display: flex; align-items: center; gap: 10px;
        }
        .rp-nav-logo {
          width: 32px; height: 32px; border-radius: 8px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
        }
        .rp-nav-name {
          font-size: 15px; font-weight: 800; color: #1e293b;
          letter-spacing: -0.02em;
        }
        .rp-nav-center {
          display: flex; align-items: center; gap: 6px;
        }
        .rp-nav-crumb {
          font-size: 13px; color: #94a3b8; font-weight: 500;
          text-decoration: none;
          transition: color .15s;
        }
        .rp-nav-crumb:hover { color: #2563eb; }
        .rp-nav-sep { color: #cbd5e1; font-size: 13px; }
        .rp-nav-current { font-size: 13px; color: #1e293b; font-weight: 600; }
        .rp-nav-actions { display: flex; align-items: center; gap: 10px; }
        .rp-btn-ghost {
          background: none; border: 1.5px solid #e2e8f0; color: #475569;
          border-radius: 10px; padding: 7px 16px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: all .16s; text-decoration: none; display: inline-flex; align-items: center;
        }
        .rp-btn-ghost:hover { border-color: #2563eb; color: #2563eb; background: #eff6ff; }

        /* ── Main layout ──────────────────────────────────── */
        .rp-main {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 0;
          max-width: 1280px;
          margin: 0 auto;
          width: 100%;
          padding: 48px 48px 64px;
          gap: 40px;
          align-items: start;
        }

        /* ── Left column ──────────────────────────────────── */
        .rp-left { display: flex; flex-direction: column; gap: 24px; }

        /* Result hero */
        .rp-hero {
          background: #ffffff;
          border: 1.5px solid #f1f5f9;
          border-radius: 24px;
          padding: 40px;
          display: flex; align-items: center; gap: 40px;
          box-shadow: 0 4px 24px rgba(0,0,0,.04), 0 1px 4px rgba(0,0,0,.03);
          animation: fadeUp .5s ease .05s both;
          position: relative; overflow: hidden;
        }
        .rp-hero::before {
          content: '';
          position: absolute; top: 0; right: 0;
          width: 300px; height: 300px;
          background: radial-gradient(circle at 80% 20%, rgba(37,99,235,.05), transparent 70%);
          pointer-events: none;
        }
        .rp-hero-gauge { flex-shrink: 0; }
        .rp-hero-info { flex: 1; }
        .rp-hero-tag {
          font-size: 11px; font-weight: 700; letter-spacing: .14em;
          color: #94a3b8; text-transform: uppercase; margin-bottom: 10px;
          display: flex; align-items: center; gap: 6px;
        }
        .rp-hero-tag::before {
          content: '';
          display: inline-block; width: 20px; height: 1.5px; background: #cbd5e1;
        }
        .rp-hero-result {
          font-family: 'Lora', serif;
          font-size: 48px; font-weight: 600; line-height: 1.1;
          color: #1e293b; letter-spacing: -0.03em;
          margin-bottom: 16px;
        }
        .rp-hero-result em {
          font-style: normal;
          color: #2563eb;
        }
        .rp-hero-sub {
          font-size: 14px; color: #64748b; font-weight: 500;
          line-height: 1.6; max-width: 380px; margin-bottom: 20px;
        }

        /* Image panel */
        .rp-image-card {
          background: #ffffff;
          border: 1.5px solid #f1f5f9;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 4px 24px rgba(0,0,0,.04), 0 1px 4px rgba(0,0,0,.03);
          animation: fadeUp .5s ease .15s both;
        }
        .rp-image-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 24px;
        }
        .rp-image-title {
          font-size: 15px; font-weight: 700; color: #1e293b;
        }
        .rp-image-tag {
          font-size: 11px; font-weight: 700; letter-spacing: .1em;
          color: #94a3b8; text-transform: uppercase;
          padding: 4px 10px; background: #f8fafc; border-radius: 6px;
          border: 1px solid #f1f5f9;
        }
        .rp-image-inner {
          display: flex; gap: 16px; align-items: flex-start;
        }
        .rp-image-preview {
          width: 180px; height: 180px; border-radius: 16px; overflow: hidden; flex-shrink: 0;
          background: #f8fafc;
          box-shadow: 0 8px 32px rgba(0,0,0,.1);
          border: 1.5px solid #f1f5f9;
        }
        .rp-image-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .rp-image-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          font-size: 48px; opacity: .3;
        }
        .rp-image-meta {
          flex: 1; display: flex; flex-direction: column; gap: 12px; padding-top: 4px;
        }
        .rp-meta-row {
          display: flex; flex-direction: column; gap: 3px;
        }
        .rp-meta-key {
          font-size: 10px; font-weight: 700; letter-spacing: .1em;
          text-transform: uppercase; color: #94a3b8;
        }
        .rp-meta-val {
          font-size: 14px; font-weight: 600; color: #334155;
        }
        .rp-meta-divider { height: 1px; background: #f1f5f9; }

        /* ── Right column ─────────────────────────────────── */
        .rp-right { display: flex; flex-direction: column; gap: 20px; }

        /* Action card */
        .rp-actions-card {
          background: #ffffff;
          border: 1.5px solid #f1f5f9;
          border-radius: 24px;
          padding: 28px;
          box-shadow: 0 4px 24px rgba(0,0,0,.04);
          animation: fadeUp .5s ease .1s both;
        }
        .rp-actions-title {
          font-size: 14px; font-weight: 700; color: #1e293b;
          margin-bottom: 20px;
          display: flex; align-items: center; gap: 8px;
        }
        .rp-actions-title::after {
          content: ''; flex: 1; height: 1px; background: #f1f5f9;
        }
        .rp-action-item {
          display: flex; gap: 14px; align-items: flex-start;
          padding: 14px 0;
          border-bottom: 1px solid #f8fafc;
        }
        .rp-action-item:last-child { border-bottom: none; padding-bottom: 0; }
        .rp-action-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: #f8fafc; border: 1px solid #f1f5f9;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
          transition: all .2s;
        }
        .rp-action-item:hover .rp-action-icon {
          background: #eff6ff; border-color: #bfdbfe;
          transform: scale(1.08);
        }
        .rp-action-body {}
        .rp-action-label {
          font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 2px;
        }
        .rp-action-desc {
          font-size: 12px; color: #94a3b8; font-weight: 500; line-height: 1.5;
        }

        /* CTA card */
        .rp-cta-card {
          background: linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%);
          border-radius: 24px;
          padding: 28px;
          animation: fadeUp .5s ease .2s both;
          position: relative; overflow: hidden;
        }
        .rp-cta-card::before {
          content: '';
          position: absolute; top: -40px; right: -40px;
          width: 160px; height: 160px;
          background: rgba(255,255,255,.06);
          border-radius: 50%;
          pointer-events: none;
        }
        .rp-cta-card::after {
          content: '';
          position: absolute; bottom: -20px; left: 20px;
          width: 100px; height: 100px;
          background: rgba(255,255,255,.04);
          border-radius: 50%;
          pointer-events: none;
        }
        .rp-cta-headline {
          font-family: 'Lora', serif;
          font-size: 20px; font-weight: 600; color: white;
          margin-bottom: 8px; line-height: 1.3;
        }
        .rp-cta-sub {
          font-size: 13px; color: rgba(255,255,255,.7);
          font-weight: 500; margin-bottom: 20px; line-height: 1.6;
        }
        .rp-cta-btn {
          width: 100%;
          background: white; color: #1d4ed8;
          border: none; border-radius: 12px;
          padding: 14px 20px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px; font-weight: 800;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all .18s;
          box-shadow: 0 4px 16px rgba(0,0,0,.15);
          position: relative; z-index: 1;
        }
        .rp-cta-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,.2); }

        /* Disclaimer */
        .rp-disclaimer {
          background: #fffbeb;
          border: 1.5px solid #fde68a;
          border-radius: 16px;
          padding: 16px 18px;
          display: flex; gap: 10px; align-items: flex-start;
          animation: fadeUp .5s ease .25s both;
        }
        .rp-disc-icon { font-size: 15px; flex-shrink: 0; margin-top: 1px; }
        .rp-disc-text {
          font-size: 12px; color: #92400e; font-weight: 500;
          line-height: 1.65;
        }

        /* ── Responsive ───────────────────────────────────── */
        @media (max-width: 900px) {
          .rp-main {
            grid-template-columns: 1fr;
            padding: 24px 20px 40px;
            gap: 20px;
          }
          .rp-hero { flex-direction: column; align-items: flex-start; gap: 24px; padding: 28px; }
          .rp-hero-result { font-size: 32px; }
          .rp-nav { padding: 0 20px; }
          .rp-nav-center { display: none; }
        }

        @media (max-width: 600px) {
          .rp-hero-gauge { align-self: center; width: 100%; display: flex; justify-content: center; }
          .rp-image-inner { flex-direction: column; }
          .rp-image-preview { width: 100%; height: 200px; }
        }
      `}</style>

      <div className="rp-root">

        {/* Nav */}
        <nav className="rp-nav">
          <div className="rp-nav-brand">
            <div className="rp-nav-logo">🔬</div>
            <span className="rp-nav-name">DermAI</span>
          </div>
          <div className="rp-nav-center">
            <Link href="/" className="rp-nav-crumb">Home</Link>
            <span className="rp-nav-sep">/</span>
            <Link href="/predict" className="rp-nav-crumb">Analysis</Link>
            <span className="rp-nav-sep">/</span>
            <span className="rp-nav-current">Results</span>
          </div>
          <div className="rp-nav-actions">
            <Link href="/predict" className="rp-btn-ghost">+ New Analysis</Link>
          </div>
        </nav>

        {/* Main */}
        <main className="rp-main">

          {/* ── Left Column ── */}
          <div className="rp-left">

            {/* Hero Result */}
            <div className="rp-hero">
              <div className="rp-hero-gauge">
                <CircularGauge value={pct} />
              </div>
              <div className="rp-hero-info">
                <div className="rp-hero-tag">AI Detection Result</div>
                <h1 className="rp-hero-result">
                  You may have<br />
                  <em>{final_decision.result}</em>
                </h1>
                <p className="rp-hero-sub">
                  Our AI model has analyzed your skin sample and identified possible signs of {final_decision.result.toLowerCase()}. This is not a medical diagnosis.
                </p>
                <SeverityBadge pct={pct} />
              </div>
            </div>

            {/* Image Card */}
            <div className="rp-image-card">
              <div className="rp-image-header">
                <span className="rp-image-title">Submitted Sample</span>
                <span className="rp-image-tag">AI Analyzed</span>
              </div>
              <div className="rp-image-inner">
                <div className="rp-image-preview">
                  {preview
                    ? <img src={preview} alt="Submitted skin sample" />
                    : <div className="rp-image-placeholder">🔬</div>
                  }
                </div>
                <div className="rp-image-meta">
                  <div className="rp-meta-row">
                    <span className="rp-meta-key">Condition Detected</span>
                    <span className="rp-meta-val" style={{ color: "#2563eb", fontWeight: 800 }}>{final_decision.result}</span>
                  </div>
                  <div className="rp-meta-divider" />
                  <div className="rp-meta-row">
                    <span className="rp-meta-key">Confidence Score</span>
                    <span className="rp-meta-val">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="rp-meta-divider" />
                  <div className="rp-meta-row">
                    <span className="rp-meta-key">Analysis Type</span>
                    <span className="rp-meta-val">Deep Learning CNN</span>
                  </div>
                  <div className="rp-meta-divider" />
                  <div className="rp-meta-row">
                    <span className="rp-meta-key">Status</span>
                    <span className="rp-meta-val" style={{ color: "#16a34a", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                      Complete
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ── Right Column ── */}
          <div className="rp-right">

            {/* Actions */}
            <div className="rp-actions-card">
              <div className="rp-actions-title">Recommended Next Steps</div>
              {actions.map((a, i) => (
                <div className="rp-action-item" key={i}>
                  <div className="rp-action-icon">{a.icon}</div>
                  <div className="rp-action-body">
                    <div className="rp-action-label">{a.label}</div>
                    <div className="rp-action-desc">{a.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="rp-cta-card">
              <h3 className="rp-cta-headline">Want to know more about {final_decision.result.charAt(0) + final_decision.result.slice(1).toLowerCase()}?</h3>
              <p className="rp-cta-sub">Explore symptoms, causes, treatment options, and how to manage this condition day-to-day.</p>
              <button className="rp-cta-btn">
                Learn More  →
              </button>
            </div>

            {/* Disclaimer */}
            <div className="rp-disclaimer">
              <span className="rp-disc-icon">⚠️</span>
              <p className="rp-disc-text">
                <strong>Medical disclaimer:</strong> This AI analysis is for informational purposes only and does not replace professional medical advice, diagnosis, or treatment. Always consult a certified dermatologist or healthcare provider.
              </p>
            </div>

          </div>

        </main>

      </div>
    </>
  )
}