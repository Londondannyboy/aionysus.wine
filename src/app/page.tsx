'use client';

import { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(true);

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

  // Note: CopilotKit actions (search, add_to_cart, etc.) are handled globally
  // by GlobalCopilotActions in providers.tsx - no need to duplicate here

  return (
    <DynamicBackground region={null}>
      <main className="p-6 lg:p-12">
        {/* English Wine Month Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto mb-6"
        >
          <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl px-6 py-3 text-center backdrop-blur-sm">
            <span className="text-green-400 font-semibold">Vic&apos;s English Wine Month</span>
            <span className="text-white/60 ml-2">| Discover award-winning English sparkling wines</span>
          </div>
        </motion.div>

        {/* Hero Section */}
        <div className="max-w-5xl mx-auto text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl lg:text-6xl font-bold text-white mb-4"
          >
            Meet <span className="text-purple-400">Vic</span>, Your AI Sommelier
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/60 max-w-2xl mx-auto mb-8"
          >
            Discover exceptional wines from our collection of 3,900+ fine wines.
            Chat with Vic or speak to find your perfect bottle. Fair warning: I might mention English wine...
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
              href="/wines?country=England"
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-500 hover:to-emerald-500 transition-all border border-green-400/30"
            >
              English Wine
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
            <Link
              href="/regions/gevrey-chambertin"
              className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors border border-white/10"
            >
              Gevrey-Chambertin
            </Link>
            <Link
              href="/regions/chassagne-montrachet"
              className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors border border-white/10"
            >
              Chassagne-Montrachet
            </Link>
          </motion.div>
        </div>

        {/* Wine Grid */}
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">
            Featured Wines
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredWines.map((wine) => (
                <WineCard key={wine.id} wine={wine} />
              ))}
            </div>
          )}

          {!loading && featuredWines.length === 0 && (
            <div className="text-center py-20 text-white/60">
              No wines found. Check back soon!
            </div>
          )}
        </div>
      </main>
    </DynamicBackground>
  );
}
