#!/usr/bin/env node
/**
 * ابزار راه‌اندازی امنیت حساب مدیر.
 *
 * ══════════════════════════════════════════════════════════════
 *  چرا اسکریپت جداگانه و نه صفحه در پنل؟
 * ══════════════════════════════════════════════════════════════
 * برای هش کردن رمز باید رمز جدید را جایی وارد کنید. اگر این کار
 * در پنل انجام می‌شد، رمز از شبکه عبور می‌کرد و در لاگ سرور یا
 * تاریخچهٔ مرورگر می‌ماند.
 *
 * اینجا رمز از خط فرمان خوانده می‌شود، هش می‌شود و فقط **هش**
 * چاپ می‌شود. خود رمز هیچ‌جا ذخیره نمی‌شود.
 *
 * ── دستورها ───────────────────────────────────────────────────
 *   npm run admin:hash-password           رمز را هش می‌کند
 *   npm run admin:totp                    کلید دومرحله‌ای می‌سازد
 *   npm run admin:secret                  کلید امضای نشست می‌سازد
 *   npm run admin:check                   پیکربندی فعلی را می‌سنجد
 *
 * چون این فایل `.mjs` است و بدون بیلد اجرا می‌شود، منطق رمزنگاری
 * اینجا تکرار شده — عمداً. اسکریپت باید بدون `next build` کار
 * کند، و وارد کردن TypeScript از `src/` این وابستگی را می‌آورد.
 * هر دو نسخه با `tests/lib/password-hash.test.ts` هم‌راستا
 * نگه داشته می‌شوند.
 */

import { createInterface } from 'node:readline'
import { randomBytes, scrypt } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const PARAMS = { N: 16_384, r: 8, p: 1, keyLength: 64 }
const MAX_MEM = 128 * PARAMS.N * PARAMS.r * 2
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

const color = {
  reset: '\u001b[0m',
  bold: '\u001b[1m',
  dim: '\u001b[2m',
  green: '\u001b[32m',
  yellow: '\u001b[33m',
  red: '\u001b[31m',
  cyan: '\u001b[36m',
}

function scryptAsync(password, salt, keyLength, options) {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (error, key) =>
      error ? reject(error) : resolve(key)
    )
  })
}

async function hashPassword(password) {
  const salt = randomBytes(16)
  const derived = await scryptAsync(password, salt, PARAMS.keyLength, {
    N: PARAMS.N,
    r: PARAMS.r,
    p: PARAMS.p,
    maxmem: MAX_MEM,
  })
  /*
    جداکننده `.` و base64url است، نه `$` و base64 استاندارد PHC.

    دلیل: Next.js مقادیر .env را از تابع expand رد می‌کند و
    `$16384` را متغیر می‌بیند. نتیجهٔ واقعی آزمایش:
      scrypt$16384$8$1$AbCd+/==$XyZ  →  scrypt6384+/==
    یعنی هش بی‌صدا نابود می‌شد.
  */
  return [
    'scrypt',
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString('base64url'),
    derived.toString('base64url'),
  ].join('.')
}

function toBase32(buffer) {
  let bits = 0
  let value = 0
  let output = ''
  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  return output
}

/**
 * خواندن ورودی بدون نمایش روی صفحه.
 *
 * ── دو تلهٔ واقعی که اینجا رخ داد ─────────────────────────────
 * ۱. پنهان‌کردن ورودی فقط با ترمینال واقعی (`isTTY`) معنا دارد.
 *    با ورودی pipe شده، دستکاری صفحه باعث می‌شد `readline` هرگز
 *    پاسخ ندهد و اسکریپت با «unsettled top-level await» معلق
 *    بماند.
 *
 * ۲. ساختن `createInterface` جداگانه برای هر سؤال، روی stdin
 *    غیرتعاملی کار نمی‌کند: اینترفیس اول جریان را مصرف و بسته
 *    می‌کند و دومی هیچ‌وقت داده نمی‌گیرد. پس **یک** اینترفیس
 *    مشترک ساخته می‌شود.
 *
 * هر دو با `printf 'a\nb\n' | node scripts/admin-setup.mjs`
 * تأیید شدند.
 */
let sharedReadline = null
/** خط‌هایی که رسیده‌اند ولی هنوز کسی نخواسته */
const pendingLines = []
/** کسانی که منتظر خط بعدی‌اند */
const lineWaiters = []

function getReadline() {
  if (!sharedReadline) {
    sharedReadline = createInterface({ input: process.stdin, output: process.stdout })

    /*
      چرا رویداد `line` و نه `rl.question`؟

      با ورودی pipe شده، Node کل بافر را در یک tick تحویل می‌دهد.
      اگر بین دو `question` یک `await` باشد، خط دوم پیش از ثبت
      callback بعدی مصرف می‌شود و برای همیشه گم می‌شود — اسکریپت
      با «unsettled top-level await» معلق می‌ماند.

      این با `printf 'a\nb\n' | node …` بازتولید و تأیید شد.

      راه‌حل: خطوط را همان لحظه که می‌رسند در صف نگه می‌داریم و
      هر درخواست از صف برمی‌دارد.
    */
    sharedReadline.on('line', (line) => {
      const waiter = lineWaiters.shift()
      if (waiter) waiter(line)
      else pendingLines.push(line)
    })
  }
  return sharedReadline
}

function closeReadline() {
  if (sharedReadline) {
    sharedReadline.close()
    sharedReadline = null
  }
}

function nextLine() {
  const buffered = pendingLines.shift()
  if (buffered !== undefined) return Promise.resolve(buffered)
  return new Promise((resolve) => lineWaiters.push(resolve))
}

function askHidden(question) {
  const isInteractive = process.stdin.isTTY === true
  getReadline()

  process.stdout.write(question)

  const onData = () => {
    // بازنویسی خط — طول واقعی رمز هم پنهان می‌ماند
    process.stdout.write(`\u001b[2K\u001b[200D${question}`)
  }

  if (isInteractive) process.stdin.on('data', onData)

  return nextLine().then((line) => {
    if (isInteractive) {
      process.stdin.removeListener('data', onData)
      process.stdout.write('\n')
    }
    return line.trim()
  })
}

function readEnvLocal() {
  const path = join(process.cwd(), '.env.local')
  if (!existsSync(path)) return {}
  const result = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index === -1) continue
    result[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim()
  }
  return result
}

/* ── دستورها ─────────────────────────────────────────────────── */

async function cmdHashPassword() {
  console.log(`\n${color.bold}🔐 ساخت هش رمز مدیر${color.reset}\n`)
  console.log(
    `${color.dim}رمز روی صفحه نمایش داده نمی‌شود و هیچ‌جا ذخیره نخواهد شد.${color.reset}\n`
  )

  const password = await askHidden('رمز جدید: ')

  if (password.length < 10) {
    closeReadline()
    console.error(`\n${color.red}✗ رمز باید حداقل ۱۰ کاراکتر باشد.${color.reset}\n`)
    process.exit(1)
  }

  const confirm = await askHidden('تکرار رمز: ')
  closeReadline()

  if (password !== confirm) {
    console.error(`\n${color.red}✗ دو رمز یکسان نیستند.${color.reset}\n`)
    process.exit(1)
  }

  const hash = await hashPassword(password)

  console.log(`\n${color.green}✓ هش ساخته شد.${color.reset}`)
  console.log(`\n${color.dim}این خط را در .env.local بگذارید:${color.reset}\n`)
  console.log(`${color.cyan}ADMIN_PASSWORD=${hash}${color.reset}\n`)
  console.log(
    `${color.dim}سپس سرور را دوباره اجرا کنید. از این پس رمز شما\n` +
      `به‌صورت هش ذخیره است و از روی فایل قابل خواندن نیست.${color.reset}\n`
  )
}

function cmdTotp() {
  const secret = toBase32(randomBytes(20))

  console.log(`\n${color.bold}📱 فعال‌سازی ورود دومرحله‌ای${color.reset}\n`)
  console.log(`${color.dim}۱. این خط را در .env.local بگذارید:${color.reset}\n`)
  console.log(`${color.cyan}ADMIN_TOTP_SECRET=${secret}${color.reset}\n`)
  console.log(
    `${color.dim}۲. در Google Authenticator (یا Authy / 1Password) گزینهٔ\n` +
      `   «افزودن با کلید دستی» را بزنید و همین رشته را وارد کنید.${color.reset}\n`
  )
  console.log(`${color.dim}۳. سرور را دوباره اجرا کنید.${color.reset}\n`)
  console.log(
    `${color.yellow}⚠ پس از تعریف این متغیر، ورود بدون کد شش‌رقمی ممکن\n` +
      `  نخواهد بود. کلید بالا را جای امنی نگه دارید — اگر هم گوشی\n` +
      `  و هم این کلید را از دست بدهید، باید خط را از .env.local\n` +
      `  حذف کنید تا دوباره وارد شوید.${color.reset}\n`
  )
}

function cmdSecret() {
  console.log(`\n${color.bold}🔑 کلید امضای نشست${color.reset}\n`)
  console.log(`${color.cyan}ADMIN_SESSION_SECRET=${randomBytes(32).toString('base64')}${color.reset}\n`)
  console.log(
    `${color.dim}این کلید کوکی نشست را امضا می‌کند. بدون آن در\n` +
      `production برنامه عمداً بالا نمی‌آید.${color.reset}\n`
  )
}

function cmdCheck() {
  const env = { ...readEnvLocal(), ...process.env }
  console.log(`\n${color.bold}🔍 بررسی پیکربندی امنیتی مدیر${color.reset}\n`)

  const checks = []

  const username = env.ADMIN_USERNAME?.trim()
  checks.push({
    label: 'نام کاربری',
    ok: Boolean(username) && username !== 'admin',
    good: `سفارشی (${username})`,
    bad: 'هنوز «admin» پیش‌فرض است',
    critical: false,
  })

  const password = env.ADMIN_PASSWORD?.trim() ?? ''
  const hashed = password.startsWith('scrypt.')
  checks.push({
    label: 'رمز عبور',
    ok: hashed,
    good: 'هش‌شده با scrypt',
    bad: password
      ? 'متن ساده — با npm run admin:hash-password هش کنید'
      : 'تعریف نشده؛ رمز نمایشی saite-demo-1404 فعال است',
    critical: true,
  })

  const secret = env.ADMIN_SESSION_SECRET?.trim() ?? ''
  checks.push({
    label: 'کلید امضای نشست',
    ok: secret.length >= 16,
    good: 'تعریف شده',
    bad: 'تعریف نشده — با npm run admin:secret بسازید',
    critical: true,
  })

  checks.push({
    label: 'ورود دومرحله‌ای',
    ok: Boolean(env.ADMIN_TOTP_SECRET?.trim()),
    good: 'فعال',
    bad: 'غیرفعال — با npm run admin:totp فعال کنید',
    critical: false,
  })

  let criticalFailures = 0

  for (const check of checks) {
    if (check.ok) {
      console.log(`  ${color.green}✓${color.reset} ${check.label}: ${check.good}`)
    } else {
      const mark = check.critical ? `${color.red}✗` : `${color.yellow}!`
      console.log(`  ${mark}${color.reset} ${check.label}: ${check.bad}`)
      if (check.critical) criticalFailures++
    }
  }

  console.log()

  if (criticalFailures > 0) {
    console.log(
      `${color.red}${criticalFailures} مورد بحرانی باید پیش از انتشار روی\n` +
        `هاست عمومی برطرف شود.${color.reset}\n`
    )
    process.exit(1)
  }

  console.log(`${color.green}پیکربندی برای انتشار آماده است.${color.reset}\n`)
}

/* ── مسیریابی ────────────────────────────────────────────────── */

const command = process.argv[2]

switch (command) {
  case 'hash-password':
    await cmdHashPassword()
    break
  case 'totp':
    cmdTotp()
    break
  case 'secret':
    cmdSecret()
    break
  case 'check':
    cmdCheck()
    break
  default:
    console.log(`
${color.bold}ابزار امنیت حساب مدیر${color.reset}

  ${color.cyan}npm run admin:check${color.reset}           بررسی پیکربندی فعلی
  ${color.cyan}npm run admin:hash-password${color.reset}   هش کردن رمز
  ${color.cyan}npm run admin:totp${color.reset}            فعال‌سازی ورود دومرحله‌ای
  ${color.cyan}npm run admin:secret${color.reset}          ساخت کلید امضای نشست
`)
    process.exit(command ? 1 : 0)
}
