import { describe, it, expect, beforeAll, afterAll } from 'vitest'

// این تست‌ها نیاز به PostgreSQL محلی دارند
// DATABASE_URL=postgresql://postgres:saite_dev_only@localhost:5432/saite_dev

describe('Products API (integration)', () => {
  beforeAll(async () => {
    // Seed در setup انجام می‌شود یا قبل از تست دستی اجرا شود
  })

  afterAll(async () => {
    // cleanup
  })

  it('GET /api/products returns paginated list', async () => {
    const res = await fetch('http://localhost:3000/api/products?page=1&perPage=9')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.items).toBeDefined()
    expect(json.total).toBeDefined()
    expect(json.page).toBe(1)
    expect(json.perPage).toBe(9)
  })

  it('GET /api/products/by-slug/:slug returns a product', async () => {
    const res = await fetch('http://localhost:3000/api/products/by-slug/canon-i-sensys-lbp-2900')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.slug).toBe('canon-i-sensys-lbp-2900')
  })
})
