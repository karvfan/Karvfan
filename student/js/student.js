/**
 * student.js — کل تجربه‌ی دانش‌آموز: درس‌ها، تکالیف، آپلود کار، گالری،
 * جدول امتیازات، اطلاعیه‌ها، پروفایل استعداد و آزمون علاقه‌سنجی.
 */

async function enterStudentApp(){
  $('stName').textContent = student.full_name;
  $('stMeta').textContent = student.school+' · پایه '+({7:'هفتم',8:'هشتم',9:'نهم'}[student.grade])+(student.class_name?(' · کلاس '+student.class_name):'');
  $('stPoints').textContent = student.points||0;
  if(student.streak>0){ $('streakChip').style.display='flex'; $('stStreak').textContent=student.streak; }
  goTo('studentApp');
  await loadLessonsFor(student.grade);
  await loadMyQuizResults();
  await loadMyLikes();
  renderLessonsPanel();
  switchStudentTab('pLessons');
  loadDeadlineBanner();
  refreshMineBadge();
}
async function refreshMineBadge(){
  const { data } = await sb.rpc('count_unseen_reviews', { p_student_id: student.id });
  setStBadge('badgeMine', data);
}
function setStBadge(id, n){
  const el = $(id); if(!el) return;
  if(n && n>0){ el.textContent = n>99?'99+':n; el.classList.remove('hidden'); }
  else { el.classList.add('hidden'); }
}
async function loadMyLikes(){
  const { data } = await sb.rpc('get_gallery_likes', { p_student_id: student.id });
  myLikedIds = new Set((data||[]).map(x=>x.submission_id));
}
async function loadDeadlineBanner(){
  const { data } = await sb.from('assignments').select('*').eq('is_active', true);
  if(!data) return;
  const today = new Date(); today.setHours(0,0,0,0);
  const soon = data.filter(a=>{
    if(a.grade && a.grade!==student.grade) return false;
    if(a.school && a.school!==student.school) return false;
    if(!a.due_date) return false;
    const d = new Date(a.due_date); d.setHours(0,0,0,0);
    const diffDays = Math.round((d-today)/86400000);
    return diffDays>=0 && diffDays<=2;
  });
  if(!soon.length){ $('deadlineBanner').innerHTML=''; return; }
  const a = soon[0];
  const d = new Date(a.due_date); d.setHours(0,0,0,0);
  const diffDays = Math.round((d-today)/86400000);
  const when = diffDays===0? 'امروز' : diffDays===1? 'فردا' : 'تا ۲ روز دیگه';
  $('deadlineBanner').innerHTML = '<div class="deadline-banner">⏰ تکلیف «'+esc(a.title)+'» مهلتش '+when+' تمومه — <a href="#" style="color:#fff;text-decoration:underline" onclick="switchStudentTab(\'pAssign\');return false">برو آپلود کن</a></div>';
}
async function loadMyQuizResults(){
  const { data } = await sb.rpc('get_my_quiz_results', { p_student_id: student.id });
  myQuizResults = {};
  (data||[]).forEach(r=>{ myQuizResults[r.lesson_id+'::'+(r.game_key||'quiz')] = r; });
}

function switchStudentTab(id){
  document.querySelectorAll('#studentApp .tab').forEach(t=>t.classList.toggle('active', t.dataset.p===id));
  document.querySelectorAll('#studentApp .panel').forEach(p=>p.classList.toggle('active', p.id===id));
  if(id==='pAssign') loadAssignmentsPanel();
  if(id==='pMine'){
    loadMySubmissions();
    const badgeEl = $('badgeMine');
    if(badgeEl && !badgeEl.classList.contains('hidden')) fireConfetti();
    sb.rpc('mark_submissions_seen', { p_student_id: student.id }).then(()=> setStBadge('badgeMine', 0));
  }
  if(id==='pProfile') loadProfilePanel();
  if(id==='pGallery') loadGallery();
  if(id==='pBoard') loadLeaderboard();
  if(id==='pAnn') loadAnnouncements();
}

/* ------------------------------------------------------------ آموزش (دانش‌آموز) */
async function loadLessonsFor(grade){
  const { data, error } = await sb.rpc('get_visible_lessons', { p_grade: grade, p_school: student.school });
  lessons = error? [] : data;
}
function renderLessonsPanel(){
  const el = $('pLessons');
  if(!lessons.length){
    el.innerHTML = emptyState('📚','هنوز درسی اضافه نشده','مربی هنوز محتوای آموزشی این پایه رو نساخته — بعداً سر بزنید 🙂');
    return;
  }
  el.innerHTML = lessons.map((l,i)=>{
    const emb = embedUrl(l.video_url);
    return '<div class="pattern-card">'+
      '<div class="tag-badge">'+(i+1)+'</div>'+
      '<div class="section-title">'+esc(l.unit_title)+' '+(l.is_prescribed? '<span class="presc-badge presc-yes">✅ تجویزی</span>' : '<span class="presc-badge presc-no">🔄 قابل جایگزینی</span>')+(l.needs_adult_help?' <span class="presc-badge" style="background:var(--brick-bg,#f7e5e0);color:var(--brick,#ad3d33)">⚠️ با کمک بزرگ‌تر</span>':'')+'</div>'+
      (l.content_text? '<div class="lesson-body">'+esc(l.content_text)+'</div>':'')+
      (l.advanced_text? '<details class="adv-box"><summary>🌟 مطالب تکمیلی و پیشرفته (سطح تیزهوشان)</summary><div class="lesson-body adv-body">'+esc(l.advanced_text)+'</div></details>':'')+
      homeMaterialsHtml(l)+
      (l.learning_method? '<div class="method-box"><div class="method-box-title">🧠 بهترین روش یادگیری این درس</div><div class="lesson-body">'+esc(l.learning_method)+'</div></div>':'')+
      (emb? '<div class="video-embed"><iframe src="'+emb+'" allowfullscreen></iframe></div>' : (l.video_url? '<div class="lesson-meta-row"><a class="chip-link" href="'+esc(l.video_url)+'" target="_blank">🎬 مشاهده ویدیو</a></div>':'')) +
      (l.sample_image_url? '<img class="sample-img" src="'+esc(l.sample_image_url)+'" onclick="openLightbox(\''+esc(l.sample_image_url)+'\')">':'')+
      (l.pdf_url? '<div class="lesson-meta-row"><a class="chip-link pdf" href="'+esc(l.pdf_url)+'" target="_blank">📄 دانلود جزوه PDF</a></div>':'')+
      quizButtonHtml(l)+
      careersButtonHtml(l)+
      '<div class="scissor-divider">✂️</div>'+
      '<button class="btn btn-thread btn-sm" onclick="openUploadModal(\''+l.id+'\')">📤 آپلود کار برای این درس</button>'+
      '</div>';
  }).join('');
}
function homeMaterialsHtml(l){
  let html = '';
  if(l.home_materials){
    html += '<div class="home-box"><div class="home-box-title">🏠 چی از خونه لازم داری؟</div><div class="lesson-body">'+esc(l.home_materials)+'</div></div>';
  }
  if(l.needs_adult_help){
    html += '<div class="safety-box"><div class="safety-box-title">⚠️ این یکی با کمک یه بزرگ‌تر</div>'+
      (l.safety_note? '<div class="lesson-body">'+esc(l.safety_note)+'</div>':'')+
      '</div>';
  }
  if(l.safer_alternative){
    html += '<div class="alt-box"><div class="alt-box-title">🔄 نسخه‌ی جایگزین و امن‌تر</div><div class="lesson-body">'+esc(l.safer_alternative)+'</div></div>';
  }
  return html;
}
function quizButtonHtml(l){
  const games = buildGameList(l);
  if(!games.length) return '';
  let doneCount = 0, ptsEarned = 0;
  games.forEach(g=>{ const r = myQuizResults[l.id+'::'+g.key]; if(r){ doneCount++; ptsEarned += (r.points_awarded||0); } });
  const label = doneCount===0
    ? '🎮 '+games.length+' بازی این پودمان رو شروع کن'
    : (doneCount===games.length? '🎮 همه‌ی '+games.length+' بازی رو تموم کردی!' : '🎮 '+doneCount+' از '+games.length+' بازی انجام شده');
  return '<div class="lesson-meta-row"><button class="btn btn-sky btn-sm" onclick="openQuiz(\''+l.id+'\')">'+label+'</button>'+
    (ptsEarned>0? '<span class="quiz-done-badge">✅ +'+ptsEarned+' امتیاز گرفتی</span>' : '')+'</div>';
}
function careersButtonHtml(l){
  let careers = [];
  try{ careers = l.careers_json ? (typeof l.careers_json==='string'? JSON.parse(l.careers_json) : l.careers_json) : []; }catch(e){ careers=[]; }
  if(!careers.length) return '';
  return '<div class="lesson-meta-row"><button class="btn btn-mustard btn-sm" onclick="openCareers(\''+l.id+'\')">💼 با این پودمان چه شغلی می‌شه داشت؟ ('+careers.length+')</button></div>';
}
async function refreshStreak(){
  const { data } = await sb.rpc('get_student_profile', { p_student_id: student.id });
  if(data && data[0]){
    student.streak = data[0].streak;
    student.points = data[0].points;
    $('stPoints').textContent = student.points;
    if(student.streak>0){ $('streakChip').style.display='flex'; $('stStreak').textContent=student.streak; }
    try{ localStorage.setItem('kf_student', JSON.stringify(student)); }catch(e){}
  }
}

/* ------------------------------------------------------------ تکالیف هفتگی */
async function loadAssignmentsPanel(){
  const el = $('pAssign');
  const { data, error } = await sb.from('assignments').select('*').order('due_date',{ascending:true,nullsFirst:false}).order('created_at',{ascending:false});
  if(error || !data){ el.innerHTML = emptyState('📅','خطا در بارگذاری',''); return; }
  assignments = data.filter(a=> a.is_active && (!a.grade || a.grade===student.grade) && (!a.school || a.school===student.school) );
  if(!assignments.length){ el.innerHTML = emptyState('📅','فعلاً تکلیفی ثبت نشده','هر وقت مربی تکلیف هفتگی بذاره، اینجا نمایش داده می‌شه'); return; }
  const today = new Date().toISOString().slice(0,10);
  el.innerHTML = assignments.map(a=>{
    const late = a.due_date && a.due_date < today;
    return '<div class="pattern-card">'+
      '<div class="sub-card-head"><div><div class="sub-title">'+(a.is_open_challenge?'🎨 ':'📅 ')+esc(a.title)+'</div>'+
      (a.due_date? '<div class="sub-lesson '+(late?'due-late':'')+'">'+(late?'⏰ مهلت گذشته: ':'⏳ مهلت تحویل: ')+toJalali(a.due_date)+'</div>':'')+
      (a.is_open_challenge? '<div class="sub-lesson">🎨 چالش طراحی باز — خودت یه مشکل واقعی پیدا کن و راه‌حلش رو بساز</div>':'')+
      '</div><span class="pts-badge">+'+a.points_hint+' امتیاز</span></div>'+
      (a.description? '<div class="sub-desc">'+esc(a.description)+'</div>':'')+
      '<div class="scissor-divider">✂️</div>'+
      '<button class="btn btn-thread btn-sm" onclick="openUploadModal(null,\''+a.id+'\')">📤 آپلود این تکلیف</button>'+
      '</div>';
  }).join('');
}

/* ------------------------------------------------------------ کارهای من */
async function loadMySubmissions(){
  const el = $('pMine');
  el.innerHTML = '<div class="empty-state"><div class="ic">⏳</div><div class="d">در حال بارگذاری...</div></div>';
  const { data, error } = await sb.rpc('get_my_submissions', { p_student_id: student.id });
  if(error || !data || !data.length){
    el.innerHTML = emptyState('📤','هنوز کاری آپلود نکردید','با دکمه‌ی ＋ پایین صفحه اولین کارتون رو بفرستید!');
    return;
  }
  el.innerHTML = data.map(s=>'<div class="pattern-card">'+
    '<div class="sub-card-head"><div><div class="sub-title">'+(s.kind==='homework'?'📅 ':'📘 ')+esc(s.title)+'</div>'+
    (s.context_title? '<div class="sub-lesson">'+(s.kind==='homework'?'تکلیف: ':'مربوط به: ')+esc(s.context_title)+'</div>':'')+'</div>'+
    '<span class="pill pill-'+s.status+'">'+STATUS_LABEL[s.status]+'</span></div>'+
    (s.description? '<div class="sub-desc">'+esc(s.description)+'</div>':'')+
    designReflectionHtml(s.design_reflection)+
    ecoFriendlyHtml(s.is_eco_friendly, s.eco_note)+
    fileLinkOrImg(s.file_url)+
    (s.teacher_note? '<div class="teacher-note">💬 یادداشت مربی: '+esc(s.teacher_note)+'</div>':'')+
    '<div class="sub-footer"><span>'+toJalali(s.created_at)+'</span>'+
    (s.points_awarded>0? '<span class="pts-badge">+'+s.points_awarded+' امتیاز</span>':'')+
    '</div>'+moodPickerHtml('sub',s.id,s.mood)+
    '</div>').join('');
}
function moodPickerHtml(kind, refId, mood){
  if(mood){
    const map = {1:'😐 نظرت رو ثبت کردیم',2:'🙂 نظرت رو ثبت کردیم',3:'😍 نظرت رو ثبت کردیم'};
    return '<div class="mood-row mood-done">'+map[mood]+'</div>';
  }
  const fn = kind==='sub' ? 'setSubMood' : 'setQuizMoodUi';
  return '<div class="mood-row"><span>چقدر این کار رو دوست داشتی؟</span>'+
    '<button class="mood-btn" onclick="'+fn+'(\''+refId+'\',1)">😐</button>'+
    '<button class="mood-btn" onclick="'+fn+'(\''+refId+'\',2)">🙂</button>'+
    '<button class="mood-btn" onclick="'+fn+'(\''+refId+'\',3)">😍</button></div>';
}
async function setSubMood(subId, mood){
  await sb.rpc('set_submission_mood', { p_submission_id: subId, p_student_id: student.id, p_mood: mood });
  showToast('🙏 ممنون از نظرت!');
  loadMySubmissions();
}
async function setQuizMoodUi(lessonId, mood){
  await sb.rpc('set_quiz_mood', { p_lesson_id: lessonId, p_student_id: student.id, p_mood: mood });
  showToast('🙏 ممنون از نظرت!');
  await loadMyQuizResults();
  renderLessonsPanel();
}
async function loadProfilePanel(){
  const el = $('pProfile');
  el.innerHTML = '<div class="empty-state"><div class="ic">⏳</div><div class="d">در حال بارگذاری...</div></div>';
  const [{data:cats}, {data:interest}] = await Promise.all([
    sb.rpc('get_my_category_profile', { p_student_id: student.id }),
    sb.rpc('get_my_latest_interest', { p_student_id: student.id })
  ]);
  const catMap = {};
  Object.keys(CATEGORY_META).forEach(c=>catMap[c]=0);
  (cats||[]).forEach(c=>{ catMap[c.category] = Number(c.total_points)||0; });
  const maxVal = Math.max(1, ...Object.values(catMap));

  let html = '<div class="sec-title">🧭 نقاط قوت من</div>';
  html += '<div class="pattern-card">';
  Object.keys(CATEGORY_META).forEach(cat=>{
    const meta = CATEGORY_META[cat];
    const val = catMap[cat];
    const pct = Math.round((val/maxVal)*100);
    html += '<div class="cat-bar-row"><div class="cat-bar-label"><span>'+meta.icon+' '+cat+'</span><span>'+val+' امتیاز</span></div>'+
      '<div class="cat-bar-track"><div class="cat-bar-fill" style="width:'+pct+'%;background:'+meta.color+'"></div></div></div>';
  });
  html += '</div>';

  html += '<div class="sec-title">🏅 نشان‌های من</div><div class="pattern-card"><div class="badge-grid">';
  Object.keys(CATEGORY_META).forEach(cat=>{
    const meta = CATEGORY_META[cat];
    const earned = catMap[cat] >= BADGE_THRESHOLD;
    html += '<div class="badge-card '+(earned?'':'locked')+'"><div class="badge-emoji">'+meta.icon+'</div><div class="badge-name">'+meta.badge+'</div></div>';
  });
  const totalPts = student.points||0;
  html += '<div class="badge-card '+(totalPts>=100?'':'locked')+'"><div class="badge-emoji">⭐</div><div class="badge-name">⭐ ستاره‌ی کارگاه</div></div>';
  html += '</div></div>';

  html += '<div class="sec-title">🎯 آزمون علاقه‌سنجی</div><div class="pattern-card">';
  if(interest && interest.length){
    const r = interest[0];
    html += '<div class="sub-desc">آخرین نتیجه (‌'+toJalali(r.taken_at)+'): بیشترین علاقه‌ات به <b>'+esc(r.top_category)+'</b> بود.</div>';
  } else {
    html += '<div class="sub-desc">هنوز این آزمون رو نزدی! چند سؤال کوتاه و باحاله که کمک می‌کنه بفهمی به کدوم حوزه بیشتر علاقه داری.</div>';
  }
  html += '<button class="btn btn-thread btn-sm" style="margin-top:10px" onclick="startInterestQuiz()">🎯 شروع آزمون علاقه‌سنجی</button>';
  html += '</div>';

  html += await growthTimelineHtml();

  html += '<div class="sec-title">🏆 گواهی من</div><div class="pattern-card">'+
    '<button class="btn btn-thread btn-sm" onclick="openCertificate(student)">🏆 دریافت و چاپ گواهی</button>'+
    '</div>';

  html += '<div class="sec-title">🔑 تغییر پین ورود</div><div class="pattern-card">'+
    '<div class="field"><label>پین فعلی</label><input id="pcOld" type="password" inputmode="numeric" maxlength="4" placeholder="••••"></div>'+
    '<div class="field"><label>پین جدید</label><input id="pcNew" type="password" inputmode="numeric" maxlength="4" placeholder="••••"></div>'+
    '<div class="field"><label>تکرار پین جدید</label><input id="pcNew2" type="password" inputmode="numeric" maxlength="4" placeholder="••••"></div>'+
    '<div class="field-err" id="pcErr"></div>'+
    '<button class="btn btn-thread btn-sm" onclick="changeOwnPin()">ذخیره‌ی پین جدید</button>'+
    '</div>';

  el.innerHTML = html;
}
async function changeOwnPin(){
  const oldPin = $('pcOld').value.trim(), newPin = $('pcNew').value.trim(), newPin2 = $('pcNew2').value.trim();
  const errEl = $('pcErr'); errEl.textContent='';
  if(!/^\d{4}$/.test(oldPin)){ errEl.textContent='پین فعلی رو کامل وارد کن'; return; }
  if(!/^\d{4}$/.test(newPin)){ errEl.textContent='پین جدید باید ۴ رقم باشه'; return; }
  if(newPin !== newPin2){ errEl.textContent='دو پین جدید یکی نیستن'; return; }
  const { error } = await sb.rpc('student_change_own_pin', { p_student_id: student.id, p_old_pin: oldPin, p_new_pin: newPin });
  if(error){ errEl.textContent = 'خطا: ' + error.message; return; }
  showToast('✅ پین عوض شد');
  $('pcOld').value=''; $('pcNew').value=''; $('pcNew2').value='';
}
async function growthTimelineHtml(){
  const { data } = await sb.rpc('get_my_submissions', { p_student_id: student.id });
  const withImg = (data||[]).filter(s=>s.status==='approved' && s.file_url && /\.(jpg|jpeg|png|webp|gif)$/i.test(s.file_url));
  if(withImg.length < 2) return '';
  withImg.sort((a,b)=> new Date(a.created_at) - new Date(b.created_at));
  const first = withImg[0], last = withImg[withImg.length-1];
  let html = '<div class="sec-title">🌱 مسیر رشد من</div><div class="pattern-card">';
  html += '<div class="sub-desc" style="margin-bottom:10px">مقایسه‌ی اولین و آخرین کار تأییدشده‌ات — ببین چقدر پیشرفت کردی!</div>';
  html += '<div class="growth-compare">'+
    '<div class="growth-item"><img src="'+esc(first.file_url)+'"><div class="growth-label">🌱 اولین کار<br>'+toJalali(first.created_at)+'</div></div>'+
    '<div class="growth-arrow">←</div>'+
    '<div class="growth-item"><img src="'+esc(last.file_url)+'"><div class="growth-label">🌳 آخرین کار<br>'+toJalali(last.created_at)+'</div></div>'+
    '</div>';
  if(withImg.length > 2){
    html += '<div class="sub-desc" style="margin:10px 0 6px">همه‌ی کارهای تأییدشده (به‌ترتیب زمان):</div><div class="growth-strip">'+
      withImg.map(s=>'<img src="'+esc(s.file_url)+'" title="'+esc(s.title)+'">').join('')+
      '</div>';
  }
  html += '</div>';
  return html;
}

function startInterestQuiz(){
  interestState = { idx:0, scores:{} };
  Object.keys(CATEGORY_META).forEach(c=>interestState.scores[c]=0);
  openModal('interestModalOv');
  renderInterestQ();
}
function renderInterestQ(){
  const st = interestState;
  if(st.idx >= INTEREST_QUESTIONS.length){ finishInterestQuiz(); return; }
  const q = INTEREST_QUESTIONS[st.idx];
  const pct = Math.round((st.idx/INTEREST_QUESTIONS.length)*100);
  $('interestBody').innerHTML =
    '<div class="quiz-progress"><div class="quiz-progress-bar" style="width:'+pct+'%"></div></div>'+
    '<div class="quiz-qcount">سؤال '+(st.idx+1)+' از '+INTEREST_QUESTIONS.length+'</div>'+
    '<div class="quiz-question">'+esc(q.q)+'</div>'+
    '<button class="interest-opt" onclick="answerInterest(\'a\')">'+esc(q.a.t)+'</button>'+
    '<button class="interest-opt" onclick="answerInterest(\'b\')">'+esc(q.b.t)+'</button>';
}
function answerInterest(which){
  const q = INTEREST_QUESTIONS[interestState.idx];
  const cat = q[which].c;
  interestState.scores[cat]++;
  interestState.idx++;
  renderInterestQ();
}
async function finishInterestQuiz(){
  const scores = interestState.scores;
  let top = Object.keys(scores)[0];
  Object.keys(scores).forEach(c=>{ if(scores[c] > scores[top]) top = c; });
  const meta = CATEGORY_META[top];
  $('interestBody').innerHTML =
    '<div class="quiz-result"><div class="quiz-stars">'+meta.icon+'</div>'+
    '<div class="quiz-score">بیشترین علاقه‌ات:</div>'+
    '<div class="quiz-msg" style="font-size:16px;font-weight:800;margin-top:6px">'+esc(top)+'</div>'+
    '<div class="quiz-msg" style="margin-top:10px">هر وقت خواستی می‌تونی دوباره این آزمون رو بزنی و ببینی علاقه‌ات تغییر کرده یا نه!</div>'+
    '<button class="btn btn-ghost btn-sm" style="margin-top:14px" onclick="closeModal(\'interestModalOv\')">بستن</button></div>';
  await sb.rpc('submit_interest_quiz', { p_student_id: student.id, p_scores_json: JSON.stringify(scores), p_top_category: top });
  loadProfilePanel();
}

/* ------------------------------------------------------------ گالری */
async function loadGallery(){
  const el = $('pGallery');
  el.innerHTML = '<div class="filter-row">'+
    '<select id="galSchool" onchange="loadGallery()"><option value="">همه مدارس</option>'+SCHOOLS.map(s=>'<option '+(($('galSchool')&&$('galSchool').value===s)?'selected':'')+' value="'+s+'">'+s+'</option>').join('')+'</select>'+
    '<select id="galGrade" onchange="loadGallery()"><option value="">همه پایه‌ها</option>'+GRADES.map(g=>'<option value="'+g+'">پایه '+({7:'هفتم',8:'هشتم',9:'نهم'}[g])+'</option>').join('')+'</select>'+
    '</div><div id="galGrid" class="gallery-grid"></div>';
  const school = $('galSchool').value || null, grade = $('galGrade').value ? parseInt($('galGrade').value) : null;
  const { data, error } = await sb.rpc('get_gallery', { p_school: school, p_grade: grade });
  const grid = $('galGrid');
  if(error || !data || !data.length){ grid.outerHTML = emptyState('🖼️','هنوز کاری در گالری نیست','وقتی مربی یک کار رو تأیید و عمومی کنه، اینجا نمایش داده می‌شه'); return; }
  grid.innerHTML = data.map(g=>{
    const isImg = /\.(jpg|jpeg|png|webp|gif)$/i.test(g.file_url);
    const liked = myLikedIds.has(g.id);
    return '<div class="g-item">'+
      '<div onclick="'+(isImg?'openLightbox(\''+esc(g.file_url)+'\')':'window.open(\''+esc(g.file_url)+'\',\'_blank\')')+'">'+
      (isImg? '<img src="'+esc(g.file_url)+'">' : '<div style="height:120px;display:flex;align-items:center;justify-content:center;font-size:34px;background:var(--paper-dark)">📄</div>')+
      '</div>'+
      '<div class="g-body"><div class="g-title">'+esc(g.title)+'</div><div class="g-name">'+esc(maskName(g.student_name))+' · '+esc(g.school)+'</div>'+
      (g.is_eco_friendly? '<div class="eco-badge">♻️ سازگار با محیط‌زیست</div>':'')+
      '<div class="g-actions"><button class="like-btn '+(liked?'liked':'')+'" onclick="toggleLike(\''+g.id+'\', this)">'+(liked?'❤️':'🤍')+' <span>'+g.like_count+'</span></button>'+
      '<button class="like-btn" onclick="toggleCritique(\''+g.id+'\')">💬 نقد سازنده</button></div>'+
      '<div class="critique-panel hidden" id="critique_'+g.id+'"></div>'+
      '</div></div>';
  }).join('');
}
async function toggleLike(submissionId, btn){
  const { data, error } = await sb.rpc('toggle_gallery_like', { p_submission_id: submissionId, p_student_id: student.id });
  if(error || !data || !data[0]) return;
  const row = data[0];
  if(row.liked){ myLikedIds.add(submissionId); } else { myLikedIds.delete(submissionId); }
  btn.classList.toggle('liked', row.liked);
  btn.innerHTML = (row.liked?'❤️':'🤍')+' <span>'+row.like_count+'</span>';
}
async function toggleCritique(submissionId){
  const panel = $('critique_'+submissionId);
  if(!panel.classList.contains('hidden')){ panel.classList.add('hidden'); return; }
  panel.classList.remove('hidden');
  panel.innerHTML = '<div class="lesson-body">در حال بارگذاری...</div>';
  const { data } = await sb.from('gallery_feedback').select('*').eq('submission_id', submissionId).order('created_at',{ascending:false});
  let html = (data||[]).map(f=>
    (f.liked_text? '<div class="critique-item"><b>👍 دوست داشتم:</b> '+esc(f.liked_text)+'</div>':'')+
    (f.suggestion_text? '<div class="critique-item"><b>💡 پیشنهاد:</b> '+esc(f.suggestion_text)+'</div>':'')
  ).join('');
  html += '<div class="field"><label>یه چیزی که دوست داشتی</label><input id="cLiked_'+submissionId+'" placeholder="مثلاً: رنگ‌آمیزیش خیلی قشنگه"></div>'+
    '<div class="field"><label>یه پیشنهاد برای بهترشدن</label><input id="cSugg_'+submissionId+'" placeholder="مثلاً: می‌تونستی لبه‌هاش رو صاف‌تر کنی"></div>'+
    '<button class="btn btn-sky btn-sm" onclick="submitCritique(\''+submissionId+'\')">ارسال نظر</button>';
  panel.innerHTML = html;
}
async function submitCritique(submissionId){
  const liked_text = $('cLiked_'+submissionId).value.trim() || null;
  const suggestion_text = $('cSugg_'+submissionId).value.trim() || null;
  if(!liked_text && !suggestion_text){ showToast('یه چیزی بنویس'); return; }
  const { error } = await sb.from('gallery_feedback').insert({ submission_id: submissionId, student_id: student.id, liked_text, suggestion_text });
  if(error){ showToast('❌ خطا در ارسال'); return; }
  showToast('🙏 ممنون از نظرت!');
  toggleCritique(submissionId); toggleCritique(submissionId);
}

/* ------------------------------------------------------------ رتبه‌بندی */
async function loadLeaderboard(){
  const el = $('pBoard');
  el.innerHTML = '<div class="filter-row">'+
    '<select id="lbSchool" onchange="loadLeaderboard()"><option value="">همه مدارس</option>'+SCHOOLS.map(s=>'<option value="'+s+'">'+s+'</option>').join('')+'</select>'+
    '<select id="lbGrade" onchange="loadLeaderboard()"><option value="">همه پایه‌ها</option>'+GRADES.map(g=>'<option value="'+g+'">پایه '+({7:'هفتم',8:'هشتم',9:'نهم'}[g])+'</option>').join('')+'</select>'+
    '</div><div class="pattern-card" id="lbList"></div>';
  const school = $('lbSchool').value||null, grade=$('lbGrade').value?parseInt($('lbGrade').value):null;
  const { data, error } = await sb.rpc('get_leaderboard', { p_school:school, p_grade:grade });
  const list = $('lbList');
  if(error || !data || !data.length){ list.outerHTML = emptyState('🏆','هنوز رتبه‌بندی خالیه','با آپلود و تأیید کارها امتیاز جمع کنید تا اینجا دیده بشید'); return; }
  list.innerHTML = data.map((r,i)=>{
    const isMe = student && r.id === student.id;
    const displayName = isMe ? (r.full_name + ' (خودت)') : maskName(r.full_name);
    return '<div class="lb-row"'+(isMe?' style="background:var(--amber-bg);border-radius:8px"':'')+'><div class="lb-rank r'+(i+1)+'">'+(i+1)+'</div>'+
    '<div style="flex:1"><div class="lb-name">'+esc(displayName)+'</div><div class="lb-meta">'+esc(r.school)+' · پایه '+({7:'هفتم',8:'هشتم',9:'نهم'}[r.grade])+'</div></div>'+
    '<div class="lb-pts">'+r.points+'</div></div>';
  }).join('');
}

/* ------------------------------------------------------------ اطلاعیه‌ها */
async function loadAnnouncements(){
  const el = $('pAnn');
  const { data, error } = await sb.from('announcements').select('*').order('created_at',{ascending:false});
  if(error || !data){ el.innerHTML = emptyState('📢','خطا در بارگذاری',''); return; }
  const mine = data.filter(a => (!a.school || a.school===student.school) && (!a.grade || a.grade===student.grade));
  if(!mine.length){ el.innerHTML = emptyState('📢','فعلاً اطلاعیه‌ای نیست','هر خبر جدیدی از طرف مربی اینجا نمایش داده می‌شه'); return; }
  el.innerHTML = mine.map(a=>'<div class="pattern-card ann-card"><div class="ann-title">'+esc(a.title)+'</div>'+
    (a.body?'<div class="ann-body">'+esc(a.body)+'</div>':'')+'<div class="ann-date">'+toJalali(a.created_at)+'</div></div>').join('');
}

function openUploadModal(lessonId, assignmentId){
  $('upTitle').value=''; $('upDesc').value=''; $('upErr').textContent='';
  $('dqProblem').value=''; $('dqIdeas').value=''; $('dqWhy').value=''; $('dqHow').value=''; $('dqImprove').value='';
  $('cqProduct').value=''; $('cqPrice').value=''; $('cqSell').value=''; $('cqCustomers').value='';
  $('upEco').checked=false; $('upEcoNote').value=''; $('upEcoNote').classList.add('hidden');
  uploadFileB64=null; uploadFileExt=null; rawUploadB64=null; uploadAssignmentId = assignmentId||null;
  $('upDrop').textContent='📎 برای انتخاب عکس یا فایل ضربه بزنید'; $('upDrop').classList.remove('has-file');
  $('upPreview').style.display='none'; $('upFile').value='';
  const lessonField = $('upLessonField');
  const assignField = $('upAssignField');
  let isChallenge = false, challengeType = 'design';
  if(assignmentId){
    const a = assignments.find(x=>x.id===assignmentId);
    lessonField.style.display='none'; assignField.style.display='block';
    $('upAssignName').textContent = a? a.title : '';
    if(a) $('upTitle').value = a.title;
    isChallenge = !!(a && a.is_open_challenge);
    challengeType = a && a.challenge_type || 'design';
  } else {
    lessonField.style.display='block'; assignField.style.display='none';
    const sel = $('upLesson');
    sel.innerHTML = '<option value="">— انتخاب نکنید —</option>' + lessons.map(l=>'<option value="'+l.id+'">'+esc(l.unit_title)+'</option>').join('');
    if(lessonId) sel.value = lessonId;
  }
  $('upChallengeFields').classList.toggle('hidden', !isChallenge);
  $('upDesc').closest('.field').classList.toggle('hidden', isChallenge);
  $('upDesignFields').classList.toggle('hidden', challengeType!=='design');
  $('upCompanyFields').classList.toggle('hidden', challengeType!=='company');
  $('upChallengeHint').textContent = challengeType==='company'
    ? '💼 این یه پروژه‌ی شرکت دانش‌آموزی مصغره — مثل یه کارآفرین واقعی به این سؤال‌ها جواب بده:'
    : '🎨 این یه چالش طراحی بازه — به این سؤال‌ها فکر کن و جواب بده:';
  openModal('uploadModalOv');
}
let rawUploadB64 = null; // عکس خام (بدون واترمارک) — برای بازتولید واترمارک وقتی عنوان/پودمان عوض می‌شه

async function onUploadFileChange(){
  const f = $('upFile').files[0]; if(!f) return;
  if(!f.type.startsWith('image/')){ showToast('فقط عکس قابل قبوله'); $('upFile').value=''; return; }
  $('upDrop').textContent = '⏳ در حال آماده‌سازی عکس...';
  rawUploadB64 = await fileToBase64(f);
  await renderWatermarkedUpload();
  $('upDrop').textContent = '✅ عکس گرفته شد (برای گرفتن دوباره ضربه بزن)'; $('upDrop').classList.add('has-file');
}

/* واترمارک: نام دانش‌آموز، مدرسه، پودمان (درس انتخاب‌شده)، و اسمی که برای کار گذاشته */
function currentWatermarkLines(){
  const lines = [];
  if(student && student.full_name) lines.push(student.full_name);
  if(student && student.school) lines.push(student.school);
  const lessonSel = $('upLesson');
  const lessonFieldEl = $('upLessonField');
  let podmanName = '';
  if(lessonFieldEl && lessonFieldEl.style.display !== 'none' && lessonSel.value){
    const l = lessons.find(x=>String(x.id)===String(lessonSel.value));
    if(l) podmanName = l.unit_title;
  }
  if(!podmanName && uploadAssignmentId){
    const a = assignments.find(x=>x.id===uploadAssignmentId);
    if(a) podmanName = a.title;
  }
  if(podmanName) lines.push('پودمان: ' + podmanName);
  const workTitle = $('upTitle').value.trim();
  if(workTitle) lines.push(workTitle);
  return lines;
}

async function renderWatermarkedUpload(){
  if(!rawUploadB64) return;
  const lines = currentWatermarkLines();
  uploadFileB64 = await drawWatermark(rawUploadB64, lines);
  uploadFileExt = 'jpg';
  $('upPreview').src = uploadFileB64; $('upPreview').style.display='block';
}
function onWatermarkFieldsChange(){ if(rawUploadB64) renderWatermarkedUpload(); }

function drawWatermark(dataUrl, lines){
  return new Promise((resolve)=>{
    const img = new Image();
    img.onload = ()=>{
      const maxDim = 1600;
      let w = img.naturalWidth, h = img.naturalHeight;
      if(Math.max(w,h) > maxDim){
        const scale = maxDim / Math.max(w,h);
        w = Math.round(w*scale); h = Math.round(h*scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      if(lines.length){
        const fontSize = Math.max(13, Math.round(w * 0.028));
        const lineHeight = Math.round(fontSize * 1.45);
        const pad = Math.round(fontSize * 0.7);
        const boxH = lines.length * lineHeight + pad * 2;
        ctx.fillStyle = 'rgba(0,0,0,0.52)';
        ctx.fillRect(0, h - boxH, w, boxH);
        ctx.font = fontSize + 'px Vazirmatn, Tahoma, sans-serif';
        ctx.direction = 'rtl';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        lines.forEach((line, i)=>{
          const y = h - boxH + pad + lineHeight*i + lineHeight/2;
          ctx.fillText(line, w - pad, y, w - pad*2);
        });
      }
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = dataUrl;
  });
}
async function submitUpload(){
  const title = $('upTitle').value.trim();
  $('upErr').textContent='';
  if(!title){ $('upErr').textContent='عنوان کار را بنویسید'; return; }
  if(!uploadFileB64){ $('upErr').textContent='یک عکس از فعالیتت بگیر'; return; }
  $('upBtn').disabled=true; $('upBtn').innerHTML='<span class="spinner"></span> در حال ارسال...';
  try{
    const fileUrl = await uploadToStorage('submission-files', uploadFileB64, uploadFileExt);
    const lessonId = uploadAssignmentId ? null : ($('upLesson').value || null);
    const isChallenge = !$('upChallengeFields').classList.contains('hidden');
    const isCompany = isChallenge && !$('upCompanyFields').classList.contains('hidden');
    let design_reflection = null;
    if(isCompany){
      design_reflection = JSON.stringify({
        type: 'company', product: $('cqProduct').value.trim(), price: $('cqPrice').value.trim(),
        sell_plan: $('cqSell').value.trim(), customers: $('cqCustomers').value.trim()
      });
    } else if(isChallenge){
      design_reflection = JSON.stringify({
        type: 'design', problem: $('dqProblem').value.trim(), ideas: $('dqIdeas').value.trim(),
        why_chosen: $('dqWhy').value.trim(), how_built: $('dqHow').value.trim(),
        improvement: $('dqImprove').value.trim()
      });
    }
    const is_eco_friendly = $('upEco').checked;
    const eco_note = is_eco_friendly ? ($('upEcoNote').value.trim() || null) : null;
    const { error } = await sb.from('submissions').insert({
      student_id: student.id, lesson_id: lessonId, assignment_id: uploadAssignmentId||null, title,
      description: $('upDesc').value.trim() || null, file_url: fileUrl, design_reflection,
      is_eco_friendly, eco_note
    });
    if(error) throw error;
    closeModal('uploadModalOv');
    showToast('✅ کار شما ارسال شد و در انتظار بررسی مربیه');
    switchStudentTab('pMine');
  }catch(e){
    $('upErr').textContent='خطا در ارسال — دوباره تلاش کنید';
    console.error(e);
  }finally{
    $('upBtn').disabled=false; $('upBtn').textContent='ارسال کار';
  }
}

/* ================================================================ مربی: ورود */
