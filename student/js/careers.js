/**
 * careers.js — نمایش «چه شغلی می‌شه با این پودمان داشت؟»
 * اطلاعات از ستون careers_json هر پودمان خونده می‌شه: [{icon,name,requirements,workplace,description}]
 */
function openCareers(lessonId){
  const l = lessons.find(x=>x.id===lessonId); if(!l) return;
  let careers = [];
  try{ careers = l.careers_json ? (typeof l.careers_json==='string'? JSON.parse(l.careers_json) : l.careers_json) : []; }catch(e){ careers=[]; }
  if(!careers.length){ showToast('برای این پودمان هنوز شغلی معرفی نشده'); return; }
  openModal('careersModalOv');
  $('careersBody').innerHTML =
    '<div class="careers-head">این‌ها چند نمونه از شغل‌هایی هستن که با یادگیری «'+esc(l.unit_title)+'» بهشون نزدیک‌تر می‌شی 👇</div>'+
    '<div class="careers-list">'+
      careers.map(c=>
        '<div class="career-card">'+
          '<div class="career-icon">'+esc(c.icon||'💼')+'</div>'+
          '<div class="career-mid">'+
            '<div class="career-name">'+esc(c.name)+'</div>'+
            (c.workplace? '<div class="career-row"><span class="career-tag">📍 جایگاه</span>'+esc(c.workplace)+'</div>' : '')+
            (c.requirements? '<div class="career-row"><span class="career-tag">🎓 لازمه‌ها</span>'+esc(c.requirements)+'</div>' : '')+
            (c.description? '<div class="career-desc">'+esc(c.description)+'</div>' : '')+
          '</div>'+
        '</div>'
      ).join('')+
    '</div>'+
    '<div class="careers-foot">🎮 توی بازی‌های این پودمان هم یه بازی جورچین «شغل و محل کار» هست — امتحانش کن!</div>';
}
