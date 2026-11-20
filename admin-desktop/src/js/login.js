/**
 * login.js — منطق مشترک ورود برای هر سه صفحه‌ی ورود.
 * initLogin(allowedRoles) را با آرایه‌ای از نقش‌های مجاز برای آن صفحه صدا می‌زنیم؛
 * بعد از ورود موفق، نقش واقعی کاربر از دیتابیس خوانده و با allowedRoles چک می‌شود.
 */

/* ارقام فارسی/عربی → لاتین (همان رفتار shared/js/utils.js در وب‌اپ معلم) */
function toLatinDigits(s){
  return String(s||'')
    .replace(/[۰-۹]/g, d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
}

// ورودی ایمیل یا کد ملی رو به ایمیل واقعی تبدیل می‌کنه (کد ملی از دیتابیس جست‌وجو می‌شه).
// کیبورد فارسی ارقام رو به‌صورت ۰-۹ (فارسی) می‌نویسه و گاهی کاراکترهای نامرئی (نیم‌فاصله/RLM) اضافه می‌کنه؛
// قبلاً فقط ارقام لاتین قبول می‌شد و کد ملیِ فارسی‌نویسی‌شده هیچ‌وقت پیدا نمی‌شد
// (در نتیجه «ایمیل/کد ملی یا رمز عبور اشتباه است»).
async function resolveLoginIdentifier(input){
  input = String(input||'').replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g,'').trim();
  if(input.includes('@')) return input.toLowerCase();
  const code = toLatinDigits(input);
  if(/^\d{10}$/.test(code)){
    const { data, error } = await sb.rpc('resolve_national_code_email', { p_national_code: code });
    if(error) console.error('resolve_national_code_email:', error);
    return data || code; // اگه پیدا نشد، همون کد رو برمی‌گردونیم تا پیام درست نشون داده بشه
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
    btn.disabled = true; btn.textContent = 'در حال ورود...';
    try{
      const email = await resolveLoginIdentifier(raw);
      /* ورودی نه ایمیل معتبره نه کد ملیِ پیداشده: به‌جای «رمز اشتباه» پیام درست نشون بده */
      if(!email.includes('@')){
        errEl.textContent = /^\d{10}$/.test(toLatinDigits(raw))
          ? 'این کد ملی در سامانه پیدا نشد — با ایمیل وارد شوید یا کد ملی را بررسی کنید'
          : 'ایمیل معتبر نیست — علامت @ را فراموش نکرده‌اید؟ (مثال: name@gmail.com)';
        return;
      }
      const { error: authErr } = await sb.auth.signInWithPassword({ email, password: pass });
      if(authErr){
        /* ایمیل هنوز تأیید نشده: به‌جای «رمز اشتباه» پیام درست نشون بده */
        if(/not confirmed|email_not_confirmed/i.test(String(authErr.message||'') + ' ' + String(authErr.code||''))){
          errEl.textContent = 'ایمیل شما هنوز تأیید نشده — ایمیل «تأیید ایمیل شما در کارفن» رو باز کنید و روی دکمه‌ی تأیید بزنید (پوشه‌ی اسپم رو هم ببینید).';
        }else{
          errEl.textContent = 'ایمیل/کد ملی یا رمز عبور اشتباه است';
        }
        return;
      }

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
