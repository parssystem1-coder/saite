'use client'

/**
 * آخرین خط دفاع — وقتی layout ریشه هم خطا می‌دهد.
 * باید html/body خودش را رندر کند (خارج از root layout).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="fa" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0c',
          color: '#fafafa',
          fontFamily: 'Tahoma, Arial, sans-serif',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '28rem',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1rem',
            padding: '2rem',
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.75rem' }}>خطای غیرمنتظره</h1>
          <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: '#a1a1aa', margin: 0 }}>
            بارگذاری برنامه با مشکل مواجه شد. لطفاً صفحه را دوباره بارگذاری کنید.
          </p>
          {error.digest && (
            <p
              style={{
                marginTop: '0.75rem',
                fontSize: '0.7rem',
                color: '#71717a',
                fontFamily: 'monospace',
              }}
              dir="ltr"
            >
              {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.75rem',
              border: 'none',
              background: 'hsl(265 85% 58%)',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            تلاش دوباره
          </button>
        </div>
      </body>
    </html>
  )
}
