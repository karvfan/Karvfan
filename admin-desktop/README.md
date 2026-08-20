# پنل مدیریت دسکتاپ — کار و فناوری (Electron / Windows)

اپلیکیشن دسکتاپ ویندوز برای سه سطح مدیریتی سامانه:

- 🏫 **مدیر مدرسه** — آمار و اطلاعات مدرسه‌ی خودش
- 🏛️ **ادمین شهرستان / استان** — تأیید یا رد درخواست ثبت مدرسه‌ی جدید، آمار همه‌ی مدارس منطقه، مدیریت مدیران مدارس
- 👑 **سوپرادمین** — دسترسی کامل به همه‌ی استان‌ها/شهرستان‌ها و مدیریت کارکنان در هر سطح

به همان بک‌اند Supabase وب‌اپ‌های دانش‌آموز/معلم وصل می‌شود — یعنی داده‌ها مشترک است.

## اجرا روی سیستم خودتان (توسعه)

```bash
cd admin-desktop
npm install
npm start
```

## ساخت نصب‌کننده‌ی ویندوز (.exe)

روی ویندوز:
```bash
npm install
npm run dist
```
فایل خروجی در `admin-desktop/dist/` قرار می‌گیرد.

> از یک ماشین لینوکسی هم می‌شود cross-compile کرد، ولی سازگاری کامل تضمین نیست —
> برای همین یک GitHub Action (`.github/workflows/build-admin-desktop.yml`) روی هر
> پوش به `main` که فایلی در این پوشه تغییر کند، خودکار خروجی ویندوز واقعی را با
> یک runner ویندوزی می‌سازد و به‌عنوان Artifact قابل‌دانلود در تب Actions
> گیت‌هاب می‌گذارد.

## ساخت حساب برای ادمین‌ها

فعلاً حساب کاربری (ایمیل/رمز) فقط از پنل Supabase ساخته می‌شود:
**Supabase Dashboard → Authentication → Users → Add user**

بعد از ساخت حساب:
- برای اولین **سوپرادمین**، این SQL را در Supabase SQL Editor اجرا کنید (به‌جای ایمیل، ایمیل واقعی را بگذارید):
```sql
insert into public.staff (id, full_name, role)
select id, 'سوپرادمین اصلی', 'super_admin' from auth.users where email = 'YOUR_EMAIL@example.com'
on conflict (id) do update set role='super_admin';
```
- بعد از آن، سوپرادمین می‌تواند از همین پنل (بخش «مدیریت کارکنان») باقی ادمین‌های شهرستان/استان/مدرسه را بسازد.

## ساختار

```
admin-desktop/
  main.js              نقطه‌ی شروع Electron (پنجره‌ی اصلی)
  src/
    login-select.html  انتخاب سطح دسترسی
    login-school.html  ورود مدیر مدرسه
    login-district.html ورود ادمین شهرستان/استان
    login-super.html   ورود سوپرادمین
    dashboard.html      پنل اصلی بعد از ورود
    js/config.js         اتصال Supabase
    js/login.js           منطق ورود مشترک
    js/dashboard.js        منطق داشبورد (آمار، تأیید مدرسه، مدیریت کارکنان)
```
