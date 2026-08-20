/**
 * auth.js — ورود/ثبت‌نام دانش‌آموز
 */

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
function studentLogout(){ localStorage.removeItem('kf_student'); student=null; goTo('studentAuth'); }
