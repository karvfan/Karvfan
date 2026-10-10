/**
 * edit-submission.js — ویرایش و حذف کارهایی که دانش‌آموز ثبت کرده
 *
 * این فایل بعد از student.js لود می‌شه و loadMySubmissions را بازنویسی می‌کنه تا
 * زیر هر کارِ «در انتظار بررسی»، «نیاز به اصلاح» یا «ردشده» دکمه‌ی ویرایش و حذف نشون بده.
 * کارهای تأییدشده قفل هستن (امتیاز دارن و ممکنه در گالری باشن).
 *
 * متن کار (عنوان، توضیح، سؤال‌های چالش، محیط‌زیست) قابل ویرایشه. برای عوض‌کردن
 * عکس/فایل، کار رو حذف و دوباره آپلود کنید.
 * سمت دیتابیس: RPCهای student_update_submission و student_delete_submission.
 */

let _mySubsList = [];

function _parseRefl(v){
  if(!v) return null;
  if(typeof v === 'object') return v;
  try{ return JSON.parse(v); }catch(e){ return null; }
}
function _isEditableStatus(st){ return st !== 'approved'; }

loadMySubmissions = async function(){
  const el = $('pMine');
  el.innerHTML = '<div class="empty-state"><div class="ic">⏳</div><div class="d">در حال بارگذاری...</div></div>';
  const { data, error } = await sb.rpc('get_my_submissions', { p_student_id: student.id });
  if(error || !data || !data.length){
    _mySubsList = [];
    el.innerHTML = emptyState('📤','هنوز کاری آپلود نکردید','با دکمه‌ی ＋ پایین صفحه اولین کارتون رو بفرستید!');
    return;
  }
  _mySubsList = data;
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
    '</div>'+
    (_isEditableStatus(s.status)
      ? '<div style="display:flex;gap:8px;margin-top:10px">'+
          '<button class="btn btn-sky btn-sm" onclick="openEditSubmission(\''+s.id+'\')">✏️ ویرایش</button>'+
          '<button class="btn btn-brick btn-sm" onclick="deleteMySubmission(\''+s.id+'\')">🗑️ حذف</button>'+
        '</div>'
      : '<div class="sub-desc" style="margin-top:8px;font-size:12px">🔒 کار تأییدشده قابل ویرایش یا حذف نیست</div>')+
    moodPickerHtml('sub',s.id,s.mood)+
    '</div>').join('');
};

/* ------------------------------------------------------------ مودال ویرایش (به‌صورت پویا ساخته می‌شه) */
function ensureEditSubModal(){
  if($('editSubModalOv')) return;
  const ov = document.createElement('div');
  ov.className = 'modal-ov';
  ov.id = 'editSubModalOv';
  ov.innerHTML =
    '<div class="modal">'+
      '<div class="modal-head"><h3>✏️ ویرایش کار</h3><button class="modal-close" onclick="closeModal(\'editSubModalOv\')">✕</button></div>'+
      '<input type="hidden" id="esId">'+
      '<div class="quiz-hint" id="esHint" style="margin-bottom:10px"></div>'+
      '<div class="field"><label>عنوان کار</label><input id="esTitle"></div>'+
      '<div class="field" id="esDescField"><label>توضیح کوتاه (اختیاری)</label><textarea id="esDesc" rows="3"></textarea></div>'+
      '<div id="esReflFields"></div>'+
      '<div class="field">'+
        '<label style="display:flex;align-items:center;gap:6px"><input type="checkbox" id="esEco" style="width:auto" onchange="$(\'esEcoNote\').classList.toggle(\'hidden\', !this.checked)"> ♻️ از مواد بازیافتی یا دورریختنی استفاده کردم</label>'+
        '<textarea id="esEcoNote" rows="2" class="hidden" placeholder="چطور این کار رو سازگارتر با محیط‌زیست کردی؟" style="margin-top:6px"></textarea>'+
      '</div>'+
      '<div style="font-size:11.5px;color:var(--sub);margin-bottom:8px">برای عوض کردن عکس یا فایل، کار رو حذف کن و دوباره آپلود کن.</div>'+
      '<div class="field-err" id="esErr"></div>'+
      '<div class="modal-actions">'+
        '<button class="btn btn-ghost" style="flex:1" onclick="closeModal(\'editSubModalOv\')">انصراف</button>'+
        '<button class="btn btn-thread" style="flex:2" id="esBtn" onclick="saveMySubmission()">ذخیره‌ی تغییرات</button>'+
      '</div>'+
    '</div>';
  document.body.appendChild(ov);
}

const _ES_DESIGN_FIELDS = [
  ['problem','۱. چه مشکل یا نیاز واقعی‌ای رو پیدا کردی؟'],
  ['ideas','۲. چه ایده‌های مختلفی به ذهنت رسید؟'],
  ['why_chosen','۳. چرا همین ایده رو انتخاب کردی؟'],
  ['how_built','۴. چطور ساختیش؟'],
  ['improvement','۵. اگه دوباره می‌ساختیش، چی رو بهتر می‌کردی؟']
];
const _ES_COMPANY_FIELDS = [
  ['product','۱. محصولت چیه و چه مشکلی رو حل می‌کنه؟'],
  ['price','۲. قیمتش چقدره و چرا همین قیمت؟'],
  ['sell_plan','۳. چطور می‌خوای بفروشیش/تبلیغش کنی؟'],
  ['customers','۴. مشتری‌های احتمالیت کی‌ان؟']
];

function openEditSubmission(id){
  const s = _mySubsList.find(x=>x.id===id);
  if(!s) return;
  if(!_isEditableStatus(s.status)){ showToast('کار تأییدشده قابل ویرایش نیست'); return; }
  ensureEditSubModal();
  $('esErr').textContent = '';
  $('esId').value = s.id;
  $('esTitle').value = s.title || '';
  $('esEco').checked = !!s.is_eco_friendly;
  $('esEcoNote').value = s.eco_note || '';
  $('esEcoNote').classList.toggle('hidden', !s.is_eco_friendly);
  $('esHint').textContent = s.status === 'pending'
    ? 'این کار هنوز در انتظار بررسی مربیه، هر تغییری بدی همون نسخه‌ی جدید بررسی می‌شه.'
    : 'بعد از ذخیره، کار دوباره برای بررسی مربی فرستاده می‌شه.';

  const refl = _parseRefl(s.design_reflection);
  const fields = !refl ? null : (refl.type === 'company' ? _ES_COMPANY_FIELDS : _ES_DESIGN_FIELDS);
  const reflBox = $('esReflFields');
  if(fields){
    $('esDescField').classList.add('hidden');
    reflBox.dataset.type = refl.type === 'company' ? 'company' : 'design';
    reflBox.innerHTML = fields.map(f=>'<div class="field"><label>'+f[1]+'</label><textarea id="esR_'+f[0]+'" rows="2"></textarea></div>').join('');
    fields.forEach(f=>{ $('esR_'+f[0]).value = refl[f[0]] || ''; });
  } else {
    $('esDescField').classList.remove('hidden');
    $('esDesc').value = s.description || '';
    reflBox.dataset.type = '';
    reflBox.innerHTML = '';
  }
  openModal('editSubModalOv');
}

async function saveMySubmission(){
  const id = $('esId').value;
  const title = $('esTitle').value.trim();
  const errEl = $('esErr'); errEl.textContent = '';
  if(!title){ errEl.textContent = 'عنوان کار را بنویسید'; return; }

  const reflBox = $('esReflFields');
  const type = reflBox.dataset.type;
  let description = null, design_reflection = null;
  if(type){
    const fields = type === 'company' ? _ES_COMPANY_FIELDS : _ES_DESIGN_FIELDS;
    const obj = { type };
    fields.forEach(f=>{ obj[f[0]] = $('esR_'+f[0]).value.trim(); });
    design_reflection = JSON.stringify(obj);
  } else {
    description = $('esDesc').value.trim() || null;
  }
  const is_eco_friendly = $('esEco').checked;
  const eco_note = is_eco_friendly ? ($('esEcoNote').value.trim() || null) : null;

  $('esBtn').disabled = true; $('esBtn').innerHTML = '<span class="spinner"></span> در حال ذخیره...';
  const { error } = await sb.rpc('student_update_submission', {
    p_submission_id: id, p_student_id: student.id, p_title: title, p_description: description,
    p_design_reflection: design_reflection, p_is_eco_friendly: is_eco_friendly, p_eco_note: eco_note
  });
  $('esBtn').disabled = false; $('esBtn').textContent = 'ذخیره‌ی تغییرات';
  if(error){ errEl.textContent = 'خطا: ' + (error.message || 'ذخیره نشد'); console.error(error); return; }
  closeModal('editSubModalOv');
  showToast('✅ تغییرات ذخیره شد');
  loadMySubmissions();
}

async function deleteMySubmission(id){
  const s = _mySubsList.find(x=>x.id===id);
  if(!s) return;
  if(!_isEditableStatus(s.status)){ showToast('کار تأییدشده قابل حذف نیست'); return; }
  if(!confirm('کار «'+s.title+'» حذف بشه؟ این کار برگشت‌پذیر نیست.')) return;
  const { error } = await sb.rpc('student_delete_submission', { p_submission_id: id, p_student_id: student.id });
  if(error){ showToast('❌ ' + (error.message || 'خطا در حذف')); console.error(error); return; }
  showToast('🗑️ کار حذف شد');
  loadMySubmissions();
  refreshMineBadge();
}
