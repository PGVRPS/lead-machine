'use client'

import { useState } from 'react'
import { Search, Loader2, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function EnrichButton({ propertyId }: { propertyId: string }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ enriched: boolean; contactCount: number } | null>(null)
  const router = useRouter()

  async function handleEnrich() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/enrich/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      })
      const data = await res.json()
      setResult({ enriched: data.enriched ?? false, contactCount: data.contactCount ?? 0 })
      // Refresh the page to show new contacts
      if (data.enriched) {
        router.refresh()
      }
    } catch {
      setResult({ enriched: false, contactCount: 0 })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleEnrich}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching...</>
        ) : result?.enriched ? (
          <><CheckCircle className="w-3.5 h-3.5" /> Found {result.contactCount} contact{result.contactCount !== 1 ? 's' : ''}</>
        ) : (
          <><Search className="w-3.5 h-3.5" /> Find Contacts</>
        )}
      </button>
      {result && !result.enriched && !loading && (
        <p className="text-xs text-gray-400 mt-1">No contacts found from available sources</p>
      )}
    </div>
  )
}
