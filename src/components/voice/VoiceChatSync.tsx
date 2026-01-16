'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { VoiceProvider, useVoice } from '@humeai/voice-react';
import { useCopilotChat } from '@copilotkit/react-core';
import { TextMessage, MessageRole } from '@copilotkit/runtime-client-gql';
import { motion, AnimatePresence } from 'framer-motion';

const CONFIG_ID = process.env.NEXT_PUBLIC_HUME_CONFIG_ID || '';

// Debug helper - logs to console with timestamp
const debug = (area: string, message: string, data?: any) => {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = `[Hume ${timestamp}]`;
  if (data !== undefined) {
    console.log(`${prefix} ${area}: ${message}`, data);
  } else {
    console.log(`${prefix} ${area}: ${message}`);
  }
};

interface UserContext {
  userId?: string;
  userName?: string;
  email?: string;
  persona?: string;
  pageContext?: string;
  isReturningUser?: boolean;
  userFacts?: string[];
}

interface VoiceChatContextType {
  isVoiceConnected: boolean;
  isVoiceLoading: boolean;
  voiceError: string | null;
  toggleVoice: () => void;
  lastTranscript: string | null;
  isSpeaking: boolean;
  userContext: UserContext | null;
}

const VoiceChatContext = createContext<VoiceChatContextType>({
  isVoiceConnected: false,
  isVoiceLoading: false,
  voiceError: null,
  toggleVoice: () => {},
  lastTranscript: null,
  isSpeaking: false,
  userContext: null,
});

export const useVoiceChat = () => useContext(VoiceChatContext);

// Build system prompt with user context (matches lost.london pattern)
function buildSystemPrompt(userContext: UserContext | null, pageContext?: string): string {
  const userName = userContext?.userName || 'Guest';
  const isReturning = userContext?.isReturningUser || false;
  const facts = userContext?.userFacts?.slice(0, 3).join(', ') || '';
  const persona = userContext?.persona || 'general';

  return `USER_CONTEXT:
name: ${userName}
${facts ? `interests: ${facts}` : ''}
persona: ${persona}
status: ${isReturning ? 'returning_user' : 'new_user'}
${pageContext ? `current_page: ${pageContext}` : ''}

GREETING:
${isReturning && userName !== 'Guest' ? `This is ${userName}'s return visit. Greet them warmly by name: "Welcome back, ${userName}!"` : ''}
${!isReturning && userName !== 'Guest' ? `New user named ${userName}. Greet them: "Hi ${userName}! Welcome to Relocation Quest."` : ''}
${userName === 'Guest' ? `Unknown user. Greet them: "Hi there! I'm ATLAS, your relocation advisor."` : ''}

IDENTITY:
- You ARE ATLAS, an expert relocation advisor
- You help people explore moving to new countries
- You're friendly, knowledgeable, and conversational
- Keep responses concise for voice (2-3 sentences)

RULES:
- Use their name occasionally (not every message)
- Be helpful and specific about relocation topics
- End with a relevant follow-up question
- Focus on: visas, cost of living, lifestyle, job market`;
}

// Inner component that has access to both Hume and CopilotKit
function VoiceChatSyncInner({
  accessToken,
  userContext,
  pageContext,
  children,
}: {
  accessToken: string;
  userContext: UserContext | null;
  pageContext?: string;
  children: ReactNode;
}) {
  const { connect, disconnect, status, messages, sendUserInput } = useVoice();
  const { appendMessage } = useCopilotChat();
  const [isPending, setIsPending] = useState(false);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const processedMessagesRef = useRef<Set<string>>(new Set());
  const lastSentMsgId = useRef<string | null>(null);

  const isConnected = status.value === 'connected';

  // Debug status changes
  useEffect(() => {
    debug('Status', `Connection state: ${status.value}`, {
      isConnected,
      userName: userContext?.userName || 'Guest',
      configId: CONFIG_ID,
    });
  }, [status.value, isConnected, userContext]);

  // Forward conversation messages to CopilotKit (matches lost.london pattern)
  useEffect(() => {
    const conversationMsgs = messages.filter(
      (m: any) => (m.type === 'user_message' || m.type === 'assistant_message') && m.message?.content
    );

    if (conversationMsgs.length > 0) {
      const lastMsg = conversationMsgs[conversationMsgs.length - 1] as any;
      const msgId = lastMsg?.id || `${conversationMsgs.length}-${lastMsg?.message?.content?.slice(0, 20)}`;

      if (lastMsg?.message?.content && msgId !== lastSentMsgId.current) {
        const isUser = lastMsg.type === 'user_message';
        const content = lastMsg.message.content;

        debug(isUser ? 'User' : 'Assistant', content.slice(0, 100));
        lastSentMsgId.current = msgId;

        if (isUser) {
          setLastTranscript(content);
        } else {
          setIsSpeaking(true);
        }

        // Forward to CopilotKit
        try {
          appendMessage(
            new TextMessage({
              role: isUser ? MessageRole.User : MessageRole.Assistant,
              content: isUser ? `🎤 ${content}` : content,
            })
          );
        } catch (e) {
          debug('Error', 'Failed to append message', e);
        }
      }
    }
  }, [messages, appendMessage]);

  // Track when assistant stops speaking
  useEffect(() => {
    const playbackMsgs = messages.filter((m: any) =>
      m.type === 'assistant_message' || m.type === 'assistant_end'
    );
    const lastPlayback = playbackMsgs[playbackMsgs.length - 1];

    if (lastPlayback?.type === 'assistant_end') {
      setIsSpeaking(false);
      debug('Audio', 'Assistant finished speaking');
    }
  }, [messages]);

  // Handle user interruption
  useEffect(() => {
    const interruptions = messages.filter((m: any) => m.type === 'user_interruption');
    if (interruptions.length > 0) {
      const lastInterruption = interruptions[interruptions.length - 1];
      const interruptId = `interrupt-${interruptions.length}`;
      if (!processedMessagesRef.current.has(interruptId)) {
        processedMessagesRef.current.add(interruptId);
        debug('Interrupt', 'User interrupted the assistant');
        setIsSpeaking(false);
      }
    }
  }, [messages]);

  const toggleVoice = useCallback(async () => {
    if (isConnected) {
      debug('Action', 'Disconnecting...');
      disconnect();
      setIsSpeaking(false);
      processedMessagesRef.current.clear();
      lastSentMsgId.current = null;
      return;
    }

    setIsPending(true);

    // Build system prompt with user context (matches lost.london pattern)
    const systemPrompt = buildSystemPrompt(userContext, pageContext);

    // Session ID with name for backend tracking
    const sessionIdWithName = userContext?.userName && userContext.userName !== 'Guest'
      ? `${userContext.userName}|${userContext.userId || Date.now()}`
      : `guest_${Date.now()}`;

    debug('Action', '================================');
    debug('Action', `Connecting as: ${userContext?.userName || 'Guest'}`);
    debug('Action', `Session ID: ${sessionIdWithName}`);
    debug('Action', `System Prompt: ${systemPrompt.substring(0, 300)}...`);
    debug('Action', '================================');

    try {
      // Connect with sessionSettings (matches lost.london pattern exactly)
      await connect({
        auth: { type: 'accessToken' as const, value: accessToken },
        configId: CONFIG_ID,
        sessionSettings: {
          type: 'session_settings' as const,
          systemPrompt,
          customSessionId: sessionIdWithName,
        },
      });

      debug('Action', 'Connected successfully!');

      // Auto-greet after connection - send a greeting trigger
      setTimeout(() => {
        debug('Action', 'Sending greeting trigger');
        sendUserInput('speak your greeting');
      }, 500);

    } catch (e: any) {
      debug('Error', 'Connection failed', e);
    }
    setIsPending(false);
  }, [connect, disconnect, isConnected, accessToken, userContext, pageContext, sendUserInput]);

  const contextValue: VoiceChatContextType = {
    isVoiceConnected: isConnected,
    isVoiceLoading: isPending,
    voiceError: null,
    toggleVoice,
    lastTranscript,
    isSpeaking,
    userContext,
  };

  return (
    <VoiceChatContext.Provider value={contextValue}>
      {children}
    </VoiceChatContext.Provider>
  );
}

// Provider that wraps both VoiceProvider and children
export function VoiceChatProvider({
  children,
  userName,
  userId,
  persona,
  pageContext,
  isReturningUser,
  userFacts,
}: {
  children: ReactNode;
  userName?: string;
  userId?: string;
  persona?: string;
  pageContext?: string;
  isReturningUser?: boolean;
  userFacts?: string[];
}) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userContext: UserContext | null = {
    userName: userName || 'Guest',
    userId,
    persona,
    pageContext,
    isReturningUser,
    userFacts,
  };

  useEffect(() => {
    debug('Init', 'Fetching Hume token...');
    fetch('/api/hume-token')
      .then((res) => res.json())
      .then((data) => {
        if (data.accessToken) {
          debug('Init', 'Token received successfully');
          setAccessToken(data.accessToken);
        } else {
          debug('Error', 'No token in response', data);
          setError(data.error || 'No token');
        }
      })
      .catch((err) => {
        debug('Error', 'Token fetch failed', err);
        setError(err.message);
      });
  }, []);

  // Log user context on mount
  useEffect(() => {
    debug('Init', `User context:`, userContext);
  }, [userName, userId, persona, isReturningUser]);

  // If no token yet or error, provide a fallback context
  if (!accessToken) {
    return (
      <VoiceChatContext.Provider
        value={{
          isVoiceConnected: false,
          isVoiceLoading: !error,
          voiceError: error,
          toggleVoice: () => {
            debug('Action', 'Toggle called but no token yet');
          },
          lastTranscript: null,
          isSpeaking: false,
          userContext,
        }}
      >
        {children}
      </VoiceChatContext.Provider>
    );
  }

  return (
    <VoiceProvider
      onError={(err) => debug('Error', 'VoiceProvider error:', err)}
      onOpen={() => debug('Status', 'VoiceProvider opened')}
      onClose={(e) => debug('Status', 'VoiceProvider closed:', e)}
    >
      <VoiceChatSyncInner accessToken={accessToken} userContext={userContext} pageContext={pageContext}>
        {children}
      </VoiceChatSyncInner>
    </VoiceProvider>
  );
}

// Synced Voice Button Component
export function SyncedVoiceButton() {
  const {
    isVoiceConnected,
    isVoiceLoading,
    voiceError,
    toggleVoice,
    isSpeaking,
    userContext,
  } = useVoiceChat();

  if (voiceError) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 text-red-200 text-sm">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Voice unavailable
      </div>
    );
  }

  if (isVoiceLoading && !isVoiceConnected) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/60 text-sm">
        <div className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
        Loading voice...
      </div>
    );
  }

  const displayName = userContext?.userName || 'Guest';

  return (
    <motion.button
      onClick={toggleVoice}
      disabled={isVoiceLoading}
      className={`relative group flex items-center gap-3 px-5 py-3 rounded-full backdrop-blur-md transition-all shadow-lg ${
        isVoiceConnected
          ? isSpeaking
            ? 'bg-blue-500/90 hover:bg-blue-600/90'
            : 'bg-emerald-500/90 hover:bg-emerald-600/90'
          : 'bg-white/10 hover:bg-white/20 border border-white/20'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Pulse ring when connected */}
      {isVoiceConnected && (
        <motion.span
          className={`absolute inset-0 rounded-full ${
            isSpeaking ? 'bg-blue-500/50' : 'bg-emerald-500/50'
          }`}
          animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* Mic icon */}
      <span className="relative z-10">
        {isVoiceLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        )}
      </span>

      {/* Label */}
      <span className="relative z-10 text-white text-sm font-medium whitespace-nowrap">
        {isVoiceLoading
          ? 'Connecting...'
          : isVoiceConnected
          ? isSpeaking
            ? 'ATLAS speaking...'
            : `Listening, ${displayName}...`
          : `Talk to ATLAS`}
      </span>

      {/* Sound wave animation when connected */}
      <AnimatePresence>
        {isVoiceConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-0.5 ml-1"
          >
            {[...Array(3)].map((_, i) => (
              <motion.span
                key={i}
                className="w-1 bg-white rounded-full"
                animate={{
                  height: isSpeaking ? ['12px', '20px', '12px'] : ['8px', '16px', '8px'],
                }}
                transition={{
                  duration: isSpeaking ? 0.4 : 0.6,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
