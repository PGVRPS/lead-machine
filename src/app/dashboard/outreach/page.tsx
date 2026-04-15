'use client'

import { useEffect, useState, useCallback } from 'react'
import { Send, MailOpen, MousePointer, MessageSquare, AlertCircle, Plus, X, ChevronDown } from 'lucide-react'

type OutreachRecord = {
  id: string
  subject: string | null
  status: string
  sent_at: string | null
  opened_at: string | null
  clicked_at: string | null
  properties: { name: string } | null
  contacts: { contact_name: string | null; email: string | null } | null
}

type ContactOption = {
  id: string
  contact_name: string | null
  contact_title: string | null
  email: string
  management_company: string | null
  properties: { id: string; name: string; city: string | null; state: string | null } | null
}

type ComposeMode = 'contacts' | 'custom'

const STATUS_COLORS: Record<string, string> = {
  replied:  'bg-green-100 text-green-700',
  opened:   'bg-blue-100 text-blue-700',
  clicked:  'bg-indigo-100 text-indigo-700',
  bounced:  'bg-red-100 text-red-700',
  sent:     'bg-gray-100 text-gray-600',
  draft:    'bg-gray-50 text-gray-400',
}

const DEFAULT_BODY = (propertyName: string, contactName: string) =>
`Hi ${contactName || 'there'},

We work with several Gulf Coast condo associations to modernize their parking systems using license plate registration instead of paper passes.

Properties typically implement VRPS when they start seeing:
• Parking pass abuse
• Guest confusion during check-in
• Security spending too much time scanning vehicles

I'd be happy to take a quick look at how parking is handled at ${propertyName} and share a few ideas that have worked well for other properties nearby.

Best,
Sean`

export default function OutreachPage() {
  const [outreach, setOutreach] = useState<OutreachRecord[]>([])
  const [contacts, setContacts] = useState<ContactOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompose, setShowCompose] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendSuccess, setSendSuccess] = useState(false)

  // Compose form state
  const [mode, setMode] = useState<ComposeMode>('contacts')
  const [selectedContactId, setSelectedContactId] = useState('')
  const [customName, setCustomName] = useState('')
  const [customEmail, setCustomEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/outreach')
      const json = await res.json()
      setOutreach(json.outreach ?? [])
      setContacts(json.contacts ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Pre-fill template when contact changes
  useEffect(() => {
    if (!selectedContactId) return
    const c = contacts.find(c => c.id === selectedContactId)
    if (!c) return
    const propertyName = c.properties?.name ?? 'your property'
    const contactName = c.contact_name?.split(' ')[0] ?? ''
    setSubject(`Parking modernization for ${propertyName}`)
    setBody(DEFAULT_BODY(propertyName, contactName))
  }, [selectedContactId, contacts])

  // Pre-fill template when custom name changes
  useEffect(() => {
    if (mode !== 'custom') return
    const firstName = customName.trim().split(' ')[0] ?? ''
    setSubject('Parking modernization for your property')
    setBody(DEFAULT_BODY('your property', firstName))
  }, [mode]) // only on mode switch, not on every keystroke

  const handleOpenCompose = () => {
    setMode('contacts')
    setSelectedContactId('')

    setCustomName('')
    setCustomEmail('')
    setSubject('')
    setBody('')
    setSendError(null)
    setSendSuccess(false)
    setShowCompose(true)
  }

  const canSend = mode === 'contacts'
    ? !!selectedContactId && !!subject.trim() && !!body.trim()
    : !!customEmail.trim() && !!subject.trim() && !!body.trim()

  const handleSend = async () => {
    if (!canSend) return
    setSending(true)
    setSendError(null)
    try {
      const payload = mode === 'contacts'
        ? { contactId: selectedContactId, subject, body }
        : { contactId: null, toEmail: customEmail.trim(), toName: customName.trim() || undefined, subject, body }

      const res = await fetch('/api/bigin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to send')
      setSendSuccess(true)
      await fetchData()
      setTimeout(() => setShowCompose(false), 1500)
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSending(false)
    }
  }

  const sent    = outreach.filter(o => o.status !== 'draft').length
  const opened  = outreach.filter(o => o.opened_at).length
  const clicked = outreach.filter(o => o.clicked_at).length
  const replied = outreach.filter(o => o.status === 'replied').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Outreach</h1>
          <p className="text-gray-500 text-sm mt-1">Send and track emails via Zoho Bigin</p>
        </div>
        <button
          onClick={handleOpenCompose}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Email
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Sent',    value: sent,    icon: Send,          color: 'text-blue-600 bg-blue-50' },
          { label: 'Opened',  value: opened,  icon: MailOpen,      color: 'text-green-600 bg-green-50' },
          { label: 'Clicked', value: clicked, icon: MousePointer,  color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Replied', value: replied, icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Outreach History */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold">Outreach History</h3>
        </div>
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Loading...</div>
        ) : outreach.length === 0 ? (
          <div className="py-12 text-center">
            <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No outreach sent yet</p>
            <button onClick={handleOpenCompose} className="mt-3 text-blue-600 text-sm hover:underline">
              Send your first email
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Property</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Contact</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Subject</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Sent</th>
              </tr>
            </thead>
            <tbody>
              {outreach.map(o => (
                <tr key={o.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3 font-medium">{o.properties?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{o.contacts?.contact_name ?? o.contacts?.email ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-600 max-w-xs truncate">{o.subject ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_COLORS[o.status] ?? 'bg-gray-50 text-gray-400'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {o.sent_at ? new Date(o.sent_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-lg">New Email</h2>
              <button onClick={() => setShowCompose(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 flex-1 overflow-y-auto">

              {/* Mode toggle */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
                <button
                  onClick={() => setMode('contacts')}
                  className={`flex-1 py-2 transition-colors ${mode === 'contacts' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  From Contacts
                </button>
                <button
                  onClick={() => setMode('custom')}
                  className={`flex-1 py-2 transition-colors ${mode === 'custom' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  Custom Recipient
                </button>
              </div>

              {mode === 'contacts' ? (
                <>
                  {/* Contact picker */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                    <div className="relative">
                      <select
                        value={selectedContactId}
                        onChange={e => setSelectedContactId(e.target.value)}
                        className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a contact...</option>
                        {contacts.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.contact_name ?? c.email} — {c.properties?.name ?? 'Unknown property'} ({c.email})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                </>
              ) : (
                <>
                  {/* Custom name */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Name <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input
                      type="text"
                      value={customName}
                      onChange={e => setCustomName(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="John Smith"
                    />
                  </div>

                  {/* Custom email */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                    <input
                      type="email"
                      value={customEmail}
                      onChange={e => setCustomEmail(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="contact@property.com"
                    />
                  </div>
                </>
              )}

              {/* Subject */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email subject"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Message</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={12}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none"
                  placeholder="Email body..."
                />
              </div>

              {sendError && (
                <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{sendError}</p>
              )}
              {sendSuccess && (
                <p className="text-green-600 text-sm bg-green-50 rounded-lg px-3 py-2">Email sent successfully via Bigin!</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => setShowCompose(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !canSend}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sending...' : 'Send via Bigin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
