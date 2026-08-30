/**
 * dashboard.js — منطق پنل مدیریت دسکتاپ (مدیر مدرسه / ادمین شهرستان-استان / سوپرادمین)
 */
let myScope = null; // {role, school, school_id, county_id, province_id}
let allProvinces = [], allCounties = [];

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

function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2600);
}
function esc(s){ return (s==null?'':String(s)).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

async function boot(){
  const { data:{ session } } = await sb.auth.getSession();
  if(!session){ window.location.href = 'login-select.html'; return; }

  const { data: scopeRows, error } = await sb.rpc('my_scope');
  if(error || !scopeRows || !scopeRows.length){ window.location.href = 'login-select.html'; return; }
  myScope = scopeRows[0];

  document.getElementById('roleTag').textContent =
    (ROLE_LABELS[myScope.role]||myScope.role) + (myScope.school ? ' — ' + myScope.school : '');

  // بارگذاری استان‌ها/شهرستان‌ها برای فیلترها و فرم‌ها
  const [{ data: provs }, { data: counties }] = await Promise.all([
    sb.from('provinces').select('*').order('name'),
    sb.from('counties').select('*').order('name')
  ]);
  allProvinces = provs || []; allCounties = counties || [];

  setupNav();
  setupSchoolsFilter();
  setupStaffForm();
  document.getElementById('logoutBtn').onclick = async ()=>{ await sb.auth.signOut(); window.location.href='login-select.html'; };

  refreshPendingBadge();
  switchPanel('pStats');
}
function setBadge(id, n){
  const el = document.getElementById(id); if(!el) return;
  if(n && n>0){ el.textContent = n>99?'99+':n; el.classList.remove('hidden'); }
  else { el.classList.add('hidden'); }
}
async function refreshPendingBadge(){
  const { count } = await sb.from('submissions').select('id', { count:'exact', head:true }).eq('status','pending');
  setBadge('badgeReviewPending', count || 0);
  if(!['county_admin','province_admin','super_admin'].includes(myScope.role)) return;
  const { data } = await sb.rpc('get_pending_schools');
  setBadge('badgePending', data ? data.length : 0);
  const { data: reqs } = await sb.rpc('get_pending_role_requests');
  setBadge('badgeRoleRequests', reqs ? reqs.length : 0);
}

function setupNav(){
  const canReview = ['county_admin','province_admin','super_admin'].includes(myScope.role);
  const canManageStaff = ['county_admin','province_admin','super_admin'].includes(myScope.role);
  document.getElementById('navPending').classList.toggle('hidden', !canReview);
  document.getElementById('navBulkImport').classList.toggle('hidden', !canReview);
  document.getElementById('navRoleRequests').classList.toggle('hidden', !canReview);
  document.getElementById('navStaff').classList.toggle('hidden', !canManageStaff);
  document.getElementById('navAudit').classList.toggle('hidden', myScope.role!=='super_admin');

  document.querySelectorAll('#navMenu button').forEach(btn=>{
    btn.addEventListener('click', ()=> switchPanel(btn.dataset.p));
  });
}

function switchPanel(id){
  document.querySelectorAll('#navMenu button').forEach(b=>b.classList.toggle('active', b.dataset.p===id));
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active', p.id===id));
  if(id==='pStats') loadStats();
  if(id==='pPending') loadPending();
  if(id==='pRoleRequests') loadRoleRequests();
  if(id==='pBulkImport') initBulkImport();
  if(id==='pSchools') loadSchools();
  if(id==='pAddStudent') initAddStudentForm();
  if(id==='pStaff') loadStaff();
  if(id==='pAudit') loadAuditLog();
  if(id==='pReview') loadReview();
}

/* ==================================================== آمار ==================================================== */
async function loadStats(){
  const el = document.getElementById('statsBody');
  el.innerHTML = '<div class="empty-state"><div class="ic">⏳</div>در حال بارگذاری...</div>';
  const { data, error } = await sb.rpc('get_scoped_school_stats');
  if(error){ el.innerHTML = '<div class="empty-state"><div class="ic">⚠️</div>خطا در دریافت آمار</div>'; console.error(error); return; }
  if(!data || !data.length){ el.innerHTML = '<div class="empty-state"><div class="ic">📊</div>هنوز آماری برای محدوده‌ی شما ثبت نشده</div>'; return; }

  const totalStudents = data.reduce((a,b)=>a+Number(b.student_count||0),0);
  const totalSchools = data.length;
  const avgPoints = (data.reduce((a,b)=>a+Number(b.avg_points||0),0)/totalSchools).toFixed(1);
  const totalApproved = data.reduce((a,b)=>a+Number(b.approved_submissions||0),0);

  let html = '<div class="stat-cards">'+
    statCard(totalSchools,'مدرسه')+
    statCard(totalStudents,'دانش‌آموز')+
    statCard(avgPoints,'میانگین امتیاز')+
    statCard(totalApproved,'کار تأییدشده')+
  '</div>';

  html += '<table class="data-table"><thead><tr><th>مدرسه</th><th>شهرستان</th><th>استان</th><th>دانش‌آموز</th><th>میانگین امتیاز</th><th>کار تأییدشده</th><th>تکلیف فعال</th></tr></thead><tbody>';
  data.forEach(d=>{
    html += `<tr><td>${esc(d.school_name)}</td><td>${esc(d.county_name)}</td><td>${esc(d.province_name)}</td><td>${d.student_count}</td><td>${d.avg_points}</td><td>${d.approved_submissions}</td><td>${d.active_assignments}</td></tr>`;
  });
  html += '</tbody></table>';
  el.innerHTML = html;
}
function statCard(n,l){ return `<div class="stat-card"><div class="n">${n}</div><div class="l">${l}</div></div>`; }

/* ==================================================== تأیید مدرسه‌ها ==================================================== */
async function loadPending(){
  const el = document.getElementById('pendingBody');
  el.innerHTML = '<div class="empty-state"><div class="ic">⏳</div>در حال بارگذاری...</div>';
  const { data, error } = await sb.rpc('get_pending_schools');
  if(error){ el.innerHTML = '<div class="empty-state"><div class="ic">⚠️</div>خطا در دریافت لیست</div>'; console.error(error); return; }
  if(!data || !data.length){ el.innerHTML = '<div class="empty-state"><div class="ic">✅</div>درخواست در انتظار تأییدی نیست</div>'; return; }

  const countyMap = Object.fromEntries(allCounties.map(c=>[c.id,c]));
  const provMap = Object.fromEntries(allProvinces.map(p=>[p.id,p]));

  let html = '<table class="data-table"><thead><tr><th>نام مدرسه</th><th>شهرستان</th><th>استان</th><th>تاریخ درخواست</th><th>اقدام</th></tr></thead><tbody>';
  data.forEach(s=>{
    const county = countyMap[s.county_id];
    const prov = county ? provMap[county.province_id] : null;
    html += `<tr>
      <td>${esc(s.name)}</td>
      <td>${esc(county ? county.name : '—')}</td>
      <td>${esc(prov ? prov.name : '—')}</td>
      <td>${new Date(s.created_at).toLocaleDateString('fa-IR')}</td>
      <td><div class="row-actions">
        <button class="act-approve" onclick="reviewSchool(${s.id}, true)">تأیید</button>
        <button class="act-reject" onclick="reviewSchool(${s.id}, false)">رد</button>
      </div></td>
    </tr>`;
  });
  html += '</tbody></table>';
  el.innerHTML = html;
}
async function reviewSchool(id, approve){
  let reason = null;
  if(!approve){ reason = prompt('دلیل رد درخواست (اختیاری):') || null; }
  const { error } = await sb.rpc('review_school', { p_school_id: id, p_approve: approve, p_reason: reason });
  if(error){ showToast('خطا: ' + error.message); return; }
  showToast(approve ? 'مدرسه تأیید شد ✅' : 'درخواست رد شد');
  loadPending();
  refreshPendingBadge();
}

/* ==================================================== درخواست‌های عضویت ==================================================== */
const ROLE_REQUEST_LABELS = {teacher:'معلم', school_admin:'مدیر مدرسه', county_admin:'ادمین شهرستان', province_admin:'ادمین استان', super_admin:'سوپرادمین'};
async function loadRoleRequests(){
  const el = document.getElementById('roleRequestsBody');
  el.innerHTML = '<div class="empty-state"><div class="ic">⏳</div>در حال بارگذاری...</div>';
  const { data, error } = await sb.rpc('get_pending_role_requests');
  if(error){ el.innerHTML = '<div class="empty-state"><div class="ic">⚠️</div>خطا در دریافت لیست</div>'; console.error(error); return; }
  if(!data || !data.length){ el.innerHTML = '<div class="empty-state"><div class="ic">✅</div>درخواستی در انتظار تأیید نیست</div>'; return; }

  let html = '<table class="data-table"><thead><tr><th>نام</th><th>نقش درخواستی</th><th>کد ملی</th><th>تاریخ درخواست</th><th>اقدام</th></tr></thead><tbody>';
  data.forEach(r=>{
    html += `<tr>
      <td>${esc(r.full_name)}</td>
      <td>${esc(ROLE_REQUEST_LABELS[r.requested_role]||r.requested_role)}</td>
      <td>${esc(r.national_code)}</td>
      <td>${new Date(r.created_at).toLocaleDateString('fa-IR')}</td>
      <td><div class="row-actions">
        <button class="act-approve" onclick="reviewRoleRequest(${r.id}, true)">تأیید</button>
        <button class="act-reject" onclick="reviewRoleRequest(${r.id}, false)">رد</button>
      </div></td>
    </tr>`;
  });
  html += '</tbody></table>';
  el.innerHTML = html;
}
async function reviewRoleRequest(id, approve){
  let reason = null;
  if(!approve){ reason = prompt('دلیل رد درخواست (اختیاری):') || null; }
  const { error } = await sb.rpc('review_role_request', { p_request_id: id, p_approve: approve, p_reason: reason });
  if(error){ showToast('خطا: ' + error.message); return; }
  showToast(approve ? 'درخواست تأیید شد ✅' : 'درخواست رد شد');
  loadRoleRequests();
  refreshPendingBadge();
}

/* ==================================================== فهرست مدرسه‌ها ==================================================== */
function setupSchoolsFilter(){
  const provSel = document.getElementById('fProvince');
  allProvinces.forEach(p=> provSel.insertAdjacentHTML('beforeend', `<option value="${p.id}">${esc(p.name)}</option>`));
  provSel.addEventListener('change', ()=>{
    fillCountyOptions(document.getElementById('fCounty'), provSel.value, true);
    loadSchools();
  });
  document.getElementById('fCounty').addEventListener('change', loadSchools);
}
function fillCountyOptions(selectEl, provinceId, withAllOption){
  selectEl.innerHTML = withAllOption ? '<option value="">همه‌ی شهرستان‌ها</option>' : '<option value="">— انتخاب کنید —</option>';
  allCounties.filter(c=> String(c.province_id)===String(provinceId))
    .forEach(c=> selectEl.insertAdjacentHTML('beforeend', `<option value="${c.id}">${esc(c.name)}</option>`));
}
async function loadSchools(){
  const el = document.getElementById('schoolsBody');
  el.innerHTML = '<div class="empty-state"><div class="ic">⏳</div>در حال بارگذاری...</div>';
  const countyId = document.getElementById('fCounty').value;
  const provinceId = document.getElementById('fProvince').value;

  let query = sb.from('schools').select('id,name,status,counties(name,province_id,provinces(name))').eq('status','approved').order('name');
  if(countyId) query = query.eq('county_id', countyId);
  const { data, error } = await query;
  if(error){ el.innerHTML = '<div class="empty-state"><div class="ic">⚠️</div>خطا در دریافت لیست</div>'; console.error(error); return; }

  let rows = data || [];
  if(provinceId && !countyId) rows = rows.filter(r=> r.counties && String(r.counties.province_id)===String(provinceId));

  if(!rows.length){ el.innerHTML = '<div class="empty-state"><div class="ic">🏫</div>مدرسه‌ای یافت نشد</div>'; return; }

  let html = '<table class="data-table"><thead><tr><th>نام مدرسه</th><th>شهرستان</th><th>استان</th></tr></thead><tbody>';
  rows.forEach(s=>{
    html += `<tr><td>${esc(s.name)}</td><td>${esc(s.counties?.name)}</td><td>${esc(s.counties?.provinces?.name)}</td></tr>`;
  });
  html += '</tbody></table>';
  el.innerHTML = html;
}

/* ==================================================== مدیریت کارکنان ==================================================== */
function setupStaffForm(){
  const roleSel = document.getElementById('sfRole');
  const roleOptions = {
    super_admin:   [['super_admin','سوپرادمین'],['province_admin','ادمین استان'],['county_admin','ادمین شهرستان'],['school_admin','مدیر مدرسه'],['teacher','معلم']],
    province_admin:[['county_admin','ادمین شهرستان'],['school_admin','مدیر مدرسه'],['teacher','معلم']],
    county_admin:  [['school_admin','مدیر مدرسه'],['teacher','معلم']],
  };
  (roleOptions[myScope.role]||[]).forEach(([v,l])=> roleSel.insertAdjacentHTML('beforeend', `<option value="${v}">${l}</option>`));

  const provSel = document.getElementById('sfProvince');
  allProvinces.forEach(p=> provSel.insertAdjacentHTML('beforeend', `<option value="${p.id}">${esc(p.name)}</option>`));
  provSel.addEventListener('change', ()=> fillCountyOptions(document.getElementById('sfCounty'), provSel.value, false));
  document.getElementById('sfCounty').addEventListener('change', fillSfSchoolOptions);
  roleSel.addEventListener('change', updateStaffFieldVisibility);
  updateStaffFieldVisibility();

  document.getElementById('sfBtn').addEventListener('click', submitStaffForm);
}
function updateStaffFieldVisibility(){
  const role = document.getElementById('sfRole').value;
  document.getElementById('sfProvinceField').classList.toggle('hidden', !role || role==='super_admin');
  document.getElementById('sfCountyField').classList.toggle('hidden', !['county_admin','school_admin','teacher'].includes(role));
  document.getElementById('sfSchoolField').classList.toggle('hidden', !['school_admin','teacher'].includes(role));
}
async function fillSfSchoolOptions(){
  const sel = document.getElementById('sfSchool');
  sel.innerHTML = '<option value="">— انتخاب کنید —</option>';
  const countyId = document.getElementById('sfCounty').value;
  if(!countyId) return;
  const { data } = await sb.from('schools').select('id,name').eq('county_id', countyId).eq('status','approved').order('name');
  (data||[]).forEach(s=> sel.insertAdjacentHTML('beforeend', `<option value="${s.id}">${esc(s.name)}</option>`));
}
async function submitStaffForm(){
  const errEl = document.getElementById('sfErr'); errEl.textContent = '';
  const email = document.getElementById('sfEmail').value.trim();
  const full_name = document.getElementById('sfName').value.trim();
  const role = document.getElementById('sfRole').value;
  if(!email || !full_name || !role){ errEl.textContent = 'همه‌ی فیلدها را پر کنید'; return; }
  if(role==='province_admin' && !document.getElementById('sfProvince').value){ errEl.textContent='استان رو انتخاب کنید'; return; }
  if(role==='county_admin' && !document.getElementById('sfCounty').value){ errEl.textContent='شهرستان رو انتخاب کنید'; return; }
  if(['school_admin','teacher'].includes(role) && !document.getElementById('sfSchool').value){ errEl.textContent='مدرسه رو انتخاب کنید'; return; }

  const params = { p_email: await resolveLoginIdentifier(email), p_full_name: full_name, p_role: role, p_school_id: null, p_county_id: null, p_province_id: null };
  if(role==='province_admin') params.p_province_id = Number(document.getElementById('sfProvince').value) || null;
  if(role==='county_admin') params.p_county_id = Number(document.getElementById('sfCounty').value) || null;
  if(['school_admin','teacher'].includes(role)) params.p_school_id = Number(document.getElementById('sfSchool').value) || null;

  const { error } = await sb.rpc('set_staff_role', params);
  if(error){ errEl.textContent = 'خطا: ' + error.message; return; }
  showToast('ذخیره شد ✅');
  document.getElementById('sfEmail').value=''; document.getElementById('sfName').value='';
  loadStaff();
}
async function loadStaff(){
  const el = document.getElementById('staffBody');
  el.innerHTML = '<div class="empty-state"><div class="ic">⏳</div>در حال بارگذاری...</div>';
  const { data, error } = await sb.rpc('get_scoped_staff');
  if(error){ el.innerHTML = '<div class="empty-state"><div class="ic">⚠️</div>خطا در دریافت لیست</div>'; console.error(error); return; }
  if(!data || !data.length){ el.innerHTML = '<div class="empty-state"><div class="ic">🧑‍💼</div>هنوز کارمندی ثبت نشده</div>'; return; }

  let html = '<table class="data-table"><thead><tr><th>نام</th><th>ایمیل</th><th>نقش</th><th>مدرسه</th><th>شهرستان</th><th>استان</th></tr></thead><tbody>';
  data.forEach(s=>{
    const idLabel = s.email && s.email.endsWith('@melli.karvfan.local') ? 'کد ملی: '+s.email.split('@')[0] : s.email;
    html += `<tr><td>${esc(s.full_name)}</td><td>${esc(idLabel)}</td><td>${esc(ROLE_LABELS[s.role]||s.role)}</td><td>${esc(s.school_name)||'—'}</td><td>${esc(s.county_name)||'—'}</td><td>${esc(s.province_name)||'—'}</td></tr>`;
  });
  html += '</tbody></table>';
  el.innerHTML = html;
}

/* ==================================================== ثبت دانش‌آموز (کاسکید از سطح معلم) ==================================================== */
let _asWired = false;
function initAddStudentForm(){
  const provSel = document.getElementById('asProvince');
  if(!provSel.options.length){
    allProvinces.forEach(p=> provSel.insertAdjacentHTML('beforeend', `<option value="${p.id}">${esc(p.name)}</option>`));
  }
  if(myScope.school_id){
    sb.from('schools').select('*, counties(*, provinces(*))').eq('id', myScope.school_id).maybeSingle().then(({data:sc})=>{
      if(sc && sc.counties && sc.counties.provinces){
        provSel.value = sc.counties.provinces.id;
        fillCountyOptions(document.getElementById('asCounty'), provSel.value, false);
        document.getElementById('asCounty').value = sc.counties.id;
        fillAsSchoolOptions().then(()=>{ document.getElementById('asSchool').value = sc.name; });
      }
    });
  }
  if(_asWired) return; _asWired = true;
  provSel.addEventListener('change', ()=>{
    fillCountyOptions(document.getElementById('asCounty'), provSel.value, false);
    document.getElementById('asSchool').innerHTML = '<option value="">— ابتدا شهرستان را انتخاب کنید —</option>';
  });
  document.getElementById('asCounty').addEventListener('change', fillAsSchoolOptions);
  document.getElementById('asBtn').addEventListener('click', async ()=>{
    const errEl = document.getElementById('asErr'); errEl.textContent=''; errEl.style.color='';
    const full_name = document.getElementById('asName').value.trim();
    const school = document.getElementById('asSchool').value.trim();
    const grade = parseInt(document.getElementById('asGrade').value);
    const class_name = document.getElementById('asClass').value.trim();
    const phone = document.getElementById('asPhone').value.trim();
    if(!full_name || full_name.length<3){ errEl.textContent='نام و نام خانوادگی رو کامل بنویسید'; return; }
    if(!school){ errEl.textContent='مدرسه رو انتخاب کنید'; return; }
    if(!/^0?9\d{9}$/.test(phone.replace(/\s/g,''))){ errEl.textContent='شماره موبایل معتبر نیست'; return; }
    const pin = String(Math.floor(1000 + Math.random()*9000));
    const { error } = await sb.rpc('student_login_or_register', { p_full_name: full_name, p_school: school, p_grade: grade, p_phone: phone, p_pin: pin, p_class_name: class_name||null });
    if(error){ errEl.textContent = 'خطا: '+error.message; return; }
    document.getElementById('asName').value=''; document.getElementById('asClass').value=''; document.getElementById('asPhone').value='';
    errEl.innerHTML = '✅ ثبت شد. پین ورودش: <b style="font-size:16px">'+pin+'</b>';
    errEl.style.color = 'var(--green)';
  });
}
async function fillAsSchoolOptions(){
  const sel = document.getElementById('asSchool');
  const countyId = document.getElementById('asCounty').value;
  if(!countyId){ sel.innerHTML = '<option value="">— ابتدا شهرستان را انتخاب کنید —</option>'; return; }
  const { data } = await sb.from('schools').select('id,name').eq('county_id', countyId).eq('status','approved').order('name');
  sel.innerHTML = (data&&data.length) ? '<option value="">— انتخاب کنید —</option>' + data.map(s=>`<option value="${esc(s.name)}">${esc(s.name)}</option>`).join('')
    : '<option value="">— مدرسه‌ای در این شهرستان تأیید نشده —</option>';
}

/* ==================================================== گزارش فعالیت‌های مدیریتی (فقط سوپرادمین) ==================================================== */
const AUDIT_ACTION_LABELS = { approve_school:'✅ تأیید مدرسه', reject_school:'❌ رد مدرسه', set_staff_role:'🧑‍💼 تعیین نقش کارمند' };
async function loadAuditLog(){
  const el = document.getElementById('auditBody');
  el.innerHTML = '<div class="empty-state"><div class="ic">⏳</div>در حال بارگذاری...</div>';
  const { data, error } = await sb.rpc('get_audit_log', { p_limit: 200 });
  if(error){ el.innerHTML = '<div class="empty-state"><div class="ic">⚠️</div>خطا در دریافت گزارش</div>'; console.error(error); return; }
  if(!data || !data.length){ el.innerHTML = '<div class="empty-state"><div class="ic">📜</div>هنوز فعالیتی ثبت نشده</div>'; return; }
  let html = '<table class="data-table"><thead><tr><th>زمان</th><th>انجام‌دهنده</th><th>اقدام</th><th>مورد</th></tr></thead><tbody>';
  data.forEach(a=>{
    html += `<tr><td>${new Date(a.created_at).toLocaleString('fa-IR')}</td><td>${esc(a.actor_email)}</td><td>${esc(AUDIT_ACTION_LABELS[a.action]||a.action)}</td><td>${esc(a.target_desc)}</td></tr>`;
  });
  html += '</tbody></table>';
  el.innerHTML = html;
}

/* ==================================================== وارد کردن گروهی مدرسه ==================================================== */
let _biWired = false;
function initBulkImport(){
  const provSel = document.getElementById('biProvince');
  if(!provSel.options.length){
    allProvinces.forEach(p=> provSel.insertAdjacentHTML('beforeend', `<option value="${p.id}">${esc(p.name)}</option>`));
  }
  if(_biWired) return; _biWired = true;
  provSel.addEventListener('change', ()=> fillCountyOptions(document.getElementById('biCounty'), provSel.value, false));
  document.getElementById('biBtn').addEventListener('click', async ()=>{
    const errEl = document.getElementById('biErr'); errEl.textContent=''; errEl.style.color='';
    const countyId = Number(document.getElementById('biCounty').value) || null;
    const names = document.getElementById('biNames').value.split('\n').map(s=>s.trim()).filter(Boolean);
    if(!countyId){ errEl.textContent='شهرستان رو انتخاب کن'; return; }
    if(!names.length){ errEl.textContent='حداقل یک اسم مدرسه بنویس'; return; }
    const items = names.map(n=>({ county_id: countyId, name: n }));
    const { data, error } = await sb.rpc('bulk_import_schools', { p_items: items });
    if(error){ errEl.textContent = 'خطا: ' + error.message; return; }
    errEl.style.color = 'var(--green)';
    errEl.textContent = '✅ '+data+' مدرسه وارد و تأیید شد';
    document.getElementById('biNames').value = '';
    refreshPendingBadge();
  });
}

document.addEventListener('DOMContentLoaded', boot);
