/**
 * district.js — سطح ناظر منطقه/شهرستان: داشبورد آماری کلان بین مدارس،
 * گزارش رسمی قابل‌چاپ، و مدیریت نقش‌های کارکنان (staff).
 */

async function loadDistrictDashboard(){
  const el = $('tDistrict');
  el.innerHTML = emptyState('⏳','در حال بارگذاری آمار کلان...','');
  const { data, error } = await sb.rpc('get_district_stats');
  if(error || !data || !data.length){ el.innerHTML = emptyState('🏛️','هنوز آماری ثبت نشده',''); return; }
  window._districtData = data;
  const maxStudents = Math.max(1, ...data.map(d=>d.student_count));
  const maxPts = Math.max(1, ...data.map(d=>d.avg_points));

  // امتیاز ترکیبی برای رتبه‌بندی: میانگین امتیاز + میانگین روز متوالی، وزن‌دهی‌شده
  const ranked = data.map(d=>({...d, engagement: (Number(d.avg_points)||0) + (Number(d.avg_streak)||0)*3}))
    .sort((a,b)=>b.engagement-a.engagement);

  let html = '<button class="btn btn-thread btn-sm" style="margin-bottom:14px" onclick="openDistrictReport()">📄 خروجی گزارش رسمی</button>';

  html += '<div class="sec-title">🏆 رتبه‌بندی مدارس (بر اساس میانگین امتیاز و مشارکت)</div>';
  ranked.forEach((d,i)=>{
    const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1)+'.';
    html += '<div class="lb-row"><span class="lb-rank">'+medal+'</span><span class="lb-name">'+esc(d.school)+'</span>'+
      '<span class="lb-pts">'+d.avg_points+' میانگین امتیاز</span></div>';
  });

  html += '<div class="sec-title">🏛️ مقایسه‌ی مدارس (آمار تجمیعی — بدون اطلاعات شخصی)</div>';
  data.forEach(d=>{
    html += '<div class="pattern-card">'+
      '<div class="sub-title" style="margin-bottom:10px">🏫 '+esc(d.school)+'</div>'+
      '<div class="cat-bar-row"><div class="cat-bar-label"><span>👩‍🎓 دانش‌آموز</span><span>'+d.student_count+'</span></div>'+
      '<div class="cat-bar-track"><div class="cat-bar-fill" style="width:'+Math.round(d.student_count/maxStudents*100)+'%;background:var(--sky)"></div></div></div>'+
      '<div class="cat-bar-row"><div class="cat-bar-label"><span>🏅 میانگین امتیاز</span><span>'+d.avg_points+'</span></div>'+
      '<div class="cat-bar-track"><div class="cat-bar-fill" style="width:'+Math.round(d.avg_points/maxPts*100)+'%;background:var(--mustard)"></div></div></div>'+
      '<div class="stat-grid" style="margin-top:10px">'+
        statBox(d.approved_submissions,'کار تأییدشده')+
        statBox(d.active_assignments,'تکلیف فعال')+
        statBox(d.avg_streak,'میانگین روز متوالی')+
      '</div></div>';
  });
  el.innerHTML = html;
}

/* ------------------------------------------------------------ گزارش رسمی قابل‌ارائه */
function openDistrictReport(){
  const data = window._districtData || [];
  if(!data.length){ showToast('آماری برای گزارش نیست'); return; }
  const ranked = data.map(d=>({...d, engagement: (Number(d.avg_points)||0) + (Number(d.avg_streak)||0)*3}))
    .sort((a,b)=>b.engagement-a.engagement);
  const totalStudents = data.reduce((a,b)=>a+Number(b.student_count||0),0);
  const totalApproved = data.reduce((a,b)=>a+Number(b.approved_submissions||0),0);
  const totalActive = data.reduce((a,b)=>a+Number(b.active_assignments||0),0);
  const today = new Date();
  const todayStr = toJalali(today.toISOString());

  let html = '<div class="report-doc">'+
    '<div class="report-head">'+
      '<div class="report-title">گزارش وضعیت سامانه‌ی آموزش و ارزیابی کار و فناوری</div>'+
      '<div class="report-sub">تاریخ تهیه‌ی گزارش: '+todayStr+'</div>'+
    '</div>'+
    '<div class="stat-grid" style="margin:16px 0">'+
      statBox(data.length,'مدرسه‌ی فعال')+
      statBox(totalStudents,'دانش‌آموز ثبت‌نامی')+
      statBox(totalApproved,'کار تأییدشده')+
      statBox(totalActive,'تکلیف فعال')+
    '</div>'+
    '<div class="sub-title" style="margin:14px 0 8px">رتبه‌بندی مدارس</div>'+
    '<table class="report-table"><thead><tr><th>رتبه</th><th>مدرسه</th><th>دانش‌آموز</th><th>میانگین امتیاز</th><th>کار تأییدشده</th><th>میانگین روز متوالی</th></tr></thead><tbody>'+
    ranked.map((d,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(d.school)+'</td><td>'+d.student_count+'</td><td>'+d.avg_points+'</td><td>'+d.approved_submissions+'</td><td>'+d.avg_streak+'</td></tr>').join('')+
    '</tbody></table>'+
    '<div class="report-note">این گزارش به‌صورت خودکار از داده‌های واقعی سامانه تولید شده و صرفاً شامل آمار تجمیعی است (بدون اطلاعات هویتی دانش‌آموزان).</div>'+
    '<button class="btn btn-thread btn-sm no-print" style="margin-top:14px" onclick="window.print()">🖨️ چاپ / ذخیره PDF</button>'+
  '</div>';
  $('districtReportBody').innerHTML = html;
  openModal('districtReportModalOv');
}

/* ------------------------------------------------------------ مدیریت کارکنان (نقش‌ها) — سلسله‌مراتبی */
/* هر نقش فقط می‌تواند نقش‌های پایین‌تر از خودش را بسازد:
   سوپرادمین → سوپرادمین + ادمین استان + ادمین شهرستان + مدیر مدرسه + معلم
   ادمین استان → ادمین شهرستان + مدیر مدرسه + معلم
   ادمین شهرستان → مدیر مدرسه + معلم                                      */
const CREATABLE_ROLES = {
  super_admin:    [['super_admin','سوپرادمین'],['province_admin','ادمین استان'],['county_admin','ادمین شهرستان'],['school_admin','مدیر مدرسه'],['teacher','معلم']],
  province_admin: [['county_admin','ادمین شهرستان'],['school_admin','مدیر مدرسه'],['teacher','معلم']],
  county_admin:   [['school_admin','مدیر مدرسه'],['teacher','معلم']],
};
async function loadStaffAdmin(){
  const el = $('tStaff');
  const role = myStaff ? myStaff.role : 'teacher';
  const roleOpts = CREATABLE_ROLES[role] || [];
  const { provinces, counties } = await loadRegionsCache();

  let html = '<div class="sec-title">🧑‍💼 افزودن / تغییر نقش کارمند</div>'+
    '<div class="pattern-card">'+
    '<div class="field"><label>ایمیل یا کد ملی حساب (باید قبلاً حساب براش ساخته شده باشد)</label><input id="stfEmail" placeholder="کد ملی یا ایمیل"></div>'+
    '<div class="field"><label>نام و نام خانوادگی</label><input id="stfName" placeholder="نام کارمند"></div>'+
    '<div class="field"><label>نقش</label><select id="stfRole" onchange="updateStaffFieldsWeb()">'+
      roleOpts.map(([v,l])=>'<option value="'+v+'">'+l+'</option>').join('')+
    '</select></div>'+
    '<div class="field" id="stfProvinceField"><label>استان</label><select id="stfProvince" onchange="document.getElementById(\'stfCounty\').innerHTML = countyOptionsHtml(_regionsCache.counties, this.value)">'+provinceOptionsHtml(provinces)+'</select></div>'+
    '<div class="field" id="stfCountyField"><label>شهرستان</label><select id="stfCounty" onchange="fillStfSchoolOptions()">'+countyOptionsHtml(counties,'')+'</select></div>'+
    '<div class="field" id="stfSchoolField"><label>مدرسه</label><select id="stfSchool"><option value="">— ابتدا شهرستان را انتخاب کنید —</option></select></div>'+
    '<div class="field-err" id="stfErr"></div>'+
    '<button class="btn btn-thread btn-sm" onclick="addStaff()">➕ افزودن / به‌روزرسانی نقش</button>'+
    '</div>'+
    '<div class="sec-title">لیست فعلی (در محدوده‌ی دسترسی شما)</div><div class="pattern-card" id="stfList">'+emptyState('⏳','در حال بارگذاری...','')+'</div>';
  el.innerHTML = html;
  updateStaffFieldsWeb();

  const { data, error } = await sb.rpc('get_scoped_staff');
  const roleLabel = {teacher:'معلم', school_admin:'مدیر مدرسه', county_admin:'ادمین شهرستان', province_admin:'ادمین استان', super_admin:'سوپرادمین'};
  const list = $('stfList');
  if(error || !data || !data.length){ list.innerHTML = emptyState('🧑‍💼','هنوز کارمندی (غیر از خودتون) ثبت نشده',''); return; }
  list.innerHTML = data.map(s=>{
    const scope = s.school_name || s.county_name || s.province_name || 'کل کشور';
    return '<div class="student-row"><span>'+esc(s.full_name)+' — '+(roleLabel[s.role]||s.role)+' · '+esc(scope)+'</span></div>';
  }).join('');
}
function updateStaffFieldsWeb(){
  const role = $('stfRole').value;
  $('stfProvinceField').classList.toggle('hidden', role==='super_admin');
  $('stfCountyField').classList.toggle('hidden', !['county_admin','school_admin','teacher'].includes(role));
  $('stfSchoolField').classList.toggle('hidden', !['school_admin','teacher'].includes(role));
}
async function fillStfSchoolOptions(){
  const sel = $('stfSchool');
  const countyId = $('stfCounty').value;
  if(!countyId){ sel.innerHTML = '<option value="">— ابتدا شهرستان را انتخاب کنید —</option>'; return; }
  const { data } = await sb.from('schools').select('id,name').eq('county_id', countyId).eq('status','approved').order('name');
  sel.innerHTML = '<option value="">— انتخاب کنید —</option>' + (data||[]).map(s=>'<option value="'+s.id+'">'+esc(s.name)+'</option>').join('');
}
async function addStaff(){
  const email = $('stfEmail').value.trim();
  const full_name = $('stfName').value.trim();
  const role = $('stfRole').value;
  $('stfErr').textContent='';
  if(!email || !full_name){ $('stfErr').textContent='ایمیل و نام رو کامل وارد کنید'; return; }
  if(role==='province_admin' && !$('stfProvince').value){ $('stfErr').textContent='استان رو انتخاب کنید'; return; }
  if(role==='county_admin' && !$('stfCounty').value){ $('stfErr').textContent='شهرستان رو انتخاب کنید'; return; }
  if(['school_admin','teacher'].includes(role) && !$('stfSchool').value){ $('stfErr').textContent='مدرسه رو انتخاب کنید'; return; }
  const params = { p_email: await resolveLoginIdentifier(email), p_full_name: full_name, p_role: role, p_school_id: null, p_county_id: null, p_province_id: null };
  if(role==='province_admin') params.p_province_id = Number($('stfProvince').value) || null;
  if(role==='county_admin') params.p_county_id = Number($('stfCounty').value) || null;
  if(['school_admin','teacher'].includes(role)) params.p_school_id = Number($('stfSchool').value) || null;
  const { error } = await sb.rpc('set_staff_role', params);
  if(error){ $('stfErr').textContent = 'خطا: '+error.message; return; }
  showToast('✅ ثبت شد');
  $('stfEmail').value=''; $('stfName').value='';
  loadStaffAdmin();
}

/* ================================================================ شروع برنامه */
