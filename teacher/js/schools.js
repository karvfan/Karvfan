/**
 * schools.js — گردش‌کار مدرسه‌ها (درخواست توسط معلم/مدیر، تأیید توسط ادمین شهرستان/استان/سوپرادمین)
 * و افزودن مستقیم دانش‌آموز توسط معلم و بالاتر (چون هر سمت قابلیت‌های سمت پایین‌تر از خودش رو هم داره).
 */
let _regionsCache = null; // {provinces:[], counties:[]}
async function loadRegionsCache(){
  if(_regionsCache) return _regionsCache;
  const [{ data: provinces }, { data: counties }] = await Promise.all([
    sb.from('provinces').select('*').order('name'),
    sb.from('counties').select('*').order('name')
  ]);
  _regionsCache = { provinces: provinces||[], counties: counties||[] };
  return _regionsCache;
}
function provinceOptionsHtml(provinces){
  return '<option value="">— انتخاب استان —</option>' + provinces.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
}
function countyOptionsHtml(counties, provinceId){
  const filtered = counties.filter(c=> String(c.province_id)===String(provinceId));
  if(!provinceId) return '<option value="">— ابتدا استان را انتخاب کنید —</option>';
  return '<option value="">— انتخاب شهرستان —</option>' + filtered.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
}

const DISTRICT_ROLES = ['county_admin','province_admin','super_admin'];

/* ==================================================== تب «مدرسه‌ها» ==================================================== */
async function loadSchoolsPanel(){
  const el = $('tSchools');
  el.innerHTML = emptyState('⏳','در حال بارگذاری...','');
  const role = myStaff ? myStaff.role : 'teacher';
  if(DISTRICT_ROLES.includes(role)){
    await renderSchoolApprovalUI(el);
  }else{
    await renderSchoolRequestUI(el);
  }
}

/* -------- نمای معلم/مدیر مدرسه: درخواست مدرسه‌ی جدید -------- */
async function renderSchoolRequestUI(el){
  const { provinces, counties } = await loadRegionsCache();
  el.innerHTML =
    '<div class="sec-title">🏫 درخواست ثبت مدرسه‌ی جدید</div>'+
    '<div class="pattern-card">'+
      '<div class="field"><label>استان</label><select id="rsProvince" onchange="document.getElementById(\'rsCounty\').innerHTML = countyOptionsHtml(_regionsCache.counties, this.value)">'+provinceOptionsHtml(provinces)+'</select></div>'+
      '<div class="field"><label>شهرستان</label><select id="rsCounty">'+countyOptionsHtml(counties,'')+'</select></div>'+
      '<div class="field"><label>نام مدرسه</label><input id="rsName" placeholder="مثلاً: فرزانگان"></div>'+
      '<div class="field-err" id="rsErr"></div>'+
      '<button class="btn btn-thread btn-sm" onclick="submitSchoolRequest()">📤 ارسال درخواست</button>'+
      '<div style="font-size:12px;color:var(--sub);margin-top:8px">درخواست شما بعد از تأیید ادمین شهرستان یا استانِ همان منطقه، در فرم ثبت‌نام دانش‌آموزان قابل‌انتخاب می‌شود.</div>'+
    '</div>'+
    '<div class="sec-title">درخواست‌های من</div><div id="myReqList" class="pattern-card">'+emptyState('⏳','در حال بارگذاری...','')+'</div>';
  loadMySchoolRequests();
}
async function submitSchoolRequest(){
  const countyId = $('rsCounty').value;
  const name = $('rsName').value.trim();
  $('rsErr').textContent='';
  if(!countyId){ $('rsErr').textContent='شهرستان را انتخاب کنید'; return; }
  if(!name || name.length<2){ $('rsErr').textContent='نام مدرسه را وارد کنید'; return; }
  const { error } = await sb.rpc('request_new_school', { p_county_id: Number(countyId), p_name: name });
  if(error){ $('rsErr').textContent = 'خطا: '+error.message; return; }
  showToast('✅ درخواست ارسال شد — در انتظار تأیید');
  $('rsName').value='';
  loadMySchoolRequests();
}
async function loadMySchoolRequests(){
  const el = $('myReqList');
  const { data: { session } } = await sb.auth.getSession();
  const { data, error } = await sb.from('schools').select('*, counties(name, provinces(name))').eq('requested_by', session.user.id).order('created_at',{ascending:false});
  if(error || !data || !data.length){ el.innerHTML = emptyState('📭','هنوز درخواستی ثبت نکردید',''); return; }
  const statusChip = { pending:'⏳ در انتظار بررسی', approved:'✅ تأییدشده', rejected:'❌ ردشده' };
  el.innerHTML = data.map(s=>
    '<div class="student-row"><span>🏫 '+esc(s.name)+' — '+esc(s.counties?.name)+'، '+esc(s.counties?.provinces?.name)+'</span>'+
    '<span>'+statusChip[s.status]+(s.status==='rejected' && s.reject_reason ? ' («'+esc(s.reject_reason)+'»)' : '')+'</span></div>'
  ).join('');
}

/* -------- نمای ادمین شهرستان/استان/سوپرادمین: تأیید درخواست‌ها -------- */
async function renderSchoolApprovalUI(el){
  el.innerHTML = '<div class="sec-title">✅ درخواست‌های در انتظار تأیید</div><div id="pendingSchoolsList" class="pattern-card">'+emptyState('⏳','در حال بارگذاری...','')+'</div>';
  const { data, error } = await sb.rpc('get_pending_schools');
  const list = $('pendingSchoolsList');
  if(error){ list.innerHTML = emptyState('⚠️','خطا در دریافت لیست',''); console.error(error); return; }
  if(!data || !data.length){ list.innerHTML = emptyState('✅','درخواستی در انتظار تأیید نیست',''); return; }
  const { counties } = await loadRegionsCache();
  const countyMap = Object.fromEntries(counties.map(c=>[c.id,c]));
  list.innerHTML = data.map(s=>{
    const county = countyMap[s.county_id];
    return '<div class="student-row"><span>🏫 '+esc(s.name)+(county?' — '+esc(county.name):'')+'</span>'+
      '<span class="row-actions" style="display:inline-flex;gap:6px">'+
      '<button class="btn btn-thread btn-sm" onclick="reviewSchoolWeb('+s.id+', true)">تأیید</button>'+
      '<button class="btn btn-ghost btn-sm" onclick="reviewSchoolWeb('+s.id+', false)">رد</button>'+
      '</span></div>';
  }).join('');
}
async function reviewSchoolWeb(id, approve){
  let reason = null;
  if(!approve){ reason = prompt('دلیل رد درخواست (اختیاری):') || null; }
  const { error } = await sb.rpc('review_school', { p_school_id: id, p_approve: approve, p_reason: reason });
  if(error){ showToast('خطا: '+error.message); return; }
  showToast(approve?'✅ مدرسه تأیید شد':'درخواست رد شد');
  loadSchoolsPanel();
}

/* ==================================================== تب «ثبت دانش‌آموز» ==================================================== */
/* هر سمت (معلم و بالاتر) می‌تواند دانش‌آموز ثبت کند — چون هر سطح قابلیت‌های سطح پایین‌تر را هم دارد. */
async function loadAddStudentPanel(){
  const el = $('tAddStudent');
  const defaultSchool = (myStaff && myStaff.school) ? myStaff.school : '';
  el.innerHTML =
    '<div class="sec-title">➕ ثبت دانش‌آموز جدید</div>'+
    '<div class="pattern-card">'+
      '<div class="field"><label>نام و نام خانوادگی</label><input id="asName" placeholder="مثلاً: زهرا احمدی"></div>'+
      '<div class="field"><label>مدرسه</label><input id="asSchool" list="schoolSuggestions" value="'+esc(defaultSchool)+'" placeholder="نام مدرسه"></div>'+
      '<div class="field"><label>پایه</label><select id="asGrade"><option value="7">هفتم</option><option value="8">هشتم</option><option value="9">نهم</option></select></div>'+
      '<div class="field"><label>کلاس (اختیاری)</label><input id="asClass" placeholder="مثلاً: ۷/۲"></div>'+
      '<div class="field"><label>شماره موبایل (برای ورود بعدی دانش‌آموز لازم است)</label><input id="asPhone" placeholder="09xxxxxxxxx" inputmode="numeric"></div>'+
      '<div class="field-err" id="asErr"></div>'+
      '<button class="btn btn-thread btn-sm" onclick="submitAddStudent()">✅ ثبت دانش‌آموز</button>'+
    '</div>';
}
async function submitAddStudent(){
  const full_name = $('asName').value.trim();
  const school = $('asSchool').value.trim();
  const grade = parseInt($('asGrade').value);
  const class_name = $('asClass').value.trim();
  const phone = $('asPhone').value.trim();
  $('asErr').textContent='';
  if(!full_name || full_name.length<3){ $('asErr').textContent='نام و نام خانوادگی رو کامل بنویسید'; return; }
  if(!school){ $('asErr').textContent='نام مدرسه رو بنویسید'; return; }
  if(!/^0?9\d{9}$/.test(phone.replace(/\s/g,''))){ $('asErr').textContent='شماره موبایل معتبر نیست'; return; }
  const { error } = await sb.rpc('student_login_or_register', { p_full_name: full_name, p_school: school, p_grade: grade, p_phone: phone, p_class_name: class_name||null });
  if(error){ $('asErr').textContent='خطا: '+error.message; return; }
  showToast('✅ دانش‌آموز ثبت شد — می‌تونه با همین شماره وارد بشه');
  $('asName').value=''; $('asClass').value=''; $('asPhone').value='';
}
