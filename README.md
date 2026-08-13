<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=no">
<title>سامانه آموزش و ارزیابی کار و فناوری</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<style>
/* ============================================================================
   توکن‌های طراحی — الهام از کاغذ الگوی خیاطی و کاغذ کارگاهی (کرافت + خط‌چین برش)
   ============================================================================ */
:root{
  --ink:#26334a;
  --ink-soft:#5b6a83;
  --paper:#f4eedd;
  --paper-dark:#e9e0c8;
  --card:#fffdf7;
  --thread:#a8395a;
  --thread-dark:#832c46;
  --mustard:#d79a2c;
  --sage:#4f7f58;
  --sage-bg:#e7f0e5;
  --sky:#356f8f;
  --sky-bg:#e4eef3;
  --brick:#ad3d33;
  --brick-bg:#f7e5e0;
  --amber-bg:#fbf0d9;
  --line:#e2d8bd;
  --shadow:0 10px 28px rgba(38,51,74,.10);
  --radius:14px;
}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html{font-size:16px}
body{
  font-family:'Vazirmatn',Tahoma,Arial,sans-serif;
  min-height:100vh;color:var(--ink);
  background:
    linear-gradient(var(--paper),var(--paper)),
    repeating-linear-gradient(0deg,rgba(38,51,74,.035) 0 1px,transparent 1px 26px),
    repeating-linear-gradient(90deg,rgba(38,51,74,.035) 0 1px,transparent 1px 26px);
  overflow-x:hidden;
}
button,input,select,textarea{font-family:'Vazirmatn',Tahoma,Arial,sans-serif}
img{max-width:100%;display:block}
a{color:var(--sky)}
::selection{background:var(--thread);color:#fff}

.hidden{display:none !important}

/* ---------- دکمه‌ها ---------- */
.btn{border:none;border-radius:10px;padding:11px 18px;font-size:13.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;justify-content:center;transition:transform .08s}
.btn:active{transform:scale(.97)}
.btn-thread{background:var(--thread);color:#fff}
.btn-thread:hover{background:var(--thread-dark)}
.btn-sky{background:var(--sky);color:#fff}
.btn-sage{background:var(--sage);color:#fff}
.btn-ghost{background:#fff;color:var(--ink);border:1.5px solid var(--line)}
.btn-brick{background:var(--brick);color:#fff}
.btn-block{width:100%}
.btn-sm{padding:7px 12px;font-size:12px;border-radius:8px}
.btn[disabled]{opacity:.5;cursor:not-allowed}

/* ---------- گیت انتخاب نقش ---------- */
#gate{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.gate-card{max-width:460px;width:100%;text-align:center}
.gate-eyebrow{display:inline-flex;align-items:center;gap:6px;background:var(--card);border:1.5px dashed var(--line);border-radius:20px;padding:6px 16px;font-size:11.5px;font-weight:700;color:var(--thread);letter-spacing:.3px}
.gate-title{font-size:26px;font-weight:800;margin:16px 0 6px;line-height:1.5}
.gate-sub{color:var(--ink-soft);font-size:13.5px;margin-bottom:26px;line-height:2}
.role-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:420px){.role-grid{grid-template-columns:1fr}}
.role-card{background:var(--card);border:1.5px solid var(--line);border-radius:var(--radius);padding:22px 14px;cursor:pointer;box-shadow:var(--shadow);text-align:center}
.role-card:active{transform:scale(.98)}
.role-card .ic{font-size:32px;margin-bottom:8px}
.role-card .t{font-weight:800;font-size:15px;margin-bottom:4px}
.role-card .d{font-size:11.5px;color:var(--ink-soft);line-height:1.7}

/* ---------- بادج مدرسه/پایه ---------- */
.pill{display:inline-flex;align-items:center;gap:4px;border-radius:20px;padding:3px 11px;font-size:11px;font-weight:700}
.pill-school{background:var(--sky-bg);color:var(--sky)}
.pill-grade{background:var(--amber-bg);color:#8a621a}
.pill-pending{background:var(--amber-bg);color:#8a621a}
.pill-approved{background:var(--sage-bg);color:var(--sage)}
.pill-needs_fix{background:#fdeadb;color:#a1541a}
.pill-rejected{background:var(--brick-bg);color:var(--brick)}

/* ---------- کارت‌های احراز هویت (فرم ورود) ---------- */
.auth-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:22px}
.auth-card{max-width:420px;width:100%;background:var(--card);border-radius:18px;box-shadow:var(--shadow);padding:26px 22px;position:relative;border:1.5px solid var(--line)}
.auth-back{position:absolute;top:16px;left:16px;background:none;border:none;font-size:13px;color:var(--ink-soft);cursor:pointer;font-weight:700}
.auth-head{text-align:center;margin-bottom:20px}
.auth-head .ic{font-size:30px}
.auth-head h2{font-size:18px;font-weight:800;margin-top:6px}
.auth-head p{font-size:12px;color:var(--ink-soft);margin-top:4px}
.field{margin-bottom:13px}
.field label{display:block;font-size:12px;font-weight:700;color:var(--ink-soft);margin-bottom:5px}
.field input,.field select,.field textarea{width:100%;border:1.6px solid var(--line);border-radius:10px;padding:11px 13px;font-size:14px;outline:none;color:var(--ink);background:#fff}
.field input:focus,.field select:focus,.field textarea:focus{border-color:var(--thread)}
.field-err{color:var(--brick);font-size:11.5px;margin-top:8px;min-height:14px;text-align:center}

/* ---------- نوار بالا و تب‌ها ---------- */
.topbar{background:linear-gradient(120deg,var(--ink),#334463);padding:13px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;position:sticky;top:0;z-index:40;flex-wrap:wrap}
.topbar-l{display:flex;align-items:center;gap:9px;color:#fff}
.topbar-l .ic{font-size:20px}
.topbar-l .name{font-weight:800;font-size:14.5px}
.topbar-l .sub{font-size:11px;color:rgba(255,255,255,.65)}
.topbar-r{display:flex;align-items:center;gap:8px}
.points-chip{background:var(--mustard);color:#3a2900;border-radius:20px;padding:6px 13px;font-size:12px;font-weight:800;display:flex;align-items:center;gap:4px}
.logout-btn{background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.3);border-radius:9px;padding:8px 13px;font-size:11.5px;cursor:pointer;font-weight:700}

.tabs{max-width:900px;margin:14px auto 0;padding:0 12px;display:flex;gap:6px;overflow-x:auto;scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
.tab{flex:0 0 auto;background:var(--card);border:1.5px solid var(--line);border-bottom:3px solid var(--line);border-radius:10px 10px 0 0;padding:10px 15px;font-size:12.5px;font-weight:700;color:var(--ink-soft);cursor:pointer;white-space:nowrap}
.tab.active{color:var(--thread);border-bottom-color:var(--thread);background:#fff}
.auth-tabs{display:flex;gap:6px;background:var(--paper-dark,#e9e0c8);border-radius:12px;padding:4px;margin-bottom:16px}
.auth-tab{flex:1;text-align:center;padding:10px 4px;border:none;background:none;border-radius:9px;font-weight:700;font-size:13px;color:var(--ink-soft,#6b6155);cursor:pointer}
.auth-tab.active{background:var(--card);color:var(--thread);box-shadow:0 2px 8px rgba(0,0,0,.08)}

.main{max-width:900px;margin:0 auto;padding:16px 12px 60px}
.panel{display:none}.panel.active{display:block}

/* ---------- کارت الگوی خیاطی (عنصر امضادار طراحی) ---------- */
.pattern-card{background:var(--card);border:2px dashed var(--line);border-radius:var(--radius);padding:18px 16px;margin-bottom:14px;position:relative;box-shadow:var(--shadow)}
.pattern-card::before{
  content:'';position:absolute;top:-1px;right:16px;left:16px;height:6px;
  background-image:radial-gradient(circle,var(--paper) 2.2px,transparent 2.3px);
  background-size:14px 6px;background-repeat:repeat-x;background-position:top center;
}
.tag-badge{position:absolute;top:-12px;right:14px;background:var(--thread);color:#fff;font-size:11px;font-weight:800;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;transform:rotate(-6deg);box-shadow:0 4px 10px rgba(168,57,90,.4)}

.section-title{font-size:15px;font-weight:800;margin:6px 0 12px;display:flex;align-items:center;gap:7px}
.empty-state{text-align:center;padding:40px 16px;color:var(--ink-soft)}
.empty-state .ic{font-size:34px;margin-bottom:10px}
.empty-state .t{font-weight:700;font-size:14px;color:var(--ink);margin-bottom:4px}
.empty-state .d{font-size:12px;line-height:1.9}

/* ---------- درس‌ها ---------- */
.lesson-body{font-size:13.5px;line-height:2.1;color:var(--ink);white-space:pre-wrap;margin-bottom:12px}
.adv-box{background:var(--sky-bg,#e4eef3);border:1.5px dashed var(--sky,#356f8f);border-radius:10px;padding:10px 12px;margin-bottom:12px}
.adv-box summary{cursor:pointer;font-weight:800;font-size:12.5px;color:var(--sky-dark,#245065);list-style:none}
.adv-box summary::-webkit-details-marker{display:none}
.adv-box summary::before{content:'▸ ';display:inline-block;transition:transform .15s}
.adv-box[open] summary::before{transform:rotate(90deg)}
.adv-body{margin-top:8px;margin-bottom:0;font-size:13px}
.quiz-done-badge{font-size:11px;color:var(--sage);font-weight:700;display:inline-flex;align-items:center;gap:4px}
.due-late{color:var(--brick);font-weight:700}
.assign-name-chip{background:var(--sky-bg);color:var(--sky);border-radius:9px;padding:9px 12px;font-size:13px;font-weight:700}
.quiz-field{background:var(--sky-bg);border-radius:12px;padding:12px}
.quiz-hint{font-size:11px;color:var(--ink-soft,#6b6155);line-height:1.8;margin-bottom:8px}
.quiz-hint code{background:#fff;border-radius:5px;padding:2px 5px;font-size:10.5px}
.quiz-progress{background:var(--paper-dark,#e9e1cd);border-radius:20px;height:8px;overflow:hidden;margin-bottom:10px}
.quiz-progress-bar{background:var(--sky);height:100%;transition:width .3s}
.quiz-qcount{font-size:11px;color:var(--ink-soft,#6b6155);margin-bottom:10px;font-weight:700}
.quiz-question{font-size:16px;font-weight:800;margin-bottom:14px;line-height:1.7}
.quiz-options{display:flex;flex-direction:column;gap:9px}
.quiz-opt{text-align:right;padding:12px 14px;border-radius:11px;border:1.5px solid var(--line,#d8cba6);background:#fff;font-size:13.5px;font-weight:600;cursor:pointer;transition:.15s}
.quiz-opt:hover{border-color:var(--sky)}
.quiz-opt.quiz-correct{background:#dcebe2;border-color:var(--sage);color:var(--sage)}
.quiz-opt.quiz-wrong{background:#f3dad5;border-color:var(--brick);color:var(--brick)}
.quiz-result{text-align:center;padding:10px 4px}
.quiz-stars{font-size:34px;letter-spacing:4px;margin-bottom:8px}
.quiz-score{font-size:18px;font-weight:800}
.quiz-msg{font-size:13px;color:var(--ink-soft,#6b6155);margin-top:6px}
.quiz-pts-msg{font-size:13px;font-weight:800;color:var(--wood-dark,#8c5a32);margin-top:12px;min-height:20px}
.presc-badge{display:inline-block;font-size:10px;font-weight:700;border-radius:20px;padding:2px 9px;vertical-align:middle;margin-right:4px}
.presc-yes{background:var(--sage-bg);color:var(--sage)}
.presc-no{background:var(--sky-bg);color:var(--sky)}
.draft-card{border:1.5px dashed var(--sky);background:var(--sky-bg)}
.mood-row{display:flex;align-items:center;gap:8px;margin-top:10px;padding-top:10px;border-top:1px dashed var(--line);font-size:11.5px;color:var(--ink-soft,#6b6155)}
.mood-row.mood-done{color:var(--sage);font-weight:700}
.mood-btn{background:none;border:1.5px solid var(--line);border-radius:50%;width:32px;height:32px;font-size:16px;cursor:pointer}
.mood-btn:hover{border-color:var(--sky)}
/* پروفایل استعداد */
.cat-bar-row{margin-bottom:12px}
.cat-bar-label{display:flex;justify-content:space-between;font-size:12.5px;font-weight:700;margin-bottom:4px}
.cat-bar-track{background:var(--paper-dark,#e9e0c8);border-radius:20px;height:12px;overflow:hidden}
.cat-bar-fill{height:100%;border-radius:20px;transition:width .5s}
.badge-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:10px;margin-top:14px}
.badge-card{background:var(--card);border:1.5px solid var(--line);border-radius:12px;padding:10px 6px;text-align:center}
.badge-card.locked{opacity:.35;filter:grayscale(1)}
.badge-emoji{font-size:26px}
.badge-name{font-size:10px;font-weight:700;margin-top:4px;line-height:1.4}
.interest-opt{display:block;width:100%;text-align:right;padding:13px 14px;border-radius:11px;border:1.5px solid var(--line);background:#fff;font-size:13.5px;font-weight:700;cursor:pointer;margin-bottom:9px}
.interest-opt:hover{border-color:var(--sky)}
@media print{
  body *{visibility:hidden}
  #reportModalOv, #reportModalOv *{visibility:visible}
  #reportModalOv{position:absolute;top:0;left:0;width:100%;background:#fff}
  .modal-close, .no-print{display:none!important}
}
/* بازی ۱: الهام از طبیعت */
.match-grid{display:flex;gap:8px}
.match-col{flex:1;display:flex;flex-direction:column;gap:8px}
.match-card{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 6px;border-radius:12px;border:1.5px solid var(--line);background:#fff;cursor:pointer;font-family:inherit}
.match-card .match-emoji{font-size:26px}
.match-card .match-label{font-size:10.5px;font-weight:700;text-align:center;line-height:1.4;color:var(--ink)}
.match-card.match-sel{border-color:var(--sky);box-shadow:0 0 0 3px var(--sky-bg)}
.match-card.match-done{border-color:var(--sage);background:var(--sage-bg);opacity:.7}
.match-card:disabled{cursor:default}
/* بازی ۲: کارآگاه ایمیل */
.email-card{background:#fff;border:1.5px solid var(--line);border-radius:12px;padding:13px;margin:10px 0;transition:.2s}
.email-from{font-size:11.5px;color:var(--ink-soft,#6b6155);font-weight:700;direction:ltr;text-align:right;unicode-bidi:plaintext}
.email-subj{font-size:14.5px;font-weight:800;margin-top:6px}
.email-body{font-size:12.5px;color:var(--ink);margin-top:6px;line-height:1.8}
.email-card.email-was-safe{border-color:var(--sage)}
.email-card.email-was-unsafe{border-color:var(--brick)}
.email-actions{display:flex;gap:8px;margin-top:4px}
.email-actions .btn{flex:1}
.email-feedback{margin-top:10px;padding:10px 12px;border-radius:10px;font-size:12.5px;line-height:1.8}
.fb-correct{background:var(--sage-bg);color:var(--sage)}
.fb-wrong{background:var(--brick-bg);color:var(--brick)}
/* بازی ۳: الگوریتم ربات */
.robot-msg{font-size:12.5px;font-weight:700;color:var(--ink-soft,#6b6155);margin-bottom:8px;min-height:18px}
.robot-msg-ok{color:var(--sage)}
.robot-msg-fail{color:var(--brick)}
.robot-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:3px;background:var(--paper-dark,#e9e0c8);border-radius:10px;padding:5px;margin-bottom:10px}
.robot-cell{aspect-ratio:1;background:#fff;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:18px}
.robot-cell.robot-obs{background:var(--brick-bg)}
.robot-seq{min-height:34px;background:var(--sky-bg);border-radius:10px;padding:7px 10px;font-size:16px;letter-spacing:3px;margin-bottom:10px;text-align:center}
.robot-seq-empty{font-size:11px;color:var(--ink-soft,#6b6155);letter-spacing:0}
.robot-controls{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px}
.robot-btn{padding:12px 0;border-radius:10px;border:1.5px solid var(--line);background:#fff;font-size:20px;cursor:pointer}
.robot-actions{display:flex;gap:8px}
.robot-actions .btn{flex:1}
.lesson-meta-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
.chip-link{display:inline-flex;align-items:center;gap:5px;background:var(--sky-bg);color:var(--sky);border-radius:9px;padding:8px 12px;font-size:12px;font-weight:700;text-decoration:none;border:none;cursor:pointer}
.chip-link.pdf{background:var(--amber-bg);color:#8a621a}
.video-embed{position:relative;padding-top:56.25%;border-radius:10px;overflow:hidden;margin-bottom:12px;background:#000}
.video-embed iframe{position:absolute;inset:0;width:100%;height:100%;border:none}
.sample-img{border-radius:10px;margin-bottom:12px;cursor:zoom-in;border:1.5px solid var(--line);max-height:260px;object-fit:cover;width:100%}
.scissor-divider{display:flex;align-items:center;gap:8px;color:var(--ink-soft);font-size:11px;margin:14px 0}
.scissor-divider::before,.scissor-divider::after{content:'';flex:1;border-top:2px dashed var(--line)}

/* ---------- کارهای من / گالری ---------- */
.sub-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px}
.sub-title{font-weight:800;font-size:14.5px}
.sub-lesson{font-size:11.5px;color:var(--ink-soft);margin-top:2px}
.sub-desc{font-size:12.5px;color:var(--ink-soft);line-height:1.8;margin:8px 0}
.sub-file-link{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700;color:var(--sky);text-decoration:none;margin-top:4px}
.teacher-note{background:var(--amber-bg);border-radius:9px;padding:9px 11px;font-size:12px;margin-top:9px;color:#6b4a10}
.sub-footer{display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:11px;color:var(--ink-soft)}
.pts-badge{background:var(--sage-bg);color:var(--sage);border-radius:20px;padding:3px 10px;font-weight:800;font-size:11.5px}

.gallery-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:11px}
.g-item{background:var(--card);border:1.5px solid var(--line);border-radius:12px;overflow:hidden;box-shadow:var(--shadow);cursor:pointer}
.g-item img{width:100%;height:120px;object-fit:cover;background:var(--paper-dark)}
.g-item .g-body{padding:9px 10px}
.g-item .g-title{font-size:12px;font-weight:700;line-height:1.5}
.g-item .g-name{font-size:10.5px;color:var(--ink-soft);margin-top:3px}

.filter-row{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap}
.filter-row select{flex:1;min-width:120px;border:1.5px solid var(--line);border-radius:9px;padding:9px 11px;font-size:12.5px;background:#fff}

/* ---------- رتبه‌بندی ---------- */
.lb-row{display:flex;align-items:center;gap:10px;padding:11px 6px;border-bottom:1px solid var(--line)}
.lb-row:last-child{border-bottom:none}
.lb-rank{width:28px;height:28px;border-radius:50%;background:var(--paper-dark);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0}
.lb-rank.r1{background:#ffd54a}.lb-rank.r2{background:#d7d7de}.lb-rank.r3{background:#e3a86b}
.lb-name{flex:1;font-size:13px;font-weight:700}
.lb-meta{font-size:10.5px;color:var(--ink-soft)}
.lb-pts{font-weight:800;color:var(--thread);font-size:13.5px}

/* ---------- اطلاعیه‌ها ---------- */
.ann-card{border-right:4px solid var(--thread)}
.ann-title{font-weight:800;font-size:14px;margin-bottom:5px}
.ann-body{font-size:12.5px;color:var(--ink-soft);line-height:1.9;white-space:pre-wrap}
.ann-date{font-size:10.5px;color:var(--ink-soft);margin-top:8px}

/* ---------- FAB آپلود ---------- */
.fab{position:fixed;bottom:22px;left:22px;background:var(--thread);color:#fff;border:none;border-radius:50%;width:58px;height:58px;font-size:26px;box-shadow:0 10px 24px rgba(168,57,90,.45);cursor:pointer;z-index:45;display:flex;align-items:center;justify-content:center}
.fab:active{transform:scale(.94)}

/* ---------- مودال‌ها ---------- */
.modal-ov{position:fixed;inset:0;background:rgba(20,26,38,.55);display:none;align-items:flex-end;justify-content:center;z-index:200;backdrop-filter:blur(2px)}
.modal-ov.open{display:flex}
.modal{background:#fff;border-radius:20px 20px 0 0;width:100%;max-width:520px;max-height:92vh;overflow-y:auto;padding:20px 18px 26px;animation:slideUp .22s ease}
@keyframes slideUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}
@media(min-width:560px){.modal-ov{align-items:center}.modal{border-radius:18px}}
.modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.modal-head h3{font-size:16px;font-weight:800}
.modal-close{background:var(--paper-dark);border:none;border-radius:50%;width:30px;height:30px;font-size:15px;cursor:pointer;color:var(--ink)}
.modal-actions{display:flex;gap:8px;margin-top:16px}
.file-drop{border:2px dashed var(--line);border-radius:12px;padding:20px 12px;text-align:center;cursor:pointer;font-size:12.5px;color:var(--ink-soft);background:var(--paper)}
.file-drop.has-file{border-color:var(--sage);color:var(--sage);font-weight:700}
.file-preview{margin-top:10px;border-radius:9px;max-height:180px;object-fit:cover;width:100%;display:none}

/* ---------- Toast ---------- */
#toast{position:fixed;bottom:20px;right:50%;transform:translateX(50%);background:var(--ink);color:#fff;padding:11px 20px;border-radius:10px;font-size:13px;font-weight:700;z-index:500;display:none;box-shadow:0 8px 24px rgba(0,0,0,.3);max-width:88vw;text-align:center}

/* ---------- بخش مربی: بررسی/مدیریت ---------- */
.rev-controls{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
.rev-controls select,.rev-controls input{border:1.5px solid var(--line);border-radius:9px;padding:8px 10px;font-size:12.5px}
.rev-controls textarea{grid-column:1/-1;border:1.5px solid var(--line);border-radius:9px;padding:8px 10px;font-size:12.5px;min-height:50px;resize:vertical}
.rev-controls .chk-row{grid-column:1/-1;display:flex;align-items:center;gap:6px;font-size:12px}
.rev-controls .save-row{grid-column:1/-1}
.stat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin-bottom:16px}
@media(min-width:480px){.stat-grid{grid-template-columns:repeat(4,1fr)}}
.stat-box{background:var(--card);border:1.5px solid var(--line);border-radius:12px;padding:14px 8px;text-align:center}
.stat-box .n{font-size:22px;font-weight:800;color:var(--thread)}
.stat-box .l{font-size:10.5px;color:var(--ink-soft);margin-top:3px}
.lesson-admin-row{display:flex;justify-content:space-between;align-items:center;gap:8px}
.lesson-admin-row .lbtns{display:flex;gap:6px;flex-shrink:0}
.student-row{display:flex;justify-content:space-between;align-items:center;padding:9px 6px;border-bottom:1px solid var(--line);font-size:12.5px}
.student-row:last-child{border-bottom:none}

/* ---------- لایت‌باکس ---------- */
#lightbox{position:fixed;inset:0;background:rgba(10,14,22,.9);display:none;align-items:center;justify-content:center;z-index:300;padding:20px}
#lightbox.open{display:flex}
#lightbox img{max-width:100%;max-height:90vh;border-radius:8px}
#lightbox .lb-close{position:absolute;top:18px;left:18px;background:rgba(255,255,255,.15);color:#fff;border:none;border-radius:50%;width:36px;height:36px;font-size:16px;cursor:pointer}

/* ---------- بخش راه‌اندازی (اگر هنوز کلید Supabase وصل نشده) ---------- */
#setupNotice{max-width:560px;margin:60px auto;background:#fff;border-radius:16px;padding:26px 22px;box-shadow:var(--shadow);border:1.5px dashed var(--brick)}
#setupNotice h2{color:var(--brick);font-size:17px;margin-bottom:10px}
#setupNotice p{font-size:13px;line-height:2.1;color:var(--ink-soft);margin-bottom:8px}
#setupNotice code{background:var(--paper-dark);padding:2px 7px;border-radius:6px;font-size:12px}

.spinner{width:16px;height:16px;border-radius:50%;border:2.5px solid rgba(255,255,255,.4);border-top-color:#fff;animation:spin .7s linear infinite;display:inline-block}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>

<!-- ==================== پیام راه‌اندازی (وقتی کلید Supabase تنظیم نشده) ==================== -->
<div id="setupNotice" class="hidden">
  <h2>⚠️ سامانه هنوز به دیتابیس وصل نشده</h2>
  <p>۱) یک پروژه رایگان در <code>supabase.com</code> بسازید.</p>
  <p>۲) محتوای فایل <code>schema.sql</code> را در SQL Editor آن اجرا کنید.</p>
  <p>۳) مقدار <code>SUPABASE_URL</code> و <code>SUPABASE_ANON_KEY</code> را در ابتدای همین فایل (تگ script) با مقادیر پروژه‌ی خودتان جایگزین کنید.</p>
</div>

<!-- ==================== گیت انتخاب نقش ==================== -->
<div id="gate" class="hidden">
  <div class="gate-card">
    <span class="gate-eyebrow">✂️ کار و فناوری — پایه‌های ۷ · ۸ · ۹</span>
    <h1 class="gate-title">سامانه آموزش و ارزیابی<br>کار و فناوری</h1>
    <p class="gate-sub">کارهای کلاسی‌تون رو آپلود کنید، آموزش ببینید و امتیاز جمع کنید 🎯</p>
    <div class="role-grid">
      <div class="role-card" onclick="goTo('studentAuth')">
        <div class="ic">🎒</div>
        <div class="t">دانش‌آموز</div>
        <div class="d">ورود / ثبت‌نام و آپلود کارها</div>
      </div>
      <div class="role-card" onclick="goTo('teacherAuth')">
        <div class="ic">👩‍🏫</div>
        <div class="t">مربی / ادمین</div>
        <div class="d">بررسی کارها و مدیریت آموزش</div>
      </div>
    </div>
  </div>
</div>

<!-- ==================== ورود / ثبت‌نام دانش‌آموز ==================== -->
<div id="studentAuth" class="hidden auth-wrap">
  <div class="auth-card">
    <button class="auth-back" onclick="goTo('gate')">‹ بازگشت</button>
    <div class="auth-head">
      <div class="ic">🎒</div>
      <h2>دانش‌آموز</h2>
      <p>اگه قبلاً ثبت‌نام کردی، از تب «ورود» و فقط با شماره موبایل وارد شو</p>
    </div>
    <div class="auth-tabs">
      <button class="auth-tab active" id="saTabLogin" onclick="switchAuthTab('login')">ورود</button>
      <button class="auth-tab" id="saTabReg" onclick="switchAuthTab('register')">ثبت‌نام</button>
    </div>

    <div id="saLoginForm">
      <div class="field">
        <label>شماره موبایل</label>
        <input id="saLoginPhone" placeholder="09xxxxxxxxx" inputmode="numeric">
      </div>
      <div class="field-err" id="saLoginErr"></div>
      <button class="btn btn-thread btn-block" onclick="studentLogin()" id="saLoginBtn">ورود به سامانه</button>
    </div>

    <div id="saRegForm" class="hidden">
      <div class="field">
        <label>نام و نام خانوادگی</label>
        <input id="saName" placeholder="مثلاً: زهرا احمدی">
      </div>
      <div class="field">
        <label>مدرسه</label>
        <input id="saSchool" list="schoolSuggestions" placeholder="مثلاً: فرزانگان">
        <datalist id="schoolSuggestions">
          <option value="فرزانگان"></option>
          <option value="۱۳ آبان"></option>
        </datalist>
      </div>
      <div class="field">
        <label>پایه</label>
        <select id="saGrade">
          <option value="7">پایه هفتم</option>
          <option value="8">پایه هشتم</option>
          <option value="9">پایه نهم</option>
        </select>
      </div>
      <div class="field">
        <label>کلاس (اختیاری)</label>
        <input id="saClass" placeholder="مثلاً: ۷/۲ یا الف">
      </div>
      <div class="field">
        <label>شماره موبایل</label>
        <input id="saPhone" placeholder="09xxxxxxxxx" inputmode="numeric">
      </div>
      <div class="field-err" id="saErr"></div>
      <button class="btn btn-thread btn-block" onclick="studentRegister()" id="saBtn">ساخت حساب و ورود</button>
    </div>
  </div>
</div>

<!-- ==================== ورود مربی ==================== -->
<div id="teacherAuth" class="hidden auth-wrap">
  <div class="auth-card">
    <button class="auth-back" onclick="goTo('gate')">‹ بازگشت</button>
    <div class="auth-head">
      <div class="ic">👩‍🏫</div>
      <h2>ورود مربی / ادمین</h2>
      <p>حساب کاربری از پنل Supabase (Authentication → Users) ساخته می‌شود</p>
    </div>
    <div class="field">
      <label>ایمیل</label>
      <input id="taEmail" type="email" placeholder="teacher@example.com">
    </div>
    <div class="field">
      <label>رمز عبور</label>
      <input id="taPass" type="password" placeholder="••••••••">
    </div>
    <div class="field-err" id="taErr"></div>
    <button class="btn btn-sky btn-block" onclick="teacherLogin()" id="taBtn">ورود</button>
  </div>
</div>

<!-- ==================== اپ دانش‌آموز ==================== -->
<div id="studentApp" class="hidden">
  <div class="topbar">
    <div class="topbar-l">
      <span class="ic">🧵</span>
      <div>
        <div class="name" id="stName">—</div>
        <div class="sub" id="stMeta">—</div>
      </div>
    </div>
    <div class="topbar-r">
      <div class="points-chip">🏅 <span id="stPoints">0</span> امتیاز</div>
      <button class="logout-btn" onclick="studentLogout()">خروج</button>
    </div>
  </div>
  <div class="tabs">
    <button class="tab active" data-p="pLessons" onclick="switchStudentTab('pLessons')">📚 آموزش</button>
    <button class="tab" data-p="pAssign" onclick="switchStudentTab('pAssign')">📅 تکالیف هفته</button>
    <button class="tab" data-p="pMine" onclick="switchStudentTab('pMine')">📤 کارهای من</button>
    <button class="tab" data-p="pProfile" onclick="switchStudentTab('pProfile')">🧭 پروفایل من</button>
    <button class="tab" data-p="pGallery" onclick="switchStudentTab('pGallery')">🖼️ گالری</button>
    <button class="tab" data-p="pBoard" onclick="switchStudentTab('pBoard')">🏆 رتبه‌بندی</button>
    <button class="tab" data-p="pAnn" onclick="switchStudentTab('pAnn')">📢 اطلاعیه‌ها</button>
  </div>
  <div class="main">
    <div class="panel active" id="pLessons"></div>
    <div class="panel" id="pAssign"></div>
    <div class="panel" id="pMine"></div>
    <div class="panel" id="pProfile"></div>
    <div class="panel" id="pGallery"></div>
    <div class="panel" id="pBoard"></div>
    <div class="panel" id="pAnn"></div>
  </div>
  <button class="fab" onclick="openUploadModal(null)" title="آپلود کار جدید">＋</button>
</div>

<!-- ==================== اپ مربی ==================== -->
<div id="teacherApp" class="hidden">
  <div class="topbar">
    <div class="topbar-l">
      <span class="ic">👩‍🏫</span>
      <div>
        <div class="name">پنل مربی</div>
        <div class="sub" id="teEmail">—</div>
      </div>
    </div>
    <div class="topbar-r">
      <button class="logout-btn" onclick="teacherLogout()">خروج</button>
    </div>
  </div>
  <div class="tabs">
    <button class="tab active" data-p="tReview" onclick="switchTeacherTab('tReview')">🗂️ بررسی کارها</button>
    <button class="tab" data-p="tLessons" onclick="switchTeacherTab('tLessons')">📚 آموزش‌ها</button>
    <button class="tab" data-p="tAssign" onclick="switchTeacherTab('tAssign')">📅 تکالیف هفتگی</button>
    <button class="tab" data-p="tStudents" onclick="switchTeacherTab('tStudents')">👩‍🎓 دانش‌آموزان</button>
    <button class="tab" data-p="tAnn" onclick="switchTeacherTab('tAnn')">📢 اطلاعیه‌ها</button>
    <button class="tab" data-p="tStats" onclick="switchTeacherTab('tStats')">📊 آمار</button>
  </div>
  <div class="main">
    <div class="panel active" id="tReview"></div>
    <div class="panel" id="tLessons"></div>
    <div class="panel" id="tAssign"></div>
    <div class="panel" id="tStudents"></div>
    <div class="panel" id="tAnn"></div>
    <div class="panel" id="tStats"></div>
  </div>
</div>

<!-- ==================== مودال: آپلود کار ==================== -->
<div class="modal-ov" id="uploadModalOv">
  <div class="modal">
    <div class="modal-head"><h3>📤 آپلود کار جدید</h3><button class="modal-close" onclick="closeModal('uploadModalOv')">✕</button></div>
    <div class="field" id="upLessonField">
      <label>مربوط به کدام درس؟ (اختیاری)</label>
      <select id="upLesson"><option value="">— انتخاب نکنید —</option></select>
    </div>
    <div class="field" id="upAssignField" style="display:none">
      <label>تکلیف هفتگی</label>
      <div class="assign-name-chip">📅 <span id="upAssignName"></span></div>
    </div>
    <div class="field">
      <label>عنوان کار</label>
      <input id="upTitle" placeholder="مثلاً: ساخت جعبه مقوایی">
    </div>
    <div class="field">
      <label>توضیح کوتاه (اختیاری)</label>
      <textarea id="upDesc" rows="3" placeholder="چه کاری انجام دادید؟"></textarea>
    </div>
    <div class="field">
      <label>عکس یا فایل کار</label>
      <div class="file-drop" id="upDrop" onclick="document.getElementById('upFile').click()">📎 برای انتخاب عکس یا فایل ضربه بزنید</div>
      <input type="file" id="upFile" accept="image/*,application/pdf" class="hidden" onchange="onUploadFileChange()">
      <img id="upPreview" class="file-preview">
    </div>
    <div class="field-err" id="upErr"></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" style="flex:1" onclick="closeModal('uploadModalOv')">انصراف</button>
      <button class="btn btn-thread" style="flex:2" id="upBtn" onclick="submitUpload()">ارسال کار</button>
    </div>
  </div>
</div>

<!-- ==================== مودال: بازی و آزمون درس ==================== -->
<div class="modal-ov" id="quizModalOv">
  <div class="modal">
    <div class="modal-head"><h3>🎮 بازی و آزمون</h3><button class="modal-close" onclick="closeModal('quizModalOv')">✕</button></div>
    <div id="quizBody"></div>
  </div>
</div>

<!-- ==================== مودال: آزمون علاقه‌سنجی ==================== -->
<div class="modal-ov" id="interestModalOv">
  <div class="modal">
    <div class="modal-head"><h3>🧭 آزمون علاقه‌سنجی</h3><button class="modal-close" onclick="closeModal('interestModalOv')">✕</button></div>
    <div id="interestBody"></div>
  </div>
</div>

<!-- ==================== مودال: کارنامه‌ی دانش‌آموز (مربی) ==================== -->
<div class="modal-ov" id="reportModalOv">
  <div class="modal">
    <div class="modal-head"><h3 id="reportTitle">🗂️ کارنامه</h3><button class="modal-close" onclick="closeModal('reportModalOv')">✕</button></div>
    <div id="reportBody"></div>
  </div>
</div>

<!-- ==================== مودال: مدیریت درس (مربی) ==================== -->
<div class="modal-ov" id="lessonModalOv">
  <div class="modal">
    <div class="modal-head"><h3 id="lmTitle">➕ درس جدید</h3><button class="modal-close" onclick="closeModal('lessonModalOv')">✕</button></div>
    <input type="hidden" id="lmId">
    <div class="field">
      <label>پایه</label>
      <select id="lmGrade"><option value="7">هفتم</option><option value="8">هشتم</option><option value="9">نهم</option></select>
    </div>
    <div class="field"><label>عنوان واحد/درس</label><input id="lmUnitTitle" placeholder="مثلاً: آشنایی با برق و مدار ساده"></div>
    <div class="field"><label>ترتیب نمایش (عدد کوچک‌تر بالاتر می‌آید)</label><input id="lmOrder" type="number" value="1"></div>
    <div class="field"><label>متن آموزشی و نکات (سطح کتاب درسی)</label><textarea id="lmContent" rows="5" placeholder="متن آموزش این درس..."></textarea></div>
    <div class="field"><label>🌟 مطالب تکمیلی و پیشرفته (سطح پیشرفته — اختیاری)</label><textarea id="lmAdvanced" rows="5" placeholder="مفاهیم عمیق‌تر و فرابخشی مرتبط با این درس، برای دانش‌آموزان تیزهوش..."></textarea></div>
    <div class="field"><label>لینک ویدیو (آپارات/یوتیوب — اختیاری)</label><input id="lmVideo" placeholder="https://"></div>
    <div class="field"><label>لینک فایل PDF (اختیاری)</label>
      <div class="file-drop" id="lmPdfDrop" onclick="document.getElementById('lmPdfFile').click()">📄 انتخاب فایل PDF</div>
      <input type="file" id="lmPdfFile" accept="application/pdf" class="hidden" onchange="onLessonFileChange('pdf')">
    </div>
    <div class="field"><label>تصویر نمونه‌کار (اختیاری)</label>
      <div class="file-drop" id="lmImgDrop" onclick="document.getElementById('lmImgFile').click()">🖼️ انتخاب تصویر</div>
      <input type="file" id="lmImgFile" accept="image/*" class="hidden" onchange="onLessonFileChange('img')">
      <img id="lmImgPreview" class="file-preview">
    </div>
    <div class="field">
      <label style="display:flex;align-items:center;gap:6px"><input type="checkbox" id="lmPublished" checked style="width:auto"> برای دانش‌آموزان نمایش داده شود</label>
    </div>
    <div class="field">
      <label style="display:flex;align-items:center;gap:6px"><input type="checkbox" id="lmPrescribed" checked style="width:auto"> پودمان تجویزی (اگه نیمه‌تجویزی و قابل‌جایگزینیه، تیک رو بردارید)</label>
    </div>
    <div class="field quiz-field">
      <label>🎮 بازی و آزمون این درس (اختیاری)</label>
      <div id="lmGameNote" class="quiz-hint" style="display:none"></div>
      <div class="quiz-hint">هر سؤال را در یک خط، به این شکل بنویسید (چهار گزینه و بعد شماره‌ی گزینه‌ی درست از ۱ تا ۴):<br>
      <code>متن سؤال | گزینه۱ | گزینه۲ | گزینه۳ | گزینه۴ | 2</code></div>
      <textarea id="lmQuiz" rows="5" placeholder="متن سؤال | گزینه۱ | گزینه۲ | گزینه۳ | گزینه۴ | 2"></textarea>
      <label style="margin-top:8px;display:block">امتیاز کامل این بازی (اگر همه‌ی سؤال‌ها درست باشد)</label>
      <input id="lmQuizPoints" type="number" value="10">
    </div>
    <div class="field-err" id="lmErr"></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" style="flex:1" onclick="closeModal('lessonModalOv')">انصراف</button>
      <button class="btn btn-thread" style="flex:2" id="lmBtn" onclick="saveLesson()">ذخیره درس</button>
    </div>
  </div>
</div>

<!-- ==================== مودال: تکلیف هفتگی (مربی) ==================== -->
<div class="modal-ov" id="assignModalOv">
  <div class="modal">
    <div class="modal-head"><h3 id="amTitle">➕ تکلیف جدید</h3><button class="modal-close" onclick="closeModal('assignModalOv')">✕</button></div>
    <input type="hidden" id="amId">
    <div class="field"><label>عنوان تکلیف</label><input id="amTitleInput" placeholder="مثلاً: عکس از میز کار این هفته"></div>
    <div class="field"><label>توضیح (اختیاری)</label><textarea id="amDesc" rows="3" placeholder="توضیح تکلیف..."></textarea></div>
    <div class="field"><label>پایه</label><select id="amGrade"><option value="">همه‌ی پایه‌ها</option><option value="7">هفتم</option><option value="8">هشتم</option><option value="9">نهم</option></select></div>
    <div class="field"><label>مدرسه (خالی = همه‌ی مدارس)</label><input id="amSchool" list="schoolSuggestions" placeholder="مثلاً: فرزانگان — یا خالی برای همه"></div>
    <div class="field"><label>مهلت تحویل (اختیاری)</label><input id="amDue" type="date"></div>
    <div class="field"><label>امتیاز پیشنهادی</label><input id="amPoints" type="number" value="10"></div>
    <div class="field"><label style="display:flex;align-items:center;gap:6px"><input type="checkbox" id="amActive" checked style="width:auto"> فعال و قابل‌مشاهده برای دانش‌آموزان</label></div>
    <div class="field-err" id="amErr"></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" style="flex:1" onclick="closeModal('assignModalOv')">انصراف</button>
      <button class="btn btn-thread" style="flex:2" onclick="saveAssignment()">ذخیره تکلیف</button>
    </div>
  </div>
</div>

<!-- ==================== مودال: اطلاعیه جدید (مربی) ==================== -->
<div class="modal-ov" id="annModalOv">
  <div class="modal">
    <div class="modal-head"><h3>📢 اطلاعیه جدید</h3><button class="modal-close" onclick="closeModal('annModalOv')">✕</button></div>
    <div class="field"><label>عنوان</label><input id="anTitle"></div>
    <div class="field"><label>متن</label><textarea id="anBody" rows="4"></textarea></div>
    <div class="field"><label>مخصوص کدام مدرسه؟</label>
      <input id="anSchool" list="schoolSuggestions" placeholder="مثلاً: فرزانگان — یا خالی برای همه">
    </div>
    <div class="field"><label>مخصوص کدام پایه؟</label>
      <select id="anGrade"><option value="">همه‌ی پایه‌ها</option><option value="7">هفتم</option><option value="8">هشتم</option><option value="9">نهم</option></select>
    </div>
    <div class="field-err" id="anErr"></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" style="flex:1" onclick="closeModal('annModalOv')">انصراف</button>
      <button class="btn btn-thread" style="flex:2" onclick="saveAnnouncement()">انتشار</button>
    </div>
  </div>
</div>

<!-- ==================== لایت‌باکس تصویر ==================== -->
<div id="lightbox" onclick="closeLightbox()">
  <button class="lb-close" onclick="closeLightbox()">✕</button>
  <img id="lightboxImg" src="">
</div>

<div id="toast"></div>

<script>
/* ============================================================================
   ⚠️ این دو مقدار را بعد از ساخت پروژه در Supabase و اجرای schema.sql
   با مقادیر واقعیِ Project URL و anon public key جایگزین کنید
   (از: Project Settings → API)
   ============================================================================ */
const SUPABASE_URL = 'https://oyjaxppsarypntotlzns.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95amF4cHBzYXJ5cG50b3Rsem5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNTk2OTUsImV4cCI6MjEwMTgzNTY5NX0.kkeJ637G8Eo2lrZol9FLoVG85GCgYU2fbm3CrLQy9ZY';

let sb = null;
const isConfigured = !SUPABASE_URL.includes('YOUR_') && !SUPABASE_ANON_KEY.includes('YOUR_');
if (isConfigured) sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SCHOOLS = ['فرزانگان', '۱۳ آبان'];
const GRADES = [7, 8, 9];
const STATUS_LABEL = { pending: 'در انتظار بررسی', approved: 'تأیید شده', needs_fix: 'نیاز به اصلاح', rejected: 'رد شده' };

let student = null;      // {id, full_name, school, grade, points}
let lessons = [];        // کش درس‌های پایه‌ی دانش‌آموز فعلی یا همه (برای مربی)
let assignments = [];    // کش تکالیف هفتگی
let myQuizResults = {};  // lesson_id -> {score,total,points_awarded}
let uploadFileB64 = null, uploadFileExt = null;
let uploadAssignmentId = null;
let lmPdfB64 = null, lmImgB64 = null;
let teacherAllSubs = [];
let quizState = null;    // {lessonId, questions, idx, score, total}

/* ---------------------------------------------------------------- کمکی‌ها */
function $(id){ return document.getElementById(id); }
function esc(s){ return (s==null?'':String(s)).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function showToast(msg){ const t=$('toast'); t.textContent=msg; t.style.display='block'; clearTimeout(window._tt); window._tt=setTimeout(()=>t.style.display='none', 2600); }
function goTo(id){ ['gate','studentAuth','teacherAuth','studentApp','teacherApp'].forEach(i=>$(i).classList.add('hidden')); $(id).classList.remove('hidden'); }
function closeModal(id){ $(id).classList.remove('open'); }
function openModal(id){ $(id).classList.add('open'); }
function openLightbox(src){ $('lightboxImg').src = src; $('lightbox').classList.add('open'); }
function closeLightbox(){ $('lightbox').classList.remove('open'); }
function fileToBase64(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }); }

// تبدیل تاریخ میلادی به شمسی (نمایشی)
function toJalali(dateStr){
  const d = new Date(dateStr);
  let gy=d.getFullYear(), gm=d.getMonth()+1, gd=d.getDate();
  const g_d_m=[0,31,59,90,120,151,181,212,243,273,304,334];
  let jy = (gy<=1600)?0:979; gy -= (gy<=1600)?621:1600;
  let gy2 = (gm>2)?(gy+1):gy;
  let days = (365*gy) + parseInt((gy2+3)/4) - parseInt((gy2+99)/100) + parseInt((gy2+399)/400) - 80 + gd + g_d_m[gm-1];
  jy += 33*parseInt(days/12053); days %= 12053;
  jy += 4*parseInt(days/1461); days %= 1461;
  if(days > 365){ jy += parseInt((days-1)/365); days = (days-1)%365; }
  let jm, jd;
  if(days < 186){ jm = 1 + parseInt(days/31); jd = 1 + (days%31); }
  else { jm = 7 + parseInt((days-186)/30); jd = 1 + ((days-186)%30); }
  const months=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
  return jd+' '+months[jm-1]+' '+jy;
}

async function uploadToStorage(bucket, base64, ext){
  const res = await fetch(base64);
  const blob = await res.blob();
  const path = bucket+'/'+Date.now()+'_'+Math.random().toString(36).slice(2,8)+'.'+ext;
  const { error } = await sb.storage.from(bucket).upload(path.replace(bucket+'/',''), blob, { upsert:false });
  if(error) throw error;
  const { data } = sb.storage.from(bucket).getPublicUrl(path.replace(bucket+'/',''));
  return data.publicUrl;
}
function extOf(name, fallback){ const m=/\.([a-zA-Z0-9]+)$/.exec(name||''); return m?m[1].toLowerCase():fallback; }

/* ------------------------------------------------------------ تبدیل بازی/آزمون بین متن و JSON */
function linesToQuizJson(text){
  const lines = (text||'').split('\n').map(l=>l.trim()).filter(Boolean);
  const qs = [];
  lines.forEach(line=>{
    const parts = line.split('|').map(p=>p.trim());
    if(parts.length>=6){
      const correct = parseInt(parts[5])-1;
      if(!isNaN(correct) && correct>=0 && correct<=3){
        qs.push({ q: parts[0], options: [parts[1],parts[2],parts[3],parts[4]], correct });
      }
    }
  });
  return qs.length ? JSON.stringify(qs) : null;
}
function quizJsonToLines(json){
  if(!json) return '';
  try{
    const qs = JSON.parse(json);
    return qs.map(q => [q.q, ...q.options, (q.correct+1)].join(' | ')).join('\n');
  }catch(e){ return ''; }
}

/* ================================================================ دانش‌آموز: ورود / ثبت‌نام */
function switchAuthTab(which){
  $('saTabLogin').classList.toggle('active', which==='login');
  $('saTabReg').classList.toggle('active', which==='register');
  $('saLoginForm').classList.toggle('hidden', which!=='login');
  $('saRegForm').classList.toggle('hidden', which!=='register');
}
async function studentLogin(){
  const phone = $('saLoginPhone').value.trim();
  $('saLoginErr').textContent='';
  if(!/^0?9\d{9}$/.test(phone.replace(/\s/g,''))){ $('saLoginErr').textContent='شماره موبایل معتبر نیست'; return; }
  $('saLoginBtn').disabled=true; $('saLoginBtn').innerHTML='<span class="spinner"></span> در حال ورود...';
  try{
    const { data, error } = await sb.rpc('student_login', { p_phone: phone });
    if(error) throw error;
    if(!data || !data.length){
      $('saLoginErr').textContent = 'حسابی با این شماره پیدا نشد — از تب «ثبت‌نام» استفاده کن';
      return;
    }
    student = data[0];
    localStorage.setItem('kf_student', JSON.stringify(student));
    await enterStudentApp();
  }catch(e){
    $('saLoginErr').textContent = 'خطا در ورود — دوباره تلاش کنید';
    console.error(e);
  }finally{
    $('saLoginBtn').disabled=false; $('saLoginBtn').textContent='ورود به سامانه';
  }
}
async function studentRegister(){
  const full_name = $('saName').value.trim();
  const school = $('saSchool').value.trim();
  const grade = parseInt($('saGrade').value);
  const class_name = $('saClass').value.trim();
  const phone = $('saPhone').value.trim();
  $('saErr').textContent='';
  if(!full_name || full_name.length<3){ $('saErr').textContent='نام و نام خانوادگی رو کامل بنویسید'; return; }
  if(!school){ $('saErr').textContent='نام مدرسه رو بنویسید'; return; }
  if(!/^0?9\d{9}$/.test(phone.replace(/\s/g,''))){ $('saErr').textContent='شماره موبایل معتبر نیست'; return; }
  $('saBtn').disabled=true; $('saBtn').innerHTML='<span class="spinner"></span> در حال ثبت‌نام...';
  try{
    const { data, error } = await sb.rpc('student_login_or_register', { p_full_name: full_name, p_school: school, p_grade: grade, p_phone: phone, p_class_name: class_name||null });
    if(error) throw error;
    student = data[0];
    localStorage.setItem('kf_student', JSON.stringify(student));
    await enterStudentApp();
  }catch(e){
    $('saErr').textContent = 'خطا در ثبت‌نام — دوباره تلاش کنید';
    console.error(e);
  }finally{
    $('saBtn').disabled=false; $('saBtn').textContent='ساخت حساب و ورود';
  }
}
function studentLogout(){ localStorage.removeItem('kf_student'); student=null; goTo('gate'); }

async function enterStudentApp(){
  $('stName').textContent = student.full_name;
  $('stMeta').textContent = student.school+' · پایه '+({7:'هفتم',8:'هشتم',9:'نهم'}[student.grade])+(student.class_name?(' · کلاس '+student.class_name):'');
  $('stPoints').textContent = student.points||0;
  goTo('studentApp');
  await loadLessonsFor(student.grade);
  await loadMyQuizResults();
  renderLessonsPanel();
  switchStudentTab('pLessons');
}
async function loadMyQuizResults(){
  const { data } = await sb.rpc('get_my_quiz_results', { p_student_id: student.id });
  myQuizResults = {};
  (data||[]).forEach(r=>{ myQuizResults[r.lesson_id] = r; });
}

function switchStudentTab(id){
  document.querySelectorAll('#studentApp .tab').forEach(t=>t.classList.toggle('active', t.dataset.p===id));
  document.querySelectorAll('#studentApp .panel').forEach(p=>p.classList.toggle('active', p.id===id));
  if(id==='pAssign') loadAssignmentsPanel();
  if(id==='pMine') loadMySubmissions();
  if(id==='pProfile') loadProfilePanel();
  if(id==='pGallery') loadGallery();
  if(id==='pBoard') loadLeaderboard();
  if(id==='pAnn') loadAnnouncements();
}

/* ------------------------------------------------------------ آموزش (دانش‌آموز) */
async function loadLessonsFor(grade){
  const { data, error } = await sb.from('lessons').select('*').eq('grade', grade).order('order_index');
  lessons = error? [] : data;
}
function embedUrl(url){
  if(!url) return null;
  if(url.includes('aparat.com')){
    const m = url.match(/\/v\/([a-zA-Z0-9]+)/);
    if(m) return 'https://www.aparat.com/video/video/embed/videohash/'+m[1]+'/vt/frame';
  }
  const y = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([a-zA-Z0-9_-]{6,})/);
  if(y) return 'https://www.youtube.com/embed/'+y[1];
  return null;
}
function renderLessonsPanel(){
  const el = $('pLessons');
  if(!lessons.length){
    el.innerHTML = emptyState('📚','هنوز درسی اضافه نشده','مربی هنوز محتوای آموزشی این پایه رو نساخته — بعداً سر بزنید 🙂');
    return;
  }
  el.innerHTML = lessons.map((l,i)=>{
    const emb = embedUrl(l.video_url);
    return '<div class="pattern-card">'+
      '<div class="tag-badge">'+(i+1)+'</div>'+
      '<div class="section-title">'+esc(l.unit_title)+' '+(l.is_prescribed? '<span class="presc-badge presc-yes">✅ تجویزی</span>' : '<span class="presc-badge presc-no">🔄 قابل جایگزینی</span>')+'</div>'+
      (l.content_text? '<div class="lesson-body">'+esc(l.content_text)+'</div>':'')+
      (l.advanced_text? '<details class="adv-box"><summary>🌟 مطالب تکمیلی و پیشرفته (سطح تیزهوشان)</summary><div class="lesson-body adv-body">'+esc(l.advanced_text)+'</div></details>':'')+
      (emb? '<div class="video-embed"><iframe src="'+emb+'" allowfullscreen></iframe></div>' : (l.video_url? '<div class="lesson-meta-row"><a class="chip-link" href="'+esc(l.video_url)+'" target="_blank">🎬 مشاهده ویدیو</a></div>':'')) +
      (l.sample_image_url? '<img class="sample-img" src="'+esc(l.sample_image_url)+'" onclick="openLightbox(\''+esc(l.sample_image_url)+'\')">':'')+
      (l.pdf_url? '<div class="lesson-meta-row"><a class="chip-link pdf" href="'+esc(l.pdf_url)+'" target="_blank">📄 دانلود جزوه PDF</a></div>':'')+
      quizButtonHtml(l)+
      '<div class="scissor-divider">✂️</div>'+
      '<button class="btn btn-thread btn-sm" onclick="openUploadModal(\''+l.id+'\')">📤 آپلود کار برای این درس</button>'+
      '</div>';
  }).join('');
}
function quizButtonHtml(l){
  const hasGame = !!l.game_type || (l.quiz_json && (()=>{ try{ return JSON.parse(l.quiz_json).length>0; }catch(e){ return false; } })());
  if(!hasGame) return '';
  const done = myQuizResults[l.id];
  const gameLabel = GAME_LABELS[l.game_type] || '🎮 بازی و آزمون این درس';
  if(done){
    return '<div class="lesson-meta-row"><button class="btn btn-sky btn-sm" onclick="openQuiz(\''+l.id+'\')">'+gameLabel+' (دوباره بازی کن)</button>'+
      '<span class="quiz-done-badge">✅ '+done.score+'/'+done.total+' · '+(done.points_awarded>0?'+'+done.points_awarded+' امتیاز گرفتی':'') +'</span></div>';
  }
  return '<div class="lesson-meta-row"><button class="btn btn-sky btn-sm" onclick="openQuiz(\''+l.id+'\')">'+gameLabel+' ('+l.quiz_points+'+ امتیاز)</button></div>';
}
const GAME_LABELS = {
  invention_match: '🌿 بازی الهام از طبیعت',
  email_detective: '🕵️ بازی کارآگاه ایمیل',
  robot_algorithm: '🤖 بازی الگوریتم ربات'
};

/* ------------------------------------------------------------ بازی و آزمون درس */
function openQuiz(lessonId){
  const l = lessons.find(x=>x.id===lessonId); if(!l) return;
  openModal('quizModalOv');
  if(l.game_type === 'invention_match') return startInventionMatch(l);
  if(l.game_type === 'email_detective') return startEmailDetective(l);
  if(l.game_type === 'robot_algorithm') return startRobotAlgorithm(l);
  let qs = [];
  try{ qs = l.quiz_json ? JSON.parse(l.quiz_json) : []; }catch(e){ qs=[]; }
  if(!qs.length){ showToast('این درس هنوز بازی نداره'); closeModal('quizModalOv'); return; }
  quizState = { type:'mcq', lessonId, questions: shuffleArr(qs.slice()), idx:0, score:0, total:qs.length };
  renderQuizQuestion();
}
function shuffleArr(arr){
  for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
  return arr;
}
function renderQuizQuestion(){
  const st = quizState;
  const body = $('quizBody');
  if(st.idx >= st.questions.length){ finishGame(st.lessonId, st.score, st.total); return; }
  const q = st.questions[st.idx];
  const pct = Math.round((st.idx/st.total)*100);
  body.innerHTML =
    '<div class="quiz-progress"><div class="quiz-progress-bar" style="width:'+pct+'%"></div></div>'+
    '<div class="quiz-qcount">سؤال '+(st.idx+1)+' از '+st.total+' · امتیاز فعلی: '+st.score+'</div>'+
    '<div class="quiz-question">'+esc(q.q)+'</div>'+
    '<div class="quiz-options" id="quizOpts">'+
      q.options.map((op,i)=>'<button class="quiz-opt" data-i="'+i+'" onclick="answerQuiz('+i+')">'+esc(op)+'</button>').join('')+
    '</div>';
}
function answerQuiz(i){
  const st = quizState;
  const q = st.questions[st.idx];
  const btns = document.querySelectorAll('#quizOpts .quiz-opt');
  btns.forEach(b=>b.onclick=null);
  const correct = q.correct;
  if(i===correct){ st.score++; btns[i].classList.add('quiz-correct'); btns[i].innerHTML += ' ✅'; }
  else { btns[i].classList.add('quiz-wrong'); btns[i].innerHTML += ' ❌'; btns[correct].classList.add('quiz-correct'); btns[correct].innerHTML += ' ✅'; }
  setTimeout(()=>{ st.idx++; renderQuizQuestion(); }, 1100);
}

/* ------------------------------------------------------------ بازی ۱ (پایه هفتم): الهام از طبیعت */
const INVENTION_PAIRS = [
  {n:'🌿', nl:'خار گیاه توت‌فرنگی وحشی', i:'🧷', il:'چسب و صله (ولکرو)'},
  {n:'🦅', nl:'منقار مرغ ماهی‌خوار', i:'🚄', il:'بینی قطار سریع‌السیر'},
  {n:'🕸️', nl:'تار عنکبوت', i:'🌉', il:'پل معلق مقاوم'},
  {n:'🦇', nl:'سونار طبیعی خفاش', i:'📡', il:'رادار'},
  {n:'🐢', nl:'لاک سفت لاک‌پشت', i:'🪖', il:'کلاه ایمنی'}
];
function startInventionMatch(l){
  const pairIdx = shuffleArr(INVENTION_PAIRS.map((p,i)=>i));
  quizState = {
    type:'invention_match', lessonId:l.id, total: INVENTION_PAIRS.length, matched:new Set(),
    natureOrder: shuffleArr(pairIdx.slice()), inventionOrder: shuffleArr(pairIdx.slice()),
    selN:null, selI:null, perfect:0, wrongThisPair:false, locked:false
  };
  renderInventionMatch();
}
function renderInventionMatch(){
  const st = quizState;
  $('quizBody').innerHTML =
    '<div class="quiz-qcount">🌿 طبیعت الهام‌بخش نوآوری‌هاست! جفت‌های مرتبط رو پیدا کن ('+st.matched.size+' از '+st.total+')</div>'+
    '<div class="match-grid">'+
      '<div class="match-col">'+st.natureOrder.map(pi=>{
        const done = st.matched.has(pi);
        const sel = st.selN===pi;
        return '<button class="match-card '+(done?'match-done':'')+' '+(sel?'match-sel':'')+'" '+(done?'disabled':'')+' onclick="pickNature('+pi+')"><span class="match-emoji">'+INVENTION_PAIRS[pi].n+'</span><span class="match-label">'+INVENTION_PAIRS[pi].nl+'</span></button>';
      }).join('')+'</div>'+
      '<div class="match-col">'+st.inventionOrder.map(pi=>{
        const done = st.matched.has(pi);
        const sel = st.selI===pi;
        return '<button class="match-card '+(done?'match-done':'')+' '+(sel?'match-sel':'')+'" '+(done?'disabled':'')+' onclick="pickInvention('+pi+')"><span class="match-emoji">'+INVENTION_PAIRS[pi].i+'</span><span class="match-label">'+INVENTION_PAIRS[pi].il+'</span></button>';
      }).join('')+'</div>'+
    '</div>';
}
function pickNature(pi){ const st=quizState; if(st.locked||st.matched.has(pi)) return; st.selN=pi; renderInventionMatch(); tryMatchPair(); }
function pickInvention(pi){ const st=quizState; if(st.locked||st.matched.has(pi)) return; st.selI=pi; renderInventionMatch(); tryMatchPair(); }
function tryMatchPair(){
  const st = quizState;
  if(st.selN==null || st.selI==null) return;
  st.locked = true;
  if(st.selN === st.selI){
    st.matched.add(st.selN);
    if(!st.wrongThisPair) st.perfect++;
    st.wrongThisPair = false;
    st.selN=null; st.selI=null; st.locked=false;
    renderInventionMatch();
    if(st.matched.size === st.total){ setTimeout(()=>finishGame(st.lessonId, st.perfect, st.total), 400); }
  } else {
    st.wrongThisPair = true;
    setTimeout(()=>{ st.selN=null; st.selI=null; st.locked=false; renderInventionMatch(); }, 700);
  }
}

/* ------------------------------------------------------------ بازی ۲ (پایه هشتم): کارآگاه ایمیل */
const EMAIL_CASES = [
  {from:'مدیر مدرسه <admin@farzanegan-qorveh.ir>', subj:'برنامه امتحانات ترم', body:'سلام، جدول امتحانات پایان ترم پیوست شده است.', safe:true, reason:'آدرس فرستنده با دامنه‌ی رسمی مدرسه است و درخواست هیچ اطلاعات حساسی نداره.'},
  {from:'support@instaqram-verify.com', subj:'⚠️ حساب شما مسدود می‌شود!', body:'برای جلوگیری از مسدودشدن حساب، همین الان رمز عبورت رو اینجا وارد کن.', safe:false, reason:'آدرس فرستنده جعلیه (شبیه‌سازی شده) و می‌خواد رمزتو بگیره — این یعنی فیشینگ.'},
  {from:'عمو رضا <reza.family2010@gmail.com>', subj:'عکس‌های جشن تولد', body:'سلام عزیزم، عکسای جشن تولدت رو برات فرستادم، ببین چطورن!', safe:true, reason:'فرستنده آشناست و محتوا معمولیه، درخواست خاصی هم نداره.'},
  {from:'برنده‌ی بزرگ <prize@win-money-fast.net>', subj:'🎉 تبریک! برنده یک میلیون تومان شدی', body:'روی لینک زیر بزن و اطلاعات کارت بانکی‌تو وارد کن تا جایزه‌تو بگیری.', safe:false, reason:'وعده‌ی جایزه‌ی ناگهانی + درخواست اطلاعات بانکی، دقیقاً الگوی یک کلاهبرداریه.'},
  {from:'کتابخانه‌ی مدرسه <library@farzanegan-qorveh.ir>', subj:'یادآوری بازگرداندن کتاب', body:'کتابی که امانت گرفتی سررسیدش نزدیکه، لطفاً تا پایان هفته برگردون.', safe:true, reason:'یه یادآوری ساده و معمولیه از یه فرستنده‌ی شناخته‌شده.'},
  {from:'noreply@bank-security-alert.info', subj:'حساب بانکی شما در خطر است', body:'برای جلوگیری از هک‌شدن، فوراً رمز و شماره‌ی کارتت رو تأیید کن.', safe:false, reason:'بانک‌های واقعی هیچ‌وقت از طریق ایمیل رمز یا شماره‌ی کارت نمی‌خوان — این فیشینگه.'}
];
function startEmailDetective(l){
  quizState = { type:'email_detective', lessonId:l.id, cases: shuffleArr(EMAIL_CASES.slice()), idx:0, score:0, total:EMAIL_CASES.length };
  renderEmailCase();
}
function renderEmailCase(){
  const st = quizState;
  if(st.idx >= st.cases.length){ finishGame(st.lessonId, st.score, st.total); return; }
  const c = st.cases[st.idx];
  const pct = Math.round((st.idx/st.total)*100);
  $('quizBody').innerHTML =
    '<div class="quiz-progress"><div class="quiz-progress-bar" style="width:'+pct+'%"></div></div>'+
    '<div class="quiz-qcount">🕵️ ایمیل '+(st.idx+1)+' از '+st.total+' · امتیاز فعلی: '+st.score+'</div>'+
    '<div class="email-card" id="emailCard">'+
      '<div class="email-from">از: '+esc(c.from)+'</div>'+
      '<div class="email-subj">'+esc(c.subj)+'</div>'+
      '<div class="email-body">'+esc(c.body)+'</div>'+
    '</div>'+
    '<div class="email-actions">'+
      '<button class="btn btn-sage btn-sm" onclick="answerEmail(true)">✅ امنه</button>'+
      '<button class="btn btn-brick btn-sm" onclick="answerEmail(false)">⚠️ مشکوکه</button>'+
    '</div>'+
    '<div id="emailFeedback"></div>';
}
function answerEmail(choice){
  const st = quizState;
  const c = st.cases[st.idx];
  document.querySelectorAll('.email-actions button').forEach(b=>b.disabled=true);
  const correct = (choice === c.safe);
  if(correct) st.score++;
  document.getElementById('emailCard').classList.add(c.safe?'email-was-safe':'email-was-unsafe');
  $('emailFeedback').innerHTML = '<div class="email-feedback '+(correct?'fb-correct':'fb-wrong')+'">'+
    (correct?'✅ آفرین، درست تشخیص دادی!':'❌ این‌بار اشتباه زدی.')+' <br>'+esc(c.reason)+'</div>'+
    '<button class="btn btn-thread btn-sm" style="margin-top:10px" onclick="nextEmail()">ایمیل بعدی ←</button>';
}
function nextEmail(){ quizState.idx++; renderEmailCase(); }

/* ------------------------------------------------------------ بازی ۳ (پایه نهم): الگوریتم ربات */
const ROBOT_LEVELS = [
  { start:{x:0,y:0}, goal:{x:3,y:0}, obstacles:[] },
  { start:{x:0,y:0}, goal:{x:3,y:2}, obstacles:[{x:1,y:0},{x:1,y:1}] },
  { start:{x:0,y:2}, goal:{x:4,y:0}, obstacles:[{x:2,y:2},{x:2,y:1},{x:3,y:0}] }
];
const ROBOT_GRID = 5;
function startRobotAlgorithm(l){
  quizState = { type:'robot_algorithm', lessonId:l.id, levelIdx:0, total: ROBOT_LEVELS.length, score:0, seq:[], running:false, pos:null };
  loadRobotLevel();
}
function loadRobotLevel(){
  const st = quizState;
  st.seq = []; st.running = false;
  st.pos = {...ROBOT_LEVELS[st.levelIdx].start};
  renderRobotGame('برای رسیدن ربات 🤖 به پرچم 🏁 یه دنباله از دستورها بساز، بعد «اجرا» رو بزن.');
}
function renderRobotGame(msg, status){
  const st = quizState;
  const lvl = ROBOT_LEVELS[st.levelIdx];
  let grid = '<div class="robot-grid">';
  for(let y=0;y<ROBOT_GRID;y++){
    for(let x=0;x<ROBOT_GRID;x++){
      const isObs = lvl.obstacles.some(o=>o.x===x&&o.y===y);
      const isGoal = lvl.goal.x===x && lvl.goal.y===y;
      const isRobot = st.pos.x===x && st.pos.y===y;
      let content = '';
      if(isRobot) content = '🤖'; else if(isGoal) content = '🏁'; else if(isObs) content = '🚧';
      grid += '<div class="robot-cell'+(isObs?' robot-obs':'')+'">'+content+'</div>';
    }
  }
  grid += '</div>';
  $('quizBody').innerHTML =
    '<div class="quiz-qcount">🤖 مرحله '+(st.levelIdx+1)+' از '+st.total+' · امتیاز فعلی: '+st.score+'</div>'+
    '<div class="robot-msg'+(status?(' robot-msg-'+status):'')+'">'+msg+'</div>'+
    grid+
    '<div class="robot-seq" id="robotSeq">'+(st.seq.length? st.seq.map(d=>ROBOT_ARROWS[d]).join(' '): '<span class="robot-seq-empty">هنوز دستوری اضافه نکردی</span>')+'</div>'+
    '<div class="robot-controls">'+
      '<button class="robot-btn" onclick="addRobotMove(\'up\')">⬆️</button>'+
      '<button class="robot-btn" onclick="addRobotMove(\'left\')">⬅️</button>'+
      '<button class="robot-btn" onclick="addRobotMove(\'down\')">⬇️</button>'+
      '<button class="robot-btn" onclick="addRobotMove(\'right\')">➡️</button>'+
    '</div>'+
    '<div class="robot-actions">'+
      '<button class="btn btn-ghost btn-sm" onclick="undoRobotMove()">↩️ حذف آخرین</button>'+
      '<button class="btn btn-thread btn-sm" onclick="runRobot()">▶️ اجرا کن</button>'+
    '</div>';
}
const ROBOT_ARROWS = {up:'⬆️',down:'⬇️',left:'⬅️',right:'➡️'};
function addRobotMove(dir){ if(quizState.running) return; quizState.seq.push(dir); renderRobotGame('دنباله‌ی دستورها رو بساز، هروقت آماده بود «اجرا» رو بزن.'); }
function undoRobotMove(){ if(quizState.running) return; quizState.seq.pop(); renderRobotGame('دنباله‌ی دستورها رو بساز، هروقت آماده بود «اجرا» رو بزن.'); }
function runRobot(){
  const st = quizState;
  if(st.running || !st.seq.length) return;
  st.running = true;
  const lvl = ROBOT_LEVELS[st.levelIdx];
  let pos = {...lvl.start};
  let i = 0;
  const step = () => {
    if(i >= st.seq.length){
      st.running = false;
      if(pos.x===lvl.goal.x && pos.y===lvl.goal.y){
        st.score++;
        renderRobotGame('🎉 آفرین! ربات دقیقاً به پرچم رسید!', 'ok');
        setTimeout(()=>{
          st.levelIdx++;
          if(st.levelIdx >= st.total){ finishGame(st.lessonId, st.score, st.total); }
          else { loadRobotLevel(); }
        }, 1300);
      } else {
        renderRobotGame('🤔 این‌بار به پرچم نرسید. دنباله رو دوباره بساز و امتحان کن!', 'fail');
        setTimeout(()=>{ st.pos = {...lvl.start}; st.seq=[]; renderRobotGame('یه دنباله‌ی جدید بساز و دوباره اجرا کن.'); }, 1500);
      }
      return;
    }
    const d = st.seq[i];
    let np = {...pos};
    if(d==='up') np.y--; if(d==='down') np.y++; if(d==='left') np.x--; if(d==='right') np.x++;
    const outOfBounds = np.x<0||np.x>=ROBOT_GRID||np.y<0||np.y>=ROBOT_GRID;
    const hitObs = lvl.obstacles.some(o=>o.x===np.x&&o.y===np.y);
    if(outOfBounds || hitObs){
      st.pos = pos; st.running = false;
      renderRobotGame('💥 ربات به دیوار یا مانع خورد! یه مسیر دیگه امتحان کن.', 'fail');
      setTimeout(()=>{ st.pos = {...lvl.start}; st.seq=[]; renderRobotGame('یه دنباله‌ی جدید بساز و دوباره اجرا کن.'); }, 1500);
      return;
    }
    pos = np; st.pos = pos; i++;
    renderRobotGame('در حال اجرا...');
    setTimeout(step, 450);
  };
  step();
}

/* ------------------------------------------------------------ پایان بازی + ثبت امتیاز (مشترک بین همه‌ی بازی‌ها) */
async function finishGame(lessonId, score, total){
  const pct = Math.round((score/total)*100);
  const stars = pct>=90?3:(pct>=60?2:(pct>=30?1:0));
  const msg = pct===100?'👑 عالی بود، همه رو درست انجام دادی!' : pct>=60?'🎉 آفرین، خیلی خوب بود!' : pct>=30?'💪 بد نبود، یه بار دیگه تمرین کن تا کامل بشه!' : '🌱 اشکالی نداره، درس رو دوباره بخون و دوباره امتحان کن!';
  $('quizBody').innerHTML =
    '<div class="quiz-result">'+
      '<div class="quiz-stars">'+('⭐'.repeat(stars))+('☆'.repeat(3-stars))+'</div>'+
      '<div class="quiz-score">'+score+' از '+total+' درست</div>'+
      '<div class="quiz-msg">'+msg+'</div>'+
      '<div id="quizPtsMsg" class="quiz-pts-msg">⏳ در حال ثبت نتیجه...</div>'+
      '<div id="quizMoodSlot"></div>'+
      '<button class="btn btn-thread btn-sm" style="margin-top:10px" onclick="openQuiz(\''+lessonId+'\')">🔁 بازی دوباره</button>'+
      '<button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="closeModal(\'quizModalOv\')">بستن</button>'+
    '</div>';
  const { data, error } = await sb.rpc('submit_quiz_result', { p_student_id: student.id, p_lesson_id: lessonId, p_score: score, p_total: total });
  const row = (data&&data[0]) || {points_awarded:0,is_first_time:false};
  if(!error && row.is_first_time && row.points_awarded>0){
    $('quizPtsMsg').innerHTML = '🏅 <b>+'+row.points_awarded+' امتیاز</b> به حسابت اضافه شد!';
    student.points = (student.points||0) + row.points_awarded;
    $('stPoints').textContent = student.points;
  } else if(!error && !row.is_first_time){
    $('quizPtsMsg').textContent = 'امتیاز این بازی رو قبلاً گرفتی — این فقط برای تمرین بود 🙂';
  } else {
    $('quizPtsMsg').textContent = '';
  }
  $('quizMoodSlot').innerHTML = moodPickerHtml('quiz', lessonId, null);

  await loadMyQuizResults();
  renderLessonsPanel();
}

/* ------------------------------------------------------------ تکالیف هفتگی */
async function loadAssignmentsPanel(){
  const el = $('pAssign');
  const { data, error } = await sb.from('assignments').select('*').order('due_date',{ascending:true,nullsFirst:false}).order('created_at',{ascending:false});
  if(error || !data){ el.innerHTML = emptyState('📅','خطا در بارگذاری',''); return; }
  assignments = data.filter(a=> a.is_active && (!a.grade || a.grade===student.grade) && (!a.school || a.school===student.school) );
  if(!assignments.length){ el.innerHTML = emptyState('📅','فعلاً تکلیفی ثبت نشده','هر وقت مربی تکلیف هفتگی بذاره، اینجا نمایش داده می‌شه'); return; }
  const today = new Date().toISOString().slice(0,10);
  el.innerHTML = assignments.map(a=>{
    const late = a.due_date && a.due_date < today;
    return '<div class="pattern-card">'+
      '<div class="sub-card-head"><div><div class="sub-title">📅 '+esc(a.title)+'</div>'+
      (a.due_date? '<div class="sub-lesson '+(late?'due-late':'')+'">'+(late?'⏰ مهلت گذشته: ':'⏳ مهلت تحویل: ')+toJalali(a.due_date)+'</div>':'')+
      '</div><span class="pts-badge">+'+a.points_hint+' امتیاز</span></div>'+
      (a.description? '<div class="sub-desc">'+esc(a.description)+'</div>':'')+
      '<div class="scissor-divider">✂️</div>'+
      '<button class="btn btn-thread btn-sm" onclick="openUploadModal(null,\''+a.id+'\')">📤 آپلود این تکلیف</button>'+
      '</div>';
  }).join('');
}

/* ------------------------------------------------------------ کارهای من */
async function loadMySubmissions(){
  const el = $('pMine');
  el.innerHTML = '<div class="empty-state"><div class="ic">⏳</div><div class="d">در حال بارگذاری...</div></div>';
  const { data, error } = await sb.rpc('get_my_submissions', { p_student_id: student.id });
  if(error || !data || !data.length){
    el.innerHTML = emptyState('📤','هنوز کاری آپلود نکردید','با دکمه‌ی ＋ پایین صفحه اولین کارتون رو بفرستید!');
    return;
  }
  el.innerHTML = data.map(s=>'<div class="pattern-card">'+
    '<div class="sub-card-head"><div><div class="sub-title">'+(s.kind==='homework'?'📅 ':'📘 ')+esc(s.title)+'</div>'+
    (s.context_title? '<div class="sub-lesson">'+(s.kind==='homework'?'تکلیف: ':'مربوط به: ')+esc(s.context_title)+'</div>':'')+'</div>'+
    '<span class="pill pill-'+s.status+'">'+STATUS_LABEL[s.status]+'</span></div>'+
    (s.description? '<div class="sub-desc">'+esc(s.description)+'</div>':'')+
    fileLinkOrImg(s.file_url)+
    (s.teacher_note? '<div class="teacher-note">💬 یادداشت مربی: '+esc(s.teacher_note)+'</div>':'')+
    '<div class="sub-footer"><span>'+toJalali(s.created_at)+'</span>'+
    (s.points_awarded>0? '<span class="pts-badge">+'+s.points_awarded+' امتیاز</span>':'')+
    '</div>'+moodPickerHtml('sub',s.id,s.mood)+
    '</div>').join('');
}
function moodPickerHtml(kind, refId, mood){
  if(mood){
    const map = {1:'😐 نظرت رو ثبت کردیم',2:'🙂 نظرت رو ثبت کردیم',3:'😍 نظرت رو ثبت کردیم'};
    return '<div class="mood-row mood-done">'+map[mood]+'</div>';
  }
  const fn = kind==='sub' ? 'setSubMood' : 'setQuizMoodUi';
  return '<div class="mood-row"><span>چقدر این کار رو دوست داشتی؟</span>'+
    '<button class="mood-btn" onclick="'+fn+'(\''+refId+'\',1)">😐</button>'+
    '<button class="mood-btn" onclick="'+fn+'(\''+refId+'\',2)">🙂</button>'+
    '<button class="mood-btn" onclick="'+fn+'(\''+refId+'\',3)">😍</button></div>';
}
async function setSubMood(subId, mood){
  await sb.rpc('set_submission_mood', { p_submission_id: subId, p_student_id: student.id, p_mood: mood });
  showToast('🙏 ممنون از نظرت!');
  loadMySubmissions();
}
async function setQuizMoodUi(lessonId, mood){
  await sb.rpc('set_quiz_mood', { p_lesson_id: lessonId, p_student_id: student.id, p_mood: mood });
  showToast('🙏 ممنون از نظرت!');
  await loadMyQuizResults();
  renderLessonsPanel();
}
function fileLinkOrImg(url){
  if(!url) return '';
  if(/\.(jpg|jpeg|png|webp|gif)$/i.test(url)) return '<img class="sample-img" style="max-height:200px" src="'+esc(url)+'" onclick="openLightbox(\''+esc(url)+'\')">';
  return '<a class="sub-file-link" href="'+esc(url)+'" target="_blank">📎 مشاهده فایل</a>';
}

/* ------------------------------------------------------------ پروفایل استعداد و علاقه‌سنجی */
const CATEGORY_META = {
  'فناوری و نوآوری': {icon:'💻', color:'#356f8f', badge:'💻 نابغه‌ی فناوری'},
  'مهندسی و ساخت': {icon:'🔧', color:'#a8395a', badge:'🔧 مهندس کوچک'},
  'صنایع‌دستی و هنر': {icon:'🎨', color:'#d79a2c', badge:'🎨 هنرمند خلاق'},
  'کشاورزی و محیط‌زیست': {icon:'🌱', color:'#4f7f58', badge:'🌱 دست سبز'},
  'کسب‌وکار و مهارت‌های زندگی': {icon:'💼', color:'#ad3d33', badge:'💼 مدیر آینده'}
};
const BADGE_THRESHOLD = 25;
async function loadProfilePanel(){
  const el = $('pProfile');
  el.innerHTML = '<div class="empty-state"><div class="ic">⏳</div><div class="d">در حال بارگذاری...</div></div>';
  const [{data:cats}, {data:interest}] = await Promise.all([
    sb.rpc('get_my_category_profile', { p_student_id: student.id }),
    sb.rpc('get_my_latest_interest', { p_student_id: student.id })
  ]);
  const catMap = {};
  Object.keys(CATEGORY_META).forEach(c=>catMap[c]=0);
  (cats||[]).forEach(c=>{ catMap[c.category] = Number(c.total_points)||0; });
  const maxVal = Math.max(1, ...Object.values(catMap));

  let html = '<div class="sec-title">🧭 نقاط قوت من</div>';
  html += '<div class="pattern-card">';
  Object.keys(CATEGORY_META).forEach(cat=>{
    const meta = CATEGORY_META[cat];
    const val = catMap[cat];
    const pct = Math.round((val/maxVal)*100);
    html += '<div class="cat-bar-row"><div class="cat-bar-label"><span>'+meta.icon+' '+cat+'</span><span>'+val+' امتیاز</span></div>'+
      '<div class="cat-bar-track"><div class="cat-bar-fill" style="width:'+pct+'%;background:'+meta.color+'"></div></div></div>';
  });
  html += '</div>';

  html += '<div class="sec-title">🏅 نشان‌های من</div><div class="pattern-card"><div class="badge-grid">';
  Object.keys(CATEGORY_META).forEach(cat=>{
    const meta = CATEGORY_META[cat];
    const earned = catMap[cat] >= BADGE_THRESHOLD;
    html += '<div class="badge-card '+(earned?'':'locked')+'"><div class="badge-emoji">'+meta.icon+'</div><div class="badge-name">'+meta.badge+'</div></div>';
  });
  const totalPts = student.points||0;
  html += '<div class="badge-card '+(totalPts>=100?'':'locked')+'"><div class="badge-emoji">⭐</div><div class="badge-name">⭐ ستاره‌ی کارگاه</div></div>';
  html += '</div></div>';

  html += '<div class="sec-title">🎯 آزمون علاقه‌سنجی</div><div class="pattern-card">';
  if(interest && interest.length){
    const r = interest[0];
    html += '<div class="sub-desc">آخرین نتیجه (‌'+toJalali(r.taken_at)+'): بیشترین علاقه‌ات به <b>'+esc(r.top_category)+'</b> بود.</div>';
  } else {
    html += '<div class="sub-desc">هنوز این آزمون رو نزدی! چند سؤال کوتاه و باحاله که کمک می‌کنه بفهمی به کدوم حوزه بیشتر علاقه داری.</div>';
  }
  html += '<button class="btn btn-thread btn-sm" style="margin-top:10px" onclick="startInterestQuiz()">🎯 شروع آزمون علاقه‌سنجی</button>';
  html += '</div>';

  el.innerHTML = html;
}

const INTEREST_QUESTIONS = [
  {q:'کدوم کار رو بیشتر دوست داری؟', a:{t:'ساخت یه ربات یا مدار ساده',c:'فناوری و نوآوری'}, b:{t:'کاشتن و مراقبت از یه گیاه',c:'کشاورزی و محیط‌زیست'}},
  {q:'وقت آزاد داری، چیکار می‌کنی؟', a:{t:'نقاشی یا درست‌کردن یه کاردستی',c:'صنایع‌دستی و هنر'}, b:{t:'برنامه‌نویسی یا بازی رایانه‌ای',c:'فناوری و نوآوری'}},
  {q:'کدوم پروژه برات جذاب‌تره؟', a:{t:'ساخت یه ماکت یا وسیله‌ی چوبی/فلزی',c:'مهندسی و ساخت'}, b:{t:'راه‌اندازی یه کسب‌وکار کوچیک',c:'کسب‌وکار و مهارت‌های زندگی'}},
  {q:'دوست داری بزرگ‌تر که شدی...', a:{t:'یه مهندس یا سازنده باشی',c:'مهندسی و ساخت'}, b:{t:'یه هنرمند یا طراح باشی',c:'صنایع‌دستی و هنر'}},
  {q:'کدوم رو ترجیح می‌دی؟', a:{t:'مراقبت از حیوانات یا گیاهان',c:'کشاورزی و محیط‌زیست'}, b:{t:'مدیریت یه گروه یا پروژه',c:'کسب‌وکار و مهارت‌های زندگی'}},
  {q:'کدوم بازی سامانه رو بیشتر دوست داشتی؟', a:{t:'بازی الگوریتم ربات',c:'فناوری و نوآوری'}, b:{t:'ساخت و طراحی دستی',c:'صنایع‌دستی و هنر'}},
  {q:'کدوم رو ترجیح می‌دی؟', a:{t:'تعمیرکردن یا سرهم‌کردن یه وسیله',c:'مهندسی و ساخت'}, b:{t:'حساب‌وکتاب و برنامه‌ریزی مالی',c:'کسب‌وکار و مهارت‌های زندگی'}},
  {q:'کدوم رو بیشتر دوست داری؟', a:{t:'پرورش گل و گیاه در خونه',c:'کشاورزی و محیط‌زیست'}, b:{t:'درست‌کردن یه اپ یا وب‌سایت ساده',c:'فناوری و نوآوری'}}
];
let interestState = null;
function startInterestQuiz(){
  interestState = { idx:0, scores:{} };
  Object.keys(CATEGORY_META).forEach(c=>interestState.scores[c]=0);
  openModal('interestModalOv');
  renderInterestQ();
}
function renderInterestQ(){
  const st = interestState;
  if(st.idx >= INTEREST_QUESTIONS.length){ finishInterestQuiz(); return; }
  const q = INTEREST_QUESTIONS[st.idx];
  const pct = Math.round((st.idx/INTEREST_QUESTIONS.length)*100);
  $('interestBody').innerHTML =
    '<div class="quiz-progress"><div class="quiz-progress-bar" style="width:'+pct+'%"></div></div>'+
    '<div class="quiz-qcount">سؤال '+(st.idx+1)+' از '+INTEREST_QUESTIONS.length+'</div>'+
    '<div class="quiz-question">'+esc(q.q)+'</div>'+
    '<button class="interest-opt" onclick="answerInterest(\'a\')">'+esc(q.a.t)+'</button>'+
    '<button class="interest-opt" onclick="answerInterest(\'b\')">'+esc(q.b.t)+'</button>';
}
function answerInterest(which){
  const q = INTEREST_QUESTIONS[interestState.idx];
  const cat = q[which].c;
  interestState.scores[cat]++;
  interestState.idx++;
  renderInterestQ();
}
async function finishInterestQuiz(){
  const scores = interestState.scores;
  let top = Object.keys(scores)[0];
  Object.keys(scores).forEach(c=>{ if(scores[c] > scores[top]) top = c; });
  const meta = CATEGORY_META[top];
  $('interestBody').innerHTML =
    '<div class="quiz-result"><div class="quiz-stars">'+meta.icon+'</div>'+
    '<div class="quiz-score">بیشترین علاقه‌ات:</div>'+
    '<div class="quiz-msg" style="font-size:16px;font-weight:800;margin-top:6px">'+esc(top)+'</div>'+
    '<div class="quiz-msg" style="margin-top:10px">هر وقت خواستی می‌تونی دوباره این آزمون رو بزنی و ببینی علاقه‌ات تغییر کرده یا نه!</div>'+
    '<button class="btn btn-ghost btn-sm" style="margin-top:14px" onclick="closeModal(\'interestModalOv\')">بستن</button></div>';
  await sb.rpc('submit_interest_quiz', { p_student_id: student.id, p_scores_json: JSON.stringify(scores), p_top_category: top });
  loadProfilePanel();
}

/* ------------------------------------------------------------ گالری */
async function loadGallery(){
  const el = $('pGallery');
  el.innerHTML = '<div class="filter-row">'+
    '<select id="galSchool" onchange="loadGallery()"><option value="">همه مدارس</option>'+SCHOOLS.map(s=>'<option '+(($('galSchool')&&$('galSchool').value===s)?'selected':'')+' value="'+s+'">'+s+'</option>').join('')+'</select>'+
    '<select id="galGrade" onchange="loadGallery()"><option value="">همه پایه‌ها</option>'+GRADES.map(g=>'<option value="'+g+'">پایه '+({7:'هفتم',8:'هشتم',9:'نهم'}[g])+'</option>').join('')+'</select>'+
    '</div><div id="galGrid" class="gallery-grid"></div>';
  const school = $('galSchool').value || null, grade = $('galGrade').value ? parseInt($('galGrade').value) : null;
  const { data, error } = await sb.rpc('get_gallery', { p_school: school, p_grade: grade });
  const grid = $('galGrid');
  if(error || !data || !data.length){ grid.outerHTML = emptyState('🖼️','هنوز کاری در گالری نیست','وقتی مربی یک کار رو تأیید و عمومی کنه، اینجا نمایش داده می‌شه'); return; }
  grid.innerHTML = data.map(g=>{
    const isImg = /\.(jpg|jpeg|png|webp|gif)$/i.test(g.file_url);
    return '<div class="g-item" onclick="'+(isImg?'openLightbox(\''+esc(g.file_url)+'\')':'window.open(\''+esc(g.file_url)+'\',\'_blank\')')+'">'+
      (isImg? '<img src="'+esc(g.file_url)+'">' : '<div style="height:120px;display:flex;align-items:center;justify-content:center;font-size:34px;background:var(--paper-dark)">📄</div>')+
      '<div class="g-body"><div class="g-title">'+esc(g.title)+'</div><div class="g-name">'+esc(g.student_name)+' · '+esc(g.school)+'</div></div></div>';
  }).join('');
}

/* ------------------------------------------------------------ رتبه‌بندی */
async function loadLeaderboard(){
  const el = $('pBoard');
  el.innerHTML = '<div class="filter-row">'+
    '<select id="lbSchool" onchange="loadLeaderboard()"><option value="">همه مدارس</option>'+SCHOOLS.map(s=>'<option value="'+s+'">'+s+'</option>').join('')+'</select>'+
    '<select id="lbGrade" onchange="loadLeaderboard()"><option value="">همه پایه‌ها</option>'+GRADES.map(g=>'<option value="'+g+'">پایه '+({7:'هفتم',8:'هشتم',9:'نهم'}[g])+'</option>').join('')+'</select>'+
    '</div><div class="pattern-card" id="lbList"></div>';
  const school = $('lbSchool').value||null, grade=$('lbGrade').value?parseInt($('lbGrade').value):null;
  const { data, error } = await sb.rpc('get_leaderboard', { p_school:school, p_grade:grade });
  const list = $('lbList');
  if(error || !data || !data.length){ list.outerHTML = emptyState('🏆','هنوز رتبه‌بندی خالیه','با آپلود و تأیید کارها امتیاز جمع کنید تا اینجا دیده بشید'); return; }
  list.innerHTML = data.map((r,i)=>'<div class="lb-row"><div class="lb-rank r'+(i+1)+'">'+(i+1)+'</div>'+
    '<div style="flex:1"><div class="lb-name">'+esc(r.full_name)+'</div><div class="lb-meta">'+esc(r.school)+' · پایه '+({7:'هفتم',8:'هشتم',9:'نهم'}[r.grade])+'</div></div>'+
    '<div class="lb-pts">'+r.points+'</div></div>').join('');
}

/* ------------------------------------------------------------ اطلاعیه‌ها */
async function loadAnnouncements(){
  const el = $('pAnn');
  const { data, error } = await sb.from('announcements').select('*').order('created_at',{ascending:false});
  if(error || !data){ el.innerHTML = emptyState('📢','خطا در بارگذاری',''); return; }
  const mine = data.filter(a => (!a.school || a.school===student.school) && (!a.grade || a.grade===student.grade));
  if(!mine.length){ el.innerHTML = emptyState('📢','فعلاً اطلاعیه‌ای نیست','هر خبر جدیدی از طرف مربی اینجا نمایش داده می‌شه'); return; }
  el.innerHTML = mine.map(a=>'<div class="pattern-card ann-card"><div class="ann-title">'+esc(a.title)+'</div>'+
    (a.body?'<div class="ann-body">'+esc(a.body)+'</div>':'')+'<div class="ann-date">'+toJalali(a.created_at)+'</div></div>').join('');
}

function emptyState(ic,t,d){
  return '<div class="empty-state"><div class="ic">'+ic+'</div><div class="t">'+t+'</div><div class="d">'+d+'</div></div>';
}

/* ------------------------------------------------------------ آپلود کار */
function openUploadModal(lessonId, assignmentId){
  $('upTitle').value=''; $('upDesc').value=''; $('upErr').textContent='';
  uploadFileB64=null; uploadFileExt=null; uploadAssignmentId = assignmentId||null;
  $('upDrop').textContent='📎 برای انتخاب عکس یا فایل ضربه بزنید'; $('upDrop').classList.remove('has-file');
  $('upPreview').style.display='none'; $('upFile').value='';
  const lessonField = $('upLessonField');
  const assignField = $('upAssignField');
  if(assignmentId){
    const a = assignments.find(x=>x.id===assignmentId);
    lessonField.style.display='none'; assignField.style.display='block';
    $('upAssignName').textContent = a? a.title : '';
    if(a) $('upTitle').value = a.title;
  } else {
    lessonField.style.display='block'; assignField.style.display='none';
    const sel = $('upLesson');
    sel.innerHTML = '<option value="">— انتخاب نکنید —</option>' + lessons.map(l=>'<option value="'+l.id+'">'+esc(l.unit_title)+'</option>').join('');
    if(lessonId) sel.value = lessonId;
  }
  openModal('uploadModalOv');
}
async function onUploadFileChange(){
  const f = $('upFile').files[0]; if(!f) return;
  uploadFileB64 = await fileToBase64(f);
  uploadFileExt = extOf(f.name, f.type.includes('pdf')?'pdf':'jpg');
  $('upDrop').textContent = '✅ '+f.name; $('upDrop').classList.add('has-file');
  if(f.type.startsWith('image/')){ $('upPreview').src=uploadFileB64; $('upPreview').style.display='block'; }
  else { $('upPreview').style.display='none'; }
}
async function submitUpload(){
  const title = $('upTitle').value.trim();
  $('upErr').textContent='';
  if(!title){ $('upErr').textContent='عنوان کار را بنویسید'; return; }
  if(!uploadFileB64){ $('upErr').textContent='یک عکس یا فایل انتخاب کنید'; return; }
  $('upBtn').disabled=true; $('upBtn').innerHTML='<span class="spinner"></span> در حال ارسال...';
  try{
    const fileUrl = await uploadToStorage('submission-files', uploadFileB64, uploadFileExt);
    const lessonId = uploadAssignmentId ? null : ($('upLesson').value || null);
    const { error } = await sb.from('submissions').insert({
      student_id: student.id, lesson_id: lessonId, assignment_id: uploadAssignmentId||null, title,
      description: $('upDesc').value.trim() || null, file_url: fileUrl
    });
    if(error) throw error;
    closeModal('uploadModalOv');
    showToast('✅ کار شما ارسال شد و در انتظار بررسی مربیه');
    switchStudentTab('pMine');
  }catch(e){
    $('upErr').textContent='خطا در ارسال — دوباره تلاش کنید';
    console.error(e);
  }finally{
    $('upBtn').disabled=false; $('upBtn').textContent='ارسال کار';
  }
}

/* ================================================================ مربی: ورود */
async function teacherLogin(){
  const email = $('taEmail').value.trim(), pass = $('taPass').value;
  $('taErr').textContent='';
  if(!email || !pass){ $('taErr').textContent='ایمیل و رمز را وارد کنید'; return; }
  $('taBtn').disabled=true; $('taBtn').innerHTML='<span class="spinner"></span> در حال ورود...';
  const { error } = await sb.auth.signInWithPassword({ email, password: pass });
  $('taBtn').disabled=false; $('taBtn').textContent='ورود';
  if(error){ $('taErr').textContent='ایمیل یا رمز عبور اشتباه است'; return; }
  await enterTeacherApp();
}
async function teacherLogout(){ await sb.auth.signOut(); goTo('gate'); }
async function enterTeacherApp(){
  const { data:{ session } } = await sb.auth.getSession();
  if(!session) return;
  $('teEmail').textContent = session.user.email;
  goTo('teacherApp');
  await loadAllLessons();
  switchTeacherTab('tReview');
}
function switchTeacherTab(id){
  document.querySelectorAll('#teacherApp .tab').forEach(t=>t.classList.toggle('active', t.dataset.p===id));
  document.querySelectorAll('#teacherApp .panel').forEach(p=>p.classList.toggle('active', p.id===id));
  if(id==='tReview') loadReview();
  if(id==='tLessons') renderLessonsAdmin();
  if(id==='tAssign') loadAssignmentsAdmin();
  if(id==='tStudents') loadStudentsAdmin();
  if(id==='tAnn') loadAnnouncementsAdmin();
  if(id==='tStats') loadStats();
}

/* ------------------------------------------------------------ بررسی کارها */
async function loadReview(){
  const el = $('tReview');
  el.innerHTML = '<div class="filter-row">'+
    '<select id="rvStatus" onchange="loadReview()">'+
      '<option value="pending">در انتظار بررسی</option><option value="approved">تأییدشده</option>'+
      '<option value="needs_fix">نیاز به اصلاح</option><option value="rejected">ردشده</option><option value="all">همه</option>'+
    '</select></div><div id="rvList"></div>';
  const status = $('rvStatus').value;
  let q = sb.from('submissions').select('*, students(full_name, school, grade), lessons(unit_title), assignments(title)').order('created_at',{ascending:false});
  if(status!=='all') q = q.eq('status', status);
  const { data, error } = await q;
  teacherAllSubs = data||[];
  const list = $('rvList');
  if(error || !data || !data.length){ list.innerHTML = emptyState('🗂️','چیزی برای نمایش نیست',''); return; }
  list.innerHTML = data.map(s=>{
    const st = s.students||{}; const ls = s.lessons||{}; const asg = s.assignments||{};
    return '<div class="pattern-card">'+
      '<div class="sub-card-head"><div><div class="sub-title">'+(asg.title?'📅 ':'')+esc(s.title)+'</div>'+
      '<div class="sub-lesson">'+esc(st.full_name||'؟')+' — '+esc(st.school||'')+' · پایه '+({7:'هفتم',8:'هشتم',9:'نهم'}[st.grade]||'؟')+
      (ls.unit_title? ' · '+esc(ls.unit_title):'')+(asg.title? ' · تکلیف: '+esc(asg.title):'')+'</div></div>'+
      '<span class="pill pill-'+s.status+'">'+STATUS_LABEL[s.status]+'</span></div>'+
      (s.description? '<div class="sub-desc">'+esc(s.description)+'</div>':'')+
      fileLinkOrImg(s.file_url)+
      '<div class="rev-controls">'+
        '<select id="rvSt_'+s.id+'">'+Object.keys(STATUS_LABEL).map(k=>'<option value="'+k+'" '+(k===s.status?'selected':'')+'>'+STATUS_LABEL[k]+'</option>').join('')+'</select>'+
        '<input type="number" id="rvPts_'+s.id+'" placeholder="امتیاز" value="'+(s.points_awarded||0)+'">'+
        '<textarea id="rvNote_'+s.id+'" placeholder="یادداشت برای دانش‌آموز (اختیاری)">'+esc(s.teacher_note||'')+'</textarea>'+
        '<label class="chk-row"><input type="checkbox" id="rvPub_'+s.id+'" '+(s.is_public?'checked':'')+' style="width:auto"> نمایش در گالری عمومی</label>'+
        '<div class="save-row"><button class="btn btn-sage btn-sm btn-block" onclick="saveReview(\''+s.id+'\')">💾 ذخیره بررسی</button></div>'+
      '</div></div>';
  }).join('');
}
async function saveReview(id){
  const status = $('rvSt_'+id).value;
  const points_awarded = parseInt($('rvPts_'+id).value)||0;
  const teacher_note = $('rvNote_'+id).value.trim() || null;
  const is_public = $('rvPub_'+id).checked;
  const { data:{session} } = await sb.auth.getSession();
  const { error } = await sb.from('submissions').update({
    status, points_awarded, teacher_note, is_public,
    reviewed_at: new Date().toISOString(), reviewed_by: session?session.user.email:null
  }).eq('id', id);
  if(error){ showToast('❌ خطا در ذخیره'); console.error(error); return; }
  showToast('✅ بررسی ذخیره شد');
  loadReview();
}

/* ------------------------------------------------------------ مدیریت آموزش‌ها (مربی) */
async function loadAllLessons(){
  const { data, error } = await sb.from('lessons').select('*').order('grade').order('order_index');
  lessons = error? [] : data;
}
function renderLessonsAdmin(){
  const el = $('tLessons');
  let html = '<button class="btn btn-thread btn-sm" style="margin-bottom:14px" onclick="openLessonModal(null)">➕ درس جدید</button>';

  const drafts = lessons.filter(l=>l.is_alternative);
  if(drafts.length){
    html += '<div class="sec-title">📦 پیشنهادهای جایگزین (پیش‌نویس — هنوز به دانش‌آموزها نشون داده نمی‌شن)</div>';
    drafts.forEach(l=>{
      html += '<div class="pattern-card draft-card"><div class="lesson-admin-row">'+
        '<div><div class="sub-title">'+esc(l.unit_title)+'</div>'+
        '<div class="sub-lesson">پیشنهاد برای پایه '+({7:'هفتم',8:'هشتم',9:'نهم'}[l.grade])+' — می‌تونه جایگزین یکی از پودمان‌های نیمه‌تجویزی همون پایه بشه</div></div>'+
        '<div class="lbtns"><button class="btn btn-ghost btn-sm" onclick="openLessonModal(\''+l.id+'\')">👁</button>'+
        '<button class="btn btn-sage btn-sm" onclick="activateDraftLesson(\''+l.id+'\')">✅ فعال‌سازی</button></div></div></div>';
    });
  }

  GRADES.forEach(g=>{
    const gl = lessons.filter(l=>l.grade===g && !l.is_alternative);
    html += '<div class="section-title">پایه '+({7:'هفتم',8:'هشتم',9:'نهم'}[g])+'</div>';
    if(!gl.length){ html += emptyState('📚','درسی ثبت نشده',''); }
    gl.forEach(l=>{
      html += '<div class="pattern-card"><div class="lesson-admin-row">'+
        '<div><div class="sub-title">'+esc(l.unit_title)+' '+(l.is_prescribed?'<span class="presc-badge presc-yes">تجویزی</span>':'<span class="presc-badge presc-no">قابل‌جایگزینی</span>')+'</div>'+
        '<div class="sub-lesson">ترتیب: '+l.order_index+' · '+(l.is_published?'✅ نمایش‌داده‌شده':'🚫 آرشیوشده')+'</div></div>'+
        '<div class="lbtns"><button class="btn btn-ghost btn-sm" onclick="openLessonModal(\''+l.id+'\')">✏️</button>'+
        '<button class="btn btn-ghost btn-sm" onclick="duplicateLesson(\''+l.id+'\')">📋</button>'+
        '<button class="btn btn-sky btn-sm" onclick="toggleArchiveLesson(\''+l.id+'\')">'+(l.is_published?'🗄️':'♻️')+'</button>'+
        '<button class="btn btn-brick btn-sm" onclick="deleteLesson(\''+l.id+'\')">🗑️</button></div></div></div>';
    });
  });
  el.innerHTML = html;
}
async function activateDraftLesson(id){
  if(!confirm('این پودمان برای دانش‌آموزها فعال و قابل‌مشاهده بشه؟ (می‌تونید بعداً یکی از پودمان‌های قدیمی رو آرشیو کنید)')) return;
  const { error } = await sb.from('lessons').update({ is_published: true, is_alternative: false }).eq('id', id);
  if(error){ showToast('❌ خطا'); return; }
  showToast('✅ فعال شد و برای دانش‌آموزها نمایش داده می‌شه');
  await loadAllLessons(); renderLessonsAdmin();
}
async function duplicateLesson(id){
  const l = lessons.find(x=>x.id===id); if(!l) return;
  const payload = {
    grade: l.grade, unit_title: l.unit_title+' (کپی)', order_index: l.order_index,
    content_text: l.content_text, advanced_text: l.advanced_text, video_url: l.video_url,
    pdf_url: l.pdf_url, sample_image_url: l.sample_image_url, is_published: false,
    is_prescribed: l.is_prescribed, quiz_json: l.quiz_json, quiz_points: l.quiz_points
  };
  const { data, error } = await sb.from('lessons').insert(payload).select().single();
  if(error){ showToast('❌ خطا در کپی'); console.error(error); return; }
  showToast('📋 کپی شد — الان می‌تونید ویرایشش کنید');
  await loadAllLessons(); renderLessonsAdmin();
  openLessonModal(data.id);
}
async function toggleArchiveLesson(id){
  const l = lessons.find(x=>x.id===id); if(!l) return;
  const next = !l.is_published;
  const msg = next? 'این درس دوباره برای دانش‌آموزها فعال بشه؟' : 'این درس آرشیو (پنهان) بشه؟ دیتاش حذف نمی‌شه و هر وقت خواستید می‌تونید برش گردونید.';
  if(!confirm(msg)) return;
  const { error } = await sb.from('lessons').update({ is_published: next }).eq('id', id);
  if(error){ showToast('❌ خطا'); return; }
  showToast(next? '♻️ دوباره فعال شد' : '🗄️ آرشیو شد');
  await loadAllLessons(); renderLessonsAdmin();
}
function openLessonModal(id){
  lmPdfB64=null; lmImgB64=null;
  $('lmErr').textContent='';
  $('lmPdfDrop').textContent='📄 انتخاب فایل PDF'; $('lmPdfDrop').classList.remove('has-file'); $('lmPdfFile').value='';
  $('lmImgDrop').textContent='🖼️ انتخاب تصویر'; $('lmImgDrop').classList.remove('has-file'); $('lmImgFile').value='';
  $('lmImgPreview').style.display='none';
  if(id){
    const l = lessons.find(x=>x.id===id);
    $('lmTitle').textContent='✏️ ویرایش درس';
    $('lmId').value=l.id; $('lmGrade').value=l.grade; $('lmUnitTitle').value=l.unit_title;
    $('lmOrder').value=l.order_index; $('lmContent').value=l.content_text||'';
    $('lmAdvanced').value=l.advanced_text||'';
    $('lmVideo').value=l.video_url||''; $('lmPublished').checked=l.is_published;
    $('lmPrescribed').checked = l.is_prescribed!==false;
    $('lmQuiz').value = quizJsonToLines(l.quiz_json); $('lmQuizPoints').value = l.quiz_points||10;
    if(l.game_type && GAME_LABELS[l.game_type]){
      $('lmGameNote').style.display='block';
      $('lmGameNote').innerHTML = '⚡ این درس یه بازی اختصاصی طراحی‌شده داره: «'+GAME_LABELS[l.game_type]+'». تا وقتی این بازی فعاله، سؤال‌های چهارگزینه‌ای زیر (حتی اگر پر باشن) نمایش داده نمی‌شن.';
    } else { $('lmGameNote').style.display='none'; }
    lmPdfB64 = l.pdf_url||null; lmImgB64 = l.sample_image_url||null;
    if(l.pdf_url){ $('lmPdfDrop').textContent='✅ فایل PDF موجود (برای تغییر دوباره انتخاب کنید)'; $('lmPdfDrop').classList.add('has-file'); }
    if(l.sample_image_url){ $('lmImgPreview').src=l.sample_image_url; $('lmImgPreview').style.display='block'; }
  } else {
    $('lmTitle').textContent='➕ درس جدید';
    $('lmId').value=''; $('lmGrade').value='7'; $('lmUnitTitle').value=''; $('lmOrder').value=(lessons.length+1);
    $('lmContent').value=''; $('lmAdvanced').value=''; $('lmVideo').value=''; $('lmPublished').checked=true;
    $('lmPrescribed').checked=true;
    $('lmQuiz').value=''; $('lmQuizPoints').value=10;
  }
  openModal('lessonModalOv');
}
async function onLessonFileChange(kind){
  if(kind==='pdf'){
    const f = $('lmPdfFile').files[0]; if(!f) return;
    const b64 = await fileToBase64(f);
    lmPdfB64 = await uploadToStorage('lesson-files', b64, 'pdf').catch(e=>{ showToast('❌ خطا در آپلود PDF'); return null; });
    if(lmPdfB64){ $('lmPdfDrop').textContent='✅ '+f.name; $('lmPdfDrop').classList.add('has-file'); }
  } else {
    const f = $('lmImgFile').files[0]; if(!f) return;
    const b64 = await fileToBase64(f);
    const ext = extOf(f.name,'jpg');
    lmImgB64 = await uploadToStorage('lesson-files', b64, ext).catch(e=>{ showToast('❌ خطا در آپلود تصویر'); return null; });
    if(lmImgB64){ $('lmImgPreview').src=lmImgB64; $('lmImgPreview').style.display='block'; $('lmImgDrop').textContent='✅ '+f.name; $('lmImgDrop').classList.add('has-file'); }
  }
}
async function saveLesson(){
  const unit_title = $('lmUnitTitle').value.trim();
  if(!unit_title){ $('lmErr').textContent='عنوان درس را بنویسید'; return; }
  $('lmBtn').disabled=true; $('lmBtn').innerHTML='<span class="spinner"></span> در حال ذخیره...';
  const payload = {
    grade: parseInt($('lmGrade').value), unit_title,
    order_index: parseInt($('lmOrder').value)||0,
    content_text: $('lmContent').value.trim()||null,
    advanced_text: $('lmAdvanced').value.trim()||null,
    video_url: $('lmVideo').value.trim()||null,
    pdf_url: lmPdfB64||null, sample_image_url: lmImgB64||null,
    is_published: $('lmPublished').checked, updated_at: new Date().toISOString(),
    is_prescribed: $('lmPrescribed').checked,
    quiz_json: linesToQuizJson($('lmQuiz').value), quiz_points: parseInt($('lmQuizPoints').value)||10
  };
  const id = $('lmId').value;
  const { error } = id ? await sb.from('lessons').update(payload).eq('id',id) : await sb.from('lessons').insert(payload);
  $('lmBtn').disabled=false; $('lmBtn').textContent='ذخیره درس';
  if(error){ $('lmErr').textContent='خطا در ذخیره'; console.error(error); return; }
  closeModal('lessonModalOv');
  showToast('✅ درس ذخیره شد');
  await loadAllLessons(); renderLessonsAdmin();
}
async function deleteLesson(id){
  if(!confirm('⚠️ این درس برای همیشه حذف می‌شه (کارهای آپلودشده‌ی مرتبط باهاش می‌مونن ولی لینکشون به این درس قطع می‌شه). اگه فقط می‌خواید موقتاً پنهانش کنید، به‌جاش از دکمه‌ی 🗄️ آرشیو استفاده کنید. مطمئنید؟')) return;
  const { error } = await sb.from('lessons').delete().eq('id', id);
  if(error){ showToast('❌ خطا در حذف'); return; }
  showToast('🗑️ حذف شد'); await loadAllLessons(); renderLessonsAdmin();
}

/* ------------------------------------------------------------ تکالیف هفتگی (مربی) */
async function loadAssignmentsAdmin(){
  const el = $('tAssign');
  const { data, error } = await sb.from('assignments').select('*').order('created_at',{ascending:false});
  const list = error? [] : (data||[]);
  let html = '<button class="btn btn-thread btn-sm" style="margin-bottom:14px" onclick="openAssignmentModal(null)">➕ تکلیف جدید</button>';
  if(!list.length){ html += emptyState('📅','هنوز تکلیفی ثبت نشده',''); }
  list.forEach(a=>{
    html += '<div class="pattern-card"><div class="lesson-admin-row">'+
      '<div><div class="sub-title">'+esc(a.title)+'</div>'+
      '<div class="sub-lesson">'+(a.grade?'پایه '+({7:'هفتم',8:'هشتم',9:'نهم'}[a.grade]):'همه‌ی پایه‌ها')+' · '+(a.school?esc(a.school):'هر دو مدرسه')+
      (a.due_date? ' · مهلت: '+toJalali(a.due_date):'')+' · '+(a.is_active?'✅ فعال':'🚫 غیرفعال')+'</div></div>'+
      '<div class="lbtns"><button class="btn btn-ghost btn-sm" onclick="openAssignmentModal(\''+a.id+'\')">✏️</button>'+
      '<button class="btn btn-brick btn-sm" onclick="deleteAssignment(\''+a.id+'\')">🗑️</button></div></div></div>';
  });
  el.innerHTML = html;
  window._assignAdminList = list;
}
function openAssignmentModal(id){
  $('amErr').textContent='';
  if(id){
    const a = (window._assignAdminList||[]).find(x=>x.id===id);
    $('amTitle').textContent='✏️ ویرایش تکلیف';
    $('amId').value=a.id; $('amTitleInput').value=a.title; $('amDesc').value=a.description||'';
    $('amGrade').value=a.grade||''; $('amSchool').value=a.school||'';
    $('amDue').value=a.due_date||''; $('amPoints').value=a.points_hint;
    $('amActive').checked=a.is_active;
  } else {
    $('amTitle').textContent='➕ تکلیف جدید';
    $('amId').value=''; $('amTitleInput').value=''; $('amDesc').value='';
    $('amGrade').value=''; $('amSchool').value=''; $('amDue').value=''; $('amPoints').value=10; $('amActive').checked=true;
  }
  openModal('assignModalOv');
}
async function saveAssignment(){
  const title = $('amTitleInput').value.trim();
  if(!title){ $('amErr').textContent='عنوان تکلیف را بنویسید'; return; }
  const payload = {
    title, description: $('amDesc').value.trim()||null,
    grade: $('amGrade').value?parseInt($('amGrade').value):null,
    school: $('amSchool').value||null,
    due_date: $('amDue').value||null,
    points_hint: parseInt($('amPoints').value)||10,
    is_active: $('amActive').checked
  };
  const id = $('amId').value;
  const { error } = id ? await sb.from('assignments').update(payload).eq('id',id) : await sb.from('assignments').insert(payload);
  if(error){ $('amErr').textContent='خطا در ذخیره'; console.error(error); return; }
  closeModal('assignModalOv'); showToast('✅ تکلیف ذخیره شد'); loadAssignmentsAdmin();
}
async function deleteAssignment(id){
  if(!confirm('این تکلیف حذف بشه؟')) return;
  const { error } = await sb.from('assignments').delete().eq('id', id);
  if(error){ showToast('❌ خطا در حذف'); return; }
  showToast('🗑️ حذف شد'); loadAssignmentsAdmin();
}

/* ------------------------------------------------------------ دانش‌آموزان (مربی) */
async function loadStudentsAdmin(){
  const el = $('tStudents');
  el.innerHTML = '<div class="filter-row">'+
    '<select id="stuSchool" onchange="loadStudentsAdmin()"><option value="">همه مدارس</option>'+SCHOOLS.map(s=>'<option value="'+s+'">'+s+'</option>').join('')+'</select>'+
    '<select id="stuGrade" onchange="loadStudentsAdmin()"><option value="">همه پایه‌ها</option>'+GRADES.map(g=>'<option value="'+g+'">پایه '+({7:'هفتم',8:'هشتم',9:'نهم'}[g])+'</option>').join('')+'</select>'+
    '</div><div class="pattern-card" id="stuList"></div>';
  let q = sb.from('students').select('*').order('full_name');
  if($('stuSchool').value) q = q.eq('school', $('stuSchool').value);
  if($('stuGrade').value) q = q.eq('grade', parseInt($('stuGrade').value));
  const { data, error } = await q;
  const list = $('stu
