import { mockOutreach, mockProperties, mockContacts, mockLeadsWithDetails } from '@/lib/mock/data'
import { Send, MailOpen, MousePointer, MessageSquare, AlertCircle } from 'lucide-react'

export default function OutreachPage() {
  const sent = mockOutreach.filter(o => o.status !== 'draft').length
  const opened = mockOutreach.filter(o => o.opened_at).length
  const clicked = mockOutreach.filter(o => o.clicked_at).length
  const replied = mockOutreach.filter(o => o.status === 'replied').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Outreach</h1>
        <p className="text-gray-500 text-sm mt-1">Track email campaigns and response rates</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Sent', value: sent, icon: Send, color: 'text-blue-600 bg-blue-50' },
          { label: 'Opened', value: opened, icon: MailOpen, color: 'text-green-600 bg-green-50' },
          { label: 'Clicked', value: clicked, icon: MousePointer, color: 'text-indigo-600 bg-indigo-50' },
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

      {/* Email Template Preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold mb-4">Email Template: Initial Outreach</h3>
        <div className="bg-gray-50 rounded-lg p-5 text-sm text-gray-700 space-y-3 border border-gray-100">
          <p><strong>Subject:</strong> Parking modernization for [Property Name]</p>
          <hr className="border-gray-200" />
          <p>Hi [Manager Name],</p>
          <p>
            We work with several Gulf Coast condo associations to modernize their parking systems
            using license plate registration instead of paper passes.
          </p>
          <p>Properties typically implement VRPS when they start seeing:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>parking pass abuse</li>
            <li>guest confusion during check-in</li>
            <li>security spending too much time scanning vehicles</li>
          </ul>
          <p>
            I&apos;d be happy to take a quick look at how parking is handled at [Property Name]
            and share a few ideas that have worked well for other properties nearby.
          </p>
          <p>Best,<br />Sean</p>
        </div>
      </div>

      {/* Outreach History */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold">Outreach History</h3>
        </div>
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
            {mockOutreach.map(o => {
              const property = mockProperties.find(p => p.id === o.property_id)
              const contact = mockContacts.find(c => c.id === o.contact_id)
              return (
                <tr key={o.id} className="border-b border-gray-50">
                  <td className="px-5 py-3 font-medium">{property?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{contact?.contact_name ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{o.subject}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                      o.status === 'replied' ? 'bg-green-100 text-green-700' :
                      o.status === 'opened' ? 'bg-blue-100 text-blue-700' :
                      o.status === 'clicked' ? 'bg-indigo-100 text-indigo-700' :
                      o.status === 'bounced' ? 'bg-red-100 text-red-700' :
                      o.status === 'sent' ? 'bg-gray-100 text-gray-600' :
                      'bg-gray-50 text-gray-400'
                    }`}>{o.status}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {o.sent_at ? new Date(o.sent_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {mockOutreach.length === 0 && (
          <div className="py-12 text-center">
            <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No outreach sent yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
