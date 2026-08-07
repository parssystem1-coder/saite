import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock admin-session to control auth — این تنها نقطهٔ اتصال RBAC است
vi.mock('@/lib/auth/server/admin-session', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/auth/server/admin-session')>(
      '@/lib/auth/server/admin-session'
    )
  return {
    ...actual,
    getAdminSession: vi.fn(),
  }
})

import { GET, POST } from '@/app/api/admin/emojis/route'
import { getAdminSession } from '@/lib/auth/server/admin-session'
import type { AdminRole, AdminUser } from '@/types/user'

const mockedGetAdminSession = vi.mocked(getAdminSession)

function admin(role: AdminRole): AdminUser {
  return { id: 'admin-1', name: 'مدیر', email: 'admin@saite.local', role }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('/api/admin/emojis — گارد نشست', () => {
  it('GET بدون نشست → 401', async () => {
    mockedGetAdminSession.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.reason).toBe('no-session')
  })

  it('GET با نشست (هر نقش) → 200', async () => {
    mockedGetAdminSession.mockResolvedValue(admin('viewer'))
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
})

describe('/api/admin/emojis — گارد نقش (فاز B)', () => {
  it('POST با viewer → 403 (فقط content:write مجاز است)', async () => {
    mockedGetAdminSession.mockResolvedValue(admin('viewer'))
    const req = new Request('http://localhost:3000/api/admin/emojis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji: '✅' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.reason).toBe('forbidden')
  })

  it('POST با operator → 200 (content:write دارد)', async () => {
    mockedGetAdminSession.mockResolvedValue(admin('operator'))
    const unique = `🧪${Date.now().toString().slice(-3)}o`
    const req = new Request('http://localhost:3000/api/admin/emojis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji: unique }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('POST با admin → 200', async () => {
    mockedGetAdminSession.mockResolvedValue(admin('admin'))
    const unique = `🧪${Date.now().toString().slice(-3)}a`
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

  it('POST با operator + ایموجی نامعتبر (>8) → 422 (validation بعد از گارد)', async () => {
    mockedGetAdminSession.mockResolvedValue(admin('operator'))
    const req = new Request('http://localhost:3000/api/admin/emojis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji: 'abcdefghij' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(422)
  })
})
