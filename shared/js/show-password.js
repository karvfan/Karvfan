/**
 * show-password.js — دکمه‌ی «چشم» برای نمایش/مخفی‌کردن رمز، روی همه‌ی input[type=password]
 * صفحه به‌صورت خودکار اجرا می‌شه؛ نیازی به فراخوانی دستی نیست.
 */
(function(){
  function wrapField(input){
    if(input.dataset.pwWrapped) return;
    input.dataset.pwWrapped = '1';
    const wrap = document.createElement('div');
    wrap.className = 'pw-toggle-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pw-toggle-btn';
    btn.textContent = '👁️';
    btn.setAttribute('aria-label', 'نمایش رمز');
    btn.addEventListener('click', ()=>{
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      btn.textContent = showing ? '👁️' : '🙈';
    });
    wrap.appendChild(btn);
  }
  function scan(){
    document.querySelectorAll('input[type="password"]').forEach(wrapField);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', scan);
  else scan();
  // برای فیلدهایی که بعداً و پویا به صفحه اضافه می‌شن (مثلاً مودال‌ها)
  new MutationObserver(scan).observe(document.body, { childList:true, subtree:true });
})();
