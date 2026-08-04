'use client'

import { MessageCircle, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GoogleGlyph } from '@/components/auth/social-auth-icons'

/**
 * روش‌های ورود جایگزین.
 *
 * ── چرا GitHub حذف شد؟ ────────────────────────────────────────
 * GitHub برای توسعه‌دهندگان است. مخاطب این فروشگاه مدیر اداری و
 * کارشناس خرید سازمانی است — احتمال داشتن حساب GitHub نزدیک صفر.
 * دکمه‌ای که هیچ‌کس نمی‌زند فقط فرم را شلوغ می‌کند و توجه را از
 * مسیر اصلی ورود می‌گیرد.
 *
 * ── جایگزین‌ها بر اساس واقعیت بازار ایران ─────────────────────
 *   ۱. ورود با رمز یک‌بارمصرف پیامکی — رایج‌ترین روش در ایران.
 *      کاربر رمز را فراموش می‌کند اما موبایلش همیشه همراهش است.
 *   ۲. واتساپ — کانال ارتباطی اصلی همین فروشگاه است و کاربر
 *      از قبل با آن آشناست.
 *   ۳. گوگل — برای کسانی که ایمیل کاری دارند.
 *
 * ── فاز بک‌اند ────────────────────────────────────────────────
 * هر سه دکمه فعلاً غیرفعال‌اند. برای فعال‌سازی:
 *   • پیامک: سرویس داخلی (کاوه‌نگار/فراز‌اس‌ام‌اس) + محدودیت نرخ
 *     ارسال روی شماره و IP، انقضای کد در ۲ دقیقه
 *   • گوگل: OAuth 2.0 با NextAuth
 *   • واتساپ: WhatsApp Business API
 */
export function SocialAuthButtons() {
  return (
    <div className="space-y-3">
      <div className="relative py-2">
        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-border" />
        <span className="relative mx-auto block w-fit bg-surface-1 px-3 text-[11px] font-bold text-muted-foreground">
          یا ورود با
        </span>
      </div>

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        disabled
        title="پس از اتصال سرویس پیامک فعال می‌شود"
      >
        <Smartphone />
        رمز یک‌بارمصرف پیامکی
      </Button>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled
          title="پس از اتصال بک‌اند فعال می‌شود"
        >
          <GoogleGlyph className="size-[1.1em]" />
          گوگل
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled
          title="پس از اتصال بک‌اند فعال می‌شود"
        >
          <MessageCircle />
          واتساپ
        </Button>
      </div>

      <p className="text-center text-[10px] text-muted-foreground/70">
        این روش‌ها پس از اتصال بک‌اند فعال می‌شوند.
      </p>
    </div>
  )
}
