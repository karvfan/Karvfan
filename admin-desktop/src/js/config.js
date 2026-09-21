/**
 * config.js — اتصال به همان بک‌اند Supabase که وب‌اپ‌های دانش‌آموز/معلم استفاده می‌کنند.
 */
const SUPABASE_URL = 'https://nvdhxqmmfkalhzxcuewu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52ZGh4cW1tZmthbGh6eGN1ZXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NDE1MjcsImV4cCI6MjEwNTQxNzUyN30.gjeT9Fch8JIYJBXIyfDH1Fn6k5Sj_JXibV_MbtjMpko';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, storageKey: 'kf_admin_desktop_auth' }
});

const ROLE_LABELS = {
  school_admin: 'مدیر مدرسه',
  county_admin: 'ادمین شهرستان',
  province_admin: 'ادمین استان',
  super_admin: 'سوپرادمین',
  teacher: 'مربی'
};
