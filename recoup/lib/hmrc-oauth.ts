/**
 * HMRC MTD OAuth 2.0 Authentication
 *
 * Handles OAuth 2.0 flow for HMRC Making Tax Digital API
 *
 * References:
 * - https://developer.service.hmrc.gov.uk/api-documentation/docs/authorisation
 * - https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/vat-api/1.0
 */

import { getFirestore } from 'firebase-admin/firestore';

const HMRC_BASE_URL = process.env.HMRC_ENV === 'production'
  ? 'https://api.service.hmrc.gov.uk'
  : 'https://test-api.service.hmrc.gov.uk';

const HMRC_AUTH_URL = `${HMRC_BASE_URL}/oauth/authorize`;
const HMRC_TOKEN_URL = `${HMRC_BASE_URL}/oauth/token`;

export interface HMRCTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp
  token_type: string;
  scope: string;
}

export interface HMRCAuthConfig {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  scope: string;
}

/**
 * Get HMRC OAuth configuration from environment
 */
export function getHMRCAuthConfig(): HMRCAuthConfig {
  const client_id = process.env.HMRC_CLIENT_ID;
  const client_secret = process.env.HMRC_CLIENT_SECRET;
  const redirect_uri = process.env.HMRC_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/hmrc/auth/callback`;

  if (!client_id || !client_secret) {
    throw new Error('HMRC OAuth credentials not configured. Set HMRC_CLIENT_ID and HMRC_CLIENT_SECRET environment variables.');
  }

  return {
    client_id,
    client_secret,
    redirect_uri,
    scope: 'read:vat write:vat',
  };
}

/**
 * Generate authorization URL for HMRC OAuth flow
 */
export function getAuthorizationUrl(state: string): string {
  const config = getHMRCAuthConfig();

  const params = new URLSearchParams({
    client_id: config.client_id,
    redirect_uri: config.redirect_uri,
    scope: config.scope,
    response_type: 'code',
    state,
  });

  return `${HMRC_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<HMRCTokens> {
  const config = getHMRCAuthConfig();

  const params = new URLSearchParams({
    client_id: config.client_id,
    client_secret: config.client_secret,
    grant_type: 'authorization_code',
    redirect_uri: config.redirect_uri,
    code,
  });

  const response = await fetch(HMRC_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HMRC token exchange failed: ${response.status} ${error}`);
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in * 1000),
    token_type: data.token_type,
    scope: data.scope,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refresh_token: string): Promise<HMRCTokens> {
  const config = getHMRCAuthConfig();

  const params = new URLSearchParams({
    client_id: config.client_id,
    client_secret: config.client_secret,
    grant_type: 'refresh_token',
    refresh_token,
  });

  const response = await fetch(HMRC_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HMRC token refresh failed: ${response.status} ${error}`);
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in * 1000),
    token_type: data.token_type,
    scope: data.scope,
  };
}

/**
 * Store HMRC tokens for a user in Firestore
 */
export async function storeHMRCTokens(userId: string, tokens: HMRCTokens): Promise<void> {
  const db = getFirestore();

  await db.collection('hmrc_tokens').doc(userId).set({
    ...tokens,
    updated_at: new Date().toISOString(),
  });
}

/**
 * Get HMRC tokens for a user from Firestore
 */
export async function getHMRCTokens(userId: string): Promise<HMRCTokens | null> {
  const db = getFirestore();

  const doc = await db.collection('hmrc_tokens').doc(userId).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();

  return {
    access_token: data!.access_token,
    refresh_token: data!.refresh_token,
    expires_at: data!.expires_at,
    token_type: data!.token_type,
    scope: data!.scope,
  };
}

/**
 * Get valid access token for user (refreshes if expired)
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const tokens = await getHMRCTokens(userId);

  if (!tokens) {
    throw new Error('User not connected to HMRC. Please authorize access first.');
  }

  // Check if token is expired (with 5 minute buffer)
  const isExpired = tokens.expires_at < Date.now() + (5 * 60 * 1000);

  if (isExpired) {
    // Refresh token
    const newTokens = await refreshAccessToken(tokens.refresh_token);
    await storeHMRCTokens(userId, newTokens);
    return newTokens.access_token;
  }

  return tokens.access_token;
}

/**
 * Revoke HMRC access for a user
 */
export async function revokeHMRCAccess(userId: string): Promise<void> {
  const db = getFirestore();
  await db.collection('hmrc_tokens').doc(userId).delete();
}

/**
 * Check if user has connected HMRC account
 */
export async function isHMRCConnected(userId: string): Promise<boolean> {
  const tokens = await getHMRCTokens(userId);
  return tokens !== null;
}
