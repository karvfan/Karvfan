/**
 * utils.js — توابع کمکی عمومی (بدون وابستگی به state خاصی)
 * DOM helpers، escape متن، تاریخ جلالی، آپلود فایل به Storage، تبدیل فرمت آزمون.
 */

function $(id){ return document.getElementById(id); }
function esc(s){ return (s==null?'':String(s)).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function showToast(msg){ const t=$('toast'); t.textContent=msg; t.style.display='block'; clearTimeout(window._tt); window._tt=setTimeout(()=>t.style.display='none', 2600); }
function goTo(id){ document.querySelectorAll('.screen').forEach(el=>el.classList.add('hidden')); const t=$(id); if(t) t.classList.remove('hidden'); }
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

/* ------------------------------------------------------------ پروفایل استعداد و علاقه‌سنجی */
function emptyState(ic,t,d){
  return '<div class="empty-state"><div class="ic">'+ic+'</div><div class="t">'+t+'</div><div class="d">'+d+'</div></div>';
}

/* ------------------------------------------------------------ آپلود کار */
function statBox(n,l){ return '<div class="stat-box"><div class="n">'+(n??0)+'</div><div class="l">'+l+'</div></div>'; }

/* ------------------------------------------------------------ آمار کلان (ناظر منطقه) */
