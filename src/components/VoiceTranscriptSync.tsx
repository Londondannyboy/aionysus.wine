'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useCopilotChat } from '@copilotkit/react-core'
import { TextMessage, Role } from '@copilotkit/runtime-client-gql'

interface HumeMessage {
  type: string
  message?: {
    content?: string
    role?: string
  }
  id?: string
}

interface VoiceTranscriptSyncProps {
  messages: HumeMessage[]
  isConnected: boolean
}

/**
 * Syncs Hume EVI voice messages to CopilotKit chat panel
 * This allows voice conversations to appear in the text chat
 */
export function VoiceTranscriptSync({ messages, isConnected }: VoiceTranscriptSyncProps) {
  const { appendMessage } = useCopilotChat()
  const syncedIdsRef = useRef<Set<string>>(new Set())
  const lastSyncedIndexRef = useRef<number>(0)

  // Generate a unique ID for a message
  const getMessageId = useCallback((msg: HumeMessage, index: number): string => {
    return msg.id || `hume-${index}-${msg.type}-${msg.message?.content?.slice(0, 20) || ''}`
  }, [])

  // Sync new messages to CopilotKit
  useEffect(() => {
    if (!isConnected || messages.length === 0) return

    // Process only new messages
    const newMessages = messages.slice(lastSyncedIndexRef.current)

    newMessages.forEach((msg, idx) => {
      const globalIndex = lastSyncedIndexRef.current + idx
      const msgId = getMessageId(msg, globalIndex)

      // Skip if already synced
      if (syncedIdsRef.current.has(msgId)) return

      // Skip non-message types
      if (msg.type !== 'user_message' && msg.type !== 'assistant_message') return

      const content = msg.message?.content
      if (!content || content.trim().length === 0) return

      // Add to CopilotKit using TextMessage
      try {
        const isUser = msg.type === 'user_message'

        // Format voice messages with indicator for user messages
        const formattedContent = isUser ? `🎤 ${content}` : content

        const textMessage = new TextMessage({
          id: msgId,
          role: isUser ? Role.User : Role.Assistant,
          content: formattedContent,
        })

        appendMessage(textMessage)

        syncedIdsRef.current.add(msgId)
        console.log(`[VoiceSync] Synced ${isUser ? 'user' : 'assistant'} message: ${content.slice(0, 50)}...`)
      } catch (e) {
        console.error('[VoiceSync] Failed to sync message:', e)
      }
    })

    // Update the last synced index
    lastSyncedIndexRef.current = messages.length
  }, [messages, isConnected, appendMessage, getMessageId])

  // Reset when disconnected
  useEffect(() => {
    if (!isConnected) {
      // Don't clear - keep the history visible
      // syncedIdsRef.current.clear()
      // lastSyncedIndexRef.current = 0
    }
  }, [isConnected])

  return null // No UI - just syncs messages
}
