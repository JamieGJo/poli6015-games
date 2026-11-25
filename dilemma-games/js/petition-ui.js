// The Petition Box: projector and phone screens. All text is a draft for Jamie.
import * as E from './petition.js';
import { esc, meter } from './ui.js';

export { E };
export const TITLE = 'The Petition Box';
export const newState = (code, rand) => E.newGame(code, {}, rand);

const N = E.SEAT_NAME;
const num = (n) => (n < 0 ? `−${-n}` : `${n}`);
const signed = (n) => (n > 0 ? `+${n}` : num(n));
const SIG = { praise: 'Praise', silence: 'Silence', petition: 'Petition', protest: 'Protest' };
const STEP_NAME = { lobby: 'Set-up', palace: '1. The Palace decides', event: '2. Event', signals: '3. Signals', resolve: '4. Resolution', chief: "5. The Police Chief's moment", ear: "6. The Palace's ear", end: 'The end' };
const NEXT = { lobby: 'Start Year 1', palace: 'Lock the plan and roll events', event: 'Open signals', signals: 'Reveal and resolve', resolve: 'Continue', chief: 'Continue', ear: 'Next year' };

function board(v) {
  return `<div class="board">
    <div class="gauge"><div class="caps">Stability</div><div class="gnum">${v.stab}<small>/ 12</small></div>${meter(v.stab, 12, { cls: 'stab' })}<div class="small muted">At 0 the regime falls to the street.</div></div>
    <div class="gauge"><div class="caps">Police Strength</div><div class="gnum">${v.strength}</div>${meter(Math.min(v.strength, 12), 12, { mark: v.coupLine, cls: 'str' })}<div class="small muted">From ${v.coupLine}, the Chief may strike.${v.rival ? ' Rival agency: bought.' : ''}</div></div>
  </div>
  <div class="provs">${E.PROVS.map((k) => {
    const r = v.revealed?.[k];
    const sig = r ? (r.signal === 'petition' ? `Petition: band <b>${r.band}</b>` : r.signal === 'protest' ? `Protest (${r.size})${r.crushed ? ' — crushed' : ''}` : SIG[r.signal]) : '';
    const spent = v.spent && ['event', 'signals', 'resolve', 'chief', 'ear'].includes(v.step) ? v.spent : null;
    return `<div class="pv ${r?.signal === 'protest' ? (r.crushed ? 'crushed' : 'protest') : ''}">
      <div class="pvname">${N[k]}</div>
      <div class="pvtags">${v.boxes[k] ? '<span class="tag good">box open</span>' : '<span class="tag">box closed</span>'}${v.police[k] ? '<span class="tag bad">police</span>' : ''}${v.pending[k] ? '<span class="tag warn">petition waiting</span>' : ''}</div>
      ${spent && (spent.gifts[k] || spent.answer[k]) ? `<div class="small">${spent.gifts[k] ? `${spent.gifts[k]} gift${spent.gifts[k] > 1 ? 's' : ''}` : ''}${spent.answer[k] ? `${spent.gifts[k] ? ' · ' : ''}petition answered` : ''}</div>` : ''}
      <div class="pvsig">${sig}</div></div>`;
  }).join('')}</div>`;
}

const logView = (v) => {
  const lines = v.log.filter((l) => l.year === v.year);
  return lines.length ? `<div class="log">${lines.map((l) => `<p class="${l.kind}">${esc(l.text)}</p>`).join('')}</div>` : '';
};

export function hostView(v, ctx) {
  const st = v.step;
  let main = '';
  if (st === 'lobby') {
    main = `<div class="split"><div>${ctx.joinPanel}</div><div>
      <h2>Seats</h2><p class="muted">Five teams: one phone each for the Palace and the four provinces, and a private phone for the Police Chief, a member of the Palace team.</p>
      <div class="seats">${E.SEATS.map((k) => `<div class="seat ${v.seats[k] ? 'in' : ''}"><b>${N[k]}</b><span>${v.seats[k] ? 'joined' : 'waiting'}</span>${v.seats[k] ? `<button class="link" data-cmd="free" data-seat="${k}">free</button>` : ''}</div>`).join('')}</div>
      <div class="card flat"><div class="caps">Settings (open choices in the design)</div>
        <label>Years <select data-set="years"><option ${v.settings.years === 4 ? 'selected' : ''}>4</option><option ${v.settings.years === 3 ? 'selected' : ''}>3</option></select></label>
        <label>Opening a box costs <select data-set="boxCost"><option value="2" ${v.settings.boxCost === 2 ? 'selected' : ''}>2 (design)</option><option value="1" ${v.settings.boxCost === 1 ? 'selected' : ''}>1</option></select></label>
        <label>Event 3 petitions <select data-set="event3"><option value="none" ${v.settings.event3 === 'none' ? 'selected' : ''}>no special rule (design)</option><option value="answer3" ${v.settings.event3 === 'answer3' ? 'selected' : ''}>an answer removes 3</option></select></label>
        <label>Coordination <select data-set="coordNeedsPetition"><option value="0" ${!v.settings.coordNeedsPetition ? 'selected' : ''}>any two unpoliced protests (design)</option><option value="1" ${v.settings.coordNeedsPetition ? 'selected' : ''}>only after a petition is read aloud</option></select></label>
        <p class="small muted">The last three are not yet simulated.</p></div>
      <p class="small">Tell the provinces now: provinces are ranked against each other on points, and the winning province is named at the end.</p></div></div>`;
    return { round: 'Set-up', main, next: NEXT.lobby };
  }
  if (st === 'end') return { round: 'The end', main: endView(v), next: null };
  let prompt = '';
  if (st === 'palace') prompt = `<p class="prompt">${v.year === 1 ? 'The Palace moves first. In Year 1 it has heard nothing.' : 'The Palace moves first, on what it heard last year.'} Palace: plan your 8 tokens on your phone.</p><p class="status">${v.planIn ? 'Plan received. It can still be changed until the leader locks it.' : 'Waiting for the Palace.'}</p>`;
  if (st === 'event') prompt = '<p class="prompt">Each province has had its year. Provinces: look at your phone. The Palace does not see this.</p>';
  if (st === 'signals') prompt = `<p class="prompt">Provinces: choose your signal. Praise and silence are safe and reveal nothing. A petition tells the truth, and everyone hears it. A protest costs you a point.</p><p class="status">${v.signalsIn} of 4 signals in.</p>`;
  if (st === 'resolve') prompt = '<p class="prompt">The signals, all at once.</p>';
  if (st === 'chief') prompt = `<p class="prompt">Police Strength is ${v.strength}. The Police Chief may strike.</p><p class="status">${v.chiefDecided ? 'The Chief has decided.' : 'The Chief is deciding.'}</p>`;
  if (st === 'ear') prompt = `<p class="prompt">The Palace writes its estimate of each province's band. Nobody checks these until the end.</p><p class="status">${v.estIn ? 'Estimates received.' : 'Waiting for the Palace.'}</p>`;
  main = `<div class="split wide"><div>${board(v)}</div><div>${prompt}${logView(v)}</div></div>`;
  return { round: `Year ${v.year} of ${v.settings.years} · ${STEP_NAME[st]}`, main, next: NEXT[st] };
}

function endView(v) {
  const reason = v.end.reason === 'street' ? `The regime fell to the street in Year ${v.end.year}.` : v.end.reason === 'coup' ? `The Police Chief seized power in Year ${v.end.year}.` : `The regime survived all ${v.settings.years} years.`;
  const S = v.scores;
  const cell = (h, k) => {
    const b = h.bands[k], e = h.est?.[k];
    return `<td class="${e ? (e === b ? 'hit' : 'miss') : ''}"><b>${b}</b> <span class="small">G${h.g[k]}</span>${e ? `<div class="small">Palace: ${e}</div>` : ''}<div class="small muted">${SIG[h.signals[k]] || ''}</div></td>`;
  };
  return `<h2>${reason}</h2>
  <div class="split wide"><div>
    <table class="reveal"><tr><th></th>${E.PROVS.map((k) => `<th>${N[k]}</th>`).join('')}</tr>
    <tr><td class="small">Start</td>${E.PROVS.map((k) => `<td><b>${E.BAND(v.start[k])}</b> <span class="small">G${v.start[k]}</span></td>`).join('')}</tr>
    ${v.history.map((h) => `<tr><td class="small">Year ${h.year}</td>${E.PROVS.map((k) => cell(h, k)).join('')}</tr>`).join('')}</table>
    <p class="small muted">True band and Grievance at the end of each year, the Palace's estimate (green: right), and the signal sent.</p>
  </div><div>
    <div class="card"><div class="caps">Provinces, ranked</div>${S.order.map((k) => `<div class="rowb"><span>${S.prov[k].rank}. ${N[k]}</span><span>${num(S.prov[k].pts)} ${Math.abs(S.prov[k].pts) === 1 ? 'point' : 'points'} − Grievance ${S.prov[k].g} = <b>${num(S.prov[k].total)}</b></span></div>`).join('')}</div>
    <div class="card"><div class="caps">The Palace</div><p class="small">${S.palace.years} years survived × 3 = ${S.palace.yearsPts}; saved abroad ${S.palace.saved}${S.palace.keepSaved ? '' : ' (lost: under 5 when the regime fell)'}; correct bands ${S.palace.correct}. <b>Total ${S.palace.total}.</b></p></div>
    <div class="card"><div class="caps">Police Chief${S.chiefs.length > 1 ? 's' : ''}</div><p class="small">${S.chiefs.map((c, i) => `Chief ${i + 1}: ${c.score}`).join(' · ')}</p></div>
  </div></div>
  <div class="card flat"><div class="caps">Debrief</div><ol class="small">
    <li>Did police buy safety or blindness? Wintrobe's paradox (p. 22), beside Mobutu's officials reporting that "the situation is calm" (pp. 24–25).</li>
    <li>Who praised while their Grievance was above 6, and why? Who protested or petitioned below 4?</li>
    <li>What did the rival agency and the payments to the Chief buy? Was the Police Chief more dangerous than the provinces (p. 34)?</li>
    <li>Was the box worth opening?</li>
    <li>Who paid the cost?</li></ol></div>`;
}

export function hostCommand(s, d) {
  if (d.cmd === 'free') return E.freeSeat(s, d.seat);
  if (d.cmd === 'setting' && s.step === 'lobby') {
    const t = JSON.parse(JSON.stringify(s));
    const val = d.key === 'years' || d.key === 'boxCost' ? Number(d.value) : d.key === 'coordNeedsPetition' ? d.value === '1' : d.value;
    t.settings[d.key] = val;
    return t;
  }
  return null;
}

// ---------- phones ----------
export function phoneJoin(v) {
  const free = E.SEATS.filter((k) => !v.seats[k]);
  if (!free.length) return '<div class="card"><h2>All seats are taken</h2><p>Ask the leader to free a seat if a phone has failed.</p></div>';
  return `<div class="card"><h2>${TITLE}</h2><p>Which team is this phone for?</p>
    <div class="stack">${free.map((k) => `<button class="btn wide" data-act="seat" data-seat="${k}">${N[k]}${k === 'chief' ? ' (private: a Palace member)' : ''}</button>`).join('')}</div></div>`;
}

let draft = null, draftKey = '', estDraft = null;
const emptyPlan = () => ({ gifts: {}, police: {}, open: {}, answer: {}, pay: 0, save: 0, rival: false });

export function phoneView(v, me) {
  const head = `<div class="phead"><div><div class="caps">${v.step === 'lobby' ? 'Waiting to start' : v.end ? 'Game over' : `Year ${v.year} · ${STEP_NAME[v.step]}`}</div><div class="pseat">${N[me.seat]}</div></div><div class="mini">Stability <b>${v.stab}</b> · Police <b>${v.strength}</b></div></div>`;
  let body = '';
  if (v.end) body = `<p>${v.end.reason === 'street' ? 'The regime fell to the street.' : v.end.reason === 'coup' ? 'The Police Chief seized power.' : 'The regime survived.'} Look at the projector for the reveal.</p>`
    + (E.PROVS.includes(me.seat) ? `<p>Your final score: ${num(me.pts)} points − Grievance ${me.g} = <b>${num(me.pts - me.g)}</b>.</p>` : '');
  else if (E.PROVS.includes(me.seat)) body = provinceView(v, me);
  else if (me.seat === 'palace') body = palaceView(v, me);
  else if (me.seat === 'chief') body = chiefView(v, me);
  return head + `<div class="pbody">${body}</div>`;
}

function provinceView(v, me) {
  let h = `<div class="griev"><div class="caps">Your Grievance (secret)</div><div class="gnum">${me.g}<small> / 10 · ${E.BAND_NAME[me.band]}</small></div>${meter(me.g, 10, { mark: 8, cls: 'g' })}<div class="small muted">At 8 or more, anger simmers and costs the regime Stability.</div></div>
    <p class="small">Points ${num(me.pts)} · box ${me.box ? 'open' : 'closed'}${me.police ? ' · <b class="bad">police are here this year</b>' : ''}${me.pending ? ' · your petition is waiting for an answer' : ''}</p>`;
  if (me.event && ['event', 'signals'].includes(v.step)) h += `<div class="card flat"><div class="caps">This year</div><p><b>${esc(me.event.name)}</b>: Grievance ${signed(me.event.d)}.</p></div>`;
  if (v.step === 'signals') {
    const opts = [
      ['praise', 'Praise', 'Safe. Reveals nothing.'], ['silence', 'Silence', 'Safe. Reveals nothing.'],
      ['petition', 'Petition', me.box ? 'Your true band is read aloud to the whole room. The Palace can answer next year (Grievance −2); if not, +1.' : 'Your box is closed.'],
      ['protest', 'Protest', me.police ? 'Police are here: it will be crushed (−3 points, Grievance +1).' : 'Costs you 1 point. Costs the regime Stability.'],
    ];
    h += `<div class="stack">${opts.map(([k, l, d]) => `<button class="btn wide sig ${me.signal === k ? 'primary' : ''}" data-act="signal" data-v="${k}" ${k === 'petition' && !me.box ? 'disabled' : ''}><b>${l}</b><span>${d}</span></button>`).join('')}</div>
      <p class="muted small">${me.signal ? `Sent: ${SIG[me.signal]}. You can change it until the leader reveals.` : 'Not sent yet.'}</p>`;
  } else if (v.step === 'resolve') h += '<p>Look at the projector.</p>';
  else h += '<p class="muted">Wait for the next step.</p>';
  return h;
}

function palaceView(v, me) {
  if (v.step === 'palace') {
    let h = '';
    if (me.canWhisper) {
      h += me.whisper ? `<div class="card flat"><div class="caps">Your rival agency whispers</div><p><b>${N[me.whisper.prov]}</b> is <b>${E.BAND_NAME[me.whisper.band]}</b>.</p></div>`
        : `<div class="card flat"><div class="caps">Your rival agency</div><p>Choose one province. Its true band is whispered to you before you spend.</p><div class="rowc">${E.PROVS.map((k) => `<button class="btn" data-act="whisper" data-v="${k}">${N[k]}</button>`).join('')}</div></div>`;
      if (!me.whisper) return h;
    }
    const key = `${v.year}`;
    if (draftKey !== key) { draft = me.plan ? JSON.parse(JSON.stringify(me.plan)) : emptyPlan(); draftKey = key; }
    const cost = planCostLocal(v, draft);
    const left = E.TOKENS - cost;
    const row = (k) => `<div class="prow"><div class="pvname">${N[k]}</div>
      <div class="ctl"><span>Gifts</span><button class="pm" data-act="gift" data-k="${k}" data-d="-1">−</button><b>${draft.gifts[k] || 0}</b><button class="pm" data-act="gift" data-k="${k}" data-d="1">+</button></div>
      <label class="tog"><input type="checkbox" data-act="police" data-k="${k}" ${draft.police[k] ? 'checked' : ''}> Police (1)</label>
      ${v.boxes[k] ? '<span class="small muted">box open</span>' : `<label class="tog"><input type="checkbox" data-act="open" data-k="${k}" ${draft.open[k] ? 'checked' : ''}> Open box (${v.settings.boxCost})</label>`}
      ${v.pending[k] ? `<label class="tog"><input type="checkbox" data-act="answer" data-k="${k}" ${draft.answer[k] ? 'checked' : ''}> Answer petition (1)</label>` : ''}</div>`;
    h += `<p class="small">Gift: Grievance −1 each, up to 3. Police: crush any protest there this year; Police Strength +1. Answer: Grievance −2. ${lastSignals(me)}</p>
      ${E.PROVS.map(row).join('')}
      <div class="prow"><div class="ctl"><span>Pay the Chief (−1 on this year's coup roll)</span><button class="pm" data-act="pay" data-d="-1">−</button><b>${draft.pay}</b><button class="pm" data-act="pay" data-d="1">+</button></div>
      <div class="ctl"><span>Save abroad (secret)</span><button class="pm" data-act="save" data-d="-1">−</button><b>${draft.save}</b><button class="pm" data-act="save" data-d="1">+</button></div>
      ${v.rival ? '' : `<label class="tog"><input type="checkbox" data-act="rival" ${draft.rival ? 'checked' : ''}> Rival agency (3, once): halves Police Strength now; whispers a band each later year</label>`}</div>
      <div class="tokens ${left < 0 ? 'bad' : ''}">Tokens left: <b>${left}</b> of ${E.TOKENS}${left > 0 ? ' <span class="small">(unspent tokens are lost)</span>' : ''}</div>
      <button class="btn primary wide" data-act="plan" ${left < 0 ? 'disabled' : ''}>${me.plan ? 'Plan sent — send changes' : 'Send plan'}</button>
      <p class="small muted">Saved abroad so far: ${me.saved}. If the regime falls, you keep it only if it is 5 or more.</p>`;
    return h;
  }
  if (v.step === 'ear') {
    if (!estDraft || estDraft.year !== v.year) estDraft = { year: v.year, est: { ...(me.est || {}) } };
    const now = v.revealed ? `This year: ${E.PROVS.map((k) => { const r = v.revealed[k]; return `${N[k]} ${r.signal === 'petition' ? `petitioned (band ${r.band})` : r.signal === 'protest' ? `protested (${r.size})` : r.signal === 'praise' ? 'praised' : 'stayed silent'}`; }).join(', ')}.` : '';
    return `<p>Write your estimate of each province's band. ${now}</p>
      ${E.PROVS.map((k) => `<div class="prow"><div class="pvname">${N[k]}</div><div class="rowc">${['L', 'M', 'H'].map((b) => `<button class="btn sm2 ${estDraft.est[k] === b ? 'primary' : ''}" data-act="est" data-k="${k}" data-v="${b}">${b}</button>`).join('')}</div></div>`).join('')}
      <p class="small muted">L = 0–3, M = 4–6, H = 7–10.</p>
      <button class="btn primary wide" data-act="estimate" ${E.PROVS.every((k) => estDraft.est[k]) ? '' : 'disabled'}>${me.estYear === v.year ? 'Estimates sent — send changes' : 'Send estimates'}</button>`;
  }
  return `<p class="muted">Wait for the next step.</p><p class="small">Saved abroad: ${me.saved}.</p>`;
}

function lastSignals(me) {
  const h = me.history[me.history.length - 1];
  return h ? `Last year: ${E.PROVS.map((k) => `${N[k]} ${SIG[h.signals[k]] || '—'}`).join(', ')}.` : '';
}

function planCostLocal(v, p) {
  let c = 0;
  for (const k of E.PROVS) c += (p.gifts[k] || 0) + (p.police[k] ? 1 : 0) + (p.open[k] ? v.settings.boxCost : 0) + (p.answer[k] ? 1 : 0);
  return c + p.pay + p.save + (p.rival ? E.RIVAL_COST : 0);
}

function chiefView(v, me) {
  if (me.purged && v.step !== 'chief') return '<div class="card bad"><p><b>The coup failed. The Police Chief has been purged.</b></p><p>Hand this phone to another member of the Palace: they are the new Police Chief, starting with a score of 0. Police Strength is back to 0.</p></div>';
  let h = `<p class="small">This phone is private. Your score: <b>${me.score}</b> (1 per token the Palace pays you; 10 for a successful coup).${me.chiefNo > 1 ? ` You are Chief number ${me.chiefNo}.` : ''}</p>`;
  if (v.step === 'chief') {
    const need = me.need, chance = Math.max(0, Math.min(6, 7 - need));
    h += `<div class="card"><h3>Strike or wait?</h3><p>Police Strength ${v.strength}, minus ${me.paid} paid to you this year. You need <b>${need > 6 ? 'more than 6' : need < 1 ? 'any roll' : `${need} or more`}</b> on the die: a chance of ${chance} in 6.</p>
      <p class="small">If it fails, you are purged and Police Strength falls to 0.</p>
      ${me.choice ? `<p>You chose: <b>${me.choice === 'strike' ? 'strike' : 'wait'}</b>.</p>` : `<div class="rowc"><button class="btn primary" data-act="coup" data-v="1" ${chance ? '' : 'disabled'}>Strike</button><button class="btn" data-act="coup" data-v="0">Wait</button></div>`}</div>`;
  } else h += `<p>Police Strength is ${v.strength}. From ${v.coupLine} you may strike, at the end of a year.</p><p class="small muted">Paid to you this year: ${me.paid}.</p>`;
  return h;
}

export function phoneAction(d, v, me) {
  if (d.act === 'seat') return { type: 'join', seat: d.seat };
  if (d.act === 'signal') return { type: 'signal', signal: d.v };
  if (d.act === 'whisper') return { type: 'whisper', prov: d.v };
  if (d.act === 'coup') return { type: 'coup', strike: d.v === '1' };
  if (!draft) draft = emptyPlan();
  if (d.act === 'gift') { const n = Math.max(0, Math.min(E.GIFT_MAX, (draft.gifts[d.k] || 0) + Number(d.d))); draft.gifts[d.k] = n; return 'render'; }
  if (['police', 'open', 'answer'].includes(d.act)) { draft[d.act][d.k] = !draft[d.act][d.k]; return 'render'; }
  if (d.act === 'pay' || d.act === 'save') { draft[d.act] = Math.max(0, draft[d.act] + Number(d.d)); return 'render'; }
  if (d.act === 'rival') { draft.rival = !draft.rival; return 'render'; }
  if (d.act === 'plan') return { type: 'plan', plan: draft };
  if (d.act === 'est') { estDraft.est[d.k] = d.v; return 'render'; }
  if (d.act === 'estimate') return { type: 'estimate', est: estDraft.est };
  return null;
}
