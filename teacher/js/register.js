/**
 * register.js — ثبت‌نام خودکار معلم تا سوپرادمین با تأیید ایمیل واقعی و سپس تأیید سطح بالاتر.
 */
function switchTeacherAuthTab(which){
  $('taTabLogin').classList.toggle('active', which==='login');
  $('taTabReg').classList.toggle('active', which==='register');
  $('taLoginForm').classList.toggle('hidden', which!=='login');
  $('taRegForm').classList.toggle('hidden', which!=='register');
  if(which==='register') initStaffRegisterForm();
}

let _trWired = false;
async function initStaffRegisterForm(){
  const { provinces } = await loadRegionsCache();
  if(!$('trProvince').options.length){
    $('trProvince').innerHTML = provinceOptionsHtml(provinces);
  }
  if(_trWired) return; _trWired = true;
  $('trProvince').addEventListener('change', ()=>{
    $('trCounty').innerHTML = countyOptionsHtml(_regionsCache.counties, $('trProvince').value);
    $('trSchool').innerHTML = '<option value="">— ابتدا شهرستان را انتخاب کنید —</option>';
  });
  $('trCounty').addEventListener('change', fillTrSchoolOptions);
  onTrRoleChange();
}
async function fillTrSchoolOptions(){
  const countyId = $('trCounty').value;
  if(!countyId){ $('trSchool').innerHTML = '<option value="">— ابتدا شهرستان را انتخاب کنید —</option>'; return; }
  const { data } = await sb.from('schools').select('id,name').eq('county_id', countyId).eq('status','approved').order('name');
  $('trSchool').innerHTML = (data&&data.length) ? '<option value="">— انتخاب کنید —</option>' + data.map(s=>'<option value="'+s.id+'">'+esc(s.name)+'</option>').join('')
    : '<option value="">— مدرسه‌ای در این شهرستان تأیید نشده —</option>';
}
function onTrRoleChange(){
  const role = $('trRole').value;
  $('trProvinceField').classList.toggle('hidden', role==='super_admin');
  $('trCountyField').classList.toggle('hidden', !['county_admin','school_admin','teacher'].includes(role));
  $('trSchoolField').classList.toggle('hidden', !['school_admin','teacher'].includes(role));
}

async function submitStaffRegister(){
  const errEl = $('trErr'); errEl.textContent='';
  const full_name = $('trName').value.trim();
  const national_code = $('trCode').value.trim();
  const email = $('trEmail').value.trim();
  const pass = $('trPass').value;
  const pass2 = $('trPass2').value;
  const role = $('trRole').value;

  if(!full_name || full_name.length<3){ errEl.textContent='نام و نام‌خانوادگی رو کامل بنویسید'; return; }
  if(!isValidNationalCode(national_code)){ errEl.textContent='کد ملی معتبر نیست'; return; }
  if(!email || !email.includes('@')){ errEl.textContent='یک ایمیل معتبر وارد کنید'; return; }
  if(!pass || pass.length<6){ errEl.textContent='رمز باید حداقل ۶ کاراکتر باشه'; return; }
  if(pass!==pass2){ errEl.textContent='دو رمز یکی نیستن'; return; }
  if(role==='province_admin' && !$('trProvince').value){ errEl.textContent='استان رو انتخاب کنید'; return; }
  if(role==='county_admin' && !$('trCounty').value){ errEl.textContent='شهرستان رو انتخاب کنید'; return; }
  if(['school_admin','teacher'].includes(role) && !$('trSchool').value){ errEl.textContent='مدرسه رو انتخاب کنید'; return; }

  $('trBtn').disabled = true; $('trBtn').textContent = 'در حال ثبت‌نام...';
  const { error } = await sb.auth.signUp({
    email, password: pass,
    options: {
      emailRedirectTo: window.location.origin + window.location.pathname,
      data: {
        pending_role_request: 'true',
        full_name, national_code, requested_role: role,
        school_id: role==='school_admin'||role==='teacher' ? String($('trSchool').value) : '',
        county_id: role==='county_admin' ? String($('trCounty').value) : '',
        province_id: role==='province_admin' ? String($('trProvince').value) : ''
      }
    }
  });
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
  el.innerHTML = data.map(r=>
    '<div class="student-row"><span>👤 '+esc(r.full_name)+' — '+REQ_ROLE_LABELS[r.requested_role]+' · کد ملی: '+esc(r.national_code)+'</span>'+
    '<span class="row-actions" style="display:inline-flex;gap:6px">'+
    '<button class="btn btn-thread btn-sm" onclick="reviewRoleRequest('+r.id+', true)">تأیید</button>'+
    '<button class="btn btn-ghost btn-sm" onclick="reviewRoleRequest('+r.id+', false)">رد</button>'+
    '</span></div>'
  ).join('');
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
