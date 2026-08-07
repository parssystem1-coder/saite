import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'سایت — ماشین‌های اداری'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0f',
          backgroundImage:
            'radial-gradient(600px 400px at 50% 0%, rgba(168, 85, 247, 0.25), transparent 60%), linear-gradient(180deg, rgba(168, 85, 247, 0.08), transparent 50%)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            color: '#a855f7',
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: '-0.02em',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 24,
              fontWeight: 900,
            }}
          >
            S
          </div>
          SAITE
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 56,
            fontWeight: 900,
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.1,
          }}
        >
          ماشین‌های اداری
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 28,
            fontWeight: 700,
            color: '#a855f7',
            textShadow: '0 0 20px rgba(168, 85, 247, 0.6)',
          }}
        >
          پرینتر • اسکنر • کپی • قطعات یدکی
        </div>
        <div
          style={{
            marginTop: 28,
            display: 'flex',
            gap: 12,
          }}
        >
          <div
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              color: '#e9d5ff',
              fontSize: 16,
            }}
          >
            saite.ir
          </div>
          <div
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#a1a1aa',
              fontSize: 16,
            }}
          >
            B2B • B2C
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
