'use client'

import { Download } from 'lucide-react'
import type { LeadWithDetails } from '@/types/database'
import { downloadCsv, LEAD_CSV_COLUMNS } from '@/lib/export/csv'

interface Props {
  leads: LeadWithDetails[]
  filename?: string
  label?: string
  className?: string
}

function todayStamp(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function ExportLeadsButton({ leads, filename, label = 'Export CSV', className }: Props) {
  const disabled = leads.length === 0

  function handleClick() {
    if (disabled) return
    const name = filename ?? `leads-${todayStamp()}.csv`
    downloadCsv(name, leads, LEAD_CSV_COLUMNS)
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={
        className ??
        `flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
          disabled
            ? 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
        }`
      }
      title={disabled ? 'No leads to export' : `Export ${leads.length} row${leads.length === 1 ? '' : 's'} as CSV`}
    >
      <Download className="w-4 h-4" />
      {label}
      {!disabled && <span className="text-xs text-gray-400 tabular-nums">({leads.length})</span>}
    </button>
  )
}
