// "Your regime now": what the team's regime looks like at this point in the game.
// Shown on every team screen, so it is always clear what has been decided so far.
import { REGIME_TYPES, ROUTES, ELECTIONS_PHRASE } from './content/week1.js';
import { OLD_ORDERS, CRISES, SEIZURE_GROUPS, ORGANISATION, MORNING, AUTONOMY_LABELS, REACH_LABELS, startingAutonomy, startingReach } from './content/week2.js';
import { esc, typePill, fmt } from './ui.js';

const lc = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : '');
const row = (k, v) => `<div class="prow"><span>${esc(k)}</span><b>${v}</b></div>`;

export function portraitHTML(team, week, { open = false } = {}) {
  if (!team) return '';
  const c = team.country || {};
  const rows = [];
  const say = [];
  const w = team.w2 || {};
  if (week === 2) {
    if (w.order) rows.push(row('Replaced', esc(OLD_ORDERS[w.order]?.label || '–')));
    if (w.crisis) rows.push(row('The crisis', esc(CRISES[w.crisis]?.label || '–')));
    if (w.group) rows.push(row('Seized by', esc(SEIZURE_GROUPS[w.group].label)));
    if (w.org) rows.push(row('How united', esc(ORGANISATION[w.org].label)));
    if (w.route) rows.push(row('Road to power', esc(ROUTES[w.route].label)));
    if (w.morning) {
      rows.push(row('Morning after', esc(MORNING.map((m) => (w.morning.choices[m.id] === m.a.value ? m.a : m.b).value).map((v) => ({ keep: 'kept officials', fire: 'fired officials', share: 'shared power', purge: 'purged plotters', pay: 'paid the army', guard: 'own guard', reward: 'rewarded crowds', shut: 'shut out crowds' }[v])).join(', '))));
    }
    if (w.group && w.org) {
      const aut = w.morning ? w.morning.autonomy : startingAutonomy(w).autonomy;
      const reach = w.morning ? w.morning.reach : startingReach(w).reach;
      rows.push(row('Leader’s free hand', esc(AUTONOMY_LABELS[aut])));
      rows.push(row('Reach into society', esc(REACH_LABELS[reach])));
    }
    if (w.regime?.type) rows.push(row('Regime type', typePill(w.regime.type)));
    else if (team.rulers?.classified) rows.push(row('Regime type', '<span class="muted">to be found: last week’s answer is sealed until “What has it become?”</span>'));
    // One sentence on what it looks like
    if (w.group) {
      let s = `${c.leader || 'The leader'} rules ${c.name || 'the state'}. Power was seized by ${lc(SEIZURE_GROUPS[w.group].label)}`;
      if (w.org) s += ` (${lc(ORGANISATION[w.org].label)})`;
      if (w.route) s += `, by ${lc(ROUTES[w.route].label)}`;
      say.push(s + '.');
    }
  } else {
    if (team.land) rows.push(row('People', `${team.land.population} million`));
    if (team.oldOrder) rows.push(row('Replaced', esc(OLD_ORDERS[team.oldOrder.order]?.label || '–')));
    const cls = team.rulers?.classified;
    if (cls) {
      rows.push(row('Regime type', typePill(cls.type)));
      rows.push(row('Elections', esc(ELECTIONS_PHRASE[cls.elections] || 'none')));
      say.push(`${c.leader || 'The leader'} heads ${REGIME_TYPES[cls.type].label === 'Personal rule' ? 'a regime of personal rule' : `a ${lc(REGIME_TYPES[cls.type].label)}`} with ${ELECTIONS_PHRASE[cls.elections] || 'no national elections'}.`);
    }
    const sel = team.selectorate?.result;
    if (sel) {
      rows.push(row('Winning coalition', `${fmt(sel.coalition)} people`));
      say.push(`Power rests on ${fmt(sel.coalition)} essential supporters out of ${fmt(sel.real)} with real influence.`);
    }
    if (team.decree?.detected !== null && team.decree?.detected !== undefined) rows.push(row('Information', `${team.decree.information}%`));
  }
  const m = team.meters || {};
  rows.push(row('Stability · Treasury · Capital', `${m.stability ?? '–'} · ${m.treasury ?? '–'} · ${m.capital ?? '–'}`));
  if (rows.length <= 1 && !say.length) return '';
  return `<details class="portrait card flat"${open ? ' open' : ''}><summary><span class="caps">Your regime now</span></summary>
    ${say.length ? `<p class="small" style="margin:8px 0">${esc(say.join(' '))}</p>` : ''}
    <div class="stack" style="gap:4px;margin-top:6px">${rows.join('')}</div></details>`;
}
