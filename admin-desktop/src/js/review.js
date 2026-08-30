/**
 * review.js — بررسی کارهای دانش‌آموزان (پنل مدیریت دسکتاپ)
 * دسترسی طبق RLS جدول submissions خودکار محدود می‌شود:
 * مدیر مدرسه فقط مدرسه‌ی خودش، مدیران بالاتر طبق حوزه‌شان.
 */
const STATUS_LABEL_RV = { pending:'⏳ در انتظار', approved:'✅ تأییدشده', needs_fix:'✏️ نیاز به اصلاح', rejected:'❌ ردشده' };

function fileLinkOrImgRv(url){
  if(!url) return '';
  if(/\.(jpg|jpeg|png|webp|gif)$/i.test(url)) return '<img class="sample-img" src="'+esc(url)+'" onclick="openLightbox(\''+esc(url)+'\')">';
  return '<a class="sub-file-link" href="'+esc(url)+'" target="_blank">📎 مشاهده فایل</a>';
}
function designReflectionHtmlRv(json){
  if(!json) return '';
  let d; try{ d = JSON.parse(json); }catch(e){ return ''; }
  if(d.type === 'company'){
    const rows = [['💼 محصول', d.product], ['💰 قیمت', d.price], ['📣 فروش/تبلیغ', d.sell_plan], ['🎯 مشتری‌ها', d.customers]].filter(r=>r[1]);
    if(!rows.length) return '';
    return '<div class="home-box"><div class="home-box-title">💼 پروژه‌ی شرکت دانش‌آموزی</div>'+rows.map(r=>'<div class="lesson-body"><b>'+r[0]+':</b> '+esc(r[1])+'</div>').join('')+'</div>';
  }
  const rows = [['🧩 مشکل', d.problem], ['💡 ایده‌ها', d.ideas], ['✅ چرا این انتخاب', d.why_chosen], ['🔨 چطور ساختی', d.how_built], ['🔄 چطور بهترش می‌کردی', d.improvement]].filter(r=>r[1]);
  if(!rows.length) return '';
  return '<div class="home-box"><div class="home-box-title">🎨 فرایند طراحی</div>'+rows.map(r=>'<div class="lesson-body"><b>'+r[0]+':</b> '+esc(r[1])+'</div>').join('')+'</div>';
}
function ecoFriendlyHtmlRv(is_eco, note){
  if(!is_eco) return '';
  return '<div class="eco-badge">♻️ سازگار با محیط‌زیست'+(note?(' — '+esc(note)):'')+'</div>';
}
function openLightbox(src){ document.getElementById('lightboxImg').src = src; document.getElementById('lightbox').classList.add('open'); }
function closeLightbox(){ document.getElementById('lightbox').classList.remove('open'); }

let reviewAllSubs = [];
async function loadReview(){
  const statusEl = document.getElementById('rvStatus');
  if(!statusEl.dataset.wired){ statusEl.addEventListener('change', loadReview); statusEl.dataset.wired='1'; }
  const status = statusEl.value;
  let q = sb.from('submissions').select('*, students(full_name, school, grade), lessons(unit_title), assignments(title)').order('created_at',{ascending:false});
  if(status!=='all') q = q.eq('status', status);
  const { data, error } = await q;
  reviewAllSubs = data||[];
  const list = document.getElementById('reviewBody');
  if(error || !data || !data.length){ list.innerHTML = emptyStateRv('🗂️','چیزی برای نمایش نیست',''); return; }
  list.innerHTML = data.map(s=>{
    const st = s.students||{}; const ls = s.lessons||{}; const asg = s.assignments||{};
    return '<div class="pattern-card">'+
      '<div class="sub-card-head"><div><div class="sub-title">'+(asg.title?'📅 ':'')+esc(s.title)+'</div>'+
      '<div class="sub-lesson">'+esc(st.full_name||'؟')+' — '+esc(st.school||'')+' · پایه '+({7:'هفتم',8:'هشتم',9:'نهم'}[st.grade]||'؟')+
      (ls.unit_title? ' · '+esc(ls.unit_title):'')+(asg.title? ' · تکلیف: '+esc(asg.title):'')+'</div></div>'+
      '<span class="pill pill-'+s.status+'">'+STATUS_LABEL_RV[s.status]+'</span></div>'+
      (s.description? '<div class="sub-desc">'+esc(s.description)+'</div>':'')+
      designReflectionHtmlRv(s.design_reflection)+
      ecoFriendlyHtmlRv(s.is_eco_friendly, s.eco_note)+
      fileLinkOrImgRv(s.file_url)+
      '<div class="rev-controls">'+
        '<select id="rvSt_'+s.id+'">'+Object.keys(STATUS_LABEL_RV).map(k=>'<option value="'+k+'" '+(k===s.status?'selected':'')+'>'+STATUS_LABEL_RV[k]+'</option>').join('')+'</select>'+
        '<input type="number" id="rvPts_'+s.id+'" placeholder="امتیاز" value="'+(s.points_awarded||0)+'">'+
        '<textarea id="rvNote_'+s.id+'" placeholder="یادداشت برای دانش‌آموز (اختیاری)">'+esc(s.teacher_note||'')+'</textarea>'+
        '<label class="chk-row"><input type="checkbox" id="rvPub_'+s.id+'" '+(s.is_public?'checked':'')+' style="width:auto"> نمایش در گالری عمومی</label>'+
        '<div class="save-row"><button class="btn btn-sage btn-sm btn-block" onclick="saveReviewRv(\''+s.id+'\')">💾 ذخیره بررسی</button></div>'+
      '</div></div>';
  }).join('');
}
async function saveReviewRv(id){
  const status = document.getElementById('rvSt_'+id).value;
  const points_awarded = parseInt(document.getElementById('rvPts_'+id).value)||0;
  const teacher_note = document.getElementById('rvNote_'+id).value.trim() || null;
  const is_public = document.getElementById('rvPub_'+id).checked;
  const { data:{session} } = await sb.auth.getSession();
  const { error } = await sb.from('submissions').update({
    status, points_awarded, teacher_note, is_public,
    reviewed_by: session?.user?.id || null, reviewed_at: new Date().toISOString()
  }).eq('id', id);
  if(error){ showToast('❌ خطا در ذخیره'); console.error(error); return; }
  showToast('✅ بررسی ذخیره شد');
  loadReview();
}
function emptyStateRv(ic,t,d){ return '<div class="empty-state"><div class="ic">'+ic+'</div><div>'+t+'</div><div style="font-size:12px">'+d+'</div></div>'; }
