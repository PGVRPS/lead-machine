import type { LeadWithDetails } from '@/types/database'

export interface CsvColumn<T> {
  header: string
  get: (row: T) => string | number | boolean | null | undefined
}

function escapeCell(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map(c => escapeCell(c.header)).join(',')
  const body = rows.map(r => columns.map(c => escapeCell(c.get(r))).join(','))
  // BOM so Excel opens UTF-8 correctly.
  return '﻿' + [header, ...body].join('\r\n')
}

export function downloadCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void {
  const csv = toCsv(rows, columns)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Shared column set for exporting leads. Both the leads table and the reports
// page use this so the CSV shape stays consistent across the app.
export const LEAD_CSV_COLUMNS: CsvColumn<LeadWithDetails>[] = [
  { header: 'Name', get: l => l.name },
  { header: 'City', get: l => l.city },
  { header: 'State', get: l => l.state },
  { header: 'Address', get: l => l.address },
  { header: 'Zip', get: l => l.zip },
  { header: 'Score', get: l => l.lead_score?.score ?? '' },
  { header: 'Tier', get: l => l.lead_score?.tier ?? '' },
  { header: 'Estimated Units', get: l => l.latest_units_analysis?.estimated_units ?? '' },
  { header: 'Unit Confidence', get: l => l.latest_units_analysis?.unit_confidence ?? '' },
  { header: 'Parking Score', get: l => l.latest_parking_analysis?.parking_score ?? '' },
  {
    header: 'Has Vacation Rentals',
    get: l => {
      const v = l.latest_rentals_analysis?.has_vacation_rentals
      if (v === true) return 'Yes'
      if (v === false) return 'No'
      return ''
    },
  },
  { header: 'Google Rating', get: l => l.google_rating ?? '' },
  { header: 'Review Count', get: l => l.review_count },
  { header: 'Website', get: l => l.website },
  { header: 'Phone', get: l => l.phone },
  { header: 'Management Company', get: l => l.contacts[0]?.management_company ?? '' },
  { header: 'Contact Name', get: l => l.contacts[0]?.contact_name ?? '' },
  { header: 'Contact Title', get: l => l.contacts[0]?.contact_title ?? '' },
  { header: 'Contact Email', get: l => l.contacts[0]?.email ?? '' },
  { header: 'Contact Phone', get: l => l.contacts[0]?.phone ?? '' },
  { header: 'Current Stage', get: l => l.current_stage ?? '' },
  { header: 'Outreach Count', get: l => l.outreach_count },
  { header: 'Scraped At', get: l => l.scraped_at },
]
