-- نوتیفیکیشن push دانش‌آموز: جدول توکن دستگاه‌ها + RPC ثبت توکن + تریگر اطلاعیه/تکلیف جدید
-- ⚠️ قبل از اجرا: مقدار REPLACE_WITH_PUSH_WEBHOOK_SECRET رو با همون secret که برای
--    Edge Function (PUSH_WEBHOOK_SECRET) تنظیم می‌کنی عوض کن.
-- ⚠️ اگه schema به اسم supabase_functions وجود نداشت، اول از داشبورد Supabase
--    بخش Database → Webhooks رو فعال (Enable) کن.

create table if not exists public.device_tokens (
  token       text primary key,
  student_id  uuid not null references public.students(id) on delete cascade,
  platform    text not null default 'android',
  updated_at  timestamptz not null default now()
);
create index if not exists device_tokens_student_id_idx on public.device_tokens(student_id);

-- RLS روشن و بدون policy: توکن‌ها از بیرون قابل خوندن نیستن؛ فقط از طریق RPC پایین (نوشتن)
-- و service role داخل Edge Function (خوندن) در دسترسن.
alter table public.device_tokens enable row level security;

create or replace function public.register_device_token(
  p_student_id uuid,
  p_token text,
  p_platform text default 'android'
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_token is null or length(p_token) < 20 then
    raise exception 'invalid token';
  end if;
  if not exists (select 1 from public.students where id = p_student_id) then
    raise exception 'student not found';
  end if;
  insert into public.device_tokens (token, student_id, platform, updated_at)
  values (p_token, p_student_id, coalesce(p_platform, 'android'), now())
  on conflict (token) do update
    set student_id = excluded.student_id,
        platform   = excluded.platform,
        updated_at = now();
end;
$$;

grant execute on function public.register_device_token(uuid, text, text) to anon, authenticated;

-- تریگرها: با ثبت اطلاعیه یا تکلیف جدید، Edge Function «send-push» صدا زده می‌شه
create trigger push_on_announcement_insert
  after insert on public.announcements
  for each row execute function supabase_functions.http_request(
    'https://nvdhxqmmfkalhzxcuewu.supabase.co/functions/v1/send-push',
    'POST',
    '{"Content-Type":"application/json","x-webhook-secret":"REPLACE_WITH_PUSH_WEBHOOK_SECRET"}',
    '{}',
    '5000'
  );

create trigger push_on_assignment_insert
  after insert on public.assignments
  for each row execute function supabase_functions.http_request(
    'https://nvdhxqmmfkalhzxcuewu.supabase.co/functions/v1/send-push',
    'POST',
    '{"Content-Type":"application/json","x-webhook-secret":"REPLACE_WITH_PUSH_WEBHOOK_SECRET"}',
    '{}',
    '5000'
  );
