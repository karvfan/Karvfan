/**
 * upload-media.js — آپلود «عکس، ویدیو یا فایل» برای کارهای دانش‌آموز
 *
 * این فایل بعد از student.js لود می‌شه و مسیر آپلود رو گسترش می‌ده:
 *  - عکس: فقط ضبط مستقیم با دوربین (+ واترمارک)
 *  - ویدیو: فقط ضبط مستقیم با دوربین (بدون انتخاب از گالری)
 *  - فایل: PDF / Word / PowerPoint / Excel / متن / ZIP
 * ویدیو و فایل مستقیم (بدون base64) به Storage آپلود می‌شن تا حافظه‌ی گوشی پر نشه.
 *
 * نمایش ویدیو (پنل معلم، «کارهای من»): در shared/js/utils.js → fileLinkOrImg
 * نمایش ویدیو و نظرهای گالری: loadGallery و toggleCritique در همین فایل
 */

const UPLOAD_MAX_MB = 50;
const VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v|3gp|mkv)$/i;
const DOC_EXTS = ['pdf','doc','docx','ppt','pptx','xls','xlsx','txt','zip'];
let mediaObjUrl = null;

// ویدیو هم مثل عکس فقط با ضبط مستقیم دوربین گوشی
(function initCaptureOnly(){
  const v = $('upVideo');
  if(v){ v.setAttribute('accept', 'video/*'); v.setAttribute('capture', 'environment'); }
})();

function resetMediaPreview(){
  if(mediaObjUrl){ try{ URL.revokeObjectURL(mediaObjUrl); }catch(e){} mediaObjUrl = null; }
  const v = $('upVideoPreview');
  if(v){ try{ v.pause(); }catch(e){} v.removeAttribute('src'); v.style.display = 'none'; }
  if($('upVideo')) $('upVideo').value = '';
  if($('upAnyFile')) $('upAnyFile').value = '';
}

function pickMedia(kind){
  $('upErr').textContent = '';
  if(kind === 'video') $('upVideo').click();
  else if(kind === 'file') $('upAnyFile').click();
  else $('upFile').click();
}

function onMediaChosen(kind){
  const input = kind === 'video' ? $('upVideo') : $('upAnyFile');
  const f = input.files[0];
  if(!f) return;
  if(f.size > UPLOAD_MAX_MB * 1024 * 1024){
    showToast('حجم فایل بیشتر از ' + UPLOAD_MAX_MB + ' مگابایته');
    input.value = '';
    return;
  }
  const ext = extOf(f.name, '');
  const isVideo = (f.type || '').startsWith('video/') || VIDEO_EXT_RE.test(f.name || '');
  if(kind === 'video' && !isVideo){
    showToast('فقط ویدیو قابل قبوله');
    input.value = '';
    return;
  }
  if(kind === 'file' && !DOC_EXTS.includes(ext)){
    showToast('این نوع فایل پشتیبانی نمی‌شه (PDF، Word، PowerPoint، Excel، متن یا ZIP)');
    input.value = '';
    return;
  }

  resetMediaPreview();              // آبجکت‌URL قبلی و ورودی‌های دیگه رو پاک می‌کنه
  rawUploadB64 = null;              // عکس قبلی (اگه بود) کنار گذاشته می‌شه
  $('upFile').value = '';
  $('upPreview').style.display = 'none';

  mediaObjUrl = URL.createObjectURL(f);
  uploadFileB64 = mediaObjUrl;      // uploadToStorage با fetch() روی blob: URL هم کار می‌کنه
  uploadFileExt = ext || (isVideo ? 'mp4' : 'bin');

  if(isVideo){
    const v = $('upVideoPreview');
    v.src = mediaObjUrl;
    v.style.display = 'block';
  }
  const mb = (f.size / 1024 / 1024).toFixed(1);
  $('upDrop').textContent = (isVideo ? '✅ ویدیو ضبط شد: ' : '✅ فایل انتخاب شد: ') + f.name + ' (' + mb + ' مگابایت)';
  $('upDrop').classList.add('has-file');
}

/* ---- گسترش توابع موجود در student.js ---- */

// انتخاب عکس: اگه قبلاً ویدیو/فایل انتخاب شده بود، پاک بشه
const _onUploadFileChangeOrig = onUploadFileChange;
onUploadFileChange = function(){
  const f = $('upFile').files[0];
  if(!f) return;
  resetMediaPreview();
  uploadFileB64 = null;
  return _onUploadFileChangeOrig();
};

// باز شدن مودال: وضعیت ویدیو/فایل ریست بشه
const _openUploadModalOrig = openUploadModal;
openUploadModal = function(lessonId, assignmentId){
  resetMediaPreview();
  _openUploadModalOrig(lessonId, assignmentId);
  $('upDrop').textContent = '📷 عکس بگیر یا 🎬 ویدیو ضبط کن (یا فایل بفرست)';
};

// پیام خطای درست وقتی هیچ چیزی انتخاب نشده
const _submitUploadOrig = submitUpload;
submitUpload = function(){
  if($('upTitle').value.trim() && !uploadFileB64){
    $('upErr').textContent = 'یک عکس بگیر، ویدیو ضبط کن یا فایل انتخاب کن';
    return;
  }
  return _submitUploadOrig();
};

/* ---- گالری: نمایش ویدیو با پلیر (بقیه‌ی منطق دقیقاً مثل student.js) ---- */
loadGallery = async function(){
  const el = $('pGallery');
  el.innerHTML = '<div class="filter-row">'+
    '<select id="galSchool" onchange="loadGallery()"><option value="">همه مدارس</option>'+SCHOOLS.map(s=>'<option '+(($('galSchool')&&$('galSchool').value===s)?'selected':'')+' value="'+s+'">'+s+'</option>').join('')+'</select>'+
    '<select id="galGrade" onchange="loadGallery()"><option value="">همه پایه‌ها</option>'+GRADES.map(g=>'<option '+(($('galGrade')&&$('galGrade').value===String(g))?'selected':'')+' value="'+g+'">پایه '+({7:'هفتم',8:'هشتم',9:'نهم'}[g])+'</option>').join('')+'</select>'+
    '</div><div id="galGrid" class="gallery-grid"></div>';
  const school = $('galSchool').value || null, grade = $('galGrade').value ? parseInt($('galGrade').value) : null;
  const { data, error } = await sb.rpc('get_gallery', { p_school: school, p_grade: grade });
  const grid = $('galGrid');
  if(error || !data || !data.length){ grid.outerHTML = emptyState('🖼️','هنوز کاری در گالری نیست','وقتی مربی یک کار رو تأیید و عمومی کنه، اینجا نمایش داده می‌شه'); return; }
  grid.innerHTML = data.map(g=>{
    const isImg = /\.(jpg|jpeg|png|webp|gif)$/i.test(g.file_url);
    const isVid = isVideoUrl(g.file_url);
    const liked = myLikedIds.has(g.id);
    let media;
    if(isImg){
      media = '<div onclick="openLightbox(\''+esc(g.file_url)+'\')"><img src="'+esc(g.file_url)+'"></div>';
    } else if(isVid){
      media = '<div><video controls playsinline preload="metadata" style="width:100%;max-height:220px;display:block;background:#000" src="'+esc(g.file_url)+'"></video></div>';
    } else {
      media = '<div onclick="window.open(\''+esc(g.file_url)+'\',\'_blank\')"><div style="height:120px;display:flex;align-items:center;justify-content:center;font-size:34px;background:var(--paper-dark)">📄</div></div>';
    }
    return '<div class="g-item">'+
      media+
      '<div class="g-body"><div class="g-title">'+esc(g.title)+'</div><div class="g-name">'+esc(maskName(g.student_name))+' · '+esc(g.school)+'</div>'+
      (g.is_eco_friendly? '<div class="eco-badge">♻️ سازگار با محیط‌زیست</div>':'')+
      '<div class="g-actions"><button class="like-btn '+(liked?'liked':'')+'" onclick="toggleLike(\''+g.id+'\', this)">'+(liked?'❤️':'🤍')+' <span>'+g.like_count+'</span></button>'+
      '<button class="like-btn" onclick="toggleCritique(\''+g.id+'\')">💬 نقد سازنده</button></div>'+
      '<div class="critique-panel hidden" id="critique_'+g.id+'"></div>'+
      '</div></div>';
  }).join('');
};

/* ---- نظرهای گالری: نمایش نظر معلم‌ها با نشان «معلم» (بقیه‌ی منطق مثل student.js) ---- */
function critiqueItemHtml(f){
  const who = f.is_staff
    ? '<div style="font-size:12px;font-weight:700;margin-bottom:2px">👩‍🏫 '+esc(f.staff_name||'معلم')+' (معلم)</div>'
    : '';
  return '<div class="critique-item">'+who+
    (f.liked_text? '<div><b>👍 دوست داشتم:</b> '+esc(f.liked_text)+'</div>':'')+
    (f.suggestion_text? '<div><b>💡 پیشنهاد:</b> '+esc(f.suggestion_text)+'</div>':'')+
    '</div>';
}
toggleCritique = async function(submissionId){
  const panel = $('critique_'+submissionId);
  if(!panel.classList.contains('hidden')){ panel.classList.add('hidden'); return; }
  panel.classList.remove('hidden');
  panel.innerHTML = '<div class="lesson-body">در حال بارگذاری...</div>';
  const { data } = await sb.rpc('get_gallery_feedback', { p_submission_id: submissionId });
  let html = (data||[]).map(critiqueItemHtml).join('');
  html += '<div class="field"><label>یه چیزی که دوست داشتی</label><input id="cLiked_'+submissionId+'" placeholder="مثلاً: رنگ‌آمیزیش خیلی قشنگه"></div>'+
    '<div class="field"><label>یه پیشنهاد برای بهترشدن</label><input id="cSugg_'+submissionId+'" placeholder="مثلاً: می‌تونستی لبه‌هاش رو صاف‌تر کنی"></div>'+
    '<button class="btn btn-sky btn-sm" onclick="submitCritique(\''+submissionId+'\')">ارسال نظر</button>';
  panel.innerHTML = html;
};
