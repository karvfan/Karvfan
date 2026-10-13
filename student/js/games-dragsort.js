/**
 * games-dragsort.js — بازی «دسته‌بندی با کشیدن» (type: drag_sort)
 *
 * هر بار یک کارت نشون داده می‌شه؛ دانش‌آموز اون رو می‌کشه داخل دسته‌ی درست
 * (یا فقط دسته رو لمس می‌کنه). جواب غلط = کارت تکون می‌خوره و برمی‌گرده؛
 * جواب درست = کارت داخل دسته می‌شینه. امتیاز = تعداد کارت‌هایی که از بار اول درست بودن.
 *
 * نصب: فقط همین فایل باید بعد از games.js در student/index.html لود بشه:
 *     <script src="js/games-dragsort.js"></script>
 * خودش را در launchGame (games.js) و GENERIC_GAME_META ثبت می‌کند؛ پس games.js و config.js
 * دست نمی‌خورن. (اگه خواستی تمیزتر باشه، می‌تونی داخل launchGame همین خط را اضافه کنی و
 * بلوک «ثبت خودکار» پایین فایل را حذف کنی:
 *     if(g.type==='drag_sort') return startDragSortGame(l, g);  )
 *
 * داده‌ی بازی داخل games_json همون درس (فرم ویرایش درس در پنل مربی) قرار می‌گیره؛
 * شکلش:  { key, type:'drag_sort', title, points, data:{ prompt, categories:[{id,label,icon,color}], items:[{text,icon,cat,explain}] } }
 *
 * به متغیرها/توابع عمومی games.js وابسته‌ست: $, esc, shuffleArr, quizState,
 * finishGame, backToPicker, showToast, lessons, buildGameList.
 */
(function(){
  'use strict';

  const DEFAULT_COLOR = '#356f8f';
  const CSS = `
.ds-root{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.ds-prompt{margin-top:10px}
.ds-stage{display:flex;justify-content:center;padding:14px 4px 22px;min-height:84px}
.ds-card{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;max-width:340px;min-height:64px;box-sizing:border-box;
  padding:14px 16px;border-radius:16px;background:#fff;border:2px solid var(--line,#cfc6b2);color:inherit;
  font-size:17px;font-weight:700;line-height:1.6;text-align:center;cursor:grab;touch-action:none;
  box-shadow:0 2px 6px rgba(0,0,0,.08);animation:ds-in .22s ease-out}
.ds-stage.ds-deep1 .ds-card{box-shadow:0 6px 0 -1px #fff,0 6px 0 0 #d8d0bd,0 2px 6px rgba(0,0,0,.08)}
.ds-stage.ds-deep2 .ds-card{box-shadow:0 6px 0 -1px #fff,0 6px 0 0 #d8d0bd,0 12px 0 -1px #fff,0 12px 0 0 #e6dfce,0 2px 6px rgba(0,0,0,.08)}
.ds-card:focus-visible,.ds-bucket:focus-visible{outline:3px solid #356f8f;outline-offset:2px}
.ds-cic{font-size:26px;line-height:1}
.ds-card.ds-dragging{opacity:.3}
.ds-card.ds-bad{animation:ds-shake .4s}
.ds-ghost{position:fixed;z-index:99999;pointer-events:none;margin:0;opacity:.96;transform:scale(1.05) rotate(-2deg);
  box-shadow:0 12px 26px rgba(0,0,0,.25)!important;animation:none!important;cursor:grabbing}
.ds-hint{text-align:center;font-size:12.5px;opacity:.7;margin:0 0 10px}
.ds-buckets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.ds-bucket:last-child:nth-child(odd){grid-column:1/-1}
.ds-bucket{box-sizing:border-box;min-height:104px;padding:8px 8px 10px;border-radius:14px;cursor:pointer;
  border:2px dashed var(--ds-e,#356f8f88);background:var(--ds-t,#356f8f14);transition:transform .12s,background .12s,border-color .12s}
.ds-bucket.ds-over{border-style:solid;border-color:var(--ds-c,#356f8f);transform:scale(1.025);background:var(--ds-e,#356f8f33)}
.ds-bucket.ds-flash{border-style:solid;border-color:var(--brick,#ad3d33);background:var(--brick-bg,#f8e4e1)}
.ds-bhead{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;line-height:1.5;color:var(--ds-c,#356f8f)}
.ds-bic{font-size:20px;line-height:1}
.ds-bcount{margin-inline-start:auto;min-width:20px;padding:0 6px;border-radius:10px;background:var(--ds-c,#356f8f);color:#fff;font-size:11.5px;text-align:center}
.ds-bitems{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
.ds-placed{display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border-radius:9px;background:#fff;
  border:1.5px solid var(--ds-c,#356f8f);font-size:12px;line-height:1.5;animation:ds-snap .3s ease-out}
.ds-fb{min-height:24px;margin-top:12px;text-align:center;font-size:13.5px;line-height:1.6}
.ds-fb.ok{color:var(--sage,#4f7f58)}
.ds-fb.bad{color:var(--brick,#ad3d33)}
@keyframes ds-in{from{opacity:0;transform:translateY(-12px) scale(.96)}to{opacity:1;transform:none}}
@keyframes ds-snap{0%{transform:scale(1.35)}60%{transform:scale(.92)}100%{transform:scale(1)}}
@keyframes ds-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-9px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(3px)}}
@media (prefers-reduced-motion:reduce){.ds-card,.ds-placed,.ds-card.ds-bad{animation:none}.ds-bucket{transition:none}.ds-bucket.ds-over{transform:none}}
`;

  let drag = null;       // وضعیت کشیدنِ در جریان
  let lastDragEnd = 0;   // برای نادیده‌گرفتن کلیکِ بعد از رها کردن

  function injectCss(){
    if(document.getElementById('dsStyle')) return;
    const s = document.createElement('style');
    s.id = 'dsStyle'; s.textContent = CSS;
    document.head.appendChild(s);
  }
  function hexOk(c){ return typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c); }
  function say(text, kind){
    const el = document.getElementById('dsFb'); if(!el) return;
    el.textContent = text; el.className = 'ds-fb' + (kind ? ' '+kind : '');
  }
  const bucketEl = id => [...document.querySelectorAll('#dsRoot .ds-bucket')].find(b => b.dataset.cat === String(id));

  /* ------------------------------------------------------------ شروع */
  window.startDragSortGame = function(l, g){
    injectCss();
    document.querySelectorAll('.ds-ghost').forEach(n => n.remove());
    drag = null;
    const d = (g && g.data) || {};
    const cats = (d.categories || []).filter(c => c && c.id != null && c.label).slice(0, 4)
      .map(c => ({ id:String(c.id), label:String(c.label), icon:c.icon||'📦', color:hexOk(c.color)?c.color:DEFAULT_COLOR }));
    const ids = new Set(cats.map(c => c.id));
    const items = (d.items || []).filter(it => it && it.text && ids.has(String(it.cat)))
      .map(it => ({ text:String(it.text), icon:it.icon||'', cat:String(it.cat), explain:it.explain||'' }));
    if(cats.length < 2 || items.length < 2){ showToast('اطلاعات این بازی کامل نیست'); backToPicker(); return; }
    quizState = {
      type:'drag_sort', lessonId:l.id, gameKey:g.key, gameTitle:g.title, points:g.points,
      cats, items, order: shuffleArr(items.map((_, i) => i)), pos:0,
      counts:{}, curMissed:false, score:0, mistakes:0, total:items.length, locked:false,
      prompt: d.prompt || ''
    };
    render();
  };

  function render(){
    const st = quizState;
    $('quizBody').innerHTML =
      '<div class="ds-root" id="dsRoot">'+
        '<div class="quiz-progress"><div class="quiz-progress-bar" id="dsBar" style="width:0%"></div></div>'+
        '<div class="quiz-qcount" id="dsCount"></div>'+
        (st.prompt ? '<div class="quiz-question ds-prompt">'+esc(st.prompt)+'</div>' : '')+
        '<div class="ds-stage" id="dsStage"></div>'+
        '<div class="ds-hint">کارت رو بکش داخل دسته‌ی درست — یا فقط دسته رو لمس کن</div>'+
        '<div class="ds-buckets" id="dsBuckets">'+
          st.cats.map(c =>
            '<div class="ds-bucket" role="button" tabindex="0" data-cat="'+esc(c.id)+'" aria-label="'+esc(c.label)+'" '+
              'style="--ds-c:'+c.color+';--ds-t:'+c.color+'14;--ds-e:'+c.color+'55">'+
              '<div class="ds-bhead"><span class="ds-bic">'+esc(c.icon)+'</span><span>'+esc(c.label)+'</span><span class="ds-bcount" data-count="'+esc(c.id)+'">0</span></div>'+
              '<div class="ds-bitems"></div>'+
            '</div>').join('')+
        '</div>'+
        '<div class="ds-fb" id="dsFb" role="status" aria-live="polite"></div>'+
      '</div>';
    const root = $('dsRoot');
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onCancel);
    root.addEventListener('contextmenu', e => e.preventDefault());
    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKey);
    showCard(); meter();
  }

  function showCard(){
    const st = quizState, stage = $('dsStage');
    if(st.pos >= st.order.length){ stage.innerHTML = ''; return; }
    const i = st.order[st.pos], it = st.items[i], left = st.order.length - st.pos;
    stage.className = 'ds-stage' + (left > 2 ? ' ds-deep2' : left > 1 ? ' ds-deep1' : '');
    stage.innerHTML = '<div class="ds-card" id="dsCard" role="img" aria-label="'+esc(it.text)+'" data-i="'+i+'">'+
      (it.icon ? '<span class="ds-cic">'+esc(it.icon)+'</span>' : '')+'<span>'+esc(it.text)+'</span></div>';
    st.curMissed = false;
  }
  function meter(){
    const st = quizState;
    $('dsBar').style.width = Math.round(st.pos / st.total * 100) + '%';
    $('dsCount').textContent = '🧺 ' + st.pos + ' از ' + st.total + ' کارت جا گرفت · اشتباه: ' + st.mistakes;
  }

  /* ------------------------------------------------------------ قرار دادن کارت */
  function placeCurrent(catId){
    const st = quizState;
    if(!st || st.type !== 'drag_sort' || st.locked || st.pos >= st.order.length) return;
    const it = st.items[st.order[st.pos]], bucket = bucketEl(catId), card = $('dsCard');
    if(!bucket || !card) return;
    if(it.cat === String(catId)){
      if(!st.curMissed) st.score++;
      const chip = document.createElement('span');
      chip.className = 'ds-placed'; chip.style.setProperty('--ds-c', bucket.style.getPropertyValue('--ds-c'));
      chip.textContent = (it.icon ? it.icon + ' ' : '') + it.text;
      bucket.querySelector('.ds-bitems').appendChild(chip);
      st.counts[catId] = (st.counts[catId] || 0) + 1;
      bucket.querySelector('[data-count]').textContent = st.counts[catId];
      st.pos++;
      say(it.explain ? '✅ ' + it.explain : '✅ درسته!', 'ok');
      meter();
      if(st.pos >= st.order.length){
        st.locked = true; $('dsStage').innerHTML = '';
        setTimeout(() => finishGame(Object.assign({}, st, { score:st.score, total:st.total })), 800);
      } else { showCard(); }
    } else {
      st.curMissed = true; st.mistakes++;
      card.classList.remove('ds-bad'); void card.offsetWidth; card.classList.add('ds-bad');
      bucket.classList.add('ds-flash'); setTimeout(() => bucket.classList.remove('ds-flash'), 450);
      say('❌ «' + it.text + '» اینجا جا نمی‌گیره — یه دسته‌ی دیگه رو امتحان کن.', 'bad');
      meter();
    }
  }

  /* ------------------------------------------------------------ کشیدن و رها کردن (Pointer Events) */
  function onDown(e){
    const st = quizState;
    if(!st || st.type !== 'drag_sort' || st.locked) return;
    const card = e.target.closest && e.target.closest('#dsCard'); if(!card) return;
    if(e.pointerType === 'mouse' && e.button !== 0) return;
    const r = card.getBoundingClientRect();
    drag = { card, id:e.pointerId, sx:e.clientX, sy:e.clientY, dx:e.clientX - r.left, dy:e.clientY - r.top, w:r.width, ghost:null };
    try{ card.setPointerCapture(e.pointerId); }catch(_){}
  }
  function onMove(e){
    if(!drag || e.pointerId !== drag.id) return;
    if(!drag.ghost){
      if(Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 8) return;
      const g = drag.card.cloneNode(true);
      const gw = Math.min(drag.w, 230);               // کارتِ در حال کشیدن کوچیک‌تر باشه تا دسته‌ها پنهان نشن
      drag.dx = drag.dx * gw / drag.w; drag.dy = Math.min(drag.dy, 30);
      g.removeAttribute('id'); g.classList.add('ds-ghost'); g.style.width = gw + 'px'; g.style.minHeight = '0';
      document.body.appendChild(g);
      drag.ghost = g; drag.card.classList.add('ds-dragging');
    }
    drag.ghost.style.left = (e.clientX - drag.dx) + 'px';
    drag.ghost.style.top  = (e.clientY - drag.dy) + 'px';
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const b = el && el.closest && el.closest('.ds-bucket');
    document.querySelectorAll('.ds-bucket.ds-over').forEach(x => { if(x !== b) x.classList.remove('ds-over'); });
    if(b) b.classList.add('ds-over');
  }
  function endDrag(){
    document.querySelectorAll('.ds-bucket.ds-over').forEach(x => x.classList.remove('ds-over'));
    if(drag && drag.ghost){ drag.ghost.remove(); drag.card.classList.remove('ds-dragging'); }
  }
  function onUp(e){
    if(!drag || e.pointerId !== drag.id) return;
    const d = drag; endDrag(); drag = null;
    if(d.ghost){
      lastDragEnd = Date.now();
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const b = el && el.closest && el.closest('.ds-bucket');
      if(b) placeCurrent(b.dataset.cat);
    }
  }
  function onCancel(e){
    if(!drag || e.pointerId !== drag.id) return;
    endDrag(); drag = null;
  }

  /* ------------------------------------------------------------ لمس دسته و کیبورد */
  function onClick(e){
    if(Date.now() - lastDragEnd < 250) return;
    const b = e.target.closest && e.target.closest('.ds-bucket');
    if(b) placeCurrent(b.dataset.cat);
  }
  function onKey(e){
    if(e.key !== 'Enter' && e.key !== ' ') return;
    const b = e.target.closest && e.target.closest('.ds-bucket');
    if(b){ e.preventDefault(); placeCurrent(b.dataset.cat); }
  }

  /* ------------------------------------------------------------ ثبت خودکار (بدون ویرایش games.js / config.js) */
  try{
    if(typeof GENERIC_GAME_META === 'object' && GENERIC_GAME_META && !GENERIC_GAME_META.drag_sort){
      GENERIC_GAME_META.drag_sort = { icon:'🧺', label:'دسته‌بندی با کشیدن', diff:2 };
    }
  }catch(_){}
  try{
    if(typeof window.launchGame === 'function' && !window.launchGame.__dragsort){
      const origLaunch = window.launchGame;
      const wrapped = function(lessonId, idx){
        const l = lessons.find(x => x.id === lessonId);
        const g = l && buildGameList(l)[idx];
        if(g && g.type === 'drag_sort') return window.startDragSortGame(l, g);
        return origLaunch.apply(this, arguments);
      };
      wrapped.__dragsort = true;
      window.launchGame = wrapped;
    }
  }catch(_){}
})();
