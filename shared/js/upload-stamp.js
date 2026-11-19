/**
 * upload-stamp.js — مهر «تاریخ و ساعت بارگذاری» برای کارهای دانش‌آموز
 *
 *  - عکس: خط «بارگذاری: ۲۸ آبان ۱۴۰۵ — ۱۴:۰۵» به واترمارک روی خود عکس اضافه می‌شه،
 *    و درست لحظه‌ی ارسال دوباره ساخته می‌شه تا ساعت، ساعت واقعی بارگذاری باشه.
 *  - ویدیو و فایل (PDF/Word/...): داخل خود فایل نمی‌شه چیزی نوشت، پس زمان ثبت
 *    سرور (به وقت تهران) زیر هر کار در «کارهای من» و در «بررسی کارها»ی مربی نشون داده می‌شه.
 *  - عکس هم در همین دو جا زمان ثبت سرور رو داره.
 *
 * این فایل باید بعد از student.js / upload-media.js / edit-submission.js (دانش‌آموز)
 * یا teacher.js (مربی) و قبل از main.js لود بشه. وابسته به jalali-core.js
 */
(function(){
  'use strict';
  const J = window.JalaliDate;
  if(!J) return;

  /* ---------- دانش‌آموز: واترمارک عکس ---------- */
  if(typeof currentWatermarkLines === 'function'){
    const _linesOrig = currentWatermarkLines;
    currentWatermarkLines = function(){
      const lines = _linesOrig.apply(this, arguments) || [];
      lines.push('بارگذاری: ' + J.stampShort(new Date()));
      return lines;
    };
  }

  // درست لحظه‌ی ارسال، عکس با ساعت همون لحظه دوباره واترمارک می‌شه
  if(typeof submitUpload === 'function'){
    const _submitOrig = submitUpload;
    submitUpload = async function(){
      try{
        if(typeof rawUploadB64 !== 'undefined' && rawUploadB64 && typeof renderWatermarkedUpload === 'function'){
          await renderWatermarkedUpload();
        }
      }catch(e){ console.error('upload-stamp: خطا در به‌روزرسانی واترمارک', e); }
      return _submitOrig.apply(this, arguments);
    };
  }

  /* ---------- دانش‌آموز: «کارهای من» ---------- */
  if(typeof loadMySubmissions === 'function'){
    const _mineOrig = loadMySubmissions;
    loadMySubmissions = async function(){
      const r = await _mineOrig.apply(this, arguments);
      try{
        const list = (typeof _mySubsList !== 'undefined' && _mySubsList) || [];
        const cards = document.querySelectorAll('#pMine .pattern-card');
        if(list.length && cards.length === list.length){
          cards.forEach((card, i) => {
            const span = card.querySelector('.sub-footer span');
            if(span && list[i].created_at) span.textContent = '📤 ' + J.stamp(list[i].created_at);
          });
        }
      }catch(e){ console.error('upload-stamp: کارهای من', e); }
      return r;
    };
  }

  /* ---------- مربی: «بررسی کارها» ---------- */
  if(typeof loadReview === 'function'){
    const _reviewOrig = loadReview;
    loadReview = async function(){
      const r = await _reviewOrig.apply(this, arguments);
      try{
        const list = (typeof teacherAllSubs !== 'undefined' && teacherAllSubs) || [];
        list.forEach(s => {
          if(!s.created_at) return;
          const sel = document.getElementById('rvSt_' + s.id);
          const card = sel && sel.closest('.pattern-card');
          if(!card || card.querySelector('.upload-stamp')) return;
          const d = document.createElement('div');
          d.className = 'upload-stamp sub-lesson';
          d.style.margin = '8px 0';
          d.textContent = '📤 زمان بارگذاری: ' + J.stamp(s.created_at);
          const ctrl = card.querySelector('.rev-controls');
          if(ctrl) card.insertBefore(d, ctrl); else card.appendChild(d);
        });
      }catch(e){ console.error('upload-stamp: بررسی کارها', e); }
      return r;
    };
  }
})();
