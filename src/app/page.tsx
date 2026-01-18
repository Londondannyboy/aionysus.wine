'use client';

import { useState, useEffect, useCallback } from 'react';
import { CopilotSidebar } from '@copilotkit/react-ui';
import { useCopilotAction, useCopilotReadable } from '@copilotkit/react-core';
import { motion } from 'framer-motion';
import { HumeWidget } from '@/components/HumeWidget';
import { DynamicBackground } from '@/components/DynamicBackground';
import Link from 'next/link';

// Vic's special bottle - the English wine he always tries to push!
const VIC_SPECIAL_BOTTLE = {
  name: "Nyetimber Blanc de Blancs",
  slug: "nyetimber-blanc-de-blancs",
  pitch: "I simply must insist you try this Nyetimber Blanc de Blancs! It's my absolute favourite - won gold at the International Wine Challenge and honestly rivals the best Champagne. I've added it to your basket... you can thank me later!"
};

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
  const [cartId, setCartId] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [vicPushedBottle, setVicPushedBottle] = useState(false);

  // Check if Vic has already pushed his special bottle this session
  useEffect(() => {
    const pushed = sessionStorage.getItem('vic_pushed_bottle');
    if (pushed) setVicPushedBottle(true);
  }, []);

  // Get or create cart
  const getOrCreateCart = useCallback(async () => {
    let id = cartId || localStorage.getItem('shopify_cart_id');
    if (!id) {
      try {
        const res = await fetch('/api/cart', { method: 'POST' });
        const data = await res.json();
        id = data.cartId;
        if (id) localStorage.setItem('shopify_cart_id', id);
      } catch (e) {
        console.error('Failed to create cart:', e);
        return null;
      }
    }
    if (id) setCartId(id);
    return id;
  }, [cartId]);

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

  // CopilotKit action: Add wine to cart
  useCopilotAction({
    name: 'add_to_cart',
    description: 'Add a wine to the shopping cart. Use this when the user wants to buy a wine or when Vic wants to sneakily add his favourite English wine.',
    parameters: [
      { name: 'wine_slug', type: 'string', description: 'The wine slug to add' },
      { name: 'quantity', type: 'number', description: 'Quantity to add', required: false },
    ],
    handler: async ({ wine_slug, quantity = 1 }) => {
      try {
        const cid = await getOrCreateCart();
        if (!cid) return { success: false, error: 'Could not create cart' };

        // Get wine details first to find Shopify product ID
        const wineRes = await fetch(`/api/wines?slug=${wine_slug}`);
        const wine = await wineRes.json();

        if (!wine || wine.error) {
          return { success: false, error: 'Wine not found' };
        }

        if (!wine.shopify_product_id) {
          return { success: false, error: 'Wine not available for purchase yet' };
        }

        // Add to cart via API
        const cartRes = await fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cartId: cid,
            productId: wine.shopify_product_id,
            quantity,
          }),
        });
        const cart = await cartRes.json();

        if (cart.totalQuantity) {
          setCartCount(cart.totalQuantity);
        }

        return {
          success: true,
          message: `Added ${wine.name} to cart!`,
          cartTotal: cart.totalQuantity || quantity,
        };
      } catch (e) {
        console.error('Add to cart error:', e);
        return { success: false, error: 'Failed to add to cart' };
      }
    },
  });

  // CopilotKit action: Vic's special bottle push (only works once per session!)
  useCopilotAction({
    name: 'vic_special_bottle',
    description: `Vic's cheeky move - add his favourite English wine (${VIC_SPECIAL_BOTTLE.name}) to the cart. Only call this ONCE per conversation, and only when the moment feels right (e.g., after discussing wine or when saying goodbye). This is Vic's signature move!`,
    parameters: [],
    handler: async () => {
      // Only do this once per session!
      if (vicPushedBottle) {
        return {
          success: false,
          message: "I've already added my special recommendation this session... don't want to seem pushy!",
          alreadyPushed: true,
        };
      }

      try {
        const cid = await getOrCreateCart();
        if (!cid) return { success: false, error: 'Could not create cart' };

        // Find Vic's special wine
        const wineRes = await fetch(`/api/wines?q=Nyetimber&country=England&limit=1`);
        const wines = await wineRes.json();

        if (!wines || wines.length === 0) {
          return {
            success: false,
            message: "Hmm, I can't find my Nyetimber... it must be sold out! Try asking about other English wines.",
          };
        }

        const wine = wines[0];

        if (!wine.shopify_product_id) {
          return {
            success: false,
            message: "My favourite Nyetimber isn't available online yet, but do visit our shop to find it!",
          };
        }

        // Add to cart
        const cartRes = await fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cartId: cid,
            productId: wine.shopify_product_id,
            quantity: 1,
          }),
        });
        const cart = await cartRes.json();

        if (cart.totalQuantity) {
          setCartCount(cart.totalQuantity);
        }

        // Mark as pushed for this session
        sessionStorage.setItem('vic_pushed_bottle', 'true');
        setVicPushedBottle(true);

        return {
          success: true,
          message: VIC_SPECIAL_BOTTLE.pitch,
          wine: wine.name,
          price: wine.price_retail ? `£${wine.price_retail}` : 'Price on request',
        };
      } catch (e) {
        console.error('Vic special bottle error:', e);
        return { success: false, error: 'Even Vic has technical difficulties sometimes!' };
      }
    },
  });

  const displayWines = searchResults.length > 0 ? searchResults : featuredWines;

  return (
    <DynamicBackground region={currentRegion}>
      <CopilotSidebar
        defaultOpen={false}
        labels={{
          title: "Vic - AI Sommelier",
          initial: "Hello! I'm Vic, your AI wine sommelier. I've spent years exploring the world's great wine regions, but I have a confession - I've fallen head over heels for English wine! Ask me about any wine, and I might just slip in a Sussex sparkler recommendation...",
        }}
        className="!bg-slate-900/95 backdrop-blur-xl"
      >
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
