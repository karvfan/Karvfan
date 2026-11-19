/**
 * jalali-datepicker.js — تقویم شمسی (فارسی) برای فیلدهای <input type="date">
 *
 * هر <input type="date"> صفحه خودکار به یک انتخابگر شمسی تبدیل می‌شه.
 * مقدار واقعی فیلد همچنان میلادی و به‌شکل YYYY-MM-DD می‌مونه (برای دیتابیس)،
 * پس کد قبلی که input.value رو می‌خونه یا می‌نویسه بدون تغییر کار می‌کنه.
 * وابسته به jalali-core.js
 */
(function(){
  'use strict';
  const J = window.JalaliDate;
  if(!J) return;

  const WEEKDAYS = ['ش','ی','د','س','چ','پ','ج']; // شنبه … جمعه
  const valueDesc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

  function injectCss(){
    if(document.getElementById('jdpCss')) return;
    const st = document.createElement('style');
    st.id = 'jdpCss';
    st.textContent =
      '.jdp-display{cursor:pointer;background:var(--paper,#fff)}' +
      '.jdp-ov{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100000;display:flex;align-items:center;justify-content:center;padding:14px}' +
      '.jdp-box{background:var(--paper,#fff);color:var(--ink,#222);border-radius:16px;width:100%;max-width:340px;padding:14px;box-shadow:0 10px 40px rgba(0,0,0,.3);direction:rtl;font-family:inherit}' +
      '.jdp-head{display:flex;align-items:center;gap:6px;margin-bottom:10px}' +
      '.jdp-nav{border:0;background:var(--paper-dark,#eee);color:inherit;width:38px;height:38px;border-radius:10px;font-size:20px;cursor:pointer;font-family:inherit}' +
      '.jdp-sel{flex:1;min-width:0;padding:8px 4px;border-radius:10px;border:1px solid var(--line,#ccc);background:var(--paper,#fff);color:inherit;font-family:inherit;font-size:14px}' +
      '.jdp-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center}' +
      '.jdp-wd{font-size:12px;color:var(--ink-soft,#777);padding:4px 0}' +
      '.jdp-day{border:0;background:transparent;color:inherit;height:38px;border-radius:10px;font-size:15px;cursor:pointer;font-family:inherit}' +
      '.jdp-day:hover{background:var(--paper-dark,#eee)}' +
      '.jdp-day.fri{color:#c0392b}' +
      '.jdp-day.today{outline:2px solid var(--thread,#356f8f)}' +
      '.jdp-day.sel{background:var(--thread,#356f8f);color:#fff}' +
      '.jdp-empty{height:38px}' +
      '.jdp-foot{display:flex;gap:6px;margin-top:12px}' +
      '.jdp-foot button{flex:1;border:0;border-radius:10px;padding:10px 4px;font-size:13px;cursor:pointer;font-family:inherit;background:var(--paper-dark,#eee);color:inherit}' +
      '.jdp-foot .jdp-clear{color:#c0392b}';
    document.head.appendChild(st);
  }

  function isoOf(jy, jm, jd){
    const g = J.toGregorian(jy, jm, jd);
    return g.gy + '-' + J.pad2(g.gm) + '-' + J.pad2(g.gd);
  }
  function jalaliOfISO(iso){
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? J.toJalaali(+m[1], +m[2], +m[3]) : null;
  }
  function todayJalali(){
    const t = J.tehranParts(new Date());
    return J.toJalaali(t.gy, t.gm, t.gd);
  }
  function weekdayOffset(jy, jm){ // شنبه = ۰
    const g = J.toGregorian(jy, jm, 1);
    const dow = new Date(Date.UTC(g.gy, g.gm - 1, g.gd)).getUTCDay(); // یکشنبه = ۰
    return (dow + 1) % 7;
  }

  function openPicker(input, display){
    const cur = jalaliOfISO(valueDesc.get.call(input));
    const today = todayJalali();
    let vy = (cur || today).jy, vm = (cur || today).jm;

    const ov = document.createElement('div');
    ov.className = 'jdp-ov';
    const box = document.createElement('div');
    box.className = 'jdp-box';
    ov.appendChild(box);

    function close(){ document.removeEventListener('keydown', onKey); ov.remove(); }
    function onKey(e){ if(e.key === 'Escape') close(); }
    function choose(iso){
      valueDesc.set.call(input, iso);
      sync(input, display);
      input.dispatchEvent(new Event('change', { bubbles: true }));
      close();
    }

    function render(){
      const years = [];
      for(let y = today.jy - 2; y <= today.jy + 6; y++) years.push(y);
      if(!years.includes(vy)) years.push(vy);
      years.sort((a, b) => a - b);

      let html = '<div class="jdp-head">' +
        '<button type="button" class="jdp-nav" data-act="prev" aria-label="ماه قبل">›</button>' +
        '<select class="jdp-sel" data-act="month">' +
          J.MONTHS.map((n, i) => '<option value="' + (i + 1) + '"' + (i + 1 === vm ? ' selected' : '') + '>' + n + '</option>').join('') +
        '</select>' +
        '<select class="jdp-sel" data-act="year">' +
          years.map(y => '<option value="' + y + '"' + (y === vy ? ' selected' : '') + '>' + J.toFa(y) + '</option>').join('') +
        '</select>' +
        '<button type="button" class="jdp-nav" data-act="next" aria-label="ماه بعد">‹</button>' +
        '</div><div class="jdp-grid">' +
        WEEKDAYS.map(w => '<div class="jdp-wd">' + w + '</div>').join('');

      const off = weekdayOffset(vy, vm), len = J.monthLength(vy, vm);
      for(let i = 0; i < off; i++) html += '<div class="jdp-empty"></div>';
      for(let d = 1; d <= len; d++){
        const col = (off + d - 1) % 7;
        const isSel = cur && cur.jy === vy && cur.jm === vm && cur.jd === d;
        const isToday = today.jy === vy && today.jm === vm && today.jd === d;
        html += '<button type="button" class="jdp-day' + (col === 6 ? ' fri' : '') + (isToday ? ' today' : '') + (isSel ? ' sel' : '') +
          '" data-day="' + d + '">' + J.toFa(d) + '</button>';
      }
      html += '</div><div class="jdp-foot">' +
        '<button type="button" data-act="today">امروز</button>' +
        '<button type="button" class="jdp-clear" data-act="clear">حذف تاریخ</button>' +
        '<button type="button" data-act="close">بستن</button></div>';
      box.innerHTML = html;
    }

    box.addEventListener('click', e => {
      const b = e.target.closest('button');
      if(!b) return;
      if(b.dataset.day){ choose(isoOf(vy, vm, +b.dataset.day)); return; }
      const act = b.dataset.act;
      if(act === 'prev'){ vm--; if(vm < 1){ vm = 12; vy--; } render(); }
      else if(act === 'next'){ vm++; if(vm > 12){ vm = 1; vy++; } render(); }
      else if(act === 'today'){ choose(isoOf(today.jy, today.jm, today.jd)); }
      else if(act === 'clear'){ choose(''); }
      else if(act === 'close'){ close(); }
    });
    box.addEventListener('change', e => {
      const s = e.target;
      if(s.dataset.act === 'month'){ vm = +s.value; render(); }
      if(s.dataset.act === 'year'){ vy = +s.value; render(); }
    });
    ov.addEventListener('click', e => { if(e.target === ov) close(); });
    document.addEventListener('keydown', onKey);
    render();
    document.body.appendChild(ov);
  }

  function sync(input, display){
    const v = valueDesc.get.call(input);
    display.value = v ? J.formatISO(v) : '';
  }

  function enhance(input){
    if(input.dataset.jdp) return;
    input.dataset.jdp = '1';
    injectCss();

    const display = document.createElement('input');
    display.type = 'text';
    display.readOnly = true;
    display.className = (input.className ? input.className + ' ' : '') + 'jdp-display';
    display.placeholder = 'انتخاب تاریخ (شمسی)';
    display.setAttribute('inputmode', 'none');
    display.setAttribute('aria-label', 'انتخاب تاریخ شمسی');
    input.parentNode.insertBefore(display, input);
    input.style.display = 'none';

    // خواندن/نوشتن input.value توسط کدهای دیگه، نمایش شمسی رو هم به‌روز می‌کنه
    Object.defineProperty(input, 'value', {
      configurable: true,
      get(){ return valueDesc.get.call(input); },
      set(v){ valueDesc.set.call(input, v); sync(input, display); }
    });

    display.addEventListener('click', () => openPicker(input, display));
    display.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openPicker(input, display); } });
    sync(input, display);
  }

  function enhanceAll(root){
    (root || document).querySelectorAll('input[type="date"]').forEach(enhance);
  }
  window.enhanceJalaliDates = enhanceAll;

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => enhanceAll());
  else enhanceAll();
})();
