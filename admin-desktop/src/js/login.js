/**
 * login.js — منطق مشترک ورود برای هر سه صفحه‌ی ورود.
 * initLogin(allowedRoles) را با آرایه‌ای از نقش‌های مجاز برای آن صفحه صدا می‌زنیم؛
 * بعد از ورود موفق، نقش واقعی کاربر از دیتابیس خوانده و با allowedRoles چک می‌شود.
 */
function initLogin(allowedRoles){
  const form = document.getElementById('loginForm');
  const errEl = document.getElementById('loginErr');
  const btn = document.getElementById('loginBtn');

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    errEl.textContent = '';
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('pass').value;
    if(!email || !pass){ errEl.textContent = 'ایمیل و رمز عبور را وارد کنید'; return; }
    btn.disabled = true; btn.textContent = 'در حال ورود...';
    try{
      const { error: authErr } = await sb.auth.signInWithPassword({ email, password: pass });
      if(authErr){ errEl.textContent = 'ایمیل یا رمز عبور اشتباه است'; return; }

      const { data: scopeRows, error: scopeErr } = await sb.rpc('my_scope');
      if(scopeErr || !scopeRows || !scopeRows.length){
        errEl.textContent = 'خطا در دریافت اطلاعات دسترسی';
        await sb.auth.signOut();
        return;
      }
      const myRole = scopeRows[0].role;
      if(!allowedRoles.includes(myRole)){
        errEl.textContent = 'این حساب سطح دسترسی لازم برای این بخش را ندارد (نقش شما: ' + (ROLE_LABELS[myRole]||myRole) + ')';
        await sb.auth.signOut();
        return;
      }
      window.location.href = 'dashboard.html';
    }catch(err){
      console.error(err);
      errEl.textContent = 'خطا در اتصال به سرور';
    }finally{
      btn.disabled = false; btn.textContent = 'ورود';
    }
  });
}

async function forgotPasswordDesktop(){
  const email = prompt('ایمیل حسابتون رو وارد کنید:');
  if(!email || !email.trim()) return;
  const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: 'https://karvfan.hodaahmadi898.workers.dev/teacher/reset-password.html'
  });
  if(error){ alert('خطا: ' + error.message); return; }
  alert('اگه این ایمیل ثبت باشه، لینک تغییر رمز ارسال شد. ایمیل رو با مرورگر (نه این برنامه) باز کنید تا رمز جدید تنظیم بشه.');
}
