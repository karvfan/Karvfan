/**
 * annual-plan-admin.js — نمایش طرح درس سالانه‌ی معلمان در پنل مدیریت
 * یک دکمه‌ی «طرح سالانه» به نوار evidence.js اضافه می‌کند (از evidence-boot.js لود می‌شود).
 */
(function () {
  const E = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $a = (id) => document.getElementById(id);
  const fa = (d) => new Date(d).toLocaleDateString('fa-IR');
  const GRADE = { 7: 'هفتم', 8: 'هشتم', 9: 'نهم' };
  let anMode = false;
  let lessonMap = null;

  async function lessons() {
    if (lessonMap) return lessonMap;
    const { data } = await sb.from('lessons').select('id,unit_title');
    lessonMap = {};
    (data || []).forEach((l) => { lessonMap[l.id] = l.unit_title; });
    return lessonMap;
  }

  async function renderAnnual() {
    const box = $a('kfaList');
    const q = ($a('kfaSearch').value || '').trim();
    box.innerHTML = '<div class="kfa-empty">در حال بارگذاری…</div>';
    const { data, error } = await sb.from('annual_plans')
      .select('*,staff:teacher_id(full_name),schools(name)')
      .order('updated_at', { ascending: false }).limit(200);
    if (error) { console.error(error); box.innerHTML = '<div class="kfa-empty">خطا در بارگذاری</div>'; return; }
    const rows = data.filter((r) => !q || [r.staff && r.staff.full_name, r.schools && r.schools.name, r.academic_year, r.class_name].join(' ').includes(q));
    if (!rows.length) { box.innerHTML = '<div class="kfa-empty">طرح سالانه‌ای یافت نشد</div>'; return; }
    const lm = await lessons();
    const sec = (t, v) => (v ? `<div class="kfa-sec"><b>${t}</b><div>${E(v)}</div></div>` : '');
    box.innerHTML = rows.map((r) => {
      const items = (r.items || []).map((it) => `<tr>
<td style="padding:4px 6px;border-top:1px solid #e2e8f0">${E(it.month)}</td>
<td style="padding:4px 6px;border-top:1px solid #e2e8f0">${E(lm[it.lesson_id] || '')}</td>
<td style="padding:4px 6px;border-top:1px solid #e2e8f0">${E(it.sessions || '')}</td>
<td style="padding:4px 6px;border-top:1px solid #e2e8f0;white-space:pre-wrap">${E(it.topics)}</td>
<td style="padding:4px 6px;border-top:1px solid #e2e8f0">${E(it.assessment)}</td></tr>`).join('');
      return `<div class="kfa-card"><div class="kfa-h">طرح سالانه — پایه‌ی ${GRADE[r.grade] || r.grade} · ${E(r.academic_year)}</div>
<div class="kfa-meta">معلم: ${E(r.staff && r.staff.full_name)} · ${E(r.schools && r.schools.name)}${r.class_name ? ' · ' + E(r.class_name) : ''}${r.total_sessions ? ' · ' + r.total_sessions + ' جلسه' : ''} · ${fa(r.updated_at)}</div>
${sec('اهداف کلی', r.goals)}${sec('منابع و امکانات', r.resources)}${sec('روش ارزشیابی', r.evaluation_method)}${sec('یادداشت', r.notes)}
${items ? `<div class="kfa-sec" style="overflow-x:auto"><b>برنامه‌ی ماهانه</b><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="text-align:right;color:#475569"><th style="padding:4px 6px">ماه</th><th style="padding:4px 6px">پودمان</th><th style="padding:4px 6px">جلسه</th><th style="padding:4px 6px">موضوع و فعالیت</th><th style="padding:4px 6px">ارزشیابی</th></tr></thead><tbody>${items}</tbody></table></div>` : ''}</div>`;
    }).join('');
  }

  function mount(rootId) {
    const root = $a(rootId);
    const bar = root && root.querySelector('.kfa-bar');
    if (!bar || $a('kfaAn')) return;
    const btn = document.createElement('button');
    btn.id = 'kfaAn'; btn.textContent = '📅 طرح سالانه';
    bar.insertBefore(btn, $a('kfaSearch'));

    const wrap = (id) => {
      const o = $a(id).onclick;
      $a(id).onclick = () => { anMode = false; btn.classList.remove('on'); o(); };
    };
    wrap('kfaEv'); wrap('kfaLp');
    btn.onclick = () => {
      anMode = true;
      $a('kfaEv').classList.remove('on'); $a('kfaLp').classList.remove('on'); btn.classList.add('on');
      renderAnnual();
    };
    // جستجو در حالت طرح سالانه: قبل از listener اصلی (capture) مهار می‌شود
    let t;
    $a('kfaSearch').addEventListener('input', (e) => {
      if (!anMode) return;
      e.stopImmediatePropagation();
      clearTimeout(t); t = setTimeout(renderAnnual, 300);
    }, true);
  }

  const orig = window.loadEvidenceAdmin;
  window.loadEvidenceAdmin = function (rootId) {
    anMode = false;
    const r = orig.apply(this, arguments);
    try { mount(rootId); } catch (e) { console.error('annual admin init failed:', e); }
    return r;
  };
})();
