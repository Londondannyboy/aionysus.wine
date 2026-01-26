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
      className="mt-10 bg-stone-50 border border-stone-200 rounded-xl overflow-hidden"
      aria-label="Table of contents"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-stone-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">📑</span>
          <span className="font-semibold text-stone-900">
            In This Guide: {wineName}
          </span>
        </div>
        <span className={`text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
            {sections.map((section, index) => (
              <li key={section.id}>
                <button
                  onClick={() => handleClick(section.id)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-stone-600 hover:text-burgundy-700 hover:bg-burgundy-50 transition-colors flex items-center gap-2"
                >
                  <span className="text-stone-400 font-mono text-xs">{String(index + 1).padStart(2, '0')}</span>
                  <span>{section.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  )
}
