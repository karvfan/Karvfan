/**
 * config.js — تنظیمات و داده‌های ثابت سامانه
 * شامل: اتصال Supabase، ثابت‌های مدرسه/پایه، برچسب‌ها، و محتوای بازی‌ها.
 * این فایل باید همیشه اولین اسکریپت بارگذاری‌شده باشد (بقیه‌ی فایل‌ها به این مقادیر نیاز دارند).
 *
 * ⚠️ SUPABASE_URL و SUPABASE_ANON_KEY را بعد از ساخت پروژه در Supabase
 * (از: Project Settings → API) با مقادیر واقعی جایگزین کنید.
 */
const SUPABASE_URL = 'https://oyjaxppsarypntotlzns.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95amF4cHBzYXJ5cG50b3Rsem5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNTk2OTUsImV4cCI6MjEwMTgzNTY5NX0.kkeJ637G8Eo2lrZol9FLoVG85GCgYU2fbm3CrLQy9ZY';

let sb;
const isConfigured = !SUPABASE_URL.includes('YOUR_') && !SUPABASE_ANON_KEY.includes('YOUR_');
if (isConfigured) {
  try {
    sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.error('Supabase client init failed:', e);
  }
}

const SCHOOLS = ['فرزانگان', '۱۳ آبان'];
const GRADES = [7, 8, 9];
const STATUS_LABEL = { pending: 'در انتظار بررسی', approved: 'تأیید شده', needs_fix: 'نیاز به اصلاح', rejected: 'رد شده' };

const GAME_LABELS = {
  invention_match: '🌿 بازی الهام از طبیعت',
  email_detective: '🕵️ بازی کارآگاه ایمیل',
  robot_algorithm: '🤖 بازی الگوریتم ربات'
};

/* بازی‌های عمومی هر پودمان (games_json) — ترتیب پیش‌فرض از ساده به سخت */
const GENERIC_GAME_TYPES = ['mcq','true_false','matching','memory','fill_blank','ordering'];
const GENERIC_GAME_META = {
  true_false: { icon:'✅', label:'درست یا غلط',         diff:1 },
  matching:   { icon:'🔗', label:'بازی جورچین',          diff:2 },
  memory:     { icon:'🃏', label:'بازی حافظه',           diff:3 },
  fill_blank: { icon:'✏️', label:'جای خالی',            diff:4 },
  ordering:   { icon:'🔢', label:'ترتیب درست',           diff:5 },
  mcq:        { icon:'🧠', label:'آزمون جمع‌بندی',       diff:6 },
  invention_match: { icon:'🌿', label:'الهام از طبیعت',  diff:0 },
  email_detective: { icon:'🕵️', label:'کارآگاه ایمیل',   diff:0 },
  robot_algorithm: { icon:'🤖', label:'الگوریتم ربات',   diff:0 }
};

/* ------------------------------------------------------------ بازی و آزمون درس */
const INVENTION_PAIRS = [
  {n:'🌿', nl:'خار گیاه توت‌فرنگی وحشی', i:'🧷', il:'چسب و صله (ولکرو)'},
  {n:'🦅', nl:'منقار مرغ ماهی‌خوار', i:'🚄', il:'بینی قطار سریع‌السیر'},
  {n:'🕸️', nl:'تار عنکبوت', i:'🌉', il:'پل معلق مقاوم'},
  {n:'🦇', nl:'سونار طبیعی خفاش', i:'📡', il:'رادار'},
  {n:'🐢', nl:'لاک سفت لاک‌پشت', i:'🪖', il:'کلاه ایمنی'}
];
const EMAIL_CASES = [
  {from:'مدیر مدرسه <admin@farzanegan-qorveh.ir>', subj:'برنامه امتحانات ترم', body:'سلام، جدول امتحانات پایان ترم پیوست شده است.', safe:true, reason:'آدرس فرستنده با دامنه‌ی رسمی مدرسه است و درخواست هیچ اطلاعات حساسی نداره.'},
  {from:'support@instaqram-verify.com', subj:'⚠️ حساب شما مسدود می‌شود!', body:'برای جلوگیری از مسدودشدن حساب، همین الان رمز عبورت رو اینجا وارد کن.', safe:false, reason:'آدرس فرستنده جعلیه (شبیه‌سازی شده) و می‌خواد رمزتو بگیره — این یعنی فیشینگ.'},
  {from:'عمو رضا <reza.family2010@gmail.com>', subj:'عکس‌های جشن تولد', body:'سلام عزیزم، عکسای جشن تولدت رو برات فرستادم، ببین چطورن!', safe:true, reason:'فرستنده آشناست و محتوا معمولیه، درخواست خاصی هم نداره.'},
  {from:'برنده‌ی بزرگ <prize@win-money-fast.net>', subj:'🎉 تبریک! برنده یک میلیون تومان شدی', body:'روی لینک زیر بزن و اطلاعات کارت بانکی‌تو وارد کن تا جایزه‌تو بگیری.', safe:false, reason:'وعده‌ی جایزه‌ی ناگهانی + درخواست اطلاعات بانکی، دقیقاً الگوی یک کلاهبرداریه.'},
  {from:'کتابخانه‌ی مدرسه <library@farzanegan-qorveh.ir>', subj:'یادآوری بازگرداندن کتاب', body:'کتابی که امانت گرفتی سررسیدش نزدیکه، لطفاً تا پایان هفته برگردون.', safe:true, reason:'یه یادآوری ساده و معمولیه از یه فرستنده‌ی شناخته‌شده.'},
  {from:'noreply@bank-security-alert.info', subj:'حساب بانکی شما در خطر است', body:'برای جلوگیری از هک‌شدن، فوراً رمز و شماره‌ی کارتت رو تأیید کن.', safe:false, reason:'بانک‌های واقعی هیچ‌وقت از طریق ایمیل رمز یا شماره‌ی کارت نمی‌خوان — این فیشینگه.'}
];
const ROBOT_LEVELS = [
  { start:{x:0,y:0}, goal:{x:3,y:0}, obstacles:[] },
  { start:{x:0,y:0}, goal:{x:3,y:2}, obstacles:[{x:1,y:0},{x:1,y:1}] },
  { start:{x:0,y:2}, goal:{x:4,y:0}, obstacles:[{x:2,y:2},{x:2,y:1},{x:3,y:0}] }
];
const ROBOT_GRID = 5;
const ROBOT_ARROWS = {up:'⬆️',down:'⬇️',left:'⬅️',right:'➡️'};
const CATEGORY_META = {
  'فناوری و نوآوری': {icon:'💻', color:'#356f8f', badge:'💻 نابغه‌ی فناوری'},
  'مهندسی و ساخت': {icon:'🔧', color:'#a8395a', badge:'🔧 مهندس کوچک'},
  'صنایع‌دستی و هنر': {icon:'🎨', color:'#d79a2c', badge:'🎨 هنرمند خلاق'},
  'کشاورزی و محیط‌زیست': {icon:'🌱', color:'#4f7f58', badge:'🌱 دست سبز'},
  'کسب‌وکار و مهارت‌های زندگی': {icon:'💼', color:'#ad3d33', badge:'💼 مدیر آینده'}
};
const BADGE_THRESHOLD = 25;
const INTEREST_QUESTIONS = [
  {q:'کدوم کار رو بیشتر دوست داری؟', a:{t:'ساخت یه ربات یا مدار ساده',c:'فناوری و نوآوری'}, b:{t:'کاشتن و مراقبت از یه گیاه',c:'کشاورزی و محیط‌زیست'}},
  {q:'وقت آزاد داری، چیکار می‌کنی؟', a:{t:'نقاشی یا درست‌کردن یه کاردستی',c:'صنایع‌دستی و هنر'}, b:{t:'برنامه‌نویسی یا بازی رایانه‌ای',c:'فناوری و نوآوری'}},
  {q:'کدوم پروژه برات جذاب‌تره؟', a:{t:'ساخت یه ماکت یا وسیله‌ی چوبی/فلزی',c:'مهندسی و ساخت'}, b:{t:'راه‌اندازی یه کسب‌وکار کوچیک',c:'کسب‌وکار و مهارت‌های زندگی'}},
  {q:'دوست داری بزرگ‌تر که شدی...', a:{t:'یه مهندس یا سازنده باشی',c:'مهندسی و ساخت'}, b:{t:'یه هنرمند یا طراح باشی',c:'صنایع‌دستی و هنر'}},
  {q:'کدوم رو ترجیح می‌دی؟', a:{t:'مراقبت از حیوانات یا گیاهان',c:'کشاورزی و محیط‌زیست'}, b:{t:'مدیریت یه گروه یا پروژه',c:'کسب‌وکار و مهارت‌های زندگی'}},
  {q:'کدوم بازی سامانه رو بیشتر دوست داشتی؟', a:{t:'بازی الگوریتم ربات',c:'فناوری و نوآوری'}, b:{t:'ساخت و طراحی دستی',c:'صنایع‌دستی و هنر'}},
  {q:'کدوم رو ترجیح می‌دی؟', a:{t:'تعمیرکردن یا سرهم‌کردن یه وسیله',c:'مهندسی و ساخت'}, b:{t:'حساب‌وکتاب و برنامه‌ریزی مالی',c:'کسب‌وکار و مهارت‌های زندگی'}},
  {q:'کدوم رو بیشتر دوست داری؟', a:{t:'پرورش گل و گیاه در خونه',c:'کشاورزی و محیط‌زیست'}, b:{t:'درست‌کردن یه اپ یا وب‌سایت ساده',c:'فناوری و نوآوری'}}
];
