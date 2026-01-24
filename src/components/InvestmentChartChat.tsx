'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'

interface InvestmentChartChatProps {
  wineName: string
  prices: { year: string; price: number | null }[]
  annualReturn: number | null
  volatility: number | null
  liquidity: number | null
  projectedReturn: number | null
  rating: string | null
  recommendation: string | null
}

export function InvestmentChartChat({
  wineName, prices, annualReturn, projectedReturn, rating, recommendation
}: InvestmentChartChatProps) {
  const validPrices = prices.filter(p => p.price !== null) as { year: string; price: number }[]
  const latestPrice = validPrices.length > 0 ? validPrices[validPrices.length - 1].price : 0
  const firstPrice = validPrices.length > 0 ? validPrices[0].price : 0
  const totalGrowth = firstPrice > 0 ? ((latestPrice - firstPrice) / firstPrice * 100).toFixed(1) : '0'

  const ratingColor = {
    'A+': '#166534', 'A': '#15803d', 'B+': '#65a30d', 'B': '#ca8a04',
    'C+': '#ea580c', 'C': '#dc2626', 'D': '#991b1b',
  }[rating || 'C'] || '#78716c'

  // Benchmark comparison
  const benchmarks = [
    { name: 'This Wine', value: annualReturn || 0 },
    { name: 'Fine Wine', value: 8.2 },
    { name: 'S&P 500', value: 10.5 },
    { name: 'Gold', value: 6.8 },
  ]

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden max-w-[340px] my-2">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-stone-900 text-sm">{wineName}</h4>
          <p className="text-xs text-stone-500">Investment Analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-center">
            <div className="text-lg font-bold" style={{ color: ratingColor }}>{rating || 'N/A'}</div>
            <div className="text-[10px] text-stone-400 uppercase">Rating</div>
          </div>
          <div className={`px-2 py-1 rounded-md text-xs font-bold ${
            recommendation === 'BUY' || recommendation === 'STRONG BUY' ? 'bg-green-50 text-green-800' :
            recommendation === 'HOLD' ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-800'
          }`}>
            {recommendation || 'HOLD'}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-1 px-3 py-2">
        <div className="text-center p-1.5 bg-stone-50 rounded-lg">
          <div className="text-sm font-bold text-green-700">{annualReturn ? `+${annualReturn}%` : 'N/A'}</div>
          <div className="text-[9px] text-stone-400 uppercase">Annual</div>
        </div>
        <div className="text-center p-1.5 bg-stone-50 rounded-lg">
          <div className="text-sm font-bold text-blue-700">+{totalGrowth}%</div>
          <div className="text-[9px] text-stone-400 uppercase">Total</div>
        </div>
        <div className="text-center p-1.5 bg-stone-50 rounded-lg">
          <div className="text-sm font-bold text-purple-700">{projectedReturn ? `+${projectedReturn}%` : 'N/A'}</div>
          <div className="text-[9px] text-stone-400 uppercase">5yr</div>
        </div>
        <div className="text-center p-1.5 bg-stone-50 rounded-lg">
          <div className="text-sm font-bold text-stone-800">£{(latestPrice / 1000).toFixed(1)}k</div>
          <div className="text-[9px] text-stone-400 uppercase">Value</div>
        </div>
      </div>

      {/* Price Chart */}
      {validPrices.length > 0 && (
        <div className="px-3 py-2">
          <p className="text-[10px] text-stone-400 uppercase font-semibold mb-1">Price History</p>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={validPrices}>
              <defs>
                <linearGradient id="chatGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c2d12" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#7c2d12" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="year" tick={{ fontSize: 9, fill: '#a8a29e' }} tickLine={false} axisLine={false} />
              <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '8px', fontSize: '11px' }}
                formatter={(value) => [`£${Number(value).toLocaleString()}`, 'Price']}
              />
              <Area type="monotone" dataKey="price" stroke="#7c2d12" strokeWidth={2} fill="url(#chatGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Benchmarks */}
      <div className="px-3 py-2 border-t border-stone-100">
        <p className="text-[10px] text-stone-400 uppercase font-semibold mb-1">Annual Return vs Benchmarks</p>
        <ResponsiveContainer width="100%" height={70}>
          <BarChart data={benchmarks} layout="vertical">
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#78716c' }} tickLine={false} axisLine={false} width={60} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={10}>
              {benchmarks.map((_, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#7c2d12' : '#d6d3d1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-amber-50 border-t border-amber-100">
        <p className="text-[9px] text-amber-700">Beta — Illustrative data only. Not financial advice.</p>
      </div>
    </div>
  )
}

export function InvestmentChartChatLoading() {
  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden max-w-[340px] my-2 animate-pulse">
      <div className="p-4 space-y-2">
        <div className="h-4 bg-stone-200 rounded w-2/3" />
        <div className="h-3 bg-stone-100 rounded w-1/3" />
      </div>
      <div className="px-3 py-2 grid grid-cols-4 gap-1">
        {[1,2,3,4].map(i => <div key={i} className="h-10 bg-stone-100 rounded-lg" />)}
      </div>
      <div className="px-3 py-2">
        <div className="h-20 bg-stone-50 rounded" />
      </div>
    </div>
  )
}
