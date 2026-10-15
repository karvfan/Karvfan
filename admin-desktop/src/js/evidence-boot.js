/**
 * evidence-boot.js — اتصال پنل «اسناد کلاسی و طرح درس‌ها» به منوی پنل مدیریت.
 * باید بعد از dashboard.js و evidence.js لود شود.
 */
(function () {
  const orig = window.switchPanel;
  window.switchPanel = function (id) {
    const r = orig.apply(this, arguments);
    if (id === 'pEvidence') loadEvidenceAdmin('evidenceAdminRoot');
    return r;
  };
})();
