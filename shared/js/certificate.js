/**
 * certificate.js — تولید گواهی قابل‌چاپ برای دانش‌آموز (مشترک بین اپ دانش‌آموز و معلم)
 */
function openCertificate(data){
  // data: {full_name, school, grade, points, badges}
  const gradeFa = {7:'هفتم',8:'هشتم',9:'نهم'};
  const today = new Date().toLocaleDateString('fa-IR', { year:'numeric', month:'long', day:'numeric' });
  let el = document.getElementById('certificateOv');
  if(!el){
    el = document.createElement('div');
    el.id = 'certificateOv';
    document.body.appendChild(el);
  }
  el.innerHTML =
    '<div class="cert-actions no-print">'+
      '<button class="btn btn-thread btn-sm" onclick="window.print()">🖨️ چاپ گواهی</button>'+
      '<button class="btn btn-ghost btn-sm" onclick="document.getElementById(\'certificateOv\').classList.remove(\'open\')">✕ بستن</button>'+
    '</div>'+
    '<div class="cert-paper">'+
      '<img class="cert-logo" src="'+(location.pathname.includes('/student/')||location.pathname.includes('/teacher/')?'../shared/logo.svg':'shared/logo.svg')+'" alt="">'+
      '<div class="cert-eyebrow">سامانه‌ی آموزش و ارزیابی کار و فناوری</div>'+
      '<div class="cert-title">گواهی تقدیر</div>'+
      '<div class="cert-body">این گواهی به پاس تلاش و فعالیت مستمر</div>'+
      '<div class="cert-name">'+esc(data.full_name)+'</div>'+
      '<div class="cert-body">دانش‌آموز پایه‌ی '+(gradeFa[data.grade]||data.grade)+' — '+esc(data.school)+'</div>'+
      '<div class="cert-points">🏅 '+(data.points||0)+' امتیاز</div>'+
      '<div class="cert-date">'+today+'</div>'+
    '</div>';
  el.classList.add('open');
}
