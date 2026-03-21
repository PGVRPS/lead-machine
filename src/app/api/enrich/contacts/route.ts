import { NextRequest } from 'next/server'
import { enrichPropertyContacts } from '@/lib/enrichment/enrich-contacts'
import { addPipelineStage } from '@/lib/supabase/db'
import { createServerClient } from '@/lib/supabase/server'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

/**
 * POST /api/enrich/contacts
 *
 * Body options:
 * - { propertyId: "uuid" } — enrich a single property
 * - { all: true } — enrich all properties that have no contacts yet
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { propertyId, all } = body as { propertyId?: string; all?: boolean }

  const supabase = createServerClient()

  try {
    if (propertyId) {
      // Enrich a single property
      const { data: property, error } = await supabase
        .from('properties')
        .select('id, name, city, website')
        .eq('id', propertyId)
        .single()

      if (error || !property) {
        return Response.json({ error: 'Property not found' }, { status: 404 })
      }

      const result = await enrichPropertyContacts(
        property.id,
        property.name,
        property.city || '',
        property.website || null,
      )

      if (result.enriched) {
        await addPipelineStage(property.id, 'enriched')
      }

      return Response.json({
        success: true,
        property: property.name,
        ...result,
      })
    }

    if (all) {
      // Find all properties without web_scrape contacts
      const { data: properties, error } = await supabase
        .from('properties')
        .select('id, name, city, website')
        .order('created_at', { ascending: false })

      if (error || !properties) {
        return Response.json({ error: 'Failed to fetch properties' }, { status: 500 })
      }

      // Get properties that already have web_scrape contacts
      const { data: existingContacts } = await supabase
        .from('contacts')
        .select('property_id')
        .eq('source', 'web_scrape')

      const enrichedIds = new Set((existingContacts || []).map(c => c.property_id))
      const unenriched = properties.filter(p => !enrichedIds.has(p.id))

      let enrichedCount = 0
      const results: Array<{ name: string; enriched: boolean; contacts: number }> = []

      for (const property of unenriched) {
        const result = await enrichPropertyContacts(
          property.id,
          property.name,
          property.city || '',
          property.website || null,
        )

        if (result.enriched) {
          await addPipelineStage(property.id, 'enriched')
          enrichedCount++
        }

        results.push({
          name: property.name,
          enriched: result.enriched,
          contacts: result.contactCount,
        })
      }

      return Response.json({
        success: true,
        total: unenriched.length,
        enriched: enrichedCount,
        results,
      })
    }

    return Response.json({ error: 'Provide propertyId or all: true' }, { status: 400 })
  } catch (error) {
    console.error('Enrichment failed:', error)
    return Response.json({ error: (error as Error).message }, { status: 500 })
  }
}
