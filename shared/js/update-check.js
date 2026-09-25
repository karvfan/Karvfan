/**
 * update-check.js — بررسی نسخه‌ی جدید برای اپ‌های نصب‌شده (اندروید/دسکتاپ).
 * روی خودِ وب‌سایت (Cloudflare) هیچ‌کاری نمی‌کنه، چون BUILD_VERSION همیشه تازه‌ست
 * (کاربر هر بار آخرین نسخه‌ی سایت رو می‌گیره) — این چک فقط برای بسته‌هایی
 * معنا داره که دانلود و نصب می‌شن و ممکنه نسخه‌شون قدیمی بمونه.
 *
 * چک نسخه و دانلود آپدیت، هر دو از طریق خودِ دامنه‌ی karvfan.ir انجام می‌شه
 * (نه مستقیم گیت‌هاب)، چون درخواست‌ها رو Worker سمت کلودفلر واسطه‌گری می‌کنه.
 */
async function checkForAppUpdate(label, humanName){
  if (typeof BUILD_VERSION === 'undefined' || !BUILD_VERSION) return;
  try {
    const res = await fetch('https://karvfan.ir/version/' + label + '.txt', { cache: 'no-store' });
    if(!res.ok) return;
    const latest = (await res.text()).trim();
    if(latest && latest !== BUILD_VERSION){
      const fileMap = { student: 'student.apk', teacher: 'teacher.apk', desktop: 'desktop.exe' };
      showAppUpdateBanner(humanName, 'https://karvfan.ir/download/' + fileMap[label]);
    }
  } catch(e){ /* چک آپدیت نباید مانع کارکرد عادی اپ بشه — بی‌سروصدا رد می‌شیم */ }
}
function showAppUpdateBanner(name, url){
  if(document.getElementById('appUpdateBanner')) return;
  const bar = document.createElement('div');
  bar.id = 'appUpdateBanner';
  bar.innerHTML = '🔔 نسخه‌ی جدیدی از ' + name + ' منتشر شده — ' +
    '<a href="'+url+'" target="_blank" rel="noopener" style="color:#1c2738;font-weight:800;text-decoration:underline">دانلود و نصب آپدیت</a>' +
    '<button type="button" aria-label="بستن" style="background:transparent;border:none;color:#1c2738;font-size:16px;cursor:pointer;margin-inline-start:10px">✕</button>';
  bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#D79A2C;color:#1c2738;padding:10px 16px;text-align:center;font-family:inherit;font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 2px 8px rgba(0,0,0,.15)';
  bar.querySelector('button').addEventListener('click', ()=> bar.remove());
  document.body.prepend(bar);
}
