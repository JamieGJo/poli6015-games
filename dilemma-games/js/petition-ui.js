// The Petition Box: projector and phone screens (redesign, 2026-11-25). All text is a draft for Jamie.
// The setting, Valmora, is fictional. Rules and numbers are unchanged: see js/petition.js.
import * as E from './petition.js';
import { esc, meter, stepper, explain, plural, minus } from './ui.js';
import { icon, valmoraMap, palaceScene } from './art.js';

export { E };
export const TITLE = 'The Petition Box';
export const newState = (code, rand) => E.newGame(code, {}, rand);

const N = E.SEAT_NAME;
const BW = E.BAND_WORD;
const moodChip = (b) => `<span class="mood ${b}">${BW[b]}</span>`;

// ---------- the setting ----------
export const PROV = {
  north: { people: 'copper miners', blurb: 'Pit towns in the hills. Their copper pays for the capital.' },
  south: { people: 'wheat farmers', blurb: 'The breadbasket. When prices rise, the plains feel it first.' },
  east: { people: 'dockworkers and traders', blurb: 'The busy port, where news travels fast.' },
  west: { people: 'a people with their own language', blurb: 'Mountain valleys, long suspicious of the capital.' },
};
const EV_ICON = { 1: 'drought', 2: 'prices', 3: 'theft', 4: 'quiet', 5: 'harvest', 6: 'road' };
export const EVENT_TEXT = {
  north: { 1: 'A mine collapses. The town buries its dead.', 2: 'Copper prices fall and the mine cuts wages.', 3: 'The mine director is caught selling copper on the side.', 4: 'A quiet year in the hills.', 5: 'A new seam is found. Jobs come back.', 6: 'A new hospital opens in the pit towns.' },
  south: { 1: 'Drought. The wells run dry and the wheat withers.', 2: 'Fuel and fertiliser prices rise.', 3: 'The grain official is caught stealing seed.', 4: 'A quiet year on the plains.', 5: 'A good harvest.', 6: 'A new road reaches the villages.' },
  east: { 1: 'Storms close the harbour for months. No work, no pay.', 2: 'Bread prices rise in the city.', 3: 'Customs officers are caught taking bribes.', 4: 'A quiet year in the port.', 5: 'A trade deal brings the ships back.', 6: 'The port is rebuilt with new cranes.' },
  west: { 1: 'Floods wash away the valley farms.', 2: 'The bus fare to the capital doubles.', 3: 'The governor is caught pocketing the road budget.', 4: 'A quiet year in the valleys.', 5: 'A good year for the orchards.', 6: 'A new road is built through the valleys.' },
};
const STEPS = [
  { key: 'palace', label: 'The Palace decides' }, { key: 'event', label: 'Events' }, { key: 'signals', label: 'Signals' },
  { key: 'resolve', label: 'What happened' }, { key: 'chief', label: "The Chief's moment" }, { key: 'ear', label: "The Palace's guess" },
];
const STEP_NO = Object.fromEntries(STEPS.map((s, i) => [s.key, i + 1]));
const NEXT = { lobby: 'Start Year 1', palace: 'Lock the plan: on to the events', event: 'Open the signals', signals: 'Reveal the signals', resolve: 'Continue', chief: 'Continue', ear: 'Next year' };
const SIG_LABEL = { praise: 'Praise the leader', silence: 'Stay silent', petition: 'Send a petition', protest: 'Protest in the streets' };
const SIG_ICON = { praise: 'praise', silence: 'silence', petition: 'petition', protest: 'protest' };

export const GLOSS = {
  grievance: 'How angry a province is with the regime, from 0 (content) to 10 (furious). Only the province can see it.',
  mood: 'Grievance in words: calm (0–3), restless (4–6) or angry (7–10).',
  stability: 'How firmly the regime holds the country. It starts at 12. At 0, the crowds topple the regime.',
  strength: 'How powerful the security police have become. It grows with every police deployment and every crushed protest. From 6, the Police Chief can try a coup.',
  tokens: 'The Palace has 8 tokens a year: its budget. Unspent tokens are lost.',
};

// ---------- map and gauges ----------
function mapState(v, you = null) {
  const prov = {};
  const after = ['event', 'signals', 'resolve', 'chief', 'ear'].includes(v.step);
  for (const k of E.PROVS) {
    const r = v.revealed?.[k];
    prov[k] = {
      police: v.police[k], box: v.boxes[k], pending: v.pending[k],
      aid: after && v.spent ? v.spent.gifts[k] || 0 : 0,
      signal: r && ['resolve', 'chief', 'ear'].includes(v.step) ? r.signal : null, crushed: !!r?.crushed,
      mood: v.end && v.final ? E.BAND(v.final[k].g) : null,
    };
  }
  return { you, prov };
}
const mapKey = () => `<div class="mapkey"><span>${icon('police')} police</span><span>${icon('box')} petition box open</span><span>${icon('answer')} petition waiting</span><span>${icon('aid')} aid sent</span><span>${icon('protest')} protest</span><span>${icon('petition')} petition</span></div>`;

function gauges(v) {
  return `<div class="gauges">
    <div class="gauge"><h4>${icon('stability')} Stability <span class="gnum" style="margin-left:auto">${v.stab}<small> / 12</small></span></h4>${meter(v.stab, 12, { cls: 'stab' })}<div class="gnote">${GLOSS.stability}</div></div>
    <div class="gauge"><h4>${icon('police')} Police Strength <span class="gnum" style="margin-left:auto">${v.strength}</span></h4>${meter(Math.min(v.strength, 12), 12, { mark: v.coupLine, cls: 'str' })}<div class="gnote">From ${v.coupLine} (red outline) the Police Chief can try a coup.${v.rival ? ' The Palace has a rival agency.' : ''}</div></div>
  </div>`;
}

// What the Palace did this year, in public (payments and savings stay secret).
function palaceDid(v) {
  const sp = v.spent, lp = v.lastPlan;
  if (!sp) return '';
  const rows = [];
  for (const k of E.PROVS) {
    if (sp.gifts[k]) rows.push(['aid', 'good', `Sent aid to ${N[k]} (${sp.gifts[k]} ${sp.gifts[k] === 1 ? 'crate' : 'crates'}). Each crate cools their grievance by 1.`]);
    if (sp.answer[k]) rows.push(['answer', 'good', `Answered the petition from ${N[k]}. Their grievance falls by 2.`]);
    if (sp.open[k]) rows.push(['box', '', `Opened a petition box in ${N[k]}. From now on they can petition.`]);
  }
  for (const k of lp?.ignored || []) rows.push(['answer', 'bad', `Ignored the petition from ${N[k]}. Their grievance rises by 1.`]);
  const pol = E.PROVS.filter((k) => sp.police[k]);
  if (v.policeHidden && v.policeCount === E.PROVS.length) rows.push(['police', 'warn', 'Stationed police in <b>every province</b>. Any protest this year will be crushed.']);
  else if (v.policeHidden && v.policeCount) rows.push(['police', 'warn', `Stationed police in ${v.policeCount === 1 ? 'one province' : `${v.policeCount} provinces`}. <b>Where is secret</b> until the signals are read. Any protest where they stand will be crushed.`]);
  else if (pol.length) rows.push(['police', 'warn', `Stationed police in ${pol.map((k) => N[k]).join(', ')}. Any protest there this year will be crushed.`]);
  if (lp?.rival) rows.push(['eye', 'warn', `Bought a rival agency: Police Strength ${lp.rivalFrom} → ${Math.floor(lp.rivalFrom / 2)}.`]);
  if (lp && lp.strengthTo !== lp.strengthFrom) rows.push(['police', 'warn', `Police Strength ${lp.strengthFrom} → ${lp.strengthTo}.`]);
  if (!rows.length) rows.push(['palace', '', 'Nothing the public can see.']);
  return `<div class="happen"><div class="caps">What the Palace did this year</div>${rows.map(([i, c, t]) => `<div class="row ${c}">${icon(i)}<div>${t}</div></div>`).join('')}
    <p class="small muted" style="margin-top:6px">Anything paid to the Police Chief or saved abroad is secret.</p></div>`;
}

function whatHappened(v) {
  const R = v.lastResolve; if (!R) return '';
  const rows = [];
  const stood = E.PROVS.filter((k) => v.police[k]);
  rows.push(['police', stood.length ? 'warn' : '', stood.length ? `<b>The police stood in ${stood.map((k) => N[k]).join(', ')}.</b>` : 'There were no police anywhere this year.']);
  for (const k of E.PROVS) {
    const r = v.revealed[k];
    if (r.signal === 'praise') rows.push(['praise', '', `<b>${N[k]}</b> praised the leader. It tells the Palace nothing.`]);
    if (r.signal === 'silence') rows.push(['silence', '', `<b>${N[k]}</b> stayed silent. It tells the Palace nothing.`]);
    if (r.signal === 'petition') rows.push(['petition', '', `<b>${N[k]}</b> petitioned. Its people are ${moodChip(r.band)}. Everyone heard. The Palace can answer next year.`]);
  }
  for (const it of R.items) {
    if (it.kind === 'protest') rows.push(['protest', 'bad', `<b>${N[it.prov]}</b> protested: a ${it.size} protest, with no police there. Stability −${it.d}.`]);
    if (it.kind === 'crushed') rows.push(['crushed', 'warn', `<b>${N[it.prov]}</b> protested (${it.size}), and the police crushed it. No stability lost, but Police Strength +1, and the province's grievance rises.`]);
    if (it.kind === 'coord') rows.push(['protest', 'bad', `${it.n} provinces protested at once: the protests feed each other. Stability −1.`]);
    if (it.kind === 'simmer') rows.push(['info', 'bad', `Anger is simmering in ${it.n === 1 ? 'one province' : `${it.n} provinces`} (grievance 8 or more). The Palace is not told which. Stability −${it.d}.`]);
  }
  rows.push(['stability', R.stabTo < R.stabFrom ? 'bad' : '', `Stability ${R.stabFrom} → <b>${R.stabTo}</b>.${R.strengthTo !== R.strengthFrom ? ` Police Strength ${R.strengthFrom} → <b>${R.strengthTo}</b>.` : ''}`]);
  return `<div class="happen">${rows.map(([i, c, t]) => `<div class="row ${c}">${icon(i)}<div>${t}</div></div>`).join('')}</div>`;
}

const rawLog = (v) => {
  const lines = v.log.filter((l) => l.year === v.year);
  return lines.length ? `<details class="raw"><summary>The leader's log</summary>${lines.map((l) => `<p class="${l.kind}">${esc(l.text)}</p>`).join('')}</details>` : '';
};

// ---------- projector ----------
export function hostView(v, ctx) {
  const st = v.step;
  if (st === 'lobby') {
    const main = `<div class="split"><div>
        ${explain({ title: 'Valmora, a dictatorship', what: 'The Palace rules Valmora from the capital. Four provinces each have a secret grievance: how angry their people are. The Palace can buy loyalty, send in the police, or open petition boxes and listen. Each year the provinces choose what to tell the capital. Can the regime survive four years without the street, or its own police, bringing it down?', art: palaceScene() })}
        ${valmoraMap({ prov: {} })}
        <div class="rowc small">${E.PROVS.map((k) => `<span><b>${N[k]}</b>: ${PROV[k].people}</span>`).join(' · ')}</div>
      </div><div>
        ${ctx.joinPanel || ''}
        <h2>Seats</h2><p class="muted">One phone for the Palace team and one for each province. The Police Chief is a member of the Palace team with a private phone of their own.</p>
        <div class="seats">${E.SEATS.map((k) => `<div class="seat ${v.seats[k] ? 'in' : ''}"><b>${N[k]}</b><span>${v.seats[k] ? 'joined' : 'waiting'}</span>${v.seats[k] && ctx.joinPanel ? `<button class="link" data-cmd="free" data-seat="${k}">free</button>` : ''}</div>`).join('')}</div>
        ${ctx.joinPanel ? `<div class="card flat"><div class="caps">Settings (choices the design leaves open)</div>
          <label>Years <select data-set="years"><option ${v.settings.years === 4 ? 'selected' : ''}>4</option><option ${v.settings.years === 3 ? 'selected' : ''}>3</option></select></label>
          <label>Opening a box costs <select data-set="boxCost"><option value="2" ${v.settings.boxCost === 2 ? 'selected' : ''}>2 (design)</option><option value="1" ${v.settings.boxCost === 1 ? 'selected' : ''}>1</option></select></label>
          <label>Petitions about a corrupt official <select data-set="event3"><option value="none" ${v.settings.event3 === 'none' ? 'selected' : ''}>no special rule (design)</option><option value="answer3" ${v.settings.event3 === 'answer3' ? 'selected' : ''}>an answer removes 3</option></select></label>
          <label>Protests feeding each other <select data-set="coordNeedsPetition"><option value="0" ${!v.settings.coordNeedsPetition ? 'selected' : ''}>any two unpoliced protests (design)</option><option value="1" ${v.settings.coordNeedsPetition ? 'selected' : ''}>only after a petition is read aloud</option></select></label>
          <p class="small muted">The last three are not yet simulated.</p></div>
        <p class="small"><b>Tell the provinces:</b> provinces are ranked against each other on points, and the winning province is named at the end.</p>` : ''}
      </div></div>`;
    return { round: 'Set-up', main, next: NEXT.lobby };
  }
  if (st === 'end') return { round: 'The end', main: endView(v, ctx), next: null };

  const n = STEP_NO[st];
  let ex = '', extra = '';
  if (st === 'palace') {
    ex = explain({
      title: `Step 1 of 6 · The Palace decides`,
      what: v.year === 1 ? 'The Palace moves first, and in Year 1 it has heard nothing from the provinces. That is the dictator\'s problem: it must act before it knows.' : 'The Palace moves first, on what it heard last year.',
      who: 'The Palace team, on its phone.',
      todo: `Palace: spend your 8 tokens on aid, police, petition boxes, the Police Chief or a Swiss account. Provinces: think about what you will tell the capital. ${v.planIn ? '<b>The plan has arrived.</b>' : '<b>Waiting for the Palace.</b>'}`,
    });
  } else if (st === 'event') {
    ex = explain({ title: 'Step 2 of 6 · A year in the provinces', what: 'Each province has had its own year: a drought, rising prices, a corrupt official, a good harvest. Their grievance has moved. Only they know how. The Palace does not.', who: 'The provinces.', todo: 'Provinces: read your phone. It shows what happened to you and your grievance now.' });
    extra = palaceDid(v);
  } else if (st === 'signals') {
    ex = explain({ title: 'Step 3 of 6 · What do you tell the capital?', what: `Each province chooses one signal, in secret. All four are revealed together. <b>${v.signalsIn} of 4 signals in.</b>`, who: 'The four provinces.', todo: 'Provinces: choose on your phone. You can change your mind until the reveal.' });
    extra = `<div class="happen">${['praise', 'silence', 'petition', 'protest'].map((k) => `<div class="row">${icon(SIG_ICON[k])}<div><b>${SIG_LABEL[k]}.</b> ${{
      praise: 'Safe. The Palace learns nothing about your mood.',
      silence: 'Safe. The Palace learns nothing.',
      petition: 'Only with an open petition box. Your true mood is read out to everyone: the Palace learns the truth, and so do the other provinces.',
      protest: `Costs the province 1 point. With no police there, the regime loses stability. Where police are stationed, the protest is crushed. ${v.policeCount === E.PROVS.length ? 'This year there are police in every province.' : v.policeCount ? `This year there are police in ${v.policeCount === 1 ? 'one province' : `${v.policeCount} provinces`}, and only the Palace knows which.` : 'This year the Palace placed no police.'}`,
    }[k]}</div></div>`).join('')}</div>` + palaceDid(v);
  } else if (st === 'resolve') {
    ex = explain({ title: 'Step 4 of 6 · What happened', what: 'The signals, all at once, and what they did to the regime.', who: '', todo: '' });
    extra = whatHappened(v);
  } else if (st === 'chief') {
    ex = explain({ title: "Step 5 of 6 · The Police Chief's moment", what: `The police are now strong (Strength ${v.strength}). The Police Chief may try to seize power. The coup succeeds on a die roll plus Police Strength, minus whatever the Palace paid the Chief this year, of 11 or more. If it fails, the Chief is purged and the police start again from 0.`, who: 'The Police Chief, on their private phone.', todo: v.chiefDecided ? '<b>The Chief has decided.</b>' : '<b>The Chief is deciding.</b>' });
    extra = whatHappened(v);
  } else if (st === 'ear') {
    const coup = v.coupRoll ? `<div class="happen"><div class="row ${v.coupRoll.success ? 'bad' : 'warn'}">${icon('coup')}<div>The Police Chief struck: rolled ${v.coupRoll.roll} + Strength ${v.coupRoll.strength} − ${v.coupRoll.paid} paid = <b>${v.coupRoll.total}</b> (11 needed). ${v.coupRoll.success ? 'The coup succeeds.' : 'The coup fails. The Chief is purged, and Police Strength falls to 0.'}</div></div></div>` : v.chiefChoice === 'wait' ? `<div class="happen"><div class="row">${icon('chief')}<div>The Police Chief waited.</div></div></div>` : '';
    ex = explain({ title: "Step 6 of 6 · The Palace's guess", what: 'The Palace never sees anyone\'s grievance. Now it writes down which mood it thinks each province is in: calm, restless or angry. Nobody checks until the end, when each right guess scores a point.', who: 'The Palace team.', todo: v.estIn ? '<b>Guesses received.</b>' : '<b>Waiting for the Palace.</b>' });
    extra = coup + whatHappened(v);
  }
  const main = `<div class="split wide"><div>${valmoraMap(mapState(v, ctx.you || null))}${mapKey()}${gauges(v)}</div>
    <div>${stepper(STEPS, st)}${ex}${extra}${rawLog(v)}</div></div>`;
  return { round: `Year ${v.year} of ${v.settings.years} · Step ${n}: ${STEPS[n - 1].label}`, main, next: NEXT[st] };
}

function endView(v, ctx = {}) {
  const reason = v.end.reason === 'street' ? `The regime fell to the street in Year ${v.end.year}.` : v.end.reason === 'coup' ? `The Police Chief seized power in Year ${v.end.year}.` : `The regime survived all ${v.settings.years} years.`;
  const S = v.scores;
  const cell = (h, k) => {
    const b = h.bands[k], e = h.est?.[k];
    return `<td class="${e ? (e === b ? 'hit' : 'miss') : ''}">${moodChip(b)} <span class="small">(${h.g[k]})</span>${e ? `<div class="small">Palace guessed: ${BW[e]}</div>` : ''}<div class="small muted">${h.signals[k] ? SIG_LABEL[h.signals[k]] : ''}</div></td>`;
  };
  return `<h2>${reason}</h2>
  <div class="split wide"><div>
    ${valmoraMap(mapState(v, ctx.you || null))}<p class="small muted">The map now shows each province's true mood at the end.</p>
    <table class="reveal"><tr><th></th>${E.PROVS.map((k) => `<th>${N[k]}</th>`).join('')}</tr>
    <tr><td class="small">Start</td>${E.PROVS.map((k) => `<td>${moodChip(E.BAND(v.start[k]))} <span class="small">(${v.start[k]})</span></td>`).join('')}</tr>
    ${v.history.map((h) => `<tr><td class="small">Year ${h.year}</td>${E.PROVS.map((k) => cell(h, k)).join('')}</tr>`).join('')}</table>
    <p class="small muted">True mood (grievance in brackets) at the end of each year, the Palace's guess (green: right, red: wrong), and the signal sent.</p>
  </div><div>
    <div class="card"><div class="caps">Provinces, ranked</div>${S.order.map((k) => `<div class="rowb"><span>${S.prov[k].rank}. ${N[k]}</span><span>${minus(S.prov[k].pts)} ${Math.abs(S.prov[k].pts) === 1 ? 'point' : 'points'} − grievance ${S.prov[k].g} = <b>${minus(S.prov[k].total)}</b></span></div>`).join('')}</div>
    <div class="card"><div class="caps">The Palace</div><p class="small">${S.palace.years} years survived × 3 = ${S.palace.yearsPts}; saved abroad ${S.palace.saved}${S.palace.keepSaved ? '' : ' (lost: less than 5 when the regime fell)'}; right guesses ${S.palace.correct}. <b>Total ${S.palace.total}.</b></p></div>
    <div class="card"><div class="caps">Police Chief${S.chiefs.length > 1 ? 's' : ''}</div><p class="small">${S.chiefs.map((c, i) => `Chief ${i + 1}: ${c.score}`).join(' · ')}</p></div>
  </div></div>
  <div class="card flat"><div class="caps">Debrief</div><ol class="small">
    <li>Did police buy safety, or blindness? Wintrobe's paradox (p. 22), beside Mobutu's officials reporting that "the situation is calm" (pp. 24–25).</li>
    <li>Who praised while angry, and why? Who protested or petitioned while calm?</li>
    <li>Who hid their grievance because they did not know where the police were? Would you have protested if you had known?</li>
    <li>Did the Palace ever reward a province that protested? What did that teach the other provinces?</li>
    <li>What did the rival agency and the payments to the Chief buy? Was the Police Chief more dangerous than the provinces (p. 34)?</li>
    <li>Was the petition box worth opening?</li>
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
    <div class="stack">${free.map((k) => `<button class="btn wide" data-act="seat" data-seat="${k}">${N[k]}${E.PROVS.includes(k) ? ` <span class="small muted">· ${PROV[k].people}</span>` : k === 'chief' ? ' <span class="small muted">· private: a Palace member</span>' : ''}</button>`).join('')}</div></div>`;
}

let draft = null, draftKey = '', estDraft = null;
const emptyPlan = () => ({ gifts: {}, police: {}, open: {}, answer: {}, pay: 0, save: 0, rival: false });

export function phoneView(v, me) {
  const step = v.step === 'lobby' ? 'Waiting to start' : v.end ? 'Game over' : `Year ${v.year} of ${v.settings.years} · step ${STEP_NO[v.step]} of 6: ${STEPS[STEP_NO[v.step] - 1].label}`;
  const head = `<div class="phead"><div><div class="caps">${step}</div><div class="pseat">${N[me.seat]}</div></div><div class="mini">Stability <b>${v.stab}</b>/12<br>Police <b>${v.strength}</b></div></div>`;
  let body = '';
  if (v.end) body = endPhone(v, me);
  else if (E.PROVS.includes(me.seat)) body = provinceView(v, me);
  else if (me.seat === 'palace') body = palaceView(v, me);
  else if (me.seat === 'chief') body = chiefView(v, me);
  return head + `<div class="pbody">${body}</div>`;
}

function endPhone(v, me) {
  const why = v.end.reason === 'street' ? 'The regime fell to the street.' : v.end.reason === 'coup' ? 'The Police Chief seized power.' : 'The regime survived.';
  let h = `<div class="story ${v.end.reason === 'survived' ? 'good' : 'bad'}">${icon(v.end.reason === 'coup' ? 'coup' : v.end.reason === 'street' ? 'protest' : 'palace')}<p class="st">${why}</p></div>`;
  if (E.PROVS.includes(me.seat)) {
    const rank = v.scores?.prov[me.seat]?.rank;
    h += `<p>Your score: ${minus(me.pts)} ${Math.abs(me.pts) === 1 ? 'point' : 'points'} − grievance ${me.g} = <b>${minus(me.pts - me.g)}</b>.${rank ? ` You finished <b>${rank} of 4</b> provinces.` : ''}</p>`;
  }
  return h + '<p class="muted">Look at the projector for the reveal.</p>';
}

function grievanceBlock(me) {
  const cells = [...Array(11).keys()].map((i) => `<span class="${E.BAND(i)} ${i <= me.g ? '' : 'off'}"></span>`).join('');
  return `<div class="griev"><div class="caps">Your grievance (secret)</div>
    <div class="gnum">${me.g}<small> / 10 · your people are </small>${moodChip(me.band)}</div>
    <div class="gauge10">${cells}</div>
    <div class="moodscale"><div class="L ${me.band === 'L' ? 'on' : ''}">calm 0–3</div><div class="M ${me.band === 'M' ? 'on' : ''}">restless 4–6</div><div class="H ${me.band === 'H' ? 'on' : ''}">angry 7–10</div></div>
    <div class="small muted">${GLOSS.grievance} At 8 or more, anger simmers and costs the regime 1 stability a year, whatever you say.</div></div>`;
}

function noteStories(me) {
  const out = [];
  for (const n of me.notes || []) {
    const ch = `Grievance ${n.from} → <b>${n.to}</b>.`;
    if (n.kind === 'event') out.push([n.to > n.from ? 'bad' : n.to < n.from ? 'good' : '', EV_ICON[n.roll], `<span class="st">${EVENT_TEXT[me.seat][n.roll]}</span> ${n.to !== n.from ? ch : 'Grievance stays at ' + n.to + '.'}${n.roll === 3 ? ' (This is the kind of thing people petition about.)' : ''}`]);
    if (n.kind === 'aid') out.push(['good', 'aid', `<span class="st">The capital sent aid: ${plural(n.n, 'crate', 'crates')}.</span> ${ch} You keep the aid as points (+${n.n}).`]);
    if (n.kind === 'answered') out.push(['good', 'answer', `<span class="st">The capital answered your petition.</span> ${ch} +2 points.`]);
    if (n.kind === 'ignored') out.push(['bad', 'answer', `<span class="st">The capital ignored your petition.</span> ${ch}`]);
    if (n.kind === 'opened') out.push(['', 'box', '<span class="st">A petition box has been opened here.</span> From now on you can send a petition.']);
    if (n.kind === 'police') out.push(['warn', 'police', '<span class="st">Police have arrived this year.</span> Any protest here will be crushed.']);
    if (n.kind === 'crushed') out.push(['bad', 'crushed', `<span class="st">The police crushed your protest.</span> ${ch} −3 points in all.`]);
  }
  return out.map(([c, i, t]) => `<div class="story ${c}">${icon(i)}<p>${t}</p></div>`).join('');
}

function provinceView(v, me) {
  let h = '';
  if (v.step === 'lobby') {
    return `<div class="card">${valmoraMap({ you: me.seat, prov: {} })}<h3>You are ${N[me.seat]}: ${PROV[me.seat].people}</h3><p>${PROV[me.seat].blurb}</p>
      <p><b>Your goal:</b> finish with the most points of the four provinces. You gain a point for every crate of aid and 2 for every petition the Palace answers. A protest costs 1 point (3 if the police crush it). At the end, your grievance is taken off your points.</p></div>
      ${grievanceBlock(me)}<p class="muted">Wait for the leader to start Year 1.</p>`;
  }
  h += grievanceBlock(me);
  h += `<p class="small">Points so far: <b>${minus(me.pts)}</b> · petition box ${me.box ? '<b>open</b>' : 'closed'}${me.police ? ' · <b class="bad">police are here this year</b>' : ''}${me.pending ? ' · your petition is waiting for an answer' : ''}</p>`;
  const stories = noteStories(me);
  if (stories && v.step !== 'palace') h += `<div class="caps">This year</div>${stories}`;
  if (v.step === 'signals') {
    const big = me.g >= 6;
    const opts = {
      praise: 'Tell the capital all is well. Safe. The Palace learns nothing about your mood.',
      silence: 'Say nothing. Safe. The Palace learns nothing.',
      petition: me.box ? `Your true mood (${BW[me.band]}) is read out to the whole room. Next year the Palace can answer it (grievance −2, +2 points) or ignore it (grievance +1).` : 'You have no petition box. Only the Palace can open one.',
      protest: me.policeHidden && me.policeCount === E.PROVS.length ? 'Police are stationed in every province this year: your protest will be crushed. −3 points in all, grievance +1, and the police grow stronger. The regime loses no stability.'
        : me.policeHidden && me.policeCount ? `Take to the streets. Costs you 1 point. <b>Police are stationed in ${me.policeCount === 1 ? 'one province' : `${me.policeCount} provinces`}, and you do not know which.</b> If they are here, your protest is crushed: −3 points in all, grievance +1, and the police grow stronger. If not, the regime loses ${big ? 2 : 1} stability.` : me.police ? 'Police are here: your protest will be crushed. −3 points, grievance +1, and the police grow stronger. The regime loses no stability.' : `Take to the streets. Costs you 1 point. The regime loses ${big ? 2 : 1} stability: a ${big ? 'large' : 'small'} protest, because your grievance is ${me.g}. If another province protests too, it loses 1 more.`,
    };
    h += `<h3>What do you tell the capital?</h3>${['praise', 'silence', 'petition', 'protest'].map((k) => `<button class="sigc ${k} ${me.signal === k ? 'on' : ''}" data-act="signal" data-v="${k}" ${k === 'petition' && !me.box ? 'disabled' : ''}>${icon(SIG_ICON[k])}<b>${SIG_LABEL[k]}</b><span>${opts[k]}</span></button>`).join('')}
      <p class="muted small">${me.signal ? `Sent: ${SIG_LABEL[me.signal]}. You can change it until the leader reveals the signals.` : 'Not sent yet.'}</p>`;
  } else if (v.step === 'palace') h += `<div class="story">${icon('palace')}<p>The Palace is deciding what to do this year. Look at the projector.</p></div>`;
  else if (v.step === 'event') h += '<p class="muted">Next, you choose what to tell the capital.</p>';
  else h += '<p class="muted">Look at the projector.</p>';
  return h;
}

// ---------- the Palace ----------
function evidence(v, me, k) {
  const h = me.history[me.history.length - 1];
  const bits = [];
  if (h) {
    const s = h.signals[k];
    bits.push(s === 'protest' ? 'protested last year' : s === 'petition' ? 'petitioned last year' : s === 'praise' ? 'praised you last year' : 'was silent last year');
  } else bits.push('you have heard nothing yet');
  if (me.whisper && me.whisper.prov === k) bits.push(`your agency whispers: ${BW[me.whisper.band]}`);
  if (v.boxes[k]) bits.push('box open');
  if (v.pending[k]) bits.push('<b>petition waiting</b>');
  return bits.join(' · ');
}

function palaceView(v, me) {
  if (v.step === 'lobby') return `<div class="card">${palaceScene()}<h3>You are the Palace</h3><p>You rule Valmora. Each year you get 8 tokens to spend. You score 3 points for each year the regime survives, 1 for each token saved abroad, and 1 for each province whose mood you guess right at the end.</p><p>The danger comes from two sides: the street, if stability falls to 0, and your own police, if they grow strong enough to take over.</p></div><p class="muted">Wait for the leader to start Year 1.</p>`;
  if (v.step === 'palace') {
    let h = '';
    if (me.canWhisper) {
      h += me.whisper ? `<div class="story warn">${icon('eye')}<p><span class="st">Your rival agency whispers:</span> ${N[me.whisper.prov]} is ${moodChip(me.whisper.band)}.</p></div>`
        : `<div class="pcardp"><h3>${icon('eye')} Your rival agency</h3><p class="small">Choose one province. The agency tells you its true mood before you spend.</p><div class="rowc">${E.PROVS.map((k) => `<button class="btn" data-act="whisper" data-v="${k}">${N[k]}</button>`).join('')}</div></div>`;
      if (!me.whisper) return h;
    }
    const key = `${v.year}`;
    if (draftKey !== key) { draft = me.plan ? JSON.parse(JSON.stringify(me.plan)) : emptyPlan(); draftKey = key; }
    const cost = planCostLocal(v, draft), left = E.TOKENS - cost;
    const nPolice = E.PROVS.filter((k) => draft.police[k]).length;
    const sNow = draft.rival && !v.rival ? Math.floor(v.strength / 2) : v.strength, sAfter = sNow + nPolice;
    h += `<p class="small">${v.year === 1 ? 'Year 1: you have heard nothing yet. ' : ''}${GLOSS.tokens}</p>`;
    h += E.PROVS.map((k) => `<div class="pcardp"><h3>${N[k]}</h3><div class="evid">${evidence(v, me, k)}</div>
      <div class="mv aid">${icon('aid')}<div><h4>Send aid <span class="cost">· 1 token a crate, up to 3</span></h4><p>Each crate cools their grievance by 1. They keep it as points.</p></div>
        <div class="ctrl"><button class="pm" data-act="gift" data-k="${k}" data-d="-1">−</button><b>${draft.gifts[k] || 0}</b><button class="pm" data-act="gift" data-k="${k}" data-d="1">+</button></div></div>
      <div class="mv police">${icon('police')}<div><h4>Station police <span class="cost">· 1 token</span></h4><p>Any protest here this year is crushed, so it costs you no stability.</p><p class="risk">Police Strength +1 now, and +1 more for each protest they crush.</p></div>
        <button class="sw ${draft.police[k] ? 'on' : ''}" data-act="police" data-k="${k}">${draft.police[k] ? 'Yes' : 'No'}</button></div>
      ${v.boxes[k] ? '' : `<div class="mv box">${icon('box')}<div><h4>Open a petition box <span class="cost">· ${v.settings.boxCost} tokens, once</span></h4><p>From this year they can petition. Their true mood is read aloud: you learn the truth.</p><p class="risk">So do the other provinces.</p></div>
        <button class="sw ${draft.open[k] ? 'on' : ''}" data-act="open" data-k="${k}">${draft.open[k] ? 'Yes' : 'No'}</button></div>`}
      ${v.pending[k] ? `<div class="mv answer">${icon('answer')}<div><h4>Answer their petition <span class="cost">· 1 token</span></h4><p>Their grievance falls by 2 and they gain 2 points.</p><p class="risk">Ignore it, and their grievance rises by 1.</p></div>
        <button class="sw ${draft.answer[k] ? 'on' : ''}" data-act="answer" data-k="${k}">${draft.answer[k] ? 'Yes' : 'No'}</button></div>` : ''}
    </div>`).join('');
    h += `<div class="pcardp"><h3>${icon('palace')} Your own safety</h3>
      <div class="mv coin">${icon('coin')}<div><h4>Pay the Police Chief <span class="cost">· 1 token each</span></h4><p>Each token lowers the Chief's coup roll by 1 this year. The Chief keeps it.</p></div>
        <div class="ctrl"><button class="pm" data-act="pay" data-d="-1">−</button><b>${draft.pay}</b><button class="pm" data-act="pay" data-d="1">+</button></div></div>
      <div class="mv plane">${icon('plane')}<div><h4>Save abroad <span class="cost">· 1 token each, secret</span></h4><p>A Swiss account: 1 point each at the end.</p><p class="risk">If the regime falls, you keep it only if you have saved 5 or more. So far: ${me.saved}.</p></div>
        <div class="ctrl"><button class="pm" data-act="save" data-d="-1">−</button><b>${draft.save}</b><button class="pm" data-act="save" data-d="1">+</button></div></div>
      ${v.rival ? '' : `<div class="mv eye">${icon('eye')}<div><h4>Buy a rival agency <span class="cost">· 3 tokens, once</span></h4><p>A second secret police to watch the first. Halves Police Strength now (${v.strength} → ${Math.floor(v.strength / 2)}). From next year it whispers one province's true mood to you each year.</p><p class="risk">Bought while the police are weak, it protects you little.</p></div>
        <button class="sw ${draft.rival ? 'on' : ''}" data-act="rival">${draft.rival ? 'Yes' : 'No'}</button></div>`}</div>`;
    const toks = [...Array(Math.max(E.TOKENS, cost)).keys()].map((i) => `<span class="tok ${i < cost ? (i >= E.TOKENS ? 'over' : 'used') : ''}"></span>`).join('');
    h += `<div class="budget"><div class="tokens ${left < 0 ? 'bad' : ''}">Tokens left: <b>${left}</b> of ${E.TOKENS}${left > 0 ? ' <span class="small">(unspent tokens are lost)</span>' : left < 0 ? ' <span class="small">: too many</span>' : ''}</div><div class="tokrow">${toks}</div>
      <div class="preview">Police Strength ${v.strength} → <b>${sAfter}</b>${sAfter >= E.COUP_FROM ? ' <span class="bad">: the Chief can try a coup this year</span>' : ` (a coup is possible from ${E.COUP_FROM})`}</div>
      <button class="btn primary wide" data-act="plan" ${left < 0 ? 'disabled' : ''}>${me.plan ? 'Plan sent: send changes' : 'Send the plan'}</button></div>`;
    return h;
  }
  if (v.step === 'ear') {
    if (!estDraft || estDraft.year !== v.year) estDraft = { year: v.year, est: { ...(me.est || {}) } };
    const r = v.revealed || {};
    const heard = (k) => (r[k]?.signal === 'petition' ? `petitioned: ${moodChip(r[k].band)}` : r[k]?.signal === 'protest' ? `protested (${r[k].size})${r[k].crushed ? ', crushed' : ''}` : r[k]?.signal === 'praise' ? 'praised you' : 'stayed silent');
    return `<h3>Which mood is each province in?</h3><p class="small">You never see grievance. Guess from what you have heard. Each right guess on your final list scores 1 point.</p>
      ${E.PROVS.map((k) => `<div class="pcardp"><h3>${N[k]}</h3><div class="evid">This year: ${heard(k)}${v.police[k] ? ' · police were there' : ''}${me.whisper?.prov === k ? ` · your agency said ${BW[me.whisper.band]}` : ''}</div>
        <div class="rowc">${['L', 'M', 'H'].map((b) => `<button class="sw ${estDraft.est[k] === b ? 'on' : ''}" data-act="est" data-k="${k}" data-v="${b}">${BW[b]}</button>`).join('')}</div></div>`).join('')}
      <p class="small muted">Calm = grievance 0–3 · restless = 4–6 · angry = 7–10.</p>
      <button class="btn primary wide" data-act="estimate" ${E.PROVS.every((k) => estDraft.est[k]) ? '' : 'disabled'}>${me.estYear === v.year ? 'Guesses sent: send changes' : 'Send your guesses'}</button>`;
  }
  return `<p class="muted">Look at the projector.</p><p class="small">Saved abroad: ${me.saved}.</p>`;
}

function planCostLocal(v, p) {
  let c = 0;
  for (const k of E.PROVS) c += (p.gifts[k] || 0) + (p.police[k] ? 1 : 0) + (p.open[k] ? v.settings.boxCost : 0) + (p.answer[k] ? 1 : 0);
  return c + p.pay + p.save + (p.rival ? E.RIVAL_COST : 0);
}

// ---------- the Police Chief ----------
function chiefView(v, me) {
  if (me.purged && v.step !== 'chief') return `<div class="story bad">${icon('crushed')}<p><span class="st">The coup failed. The Police Chief has been purged.</span> Hand this phone to another member of the Palace team: they are the new Police Chief, starting with a score of 0. Police Strength is back to 0.</p></div>`;
  let h = `<div class="pcardp"><h3>${icon('chief')} You are the Police Chief</h3><p class="small">You sit in the Palace team, but this phone is private. Your secret aim: power. You score 1 for every token the Palace pays you, and 10 if your coup succeeds.${me.chiefNo > 1 ? ` You are Chief number ${me.chiefNo}.` : ''}</p><p>Your score: <b>${me.score}</b></p></div>`;
  if (v.step === 'chief') {
    const need = me.need, chance = Math.max(0, Math.min(6, 7 - need));
    h += `<div class="card"><h3>Strike or wait?</h3><p>Police Strength ${v.strength}, minus ${me.paid} the Palace paid you this year. You roll a die and need a total of 11, so you need <b>${need > 6 ? 'more than 6: impossible this year' : need < 1 ? 'any roll' : `${need} or more`}</b>: a chance of ${chance} in 6.</p>
      <p class="small">If it fails, you are purged and Police Strength falls to 0. If you wait, the police may grow stronger next year, or the Palace may buy a rival agency.</p>
      ${me.choice ? `<p>You chose: <b>${me.choice === 'strike' ? 'strike' : 'wait'}</b>.</p>` : `<div class="rowc"><button class="btn primary" data-act="coup" data-v="1" ${chance ? '' : 'disabled'}>Strike</button><button class="btn" data-act="coup" data-v="0">Wait</button></div>`}</div>`;
  } else h += `<p>Police Strength is ${v.strength}. From ${v.coupLine} you may strike, at the end of a year. Every police deployment and every crushed protest makes you stronger.</p><p class="small muted">Paid to you this year: ${me.paid}.</p>`;
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
