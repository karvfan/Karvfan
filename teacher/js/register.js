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
  renderTrSchoolList();
}

/* ارقام فارسی/عربی → لاتین (برای کد پرسنلی) */
function toLatinDigits(s){
  return String(s||'')
    .replace(/[۰-۹]/g, d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
}

async function submitStaffRegister(){
  const errEl = $('trErr'); errEl.textContent='';
  const full_name = $('trName').value.trim();
  const national_code = $('trCode').value.trim();
  const personnel_code = toLatinDigits($('trPersonnel').value.trim());
  const email = $('trEmail').value.trim();
  const pass = $('trPass').value;
  const pass2 = $('trPass2').value;
  const role = $('trRole').value;

  if(!full_name || full_name.length<3){ errEl.textContent='نام و نام‌خانوادگی رو کامل بنویسید'; return; }
  if(!isValidNationalCode(national_code)){ errEl.textContent='کد ملی معتبر نیست'; return; }
  if(!/^\d{3,15}$/.test(personnel_code)){ errEl.textContent='کد پرسنلی رو به‌صورت عدد وارد کنید'; return; }
  if(!email || !email.includes('@')){ errEl.textContent='یک ایمیل معتبر وارد کنید'; return; }
  if(!pass || pass.length<6){ errEl.textContent='رمز باید حداقل ۶ کاراکتر باشه'; return; }
  if(pass!==pass2){ errEl.textContent='دو رمز یکی نیستن'; return; }
  if(role==='province_admin' && !$('trProvince').value){ errEl.textContent='استان رو انتخاب کنید'; return; }
  if(role==='county_admin' && !$('trCounty').value){ errEl.textContent='شهرستان رو انتخاب کنید'; return; }
  if(role==='teacher' && !_trPicked.size){ errEl.textContent='حداقل یک مدرسه رو انتخاب کنید'; return; }
  if(role==='school_admin' && !$('trSchool').value){ errEl.textContent='مدرسه رو انتخاب کنید'; return; }

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
  if(error){ errEl.textContent = 'خطا: ' + error.message; return; }
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
