/**
 * games.js — موتور بازی/آزمون هر پودمان:
 *  - سه بازی اختصاصیِ قدیمی (الهام از طبیعت، کارآگاه ایمیل، الگوریتم ربات) — بدون تغییر.
 *  - یک «لیست انتخاب بازی» که برای هر پودمان، آزمون چهارگزینه‌ای (quiz_json) +
 *    بازی‌های عمومی (games_json: true_false, matching, memory, fill_blank, ordering)
 *    را از ساده به سخت نشان می‌دهد.
 */

/* ------------------------------------------------------------ ورودی مشترک + ساخت لیست بازی‌ها */
function openQuiz(lessonId){
  const l = lessons.find(x=>x.id===lessonId); if(!l) return;
  openModal('quizModalOv');
  renderGamePicker(l);
}
function shuffleArr(arr){
  for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
  return arr;
}
function buildGameList(l){
  const list = [];
  if(l.game_type && GAME_LABELS[l.game_type]){
    list.push({ key:'quiz', type:l.game_type, title:GAME_LABELS[l.game_type], points:l.quiz_points||10, data:null });
  }
  let gj = [];
  try{ gj = l.games_json ? (typeof l.games_json==='string'? JSON.parse(l.games_json) : l.games_json) : []; }catch(e){ gj=[]; }
  (gj||[]).forEach(g=>{ if(g && g.type && g.data) list.push(g); });
  if(!l.game_type){
    let qs = [];
    try{ qs = l.quiz_json ? JSON.parse(l.quiz_json) : []; }catch(e){ qs=[]; }
    if(qs.length) list.push({ key:'quiz', type:'mcq', title:'آزمون جمع‌بندی این پودمان', points:l.quiz_points||10, data:{questions:qs} });
  }
  list.sort((a,b)=> (GENERIC_GAME_META[a.type]?.diff||9) - (GENERIC_GAME_META[b.type]?.diff||9));
  return list;
}
function renderGamePicker(l){
  const games = buildGameList(l);
  if(!games.length){ showToast('این پودمان هنوز بازی نداره'); closeModal('quizModalOv'); return; }
  quizState = { type:'picker', lessonId:l.id };
  $('quizBody').innerHTML =
    '<div class="game-picker-head">🎮 برای «'+esc(l.unit_title)+'» از ساده شروع کن و تا سخت‌ترین بازی برو جلو — هر بازی امتیاز جدا داره!</div>'+
    '<div class="game-picker-list">'+
      games.map((g,i)=>{
        const meta = GENERIC_GAME_META[g.type] || {icon:'🎮', diff:1};
        const done = myQuizResults[l.id+'::'+g.key];
        const diffDots = Array.from({length:5},(_,d)=> '<span class="'+(d<meta.diff?'on':'')+'"></span>').join('');
        return '<button class="game-pick-card" onclick="launchGame(\''+l.id+'\','+i+')">'+
          '<span class="game-pick-emoji">'+meta.icon+'</span>'+
          '<span class="game-pick-mid"><span class="game-pick-title">'+esc(g.title||meta.label)+'</span>'+
          '<span class="game-pick-sub">'+(g.points||10)+'+ امتیاز <span class="game-pick-diff">'+diffDots+'</span></span></span>'+
          (done? '<span class="game-pick-done">✅ '+done.score+'/'+done.total+'</span>' : '')+
        '</button>';
      }).join('')+
    '</div>';
}
function launchGame(lessonId, idx){
  const l = lessons.find(x=>x.id===lessonId); if(!l) return;
  const games = buildGameList(l);
  const g = games[idx]; if(!g) return;
  if(g.type==='invention_match') return startInventionMatch(l);
  if(g.type==='email_detective') return startEmailDetective(l);
  if(g.type==='robot_algorithm') return startRobotAlgorithm(l);
  if(g.type==='mcq') return startMcqGame(l, g);
  if(g.type==='true_false') return startTrueFalseGame(l, g);
  if(g.type==='matching') return startGenericMatchGame(l, g);
  if(g.type==='memory') return startMemoryGame(l, g);
  if(g.type==='fill_blank') return startFillBlankGame(l, g);
  if(g.type==='ordering') return startOrderingGame(l, g);
}
function backToPicker(){
  const l = lessons.find(x=>x.id===quizState.lessonId); if(!l) return;
  renderGamePicker(l);
}

/* ------------------------------------------------------------ آزمون چهارگزینه‌ای (quiz_json) */
function startMcqGame(l, g){
  quizState = { type:'mcq', lessonId:l.id, gameKey:g.key, gameTitle:g.title, points:g.points, questions: shuffleArr(g.data.questions.slice()), idx:0, score:0, total:g.data.questions.length };
  renderQuizQuestion();
}
function renderQuizQuestion(){
  const st = quizState;
  const body = $('quizBody');
  if(st.idx >= st.questions.length){ finishGame(st); return; }
  const q = st.questions[st.idx];
  const pct = Math.round((st.idx/st.total)*100);
  body.innerHTML =
    '<div class="quiz-progress"><div class="quiz-progress-bar" style="width:'+pct+'%"></div></div>'+
    '<div class="quiz-qcount">سؤال '+(st.idx+1)+' از '+st.total+' · امتیاز فعلی: '+st.score+'</div>'+
    '<div class="quiz-question">'+esc(q.q)+'</div>'+
    '<div class="quiz-options" id="quizOpts">'+
      q.options.map((op,i)=>'<button class="quiz-opt" data-i="'+i+'" onclick="answerQuiz('+i+')">'+esc(op)+'</button>').join('')+
    '</div>';
}
function answerQuiz(i){
  const st = quizState;
  const q = st.questions[st.idx];
  const btns = document.querySelectorAll('#quizOpts .quiz-opt');
  btns.forEach(b=>b.onclick=null);
  const correct = q.correct;
  if(i===correct){ st.score++; btns[i].classList.add('quiz-correct'); btns[i].innerHTML += ' ✅'; }
  else { btns[i].classList.add('quiz-wrong'); btns[i].innerHTML += ' ❌'; btns[correct].classList.add('quiz-correct'); btns[correct].innerHTML += ' ✅'; }
  setTimeout(()=>{ st.idx++; renderQuizQuestion(); }, 1100);
}

/* ------------------------------------------------------------ بازی ۱ (پایه هفتم): الهام از طبیعت */
function startInventionMatch(l){
  const pairIdx = shuffleArr(INVENTION_PAIRS.map((p,i)=>i));
  quizState = {
    type:'invention_match', lessonId:l.id, total: INVENTION_PAIRS.length, matched:new Set(),
    natureOrder: shuffleArr(pairIdx.slice()), inventionOrder: shuffleArr(pairIdx.slice()),
    selN:null, selI:null, perfect:0, wrongThisPair:false, locked:false
  };
  renderInventionMatch();
}
function renderInventionMatch(){
  const st = quizState;
  $('quizBody').innerHTML =
    '<div class="quiz-qcount">🌿 طبیعت الهام‌بخش نوآوری‌هاست! جفت‌های مرتبط رو پیدا کن ('+st.matched.size+' از '+st.total+')</div>'+
    '<div class="match-grid">'+
      '<div class="match-col">'+st.natureOrder.map(pi=>{
        const done = st.matched.has(pi);
        const sel = st.selN===pi;
        return '<button class="match-card '+(done?'match-done':'')+' '+(sel?'match-sel':'')+'" '+(done?'disabled':'')+' onclick="pickNature('+pi+')"><span class="match-emoji">'+INVENTION_PAIRS[pi].n+'</span><span class="match-label">'+INVENTION_PAIRS[pi].nl+'</span></button>';
      }).join('')+'</div>'+
      '<div class="match-col">'+st.inventionOrder.map(pi=>{
        const done = st.matched.has(pi);
        const sel = st.selI===pi;
        return '<button class="match-card '+(done?'match-done':'')+' '+(sel?'match-sel':'')+'" '+(done?'disabled':'')+' onclick="pickInvention('+pi+')"><span class="match-emoji">'+INVENTION_PAIRS[pi].i+'</span><span class="match-label">'+INVENTION_PAIRS[pi].il+'</span></button>';
      }).join('')+'</div>'+
    '</div>';
}
function pickNature(pi){ const st=quizState; if(st.locked||st.matched.has(pi)) return; st.selN=pi; renderInventionMatch(); tryMatchPair(); }
function pickInvention(pi){ const st=quizState; if(st.locked||st.matched.has(pi)) return; st.selI=pi; renderInventionMatch(); tryMatchPair(); }
function tryMatchPair(){
  const st = quizState;
  if(st.selN==null || st.selI==null) return;
  st.locked = true;
  if(st.selN === st.selI){
    st.matched.add(st.selN);
    if(!st.wrongThisPair) st.perfect++;
    st.wrongThisPair = false;
    st.selN=null; st.selI=null; st.locked=false;
    renderInventionMatch();
    if(st.matched.size === st.total){ setTimeout(()=>finishGame({lessonId:st.lessonId, score:st.perfect, total:st.total}), 400); }
  } else {
    st.wrongThisPair = true;
    setTimeout(()=>{ st.selN=null; st.selI=null; st.locked=false; renderInventionMatch(); }, 700);
  }
}

/* ------------------------------------------------------------ بازی ۲ (پایه هشتم): کارآگاه ایمیل */
function startEmailDetective(l){
  quizState = { type:'email_detective', lessonId:l.id, cases: shuffleArr(EMAIL_CASES.slice()), idx:0, score:0, total:EMAIL_CASES.length };
  renderEmailCase();
}
function renderEmailCase(){
  const st = quizState;
  if(st.idx >= st.cases.length){ finishGame(st.lessonId, st.score, st.total); return; }
  const c = st.cases[st.idx];
  const pct = Math.round((st.idx/st.total)*100);
  $('quizBody').innerHTML =
    '<div class="quiz-progress"><div class="quiz-progress-bar" style="width:'+pct+'%"></div></div>'+
    '<div class="quiz-qcount">🕵️ ایمیل '+(st.idx+1)+' از '+st.total+' · امتیاز فعلی: '+st.score+'</div>'+
    '<div class="email-card" id="emailCard">'+
      '<div class="email-from">از: '+esc(c.from)+'</div>'+
      '<div class="email-subj">'+esc(c.subj)+'</div>'+
      '<div class="email-body">'+esc(c.body)+'</div>'+
    '</div>'+
    '<div class="email-actions">'+
      '<button class="btn btn-sage btn-sm" onclick="answerEmail(true)">✅ امنه</button>'+
      '<button class="btn btn-brick btn-sm" onclick="answerEmail(false)">⚠️ مشکوکه</button>'+
    '</div>'+
    '<div id="emailFeedback"></div>';
}
function answerEmail(choice){
  const st = quizState;
  const c = st.cases[st.idx];
  document.querySelectorAll('.email-actions button').forEach(b=>b.disabled=true);
  const correct = (choice === c.safe);
  if(correct) st.score++;
  document.getElementById('emailCard').classList.add(c.safe?'email-was-safe':'email-was-unsafe');
  $('emailFeedback').innerHTML = '<div class="email-feedback '+(correct?'fb-correct':'fb-wrong')+'">'+
    (correct?'✅ آفرین، درست تشخیص دادی!':'❌ این‌بار اشتباه زدی.')+' <br>'+esc(c.reason)+'</div>'+
    '<button class="btn btn-thread btn-sm" style="margin-top:10px" onclick="nextEmail()">ایمیل بعدی ←</button>';
}
function nextEmail(){ quizState.idx++; renderEmailCase(); }

/* ------------------------------------------------------------ بازی ۳ (پایه نهم): الگوریتم ربات */
function startRobotAlgorithm(l){
  quizState = { type:'robot_algorithm', lessonId:l.id, levelIdx:0, total: ROBOT_LEVELS.length, score:0, seq:[], running:false, pos:null };
  loadRobotLevel();
}
function loadRobotLevel(){
  const st = quizState;
  st.seq = []; st.running = false;
  st.pos = {...ROBOT_LEVELS[st.levelIdx].start};
  renderRobotGame('برای رسیدن ربات 🤖 به پرچم 🏁 یه دنباله از دستورها بساز، بعد «اجرا» رو بزن.');
}
function renderRobotGame(msg, status){
  const st = quizState;
  const lvl = ROBOT_LEVELS[st.levelIdx];
  let grid = '<div class="robot-grid">';
  for(let y=0;y<ROBOT_GRID;y++){
    for(let x=0;x<ROBOT_GRID;x++){
      const isObs = lvl.obstacles.some(o=>o.x===x&&o.y===y);
      const isGoal = lvl.goal.x===x && lvl.goal.y===y;
      const isRobot = st.pos.x===x && st.pos.y===y;
      let content = '';
      if(isRobot) content = '🤖'; else if(isGoal) content = '🏁'; else if(isObs) content = '🚧';
      grid += '<div class="robot-cell'+(isObs?' robot-obs':'')+'">'+content+'</div>';
    }
  }
  grid += '</div>';
  $('quizBody').innerHTML =
    '<div class="quiz-qcount">🤖 مرحله '+(st.levelIdx+1)+' از '+st.total+' · امتیاز فعلی: '+st.score+'</div>'+
    '<div class="robot-msg'+(status?(' robot-msg-'+status):'')+'">'+msg+'</div>'+
    grid+
    '<div class="robot-seq" id="robotSeq">'+(st.seq.length? st.seq.map(d=>ROBOT_ARROWS[d]).join(' '): '<span class="robot-seq-empty">هنوز دستوری اضافه نکردی</span>')+'</div>'+
    '<div class="robot-controls">'+
      '<button class="robot-btn" onclick="addRobotMove(\'up\')">⬆️</button>'+
      '<button class="robot-btn" onclick="addRobotMove(\'left\')">⬅️</button>'+
      '<button class="robot-btn" onclick="addRobotMove(\'down\')">⬇️</button>'+
      '<button class="robot-btn" onclick="addRobotMove(\'right\')">➡️</button>'+
    '</div>'+
    '<div class="robot-actions">'+
      '<button class="btn btn-ghost btn-sm" onclick="undoRobotMove()">↩️ حذف آخرین</button>'+
      '<button class="btn btn-thread btn-sm" onclick="runRobot()">▶️ اجرا کن</button>'+
    '</div>';
}
function addRobotMove(dir){ if(quizState.running) return; quizState.seq.push(dir); renderRobotGame('دنباله‌ی دستورها رو بساز، هروقت آماده بود «اجرا» رو بزن.'); }
function undoRobotMove(){ if(quizState.running) return; quizState.seq.pop(); renderRobotGame('دنباله‌ی دستورها رو بساز، هروقت آماده بود «اجرا» رو بزن.'); }
function runRobot(){
  const st = quizState;
  if(st.running || !st.seq.length) return;
  st.running = true;
  const lvl = ROBOT_LEVELS[st.levelIdx];
  let pos = {...lvl.start};
  let i = 0;
  const step = () => {
    if(i >= st.seq.length){
      st.running = false;
      if(pos.x===lvl.goal.x && pos.y===lvl.goal.y){
        st.score++;
        renderRobotGame('🎉 آفرین! ربات دقیقاً به پرچم رسید!', 'ok');
        setTimeout(()=>{
          st.levelIdx++;
          if(st.levelIdx >= st.total){ finishGame(st.lessonId, st.score, st.total); }
          else { loadRobotLevel(); }
        }, 1300);
      } else {
        renderRobotGame('🤔 این‌بار به پرچم نرسید. دنباله رو دوباره بساز و امتحان کن!', 'fail');
        setTimeout(()=>{ st.pos = {...lvl.start}; st.seq=[]; renderRobotGame('یه دنباله‌ی جدید بساز و دوباره اجرا کن.'); }, 1500);
      }
      return;
    }
    const d = st.seq[i];
    let np = {...pos};
    if(d==='up') np.y--; if(d==='down') np.y++; if(d==='left') np.x--; if(d==='right') np.x++;
    const outOfBounds = np.x<0||np.x>=ROBOT_GRID||np.y<0||np.y>=ROBOT_GRID;
    const hitObs = lvl.obstacles.some(o=>o.x===np.x&&o.y===np.y);
    if(outOfBounds || hitObs){
      st.pos = pos; st.running = false;
      renderRobotGame('💥 ربات به دیوار یا مانع خورد! یه مسیر دیگه امتحان کن.', 'fail');
      setTimeout(()=>{ st.pos = {...lvl.start}; st.seq=[]; renderRobotGame('یه دنباله‌ی جدید بساز و دوباره اجرا کن.'); }, 1500);
      return;
    }
    pos = np; st.pos = pos; i++;
    renderRobotGame('در حال اجرا...');
    setTimeout(step, 450);
  };
  step();
}

/* ------------------------------------------------------------ پایان بازی + ثبت امتیاز (مشترک بین همه‌ی بازی‌ها)
   می‌تواند با شیء state {lessonId,score,total,gameKey,gameTitle,points} یا با سه‌آرگومان قدیمی
   (lessonId, score, total) صدا زده شود — برای سازگاری با سه بازی اختصاصی قدیمی. */
async function finishGame(a, b, c){
  let lessonId, score, total, gameKey, gameTitle, pointsMax;
  if(a && typeof a === 'object'){ ({lessonId, score, total, gameKey, gameTitle} = a); pointsMax = a.points; }
  else { lessonId = a; score = b; total = c; }
  gameKey = gameKey || 'quiz';
  const pct = Math.round((score/total)*100);
  const stars = pct>=90?3:(pct>=60?2:(pct>=30?1:0));
  const msg = pct===100?'👑 عالی بود، همه رو درست انجام دادی!' : pct>=60?'🎉 آفرین، خیلی خوب بود!' : pct>=30?'💪 بد نبود، یه بار دیگه تمرین کن تا کامل بشه!' : '🌱 اشکالی نداره، درس رو دوباره بخون و دوباره امتحان کن!';
  const retryBtn = '<button class="btn btn-thread btn-sm" style="margin-top:10px" onclick="openQuiz(\''+lessonId+'\')">🎮 بازی‌های این پودمان</button>';
  $('quizBody').innerHTML =
    '<div class="quiz-result">'+
      '<div class="quiz-stars">'+('⭐'.repeat(stars))+('☆'.repeat(3-stars))+'</div>'+
      (gameTitle? '<div class="quiz-qcount">'+esc(gameTitle)+'</div>' : '')+
      '<div class="quiz-score">'+score+' از '+total+' درست</div>'+
      '<div class="quiz-msg">'+msg+'</div>'+
      '<div id="quizPtsMsg" class="quiz-pts-msg">⏳ در حال ثبت نتیجه...</div>'+
      '<div id="quizMoodSlot"></div>'+
      retryBtn+
      '<button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="closeModal(\'quizModalOv\')">بستن</button>'+
    '</div>';
  const { data, error } = await sb.rpc('submit_quiz_result', { p_student_id: student.id, p_lesson_id: lessonId, p_score: score, p_total: total, p_game_key: gameKey, p_points_max: pointsMax||null });
  const row = (data&&data[0]) || {points_awarded:0,is_first_time:false};
  if(!error && row.is_first_time && row.points_awarded>0){
    $('quizPtsMsg').innerHTML = '🏅 <b>+'+row.points_awarded+' امتیاز</b> به حسابت اضافه شد!';
    student.points = (student.points||0) + row.points_awarded;
    $('stPoints').textContent = student.points;
  } else if(!error && !row.is_first_time){
    $('quizPtsMsg').textContent = 'امتیاز این بازی رو قبلاً گرفتی — این فقط برای تمرین بود 🙂';
  } else {
    $('quizPtsMsg').textContent = '';
  }
  $('quizMoodSlot').innerHTML = moodPickerHtml('quiz', lessonId, null);

  await refreshStreak();
  await loadMyQuizResults();
  renderLessonsPanel();
}

/* ------------------------------------------------------------ بازی عمومی ۱ (ساده): درست یا غلط */
function startTrueFalseGame(l, g){
  const items = shuffleArr(g.data.statements.slice());
  quizState = { type:'true_false', lessonId:l.id, gameKey:g.key, gameTitle:g.title, points:g.points, items, idx:0, score:0, total:items.length };
  renderTrueFalse();
}
function renderTrueFalse(){
  const st = quizState;
  if(st.idx >= st.items.length){ finishGame(st); return; }
  const it = st.items[st.idx];
  const pct = Math.round((st.idx/st.total)*100);
  $('quizBody').innerHTML =
    '<div class="quiz-progress"><div class="quiz-progress-bar" style="width:'+pct+'%"></div></div>'+
    '<div class="quiz-qcount">✅ گزاره '+(st.idx+1)+' از '+st.total+' · امتیاز فعلی: '+st.score+'</div>'+
    '<div class="quiz-question">'+esc(it.text)+'</div>'+
    '<div class="tf-actions" id="tfActs">'+
      '<button class="btn btn-sage btn-sm" onclick="answerTrueFalse(true)">✅ درسته</button>'+
      '<button class="btn btn-brick btn-sm" onclick="answerTrueFalse(false)">❌ غلطه</button>'+
    '</div>'+
    '<div id="tfFeedback"></div>';
}
function answerTrueFalse(choice){
  const st = quizState;
  const it = st.items[st.idx];
  document.querySelectorAll('#tfActs button').forEach(b=>b.disabled=true);
  const correct = (choice === it.answer);
  if(correct) st.score++;
  $('tfFeedback').innerHTML = '<div class="tf-feedback '+(correct?'fb-correct':'fb-wrong')+'" style="background:'+(correct?'var(--sage-bg)':'var(--brick-bg)')+';color:'+(correct?'var(--sage)':'var(--brick)')+'">'+
    (correct?'✅ درست گفتی!':('❌ نه، این گزاره «'+(it.answer?'درست':'غلط')+'» بود.'))+' '+(it.explain? '<br>'+esc(it.explain):'')+'</div>'+
    '<button class="btn btn-thread btn-sm" style="margin-top:10px" onclick="nextTrueFalse()">بعدی ←</button>';
}
function nextTrueFalse(){ quizState.idx++; renderTrueFalse(); }

/* ------------------------------------------------------------ بازی عمومی ۲: جورچین (matching عمومی) */
function startGenericMatchGame(l, g){
  const pairs = g.data.pairs;
  const idxs = pairs.map((p,i)=>i);
  quizState = {
    type:'matching', lessonId:l.id, gameKey:g.key, gameTitle:g.title, points:g.points,
    pairs, total: pairs.length, matched:new Set(),
    aOrder: shuffleArr(idxs.slice()), bOrder: shuffleArr(idxs.slice()),
    selA:null, selB:null, perfect:0, wrongThisPair:false, locked:false
  };
  renderGenericMatch();
}
function renderGenericMatch(){
  const st = quizState;
  $('quizBody').innerHTML =
    '<div class="quiz-qcount">🔗 جفت‌های مرتبط رو پیدا کن ('+st.matched.size+' از '+st.total+')</div>'+
    '<div class="match-grid">'+
      '<div class="match-col">'+st.aOrder.map(pi=>{
        const done = st.matched.has(pi); const sel = st.selA===pi;
        return '<button class="match-card '+(done?'match-done':'')+' '+(sel?'match-sel':'')+'" '+(done?'disabled':'')+' onclick="pickGenericA('+pi+')"><span class="match-label">'+esc(st.pairs[pi].a)+'</span></button>';
      }).join('')+'</div>'+
      '<div class="match-col">'+st.bOrder.map(pi=>{
        const done = st.matched.has(pi); const sel = st.selB===pi;
        return '<button class="match-card '+(done?'match-done':'')+' '+(sel?'match-sel':'')+'" '+(done?'disabled':'')+' onclick="pickGenericB('+pi+')"><span class="match-label">'+esc(st.pairs[pi].b)+'</span></button>';
      }).join('')+'</div>'+
    '</div>';
}
function pickGenericA(pi){ const st=quizState; if(st.locked||st.matched.has(pi)) return; st.selA=pi; renderGenericMatch(); tryGenericMatchPair(); }
function pickGenericB(pi){ const st=quizState; if(st.locked||st.matched.has(pi)) return; st.selB=pi; renderGenericMatch(); tryGenericMatchPair(); }
function tryGenericMatchPair(){
  const st = quizState;
  if(st.selA==null || st.selB==null) return;
  st.locked = true;
  if(st.selA === st.selB){
    st.matched.add(st.selA);
    if(!st.wrongThisPair) st.perfect++;
    st.wrongThisPair = false;
    st.selA=null; st.selB=null; st.locked=false;
    renderGenericMatch();
    if(st.matched.size === st.total){ setTimeout(()=>finishGame(Object.assign({}, st, {score:st.perfect})), 400); }
  } else {
    st.wrongThisPair = true;
    setTimeout(()=>{ st.selA=null; st.selB=null; st.locked=false; renderGenericMatch(); }, 700);
  }
}

/* ------------------------------------------------------------ بازی عمومی ۳: حافظه (memory) */
function startMemoryGame(l, g){
  const pairs = g.data.pairs;
  const cards = [];
  pairs.forEach((p,i)=>{ cards.push({pairId:i, text:p.a}); cards.push({pairId:i, text:p.b}); });
  quizState = {
    type:'memory', lessonId:l.id, gameKey:g.key, gameTitle:g.title, points:g.points,
    cards: shuffleArr(cards), total: pairs.length, matched:new Set(),
    flipped:[], locked:false, moves:0
  };
  renderMemory();
}
function renderMemory(){
  const st = quizState;
  $('quizBody').innerHTML =
    '<div class="quiz-qcount">🃏 کارت‌ها رو دوتا دوتا برگردون و جفت‌های هم‌معنی رو پیدا کن ('+st.matched.size+' از '+st.total+')</div>'+
    '<div class="memory-grid">'+
      st.cards.map((c,i)=>{
        const isFlipped = st.flipped.includes(i);
        const isDone = st.matched.has(c.pairId);
        return '<button class="memory-card '+(isFlipped||isDone?'mem-flip':'')+' '+(isDone?'mem-done':'')+'" '+(isDone?'disabled':'')+' onclick="flipMemoryCard('+i+')">'+((isFlipped||isDone)?esc(c.text):'')+'</button>';
      }).join('')+
    '</div>';
}
function flipMemoryCard(i){
  const st = quizState;
  if(st.locked) return;
  const c = st.cards[i];
  if(st.matched.has(c.pairId) || st.flipped.includes(i)) return;
  st.flipped.push(i);
  renderMemory();
  if(st.flipped.length===2){
    st.locked = true; st.moves++;
    const [i1,i2] = st.flipped;
    if(st.cards[i1].pairId === st.cards[i2].pairId){
      st.matched.add(st.cards[i1].pairId);
      st.flipped = []; st.locked = false;
      renderMemory();
      if(st.matched.size === st.total){
        const score = Math.max(1, Math.min(st.total, Math.round((st.total*st.total)/Math.max(st.moves,1))));
        setTimeout(()=>finishGame(Object.assign({}, st, {score, total: st.total})), 400);
      }
    } else {
      setTimeout(()=>{ st.flipped=[]; st.locked=false; renderMemory(); }, 900);
    }
  }
}

/* ------------------------------------------------------------ بازی عمومی ۴: جای خالی (fill_blank) */
function startFillBlankGame(l, g){
  const items = shuffleArr(g.data.items.slice());
  quizState = { type:'fill_blank', lessonId:l.id, gameKey:g.key, gameTitle:g.title, points:g.points, items, idx:0, score:0, total:items.length };
  renderFillBlank();
}
function renderFillBlank(){
  const st = quizState;
  if(st.idx >= st.items.length){ finishGame(st); return; }
  const it = st.items[st.idx];
  const opts = shuffleArr(it.options.slice());
  const pct = Math.round((st.idx/st.total)*100);
  $('quizBody').innerHTML =
    '<div class="quiz-progress"><div class="quiz-progress-bar" style="width:'+pct+'%"></div></div>'+
    '<div class="quiz-qcount">✏️ جمله '+(st.idx+1)+' از '+st.total+' · امتیاز فعلی: '+st.score+'</div>'+
    '<div class="fill-sentence">'+esc(it.sentence).replace('___','<span class="fill-blank-slot" id="fillSlot">؟</span>')+'</div>'+
    '<div class="quiz-options" id="fillOpts">'+
      opts.map(op=>'<button class="quiz-opt" onclick="answerFillBlank(this,'+JSON.stringify(op===it.answer)+')">'+esc(op)+'</button>').join('')+
    '</div>';
}
function answerFillBlank(btn, isCorrect){
  const st = quizState;
  const it = st.items[st.idx];
  document.querySelectorAll('#fillOpts .quiz-opt').forEach(b=>b.onclick=null);
  if(isCorrect){ st.score++; btn.classList.add('quiz-correct'); btn.innerHTML += ' ✅'; if($('fillSlot')) $('fillSlot').textContent = it.answer; }
  else {
    btn.classList.add('quiz-wrong'); btn.innerHTML += ' ❌';
    document.querySelectorAll('#fillOpts .quiz-opt').forEach(b=>{ if(b.textContent.trim().startsWith(it.answer)) b.classList.add('quiz-correct'); });
    if($('fillSlot')) $('fillSlot').textContent = it.answer;
  }
  setTimeout(()=>{ st.idx++; renderFillBlank(); }, 1200);
}

/* ------------------------------------------------------------ بازی عمومی ۵ (سخت): ترتیب درست (ordering) */
function startOrderingGame(l, g){
  const correctOrder = g.data.items.slice();
  const pool = shuffleArr(correctOrder.map((t,i)=>({text:t, origIdx:i})));
  quizState = { type:'ordering', lessonId:l.id, gameKey:g.key, gameTitle:g.title, points:g.points, correctOrder, pool, picked:[], done:false };
  renderOrdering();
}
function renderOrdering(){
  const st = quizState;
  $('quizBody').innerHTML =
    '<div class="quiz-qcount">🔢 مراحل رو به ترتیب درست، یکی‌یکی لمس کن</div>'+
    '<div class="order-seq" id="orderSeq">'+(st.picked.length? st.picked.map((p,i)=>'<div class="order-seq-item"><span class="order-seq-num">'+(i+1)+'</span>'+esc(p.text)+'</div>').join('') : '<div class="order-seq-empty">هنوز چیزی انتخاب نکردی</div>')+'</div>'+
    '<div class="order-pool">'+
      st.pool.map((p,i)=>'<button class="order-chip" '+(st.picked.includes(p)?'disabled':'')+' onclick="pickOrderItem('+i+')">'+esc(p.text)+'</button>').join('')+
    '</div>'+
    (st.picked.length? '<button class="btn btn-ghost btn-sm" style="margin-bottom:8px" onclick="undoOrderItem()">↩️ حذف آخرین</button>' : '')+
    (st.picked.length === st.pool.length? '<button class="btn btn-thread btn-sm" onclick="submitOrdering()">✅ ثبت ترتیب</button>' : '');
}
function pickOrderItem(i){ const st=quizState; const p=st.pool[i]; if(st.picked.includes(p)) return; st.picked.push(p); renderOrdering(); }
function undoOrderItem(){ quizState.picked.pop(); renderOrdering(); }
function submitOrdering(){
  const st = quizState;
  let correctCount = 0;
  const rows = st.picked.map((p,i)=>{ const ok = p.origIdx===i; if(ok) correctCount++; return {text:p.text, ok}; });
  $('quizBody').innerHTML =
    '<div class="quiz-qcount">نتیجه: '+correctCount+' از '+st.pool.length+' مورد در جای درست</div>'+
    rows.map((r,i)=>'<div class="order-result-item '+(r.ok?'order-ok':'order-bad')+'">'+(r.ok?'✅':'❌')+' '+(i+1)+'. '+esc(r.text)+'</div>').join('')+
    (correctCount<st.pool.length? '<div class="quiz-qcount" style="margin-top:8px">ترتیب درست: '+st.correctOrder.map((t,i)=>(i+1)+'. '+esc(t)).join(' ← ')+'</div>' : '')+
    '<button class="btn btn-thread btn-sm" style="margin-top:12px" onclick="finishGame(quizState)">ادامه ←</button>';
  quizState.score = correctCount; quizState.total = st.pool.length;
}
