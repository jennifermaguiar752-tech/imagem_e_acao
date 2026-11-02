// ================== CONSTANTES ==================
const CATS = {
  P:{nome:'Pessoa, lugar ou animal', cor:'#f2a900'},
  O:{nome:'Objeto',  cor:'#2d7ff9'},
  A:{nome:'Ação',    cor:'#ff7a1a'},
  D:{nome:'Difícil', cor:'#e63946'},
  L:{nome:'Lazer',   cor:'#22a861'},
  M:{nome:'Mix',     cor:'#9b5de5'}
};
const ORDEM = ['P','O','A','D','L','M'];
const CORES = ['#e63946','#2d7ff9','#06a77d','#f4c20d','#8338ec','#ff7a1a','#00b4d8','#ff5fa2','#333333','#ffffff'];
const SAVE_KEY = 'imagemAcao_v3';
const CFG_KEY  = 'ia_cfg_v3';
const CFG_PADRAO = {nGrupos:2,tam:40,modoFim:'chegada',rodadas:5,tempo:60,modoCat:'dado',especiais:true,denovo:true,andar:'carta'};

let S = null;          // estado da partida
let rascunho = null;   // montagem dos grupos
let timerIv = null, fimTempo = 0, ultimoSeg = null;

const $ = s => document.querySelector(s);
const app = document.getElementById('app');

// ================== UTILIDADES ==================
function save(){ localStorage.setItem(SAVE_KEY, JSON.stringify(S)); }
function load(){ try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch(e){ return null; } }
function shuffle(a){ a=[...a]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
function esc(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function sel(id, opts, val, extra=''){
  return `<select id="${id}" ${extra}>${opts.map(o=>{const [v,l]=Array.isArray(o)?o:[o,o];
    return `<option value="${v}" ${String(v)===String(val)?'selected':''}>${l}</option>`;}).join('')}</select>`;
}
function peao(cor, cls=''){
  return `<svg class="peao ${cls}" viewBox="0 0 20 32">
    <rect x="2" y="25" width="16" height="5.5" rx="2.5" fill="${cor}" stroke="#222" stroke-width="1.4"/>
    <path d="M7 12.5h6l3 13H4z" fill="${cor}" stroke="#222" stroke-width="1.4" stroke-linejoin="round"/>
    <circle cx="10" cy="7.5" r="5.5" fill="${cor}" stroke="#222" stroke-width="1.4"/>
    <ellipse cx="8" cy="5.6" rx="1.8" ry="1.2" fill="#fff" opacity=".6"/></svg>`;
}
function palavraAtual(){ return S.carta && S.cat ? S.carta[S.cat].w : ''; }

// ================== SOM / VIBRAÇÃO ==================
let actx = null;
function audio(){
  if(!actx){ try{ actx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} }
  if(actx && actx.state==='suspended') actx.resume();
  return actx;
}
function beep(freq=880, dur=.15, vol=.3, type='square'){
  try{
    const c=audio(); if(!c) return;
    const o=c.createOscillator(), g=c.createGain();
    o.type=type; o.frequency.value=freq;
    g.gain.setValueAtTime(vol,c.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,c.currentTime+dur);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime+dur);
  }catch(e){}
}
function alarme(){
  [0,300,600,900].forEach(d=>setTimeout(()=>beep(880,.25,.5,'sawtooth'),d));
  setTimeout(()=>beep(440,.9,.5,'sawtooth'),1200);
  if(navigator.vibrate) navigator.vibrate([400,100,400,100,800]);
}
function fanfarra(){ [523,659,784,1047,784,1047].forEach((f,i)=>setTimeout(()=>beep(f,.25,.3,'triangle'),i*180)); }

let wakeLock=null;
async function pedirWakeLock(){ try{ if('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); }catch(e){} }
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible' && S && S.fase!=='fim') pedirWakeLock(); });

// ================== TELA INICIAL ==================
function telaInicio(){
  pararTimer();
  const salvo = load();
  const cfg = Object.assign({}, CFG_PADRAO, JSON.parse(localStorage.getItem(CFG_KEY)||'{}'));
  app.innerHTML = `
  <div class="screen">
    <h1 class="logo">Imagem<br><span>em Ação</span></h1>
    ${salvo && salvo.fase!=='fim' ? `<button class="btn big green" onclick="continuar()">▶ Continuar partida salva</button>`:''}
    <div class="card">
      <h2>👥 Jogadores</h2>
      <p class="hint">Um nome por linha. Pode deixar vazio e jogar só com os grupos.</p>
      <textarea id="nomes" rows="6" placeholder="Ana&#10;Bruno&#10;Carla&#10;Diego">${esc(localStorage.getItem('ia_nomes')||'')}</textarea>
      <label>Número de grupos ${sel('nGrupos',[2,3,4,5,6,7,8],cfg.nGrupos)}</label>
    </div>
    <div class="card">
      <h2>⚙️ Configurações</h2>
      <label>Tamanho do caminho ${sel('tam',[[20,'20 casas (rápido)'],[30,'30 casas'],[40,'40 casas'],[50,'50 casas'],[60,'60 casas (longo)']],cfg.tam)}</label>
      <label>Fim de jogo ${sel('modoFim',[['chegada','Primeiro a chegar ao fim'],['rodadas','Número de rodadas']],cfg.modoFim,
        `onchange="$('#rodLabel').style.display=this.value==='rodadas'?'block':'none'"`)}</label>
      <label id="rodLabel" style="display:${cfg.modoFim==='rodadas'?'block':'none'}">Quantidade de rodadas ${sel('rodadas',[3,5,8,10,15,20],cfg.rodadas)}</label>
      <label>Tempo da mímica ${sel('tempo',[[30,'30 segundos'],[45,'45 segundos'],[60,'1 minuto'],[90,'1min30'],[120,'2 minutos']],cfg.tempo)}</label>
      <label>Categoria definida por ${sel('modoCat',[['dado','Dado de categoria (tabuleiro original)'],['casa','Letra da casa do tabuleiro']],cfg.modoCat)}</label>
      <label>Ao acertar, o grupo anda ${sel('andar',[['carta','O número ao lado da palavra'],['dado','O que tirar no dado (1 a 6)']],cfg.andar)}</label>
      <label class="check"><input type="checkbox" id="especiais" ${cfg.especiais?'checked':''}> Casas 👥 Todos jogam e 👥? Escolha a categoria</label>
      <label class="check"><input type="checkbox" id="denovo" ${cfg.denovo?'checked':''}> Quem acerta joga de novo</label>
    </div>
    <button class="btn big" onclick="montarGrupos('sorteio')">🎲 Sortear grupos</button>
    <button class="btn big gray" onclick="montarGrupos('manual')">✋ Escolher os grupos</button>
    <button class="btn ghost" onclick="regras()">📖 Como jogar</button>
  </div>`;
}

function lerCfg(){
  return { nGrupos:+$('#nGrupos').value, tam:+$('#tam').value, modoFim:$('#modoFim').value,
    rodadas:+$('#rodadas').value, tempo:+$('#tempo').value, modoCat:$('#modoCat').value,
    andar:$('#andar').value, especiais:$('#especiais').checked, denovo:$('#denovo').checked };
}

function continuar(){
  S = load();
  if(S.fase==='tempo') S.fase='palavra';
  pedirWakeLock(); telaJogo();
}

// ================== MONTAGEM DOS GRUPOS ==================
function montarGrupos(modo){
  const cfg = lerCfg();
  const txt = $('#nomes').value;
  const nomes = txt.split('\n').map(s=>s.trim()).filter(Boolean);
  if(modo==='sorteio' && nomes.length && nomes.length < cfg.nGrupos){
    alert(`Precisa de pelo menos ${cfg.nGrupos} jogadores para ${cfg.nGrupos} grupos.`); return;
  }
  localStorage.setItem('ia_nomes', txt);
  localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  audio();
  rascunho = { cfg, nomes, pool:[], sel:null,
    teams: Array.from({length:cfg.nGrupos},(_,i)=>({nome:`Grupo ${i+1}`, cor:CORES[i], membros:[]})) };
  if(modo==='sorteio') animarSorteio();
  else { rascunho.pool = [...nomes]; mostrarGrupos(); }
}

function animarSorteio(){
  const R = rascunho;
  R.teams.forEach(t=>t.membros=[]); R.pool=[]; R.sel=null;
  shuffle(R.nomes).forEach((nm,i)=>R.teams[i%R.teams.length].membros.push(nm));
  app.innerHTML = `<div class="screen center"><h1 class="logo small">Sorteando<br><span>os grupos...</span></h1>
    <div class="dado rolando" style="margin:40px auto">🎲</div></div>`;
  let n=0;
  const iv = setInterval(()=>{ beep(400+Math.random()*600,.05,.2); if(++n>14){ clearInterval(iv); mostrarGrupos(); } },80);
}

function limparGrupos(){
  rascunho.teams.forEach(t=>t.membros=[]);
  rascunho.pool = [...rascunho.nomes]; rascunho.sel = null;
  mostrarGrupos();
}

function mostrarGrupos(){
  const R = rascunho, temSel = !!R.sel;
  const chips = (lista, origem) => lista.map((nm,i)=>
    `<span class="jog ${R.sel && R.sel.o===origem && R.sel.i===i ? 'sel':''}" onclick="event.stopPropagation();selecionar(${origem},${i})">${esc(nm)}</span>`).join('');
  app.innerHTML = `<div class="screen">
    <h1 class="logo small">Monte os <span>grupos</span></h1>
    <p class="hint light">Toque num jogador e depois no grupo para onde ele vai.<br>Toque no peão para trocar a cor e no nome para renomear.</p>
    ${R.nomes.length ? `<div class="card ${temSel?'alvo':''}" onclick="moverPara(-1)">
        <h2>🙋 Sem grupo (${R.pool.length})</h2>
        <div>${chips(R.pool,-1) || '<span class="hint">Todo mundo já está num grupo ✔</span>'}</div></div>` : ''}
    ${R.teams.map((t,ti)=>`<div class="card grupo ${temSel?'alvo':''}" style="--c:${t.cor}" onclick="moverPara(${ti})">
        <div class="grupo-head">
          <span onclick="event.stopPropagation();trocarCor(${ti})">${peao(t.cor)}</span>
          <h3 onclick="event.stopPropagation();renomear(${ti})">${esc(t.nome)} ✏️</h3>
          <small>${t.membros.length} jog.</small>
        </div>
        <div>${chips(t.membros,ti) || '<span class="hint">ninguém ainda</span>'}</div>
      </div>`).join('')}
    <button class="btn big green" onclick="confirmarGrupos()">▶ Começar jogo</button>
    ${R.nomes.length ? `<div class="row">
      <button class="btn" onclick="animarSorteio()">🔀 Sortear</button>
      <button class="btn gray" onclick="limparGrupos()">✋ Do zero</button></div>` : ''}
    <button class="btn ghost" onclick="telaInicio()">Voltar</button>
  </div>`;
}

function selecionar(o, i){
  const R = rascunho;
  R.sel = (R.sel && R.sel.o===o && R.sel.i===i) ? null : {o, i};
  mostrarGrupos();
}

function moverPara(dest){
  const R = rascunho;
  if(!R.sel) return;
  const {o, i} = R.sel;
  R.sel = null;
  if(o !== dest){
    const origem = o===-1 ? R.pool : R.teams[o].membros;
    const [nm] = origem.splice(i,1);
    (dest===-1 ? R.pool : R.teams[dest].membros).push(nm);
    beep(700,.06,.2);
  }
  mostrarGrupos();
}

function trocarCor(ti){
  const R = rascunho, usadas = R.teams.filter((_,j)=>j!==ti).map(t=>t.cor);
  let k = CORES.indexOf(R.teams[ti].cor);
  for(let n=0;n<CORES.length;n++){
    k = (k+1) % CORES.length;
    if(!usadas.includes(CORES[k])){ R.teams[ti].cor = CORES[k]; break; }
  }
  mostrarGrupos();
}

function renomear(i){
  const n = prompt('Nome do grupo:', rascunho.teams[i].nome);
  if(n && n.trim()){ rascunho.teams[i].nome = n.trim().slice(0,20); mostrarGrupos(); }
}

function confirmarGrupos(){
  const R = rascunho;
  if(R.pool.length){ alert('Ainda tem jogador sem grupo!'); return; }
  if(R.nomes.length && R.teams.some(t=>!t.membros.length) && !confirm('Tem grupo sem ninguém. Começar mesmo assim?')) return;
  novoJogo(R.cfg, R.teams);
}

// ================== PARTIDA ==================
function criarTabuleiro(tam, especiais){
  const casas = []; let k = 0;
  for(let i=0;i<tam;i++){
    let tipo = 'normal';
    if(especiais && i>0 && i<tam-1 && i%3===0) tipo = (k++ % 2 === 0) ? 'todos' : 'escolha';
    casas.push({cat:ORDEM[i%6], tipo});
  }
  return casas;
}

function novoJogo(cfg, teams){
  S = {
    cfg,
    teams: teams.map(t=>({nome:t.nome, cor:t.cor, membros:[...t.membros], pos:0, acertos:0})),
    casas: criarTabuleiro(cfg.tam, cfg.especiais),
    vez:0, rodada:1, fase:'pronto', cat:null, carta:null, revelada:false, esgotado:false, vencedor:null,
    usadas:{P:[],O:[],A:[],D:[],L:[],M:[]}
  };
  pedirWakeLock();
  iniciarVez();
  toastVez();
}

function iniciarVez(){
  const t = S.teams[S.vez], casa = S.casas[t.pos];
  S.fase='pronto'; S.carta=null; S.revelada=false; S.esgotado=false; S.vencedor=null;
  S.cat = (S.cfg.modoCat==='casa' && casa.tipo!=='escolha') ? casa.cat : null;
  save(); telaJogo();
}

function sortearPalavra(cat){
  const lista = PALAVRAS[cat];
  if(S.usadas[cat].length >= lista.length) S.usadas[cat] = [];
  const disp = lista.filter(w=>!S.usadas[cat].includes(w));
  const w = disp[Math.floor(Math.random()*disp.length)];
  S.usadas[cat].push(w);
  return w;
}

function novaCarta(){
  const nums = shuffle([1,2,3,4,5,6]), c = {};
  ORDEM.forEach((k,i)=> c[k] = {w:sortearPalavra(k), n:nums[i]});
  return c;
}

// ================== TELA DO JOGO ==================
function telaJogo(){
  const t = S.teams[S.vez];
  app.innerHTML = `
  <div class="game">
    <header class="topo" style="--c:${t.cor}">
      <button class="icon" onclick="menu()">☰</button>
      <div>
        <small>${S.cfg.modoFim==='rodadas' ? `Rodada ${S.rodada} de ${S.cfg.rodadas}` : `Rodada ${S.rodada}`}</small>
        <b>Vez do ${esc(t.nome)}</b>
      </div>
      <button class="icon" onclick="regras()">?</button>
    </header>
    <div class="placar" id="placar"></div>
    <div class="area" id="area"><div class="board" id="board"></div>
      ${S.cfg.especiais ? `<p class="legenda">👥 Todos jogam &nbsp;•&nbsp; 👥<sup>?</sup> Escolha a categoria e todos jogam</p>` : ''}
    </div>
    <div class="painel" id="painel"></div>
  </div>`;
  desenharPlacar(); desenharTabuleiro(); desenharPainel();
}

function desenharPlacar(){
  const el = $('#placar'); if(!el) return;
  el.innerHTML = S.teams.map((tm,i)=>`<div class="chip ${i===S.vez?'on':''}">
    ${peao(tm.cor)}${esc(tm.nome)} <b>${tm.pos+1}/${S.casas.length}</b></div>`).join('');
}

// caminho em espiral: começa embaixo à esquerda e vai para o centro
function espiral(R, C){
  const p=[]; let t=0, b=R-1, l=0, r=C-1;
  while(t<=b && l<=r){
    for(let c=l;c<=r;c++) p.push([b,c]); b--;
    for(let x=b;x>=t;x--) p.push([x,r]); r--;
    if(t<=b){ for(let c=r;c>=l;c--) p.push([t,c]); } t++;
    if(l<=r){ for(let x=t;x<=b;x++) p.push([x,l]); } l++;
  }
  return p;
}

function desenharTabuleiro(){
  const b = $('#board'); if(!b) return;
  const N = S.casas.length, cols = N<=42 ? 7 : 8, rows = Math.ceil(N/cols);
  const pos = espiral(rows, cols), lisa = S.cfg.modoCat==='dado';
  b.style.gridTemplateColumns = `repeat(${cols},1fr)`;
  b.innerHTML = S.casas.map((c,i)=>{
    const [r,col] = pos[i], ini = i===0, fim = i===N-1, semCor = lisa||ini||fim;
    const peoes = S.teams.map((t,ti)=> t.pos===i ? peao(t.cor, ti===S.vez?'vez':'') : '').join('');
    let txt = '';
    if(ini) txt = '<span class="rot">INÍCIO</span>';
    else if(fim) txt = '<span class="rot">FIM</span>';
    else if(!lisa) txt = `<b>${c.cat}</b>`;
    const ico = c.tipo==='todos' ? '<span class="ico">👥</span>' : c.tipo==='escolha' ? '<span class="ico">👥<sup>?</sup></span>' : '';
    return `<div class="casa ${semCor?'lisa':''} ${fim?'fim':''}"
      style="grid-row:${r+1};grid-column:${col+1};${semCor?'':`background:${CATS[c.cat].cor}`}">
      ${txt}${ico}<div class="peoes">${peoes}</div></div>`;
  }).join('');
  const atual = b.children[S.teams[S.vez].pos];
  if(atual) atual.scrollIntoView({block:'nearest', behavior:'smooth'});
}

function catBox(c){ return `<div class="catbox" style="background:${CATS[c].cor}"><b>${c}</b><span>${CATS[c].nome}</span></div>`; }

function cartaHTML(){
  if(!S.revelada) return `<div class="carta oculta" onclick="toggleRevelar()"><p>🙈 Toque para ver a carta<br><small>só quem vai fazer a mímica!</small></p></div>`;
  return `<div class="carta" onclick="toggleRevelar()">
    ${ORDEM.map(c=>`<div class="linha ${c===S.cat?'ativa':''}">
      <b class="letra">${c}</b><span>${esc(S.carta[c].w)}</span><i>${S.carta[c].n}</i></div>`).join('')}
  </div>`;
}

function desenharPainel(){
  const p = $('#painel'); if(!p) return;
  const t = S.teams[S.vez], casa = S.casas[t.pos], todos = casa.tipo!=='normal';
  const bTodos = casa.tipo==='todos'
      ? `<div class="banner">👥 TODOS JOGAM! Um de cada grupo faz a mímica da mesma palavra</div>`
    : casa.tipo==='escolha'
      ? `<div class="banner">👥❓ ${esc(t.nome)} ESCOLHE A CATEGORIA e TODOS JOGAM!</div>` : '';
  let h = '';

  if(S.fase==='pronto'){
    if(casa.tipo==='escolha' && !S.cat){
      h = `${bTodos}<p>Escolha a categoria:</p>
        <div class="catgrid">${ORDEM.map(c=>`<button class="btn" style="background:${CATS[c].cor}" onclick="escolherCat('${c}')"><b>${c}</b> · ${CATS[c].nome}</button>`).join('')}</div>`;
    } else if(!S.cat){
      h = `${bTodos}<p><b>${esc(t.nome)}</b>, role o dado de categoria!</p>
        <div class="dado" id="dado">?</div>
        <button class="btn big" id="bRolar" onclick="rolarCategoria()">🎲 Rolar categoria</button>`;
    } else {
      h = `${bTodos}${catBox(S.cat)}
        <p>Quem vai fazer a mímica ${todos?'(um de cada grupo)':`do <b>${esc(t.nome)}</b>`} pega o celular.<br>
        <small>Os outros: não olhem! 🙈</small></p>
        <button class="btn big" onclick="verCarta()">🃏 Pegar carta</button>`;
    }
  }
  else if(S.fase==='palavra'){
    h = `${bTodos}${catBox(S.cat)}${cartaHTML()}
      <div class="row">
        <button class="btn gray" onclick="trocarCarta()">🔄 Outra carta</button>
        <button class="btn green" onclick="iniciarTimer()">⏱ Valendo!</button>
      </div>`;
  }
  else if(S.fase==='tempo'){
    const rest = S.esgotado ? 0 : Math.max(0, Math.ceil((fimTempo-Date.now())/1000));
    h = `${S.esgotado ? '<div class="banner red">⏰ TEMPO ESGOTADO!</div>' : bTodos}
      <div class="relogio ${rest<=10?'urgente':''}" id="relogio" style="--c:${t.cor};--p:${rest/S.cfg.tempo}">
        <span id="tempoNum">${rest}</span></div>
      ${catBox(S.cat)}
      ${cartaHTML()}
      ${botoesResultado(todos)}`;
  }
  else if(S.fase==='mover'){
    const v = S.teams[S.vencedor];
    if(S.cfg.andar==='carta'){
      const n = S.carta[S.cat].n;
      h = `<div class="banner green">🎉 ${esc(v.nome)} acertou!</div>
        <p>A palavra era <b>${esc(palavraAtual())}</b>.<br>O número ao lado dela é <b>${n}</b>.</p>
        <div class="dado" style="border-color:${v.cor};box-shadow:0 5px 0 ${v.cor}">${n}</div>
        <button class="btn big green" id="bRolar" onclick="andarCarta()">${peao(v.cor)} Andar ${n} casa${n>1?'s':''}</button>`;
    } else {
      h = `<div class="banner green">🎉 ${esc(v.nome)} acertou!</div>
        <p>A palavra era <b>${esc(palavraAtual())}</b>.<br>Role o dado para andar.</p>
        <div class="dado" id="dado" style="border-color:${v.cor};box-shadow:0 5px 0 ${v.cor}">?</div>
        <button class="btn big" id="bRolar" onclick="rolarMovimento()">🎲 Rolar dado</button>`;
    }
  }
  p.innerHTML = h;
}

function botoesResultado(todos){
  if(!todos) return `<div class="row">
      <button class="btn green big" onclick="resultado(S.vez)">✅ Acertou</button>
      <button class="btn red big" onclick="resultado(null)">❌ Errou</button></div>`;
  return `<p><b>Quem acertou primeiro?</b></p>
    <div class="teambtns">
      ${S.teams.map((tm,i)=>`<button class="btn" style="background:${tm.cor}" onclick="resultado(${i})">${esc(tm.nome)}</button>`).join('')}
      <button class="btn gray" onclick="resultado(null)">Ninguém</button>
    </div>`;
}

// ================== AÇÕES ==================
function rolarDado(el, faces, aoTerminar, aCadaFace){
  el.classList.add('rolando');
  let n = 0;
  const iv = setInterval(()=>{
    const f = faces[Math.floor(Math.random()*faces.length)];
    el.textContent = f; if(aCadaFace) aCadaFace(f);
    beep(500+Math.random()*500,.03,.15);
    if(++n >= 14){
      clearInterval(iv);
      const r = faces[Math.floor(Math.random()*faces.length)];
      el.textContent = r; if(aCadaFace) aCadaFace(r);
      el.classList.remove('rolando');
      beep(1200,.12,.3);
      aoTerminar(r);
    }
  },70);
}

function rolarCategoria(){
  audio(); $('#bRolar').disabled = true;
  const pinta = r=>{ const d=$('#dado'); d.style.background=CATS[r].cor; d.style.color='#fff'; };
  rolarDado($('#dado'), ORDEM, r=>{ S.cat = r; save(); setTimeout(desenharPainel, 800); }, pinta);
}

function escolherCat(c){ audio(); beep(900,.1,.25); S.cat = c; save(); desenharPainel(); }
function verCarta(){ audio(); S.carta = novaCarta(); S.fase='palavra'; S.revelada=false; save(); desenharPainel(); }
function trocarCarta(){ S.carta = novaCarta(); S.revelada=true; save(); desenharPainel(); }
function toggleRevelar(){ S.revelada = !S.revelada; desenharPainel(); }

function iniciarTimer(){
  audio(); beep(660,.2,.3);
  S.fase='tempo'; S.esgotado=false; S.revelada=false; ultimoSeg=null;   // esconde a carta para virar o celular pro grupo
  fimTempo = Date.now() + S.cfg.tempo*1000;
  save(); desenharPainel();
  clearInterval(timerIv); timerIv = setInterval(tick, 100);
}

function tick(){
  const rest = Math.max(0, fimTempo-Date.now());
  const seg = Math.ceil(rest/1000);
  const num = $('#tempoNum'), rel = $('#relogio');
  if(num) num.textContent = seg;
  if(rel){ rel.style.setProperty('--p', rest/(S.cfg.tempo*1000)); rel.classList.toggle('urgente', seg<=10); }
  if(seg !== ultimoSeg){
    ultimoSeg = seg;
    if(seg<=5 && seg>0){ beep(1000,.12,.35); if(navigator.vibrate) navigator.vibrate(60); }
  }
  if(rest <= 0){ pararTimer(); S.esgotado = true; S.revelada = true; alarme(); desenharPainel(); }
}

function pararTimer(){ clearInterval(timerIv); timerIv = null; }

function resultado(i){
  pararTimer();
  if(i === null){
    beep(200,.4,.3,'sawtooth');
    proximaVez(`Ninguém acertou. A palavra era "${palavraAtual()}".`);
    return;
  }
  beep(880,.1,.3); setTimeout(()=>beep(1320,.2,.3),120);
  S.teams[i].acertos++; S.vencedor = i; S.fase = 'mover';
  save(); desenharPainel();
}

function andarCarta(){ $('#bRolar').disabled = true; andar(S.vencedor, S.carta[S.cat].n); }

function rolarMovimento(){
  $('#bRolar').disabled = true;
  rolarDado($('#dado'), [1,2,3,4,5,6], n=> setTimeout(()=>andar(S.vencedor, n), 500));
}

function andar(i, n){
  const t = S.teams[i], ultimo = S.casas.length-1;
  let passos = 0;
  const iv = setInterval(()=>{
    if(passos < n && t.pos < ultimo){
      t.pos++; passos++;
      beep(400+t.pos*12,.07,.2);
      desenharTabuleiro(); desenharPlacar();
    } else {
      clearInterval(iv); save(); depoisDeAndar(i);
    }
  },300);
}

function depoisDeAndar(i){
  const t = S.teams[i];
  if(t.pos >= S.casas.length-1){ fimDeJogo(); return; }
  if(i === S.vez && S.cfg.denovo){
    iniciarVez();
    toast(`${peao(t.cor,'grande')}<br>${esc(t.nome)}<br>joga de novo! 🔥`, t.cor);
  } else {
    proximaVez();
  }
}

function proximaVez(msg){
  S.vez = (S.vez+1) % S.teams.length;
  if(S.vez === 0){
    S.rodada++;
    if(S.cfg.modoFim==='rodadas' && S.rodada > S.cfg.rodadas){ fimDeJogo(); return; }
  }
  iniciarVez();
  toastVez(msg);
}

function toastVez(msg){
  const t = S.teams[S.vez];
  toast(`${msg?`<small>${esc(msg)}</small><br><br>`:''}${peao(t.cor,'grande')}<br>Vez do<br>${esc(t.nome)}`, t.cor);
}

function fimDeJogo(){
  pararTimer(); S.fase='fim'; save();
  const rank = [...S.teams].sort((a,b)=> b.pos-a.pos || b.acertos-a.acertos);
  const top = rank[0];
  app.innerHTML = `<div class="screen center">
    <div class="trofeu">🏆</div>
    <h1 class="logo small">${esc(top.nome)}<br><span>venceu!</span></h1>
    <div class="card">
      ${rank.map((t,i)=>`<div class="rank"><b>${i+1}º</b>${peao(t.cor)}
        <span>${esc(t.nome)}</span><small>casa ${t.pos+1} • ${t.acertos} acertos</small></div>`).join('')}
    </div>
    <button class="btn big green" onclick="novoJogo(S.cfg, S.teams)">🔁 Jogar de novo (mesmos grupos)</button>
    <button class="btn" onclick="telaInicio()">🏠 Novo jogo</button>
  </div>`;
  fanfarra();
  if(navigator.vibrate) navigator.vibrate([200,100,200,100,500]);
}

// ================== MODAIS / TOAST ==================
function toast(html, cor){
  const d = document.createElement('div');
  d.className = 'toast';
  d.innerHTML = `<div style="border:6px solid ${cor||'#ffd23f'}">${html}<p class="tap">toque para continuar</p></div>`;
  d.onclick = ()=>d.remove();
  document.body.appendChild(d);
}

function modal(html){
  fecharModal();
  const d = document.createElement('div');
  d.className='modal'; d.id='modal';
  d.innerHTML = `<div class="modal-box">${html}</div>`;
  d.onclick = e=>{ if(e.target===d) fecharModal(); };
  document.body.appendChild(d);
}
function fecharModal(){ const m=$('#modal'); if(m) m.remove(); }

function menu(){
  modal(`<h2>Menu</h2>
    <button class="btn" onclick="fecharModal()">▶ Voltar ao jogo</button>
    <button class="btn" onclick="verGrupos()">👥 Ver grupos</button>
    <button class="btn gray" onclick="if(confirm('Pular a vez deste grupo?')){fecharModal();pararTimer();proximaVez();}">⏭ Pular vez</button>
    <button class="btn red" onclick="if(confirm('Encerrar e ver o resultado?')){fecharModal();fimDeJogo();}">🏁 Encerrar partida</button>
    <button class="btn ghost dark" onclick="fecharModal();telaInicio()">Sair (a partida fica salva)</button>`);
}

function verGrupos(){
  modal(`<h2>Grupos</h2>
    ${S.teams.map(t=>`<div class="card grupo" style="--c:${t.cor};box-shadow:none;border:1px solid #eee">
      <div class="grupo-head">${peao(t.cor)}<h3>${esc(t.nome)}</h3></div>
      <p>${t.membros.length?t.membros.map(esc).join(' • '):'—'}</p>
      <p class="hint">Casa ${t.pos+1} • ${t.acertos} acertos</p></div>`).join('')}
    <button class="btn" onclick="fecharModal()">Fechar</button>`);
}

function regras(){
  modal(`<h2>📖 Como jogar</h2>
    <p>1. Monte os grupos: sorteando ou escolhendo quem fica em cada um.</p>
    <p>2. Na sua vez, o grupo rola o <b>dado de categoria</b> (ou usa a letra da casa, se essa opção estiver ligada).</p>
    <p>3. Quem vai fazer a mímica pega a <b>carta</b> sem ninguém ver. A palavra da categoria sorteada aparece destacada.</p>
    <p>4. Aperte <b>Valendo!</b> (a carta se esconde sozinha), deixe o celular onde todos vejam o tempo e faça a <b>mímica</b>.</p>
    <p>5. <b>Proibido:</b> falar, fazer sons, mexer a boca formando palavras, apontar para coisas da sala e soletrar com os dedos.
       <b>Pode:</b> mostrar com os dedos o número de palavras e de sílabas.</p>
    <p>6. <b>Acertou:</b> anda o número ao lado da palavra na carta (ou o que tirar no dado, conforme a configuração). <b>Errou:</b> passa a vez.</p>
    <p>7. <b>👥 Todos jogam:</b> um jogador de cada grupo faz a mímica da mesma palavra ao mesmo tempo. Quem acertar primeiro anda.</p>
    <p>8. <b>👥<sup>?</sup> Escolha a categoria e todos jogam:</b> o grupo da vez escolhe a categoria, e depois todos jogam.</p>
    <p>9. Vence quem chegar ao <b>FIM</b> primeiro (ou quem estiver mais à frente quando acabarem as rodadas).</p>
    <h3>Categorias</h3>
    ${ORDEM.map(c=>`<p><span class="leg" style="background:${CATS[c].cor}">${c}</span><b>${CATS[c].nome}</b></p>`).join('')}
    <button class="btn" onclick="fecharModal()">Entendi!</button>`);
}

// ================== INICIALIZAÇÃO ==================
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=> navigator.serviceWorker.register('sw.js').catch(()=>{}));
}
telaInicio();
