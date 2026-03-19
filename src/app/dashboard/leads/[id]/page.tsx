import { getPropertyWithDetails, getLeadsWithDetails } from '@/lib/supabase/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Phone, Mail, MapPin, Star, Building, ParkingCircle, Home, Shield } from 'lucide-react'
import ScoreBadge from '@/components/leads/ScoreBadge'
import AnalysisPanel from '@/components/leads/AnalysisPanel'

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const detail = await getPropertyWithDetails(id)
  if (!detail) notFound()

  const { property: lead, latestParking, latestUnits, latestRentals, score, contacts, reviews } = detail
  const contact = contacts[0]
  const breakdown = score?.score_breakdown ?? {}

  const breakdownLabels: Record<string, string> = {
    units_50_200: '50-200 Units',
    units_200_350: '200-350 Units',
    vacation_rentals: 'Vacation Rentals',
    parking_complaints: 'Parking Complaints',
    security_patrol: 'Security Patrol',
    pass_price_40_plus: 'Pass Price $40+',
    google_parking_mentions: 'Parking Mentions',
  }

  const reviewTexts = reviews.map((r: { review_text: string | null }) => r.review_text).filter(Boolean) as string[]

  return (
    <div className="space-y-6">
      <Link href="/dashboard/leads" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Leads
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{lead.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              {lead.address && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{lead.address}</span>}
              <span>{lead.city}, {lead.state} {lead.zip}</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm">
              {lead.google_rating && (
                <span className="flex items-center gap-1 text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-current" /> {lead.google_rating}
                </span>
              )}
              <span className="text-gray-500">{lead.review_count} reviews</span>
              {lead.website && (
                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                  <ExternalLink className="w-3.5 h-3.5" /> Website
                </a>
              )}
              {lead.phone && (
                <span className="flex items-center gap-1 text-gray-500"><Phone className="w-3.5 h-3.5" /> {lead.phone}</span>
              )}
            </div>
          </div>
          {score && (
            <div className="text-right">
              <ScoreBadge score={score.score} tier={score.tier} />
              <p className="text-xs text-gray-400 mt-1">
                Scored {new Date(score.scored_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* AI Analysis Panel */}
      {reviewTexts.length > 0 && (
        <AnalysisPanel
          propertyName={lead.name}
          address={lead.address || ''}
          city={lead.city || ''}
          state={lead.state || ''}
          reviewCount={lead.review_count}
          reviews={reviewTexts}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-sm mb-4">Score Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(breakdown).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{breakdownLabels[key] || key}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${((value as number) / 25) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium w-6 text-right tabular-nums">+{value as number}</span>
                </div>
              </div>
            ))}
          </div>
          {Object.keys(breakdown).length === 0 && (
            <p className="text-sm text-gray-400">Not scored yet — run AI analysis first</p>
          )}
        </div>

        {/* Analysis Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-sm mb-4">Analysis Summary</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Building className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Estimated Units</p>
                <p className="text-sm text-gray-600">
                  {latestUnits?.estimated_units ?? 'Not analyzed'}
                  {latestUnits?.unit_confidence && (
                    <span className="text-xs text-gray-400 ml-1">({latestUnits.unit_confidence} confidence)</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Home className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Vacation Rentals</p>
                <p className="text-sm text-gray-600">
                  {latestRentals?.has_vacation_rentals ? (
                    <span className="text-green-600">Yes{latestRentals.rental_platforms?.length ? ` — ${latestRentals.rental_platforms.join(', ')}` : ''}</span>
                  ) : latestRentals ? 'Not detected' : 'Not analyzed'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ParkingCircle className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Parking Score</p>
                <p className="text-sm text-gray-600">
                  {latestParking?.parking_score !== null && latestParking?.parking_score !== undefined
                    ? `${latestParking.parking_score}/10`
                    : 'Not analyzed'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Security Patrol</p>
                <p className="text-sm text-gray-600">
                  {(latestParking?.parking_categories as Record<string, number> | null)?.security_ticketing
                    ? 'Mentioned in reviews' : 'Not detected'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-sm mb-4">Contact Info</h3>
          {contact ? (
            <div className="space-y-3">
              {contact.management_company && (
                <div>
                  <p className="text-xs text-gray-400">Management Company</p>
                  <p className="text-sm font-medium">{contact.management_company}</p>
                </div>
              )}
              {contact.contact_name && (
                <div>
                  <p className="text-xs text-gray-400">Contact</p>
                  <p className="text-sm font-medium">{contact.contact_name}</p>
                  {contact.contact_title && <p className="text-xs text-gray-500">{contact.contact_title}</p>}
                </div>
              )}
              {contact.email && (
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <a href={`mailto:${contact.email}`} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> {contact.email}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No contact information yet</p>
          )}
        </div>
      </div>

      {/* Parking Complaints */}
      {latestParking?.parking_complaints && (latestParking.parking_complaints as Array<{review_excerpt: string; category: string; severity: number}>).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-sm mb-4">Parking Complaints Detected</h3>
          <div className="space-y-2">
            {(latestParking.parking_complaints as Array<{review_excerpt: string; category: string; severity: number}>).map((complaint, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${
                  complaint.severity >= 8 ? 'bg-red-200 text-red-800' :
                  complaint.severity >= 5 ? 'bg-amber-200 text-amber-800' :
                  'bg-gray-200 text-gray-700'
                }`}>{complaint.severity}/10</span>
                <div>
                  <p className="text-sm text-gray-700">&ldquo;{complaint.review_excerpt}&rdquo;</p>
                  <p className="text-xs text-gray-500 mt-1 capitalize">{complaint.category.replace(/_/g, ' ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Reviews */}
      {reviews.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-sm mb-4">Reviews ({reviews.length})</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {reviews.slice(0, 15).map((review: { id: string; reviewer_name: string | null; rating: number | null; review_text: string | null }) => (
              <div key={review.id} className="p-3 border border-gray-100 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{review.reviewer_name || 'Anonymous'}</span>
                  <div className="flex items-center gap-1">
                    {review.rating && Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-amber-400 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{review.review_text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
