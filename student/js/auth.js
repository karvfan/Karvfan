/**
 * auth.js — ورود/ثبت‌نام دانش‌آموز
 */

function switchAuthTab(which){
  $('saTabLogin').classList.toggle('active', which==='login');
  $('saTabReg').classList.toggle('active', which==='register');
  $('saLoginForm').classList.toggle('hidden', which!=='login');
  $('saRegForm').classList.toggle('hidden', which!=='register');
  if(which==='register' && $('saProvince').options.length<=1) loadRegProvinces();
}
async function loadRegProvinces(){
  const { data } = await sb.from('provinces').select('*').order('name');
  $('saProvince').innerHTML = '<option value="">— انتخاب کنید —</option>' + (data||[]).map(p=>'<option value="'+p.id+'">'+p.name+'</option>').join('');
}
async function onRegProvinceChange(){
  const provinceId = $('saProvince').value;
  $('saSchool').innerHTML = '<option value="">— ابتدا شهرستان را انتخاب کنید —</option>';
  if(!provinceId){ $('saCounty').innerHTML = '<option value="">— ابتدا استان را انتخاب کنید —</option>'; return; }
  const { data } = await sb.from('counties').select('*').eq('province_id', provinceId).order('name');
  $('saCounty').innerHTML = '<option value="">— انتخاب کنید —</option>' + (data||[]).map(c=>'<option value="'+c.id+'">'+c.name+'</option>').join('');
}
async function onRegCountyChange(){
  const countyId = $('saCounty').value;
  if(!countyId){ $('saSchool').innerHTML = '<option value="">— ابتدا شهرستان را انتخاب کنید —</option>'; return; }
  const { data } = await sb.from('schools').select('*').eq('county_id', countyId).eq('status','approved').order('name');
  if(!data || !data.length){
    $('saSchool').innerHTML = '<option value="">— مدرسه‌ای تأییدشده در این شهرستان نیست —</option>';
    return;
  }
  $('saSchool').innerHTML = '<option value="">— انتخاب کنید —</option>' + data.map(s=>'<option value="'+esc(s.name)+'">'+esc(s.name)+'</option>').join('');
}
async function studentLogin(){
  const phone = $('saLoginPhone').value.trim();
  const pin = $('saLoginPin').value.trim();
  $('saLoginErr').textContent='';
  if(!/^0?9\d{9}$/.test(phone.replace(/\s/g,''))){ $('saLoginErr').textContent='شماره موبایل معتبر نیست'; return; }
  if(!/^\d{4}$/.test(pin)){ $('saLoginErr').textContent='پین باید ۴ رقم باشد'; return; }
  $('saLoginBtn').disabled=true; $('saLoginBtn').innerHTML='<span class="spinner"></span> در حال ورود...';
  try{
    const { data, error } = await sb.rpc('student_login', { p_phone: phone, p_pin: pin });
    if(error) throw error;
    if(!data || !data.length){
      $('saLoginErr').textContent = 'شماره یا پین اشتباه است — اگه حساب نداری از تب «ثبت‌نام» استفاده کن، اگه پینت یادت رفته از معلمت بخواه ریستش کنه';
      return;
    }
    if(data[0].locked_seconds){
      const mins = Math.ceil(data[0].locked_seconds/60);
      $('saLoginErr').textContent = 'به‌خاطر چندبار پین اشتباه، حساب موقتاً قفل شده — حدود '+mins+' دقیقه‌ی دیگه دوباره امتحان کن';
      return;
    }
    student = sanitizeStudent(data[0]);
    localStorage.setItem('kf_student', JSON.stringify(student));
    if($('saBioRememberChk') && $('saBioRememberChk').checked){
      try{ await bioRegister('student', student.full_name||phone, { phone, pin }); }
      catch(e){ console.error('بیومتریک ثبت نشد', e); }
    }
    await enterStudentApp();
  }catch(e){
    $('saLoginErr').textContent = 'خطا در ورود — دوباره تلاش کنید';
    console.error(e);
  }finally{
    $('saLoginBtn').disabled=false; $('saLoginBtn').textContent='ورود به سامانه';
  }
}
async function studentBioLogin(){
  try{
    const secret = await bioVerifyAndLoad('student');
    if(!secret){ return; }
    $('saLoginPhone').value = secret.phone;
    $('saLoginPin').value = secret.pin;
    await studentLogin();
  }catch(e){
    console.error(e);
    $('saLoginErr').textContent = 'تأیید اثر انگشت انجام نشد — با شماره و پین وارد شو';
  }
}
function studentBioForget(){
  bioForget('student');
  $('saBioRow').classList.add('hidden');
  $('saBioRemember').classList.remove('hidden');
}
async function studentRegister(){
  const full_name = $('saName').value.trim();
  const school = $('saSchool').value.trim();
  const grade = parseInt($('saGrade').value);
  const class_name = $('saClass').value.trim();
  const phone = $('saPhone').value.trim();
  const pin = $('saPin').value.trim();
  const pinConfirm = $('saPinConfirm').value.trim();
  $('saErr').textContent='';
  if(!full_name || full_name.length<3){ $('saErr').textContent='نام و نام خانوادگی رو کامل بنویسید'; return; }
  if(!school){ $('saErr').textContent='مدرسه رو انتخاب کنید'; return; }
  if(!/^0?9\d{9}$/.test(phone.replace(/\s/g,''))){ $('saErr').textContent='شماره موبایل معتبر نیست'; return; }
  if(!/^\d{4}$/.test(pin)){ $('saErr').textContent='پین باید ۴ رقم باشد'; return; }
  if(pin !== pinConfirm){ $('saErr').textContent='دو پین یکی نیستن'; return; }
  $('saBtn').disabled=true; $('saBtn').innerHTML='<span class="spinner"></span> در حال ثبت‌نام...';
  try{
    const { data, error } = await sb.rpc('student_login_or_register', { p_full_name: full_name, p_school: school, p_grade: grade, p_phone: phone, p_pin: pin, p_class_name: class_name||null });
    if(error) throw error;
    student = sanitizeStudent(data[0]);
    localStorage.setItem('kf_student', JSON.stringify(student));
    await enterStudentApp();
  }catch(e){
    $('saErr').textContent = 'خطا در ثبت‌نام — دوباره تلاش کنید';
    console.error(e);
  }finally{
    $('saBtn').disabled=false; $('saBtn').textContent='ساخت حساب و ورود';
  }
}
function studentLogout(){ localStorage.removeItem('kf_student'); student=null; goTo('studentAuth'); }
