// این Worker فایل‌های سایت رو عادی سرو می‌کنه، به‌علاوه چند مسیر ویژه:
//  - /download/<file>    دانلود نصب‌فایل‌ها از طریق خودِ دامنه‌ی karvfan.ir (نه مستقیم گیت‌هاب)
//  - /version/<n>.txt چک نسخه از طریق همین دامنه
//  - /api/survey/submit         ثبت پاسخ نظرسنجی (POST)
//  - /api/survey/admin/data     خواندن پاسخ‌های نظرسنجی برای پنل مدیریت (نیازمند x-admin-token)
// این کار باعث می‌شه اگه دسترسی مستقیم کاربر به github.com محدود باشه،
// چون درخواست از سمت سرور کلودفلر به گیت‌هاب می‌ره (نه مرورگر/اپ کاربر)، آپدیت و دانلود بازم کار می‌کنه.

const RELEASE_BASE = "https://github.com/karvfan/Karvfan/releases/download/latest-builds/";

const DOWNLOADS = {
  "student.apk": "karvfan-student.apk",
  "teacher.apk": "karvfan-teacher.apk",
  "desktop.exe": "Setup.1.0.0.exe",
};

const VERSION_FILES = {
  "student": "student-version.txt",
  "teacher": "teacher-version.txt",
  "desktop": "desktop-version.txt",
};

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

function adminOK(request, env) {
  const token = request.headers.get("x-admin-token") || "";
  return !!env.SURVEY_ADMIN_TOKEN && token === env.SURVEY_ADMIN_TOKEN;
}

async function handleSurveySubmit(request, env) {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "قالب داده‌ی ارسالی نامعتبر است (JSON غیرمعتبر)." }, 400);
  }
  if (!body || !["student", "teacher"].includes(body.respondent_type)) return json({ error: "نوع پرسشنامه نامعتبر است." }, 400);
  if (!body.data || typeof body.data !== "object") return json({ error: "اطلاعات فرم ناقص است." }, 400);

  // اگه دیتابیس D1 به این Worker متصل نشده باشه (مثلاً هنوز deploy نشده یا binding درست تنظیم نشده)،
  // به‌جای کرش خام Worker (که سمت کاربر معمولاً به‌شکل «Failed to fetch» یا خطای مبهم دیده می‌شه)،
  // یه پیام JSON روشن برمی‌گردونیم که مشکل رو دقیق مشخص می‌کنه.
  if (!env.SURVEY_DB) {
    return json({ error: "پایگاه‌داده‌ی نظرسنجی (SURVEY_DB) به این Worker متصل نیست — نیاز به deploy یا تنظیم binding در Cloudflare دارد." }, 500);
  }

  const payload = JSON.stringify(body.data);
  try {
    await env.SURVEY_DB.prepare("INSERT INTO responses (respondent_type, payload_json) VALUES (?, ?)").bind(body.respondent_type, payload).run();
  } catch (e) {
    // معمولاً یعنی جدول responses هنوز روی D1 ساخته نشده یا اسکیمای دیتابیس ناقصه
    return json({ error: "خطا در ذخیره در پایگاه‌داده: " + (e && e.message ? e.message : String(e)) }, 500);
  }
  return json({ ok: true, message: "پاسخ شما با موفقیت ثبت شد." });
}

async function handleSurveyStats(request, env) {
  if (!adminOK(request, env)) return json({ error: "Unauthorized" }, 401);
  if (!env.SURVEY_DB) {
    return json({ error: "پایگاه‌داده‌ی نظرسنجی (SURVEY_DB) به این Worker متصل نیست — نیاز به deploy یا تنظیم binding در Cloudflare دارد." }, 500);
  }
  let rows;
  try {
    rows = await env.SURVEY_DB.prepare("SELECT id, respondent_type, payload_json, created_at FROM responses ORDER BY id DESC").all();
  } catch (e) {
    return json({ error: "خطا در خواندن از پایگاه‌داده: " + (e && e.message ? e.message : String(e)) }, 500);
  }
  const items = rows.results.map((r) => ({ ...r, data: JSON.parse(r.payload_json) }));
  const stats = {
    total: items.length,
    student: 0,
    teacher: 0,
    means: { student: Array(13).fill(0), teacher: Array(14).fill(0) },
    counts: { student: Array.from({ length: 13 }, () => Array(5).fill(0)), teacher: Array.from({ length: 14 }, () => Array(5).fill(0)) },
    n: { student: 0, teacher: 0 },
  };
  for (const r of items) {
    stats[r.respondent_type]++;
    const scores = Array.isArray(r.data.scores) ? r.data.scores : [];
    stats.n[r.respondent_type]++;
    scores.forEach((v, i) => {
      const x = Number(v);
      if (x >= 1 && x <= 5) {
        if (i < stats.counts[r.respondent_type].length) stats.counts[r.respondent_type][i][x - 1]++;
        stats.means[r.respondent_type][i] += x;
      }
    });
  }
  for (const type of ["student", "teacher"]) {
    stats.means[type] = stats.means[type].map((sum, i) => {
      const c = stats.counts[type][i].reduce((a, b) => a + b, 0);
      return c ? +(sum / c).toFixed(2) : null;
    });
  }
  return json({ stats, responses: items });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname === "/api/survey/submit") return await handleSurveySubmit(request, env);
      if (url.pathname === "/api/survey/admin/data") return await handleSurveyStats(request, env);
    } catch (e) {
      // محافظ نهایی: اگه هر خطای پیش‌بینی‌نشده‌ای توی مسیرهای بالا رخ بده، به‌جای کرش خام Worker
      // (که سمت کاربر به‌شکل خطای مبهم شبکه دیده می‌شه)، یه پاسخ JSON با جزئیات خطا برمی‌گردونیم.
      return json({ error: "خطای غیرمنتظره: " + (e && e.message ? e.message : String(e)) }, 500);
    }

    if (url.pathname.startsWith("/download/")) {
      const key = url.pathname.slice("/download/".length);
      const target = DOWNLOADS[key];
      if (!target) return new Response("Not found", { status: 404 });
      const upstream = await fetch(RELEASE_BASE + target, {
        cf: { cacheTtl: 300, cacheEverything: true },
      });
      if (!upstream.ok) return new Response("Upstream error", { status: 502 });
      const headers = new Headers(upstream.headers);
      headers.set("Content-Disposition", 'attachment; filename="' + target + '"');
      return new Response(upstream.body, { status: upstream.status, headers });
    }

    if (url.pathname.startsWith("/version/")) {
      const key = url.pathname.slice("/version/".length).replace(/\.txt$/, "");
      const target = VERSION_FILES[key];
      // اپ‌های اندروید (Capacitor) و دسکتاپ از origin متفاوتی (https://localhost یا file://) این مسیر رو fetch می‌کنن؛
      // بدون هدر CORS مرورگر جواب رو بلاک می‌کنه و چک آپدیت بی‌صدا شکست می‌خوره. شماره‌ی نسخه محرمانه نیست.
      const cors = { "access-control-allow-origin": "*" };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...cors, "access-control-allow-methods": "GET, OPTIONS", "access-control-max-age": "86400" } });
      if (!target) return new Response("Not found", { status: 404, headers: cors });
      const upstream = await fetch(RELEASE_BASE + target, {
        cf: { cacheTtl: 60, cacheEverything: true },
      });
      if (!upstream.ok) return new Response("Upstream error", { status: 502, headers: cors });
      return new Response(upstream.body, {
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", ...cors },
      });
    }

    return env.ASSETS.fetch(request);
  },
};
