/**
 * annual-plan.js — طرح درس سالانه (پنل معلم)
 * تب «طرح سالانه» را به فرم سند کلاسی/طرح درس (evidence.js) اضافه می‌کند.
 * از evidence-boot.js لود می‌شود؛ initTeacherEvidence را wrap می‌کند تا بعد از ساخت فرم، تب جدید اضافه شود.
 */
(function () {
  const E = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $a = (id) => document.getElementById(id);
  const toast = (m) => (typeof showToast === 'function' ? showToast(m) : alert(m));
  const fa = (d) => new Date(d).toLocaleDateString('fa-IR');
  const GRADE = { 7: 'هفتم', 8: 'هشتم', 9: 'نهم' };
  const MONTHS = ['مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند', 'فروردین', 'اردیبهشت', 'خرداد'];
  const MAX_ROWS = 60;
  const C = { uid: null, schools: [], lessons: [] };
  let rows = [];
  let curPlan = null;

  const lessonLabel = (l) => `${GRADE[l.grade] || l.grade || ''} — ${l.unit_title}`;
  const faDigits = (s) => String(s || '').replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

  function currentAcademicYear() {
    try {
      const p = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', { year: 'numeric', month: 'numeric' }).formatToParts(new Date());
      const y = +p.find((x) => x.type === 'year').value;
      const m = +p.find((x) => x.type === 'month').value;
      return m >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
    } catch (e) { return '1405-1406'; }
  }

  async function loadCtx() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new Error('not logged in');
    C.uid = user.id;
    const { data: me } = await sb.from('staff').select('school_id').eq('id', user.id).maybeSingle();
    const { data: links } = await sb.from('staff_schools').select('school_id').eq('staff_id', user.id);
    const ids = [...new Set([me && me.school_id, ...(links || []).map((l) => l.school_id)].filter(Boolean))];
    const [sc, ls] = await Promise.all([
      ids.length ? sb.from('schools').select('id,name').in('id', ids) : Promise.resolve({ data: [] }),
      sb.from('lessons').select('id,unit_title,grade,order_index').eq('is_published', true).order('grade').order('order_index'),
    ]);
    C.schools = sc.data || [];
    C.lessons = ls.data || [];
  }

  function formHtml() {
    const schoolOpts = (C.schools.length > 1 ? '<option value="">انتخاب مدرسه</option>' : '') +
      C.schools.map((s) => `<option value="${s.id}">${E(s.name)}</option>`).join('');
    return `<div class="kfe-card"><div class="kfe-h">طرح درس سالانه (به نام شما)</div>
<label>مدرسه</label><select id="anSchool">${schoolOpts}</select>
<label>سال تحصیلی</label><input id="anYear" value="${currentAcademicYear()}" placeholder="1405-1406" inputmode="numeric">
<label>پایه</label><select id="anGrade"><option value="7">هفتم</option><option value="8">هشتم</option><option value="9">نهم</option></select>
<label>کلاس‌ها</label><input id="anClass" placeholder="مثلاً الف، ب">
<label>کل جلسات سال</label><input id="anTotal" type="number" min="1">
<label>اهداف کلی سال *</label><textarea id="anGoals" rows="3"></textarea>
<label>منابع و امکانات</label><textarea id="anResources" rows="2"></textarea>
<label>روش ارزشیابی</label><textarea id="anEval" rows="2"></textarea>
<label>یادداشت</label><textarea id="anNotes" rows="2"></textarea>
<div class="kfe-h" style="margin-top:16px">جدول برنامه‌ریزی ماهانه</div>
<div id="anRows"></div>
<button type="button" id="anAdd" class="kfe-btn" style="background:#475569">➕ افزودن ردیف</button>
<button type="button" id="anSave" class="kfe-btn">ذخیره‌ی طرح سالانه</button></div>
<div id="anList"></div>`;
  }

  function renderRows() {
    const box = $a('anRows');
    if (!rows.length) { box.innerHTML = '<div class="kfe-empty">هنوز ردیفی اضافه نکرده‌اید</div>'; return; }
    box.innerHTML = rows.map((r, i) => `<div class="kfe-card" style="padding:10px">
<div style="display:flex;gap:6px"><select data-i="${i}" data-k="month">${MONTHS.map((m) => `<option ${m === r.month ? 'selected' : ''}>${m}</option>`).join('')}</select>
<input data-i="${i}" data-k="sessions" type="number" min="1" placeholder="جلسه" value="${E(r.sessions || '')}" style="max-width:90px"></div>
<label>پودمان</label><select data-i="${i}" data-k="lesson_id"><option value="">— انتخاب (اختیاری) —</option>${C.lessons.map((l) => `<option value="${E(l.id)}" ${l.id === r.lesson_id ? 'selected' : ''}>${E(lessonLabel(l))}</option>`).join('')}</select>
<label>موضوع و فعالیت‌ها</label><textarea data-i="${i}" data-k="topics" rows="2">${E(r.topics || '')}</textarea>
<label>ارزشیابی</label><input data-i="${i}" data-k="assessment" value="${E(r.assessment || '')}">
<button type="button" class="kfe-del" data-rm="${i}" style="margin-top:8px">حذف ردیف</button></div>`).join('');
  }

  function clearForm() {
    ['anClass', 'anTotal', 'anGoals', 'anResources', 'anEval', 'anNotes'].forEach((i) => ($a(i).value = ''));
    rows = []; curPlan = null; renderRows();
  }

  function fillForm(d) {
    $a('anClass').value = d.class_name || '';
    $a('anTotal').value = d.total_sessions || '';
    $a('anGoals').value = d.goals || '';
    $a('anResources').value = d.resources || '';
    $a('anEval').value = d.evaluation_method || '';
    $a('anNotes').value = d.notes || '';
    rows = Array.isArray(d.items) ? d.items.map((x) => ({ ...x })) : [];
    curPlan = d.id;
    renderRows();
  }

  async function loadExisting() {
    const sid = Number($a('anSchool').value);
    const year = faDigits($a('anYear').value.trim());
    const grade = Number($a('anGrade').value);
    clearForm();
    if (!sid || !/^[0-9]{4}-[0-9]{4}$/.test(year)) return;
    const { data } = await sb.from('annual_plans').select('*')
      .eq('teacher_id', C.uid).eq('school_id', sid).eq('academic_year', year).eq('grade', grade).maybeSingle();
    if (data) fillForm(data);
  }

  async function savePlan() {
    const sid = Number($a('anSchool').value);
    const year = faDigits($a('anYear').value.trim());
    const grade = Number($a('anGrade').value);
    const goals = $a('anGoals').value.trim();
    if (!sid || !goals) return toast('مدرسه و اهداف کلی لازم است');
    if (!/^[0-9]{4}-[0-9]{4}$/.test(year)) return toast('سال تحصیلی را مثل 1405-1406 بنویسید');
    const items = rows
      .filter((r) => (r.topics && r.topics.trim()) || r.lesson_id)
      .map((r) => ({ month: r.month || MONTHS[0], lesson_id: r.lesson_id || '', sessions: Number(r.sessions) || null, topics: (r.topics || '').trim(), assessment: (r.assessment || '').trim() }));
    if (items.length > MAX_ROWS) return toast('حداکثر ' + MAX_ROWS + ' ردیف');
    const btn = $a('anSave'); btn.disabled = true;
    try {
      const row = {
        teacher_id: C.uid, school_id: sid, academic_year: year, grade,
        class_name: $a('anClass').value.trim() || null,
        total_sessions: Number($a('anTotal').value) || null,
        goals,
        resources: $a('anResources').value.trim() || null,
        evaluation_method: $a('anEval').value.trim() || null,
        notes: $a('anNotes').value.trim() || null,
        items,
      };
      const { error } = await sb.from('annual_plans').upsert(row, { onConflict: 'teacher_id,school_id,academic_year,grade' });
      if (error) throw error;
      toast('✅ طرح سالانه ذخیره شد');
      renderList();
    } catch (e) { console.error(e); toast('❌ ذخیره نشد: ' + (e.message || '')); }
    finally { btn.disabled = false; }
  }

  async function renderList() {
    const box = $a('anList');
    const { data, error } = await sb.from('annual_plans')
      .select('id,school_id,academic_year,grade,class_name,updated_at,schools(name)')
      .order('updated_at', { ascending: false });
    if (error) { console.error(error); box.innerHTML = '<div class="kfe-empty">خطا در بارگذاری</div>'; return; }
    box.innerHTML = data.length
      ? '<div class="kfe-h">طرح‌های سالانه‌ی ثبت‌شده‌ی من</div>' + data.map((p) =>
        `<div class="kfe-card" style="cursor:pointer" data-an="${p.school_id}|${p.academic_year}|${p.grade}"><b>پایه‌ی ${GRADE[p.grade] || p.grade} — ${E(p.academic_year)}</b>
<div class="kfe-meta">${E(p.schools && p.schools.name)}${p.class_name ? ' · ' + E(p.class_name) : ''} · ${fa(p.updated_at)}</div></div>`).join('')
      : '<div class="kfe-empty">هنوز طرح سالانه‌ای ثبت نکرده‌اید</div>';
    box.querySelectorAll('[data-an]').forEach((c) => c.addEventListener('click', () => {
      const [s, y, g] = c.dataset.an.split('|');
      $a('anSchool').value = s; $a('anYear').value = y; $a('anGrade').value = g;
      loadExisting(); window.scrollTo({ top: 0, behavior: 'smooth' });
    }));
  }

  async function mount(rootId) {
    const root = $a(rootId);
    const kfe = root && root.querySelector('.kfe');
    if (!kfe || $a('kfeAn')) return;
    await loadCtx();
    const tabs = kfe.querySelector('.kfe-tabs');
    const btn = document.createElement('button');
    btn.id = 'kfeTabAn'; btn.textContent = '📅 طرح سالانه';
    tabs.appendChild(btn);
    const pan = document.createElement('div');
    pan.id = 'kfeAn'; pan.style.display = 'none'; pan.innerHTML = formHtml();
    kfe.appendChild(pan);

    // هماهنگی با دو تب قبلی
    const evClick = $a('kfeTabEv').onclick, lpClick = $a('kfeTabLp').onclick;
    const hideMine = () => { pan.style.display = 'none'; btn.classList.remove('on'); };
    $a('kfeTabEv').onclick = () => { hideMine(); evClick(); };
    $a('kfeTabLp').onclick = () => { hideMine(); lpClick(); };
    btn.onclick = () => {
      $a('kfeEv').style.display = 'none'; $a('kfeLp').style.display = 'none';
      $a('kfeTabEv').classList.remove('on'); $a('kfeTabLp').classList.remove('on');
      pan.style.display = ''; btn.classList.add('on');
    };

    const rowsBox = $a('anRows');
    const upd = (e) => {
      const t = e.target;
      if (t.dataset.k == null) return;
      rows[+t.dataset.i][t.dataset.k] = t.dataset.k === 'sessions' ? (Number(t.value) || null) : t.value;
    };
    rowsBox.addEventListener('input', upd);
    rowsBox.addEventListener('change', upd);
    rowsBox.addEventListener('click', (e) => {
      const b = e.target.closest('[data-rm]');
      if (!b) return;
      rows.splice(+b.dataset.rm, 1); renderRows();
    });
    $a('anAdd').onclick = () => {
      if (rows.length >= MAX_ROWS) return toast('حداکثر ' + MAX_ROWS + ' ردیف');
      rows.push({ month: MONTHS[Math.min(rows.length, MONTHS.length - 1)], lesson_id: '', sessions: null, topics: '', assessment: '' });
      renderRows();
    };
    ['anSchool', 'anGrade'].forEach((i) => $a(i).addEventListener('change', loadExisting));
    $a('anYear').addEventListener('change', loadExisting);
    $a('anSave').onclick = savePlan;
    renderRows(); renderList();
    if (C.schools.length === 1) loadExisting();
  }

  const orig = window.initTeacherEvidence;
  window.initTeacherEvidence = async function (rootId) {
    if (orig) await orig.apply(this, arguments);
    try { await mount(rootId); } catch (e) { console.error('annual plan init failed:', e); }
  };
})();
