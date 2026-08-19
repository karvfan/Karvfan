/**
 * main.js — نقطه‌ی شروع برنامه. باید همیشه آخرین اسکریپت بارگذاری‌شده باشد.
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
    // دانش‌آموز از قبل واردشده؟
    const saved = localStorage.getItem('kf_student');
    if(saved){
      try{
        const parsed = JSON.parse(saved);
        const { data, error } = await withTimeout(sb.rpc('get_student_profile', { p_student_id: parsed.id }), 8000);
        if(!error && data && data[0]){ student = data[0]; localStorage.setItem('kf_student', JSON.stringify(student)); await enterStudentApp(); return; }
      }catch(e){ console.error('خطا در بازیابی دانش‌آموز:', e); }
    }
    // مربی از قبل واردشده؟
    const { data:{ session } } = await withTimeout(sb.auth.getSession(), 8000);
    if(session){ await enterTeacherApp(); return; }
  }catch(e){
    console.error('خطا در اتصال به سرور، ورود به صفحه‌ی ورود:', e);
  }
  goTo('gate');
})();
sb && sb.auth.onAuthStateChange((event)=>{ if(event==='SIGNED_OUT') goTo('gate'); });
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{ navigator.serviceWorker.register('sw.js').catch(()=>{}); });
}
