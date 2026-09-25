// این Worker فایل‌های سایت رو عادی سرو می‌کنه، به‌علاوه دو مسیر ویژه:
//  - /download/<file>    دانلود نصب‌فایل‌ها از طریق خودِ دامنه‌ی karvfan.ir (نه مستقیم گیت‌هاب)
//  - /version/<name>.txt چک نسخه از طریق همین دامنه
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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
