'use client'

import { useState, useCallback } from 'react'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react'

interface CsvRow {
  [key: string]: string
}

const targetFields = [
  { key: 'name', label: 'Property Name', required: true },
  { key: 'address', label: 'Address', required: false },
  { key: 'city', label: 'City', required: false },
  { key: 'state', label: 'State', required: false },
  { key: 'zip', label: 'ZIP', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'website', label: 'Website', required: false },
  { key: 'google_rating', label: 'Google Rating', required: false },
  { key: 'review_count', label: 'Review Count', required: false },
  { key: 'skip', label: '— Skip Column —', required: false },
]

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<CsvRow[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [imported, setImported] = useState(false)

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setImported(false)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) return

      const csvHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
      setHeaders(csvHeaders)

      const csvRows = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        const row: CsvRow = {}
        csvHeaders.forEach((h, i) => { row[h] = values[i] || '' })
        return row
      })
      setRows(csvRows)

      // Auto-map obvious columns
      const autoMap: Record<string, string> = {}
      csvHeaders.forEach(h => {
        const lower = h.toLowerCase()
        if (lower.includes('name') || lower.includes('business')) autoMap[h] = 'name'
        else if (lower.includes('address') || lower.includes('street')) autoMap[h] = 'address'
        else if (lower.includes('city')) autoMap[h] = 'city'
        else if (lower.includes('state')) autoMap[h] = 'state'
        else if (lower.includes('zip') || lower.includes('postal')) autoMap[h] = 'zip'
        else if (lower.includes('phone') || lower.includes('tel')) autoMap[h] = 'phone'
        else if (lower.includes('website') || lower.includes('url')) autoMap[h] = 'website'
        else if (lower.includes('rating')) autoMap[h] = 'google_rating'
        else if (lower.includes('review')) autoMap[h] = 'review_count'
        else autoMap[h] = 'skip'
      })
      setMapping(autoMap)
    }
    reader.readAsText(f)
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f && (f.name.endsWith('.csv') || f.name.endsWith('.tsv'))) {
      handleFile(f)
    }
  }

  function handleImport() {
    // In Phase 1 this is a no-op. In production, POST to /api/import
    setImported(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import</h1>
        <p className="text-gray-500 text-sm mt-1">Upload CSV files to add properties to the pipeline</p>
      </div>

      {/* Drop Zone */}
      {!file && (
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors"
        >
          <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">Drag & drop a CSV file here</p>
          <p className="text-xs text-gray-400 mb-4">or</p>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg cursor-pointer hover:bg-blue-700">
            <FileSpreadsheet className="w-4 h-4" />
            Browse Files
            <input
              type="file"
              accept=".csv,.tsv"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>
        </div>
      )}

      {/* Column Mapping */}
      {file && !imported && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Column Mapping</h3>
                <p className="text-sm text-gray-500">{file.name} — {rows.length}+ rows detected</p>
              </div>
              <button onClick={() => { setFile(null); setHeaders([]); setRows([]) }} className="text-sm text-gray-500 hover:text-gray-700">
                Change file
              </button>
            </div>

            <div className="space-y-3">
              {headers.map(h => (
                <div key={h} className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-40 truncate font-mono">{h}</span>
                  <span className="text-gray-300">→</span>
                  <select
                    value={mapping[h] || 'skip'}
                    onChange={e => setMapping(m => ({ ...m, [h]: e.target.value }))}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
                  >
                    {targetFields.map(f => (
                      <option key={f.key} value={f.key}>{f.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-sm">Preview (first 5 rows)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    {headers.filter(h => mapping[h] !== 'skip').map(h => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-gray-500">
                        {targetFields.find(f => f.key === mapping[h])?.label || h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      {headers.filter(h => mapping[h] !== 'skip').map(h => (
                        <td key={h} className="px-3 py-2 text-gray-600">{row[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleImport}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              <Upload className="w-4 h-4" /> Import Properties
            </button>
          </div>
        </>
      )}

      {/* Success */}
      {imported && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <h3 className="font-semibold text-green-800">Import Complete</h3>
          <p className="text-sm text-green-600 mt-1">Properties have been added to the pipeline (mock mode — no data persisted)</p>
          <button
            onClick={() => { setFile(null); setHeaders([]); setRows([]); setImported(false) }}
            className="mt-4 px-4 py-2 text-sm bg-white border border-green-200 rounded-lg text-green-700 hover:bg-green-50"
          >
            Import Another File
          </button>
        </div>
      )}

      {/* Format Guide */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold mb-3">CSV Format Guide</h3>
        <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs text-gray-600 overflow-x-auto">
          <p>name,address,city,state,zip,phone,website,google_rating,review_count</p>
          <p>SeaChase,25100 Perdido Beach Blvd,Orange Beach,AL,36561,(251) 981-4100,https://seachase.com,4.3,487</p>
          <p>Turquoise Place,26302 Perdido Beach Blvd,Orange Beach,AL,36561,(251) 981-1300,https://turquoiseplace.com,4.6,1203</p>
        </div>
        <div className="mt-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
          <p className="text-xs text-gray-500">Only the &ldquo;name&rdquo; column is required. All other fields are optional. Duplicate properties (matched by name + city) will be skipped.</p>
        </div>
      </div>
    </div>
  )
}
