/**
 * evidence.js — پنل مدیریت: مشاهده‌ی اسناد کلاسی و طرح درس‌های معلمان
 * نیازمند: sb (کلاینت Supabase با ورود مدیر). محدوده‌ی دسترسی را RLS دیتابیس تعیین می‌کند.
 * استفاده:  <div id="evidenceAdminRoot"></div>  و سپس  loadEvidenceAdmin('evidenceAdminRoot')
 */
(function () {
  const BUCKET = 'class-evidence';
  const $e = (id) => document.getElementById(id);
  const E = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fa = (d) => new Date(d).toLocaleDateString('fa-IR');
  let mode = 'ev';

  const css = `
.kfa{direction:rtl;font-family:inherit}
.kfa-bar{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}
.kfa-bar button{padding:8px 14px;border:1px solid #cbd5e1;background:#fff;border-radius:8px;font:inherit;cursor:pointer}
.kfa-bar button.on{background:#0f766e;color:#fff;border-color:#0f766e}
.kfa-bar input{flex:1;min-width:180px;padding:8px;border:1px solid #cbd5e1;border-radius:8px;font:inherit}
.kfa-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px;margin-bottom:12px}
.kfa-h{font-weight:700}
.kfa-meta{font-size:12px;color:#64748b;margin:4px 0}
.kfa-media{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin-top:8px}
.kfa-media img,.kfa-media video{width:100%;height:110px;object-fit:cover;border-radius:8px;background:#000}
.kfa-sec{margin-top:8px}.kfa-sec b{display:block;font-size:12px;color:#475569}
.kfa-sec div{white-space:pre-wrap}
.kfa-empty{text-align:center;color:#94a3b8;padding:24px}`;

  async function signedMap(paths) {
    const map = {};
    paths = [...new Set(paths.filter(Boolean))];
    if (!paths.length) return map;
    const { data } = await sb.storage.from(BUCKET).createSignedUrls(paths, 3600);
    (data || []).forEach((x) => { if (x.signedUrl) map[x.path] = x.signedUrl; });
    return map;
  }

  async function render() {
    const box = $e('kfaList');
    const q = ($e('kfaSearch').value || '').trim();
    box.innerHTML = '<div class="kfa-empty">در حال بارگذاری…</div>';
    if (mode === 'ev') {
      const { data, error } = await sb.from('class_evidence')
        .select('id,title,description,media,created_at,staff:teacher_id(full_name),lessons(unit_title),students(full_name),schools(name)')
        .order('created_at', { ascending: false }).limit(200);
      if (error) { console.error(error); box.innerHTML = '<div class="kfa-empty">خطا در بارگذاری</div>'; return; }
      const rows = data.filter((r) => !q || [r.title, r.staff && r.staff.full_name, r.lessons && r.lessons.unit_title, r.schools && r.schools.name, r.students && r.students.full_name].join(' ').includes(q));
      if (!rows.length) { box.innerHTML = '<div class="kfa-empty">سندی یافت نشد</div>'; return; }
      const urls = await signedMap(rows.flatMap((r) => r.media.map((m) => m.path)));
      box.innerHTML = rows.map((r) => `<div class="kfa-card"><div class="kfa-h">${E(r.title)}</div>
<div class="kfa-meta">معلم: ${E(r.staff && r.staff.full_name)} · ${E(r.schools && r.schools.name)} · ${E(r.lessons && r.lessons.unit_title)}${r.students ? ' · دانش‌آموز: ' + E(r.students.full_name) : ''} · ${fa(r.created_at)}</div>
${r.description ? `<div>${E(r.description)}</div>` : ''}
<div class="kfa-media">${r.media.map((m) => urls[m.path] ? (m.type === 'video' ? `<video src="${urls[m.path]}" controls preload="metadata"></video>` : `<a href="${urls[m.path]}" target="_blank"><img src="${urls[m.path]}" loading="lazy"></a>`) : '').join('')}</div></div>`).join('');
    } else {
      const { data, error } = await sb.from('lesson_plans')
        .select('*,staff:teacher_id(full_name),lessons(unit_title),schools(name)')
        .order('updated_at', { ascending: false }).limit(200);
      if (error) { console.error(error); box.innerHTML = '<div class="kfa-empty">خطا در بارگذاری</div>'; return; }
      const rows = data.filter((r) => !q || [r.staff && r.staff.full_name, r.lessons && r.lessons.unit_title, r.schools && r.schools.name, r.class_name].join(' ').includes(q));
      if (!rows.length) { box.innerHTML = '<div class="kfa-empty">طرح درسی یافت نشد</div>'; return; }
      const urls = await signedMap(rows.map((r) => r.attachment_path));
      const sec = (t, v) => (v ? `<div class="kfa-sec"><b>${t}</b><div>${E(v)}</div></div>` : '');
      box.innerHTML = rows.map((r) => `<div class="kfa-card"><div class="kfa-h">${E(r.lessons && r.lessons.unit_title)}</div>
<div class="kfa-meta">معلم: ${E(r.staff && r.staff.full_name)} · ${E(r.schools && r.schools.name)}${r.class_name ? ' · ' + E(r.class_name) : ''}${r.sessions_count ? ' · ' + r.sessions_count + ' جلسه' : ''}${r.duration_minutes ? ' × ' + r.duration_minutes + ' دقیقه' : ''} · ${fa(r.updated_at)}</div>
${sec('اهداف', r.objectives)}${sec('مواد و ابزار', r.materials)}${sec('روند اجرا', r.steps)}${sec('ارزشیابی', r.assessment)}${sec('نکات ایمنی', r.safety_note)}${sec('یادداشت', r.notes)}
${urls[r.attachment_path] ? `<div class="kfa-sec"><a href="${urls[r.attachment_path]}" target="_blank">📎 فایل پیوست</a></div>` : ''}</div>`).join('');
    }
  }

  window.loadEvidenceAdmin = function (rootId) {
    const root = $e(rootId);
    if (!root) return console.error('evidence admin root not found:', rootId);
    root.innerHTML = `<style>${css}</style><div class="kfa"><div class="kfa-bar">
<button id="kfaEv" class="on">📷 اسناد کلاسی</button><button id="kfaLp">📝 طرح درس‌ها</button>
<input id="kfaSearch" placeholder="جستجو: معلم، مدرسه، پودمان…"></div><div id="kfaList"></div></div>`;
    const set = (m) => { mode = m; $e('kfaEv').classList.toggle('on', m === 'ev'); $e('kfaLp').classList.toggle('on', m === 'lp'); render(); };
    $e('kfaEv').onclick = () => set('ev');
    $e('kfaLp').onclick = () => set('lp');
    let t; $e('kfaSearch').addEventListener('input', () => { clearTimeout(t); t = setTimeout(render, 300); });
    render();
  };
})();
