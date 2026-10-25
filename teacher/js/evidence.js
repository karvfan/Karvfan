/**
 * evidence.js — پنل معلم: «سند کلاسی» (عکس/فیلم) و «طرح درس پودمان»
 * نیازمند: متغیر سراسری sb (کلاینت Supabase) و ورود معلم (Supabase Auth).
 * استفاده:  <div id="evidenceRoot"></div>  و سپس  initTeacherEvidence('evidenceRoot')
 * فایل‌ها در bucket خصوصی class-evidence ذخیره می‌شوند؛ نمایش با signed URL.
 */
(function () {
  const BUCKET = 'class-evidence';
  const MAX_FILES = 10;
  const MAX_BYTES = 50 * 1024 * 1024;
  const GRADE = { 7: 'هفتم', 8: 'هشتم', 9: 'نهم' };
  const $e = (id) => document.getElementById(id);
  const E = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toast = (m) => (typeof showToast === 'function' ? showToast(m) : alert(m));
  const fa = (d) => new Date(d).toLocaleDateString('fa-IR');
  const S = { uid: null, schools: [], lessons: [], students: [] };

  const css = `
.kfe{direction:rtl;font-family:inherit}
.kfe-tabs{display:flex;gap:8px;margin-bottom:12px}
.kfe-tabs button{flex:1;padding:10px;border:1px solid #cbd5e1;background:#fff;border-radius:10px;font:inherit;cursor:pointer}
.kfe-tabs button.on{background:#0f766e;color:#fff;border-color:#0f766e}
.kfe-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px;margin-bottom:12px}
.kfe-h{font-weight:700;margin-bottom:8px}
.kfe label{display:block;margin:10px 0 4px;font-size:13px;color:#475569}
.kfe input,.kfe select,.kfe textarea{width:100%;box-sizing:border-box;padding:9px;border:1px solid #cbd5e1;border-radius:8px;font:inherit}
.kfe-btn{margin-top:14px;width:100%;padding:11px;border:0;border-radius:10px;background:#0f766e;color:#fff;font:inherit;cursor:pointer}
.kfe-btn:disabled{opacity:.6}
.kfe-del{background:#fee2e2;color:#b91c1c;border:0;border-radius:8px;padding:6px 10px;font:inherit;cursor:pointer}
.kfe-media{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:6px;margin:8px 0}
.kfe-media img,.kfe-media video{width:100%;height:90px;object-fit:cover;border-radius:8px;background:#000}
.kfe-meta{font-size:12px;color:#64748b}
.kfe-empty{text-align:center;color:#94a3b8;padding:18px}`;

  const opts = (arr, vKey, label, ph) =>
    (ph ? `<option value="">${ph}</option>` : '') +
    arr.map((x) => `<option value="${E(x[vKey])}">${E(typeof label === 'function' ? label(x) : x[label])}</option>`).join('');
  const lessonLabel = (l) => `${GRADE[l.grade] || l.grade || ''} — ${l.unit_title}`;

  /**
   * مدرسه‌های معلم.
   * جدول staff_schools فعال‌بودن RLS دارد و policy برای خواندن مستقیم ندارد؛ پس
   * sb.from('staff_schools') همیشه خالی برمی‌گشت و معلم‌های چندمدرسه‌ای فقط مدرسه‌ی اصلی‌شون
   * (staff.school_id) رو می‌دیدن. rpc('my_schools') (SECURITY DEFINER) همون چیزیه که بقیه‌ی پنل
   * مربی هم استفاده می‌کنه (teacher.js → loadMySchools).
   */
  async function fetchMySchools(uid) {
    const { data, error } = await sb.rpc('my_schools');
    if (error) console.error('my_schools failed:', error);
    if (!error && data && data.length) return data.map((s) => ({ id: s.id, name: s.name }));
    // fallback: مدرسه‌ی اصلی در جدول staff
    const { data: me } = await sb.from('staff').select('school_id').eq('id', uid).maybeSingle();
    if (me && me.school_id) {
      const { data: sc } = await sb.from('schools').select('id,name').eq('id', me.school_id);
      return sc || [];
    }
    return [];
  }
  window.kfFetchMySchools = fetchMySchools;

  async function loadContext() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new Error('not logged in');
    S.uid = user.id;
    const [schools, ls] = await Promise.all([
      fetchMySchools(user.id),
      sb.from('lessons').select('id,unit_title,grade,order_index').eq('is_published', true).order('grade').order('order_index'),
    ]);
    S.schools = schools;
    S.lessons = ls.data || [];
  }

  async function signedMap(paths) {
    const map = {};
    if (!paths.length) return map;
    const { data } = await sb.storage.from(BUCKET).createSignedUrls(paths, 3600);
    (data || []).forEach((x) => { if (x.signedUrl) map[x.path] = x.signedUrl; });
    return map;
  }

  async function uploadOne(file, schoolId) {
    if (file.size > MAX_BYTES) throw new Error('حجم «' + file.name + '» بیشتر از ۵۰ مگابایت است');
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${S.uid}/${schoolId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    return { path, type: file.type.startsWith('video/') ? 'video' : 'image' };
  }

  // ---------- UI ----------
  function shell(root) {
    root.innerHTML = `<style>${css}</style><div class="kfe">
<div class="kfe-tabs"><button id="kfeTabEv" class="on">📷 سند کلاسی</button><button id="kfeTabLp">📝 طرح درس</button></div>
<div id="kfeEv">
  <div class="kfe-card"><div class="kfe-h">ثبت سند کلاسی برای مدیر</div>
    <label>مدرسه</label><select id="evSchool"></select>
    <label>پودمان</label><select id="evLesson"></select>
    <label>دانش‌آموز (اختیاری)</label><select id="evStudent"></select>
    <label>عنوان</label><input id="evTitle" maxlength="200" placeholder="مثلاً: ساخت مدار ساده در کارگاه">
    <label>توضیح</label><textarea id="evDesc" rows="3"></textarea>
    <label>عکس / فیلم (حداکثر ${MAX_FILES} فایل، هرکدام تا ۵۰ مگابایت)</label>
    <input id="evFiles" type="file" multiple accept="image/*,video/*">
    <button id="evSave" class="kfe-btn">ثبت و ارسال برای مدیر</button>
  </div>
  <div id="evList"></div>
</div>
<div id="kfeLp" style="display:none">
  <div class="kfe-card"><div class="kfe-h">طرح درس پودمان (به نام شما)</div>
    <label>مدرسه</label><select id="lpSchool"></select>
    <label>پودمان</label><select id="lpLesson"></select>
    <label>پایه / کلاس</label><input id="lpClass" placeholder="مثلاً هشتم الف">
    <label>تعداد جلسات</label><input id="lpSessions" type="number" min="1">
    <label>مدت هر جلسه (دقیقه)</label><input id="lpDuration" type="number" min="1">
    <label>اهداف *</label><textarea id="lpObjectives" rows="3"></textarea>
    <label>مواد و ابزار</label><textarea id="lpMaterials" rows="2"></textarea>
    <label>روند اجرای درس *</label><textarea id="lpSteps" rows="5"></textarea>
    <label>ارزشیابی</label><textarea id="lpAssessment" rows="2"></textarea>
    <label>نکات ایمنی</label><textarea id="lpSafety" rows="2"></textarea>
    <label>یادداشت</label><textarea id="lpNotes" rows="2"></textarea>
    <label>فایل پیوست (PDF یا تصویر، اختیاری)</label><input id="lpFile" type="file" accept="application/pdf,image/*">
    <div id="lpCurFile" class="kfe-meta"></div>
    <button id="lpSave" class="kfe-btn">ذخیره‌ی طرح درس</button>
  </div>
  <div id="lpList"></div>
</div></div>`;
  }

  function fillSelects() {
    const noSchool = !S.schools.length;
    const so = noSchool
      ? '<option value="">مدرسه‌ای به حساب شما متصل نیست</option>'
      : opts(S.schools, 'id', 'name', S.schools.length > 1 ? 'انتخاب مدرسه' : '');
    const lo = opts(S.lessons, 'id', lessonLabel, 'انتخاب پودمان');
    $e('evSchool').innerHTML = so; $e('lpSchool').innerHTML = so;
    $e('evLesson').innerHTML = lo; $e('lpLesson').innerHTML = lo;
  }

  async function loadStudents() {
    const sc = S.schools.find((x) => String(x.id) === $e('evSchool').value);
    S.students = [];
    if (sc) {
      // students.school در دیتابیس متن (نام مدرسه) است
      const { data } = await sb.from('students').select('id,full_name,class_name').eq('school', sc.name).order('full_name');
      S.students = data || [];
    }
    $e('evStudent').innerHTML = opts(S.students, 'id', (s) => s.full_name + (s.class_name ? ' — ' + s.class_name : ''), 'بدون انتخاب دانش‌آموز');
  }

  // ---------- سند کلاسی ----------
  async function saveEvidence() {
    const schoolId = Number($e('evSchool').value);
    const lessonId = $e('evLesson').value;
    const title = $e('evTitle').value.trim();
    const files = [...$e('evFiles').files];
    if (!schoolId || !lessonId || !title || !files.length) return toast('مدرسه، پودمان، عنوان و حداقل یک فایل لازم است');
    if (files.length > MAX_FILES) return toast('حداکثر ' + MAX_FILES + ' فایل');
    const btn = $e('evSave'); btn.disabled = true; btn.textContent = 'در حال آپلود…';
    const uploaded = [];
    try {
      for (const f of files) uploaded.push(await uploadOne(f, schoolId));
      const { error } = await sb.from('class_evidence').insert({
        school_id: schoolId, lesson_id: lessonId,
        student_id: $e('evStudent').value || null,
        title, description: $e('evDesc').value.trim() || null, media: uploaded,
      });
      if (error) throw error;
      toast('✅ سند ثبت شد');
      $e('evTitle').value = ''; $e('evDesc').value = ''; $e('evFiles').value = '';
      renderEvidence();
    } catch (e) {
      console.error(e);
      if (uploaded.length) await sb.storage.from(BUCKET).remove(uploaded.map((m) => m.path));
      toast('❌ ثبت نشد: ' + (e.message || ''));
    } finally { btn.disabled = false; btn.textContent = 'ثبت و ارسال برای مدیر'; }
  }

  async function renderEvidence() {
    const box = $e('evList');
    const { data, error } = await sb.from('class_evidence')
      .select('id,title,description,media,created_at,lessons(unit_title),students(full_name),schools(name)')
      .order('created_at', { ascending: false }).limit(50);
    if (error) { box.innerHTML = '<div class="kfe-empty">خطا در بارگذاری</div>'; return console.error(error); }
    if (!data.length) { box.innerHTML = '<div class="kfe-empty">هنوز سندی ثبت نکرده‌اید</div>'; return; }
    const urls = await signedMap(data.flatMap((r) => r.media.map((m) => m.path)));
    box.innerHTML = data.map((r) => `<div class="kfe-card">
<div class="kfe-h">${E(r.title)}</div>
<div class="kfe-meta">${E(r.lessons && r.lessons.unit_title)} · ${E(r.schools && r.schools.name)}${r.students ? ' · ' + E(r.students.full_name) : ''} · ${fa(r.created_at)}</div>
${r.description ? `<p>${E(r.description)}</p>` : ''}
<div class="kfe-media">${r.media.map((m) => urls[m.path] ? (m.type === 'video' ? `<video src="${urls[m.path]}" controls preload="metadata"></video>` : `<a href="${urls[m.path]}" target="_blank"><img src="${urls[m.path]}" loading="lazy"></a>`) : '').join('')}</div>
<button class="kfe-del" data-del="${r.id}">حذف</button></div>`).join('');
    box.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
      if (!confirm('این سند حذف شود؟')) return;
      const row = data.find((x) => x.id === b.dataset.del);
      const { error: e1 } = await sb.from('class_evidence').delete().eq('id', row.id);
      if (e1) return toast('❌ حذف نشد');
      await sb.storage.from(BUCKET).remove(row.media.map((m) => m.path));
      toast('🗑️ حذف شد'); renderEvidence();
    }));
  }

  // ---------- طرح درس ----------
  let curAttachment = null;
  async function loadPlan() {
    const sid = Number($e('lpSchool').value), lid = $e('lpLesson').value;
    const ids = ['lpClass', 'lpSessions', 'lpDuration', 'lpObjectives', 'lpMaterials', 'lpSteps', 'lpAssessment', 'lpSafety', 'lpNotes'];
    ids.forEach((i) => ($e(i).value = '')); curAttachment = null; $e('lpCurFile').textContent = '';
    if (!sid || !lid) return;
    const { data } = await sb.from('lesson_plans').select('*').eq('school_id', sid).eq('lesson_id', lid).eq('teacher_id', S.uid).maybeSingle();
    if (!data) return;
    $e('lpClass').value = data.class_name || ''; $e('lpSessions').value = data.sessions_count || ''; $e('lpDuration').value = data.duration_minutes || '';
    $e('lpObjectives').value = data.objectives || ''; $e('lpMaterials').value = data.materials || ''; $e('lpSteps').value = data.steps || '';
    $e('lpAssessment').value = data.assessment || ''; $e('lpSafety').value = data.safety_note || ''; $e('lpNotes').value = data.notes || '';
    curAttachment = data.attachment_path;
    if (curAttachment) $e('lpCurFile').textContent = '📎 فایل پیوست قبلاً ثبت شده (با انتخاب فایل جدید جایگزین می‌شود)';
  }

  async function savePlan() {
    const sid = Number($e('lpSchool').value), lid = $e('lpLesson').value;
    const objectives = $e('lpObjectives').value.trim(), steps = $e('lpSteps').value.trim();
    if (!sid || !lid || !objectives || !steps) return toast('مدرسه، پودمان، اهداف و روند اجرا لازم است');
    const btn = $e('lpSave'); btn.disabled = true;
    try {
      let attachment = curAttachment;
      const f = $e('lpFile').files[0];
      if (f) attachment = (await uploadOne(f, sid)).path;
      const row = {
        teacher_id: S.uid, school_id: sid, lesson_id: lid,
        class_name: $e('lpClass').value.trim() || null,
        sessions_count: Number($e('lpSessions').value) || null,
        duration_minutes: Number($e('lpDuration').value) || null,
        objectives, steps,
        materials: $e('lpMaterials').value.trim() || null,
        assessment: $e('lpAssessment').value.trim() || null,
        safety_note: $e('lpSafety').value.trim() || null,
        notes: $e('lpNotes').value.trim() || null,
        attachment_path: attachment,
      };
      const { error } = await sb.from('lesson_plans').upsert(row, { onConflict: 'teacher_id,school_id,lesson_id' });
      if (error) throw error;
      curAttachment = attachment; $e('lpFile').value = '';
      toast('✅ طرح درس ذخیره شد'); renderPlans();
    } catch (e) { console.error(e); toast('❌ ذخیره نشد: ' + (e.message || '')); }
    finally { btn.disabled = false; }
  }

  async function renderPlans() {
    const box = $e('lpList');
    const { data, error } = await sb.from('lesson_plans').select('id,school_id,lesson_id,class_name,updated_at,lessons(unit_title),schools(name)').order('updated_at', { ascending: false });
    if (error) { box.innerHTML = '<div class="kfe-empty">خطا در بارگذاری</div>'; return console.error(error); }
    box.innerHTML = data.length ? '<div class="kfe-h">طرح‌های ثبت‌شده‌ی من</div>' + data.map((p) =>
      `<div class="kfe-card" style="cursor:pointer" data-plan="${p.school_id}|${p.lesson_id}"><b>${E(p.lessons && p.lessons.unit_title)}</b>
<div class="kfe-meta">${E(p.schools && p.schools.name)}${p.class_name ? ' · ' + E(p.class_name) : ''} · ${fa(p.updated_at)}</div></div>`).join('')
      : '<div class="kfe-empty">هنوز طرح درسی ثبت نکرده‌اید</div>';
    box.querySelectorAll('[data-plan]').forEach((c) => c.addEventListener('click', () => {
      const [s, l] = c.dataset.plan.split('|');
      $e('lpSchool').value = s; $e('lpLesson').value = l; loadPlan(); window.scrollTo({ top: 0, behavior: 'smooth' });
    }));
  }

  window.initTeacherEvidence = async function (rootId) {
    const root = $e(rootId);
    if (!root) return console.error('evidence root not found:', rootId);
    try { await loadContext(); } catch (e) { root.innerHTML = '<div class="kfe-empty">ابتدا وارد حساب معلم شوید</div>'; return; }
    shell(root); fillSelects();
    if (S.schools.length === 1) { loadStudents(); }
    $e('kfeTabEv').onclick = () => { $e('kfeEv').style.display = ''; $e('kfeLp').style.display = 'none'; $e('kfeTabEv').classList.add('on'); $e('kfeTabLp').classList.remove('on'); };
    $e('kfeTabLp').onclick = () => { $e('kfeLp').style.display = ''; $e('kfeEv').style.display = 'none'; $e('kfeTabLp').classList.add('on'); $e('kfeTabEv').classList.remove('on'); };
    $e('evSchool').addEventListener('change', loadStudents);
    $e('evSave').addEventListener('click', saveEvidence);
    $e('lpSchool').addEventListener('change', loadPlan);
    $e('lpLesson').addEventListener('change', loadPlan);
    $e('lpSave').addEventListener('click', savePlan);
    renderEvidence(); renderPlans();
  };
})();
