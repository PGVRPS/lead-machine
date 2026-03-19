'use client'

import { MapPin } from 'lucide-react'

interface RegionBreakdownProps {
  data: Array<{ city: string; count: number }>
}

const cityColors = [
  'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-teal-500',
]

export default function RegionBreakdown({ data }: RegionBreakdownProps) {
  const sorted = [...data].sort((a, b) => b.count - a.count)
  const total = sorted.reduce((s, d) => s + d.count, 0)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-sm mb-4">Leads by Region</h3>
      <div className="space-y-2.5">
        {sorted.map((d, i) => (
          <div key={d.city} className="flex items-center gap-3">
            <MapPin className={`w-3.5 h-3.5 ${cityColors[i % cityColors.length].replace('bg-', 'text-')}`} />
            <span className="text-sm text-gray-700 flex-1">{d.city}</span>
            <span className="text-sm font-medium tabular-nums">{d.count}</span>
            <span className="text-xs text-gray-400 w-8 text-right tabular-nums">
              {Math.round((d.count / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
