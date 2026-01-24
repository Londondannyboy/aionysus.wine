'use client'

import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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

const COLORS = {
  primary: '#7c2d12',    // burgundy-800
  secondary: '#9a3412',  // orange-800 (warm)
  accent: '#166534',     // green-800
  chart1: '#7c2d12',     // burgundy
  chart2: '#1d4ed8',     // blue
  chart3: '#15803d',     // green
  chart4: '#9333ea',     // purple
  chart5: '#ca8a04',     // yellow
  muted: '#78716c',      // stone-500
  grid: '#e7e5e4',       // stone-200
  text: '#44403c',       // stone-700
  lightText: '#a8a29e',  // stone-400
}

export function InvestmentCharts({
  prices, annualReturn, volatility, liquidity, projectedReturn, rating, recommendation, wineName
}: InvestmentChartsProps) {
  const validPrices = prices.filter(p => p.price !== null) as { year: string; price: number }[]
  const maxPrice = Math.max(...validPrices.map(p => p.price))
  const minPrice = Math.min(...validPrices.map(p => p.price))
  const totalGrowth = minPrice > 0 ? ((maxPrice - minPrice) / minPrice * 100).toFixed(1) : '0'
  const latestPrice = validPrices.length > 0 ? validPrices[validPrices.length - 1].price : 0

  // Generate quarterly data from annual prices
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

  // Performance vs Benchmarks
  const benchmarkData = [
    { name: wineName.split(' ').slice(0, 2).join(' '), return: annualReturn || 0, fill: COLORS.chart1 },
    { name: 'Fine Wine 100', return: 8.2, fill: COLORS.chart4 },
    { name: 'S&P 500', return: 10.5, fill: COLORS.chart2 },
    { name: 'Gold', return: 6.8, fill: COLORS.chart5 },
    { name: 'UK Bonds', return: 2.1, fill: COLORS.muted },
  ]

  // Projected returns data with 5-year projection
  const projectionData = validPrices.length > 0 ? [
    ...validPrices.map(p => ({ year: p.year, actual: p.price, projected: null as number | null })),
    { year: '2026', actual: null as number | null, projected: latestPrice * 1.08 },
    { year: '2027', actual: null, projected: latestPrice * 1.17 },
    { year: '2028', actual: null, projected: latestPrice * 1.27 },
    { year: '2029', actual: null, projected: latestPrice * 1.38 },
    { year: '2030', actual: null, projected: latestPrice * 1.50 },
  ] : []

  // Portfolio allocation pie chart
  const portfolioData = [
    { name: 'Fine Wine', value: 15, fill: COLORS.chart1 },
    { name: 'Equities', value: 45, fill: COLORS.chart2 },
    { name: 'Bonds', value: 25, fill: COLORS.muted },
    { name: 'Alternative', value: 10, fill: COLORS.chart4 },
    { name: 'Cash', value: 5, fill: COLORS.lightText },
  ]

  // Volatility comparison
  const volatilityData = [
    { name: 'This Wine', value: volatility || 0 },
    { name: 'Fine Wine Avg', value: 4.5 },
    { name: 'Equities', value: 7.2 },
    { name: 'Crypto', value: 9.5 },
    { name: 'Bonds', value: 2.1 },
  ]

  const ratingColor = {
    'A+': '#166534', 'A': '#15803d', 'B+': '#65a30d', 'B': '#ca8a04',
    'C+': '#ea580c', 'C': '#dc2626', 'D': '#991b1b',
  }[rating || 'C'] || '#78716c'

  const recommendationStyle = {
    'BUY': { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' },
    'STRONG BUY': { bg: 'bg-green-100', text: 'text-green-900', border: 'border-green-300' },
    'HOLD': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    'SELL': { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
  }[recommendation || 'HOLD'] || { bg: 'bg-stone-50', text: 'text-stone-700', border: 'border-stone-200' }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">{wineName}</h2>
          <p className="text-stone-500 text-sm mt-1">Investment Performance Analysis</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center px-4 py-2 bg-stone-50 rounded-xl border border-stone-200">
            <div className="text-xs text-stone-500 uppercase tracking-wider">Rating</div>
            <div className="text-2xl font-bold" style={{ color: ratingColor }}>{rating || 'N/A'}</div>
          </div>
          <div className={`text-center px-4 py-2 rounded-xl border ${recommendationStyle.bg} ${recommendationStyle.border}`}>
            <div className="text-xs text-stone-500 uppercase tracking-wider">Signal</div>
            <div className={`text-lg font-bold ${recommendationStyle.text}`}>{recommendation || 'HOLD'}</div>
          </div>
        </div>
      </div>

      {/* Key Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-stone-50 rounded-xl p-4 text-center border border-stone-200">
          <div className="text-2xl font-bold text-green-700">{annualReturn ? `+${annualReturn}%` : 'N/A'}</div>
          <div className="text-xs text-stone-500 mt-1 uppercase tracking-wider">Annual Return</div>
        </div>
        <div className="bg-stone-50 rounded-xl p-4 text-center border border-stone-200">
          <div className="text-2xl font-bold text-blue-700">+{totalGrowth}%</div>
          <div className="text-xs text-stone-500 mt-1 uppercase tracking-wider">Total Growth</div>
        </div>
        <div className="bg-stone-50 rounded-xl p-4 text-center border border-stone-200">
          <div className="text-2xl font-bold text-purple-700">{projectedReturn ? `+${projectedReturn}%` : 'N/A'}</div>
          <div className="text-xs text-stone-500 mt-1 uppercase tracking-wider">5yr Projection</div>
        </div>
        <div className="bg-stone-50 rounded-xl p-4 text-center border border-stone-200">
          <div className="text-2xl font-bold text-amber-700">{liquidity || 'N/A'}<span className="text-sm text-stone-400">/10</span></div>
          <div className="text-xs text-stone-500 mt-1 uppercase tracking-wider">Liquidity</div>
        </div>
        <div className="bg-stone-50 rounded-xl p-4 text-center border border-stone-200">
          <div className="text-2xl font-bold text-stone-800">£{latestPrice.toLocaleString()}</div>
          <div className="text-xs text-stone-500 mt-1 uppercase tracking-wider">Current Value</div>
        </div>
      </div>

      {/* Price History - Full Width Area Chart */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
        <h3 className="text-lg font-semibold text-stone-900 mb-1">Price History</h3>
        <p className="text-sm text-stone-500 mb-4">Historical performance from 2020 to present</p>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="priceGradientLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.chart1} stopOpacity={0.2} />
                <stop offset="95%" stopColor={COLORS.chart1} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
            <XAxis dataKey="month" tick={{ fill: COLORS.text, fontSize: 11 }} tickLine={false} axisLine={false} interval={3} />
            <YAxis tick={{ fill: COLORS.text, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `£${v.toLocaleString()}`} />
            <Tooltip
              contentStyle={{ background: '#fff', border: `1px solid ${COLORS.grid}`, borderRadius: '12px', color: COLORS.text, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              formatter={(value) => [`£${Number(value).toLocaleString()}`, 'Price']}
            />
            <Area type="monotone" dataKey="value" stroke={COLORS.chart1} strokeWidth={2.5} fill="url(#priceGradientLight)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Two-column: Projection + Benchmarks */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 5-Year Growth Projection */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
          <h3 className="text-lg font-semibold text-stone-900 mb-1">5-Year Growth Projection</h3>
          <p className="text-sm text-stone-500 mb-4">Based on historical appreciation rate</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
              <XAxis dataKey="year" tick={{ fill: COLORS.text, fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: COLORS.text, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `£${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#fff', border: `1px solid ${COLORS.grid}`, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                formatter={(value) => value ? [`£${Number(value).toLocaleString()}`, ''] : ['-', '']}
              />
              <Line type="monotone" dataKey="actual" stroke={COLORS.chart3} strokeWidth={2.5} dot={{ fill: COLORS.chart3, r: 4 }} connectNulls={false} />
              <Line type="monotone" dataKey="projected" stroke={COLORS.chart3} strokeWidth={2} strokeDasharray="6 4" dot={{ fill: COLORS.chart3, r: 3, strokeDasharray: '' }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Performance vs Benchmarks */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
          <h3 className="text-lg font-semibold text-stone-900 mb-1">Annual Returns vs Benchmarks</h3>
          <p className="text-sm text-stone-500 mb-4">Annualised return comparison (%)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={benchmarkData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} horizontal={false} />
              <XAxis type="number" tick={{ fill: COLORS.text, fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
              <YAxis type="category" dataKey="name" tick={{ fill: COLORS.text, fontSize: 11 }} tickLine={false} axisLine={false} width={85} />
              <Tooltip
                contentStyle={{ background: '#fff', border: `1px solid ${COLORS.grid}`, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                formatter={(value) => [`${Number(value)}%`, 'Return']}
              />
              <Bar dataKey="return" radius={[0, 6, 6, 0]}>
                {benchmarkData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-column: Portfolio Allocation + Volatility */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Portfolio Allocation Pie Chart */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
          <h3 className="text-lg font-semibold text-stone-900 mb-1">Recommended Portfolio Allocation</h3>
          <p className="text-sm text-stone-500 mb-4">Suggested allocation including fine wine</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={portfolioData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name} ${value}%`}
              >
                {portfolioData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#fff', border: `1px solid ${COLORS.grid}`, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                formatter={(value) => [`${Number(value)}%`, 'Allocation']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Volatility Comparison */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
          <h3 className="text-lg font-semibold text-stone-900 mb-1">Risk Profile: Volatility</h3>
          <p className="text-sm text-stone-500 mb-4">Volatility score comparison (lower = less volatile)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={volatilityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} horizontal={false} />
              <XAxis type="number" tick={{ fill: COLORS.text, fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 10]} />
              <YAxis type="category" dataKey="name" tick={{ fill: COLORS.text, fontSize: 11 }} tickLine={false} axisLine={false} width={85} />
              <Tooltip
                contentStyle={{ background: '#fff', border: `1px solid ${COLORS.grid}`, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                formatter={(value) => [`${Number(value)}/10`, 'Volatility']}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} fill={COLORS.chart4}>
                {volatilityData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.chart1 : COLORS.muted} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Investment Forecast Summary */}
      <div className="bg-gradient-to-r from-stone-50 to-stone-100 rounded-2xl p-6 border border-stone-200">
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-2">Investment Outlook</h4>
            <p className="text-stone-700 text-sm leading-relaxed">
              {annualReturn && annualReturn > 8
                ? `With ${annualReturn}% annual returns, this wine outperforms most traditional asset classes while offering portfolio diversification benefits.`
                : 'Fine wine offers strong portfolio diversification with low correlation to traditional markets.'}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-2">Risk Assessment</h4>
            <p className="text-stone-700 text-sm leading-relaxed">
              {volatility && volatility < 5
                ? `Volatility score of ${volatility}/10 indicates lower risk than equities. Fine wine benefits from physical asset backing.`
                : 'Moderate volatility with strong downside protection due to physical asset characteristics.'}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-2">Liquidity Note</h4>
            <p className="text-stone-700 text-sm leading-relaxed">
              {liquidity && liquidity >= 7
                ? `High liquidity score (${liquidity}/10) indicates strong secondary market demand and ease of exit.`
                : `Liquidity score of ${liquidity || 'N/A'}/10. Consider as a medium to long-term hold for optimal returns.`}
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-stone-400 text-center">
        Investment data is illustrative. Past performance does not guarantee future results. Wine should represent 5-15% of a diversified portfolio.
      </p>
    </div>
  )
}
