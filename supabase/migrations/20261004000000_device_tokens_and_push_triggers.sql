-- نوتیفیکیشن push دانش‌آموز: جدول توکن دستگاه‌ها + RPC ثبت توکن + تریگر اطلاعیه/تکلیف جدید
-- (این مایگریشن روی دیتابیس production اعمال شده؛ secret تریگر به‌صورت خودکار ساخته و در جدول push_config نگه‌داری می‌شه.)

create extension if not exists pg_net;

create table if not exists public.device_tokens (
  token       text primary key,
  student_id  uuid not null references public.students(id) on delete cascade,
  platform    text not null default 'android',
  updated_at  timestamptz not null default now()
);
create index if not exists device_tokens_student_id_idx on public.device_tokens(student_id);
alter table public.device_tokens enable row level security;
revoke all on public.device_tokens from anon, authenticated;

create table if not exists public.push_config (
  key   text primary key,
  value text not null
);
alter table public.push_config enable row level security;
revoke all on public.push_config from anon, authenticated;
insert into public.push_config (key, value)
values ('webhook_secret', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (key) do nothing;

create or replace function public.register_device_token(
  p_student_id uuid, p_token text, p_platform text default 'android'
) returns void
language plpgsql security definer set search_path = public
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
        platform = excluded.platform,
        updated_at = now();
end;
$$;
grant execute on function public.register_device_token(uuid, text, text) to anon, authenticated;

create or replace function public.notify_push() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_secret text;
begin
  select value into v_secret from public.push_config where key = 'webhook_secret';
  perform net.http_post(
    url := 'https://nvdhxqmmfkalhzxcuewu.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
    body := jsonb_build_object('type', 'INSERT', 'table', TG_TABLE_NAME, 'record', to_jsonb(NEW)),
    timeout_milliseconds := 5000
  );
  return NEW;
exception when others then
  -- خطا در ارسال نوتیف هرگز نباید ثبت اطلاعیه/تکلیف رو خراب کنه
  return NEW;
end;
$$;
revoke all on function public.notify_push() from public, anon, authenticated;

drop trigger if exists push_on_announcement_insert on public.announcements;
create trigger push_on_announcement_insert
  after insert on public.announcements
  for each row execute function public.notify_push();

drop trigger if exists push_on_assignment_insert on public.assignments;
create trigger push_on_assignment_insert
  after insert on public.assignments
  for each row execute function public.notify_push();
