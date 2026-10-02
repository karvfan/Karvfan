/**
 * register.js — ثبت‌نام خودکار معلم تا سوپرادمین با تأیید ایمیل واقعی و سپس تأیید سطح بالاتر.
 * معلم می‌تونه چند مدرسه انتخاب کنه (school_ids)؛ مدیر مدرسه فقط یک مدرسه.
 */
function switchTeacherAuthTab(which){
  $('taTabLogin').classList.toggle('active', which==='login');
  $('taTabReg').classList.toggle('active', which==='register');
  $('taLoginForm').classList.toggle('hidden', which!=='login');
  $('taRegForm').classList.toggle('hidden', which!=='register');
  if(which==='register') initStaffRegisterForm();
}

let _trWired = false;
let _trSchools = [];          // مدرسه‌های تأییدشده‌ی شهرستان انتخاب‌شده
const _trPicked = new Set();  // شناسه‌ی مدرسه‌های انتخاب‌شده توسط معلم

/* آدرس سایت واقعی برای لینک تأیید ایمیل.
   قبلاً SITE_ORIGIN هیچ‌جا تعریف نشده بود و ReferenceError می‌داد؛ چون داخل try/catch بود،
   به‌اشتباه به‌صورت «اتصال به سرور برقرار نشد» نمایش داده می‌شد. */
const TR_FALLBACK_SITE_ORIGIN = 'https://karvfan.ir';
function getSiteOrigin(){
  return (typeof SITE_ORIGIN !== 'undefined' && SITE_ORIGIN) ? SITE_ORIGIN : TR_FALLBACK_SITE_ORIGIN;
}

/* ---------- نمایش خطا دقیقاً زیر خودِ فیلد ---------- */
const _trErrFields = new Set();   // شناسه‌ی فیلدهایی که الان خطا دارن
/* anchorId: عنصری که پیام زیرش میاد — borderId: عنصری که قرمز می‌شه (پیش‌فرض همون anchor) */
function trFieldErr(anchorId, msg, borderId){
  const el = $(anchorId); if(!el) return null;
  let box = $('trErr_'+anchorId);
  if(!box){
    box = document.createElement('div');
    box.id = 'trErr_'+anchorId;
    box.className = 'tr-field-err';
    box.setAttribute('role','alert');
    box.style.cssText = 'color:#b3261e;font-size:12.5px;margin-top:4px;line-height:1.7';
    el.insertAdjacentElement('afterend', box);
  }
  box.textContent = msg;
  const b = $(borderId || anchorId);
  if(b){ b.style.borderColor = '#b3261e'; b.setAttribute('aria-invalid','true'); }
  box.dataset.border = borderId || anchorId;
  _trErrFields.add(anchorId);
  return el;
}
function trClearFieldErr(anchorId){
  const box = $('trErr_'+anchorId);
  if(box){
    const b = $(box.dataset.border || anchorId);
    if(b){ b.style.borderColor = ''; b.removeAttribute('aria-invalid'); }
    box.remove();
  }
  _trErrFields.delete(anchorId);
}
function trClearAllErrors(){
  Array.from(_trErrFields).forEach(trClearFieldErr);
  const g = $('trErr'); if(g) g.textContent = '';
}
function trFocusFirst(el){
  if(!el) return;
  const target = (el.id==='trSchoolMulti') ? $('trSchoolFilter') : el;
  try{ el.scrollIntoView({ behavior:'smooth', block:'center' }); }catch(_){}
  try{ target && target.focus && target.focus({ preventScroll:true }); }catch(_){}
}
/* خطای سرور رو به فیلد مربوط نسبت بده؛ اگه فیلدی مشخص نبود، همون خطای عمومی پایین فرم */
function trMapServerError(message){
  const m = String(message||'');
  if(/already registered|already been registered|already exists|user_already_exists/i.test(m))
    return { field:'trEmail', text:'این ایمیل قبلاً ثبت‌نام شده؛ وارد شوید یا ایمیل دیگری بنویسید' };
  if(/password/i.test(m))
    return { field:'trPass', text:/least|short|weak|6/i.test(m) ? 'رمز باید حداقل ۶ کاراکتر باشه' : 'رمز پذیرفته نشد؛ رمز دیگری انتخاب کنید' };
  if(/rate limit|too many/i.test(m))
    return { field:null, text:'تعداد تلاش‌ها زیاد بوده؛ چند دقیقه بعد دوباره امتحان کنید' };
  if(/email/i.test(m) && /invalid|valid|format/i.test(m))
    return { field:'trEmail', text:'قالب ایمیل درست نیست' };
  if(/national|کد ملی/i.test(m))
    return { field:'trCode', text:'این کد ملی قبلاً ثبت شده یا معتبر نیست' };
  if(/personnel|کد پرسنلی/i.test(m))
    return { field:'trPersonnel', text:'این کد پرسنلی قبلاً ثبت شده یا معتبر نیست' };
  return { field:null, text:m };
}

/* یکسان‌سازی حروف عربی/فارسی برای جستجو */
function trNorm(s){
  return String(s||'').replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[\u064B-\u065F]/g,'').toLowerCase();
}

/* بخش انتخاب چندتایی مدرسه (فقط برای نقش معلم) — از داخل JS ساخته می‌شه */
function ensureTrSchoolMulti(){
  if($('trSchoolMulti')) return;
  const box = document.createElement('div');
  box.id = 'trSchoolMulti';
  box.className = 'hidden';
  box.innerHTML =
    '<input id="trSchoolFilter" type="text" placeholder="جستجوی مدرسه..." oninput="renderTrSchoolList()">' +
    '<div id="trSchoolList" style="max-height:220px;overflow:auto;border:1px solid #d7dde6;border-radius:10px;padding:6px;margin-top:6px"></div>' +
    '<div id="trSchoolCount" style="font-size:12.5px;margin-top:6px;color:var(--ink-soft)"></div>';
  $('trSchoolField').appendChild(box);
}
function updateTrSchoolCount(){
  const el = $('trSchoolCount'); if(!el) return;
  const n = _trPicked.size;
  el.textContent = n ? (n + ' مدرسه انتخاب شده') : 'هنوز مدرسه‌ای انتخاب نشده';
}
function renderTrSchoolList(){
  const list = $('trSchoolList'); if(!list) return;
  const q = trNorm(($('trSchoolFilter')||{}).value||'').trim();
  const items = _trSchools.filter(s=>!q || trNorm(s.name).includes(q));
  if(!_trSchools.length){
    list.innerHTML = '<div style="padding:8px;font-size:13px">— ابتدا شهرستان را انتخاب کنید —</div>';
  }else if(!items.length){
    list.innerHTML = '<div style="padding:8px;font-size:13px">مدرسه‌ای با این نام پیدا نشد</div>';
  }else{
    list.innerHTML = items.map(s=>
      '<label style="display:flex;align-items:center;gap:8px;padding:6px 4px;cursor:pointer">'+
      '<input type="checkbox" style="width:auto" value="'+s.id+'"'+(_trPicked.has(String(s.id))?' checked':'')+' onchange="onTrSchoolToggle(this)">'+
      '<span>'+esc(s.name)+'</span></label>'
    ).join('');
  }
  updateTrSchoolCount();
}
function onTrSchoolToggle(cb){
  if(cb.checked) _trPicked.add(String(cb.value)); else _trPicked.delete(String(cb.value));
  updateTrSchoolCount();
  trClearFieldErr('trSchoolMulti');
}

async function initStaffRegisterForm(){
  ensureTrSchoolMulti();
  const { provinces } = await loadRegionsCache();
  if(!$('trProvince').options.length){
    $('trProvince').innerHTML = provinceOptionsHtml(provinces);
  }
  if(_trWired) return; _trWired = true;
  $('trProvince').addEventListener('change', ()=>{
    $('trCounty').innerHTML = countyOptionsHtml(_regionsCache.counties, $('trProvince').value);
    $('trSchool').innerHTML = '<option value="">— ابتدا شهرستان را انتخاب کنید —</option>';
    _trSchools = []; _trPicked.clear(); renderTrSchoolList();
  });
  $('trCounty').addEventListener('change', fillTrSchoolOptions);
  /* با شروع اصلاح هر فیلد، خطای همون فیلد پاک می‌شه */
  ['trName','trCode','trPersonnel','trEmail','trPass','trPass2','trRole','trProvince','trCounty','trSchool'].forEach(id=>{
    const el = $(id); if(!el) return;
    el.addEventListener('input',  ()=>trClearFieldErr(id));
    el.addEventListener('change', ()=>trClearFieldErr(id));
  });
  onTrRoleChange();
}
async function fillTrSchoolOptions(){
  const countyId = $('trCounty').value;
  _trSchools = []; _trPicked.clear();
  if(!countyId){
    $('trSchool').innerHTML = '<option value="">— ابتدا شهرستان را انتخاب کنید —</option>';
    renderTrSchoolList();
    return;
  }
  const { data } = await sb.from('schools').select('id,name').eq('county_id', countyId).eq('status','approved').order('name');
  _trSchools = data || [];
  $('trSchool').innerHTML = _trSchools.length ? '<option value="">— انتخاب کنید —</option>' + _trSchools.map(s=>'<option value="'+s.id+'">'+esc(s.name)+'</option>').join('')
    : '<option value="">— مدرسه‌ای در این شهرستان تأیید نشده —</option>';
  renderTrSchoolList();
}
function onTrRoleChange(){
  ensureTrSchoolMulti();
  const role = $('trRole').value;
  const isTeacher = role==='teacher';
  $('trProvinceField').classList.toggle('hidden', role==='super_admin');
  $('trCountyField').classList.toggle('hidden', !['county_admin','school_admin','teacher'].includes(role));
  $('trSchoolField').classList.toggle('hidden', !['school_admin','teacher'].includes(role));
  /* معلم: چندانتخابی — مدیر مدرسه: تک‌انتخابی */
  $('trSchool').classList.toggle('hidden', isTeacher);
  $('trSchoolMulti').classList.toggle('hidden', !isTeacher);
  const lbl = $('trSchoolField').querySelector('label');
  if(lbl) lbl.textContent = isTeacher ? 'مدرسه‌ها (اگه در چند مدرسه تدریس می‌کنید، همه رو انتخاب کنید)' : 'مدرسه';
  /* خطاهای مربوط به فیلدهایی که با تغییر نقش مخفی می‌شن پاک بشن */
  ['trProvince','trCounty','trSchool','trSchoolMulti'].forEach(trClearFieldErr);
  renderTrSchoolList();
}

/* ارقام فارسی/عربی → لاتین (برای کد پرسنلی) */
function toLatinDigits(s){
  return String(s||'')
    .replace(/[۰-۹]/g, d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
}

async function submitStaffRegister(){
  const errEl = $('trErr');
  trClearAllErrors();
  const full_name = $('trName').value.trim();
  const national_code = toLatinDigits($('trCode').value.trim());
  const personnel_code = toLatinDigits($('trPersonnel').value.trim());
  const email = $('trEmail').value.trim();
  const pass = $('trPass').value;
  const pass2 = $('trPass2').value;
  const role = $('trRole').value;

  /* همه‌ی خطاها یک‌جا زیر فیلد خودشون نشون داده می‌شن؛ اولین خطا فوکوس می‌گیره */
  let firstErrEl = null;
  const fail = (anchorId, msg, borderId)=>{ const el = trFieldErr(anchorId, msg, borderId); if(!firstErrEl) firstErrEl = el; };

  if(!full_name || full_name.length<3) fail('trName','نام و نام‌خانوادگی رو کامل بنویسید');
  if(!isValidNationalCode(national_code)) fail('trCode','کد ملی معتبر نیست');
  if(!/^\d{3,15}$/.test(personnel_code)) fail('trPersonnel','کد پرسنلی رو به‌صورت عدد وارد کنید');
  if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('trEmail','یک ایمیل معتبر وارد کنید');
  if(!pass || pass.length<6) fail('trPass','رمز باید حداقل ۶ کاراکتر باشه');
  if(pass2 !== pass || !pass2) fail('trPass2','دو رمز یکی نیستن');
  if(role==='province_admin' && !$('trProvince').value) fail('trProvince','استان رو انتخاب کنید');
  if(['county_admin','school_admin','teacher'].includes(role) && !$('trCounty').value) fail('trCounty','شهرستان رو انتخاب کنید');
  if(role==='teacher' && $('trCounty').value && !_trPicked.size) fail('trSchoolMulti','حداقل یک مدرسه رو انتخاب کنید','trSchoolList');
  if(role==='school_admin' && $('trCounty').value && !$('trSchool').value) fail('trSchool','مدرسه رو انتخاب کنید');
  if(firstErrEl){ trFocusFirst(firstErrEl); return; }

  /* معلم: چند مدرسه — مدیر مدرسه: یک مدرسه — بقیه: هیچ */
  const schoolIds = role==='teacher' ? Array.from(_trPicked)
                  : role==='school_admin' ? [String($('trSchool').value)] : [];

  $('trBtn').disabled = true; $('trBtn').textContent = 'در حال ثبت‌نام...';
  let error = null;
  try{
    /* لینک تأیید ایمیل باید همیشه به سایت واقعی برگرده — داخل اپ اندروید location.origin
       برابر https://localhost هست که توی مرورگر باز نمی‌شه */
    const res = await sb.auth.signUp({
      email, password: pass,
      options: {
        emailRedirectTo: getSiteOrigin() + '/teacher/',
        data: {
          pending_role_request: 'true',
          full_name, national_code, personnel_code, requested_role: role,
          school_id: schoolIds.length ? schoolIds[0] : '',
          school_ids: schoolIds.join(','),
          county_id: role==='county_admin' ? String($('trCounty').value) : '',
          province_id: role==='province_admin' ? String($('trProvince').value) : ''
        }
      }
    });
    error = res.error;
  }catch(e){
    console.error('submitStaffRegister failed:', e);
    /* فقط خطاهای واقعاً شبکه‌ای پیام «اتصال» می‌گیرن؛ خطای برنامه‌نویسی رو مخفی نکنیم */
    const isNetwork = (e instanceof TypeError) || /fetch|network|load failed/i.test(String(e && e.message));
    error = { message: isNetwork
      ? 'اتصال به سرور برقرار نشد — اینترنت خودتون رو چک کنید و دوباره تلاش کنید'
      : 'مشکل داخلی در ثبت‌نام رخ داد (' + ((e && e.message) || 'نامشخص') + ')' };
  }
  $('trBtn').disabled = false; $('trBtn').textContent = 'ثبت‌نام';
  if(error){
    const mapped = trMapServerError(error.message);
    if(mapped.field){
      trFocusFirst(trFieldErr(mapped.field, mapped.text));
    }else{
      errEl.textContent = 'خطا: ' + mapped.text;
    }
    return;
  }
  $('taRegForm').innerHTML = '<div class="pattern-card" style="text-align:center;padding:24px">✅ ثبت‌نام انجام شد!<br><br>یه ایمیل تأیید به <b>'+esc(email)+'</b> ارسال شد. روی لینک توش بزنید تا ایمیلتون تأیید بشه؛ بعدش درخواست شما برای تأیید سطح بالاتر ارسال می‌شه.</div>';
}

/* ==================================================== تأیید درخواست‌های عضویت (برای ادمین شهرستان/استان/سوپرادمین) */
const REQ_ROLE_LABELS = {teacher:'معلم', school_admin:'مدیر مدرسه', county_admin:'ادمین شهرستان', province_admin:'ادمین استان', super_admin:'سوپرادمین'};
async function loadRoleRequestsPanel(){
  const el = $('tRoleRequests');
  el.innerHTML = emptyState('⏳','در حال بارگذاری...','');
  const { data, error } = await sb.rpc('get_pending_role_requests');
  if(error){ el.innerHTML = emptyState('⚠️','خطا در دریافت لیست',''); console.error(error); return; }
  if(!data || !data.length){ el.innerHTML = emptyState('✅','درخواستی در انتظار تأیید نیست',''); return; }

  /* اسم مدرسه‌های درخواست‌شده (برای معلم‌های چندمدرسه‌ای) */
  const allIds = [...new Set(data.flatMap(r=>r.school_ids||[]))];
  let schoolName = {};
  if(allIds.length){
    const { data: sc } = await sb.from('schools').select('id,name').in('id', allIds);
    schoolName = Object.fromEntries((sc||[]).map(s=>[s.id, s.name]));
  }
  el.innerHTML = data.map(r=>{
    const schools = (r.school_ids||[]).map(id=>schoolName[id]).filter(Boolean);
    return '<div class="student-row"><span>👤 '+esc(r.full_name)+' — '+REQ_ROLE_LABELS[r.requested_role]+' · کد ملی: '+esc(r.national_code)+(r.personnel_code ? ' · کد پرسنلی: '+esc(r.personnel_code) : '')+
    (schools.length ? '<br><small>🏫 '+schools.map(esc).join('، ')+'</small>' : '')+'</span>'+
    '<span class="row-actions" style="display:inline-flex;gap:6px">'+
    '<button class="btn btn-thread btn-sm" onclick="reviewRoleRequest('+r.id+', true)">تأیید</button>'+
    '<button class="btn btn-ghost btn-sm" onclick="reviewRoleRequest('+r.id+', false)">رد</button>'+
    '</span></div>';
  }).join('');
}
async function reviewRoleRequest(id, approve){
  let reason = null;
  if(!approve){ reason = prompt('دلیل رد (اختیاری):') || null; }
  const { error } = await sb.rpc('review_role_request', { p_request_id: id, p_approve: approve, p_reason: reason });
  if(error){ showToast('خطا: '+error.message); return; }
  showToast(approve?'✅ تأیید شد':'رد شد');
  loadRoleRequestsPanel();
  if(typeof refreshBadges==='function') refreshBadges();
}
