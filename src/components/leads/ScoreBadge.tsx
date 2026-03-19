import type { LeadTier } from '@/types/database'

const tierStyles: Record<LeadTier, string> = {
  immediate: 'bg-red-100 text-red-700 border-red-200',
  nurture: 'bg-amber-100 text-amber-700 border-amber-200',
  monitor: 'bg-gray-100 text-gray-600 border-gray-200',
  disqualified: 'bg-gray-50 text-gray-400 border-gray-100',
}

const tierLabels: Record<LeadTier, string> = {
  immediate: 'Immediate',
  nurture: 'Nurture',
  monitor: 'Monitor',
  disqualified: 'Disqualified',
}

export default function ScoreBadge({ score, tier }: { score: number; tier: LeadTier }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-bold text-lg tabular-nums">{score}</span>
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${tierStyles[tier]}`}>
        {tierLabels[tier]}
      </span>
    </div>
  )
}
