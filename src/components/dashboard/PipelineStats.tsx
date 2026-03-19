'use client'

import { Flame, Clock, Eye, XCircle, Send, MailOpen, MessageSquare } from 'lucide-react'

interface PipelineStatsProps {
  stats: {
    total: number
    immediate: number
    nurture: number
    monitor: number
    disqualified: number
    outreachSent: number
    opened: number
    replied: number
  }
}

export default function PipelineStats({ stats }: PipelineStatsProps) {
  const cards = [
    { label: 'Total Properties', value: stats.total, icon: Eye, color: 'bg-blue-50 text-blue-600' },
    { label: 'Hot Leads', value: stats.immediate, icon: Flame, color: 'bg-red-50 text-red-600' },
    { label: 'Nurture', value: stats.nurture, icon: Clock, color: 'bg-amber-50 text-amber-600' },
    { label: 'Monitor', value: stats.monitor, icon: Eye, color: 'bg-gray-50 text-gray-500' },
    { label: 'Outreach Sent', value: stats.outreachSent, icon: Send, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Opened', value: stats.opened, icon: MailOpen, color: 'bg-green-50 text-green-600' },
    { label: 'Replied', value: stats.replied, icon: MessageSquare, color: 'bg-emerald-50 text-emerald-600' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map(card => (
        <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${card.color}`}>
            <card.icon className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold">{card.value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
        </div>
      ))}
    </div>
  )
}
