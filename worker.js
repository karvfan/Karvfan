// این Worker فایل‌های سایت رو عادی سرو می‌کنه، به‌علاوه چند مسیر ویژه:
//  - /download/<file>    دانلود نصب‌فایل‌ها از طریق خودِ دامنه‌ی karvfan.ir (نه مستقیم گیت‌هاب)
//  - /version/<name>.txt چک نسخه از طریق همین دامنه
//  - /api/survey/submit         ثبت پاسخ نظرسنجی (POST)
//  - /api/survey/admin/data     خواندن پاسخ‌های نظرسنجی برای پنل مدیریت (نیازمند x-admin-token)
// این کار باعث می‌شه اگه دسترسی مستقیم کاربر به github.com محدود باشه،
// چون درخواست از سمت سرور کلودفلر به گیت‌هاب می‌ره (نه از مرورگر/اپ کاربر)، آپدیت و دانلود بازم کار کنه.

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
  const body = await request.json();
  if (!body || !["student", "teacher"].includes(body.respondent_type)) return json({ error: "نوع پرسشنامه نامعتبر است." }, 400);
  if (!body.data || typeof body.data !== "object") return json({ error: "اطلاعات فرم ناقص است." }, 400);
  const payload = JSON.stringify(body.data);
  await env.SURVEY_DB.prepare("INSERT INTO responses (respondent_type, payload_json) VALUES (?, ?)").bind(body.respondent_type, payload).run();
  return json({ ok: true, message: "پاسخ شما با موفقیت ثبت شد." });
}

async function handleSurveyStats(request, env) {
  if (!adminOK(request, env)) return json({ error: "Unauthorized" }, 401);
  const rows = await env.SURVEY_DB.prepare("SELECT id, respondent_type, payload_json, created_at FROM responses ORDER BY id DESC").all();
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

    if (url.pathname === "/api/survey/submit") return handleSurveySubmit(request, env);
    if (url.pathname === "/api/survey/admin/data") return handleSurveyStats(request, env);

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
      if (!target) return new Response("Not found", { status: 404 });
      const upstream = await fetch(RELEASE_BASE + target, {
        cf: { cacheTtl: 60, cacheEverything: true },
      });
      if (!upstream.ok) return new Response("Upstream error", { status: 502 });
      return new Response(upstream.body, {
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
      });
    }

    return env.ASSETS.fetch(request);
  },
};
