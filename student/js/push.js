/**
 * push.js — ثبت دستگاه دانش‌آموز برای دریافت نوتیفیکیشن (FCM) در اپ اندروید.
 * فقط داخل اپ Capacitor کار می‌کنه؛ در نسخه‌ی وب هیچ کاری نمی‌کنه.
 * بعد از ورود دانش‌آموز، از main.js صدا زده می‌شه.
 */

const KF_PUSH_CHANNEL = 'karvfan-default';

async function initStudentPush(){
  try{
    const cap = window.Capacitor;
    if(!cap || !cap.isNativePlatform || !cap.isNativePlatform()) return;
    const Push = cap.Plugins && cap.Plugins.PushNotifications;
    if(!Push || typeof student === 'undefined' || !student || !student.id) return;
    if(window.__kfPushStudentId === student.id) return;
    window.__kfPushStudentId = student.id;

    let perm = await Push.checkPermissions();
    if(perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale'){
      perm = await Push.requestPermissions();
    }
    if(perm.receive !== 'granted') return;

    try{
      await Push.createChannel({ id: KF_PUSH_CHANNEL, name: 'اطلاعیه‌ها و تکالیف', description: 'خبر و تکلیف جدید مربی', importance: 4, visibility: 1 });
    }catch(e){ /* روی نسخه‌های قدیمی اندروید کانال وجود نداره */ }

    await Push.removeAllListeners();
    await Push.addListener('registration', async (token)=>{
      const { error } = await sb.rpc('register_device_token', { p_student_id: student.id, p_token: token.value, p_platform: 'android' });
      if(error) console.error('ثبت توکن نوتیفیکیشن ناموفق بود:', error);
    });
    await Push.addListener('registrationError', (err)=>{ console.error('خطا در ثبت FCM:', err); });
    await Push.addListener('pushNotificationReceived', (n)=>{
      showToast((n.title || '') + (n.body ? ' — ' + n.body : ''));
    });
    await Push.addListener('pushNotificationActionPerformed', (action)=>{
      const data = (action.notification && action.notification.data) || {};
      if(data.tab === 'announcements') switchStudentTab('pAnn');
      else if(data.tab === 'assignments') switchStudentTab('pAssign');
    });
    await Push.register();
  }catch(e){
    console.error('خطا در راه‌اندازی نوتیفیکیشن:', e);
  }
}
