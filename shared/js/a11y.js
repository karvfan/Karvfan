/**
 * a11y.js — ابزار دسترس‌پذیری پایه: بزرگ‌نمایی فونت و کنتراست بالا.
 * یک دکمه‌ی شناور کوچک در گوشه‌ی صفحه اضافه می‌کند؛ تنظیمات در localStorage ذخیره می‌شود.
 */
(function(){
  function apply(){
    document.documentElement.classList.toggle('a11y-large', localStorage.getItem('kf_a11y_large')==='1');
    document.documentElement.classList.toggle('a11y-contrast', localStorage.getItem('kf_a11y_contrast')==='1');
  }
  function toggle(key){
    localStorage.setItem(key, localStorage.getItem(key)==='1' ? '0' : '1');
    apply();
  }
  function init(){
    apply();
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
    btn.addEventListener('click', ()=> panel.classList.toggle('hidden'));
    panel.addEventListener('click', (e)=>{
      const k = e.target && e.target.dataset && e.target.dataset.k;
      if(k) toggle(k);
    });
    document.body.appendChild(btn);
    document.body.appendChild(panel);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
