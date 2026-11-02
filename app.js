// ================== CONSTANTES ==================
const CATS = {
  P:{nome:'Pessoa',  cor:'#f2a900'},
  O:{nome:'Objeto',  cor:'#2d7ff9'},
  A:{nome:'Ação',    cor:'#ff7a1a'},
  D:{nome:'Difícil', cor:'#e63946'},
  L:{nome:'Lazer',   cor:'#22a861'},
  M:{nome:'Mix',     cor:'#9b5de5'}
};
const ORDEM = ['P','O','A','D','L','M'];
const CORES = ['#ff4d6d','#3a86ff','#06c48f','#f4a300','#8338ec','#fb5607','#00a6c7','#6a994e'];
const SAVE_KEY = 'imagemAcao_partida';
const CFG_PADRAO = {nGrupos:2,tam:30,modoFim:'chegada',rodadas:5,tempo:60,modoCat:'casa',todos:true,denovo:true};

let S = null;          // estado da partida
let rascunho = null;   // grupos sorteados antes de começar
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

// Manter a tela ligada durante o jogo
let wakeLock=null;
async function pedirWakeLock(){ try{ if('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); }catch(e){} }
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible' && S && S.fase!=='fim') pedirWakeLock(); });

// ================== TELA INICIAL ==================
function telaInicio(){
  pararTimer();
  const salvo = load();
  const cfg = Object.assign({}, CFG_PADRAO, JSON.parse(localStorage.getItem('ia_cfg')||'{}'));
  app.innerHTML = `
  <div class="screen">
    <h1 class="logo">Imagem<br><span>em Ação</span></h1>
    ${salvo && salvo.fase!=='fim' ? `<button class="btn big green" onclick="continuar()">▶ Continuar partida salva</button>`:''}
    <div class="card">
      <h2>👥 Jogadores</h2>
      <p class="hint">Um nome por linha. Deixe vazio se quiser só os grupos.</p>
      <textarea id="nomes" rows="6" placeholder="Ana&#10;Bruno&#10;Carla&#10;Diego">${esc(localStorage.getItem('ia_nomes')||'')}</textarea>
      <label>Número de grupos ${sel('nGrupos',[2,3,4,5,6,7,8],cfg.nGrupos)}</label>
    </div>
    <div class="card">
      <h2>⚙️ Configurações</h2>
      <label>Tamanho do caminho ${sel('tam',[[20,'20 casas (rápido)'],[30,'30 casas'],[40,'40 casas'],[50,'50 casas'],[60,'60 casas (longo)']],cfg.tam)}</label>
      <label>Fim de jogo ${sel('modoFim',[['chegada','Primeiro a chegar ao fim'],['rodadas','Número de rodadas']],cfg.modoFim,
        `onchange="$('#rodLabel').style.display=this.value==='rodadas'?'block':'none'"`)}</label>
      <label id="rodLabel" style="display:${cfg.modoFim==='rodadas'?'block':'none'}">Quantidade de rodadas ${sel('rodadas',[3,5,8,10,15,20],cfg.rodadas)}</label>
      <label>Tempo para desenhar ${sel('tempo',[[30,'30 segundos'],[45,'45 segundos'],[60,'1 minuto'],[90,'1min30'],[120,'2 minutos']],cfg.tempo)}</label>
      <label>Categoria definida por ${sel('modoCat',[['casa','Casa do tabuleiro'],['dado','Dado de categoria']],cfg.modoCat)}</label>
      <label class="check"><input type="checkbox" id="todos" ${cfg.todos?'checked':''}> Casas ★ "Todos Jogam"</label>
      <label class="check"><input type="checkbox" id="denovo" ${cfg.denovo?'checked':''}> Quem acerta joga de novo</label>
    </div>
    <button class="btn big" onclick="clicarSortear()">🎲 Sortear grupos</button>
    <button class="btn ghost" onclick="regras()">📖 Como jogar</button>
  </div>`;
}

function lerCfg(){
  return { nGrupos:+$('#nGrupos').value, tam:+$('#tam').value, modoFim:$('#modoFim').value,
    rodadas:+$('#rodadas').value, tempo:+$('#tempo').value, modoCat:$('#modoCat').value,
    todos:$('#todos').checked, denovo:$('#denovo').checked };
}

function clicarSortear(){
  const cfg = lerCfg();
  const txt = $('#nomes').value;
  const nomes = txt.split('\n').map(s=>s.trim()).filter(Boolean);
  if(nomes.length && nomes.length < cfg.nGrupos){
    alert(`Precisa de pelo menos ${cfg.nGrupos} jogadores para ${cfg.nGrupos} grupos.`); return;
  }
  localStorage.setItem('ia_nomes', txt);
  localStorage.setItem('ia_cfg', JSON.stringify(cfg));
  audio();
  telaGrupos(cfg, nomes);
}

function continuar(){
  S = load();
  if(S.fase==='tempo') S.fase='palavra';   // se fechou no meio do tempo, volta para antes do "Valendo"
  pedirWakeLock(); telaJogo();
}

// ================== SORTEIO DOS GRUPOS ==================
function sortearGrupos(n, nomes){
  const teams = Array.from({length:n},(_,i)=>({nome:`Grupo ${i+1}`, cor:CORES[i], membros:[]}));
  shuffle(nomes).forEach((nm,i)=>teams[i%n].membros.push(nm));
  return teams;
}

function telaGrupos(cfg, nomes){
  rascunho = {cfg, nomes, teams:sortearGrupos(cfg.nGrupos, nomes)};
  app.innerHTML = `<div class="screen center"><h1 class="logo small">Sorteando<br><span>os grupos...</span></h1>
    <div class="dado rolando" style="margin:40px auto">🎲</div></div>`;
  let n=0;
  const iv = setInterval(()=>{ beep(400+Math.random()*600,.05,.2); if(++n>14){ clearInterval(iv); mostrarGrupos(); } },80);
}

function mostrarGrupos(){
  const {teams} = rascunho;
  app.innerHTML = `<div class="screen">
    <h1 class="logo small">Grupos <span>sorteados!</span></h1>
    ${teams.map((t,i)=>`<div class="card grupo" style="--c:${t.cor}">
        <h3 onclick="renomear(${i})">${esc(t.nome)} ✏️</h3>
        <p>${t.membros.length ? t.membros.map(esc).join(' • ') : '<span class="hint">sem nomes</span>'}</p>
      </div>`).join('')}
    <p class="hint light">Toque no nome do grupo para renomear. O ${esc(teams[0].nome)} começa.</p>
    <button class="btn big green" onclick="novoJogo(rascunho.cfg, rascunho.teams)">▶ Começar jogo</button>
    <div class="row">
      <button class="btn" onclick="telaGrupos(rascunho.cfg, rascunho.nomes)">🔀 Sortear de novo</button>
      <button class="btn gray" onclick="telaInicio()">Voltar</button>
    </div>
  </div>`;
}

function renomear(i){
  const n = prompt('Nome do grupo:', rascunho.teams[i].nome);
  if(n && n.trim()){ rascunho.teams[i].nome = n.trim().slice(0,20); mostrarGrupos(); }
}

// ================== PARTIDA ==================
function criarTabuleiro(tam, todos){
  const casas = [];
  for(let i=0;i<tam;i++){
    casas.push({ cat:ORDEM[i%6], todos: todos && i>0 && i<tam-1 && i%5===4 });
  }
  return casas;
}

function novoJogo(cfg, teams){
  S = {
    cfg,
    teams: teams.map(t=>({nome:t.nome, cor:t.cor, membros:t.membros, pos:0, acertos:0})),
    casas: criarTabuleiro(cfg.tam, cfg.todos),
    vez:0, rodada:1, fase:'pronto', cat:null, palavra:null, revelada:false, esgotado:false, vencedor:null,
    usadas:{P:[],O:[],A:[],D:[],L:[],M:[]}
  };
  pedirWakeLock();
  iniciarVez();
  toast(`Vez do<br>${esc(S.teams[0].nome)}`, S.teams[0].cor);
}

function iniciarVez(){
  const t = S.teams[S.vez];
  S.fase='pronto'; S.palavra=null; S.revelada=false; S.esgotado=false; S.vencedor=null;
  S.cat = S.cfg.modoCat==='casa' ? S.casas[t.pos].cat : null;
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
    <div class="board" id="board"></div>
    <div class="painel" id="painel"></div>
  </div>`;
  desenharPlacar(); desenharTabuleiro(); desenharPainel();
}

function desenharPlacar(){
  const el = $('#placar'); if(!el) return;
  el.innerHTML = S.teams.map((tm,i)=>`<div class="chip ${i===S.vez?'on':''}" style="--c:${tm.cor}">
    <i></i>${esc(tm.nome)} <b>${tm.pos+1}/${S.casas.length}</b></div>`).join('');
}

function desenharTabuleiro(){
  const b = $('#board'); if(!b) return;
  const cols = S.casas.length <= 30 ? 6 : 8;
  const ultimo = S.casas.length-1;
  b.style.gridTemplateColumns = `repeat(${cols},1fr)`;
  b.innerHTML = S.casas.map((c,i)=>{
    const row = Math.floor(i/cols);
    let col = i%cols; if(row%2) col = cols-1-col;   // caminho em zigue-zague
    const fichas = S.teams.map((t,ti)=> t.pos===i ? `<i class="ficha ${ti===S.vez?'pulse':''}" style="background:${t.cor}"></i>` : '').join('');
    return `<div class="casa ${i===ultimo?'fim':''}" style="grid-row:${row+1};grid-column:${col+1};background:${CATS[c.cat].cor}">
      <span class="num">${i===0?'INÍCIO':i+1}</span>
      <b>${i===ultimo?'🏁':c.cat}</b>
      ${c.todos?'<span class="star">★</span>':''}
      <div class="fichas">${fichas}</div></div>`;
  }).join('');
  const atual = b.children[S.teams[S.vez].pos];
  if(atual) atual.scrollIntoView({block:'nearest', behavior:'smooth'});
}

function catBox(c){ return `<div class="catbox" style="background:${CATS[c].cor}"><b>${c}</b><span>${CATS[c].nome}</span></div>`; }

function desenharPainel(){
  const p = $('#painel'); if(!p) return;
  const t = S.teams[S.vez], casa = S.casas[t.pos], todos = casa.todos;
  const bTodos = todos ? `<div class="banner">★ TODOS JOGAM! Um de cada grupo desenha a mesma palavra</div>` : '';
  let h = '';

  if(S.fase==='pronto'){
    if(!S.cat){
      h = `${bTodos}<p><b>${esc(t.nome)}</b>, role o dado de categoria!</p>
        <div class="dado" id="dado">?</div>
        <button class="btn big" id="bRolar" onclick="rolarCategoria()">🎲 Rolar categoria</button>`;
    } else {
      h = `${bTodos}${catBox(S.cat)}
        <p>Quem vai desenhar ${todos?'(um de cada grupo)':`do <b>${esc(t.nome)}</b>`} pega o celular.<br>
        <small>Os outros: não olhem! 🙈</small></p>
        <button class="btn big" onclick="verPalavra()">👁 Ver palavra</button>`;
    }
  }
  else if(S.fase==='palavra' || S.fase==='tempo'){
    const pal = `<div class="palavra ${S.revelada?'':'oculta'}" onclick="toggleRevelar()">
      ${S.revelada ? esc(S.palavra) : 'Toque para mostrar / esconder a palavra'}</div>`;
    if(S.fase==='palavra'){
      h = `${bTodos}${catBox(S.cat)}${pal}
        <div class="row">
          <button class="btn gray" onclick="trocarPalavra()">🔄 Trocar</button>
          <button class="btn green" onclick="iniciarTimer()">⏱ Valendo!</button>
        </div>`;
    } else {
      const rest = S.esgotado ? 0 : Math.max(0, Math.ceil((fimTempo-Date.now())/1000));
      h = `${S.esgotado ? '<div class="banner red">⏰ TEMPO ESGOTADO!</div>' : bTodos}
        <div class="relogio ${rest<=10?'urgente':''}" id="relogio" style="--c:${t.cor};--p:${rest/S.cfg.tempo}">
          <span id="tempoNum">${rest}</span></div>
        ${pal}
        ${botoesResultado(todos)}`;
    }
  }
  else if(S.fase==='mover'){
    const v = S.teams[S.vencedor];
    h = `<div class="banner green">🎉 ${esc(v.nome)} acertou!</div>
      <p>A palavra era <b>${esc(S.palavra)}</b>.<br>Role o dado para andar.</p>
      <div class="dado" id="dado" style="border-color:${v.cor};box-shadow:0 5px 0 ${v.cor}">?</div>
      <button class="btn big" id="bRolar" style="background:${v.cor}" onclick="rolarMovimento()">🎲 Rolar dado</button>`;
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

function verPalavra(){ audio(); S.palavra = sortearPalavra(S.cat); S.fase='palavra'; S.revelada=false; save(); desenharPainel(); }
function trocarPalavra(){ S.palavra = sortearPalavra(S.cat); S.revelada=true; save(); desenharPainel(); }
function toggleRevelar(){ S.revelada = !S.revelada; desenharPainel(); }

function iniciarTimer(){
  audio(); beep(660,.2,.3);
  S.fase='tempo'; S.esgotado=false; ultimoSeg=null;
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
  if(rest <= 0){ pararTimer(); S.esgotado = true; alarme(); desenharPainel(); }
}

function pararTimer(){ clearInterval(timerIv); timerIv = null; }

function resultado(i){
  pararTimer();
  if(i === null){
    beep(200,.4,.3,'sawtooth');
    proximaVez(`${S.teams[S.vez].nome} não acertou. A palavra era "${S.palavra}".`);
    return;
  }
  beep(880,.1,.3); setTimeout(()=>beep(1320,.2,.3),120);
  S.teams[i].acertos++; S.vencedor = i; S.fase = 'mover';
  save(); desenharPainel();
}

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
    toast(`${esc(t.nome)}<br>joga de novo! 🔥`, t.cor);
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
  const t = S.teams[S.vez];
  toast(`${msg?`<small>${esc(msg)}</small><br><br>`:''}Vez do<br>${esc(t.nome)}`, t.cor);
}

function fimDeJogo(){
  pararTimer(); S.fase='fim'; save();
  const rank = [...S.teams].sort((a,b)=> b.pos-a.pos || b.acertos-a.acertos);
  const top = rank[0];
  app.innerHTML = `<div class="screen center">
    <div class="trofeu">🏆</div>
    <h1 class="logo small">${esc(top.nome)}<br><span>venceu!</span></h1>
    <div class="card">
      ${rank.map((t,i)=>`<div class="rank" style="--c:${t.cor}"><b>${i+1}º</b><i></i>
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
  d.innerHTML = `<div style="background:${cor||'#4b2bbd'}">${html}<p class="tap">toque para continuar</p></div>`;
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
      <h3>${esc(t.nome)}</h3><p>${t.membros.length?t.membros.map(esc).join(' • '):'—'}</p>
      <p class="hint">Casa ${t.pos+1} • ${t.acertos} acertos</p></div>`).join('')}
    <button class="btn" onclick="fecharModal()">Fechar</button>`);
}

function regras(){
  modal(`<h2>📖 Como jogar</h2>
    <p>1. Os jogadores são sorteados em grupos.</p>
    <p>2. Na sua vez, o grupo joga a categoria da casa onde está (ou rola o dado de categoria, se essa opção estiver ligada).</p>
    <p>3. Um jogador do grupo vê a palavra escondido e <b>desenha</b>: nada de letras, números, gestos ou falar!</p>
    <p>4. O resto do grupo tenta adivinhar antes do tempo acabar.</p>
    <p>5. <b>Acertou:</b> rola o dado e anda (e joga de novo, se a opção estiver ligada). <b>Errou:</b> passa a vez.</p>
    <p>6. <b>★ Todos jogam:</b> um desenhista de cada grupo desenha a mesma palavra ao mesmo tempo. Quem acertar primeiro anda.</p>
    <p>7. Vence quem chegar ao 🏁 primeiro (ou quem estiver mais à frente quando acabarem as rodadas).</p>
    <h3>Categorias</h3>
    ${ORDEM.map(c=>`<p><span class="leg" style="background:${CATS[c].cor}">${c}</span><b>${CATS[c].nome}</b> — ${{
      P:'pessoas, profissões e personagens', O:'objetos e coisas', A:'ações e verbos',
      D:'ideias abstratas e difíceis', L:'diversão, esportes, festas e passeios', M:'de tudo: animais, lugares, comidas...'}[c]}</p>`).join('')}
    <button class="btn" onclick="fecharModal()">Entendi!</button>`);
}

// ================== INICIALIZAÇÃO ==================
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=> navigator.serviceWorker.register('sw.js').catch(()=>{}));
}
telaInicio();
