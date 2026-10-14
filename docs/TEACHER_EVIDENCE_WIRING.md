# اتصال بخش «سند کلاسی و طرح درس»

دیتابیس آماده است. این دو ماژول مستقل‌اند و فقط باید به صفحه‌ها وصل شوند.

## پنل معلم (teacher/index.html)
1. یک تب یا بخش جدید با `<div id="evidenceRoot"></div>` اضافه کنید.
2. قبل از `</body>`، بعد از اسکریپت‌هایی که `sb` را می‌سازند:
```html
<script src="js/evidence.js"></script>
```
3. هنگام باز شدن آن تب (یک‌بار): `initTeacherEvidence('evidenceRoot');`

## پنل مدیریت (admin-desktop)
1. یک صفحه/تب جدید با `<div id="evidenceAdminRoot"></div>` اضافه کنید.
2. اسکریپت `src/js/evidence.js` را بعد از `config.js` لود کنید.
3. هنگام باز شدن آن صفحه: `loadEvidenceAdmin('evidenceAdminRoot');`

## نکات
- فایل‌ها در bucket خصوصی `class-evidence` هستند و با signed URL نمایش داده می‌شوند.
- دانش‌آموزان در جدول `students` مدرسه را با **نام** (متن) دارند، نه شناسه؛ لیست دانش‌آموزان با تطابق `students.school = schools.name` پر می‌شود.
- هنوز تست نشده: ابتدا با یک حساب معلم و یک حساب مدیر امتحان کنید.
