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
 * Enriches a property with contact information from multiple sources:
 *
 * Pass 1: Property website + Google search + LinkedIn search
 * Pass 2 (if needed): If we found a management company but no emails/phones,
 *   do a follow-up search for that company's contact info and website.
 */
export async function enrichPropertyContacts(
  propertyId: string,
  propertyName: string,
  city: string,
  websiteUrl: string | null,
): Promise<EnrichmentResult> {
  try {
    // ── Pass 1: Gather from property sources ──
    const [websiteText, googleResults, linkedInResults] = await Promise.all([
      websiteUrl ? fetchWebsiteText(websiteUrl) : Promise.resolve(null),

      searchGoogle([
        `"${propertyName}" ${city} HOA management company contact email phone`,
      ]).catch(() => []),

      searchGoogle([
        `"${propertyName}" property manager site:linkedin.com`,
      ]).catch(() => []),
    ])

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

    let combinedText = textParts.join('\n\n')

    if (combinedText.length < 50) {
      return { enriched: false, contactCount: 0, managementCompany: null, error: 'No data found from any source' }
    }

    // First Claude extraction
    const { result } = await extractContacts(propertyName, websiteUrl, combinedText)

    // ── Pass 2: If we got a company but no real contact details, dig deeper ──
    const hasUsableContacts = result.contacts.some(c => c.email || c.phone)

    if (result.management_company && !hasUsableContacts) {
      const companyName = result.management_company

      // Search for the management company directly
      const [companyGoogle, companyWebsite, companyLinkedIn] = await Promise.all([
        searchGoogle([
          `"${companyName}" contact email phone property management`,
          `"${companyName}" ${city} property manager email`,
        ]).catch(() => []),

        // Try to find and scrape the management company's own website
        searchGoogle([
          `"${companyName}" property management official website`,
        ]).then(async (results) => {
          const companyUrl = results.find(r =>
            r.link &&
            !r.link.includes('facebook.com') &&
            !r.link.includes('linkedin.com') &&
            !r.link.includes('yelp.com') &&
            !r.link.includes('bbb.org')
          )?.link
          if (companyUrl) {
            return fetchWebsiteText(companyUrl)
          }
          return null
        }).catch(() => null),

        searchGoogle([
          `"${companyName}" property manager site:linkedin.com`,
        ]).catch(() => []),
      ])

      // Build Pass 2 context
      const pass2Parts: string[] = []

      if (companyWebsite) {
        pass2Parts.push(`=== MANAGEMENT COMPANY WEBSITE ===\n${companyWebsite}`)
      }

      if (companyGoogle.length > 0) {
        const text = companyGoogle
          .slice(0, 5)
          .map(r => `Title: ${r.title}\nURL: ${r.link}\nSnippet: ${r.snippet}`)
          .join('\n\n')
        pass2Parts.push(`=== MANAGEMENT COMPANY GOOGLE RESULTS ===\n${text}`)
      }

      if (companyLinkedIn.length > 0) {
        const text = companyLinkedIn
          .slice(0, 5)
          .map(r => `Title: ${r.title}\nURL: ${r.link}\nSnippet: ${r.snippet}`)
          .join('\n\n')
        pass2Parts.push(`=== MANAGEMENT COMPANY LINKEDIN RESULTS ===\n${text}`)
      }

      if (pass2Parts.length > 0) {
        // Combine original + pass 2 context for richer extraction
        combinedText = combinedText + '\n\n' + pass2Parts.join('\n\n')
        const { result: enrichedResult } = await extractContacts(propertyName, websiteUrl, combinedText)

        const contactCount = await insertContacts(
          propertyId,
          enrichedResult.management_company || companyName,
          enrichedResult.contacts,
        )

        return {
          enriched: true,
          contactCount,
          managementCompany: enrichedResult.management_company || companyName,
        }
      }
    }

    // Store Pass 1 results
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
