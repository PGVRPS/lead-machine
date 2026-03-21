import { fetchWebsiteText } from '@/lib/scraper/website-fetcher'
import { searchGoogle } from '@/lib/scraper/outscraper'
import { extractContacts } from '@/lib/ai/prompts/contact-extraction'
import { insertContacts } from '@/lib/supabase/db'

interface EnrichmentResult {
  enriched: boolean
  contactCount: number
  managementCompany: string | null
  error?: string
}

/**
 * Enriches a property with contact information from 3 sources:
 * 1. Property website (direct HTML scrape)
 * 2. Google search for HOA/management company info
 * 3. Google search for LinkedIn profiles of property managers
 */
export async function enrichPropertyContacts(
  propertyId: string,
  propertyName: string,
  city: string,
  websiteUrl: string | null,
): Promise<EnrichmentResult> {
  try {
    // Gather text from all 3 sources in parallel
    const [websiteText, googleResults, linkedInResults] = await Promise.all([
      // Source 1: Property website
      websiteUrl ? fetchWebsiteText(websiteUrl) : Promise.resolve(null),

      // Source 2: Google search for management/HOA contact
      searchGoogle([
        `"${propertyName}" ${city} HOA management company contact`,
      ]).catch(() => []),

      // Source 3: LinkedIn via Google search
      searchGoogle([
        `"${propertyName}" property manager site:linkedin.com`,
      ]).catch(() => []),
    ])

    // Combine all text into one context block for Claude
    const textParts: string[] = []

    if (websiteText) {
      textParts.push(`=== PROPERTY WEBSITE (${websiteUrl}) ===\n${websiteText}`)
    }

    if (googleResults.length > 0) {
      const googleText = googleResults
        .slice(0, 5)
        .map(r => `Title: ${r.title}\nURL: ${r.link}\nSnippet: ${r.snippet}`)
        .join('\n\n')
      textParts.push(`=== GOOGLE SEARCH RESULTS ===\n${googleText}`)
    }

    if (linkedInResults.length > 0) {
      const linkedInText = linkedInResults
        .slice(0, 5)
        .map(r => `Title: ${r.title}\nURL: ${r.link}\nSnippet: ${r.snippet}`)
        .join('\n\n')
      textParts.push(`=== LINKEDIN SEARCH RESULTS ===\n${linkedInText}`)
    }

    const combinedText = textParts.join('\n\n')

    // If we have no text from any source, skip
    if (combinedText.length < 50) {
      return { enriched: false, contactCount: 0, managementCompany: null, error: 'No data found from any source' }
    }

    // Send to Claude for extraction
    const { result } = await extractContacts(propertyName, websiteUrl, combinedText)

    // Store in database
    const contactCount = await insertContacts(
      propertyId,
      result.management_company,
      result.contacts,
    )

    return {
      enriched: true,
      contactCount,
      managementCompany: result.management_company,
    }
  } catch (err) {
    return {
      enriched: false,
      contactCount: 0,
      managementCompany: null,
      error: (err as Error).message,
    }
  }
}
