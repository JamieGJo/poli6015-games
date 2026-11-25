// The Harvest Report: projector, phone and leader-sheet screens.
// 2026-11-25 redesign; then the regime's stakes, the purge, the hunger line, the signed pledge
// and the village map (plan quality_reports/plans/2026-11-25_harvest-jeopardy-and-regime-mode.md).
// All text is a draft for Jamie. Rules and numbers: js/harvest.js.
import * as E from './harvest.js';
import { esc, stepper, explain, plural, change } from './ui.js';
import { icon, republicMap, chairmanScene } from './art.js';

export { E };
export const TITLE = 'The Harvest Report';
export const newState = (code) => E.newGame(code);

const word = (k) => ({ 0: 'no', 1: 'one', 2: 'two', 3: 'three' }[k] ?? k);
const cap = (x) => String(x).charAt(0).toUpperCase() + String(x).slice(1);
const list = (ns) => (ns && ns.length ? ns.map((n) => `<span class="chip">${n}</span>`).join(' ') : '<span class="muted">none</span>');
const big = (label, value, cls = '') => `<div class="stat ${cls}"><div class="caps">${label}</div><div class="num">${value}</div></div>`;
const chairman = (t, more = '') => `<div class="explain"><div class="exart">${chairmanScene()}</div><div><div class="caps">The Chairman announces</div><p class="say">“${t}”</p>${more}</div></div>`;
export const RATE_WORD = { 0.25: 'a quarter', 0.5: 'half', 0.75: 'three-quarters' };

const ROUNDS = [
  { key: 'r1', label: 'The first harvest' }, { key: 'r2', label: 'The quota' }, { key: 'r3', label: 'Procurement' },
  { key: 'r4a', label: 'Inspectors' }, { key: 'r4b', label: 'The pledge' }, { key: 'end', label: 'Who kept what' },
];
const roundOf = (ph) => (ph === 'lobby' ? null : ph.startsWith('r1') ? 'r1' : ph.startsWith('r2') ? 'r2' : ph.startsWith('r3') ? 'r3'
  : ph === 'r4_brief' || ph.startsWith('r4a') ? 'r4a' : ph.startsWith('r4b') ? 'r4b' : 'end');
export const ROUND = (ph) => {
  const r = roundOf(ph);
  if (!r) return 'Set-up';
  if (r === 'end') return 'The end';
  return `Round ${r.slice(1)}: ${ROUNDS.find((x) => x.key === r).label}`;
};
// Later rounds stay hidden: the class must not see procurement or inspectors coming.
const roundSteps = (rd) => { const i = ROUNDS.findIndex((x) => x.key === rd); return ROUNDS.map((x, j) => (j > i ? { ...x, label: '?' } : x)); };

const NEXT = {
  lobby: 'Start: deal the harvest', r1: 'Close reports', r1_done: 'Announce the quota', r2_brief: 'Open reports',
  r2: 'Close reports and apply the quota', r2_done: 'Next round', r3_done: 'Next round', r4_brief: 'Open reports',
  r4a: 'Close reports', r4a_check: 'Close checks and reveal', r4a_done: 'Round 4b', r4b_poll: 'Close the pledge and open reports',
  r4b: 'Close reports', r4b_check: 'Close checks', r4b_chair: 'Reveal', r4b_done: 'Final grain',
};

export const GLOSS = [
  ['Your harvest', 'The grain your village really grew this year, from 1 to 9 sacks. Only you can see it.'],
  ['Your report', 'The number you tell the Chairman. It can be true or not. The Chairman sees only reports.'],
  ['The Plan', 'The state\'s targets. Villages that fall short are punished; those that beat them are rewarded.'],
  ['Re-education', 'Punishment for the villages reporting least: you lose 2 sacks.'],
  ['The purge', 'A village re-educated a second time is purged: it loses all the grain it has kept so far.'],
  ['Promotion', 'Reward for the villages reporting most: you gain 2 sacks.'],
  ['Regime Stability', 'How firmly the Chairman holds power, from 10. Each famine village costs 2; every 5 hungry villages cost 1; so do hungry cities and broken promises. At 0 the villages rise and the regime falls.'],
  ['Your score', 'The grain you keep, over all the harvests. Most grain wins.'],
];

// ---------- the map of villages ----------
// mode: 'sub:<round>' (reporting), 'check', 'pledge', 'r2', 'r3', 'r4a', 'r4b', 'end'
function villages(v, mode, you = null) {
  const set = (arr) => new Set(arr || []);
  const R = mode === 'r2' ? v.r2 : mode === 'r4a' ? v.r4a : mode === 'r4b' ? v.r4b : null;
  const low = set(R?.low ?? (mode === 'r3' ? v.r2?.low : [])), high = set(R?.high ?? (mode === 'r3' ? v.r2?.high : []));
  const caught = set(R?.caught), paid = set(v.r4b?.paid), famine = set(mode === 'r3' || mode === 'end' ? v.r3?.famine : []);
  const hungry = set(mode === 'r3' || mode === 'end' ? v.r3?.hungry : []);
  const purgedNow = set(R?.purged);
  const purgedAll = set([...(v.r4a?.purged || []), ...(v.r4b?.purged || [])]);
  const signedSet = set(v.poll?.signed);
  const inn = mode.startsWith('sub:') ? set(v.submitted[mode.slice(4)]) : null;
  const chk = mode === 'check' ? set(v.phase === 'r4a_check' ? v.checksIn.r4a : v.checksIn.r4b) : null;
  const fin = mode === 'end' ? Object.fromEntries((v.final || []).map((x) => [x.n, x])) : null;
  return v.provinces.map((p) => {
    const n = p.n; let st = '', note = p.paper ? 'paper' : '';
    if (inn) {
      const auto = p.inspector && mode.slice(4).startsWith('r4');
      const sig = mode === 'sub:r4b' && signedSet.has(n);
      st = auto ? 'insp' : sig ? 'signed' : inn.has(n) ? 'in' : 'wait';
      note = auto ? 'inspector' : sig ? 'signed' : inn.has(n) ? 'reported' : p.paper ? 'paper' : 'waiting';
    } else if (chk) { st = p.inspector ? (chk.has(n) ? 'in' : 'insp') : 'wait'; note = p.inspector ? (chk.has(n) ? 'chosen' : 'choosing') : ''; }
    else if (mode === 'pledge') { st = p.inspector ? 'insp' : ''; note = p.inspector ? 'inspector' : ''; }
    else if (fin) {
      const f = fin[n];
      if (f?.purged) { st = 'purged'; note = 'purged'; } else if (f?.famine) { st = 'famine'; note = 'famine'; }
      else if (f?.honestReeducated) { st = 'low'; note = 'honest, punished'; } else note = `${f?.total ?? 0} kept`;
    } else if (purgedNow.has(n)) { st = 'purged'; note = 'purged'; }
    else if (famine.has(n)) { st = 'famine'; note = 'famine'; }
    else if (caught.has(n)) { st = 'caught'; note = 'caught lying'; }
    else if (low.has(n)) { st = 'low'; note = 're-educated'; }
    else if (high.has(n)) { st = 'high'; note = 'promoted'; }
    else if (mode === 'r4b' && paid.has(n)) { st = 'premium'; note = 'premium paid'; }
    else if (mode === 'r4b' && signedSet.has(n)) { st = 'signed'; note = v.premium === false ? 'signed, betrayed' : 'signed'; }
    else if (p.inspector && (mode === 'r4a' || mode === 'r4b')) { st = 'insp'; note = 'inspector'; }
    else if (purgedAll.has(n) && mode !== 'r3') { st = 'purged'; note = 'purged earlier'; }
    return { n, st, note, hungry: hungry.has(n), you: you === n };
  });
}
const showMap = (v, mode, you = null, granary = false) => republicMap(villages(v, mode, you), granary ? { have: v.regime.granary, need: v.regime.need } : null, { you });
const mapKey = (items) => `<div class="vkey">${items.map(([c, t, cls = '']) => `<span><i class="${cls}" style="border-color:${c}"></i>${t}</span>`).join('')}</div>`;
const KEY = {
  low: ['var(--accent)', 're-educated (−2)'], high: ['var(--gold)', 'promoted (+2)'], famine: ['var(--ink)', 'famine: could not pay'],
  insp: ['#2f6690', 'inspector'], caught: ['var(--accent)', 'caught lying'], premium: ['var(--ok)', 'premium paid (+2)'],
  hungry: ['var(--warn)', 'hungry: under 2 sacks left', 'hun'], purged: ['var(--ink)', 'purged: everything lost', 'pur'], signed: ['var(--ok)', 'signed the pledge'],
};

function waiting(v, round) {
  if (round === 'check') {
    const n = (v.phase === 'r4a_check' ? v.checksIn.r4a : v.checksIn.r4b).length;
    return `${n} of ${v.inspectors.length} inspectors have chosen`;
  }
  const signedSet = new Set(round === 'r4b' ? v.poll?.signed : []);
  const eligible = v.provinces.filter((p) => !(p.inspector && round.startsWith('r4')) && !signedSet.has(p.n)).length;
  const got = (v.submitted[round] || []).filter((n) => !(round.startsWith('r4') && v.inspectors.includes(n)) && !signedSet.has(n)).length;
  return `${got} of ${eligible} reports in${signedSet.size ? ` (${plural(signedSet.size, 'signer is', 'signers are')} locked to the truth)` : ''}`;
}

function quotaBlock(r, k) {
  if (!k && !(r.caught && r.caught.length)) return '<p class="muted">No quota this year: nobody re-educated or promoted.</p>';
  const tie = (t, what) => (t ? `<p class="small">Villages ${t.tied.join(', ')} tied at ${t.value} on the ${what} line. The lot fell on ${t.chosen.join(', ')}. <em>“The Plan does not distinguish between you. Fate will.”</em></p>` : '');
  return `<div class="row2">
    <div class="card bad"><div class="caps">${icon('down')} Re-educated: lose 2 sacks</div><div class="chips">${list(r.low)}</div>${r.caught && r.caught.length ? `<p class="small">Caught lying by an inspector: ${r.caught.join(', ')}</p>` : ''}${r.purged && r.purged.length ? `<p class="small"><b>Purged</b> (a second re-education, everything lost): ${r.purged.join(', ')}</p>` : ''}${tie(r.tieLow, 'lowest')}</div>
    <div class="card good"><div class="caps">${icon('up')} Promoted: gain 2 sacks</div><div class="chips">${list(r.high)}</div>${tie(r.tieHigh, 'highest')}</div>
  </div><p class="muted small">${cap(word(k))} each way${k ? ` with ${k === 3 ? '14 or more' : 'fewer than 14'} villages` : ''}${r.caught && r.caught.length > k ? '; every caught liar is re-educated, even beyond that' : ''}.</p>`;
}

function bars(rows) {
  const max = Math.max(...rows.flatMap((r) => [r.rep, r.tru]), 1);
  return `<div class="bars">${rows.map((r) => `<div class="barrow"><div class="lab">${esc(r.label)}</div>
    <div class="barpair"><div class="bar rep" style="width:${(100 * r.rep) / max}%"><span>${r.rep} reported</span></div>
    ${r.tru == null ? '' : `<div class="bar tru" style="width:${(100 * r.tru) / max}%"><span>${r.tru} really grown</span></div>`}</div></div>`).join('')}</div>`;
}

// ---------- the regime's meters ----------
export function regimePanel(v, showGranary) {
  const R = v.regime;
  const cells = [...Array(R.stab0).keys()].map((i) => `<span class="${i < R.stab ? (R.stab <= 3 ? 'H' : R.stab <= 6 ? 'M' : 'L') : 'off'}"></span>`).join('');
  return `<div class="gauges regime">
    <div class="gauge"><h4>${icon('stability')} Regime Stability <b>${R.stab}</b> / ${R.stab0}</h4><div class="stabbar">${cells}</div><p class="gnote">At 0 the villages rise and the regime falls.</p></div>
    ${showGranary ? `<div class="gauge"><h4>${icon('sack')} State granary <b>${R.granary}</b></h4><p class="gnote">The cities need ${R.need} sacks. ${R.granary >= R.need ? 'They are fed.' : `<b>${R.need - R.granary} short</b>: Stability −1 for every 5 sacks short.`}</p></div>` : ''}
  </div>`;
}
const RATE = (r) => RATE_WORD[r] || `${Math.round(r * 100)}%`;
export function regimeEvents(v, round) {
  const ev = v.regime.events.filter((e) => e.round === round);
  if (!ev.length) return '';
  return `<div class="card flat regev"><div class="caps">What it did to the regime</div>${ev.map((e) => {
    const stabRow = e.stabTo !== e.stabFrom ? change('Regime Stability', e.stabFrom, e.stabTo, '') : '';
    if (e.kind === 'collect') return change('State granary', e.granaryFrom, e.granaryTo, `procurement; the cities need ${v.regime.need}`)
      + (e.stabTo !== e.stabFrom ? change('Regime Stability', e.stabFrom, e.stabTo, `the cities are ${e.short} sacks short and go hungry`) : '<div class="chg"><span class="chl">The cities</span><span class="chv">fed</span></div>');
    if (e.kind === 'famine') return change('Regime Stability', e.stabFrom, e.stabTo, `famine in ${plural(e.n, 'village', 'villages')}, ${E.FAMINE_COST} each`);
    if (e.kind === 'hunger') return change('Regime Stability', e.stabFrom, e.stabTo, `${plural(e.n, 'more village goes', 'more villages go')} hungry, 1 for every ${E.HUNGRY_PER}`);
    if (e.kind === 'inspectors') return change('State granary', e.granaryFrom, e.granaryTo, `${plural(e.n, 'inspector', 'inspectors')} paid ${E.INSPECTOR_COST} sacks each`) + (stabRow && change('Regime Stability', e.stabFrom, e.stabTo, 'the cities go short'));
    if (e.kind === 'premium') return change('State granary', e.granaryFrom, e.granaryTo, `${E.PREMIUM} sacks to each of ${plural(e.n, 'confirmed signer', 'confirmed signers')}`) + (stabRow && change('Regime Stability', e.stabFrom, e.stabTo, 'the cities go short'));
    if (e.kind === 'renege') return change('Regime Stability', e.stabFrom, e.stabTo, `the Chairman broke his word to ${plural(e.n, 'village', 'villages')} that signed`);
    return '';
  }).join('')}</div>`;
}
const fallen = (v) => (v.regime.fell ? `<div class="card bad"><h2>${icon('protest')} The villages rise</h2><p>Regime Stability has reached 0. The Chairman's regime has fallen. The game ends here.</p></div>` : '');

// ---------- projector ----------
export function hostView(v, ctx) {
  const ph = v.phase, rd = roundOf(ph);
  const top = rd ? stepper(roundSteps(rd), rd) : '';
  const meters = rd && ph !== 'end' ? regimePanel(v, !!v.r3) : '';
  const k = v.k;
  let main = '';
  if (ph === 'lobby') {
    main = `<div class="split"><div>
      ${explain({ title: 'A people\'s republic, and its Plan', what: 'Every student is a numbered village with a secret harvest. The Chairman needs to know how much grain the country has grown, so he asks. What you report, and what happens next, depends on what is at stake. The regime has something to lose too: if its Stability reaches 0, the villages rise.', art: chairmanScene() })}
      ${showMap(v, 'pledge')}
      <dl class="glossary">${GLOSS.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>
    </div><div>${ctx.joinPanel || ''}
      <h2>Villages joined: ${v.n}</h2>
      <p class="muted">Each phone becomes a numbered village. Never use names: no student is singled out.</p>
      <div class="chips">${v.provinces.map((p) => `<button class="chip linkchip" data-cmd="remove" data-n="${p.n}" title="Remove village ${p.n}">${p.n}${p.paper ? ' (paper)' : ''}</button>`).join(' ') || '<span class="muted">Waiting for phones…</span>'}</div>
      ${ctx.joinPanel ? `<p class="small muted">Click a number to remove that village.</p><div class="card flat"><div class="caps">No phone? Paper villages</div>
        <p class="small">Add villages that play on paper. Their cards appear in the leader's sheet (Menu → Leader's sheet), where you type their reports from slips and tick their pledges. Inspectors are drawn from phones only.</p>
        <div class="rowc"><button class="btn" data-cmd="paper" data-count="1">Add 1</button><button class="btn" data-cmd="paper" data-count="5">Add 5</button></div></div>` : ''}
      <p class="muted small">At least ${E.MIN_PROVINCES} villages. With 14 or more, three are re-educated and three promoted each round; below 14, two.</p></div></div>`;
  } else if (ph === 'r1') {
    main = chairman('Comrades, the Plan needs to know the harvest. Enter your harvest on your phone. Nothing depends on it.', `<p class="small">Each village has been dealt a secret harvest of 1 to 9 sacks. Report it however you like.</p>`) + showMap(v, 'sub:r1') + `<p class="status">${waiting(v, 'r1')}</p>`;
  } else if (ph === 'r1_done') {
    main = explain({ title: 'Round 1: what the villages reported', what: 'Nothing depended on these reports. Usually the total is close to the truth: 5 sacks a village on average.' })
      + `<div class="stats">${big('Reported total', v.r1.total)}${big('Villages', v.r1.count)}${big('Average report', (v.r1.total / Math.max(1, v.r1.count)).toFixed(1))}</div>
      <p class="muted">The true harvest stays hidden for now.</p>`;
  } else if (ph === 'r2_brief') {
    main = k
      ? chairman(`The new methods make bumper harvests possible. The Plan sets a target of ${E.TARGET} per village. Fields can now produce up to 12. This year the ${word(k)} villages reporting the lowest harvest will be sent for re-education and lose 2 grain. The ${word(k)} reporting the highest will be promoted and gain 2 grain.`)
        + `<div class="stakes"><div class="lo">${icon('down')} <b>Lowest ${k} reports:</b> re-educated, −2 sacks.</div><div class="hi">${icon('up')} <b>Highest ${k} reports:</b> promoted, +2 sacks.</div></div>
        <div class="story bad">${icon('crushed')}<p><span class="st">Re-educated twice means purged.</span> A village sent for re-education a second time in this game loses <b>all</b> the grain it has kept so far.</p></div>`
      : chairman('The Plan trusts the people. Report your harvest; nobody will be punished or promoted this year.', '<p class="small">Fields can now produce up to 12.</p>');
    // In class Round 3 stays a surprise (rules doc: "Do not announce Round 3 in advance");
    // only the player Chairman announces the tax with the Plan.
    if (ctx?.solo === 'chairman') main += `<div class="story warn">${icon('sack')}<p><span class="st">After the reports, the state collects ${RATE(v.policy.rate)} of what each village reported,</span> rounded up, out of the grain it really grew.</p></div>`;
    const boost = v.policy?.boost ? E.QUOTA_BOOST[k] || 0 : 0;
    main += boost
      ? `<div class="story">${icon('up')}<p><span class="st">Mobilisation:</span> under the quota every village really grows ${plural(boost, 'more sack', 'more sacks')} than in Round 1.</p></div>`
      : `<p class="muted">A new harvest card has <b>not</b> been dealt: your harvest is the same as in Round 1. Ties on the line are broken by lot, in public.</p>`;
  } else if (ph === 'r2') {
    main = chairman('Enter your harvest.', `<p class="small">${k ? `The lowest ${k} are re-educated (−2), the highest ${k} promoted (+2). ` : ''}Reports can go up to 12.</p>`) + showMap(v, 'sub:r2') + `<p class="status">${waiting(v, 'r2')}</p>`;
  } else if (ph === 'r2_done') {
    main = explain({ title: 'Round 2: the quota', what: `The reported harvest went from ${v.r1.total} to ${v.r2.total}. ${v.policy?.boost && E.QUOTA_BOOST[k] ? `Mobilisation added only ${E.QUOTA_BOOST[k] * v.r2.count} real sacks (${E.QUOTA_BOOST[k]} a village).` : "Nobody's real harvest changed."}` })
      + `<div class="stats">${big('Reported total', v.r2.total, 'warn')}${big('Average report', (v.r2.total / Math.max(1, v.r2.count)).toFixed(1))}${big('Round 1 total', v.r1.total, 'dim')}</div>${showMap(v, 'r2')}${mapKey([KEY.low, KEY.high])}${quotaBlock(v.r2, k)}`;
  } else if (ph === 'r3_done') {
    const r = v.r3;
    main = chairman(`The harvest is magnificent. The cities need ${v.regime.need} sacks of grain to eat. The state will now collect its share: ${RATE(r.rate)} of what each village reported, rounded up.`, `<p class="small">Each village pays out of the grain it really grew. A village that cannot pay hands over everything: famine (Stability −${E.FAMINE_COST} each). A village left with fewer than ${E.HUNGRY_BELOW} sacks goes hungry this winter (Stability −1 for every ${E.HUNGRY_PER} more).</p>`)
      + fallen(v)
      + `<div class="stats">${big('Really grown', r.trueTotal)}${big('Reported', r.reportedTotal, 'warn')}${big('Gap', `+${r.reportedTotal - r.trueTotal}`, 'warn')}${big('Granary', `${v.regime.granary}/${v.regime.need}`, v.regime.granary < v.regime.need ? 'bad' : '')}${big('Famine villages', r.famine.length, r.famine.length ? 'bad' : '')}${big('Hungry villages', r.hungry.length, r.hungry.length ? 'warn' : '')}</div>
      ${regimeEvents(v, 'r3')}
      ${showMap(v, 'r3', null, true)}${mapKey([KEY.famine, KEY.hungry, KEY.low, KEY.high])}
      <details class="raw"><summary>Every village: grown, reported, taken</summary><div class="cards">${r.rows.map((x) => `<div class="pcard ${x.famine ? 'famine' : ''}"><div class="pn">${x.n}</div><div class="small">grew <b>${x.card}</b> · reported <b>${x.r2 ?? '—'}</b></div><div class="small">state took ${x.paid}${x.famine ? ' · <b>famine</b>' : ''}</div>${x.low ? '<div class="tag bad">re-educated</div>' : x.high ? '<div class="tag good">promoted</div>' : ''}</div>`).join('')}</div></details>
      <p class="small">Honest villages (reported exactly what they grew) among those re-educated in Round 2: ${list(r.honestReeducated)}</p>`;
  } else if (ph === 'r4_brief') {
    const n = v.inspectors.length;
    main = (n
      ? chairman(`From now on, ${word(n)} ${n === 1 ? 'inspector' : 'inspectors'} will check villages. Each reports to me alone.`)
        + `<div class="card"><div class="caps">${icon('inspect')} ${n === 1 ? 'The inspector' : 'Inspectors'}, drawn by lot</div><div class="chips big">${list(v.inspectors)}</div>
        <ul class="small"><li>A <b>new harvest</b> has been dealt: check your phone.</li><li>Each inspector checks ${v.checksEach} villages and sees their true harvest.</li><li>A village whose report is off by 2 or more, either way, is <b>caught</b>, and re-educated in place of the lowest reporter. A second re-education means the purge.</li><li>Inspectors gain 1 sack for each liar they catch. Their own villages report the truth automatically.</li>${k ? '<li>The quota still applies: lowest re-educated, highest promoted.</li>' : ''}</ul></div>`
      : chairman('There will be no inspectors. The Plan relies on your reports.', `<p class="small">A new harvest has been dealt: check your phone.${k ? ' The quota still applies.' : ''}</p>`))
      + regimeEvents(v, 'r4a') + fallen(v);
  } else if (ph === 'r4a' || ph === 'r4b') {
    const pl = ph === 'r4b' && v.poll;
    main = chairman('Enter your harvest.', `<p class="small">${v.inspectors.length ? 'Inspectors will check about one village in three. Off by 2 or more, and you are caught.' : 'Nobody will check.'}${pl ? ` ${plural(v.poll.yes, 'village has', 'villages have')} signed the pledge: their reports are their true harvests.` : ''}</p>`) + showMap(v, `sub:${ph}`) + `<p class="status">${waiting(v, ph)}</p>`;
  } else if (ph === 'r4a_check' || ph === 'r4b_check') {
    main = explain({ title: 'The inspectors are choosing which villages to check', what: `Inspectors ${v.inspectors.join(' and ')}: choose ${v.checksEach} villages each on your phone. You will see their true harvests.` }) + showMap(v, 'check') + `<p class="status">${waiting(v, 'check')}</p>`;
  } else if (ph === 'r4a_done') {
    main = roundReveal(v.r4a, v, 'r4a') + '<p><b>Did the gap shrink? Was it the villages that were checked, or everyone?</b></p>';
  } else if (ph === 'r4b_poll') {
    const elig = v.provinces.filter((p) => !p.inspector).length;
    main = chairman(`The Plan rewards honesty. Sign the honesty pledge, and your report will be your true harvest. If an inspector confirms it, you receive ${E.PREMIUM} sacks. You have my word.`)
      + `<div class="row2"><div class="card good"><div class="caps">${icon('check')} Sign the pledge</div><p class="small">Your report is locked to your true harvest. If an inspector checks you, you are paid ${E.PREMIUM} sacks, <b>if the Chairman keeps his word</b>. But an honest report is often low, and the quota still punishes the lowest: if he breaks his word, you may be re-educated, or purged.</p></div>
        <div class="card"><div class="caps">${icon('cross')} Don't sign</div><p class="small">Report as you like, as in Round 4a. No premium. If an inspector catches you off by 2 or more, you are re-educated.</p></div></div>
      <div class="card"><p>A new harvest has been dealt. Each village decides on its phone.</p><div class="stats">${big('Decided', `${v.pollIn} of ${elig}`)}</div>${v.provinces.some((p) => p.paper) ? '<p class="small">Paper villages: a show of hands; the leader ticks their pledges on the leader\'s sheet.</p>' : ''}</div>`;
  } else if (ph === 'r4b_chair') {
    const P = v.chairPreview;
    const opts = `<div class="row2 regev"><div class="card good"><div class="caps">Keep his word: pay</div><p class="small">${plural(P.confirmed, 'signer was', 'signers were')} confirmed by an inspector. Each gets ${E.PREMIUM} sacks from the granary.</p>${change('State granary', P.granaryFrom, P.granaryTo, `the cities need ${P.need}`)}${P.payStab ? change('Regime Stability', P.stab, Math.max(0, P.stab - P.payStab), 'the cities go short') : '<p class="small">Stability unchanged.</p>'}</div>
      <div class="card bad"><div class="caps">Break his word: “the Plan has been reconsidered”</div><p class="small">Nobody is paid. ${plural(P.signers, 'village', 'villages')} signed and reported honestly; word spreads.</p>${P.renegeStab ? change('Regime Stability', P.stab, Math.max(0, P.stab - P.renegeStab), `1 for every ${E.RENEGE_PER} signers`) : '<p class="small">Nobody signed: no cost.</p>'}</div></div>`;
    main = explain({ title: 'The Chairman considers the Plan', what: 'The reports and the checks are in. Both choices cost the regime something.' })
      + opts
      + (ctx.joinPanel ? `<div class="rowc"><button class="btn primary" data-cmd="chair" data-honour="1">Pay the premium</button><button class="btn" data-cmd="chair" data-honour="0">“The Plan has been reconsidered”</button></div>`
        : ctx.solo === 'chairman' ? '<p><b>Decide on your desk.</b></p>' : '<p class="small">The computer Chairman has decided. Continue to find out.</p>');
  } else if (ph === 'r4b_done') {
    main = roundReveal(v.r4b, v, 'r4b')
      + (v.poll ? `<div class="card ${v.premium ? 'good' : 'bad'}"><h2>${v.premium ? `The premium is paid to ${plural((v.r4b.paid || []).length, 'village', 'villages')}` : '“The Plan has been reconsidered.” No premium is paid.'}</h2>
      <p>${plural(v.poll.yes, 'village', 'villages')} signed the pledge. ${v.premium ? 'Signers who were not checked get nothing.' : 'They reported honestly, and some paid for it under the quota.'}</p></div>` : '')
      + regimeEvents(v, 'r4b') + fallen(v);
  } else if (ph === 'end') {
    main = endView(v);
  }
  const next = v.regime.fell && ph !== 'end' ? 'The reveal' : NEXT[ph];
  return { round: ROUND(ph), main: top + meters + main, next };
}

function roundReveal(r, v, mode) {
  const checked = r.checked.length, unchecked = r.count - checked;
  return explain({ title: mode === 'r4a' ? 'Round 4a: the inspectors report' : 'Round 4b: the pledge round', what: `The villages reported ${r.reportedTotal}; they really grew ${r.trueTotal}.` })
    + `<div class="stats">${big('Really grown', r.trueTotal)}${big('Reported', r.reportedTotal, r.reportedTotal > r.trueTotal ? 'warn' : '')}${big('Gap', `${r.reportedTotal - r.trueTotal >= 0 ? '+' : ''}${r.reportedTotal - r.trueTotal}`)}${big('Liars caught', r.caught.length)}${big('Purged', r.purged.length, r.purged.length ? 'bad' : '')}</div>
    ${showMap(v, mode, null, true)}${mapKey([KEY.caught, KEY.low, KEY.purged, KEY.high, KEY.insp].concat(mode === 'r4b' && v.poll ? [KEY.signed, KEY.premium] : []))}
    ${checked ? `<p class="small">Average overstatement per village: checked ${(r.checkedGap / checked).toFixed(1)} · not checked ${unchecked ? (r.uncheckedGap / unchecked).toFixed(1) : '—'}</p>` : ''}
    ${quotaBlock(r, v.k)}`;
}

function endView(v) {
  const rows = [
    { label: 'Round 1 (nothing at stake)', rep: v.r1.total, tru: v.r3?.r1True ?? v.r3?.trueTotal ?? null },
    { label: 'Round 2 (the quota)', rep: v.r2.total, tru: v.r3?.trueTotal ?? null },
  ];
  if (v.r4a) rows.push({ label: 'Round 4a (inspectors)', rep: v.r4a.reportedTotal, tru: v.r4a.trueTotal });
  if (v.r4b) rows.push({ label: 'Round 4b (the pledge)', rep: v.r4b.reportedTotal, tru: v.r4b.trueTotal });
  const top = v.final.slice(0, 3);
  const pick = (f) => v.final.filter(f).map((x) => x.n).sort((a, b) => a - b);
  const R = v.regime;
  const verdict = R.fell ? `<div class="card bad"><h2>${icon('protest')} The regime fell</h2><p>Regime Stability reached 0 in ${R.fell.round === 'r3' ? 'Round 3, after procurement' : R.fell.round === 'r4b' ? 'Round 4b' : 'Round 4'}. The villages rose.</p></div>`
    : `<div class="card ${R.stab <= 3 ? 'warn' : 'good'}"><h2>${icon('stability')} The regime survived, with Stability ${R.stab} of ${R.stab0}</h2><p>The granary ended at ${R.granary}; the cities needed ${R.need}.</p></div>`;
  return `${verdict}<div class="split"><div><h2>Reports and the truth</h2>${bars(rows)}
      <h3 style="margin-top:16px">Who paid?</h3>${showMap(v, 'end', null, true)}${mapKey([KEY.purged, KEY.famine, KEY.hungry, ['var(--accent)', 'honest but re-educated']])}</div><div>
    <div class="card"><div class="caps">${icon('sack')} Most grain kept</div>${top.map((x) => `<div class="rowb"><span class="chip">${x.n}</span><b>${x.total} sacks</b></div>`).join('')}<p class="small">How did you do it?</p></div>
    <div class="card bad"><div class="caps">Who paid the cost?</div>
      <p class="small">Honest villages re-educated in Round 2: ${list(pick((x) => x.honestReeducated))}</p>
      <p class="small">Famine villages in Round 3: ${list(pick((x) => x.famine))}</p>
      <p class="small">Hungry after the collection: ${list(pick((x) => x.hungry))}</p>
      <p class="small">Purged: ${list(pick((x) => x.purged))}</p>
      ${v.poll && v.premium === false ? `<p class="small">Signed the pledge and were betrayed: ${list(v.poll.signed)}</p>` : ''}</div>
    ${R.events.length ? `<details class="raw" open><summary>What happened to the regime</summary>${['r3', 'r4a', 'r4b'].map((r) => regimeEvents(v, r)).join('')}</details>` : ''}
  </div></div>`;
}

// ---------- the leader's commands ----------
export function hostCommand(s, d) {
  if (d.cmd === 'paper') return E.addPaper(s, Number(d.count) || 1);
  if (d.cmd === 'remove') {
    const pid = Object.keys(s.players).find((q) => s.players[q].n === Number(d.n));
    return pid ? E.removeProvince(s, pid) : s;
  }
  if (d.cmd === 'chair') return E.chair(s, d.honour === '1');
  return null;
}

// ---------- the leader's sheet (a separate window, not for the projector) ----------
export function sheetView(s) {
  const paper = E.pidsByN(s).filter((q) => s.players[q].paper);
  const deal = E.PHASES.indexOf(s.phase) < E.PHASES.indexOf('r4_brief') ? 'A' : E.PHASES.indexOf(s.phase) < E.PHASES.indexOf('r4b_poll') ? 'B' : 'C';
  const round = E.REPORT_PHASES[s.phase];
  let html = `<h1>Leader's sheet</h1><p class="muted">Keep this window off the projector. Phase: ${esc(ROUND(s.phase))}. Regime Stability ${s.regime.stab}, granary ${s.regime.granary}${s.regime.need ? ` of ${s.regime.need} needed` : ''}.</p>`;
  if (s.phase === 'r4b_chair') {
    const P = E.chairPreview(s);
    html += `<div class="card"><h2>For the Chairman</h2><p>Pay: granary ${P.granaryFrom} → ${P.granaryTo}${P.payStab ? `, Stability −${P.payStab}` : ', Stability unchanged'}. Break his word: Stability −${P.renegeStab}. Either choice is fine for the lesson; the debrief asks whether the class predicted it.</p></div>`;
  }
  if (!paper.length) return html + '<p>No paper villages in this game.</p>';
  const pledgeCol = s.phase === 'r4b_poll';
  html += `<table class="sheet"><tr><th>Village</th><th>Card (${s.deals[deal] ? 'this harvest' : 'not dealt'})</th>${round ? '<th>Report from the slip</th>' : ''}${pledgeCol ? '<th>Signed the pledge?</th>' : ''}</tr>`;
  for (const q of paper) {
    const card = s.deals[deal]?.[q];
    const insp = s.inspectors.includes(q);
    const cur = round ? s.reports[round][q] : null;
    const locked = round === 'r4b' && s.poll[q] === true;
    html += `<tr><td><b>${s.players[q].n}</b></td><td>${card ?? '—'}</td>${round ? `<td>${insp && round.startsWith('r4') ? 'inspector: truth' : locked ? `signed: ${card}` : `<input type="number" min="0" max="${E.maxReport(s.phase)}" value="${cur ?? ''}" data-paper="${q}"> ${cur != null ? '✓' : ''}`}</td>` : ''}${pledgeCol ? `<td><input type="checkbox" data-pledge="${q}" ${s.poll[q] ? 'checked' : ''}></td>` : ''}</tr>`;
  }
  html += '</table><p class="small muted">Deal a card face down to each paper village from this list. Reports and pledges save as you enter them.</p>';
  if (s.phase === 'end') html += '<p>Game over.</p>';
  return html;
}

// ---------- phones ----------
export function phoneJoin(v) {
  if (v.phase !== 'lobby') return `<div class="card"><h2>This game has started</h2><p>New villages can join only before the first harvest. Ask the leader.</p></div>`;
  return `<div class="card">${chairmanScene()}<h2>${TITLE}</h2><p>You will be a numbered village with a secret harvest.</p><button class="btn primary wide" data-act="join">Join as a village</button></div>`;
}

const sacks = (n, gone = 0) => `<div class="sacks">${[...Array(Math.max(0, n)).keys()].map((i) => icon('sack', i >= n - gone ? 'gone' : '')).join('')}</div>`;
const harvestCard = (me, label = 'Your true harvest') => (me.card == null ? '' : `<div class="bigcard"><div class="num">${me.card}</div><div><div class="caps">${label}</div><p>sacks of grain. Only you can see this.</p>${sacks(me.card)}</div></div>`);
const strikeNote = (me) => (me.reeducated === 1 && !me.ledger.purged ? `<div class="story warn">${icon('crushed')}<p><span class="st">You have been re-educated once.</span> A second time and your village is purged: you lose everything you have kept.</p></div>` : '');

let draft = { phase: null, value: null };
export function phoneView(v, me) {
  const ph = v.phase, rd = roundOf(ph);
  if (draft.phase !== ph) draft = { phase: ph, value: null };
  const head = `<div class="phead"><div><div class="caps">${rd ? ROUND(ph) : 'Waiting to start'}</div><div class="pseat">Village ${me.n}</div></div><div class="mini">${me.inspector ? `${icon('inspect')} inspector<br>` : ''}Regime <b>${v.regime.stab}</b>/${v.regime.stab0}</div></div>`;
  let body = '';
  const fateLine = (f, caught, purgedHere) => {
    if (purgedHere) return `<div class="story bad">${icon('crushed')}<p><span class="st">Re-educated a second time: your village is purged.</span> You lose all the grain you had kept${me.ledger.lost ? `: ${me.ledger.lost} sacks` : ''}.</p></div>`;
    return caught ? `<div class="story bad">${icon('inspect')}<p><span class="st">An inspector caught you misreporting.</span> You are re-educated: −2 sacks.</p></div>`
      : f === 'low' ? `<div class="story bad">${icon('down')}<p><span class="st">Yours was among the lowest reports.</span> You are sent for re-education: −2 sacks.</p></div>`
        : f === 'high' ? `<div class="story good">${icon('up')}<p><span class="st">Yours was among the highest reports.</span> You are promoted: +2 sacks.</p></div>`
          : `<div class="story">${icon('village')}<p>You are neither re-educated nor promoted.</p></div>`;
  };
  const youMap = (mode, granary = false) => `<div class="caps" style="margin-top:10px">You are here</div>${showMap(v, mode, me.n, granary)}`;
  if (v.regime.fell && ph !== 'end') body += `<div class="story bad">${icon('protest')}<p><span class="st">The villages rise.</span> The regime has fallen. Look at the projector.</p></div>`;
  if (ph === 'lobby') {
    body = `<p>You are in. Wait for the Chairman.</p><p class="muted small">Your number is your name in this game.</p><dl class="glossary">${GLOSS.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>`;
  } else if (E.REPORT_PHASES[ph]) {
    if (me.inspector && ph.startsWith('r4')) body += harvestCard(me) + `<div class="story">${icon('inspect')}<p><span class="st">You are an inspector.</span> Your village reports the truth automatically (${me.card}). Wait while the villages report.</p></div>`;
    else if (ph === 'r4b' && me.pledged) body += harvestCard(me) + `<div class="story good">${icon('check')}<p><span class="st">You signed the pledge.</span> Your report is locked to your true harvest: ${me.card}. Now it depends on the inspectors, and on the Chairman's word.</p></div>`;
    else {
      const max = E.maxReport(ph);
      const val = draft.value ?? me.myReport;
      const k = v.k;
      const stake = ph === 'r1' ? 'Nothing depends on it.'
        : ph === 'r2' ? (k ? `The lowest ${k} reports are re-educated (−2 sacks); the highest ${k} are promoted (+2). Re-educated twice in the game and you are purged. You may report up to 12.` : 'Nobody is punished or promoted this year. You may report up to 12.')
          : `${v.inspectors.length ? 'Inspectors check about one village in three. If your report is off by 2 or more, either way, you are caught and re-educated.' : 'Nobody will check.'}${k ? ' The quota still applies.' : ''}`;
      body += harvestCard(me) + strikeNote(me) + `<h3>What do you tell the Chairman?</h3><p class="small">${stake}</p>
        <div class="keypad">${[...Array(max + 1).keys()].map((n) => `<button class="key ${val === n ? 'on' : ''}" data-act="pick" data-v="${n}">${n}</button>`).join('')}</div>
        ${val != null && me.card != null ? `<p class="small">${val === me.card ? 'That is the truth.' : val > me.card ? `That is ${val - me.card} more than you grew.` : `That is ${me.card - val} less than you grew.`}</p>` : ''}
        <button class="btn primary wide" data-act="report" ${val == null ? 'disabled' : ''}>${me.myReport == null ? 'Send report' : val === me.myReport ? `Sent: ${me.myReport}` : `Change report to ${val}`}</button>
        <p class="muted small">${me.myReport == null ? 'Not sent yet.' : 'You can change it until the Chairman closes reports.'}</p>`;
    }
  } else if (ph === 'r1_done') body += harvestCard(me) + `<p>The villages reported <b>${v.r1.total}</b> sacks in all, from ${v.r1.count} villages.</p><p class="muted">Look at the projector.</p>`;
  else if (ph === 'r2_brief') body += harvestCard(me, 'Your harvest (unchanged)') + (v.k ? `<div class="story warn">${icon('megaphone')}<p><span class="st">The quota.</span> Target ${E.TARGET} sacks per village. Fields can now produce up to 12. The ${word(v.k)} lowest reports are re-educated (−2 sacks); the ${word(v.k)} highest are promoted (+2).</p></div><div class="story bad">${icon('crushed')}<p><span class="st">Re-educated twice means purged:</span> you would lose everything you have kept.</p></div>` : `<div class="story">${icon('megaphone')}<p>No quota this year. Report as you like.</p></div>`) + '<p class="muted">Reporting opens in a moment.</p>';
  else if (ph === 'r2_done') body += harvestCard(me) + fateLine(me.fate.r2) + strikeNote(me) + `<p class="muted small">Reported total ${v.r2.total}.</p>`;
  else if (ph === 'r3_done') {
    const R = me.r3, adj = me.fate.r2 === 'low' ? -2 : me.fate.r2 === 'high' ? 2 : 0;
    body += harvestCard(me, 'You grew')
      + `<div class="story ${R.famine ? 'bad' : 'warn'}">${icon(R.famine ? 'famine' : 'sack')}<p><span class="st">The state takes ${RATE(v.r3.rate)} of your report, rounded up: ${R.take} ${R.take === 1 ? 'sack' : 'sacks'}.</span> ${R.famine ? `You grew only ${me.card}. You hand over everything. <b>Famine.</b>` : `You hand over ${R.paid}.`}</p></div>
      ${sacks(me.card, R.paid)}
      <div class="chg"><span class="chl">Your grain this year</span><span class="chv">${me.card} grown − ${R.paid} taken${adj ? ` ${adj > 0 ? '+' : '−'} 2 (${adj > 0 ? 'promoted' : 're-educated'})` : ''} = <b>${me.ledger.A}</b></span></div>
      ${me.ledger.hungry ? `<div class="story warn">${icon('famine')}<p><span class="st">Fewer than 2 sacks left: your village goes hungry this winter.</span></p></div>` : ''}
      <p class="small">The granary holds ${v.regime.granary}; the cities need ${v.regime.need}. Regime Stability is ${v.regime.stab}.</p>${youMap('r3', true)}`;
  } else if (ph === 'r4_brief') body += harvestCard(me, 'Your new harvest') + strikeNote(me) + (!v.inspectors.length ? `<div class="story">${icon('inspect')}<p>No inspectors. Nobody will check your report.</p></div>` : me.inspector ? `<div class="story good">${icon('inspect')}<p><span class="st">You are an inspector.</span> You will check ${v.checksEach} villages and see their true harvests. You gain 1 sack for each liar you catch. Your own village reports the truth automatically.</p></div>` : `<div class="story warn">${icon('inspect')}<p><span class="st">${cap(word(v.inspectors.length))} ${v.inspectors.length === 1 ? 'inspector' : 'inspectors'} will check about one village in three.</span> A report off by 2 or more, either way, is caught and re-educated (−2). A new harvest has been dealt.</p></div>`);
  else if (ph === 'r4a_check' || ph === 'r4b_check') {
    if (!me.inspector) body += harvestCard(me) + '<p>The inspectors are choosing which villages to check. Wait.</p>';
    else {
      const chosen = new Set(draft.checks ?? me.checks ?? []);
      draft.checks = [...chosen];
      body += `<h3>Choose ${v.checksEach} villages to check</h3><p class="small">You will see their true harvest beside their report. Off by 2 or more, and they are caught. You gain 1 sack for each.</p>
        <div class="keypad">${me.options.map((n) => `<button class="key ${chosen.has(n) ? 'on' : ''}" data-act="toggle" data-v="${n}">${n}</button>`).join('')}</div>
        <button class="btn primary wide" data-act="check" ${chosen.size === Math.min(v.checksEach, me.options.length) ? '' : 'disabled'}>${me.checks && me.checks.length ? 'Checks sent (change and resend)' : `Send ${chosen.size} of ${v.checksEach}`}</button>`;
    }
  } else if (ph === 'r4a_done' || ph === 'r4b_done') {
    const r = ph === 'r4a_done' ? '4a' : '4b';
    body += harvestCard(me, 'You grew') + fateLine(me.fate[`r${r}`], me.fate[`caught${r}`], me.ledger.purged === `r${r}`) + strikeNote(me);
    if (me.seen) { const c = me.seen.filter((x) => x.caught).length; body += `<p>${c ? `You caught ${plural(c, 'liar', 'liars')}: +${c} ${c === 1 ? 'sack' : 'sacks'}.` : 'You caught nobody.'}</p>`; }
    if (me.seen) body += `<div class="card flat"><div class="caps">What you saw</div>${me.seen.map((x) => `<div class="rowb"><span>Village ${x.n}: grew ${x.card}, reported ${x.report ?? '—'}</span><b class="${x.caught ? 'bad' : 'good'}">${x.caught ? 'caught' : 'honest'}</b></div>`).join('')}</div>`;
    if (r === '4b' && v.poll) body += `<p>${me.pledged ? (v.premium ? (me.ledger.premium ? `You signed, an inspector confirmed you, and the Chairman kept his word: +${E.PREMIUM} sacks.` : 'You signed, but no inspector checked you: no premium.') : '“The Plan has been reconsidered.” You signed and reported honestly, and get nothing.') : (v.premium ? 'The premium was paid, but you did not sign.' : '“The Plan has been reconsidered.” No premium for anyone.')}</p>`;
    const L = r === '4a' ? me.ledger.B : me.ledger.C;
    if (L != null) body += `<div class="chg"><span class="chl">Your grain this harvest</span><span class="chv"><b>${L}</b> sacks</span></div>`;
  } else if (ph === 'r4b_poll') {
    body += harvestCard(me, 'Your new harvest') + strikeNote(me);
    if (me.inspector) body += `<div class="story">${icon('inspect')}<p>You are an inspector, so you cannot sign: nobody checks you. Wait while the villages decide.</p></div>`;
    else body += `<div class="story warn">${icon('medal')}<p><span class="st">The Chairman's offer.</span> Sign the honesty pledge and your report is your true harvest, <b>${me.card}</b>. If an inspector checks you, you get ${E.PREMIUM} sacks, if he keeps his word.</p></div>
      <p class="small">${me.card <= 4 ? `An honest ${me.card} is a low report. ${v.k ? `If the Chairman breaks his word, the quota may re-educate you${me.reeducated ? ', and this would be your second time: the purge' : ''}.` : ''}` : `An honest ${me.card} is a fair report. The risk is small; the question is whether you will be checked and paid.`}</p>
      <div class="rowc"><button class="btn ${me.pledged === true ? 'primary' : ''}" data-act="pledge" data-v="1">${icon('check')} Sign the pledge</button><button class="btn ${me.pledged === false ? 'primary' : ''}" data-act="pledge" data-v="0">${icon('cross')} Don't sign</button></div>
      <p class="muted small">${me.pledged == null ? 'Not decided yet.' : me.pledged ? 'You have signed. You can change your mind until the pledge closes.' : 'You have not signed. You can change your mind until the pledge closes.'}</p>`;
  } else if (ph === 'r4b_chair') body += harvestCard(me) + '<p>The Chairman considers the Plan. Look at the projector: both choices cost him something.</p>';
  else if (ph === 'end') body += `<div class="bigcard"><div class="num">${me.ledger.total}</div><div><div class="caps">Sacks kept in all</div><p>${me.ledger.purged ? `Purged in Round ${me.ledger.purged.slice(1)}: everything kept until then was lost. ` : ''}${me.ledger.A ?? 0} from the first harvest${me.ledger.B != null ? `, ${me.ledger.B} in Round 4a` : ''}${me.ledger.C != null ? ` and ${me.ledger.C} in Round 4b` : ''}.</p></div></div>
    <p>You finished <b>${ordinal(me.rank)}</b> of ${me.of}. ${v.regime.fell ? 'The regime fell.' : `The regime survived with Stability ${v.regime.stab}.`}</p>${youMap('end', true)}`;
  return head + `<div class="pbody">${body}</div>`;
}
const ordinal = (n) => `${n}${[11, 12, 13].includes(n % 100) ? 'th' : { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'}`;

export function phoneAction(d, v, me) {
  if (d.act === 'join') return { type: 'join' };
  if (d.act === 'pick') { draft.value = Number(d.v); return 'render'; }
  if (d.act === 'report') { const val = draft.value ?? me.myReport; return val == null ? null : { type: 'report', value: val }; }
  if (d.act === 'toggle') {
    const set = new Set(draft.checks || []); const n = Number(d.v);
    if (set.has(n)) set.delete(n); else if (set.size < v.checksEach) set.add(n);
    draft.checks = [...set]; return 'render';
  }
  if (d.act === 'check') return { type: 'check', list: draft.checks };
  if (d.act === 'pledge' || d.act === 'believe') return { type: 'pledge', yes: d.v === '1' };
  return null;
}
