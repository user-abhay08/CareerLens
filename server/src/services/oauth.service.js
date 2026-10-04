/**
 * Social sign-in verification.
 *
 * Google: the frontend uses Google Identity Services, which returns a signed
 *   ID token (JWT). We verify it against Google's official tokeninfo endpoint
 *   (zero dependencies, validates signature/audience/expiry server-side).
 * Apple: "Sign in with Apple" also yields an identity token, but it must be
 *   verified against Apple's rotating JWKS, so we use the `jose` library.
 *
 * Both providers only give us a verified email + name — we then issue our own
 * JWT session exactly like email/password login does.
 */
import { createHash, randomBytes } from 'node:crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import env from '../config/env.js';

const APPLE_JWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

async function verifyGoogleCredential(credential) {
  if (!credential || typeof credential !== 'string') throw new Error('Missing Google credential');
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!res.ok) throw new Error('Invalid Google credential');
  const data = await res.json();

  if (data.aud !== env.googleClientId) throw new Error('Google credential was issued for a different app');
  if (data.email_verified !== 'true' && data.email_verified !== true) throw new Error('Google account email is not verified');
  if ((Number(data.exp) || 0) * 1000 < Date.now()) throw new Error('Google credential has expired');

  return { email: data.email, name: data.name || data.email, picture: data.picture || '' };
}

async function verifyAppleIdentityToken(identityToken) {
  if (!identityToken || typeof identityToken !== 'string') throw new Error('Missing Apple identity token');
  try {
    const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
      issuer: 'https://appleid.apple.com',
      audience: env.appleClientId,
    });
    if (!payload.email) throw new Error('Apple token has no email');
    return { email: payload.email, name: payload.name || payload.email, picture: '' };
  } catch (err) {
    throw new Error(err.code === 'ERR_JWT_INVALID' || err.name === 'JWTExpired' ? 'Apple identity token is invalid or expired' : 'Apple sign-in is not configured correctly (check APPLE_CLIENT_ID)');
  }
}

/** OAuth users have no password — store an unusable random hash. */
export function unusablePasswordHash() {
  return createHash('sha256').update(randomBytes(32)).digest('hex');
}

export async function verifySocialToken(provider, token) {
  if (provider === 'google') return verifyGoogleCredential(token);
  if (provider === 'apple') return verifyAppleIdentityToken(token);
  throw new Error(`Unsupported provider: ${provider}`);
}
