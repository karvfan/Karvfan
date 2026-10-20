/**
 * group-work.js (دانش‌آموز) — کار گروهی
 *
 * این فایل بعد از student.js / upload-media.js / edit-submission.js لود می‌شه و
 * (مثل بقیه‌ی فایل‌های گسترشی) توابع موجود رو گسترش می‌ده:
 *  - تب «تکالیف»: تکلیف‌های گروهی با اسم گروه و اعضا نمایش داده می‌شن
 *  - آپلود: برای تکلیف گروهی، گروه انتخاب می‌شه و کار با student_submit_group_work ثبت می‌شه
 *  - «کارهای من»: کار گروه برای همه‌ی اعضا (با همون امتیاز کامل) نمایش داده می‌شه
 *  - پروفایل: لیست گروه‌های من
 *
 * گروه‌ها فقط توسط مربی ساخته می‌شن (پنل مربی ← تب «گروه‌ها») و فقط تکالیفی که مربی
 * «گروهی» علامت زده کار گروهی می‌پذیرن. هر گروه برای هر تکلیف یک کار می‌فرسته.
 * سمت دیتابیس: supabase/migrations/20261020_student_group_work.sql
 */

let myGroups = [];              // [{id,name,school,grade,members:[{id,full_name}]}]
let _gwDone = new Set();        // «groupId::assignmentId» برای کارهای گروهیِ ثبت‌شده

function _gwAssignment(id){ return (assignments||[]).find(x=>x.id===id); }
function _gwMembersText(g){ return (g.members||[]).map(m=>m.full_name).join('، '); }

async function loadMyGroups(){
  const { data, error } = await sb.rpc('get_my_groups', { p_student_id: student.id });
  myGroups = (error || !data) ? [] : data;
  return myGroups;
}
function groupsForAssignment(a){
  return myGroups.filter(g=> (!a.grade || a.grade===g.grade) && (!a.school || a.school===g.school));
}

/* ------------------------------------------------------------ تب تکالیف */
const _gwLoadAssignmentsPanel = loadAssignmentsPanel;
loadAssignmentsPanel = async function(){
  await _gwLoadAssignmentsPanel();
  if(!(assignments||[]).some(a=>a.is_group)) return;
  const [, subsRes] = await Promise.all([
    loadMyGroups(),
    sb.rpc('get_my_submissions', { p_student_id: student.id })
  ]);
  _gwDone = new Set(((subsRes && subsRes.data)||[]).filter(s=>s.group_id && s.assignment_id).map(s=>s.group_id+'::'+s.assignment_id));
  const el = $('pAssign');
  assignments.filter(a=>a.is_group).forEach(a=>{
    const btn = el.querySelector('button[onclick*="openUploadModal(null,\''+a.id+'\')"]');
    if(!btn) return;
    const card = btn.closest('.pattern-card');
    const groups = groupsForAssignment(a);
    let html = '<div class="sub-lesson">👥 تکلیف گروهی — هر گروه یک کار می‌فرسته و همه‌ی اعضا امتیاز کامل می‌گیرن</div>';
    if(!groups.length){
      html += '<div class="sub-desc">⏳ هنوز مربی تو رو عضو گروهی نکرده. بعد از ساخته‌شدن گروه، از همین‌جا می‌تونی کار گروهت رو بفرستی.</div>';
      btn.disabled = true;
      btn.textContent = '🔒 منتظر ساخته‌شدن گروهت';
    } else {
      html += groups.map(g=>'<div class="sub-desc">👥 گروه «'+esc(g.name)+'»: '+esc(_gwMembersText(g))+(_gwDone.has(g.id+'::'+a.id)?' — ✅ کار ثبت شده':'')+'</div>').join('');
      if(groups.every(g=>_gwDone.has(g.id+'::'+a.id))){
        btn.textContent = '✅ کار گروه ثبت شده — دیدن در «کارهای من»';
        btn.setAttribute('onclick', "switchStudentTab('pMine')");
      } else {
        btn.textContent = '📤 آپلود کار گروهی';
      }
    }
    const divider = card.querySelector('.scissor-divider');
    if(divider) divider.insertAdjacentHTML('beforebegin', html); else card.insertAdjacentHTML('beforeend', html);
  });
};

/* ------------------------------------------------------------ مودال آپلود */
function _gwOnGroupChange(){
  const g = myGroups.find(x=>x.id===$('upGroup').value);
  $('upGroupHint').textContent = g ? 'اعضای گروه: '+_gwMembersText(g) : '';
  onWatermarkFieldsChange();
}
async function _gwFillGroupField(a){
  const field = $('upGroupField');
  if(!field) return;
  const sel = $('upGroup'), hint = $('upGroupHint');
  if(!a || !a.is_group){ field.style.display = 'none'; sel.innerHTML = ''; hint.textContent = ''; return; }
  field.style.display = 'block';
  if(!myGroups.length) await loadMyGroups();
  const all = groupsForAssignment(a);
  const open = all.filter(g=>!_gwDone.has(g.id+'::'+a.id));
  if(!open.length){
    sel.innerHTML = ''; sel.disabled = true;
    hint.textContent = all.length
      ? 'کار گروه تو برای این تکلیف قبلاً ثبت شده — از «کارهای من» ویرایشش کن.'
      : 'هنوز عضو هیچ گروهی نیستی؛ از مربی بخواه گروهت رو بسازه.';
    return;
  }
  sel.disabled = false;
  sel.innerHTML = open.map(g=>'<option value="'+esc(g.id)+'">'+esc(g.name)+'</option>').join('');
  _gwOnGroupChange();
}

const _gwOpenUploadModal = openUploadModal;
openUploadModal = function(lessonId, assignmentId){
  _gwOpenUploadModal(lessonId, assignmentId);
  _gwFillGroupField(assignmentId ? _gwAssignment(assignmentId) : null);
};

// اسم گروه هم روی واترمارک عکس بیاد
const _gwCurrentWatermarkLines = currentWatermarkLines;
currentWatermarkLines = function(){
  const lines = _gwCurrentWatermarkLines();
  const a = uploadAssignmentId ? _gwAssignment(uploadAssignmentId) : null;
  const sel = $('upGroup');
  if(a && a.is_group && sel && sel.value){
    const g = myGroups.find(x=>x.id===sel.value);
    if(g) lines.splice(Math.min(2, lines.length), 0, 'گروه: '+g.name);
  }
  return lines;
};

const _gwSubmitUpload = submitUpload;
submitUpload = function(){
  const a = uploadAssignmentId ? _gwAssignment(uploadAssignmentId) : null;
  if(a && a.is_group) return submitGroupUpload(a);
  return _gwSubmitUpload();
};

async function submitGroupUpload(a){
  const title = $('upTitle').value.trim();
  const groupId = $('upGroup').value;
  $('upErr').textContent = '';
  if(!groupId){ $('upErr').textContent = 'گروهی برای ارسال این کار پیدا نشد'; return; }
  if(!title){ $('upErr').textContent = 'عنوان کار را بنویسید'; return; }
  if(!uploadFileB64){ $('upErr').textContent = 'یک عکس بگیر، ویدیو ضبط کن یا فایل انتخاب کن'; return; }
  $('upBtn').disabled = true; $('upBtn').innerHTML = '<span class="spinner"></span> در حال ارسال...';
  try{
    const fileUrl = await uploadToStorage('submission-files', uploadFileB64, uploadFileExt);
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
    const { error } = await sb.rpc('student_submit_group_work', {
      p_student_id: student.id, p_group_id: groupId, p_assignment_id: a.id, p_title: title,
      p_description: isChallenge ? null : ($('upDesc').value.trim() || null),
      p_file_url: fileUrl, p_design_reflection: design_reflection,
      p_is_eco_friendly: is_eco_friendly, p_eco_note: eco_note
    });
    if(error) throw error;
    closeModal('uploadModalOv');
    showToast('✅ کار گروه ارسال شد و در انتظار بررسی مربیه');
    switchStudentTab('pMine');
  }catch(e){
    // پیام‌های فارسیِ دیتابیس (مثلاً «تو عضو این گروه نیستی») مستقیم نشون داده می‌شن
    $('upErr').textContent = (e && e.message && /[\u0600-\u06FF]/.test(e.message)) ? e.message : 'خطا در ارسال — دوباره تلاش کنید';
    console.error(e);
  }finally{
    $('upBtn').disabled = false; $('upBtn').textContent = 'ارسال کار';
  }
}

/* ------------------------------------------------------------ کارهای من */
const _gwLoadMySubmissions = loadMySubmissions;
loadMySubmissions = async function(){
  await _gwLoadMySubmissions();
  const cards = document.querySelectorAll('#pMine > .pattern-card');
  (_mySubsList||[]).forEach((s,i)=>{
    if(!s.group_id) return;
    const card = cards[i];
    if(!card) return;
    const mine = s.student_id === student.id;
    const head = card.querySelector('.sub-title');
    if(head && head.parentNode){
      head.parentNode.insertAdjacentHTML('beforeend',
        '<div class="sub-lesson">👥 کار گروهی — گروه «'+esc(s.group_name||'')+'»'+(mine?'':' · ثبت‌شده توسط '+esc(s.submitter_name||''))+'</div>');
    }
    if(!mine){
      // حذف و نظرسنجی فقط برای کسی که کار رو فرستاده؛ ویرایش برای همه‌ی اعضا بازه
      const del = card.querySelector('button[onclick^="deleteMySubmission"]');
      if(del) del.remove();
      const mood = card.querySelector('.mood-row');
      if(mood) mood.remove();
    }
  });
};

/* ------------------------------------------------------------ پروفایل */
const _gwLoadProfilePanel = loadProfilePanel;
loadProfilePanel = async function(){
  await _gwLoadProfilePanel();
  await loadMyGroups();
  if(!myGroups.length) return;
  const el = $('pProfile');
  if(el.querySelector('#gwProfileGroups')) return;
  const html = '<div id="gwProfileGroups"><div class="sec-title">👥 گروه‌های من</div><div class="pattern-card">'+
    myGroups.map(g=>'<div class="student-row"><span>'+esc(g.name)+'</span><span>'+esc(_gwMembersText(g))+'</span></div>').join('')+
    '</div></div>';
  const first = el.querySelector('.pattern-card');
  if(first) first.insertAdjacentHTML('afterend', html); else el.insertAdjacentHTML('beforeend', html);
};
