/**
 * jalali-core.js — تبدیل تاریخ میلادی ⇄ شمسی و قالب‌بندی «تاریخ و ساعت» به وقت ایران
 *
 * الگوریتم تبدیل همون الگوریتم مشهور jalaali-js ـه (بدون وابستگی خارجی).
 * توابع عمومی (روی window):
 *   JalaliDate.toJalaali(gy,gm,gd) / toGregorian(jy,jm,jd) / monthLength(jy,jm)
 *   JalaliDate.tehranParts(date)        → اجزای تاریخ/ساعت به وقت تهران
 *   JalaliDate.stamp(dateLike)          → «۲۸ آبان ۱۴۰۵ — ساعت ۱۴:۰۵»
 *   JalaliDate.stampShort(dateLike)     → «۲۸ آبان ۱۴۰۵ — ۱۴:۰۵» (برای واترمارک عکس)
 *   JalaliDate.formatISO(isoDate)       → «۲۸ آبان ۱۴۰۵» از «2026-11-19»
 *   toJalaliDateTime(dateLike)          → هم‌نام و هم‌سبک toJalali ولی با ساعت
 */
(function(){
  'use strict';

  const MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
  const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

  function div(a, b){ return ~~(a / b); }
  function mod(a, b){ return a - ~~(a / b) * b; }
  function toFa(n){ return String(n).replace(/\d/g, d => FA_DIGITS[d]); }
  function pad2(n){ return (n < 10 ? '0' : '') + n; }

  const BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];

  function jalCal(jy, withoutLeap){
    const bl = BREAKS.length;
    const gy = jy + 621;
    let leapJ = -14, jp = BREAKS[0], jm, jump = 0, leap, n;
    if(jy < jp || jy >= BREAKS[bl - 1]) throw new Error('Invalid Jalaali year ' + jy);
    for(let i = 1; i < bl; i += 1){
      jm = BREAKS[i];
      jump = jm - jp;
      if(jy < jm) break;
      leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
      jp = jm;
    }
    n = jy - jp;
    leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
    if(mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
    const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
    const march = 20 + leapJ - leapG;
    if(withoutLeap) return { gy, march };
    if(jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
    leap = mod(mod(n + 1, 33) - 1, 4);
    if(leap === -1) leap = 4;
    return { leap, gy, march };
  }
  function g2d(gy, gm, gd){
    let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
    d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
    return d;
  }
  function d2g(jdn){
    let j = 4 * jdn + 139361631;
    j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
    const i = div(mod(j, 1461), 4) * 5 + 308;
    const gd = div(mod(i, 153), 5) + 1;
    const gm = mod(div(i, 153), 12) + 1;
    const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
    return { gy, gm, gd };
  }
  function j2d(jy, jm, jd){
    const r = jalCal(jy, true);
    return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
  }
  function d2j(jdn){
    const gy = d2g(jdn).gy;
    let jy = gy - 621;
    const r = jalCal(jy, false);
    const jdn1f = g2d(gy, 3, r.march);
    let k = jdn - jdn1f;
    if(k >= 0){
      if(k <= 185) return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
      k -= 186;
    } else {
      jy -= 1;
      k += 179;
      if(r.leap === 1) k += 1;
    }
    return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
  }
  function toJalaali(gy, gm, gd){ return d2j(g2d(gy, gm, gd)); }
  function toGregorian(jy, jm, jd){ return d2g(j2d(jy, jm, jd)); }
  function isLeap(jy){ return jalCal(jy, false).leap === 0; }
  function monthLength(jy, jm){
    if(jm <= 6) return 31;
    if(jm <= 11) return 30;
    return isLeap(jy) ? 30 : 29;
  }

  // اجزای تاریخ و ساعت به وقت تهران (مستقل از ساعت/منطقه‌ی زمانی گوشی)
  function tehranParts(input){
    const d = input instanceof Date ? input : new Date(input);
    if(isNaN(d.getTime())) return null;
    try{
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Tehran', hourCycle: 'h23',
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      }).formatToParts(d);
      const o = {};
      parts.forEach(p => { o[p.type] = p.value; });
      return { gy: +o.year, gm: +o.month, gd: +o.day, hh: +o.hour % 24, mm: +o.minute };
    }catch(e){
      return { gy: d.getFullYear(), gm: d.getMonth() + 1, gd: d.getDate(), hh: d.getHours(), mm: d.getMinutes() };
    }
  }

  function stamp(input, short){
    const t = tehranParts(input);
    if(!t) return '';
    const j = toJalaali(t.gy, t.gm, t.gd);
    const day = toFa(j.jd) + ' ' + MONTHS[j.jm - 1] + ' ' + toFa(j.jy);
    const time = toFa(pad2(t.hh)) + ':' + toFa(pad2(t.mm));
    return day + (short ? ' — ' : ' — ساعت ') + time;
  }
  function stampShort(input){ return stamp(input, true); }

  // «2026-11-19» (فقط تاریخ، بدون ساعت) → «۲۸ آبان ۱۴۰۵»
  function formatISO(iso){
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
    if(!m) return '';
    const j = toJalaali(+m[1], +m[2], +m[3]);
    return toFa(j.jd) + ' ' + MONTHS[j.jm - 1] + ' ' + toFa(j.jy);
  }

  window.JalaliDate = {
    MONTHS, toFa, pad2, toJalaali, toGregorian, isLeap, monthLength,
    tehranParts, stamp, stampShort, formatISO
  };
  window.toJalaliDateTime = function(dateLike){ return stamp(dateLike, false); };
})();
