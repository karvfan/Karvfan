/**
 * update-check.js — هشدار نسخه‌ی جدید برای پنل ویندوزی (Electron).
 *
 *  - چک نسخه و دانلود از طریق دامنه‌ی karvfan.ir (Worker کلودفلر) انجام می‌شه، نه مستقیم github.com
 *    (گیت‌هاب برای بسیاری کاربرها دسترسی‌ناپذیره و از file:// هم CORS نداشت).
 *  - هم‌زمان با بازشدن برنامه، هر بار برگشت به پنجره و هر ۱۵ دقیقه چک می‌شه.
 *  - «بعداً» ۱۲ ساعت همان نسخه را مخفی می‌کنه؛ نسخه‌ی بازتر دوباره نشان داده می‌شه.
 *  - لینک دانلود در مرورگر پیش‌فرض ویندوز باز می‌شه (shell.openExternal)، نه داخل پنجره‌ی برنامه.
 *  - پاسخ سرور باید شناسه‌ی کامیت (hex) باشه؛ وگرنه هشدار اشتباهی نشون داده نمی‌شه.
 */
const KF_UPDATE_ORIGIN = 'https://karvfan.ir';
const KF_UPDATE_RECHECK_MS = 15 * 60 * 1000;
const KF_UPDATE_SNOOZE_MS = 12 * 60 * 60 * 1000;
let _kfLastUpdateCheck = 0;

function kfOpenExternal(url){
  try { require('electron').shell.openExternal(url); }
  catch (e) { window.open(url, '_blank'); }
}

async function checkForAppUpdate(label, humanName){
  if (typeof BUILD_VERSION === 'undefined' || !BUILD_VERSION) return;
  const run = async (force) => {
    const now = Date.now();
    if (!force && now - _kfLastUpdateCheck < KF_UPDATE_RECHECK_MS) return;
    _kfLastUpdateCheck = now;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(KF_UPDATE_ORIGIN + '/version/' + label + '.txt', { cache: 'no-store', signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) return;
      const latest = (await res.text()).trim();
      if (!/^[0-9a-f]{7,40}$/i.test(latest)) return;
      if (latest === BUILD_VERSION) { removeAppUpdateBanner(); return; }
      let snoozed = false;
      try {
        const s = JSON.parse(localStorage.getItem('kf_update_snooze_' + label) || 'null');
        snoozed = !!(s && s.v === latest && now - s.t < KF_UPDATE_SNOOZE_MS);
      } catch (e) {}
      if (!snoozed) showAppUpdateBanner(humanName, KF_UPDATE_ORIGIN + '/download/desktop.exe', label, latest);
    } catch (e) { /* چک آپدیت نباید مانع کارکرد عادی بشه */ }
  };
  await run(true);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') run(false); });
  window.addEventListener('focus', () => run(false));
  setInterval(() => run(false), KF_UPDATE_RECHECK_MS);
}
function removeAppUpdateBanner(){
  const el = document.getElementById('appUpdateBanner');
  if (el) el.remove();
}
function showAppUpdateBanner(name, url, label, latest){
  if (document.getElementById('appUpdateBanner')) return;
  const bar = document.createElement('div');
  bar.id = 'appUpdateBanner';
  bar.setAttribute('role', 'alert');
  bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:linear-gradient(120deg,#26334a,#334463);color:#fff;' +
    'padding:10px 18px;font-family:inherit;font-size:13px;line-height:1.8;box-shadow:0 4px 14px rgba(0,0,0,.25);' +
    'display:flex;align-items:center;gap:12px;justify-content:center;flex-wrap:wrap';
  bar.innerHTML =
    '<span><b>🔔 نسخه‌ی جدیدی از «' + name + '» آماده‌ست</b> — برای دریافت امکانات جدید، نصب‌کننده را دانلود و اجرا کنید.</span>' +
    '<button type="button" id="appUpdateLink" style="background:#D79A2C;color:#1c2738;font-weight:800;border:none;border-radius:20px;padding:7px 16px;cursor:pointer;font-family:inherit">دانلود نصب‌کننده</button>' +
    '<button type="button" id="appUpdateLater" style="background:transparent;border:1px solid rgba(255,255,255,.4);color:#fff;border-radius:20px;padding:6px 12px;cursor:pointer;font-family:inherit;font-size:12px">بعداً</button>';
  bar.querySelector('#appUpdateLink').addEventListener('click', () => kfOpenExternal(url));
  bar.querySelector('#appUpdateLater').addEventListener('click', () => {
    try { localStorage.setItem('kf_update_snooze_' + label, JSON.stringify({ v: latest, t: Date.now() })); } catch (e) {}
    bar.remove();
  });
  document.body.prepend(bar);
}
