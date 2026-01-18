import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { HttpAgent } from "@ag-ui/client";
import { NextRequest } from "next/server";

// Use empty adapter since we're routing to external Pydantic AI agent
const serviceAdapter = new ExperimentalEmptyAdapter();

// Railway agent URL - Vic Wine Sommelier agent
const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || "https://dionysus-production.up.railway.app";

// Create CopilotRuntime with HttpAgent pointing to Railway Pydantic AI
const runtime = new CopilotRuntime({
  agents: {
    vic: new HttpAgent({ url: `${AGENT_URL}/` }),
  },
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
