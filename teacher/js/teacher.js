/**
 * teacher.js — پنل مربی: بررسی کارها، مدیریت درس‌ها/تکالیف/دانش‌آموزان/
 * اطلاعیه‌ها، و آمار مدرسه.
 */

async function enterTeacherApp(){
  const { data:{ session } } = await sb.auth.getSession();
  if(!session) return;
  $('teEmail').textContent = session.user.email;
  goTo('teacherApp');
  await loadAllLessons();
  await loadMyStaffInfo(session.user.id);
  switchTeacherTab('tReview');
  refreshBadges();
}
async function refreshBadges(){
  const { count } = await sb.from('submissions').select('id', { count:'exact', head:true }).eq('status','pending');
  setBadge('badgeReview', count);

  const districtRoles = ['county_admin','province_admin','super_admin'];
  if(myStaff && districtRoles.includes(myStaff.role)){
    const { data } = await sb.rpc('get_pending_schools');
    setBadge('badgeSchools', data ? data.length : 0);
    const { data: reqs } = await sb.rpc('get_pending_role_requests');
    setBadge('badgeRoleRequests', reqs ? reqs.length : 0);
  }
}
function setBadge(id, n){
  const el = $(id); if(!el) return;
  if(n && n>0){ el.textContent = n>99?'99+':n; el.classList.remove('hidden'); }
  else { el.classList.add('hidden'); }
}
async function loadMyStaffInfo(uid){
  const { data } = await sb.from('staff').select('*').eq('id', uid).maybeSingle();
  myStaff = data; // اگه null باشه یعنی حساب قدیمی، دسترسی کامل (سازگاری با قبل)
  const districtRoles = ['county_admin','province_admin','super_admin'];
  const isDistrictLevel = !myStaff || districtRoles.includes(myStaff.role) || !myStaff.school;
  $('tabDistrict').classList.toggle('hidden', !isDistrictLevel);
  $('tabStaff').classList.toggle('hidden', !isDistrictLevel);
  $('tabRoleRequests').classList.toggle('hidden', !isDistrictLevel);
}
function switchTeacherTab(id){
  document.querySelectorAll('#teacherApp .tab').forEach(t=>t.classList.toggle('active', t.dataset.p===id));
  document.querySelectorAll('#teacherApp .panel').forEach(p=>p.classList.toggle('active', p.id===id));
  if(id==='tReview') loadReview();
  if(id==='tLessons') renderLessonsAdmin();
  if(id==='tAssign') loadAssignmentsAdmin();
  if(id==='tStudents') loadStudentsAdmin();
  if(id==='tAddStudent') loadAddStudentPanel();
  if(id==='tSchools') loadSchoolsPanel();
  if(id==='tAnn') loadAnnouncementsAdmin();
  if(id==='tStats') loadStats();
  if(id==='tDistrict') loadDistrictDashboard();
  if(id==='tRoleRequests') loadRoleRequestsPanel();
  if(id==='tStaff') loadStaffAdmin();
}

/* ------------------------------------------------------------ بررسی کارها */
async function loadReview(){
  const el = $('tReview');
  el.innerHTML = '<div class="filter-row">'+
    '<select id="rvStatus" onchange="loadReview()">'+
      '<option value="pending">در انتظار بررسی</option><option value="approved">تأییدشده</option>'+
      '<option value="needs_fix">نیاز به اصلاح</option><option value="rejected">ردشده</option><option value="all">همه</option>'+
    '</select></div><div id="rvList"></div>';
  const status = $('rvStatus').value;
  let q = sb.from('submissions').select('*, students(full_name, school, grade), lessons(unit_title), assignments(title)').order('created_at',{ascending:false});
  if(status!=='all') q = q.eq('status', status);
  const { data, error } = await q;
  teacherAllSubs = data||[];
  const list = $('rvList');
  if(error || !data || !data.length){ list.innerHTML = emptyState('🗂️','چیزی برای نمایش نیست',''); return; }
  list.innerHTML = data.map(s=>{
    const st = s.students||{}; const ls = s.lessons||{}; const asg = s.assignments||{};
    return '<div class="pattern-card">'+
      '<div class="sub-card-head"><div><div class="sub-title">'+(asg.title?'📅 ':'')+esc(s.title)+'</div>'+
      '<div class="sub-lesson">'+esc(st.full_name||'؟')+' — '+esc(st.school||'')+' · پایه '+({7:'هفتم',8:'هشتم',9:'نهم'}[st.grade]||'؟')+
      (ls.unit_title? ' · '+esc(ls.unit_title):'')+(asg.title? ' · تکلیف: '+esc(asg.title):'')+'</div></div>'+
      '<span class="pill pill-'+s.status+'">'+STATUS_LABEL[s.status]+'</span></div>'+
      (s.description? '<div class="sub-desc">'+esc(s.description)+'</div>':'')+
      designReflectionHtml(s.design_reflection)+
      ecoFriendlyHtml(s.is_eco_friendly, s.eco_note)+
      fileLinkOrImg(s.file_url)+
      '<div class="rev-controls">'+
        '<select id="rvSt_'+s.id+'">'+Object.keys(STATUS_LABEL).map(k=>'<option value="'+k+'" '+(k===s.status?'selected':'')+'>'+STATUS_LABEL[k]+'</option>').join('')+'</select>'+
        '<input type="number" id="rvPts_'+s.id+'" placeholder="امتیاز" value="'+(s.points_awarded||0)+'">'+
        '<textarea id="rvNote_'+s.id+'" placeholder="یادداشت برای دانش‌آموز (اختیاری)">'+esc(s.teacher_note||'')+'</textarea>'+
        '<label class="chk-row"><input type="checkbox" id="rvPub_'+s.id+'" '+(s.is_public?'checked':'')+' style="width:auto"> نمایش در گالری عمومی</label>'+
        '<div class="save-row"><button class="btn btn-sage btn-sm btn-block" onclick="saveReview(\''+s.id+'\')">💾 ذخیره بررسی</button></div>'+
      '</div></div>';
  }).join('');
}
async function saveReview(id){
  const status = $('rvSt_'+id).value;
  const points_awarded = parseInt($('rvPts_'+id).value)||0;
  const teacher_note = $('rvNote_'+id).value.trim() || null;
  const is_public = $('rvPub_'+id).checked;
  const { data:{session} } = await sb.auth.getSession();
  const { error } = await sb.from('submissions').update({
    status, points_awarded, teacher_note, is_public,
    reviewed_at: new Date().toISOString(), reviewed_by: session?session.user.email:null,
    seen_by_student: false
  }).eq('id', id);
  if(error){ showToast('❌ خطا در ذخیره'); console.error(error); return; }
  showToast('✅ بررسی ذخیره شد');
  loadReview();
  refreshBadges();
}

/* ------------------------------------------------------------ مدیریت آموزش‌ها (مربی) */
async function loadAllLessons(){
  const { data, error } = await sb.from('lessons').select('*').order('grade').order('order_index');
  lessons = error? [] : data;
}
function renderLessonsAdmin(){
  const el = $('tLessons');
  let html = '<button class="btn btn-thread btn-sm" style="margin-bottom:14px" onclick="openLessonModal(null)">➕ درس جدید</button>';

  const drafts = lessons.filter(l=>l.is_alternative);
  if(drafts.length){
    html += '<div class="sec-title">📦 پیشنهادهای جایگزین (پیش‌نویس — هنوز به دانش‌آموزها نشون داده نمی‌شن)</div>';
    drafts.forEach(l=>{
      html += '<div class="pattern-card draft-card"><div class="lesson-admin-row">'+
        '<div><div class="sub-title">'+esc(l.unit_title)+'</div>'+
        '<div class="sub-lesson">پیشنهاد برای پایه '+({7:'هفتم',8:'هشتم',9:'نهم'}[l.grade])+' — می‌تونه جایگزین یکی از پودمان‌های نیمه‌تجویزی همون پایه بشه</div></div>'+
        '<div class="lbtns"><button class="btn btn-ghost btn-sm" onclick="openLessonModal(\''+l.id+'\')">👁</button>'+
        '<button class="btn btn-sage btn-sm" onclick="activateDraftLesson(\''+l.id+'\')">✅ فعال‌سازی</button></div></div></div>';
    });
  }

  GRADES.forEach(g=>{
    const gl = lessons.filter(l=>l.grade===g && !l.is_alternative);
    html += '<div class="section-title">پایه '+({7:'هفتم',8:'هشتم',9:'نهم'}[g])+'</div>';
    if(!gl.length){ html += emptyState('📚','درسی ثبت نشده',''); }
    gl.forEach(l=>{
      html += '<div class="pattern-card"><div class="lesson-admin-row">'+
        '<div><div class="sub-title">'+esc(l.unit_title)+' '+(l.is_prescribed?'<span class="presc-badge presc-yes">تجویزی</span>':'<span class="presc-badge presc-no">قابل‌جایگزینی</span>')+'</div>'+
        '<div class="sub-lesson">ترتیب: '+l.order_index+' · '+(l.is_published?'✅ نمایش‌داده‌شده':'🚫 آرشیوشده')+'</div></div>'+
        '<div class="lbtns"><button class="btn btn-ghost btn-sm" onclick="openLessonModal(\''+l.id+'\')">✏️</button>'+
        '<button class="btn btn-ghost btn-sm" onclick="duplicateLesson(\''+l.id+'\')">📋</button>'+
        '<button class="btn btn-sky btn-sm" onclick="toggleArchiveLesson(\''+l.id+'\')">'+(l.is_published?'🗄️':'♻️')+'</button>'+
        '<button class="btn btn-brick btn-sm" onclick="deleteLesson(\''+l.id+'\')">🗑️</button></div></div></div>';
    });
  });
  el.innerHTML = html;
}
async function activateDraftLesson(id){
  if(!confirm('این پودمان برای دانش‌آموزها فعال و قابل‌مشاهده بشه؟ (می‌تونید بعداً یکی از پودمان‌های قدیمی رو آرشیو کنید)')) return;
  const { error } = await sb.from('lessons').update({ is_published: true, is_alternative: false }).eq('id', id);
  if(error){ showToast('❌ خطا'); return; }
  showToast('✅ فعال شد و برای دانش‌آموزها نمایش داده می‌شه');
  await loadAllLessons(); renderLessonsAdmin();
}
async function duplicateLesson(id){
  const l = lessons.find(x=>x.id===id); if(!l) return;
  const payload = {
    grade: l.grade, unit_title: l.unit_title+' (کپی)', order_index: l.order_index,
    content_text: l.content_text, advanced_text: l.advanced_text, video_url: l.video_url,
    pdf_url: l.pdf_url, sample_image_url: l.sample_image_url, is_published: false,
    is_prescribed: l.is_prescribed, quiz_json: l.quiz_json, quiz_points: l.quiz_points, games_json: l.games_json, careers_json: l.careers_json
  };
  const { data, error } = await sb.from('lessons').insert(payload).select().single();
  if(error){ showToast('❌ خطا در کپی'); console.error(error); return; }
  showToast('📋 کپی شد — الان می‌تونید ویرایشش کنید');
  await loadAllLessons(); renderLessonsAdmin();
  openLessonModal(data.id);
}
async function toggleArchiveLesson(id){
  const l = lessons.find(x=>x.id===id); if(!l) return;
  const next = !l.is_published;
  const msg = next? 'این درس دوباره برای دانش‌آموزها فعال بشه؟' : 'این درس آرشیو (پنهان) بشه؟ دیتاش حذف نمی‌شه و هر وقت خواستید می‌تونید برش گردونید.';
  if(!confirm(msg)) return;
  const { error } = await sb.from('lessons').update({ is_published: next }).eq('id', id);
  if(error){ showToast('❌ خطا'); return; }
  showToast(next? '♻️ دوباره فعال شد' : '🗄️ آرشیو شد');
  await loadAllLessons(); renderLessonsAdmin();
}
function openLessonModal(id){
  lmPdfB64=null; lmImgB64=null;
  $('lmErr').textContent='';
  $('lmPdfDrop').textContent='📄 انتخاب فایل PDF'; $('lmPdfDrop').classList.remove('has-file'); $('lmPdfFile').value='';
  $('lmImgDrop').textContent='🖼️ انتخاب تصویر'; $('lmImgDrop').classList.remove('has-file'); $('lmImgFile').value='';
  $('lmImgPreview').style.display='none';
  if(id){
    const l = lessons.find(x=>x.id===id);
    $('lmTitle').textContent='✏️ ویرایش درس';
    $('lmId').value=l.id; $('lmGrade').value=l.grade; $('lmUnitTitle').value=l.unit_title;
    $('lmOrder').value=l.order_index; $('lmContent').value=l.content_text||'';
    $('lmAdvanced').value=l.advanced_text||'';
    $('lmVideo').value=l.video_url||''; $('lmPublished').checked=l.is_published;
    $('lmPrescribed').checked = l.is_prescribed!==false;
    $('lmHomeMaterials').value = l.home_materials||'';
    $('lmAdultHelp').checked = !!l.needs_adult_help;
    $('lmSafetyNote').value = l.safety_note||'';
    $('lmSaferAlt').value = l.safer_alternative||'';
    $('lmLearningMethod').value = l.learning_method||'';
    $('lmQuiz').value = quizJsonToLines(l.quiz_json); $('lmQuizPoints').value = l.quiz_points||10;
    $('lmGames').value = l.games_json ? (typeof l.games_json==='string'? l.games_json : JSON.stringify(l.games_json, null, 2)) : '';
    $('lmCareers').value = l.careers_json ? (typeof l.careers_json==='string'? l.careers_json : JSON.stringify(l.careers_json, null, 2)) : '';
    if(l.game_type && GAME_LABELS[l.game_type]){
      $('lmGameNote').style.display='block';
      $('lmGameNote').innerHTML = '⚡ این درس یه بازی اختصاصی طراحی‌شده داره: «'+GAME_LABELS[l.game_type]+'». تا وقتی این بازی فعاله، سؤال‌های چهارگزینه‌ای زیر (حتی اگر پر باشن) نمایش داده نمی‌شن.';
    } else { $('lmGameNote').style.display='none'; }
    lmPdfB64 = l.pdf_url||null; lmImgB64 = l.sample_image_url||null;
    if(l.pdf_url){ $('lmPdfDrop').textContent='✅ فایل PDF موجود (برای تغییر دوباره انتخاب کنید)'; $('lmPdfDrop').classList.add('has-file'); }
    if(l.sample_image_url){ $('lmImgPreview').src=l.sample_image_url; $('lmImgPreview').style.display='block'; }
  } else {
    $('lmTitle').textContent='➕ درس جدید';
    $('lmId').value=''; $('lmGrade').value='7'; $('lmUnitTitle').value=''; $('lmOrder').value=(lessons.length+1);
    $('lmContent').value=''; $('lmAdvanced').value=''; $('lmVideo').value=''; $('lmPublished').checked=true;
    $('lmPrescribed').checked=true;
    $('lmHomeMaterials').value=''; $('lmAdultHelp').checked=false; $('lmSafetyNote').value=''; $('lmSaferAlt').value=''; $('lmLearningMethod').value='';
    $('lmQuiz').value=''; $('lmQuizPoints').value=10; $('lmGames').value=''; $('lmCareers').value='';
  }
  openModal('lessonModalOv');
}
async function onLessonFileChange(kind){
  if(kind==='pdf'){
    const f = $('lmPdfFile').files[0]; if(!f) return;
    const b64 = await fileToBase64(f);
    lmPdfB64 = await uploadToStorage('lesson-files', b64, 'pdf').catch(e=>{ showToast('❌ خطا در آپلود PDF'); return null; });
    if(lmPdfB64){ $('lmPdfDrop').textContent='✅ '+f.name; $('lmPdfDrop').classList.add('has-file'); }
  } else {
    const f = $('lmImgFile').files[0]; if(!f) return;
    const b64 = await fileToBase64(f);
    const ext = extOf(f.name,'jpg');
    lmImgB64 = await uploadToStorage('lesson-files', b64, ext).catch(e=>{ showToast('❌ خطا در آپلود تصویر'); return null; });
    if(lmImgB64){ $('lmImgPreview').src=lmImgB64; $('lmImgPreview').style.display='block'; $('lmImgDrop').textContent='✅ '+f.name; $('lmImgDrop').classList.add('has-file'); }
  }
}
async function saveLesson(){
  const unit_title = $('lmUnitTitle').value.trim();
  if(!unit_title){ $('lmErr').textContent='عنوان درس را بنویسید'; return; }
  $('lmBtn').disabled=true; $('lmBtn').innerHTML='<span class="spinner"></span> در حال ذخیره...';
  const payload = {
    grade: parseInt($('lmGrade').value), unit_title,
    order_index: parseInt($('lmOrder').value)||0,
    content_text: $('lmContent').value.trim()||null,
    advanced_text: $('lmAdvanced').value.trim()||null,
    video_url: $('lmVideo').value.trim()||null,
    pdf_url: lmPdfB64||null, sample_image_url: lmImgB64||null,
    is_published: $('lmPublished').checked, updated_at: new Date().toISOString(),
    is_prescribed: $('lmPrescribed').checked,
    home_materials: $('lmHomeMaterials').value.trim()||null,
    needs_adult_help: $('lmAdultHelp').checked,
    safety_note: $('lmSafetyNote').value.trim()||null,
    safer_alternative: $('lmSaferAlt').value.trim()||null,
    learning_method: $('lmLearningMethod').value.trim()||null,
    quiz_json: linesToQuizJson($('lmQuiz').value), quiz_points: parseInt($('lmQuizPoints').value)||10
  };
  const gamesRaw = $('lmGames').value.trim();
  if(gamesRaw){
    try{ payload.games_json = JSON.parse(gamesRaw); }
    catch(e){ $('lmBtn').disabled=false; $('lmBtn').textContent='ذخیره درس'; $('lmErr').textContent='فرمت JSON بازی‌های عمومی درست نیست'; return; }
  } else { payload.games_json = null; }
  const careersRaw = $('lmCareers').value.trim();
  if(careersRaw){
    try{ payload.careers_json = JSON.parse(careersRaw); }
    catch(e){ $('lmBtn').disabled=false; $('lmBtn').textContent='ذخیره درس'; $('lmErr').textContent='فرمت JSON شغل‌های مرتبط درست نیست'; return; }
  } else { payload.careers_json = null; }
  const id = $('lmId').value;
  const { error } = id ? await sb.from('lessons').update(payload).eq('id',id) : await sb.from('lessons').insert(payload);
  $('lmBtn').disabled=false; $('lmBtn').textContent='ذخیره درس';
  if(error){ $('lmErr').textContent='خطا در ذخیره'; console.error(error); return; }
  closeModal('lessonModalOv');
  showToast('✅ درس ذخیره شد');
  await loadAllLessons(); renderLessonsAdmin();
}
async function deleteLesson(id){
  if(!confirm('⚠️ این درس برای همیشه حذف می‌شه (کارهای آپلودشده‌ی مرتبط باهاش می‌مونن ولی لینکشون به این درس قطع می‌شه). اگه فقط می‌خواید موقتاً پنهانش کنید، به‌جاش از دکمه‌ی 🗄️ آرشیو استفاده کنید. مطمئنید؟')) return;
  const { error } = await sb.from('lessons').delete().eq('id', id);
  if(error){ showToast('❌ خطا در حذف'); return; }
  showToast('🗑️ حذف شد'); await loadAllLessons(); renderLessonsAdmin();
}

/* ------------------------------------------------------------ تکالیف هفتگی (مربی) */
async function loadAssignmentsAdmin(){
  const el = $('tAssign');
  const { data, error } = await sb.from('assignments').select('*').order('created_at',{ascending:false});
  const list = error? [] : (data||[]);
  let html = '<button class="btn btn-thread btn-sm" style="margin-bottom:14px" onclick="openAssignmentModal(null)">➕ تکلیف جدید</button>';
  if(!list.length){ html += emptyState('📅','هنوز تکلیفی ثبت نشده',''); }
  list.forEach(a=>{
    html += '<div class="pattern-card"><div class="lesson-admin-row">'+
      '<div><div class="sub-title">'+(a.is_open_challenge?(a.challenge_type==='company'?'💼 ':'🎨 '):'')+esc(a.title)+'</div>'+
      '<div class="sub-lesson">'+(a.grade?'پایه '+({7:'هفتم',8:'هشتم',9:'نهم'}[a.grade]):'همه‌ی پایه‌ها')+' · '+(a.school?esc(a.school):'هر دو مدرسه')+
      (a.due_date? ' · مهلت: '+toJalali(a.due_date):'')+' · '+(a.is_active?'✅ فعال':'🚫 غیرفعال')+(a.is_open_challenge?(a.challenge_type==='company'?' · 💼 شرکت مصغر':' · 🎨 چالش باز'):'')+'</div></div>'+
      '<div class="lbtns"><button class="btn btn-ghost btn-sm" onclick="openAssignmentModal(\''+a.id+'\')">✏️</button>'+
      '<button class="btn btn-brick btn-sm" onclick="deleteAssignment(\''+a.id+'\')">🗑️</button></div></div></div>';
  });
  el.innerHTML = html;
  window._assignAdminList = list;
}
function openAssignmentModal(id){
  $('amErr').textContent='';
  if(id){
    const a = (window._assignAdminList||[]).find(x=>x.id===id);
    $('amTitle').textContent='✏️ ویرایش تکلیف';
    $('amId').value=a.id; $('amTitleInput').value=a.title; $('amDesc').value=a.description||'';
    $('amGrade').value=a.grade||''; $('amSchool').value=a.school||'';
    $('amDue').value=a.due_date||''; $('amPoints').value=a.points_hint;
    $('amActive').checked=a.is_active;
    $('amChallenge').checked = !!a.is_open_challenge;
    $('amChallengeType').value = a.challenge_type || 'design';
    $('amChallengeTypeField').classList.toggle('hidden', !a.is_open_challenge);
  } else {
    $('amTitle').textContent='➕ تکلیف جدید';
    $('amId').value=''; $('amTitleInput').value=''; $('amDesc').value='';
    $('amGrade').value=''; $('amSchool').value=''; $('amDue').value=''; $('amPoints').value=10; $('amActive').checked=true;
    $('amChallenge').checked=false;
    $('amChallengeType').value='design'; $('amChallengeTypeField').classList.add('hidden');
  }
  openModal('assignModalOv');
}
async function saveAssignment(){
  const title = $('amTitleInput').value.trim();
  if(!title){ $('amErr').textContent='عنوان تکلیف را بنویسید'; return; }
  const payload = {
    title, description: $('amDesc').value.trim()||null,
    grade: $('amGrade').value?parseInt($('amGrade').value):null,
    school: $('amSchool').value||null,
    due_date: $('amDue').value||null,
    points_hint: parseInt($('amPoints').value)||10,
    is_active: $('amActive').checked,
    is_open_challenge: $('amChallenge').checked,
    challenge_type: $('amChallengeType').value
  };
  const id = $('amId').value;
  const { error } = id ? await sb.from('assignments').update(payload).eq('id',id) : await sb.from('assignments').insert(payload);
  if(error){ $('amErr').textContent='خطا در ذخیره'; console.error(error); return; }
  closeModal('assignModalOv'); showToast('✅ تکلیف ذخیره شد'); loadAssignmentsAdmin();
}
async function deleteAssignment(id){
  if(!confirm('این تکلیف حذف بشه؟')) return;
  const { error } = await sb.from('assignments').delete().eq('id', id);
  if(error){ showToast('❌ خطا در حذف'); return; }
  showToast('🗑️ حذف شد'); loadAssignmentsAdmin();
}

/* ------------------------------------------------------------ دانش‌آموزان (مربی) */
async function loadStudentsAdmin(){
  const el = $('tStudents');
  el.innerHTML = '<div class="filter-row">'+
    '<select id="stuSchool" onchange="loadStudentsAdmin()"><option value="">همه مدارس</option>'+SCHOOLS.map(s=>'<option value="'+s+'">'+s+'</option>').join('')+'</select>'+
    '<select id="stuGrade" onchange="loadStudentsAdmin()"><option value="">همه پایه‌ها</option>'+GRADES.map(g=>'<option value="'+g+'">پایه '+({7:'هفتم',8:'هشتم',9:'نهم'}[g])+'</option>').join('')+'</select>'+
    '</div><div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">'+
      '<button class="btn btn-sky btn-sm" onclick="exportStudentsCSV()">📊 خروجی لیست (CSV)</button>'+
      '<button class="btn btn-thread btn-sm" onclick="exportGradebookCSV()">🗂️ خروجی کارنامه‌ی کامل (CSV)</button>'+
    '</div>'+
    '<div class="pattern-card" id="stuList"></div>';
  let q = sb.from('students').select('*').order('full_name');
  if($('stuSchool').value) q = q.eq('school', $('stuSchool').value);
  if($('stuGrade').value) q = q.eq('grade', parseInt($('stuGrade').value));
  const { data, error } = await q;
  window._stuAdminList = data||[];
  const list = $('stuList');
  if(error || !data || !data.length){ list.outerHTML = emptyState('👩‍🎓','دانش‌آموزی یافت نشد',''); return; }
  const canDelete = myStaff && ['school_admin','county_admin','province_admin','super_admin'].includes(myStaff.role);
  list.innerHTML = data.map(s=>'<div class="student-row"><span>'+esc(s.full_name)+' — '+esc(s.school)+' · پایه '+({7:'هفتم',8:'هشتم',9:'نهم'}[s.grade])+(s.class_name?(' · کلاس '+esc(s.class_name)):'')+(s.streak>0?(' · 🔥'+s.streak):'')+'</span>'+
    '<span style="display:flex;align-items:center;gap:8px"><span class="pts-badge">'+s.points+' امتیاز</span>'+
    '<button class="btn btn-ghost btn-sm" onclick="resetStudentPin(\''+s.id+'\',\''+esc(s.full_name).replace(/'/g,"\\'")+'\')">🔑 ریست پین</button>'+
    '<button class="btn btn-ghost btn-sm" onclick="openReportCard(\''+s.id+'\')">🗂️ کارنامه</button>'+
    (canDelete ? '<button class="btn btn-ghost btn-sm" style="color:var(--brick)" onclick="deleteStudent(\''+s.id+'\',\''+esc(s.full_name).replace(/'/g,"\\'")+'\')">🗑️</button>' : '')+
    '</span></div>').join('');
}
async function deleteStudent(studentId, studentName){
  if(!confirm('حساب «'+studentName+'» کاملاً حذف بشه؟ همه‌ی کارها و امتیازاتش هم پاک می‌شه. این کار برگشت‌ناپذیره.')) return;
  if(!confirm('مطمئنی؟ این آخرین هشداره — «'+studentName+'» برای همیشه حذف می‌شه.')) return;
  const { error } = await sb.rpc('delete_student_account', { p_student_id: studentId });
  if(error){ showToast('خطا: '+error.message); return; }
  showToast('🗑️ حساب حذف شد');
  loadStudentsAdmin();
}
async function resetStudentPin(studentId, studentName){
  if(!confirm('پین «'+studentName+'» ریست بشه؟ پین قبلی‌ش دیگه کار نمی‌کنه.')) return;
  const { data: pin, error } = await sb.rpc('staff_reset_student_pin', { p_student_id: studentId });
  if(error){ showToast('خطا: '+error.message); return; }
  alert('پین جدید «'+studentName+'»: '+pin+'\n\nاینو یادداشت کن و به دانش‌آموز بده.');
}
function exportStudentsCSV(){
  const rows = window._stuAdminList || [];
  if(!rows.length){ showToast('چیزی برای خروجی نیست'); return; }
  const header = ['نام و نام خانوادگی','مدرسه','پایه','کلاس','شماره موبایل','امتیاز','روز متوالی'];
  const gradeFa = {7:'هفتم',8:'هشتم',9:'نهم'};
  const lines = [header.join(',')];
  rows.forEach(s=>{
    const vals = [s.full_name, s.school, gradeFa[s.grade]||s.grade, s.class_name||'', s.phone, s.points, s.streak||0];
    lines.push(vals.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(','));
  });
  downloadCSV(lines, 'karvfan-students-'+(new Date().toISOString().slice(0,10))+'.csv');
}
function downloadCSV(lines, filename){
  const csv = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
async function exportGradebookCSV(){
  const rows = window._stuAdminList || [];
  if(!rows.length){ showToast('چیزی برای خروجی نیست'); return; }
  showToast('⏳ در حال آماده‌سازی کارنامه‌ها...');
  const cats = Object.keys(CATEGORY_META);
  const gradeFa = {7:'هفتم',8:'هشتم',9:'نهم'};
  const header = ['نام و نام خانوادگی','مدرسه','پایه','کلاس','امتیاز کل','روز متوالی','کار تأییدشده', ...cats];
  const lines = [header.join(',')];

  const results = await Promise.all(rows.map(async s=>{
    const [{data:subs}, {data:quizzes}] = await Promise.all([
      sb.from('submissions').select('points_awarded, lessons(category)').eq('student_id', s.id).eq('status','approved'),
      sb.from('quiz_attempts').select('points_awarded, lessons(category)').eq('student_id', s.id)
    ]);
    const catMap = {}; cats.forEach(c=>catMap[c]=0);
    (subs||[]).forEach(x=>{ const c=x.lessons&&x.lessons.category; if(c && catMap[c]!=null) catMap[c]+=x.points_awarded||0; });
    (quizzes||[]).forEach(x=>{ const c=x.lessons&&x.lessons.category; if(c && catMap[c]!=null) catMap[c]+=x.points_awarded||0; });
    return { s, catMap, approvedCount: (subs||[]).length };
  }));

  results.forEach(({s, catMap, approvedCount})=>{
    const vals = [s.full_name, s.school, gradeFa[s.grade]||s.grade, s.class_name||'', s.points, s.streak||0, approvedCount, ...cats.map(c=>catMap[c])];
    lines.push(vals.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(','));
  });
  downloadCSV(lines, 'karvfan-gradebook-'+(new Date().toISOString().slice(0,10))+'.csv');
  showToast('✅ خروجی کارنامه آماده شد');
}

/* ------------------------------------------------------------ کارنامه‌ی دانش‌آموز (مربی) */
function printCurrentReportCertificate(){
  if(window._currentReportStudent) openCertificate(window._currentReportStudent);
}
async function openReportCard(studentId){
  $('reportBody').innerHTML = '<div class="empty-state"><div class="ic">⏳</div><div class="d">در حال بارگذاری...</div></div>';
  openModal('reportModalOv');
  const [{data:st}, {data:subs}, {data:quizzes}, {data:interest}] = await Promise.all([
    sb.from('students').select('*').eq('id', studentId).single(),
    sb.from('submissions').select('*, lessons(unit_title, category)').eq('student_id', studentId).eq('status','approved'),
    sb.from('quiz_attempts').select('*, lessons(unit_title, category)').eq('student_id', studentId),
    sb.from('interest_quiz_results').select('*').eq('student_id', studentId).order('taken_at',{ascending:false}).limit(1)
  ]);
  if(!st){ $('reportBody').innerHTML = emptyState('❌','دانش‌آموز پیدا نشد',''); return; }
  $('reportTitle').textContent = '🗂️ کارنامه‌ی '+st.full_name;

  const catMap = {}; Object.keys(CATEGORY_META).forEach(c=>catMap[c]=0);
  (subs||[]).forEach(s=>{ const c=s.lessons&&s.lessons.category; if(c && catMap[c]!=null) catMap[c]+=s.points_awarded||0; });
  (quizzes||[]).forEach(q=>{ const c=q.lessons&&q.lessons.category; if(c && catMap[c]!=null) catMap[c]+=q.points_awarded||0; });
  const maxVal = Math.max(1, ...Object.values(catMap));

  let html = '<div class="pattern-card"><div class="sub-desc">'+esc(st.school)+' · پایه '+({7:'هفتم',8:'هشتم',9:'نهم'}[st.grade])+(st.class_name?(' · کلاس '+esc(st.class_name)):'')+' · مجموع امتیاز: '+st.points+'</div>'+
    '<button class="btn btn-thread btn-sm" style="margin-top:10px" onclick="printCurrentReportCertificate()">🏆 چاپ گواهی</button>'+
    '</div>';
  window._currentReportStudent = st;

  html += '<div class="sec-title">🧭 نقاط قوت</div><div class="pattern-card">';
  Object.keys(CATEGORY_META).forEach(cat=>{
    const meta = CATEGORY_META[cat]; const val = catMap[cat]; const pct = Math.round((val/maxVal)*100);
    html += '<div class="cat-bar-row"><div class="cat-bar-label"><span>'+meta.icon+' '+cat+'</span><span>'+val+'</span></div>'+
      '<div class="cat-bar-track"><div class="cat-bar-fill" style="width:'+pct+'%;background:'+meta.color+'"></div></div></div>';
  });
  html += '</div>';

  html += '<div class="sec-title">🏅 نشان‌ها</div><div class="pattern-card"><div class="badge-grid">';
  Object.keys(CATEGORY_META).forEach(cat=>{
    const meta = CATEGORY_META[cat]; const earned = catMap[cat] >= BADGE_THRESHOLD;
    html += '<div class="badge-card '+(earned?'':'locked')+'"><div class="badge-emoji">'+meta.icon+'</div><div class="badge-name">'+meta.badge+'</div></div>';
  });
  html += '</div></div>';

  if(interest && interest.length){
    html += '<div class="sec-title">🎯 آزمون علاقه‌سنجی</div><div class="pattern-card"><div class="sub-desc">آخرین نتیجه ('+toJalali(interest[0].taken_at)+'): <b>'+esc(interest[0].top_category)+'</b></div></div>';
  }

  const withImg = (subs||[]).filter(s=>s.file_url && /\.(jpg|jpeg|png|webp|gif)$/i.test(s.file_url));
  if(withImg.length){
    html += '<div class="sec-title">🖼️ نمونه‌کارها</div><div class="pattern-card"><div class="badge-grid">';
    withImg.slice(0,8).forEach(s=>{ html += '<img class="sample-img" style="border-radius:10px" src="'+esc(s.file_url)+'">'; });
    html += '</div></div>';
  }

  html += '<button class="btn btn-thread btn-sm no-print" style="margin-top:10px" onclick="window.print()">🖨️ چاپ / ذخیره PDF</button>';
  $('reportBody').innerHTML = html;
}

/* ------------------------------------------------------------ اطلاعیه‌ها (مربی) */
async function loadAnnouncementsAdmin(){
  const el = $('tAnn');
  el.innerHTML = '<button class="btn btn-thread btn-sm" style="margin-bottom:14px" onclick="openModal(\'annModalOv\')">➕ اطلاعیه جدید</button><div id="anList"></div>';
  const { data, error } = await sb.from('announcements').select('*').order('created_at',{ascending:false});
  const list = $('anList');
  if(error || !data || !data.length){ list.innerHTML = emptyState('📢','اطلاعیه‌ای ثبت نشده',''); return; }
  list.innerHTML = data.map(a=>'<div class="pattern-card ann-card"><div class="sub-card-head"><div><div class="ann-title">'+esc(a.title)+'</div>'+
    '<div class="sub-lesson">'+(a.school||'هر دو مدرسه')+' · '+(a.grade?('پایه '+({7:'هفتم',8:'هشتم',9:'نهم'}[a.grade])):'همه پایه‌ها')+'</div></div>'+
    '<button class="btn btn-brick btn-sm" onclick="deleteAnnouncement(\''+a.id+'\')">🗑️</button></div>'+
    (a.body?'<div class="ann-body">'+esc(a.body)+'</div>':'')+'<div class="ann-date">'+toJalali(a.created_at)+'</div></div>').join('');
}
async function saveAnnouncement(){
  const title = $('anTitle').value.trim();
  if(!title){ $('anErr').textContent='عنوان را بنویسید'; return; }
  const { error } = await sb.from('announcements').insert({
    title, body: $('anBody').value.trim()||null,
    school: $('anSchool').value||null, grade: $('anGrade').value?parseInt($('anGrade').value):null
  });
  if(error){ $('anErr').textContent='خطا در ثبت'; return; }
  $('anTitle').value=''; $('anBody').value=''; $('anErr').textContent='';
  closeModal('annModalOv'); showToast('✅ اطلاعیه منتشر شد'); loadAnnouncementsAdmin();
}
async function deleteAnnouncement(id){
  if(!confirm('این اطلاعیه حذف بشه؟')) return;
  await sb.from('announcements').delete().eq('id', id);
  showToast('🗑️ حذف شد'); loadAnnouncementsAdmin();
}

/* ------------------------------------------------------------ آمار (مربی) */
async function renderSubmissionTrendChart(){
  const days = 14;
  const since = new Date(); since.setDate(since.getDate() - (days-1)); since.setHours(0,0,0,0);
  const { data } = await sb.from('submissions').select('created_at').gte('created_at', since.toISOString());
  const counts = {}; const labels = [];
  for(let i=0;i<days;i++){
    const d = new Date(since); d.setDate(d.getDate()+i);
    const key = d.toISOString().slice(0,10);
    counts[key] = 0;
    labels.push(String(d.getDate()));
  }
  (data||[]).forEach(s=>{ const key = s.created_at.slice(0,10); if(counts[key]!=null) counts[key]++; });
  renderBarChart('trendChartBox', labels, Object.values(counts), { color:'#356f8f' });
}
async function loadStats(){
  const el = $('tStats');
  el.innerHTML = emptyState('⏳','در حال بارگذاری آمار...','');
  const [{count:studentCount}, {count:pendingCount}, {count:approvedCount}, {count:lessonCount}] = await Promise.all([
    sb.from('students').select('*', {count:'exact', head:true}),
    sb.from('submissions').select('*', {count:'exact', head:true}).eq('status','pending'),
    sb.from('submissions').select('*', {count:'exact', head:true}).eq('status','approved'),
    sb.from('lessons').select('*', {count:'exact', head:true})
  ]);
  let html = '<div class="stat-grid">'+
    statBox(studentCount,'دانش‌آموز ثبت‌نامی')+
    statBox(pendingCount,'کار در انتظار بررسی')+
    statBox(approvedCount,'کار تأییدشده')+
    statBox(lessonCount,'درس ثبت‌شده')+
    '</div>';
  html += '<div class="section-title">📈 روند ارسال کار (۱۴ روز اخیر)</div><div class="pattern-card" id="trendChartBox"></div>';
  html += '<div class="section-title">📌 وضعیت بر اساس مدرسه و پایه</div><div class="pattern-card" id="statsBySchool"></div>';
  el.innerHTML = html;
  renderSubmissionTrendChart();
  const { data:studs } = await sb.from('students').select('school, grade, points');
  const box = $('statsBySchool');
  if(!studs || !studs.length){ box.innerHTML = '<div class="empty-state"><div class="d">هنوز دانش‌آموزی ثبت‌نام نکرده</div></div>'; return; }
  let rows='';
  SCHOOLS.forEach(sc=>{ GRADES.forEach(g=>{
    const grp = studs.filter(s=>s.school===sc && s.grade===g);
    if(!grp.length) return;
    const pts = grp.reduce((a,b)=>a+(b.points||0),0);
    rows += '<div class="student-row"><span>'+sc+' · پایه '+({7:'هفتم',8:'هشتم',9:'نهم'}[g])+'</span><span>'+grp.length+' نفر — مجموع '+pts+' امتیاز</span></div>';
  });});
  box.innerHTML = rows || '<div class="empty-state"><div class="d">داده‌ای نیست</div></div>';
}
