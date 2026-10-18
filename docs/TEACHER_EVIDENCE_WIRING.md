# سند کلاسی و طرح درس

اتصال انجام شده است؛ کار دستی لازم نیست.

## پنل معلم (teacher/)
- `js/main.js` انتهای خودش `js/evidence.js` و `js/evidence-boot.js` را لود می‌کند.
- `evidence-boot.js` تب «سند کلاسی و طرح درس» را بعد از «اطلاعیه‌ها» می‌سازد و `switchTeacherTab` را با یک wrapper گسترش می‌دهد.
- فقط کاربران با نقش `teacher` فرم را می‌بینند؛ بقیه‌ی نقش‌ها یک پیام راهنما می‌بینند.
- اگر خواستید به‌جای ساخت دینامیک، تب و پنل را مستقیم در `index.html` بگذارید، همان idها (`tEvidence`، `evidenceRoot`) را نگه دارید.

## پنل مدیریت (admin-desktop/)
- در `dashboard.html` دکمه‌ی منو و پنل `pEvidence` اضافه شده و دو اسکریپت `evidence.js` و `evidence-boot.js` لود می‌شوند.
- `evidence-boot.js` با wrapper روی `switchPanel` هنگام باز شدن پنل، لیست را بارگذاری می‌کند.

## دیتابیس
- ماگریشن روی Karfan.prod اجرا شده (جدول‌های `class_evidence` و `lesson_plans`، bucket خصوصی `class-evidence`).
- فایل‌ها با signed URL نمایش داده می‌شوند.
- `students.school` متن (نام مدرسه) است؛ لیست دانش‌آموزان با تطابق نام مدرسه پر می‌شود.

## تست
با یک حساب معلم سند و طرح درس ثبت کنید، با حساب مدیر همان مدرسه در پنل مدیریت ببینید.
