/**
 * register-school.js — ثبت‌نام مدیر مدرسه مستقیم از صفحه‌ی ورود پنل مدیریت دسکتاپ.
 * همان منطق ثبت‌نام وب‌اپ مربی (teacher/js/register.js) را دارد، ولی نقش ثابت «مدیر مدرسه» است.
 * بعد از ثبت‌نام: تأیید ایمیل → درخواست عضویت برای ادمین شهرستان/استان/سوپرادمین ارسال می‌شود
 * (بخش «درخواست‌های عضویت» در پنل) → بعد از تأیید، مدیر با همین صفحه وارد می‌شود.
 */

// آدرس وبی که لینک تأیید ایمیل بعد از کلیک به آن برمی‌گردد (اپ دسکتاپ آدرس http ندارد)
const REG_EMAIL_REDIRECT = 'https://karvfan.hodaahmadi898.workers.dev/teacher/';

let _regRegions = null;
let _regWired = false;

function regEl(id){ return document.getElementById(id); }
function regEsc(s){ return (s==null?'':String(s)).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

// تبدیل ارقام فارسی/عربی به انگلیسی
function regNormalizeDigits(s){
  return (s||'')
    .replace(/[۰-۹]/g, d=> String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, d=> String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

// اعتبارسنجی استاندارد کد ملی ایران
function regIsValidNationalCode(code){
  if(!/^\d{10}$/.test(code)) return false;
  if(/^(\d)\1{9}$/.test(code)) return false;
  const check = Number(code[9]);
  let sum = 0;
  for(let i=0;i<9;i++) sum += Number(code[i]) * (10 - i);
  const r = sum % 11;
  return r < 2 ? check === r : check === 11 - r;
}

function switchAuthTab(which){
  regEl('tabLogin').classList.toggle('active', which==='login');
  regEl('tabRegister').classList.toggle('active', which==='register');
  regEl('loginPane').classList.toggle('hidden', which!=='login');
  regEl('registerPane').classList.toggle('hidden', which!=='register');
  if(which==='register') initRegisterForm();
}

async function initRegisterForm(){
  if(!_regRegions){
    const [{ data: provs }, { data: counties }] = await Promise.all([
      sb.from('provinces').select('*').order('name'),
      sb.from('counties').select('*').order('name')
    ]);
    _regRegions = { provinces: provs || [], counties: counties || [] };
    regEl('regProvince').innerHTML = '<option value="">— انتخاب کنید —</option>' +
      _regRegions.provinces.map(p=>`<option value="${p.id}">${regEsc(p.name)}</option>`).join('');
  }
  if(_regWired) return; _regWired = true;

  regEl('regProvince').addEventListener('change', ()=>{
    const pid = regEl('regProvince').value;
    regEl('regCounty').innerHTML = '<option value="">— انتخاب کنید —</option>' +
      _regRegions.counties.filter(c=> String(c.province_id)===String(pid))
        .map(c=>`<option value="${c.id}">${regEsc(c.name)}</option>`).join('');
    regEl('regSchool').innerHTML = '<option value="">— ابتدا شهرستان را انتخاب کنید —</option>';
  });
  regEl('regCounty').addEventListener('change', fillRegSchools);
  regEl('registerForm').addEventListener('submit', submitSchoolAdminRegister);
}

async function fillRegSchools(){
  const sel = regEl('regSchool');
  const countyId = regEl('regCounty').value;
  if(!countyId){ sel.innerHTML = '<option value="">— ابتدا شهرستان را انتخاب کنید —</option>'; return; }
  const { data } = await sb.from('schools').select('id,name').eq('county_id', countyId).eq('status','approved').order('name');
  sel.innerHTML = (data && data.length)
    ? '<option value="">— انتخاب کنید —</option>' + data.map(s=>`<option value="${s.id}">${regEsc(s.name)}</option>`).join('')
    : '<option value="">— مدرسه‌ای در این شهرستان تأیید نشده —</option>';
}

async function submitSchoolAdminRegister(e){
  e.preventDefault();
  const errEl = regEl('regErr'); errEl.textContent = '';
  const full_name = regEl('regName').value.trim();
  const national_code = regNormalizeDigits(regEl('regCode').value.trim());
  const email = regEl('regEmail').value.trim();
  const pass = regEl('regPass').value;
  const pass2 = regEl('regPass2').value;
  const schoolId = regEl('regSchool').value;

  if(!full_name || full_name.length < 3){ errEl.textContent = 'نام و نام‌خانوادگی را کامل بنویسید'; return; }
  if(!regIsValidNationalCode(national_code)){ errEl.textContent = 'کد ملی معتبر نیست'; return; }
  if(!email || !email.includes('@')){ errEl.textContent = 'یک ایمیل معتبر وارد کنید'; return; }
  if(!pass || pass.length < 6){ errEl.textContent = 'رمز باید حداقل ۶ کاراکتر باشد'; return; }
  if(pass !== pass2){ errEl.textContent = 'دو رمز یکی نیستند'; return; }
  if(!regEl('regProvince').value){ errEl.textContent = 'استان را انتخاب کنید'; return; }
  if(!regEl('regCounty').value){ errEl.textContent = 'شهرستان را انتخاب کنید'; return; }
  if(!schoolId){ errEl.textContent = 'مدرسه را انتخاب کنید'; return; }

  const btn = regEl('regBtn');
  btn.disabled = true; btn.textContent = 'در حال ثبت‌نام...';
  try{
    const { error } = await sb.auth.signUp({
      email, password: pass,
      options: {
        emailRedirectTo: REG_EMAIL_REDIRECT,
        data: {
          pending_role_request: 'true',
          full_name, national_code,
          requested_role: 'school_admin',
          school_id: String(schoolId),
          county_id: '',
          province_id: ''
        }
      }
    });
    if(error){ errEl.textContent = 'خطا: ' + error.message; return; }
    regEl('registerPane').innerHTML =
      '<div class="pattern-card" style="text-align:center;padding:24px;line-height:2">✅ ثبت‌نام انجام شد!<br>' +
      'یک ایمیل تأیید به <b>' + regEsc(email) + '</b> ارسال شد. ایمیل را با مرورگر (نه این برنامه) باز کنید و روی لینک آن بزنید.<br>' +
      'بعد از تأیید ایمیل، درخواست شما برای تأیید به ادمین شهرستان/استان می‌رود. ' +
      'پس از تأیید، با ایمیل یا کد ملی و رمزتان از همین صفحه وارد شوید.</div>';
  }catch(err){
    console.error(err);
    errEl.textContent = 'خطا در اتصال به سرور';
  }finally{
    btn.disabled = false; btn.textContent = 'ثبت‌نام مدیر مدرسه';
  }
}
