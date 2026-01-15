'use client';

import { useMemo } from 'react';

interface DrinkingWindowChartProps {
  start: number;
  peak: number;
  end: number;
}

export function DrinkingWindowChart({ start, peak, end }: DrinkingWindowChartProps) {
  const currentYear = new Date().getFullYear();

  const { position, status, statusColor } = useMemo(() => {
    if (currentYear < start) {
      return { position: 0, status: 'Too Early', statusColor: 'text-yellow-400' };
    }
    if (currentYear > end) {
      return { position: 100, status: 'Past Peak', statusColor: 'text-red-400' };
    }
    const range = end - start;
    const pos = ((currentYear - start) / range) * 100;

    if (currentYear <= peak) {
      return { position: pos, status: 'Approaching Peak', statusColor: 'text-green-400' };
    }
    return { position: pos, status: 'At Peak', statusColor: 'text-gold-400' };
  }, [currentYear, start, peak, end]);

  const peakPosition = ((peak - start) / (end - start)) * 100;

  return (
    <div className="rounded-xl bg-wine-800/50 p-6 backdrop-blur">
      <h3 className="mb-4 font-serif text-lg font-semibold text-gold-300">Drinking Window</h3>

      {/* Status */}
      <div className="mb-4 flex items-center justify-between">
        <span className={`text-sm font-medium ${statusColor}`}>{status}</span>
        <span className="text-sm text-wine-400">Current: {currentYear}</span>
      </div>

      {/* Timeline */}
      <div className="relative mb-2">
        {/* Background bar */}
        <div className="h-4 w-full overflow-hidden rounded-full bg-wine-700">
          {/* Optimal window */}
          <div
            className="h-full bg-gradient-to-r from-yellow-600 via-green-500 to-yellow-600"
            style={{ width: '100%' }}
          />
        </div>

        {/* Peak marker */}
        <div
          className="absolute top-0 h-4 w-1 bg-gold-400"
          style={{ left: `${peakPosition}%`, transform: 'translateX(-50%)' }}
        />

        {/* Current year marker */}
        <div
          className="absolute -top-1 h-6 w-0.5 bg-white"
          style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-white">
            Now
          </div>
        </div>
      </div>

      {/* Year labels */}
      <div className="flex justify-between text-xs text-wine-400">
        <span>{start}</span>
        <span className="text-gold-400">Peak: {peak}</span>
        <span>{end}</span>
      </div>
    </div>
  );
}
