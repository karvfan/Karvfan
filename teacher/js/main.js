/**
 * main.js — نقطه‌ی شروع اپ معلم/ادمین. باید همیشه آخرین اسکریپت بارگذاری‌شده باشد.
 */

function withTimeout(promise, ms){
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);
}

(async function init(){
  if(!isConfigured){ $('setupNotice').classList.remove('hidden'); return; }
  try{
    const { data:{ session } } = await withTimeout(sb.auth.getSession(), 8000);
    if(session){ await enterTeacherApp(); return; }
  }catch(e){
    console.error('خطا در اتصال به سرور، ورود به صفحه‌ی ورود:', e);
  }
  goTo('teacherAuth');
})();
sb && sb.auth.onAuthStateChange((event)=>{ if(event==='SIGNED_OUT') goTo('teacherAuth'); });
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{ navigator.serviceWorker.register('sw.js').catch(()=>{}); });
}
