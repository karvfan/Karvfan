/**
 * auth.js — ورود/خروج مربی و ادمین‌ها (مدیر مدرسه / شهرستان / استان / سوپرادمین)
 * همه از یک فرم ورود (ایمیل+رمز از Supabase Auth) استفاده می‌کنند؛
 * سطح دسترسی بعد از ورود از روی نقش کاربر در دیتابیس مشخص می‌شود.
 */

async function teacherLogin(){
  const raw = $('taEmail').value.trim(), pass = $('taPass').value;
  $('taErr').textContent='';
  if(!raw || !pass){ $('taErr').textContent='ایمیل یا کد ملی، و رمز را وارد کنید'; return; }
  const email = await resolveLoginIdentifier(raw);
  $('taBtn').disabled=true; $('taBtn').innerHTML='<span class="spinner"></span> در حال ورود...';
  const { error } = await sb.auth.signInWithPassword({ email, password: pass });
  $('taBtn').disabled=false; $('taBtn').textContent='ورود';
  if(error){ $('taErr').textContent='ایمیل/کد ملی یا رمز عبور اشتباه است'; return; }
  if($('taBioRememberChk') && $('taBioRememberChk').checked){
    try{ await bioRegister('teacher', raw, { email: raw, pass }); }
    catch(e){ console.error('بیومتریک ثبت نشد', e); }
  }
  await enterTeacherApp();
}
async function teacherBioLogin(){
  try{
    const secret = await bioVerifyAndLoad('teacher');
    if(!secret){ return; }
    $('taEmail').value = secret.email;
    $('taPass').value = secret.pass;
    await teacherLogin();
  }catch(e){
    console.error(e);
    $('taErr').textContent = 'تأیید اثر انگشت انجام نشد — با ایمیل و رمز وارد شو';
  }
}
function teacherBioForget(){
  bioForget('teacher');
  $('taBioRow').classList.add('hidden');
  $('taBioRemember').classList.remove('hidden');
}
async function teacherLogout(){ await sb.auth.signOut(); goTo('teacherAuth'); }

async function forgotPassword(){
  const raw = prompt('ایمیل یا کد ملی حسابتون رو وارد کنید:');
  if(!raw || !raw.trim()) return;
  const identifier = await resolveLoginIdentifier(raw.trim());
  if(!identifier.includes('@')){
    alert('کد ملی وارد شده در سامانه پیدا نشد.');
    return;
  }
  const { error } = await sb.auth.resetPasswordForEmail(identifier, {
    redirectTo: window.location.origin + window.location.pathname.replace('index.html','') + 'reset-password.html'
  });
  if(error){ alert('خطا: ' + error.message); return; }
  alert('اگه این ایمیل توی سامانه ثبت باشه، یه لینک تغییر رمز براش ارسال شد — ایمیلتون رو چک کنید.');
}
