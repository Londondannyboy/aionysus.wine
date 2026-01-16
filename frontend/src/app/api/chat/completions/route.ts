import { NextRequest, NextResponse } from 'next/server';

// CLM endpoint for Hume EVI - proxies to Pydantic AI agent
// This makes voice use the SAME brain as the CopilotKit chat

const AGENT_URL = process.env.AGENT_URL || 'https://aionysus-agent-production.up.railway.app';
const ZEP_API_KEY = process.env.ZEP_API_KEY || '';

interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Fetch Zep context for the user
async function getZepContext(userId: string): Promise<string> {
  if (!userId || !ZEP_API_KEY) return '';

  try {
    const response = await fetch('https://api.getzep.com/api/v2/graph/search', {
      method: 'POST',
      headers: {
        'Authorization': `Api-Key ${ZEP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        query: 'wine preferences regions grapes budget favorites',
        limit: 10,
        scope: 'edges',
      }),
    });

    if (!response.ok) return '';

    const data = await response.json();
    const edges = data.edges || [];
    const facts = edges.slice(0, 5).map((e: { fact?: string }) => `- ${e.fact}`).filter(Boolean);

    if (facts.length > 0) {
      return `\n\nWhat I remember about your wine preferences:\n${facts.join('\n')}`;
    }
    return '';
  } catch {
    return '';
  }
}

// Fetch user profile from Neon
async function getUserProfile(userId: string): Promise<string> {
  if (!userId) return '';

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/user-profile?userId=${userId}`);
    if (!response.ok) return '';

    const data = await response.json();
    const items = data.items || [];

    if (items.length === 0) return '';

    const profile: string[] = [];
    const regions: string[] = [];
    const grapes: string[] = [];
    const occasions: string[] = [];
    let budget = '';

    for (const item of items) {
      if (item.item_type === 'favorite_region') regions.push(item.value);
      if (item.item_type === 'favorite_grape') grapes.push(item.value);
      if (item.item_type === 'occasion') occasions.push(item.value);
      if (item.item_type === 'budget') budget = item.value;
    }

    if (regions.length) profile.push(`Favorite regions: ${regions.join(', ')}`);
    if (grapes.length) profile.push(`Favorite grapes: ${grapes.join(', ')}`);
    if (budget) profile.push(`Budget: ${budget}`);
    if (occasions.length) profile.push(`Usual occasions: ${occasions.join(', ')}`);

    return profile.length > 0 ? `\n\nUser profile:\n${profile.join('\n')}` : '';
  } catch {
    return '';
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: OpenAIMessage[] = body.messages || [];

    // Extract metadata from Hume (custom session ID format: "firstName|aionysus_userId")
    const customSessionId = body.custom_session_id || body.session_id || '';
    const sessionParts = customSessionId.split('|');
    const firstName = sessionParts[0] || '';
    const sessionPart = sessionParts[1] || '';
    const userId = sessionPart?.replace('aionysus_', '').replace('guest_', '') || '';

    // Get the last user message
    const userMessages = messages.filter(m => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';

    console.log('[CLM] Received from Hume:', lastUserMessage.slice(0, 100));
    console.log('[CLM] User:', firstName || 'anonymous', 'UserID:', userId || 'none');

    // Fetch context in parallel
    const [zepContext, userProfile] = await Promise.all([
      userId ? getZepContext(userId) : Promise.resolve(''),
      userId ? getUserProfile(userId) : Promise.resolve(''),
    ]);

    // Build system context
    const systemContext = `You are Aionysus, a divine AI wine sommelier.
${firstName ? `The user's name is ${firstName}. Address them by name.` : ''}
${userProfile}
${zepContext}

IMPORTANT: Keep responses concise for voice - 2-3 sentences unless more detail is requested.
Be knowledgeable but approachable, not pretentious.
When recommending wines, reference the user's known preferences if available.`;

    // Try to call the Pydantic AI agent
    try {
      console.log('[CLM] Calling agent at:', AGENT_URL);

      const agentResponse = await fetch(`${AGENT_URL}/copilotkit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          messages: [
            { id: `sys_${Date.now()}`, role: 'developer', content: systemContext },
            ...messages.map((msg, idx) => ({
              id: `msg_${idx}_${Date.now()}`,
              role: msg.role === 'system' ? 'developer' : msg.role,
              content: msg.content,
            })),
          ],
          runId: `run_${Date.now()}`,
          threadId: sessionPart || `thread_${Date.now()}`,
          state: {
            user: userId ? { id: userId, name: firstName } : null,
          },
        }),
      });

      if (agentResponse.ok) {
        // Parse SSE stream from agent
        const reader = agentResponse.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          let content = '';
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'TEXT_MESSAGE_CONTENT' || data.type === 'TextMessageContent') {
                    content += data.content || data.delta || '';
                  } else if (data.delta?.content) {
                    content += data.delta.content;
                  } else if (data.content && typeof data.content === 'string') {
                    content += data.content;
                  }
                } catch {
                  // Skip non-JSON lines
                }
              }
            }
          }
          reader.releaseLock();

          if (content.trim()) {
            console.log('[CLM] Agent response:', content.slice(0, 100));
            return NextResponse.json({
              id: `chatcmpl-${Date.now()}`,
              object: 'chat.completion',
              created: Math.floor(Date.now() / 1000),
              model: 'aionysus-agent',
              choices: [{
                index: 0,
                message: { role: 'assistant', content: content.trim() },
                finish_reason: 'stop',
              }],
            });
          }
        }
      }
    } catch (agentError) {
      console.warn('[CLM] Agent call failed, using fallback:', agentError);
    }

    // Fallback: Use Google AI directly
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    if (GOOGLE_API_KEY) {
      console.log('[CLM] Using Google AI fallback');

      const googleResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: `${systemContext}\n\nUser: ${lastUserMessage}` }] },
            ],
            generationConfig: {
              maxOutputTokens: 200,
              temperature: 0.7,
            },
          }),
        }
      );

      if (googleResponse.ok) {
        const data = await googleResponse.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (responseText) {
          console.log('[CLM] Google AI response:', responseText.slice(0, 100));
          return NextResponse.json({
            id: `chatcmpl-${Date.now()}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: 'gemini-2.0-flash',
            choices: [{
              index: 0,
              message: { role: 'assistant', content: responseText },
              finish_reason: 'stop',
            }],
          });
        }
      }
    }

    // Final fallback
    return NextResponse.json({
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'aionysus-fallback',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: firstName
            ? `Hello ${firstName}! I'm Aionysus, your wine sommelier. What kind of wine are you looking for today?`
            : "Hello! I'm Aionysus, your wine sommelier. What kind of wine can I help you discover?",
        },
        finish_reason: 'stop',
      }],
    });

  } catch (error: unknown) {
    console.error('[CLM] Error:', error instanceof Error ? error.message : error);

    return NextResponse.json({
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'aionysus-error',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: "I'm having a moment. Could you try again?",
        },
        finish_reason: 'stop',
      }],
    });
  }
}
