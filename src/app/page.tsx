'use client';

import { useState, useEffect } from 'react';
import { CopilotSidebar } from '@copilotkit/react-ui';
import { useCopilotAction, useCopilotReadable } from '@copilotkit/react-core';
import { motion } from 'framer-motion';
import { HumeWidget } from '@/components/HumeWidget';
import { DynamicBackground } from '@/components/DynamicBackground';
import Link from 'next/link';

// Wine type for display
interface Wine {
  id: number;
  name: string;
  slug: string;
  winery: string;
  region: string;
  country: string;
  vintage: number | null;
  price_retail: number | null;
  image_url: string | null;
}

// Wine Card Component
function WineCard({ wine }: { wine: Wine }) {
  return (
    <Link href={`/wines/${wine.slug}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden cursor-pointer hover:bg-white/15 transition-all"
      >
        <div className="aspect-[3/4] bg-slate-800 relative">
          {wine.image_url ? (
            <img
              src={wine.image_url}
              alt={wine.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              🍷
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-white line-clamp-2 mb-1">
            {wine.vintage && `${wine.vintage} `}{wine.name}
          </h3>
          <p className="text-sm text-white/60 mb-2">{wine.winery}</p>
          <p className="text-xs text-purple-400 mb-2">{wine.region}</p>
          {wine.price_retail && (
            <p className="text-lg font-bold text-white">
              £{wine.price_retail.toLocaleString()}
            </p>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

export default function Home() {
  const [featuredWines, setFeaturedWines] = useState<Wine[]>([]);
  const [searchResults, setSearchResults] = useState<Wine[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRegion, setCurrentRegion] = useState<string | null>(null);

  // Load featured wines on mount
  useEffect(() => {
    async function loadFeatured() {
      try {
        const res = await fetch('/api/wines?limit=8');
        const data = await res.json();
        setFeaturedWines(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load wines:', error);
      }
      setLoading(false);
    }
    loadFeatured();
  }, []);

  // Provide wine context to the AI
  useCopilotReadable({
    description: 'Featured wines currently displayed',
    value: featuredWines,
  });

  useCopilotReadable({
    description: 'Wine search results from user queries',
    value: searchResults,
  });

  // CopilotKit action: Search wines
  useCopilotAction({
    name: 'search_wines',
    description: 'Search for wines by name, region, producer, or style',
    parameters: [
      { name: 'query', type: 'string', description: 'Search term' },
      { name: 'region', type: 'string', description: 'Wine region filter', required: false },
      { name: 'max_price', type: 'number', description: 'Maximum price', required: false },
    ],
    handler: async ({ query, region, max_price }) => {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (region) params.set('region', region);
      if (max_price) params.set('max_price', max_price.toString());
      params.set('limit', '10');

      const res = await fetch(`/api/wines?${params}`);
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);

      // Update background based on region search
      if (region) {
        setCurrentRegion(region);
      } else if (data.length > 0 && data[0].region) {
        setCurrentRegion(data[0].region);
      }

      return {
        success: true,
        count: data.length,
        wines: data.slice(0, 5).map((w: Wine) => ({
          name: w.name,
          winery: w.winery,
          region: w.region,
          vintage: w.vintage,
          price: w.price_retail ? `£${w.price_retail}` : 'Price on request',
        })),
      };
    },
  });

  // CopilotKit action: Get wine details
  useCopilotAction({
    name: 'get_wine_details',
    description: 'Get detailed information about a specific wine',
    parameters: [
      { name: 'slug', type: 'string', description: 'Wine slug or ID' },
    ],
    handler: async ({ slug }) => {
      const res = await fetch(`/api/wines?slug=${slug}`);
      const wine = await res.json();

      if (wine.error) {
        return { success: false, error: 'Wine not found' };
      }

      return {
        success: true,
        wine: {
          name: wine.name,
          winery: wine.winery,
          region: wine.region,
          country: wine.country,
          vintage: wine.vintage,
          price: wine.price_retail ? `£${wine.price_retail}` : 'Price on request',
          grape: wine.grape_variety,
          classification: wine.classification,
        },
      };
    },
  });

  const displayWines = searchResults.length > 0 ? searchResults : featuredWines;

  return (
    <DynamicBackground region={currentRegion}>
      <CopilotSidebar
        defaultOpen={false}
        labels={{
          title: "Dionysus - AI Sommelier",
          initial: "Hello! I'm Dionysus, your AI wine sommelier. Ask me about wines, regions, food pairings, or help finding the perfect bottle.",
        }}
        className="!bg-slate-900/95 backdrop-blur-xl"
      >
        <main className="p-6 lg:p-12">
          {/* Hero Section */}
          <div className="max-w-5xl mx-auto text-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl lg:text-6xl font-bold text-white mb-4"
            >
              Your AI <span className="text-purple-400">Wine Sommelier</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-white/60 max-w-2xl mx-auto mb-8"
            >
              Discover exceptional wines from our collection of 3,900+ fine wines.
              Chat with Dionysus or speak to find your perfect bottle.
            </motion.p>

            {/* Voice Widget */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center mb-8"
            >
              <HumeWidget />
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <Link
                href="/wines"
                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-500 transition-colors"
              >
                Browse All Wines
              </Link>
              <Link
                href="/wines?region=Burgundy"
                className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors border border-white/10"
              >
                Burgundy
              </Link>
              <Link
                href="/wines?region=Champagne"
                className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors border border-white/10"
              >
                Champagne
              </Link>
              <Link
                href="/wines?region=Bordeaux"
                className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors border border-white/10"
              >
                Bordeaux
              </Link>
            </motion.div>
          </div>

          {/* Wine Grid */}
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">
              {searchResults.length > 0 ? 'Search Results' : 'Featured Wines'}
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayWines.map((wine) => (
                  <WineCard key={wine.id} wine={wine} />
                ))}
              </div>
            )}

            {!loading && displayWines.length === 0 && (
              <div className="text-center py-20 text-white/60">
                No wines found. Try a different search.
              </div>
            )}
          </div>
        </main>
      </CopilotSidebar>
    </DynamicBackground>
  );
}
