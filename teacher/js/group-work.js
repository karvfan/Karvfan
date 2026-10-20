/**
 * group-work.js (مربی) — کار گروهی
 *
 * این فایل بعد از teacher.js لود می‌شه و (مثل بقیه‌ی فایل‌های گسترشی) توابع موجود رو گسترش می‌ده:
 *  - تب «گروه‌ها»: ساخت/ویرایش/حذف گروه (۲ تا ۶ دانش‌آموز از یک مدرسه و پایه)
 *  - تکالیف: تیک «تکلیف گروهی»
 *  - بررسی کارها: کار گروهی با اسم گروه و اعضا نمایش داده می‌شه؛ امتیازی که مربی می‌ده
 *    یک‌بار روی کار ثبت می‌شه و همه‌ی اعضا همون امتیاز کامل رو می‌بینن
 * سمت دیتابیس: supabase/migrations/20261020_student_group_work.sql
 */

const _GW_GRADE_FA = { 7:'هفتم', 8:'هشتم', 9:'نهم' };
let _gmSelected = new Set();   // دانش‌آموزهای تیک‌خورده در مودال گروه

/* ------------------------------------------------------------ تب گروه‌ها */
async function loadGroupsAdmin(){
  const el = $('tGroups');
  el.innerHTML = '<button class="btn btn-thread btn-sm" style="margin-bottom:14px" onclick="openGroupModal(null)">➕ گروه جدید</button>'+
    '<div class="activation-hint">👥 گروه‌ها رو شما می‌سازید. دانش‌آموزی که عضو گروه شد می‌تونه برای «تکلیف‌های گروهی» (تیک «تکلیف گروهی» در تب تکالیف) از طرف گروهش کار بفرسته؛ شما یک‌بار امتیاز می‌دید و همه‌ی اعضا امتیاز کامل رو می‌گیرن.</div>'+
    '<div id="grpList">'+emptyState('⏳','در حال بارگذاری...','')+'</div>';
  const { data, error } = await sb.rpc('teacher_list_groups', { p_schools: activeSchoolNames() });
  window._groupsAdminList = error ? [] : (data||[]);
  const list = $('grpList');
  if(error){ console.error(error); list.innerHTML = emptyState('⚠️','خطا در بارگذاری گروه‌ها', esc(error.message||'')); return; }
  if(!window._groupsAdminList.length){ list.innerHTML = emptyState('👥','هنوز گروهی ساخته نشده','با دکمه‌ی «گروه جدید» اولین گروه رو بسازید'); return; }
  list.innerHTML = window._groupsAdminList.map(g=>
    '<div class="pattern-card"><div class="lesson-admin-row">'+
    '<div><div class="sub-title">👥 '+esc(g.name)+'</div>'+
    '<div class="sub-lesson">'+esc(g.school)+' · پایه '+(_GW_GRADE_FA[g.grade]||g.grade)+' · '+g.members.length+' عضو</div>'+
    '<div class="sub-desc">'+g.members.map(m=>esc(m.full_name)+(m.class_name?' ('+esc(m.class_name)+')':'')).join('، ')+'</div></div>'+
    '<div class="lbtns"><button class="btn btn-ghost btn-sm" onclick="openGroupModal(\''+g.id+'\')">✏️</button>'+
    '<button class="btn btn-brick btn-sm" onclick="deleteGroup(\''+g.id+'\')">🗑️</button></div></div></div>'
  ).join('');
}

async function openGroupModal(id){
  $('gmErr').textContent = '';
  const g = id ? (window._groupsAdminList||[]).find(x=>x.id===id) : null;
  $('gmTitle').textContent = g ? '✏️ ویرایش گروه' : '➕ گروه جدید';
  $('gmId').value = g ? g.id : '';
  $('gmName').value = g ? g.name : '';
  $('gmSearch').value = '';
  const names = schoolOptionNames().slice();
  if(g && !names.includes(g.school)) names.push(g.school);
  $('gmSchool').innerHTML = names.map(n=>'<option value="'+esc(n)+'">'+esc(n)+'</option>').join('');
  $('gmSchool').value = g ? g.school : (_schoolPick || names[0] || '');
  $('gmGrade').value = g ? String(g.grade) : '7';
  _gmSelected = new Set(g ? g.members.map(m=>m.id) : []);
  openModal('groupModalOv');
  await loadGroupStudents();
}

async function loadGroupStudents(){
  const school = $('gmSchool').value, grade = parseInt($('gmGrade').value);
  const box = $('gmStudents');
  if(!school){ box.innerHTML = '<div class="sub-desc">اول مدرسه رو انتخاب کنید</div>'; return; }
  box.innerHTML = '<div class="sub-desc">در حال بارگذاری...</div>';
  const { data, error } = await sb.from('students').select('id, full_name, class_name').eq('school', school).eq('grade', grade).order('class_name').order('full_name');
  if(error){ console.error(error); box.innerHTML = '<div class="sub-desc">خطا در بارگذاری دانش‌آموزان</div>'; return; }
  const rows = data || [];
  // اعضای انتخاب‌شده‌ای که تو این مدرسه/پایه نیستن کنار گذاشته می‌شن
  const ids = new Set(rows.map(r=>r.id));
  _gmSelected = new Set([..._gmSelected].filter(x=>ids.has(x)));
  if(!rows.length){ box.innerHTML = '<div class="sub-desc">دانش‌آموزی در این مدرسه و پایه ثبت نشده</div>'; updateGroupCount(); return; }
  box.innerHTML = rows.map(s=>
    '<label class="chk-row" data-name="'+esc(s.full_name)+'"><input type="checkbox" value="'+esc(s.id)+'" '+(_gmSelected.has(s.id)?'checked':'')+' onchange="onGroupMemberToggle(this)" style="width:auto"> '+esc(s.full_name)+(s.class_name?' · '+esc(s.class_name):'')+'</label>'
  ).join('');
  filterGroupStudents();
  updateGroupCount();
}
function filterGroupStudents(){
  const q = ($('gmSearch').value||'').trim();
  document.querySelectorAll('#gmStudents label[data-name]').forEach(l=>{
    l.style.display = (!q || l.dataset.name.includes(q)) ? '' : 'none';
  });
}
function onGroupMemberToggle(cb){
  if(cb.checked) _gmSelected.add(cb.value); else _gmSelected.delete(cb.value);
  updateGroupCount();
}
function updateGroupCount(){
  $('gmCount').textContent = _gmSelected.size.toLocaleString('fa-IR')+' نفر انتخاب شده';
}

async function saveGroup(){
  const name = $('gmName').value.trim();
  const ids = [..._gmSelected];
  $('gmErr').textContent = '';
  if(!name){ $('gmErr').textContent = 'نام گروه را بنویسید'; return; }
  if(ids.length < 2 || ids.length > 6){ $('gmErr').textContent = 'هر گروه باید بین ۲ تا ۶ عضو داشته باشد'; return; }
  $('gmBtn').disabled = true; $('gmBtn').innerHTML = '<span class="spinner"></span> در حال ذخیره...';
  const { error } = await sb.rpc('teacher_save_group', {
    p_group_id: $('gmId').value || null, p_name: name, p_school: $('gmSchool').value,
    p_grade: parseInt($('gmGrade').value), p_member_ids: ids
  });
  $('gmBtn').disabled = false; $('gmBtn').textContent = 'ذخیره گروه';
  if(error){ $('gmErr').textContent = error.message || 'خطا در ذخیره'; console.error(error); return; }
  closeModal('groupModalOv');
  showToast('✅ گروه ذخیره شد');
  loadGroupsAdmin();
}
async function deleteGroup(id){
  const g = (window._groupsAdminList||[]).find(x=>x.id===id);
  if(!confirm('گروه «'+(g?g.name:'')+'» حذف بشه؟')) return;
  const { error } = await sb.rpc('teacher_delete_group', { p_group_id: id });
  if(error){ showToast('❌ '+(error.message||'خطا در حذف')); console.error(error); return; }
  showToast('🗑️ گروه حذف شد');
  loadGroupsAdmin();
}

/* ------------------------------------------------------------ تب‌ها */
const _gwSwitchTeacherTab = switchTeacherTab;
switchTeacherTab = function(id){
  _gwSwitchTeacherTab(id);
  if(id === 'tGroups') loadGroupsAdmin();
};

/* ------------------------------------------------------------ تکالیف: تیک «گروهی» */
const _gwOpenAssignmentModal = openAssignmentModal;
openAssignmentModal = function(id){
  _gwOpenAssignmentModal(id);
  const a = id ? (window._assignAdminList||[]).find(x=>x.id===id) : null;
  $('amGroup').checked = !!(a && a.is_group);
};

// همان saveAssignment در teacher.js + فیلد is_group (payload داخل تابع ساخته می‌شه و قابل گسترش نیست)
saveAssignment = async function(){
  const title = $('amTitleInput').value.trim();
  if(!title){ $('amErr').textContent='عنوان تکلیف را بنویسید'; return; }
  const names = activeSchoolNames();
  const school = $('amSchool').value.trim();
  if(names && school && !_mySchools.some(s=>s.name===school)){ $('amErr').textContent='مدرسه باید یکی از مدرسه‌های خودتان باشد'; return; }
  const payload = {
    title, description: $('amDesc').value.trim()||null,
    grade: $('amGrade').value?parseInt($('amGrade').value):null,
    due_date: $('amDue').value||null,
    points_hint: parseInt($('amPoints').value)||10,
    is_active: $('amActive').checked,
    is_open_challenge: $('amChallenge').checked,
    challenge_type: $('amChallengeType').value,
    is_group: $('amGroup').checked
  };
  const id = $('amId').value;
  let error;
  if(id){
    ({ error } = await sb.from('assignments').update({ ...payload, school: school||null }).eq('id',id));
  } else if(names && !school){
    // مدرسه‌ای انتخاب نشده → برای هرکدوم از مدرسه‌های من یه تکلیف جدا ثبت می‌شه
    ({ error } = await sb.from('assignments').insert(names.map(n=>({ ...payload, school:n }))));
  } else {
    ({ error } = await sb.from('assignments').insert({ ...payload, school: school||null }));
  }
  if(error){ $('amErr').textContent='خطا در ذخیره'; console.error(error); return; }
  closeModal('assignModalOv'); showToast('✅ تکلیف ذخیره شد'); loadAssignmentsAdmin();
};

const _gwLoadAssignmentsAdmin = loadAssignmentsAdmin;
loadAssignmentsAdmin = async function(){
  await _gwLoadAssignmentsAdmin();
  (window._assignAdminList||[]).filter(a=>a.is_group).forEach(a=>{
    const btn = document.querySelector('#tAssign button[onclick="openAssignmentModal(\''+a.id+'\')"]');
    const row = btn && btn.closest('.lesson-admin-row');
    const line = row && row.querySelector('.sub-lesson');
    if(line) line.insertAdjacentHTML('beforeend', ' · 👥 گروهی');
  });
};

/* ------------------------------------------------------------ بررسی کارها */
const _gwLoadReview = loadReview;
loadReview = async function(){
  await _gwLoadReview();
  if(!(teacherAllSubs||[]).some(s=>s.group_id)) return;
  const { data } = await sb.rpc('teacher_list_groups', { p_schools: activeSchoolNames() });
  const map = Object.fromEntries((data||[]).map(g=>[g.id, g]));
  const cards = document.querySelectorAll('#rvList > .pattern-card');
  teacherAllSubs.forEach((s,i)=>{
    if(!s.group_id) return;
    const card = cards[i];
    if(!card) return;
    const g = map[s.group_id];
    const who = g ? 'گروه «'+esc(g.name)+'»: '+g.members.map(m=>esc(m.full_name)).join('، ') : 'گروه';
    const line = card.querySelector('.sub-card-head .sub-lesson');
    if(line) line.insertAdjacentHTML('afterend', '<div class="sub-lesson">👥 کار گروهی — '+who+'</div>');
    const pts = card.querySelector('input[id^="rvPts_"]');
    if(pts) pts.insertAdjacentHTML('afterend', '<div class="sub-desc" style="font-size:12px">👥 این امتیاز برای همه‌ی اعضای گروه ثبت می‌شه</div>');
  });
};
