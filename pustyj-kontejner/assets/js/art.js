/* =====================================================================
   ПУСТОЙ КОНТЕЙНЕР · art.js — процедурная генерация визуала (SVG data-URI)
   Фоны и портреты рисуются кодом: игре не нужны внешние картинки.
   ===================================================================== */

const Art = (() => {

  /* ---------- утилиты ---------- */
  let seed = 7;
  function rnd(){ seed = (seed*9301+49297)%233280; return seed/233280; }
  function reseed(s){ seed = s; }
  const uri = svg => 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace(/\s{2,}/g,' ')) + '")';
  const raw = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace(/\s{2,}/g,' '));

  /* общий шум/плёнка поверх фона */
  function grain(id){ return `
    <filter id="grain${id}"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.6  0 0 0 0 0.65  0 0 0 0 0.7  0 0 0 0.06 0"/></filter>`; }
  const grainRect = id => `<rect width="1600" height="900" filter="url(#grain${id})"/>`;

  function vignette(op=0.75){ return `<radialGradient id="vig" cx="50%" cy="42%" r="75%">
      <stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="${op}"/></radialGradient>
      <rect width="1600" height="900" fill="url(#vig)"/>`; }

  function rainLines(x0,x1,y0,y1,n,color='rgba(180,200,220,.35)'){
    let s=''; reseed(42);
    for(let i=0;i<n;i++){ const x=x0+rnd()*(x1-x0), y=y0+rnd()*(y1-y0), l=14+rnd()*26;
      s+=`<line x1="${x}" y1="${y}" x2="${x-4}" y2="${y+l}" stroke="${color}" stroke-width="1"/>`; }
    return s; }

  function crane(x,y,sc,color){ return `<g transform="translate(${x},${y}) scale(${sc})" stroke="${color}" fill="none" stroke-width="4">
      <line x1="0" y1="0" x2="0" y2="-160"/><line x1="-70" y1="-160" x2="120" y2="-160"/>
      <line x1="0" y1="-160" x2="-30" y2="-110"/><line x1="0" y1="-160" x2="40" y2="-110"/>
      <line x1="120" y1="-160" x2="120" y2="-90"/><rect x="112" y="-90" width="16" height="12" fill="${color}"/></g>`; }

  function containers(y, palette){
    let s=''; reseed(11);
    for(let i=0;i<7;i++){ const x=-40+i*240+rnd()*40, w=170+rnd()*60, h=70+rnd()*50;
      const c=palette[Math.floor(rnd()*palette.length)];
      s+=`<rect x="${x}" y="${y-h}" width="${w}" height="${h}" fill="${c}" stroke="#0a0e12" stroke-width="2"/>`;
      for(let k=1;k<8;k++) s+=`<line x1="${x+k*w/8}" y1="${y-h}" x2="${x+k*w/8}" y2="${y}" stroke="rgba(0,0,0,.25)" stroke-width="3"/>`;
      if(rnd()>0.5) s+=`<rect x="${x+w*0.2}" y="${y-h-((h*0.8)|0)}" width="${w}" height="${h}" fill="${palette[(i+1)%palette.length]}" opacity=".9" stroke="#0a0e12" stroke-width="2"/>`; }
    return s; }

  /* ---------- ФОН 1: склад ночью (интерьер, луч света, брезент) ---------- */
  function bgWarehouseNight(){ return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
    <defs>${grain('wn')}
      <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#141b23"/><stop offset="1" stop-color="#0a0f15"/></linearGradient>
      <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d252e"/><stop offset="1" stop-color="#0c1116"/></linearGradient>
      <linearGradient id="beam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe9b0" stop-opacity=".22"/><stop offset="1" stop-color="#ffe9b0" stop-opacity="0"/></linearGradient>
      <radialGradient id="lamp" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffdf9e" stop-opacity=".9"/><stop offset="1" stop-color="#ffdf9e" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="1600" height="620" fill="url(#wall)"/>
    <rect y="600" width="1600" height="300" fill="url(#floor)"/>
    ${[...Array(14)].map((_,i)=>`<line x1="${i*120}" y1="0" x2="${i*120}" y2="620" stroke="rgba(0,0,0,.35)" stroke-width="6"/>`).join('')}
    ${[...Array(6)].map((_,i)=>`<rect x="${120+i*250}" y="120" width="180" height="330" fill="#10171e" stroke="#232e39" stroke-width="4"/>
       <line x1="${120+i*250}" y1="230" x2="${300+i*250}" y2="230" stroke="#232e39" stroke-width="4"/>`).join('')}
    <polygon points="1150,0 1600,0 1250,640 900,640" fill="url(#beam)"/>
    <circle cx="1230" cy="60" r="90" fill="url(#lamp)"/>
    <ellipse cx="1050" cy="720" rx="330" ry="90" fill="#241f16" opacity=".55"/>
    <path d="M820 700 q120 -70 300 -30 q140 30 190 60 q-60 60 -260 60 q-180 0 -230 -90z" fill="#39434d" stroke="#20262c" stroke-width="4"/>
    <path d="M880 690 q90 -40 220 -14 M900 720 q120 -30 260 -6" stroke="#2b333b" stroke-width="5" fill="none"/>
    <ellipse cx="1120" cy="762" rx="60" ry="14" fill="#5d1f1f" opacity=".5"/>
    ${containers(640,['#233038','#1c2a33'])}
    <rect width="1600" height="900" fill="rgba(10,16,24,.35)"/>
    ${vignette()}${grainRect('wn')}</svg>`; }

  /* ---------- ФОН 2: тело крупно ---------- */
  function bgWarehouseClose(){ return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
    <defs>${grain('wc')}
      <linearGradient id="tarp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a545e"/><stop offset="1" stop-color="#262d34"/></linearGradient>
      <radialGradient id="glow2" cx="35%" cy="30%" r="60%"><stop offset="0" stop-color="#ffe9b0" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="1600" height="900" fill="#0b1016"/>
    <rect width="1600" height="900" fill="url(#glow2)"/>
    <path d="M120 880 L260 380 Q420 300 700 330 Q1050 360 1300 480 L1480 880 Z" fill="url(#tarp)" stroke="#1b2127" stroke-width="6"/>
    <path d="M300 700 Q560 620 900 660 M340 780 Q640 700 1080 760 M420 520 Q640 470 940 500" stroke="#1e252b" stroke-width="8" fill="none"/>
    <path d="M120 880 L260 380 Q330 360 380 380 L300 880 Z" fill="#171d24"/>
    <ellipse cx="1180" cy="840" rx="180" ry="34" fill="#5d1f1f" opacity=".4"/>
    <rect x="0" y="0" width="1600" height="120" fill="#0a0e13"/>
    ${vignette(.85)}${grainRect('wc')}</svg>`; }

  /* ---------- ФОН 3: служебный вход под дождём ---------- */
  function bgRainDoor(){ return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
    <defs>${grain('rd')}
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a2430"/><stop offset="1" stop-color="#0a0f16"/></linearGradient>
      <linearGradient id="asf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#131a22"/><stop offset="1" stop-color="#070b10"/></linearGradient>
      <radialGradient id="doorl" cx="50%" cy="40%" r="50%"><stop offset="0" stop-color="#ffd98c" stop-opacity=".5"/><stop offset="1" stop-color="#ffd98c" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="1600" height="560" fill="url(#sky)"/>
    <rect y="540" width="1600" height="360" fill="url(#asf)"/>
    ${crane(300,540,.9,'#2c3947')}${crane(1300,540,.7,'#25313d')}
    <rect x="620" y="220" width="360" height="330" fill="#101820" stroke="#2a3644" stroke-width="5"/>
    <rect x="700" y="300" width="200" height="250" fill="#06090d" stroke="#33404e" stroke-width="4"/>
    <rect x="700" y="300" width="200" height="250" fill="url(#doorl)"/>
    <circle cx="800" cy="255" r="26" fill="#ffe9b0" opacity=".9"/>
    <ellipse cx="800" cy="600" rx="260" ry="60" fill="#ffd98c" opacity=".08"/>
    <rect x="1000" y="430" width="240" height="120" rx="14" fill="#1a222c" stroke="#2c3746" stroke-width="4"/>
    <circle cx="1040" cy="548" r="20" fill="#05080c"/><circle cx="1200" cy="548" r="20" fill="#05080c"/>
    <rect x="1030" y="450" width="180" height="44" fill="#0d131a"/>
    <path d="M150 880 L520 640 M200 890 L600 660" stroke="#2a3542" stroke-width="10" opacity=".6"/>
    ${rainLines(0,1600,0,880,120)}
    ${vignette(.8)}${grainRect('rd')}</svg>`; }

  /* ---------- ФОН 4: диспетчерская ---------- */
  function bgDispatch(){ return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
    <defs>${grain('dp')}
      <linearGradient id="room" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c222b"/><stop offset="1" stop-color="#0e131a"/></linearGradient>
      <radialGradient id="scr" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#7fd4a8" stop-opacity=".5"/><stop offset="1" stop-color="#7fd4a8" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#room)"/>
    <circle cx="1150" cy="300" r="230" fill="#0a1420" stroke="#39485c" stroke-width="8"/>
    <circle cx="1150" cy="300" r="230" fill="url(#scr)" opacity=".12"/>
    ${rainLines(950,1350,100,500,40,'rgba(160,190,220,.25)')}
    <rect x="80" y="560" width="760" height="120" rx="8" fill="#232b34" stroke="#3c4652" stroke-width="4"/>
    ${[...Array(10)].map((_,i)=>`<circle cx="${140+i*70}" cy="600" r="16" fill="${i%3? '#10161c':'#8e2f2f'}" stroke="#4b5866" stroke-width="3"/>`).join('')}
    ${[...Array(6)].map((_,i)=>`<rect x="${150+i*110}" y="640" width="70" height="24" fill="#0f151b" stroke="#4b5866" stroke-width="2"/>`).join('')}
    <rect x="900" y="600" width="520" height="220" fill="#1a2129" stroke="#333d49" stroke-width="4"/>
    <rect x="930" y="630" width="200" height="120" fill="#0c1117"/>
    <text x="950" y="700" font-family="monospace" font-size="34" fill="#7fd4a8" opacity=".8">23:07</text>
    <rect x="60" y="120" width="4" height="440" fill="#3c4652"/>
    <circle cx="62" cy="120" r="34" fill="#ffdf9e" opacity=".85"/>
    <ellipse cx="120" cy="820" rx="700" ry="40" fill="#000" opacity=".4"/>
    ${vignette(.72)}${grainRect('dp')}</svg>`; }

  /* ---------- ФОН 5: обезьянник ---------- */
  function bgCell(){ return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
    <defs>${grain('cl')}
      <linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#232a2e"/><stop offset="1" stop-color="#12171b"/></linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#w)"/>
    <rect y="700" width="1600" height="200" fill="#0d1114"/>
    <rect x="0" y="0" width="1600" height="60" fill="#1a2024"/>
    <rect x="620" y="60" width="14" height="640" fill="#39434a"/>
    ${[...Array(9)].map((_,i)=>`<rect x="${180+i*150}" y="60" width="10" height="640" fill="#39434a"/>`).join('')}
    <rect x="120" y="470" width="1360" height="26" fill="#2c343a"/>
    <rect x="120" y="496" width="1360" height="10" fill="#1c2226"/>
    <ellipse cx="800" cy="790" rx="620" ry="46" fill="#000" opacity=".45"/>
    <rect x="1300" y="120" width="120" height="180" fill="#0a0e11" stroke="#39434a" stroke-width="6"/>
    <circle cx="1360" cy="150" r="26" fill="#ffdf9e" opacity=".5"/>
    <rect x="150" y="140" width="260" height="90" fill="#1a2024" stroke="#39434a" stroke-width="4"/>
    <text x="175" y="200" font-family="monospace" font-size="40" fill="#6c7a86">ОБЕЗЬЯННИК №2</text>
    ${vignette(.85)}${grainRect('cl')}</svg>`; }

  /* ---------- ФОН 6: кабинет (Кравцов/канцелярия) ---------- */
  function bgOffice(){ return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
    <defs>${grain('of')}
      <linearGradient id="ow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2620"/><stop offset="1" stop-color="#16130f"/></linearGradient>
      <radialGradient id="desk" cx="50%" cy="30%" r="60%"><stop offset="0" stop-color="#ffd98c" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#ow)"/>
    <rect x="120" y="120" width="420" height="300" fill="#0d1622" stroke="#4a4238" stroke-width="8"/>
    ${[...Array(5)].map((_,i)=>`<line x1="${120}" y1="${150+i*60}" x2="540" y2="${150+i*60}" stroke="#4a4238" stroke-width="3" opacity=".6"/>`).join('')}
    ${crane(300,420,.55,'#22303e')}${crane(470,420,.4,'#1c2836')}
    <rect x="700" y="80" width="700" height="380" fill="#241f18" stroke="#4a4238" stroke-width="6"/>
    ${[...Array(4)].map((_,r)=>`<rect x="${730}" y="${110+r*90}" width="640" height="70" fill="#2f2820"/>
      ${[...Array(7)].map((_,i)=>`<rect x="${740+i*88}" y="${115+r*90}" width="60" height="60" fill="${['#6b5a3e','#57492f','#7a6a4a','#4e4433'][i%4]}"/>`).join('')}`).join('')}
    <rect x="120" y="620" width="1360" height="40" fill="#3a2f22" stroke="#524434" stroke-width="4"/>
    <rect x="120" y="660" width="1360" height="180" fill="#2b2318"/>
    <rect x="980" y="520" width="180" height="100" fill="#1d2530" stroke="#3a4656" stroke-width="4"/>
    <rect x="1000" y="540" width="140" height="26" fill="#0d141c"/><rect x="1000" y="576" width="140" height="26" fill="#0d141c"/>
    <circle cx="300" cy="560" r="30" fill="#ffdf9e" opacity=".8"/>
    <rect width="1600" height="900" fill="url(#desk)"/>
    ${vignette(.75)}${grainRect('of')}</svg>`; }

  /* ---------- ФОН 7: таможня ---------- */
  function bgCustoms(){ return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
    <defs>${grain('cu')}
      <linearGradient id="cw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26231c"/><stop offset="1" stop-color="#14120e"/></linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#cw)"/>
    <rect x="80" y="80" width="1440" height="360" fill="#1d1a14" stroke="#453d2e" stroke-width="5"/>
    ${[...Array(6)].map((_,i)=>`<rect x="${110+i*235}" y="110" width="200" height="300" fill="#26211a"/>
      ${[...Array(5)].map((_,k)=>`<rect x="${120+i*235}" y="${120+k*58}" width="180" height="46" fill="${['#8a7c5c','#6f6349','#948460','#5d5340'][ (i+k)%4 ]}" stroke="#332c20" stroke-width="2"/>`).join('')}`).join('')}
    <rect x="120" y="600" width="1360" height="34" fill="#3b3122" stroke="#57492f" stroke-width="4"/>
    <rect x="120" y="634" width="1360" height="200" fill="#241e15"/>
    ${[...Array(14)].map((_,i)=>`<rect x="${150+i*95}" y="${560+(i%3)*14}" width="70" height="40" fill="#d9cba5" opacity=".85" transform="rotate(${-8+(i%5)*4} ${185+i*95} 580)"/>`).join('')}
    <circle cx="1250" cy="500" r="26" fill="#ffdf9e" opacity=".7"/>
    <ellipse cx="1250" cy="600" rx="180" ry="60" fill="#ffd98c" opacity=".07"/>
    ${vignette(.78)}${grainRect('cu')}</svg>`; }

  /* ---------- ФОН 8: дежурная часть ---------- */
  function bgStation(){ return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
    <defs>${grain('st')}
      <linearGradient id="sw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2530"/><stop offset="1" stop-color="#0c1219"/></linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#sw)"/>
    <rect y="640" width="1600" height="260" fill="#10161d"/>
    <rect x="100" y="120" width="560" height="330" fill="#131b24" stroke="#31404f" stroke-width="6"/>
    ${[...Array(12)].map((_,i)=>`<rect x="${130+ (i%4)*130}" y="${150+Math.floor(i/4)*100}" width="110" height="80" fill="${i%5?'#1d2835':'#8e2f2f'}" opacity=".8"/>`).join('')}
    <rect x="760" y="560" width="700" height="36" fill="#2a3644"/>
    <rect x="760" y="596" width="700" height="240" fill="#1a232e"/>
    <rect x="980" y="470" width="120" height="70" rx="12" fill="#39434d" stroke="#59676f" stroke-width="4"/>
    <path d="M1000 470 q40 -60 80 0" fill="none" stroke="#59676f" stroke-width="6"/>
    <line x1="1040" y1="540" x2="1040" y2="560" stroke="#59676f" stroke-width="5"/>
    <circle cx="300" cy="90" r="30" fill="#ffdf9e" opacity=".8"/>
    <circle cx="1300" cy="90" r="30" fill="#ffdf9e" opacity=".5"/>
    <rect x="120" y="640" width="380" height="150" fill="#141c25" stroke="#31404f" stroke-width="4"/>
    <text x="150" y="700" font-family="monospace" font-size="30" fill="#7fa8c8">ДЕЖУРНАЯ ЧАСТЬ</text>
    <text x="150" y="750" font-family="monospace" font-size="30" fill="#8e2f2f">03:47 · НОЯБРЬ</text>
    ${vignette(.75)}${grainRect('st')}</svg>`; }

  /* ---------- ФОН 9: коридор порта ---------- */
  function bgCorridor(){ return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
    <defs>${grain('co')}
      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#131a22"/><stop offset="1" stop-color="#05080c"/></linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#cg)"/>
    <polygon points="0,900 640,420 960,420 1600,900" fill="#0d1319"/>
    <polygon points="0,0 640,420 960,420 1600,0" fill="#101820"/>
    ${[...Array(6)].map((_,i)=>{const t=i/6, x1=t*640, y1=t*420, x2=1600-t*640;
      return `<line x1="${x1}" y1="${y1}" x2="${x1}" y2="900" stroke="#2a3542" stroke-width="${6-i}"/>
              <line x1="${x2}" y1="${y1}" x2="${x2}" y2="900" stroke="#2a3542" stroke-width="${6-i}"/>`;}).join('')}
    <rect x="740" y="360" width="120" height="120" fill="#ffd98c" opacity=".25"/>
    <circle cx="800" cy="420" r="60" fill="#ffdf9e" opacity=".35"/>
    ${rainLines(640,960,420,560,30,'rgba(180,200,220,.2)')}
    ${vignette(.8)}${grainRect('co')}</svg>`; }

  /* ---------- ФОН 10: кабинет Тарасова ---------- */
  function bgTarasov(){ return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
    <defs>${grain('ta')}
      <linearGradient id="tw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e2a20"/><stop offset="1" stop-color="#171410"/></linearGradient>
      <radialGradient id="tl" cx="50%" cy="30%" r="60%"><stop offset="0" stop-color="#ffe9b0" stop-opacity=".3"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#tw)"/>
    <rect x="110" y="90" width="380" height="290" fill="#0c1622" stroke="#57492f" stroke-width="8"/>
    ${crane(240,380,.6,'#22303e')}
    <rect x="620" y="120" width="120" height="170" fill="#6b5a3e" stroke="#8a7449" stroke-width="6"/>
    <circle cx="680" cy="180" r="34" fill="#caa96a" opacity=".9"/>
    <rect x="1180" y="330" width="260" height="330" fill="#232c36" stroke="#3d4c5c" stroke-width="8"/>
    <circle cx="1400" cy="490" r="16" fill="#8fa8c8"/>
    <line x1="1200" y1="400" x2="1420" y2="400" stroke="#3d4c5c" stroke-width="5"/>
    <line x1="1200" y1="470" x2="1420" y2="470" stroke="#3d4c5c" stroke-width="5"/>
    <rect x="120" y="640" width="1360" height="44" fill="#4a3c28" stroke="#6b5a3e" stroke-width="5"/>
    <rect x="120" y="684" width="1360" height="216" fill="#2e2618"/>
    <path d="M980 560 q60 -80 120 0 z" fill="#4a4438" stroke="#6b6250" stroke-width="4"/>
    <circle cx="1040" cy="560" r="46" fill="#5a4a30"/>
    <rect x="300" y="520" width="150" height="120" fill="#3a3126" stroke="#57492f" stroke-width="4"/>
    <circle cx="375" cy="470" r="26" fill="#ffdf9e" opacity=".85"/>
    <rect width="1600" height="900" fill="url(#tl)"/>
    ${vignette(.72)}${grainRect('ta')}</svg>`; }

  /* ---------- ФОН 11: сейф открыт ---------- */
  function bgSafe(){ return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
    <defs>${grain('sf')}
      <linearGradient id="sb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#242c34"/><stop offset="1" stop-color="#0d1218"/></linearGradient>
      <radialGradient id="sg" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="#ffe9b0" stop-opacity=".4"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#sb)"/>
    <rect x="420" y="140" width="760" height="640" fill="#1a222a" stroke="#3d4c5c" stroke-width="14"/>
    <rect x="470" y="190" width="660" height="540" fill="#0a0e13"/>
    ${[...Array(3)].map((_,r)=>`<rect x="${500}" y="${230+r*160}" width="600" height="120" fill="#141b22" stroke="#2c3742" stroke-width="4"/>
      ${[...Array(5)].map((_,i)=>`<rect x="${520+i*112}" y="${240+r*160}" width="90" height="100" fill="${['#8a7c5c','#6f6349','#948460','#5d5340','#7a6a4a'][i]}"/>`).join('')}`).join('')}
    <rect x="1180" y="140" width="120" height="640" rx="10" fill="#2c3742" stroke="#4b5866" stroke-width="6"/>
    <circle cx="1240" cy="470" r="44" fill="none" stroke="#8fa8c8" stroke-width="10"/>
    <line x1="1240" y1="426" x2="1240" y2="470" stroke="#8fa8c8" stroke-width="8"/>
    <rect width="1600" height="900" fill="url(#sg)"/>
    ${vignette(.7)}${grainRect('sf')}</svg>`; }

  /* ---------- ФОН 12: арест ---------- */
  function bgArrest(){ return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
    <defs>${grain('ar')}
      <linearGradient id="ab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#182130"/><stop offset="1" stop-color="#090d14"/></linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#ab)"/>
    <ellipse cx="800" cy="760" rx="640" ry="90" fill="#0e1420"/>
    <g transform="translate(760,300)">
      <path d="M0 0 q40 -60 90 -20 l30 90 -40 200 -60 -10 -20 -120 -50 130 -60 -10 60 -180z" fill="#1f2a38" stroke="#3d4c5c" stroke-width="5"/>
      <circle cx="45" cy="-50" r="34" fill="#2a3646" stroke="#3d4c5c" stroke-width="4"/>
    </g>
    <g transform="translate(940,320)">
      <path d="M0 0 q40 -50 80 -10 l20 90 -30 190 -60 -8 -14 -110 -46 118 -56 -8 56 -170z" fill="#242e3c" stroke="#3d4c5c" stroke-width="5"/>
      <circle cx="40" cy="-44" r="32" fill="#31404f" stroke="#3d4c5c" stroke-width="4"/>
    </g>
    <path d="M830 470 q30 26 60 0" stroke="#8fa8c8" stroke-width="6" fill="none"/>
    <circle cx="300" cy="160" r="60" fill="#8e2f2f" opacity=".35"/>
    <circle cx="300" cy="160" r="26" fill="#ffdf9e" opacity=".8"/>
    ${rainLines(0,1600,0,700,60,'rgba(150,180,210,.18)')}
    ${vignette(.78)}${grainRect('ar')}</svg>`; }

  /* ---------- ФОН 13: рапорт / кабинет 9 ---------- */
  function bgReport(){ return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
    <defs>${grain('rp')}
      <linearGradient id="rw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#20262e"/><stop offset="1" stop-color="#0e1218"/></linearGradient>
      <radialGradient id="green" cx="50%" cy="35%" r="45%"><stop offset="0" stop-color="#bfe8c8" stop-opacity=".3"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#rw)"/>
    <rect x="900" y="100" width="520" height="330" fill="#101a26" stroke="#31404f" stroke-width="6"/>
    <rect x="900" y="100" width="520" height="330" fill="#2a3b52" opacity=".4"/>
    <circle cx="1250" cy="220" r="46" fill="#e8e4da" opacity=".5"/>
    ${crane(1050,430,.7,'#22303e')}${crane(1330,430,.5,'#1c2836')}
    <rect x="60" y="560" width="1480" height="46" fill="#3a2f22" stroke="#57492f" stroke-width="5"/>
    <rect x="60" y="606" width="1480" height="294" fill="#241e15"/>
    <rect x="300" y="470" width="360" height="110" fill="#e8e4da" opacity=".92"/>
    <rect x="330" y="486" width="300" height="8" fill="#8d97a3"/><rect x="330" y="506" width="260" height="8" fill="#8d97a3"/><rect x="330" y="526" width="300" height="8" fill="#8d97a3"/><rect x="330" y="546" width="180" height="8" fill="#8d97a3"/>
    <path d="M820 430 h180 v60 h-180z M840 490 v40 M980 490 v40" fill="#2c343a" stroke="#4b5866" stroke-width="6"/>
    <path d="M360 300 q120 -60 240 0 l-20 90 h-200z" fill="#3f6b47" stroke="#557a5c" stroke-width="5"/>
    <circle cx="480" cy="420" r="18" fill="#ffdf9e" opacity=".9"/>
    <rect width="1600" height="900" fill="url(#green)"/>
    ${vignette(.7)}${grainRect('rp')}</svg>`; }

  /* ---------- ФОН 14: утро в порту ---------- */
  function bgMorning(){ return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
    <defs>${grain('mp')}
      <linearGradient id="msky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a6a7e"/><stop offset=".6" stop-color="#c9a26a"/><stop offset="1" stop-color="#e8cf9a"/></linearGradient>
      <linearGradient id="msea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a8a9a"/><stop offset="1" stop-color="#3a4a5a"/></linearGradient>
    </defs>
    <rect width="1600" height="620" fill="url(#msky)"/>
    <circle cx="1150" cy="480" r="70" fill="#ffe9b0"/>
    <rect y="600" width="1600" height="300" fill="url(#msea)"/>
    ${[...Array(10)].map((_,i)=>`<line x1="${i*170}" y1="640" x2="${i*170+120}" y2="640" stroke="#e8cf9a" stroke-width="3" opacity=".5"/>`).join('')}
    ${crane(260,600,1.1,'#2c3947')}${crane(700,600,.9,'#25313d')}${crane(1350,600,1.2,'#2c3947')}
    ${containers(620,['#8a5a3e','#6f4a32','#94643f'])}
    <rect x="60" y="700" width="300" height="90" rx="10" fill="#22303e" opacity=".8"/>
    <rect width="1600" height="900" fill="rgba(230,190,120,.08)"/>
    ${vignette(.5)}${grainRect('mp')}</svg>`; }

  /* ---------- ФОН 15: архив ---------- */
  function bgArchive(){ return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
    <defs>${grain('ax')}
      <linearGradient id="aw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#241f1a"/><stop offset="1" stop-color="#12100c"/></linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#aw)"/>
    ${[...Array(4)].map((_,i)=>`<rect x="${60+i*390}" y="80" width="330" height="760" fill="#1a1611" stroke="#3a3126" stroke-width="6"/>
      ${[...Array(9)].map((_,k)=>`<rect x="${70+i*390}" y="${110+k*80}" width="310" height="66" fill="#241e17"/>
        ${[...Array(8)].map((_,j)=>`<rect x="${78+i*390+j*38}" y="${114+k*80}" width="30" height="58" fill="${['#8a7c5c','#6f6349','#948460','#5d5340'][(j+k)%4]}"/>`).join('')}`).join('')}`).join('')}
    <rect x="640" y="300" width="320" height="500" fill="#0c0a08" opacity=".55"/>
    <circle cx="800" cy="260" r="24" fill="#ffdf9e" opacity=".6"/>
    <ellipse cx="800" cy="820" rx="260" ry="40" fill="#000" opacity=".5"/>
    ${vignette(.85)}${grainRect('ax')}</svg>`; }

  /* ================= ПОРТРЕТЫ ================= */
  // params: skin, hair, cloth, accent, mood(brows), glasses, hat, beard, lips
  function portrait(o){
    const {skin='#d8b28f',hair='#3a2e24',cloth='#2a3646',accent='#8e2f2f',mood=0,glasses=false,hat=false,beard=false,shirt='#d9d3c6',bgc='#141b23',name=''}=o;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560">
      <defs><linearGradient id="pb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bgc}"/><stop offset="1" stop-color="#0a0e13"/></linearGradient>
      <radialGradient id="pl" cx="35%" cy="25%" r="70%"><stop offset="0" stop-color="#ffe9b0" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>
      <rect width="400" height="560" fill="url(#pb)"/>
      <rect width="400" height="560" fill="url(#pl)"/>
      <!-- плечи -->
      <path d="M40 560 Q60 430 140 400 L200 380 L260 400 Q340 430 360 560 Z" fill="${cloth}"/>
      <path d="M170 396 L200 470 L230 396 L200 380Z" fill="${shirt}"/>
      <path d="M150 404 L200 470 L178 400Z" fill="${accent}"/><path d="M250 404 L200 470 L222 400Z" fill="${accent}"/>
      <!-- шея -->
      <rect x="176" y="330" width="48" height="70" rx="18" fill="${skin}"/>
      <path d="M176 350 q24 22 48 0 v20 q-24 16 -48 0z" fill="rgba(0,0,0,.18)"/>
      <!-- голова -->
      <ellipse cx="200" cy="230" rx="86" ry="104" fill="${skin}"/>
      <path d="M114 230 q0 104 86 104 q86 0 86 -104" fill="none"/>
      <!-- волосы -->
      ${hat ? `<path d="M96 190 Q200 60 304 190 L304 160 Q200 40 96 160 Z" fill="#2c3746"/>
               <path d="M96 190 Q200 120 304 190 Q200 168 96 190Z" fill="#22303e"/>
               <rect x="150" y="150" width="100" height="34" rx="6" fill="${accent}"/>` : ''}
      ${!hat && hair ? `<path d="M114 210 Q120 96 200 96 Q280 96 286 210 Q280 150 240 140 Q200 128 160 140 Q120 150 114 210Z" fill="${hair}"/>` : ''}
      ${beard ? `<path d="M130 260 Q200 360 270 260 Q270 330 200 344 Q130 330 130 260Z" fill="${hair}" opacity=".9"/>` : ''}
      <!-- брови -->
      <path d="M148 ${196+mood*6} q22 ${-8-mood*4} 44 0" stroke="${hair}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M208 ${196+mood*6} q22 ${-8-mood*4} 44 0" stroke="${hair}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <!-- глаза -->
      <ellipse cx="170" cy="218" rx="13" ry="7" fill="#e8e4da"/><ellipse cx="230" cy="218" rx="13" ry="7" fill="#e8e4da"/>
      <circle cx="170" cy="219" r="5" fill="#20262c"/><circle cx="230" cy="219" r="5" fill="#20262c"/>
      ${glasses ? `<circle cx="170" cy="218" r="24" fill="none" stroke="#39434d" stroke-width="4"/><circle cx="230" cy="218" r="24" fill="none" stroke="#39434d" stroke-width="4"/><line x1="194" y1="214" x2="206" y2="214" stroke="#39434d" stroke-width="4"/>` : ''}
      <!-- нос, рот -->
      <path d="M200 226 q-6 30 0 38 q6 4 10 0" stroke="rgba(60,40,30,.5)" stroke-width="4" fill="none"/>
      <path d="M178 292 q22 ${mood>0?-8:8} 44 0" stroke="#8a5a52" stroke-width="6" fill="none" stroke-linecap="round"/>
      <!-- тень нуара -->
      <path d="M200 126 Q286 126 286 230 Q286 334 200 334 L286 334 L286 126Z" fill="rgba(0,0,0,.22)"/>
      ${name? `<rect x="0" y="500" width="400" height="60" fill="rgba(8,10,14,.85)"/>
        <text x="200" y="540" text-anchor="middle" font-family="Georgia,serif" font-size="26" fill="#dcd6ca" letter-spacing="4">${name}</text>`:''}
    </svg>`;
  }

  const PORTRAITS = {
    voronov:  portrait({skin:'#d3a883',hair:'#4a4038',cloth:'#2c3746',accent:'#39434d',mood:.4,glasses:false}),
    kravtsov: portrait({skin:'#d8b28f',hair:'#6a6258',cloth:'#3a3f46',accent:'#8e2f2f',mood:.8,glasses:true,hat:true}),
    sasha:    portrait({skin:'#e0bb97',hair:'#7a5230',cloth:'#3d4c5c',accent:'#9fc4b8',mood:-.4,shirt:'#e8e4da'}),
    katya:    portrait({skin:'#e4c2a4',hair:'#2c2420',cloth:'#4a4256',accent:'#c9b3d8',mood:-.7}),
    ruslan:   portrait({skin:'#c69a76',hair:'#241f1a',cloth:'#4a4438',accent:'#6b5a3e',mood:-.2,beard:true}),
    lida:     portrait({skin:'#dcc0a2',hair:'#8a8478',cloth:'#6b5a4a',accent:'#d8c9a8',mood:-.6,glasses:true}),
    tarasov:  portrait({skin:'#cfa07c',hair:'#5a554e',cloth:'#22303e',accent:'#c9a227',mood:.6,beard:true}),
    gorsky:   portrait({skin:'#d8b28f',hair:'#3a2e24',cloth:'#20262c',accent:'#8e2f2f',mood:.2,hat:true}),
  };

  const BGS = {
    warehouse_night:bgWarehouseNight, warehouse_close:bgWarehouseClose, warehouse_raindoor:bgRainDoor,
    dispatch:bgDispatch, cell:bgCell, office_kravtsov:bgOffice, customs:bgCustoms, station_night:bgStation,
    corridor:bgCorridor, tarasov_office:bgTarasov, safe_open:bgSafe, arrest:bgArrest, report:bgReport,
    morning_port:bgMorning, archive:bgArchive, rain_door:bgRainDoor,
  };

  return {
    bg(name){ const f=BGS[name]||BGS.warehouse_night; return uri(f()); },
    bgRaw(name){ const f=BGS[name]||BGS.warehouse_night; return raw(f()); },
    face(key){ return raw(PORTRAITS[key]||PORTRAITS.voronov); },
    full(key){ return raw(portrait(Object.assign({},PORTRAITS[key]?{}:{}, {}))); },
  };
})();
