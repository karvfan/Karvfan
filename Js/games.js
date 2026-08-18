/**
 * games.js — موتور بازی/آزمون هر درس: آزمون چهارگزینه‌ای عمومی +
 * سه بازی اختصاصی (الهام از طبیعت، کارآگاه ایمیل، الگوریتم ربات).
 */

function openQuiz(lessonId){
  const l = lessons.find(x=>x.id===lessonId); if(!l) return;
  openModal('quizModalOv');
  if(l.game_type === 'invention_match') return startInventionMatch(l);
  if(l.game_type === 'email_detective') return startEmailDetective(l);
  if(l.game_type === 'robot_algorithm') return startRobotAlgorithm(l);
  let qs = [];
  try{ qs = l.quiz_json ? JSON.parse(l.quiz_json) : []; }catch(e){ qs=[]; }
  if(!qs.length){ showToast('این درس هنوز بازی نداره'); closeModal('quizModalOv'); return; }
  quizState = { type:'mcq', lessonId, questions: shuffleArr(qs.slice()), idx:0, score:0, total:qs.length };
  renderQuizQuestion();
}
function shuffleArr(arr){
  for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
  return arr;
}
function renderQuizQuestion(){
  const st = quizState;
  const body = $('quizBody');
  if(st.idx >= st.questions.length){ finishGame(st.lessonId, st.score, st.total); return; }
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
    if(st.matched.size === st.total){ setTimeout(()=>finishGame(st.lessonId, st.perfect, st.total), 400); }
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

/* ------------------------------------------------------------ پایان بازی + ثبت امتیاز (مشترک بین همه‌ی بازی‌ها) */
async function finishGame(lessonId, score, total){
  const pct = Math.round((score/total)*100);
  const stars = pct>=90?3:(pct>=60?2:(pct>=30?1:0));
  const msg = pct===100?'👑 عالی بود، همه رو درست انجام دادی!' : pct>=60?'🎉 آفرین، خیلی خوب بود!' : pct>=30?'💪 بد نبود، یه بار دیگه تمرین کن تا کامل بشه!' : '🌱 اشکالی نداره، درس رو دوباره بخون و دوباره امتحان کن!';
  $('quizBody').innerHTML =
    '<div class="quiz-result">'+
      '<div class="quiz-stars">'+('⭐'.repeat(stars))+('☆'.repeat(3-stars))+'</div>'+
      '<div class="quiz-score">'+score+' از '+total+' درست</div>'+
      '<div class="quiz-msg">'+msg+'</div>'+
      '<div id="quizPtsMsg" class="quiz-pts-msg">⏳ در حال ثبت نتیجه...</div>'+
      '<div id="quizMoodSlot"></div>'+
      '<button class="btn btn-thread btn-sm" style="margin-top:10px" onclick="openQuiz(\''+lessonId+'\')">🔁 بازی دوباره</button>'+
      '<button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="closeModal(\'quizModalOv\')">بستن</button>'+
    '</div>';
  const { data, error } = await sb.rpc('submit_quiz_result', { p_student_id: student.id, p_lesson_id: lessonId, p_score: score, p_total: total });
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
