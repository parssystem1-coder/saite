/**
 * رندر یک یا چند شیء schema.org به‌صورت JSON-LD.
 * فقط در Server Component استفاده شود.
 *
 * ── چرا nonce نمی‌گیرد ────────────────────────────────────────
 * `<script type="application/ld+json">` جز data-script است و از
 * CSP `script-src` مستثنی — مرورگر آن را اجرا نمی‌کند، فقط
 * پارس می‌کند. پس nonce ندارد و صفحه static می‌ماند.
 *
 * اگر روزی CSP روی data-script هم اعمال شد (پیشنهاد آینده W3C)،
 * `nonce` را از `headers()` بخوانید — این کار صفحه را dynamic
 * می‌کند که هزینهٔ عملکردی دارد.
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
