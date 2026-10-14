/**
 * evidence-boot.js — اضافه‌کردن تب «سند کلاسی و طرح درس» به پنل معلم.
 * از main.js بعد از evidence.js لود می‌شود. تب و پنل را دینامیک می‌سازد؛
 * اگر خواستید می‌توانید معادل آن را مستقیم در index.html بگذارید.
 * فقط کاربران با نقش teacher فرم را می‌بینند (RLS هم همین را تضمین می‌کند).
 */
(function () {
  let inited = false;

  function inject() {
    const nav = document.querySelector('#teacherApp .tabs');
    const main = document.querySelector('#teacherApp .main');
    if (!nav || !main || document.getElementById('tEvidence')) return;
    const btn = document.createElement('button');
    btn.className = 'tab';
    btn.dataset.p = 'tEvidence';
    btn.setAttribute('onclick', "switchTeacherTab('tEvidence')");
    btn.innerHTML = '<span class="ti">📷</span><span class="tl">سند کلاسی و طرح درس</span>';
    const ref = nav.querySelector('[data-p="tAnn"]');
    if (ref) ref.after(btn); else nav.appendChild(btn);
    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.id = 'tEvidence';
    panel.innerHTML = '<div id="evidenceRoot"></div>';
    main.appendChild(panel);
  }

  async function openEvidence() {
    if (inited) return;
    const root = document.getElementById('evidenceRoot');
    if (!root) return;
    try {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data: me } = await sb.from('staff').select('role').eq('id', user.id).maybeSingle();
      if (!me || me.role !== 'teacher') {
        root.innerHTML = '<div class="card" style="text-align:center;padding:24px;color:#64748b">این بخش مخصوص معلمان است. مدیران اسناد و طرح درس‌ها را در پنل مدیریت می‌بینند.</div>';
        return;
      }
      inited = true;
      await initTeacherEvidence('evidenceRoot');
    } catch (e) {
      console.error('evidence init failed:', e);
    }
  }

  inject();

  const orig = window.switchTeacherTab;
  window.switchTeacherTab = function (id) {
    const r = orig.apply(this, arguments);
    if (id === 'tEvidence') openEvidence();
    return r;
  };

  if (typeof sb !== 'undefined' && sb) {
    sb.auth.onAuthStateChange((event) => { if (event === 'SIGNED_OUT') inited = false; });
  }
})();
