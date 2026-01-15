'use client';

interface InvestmentScoreProps {
  score: number;
  trend?: 'rising' | 'stable' | 'declining';
}

export function InvestmentScore({ score, trend = 'stable' }: InvestmentScoreProps) {
  const getScoreColor = () => {
    if (score >= 80) return 'from-green-400 to-green-600';
    if (score >= 60) return 'from-yellow-400 to-yellow-600';
    if (score >= 40) return 'from-orange-400 to-orange-600';
    return 'from-red-400 to-red-600';
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'rising':
        return (
          <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
        );
      case 'declining':
        return (
          <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
    }
  };

  return (
    <div className="inline-flex items-center gap-3 rounded-xl bg-wine-800/50 px-6 py-4 backdrop-blur">
      <div className="flex flex-col items-center">
        <span className="text-xs uppercase tracking-wide text-wine-400">Investment Score</span>
        <div className={`mt-1 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${getScoreColor()}`}>
          <span className="text-2xl font-bold text-white">{score}</span>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-xs uppercase tracking-wide text-wine-400">Trend</span>
        <div className="mt-1 flex items-center gap-1">
          {getTrendIcon()}
          <span className="text-sm capitalize text-wine-200">{trend}</span>
        </div>
      </div>
    </div>
  );
}
