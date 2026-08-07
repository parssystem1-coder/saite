import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock admin-session to control auth
vi.mock('@/lib/auth/server/admin-session', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth/server/admin-session')>('@/lib/auth/server/admin-session')
  return {
    ...actual,
    getAdminSession: vi.fn(),
  }
})

import { GET, POST } from '@/app/api/admin/emojis/route'
import { getAdminSession } from '@/lib/auth/server/admin-session'

const mockedGetAdminSession = vi.mocked(getAdminSession)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('/api/admin/emojis', () => {
  it('GET بدون نشست → 401', async () => {
    mockedGetAdminSession.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.message).toBe('Unauthorized')
  })

  it('GET با نشست → 200', async () => {
    mockedGetAdminSession.mockResolvedValue({ id: 'admin-1', name: 'مدیر', email: 'admin@saite.local', role: 'admin' } as any)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.emojis)).toBe(true)
  })

  it('POST بدون نشست → 401', async () => {
    mockedGetAdminSession.mockResolvedValue(null)
    const req = new Request('http://localhost:3000/api/admin/emojis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji: '✅' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('POST ایموجی نامعتبر (>8) → 422', async () => {
    mockedGetAdminSession.mockResolvedValue({ id: 'admin-1', name: 'مدیر', email: 'admin@saite.local', role: 'admin' } as any)
    const req = new Request('http://localhost:3000/api/admin/emojis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji: 'abcdefghij' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(422)
  })

  it('POST ایموجی معتبر → 200', async () => {
    mockedGetAdminSession.mockResolvedValue({ id: 'admin-1', name: 'مدیر', email: 'admin@saite.local', role: 'admin' } as any)
    const unique = `🧪${Date.now().toString().slice(-3)}`
    const req = new Request('http://localhost:3000/api/admin/emojis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji: unique }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.emojis).toContain(unique)
  })
})
