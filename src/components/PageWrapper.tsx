'use client'

import { ReactNode } from 'react'
import { CopilotSidebar } from '@copilotkit/react-ui'
import { DynamicBackground } from './DynamicBackground'

interface PageWrapperProps {
  children: ReactNode
  region?: string | null
  showBackground?: boolean
  showSidebar?: boolean
  sidebarTitle?: string
  sidebarInitial?: string
}

export function PageWrapper({
  children,
  region = null,
  showBackground = true,
  showSidebar = true,
  sidebarTitle = "Vic - AI Sommelier",
  sidebarInitial = "Hello! I'm Vic, your AI wine sommelier. How can I help you explore our wines today?"
}: PageWrapperProps) {
  if (!showBackground && !showSidebar) {
    return <>{children}</>
  }

  const content = showSidebar ? (
    <CopilotSidebar
      defaultOpen={false}
      labels={{
        title: sidebarTitle,
        initial: sidebarInitial,
      }}
      className="!bg-white/95 backdrop-blur-xl"
    >
      {children}
    </CopilotSidebar>
  ) : children

  if (showBackground) {
    return (
      <DynamicBackground region={region}>
        {content}
      </DynamicBackground>
    )
  }

  return <>{content}</>
}

// Light theme page wrapper (no dynamic background)
export function LightPageWrapper({
  children,
  showSidebar = true,
  sidebarTitle = "Vic - AI Sommelier",
  sidebarInitial = "Hello! I'm Vic, your AI wine sommelier. Ask me about this wine or explore our collection!"
}: Omit<PageWrapperProps, 'region' | 'showBackground'>) {
  if (!showSidebar) {
    return <>{children}</>
  }

  return (
    <CopilotSidebar
      defaultOpen={false}
      labels={{
        title: sidebarTitle,
        initial: sidebarInitial,
      }}
      className="!bg-stone-50/95 backdrop-blur-xl [&_.copilotkit-chat-messages]:text-stone-900"
    >
      {children}
    </CopilotSidebar>
  )
}
