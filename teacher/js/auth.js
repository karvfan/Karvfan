/**
 * auth.js — ورود/خروج مربی و ادمین‌ها (مدیر مدرسه / شهرستان / استان / سوپرادمین)
 * همه از یک فرم ورود (ایمیل+رمز از Supabase Auth) استفاده می‌کنند؛
 * سطح دسترسی بعد از ورود از روی نقش کاربر در دیتابیس مشخص می‌شود.
 */

async function teacherLogin(){
  const email = $('taEmail').value.trim(), pass = $('taPass').value;
  $('taErr').textContent='';
  if(!email || !pass){ $('taErr').textContent='ایمیل و رمز را وارد کنید'; return; }
  $('taBtn').disabled=true; $('taBtn').innerHTML='<span class="spinner"></span> در حال ورود...';
  const { error } = await sb.auth.signInWithPassword({ email, password: pass });
  $('taBtn').disabled=false; $('taBtn').textContent='ورود';
  if(error){ $('taErr').textContent='ایمیل یا رمز عبور اشتباه است'; return; }
  await enterTeacherApp();
}
async function teacherLogout(){ await sb.auth.signOut(); goTo('teacherAuth'); }
