'use client';

import { CopilotKit } from '@copilotkit/react-core';
import { CopilotSidebar } from '@copilotkit/react-ui';
import '@copilotkit/react-ui/styles.css';

const AGENT_URL = process.env.NEXT_PUBLIC_COPILOTKIT_RUNTIME_URL || 'http://localhost:8000';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit runtimeUrl={AGENT_URL}>
      <CopilotSidebar
        labels={{
          title: 'Aionysus Sommelier',
          initial: "Hello! I'm your AI sommelier. Ask me about wines, food pairings, or investment opportunities.",
        }}
        instructions={`You are Aionysus, a divine AI wine sommelier.

CAPABILITIES:
- Search wines by region, type, grape, price
- Recommend wines for food pairings
- Analyze investment potential and drinking windows
- Compare wines side-by-side
- Add wines to cart

TONE: Knowledgeable but approachable. Use wine terminology naturally.
Keep responses concise (2-3 sentences) unless asked for details.

WHEN USER ASKS ABOUT:
- Wine search → Use search_wines tool
- Food pairing → Use recommend_pairing tool
- Specific wine → Use get_wine tool
- Comparison → Use compare_wines tool
- Purchase → Use add_to_cart tool`}
      >
        {children}
      </CopilotSidebar>
    </CopilotKit>
  );
}
