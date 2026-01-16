'use client';

import Link from 'next/link';

export type HeroVariant = 'destination' | 'guide' | 'tool' | 'landing';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface HeroBannerProps {
  variant: HeroVariant;
  title: string;
  subtitle?: string;
  image?: string;
  gradient?: string;
  flag?: string;
  breadcrumbs?: Breadcrumb[];
  children?: React.ReactNode;
}

const defaultGradients: Record<HeroVariant, string> = {
  destination: 'from-blue-900/70 to-transparent',
  guide: 'from-emerald-600 to-teal-700',
  tool: 'from-slate-700 to-slate-900',
  landing: 'from-indigo-700 to-violet-900',
};

const variantStyles: Record<HeroVariant, { minHeight: string; textSize: string }> = {
  destination: { minHeight: 'min-h-[400px] h-[50vh]', textSize: 'text-4xl md:text-5xl' },
  guide: { minHeight: 'min-h-[300px]', textSize: 'text-3xl md:text-4xl' },
  tool: { minHeight: 'min-h-[200px]', textSize: 'text-2xl md:text-3xl' },
  landing: { minHeight: 'min-h-[350px]', textSize: 'text-3xl md:text-4xl' },
};

/**
 * HeroBanner - Reusable hero component with multiple variants
 *
 * Variants:
 * - destination: Full-height with background image, for country pages
 * - guide: Medium height with gradient, for guide/article pages
 * - tool: Compact, for tool/calculator pages
 * - landing: Medium height for SEO landing pages
 *
 * Usage:
 * <HeroBanner
 *   variant="destination"
 *   title="Moving to Cyprus"
 *   subtitle="Island life with EU benefits"
 *   image="https://..."
 *   flag="🇨🇾"
 *   breadcrumbs={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Destinations' },
 *     { label: 'Cyprus' }
 *   ]}
 * />
 */
export function HeroBanner({
  variant,
  title,
  subtitle,
  image,
  gradient,
  flag,
  breadcrumbs,
  children,
}: HeroBannerProps) {
  const styles = variantStyles[variant];
  const bgGradient = gradient || defaultGradients[variant];

  // For destination variant with image
  const hasBackgroundImage = variant === 'destination' && image;

  return (
    <div
      className={`relative ${styles.minHeight} bg-cover bg-center`}
      style={
        hasBackgroundImage
          ? { backgroundImage: `url(${image})` }
          : undefined
      }
    >
      {/* Background overlay or gradient */}
      {hasBackgroundImage ? (
        <div className="absolute inset-0 bg-black/40" />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient}`} />
      )}

      {/* Content */}
      <div className="absolute inset-0 flex items-end">
        <div className="max-w-6xl mx-auto px-4 pb-8 md:pb-12 w-full">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-2 text-sm text-white/80 mb-4">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-2">
                  {i > 0 && <span>/</span>}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-white transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={i === breadcrumbs.length - 1 ? 'text-white' : ''}>
                      {crumb.label}
                    </span>
                  )}
                </span>
              ))}
            </nav>
          )}

          {/* Title area */}
          <div className="flex items-center gap-4">
            {flag && <span className="text-5xl">{flag}</span>}
            <div>
              <h1 className={`${styles.textSize} font-bold text-white`}>
                {title}
              </h1>
              {subtitle && (
                <p className="text-lg md:text-xl text-white/90 mt-2">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Optional children (e.g., CTA buttons) */}
          {children && <div className="mt-6">{children}</div>}
        </div>
      </div>
    </div>
  );
}

export default HeroBanner;
