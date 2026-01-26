'use client'

import { useState } from 'react'

export interface TOCSection {
  id: string
  label: string
}

interface TableOfContentsProps {
  sections: TOCSection[]
  wineName: string
}

export function TableOfContents({ sections, wineName }: TableOfContentsProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (sections.length === 0) return null

  const handleClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <nav
      className="mt-10 relative overflow-hidden rounded-2xl border border-stone-200"
      aria-label="Table of contents"
    >
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200&q=80"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-stone-900/95 via-stone-800/90 to-burgundy-900/85" />
      </div>

      {/* Content */}
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <span className="text-xl">📑</span>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-white/60 block mb-0.5">
                Quick Navigation
              </span>
              <span className="font-semibold text-white text-lg">
                In This Guide: {wineName}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50 hidden sm:block">
              {sections.length} sections
            </span>
            <div className={`w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center transition-all duration-300 ${isExpanded ? 'rotate-180 bg-white/20' : ''} group-hover:bg-white/20`}>
              <span className="text-white/80">▼</span>
            </div>
          </div>
        </button>

        {isExpanded && (
          <div className="px-5 pb-5">
            <div className="h-px bg-white/10 mb-4" />
            <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <button
                    onClick={() => handleClick(section.id)}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 transition-all flex items-center gap-3 group"
                  >
                    <span className="w-6 h-6 rounded-md bg-burgundy-500/30 text-burgundy-200 font-mono text-xs flex items-center justify-center border border-burgundy-400/30">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-white/80 group-hover:text-white transition-colors">
                      {section.label}
                    </span>
                    <span className="ml-auto text-white/30 group-hover:text-white/60 transition-colors">
                      →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="text-center text-white/40 text-xs mt-4">
              Click any section to jump directly
            </p>
          </div>
        )}
      </div>
    </nav>
  )
}
