import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * ── چرا قواعد معماری اینجا اضافه شدند ─────────────────────────
 * دو قانون در README و API_CONTRACT نوشته شده بود:
 *
 *   ۱. کامپوننت‌ها `mock-data` را مستقیم import نمی‌کنند
 *   ۲. `components/ui/` باید pure بماند
 *
 * هر دو تا امروز فقط «توافق» بودند — یعنی با اولین عجله نقض
 * می‌شدند و کسی نمی‌فهمید. حالا ESLint نگهبانشان است.
 *
 * تأیید شد که کد فعلی هیچ‌کدام را نقض نمی‌کند، پس این قواعد
 * چیزی را نمی‌شکنند؛ فقط بازگشت را می‌بندند.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/mock-data", "**/lib/mock-data"],
              message:
                "لایهٔ داده تنها درگاه است. از @/lib/api استفاده کنید. " +
                "import مستقیم mock-data یعنی هنگام اتصال بک‌اند این فایل هم باید عوض شود.",
            },
          ],
        },
      ],
    },
  },
  {
    // خود لایهٔ داده طبعاً اجازه دارد
    files: ["src/lib/**/*.ts"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    /*
      کامپوننت‌های پایه نباید به store یا لایهٔ داده وصل شوند.
      یک <Button> که خودش سبد خرید را می‌خواند، دیگر قابل استفادهٔ
      مجدد نیست و تست کردنش کابوس است.
    */
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/store/*", "@/lib/api", "@/lib/api-client"],
              message:
                "components/ui باید pure بماند: بدون store، بدون فراخوانی API. " +
                "داده را به‌صورت prop بدهید.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
