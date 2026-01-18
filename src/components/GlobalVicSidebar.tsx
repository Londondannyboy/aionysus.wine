'use client'

import { CopilotSidebar } from '@copilotkit/react-ui'
import { usePathname } from 'next/navigation'

export function GlobalVicSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Customize initial message based on page
  const getInitialMessage = () => {
    if (pathname === '/') {
      return "Hello! I'm Vic, your AI wine sommelier. I've spent years exploring the world's great wine regions, but I have a confession - I've fallen head over heels for English wine! Ask me about any wine, and I might just slip in a Sussex sparkler recommendation..."
    }

    if (pathname === '/wines') {
      return "Welcome to our wine collection! I'm Vic, and I'm here to help you find the perfect bottle. Looking for something specific? A bold Burgundy? A crisp Champagne? Or dare I suggest... an award-winning English sparkling?"
    }

    if (pathname?.startsWith('/wines/')) {
      return "I see you're exploring our collection! I'm Vic, your sommelier. Would you like to know more about this wine, find similar bottles, or shall I add it to your cart?"
    }

    if (pathname === '/cart') {
      return "Reviewing your selections? Excellent taste! If you need any last-minute additions or have questions about your wines, I'm here to help. And if you haven't tried English sparkling yet... just saying!"
    }

    return "Hello! I'm Vic, your AI wine sommelier. How can I help you discover the perfect wine today?"
  }

  return (
    <CopilotSidebar
      defaultOpen={false}
      labels={{
        title: "Vic - AI Sommelier",
        initial: getInitialMessage(),
      }}
      className="!bg-stone-50/95 dark:!bg-slate-900/95 backdrop-blur-xl"
    >
      {children}
    </CopilotSidebar>
  )
}
