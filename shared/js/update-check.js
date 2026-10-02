/**
 * update-check.js — بررسی نسخه‌ی جدید برای اپ‌های نصب‌شده (اندروید/دسکتاپ).
 * روی خودِ وب‌سایت هیچ‌کاری نمی‌کنه؛ چون BUILD_VERSION آنجا خالیه.
 *
 * رفتار:
 *  - هم‌زمان با بازشدن اپ چک می‌شه، و هر بار که کاربر به اپ برمی‌گرده (حداقل هر ۱۵ دقیقه).
 *  - اگه کاربر «بعداً» بزنه، ۱۲ ساعت همان نسخه را نشان نمی‌دهه؛ نسخه‌ی بازتر دوباره نشان داده می‌شه.
 *  - پاسخ سرور باید یک شناسه‌ی کامیت (hex) باشه؛ وگرنه (مثلاً اگر به‌جای فایل نسخه
 *    صفحه‌ی HTML برگرده) هشدار اشتباهی نشون داده نمی‌شه.
 *
 * چک نسخه و دانلود از طریق دامنه‌ی karvfan.ir (Worker کلودفلر) انجام می‌شه، نه مستقیم گیت‌هاب.
 */
const KF_UPDATE_ORIGIN = 'https://karvfan.ir';
const KF_UPDATE_FILES = { student: 'student.apk', teacher: 'teacher.apk', desktop: 'desktop.exe' };
const KF_UPDATE_RECHECK_MS = 15 * 60 * 1000;
const KF_UPDATE_SNOOZE_MS = 12 * 60 * 60 * 1000;
let _kfLastUpdateCheck = 0;

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
      if (!snoozed) showAppUpdateBanner(humanName, KF_UPDATE_ORIGIN + '/download/' + KF_UPDATE_FILES[label], label, latest);
    } catch (e) { /* چک آپدیت نباید مانع کارکرد عادی اپ بشه — بی‌سروصدا رد می‌شیم */ }
  };
  await run(true);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') run(false); });
  setInterval(() => run(false), KF_UPDATE_RECHECK_MS);
}

function removeAppUpdateBanner(){
  const el = document.getElementById('appUpdateBanner');
  if (el) el.remove();
}

function showAppUpdateBanner(name, url, label, latest){
  if (document.getElementById('appUpdateBanner')) return;
  /* داخل اپ اندروید (Capacitor) لینک بدون target=_blank به‌صورت Intent در مرورگر سیستم باز می‌شه */
  const inApp = !!window.Capacitor;
  const bar = document.createElement('div');
  bar.id = 'appUpdateBanner';
  bar.setAttribute('role', 'alert');
  bar.style.cssText = 'position:relative;z-index:9999;background:linear-gradient(120deg,#26334a,#334463);color:#fff;' +
    'padding:calc(10px + env(safe-area-inset-top,0px)) 14px 12px;font-family:inherit;font-size:13px;line-height:1.8;' +
    'box-shadow:0 4px 14px rgba(0,0,0,.25)';
  bar.innerHTML =
    '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:space-between">' +
      '<div style="flex:1;min-width:200px"><b>🔔 نسخه‌ی جدیدی از «' + name + '» آماده‌ست</b>' +
      '<div style="opacity:.8;font-size:11.5px">برای دریافت امکانات جدید و رفع مشکلات، آپدیت را نصب کنید.</div></div>' +
      '<div style="display:flex;gap:8px;align-items:center">' +
        '<a id="appUpdateLink" href="' + url + '"' + (inApp ? '' : ' target="_blank" rel="noopener"') +
        ' style="background:#D79A2C;color:#1c2738;font-weight:800;text-decoration:none;border-radius:20px;padding:8px 16px">دانلود و نصب</a>' +
        '<button type="button" id="appUpdateLater" style="background:transparent;border:1px solid rgba(255,255,255,.4);color:#fff;border-radius:20px;padding:7px 12px;cursor:pointer;font-family:inherit;font-size:12px">بعداً</button>' +
      '</div>' +
    '</div>' +
    '<div style="opacity:.65;font-size:11px;margin-top:4px">اگر دانلود شروع نشد، آدرس karvfan.ir را در مرورگر باز کنید.</div>';
  bar.querySelector('#appUpdateLater').addEventListener('click', () => {
    try { localStorage.setItem('kf_update_snooze_' + label, JSON.stringify({ v: latest, t: Date.now() })); } catch (e) {}
    bar.remove();
  });
  document.body.prepend(bar);
}
