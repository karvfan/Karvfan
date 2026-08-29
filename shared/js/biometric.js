/**
 * biometric.js — ورود سریع با اثر انگشت / Face ID (به‌عنوان «قفل دستگاه»، نه جایگزین سرور)
 *
 * روش کار: از WebAuthn (همون فناوری استاندارد مرورگرها برای اثر انگشت/Face ID) فقط برای
 * «تأیید هویت روی همین دستگاه» استفاده می‌کنیم. بعد از تأیید بیومتریک، اطلاعات ورودِ
 * ذخیره‌شده‌ی همین دستگاه (شماره+پین دانش‌آموز، یا ایمیل+رمز معلم/مدیر) بارگذاری و
 * فرم ورود عادی به‌صورت خودکار ارسال می‌شود — یعنی سمت سرور هیچ چیز تغییر نمی‌کند و
 * همون فرآیند ورود همیشگی (با همون بررسی‌های امنیتی) دوباره اجرا می‌شود.
 *
 * محدودیت مهم: این روش، اطلاعات ورود را با کلید مشتق از اثر انگشت رمزنگاری نمی‌کند
 * (چون این قابلیت — پسوند PRF در WebAuthn — هنوز همه‌جا پشتیبانی نمی‌شود)، بلکه فقط
 * دسترسی به آن‌ها را پشت تأیید بیومتریک دستگاه قفل می‌کند؛ دقیقاً شبیه به «ورود سریع»ی
 * که در خیلی از اپ‌های معروف هم استفاده می‌شود. روی هیچ دستگاهی، اطلاعات ورود جای دیگری
 * جز همون دستگاه ذخیره یا فرستاده نمی‌شود.
 */
(function(){
  function credKey(vault){ return 'kf_bio_cred_'+vault; }
  function secretKey(vault){ return 'kf_bio_secret_'+vault; }

  function b64ToBuf(b64){
    let s = b64.replace(/-/g,'+').replace(/_/g,'/');
    while(s.length % 4) s += '=';
    const bin = atob(s);
    const buf = new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) buf[i] = bin.charCodeAt(i);
    return buf;
  }
  function bufToB64(buf){
    let bin = '';
    new Uint8Array(buf).forEach(b=> bin += String.fromCharCode(b));
    return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }

  async function bioIsSupported(){
    try{
      if(!window.PublicKeyCredential || !navigator.credentials) return false;
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }catch(e){ return false; }
  }

  function bioHasSaved(vault){
    return !!(localStorage.getItem(credKey(vault)) && localStorage.getItem(secretKey(vault)));
  }

  // ثبت اثر انگشت/Face ID برای این دستگاه + ذخیره‌ی اطلاعات ورود (فقط همین دستگاه)
  async function bioRegister(vault, label, secretObj){
    const userId = crypto.getRandomValues(new Uint8Array(16));
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'کاروفناوری' },
        user: { id: userId, name: label, displayName: label },
        pubKeyCredParams: [{ type:'public-key', alg:-7 }, { type:'public-key', alg:-257 }],
        authenticatorSelection: { authenticatorAttachment:'platform', userVerification:'required' },
        timeout: 60000
      }
    });
    if(!cred) throw new Error('bio-register-failed');
    localStorage.setItem(credKey(vault), bufToB64(cred.rawId));
    localStorage.setItem(secretKey(vault), JSON.stringify(secretObj));
    return true;
  }

  // تأیید اثر انگشت/Face ID روی این دستگاه؛ در صورت موفقیت، اطلاعات ورود ذخیره‌شده را برمی‌گرداند
  async function bioVerifyAndLoad(vault){
    const credId = localStorage.getItem(credKey(vault));
    if(!credId) return null;
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ id: b64ToBuf(credId), type:'public-key' }],
        userVerification: 'required',
        timeout: 60000
      }
    });
    if(!assertion) return null;
    const raw = localStorage.getItem(secretKey(vault));
    return raw ? JSON.parse(raw) : null;
  }

  function bioForget(vault){
    localStorage.removeItem(credKey(vault));
    localStorage.removeItem(secretKey(vault));
  }

  // نمایش/مخفی‌کردن ردیف «ورود سریع با اثر انگشت» و چک‌باکس «به‌خاطر بسپار» روی صفحه‌ی ورود
  async function initBioLoginUI(vault, bioRowId, rememberRowId){
    const bioRow = document.getElementById(bioRowId);
    const rememberRow = document.getElementById(rememberRowId);
    if(bioHasSaved(vault)){
      if(bioRow) bioRow.classList.remove('hidden');
    } else if(await bioIsSupported()){
      if(rememberRow) rememberRow.classList.remove('hidden');
    }
  }

  window.bioIsSupported = bioIsSupported;
  window.bioHasSaved = bioHasSaved;
  window.bioRegister = bioRegister;
  window.bioVerifyAndLoad = bioVerifyAndLoad;
  window.bioForget = bioForget;
  window.initBioLoginUI = initBioLoginUI;
})();
