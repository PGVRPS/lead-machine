'use client'

interface ScoreDistributionProps {
  data: Array<{ range: string; count: number }>
}

const barColors: Record<string, string> = {
  '80-100': 'bg-red-500',
  '60-79': 'bg-amber-500',
  '40-59': 'bg-gray-400',
  '0-39': 'bg-gray-200',
}

export default function ScoreDistribution({ data }: ScoreDistributionProps) {
  const max = Math.max(...data.map(d => d.count), 1)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-sm mb-4">Score Distribution</h3>
      <div className="space-y-3">
        {data.map(d => (
          <div key={d.range} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-12 text-right tabular-nums">{d.range}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barColors[d.range] || 'bg-blue-500'}`}
                style={{ width: `${(d.count / max) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium w-6 text-right tabular-nums">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
