/**
 * utils.js — توابع کمکی عمومی (بدون وابستگی به state خاصی)
 * DOM helpers، escape متن، تاریخ جلالی، آپلود فایل به Storage، تبدیل فرمت آزمون.
 */

function $(id){ return document.getElementById(id); }
function esc(s){ return (s==null?'':String(s)).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// برای نمایش عمومی (رتبه‌بندی): نام کوچیک کامل + حرف اول فامیل — حریم خصوصی دانش‌آموزان
function maskName(fullName){
  const parts = (fullName||'').trim().split(/\s+/);
  if(parts.length < 2) return fullName || '';
  const first = parts[0];
  const lastInitial = parts[parts.length-1].charAt(0);
  return first + ' ' + lastInitial + '.';
}
function showToast(msg){ const t=$('toast'); t.textContent=msg; t.style.display='block'; clearTimeout(window._tt); window._tt=setTimeout(()=>t.style.display='none', 2600); }
function goTo(id){ document.querySelectorAll('.screen').forEach(el=>el.classList.add('hidden')); const t=$(id); if(t) t.classList.remove('hidden'); }
function closeModal(id){ $(id).classList.remove('open'); }
function openModal(id){ $(id).classList.add('open'); }
function openLightbox(src){ $('lightboxImg').src = src; $('lightbox').classList.add('open'); }
function closeLightbox(){ $('lightbox').classList.remove('open'); }
function fileToBase64(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }); }

// حذف فیلدهای حساس (پین/هش پین و مشابه) قبل از ذخیره در localStorage —
// حتی اگه RPC سمت Supabase این فیلدها رو برگردونه، اینجا فیلتر می‌شن تا هیچ‌وقت
// روی دستگاه کاربر یا در تاریخچه‌ی مرورگر ذخیره نشن.
// نمودار میله‌ای ساده و سبک (بدون کتابخانه‌ی خارجی) — labels و values هم‌طول
function renderBarChart(containerId, labels, values, opts={}){
  const el = document.getElementById(containerId);
  if(!el) return;
  const w = 700, h = 180, padB = 26, padT = 10, barGap = 4;
  const maxV = Math.max(1, ...values);
  const barW = (w / values.length) - barGap;
  const color = opts.color || '#356f8f';
  let bars = '';
  values.forEach((v,i)=>{
    const bh = Math.round(((h-padB-padT) * v) / maxV);
    const x = i * (barW+barGap);
    const y = h - padB - bh;
    bars += `<rect x="${x}" y="${y}" width="${barW}" height="${Math.max(bh,1)}" rx="3" fill="${color}"><title>${labels[i]}: ${v}</title></rect>`;
    if(labels[i] && (values.length<=14 || i % Math.ceil(values.length/14)===0)){
      bars += `<text x="${x+barW/2}" y="${h-8}" font-size="9" fill="#6b6b6b" text-anchor="middle">${labels[i]}</text>`;
    }
  });
  el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;direction:ltr">${bars}</svg>`;
}
// اعتبارسنجی کد ملی ایرانی (الگوریتم رقم کنترلی رسمی)
function isValidNationalCode(code){
  code = (code||'').trim();
  if(!/^\d{10}$/.test(code)) return false;
  if(/^(\d)\1{9}$/.test(code)) return false; // ۱۱۱۱۱۱۱۱۱۱ و مشابه، نامعتبرن
  const check = parseInt(code[9], 10);
  let sum = 0;
  for(let i=0;i<9;i++) sum += parseInt(code[i], 10) * (10-i);
  const remainder = sum % 11;
  return (remainder < 2 && check === remainder) || (remainder >= 2 && check === 11 - remainder);
}
// ورودی ایمیل یا کد ملی رو به ایمیل واقعیِ قابل‌استفاده برای Supabase Auth تبدیل می‌کنه.
// اگه ایمیل باشه همون برمی‌گرده؛ اگه ۱۰ رقمی باشه، از دیتابیس ایمیل واقعیِ متناظرش جست‌وجو می‌شه.
async function resolveLoginIdentifier(input){
  input = (input||'').trim();
  if(input.includes('@')) return input;
  if(/^\d{10}$/.test(input)){
    const { data } = await sb.rpc('resolve_national_code_email', { p_national_code: input });
    return data || input; // اگه پیدا نشد، همون کد رو برمی‌گردونیم تا Supabase خطای معمول بده
  }
  return input;
}

function sanitizeStudent(row){
  if(!row || typeof row !== 'object') return row;
  const { pin, pin_hash, password, password_hash, ...safe } = row;
  return safe;
}

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
function fileLinkOrImg(url){
  if(!url) return '';
  if(/\.(jpg|jpeg|png|webp|gif)$/i.test(url)) return '<img class="sample-img" style="max-height:200px" src="'+esc(url)+'" onclick="openLightbox(\''+esc(url)+'\')">';
  return '<a class="sub-file-link" href="'+esc(url)+'" target="_blank">📎 مشاهده فایل</a>';
}
function designReflectionHtml(json){
  if(!json) return '';
  let d; try{ d = JSON.parse(json); }catch(e){ return ''; }
  if(d.type === 'company'){
    const rows = [
      ['💼 محصول', d.product], ['💰 قیمت', d.price], ['📣 فروش/تبلیغ', d.sell_plan], ['🎯 مشتری‌ها', d.customers]
    ].filter(r=>r[1]);
    if(!rows.length) return '';
    return '<div class="home-box"><div class="home-box-title">💼 پروژه‌ی شرکت دانش‌آموزی</div>'+
      rows.map(r=>'<div class="lesson-body"><b>'+r[0]+':</b> '+esc(r[1])+'</div>').join('')+'</div>';
  }
  const rows = [
    ['🧩 مشکل', d.problem], ['💡 ایده‌ها', d.ideas], ['✅ چرا این انتخاب', d.why_chosen],
    ['🔨 چطور ساختی', d.how_built], ['🔄 چطور بهترش می‌کردی', d.improvement]
  ].filter(r=>r[1]);
  if(!rows.length) return '';
  return '<div class="home-box"><div class="home-box-title">🎨 فرایند طراحی</div>'+
    rows.map(r=>'<div class="lesson-body"><b>'+r[0]+':</b> '+esc(r[1])+'</div>').join('')+
    '</div>';
}
function ecoFriendlyHtml(is_eco, note){
  if(!is_eco) return '';
  return '<div class="eco-badge">♻️ سازگار با محیط‌زیست'+(note?(' — '+esc(note)):'')+'</div>';
}

/* ------------------------------------------------------------ پروفایل استعداد و علاقه‌سنجی */
function emptyState(ic,t,d){
  return '<div class="empty-state"><div class="ic">'+ic+'</div><div class="t">'+t+'</div><div class="d">'+d+'</div></div>';
}

/* ------------------------------------------------------------ آپلود کار */
function statBox(n,l){ return '<div class="stat-box"><div class="n">'+(n??0)+'</div><div class="l">'+l+'</div></div>'; }

/* ------------------------------------------------------------ آمار کلان (ناظر منطقه) */
