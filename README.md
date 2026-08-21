# سامانه آموزش و ارزیابی کار و فناوری

پروژه به سه اپ مستقل تقسیم شده: اپ اندروید دانش‌آموز، اپ اندروید مربی، و اپ دسکتاپ ویندوز مدیریت (مدیر مدرسه / ادمین شهرستان / ادمین استان / سوپرادمین) — به‌علاوه‌ی نسخه‌ی وب مشترک همه‌شون.

## ساختار فایل‌ها

```
index.html          ← صفحه‌ی ورودی وب: انتخاب دانش‌آموز یا مربی
shared/              ← فایل‌های مشترک بین اپ‌های وب/اندروید
  css/style.css
  js/config.js        ← تنظیمات Supabase (SUPABASE_URL / SUPABASE_ANON_KEY)
  js/state.js          ← وضعیت مشترک برنامه
  js/utils.js           ← توابع کمکی عمومی
  js/vendor/supabase.js  ← کتابخانه‌ی Supabase
student/             ← اپ وب دانش‌آموز
  index.html
  manifest.json، sw.js، آیکون‌ها
  js/auth.js، student.js، games.js، main.js
teacher/             ← اپ وب مربی/ادمین
  index.html، reset-password.html
  manifest.json، sw.js، آیکون‌ها
  js/auth.js، teacher.js، district.js، main.js
karvfan-android-student/  ← پروژه‌ی اندروید دانش‌آموز (Capacitor) — appId: com.karvfan.student
karvfan-android-teacher/  ← پروژه‌ی اندروید مربی (Capacitor) — appId: com.karvfan.teacher
capacitor.config.student.json / capacitor.config.teacher.json  ← تنظیمات جدای هر اپ اندروید
admin-desktop/        ← اپ دسکتاپ ویندوز (Electron) برای مدیر مدرسه/ادمین شهرستان/استان/سوپرادمین
```

## دیپلوی

این ریپو به Cloudflare Workers (Static Assets) وصل شده — هر پوش روی برنچ `main`
به‌صورت خودکار دیپلوی می‌شه (از طریق تنظیمات Build در داشبورد Cloudflare، دستور
`npx wrangler deploy`).

اپ‌های اندروید و ویندوز جدا از سایت، توسط GitHub Actions ساخته می‌شن (به ازای هرکدوم یک workflow جدا زیر `.github/workflows/`) و به‌صورت artifact قابل دانلودن — دیپلوی به گوگل‌پلی/مایکروسافت‌استور هنوز دستیه.

## بک‌اند

همه‌ی اپ‌ها (وب، اندروید، دسکتاپ) به یک پروژه‌ی Supabase مشترک وصل می‌شن — یعنی داده‌ها
(دانش‌آموزان، درس‌ها، تکالیف، مدارس، استان/شهرستان و...) بین همه به‌اشتراک گذاشته می‌شه.

## نقشه‌ی راه (فازهای بعدی)

- [x] سلسله‌مراتب ادمین: مدیر مدرسه، ادمین شهرستان، ادمین استان، سوپرادمین — در `admin-desktop` پیاده‌سازی شده
- [x] دو پروژه‌ی جدا برای اپ اندروید دانش‌آموز و مربی
- [ ] دیتابیس استان‌ها و شهرستان‌های ایران + منوی بازشوی وابسته (استان → شهرستان)
- [ ] گردش‌کار اضافه‌کردن مدرسه توسط معلم، با تأیید ادمین شهرستان
- [ ] دو پروژه‌ی جدا برای اپ اندروید دانش‌آموز و مربی
