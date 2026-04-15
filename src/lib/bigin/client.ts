/**
 * Zoho Bigin API client with automatic token refresh.
 * Access tokens expire every hour. The token is persisted to Supabase
 * so server restarts don't trigger unnecessary refreshes (which Zoho rate limits).
 */

import { createClient } from '@supabase/supabase-js'

const ACCOUNTS_URL = 'https://accounts.zoho.com'
const API_DOMAIN = process.env.ZOHO_BIGIN_API_DOMAIN || 'https://www.zohoapis.com'
const CLIENT_ID = process.env.ZOHO_BIGIN_CLIENT_ID!
const CLIENT_SECRET = process.env.ZOHO_BIGIN_CLIENT_SECRET!
const REFRESH_TOKEN = process.env.ZOHO_BIGIN_REFRESH_TOKEN!

// In-process cache — avoids hitting Supabase on every request within the same process
let memToken: string | null = null
let memExpiresAt = 0

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function loadTokenFromDB(): Promise<{ token: string; expiresAt: number } | null> {
  const { data } = await supabase()
    .from('scrape_config')
    .select('bigin_access_token, bigin_token_expires_at')
    .limit(1)
    .single()

  if (!data?.bigin_access_token || !data?.bigin_token_expires_at) return null
  return { token: data.bigin_access_token, expiresAt: Number(data.bigin_token_expires_at) }
}

async function saveTokenToDB(token: string, expiresAt: number) {
  // Update the existing scrape_config row
  const { data: existing } = await supabase()
    .from('scrape_config')
    .select('id')
    .limit(1)
    .single()

  if (existing) {
    await supabase()
      .from('scrape_config')
      .update({ bigin_access_token: token, bigin_token_expires_at: expiresAt })
      .eq('id', existing.id)
  }
}

async function getAccessToken(): Promise<string> {
  const now = Date.now()
  const buffer = 60_000 // refresh 60s before expiry

  // 1. Check in-process cache first (fastest)
  if (memToken && now < memExpiresAt - buffer) {
    return memToken
  }

  // 2. Check Supabase — token may still be valid from another process/restart
  const persisted = await loadTokenFromDB()
  if (persisted && now < persisted.expiresAt - buffer) {
    memToken = persisted.token
    memExpiresAt = persisted.expiresAt
    return memToken
  }

  // 3. Refresh from Zoho
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: REFRESH_TOKEN,
    grant_type: 'refresh_token',
  })

  const res = await fetch(`${ACCOUNTS_URL}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!res.ok) {
    throw new Error(`Bigin token refresh failed: ${res.status} ${await res.text()}`)
  }

  const data = await res.json() as {
    access_token: string
    expires_in: number
    error?: string
  }

  if (data.error) {
    throw new Error(`Bigin token refresh error: ${data.error}`)
  }

  const expiresAt = now + data.expires_in * 1000

  // Persist to both in-process cache and Supabase
  memToken = data.access_token
  memExpiresAt = expiresAt
  await saveTokenToDB(data.access_token, expiresAt)

  return memToken
}

export type BiginResponse<T> = {
  data: T
  info?: { count: number; more_records: boolean }
}

/**
 * Make an authenticated request to the Bigin API.
 * Automatically refreshes the access token if needed.
 */
export async function biginRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken()

  const url = `${API_DOMAIN}/bigin/v2${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Bigin API error ${res.status} on ${path}: ${body}`)
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}
