// یک Service Worker حداقلی — فقط برای فعال‌کردن قابلیت «نصب برنامه».
// این سامانه به اینترنت و Supabase نیاز داره، پس عمداً هیچ صفحه‌ای رو
// آفلاین کش نمی‌کنه تا همیشه آخرین نسخه و داده‌ی زنده رو ببینید.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {}); // بدون کش؛ همه‌چیز مستقیم از شبکه
