/**
 * teacher-gallery.js — گالری کارهای برگزیده در پنل معلم: دیدن، لایک و نظر دادن.
 *
 * بعد از teacher.js لود می‌شه. همان کارهایی رو نشون می‌ده که دانش‌آموزها در گالری می‌بینن
 * (تأییدشده + عمومی). لایک و نظر معلم از طریق توابع دیتابیسی staff_* ثبت می‌شه
 * (هویت از نشست ورود گرفته می‌شه) و در گالری دانش‌آموز با نشان «معلم» دیده می‌شه.
 */

let teacherLikedIds = new Set();

function tgMediaHtml(url){
  if(!url) return '';
  const u = esc(url);
  if(/\.(jpg|jpeg|png|webp|gif)$/i.test(url)){
    return '<div onclick="openLightbox(\'' + u + '\')"><img src="' + u + '"></div>';
  }
  if(isVideoUrl(url)){
    return '<div><video controls playsinline preload="metadata" style="width:100%;max-height:220px;display:block;background:#000" src="' + u + '"></video></div>';
  }
  return '<div onclick="window.open(\'' + u + '\',\'_blank\')"><div style="height:120px;display:flex;align-items:center;justify-content:center;font-size:34px;background:var(--paper-dark)">📄</div></div>';
}

async function loadTeacherGallery(){
  const el = $('tGallery');
  const prevSchool = ($('tgSchool') && $('tgSchool').value) || '';
  const prevGrade = ($('tgGrade') && $('tgGrade').value) || '';
  el.innerHTML = '<div class="filter-row">'+
    '<select id="tgSchool" onchange="loadTeacherGallery()"><option value="">همه مدارس</option>'+SCHOOLS.map(s=>'<option '+(prevSchool===s?'selected':'')+' value="'+esc(s)+'">'+esc(s)+'</option>').join('')+'</select>'+
    '<select id="tgGrade" onchange="loadTeacherGallery()"><option value="">همه پایه‌ها</option>'+GRADES.map(g=>'<option '+(prevGrade===String(g)?'selected':'')+' value="'+g+'">پایه '+({7:'هفتم',8:'هشتم',9:'نهم'}[g])+'</option>').join('')+'</select>'+
    '</div><div id="tgGrid" class="gallery-grid"></div>';
  const school = $('tgSchool').value || null;
  const grade = $('tgGrade').value ? parseInt($('tgGrade').value) : null;
  const [galRes, likesRes] = await Promise.all([
    sb.rpc('get_gallery', { p_school: school, p_grade: grade }),
    sb.rpc('staff_get_gallery_likes')
  ]);
  teacherLikedIds = new Set((likesRes.data||[]).map(x=>x.submission_id));
  const data = galRes.data;
  const grid = $('tgGrid');
  if(galRes.error || !data || !data.length){
    grid.outerHTML = emptyState('🖼️','هنوز کاری در گالری نیست','کارهای تأییدشده‌ای که «نمایش در گالری عمومی» بهشون زده بشه، اینجا نمایش داده می‌شه');
    return;
  }
  grid.innerHTML = data.map(g=>{
    const liked = teacherLikedIds.has(g.id);
    return '<div class="g-item">'+
      tgMediaHtml(g.file_url)+
      '<div class="g-body"><div class="g-title">'+esc(g.title)+'</div><div class="g-name">'+esc(g.student_name)+' · '+esc(g.school)+'</div>'+
      (g.is_eco_friendly? '<div class="eco-badge">♻️ سازگار با محیط‌زیست</div>':'')+
      '<div class="g-actions"><button class="like-btn '+(liked?'liked':'')+'" onclick="tgToggleLike(\''+g.id+'\', this)">'+(liked?'❤️':'🤍')+' <span>'+g.like_count+'</span></button>'+
      '<button class="like-btn" onclick="tgToggleCritique(\''+g.id+'\')">💬 نظر</button></div>'+
      '<div class="critique-panel hidden" id="tgCritique_'+g.id+'"></div>'+
      '</div></div>';
  }).join('');
}

async function tgToggleLike(submissionId, btn){
  const { data, error } = await sb.rpc('staff_toggle_gallery_like', { p_submission_id: submissionId });
  if(error || !data || !data[0]){ showToast('❌ خطا در ثبت لایک'); console.error(error); return; }
  const row = data[0];
  if(row.liked){ teacherLikedIds.add(submissionId); } else { teacherLikedIds.delete(submissionId); }
  btn.classList.toggle('liked', row.liked);
  btn.innerHTML = (row.liked?'❤️':'🤍')+' <span>'+row.like_count+'</span>';
}

function tgCritiqueItemHtml(f){
  const who = f.is_staff
    ? '👩‍🏫 '+esc(f.staff_name||'معلم')+' (معلم)'
    : '🎒 دانش‌آموز';
  return '<div class="critique-item"><div style="font-size:12px;font-weight:700;margin-bottom:2px">'+who+'</div>'+
    (f.liked_text? '<div><b>👍 دوست داشتم:</b> '+esc(f.liked_text)+'</div>':'')+
    (f.suggestion_text? '<div><b>💡 پیشنهاد:</b> '+esc(f.suggestion_text)+'</div>':'')+
    '</div>';
}

async function tgRenderCritique(submissionId){
  const panel = $('tgCritique_'+submissionId);
  panel.innerHTML = '<div class="lesson-body">در حال بارگذاری...</div>';
  const { data } = await sb.rpc('get_gallery_feedback', { p_submission_id: submissionId });
  let html = (data||[]).map(tgCritiqueItemHtml).join('');
  html += '<div class="field"><label>یه چیزی که دوست داشتی</label><input id="tgLiked_'+submissionId+'" maxlength="500" placeholder="مثلاً: رنگ‌آمیزیش خیلی قشنگه"></div>'+
    '<div class="field"><label>یه پیشنهاد برای بهترشدن</label><input id="tgSugg_'+submissionId+'" maxlength="500" placeholder="مثلاً: لبه‌هاش رو صاف‌تر ببرید"></div>'+
    '<button class="btn btn-sky btn-sm" onclick="tgSubmitCritique(\''+submissionId+'\')">ارسال نظر</button>';
  panel.innerHTML = html;
}

async function tgToggleCritique(submissionId){
  const panel = $('tgCritique_'+submissionId);
  if(!panel.classList.contains('hidden')){ panel.classList.add('hidden'); return; }
  panel.classList.remove('hidden');
  await tgRenderCritique(submissionId);
}

async function tgSubmitCritique(submissionId){
  const liked = $('tgLiked_'+submissionId).value.trim();
  const sugg = $('tgSugg_'+submissionId).value.trim();
  if(!liked && !sugg){ showToast('یه چیزی بنویس'); return; }
  const { error } = await sb.rpc('staff_add_gallery_feedback', { p_submission_id: submissionId, p_liked: liked || null, p_suggestion: sugg || null });
  if(error){ showToast('❌ خطا در ارسال نظر'); console.error(error); return; }
  showToast('✅ نظر شما ثبت شد');
  tgRenderCritique(submissionId);
}

// وقتی تب گالری باز می‌شه، محتواش لود بشه
const _switchTeacherTabOrig = switchTeacherTab;
switchTeacherTab = function(id){
  _switchTeacherTabOrig(id);
  if(id === 'tGallery') loadTeacherGallery();
};
