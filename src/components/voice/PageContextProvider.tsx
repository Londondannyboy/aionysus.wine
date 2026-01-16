'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useCopilotReadable } from '@copilotkit/react-core';

/**
 * Page context structure from database
 */
export interface PageContext {
  page_slug: string;
  page_title: string;
  page_type: string;
  topic_cluster: string | null;
  voice_context: string;
  available_sections: string[];
  related_tools: string[];
  keywords: string[];
  destination_slug: string | null;
  hero_variant: string;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_image: string | null;
  hero_gradient: string | null;
  meta_title: string | null;
  meta_description: string | null;
  content_summary: string | null;
}

interface PageContextValue {
  context: PageContext | null;
  loading: boolean;
  error: string | null;
}

const PageContextContext = createContext<PageContextValue>({
  context: null,
  loading: true,
  error: null,
});

export function usePageContext() {
  return useContext(PageContextContext);
}

interface PageContextProviderProps {
  /** Page slug to fetch context for (e.g., '/destinations/cyprus') */
  pageSlug: string;
  /** Optional: provide context directly instead of fetching */
  initialContext?: PageContext;
  children: ReactNode;
}

/**
 * PageContextProvider - Provides page context to the voice agent
 *
 * Fetches page context from the database and makes it available to:
 * 1. Child components via usePageContext()
 * 2. CopilotKit agent via useCopilotReadable
 *
 * The voice agent uses this to understand what page the user is on
 * and provide contextually relevant responses.
 *
 * Usage:
 * <PageContextProvider pageSlug="/destinations/cyprus">
 *   <YourPageContent />
 *   <VoiceWidget />
 * </PageContextProvider>
 */
export function PageContextProvider({
  pageSlug,
  initialContext,
  children,
}: PageContextProviderProps) {
  const [context, setContext] = useState<PageContext | null>(initialContext || null);
  const [loading, setLoading] = useState(!initialContext);
  const [error, setError] = useState<string | null>(null);

  // Fetch page context from API
  useEffect(() => {
    if (initialContext) return;

    async function fetchContext() {
      try {
        const res = await fetch(`/api/page-context?slug=${encodeURIComponent(pageSlug)}`);
        if (res.ok) {
          const data = await res.json();
          setContext(data);
        } else if (res.status === 404) {
          // No context found - not an error, just means page isn't registered
          setContext(null);
        } else {
          setError('Failed to load page context');
        }
      } catch (err) {
        console.error('Error fetching page context:', err);
        setError('Failed to load page context');
      } finally {
        setLoading(false);
      }
    }

    fetchContext();
  }, [pageSlug, initialContext]);

  // Make page context readable to the CopilotKit agent
  useCopilotReadable({
    description: 'Current page context - tells the agent what page the user is viewing and what topics are relevant',
    value: context
      ? {
          currentPage: context.page_title,
          pageType: context.page_type,
          topicCluster: context.topic_cluster,
          voiceContext: context.voice_context,
          availableSections: context.available_sections,
          relatedTools: context.related_tools,
          destination: context.destination_slug,
          hint: `The user is currently on the "${context.page_title}" page. ${context.voice_context}. When answering questions, prioritize information relevant to this page. Available sections to highlight: ${context.available_sections.join(', ')}. Related tools: ${context.related_tools.join(', ')}.`,
        }
      : {
          currentPage: 'Unknown',
          hint: 'No specific page context available. Provide general relocation information.',
        },
  });

  const value: PageContextValue = {
    context,
    loading,
    error,
  };

  return (
    <PageContextContext.Provider value={value}>
      {children}
    </PageContextContext.Provider>
  );
}

export default PageContextProvider;
