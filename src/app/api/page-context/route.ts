/**
 * Page Context API - Get page context for voice agent awareness
 *
 * GET: Fetch page context by slug
 * Query params:
 *   - slug: Page slug (e.g., '/destinations/cyprus')
 *
 * Returns page context including:
 *   - voice_context: Detailed context for the voice agent
 *   - available_sections: Sections that can be highlighted
 *   - related_tools: Tools relevant to this page
 *   - topic_cluster: Content cluster this page belongs to
 */

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Missing required parameter: slug' },
        { status: 400 }
      );
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json(
        { error: 'DATABASE_URL not configured' },
        { status: 500 }
      );
    }

    const sql = neon(databaseUrl);

    // Fetch page context
    const results = await sql`
      SELECT
        page_slug,
        page_title,
        page_type,
        topic_cluster,
        voice_context,
        available_sections,
        related_tools,
        keywords,
        destination_slug,
        hero_variant,
        hero_title,
        hero_subtitle,
        hero_image,
        hero_gradient,
        meta_title,
        meta_description,
        content_summary
      FROM page_contexts
      WHERE page_slug = ${slug}
      AND is_published = true
    `;

    if (results.length === 0) {
      return NextResponse.json(
        { error: 'Page context not found', slug },
        { status: 404 }
      );
    }

    return NextResponse.json(results[0]);
  } catch (error) {
    console.error('[Page Context API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page context', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Get all page contexts for a topic cluster
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cluster, pageType } = body;

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json(
        { error: 'DATABASE_URL not configured' },
        { status: 500 }
      );
    }

    const sql = neon(databaseUrl);

    let results;

    if (cluster && pageType) {
      results = await sql`
        SELECT page_slug, page_title, page_type, hero_variant, priority
        FROM page_contexts
        WHERE topic_cluster = ${cluster}
        AND page_type = ${pageType}
        AND is_published = true
        ORDER BY priority DESC
      `;
    } else if (cluster) {
      results = await sql`
        SELECT page_slug, page_title, page_type, hero_variant, priority
        FROM page_contexts
        WHERE topic_cluster = ${cluster}
        AND is_published = true
        ORDER BY priority DESC
      `;
    } else if (pageType) {
      results = await sql`
        SELECT page_slug, page_title, page_type, topic_cluster, priority
        FROM page_contexts
        WHERE page_type = ${pageType}
        AND is_published = true
        ORDER BY priority DESC
      `;
    } else {
      results = await sql`
        SELECT page_slug, page_title, page_type, topic_cluster, priority
        FROM page_contexts
        WHERE is_published = true
        ORDER BY priority DESC
        LIMIT 50
      `;
    }

    return NextResponse.json({
      pages: results,
      total: results.length,
    });
  } catch (error) {
    console.error('[Page Context API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page contexts', details: String(error) },
      { status: 500 }
    );
  }
}
