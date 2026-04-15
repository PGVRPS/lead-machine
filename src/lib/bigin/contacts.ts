/**
 * Bigin Contacts module operations.
 * Maps our internal contact schema to Bigin's Contacts module fields.
 */

import { biginRequest, type BiginResponse } from './client'

export type BiginContact = {
  id?: string
  Last_Name: string
  First_Name?: string
  Email?: string
  Phone?: string
  Title?: string
  Account_Name?: string
  Description?: string
  // Custom field populated from our lead data
  Lead_URL?: string
}

export type BiginContactRecord = BiginContact & { id: string }

/**
 * Search for a contact in Bigin by email address.
 */
export async function findContactByEmail(
  email: string,
): Promise<BiginContactRecord | null> {
  const encoded = encodeURIComponent(`(Email:equals:${email})`)
  const res = await biginRequest<BiginResponse<BiginContactRecord[]>>(
    `/Contacts/search?criteria=${encoded}`,
  ).catch(() => null)

  if (!res?.data?.length) return null
  return res.data[0]
}

/**
 * Create a new contact in Bigin.
 * Returns the created record's id.
 */
export async function createContact(contact: BiginContact): Promise<string> {
  const res = await biginRequest<{ data: { code: string; details: { id: string } }[] }>(
    '/Contacts',
    {
      method: 'POST',
      body: JSON.stringify({ data: [contact] }),
    },
  )

  const record = res.data[0]
  if (record.code !== 'SUCCESS') {
    throw new Error(`Failed to create Bigin contact: ${JSON.stringify(record)}`)
  }

  return record.details.id
}

/**
 * Upsert a contact — create if not found by email, otherwise return existing id.
 */
export async function upsertContact(contact: BiginContact): Promise<string> {
  if (contact.Email) {
    const existing = await findContactByEmail(contact.Email)
    if (existing) return existing.id
  }
  return createContact(contact)
}

/**
 * Map our internal contact row to a Bigin contact payload.
 */
export function mapToBeginContact(params: {
  contact_name: string | null
  contact_title: string | null
  email: string | null
  phone: string | null
  management_company: string | null
  propertyName: string
  propertyId: string
}): BiginContact {
  const nameParts = (params.contact_name || 'Unknown').split(' ')
  const lastName = nameParts.pop() || 'Unknown'
  const firstName = nameParts.join(' ') || undefined

  return {
    Last_Name: lastName,
    First_Name: firstName,
    Email: params.email || undefined,
    Phone: params.phone || undefined,
    Title: params.contact_title || undefined,
    Account_Name: params.management_company || params.propertyName,
    Description: `Lead from Lead Machine — Property: ${params.propertyName}`,
  }
}
