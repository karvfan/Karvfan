-- کار گروهی دانش‌آموزان (روی دیتابیس Karfan.prod اعمال شده — این فایل برای ثبت در ریپو است)
-- • گروه‌ها را فقط مربی/مدیر (در محدوده‌ی مدرسه‌ی خودش) می‌سازه
-- • فقط تکالیفی که assignments.is_group = true دارن کار گروهی می‌پذیرن
-- • کار گروهی یک ردیف در submissions است (با group_id)؛ مربی یک‌بار امتیاز می‌ده
--   و همه‌ی اعضا همون امتیاز کامل رو در «کارهای من» می‌بینن.

create table if not exists public.student_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  school text not null,
  grade integer not null check (grade in (7,8,9)),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.student_group_members (
  group_id uuid not null references public.student_groups(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, student_id)
);
create index if not exists student_group_members_student_idx on public.student_group_members(student_id);
create index if not exists student_groups_school_grade_idx on public.student_groups(school, grade);

-- دسترسی مستقیم کلاینت بسته است؛ فقط از RPCهای SECURITY DEFINER پایین
alter table public.student_groups enable row level security;
alter table public.student_group_members enable row level security;

alter table public.assignments add column if not exists is_group boolean not null default false;
alter table public.submissions add column if not exists group_id uuid references public.student_groups(id) on delete restrict;
create index if not exists submissions_group_idx on public.submissions(group_id) where group_id is not null;

-- ---------------------------------------------------------------- کمکی: آیا مربی به این مدرسه دسترسی داره؟
create or replace function public.kf_can_manage_school_name(p_school text)
returns boolean
language sql stable security definer
set search_path to 'public', 'pg_temp'
as $$
  select exists (select 1 from public.schools sc where sc.name = p_school and public.kf_in_scope(sc.id));
$$;
revoke all on function public.kf_can_manage_school_name(text) from public, anon;
grant execute on function public.kf_can_manage_school_name(text) to authenticated;

-- ---------------------------------------------------------------- مربی: لیست گروه‌ها
create or replace function public.teacher_list_groups(p_schools text[] default null)
returns table(id uuid, name text, school text, grade integer, created_at timestamptz, members jsonb)
language sql stable security definer
set search_path to 'public', 'pg_temp'
as $$
  select g.id, g.name, g.school, g.grade, g.created_at,
    coalesce((
      select jsonb_agg(jsonb_build_object('id', st.id, 'full_name', st.full_name, 'class_name', st.class_name) order by st.full_name)
      from public.student_group_members m join public.students st on st.id = m.student_id
      where m.group_id = g.id
    ), '[]'::jsonb)
  from public.student_groups g
  where public.kf_can_manage_school_name(g.school)
    and (p_schools is null or g.school = any(p_schools))
  order by g.school, g.grade, g.name;
$$;
revoke all on function public.teacher_list_groups(text[]) from public, anon;
grant execute on function public.teacher_list_groups(text[]) to authenticated;

-- ---------------------------------------------------------------- مربی: ساخت/ویرایش گروه
create or replace function public.teacher_save_group(p_group_id uuid, p_name text, p_school text, p_grade integer, p_member_ids uuid[])
returns uuid
language plpgsql security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_ids uuid[];
  v_n int;
  v_valid int;
  v_id uuid;
  g public.student_groups%rowtype;
begin
  if not public.kf_can_manage_school_name(p_school) then raise exception 'به این مدرسه دسترسی ندارید'; end if;
  if v_name = '' then raise exception 'نام گروه را بنویسید'; end if;
  if char_length(v_name) > 80 then raise exception 'نام گروه خیلی طولانی است'; end if;
  if p_grade is null or p_grade not in (7,8,9) then raise exception 'پایه نامعتبر است'; end if;

  v_ids := array(select distinct x from unnest(coalesce(p_member_ids, '{}'::uuid[])) x);
  v_n := coalesce(array_length(v_ids, 1), 0);
  if v_n < 2 or v_n > 6 then raise exception 'هر گروه باید بین ۲ تا ۶ عضو داشته باشد'; end if;

  select count(*) into v_valid from public.students where id = any(v_ids) and school = p_school and grade = p_grade;
  if v_valid <> v_n then raise exception 'همه‌ی اعضا باید دانش‌آموز همین مدرسه و همین پایه باشند'; end if;

  if exists (
    select 1 from public.student_groups
    where school = p_school and grade = p_grade and lower(btrim(name)) = lower(v_name)
      and (p_group_id is null or id <> p_group_id)
  ) then raise exception 'گروهی با این نام در این پایه وجود دارد'; end if;

  if p_group_id is null then
    insert into public.student_groups(name, school, grade, created_by)
      values (v_name, p_school, p_grade, auth.uid())
      returning id into v_id;
  else
    select * into g from public.student_groups where id = p_group_id;
    if not found then raise exception 'گروه پیدا نشد'; end if;
    if not public.kf_can_manage_school_name(g.school) then raise exception 'به این گروه دسترسی ندارید'; end if;
    if (g.school <> p_school or g.grade <> p_grade)
       and exists (select 1 from public.submissions where group_id = p_group_id) then
      raise exception 'مدرسه یا پایه‌ی گروهی که کار ثبت کرده قابل تغییر نیست';
    end if;
    update public.student_groups set name = v_name, school = p_school, grade = p_grade where id = p_group_id;
    delete from public.student_group_members where group_id = p_group_id;
    v_id := p_group_id;
  end if;

  insert into public.student_group_members(group_id, student_id)
    select v_id, x from unnest(v_ids) x;
  return v_id;
end;
$$;
revoke all on function public.teacher_save_group(uuid, text, text, integer, uuid[]) from public, anon;
grant execute on function public.teacher_save_group(uuid, text, text, integer, uuid[]) to authenticated;

-- ---------------------------------------------------------------- مربی: حذف گروه (فقط اگه کاری ثبت نکرده)
create or replace function public.teacher_delete_group(p_group_id uuid)
returns void
language plpgsql security definer
set search_path to 'public', 'pg_temp'
as $$
declare v_school text;
begin
  select school into v_school from public.student_groups where id = p_group_id;
  if not found then raise exception 'گروه پیدا نشد'; end if;
  if not public.kf_can_manage_school_name(v_school) then raise exception 'به این گروه دسترسی ندارید'; end if;
  if exists (select 1 from public.submissions where group_id = p_group_id) then
    raise exception 'این گروه کار ثبت‌شده دارد و قابل حذف نیست';
  end if;
  delete from public.student_groups where id = p_group_id;
end;
$$;
revoke all on function public.teacher_delete_group(uuid) from public, anon;
grant execute on function public.teacher_delete_group(uuid) to authenticated;

-- ---------------------------------------------------------------- دانش‌آموز: گروه‌های من
create or replace function public.get_my_groups(p_student_id uuid)
returns table(id uuid, name text, school text, grade integer, members jsonb)
language sql stable security definer
set search_path to 'public', 'pg_temp'
as $$
  select g.id, g.name, g.school, g.grade,
    coalesce((
      select jsonb_agg(jsonb_build_object('id', st.id, 'full_name', st.full_name) order by st.full_name)
      from public.student_group_members m2 join public.students st on st.id = m2.student_id
      where m2.group_id = g.id
    ), '[]'::jsonb)
  from public.student_groups g
  join public.student_group_members m on m.group_id = g.id
  where m.student_id = p_student_id
  order by g.name;
$$;
grant execute on function public.get_my_groups(uuid) to anon, authenticated;

-- ---------------------------------------------------------------- دانش‌آموز: ثبت کار گروهی
create or replace function public.student_submit_group_work(
  p_student_id uuid, p_group_id uuid, p_assignment_id uuid, p_title text, p_description text,
  p_file_url text, p_design_reflection jsonb, p_is_eco_friendly boolean, p_eco_note text)
returns uuid
language plpgsql security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  a public.assignments%rowtype;
  g public.student_groups%rowtype;
  v_id uuid;
  v_eco boolean := coalesce(p_is_eco_friendly, false);
begin
  if not exists (select 1 from public.students where id = p_student_id) then raise exception 'دانش‌آموز پیدا نشد'; end if;
  if not exists (select 1 from public.student_group_members where group_id = p_group_id and student_id = p_student_id) then
    raise exception 'تو عضو این گروه نیستی';
  end if;
  select * into g from public.student_groups where id = p_group_id;
  select * into a from public.assignments where id = p_assignment_id;
  if not found or not a.is_active then raise exception 'تکلیف پیدا نشد یا فعال نیست'; end if;
  if not a.is_group then raise exception 'این تکلیف گروهی نیست'; end if;
  if (a.grade is not null and a.grade <> g.grade) or (a.school is not null and a.school <> g.school) then
    raise exception 'این گروه برای این تکلیف مجاز نیست';
  end if;
  if exists (select 1 from public.submissions where group_id = p_group_id and assignment_id = p_assignment_id) then
    raise exception 'برای این تکلیف قبلاً کار گروه ثبت شده — از «کارهای من» ویرایشش کن';
  end if;
  if btrim(coalesce(p_title, '')) = '' then raise exception 'عنوان کار را بنویسید'; end if;

  insert into public.submissions(student_id, group_id, assignment_id, title, description, file_url,
                                 design_reflection, is_eco_friendly, eco_note, status)
  values (p_student_id, p_group_id, p_assignment_id, btrim(p_title),
          nullif(btrim(coalesce(p_description, '')), ''), p_file_url,
          p_design_reflection, v_eco,
          case when v_eco then nullif(btrim(coalesce(p_eco_note, '')), '') else null end,
          'pending')
  returning id into v_id;
  return v_id;
end;
$$;
grant execute on function public.student_submit_group_work(uuid, uuid, uuid, text, text, text, jsonb, boolean, text) to anon, authenticated;

-- ---------------------------------------------------------------- «کارهای من»: کارهای گروه هم دیده بشه
drop function if exists public.get_my_submissions(uuid);
create function public.get_my_submissions(p_student_id uuid)
returns table(id uuid, kind text, title text, context_title text, status text, description text,
              design_reflection jsonb, is_eco_friendly boolean, eco_note text, file_url text,
              teacher_note text, points_awarded integer, mood integer, created_at timestamptz,
              student_id uuid, assignment_id uuid, group_id uuid, group_name text, submitter_name text)
language sql security definer
set search_path to 'public', 'pg_temp'
as $$
  select s.id,
    case when s.assignment_id is not null then 'homework' else 'lesson' end,
    s.title,
    coalesce(a.title, l.unit_title),
    s.status, s.description, s.design_reflection, s.is_eco_friendly, s.eco_note, s.file_url, s.teacher_note,
    s.points_awarded, s.mood, s.created_at,
    s.student_id, s.assignment_id, s.group_id, g.name, sb.full_name
  from submissions s
  left join assignments a on a.id = s.assignment_id
  left join lessons l on l.id = s.lesson_id
  left join student_groups g on g.id = s.group_id
  left join students sb on sb.id = s.student_id
  where s.student_id = p_student_id
     or (s.group_id is not null and exists (
           select 1 from student_group_members m where m.group_id = s.group_id and m.student_id = p_student_id))
  order by s.created_at desc;
$$;
grant execute on function public.get_my_submissions(uuid) to anon, authenticated;

-- ویرایش کار گروه: هر عضو (حذف: فقط ثبت‌کننده، مثل قبل)
create or replace function public.student_update_submission(
  p_submission_id uuid, p_student_id uuid, p_title text, p_description text,
  p_design_reflection jsonb, p_is_eco_friendly boolean, p_eco_note text)
returns void
language plpgsql security definer
set search_path to 'public', 'pg_temp'
as $$
declare v_status text;
begin
  select s.status into v_status from submissions s
   where s.id = p_submission_id
     and (s.student_id = p_student_id
          or (s.group_id is not null and exists (
                select 1 from student_group_members m where m.group_id = s.group_id and m.student_id = p_student_id)));
  if not found then raise exception 'این کار پیدا نشد'; end if;
  if v_status = 'approved' then raise exception 'کار تأییدشده قابل ویرایش نیست'; end if;
  if coalesce(trim(p_title), '') = '' then raise exception 'عنوان کار را بنویسید'; end if;

  update submissions set
    title = trim(p_title),
    description = nullif(trim(coalesce(p_description, '')), ''),
    design_reflection = coalesce(p_design_reflection, design_reflection),
    is_eco_friendly = coalesce(p_is_eco_friendly, false),
    eco_note = case when coalesce(p_is_eco_friendly, false) then nullif(trim(coalesce(p_eco_note, '')), '') else null end,
    status = 'pending'
  where id = p_submission_id;
end;
$$;

-- نتیجه‌ی بررسی کار گروه برای همه‌ی اعضا (نشان و تأیید دیده‌شدن)
create or replace function public.count_unseen_reviews(p_student_id uuid)
returns integer
language sql security definer
set search_path to 'public', 'pg_temp'
as $$
  select count(*)::int from submissions s
  where s.seen_by_student = false and s.status <> 'pending'
    and (s.student_id = p_student_id
         or (s.group_id is not null and exists (
               select 1 from student_group_members m where m.group_id = s.group_id and m.student_id = p_student_id)));
$$;

create or replace function public.mark_submissions_seen(p_student_id uuid)
returns void
language sql security definer
set search_path to 'public', 'pg_temp'
as $$
  update submissions s set seen_by_student = true
  where s.seen_by_student = false
    and (s.student_id = p_student_id
         or (s.group_id is not null and exists (
               select 1 from student_group_members m where m.group_id = s.group_id and m.student_id = p_student_id)));
$$;
