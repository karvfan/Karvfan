/**
 * config.js — اتصال به همان بک‌اند Supabase که وب‌اپ‌های دانش‌آموز/معلم استفاده می‌کنند.
 */
const SUPABASE_URL = 'https://oyjaxppsarypntotlzns.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95amF4cHBzYXJ5cG50b3Rsem5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNTk2OTUsImV4cCI6MjEwMTgzNTY5NX0.kkeJ637G8Eo2lrZol9FLoVG85GCgYU2fbm3CrLQy9ZY';
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
