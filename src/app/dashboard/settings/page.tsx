'use client'

import { useState } from 'react'
import { Save, RotateCcw } from 'lucide-react'
import { DEFAULT_SCORING_WEIGHTS, DEFAULT_TIER_THRESHOLDS, GULF_COAST_REGIONS, SEARCH_TERMS } from '@/lib/scoring/config'

export default function SettingsPage() {
  const [weights, setWeights] = useState<Record<string, number>>({ ...DEFAULT_SCORING_WEIGHTS })
  const [thresholds, setThresholds] = useState<Record<string, number>>({ ...DEFAULT_TIER_THRESHOLDS })
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

  function handleSave() {
    // In Phase 1, this saves to local state only
    // In production, this will POST to /api/settings and update scoring_config table
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleReset() {
    setWeights({ ...DEFAULT_SCORING_WEIGHTS })
    setThresholds({ ...DEFAULT_TIER_THRESHOLDS })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Configure scoring weights, regions, and API keys</p>
      </div>

      {/* Scoring Weights */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold">Scoring Weights</h3>
            <p className="text-sm text-gray-500 mt-0.5">Adjust how each factor contributes to the VRPS Lead Score (max total: {maxPoints})</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
              <Save className="w-3.5 h-3.5" /> {saved ? 'Saved!' : 'Save'}
            </button>
          </div>
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
            <label className="text-sm font-medium text-gray-700 block mb-1">Immediate (80+)</label>
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
            <label className="text-sm font-medium text-gray-700 block mb-1">Nurture (60+)</label>
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
            <label className="text-sm font-medium text-gray-700 block mb-1">Monitor (40+)</label>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {GULF_COAST_REGIONS.map(region => (
            <div key={region} className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-sm text-blue-700">{region}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Search Terms */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold mb-4">Search Terms</h3>
        <div className="flex flex-wrap gap-2">
          {SEARCH_TERMS.map(term => (
            <span key={term} className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full text-sm text-gray-700">
              {term}
            </span>
          ))}
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold mb-4">API Keys</h3>
        <div className="space-y-4">
          {[
            { name: 'Outscraper API Key', env: 'OUTSCRAPER_API_KEY', status: 'Not configured', phase: 'Phase 3' },
            { name: 'Anthropic API Key', env: 'ANTHROPIC_API_KEY', status: 'Not configured', phase: 'Phase 2' },
            { name: 'Resend API Key', env: 'RESEND_API_KEY', status: 'Not configured', phase: 'Phase 4' },
          ].map(key => (
            <div key={key.env} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
              <div>
                <p className="text-sm font-medium">{key.name}</p>
                <p className="text-xs text-gray-400">{key.env}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{key.phase}</span>
                <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">{key.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
