'use client';

import { useState, useEffect, useCallback } from 'react';
import { VoiceProvider, useVoice } from '@humeai/voice-react';

const CONFIG_ID = process.env.NEXT_PUBLIC_HUME_CONFIG_ID || '6ac2d1ec-2e0f-4957-959a-b4bbb5405d40';

const debug = (area: string, message: string, data?: unknown) => {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = `[Aionysus ${timestamp}]`;
  if (data !== undefined) {
    console.log(`${prefix} ${area}: ${message}`, data);
  } else {
    console.log(`${prefix} ${area}: ${message}`);
  }
};

interface UserContext {
  id?: string | null;
  name?: string | null;
  email?: string | null;
}

interface VoiceWidgetProps {
  variant?: 'fixed' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  user?: UserContext;
}

function VoiceButtonInner({
  accessToken,
  size = 'md',
  user,
}: {
  accessToken: string;
  size?: 'sm' | 'md' | 'lg';
  user?: UserContext;
}) {
  const { connect, disconnect, status, sendUserInput } = useVoice();
  const [isPending, setIsPending] = useState(false);

  const isConnected = status.value === 'connected';

  useEffect(() => {
    debug('Status', `Connection state: ${status.value}`, {
      isConnected,
      userName: user?.name || 'Guest',
      configId: CONFIG_ID,
    });
  }, [status.value, isConnected, user]);

  const sizes = {
    sm: { button: 'w-10 h-10', icon: 'w-5 h-5' },
    md: { button: 'w-10 h-10', icon: 'w-5 h-5' },
    lg: { button: 'w-12 h-12', icon: 'w-6 h-6' },
  };
  const sizeConfig = sizes[size];

  const handleToggle = useCallback(async () => {
    if (isConnected) {
      debug('Action', 'Disconnecting...');
      disconnect();
      return;
    }

    setIsPending(true);

    // Fetch BOTH user profile (Neon) and Zep context
    let userProfile: { regions?: string[]; grapes?: string[]; budget?: string; occasions?: string[] } = {};
    let zepContext = '';

    if (user?.id) {
      // 1. Fetch user profile from Neon
      debug('Profile', `Fetching profile for userId: ${user.id}`);
      try {
        const profileRes = await fetch(`/api/user-profile?userId=${user.id}`);
        const profileData = await profileRes.json();
        if (profileData.items?.length > 0) {
          // Group profile items by type
          const regions: string[] = [];
          const grapes: string[] = [];
          const occasions: string[] = [];
          let budget = '';

          for (const item of profileData.items) {
            if (item.item_type === 'favorite_region') regions.push(item.value);
            if (item.item_type === 'favorite_grape') grapes.push(item.value);
            if (item.item_type === 'occasion') occasions.push(item.value);
            if (item.item_type === 'budget') budget = item.value;
          }

          userProfile = { regions, grapes, budget, occasions };
          debug('Profile', `Got profile:`, userProfile);
        }
      } catch (e) {
        debug('Profile', 'Failed to fetch profile', e);
      }

      // 2. Fetch Zep context (AI-extracted facts)
      debug('Zep', `Fetching context for userId: ${user.id}`);
      try {
        const zepRes = await fetch(`/api/zep-context?userId=${user.id}`);
        const zepData = await zepRes.json();
        if (zepData.context) {
          zepContext = zepData.context;
          debug('Zep', `Got Zep context: ${zepContext.substring(0, 100)}...`);
        }
      } catch (e) {
        debug('Zep', 'Failed to fetch context', e);
      }
    }

    // Build comprehensive user context section
    const userName = user?.name || 'Guest';
    let userContextSection = '';

    if (user?.id) {
      userContextSection = `\n\n## USER CONTEXT - ${userName.toUpperCase()}
User ID: ${user.id}
Email: ${user.email || 'Not provided'}`;

      // Add Neon profile data
      if (userProfile.regions?.length) {
        userContextSection += `\nFavorite Regions: ${userProfile.regions.join(', ')}`;
      }
      if (userProfile.grapes?.length) {
        userContextSection += `\nFavorite Grapes: ${userProfile.grapes.join(', ')}`;
      }
      if (userProfile.budget) {
        userContextSection += `\nBudget: ${userProfile.budget}`;
      }
      if (userProfile.occasions?.length) {
        userContextSection += `\nUsual Occasions: ${userProfile.occasions.join(', ')}`;
      }

      // Add Zep context (AI-extracted memories)
      if (zepContext) {
        userContextSection += `\n\nAI Memory (from past conversations):\n${zepContext}`;
      }
    }

    const greeting = user?.name
      ? `The user's name is ${user.name}. Greet them warmly by name: "Hello ${user.name}!" as their personal sommelier.`
      : 'This is a guest. Give them a warm welcome as a wine sommelier.';

    const systemPrompt = `You are Aionysus, a divine AI wine sommelier.
Your role is to help wine lovers:
1. Discover wines by region, grape, price, and occasion
2. Understand investment potential and drinking windows
3. Find perfect food pairings
4. Learn about wine regions and producers
${userContextSection}

## GREETING INSTRUCTIONS
${greeting}

## BEHAVIOR RULES
- Keep responses SHORT for voice - 2-3 sentences max
- Be knowledgeable but approachable, not pretentious
- Use wine terminology naturally but explain when needed
- ALWAYS reference user's known preferences when making recommendations
- If you know their favorite regions/grapes, mention wines from those areas
- Ask clarifying questions to learn more about their tastes
- When they express preferences, remember and use them`;

    const sessionId = user?.id
      ? `aionysus_${user.id}`
      : `guest_${Date.now()}`;

    debug('Action', '================================');
    debug('Action', `Connecting as: ${userName}`);
    debug('Action', `Session ID: ${sessionId}`);
    debug('Action', `Config ID: ${CONFIG_ID}`);
    debug('Action', '================================');

    try {
      await connect({
        auth: { type: 'accessToken' as const, value: accessToken },
        configId: CONFIG_ID,
        sessionSettings: {
          type: 'session_settings' as const,
          systemPrompt,
          customSessionId: sessionId,
        },
      });

      debug('Action', 'Connected successfully!');

      // Auto-greet after connection
      setTimeout(() => {
        debug('Action', 'Sending greeting trigger');
        sendUserInput('greet me');
      }, 500);

    } catch (e) {
      debug('Error', 'Connection failed', e);
    }

    setIsPending(false);
  }, [connect, disconnect, isConnected, accessToken, user, sendUserInput]);

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`
        ${sizeConfig.button} rounded-full flex items-center justify-center
        transition-all shadow-lg
        ${isConnected
          ? 'bg-red-500 hover:bg-red-600 animate-pulse'
          : isPending
          ? 'bg-wine-600 cursor-not-allowed'
          : 'bg-gold-500 hover:bg-gold-400'
        }
      `}
      title={isConnected ? 'Stop voice' : 'Talk to Sommelier'}
    >
      {isPending ? (
        <div className={`${sizeConfig.icon} border-2 border-white border-t-transparent rounded-full animate-spin`} />
      ) : isConnected ? (
        <svg className={`${sizeConfig.icon} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
        </svg>
      ) : (
        <svg className={`${sizeConfig.icon} text-wine-950`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        </svg>
      )}
    </button>
  );
}

export function VoiceWidget({ variant = 'inline', size = 'md', user }: VoiceWidgetProps) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch token on mount (NOT on click) - matches working pattern
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

  const wrapperClass = variant === 'fixed'
    ? 'fixed bottom-6 right-6 z-50 flex flex-col items-center gap-2'
    : 'flex items-center';

  if (error) {
    return (
      <div className={wrapperClass} title={error}>
        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className={wrapperClass}>
        <div className="w-10 h-10 rounded-full bg-wine-700 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <VoiceProvider
        onError={(err) => debug('Error', 'VoiceProvider error:', err)}
        onOpen={() => debug('Status', 'VoiceProvider opened')}
        onClose={(e) => debug('Status', 'VoiceProvider closed:', e)}
      >
        <VoiceButtonInner accessToken={accessToken} size={size} user={user} />
      </VoiceProvider>
    </div>
  );
}

// Also export as VoiceInput for backward compatibility
export { VoiceWidget as VoiceInput };
export default VoiceWidget;
