# نکات نهایی

- فایل‌های HTML پیش‌نمایش reference هستند، نه جایگزین API و server actions.
- نسخه واقعی باید داده‌های mock را پشت adapter نگه دارد.
- `cash_on_delivery` با `free` یکی نیست.
- هزینه ثابت یک pricing model مستقل است.
- ارسال رایگان باید store subsidy داشته باشد تا سود واقعی غلط نشود.
- کد رهگیری و barcode از server-generated label بیایند.
- آدرس پروفایل با order address snapshot متفاوت است.
- هر تغییر مهم admin باید audit شود.
