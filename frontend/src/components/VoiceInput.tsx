"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { VoiceProvider, useVoice } from "@humeai/voice-react";

interface VoiceButtonProps {
  onMessage?: (text: string, role?: "user" | "assistant") => void;
  firstName?: string | null;
  userId?: string | null;
}

const SESSION_GREETED_KEY = 'hume_greeted_session';
const SESSION_LAST_INTERACTION_KEY = 'hume_last_interaction';

function getSessionValue(key: string, defaultValue: number | boolean): number | boolean {
  if (typeof window === 'undefined') return defaultValue;
  const stored = sessionStorage.getItem(key);
  if (stored === null) return defaultValue;
  return key.includes('time') ? parseInt(stored, 10) : stored === 'true';
}

function setSessionValue(key: string, value: number | boolean): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(key, String(value));
}

function VoiceButton({ onMessage, firstName, userId }: VoiceButtonProps) {
  const { connect, disconnect, status, messages, sendUserInput } = useVoice();
  const [isPending, setIsPending] = useState(false);
  const lastSentMsgId = useRef<string | null>(null);
  const greetedThisSession = useRef(getSessionValue(SESSION_GREETED_KEY, false) as boolean);
  const lastInteractionTime = useRef(getSessionValue(SESSION_LAST_INTERACTION_KEY, 0) as number);

  // Forward messages to parent if callback provided
  useEffect(() => {
    const conversationMsgs = messages.filter(
      (m: any) => (m.type === "user_message" || m.type === "assistant_message") && m.message?.content
    );

    if (conversationMsgs.length > 0 && onMessage) {
      const lastMsg = conversationMsgs[conversationMsgs.length - 1] as any;
      const msgId = lastMsg?.id || `${conversationMsgs.length}-${lastMsg?.message?.content?.slice(0, 20)}`;

      if (lastMsg?.message?.content && msgId !== lastSentMsgId.current) {
        const isUser = lastMsg.type === "user_message";
        lastSentMsgId.current = msgId;
        onMessage(lastMsg.message.content, isUser ? "user" : "assistant");
      }
    }
  }, [messages, onMessage]);

  const handleToggle = useCallback(async () => {
    if (status.value === "connected") {
      const now = Date.now();
      lastInteractionTime.current = now;
      setSessionValue(SESSION_LAST_INTERACTION_KEY, now);
      disconnect();
    } else {
      setIsPending(true);
      try {
        const res = await fetch("/api/hume-token");
        const { accessToken } = await res.json();

        // Fetch Zep context if user is logged in
        let zepContext = "";
        if (userId) {
          try {
            const zepRes = await fetch(`/api/zep-context?userId=${userId}`);
            const zepData = await zepRes.json();
            if (zepData.context) {
              zepContext = zepData.context;
              console.log("[Aionysus] Zep context loaded:", zepData.facts?.length || 0, "facts");
            }
          } catch (e) {
            console.warn("Failed to fetch Zep context:", e);
          }
        }

        const timeSinceLastInteraction = lastInteractionTime.current > 0
          ? Date.now() - lastInteractionTime.current
          : Infinity;
        const isQuickReconnect = timeSinceLastInteraction < 5 * 60 * 1000;
        const wasGreeted = greetedThisSession.current;

        let greetingInstruction = "";
        if (wasGreeted || isQuickReconnect) {
          greetingInstruction = `DO NOT GREET - user already greeted this session. Continue naturally.`;
        } else {
          greetingInstruction = firstName
            ? `Greet warmly: "Hello ${firstName}! I'm your AI sommelier. What wine can I help you discover today?"`
            : `Give a warm greeting as a sophisticated wine sommelier.`;
        }

        const systemPrompt = `## YOUR ROLE
You are Aionysus, a divine AI wine sommelier with deep knowledge of fine wines.
You help users discover wines, understand investment potential, and find perfect pairings.

## USER PROFILE
${firstName ? `Name: ${firstName}` : 'Guest'}
${zepContext ? `\n### Wine Preferences I Remember:\n${zepContext}\n` : '\n### First-time visitor - no wine preferences saved yet.\n'}

## GREETING RULES
${greetingInstruction}

## PERSONALITY
- Knowledgeable but approachable - not pretentious
- Use wine terminology naturally but explain when needed
- Enthusiastic about helping discover new wines
- Reference user's preferences when making recommendations

## CAPABILITIES
- Recommend wines by region, grape, price, occasion
- Explain investment potential and drinking windows
- Suggest food pairings
- Compare wines
- Teach about wine regions and producers

## RESPONSE STYLE
- Keep responses SHORT for voice - 2-3 sentences max
- Be conversational and warm
- Ask clarifying questions to narrow down recommendations
- When they express interest, remember it for future recommendations

## ONBOARDING (if no Zep memory)
If first-time visitor, naturally ask about:
- What types of wine do they enjoy? (red, white, sparkling)
- Any favorite regions? (Bordeaux, Burgundy, Napa)
- Budget range for wines?
- Occasions they're buying for?
`;

        const stableSessionId = userId
          ? `aionysus_${userId}`
          : `aionysus_anon_${Math.random().toString(36).slice(2, 10)}`;

        const customSessionId = firstName
          ? `${firstName}|${stableSessionId}`
          : `|${stableSessionId}`;

        console.log("[Aionysus] Connecting voice with session:", customSessionId);

        await connect({
          auth: { type: "accessToken", value: accessToken },
          configId: process.env.NEXT_PUBLIC_HUME_CONFIG_ID || "6ac2d1ec-2e0f-4957-959a-b4bbb5405d40",
          sessionSettings: {
            type: "session_settings",
            systemPrompt: systemPrompt,
            customSessionId: customSessionId,
          }
        });

        if (!wasGreeted && !isQuickReconnect && firstName) {
          setTimeout(() => {
            greetedThisSession.current = true;
            setSessionValue(SESSION_GREETED_KEY, true);
            sendUserInput(`Hello, my name is ${firstName}`);
          }, 500);
        } else {
          greetedThisSession.current = true;
          setSessionValue(SESSION_GREETED_KEY, true);
        }
      } catch (e) {
        console.error("Voice connect error:", e);
      } finally {
        setIsPending(false);
      }
    }
  }, [connect, disconnect, status.value, firstName, userId, sendUserInput]);

  const isConnected = status.value === "connected";

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg ${
        isConnected
          ? "bg-red-500 hover:bg-red-600 animate-pulse"
          : isPending
          ? "bg-wine-600 cursor-not-allowed"
          : "bg-gold-500 hover:bg-gold-400"
      }`}
      title={isConnected ? "Stop listening" : "Talk to Sommelier"}
    >
      {isPending ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg
          className={`w-5 h-5 ${isConnected ? 'text-white' : 'text-wine-950'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isConnected ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10h6v4H9z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          )}
        </svg>
      )}
    </button>
  );
}

const handleVoiceError = (err: any) => console.error("[Aionysus] Voice Error:", err?.message || err);
const handleVoiceOpen = () => console.log("[Aionysus] Voice connected");
const handleVoiceClose = (e: any) => console.log("[Aionysus] Voice closed:", e?.code, e?.reason);

export function VoiceInput({ onMessage, firstName, userId }: {
  onMessage?: (text: string, role?: "user" | "assistant") => void;
  firstName?: string | null;
  userId?: string | null;
}) {
  const voiceButton = useCallback(() => (
    <VoiceButton onMessage={onMessage} firstName={firstName} userId={userId} />
  ), [onMessage, firstName, userId]);

  return (
    <VoiceProvider
      onError={handleVoiceError}
      onOpen={handleVoiceOpen}
      onClose={handleVoiceClose}
    >
      {voiceButton()}
    </VoiceProvider>
  );
}
