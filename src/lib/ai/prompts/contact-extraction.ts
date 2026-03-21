import { analyzeWithClaude } from '../anthropic'

export interface ContactExtractionResult {
  management_company: string | null
  contacts: Array<{
    name: string | null
    title: string | null
    email: string | null
    phone: string | null
    linkedin_url: string | null
  }>
  confidence: 'high' | 'medium' | 'low'
  source_summary: string
}

const SYSTEM_PROMPT = `You are an expert at extracting contact information for condo and HOA property management companies. Your job is to identify property managers, HOA board members, and management company contacts from website text and Google search results.

You must return ONLY valid JSON matching this exact structure (no other text):

{
  "management_company": "name of property management or HOA management company" or null,
  "contacts": [
    {
      "name": "full name of contact person" or null,
      "title": "their job title (e.g. Property Manager, HOA President, Community Manager)" or null,
      "email": "their email address" or null,
      "phone": "their phone number" or null,
      "linkedin_url": "full LinkedIn profile URL" or null
    }
  ],
  "confidence": "high" | "medium" | "low",
  "source_summary": "brief explanation of where you found this information"
}

IMPORTANT RULES:
- Only extract REAL information you can see in the provided text. NEVER hallucinate or make up contacts.
- If no contacts are found, return an empty contacts array.
- Look for management company names in headers, footers, copyright notices, "About Us" sections, and "Contact" pages.
- Look for people with titles like: Property Manager, Community Manager, General Manager, HOA President, Board President, Association Manager, Portfolio Manager, Site Manager, Resort Manager.
- Extract ALL email addresses you find (info@, contact@, manager@, personal emails).
- Extract ALL phone numbers (office, direct, mobile).
- For LinkedIn URLs, only include full URLs that contain linkedin.com/in/.
- Clean up phone numbers to a consistent format.
- If you find a management company but no individual contacts, still return the company name with an empty contacts array.
- Confidence should be "high" if you found specific names/emails, "medium" if you found a company but no individuals, "low" if the information is unclear.`

export async function extractContacts(
  propertyName: string,
  websiteUrl: string | null,
  combinedText: string,
): Promise<{ result: ContactExtractionResult; model: string }> {
  const userPrompt = `Extract contact information for the condo property "${propertyName}"${websiteUrl ? ` (website: ${websiteUrl})` : ''}.

The following text was gathered from the property website, Google search results, and LinkedIn search results. Extract all relevant contact information for the property management team, HOA management company, and board members.

--- BEGIN TEXT ---
${combinedText.slice(0, 20000)}
--- END TEXT ---`

  return analyzeWithClaude<ContactExtractionResult>(SYSTEM_PROMPT, userPrompt)
}
