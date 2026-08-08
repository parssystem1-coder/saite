import 'server-only'

import { cookies } from 'next/headers'
import {
  createSessionToken,
  verifySessionToken,
  type SessionPayload,
} from './session-token'

export const CUSTOMER_SESSION_COOKIE = 'saite_customer_session'
export const CUSTOMER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // ۷ روز

const isProduction = process.env.NODE_ENV === 'production'

export async function createCustomerSession(customerId: string): Promise<void> {
  const token = await createSessionToken(customerId, 'customer')
  const cookieStore = await cookies()

  cookieStore.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: CUSTOMER_SESSION_MAX_AGE_SECONDS,
  })
}

export async function destroyCustomerSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(CUSTOMER_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

export async function getCustomerSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value
  return verifySessionToken(token, 'customer')
}

export async function requireCustomerSession(): Promise<SessionPayload> {
  const session = await getCustomerSession()
  if (!session) throw new Error('Unauthorized')
  return session
}
