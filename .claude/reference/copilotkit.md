# CopilotKit Integration Patterns

> Patterns for integrating CopilotKit with Pydantic AI agents

## Official Documentation

- **Pydantic AI Quickstart**: https://docs.copilotkit.ai/pydantic-ai/quickstart
- **CoAgents Guide**: https://docs.copilotkit.ai/coagents
- **AG-UI Protocol**: https://docs.copilotkit.ai/ag-ui

## Setup

### Frontend Provider

```tsx
// app/layout.tsx or providers.tsx
import { CopilotKit } from "@copilotkit/react-core";

export function Providers({ children }) {
  return (
    <CopilotKit runtimeUrl="https://your-agent.railway.app">
      {children}
    </CopilotKit>
  );
}
```

### Sidebar with Instructions

```tsx
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

export function Page() {
  const instructions = `
    You are helping users find fractional jobs.
    Current page: ${pageContext}
    User: ${userName}
  `;

  return (
    <CopilotSidebar instructions={instructions}>
      <YourContent />
    </CopilotSidebar>
  );
}
```

## Key Hooks

### useCoAgent (Shared State)

Sync state between frontend and agent:

```tsx
import { useCoAgent } from "@copilotkit/react-core";

interface AppState {
  jobs: Job[];
  search_query: string;
  user: { id: string; name: string } | null;
}

function MyComponent() {
  const { state, setState } = useCoAgent<AppState>({
    name: "agent",
    initialState: {
      jobs: [],
      search_query: "",
      user: null
    }
  });

  // Update state (syncs to agent)
  const updateUser = (user) => {
    setState(prev => ({
      ...prev,  // Always spread previous state
      user: user
    }));
  };

  return <div>{state.jobs.length} jobs found</div>;
}
```

### useRenderToolCall (Generative UI)

Render custom UI for tool results:

```tsx
import { useRenderToolCall } from "@copilotkit/react-core";

function MyComponent() {
  useRenderToolCall({
    name: "search_jobs",
    render: ({ result }) => {
      if (!result?.jobs) return <></>;  // Never return null!
      return (
        <div className="job-grid">
          {result.jobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      );
    }
  });

  useRenderToolCall({
    name: "show_chart",
    render: ({ result }) => (
      <BarChart data={result.chartData} />
    )
  });

  return <CopilotSidebar>...</CopilotSidebar>;
}
```

### useHumanInTheLoop

Get user confirmation for actions:

```tsx
import { useHumanInTheLoop } from "@copilotkit/react-core";

function MyComponent() {
  useHumanInTheLoop({
    name: "confirm_job_application",
    description: "Confirm job application",
    renderComponent: ({ args, resolve }) => (
      <div className="confirmation-dialog">
        <h3>Apply to {args.jobTitle}?</h3>
        <p>Company: {args.company}</p>
        <button onClick={() => resolve({ confirmed: true })}>
          Yes, Apply
        </button>
        <button onClick={() => resolve({ confirmed: false })}>
          Cancel
        </button>
      </div>
    )
  });
}
```

### useCopilotAction (Frontend Actions)

Define actions the agent can call on the frontend:

```tsx
import { useCopilotAction } from "@copilotkit/react-core";

function MyComponent() {
  const [filters, setFilters] = useState({});

  useCopilotAction({
    name: "update_filters",
    description: "Update job search filters on the page",
    parameters: [
      { name: "location", type: "string", description: "Location filter" },
      { name: "role", type: "string", description: "Role type filter" }
    ],
    handler: async ({ location, role }) => {
      setFilters({ location, role });
      return { success: true, filters: { location, role } };
    }
  });
}
```

## Passing User Context to Agent

The most reliable pattern for passing user info:

### 1. Build Instructions String (Frontend)

```tsx
const [profileItems, setProfileItems] = useState({});

useEffect(() => {
  if (!user?.id) return;
  fetch(`/api/user-profile?userId=${user.id}`)
    .then(res => res.json())
    .then(data => setProfileItems(data));
}, [user?.id]);

const agentInstructions = user ? `
CRITICAL USER CONTEXT:
- User Name: ${user.name}
- User ID: ${user.id}
- User Email: ${user.email}
- Location: ${profileItems.location || 'Not set'}
- Target Role: ${profileItems.role || 'Not set'}
- Skills: ${profileItems.skills?.join(', ') || 'None'}

Use this info when user asks about their profile.
` : undefined;

<CopilotSidebar instructions={agentInstructions}>
```

### 2. Extract in Agent Middleware (Backend)

```python
# agent/src/agent.py

_cached_user_context = {}

def extract_user_from_instructions(instructions: str) -> dict:
    """Extract user info from CopilotKit instructions."""
    result = {"user_id": None, "name": None}
    if not instructions:
        return result

    import re
    id_match = re.search(r'User ID:\s*([a-f0-9-]+)', instructions)
    if id_match:
        result["user_id"] = id_match.group(1)

    name_match = re.search(r'User Name:\s*([^\n]+)', instructions)
    if name_match:
        result["name"] = name_match.group(1).strip()

    global _cached_user_context
    _cached_user_context = result
    return result

@app.middleware("http")
async def extract_user_middleware(request: Request, call_next):
    if request.method == "POST":
        body = await request.body()
        if body:
            data = json.loads(body)
            for msg in data.get("messages", []):
                if msg.get("role") == "system" and "User ID:" in msg.get("content", ""):
                    extract_user_from_instructions(msg["content"])
    return await call_next(request)
```

### 3. Use in Tools

```python
def get_effective_user_id(ctx) -> Optional[str]:
    """Get user ID from state or cached instructions."""
    if ctx.deps.state.user and ctx.deps.state.user.id:
        return ctx.deps.state.user.id
    return _cached_user_context.get("user_id")

@agent.tool
async def get_user_profile(ctx: RunContext[StateDeps[AppState]]) -> dict:
    user_id = get_effective_user_id(ctx)
    if not user_id:
        return {"error": "Please log in first"}
    # Fetch profile...
```

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "Cannot return null" | Render function returns null | Return `<></>` instead |
| "prev is undefined" | setState without spreading | Always spread: `{...prev, newProp}` |
| "Agent doesn't know user" | State not syncing | Use instructions prop pattern |
| "Actions not working" | Wrong action name | Match names exactly |
| "Infinite render loop" | Array deps in useEffect | Use primitive deps or useMemo |

## TypeScript Types

```typescript
// Common state shape
interface AppState {
  jobs: Job[];
  search_query: string;
  user: {
    id: string;
    firstName: string;
    email: string;
  } | null;
  page_context: {
    page_type: string;
    location_filter?: string;
  };
}

// Job type
interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
}
```

## Best Practices

1. **Always use instructions for context** - More reliable than state sync
2. **Never return null from render** - Use empty fragment `<></>`
3. **Spread previous state** - `setState(prev => ({...prev, newVal}))`
4. **Use primitive deps in useEffect** - Avoid array references
5. **Name actions clearly** - Match frontend and backend names exactly
6. **Handle loading states** - Tool results may be undefined initially
