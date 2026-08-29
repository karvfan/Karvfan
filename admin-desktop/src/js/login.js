/**
 * login.js — منطق مشترک ورود برای هر سه صفحه‌ی ورود.
 * initLogin(allowedRoles) را با آرایه‌ای از نقش‌های مجاز برای آن صفحه صدا می‌زنیم؛
 * بعد از ورود موفق، نقش واقعی کاربر از دیتابیس خوانده و با allowedRoles چک می‌شود.
 */
// ورودی ایمیل یا کد ملی رو به شناسه‌ی قابل‌استفاده برای Supabase Auth تبدیل می‌کنه
// ورودی ایمیل یا کد ملی رو به ایمیل واقعی تبدیل می‌کنه (کد ملی از دیتابیس جست‌وجو می‌شه)
async function resolveLoginIdentifier(input){
  input = (input||'').trim();
  if(input.includes('@')) return input;
  if(/^\d{10}$/.test(input)){
    const { data } = await sb.rpc('resolve_national_code_email', { p_national_code: input });
    return data || input;
  }
  return input;
}

function initLogin(allowedRoles, bioVault){
  const form = document.getElementById('loginForm');
  const errEl = document.getElementById('loginErr');
  const btn = document.getElementById('loginBtn');

  if(bioVault && document.getElementById('bioRow')){
    initBioLoginUI(bioVault, 'bioRow', 'bioRemember');
  }

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    errEl.textContent = '';
    const raw = document.getElementById('email').value.trim();
    const pass = document.getElementById('pass').value;
    if(!raw || !pass){ errEl.textContent = 'ایمیل یا کد ملی، و رمز عبور را وارد کنید'; return; }
    const email = await resolveLoginIdentifier(raw);
    btn.disabled = true; btn.textContent = 'در حال ورود...';
    try{
      const { error: authErr } = await sb.auth.signInWithPassword({ email, password: pass });
      if(authErr){ errEl.textContent = 'ایمیل/کد ملی یا رمز عبور اشتباه است'; return; }

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
      if(bioVault){
        const chk = document.getElementById('bioRememberChk');
        if(chk && chk.checked){
          try{ await bioRegister(bioVault, raw, { email: raw, pass }); }
          catch(bioErr){ console.error('بیومتریک ثبت نشد', bioErr); }
        }
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
async function adminBioLogin(bioVault){
  const errEl = document.getElementById('loginErr');
  try{
    const secret = await bioVerifyAndLoad(bioVault);
    if(!secret) return;
    document.getElementById('email').value = secret.email;
    document.getElementById('pass').value = secret.pass;
    document.getElementById('loginForm').requestSubmit();
  }catch(e){
    console.error(e);
    if(errEl) errEl.textContent = 'تأیید اثر انگشت انجام نشد — با ایمیل و رمز وارد شو';
  }
}
function adminBioForget(bioVault){
  bioForget(bioVault);
  document.getElementById('bioRow').classList.add('hidden');
  document.getElementById('bioRemember').classList.remove('hidden');
}

async function forgotPasswordDesktop(){
  const raw = prompt('ایمیل یا کد ملی حسابتون رو وارد کنید:');
  if(!raw || !raw.trim()) return;
  const identifier = await resolveLoginIdentifier(raw.trim());
  if(!identifier.includes('@')){
    alert('کد ملی وارد شده در سامانه پیدا نشد.');
    return;
  }
  const { error } = await sb.auth.resetPasswordForEmail(identifier, {
    redirectTo: 'https://karvfan.hodaahmadi898.workers.dev/teacher/reset-password.html'
  });
  if(error){ alert('خطا: ' + error.message); return; }
  alert('اگه این ایمیل ثبت باشه، لینک تغییر رمز ارسال شد. ایمیل رو با مرورگر (نه این برنامه) باز کنید تا رمز جدید تنظیم بشه.');
}
