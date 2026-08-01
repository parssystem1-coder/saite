# 🤝 راهنمای مشارکت — Saite

ممنون از علاقهٔ شما به مشارکت در پروژهٔ Saite! این راهنما به شما کمک می‌کند تا contribution مؤثر و سازنده‌ای داشته باشید.

---

## 📋 قبل از شروع

1. **Issue های موجود** را بررسی کنید — شاید مشکل یا درخواست شما قبلاً ثبت شده باشد
2. اگر می‌خواهید روی Issue جدیدی کار کنید، ابتدا **یک Issue بسازید** یا در Issue موجود اعلام آمادگی کنید
3. برای تغییرات بزرگ، قبل از شروع کد، در Issue مورد نظر **گفتگو** کنید

---

## 🛠 محیط توسعه

```bash
# ۱. کلون مخزن
git clone https://github.com/parssystem1-coder/saite.git
cd saite

# ۲. نصب وابستگی‌ها
pnpm install

# ۳. سرور توسعه
pnpm dev

# ۴. قبل از commit — بررسی کیفیت
pnpm verify
```

---

## 📐 استانداردهای کد

### TypeScript
- از `strict` mode استفاده کنید
- تایپ‌های `any` فقط در مواقع ضروری
- از `interface` به جای `type` برای object shapes استفاده کنید (ترجیحی)

### کامپوننت‌ها
- یک کامپوننت = یک فایل
- نام فایل = نام کامپوننت (PascalCase)
- کامپوننت‌های reusable در `components/ui/`
- کامپوننت‌های مخصوص صفحه در کنار صفحه

### Git Commit Messages

از فرمت [Conventional Commits](https://www.conventionalcommits.org/) استفاده کنید:

```
feat: افزودن صفحهٔ لیست محصولات
fix: رفع مشکل scroll در موبایل
docs: به‌روزرسانی README
style: فرمت کد با Prettier
refactor: استخراج هوک useCart
test: افزودن تست برای CartProvider
chore: به‌روزرسانی وابستگی‌ها
```

---

## 🌿 Branching

| Branch | کاربرد |
|--------|--------|
| `main` | کد پایدار و آمادهٔ استقرار |
| `arena/*` | برنچ‌های توسعه (از طریق Arena) |
| `feat/*` | قابلیت‌های جدید |
| `fix/*` | رفع باگ |

---

## 📬 Pull Request

1. برنچ خود را از آخرین نسخهٔ `main` آپدیت کنید
2. Template PR را پر کنید
3. مطمئن شوید CI سبز است
4. حداقل یک review بگیرید

---

## 🐛 گزارش باگ

از قالب **Bug Report** استفاده کنید (در Issues > New Issue > Bug Report).

## 💡 درخواست قابلیت

از قالب **Feature Request** استفاده کنید.

---

## 📞 ارتباط

- Issues: برای باگ‌ها و درخواست‌ها
- Discussions: برای گفتگوی عمومی

---

ممنون از مشارکت شما! 🙏
