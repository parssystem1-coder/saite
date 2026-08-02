/**
 * رندر یک یا چند شیء schema.org به‌صورت JSON-LD.
 * فقط در Server Component استفاده شود.
 */
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[]
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
