# MDX Investment Dashboards

## Overview

Each wine page (`/wines/[slug]`) renders an MDX-based investment dashboard with interactive components. This is the core differentiator for SEO - unique, rich content per wine.

---

## Components

### InvestmentScore

Displays the AI-generated investment score with trend indicator.

```tsx
// frontend/src/components/mdx/InvestmentScore.tsx
interface Props {
  score: number;        // 1-100
  trend: 'rising' | 'stable' | 'declining';
}

<InvestmentScore score={85} trend="rising" />
```

**Visual**: Large score badge with color gradient (green > yellow > red) and arrow indicator for trend.

---

### DrinkingWindowChart

Visualizes the optimal drinking window using Recharts.

```tsx
// frontend/src/components/mdx/DrinkingWindowChart.tsx
interface Props {
  start: number;    // Year
  peak: number;     // Year
  end: number;      // Year
  current: number;  // Current year (auto-filled)
}

<DrinkingWindowChart start={2024} peak={2028} end={2035} />
```

**Visual**: Timeline bar showing:
- Gray zone: Too early
- Green zone: Optimal window
- Yellow marker: Peak year
- Red line: Current year position

---

### TastingProfile

Flavor wheel visualization of wine characteristics.

```tsx
// frontend/src/components/mdx/TastingProfile.tsx
interface Props {
  body: 'light' | 'medium' | 'full';
  tannins: 'low' | 'medium' | 'high';
  acidity: 'low' | 'medium' | 'high';
  sweetness: 'dry' | 'off-dry' | 'sweet';
  aromas: string[];
  flavors: string[];
}

<TastingProfile
  body="full"
  tannins="high"
  acidity="medium"
  sweetness="dry"
  aromas={['cherry', 'oak', 'vanilla']}
  flavors={['blackberry', 'tobacco', 'leather']}
/>
```

**Visual**: Radar chart with 4 axes (body, tannins, acidity, sweetness) + tag cloud of aromas/flavors.

---

### PriceHistoryChart

Shows estimated price trajectory (AI-generated).

```tsx
// frontend/src/components/mdx/PriceHistoryChart.tsx
interface Props {
  currentPrice: number;
  priceHistory: { year: number; price: number }[];
  projectedPrice: number;
}

<PriceHistoryChart
  currentPrice={45}
  priceHistory={[{year: 2020, price: 35}, {year: 2022, price: 40}]}
  projectedPrice={55}
/>
```

**Visual**: Line chart with historical data points and dotted projection line.

---

### CriticScoreComparison

Compares estimated score to similar wines.

```tsx
// frontend/src/components/mdx/CriticScoreComparison.tsx
interface Props {
  estimatedScore: number;
  comparableWines: { name: string; score: number }[];
}

<CriticScoreComparison
  estimatedScore={92}
  comparableWines={[
    { name: 'Similar Wine A', score: 90 },
    { name: 'Similar Wine B', score: 94 },
  ]}
/>
```

**Visual**: Horizontal bar chart comparing scores.

---

### SimilarWines

Grid of comparable wine cards.

```tsx
// frontend/src/components/mdx/SimilarWines.tsx
interface Props {
  wines: Wine[];
}

<SimilarWines wines={similarWines} />
```

**Visual**: 3-column grid of wine cards with image, name, price.

---

### AddToCart

CTA button connected to Shopify.

```tsx
// frontend/src/components/mdx/AddToCart.tsx
interface Props {
  wineId: number;
  shopifyVariantId: string;
  price: number;
  inStock: boolean;
}

<AddToCart wineId={123} price={45} inStock={true} />
```

**Visual**: Primary button with price, disabled state if out of stock.

---

## MDX Page Template

```mdx
# {wine.name} {wine.vintage}

<InvestmentScore score={wine.investmentScore} trend={wine.priceTrend} />

## Investment Analysis

This {wine.wineType} from {wine.region} shows strong investment potential...

<DrinkingWindowChart
  start={wine.drinkingWindowStart}
  peak={wine.drinkingWindowPeak}
  end={wine.drinkingWindowEnd}
/>

## Tasting Profile

{wine.tastingNotes}

<TastingProfile
  body={wine.body}
  tannins={wine.tannins}
  acidity={wine.acidity}
  sweetness={wine.sweetness}
  aromas={wine.aromas}
  flavors={wine.flavors}
/>

## Price Analysis

<PriceHistoryChart currentPrice={wine.price} projectedPrice={wine.projectedPrice} />

<CriticScoreComparison
  estimatedScore={wine.estimatedCriticScore}
  comparableWines={wine.comparableWines}
/>

## Similar Wines

<SimilarWines wines={wine.similar} />

<AddToCart wineId={wine.id} price={wine.price} inStock={wine.inStock} />
```

---

## Rendering Pattern

```tsx
// frontend/src/app/wines/[slug]/page.tsx
import { MDXRemote } from 'next-mdx-remote/rsc';
import { mdxComponents } from '@/components/mdx';

export default async function WinePage({ params }) {
  const wine = await getWine(params.slug);

  return (
    <WinePageClient wine={wine}>
      <MDXRemote source={wine.mdxContent} components={mdxComponents} />
    </WinePageClient>
  );
}
```

---

## CopilotKit Integration

MDX components can be referenced in AI responses:

```typescript
// Agent can return ViewBlocks that render as MDX components
useCopilotAction({
  name: 'show_wine_comparison',
  handler: async ({ wines }) => {
    return {
      type: 'wine_comparison',
      props: { wines }
    };
  }
});
```

This allows the AI sommelier to generate rich, interactive responses using the same component library.
