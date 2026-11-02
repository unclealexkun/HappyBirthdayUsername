/* Тест логики игры: симуляция всех маршрутов без браузера */
const fs=require('fs');
const path=__dirname+'/assets/js/';
const els={};
function mkEl(){ return {innerHTML:'',textContent:'',value:'3',style:{},classList:{add(){},remove(){},toggle(){},contains(){return true;}},dataset:{},setAttribute(){},appendChild(){},onclick:null,addEventListener(){},closest(){return mkEl();}}; }
const realDoc=global.document;
global.document={ getElementById:id=>{ if(id==='choices') return {classList:{add(){},remove(){}},innerHTML:'',appendChild(){}}; return (els[id]=els[id]||mkEl()); }, createElement:()=>mkEl(), createElementNS:()=>mkEl(), querySelectorAll:()=>[], addEventListener(){} };
global.window={ AudioContext:function(){ this.createOscillator=()=>({connect(){},start(){},stop(){},frequency:{},type:''}); this.createGain=()=>({connect(){},gain:{value:0,exponentialRampToValueAtTime(){}}}); this.destination={}; this.currentTime=0; } };
global.setInterval=(f,d)=>{return 0}; global.clearInterval=()=>{}; global.setTimeout=(f,d)=>0;
global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v}};

const vm=require('vm');
const src=[fs.readFileSync(path+'story.js','utf8'),fs.readFileSync(path+'art.js','utf8'),fs.readFileSync(path+'engine.js','utf8')].join('\n;\n');
// function-декларации из скриптового скоупа eval пробрасываем в глобальный
const script=new vm.Script(src+'\n;globalThis.SCENES=SCENES;globalThis.CHARACTERS=CHARACTERS;globalThis.EVIDENCE_INFO=EVIDENCE_INFO;globalThis.Art=Art;globalThis.newState=newState;globalThis.updateClock=updateClock;globalThis.dynChoices=dynChoices;globalThis.dynLines=dynLines;globalThis.countScene2=countScene2;globalThis.resolveEnding=resolveEnding;globalThis.trustVal=trustVal;');
script.runInThisContext();
globalThis.__setS=x=>{S=x}; globalThis.__getS=()=>S; // мост к let S из скриптового скоупа

let fails=0;
function run(picks,label){
  __setS(newState()); S=__getS(); S.sceneId=S.startScene; updateClock();
  let guard=0;
  while(guard++<120){
    const S=__getS(); const sc=SCENES[S.sceneId];
    if(!sc){ console.log(label,'=> БРОКЕННАЯ СЦЕНА',S.sceneId); fails++; return null; }
    if(sc.ending){ console.log(label,'=> «'+sc.title+'» (часы:'+S.hours+', улики:'+Object.keys(S.evidence).join(',')+')'); return S.sceneId; }
    const ch=(sc.dynamic?dynChoices(S.sceneId,S):(sc.choices||[])).filter(c=>!c.show||c.show(S));
    const locked=c=>!!(c.need&&!c.need(S));
    const pickIdx=picks[S.sceneId];
    if(pickIdx===undefined){ console.log(label,'=> НЕТ ПУТИ для',S.sceneId,'| варианты:',ch.map((c,i)=>i+':'+c.text.slice(0,45)+(locked(c)?' [LOCK]':'')).join(' || ')); fails++; return null; }
    const c=ch[pickIdx];
    if(!c||locked(c)){ console.log(label,'=> заблокирован выбор в',S.sceneId); fails++; return null; }
    const prev=SCENES[S.sceneId];
    pendingChoice=false;
    if(prev&&prev.fxOnEnter&&!S.enteredFx){S.enteredFx=true;prev.fxOnEnter(S);}
    if(prev&&prev.countScene2) countScene2(S,c.goto);
    if(c.do)c.do(S);
    if(c.goto==='auto_final'){ const e=resolveEnding(S); console.log(label,'=> «'+SCENES[e].title+'» (через рапорт, часы:'+S.hours+', улики:'+Object.keys(S.evidence).join(',')+')'); return e; }
    S.sceneId=c.goto; S.lineIdx=0; S.enteredFx=false; __setS(S);
  }
  console.log(label,'=> ЗАЦИКЛИЛОСЬ'); fails++; return null;
}

// 1) лучший финал через Катю+Лиду
run({'s1':1,'s2':1,'s2_back':2,'s3':0,'s4':0,'s5':0,'s6':0,'s7':0,'s7_showcase':0,'s7_arrest':0,'s8':0},'ЛУЧШИЙ(катя+лида)');
// 2) лучший через сейф (блеф успешный за счёт E_СЛЕДЫ): s2 пол+тело, дальше табель... времени не хватит на всё — проверим реалистичный путь
run({'s1':0,'s2':1,'s2_back':0,'s3':0,'s4':0,'s5':0,'s6':0,'s7':1,'s8':0},'СЕЙФ-ПУТЬ');
// 3) быстрый висяк:同意 + шкафчик-давление
run({'s1':2,'s2':2,'s2_locker':0,'s3':2,'s4':1,'s5':1,'s6':1,'s7':1,'s8':0},'ВИСЯК');
// 4) продано
run({'s1':0,'s2':0,'s2_back':1,'s3':1,'s4':2,'s5':1,'s6':2,'s7':3},'ПРОДАНО');
// 5) один против всех
run({'s1':2,'s2':1,'s2_back':0,'s3':1,'s4':1,'s5':1,'s6':1,'s7':1,'s8':0},'ОДИН');
// 6) компромисс (сдать Лиду)
run({'s1':1,'s2':0,'s2_back':1,'s3':0,'s4':0,'s5':0,'s6':0,'s7':2,'s8':0},'КОМПРОМИСС');
// 7) время вышло -> висяк
run({'s1':0,'s2':0,'s2_back':1,'s3':0,'s4':0,'s5':0,'s6':1,'s7':1,'s8':0},'ВРЕМЯ-ВЫШЛО');

// проверка генерации арта
for(const b of ['warehouse_night','warehouse_close','warehouse_raindoor','dispatch','cell','office_kravtsov','customs','station_night','corridor','tarasov_office','safe_open','arrest','report','morning_port','archive']){
  const u=Art.bgRaw(b);
  if(!u.startsWith('data:image/svg+xml')){ console.log('АРТ FAIL',b); fails++; }
}
for(const k of Object.keys(CHARACTERS)){
  const u=Art.face(k);
  if(!u.includes('svg')){ console.log('ПОРТРЕТ FAIL',k); fails++; }
}
// все goto валидны
(function(){
  function checkGoto(g,from){ if(!SCENES[g] && g!=='auto_final'){ console.log('Битой ссылочка: '+from+' -> '+g); fails++; } }
  for(const id in SCENES){
    const sc=SCENES[id]; if(sc.ending) continue;
    (sc.choices||[]).forEach(c=>checkGoto(c.goto,id));
  }
  dynChoices('s2',{scene2Count:0,scene2Used:{}}).forEach(c=>checkGoto(c.goto,'s2dyn'));
  dynChoices('s2',{scene2Count:2}).forEach(c=>checkGoto(c.goto,'s2dyn2'));
})();

console.log(fails===0?'ALL TESTS PASSED':'TESTS FAILED: '+fails);
process.exit(fails===0?0:1);
