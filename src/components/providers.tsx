'use client';

import { CopilotKit } from '@copilotkit/react-core';
import { GlobalCopilotActions } from './GlobalCopilotActions';

// CopilotKit runtime connects to Railway Pydantic AI agent via AG-UI protocol
// The agent named "vic" handles AI wine sommelier conversations
const RUNTIME_URL = '/api/copilotkit';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit runtimeUrl={RUNTIME_URL} agent="vic">
      <GlobalCopilotActions />
      {children}
    </CopilotKit>
  );
}
