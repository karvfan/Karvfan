/**
 * state.js — وضعیت مشترک و متغیر برنامه (در حافظه‌ی مرورگر)
 * همه‌ی فایل‌های دیگر به این متغیرها دسترسی دارند چون هر اسکریپت اینجا
 * به‌صورت classic script (نه ES module) بارگذاری می‌شه و همه در یک scope سراسری‌اند.
 * باید بعد از config.js و قبل از بقیه بارگذاری بشه.
 * توجه: sb توسط config.js تعریف می‌شود؛ اینجا دوباره تعریف نمی‌کنیم
 * (تعریف دوباره‌ی let در دو <script> جدا باعث SyntaxError می‌شود).
 */

let student = null;      // {id, full_name, school, grade, points}
let lessons = [];        // کش درس‌های پایه‌ی دانش‌آموز فعلی یا همه (برای مربی)
let myActivations = new Set(); // شناسه‌ی پودمان‌های نیمه‌تجویزیِ فعال‌شده برای مدرسه‌ی معلم/مدیر جاری
let assignments = [];    // کش تکالیف هفتگی
let myQuizResults = {};  // lesson_id -> {score,total,points_awarded}
let uploadFileB64 = null, uploadFileExt = null;
let uploadAssignmentId = null;
let lmPdfB64 = null, lmImgB64 = null;
let teacherAllSubs = [];
let quizState = null;    // {lessonId, questions, idx, score, total}

/* ---------------------------------------------------------------- کمکی‌ها */
let myLikedIds = new Set();
let interestState = null;
let myStaff = null;
