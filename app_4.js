/* ==== iOS 100vh -fallback: päivitä --vh jos 100dvh ei käytössä ==== */
(function fixVHFallback(){
  const supportsDVH = CSS.supports && CSS.supports('height', '100dvh');
  if (supportsDVH) return; // modernit selaimet ok
  const setVH = () => {
    const h = (window.visualViewport?.height || window.innerHeight) * 0.01;
    document.documentElement.style.setProperty('--vh', `${h}px`);
  };
  setVH();
  window.addEventListener('resize', setVH, { passive:true });
  window.addEventListener('orientationchange', setVH, { passive:true });
})();

/* ==== Landscape-compact vain kun oikeasti matala näkymä ==== */
(function autoLandscapeCompact(){
  const apply = () => {
    const isLandscape = window.matchMedia('(orientation: landscape)').matches;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                      || window.navigator.standalone === true;
    const h = (window.visualViewport?.height || window.innerHeight);
    // Kynnys: jos PWA-tilassa, sallitaan hiukan suurempi raja
    const landCompact = isLandscape && (isStandalone ? h < 760 : h < 720);
    document.body.classList.toggle('land-compact', landCompact);
  };
  apply();
  window.addEventListener('resize', apply, { passive:true });
  window.addEventListener('orientationchange', apply, { passive:true });
})();

/* ===== PELILOGIIKKA ===== */
const VALUES = {2:100,3:70,4:60,5:50,6:40,7:30,8:40,9:50,10:60,11:70,12:100};
const DIE_CHARS = ['','⚀','⚁','⚂','⚃','⚄','⚅'];

const el = sel => document.querySelector(sel);
const diceEl = el('#dice');
const statusText = el('#statusText');
const turnNum = el('#turnNum');
const totalScoreEl = el('#totalScore');
const rollBtn = el('#rollBtn');
const commitBtn = el('#commitBtn');
const undoBtn = el('#undoBtn');
const resetBtn = el('#resetBtn');
const helpBtn = el('#helpBtn');
const helpDialog = el('#helpDialog');
const closeHelp = el('#closeHelp');

const LS_KEY = 'sackson_solitaire_dice_v1';

let state = null;
let historyStack = [];

/* Alustus */
init();

function init(){
  const saved = localStorage.getItem(LS_KEY);
  if (saved){
    try { state = JSON.parse(saved); } catch(_){ state = freshState(); }
  } else {
    state = freshState();
  }
  renderAll();
}

function freshState(){
  return {
    turn: 1,
    dice: [0,0,0,0,0],
    selected: [], // valittujen noppien indeksit (max 4)
    sums: Object.fromEntries(Object.keys(VALUES).map(k=>[k,0])),
    throwCounts: {1:0,2:0,3:0,4:0,5:0,6:0},
    chosenThrowNums: [], // valitut poistodice-numerot (max 3 erilaista)
    gameOver: false,
    lastMessage: 'Heitä nopat aloittaaksesi.'
  };
}

function save(){ localStorage.setItem(LS_KEY, JSON.stringify(state)); }

function pushHistory(){
  historyStack.push(JSON.parse(JSON.stringify(state)));
  undoBtn.disabled = false;
}

function undo(){
  if (!historyStack.length) return;
  state = historyStack.pop();
  undoBtn.disabled = historyStack.length === 0;
  renderAll();
  status('Peruttu edellinen kirjaus.');
}

/* ---- UI ---- */
function renderAll(){
  turnNum.textContent = state.turn;
  renderDice();
  renderScoreTable();
  renderThrowGrid();
  totalScoreEl.textContent = calcTotal();
  status(state.lastMessage || '');

  // Commit-nappi aktiiviseksi vain kun 4 noppaa valittuna ja peli kesken
  commitBtn.disabled = !(state.selected.length === 4 && !state.gameOver);

  // Roll-nappi pois päältä jos peli loppu TAI pöydässä on jo heitettyjä noppia
  rollBtn.disabled = state.gameOver || state.dice.some(v => v > 0);

  resetBtn.disabled = false;
  undoBtn.disabled = historyStack.length === 0;
}


function renderDice(){
  diceEl.innerHTML = '';
  state.dice.forEach((v, idx)=>{
    const d = document.createElement('button');
    d.className = 'die';
    d.type = 'button';
    d.dataset.index = idx;
    d.title = `Noppa ${idx+1}`;
    d.innerHTML = v ? DIE_CHARS[v] : '—';
    const pos = state.selected.indexOf(idx);
if (pos >= 0) {
  if (pos < 2) d.classList.add('pair1');
  else d.classList.add('pair2');
}

    diceEl.appendChild(d);
  });
}

function renderScoreTable(){
  const tbody = document.querySelector('#scoreTable tbody');
  tbody.innerHTML = '';
  for (let s=2; s<=12; s++){
    const tr = document.createElement('tr');
    const val = VALUES[s];
    const cnt = state.sums[s];
    const score = scoreForCount(cnt, val);
    const cls = cnt<=4?'neg':(cnt===5?'zero':'pos');

    tr.innerHTML = `
      <td class="sum"><strong>${s}</strong></td>
      <td class="badge"><span class="chip">${val}</span></td>
      <td class="badge"><span class="chip">${cnt}</span></td>
      <td class="scoreCell ${cls}">${score>=0?'+':''}${score}</td>
    `;
    tbody.appendChild(tr);
  }
}

function renderThrowGrid(){
  const grid = el('#throwGrid');
  grid.innerHTML = '';
  for (let f=1; f<=6; f++){
    const cnt = state.throwCounts[f];
    const chosen = state.chosenThrowNums.includes(f);
    const item = document.createElement('div');
    item.className = 'throw-item';
item.innerHTML = `
  <div class="throw-head">
    <div>Poisto <span class="throw-die">${DIE_CHARS[f]}</span> <span class="small">${chosen?'(valittu)':''}</span></div>
    <div class="badge"><span class="chip">${cnt}/8</span></div>
  </div>
  <div class="dotrow">${'<span class="dot"></span>'.repeat(8)}</div>
`;

    const dots = item.querySelectorAll('.dot');
    for (let i=0;i<Math.min(8,cnt);i++) dots[i].classList.add('on');
    grid.appendChild(item);
  }
}

function status(msg){
  state.lastMessage = msg;
  statusText.innerHTML = msg;
  save();
}

/* ---- Tapahtumat ---- */
rollBtn.addEventListener('click', ()=>{
  if (state.gameOver) return;
  state.dice = Array.from({length:5},()=>1 + Math.floor(Math.random()*6));
  state.selected = [];
  renderAll();
  status('Valitse 2 + 2 noppaa pareiksi. Viides jää poistoksi.');
});

diceEl.addEventListener('click', (e)=>{
  const btn = e.target.closest('.die');
  if (!btn) return;
  const idx = +btn.dataset.index;
  if (!state.dice[idx]) return;

  const sel = state.selected;
  if (sel.includes(idx)){
    state.selected = sel.filter(i=>i!==idx);
  } else {
    if (sel.length >= 4) return; // max 4 valittua
    state.selected = sel.concat(idx);
  }
  renderAll();
});

commitBtn.addEventListener('click', ()=>{
  if (state.selected.length !== 4) return;

  // Throwaway = se, jota ei valittu
  const allIdx = [0,1,2,3,4];
  const throwIdx = allIdx.find(i => !state.selected.includes(i));
  const throwFace = state.dice[throwIdx];

  // Kolmen poistodicen sääntö + vapaa kyyti
  const set = new Set(state.chosenThrowNums);
  const seenChosenOnRoll = state.dice.some(v => set.has(v));
  let freeRide = false;

  if (state.chosenThrowNums.length < 3){
    // Valitaan automaattisesti uusi, jos ei vielä joukossa
    if (!set.has(throwFace)){
      state.chosenThrowNums.push(throwFace);
    }
  } else {
    // 3 valittua: jos heitossa ei näy yhtään niistä -> vapaa kyyti
    freeRide = !seenChosenOnRoll;
    if (!freeRide && !set.has(throwFace)){
      status('Sinulla on jo 3 poistodice-numeroa. Valitse parit niin, että ylimääräinen noppa on yksi näistä: ' + state.chosenThrowNums.map(x=>DIE_CHARS[x]).join(' '));
      return;
    }
  }

  // Parit muodostetaan valituista: 2 ensimmäistä ja 2 seuraavaa
  const [a,b,c,d] = state.selected.slice();
  const sum1 = state.dice[a] + state.dice[b];
  const sum2 = state.dice[c] + state.dice[d];

  // Undo-snapshot
  pushHistory();

  // Päivitä taulukot
  state.sums[sum1] = (state.sums[sum1]||0) + 1;
  state.sums[sum2] = (state.sums[sum2]||0) + 1;

  if (!freeRide){
    state.throwCounts[throwFace] = (state.throwCounts[throwFace]||0) + 1;
  }

  // Peli loppuu, kun jokin poistodice saavuttaa 8
  if (Object.values(state.throwCounts).some(v => v >= 8)){
    state.gameOver = true;
    renderAll();
    status(`<strong>Peli päättyi.</strong> Kokonaispisteet: <strong>${calcTotal()}</strong>. Paina “Uusi peli”.`);
    return;
  }

  // Seuraava kierros
  state.turn += 1;
  state.selected = [];
  state.dice = [0,0,0,0,0];
  renderAll();
  status('Kirjattu. Heitä uudestaan.');
});

undoBtn.addEventListener('click', undo);

resetBtn.addEventListener('click', ()=>{
  if (!confirm('Aloitetaanko uusi peli? Nykyinen peli nollataan.')) return;
  historyStack = [];
  state = freshState();
  renderAll();
  status('Uusi peli aloitettu. Heitä nopat.');
});

helpBtn.addEventListener('click', ()=>helpDialog.showModal());
closeHelp.addEventListener('click', ()=>helpDialog.close());

/* ---- Laskenta ---- */
function scoreForCount(count, value){
  if (count <= 4) return -200;
  if (count === 5) return 0;
  if (count <= 10) return (count - 5) * value;
  return 5 * value; // yli 10 ei lisää
}
function calcTotal(){
  let sum = 0;
  for (let s=2; s<=12; s++){
    sum += scoreForCount(state.sums[s], VALUES[s]);
  }
  return sum;
}

/* ---- PWA-asennus (valinnainen, jos sinulla on nappi #installBtn) ---- */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.querySelector('#installBtn');
  if (btn) btn.hidden = false;
});
document.querySelector('#installBtn')?.addEventListener('click', async ()=>{
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  const btn = document.querySelector('#installBtn');
  if (btn) btn.hidden = true;
});
