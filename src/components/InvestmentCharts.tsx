'use client'

import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface InvestmentChartsProps {
  prices: { year: string; price: number | null }[]
  annualReturn: number | null
  volatility: number | null
  liquidity: number | null
  projectedReturn: number | null
  rating: string | null
  recommendation: string | null
  wineName: string
}

export function InvestmentCharts({
  prices, annualReturn, volatility, liquidity, projectedReturn, rating, recommendation, wineName
}: InvestmentChartsProps) {
  const validPrices = prices.filter(p => p.price !== null) as { year: string; price: number }[]
  const maxPrice = Math.max(...validPrices.map(p => p.price))
  const minPrice = Math.min(...validPrices.map(p => p.price))
  const totalGrowth = minPrice > 0 ? ((maxPrice - minPrice) / minPrice * 100).toFixed(1) : '0'

  // Generate mock monthly data from annual prices for a smoother line chart
  const monthlyData = validPrices.flatMap((p, i) => {
    if (i === validPrices.length - 1) return [{ month: `${p.year}`, value: p.price }]
    const next = validPrices[i + 1]
    const diff = (next.price - p.price) / 4
    return [
      { month: `${p.year} Q1`, value: p.price },
      { month: `${p.year} Q2`, value: p.price + diff },
      { month: `${p.year} Q3`, value: p.price + diff * 2 },
      { month: `${p.year} Q4`, value: p.price + diff * 3 },
    ]
  })

  // Volatility comparison data - split into highlight vs comparison
  const volatilityData = [
    { name: 'This Wine', highlight: volatility || 0, comparison: 0 },
    { name: 'Fine Wine Avg', highlight: 0, comparison: 4.5 },
    { name: 'Equities', highlight: 0, comparison: 7.2 },
    { name: 'Bonds', highlight: 0, comparison: 2.1 },
  ]

  // Projected returns data
  const projectionData = validPrices.length > 0 ? [
    ...validPrices.map(p => ({ year: p.year, actual: p.price, projected: null as number | null })),
    { year: '2026', actual: null as number | null, projected: validPrices[validPrices.length - 1].price * 1.08 },
    { year: '2027', actual: null, projected: validPrices[validPrices.length - 1].price * 1.17 },
    { year: '2028', actual: null, projected: validPrices[validPrices.length - 1].price * 1.27 },
  ] : []

  const ratingColor = {
    'A+': '#16a34a', 'A': '#22c55e', 'B+': '#84cc16', 'B': '#eab308',
    'C+': '#f97316', 'C': '#ef4444', 'D': '#dc2626',
  }[rating || 'C'] || '#6b7280'

  return (
    <div className="space-y-8">
      {/* Header with Rating Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{wineName}</h2>
          <p className="text-white/70 text-sm mt-1">Investment Performance Analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-white/60 uppercase tracking-wider">Rating</div>
            <div className="text-3xl font-bold" style={{ color: ratingColor }}>{rating || 'N/A'}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/60 uppercase tracking-wider">Signal</div>
            <div className={`text-lg font-bold ${
              recommendation === 'BUY' ? 'text-green-400' :
              recommendation === 'STRONG BUY' ? 'text-green-300' :
              recommendation === 'HOLD' ? 'text-yellow-400' : 'text-red-400'
            }`}>{recommendation || 'HOLD'}</div>
          </div>
        </div>
      </div>

      {/* Key Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
          <div className="text-2xl font-bold text-green-400">{annualReturn ? `+${annualReturn}%` : 'N/A'}</div>
          <div className="text-xs text-white/60 mt-1 uppercase tracking-wider">Annual Return</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
          <div className="text-2xl font-bold text-blue-400">+{totalGrowth}%</div>
          <div className="text-xs text-white/60 mt-1 uppercase tracking-wider">Total Growth</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
          <div className="text-2xl font-bold text-purple-400">{projectedReturn ? `+${projectedReturn}%` : 'N/A'}</div>
          <div className="text-xs text-white/60 mt-1 uppercase tracking-wider">5yr Projection</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
          <div className="text-2xl font-bold text-amber-400">{liquidity || 'N/A'}<span className="text-sm text-white/40">/10</span></div>
          <div className="text-xs text-white/60 mt-1 uppercase tracking-wider">Liquidity</div>
        </div>
      </div>

      {/* Price History - Area Chart */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Price History</h3>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `£${v.toLocaleString()}`} />
              <Tooltip
                contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                formatter={(value) => [`£${Number(value).toLocaleString()}`, 'Price']}
              />
              <Area type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={2} fill="url(#priceGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-column: Projected Returns + Volatility Comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Projected Returns */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Growth Projection</h3>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="year" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `£${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                  formatter={(value) => value ? [`£${Number(value).toLocaleString()}`, ''] : ['-', '']}
                />
                <Line type="monotone" dataKey="actual" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} connectNulls={false} />
                <Line type="monotone" dataKey="projected" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#22c55e', r: 4, strokeDasharray: '' }} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Volatility Comparison */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Volatility vs Markets</h3>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={volatilityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 10]} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }} tickLine={false} axisLine={false} width={90} />
                <Tooltip
                  contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                  formatter={(value) => [`${Number(value)}/10`, 'Volatility']}
                />
                <Bar dataKey="highlight" stackId="vol" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                <Bar dataKey="comparison" stackId="vol" fill="rgba(255,255,255,0.2)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <p className="text-xs text-white/40 text-center">
        Investment data is illustrative. Past performance does not guarantee future results.
      </p>
    </div>
  )
}
