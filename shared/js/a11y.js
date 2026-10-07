/**
 * a11y.js — ابزار دسترس‌پذیری پایه: بزرگ‌نمایی فونت و کنتراست بالا.
 *
 * دو حالت داره:
 *  - داخل اپ‌های دانش‌آموز و معلم (وقتی #pProfile یا #tMyInfo تو صفحه هست): دکمه‌ی شناور نداریم؛
 *    یه بخش «⚙️ تنظیمات نمایش» به انتهای پنل «پروفایل» (دانش‌آموز) و «حساب من» (مربی) اضافه می‌شه.
 *  - صفحه‌های عمومی (صفحه‌ی اصلی، درباره‌ی ما): همون دکمه‌ی شناور کوچک Aa.
 * تنظیمات در localStorage ذخیره می‌شه و روی همه‌ی صفحه‌ها اعمال می‌شه.
 */
(function(){
  const KEYS = [
    ['kf_a11y_large', '🔠 بزرگ‌نمایی متن'],
    ['kf_a11y_contrast', '◐ کنتراست بالا']
  ];
  const HOST_IDS = ['pProfile', 'tMyInfo'];

  function isOn(key){
    try{ return localStorage.getItem(key)==='1'; }catch(e){ return false; }
  }
  function apply(){
    document.documentElement.classList.toggle('a11y-large', isOn('kf_a11y_large'));
    document.documentElement.classList.toggle('a11y-contrast', isOn('kf_a11y_contrast'));
  }
  function toggle(key){
    try{ localStorage.setItem(key, isOn(key) ? '0' : '1'); }catch(e){}
    apply();
    refreshCards();
  }

  /* ---------- بخش داخل پنل تنظیمات/حساب ---------- */
  function cardInner(){
    return KEYS.map(function(kv){
      const on = isOn(kv[0]);
      return '<div class="student-row"><span>'+kv[1]+'</span>'+
        '<button type="button" class="btn btn-sm '+(on?'btn-thread':'btn-ghost')+'" data-a11y-k="'+kv[0]+'">'+(on?'روشن':'خاموش')+'</button></div>';
    }).join('');
  }
  function cardHtml(){
    return '<div class="sec-title">⚙️ تنظیمات نمایش</div><div class="pattern-card kf-a11y-card">'+cardInner()+'</div>';
  }
  function refreshCards(){
    document.querySelectorAll('.kf-a11y-card').forEach(function(c){ c.innerHTML = cardInner(); });
  }
  function mountInto(host){
    if(host.querySelector('.kf-a11y-card')) return;      // قبلاً اضافه شده
    if(!host.querySelector('.pattern-card')) return;     // هنوز در حال بارگذاری‌ه
    host.insertAdjacentHTML('beforeend', cardHtml());
  }
  function initInline(hosts){
    document.addEventListener('click', function(e){
      const b = e.target && e.target.closest && e.target.closest('[data-a11y-k]');
      if(b) toggle(b.dataset.a11yK);
    });
    hosts.forEach(function(h){
      new MutationObserver(function(){ mountInto(h); }).observe(h, { childList: true });
      mountInto(h);
    });
  }

  /* ---------- دکمه‌ی شناور (صفحه‌های عمومی) ---------- */
  function initFloating(){
    const btn = document.createElement('button');
    btn.id = 'a11yBtn';
    btn.setAttribute('aria-label', 'تنظیمات دسترس‌پذیری');
    btn.textContent = 'Aa';
    const panel = document.createElement('div');
    panel.id = 'a11yPanel';
    panel.className = 'hidden';
    panel.innerHTML =
      '<button type="button" data-k="kf_a11y_large">🔠 بزرگ‌نمایی متن</button>' +
      '<button type="button" data-k="kf_a11y_contrast">◐ کنتراست بالا</button>';
    btn.addEventListener('click', function(){ panel.classList.toggle('hidden'); });
    panel.addEventListener('click', function(e){
      const k = e.target && e.target.dataset && e.target.dataset.k;
      if(k) toggle(k);
    });
    document.body.appendChild(btn);
    document.body.appendChild(panel);
  }

  function init(){
    apply();
    const hosts = HOST_IDS.map(function(id){ return document.getElementById(id); }).filter(Boolean);
    if(hosts.length) initInline(hosts);
    else initFloating();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
