'use client'

import { useState, useEffect } from 'react'
import { Save, RotateCcw, Plus, X, Loader2 } from 'lucide-react'
import { DEFAULT_SCORING_WEIGHTS, DEFAULT_TIER_THRESHOLDS, GULF_COAST_REGIONS, SEARCH_TERMS } from '@/lib/scoring/config'

export default function SettingsPage() {
  const [weights, setWeights] = useState<Record<string, number>>({ ...DEFAULT_SCORING_WEIGHTS })
  const [thresholds, setThresholds] = useState<Record<string, number>>({ ...DEFAULT_TIER_THRESHOLDS })
  const [regions, setRegions] = useState<string[]>([])
  const [searchTerms, setSearchTerms] = useState<string[]>([])
  const [newRegion, setNewRegion] = useState('')
  const [newTerm, setNewTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const weightLabels: Record<string, string> = {
    units_50_200: '50-200 Units',
    units_200_350: '200-350 Units',
    vacation_rentals: 'Vacation Rentals Allowed',
    parking_complaints: 'Parking Complaints (7+ severity)',
    security_patrol: 'Security Patrol Mentioned',
    pass_price_40_plus: 'Pass Price $40+',
    google_parking_mentions: 'Google Review Parking Mentions',
  }

  const maxPoints = Object.values(weights).reduce((s, v) => s + v, 0)

  useEffect(() => {
    fetchConfig()
  }, [])

  async function fetchConfig() {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      setRegions(data.regions || [...GULF_COAST_REGIONS])
      setSearchTerms(data.searchTerms || [...SEARCH_TERMS])
      if (data.scoringWeights && Object.keys(data.scoringWeights).length > 0) {
        setWeights(data.scoringWeights)
      }
      if (data.tierThresholds && Object.keys(data.tierThresholds).length > 0) {
        setThresholds(data.tierThresholds)
      }
    } catch {
      setRegions([...GULF_COAST_REGIONS])
      setSearchTerms([...SEARCH_TERMS])
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regions, searchTerms, scoringWeights: weights, tierThresholds: thresholds }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setWeights({ ...DEFAULT_SCORING_WEIGHTS })
    setThresholds({ ...DEFAULT_TIER_THRESHOLDS })
    setRegions([...GULF_COAST_REGIONS])
    setSearchTerms([...SEARCH_TERMS])
  }

  function addRegion() {
    const trimmed = newRegion.trim()
    if (trimmed && !regions.includes(trimmed)) {
      setRegions([...regions, trimmed])
      setNewRegion('')
    }
  }

  function removeRegion(region: string) {
    setRegions(regions.filter(r => r !== region))
  }

  function addTerm() {
    const trimmed = newTerm.trim().toLowerCase()
    if (trimmed && !searchTerms.includes(trimmed)) {
      setSearchTerms([...searchTerms, trimmed])
      setNewTerm('')
    }
  }

  function removeTerm(term: string) {
    setSearchTerms(searchTerms.filter(t => t !== term))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Configure scoring weights, target regions, search terms, and API keys</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Scoring Weights */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="font-semibold">Scoring Weights</h3>
          <p className="text-sm text-gray-500 mt-0.5">Adjust how each factor contributes to the VRPS Lead Score (max total: {maxPoints})</p>
        </div>

        <div className="space-y-5">
          {Object.entries(weights).map(([key, value]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">{weightLabels[key]}</label>
                <span className="text-sm font-bold tabular-nums text-blue-600">+{value}</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                value={value}
                onChange={e => setWeights(w => ({ ...w, [key]: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>0</span>
                <span>50</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier Thresholds */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold mb-4">Tier Thresholds</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Immediate ({thresholds.immediate}+)</label>
            <input
              type="number"
              min={0} max={100}
              value={thresholds.immediate}
              onChange={e => setThresholds(t => ({ ...t, immediate: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <p className="text-xs text-red-500 mt-0.5">Immediate outreach</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Nurture ({thresholds.nurture}+)</label>
            <input
              type="number"
              min={0} max={100}
              value={thresholds.nurture}
              onChange={e => setThresholds(t => ({ ...t, nurture: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <p className="text-xs text-amber-500 mt-0.5">Follow-up sequence</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Monitor ({thresholds.monitor}+)</label>
            <input
              type="number"
              min={0} max={100}
              value={thresholds.monitor}
              onChange={e => setThresholds(t => ({ ...t, monitor: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <p className="text-xs text-gray-500 mt-0.5">Watch for changes</p>
          </div>
        </div>
      </div>

      {/* Target Regions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold mb-4">Target Regions</h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newRegion}
            onChange={e => setNewRegion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addRegion()}
            placeholder="e.g. Hilton Head, SC"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={addRegion}
            disabled={!newRegion.trim()}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {regions.map(region => (
            <div key={region} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg group">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-sm text-blue-700">{region}</span>
              <button
                onClick={() => removeRegion(region)}
                className="ml-0.5 text-blue-400 hover:text-red-500 transition-colors"
                title={`Remove ${region}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {regions.length === 0 && (
            <p className="text-sm text-gray-400 italic">No regions configured. Add one above.</p>
          )}
        </div>
      </div>

      {/* Search Terms */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold mb-4">Search Terms</h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newTerm}
            onChange={e => setNewTerm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTerm()}
            placeholder="e.g. beach resort"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={addTerm}
            disabled={!newTerm.trim()}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {searchTerms.map(term => (
            <div key={term} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full group">
              <span className="text-sm text-gray-700">{term}</span>
              <button
                onClick={() => removeTerm(term)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title={`Remove "${term}"`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {searchTerms.length === 0 && (
            <p className="text-sm text-gray-400 italic">No search terms configured. Add one above.</p>
          )}
        </div>
      </div>

    </div>
  )
}
