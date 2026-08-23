/**
 * confetti.js — جلوه‌ی تشویقی سبک (بدون کتابخانه‌ی خارجی)، برای لحظه‌ی دیدن امتیاز/تأیید کار.
 */
function fireConfetti(){
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;z-index:600;pointer-events:none;width:100%;height:100%';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const colors = ['#d79a2c', '#a8395a', '#356f8f', '#4f7f58', '#f4eedd'];
  const N = 90;
  const pieces = Array.from({length:N}, ()=>({
    x: Math.random()*innerWidth,
    y: -20 - Math.random()*innerHeight*0.3,
    r: 4+Math.random()*5,
    c: colors[Math.floor(Math.random()*colors.length)],
    vy: 2+Math.random()*3,
    vx: -1.5+Math.random()*3,
    rot: Math.random()*360,
    vr: -6+Math.random()*12,
  }));
  let frame = 0;
  function tick(){
    frame++;
    ctx.clearRect(0,0,innerWidth,innerHeight);
    let alive = false;
    pieces.forEach(p=>{
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      if(p.y < innerHeight+20) alive = true;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot*Math.PI/180);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.r/2, -p.r/2, p.r, p.r*1.6);
      ctx.restore();
    });
    if(alive && frame < 220) requestAnimationFrame(tick);
    else canvas.remove();
  }
  requestAnimationFrame(tick);
}
