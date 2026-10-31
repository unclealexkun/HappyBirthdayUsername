/* =====================================================================
   ПУСТОЙ КОНТЕЙНЕР · engine.js — движок визуальной новеллы
   ===================================================================== */

const $ = id => document.getElementById(id);

/* ---------- состояние игры ---------- */
let S;
function newState(){
  return {
    hours: 3,                       // 3 «часа» на следствие
    stats: { ob:2, em:2, pr:2, cp:2 }, // наблюдательность/эмпатия/давление/процедура
    trust: {},                      // доверие NPC
    evidence: {},                   // флаги улик E_*
    flags: {},                      // сюжетные флаги
    scene2Used:{}, scene2Count:0,
    endOverride:null,
    sceneId:null, lineIdx:0,
    log:[],
    startScene:'s1',
  };
}

/* ---------- звуковые эффекты (WebAudio, без файлов) ---------- */
const Sound = (()=>{
  let ctx=null, on=true;
  function ac(){ if(!ctx) ctx=new (window.AudioContext||window.webkitAudioContext)(); return ctx; }
  function blip(freq=440,dur=.05,gain=.05,type='square'){
    if(!on) return;
    try{ const c=ac(), o=c.createOscillator(), g=c.createGain();
      o.type=type; o.frequency.value=freq; g.gain.value=gain;
      o.connect(g); g.connect(c.destination); o.start();
      g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+dur); o.stop(c.currentTime+dur+0.02);
    }catch(e){}
  }
  return {
    type(){ blip(180+Math.random()*60,.018,.02,'square'); },
    choose(){ blip(520,.07,.06,'triangle'); },
    evidence(){ blip(660,.12,.07,'sine'); setTimeout(()=>blip(880,.16,.06,'sine'),110); },
    hour(){ blip(90,.5,.12,'sawtooth'); },
    ending(){ [523,659,784].forEach((f,i)=>setTimeout(()=>blip(f,.3,.07,'sine'),i*180)); },
    toggle(){ on=!on; return on; },
    get on(){ return on; }
  };
})();

/* ---------- HUD ---------- */
function buildClockPips(){
  const g=$('clock-pips'); g.innerHTML='';
  for(let i=0;i<3;i++){
    const a=(-90+i*120)*Math.PI/180;
    const x=22+13*Math.cos(a), y=22+13*Math.sin(a);
    const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
    c.setAttribute('cx',x); c.setAttribute('cy',y); c.setAttribute('r',4.5);
    c.setAttribute('class','clock-pip'); c.dataset.idx=i;
    g.appendChild(c);
  }
}
function updateClock(){
  $('hours-left').textContent=S.hours;
  document.querySelectorAll('#clock-pips .clock-pip').forEach(p=>{
    p.classList.toggle('spent', +p.dataset.idx >= S.hours);
  });
}
function updateStats(){
  const map={ob:'st-ob',em:'st-em',pr:'st-pr',cp:'st-cp'};
  for(const k in map){
    const el=$(map[k]);
    if(+el.textContent!==S.stats[k]){
      el.textContent=S.stats[k];
      const box=el.closest('.stat'); box.classList.add('up');
      setTimeout(()=>box.classList.remove('up'),700);
    }
  }
}
function bumpStat(key,d){ S.stats[key]=Math.max(1,Math.min(5,S.stats[key]+d)); updateStats(); }

/* ---------- toast об улике ---------- */
let toastTimer=null;
function toastEvidence(e){
  const info=EVIDENCE_INFO[e]; if(!info) return;
  const t=$('toast');
  t.innerHTML=`<div class="t-head">Улика в досье</div><div class="t-body"><b>${info[1]}</b><br>${info[2]}</div>`;
  t.classList.remove('hidden'); Sound.evidence();
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.add('hidden'),4200);
}

/* ---------- журнал ---------- */
function logLine(S,text){ S.log.push(text); }
function renderLog(){
  const box=$('log-list');
  box.innerHTML = S.log.length
    ? S.log.map(l=>`<div class="log-line">${l}</div>`).join('')
    : '<div class="log-line dim">Пока пусто.</div>';
}

/* ---------- фон и персонажи ---------- */
function setBackground(name){
  const cur=$('bg-layer'), nxt=$('bg-layer-next');
  nxt.style.backgroundImage=Art.bg(name);
  nxt.style.opacity=1; cur.style.opacity=0;
  setTimeout(()=>{ cur.style.backgroundImage=nxt.style.backgroundImage;
    cur.style.opacity=1; nxt.style.opacity=0; },60);
  // дождь только на ночных улицах/складе
  const wet=/warehouse|rain|corridor|arrest|dispatch/.test(name);
  $('rain').style.display=wet?'block':'none';
}

function showCharacter(key, side){
  const tag=$('speaker-tag');
  if(!key){ tag.classList.add('hidden'); return; }
  const ch=CHARACTERS[key];
  tag.classList.remove('hidden');
  tag.innerHTML=`<img src="${Art.face(key)}" alt="" style="width:26px;height:34px;object-fit:cover;vertical-align:-8px;margin-right:8px;border-radius:2px;">${ch.name}`;
  tag.style.borderColor='var(--panel-border)';
  tag.style.borderBottomColor=ch.color;
}

/* ---------- печать текста ---------- */
let typing=false, typeTimer=null, fullText='', autoMode=false;
function speedMs(){ return [80,55,36,24,14][+$('mm-speed').value-1]; }

function typeText(text, done){
  const el=$('dlg-text'); clearInterval(typeTimer); typing=true; fullText=text;
  let i=0; el.innerHTML='';
  const narr=/^[«(—]|^[A-Za-zА-Яа-я]/.test(text) && !text.startsWith('(');
  typeTimer=setInterval(()=>{
    if(!typing){ clearInterval(typeTimer); return; }
    i++;
    el.textContent=text.slice(0,i);
    if(i%2===0) Sound.type();
    if(i>=text.length){ finishTyping(done); }
  }, speedMs());
}
function finishTyping(done){
  clearInterval(typeTimer); typing=false;
  $('dlg-text').textContent=fullText;
  if(done) done();
  if(autoMode){ setTimeout(()=>{ if(autoMode && !typing && !pendingChoice) advance(); }, 1600); }
}

/* ---------- переходы ---------- */
let pendingChoice=false;

function enterScene(id){
  if(id==='auto_final'){ showEnding(resolveEnding(S)); return; }
  const sc=SCENES[id];
  if(!sc) return;
  if(sc.ending){ showEnding(id); return; }

  S.sceneId=id; S.lineIdx=0; S.enteredFx=false;
  $('hud-location').textContent=sc.loc||'';
  $('hud-chapter').textContent=sc.chapter||'';
  if(sc.bg) setBackground(sc.bg);
  renderNextLine();
}

function sceneLines(){
  const sc=SCENES[S.sceneId];
  if(sc.dynamic) return dynLines(S.sceneId,S);
  return sc.lines;
}
function sceneChoices(){
  const sc=SCENES[S.sceneId];
  if(sc.dynamic) return dynChoices(S.sceneId,S);
  return sc.choices||[];
}

function renderNextLine(){
  const lines=sceneLines();
  if(S.lineIdx>=lines.length){ showChoices(); return; }
  const ln=lines[S.lineIdx++];
  if(ln.fx) ln.fx(S);
  const isNarr = ln.narr || !ln.sp;
  const spKey = ln.sp || 'voronov';
  $('dlg-name').textContent = isNarr? '' : CHARACTERS[spKey].name;
  $('dlg-name').style.color = isNarr? 'transparent' : (CHARACTERS[spKey]&&CHARACTERS[spKey].color||'var(--accent)');
  showCharacter(isNarr? null : spKey);
  const text = ln.t;
  $('dialogue').classList.remove('hidden');
  typeText(text, ()=>{});
}

function showChoices(){
  pendingChoice=true;
  const box=$('choices'); box.innerHTML=''; box.classList.remove('hidden');
  const list=sceneChoices().filter(c=>!c.show || c.show(S));
  list.forEach((c,idx)=>{
    const b=document.createElement('button'); b.className='choice';
    const locked = c.need && !c.need(S);
    let meta = c.cost? `<div class="choice-cost"><i>${c.cost}</i></div>`:'';
    if(locked) meta += `<div class="choice-lock">🔒 ${c.needLabel||'недостаточно условий'}</div>`;
    b.innerHTML=`<span class="choice-num">${idx+1}</span>
      <span class="choice-body">${c.text}${meta}</span>
      ${c.tag?`<span class="choice-tag">${c.tag}</span>`:''}`;
    b.disabled=locked;
    b.onclick=()=>pickChoice(c);
    box.appendChild(b);
  });
  if(!list.length){ // запасной выход
    const b=document.createElement('button'); b.className='choice';
    b.innerHTML='<span class="choice-num">→</span><span class="choice-body">Продолжить</span>';
    b.onclick=()=>enterScene('s8'); box.appendChild(b);
  }
}

function pickChoice(c){
  if(typing) return;
  pendingChoice=false;
  Sound.choose();
  logLine(S, `▸ ${c.text.replace(/«|»/g,'')}`);
  $('choices').classList.add('hidden');
  const prev=SCENES[S.sceneId];
  // однократные эффекты входа в текущую сцену (улики при осмотре и т.п.)
  if(prev && prev.fxOnEnter && !S.enteredFx){ S.enteredFx=true; prev.fxOnEnter(S); }
  // засчёт «осмотра объекта» для механики «два из трёх»
  if(prev && prev.countScene2) countScene2(S, c.goto);
  if(c.do) c.do(S);
  enterScene(c.goto);
}

function advance(){
  if(modalOpen()) return;
  if(pendingChoice) return;
  if(typing){ finishTyping(()=>{}); return; }
  renderNextLine();
}

/* ---------- финал ---------- */
const ENDINGS_ORDER=['end_clean','end_hanging','end_sold','end_against','end_compromise'];
function showEnding(id){
  const e=SCENES[id];
  $('screen-game').classList.remove('active');
  $('screen-ending').classList.add('active');
  $('ending-kicker').textContent=e.kicker;
  $('ending-title').textContent='«'+e.title+'»';
  $('ending-art').innerHTML=`<img src="${Art.bgRaw(e.bg)}" alt="">`;
  $('ending-text').textContent=e.text;
  Sound.ending();
  // пилюли итога: улики + союзники/противники
  const evNames=Object.keys(EVIDENCE_INFO).filter(k=>S.evidence[k]).map(k=>EVIDENCE_INFO[k][1]);
  const allies=[];
  if(trustVal(S,'krav')>=2) allies.push('Кравцов — союзник'); else if(trustVal(S,'krav')<=-1) allies.push('Кравцов — против вас');
  if(trustVal(S,'sasha')>=1) allies.push('Саша — на вашей стороне'); else if(S.flags.sasha_cold) allies.push('Саша отстранилась');
  if(S.flags.ruslan_memory) allies.push('Руслан — свидетель, не обвиняемый');
  if(S.flags.false_confession) allies.push('Руслан сломан «признанием»');
  $('ending-stats').innerHTML =
    (evNames.length?evNames.map(n=>`<span class="epill good">✓ ${n}</span>`).join(''):'<span class="epill bad">Улик не собрано</span>') +
    allies.map(a=>`<span class="epill">${a}</span>`).join('');
  // галерея финалов (localStorage)
  try{
    const g=JSON.parse(localStorage.getItem('pk_endings')||'{}'); g[id]=true;
    localStorage.setItem('pk_endings',JSON.stringify(g));
    const found=ENDINGS_ORDER.filter(x=>g[x]).length;
    $('endings-found').textContent=`Финалов открыто: ${found} из ${ENDINGS_ORDER.length}. Разные маршруты дают разную правду.`;
  }catch(err){ $('endings-found').textContent=''; }
}

/* ---------- модалки ---------- */
function modalOpen(){ return ['modal-evidence','modal-log','modal-menu'].some(id=>!$(id).classList.contains('hidden')); }
function openModal(id){ renderModal(id); $(id).classList.remove('hidden'); }
function closeModal(id){ $(id).classList.add('hidden'); }
function renderModal(id){
  if(id==='modal-evidence'){
    $('evidence-list').innerHTML=Object.keys(EVIDENCE_INFO).map(k=>{
      const [code,title,desc]=EVIDENCE_INFO[k]; const has=!!S.evidence[k];
      return `<div class="ev-item ${has?'':'ev-missing'}">
        <div class="ev-mark">${code}</div>
        <div><div class="ev-title">${has?title:'— не найдено —'}</div><div class="ev-desc">${has?desc:'Эта улика пока вне вашего доступа.'}</div></div></div>`; }).join('');
  }
  if(id==='modal-log') renderLog();
}

/* ---------- рестарт сцены ---------- */
function restartScene(){
  // откат к началу текущей «локации»: проще всего — к точке входа сцены
  const anchorMap={s1_body:'s1',s1_sasha:'s1',s1_krav:'s1',
    s2_body:'s2',s2_floor:'s2',s2_locker:'s2',s2_press:'s2',s2_back:'s2',
    s3_empathy:'s3',s3_pressure:'s3',s3_protocol:'s3',
    s4_timesheet:'s4',s4_pressure:'s4',s4_empathy:'s4',
    s5_empathy:'s5',s5_pressure:'s5',s5_seizure:'s5',
    s6_share:'s6',s6_alone:'s6',s6_deal:'s6',
    s7_showcase:'s7',s7_arrest:'s7',s7_alone_fail:'s7',s7_bluff:'s7',s7_bluff_win:'s7',s7_bluff_fail:'s7',s7_money:'s7',s7_lida_only:'s7',
    s8:'s8'};
  const target=anchorMap[S.sceneId]||S.sceneId;
  closeModalAll(); enterScene(target);
}
function closeModalAll(){ ['modal-evidence','modal-log','modal-menu'].forEach(closeModal); }

/* ---------- запуск новой игры ---------- */
function startGame(){
  S=newState();
  $('screen-title').classList.remove('active');
  $('screen-game').classList.add('active');
  updateClock(); updateStats();
  logLine(S,'<b>Ноябрь 1998. Порт Заречье.</b> Тело таможенного инспектора Антонова. У вас три часа.');
  enterScene('s1');
}

/* ---------- клавиатура ---------- */
document.addEventListener('keydown',e=>{
  if($('screen-title').classList.contains('active')){
    if(e.key==='Enter'||e.key===' ') startGame();
    return;
  }
  if($('screen-ending').classList.contains('active')){
    if(e.key==='Enter') startGame();
    return;
  }
  if(e.key==='Escape'){ modalOpen()? closeModalAll() : openModal('modal-menu'); return; }
  if(e.key.toLowerCase()==='e'||e.key==='у'){ modalOpen()?closeModalAll():openModal('modal-evidence'); return; }
  if(modalOpen()) return;
  if(pendingChoice){
    const n=parseInt(e.key,10);
    if(n>=1&&n<=4){ const btns=[...document.querySelectorAll('#choices .choice')];
      if(btns[n-1] && !btns[n-1].disabled) btns[n-1].click(); }
    return;
  }
  if(e.key==='Enter'||e.key===' '){ e.preventDefault(); advance(); }
});

/* ---------- кнопки ---------- */
$('btn-start').onclick=startGame;
$('dialogue').onclick=advance;
$('btn-skip').onclick=e=>{e.stopPropagation(); if(typing) finishTyping(()=>{});};
$('btn-auto').onclick=e=>{e.stopPropagation(); autoMode=!autoMode; e.target.classList.toggle('on',autoMode);};
$('btn-log').onclick=e=>{e.stopPropagation(); openModal('modal-log');};
$('btn-evidence').onclick=()=>openModal('modal-evidence');
$('btn-menu').onclick=()=>openModal('modal-menu');
document.querySelectorAll('.modal-close').forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m) closeModal(m.id);}));
$('mm-continue').onclick=()=>closeModal('modal-menu');
$('mm-restart-scene').onclick=restartScene;
$('mm-restart-game').onclick=()=>{closeModalAll(); startGame();};
$('mm-sound').onclick=e=>{ const on=Sound.toggle(); e.target.textContent=on?'вкл':'выкл'; };
$('btn-again').onclick=startGame;
$('btn-other-endings').onclick=()=>{ closeModalAll(); $('screen-ending').classList.remove('active'); $('screen-title').classList.add('active'); };

/* ---------- init ---------- */
buildClockPips();
S=newState();
updateClock(); updateStats();
$('img-voronov-title').src=Art.face('voronov');
