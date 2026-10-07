/**
 * upload-media.js — آپلود «عکس، ویدیو یا فایل» برای کارهای دانش‌آموز
 *
 * این فایل بعد از student.js لود می‌شه و مسیر آپلود رو گسترش می‌ده:
 *  - عکس: همون مسیر قبلی (دوربین + واترمارک)
 *  - ویدیو: انتخاب از گالری یا ضبط با دوربین
 *  - فایل: PDF / Word / PowerPoint / Excel / متن / ZIP
 * ویدیو و فایل مستقیم (بدون base64) به Storage آپلود می‌شن تا حافظه‌ی گوشی پر نشه.
 */

const UPLOAD_MAX_MB = 50;
const VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v|3gp|mkv)$/i;
const DOC_EXTS = ['pdf','doc','docx','ppt','pptx','xls','xlsx','txt','zip'];
let mediaObjUrl = null;

function resetMediaPreview(){
  if(mediaObjUrl){ try{ URL.revokeObjectURL(mediaObjUrl); }catch(e){} mediaObjUrl = null; }
  const v = $('upVideoPreview');
  if(v){ try{ v.pause(); }catch(e){} v.removeAttribute('src'); v.style.display = 'none'; }
  if($('upVideo')) $('upVideo').value = '';
  if($('upAnyFile')) $('upAnyFile').value = '';
}

function pickMedia(kind){
  $('upErr').textContent = '';
  if(kind === 'video') $('upVideo').click();
  else if(kind === 'file') $('upAnyFile').click();
  else $('upFile').click();
}

function onMediaChosen(kind){
  const input = kind === 'video' ? $('upVideo') : $('upAnyFile');
  const f = input.files[0];
  if(!f) return;
  if(f.size > UPLOAD_MAX_MB * 1024 * 1024){
    showToast('حجم فایل بیشتر از ' + UPLOAD_MAX_MB + ' مگابایته');
    input.value = '';
    return;
  }
  const ext = extOf(f.name, '');
  const isVideo = (f.type || '').startsWith('video/') || VIDEO_EXT_RE.test(f.name || '');
  if(kind === 'video' && !isVideo){
    showToast('فقط ویدیو قابل قبوله');
    input.value = '';
    return;
  }
  if(kind === 'file' && !DOC_EXTS.includes(ext)){
    showToast('این نوع فایل پشتیبانی نمی‌شه (PDF، Word، PowerPoint، Excel، متن یا ZIP)');
    input.value = '';
    return;
  }

  resetMediaPreview();              // آبجکت‌URL قبلی و ورودی‌های دیگه رو پاک می‌کنه
  rawUploadB64 = null;              // عکس قبلی (اگه بود) کنار گذاشته می‌شه
  $('upFile').value = '';
  $('upPreview').style.display = 'none';

  mediaObjUrl = URL.createObjectURL(f);
  uploadFileB64 = mediaObjUrl;      // uploadToStorage با fetch() روی blob: URL هم کار می‌کنه
  uploadFileExt = ext || (isVideo ? 'mp4' : 'bin');

  if(isVideo){
    const v = $('upVideoPreview');
    v.src = mediaObjUrl;
    v.style.display = 'block';
  }
  const mb = (f.size / 1024 / 1024).toFixed(1);
  $('upDrop').textContent = (isVideo ? '✅ ویدیو انتخاب شد: ' : '✅ فایل انتخاب شد: ') + f.name + ' (' + mb + ' مگابایت)';
  $('upDrop').classList.add('has-file');
}

/* ---- گسترش توابع موجود در student.js ---- */

// انتخاب عکس: اگه قبلاً ویدیو/فایل انتخاب شده بود، پاک بشه
const _onUploadFileChangeOrig = onUploadFileChange;
onUploadFileChange = function(){
  const f = $('upFile').files[0];
  if(!f) return;
  resetMediaPreview();
  uploadFileB64 = null;
  return _onUploadFileChangeOrig();
};

// باز شدن مودال: وضعیت ویدیو/فایل ریست بشه
const _openUploadModalOrig = openUploadModal;
openUploadModal = function(lessonId, assignmentId){
  resetMediaPreview();
  _openUploadModalOrig(lessonId, assignmentId);
  $('upDrop').textContent = '📎 عکس، ویدیو یا فایل کارت رو انتخاب کن';
};

// پیام خطای درست وقتی هیچ چیزی انتخاب نشده
const _submitUploadOrig = submitUpload;
submitUpload = function(){
  if($('upTitle').value.trim() && !uploadFileB64){
    $('upErr').textContent = 'یک عکس، ویدیو یا فایل انتخاب کن';
    return;
  }
  return _submitUploadOrig();
};

// نمایش ویدیوی ثبت‌شده در «کارهای من» (به‌جای لینک ساده)
const _fileLinkOrImgOrig = fileLinkOrImg;
fileLinkOrImg = function(url){
  if(url && VIDEO_EXT_RE.test(String(url).split('?')[0])){
    return '<video class="sample-img" style="max-height:220px;width:100%" controls playsinline preload="metadata" src="' + esc(url) + '"></video>';
  }
  return _fileLinkOrImgOrig(url);
};
