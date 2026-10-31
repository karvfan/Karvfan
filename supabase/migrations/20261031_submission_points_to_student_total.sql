-- امتیاز کارهای تأییدشده به مجموع امتیاز دانش‌آموز (students.points) اضافه می‌شود
-- (روی دیتابیس Karfan.prod اعمال شده — این فایل برای ثبت در ریپو است)
--
-- باگ: مربی/ادمین در بررسی کار فقط submissions.points_awarded را ذخیره می‌کرد و
-- students.points (که در نوار بالا، رتبه‌بندی، گواهی و آمار استفاده می‌شود) هیچ‌وقت زیاد نمی‌شد؛
-- فقط امتیاز بازی/آزمون (submit_quiz_result) به مجموع اضافه می‌شد.
--
-- رفع: تریگر روی submissions. فقط کارِ «approved» امتیاز می‌گیرد، و به‌جای جمع‌کردن کورکورانه،
-- اختلاف با آنچه قبلاً اعمال شده (points_credited) اعمال می‌شود؛ پس تغییر امتیاز، تغییر وضعیت
-- (مثلاً تأیید ← نیاز به اصلاح) و ذخیره‌ی دوباره، امتیاز را دوبار حساب نمی‌کنند.
-- کار گروهی: امتیاز کامل به همه‌ی اعضای گروه اضافه می‌شود.

alter table public.submissions add column if not exists points_credited integer not null default 0;

-- Backfill: کارهای تأییدشده‌ی قبلی
with c as (
  select student_id, sum(points_awarded)::int as pts
  from public.submissions
  where status = 'approved' and points_awarded > 0 and group_id is null and points_credited = 0
  group by student_id
)
update public.students st set points = st.points + c.pts from c where c.student_id = st.id;

update public.submissions set points_credited = points_awarded
where status = 'approved' and points_awarded > 0 and group_id is null and points_credited = 0;

create or replace function public.kf_sync_submission_points()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_new int;
  v_old int;
  v_delta int;
begin
  if tg_op = 'INSERT' then
    new.points_credited := 0;
    return new;
  end if;

  v_old := coalesce(old.points_credited, 0);
  v_new := case when new.status = 'approved' then greatest(coalesce(new.points_awarded, 0), 0) else 0 end;
  v_delta := v_new - v_old;
  new.points_credited := v_new;

  if v_delta <> 0 then
    if new.group_id is not null then
      update public.students set points = greatest(0, points + v_delta)
      where id in (select student_id from public.student_group_members where group_id = new.group_id);
    else
      update public.students set points = greatest(0, points + v_delta) where id = new.student_id;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.kf_sync_submission_points() from public, anon, authenticated;

drop trigger if exists kf_submissions_points_sync on public.submissions;
create trigger kf_submissions_points_sync
before insert or update of status, points_awarded, points_credited on public.submissions
for each row execute function public.kf_sync_submission_points();
