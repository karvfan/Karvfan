/**
 * تست‌های واحد برای توابع خالص (بدون وابستگی به DOM/Supabase) در shared/js/utils.js
 * چون utils.js با فرض وجود document نوشته شده (classic script)، اینجا فقط
 * توابعی که به DOM وابسته نیستن رو با اجرای فایل در یک sandbox سبک تست می‌کنیم.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const utilsSrc = fs.readFileSync(path.join(__dirname, '..', 'shared', 'js', 'utils.js'), 'utf8');

// شبیه‌سازی حداقلی محیط مرورگر تا utils.js بدون خطا لود بشه
const sandbox = {
  document: { getElementById: () => null },
  window: {},
  console,
};
vm.createContext(sandbox);
vm.runInContext(utilsSrc, sandbox);

test('esc escapes HTML special characters', () => {
  assert.equal(sandbox.esc('<script>&"\''), '&lt;script&gt;&amp;&quot;&#39;');
});

test('esc handles null/undefined as empty string', () => {
  assert.equal(sandbox.esc(null), '');
  assert.equal(sandbox.esc(undefined), '');
});

test('maskName masks last name to initial', () => {
  assert.equal(sandbox.maskName('علی رضایی'), 'علی ر.');
});

test('maskName returns single-word names unchanged', () => {
  assert.equal(sandbox.maskName('علی'), 'علی');
});

test('sanitizeStudent strips sensitive fields', () => {
  const row = { id: 1, full_name: 'علی رضایی', pin: '1234', pin_hash: 'abc', points: 10 };
  const safe = sandbox.sanitizeStudent(row);
  assert.equal(safe.pin, undefined);
  assert.equal(safe.pin_hash, undefined);
  assert.equal(safe.id, 1);
  assert.equal(safe.points, 10);
});

test('sanitizeStudent passes through non-object values unchanged', () => {
  assert.equal(sandbox.sanitizeStudent(null), null);
  assert.equal(sandbox.sanitizeStudent(undefined), undefined);
});

test('toJalali returns a non-empty formatted string', () => {
  const result = sandbox.toJalali('2024-03-20');
  assert.match(result, /^\d{1,2} \S+ \d{2,4}$/);
});
