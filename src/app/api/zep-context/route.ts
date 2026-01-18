import { NextRequest, NextResponse } from 'next/server';

const ZEP_API_KEY = process.env.ZEP_API_KEY || '';

// Categorize a fact into pension advisor ontological type
function categorize(fact: string): 'pension_type' | 'provider' | 'contribution' | 'retirement' | 'risk' | 'fact' {
  const lower = fact.toLowerCase();

  // Pension type preferences
  if (['sipp', 'workplace', 'personal', 'stakeholder', 'defined benefit', 'final salary', 'auto-enrolment'].some(k => lower.includes(k))) {
    return 'pension_type';
  }
  // Providers
  if (['nest', 'vanguard', 'hargreaves', 'fidelity', 'aj bell', 'aviva', 'scottish widows', 'legal & general', 'standard life'].some(k => lower.includes(k))) {
    return 'provider';
  }
  // Contribution related
  if (['contribute', 'contribution', 'monthly', 'employer', 'salary sacrifice', 'tax relief', 'annual allowance'].some(k => lower.includes(k))) {
    return 'contribution';
  }
  // Retirement planning
  if (['retire', 'retirement', 'drawdown', 'annuity', 'state pension', 'pension age', 'pension freedom'].some(k => lower.includes(k))) {
    return 'retirement';
  }
  // Risk preferences
  if (['risk', 'cautious', 'balanced', 'aggressive', 'growth', 'conservative', 'equity', 'bond', 'fund'].some(k => lower.includes(k))) {
    return 'risk';
  }
  return 'fact';
}

// Clean up fact text for display
function cleanFact(fact: string): string {
  return fact
    .replace(/^(the user |user |they |he |she |their )/i, '')
    .replace(/^(is |are |has |have |wants |prefers |likes |enjoys )/i, '')
    .trim();
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');

  if (!userId || !ZEP_API_KEY) {
    return NextResponse.json({
      context: '',
      facts: [],
      entities: { pension_types: [], providers: [], contributions: [], retirement: [], risk: [] }
    });
  }

  try {
    // Use penelope prefix for Zep user ID
    const zepUserId = `penelope_${userId}`;

    // Fetch user's memory from Zep knowledge graph
    const response = await fetch('https://api.getzep.com/api/v2/graph/search', {
      method: 'POST',
      headers: {
        'Authorization': `Api-Key ${ZEP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: zepUserId,
        query: 'pension preferences provider contribution retirement risk employer scheme',
        limit: 15,
        scope: 'edges',
      }),
    });

    if (!response.ok) {
      console.error('[Zep] Graph search failed:', response.status);
      return NextResponse.json({
        context: '',
        facts: [],
        entities: { pension_types: [], providers: [], contributions: [], retirement: [], risk: [] }
      });
    }

    const data = await response.json();
    const edges = data.edges || [];

    // Extract and categorize facts
    const categorizedFacts: Array<{ fact: string; type: string; clean: string }> = [];
    const entities = {
      pension_types: [] as string[],
      providers: [] as string[],
      contributions: [] as string[],
      retirement: [] as string[],
      risk: [] as string[],
    };

    for (const edge of edges) {
      if (!edge.fact) continue;

      const type = categorize(edge.fact);
      const clean = cleanFact(edge.fact);

      categorizedFacts.push({ fact: edge.fact, type, clean });

      // Collect unique entities by type
      if (type === 'pension_type' && !entities.pension_types.includes(clean)) {
        entities.pension_types.push(clean);
      } else if (type === 'provider' && !entities.providers.includes(clean)) {
        entities.providers.push(clean);
      } else if (type === 'contribution' && !entities.contributions.includes(clean)) {
        entities.contributions.push(clean);
      } else if (type === 'retirement' && !entities.retirement.includes(clean)) {
        entities.retirement.push(clean);
      } else if (type === 'risk' && !entities.risk.includes(clean)) {
        entities.risk.push(clean);
      }
    }

    // Build context string grouped by type
    const contextParts: string[] = [];

    if (entities.pension_types.length) {
      contextParts.push(`Pension Preferences: ${entities.pension_types.join(', ')}`);
    }
    if (entities.providers.length) {
      contextParts.push(`Interested Providers: ${entities.providers.join(', ')}`);
    }
    if (entities.contributions.length) {
      contextParts.push(`Contribution Info: ${entities.contributions.join(', ')}`);
    }
    if (entities.retirement.length) {
      contextParts.push(`Retirement Plans: ${entities.retirement.join(', ')}`);
    }
    if (entities.risk.length) {
      contextParts.push(`Risk Preferences: ${entities.risk.join(', ')}`);
    }

    const context = contextParts.length > 0
      ? contextParts.join('\n')
      : '';

    return NextResponse.json({
      context,
      facts: categorizedFacts,
      entities,
    });
  } catch (error) {
    console.error('[Zep] Error:', error);
    return NextResponse.json({
      context: '',
      facts: [],
      entities: { pension_types: [], providers: [], contributions: [], retirement: [], risk: [] }
    });
  }
}
