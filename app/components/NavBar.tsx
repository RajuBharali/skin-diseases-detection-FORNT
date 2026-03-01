"use client"

import Link from "next/link"

interface NavBarProps {
  title?: string
  /**
   * Optional breadcrumb trail. Each entry is rendered in order with separators.
   */
  crumbs?: Array<{ href: string; label: string }>
  /**
   * Show a call-to-action button on the right side of the bar.
   */
  showNewAnalysis?: boolean
}

export default function NavBar({
  title = "Skin AI",
  crumbs = [],
  showNewAnalysis = false,
}: NavBarProps) {
  return (
    <header className="w-full bg-white shadow-md fixed top-0 left-0 z-20 border-b border-gray-100">
      <div className="max-w-4xl mx-auto py-4 px-6 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <span className="material-icons text-blue-600">health_and_safety</span>
          {title}
        </Link>

        {crumbs.length > 0 ? (
          <nav className="flex items-center gap-2">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-2 text-sm text-gray-600">
                <Link href={c.href}>{c.label}</Link>
                {i < crumbs.length - 1 && <span className="text-gray-300">/</span>}
              </span>
            ))}
          </nav>
        ) : (
          <nav className="flex items-center gap-4">
            {/* placeholder for additional links/icons */}
            <button className="material-icons text-gray-600 hover:text-gray-800">notifications</button>
          </nav>
        )}

        {showNewAnalysis && (
          <Link href="/predict" className="ml-4 text-sm font-semibold text-blue-600 hover:underline">
            + New Analysis
          </Link>
        )}
      </div>
    </header>
  )
}