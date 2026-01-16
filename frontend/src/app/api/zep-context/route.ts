import { NextRequest, NextResponse } from 'next/server';

const ZEP_API_KEY = process.env.ZEP_API_KEY || '';

// Categorize a fact into wine-related ontological type
function categorize(fact: string, edgeName?: string): 'preference' | 'region' | 'grape' | 'budget' | 'occasion' | 'fact' {
  const lower = fact.toLowerCase();
  const edge = (edgeName || '').toLowerCase();

  // Wine preference keywords
  if (['prefers', 'likes', 'loves', 'enjoys', 'favorite', 'favourite'].some(k => lower.includes(k))) {
    return 'preference';
  }
  // Region keywords
  if (['bordeaux', 'burgundy', 'champagne', 'napa', 'tuscany', 'rioja', 'barolo', 'france', 'italy', 'spain', 'california'].some(k => lower.includes(k))) {
    return 'region';
  }
  // Grape variety keywords
  if (['cabernet', 'merlot', 'pinot', 'chardonnay', 'sauvignon', 'syrah', 'malbec', 'riesling', 'tempranillo'].some(k => lower.includes(k))) {
    return 'grape';
  }
  // Budget keywords
  if (['budget', 'price', 'expensive', 'affordable', 'investment', 'collect'].some(k => lower.includes(k))) {
    return 'budget';
  }
  // Occasion keywords
  if (['dinner', 'party', 'gift', 'celebration', 'everyday', 'special'].some(k => lower.includes(k)) || edge.includes('occasion')) {
    return 'occasion';
  }
  return 'fact';
}

// Clean up fact text for display
function cleanFact(fact: string): string {
  return fact
    .replace(/^(the user |user |they |he |she )/i, '')
    .replace(/^(is |are |has |have |wants |prefers |likes |loves )/i, '')
    .trim();
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');

  if (!userId || !ZEP_API_KEY) {
    return NextResponse.json({ context: '', facts: [], entities: { preferences: [], regions: [], grapes: [], occasions: [] } });
  }

  try {
    // Fetch user's memory from Zep knowledge graph
    const response = await fetch('https://api.getzep.com/api/v2/graph/search', {
      method: 'POST',
      headers: {
        'Authorization': `Api-Key ${ZEP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        query: 'wine preferences regions grapes budget occasions favorites',
        limit: 15,
        scope: 'edges',
      }),
    });

    if (!response.ok) {
      console.error('[Zep] Graph search failed:', response.status);
      return NextResponse.json({ context: '', facts: [], entities: { preferences: [], regions: [], grapes: [], occasions: [] } });
    }

    const data = await response.json();
    const edges = data.edges || [];

    // Extract and categorize facts
    const categorizedFacts: Array<{ fact: string; type: string; clean: string }> = [];
    const entities = {
      preferences: [] as string[],
      regions: [] as string[],
      grapes: [] as string[],
      occasions: [] as string[],
    };

    for (const edge of edges) {
      if (!edge.fact) continue;

      const type = categorize(edge.fact, edge.name);
      const clean = cleanFact(edge.fact);

      categorizedFacts.push({ fact: edge.fact, type, clean });

      // Collect unique entities by type
      if (type === 'preference' && !entities.preferences.includes(clean)) {
        entities.preferences.push(clean);
      } else if (type === 'region' && !entities.regions.includes(clean)) {
        entities.regions.push(clean);
      } else if (type === 'grape' && !entities.grapes.includes(clean)) {
        entities.grapes.push(clean);
      } else if (type === 'occasion' && !entities.occasions.includes(clean)) {
        entities.occasions.push(clean);
      }
    }

    // Build context string for wine sommelier
    const contextParts: string[] = [];

    if (entities.preferences.length) {
      contextParts.push(`Wine Preferences: ${entities.preferences.join(', ')}`);
    }
    if (entities.regions.length) {
      contextParts.push(`Favorite Regions: ${entities.regions.join(', ')}`);
    }
    if (entities.grapes.length) {
      contextParts.push(`Favorite Grapes: ${entities.grapes.join(', ')}`);
    }
    if (entities.occasions.length) {
      contextParts.push(`Wine Occasions: ${entities.occasions.join(', ')}`);
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
    return NextResponse.json({ context: '', facts: [], entities: { preferences: [], regions: [], grapes: [], occasions: [] } });
  }
}
