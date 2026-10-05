// Edge Function: ارسال نوتیفیکیشن FCM به دانش‌آموزان وقتی اطلاعیه یا تکلیف جدید ثبت می‌شه.
// احراز هویت: هدر x-webhook-secret باید با مقدار جدول push_config (کلید webhook_secret) یکی باشه.
// Secret لازم: FCM_SERVICE_ACCOUNT_JSON (محتوای کامل فایل Service Account فایربیس)
// دیپلوی: verify_jwt خاموش (چون خود تابع هدر رو چک می‌کنه)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SERVICE_ACCOUNT = JSON.parse(Deno.env.get('FCM_SERVICE_ACCOUNT_JSON') ?? '{}');

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

async function getWebhookSecret(): Promise<string> {
  const { data } = await sb.from('push_config').select('value').eq('key', 'webhook_secret').maybeSingle();
  return data?.value ?? '';
}

function b64url(input: ArrayBuffer | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: SERVICE_ACCOUNT.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const unsigned = b64url(JSON.stringify(header)) + '.' + b64url(JSON.stringify(claim));
  const pem = String(SERVICE_ACCOUNT.private_key).replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const jwt = unsigned + '.' + b64url(sig);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const json = await res.json();
  if (!json.access_token) throw new Error('FCM auth failed: ' + JSON.stringify(json));
  return json.access_token;
}

async function sendOne(accessToken: string, token: string, title: string, body: string, tab: string) {
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${SERVICE_ACCOUNT.project_id}/messages:send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        data: { tab },
        android: { priority: 'HIGH', notification: { channel_id: 'karvfan-default' } },
      },
    }),
  });
  if (res.ok) return true;
  const err = await res.json().catch(() => ({}));
  const code = JSON.stringify(err);
  // توکن منقضی/نامعتبر → از جدول پاک می‌شه
  if (res.status === 404 || code.includes('UNREGISTERED')) {
    await sb.from('device_tokens').delete().eq('token', token);
  } else {
    console.error('FCM error', res.status, code);
  }
  return false;
}

Deno.serve(async (req) => {
  const expected = await getWebhookSecret();
  if (!expected || req.headers.get('x-webhook-secret') !== expected) {
    return new Response('unauthorized', { status: 401 });
  }
  const payload = await req.json().catch(() => null);
  if (!payload || payload.type !== 'INSERT' || !payload.record) {
    return new Response('ignored', { status: 200 });
  }
  const rec = payload.record;
  let title = '';
  let body = '';
  let tab = '';
  if (payload.table === 'announcements') {
    title = '📢 اطلاعیه‌ی جدید';
    body = rec.title || '';
    tab = 'announcements';
  } else if (payload.table === 'assignments') {
    if (rec.is_active === false) return new Response('inactive', { status: 200 });
    title = '📅 تکلیف جدید';
    body = rec.title || '';
    tab = 'assignments';
  } else {
    return new Response('ignored', { status: 200 });
  }

  // فقط دانش‌آموزان مدرسه/پایه‌ی هدف (اگه خالی باشه یعنی همه)
  let q = sb.from('device_tokens').select('token, students!inner(school, grade)');
  if (rec.school) q = q.eq('students.school', rec.school);
  if (rec.grade) q = q.eq('students.grade', rec.grade);
  const { data, error } = await q;
  if (error) {
    console.error('token query failed', error);
    return new Response('db error', { status: 500 });
  }
  const tokens = [...new Set((data ?? []).map((r: { token: string }) => r.token))];
  if (!tokens.length) return new Response('no devices', { status: 200 });

  const accessToken = await getAccessToken();
  let sent = 0;
  for (let i = 0; i < tokens.length; i += 50) {
    const results = await Promise.all(tokens.slice(i, i + 50).map((t) => sendOne(accessToken, t, title, body, tab)));
    sent += results.filter(Boolean).length;
  }
  return new Response(JSON.stringify({ sent, total: tokens.length }), { status: 200 });
});
