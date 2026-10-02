/**
 * main.js — نقطه‌ی شروع اپ معلم/ادمین. باید همیشه آخرین اسکریپت بارگذاری‌شده باشد.
 */

function withTimeout(promise, ms){
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);
}

/* فقط کاربرِ دارای رکورد staff (یعنی درخواستش توسط سطح بالاتر تأیید شده) وارد پنل می‌شه.
   قبلاً «بدون رکورد» به معنی دسترسی کامل بود؛ یعنی هرکسی که ثبت‌نام می‌کرد و ایمیلش رو
   تأیید می‌کرد، بدون تأیید ادمین وارد می‌شد. */
const _enterTeacherAppOrig = enterTeacherApp;
enterTeacherApp = async function(){
  const { data:{ session } } = await sb.auth.getSession();
  if(!session) return;
  const { data: st, error } = await sb.from('staff').select('id').eq('id', session.user.id).maybeSingle();
  if(error){
    console.error('خطا در بررسی دسترسی:', error);
    goTo('teacherAuth');
    const el = $('taErr'); if(el) el.textContent = 'خطا در بررسی دسترسی — دوباره تلاش کنید';
    return;
  }
  if(!st){
    let msg = '⏳ حساب شما هنوز تأیید نشده — بعد از تأیید توسط سطح بالاتر می‌تونید وارد بشید.';
    try{
      const { data: rq } = await sb.rpc('my_role_request');
      const q = rq && rq[0];
      if(q && q.status === 'rejected'){
        msg = '❌ درخواست عضویت شما رد شد' + (q.reject_reason ? ': ' + q.reject_reason : '') + ' — با ادمین بالادستی تماس بگیرید.';
      } else if(!q){
        msg = 'برای این حساب درخواست عضویتی ثبت نشده — اگه ثبت‌نام کردید، اول لینک تأیید ایمیل رو باز کنید.';
      }
    }catch(e){ console.error(e); }
    await sb.auth.signOut();
    goTo('teacherAuth');
    const el = $('taErr'); if(el) el.textContent = msg;
    return;
  }
  return _enterTeacherAppOrig();
};

(async function init(){
  if(!isConfigured){ $('setupNotice').classList.remove('hidden'); return; }
  try{
    const { data:{ session } } = await withTimeout(sb.auth.getSession(), 8000);
    if(session){ await enterTeacherApp(); return; }
  }catch(e){
    console.error('خطا در اتصال به سرور، ورود به صفحه‌ی ورود:', e);
  }
  goTo('teacherAuth');
  initBioLoginUI('teacher', 'taBioRow', 'taBioRemember');
})();
sb && sb.auth.onAuthStateChange((event)=>{ if(event==='SIGNED_OUT') goTo('teacherAuth'); });
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{ navigator.serviceWorker.register('sw.js').catch(()=>{}); });
}
