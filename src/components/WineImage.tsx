'use client'

import { useState } from 'react'

interface WineImageProps {
  src: string | null | undefined
  alt: string
  className?: string
  fallbackSize?: 'sm' | 'md' | 'lg' | 'xl'
}

const fallbackSizes = {
  sm: 'text-3xl',
  md: 'text-5xl',
  lg: 'text-7xl',
  xl: 'text-9xl',
}

export function WineImage({ src, alt, className = '', fallbackSize = 'lg' }: WineImageProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  if (!src || hasError) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 ${className}`}>
        <span className={`opacity-40 ${fallbackSizes[fallbackSize]}`}>🍷</span>
      </div>
    )
  }

  return (
    <>
      {isLoading && (
        <div className={`flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 absolute inset-0 ${className}`}>
          <span className={`opacity-40 animate-pulse ${fallbackSizes[fallbackSize]}`}>🍷</span>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true)
          setIsLoading(false)
        }}
      />
    </>
  )
}

export function WineCardImage({ src, alt, className = '' }: { src: string | null | undefined; alt: string; className?: string }) {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 ${className}`}>
        <span className="text-5xl opacity-40">🍷</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  )
}
