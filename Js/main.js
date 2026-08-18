/**
 * main.js — نقطه‌ی شروع برنامه. باید همیشه آخرین اسکریپت بارگذاری‌شده باشد.
 */

(async function init(){
  if(!isConfigured){ $('setupNotice').classList.remove('hidden'); return; }
  // دانش‌آموز از قبل واردشده؟
  const saved = localStorage.getItem('kf_student');
  if(saved){
    try{
      const parsed = JSON.parse(saved);
      const { data, error } = await sb.rpc('get_student_profile', { p_student_id: parsed.id });
      if(!error && data && data[0]){ student = data[0]; localStorage.setItem('kf_student', JSON.stringify(student)); await enterStudentApp(); return; }
    }catch(e){}
  }
  // مربی از قبل واردشده؟
  const { data:{ session } } = await sb.auth.getSession();
  if(session){ await enterTeacherApp(); return; }
  goTo('gate');
})();
sb && sb.auth.onAuthStateChange((event)=>{ if(event==='SIGNED_OUT') goTo('gate'); });
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{ navigator.serviceWorker.register('sw.js').catch(()=>{}); });
}
