/**
 * Zoho Bigin API client with automatic token refresh.
 * Access tokens expire every hour; this module refreshes them
 * transparently using the stored refresh token.
 */

const ACCOUNTS_URL = 'https://accounts.zoho.com'
const API_DOMAIN = process.env.ZOHO_BIGIN_API_DOMAIN || 'https://www.zohoapis.com'
const CLIENT_ID = process.env.ZOHO_BIGIN_CLIENT_ID!
const CLIENT_SECRET = process.env.ZOHO_BIGIN_CLIENT_SECRET!
const REFRESH_TOKEN = process.env.ZOHO_BIGIN_REFRESH_TOKEN!

// In-memory token cache (refreshed automatically)
let cachedAccessToken: string | null = null
let tokenExpiresAt = 0 // epoch ms

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedAccessToken
  }

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

  cachedAccessToken = data.access_token
  tokenExpiresAt = Date.now() + data.expires_in * 1000

  return cachedAccessToken
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
