// The Origin Dossier: Week 2's record of how each state began, set beside the Founding Charter.
import { REGIME_TYPES, ROUTES } from './content/week1.js';
import {
  OLD_ORDERS, CRISES, PROMISE, SEIZURE_GROUPS, ORGANISATION, MORNING, AUTONOMY_LABELS, REACH_LABELS, flipInfo, DOSSIER_Q, DIFFERENCE_REASONS,
} from './content/week2.js';
import { flagSVG } from './flag.js';
import { TERRITORIES } from './territories.js';
import { esc, typePill } from './ui.js';

const lab = (list, v) => (Array.isArray(list) ? list.find((x) => x.value === v)?.label : list[v]?.label) || '–';

export function dossierFacts(team) {
  const w = team.w2 || {};
  const M = w.morning;
  return {
    order: lab(OLD_ORDERS, w.order),
    crisis: lab(CRISES, w.crisis),
    promise: w.promise ? [lab(PROMISE.options, w.promise.value), w.promise.text].filter((x) => x && x !== '–').join(': ') : '',
    group: lab(SEIZURE_GROUPS, w.group),
    org: lab(ORGANISATION, w.org),
    route: ROUTES[w.route]?.label || '–',
    night: w.night || '',
    morning: M ? MORNING.map((m) => (M.choices[m.id] === m.a.value ? m.a : m.b).label) : [],
    autonomy: M ? AUTONOMY_LABELS[M.autonomy] : null,
    reach: M ? REACH_LABELS[M.reach] : null,
    week1Type: w.become?.week1Type || team.rulers?.classified?.type || null,
    finalType: w.regime?.type || null,
    reason: w.become ? lab(DIFFERENCE_REASONS, w.become.reason) : '',
    reasonText: w.become?.text || '',
    cf: w.cf ? { q: (w.cf.flip ? flipInfo(w, w.cf.flip)?.describe : '') || '', answer: w.cf.out?.pred?.type || null, failed: w.cf.failed || '' } : null,
    factor: w.dossier ? lab(DOSSIER_Q.options, w.dossier.factor) : '',
    factorText: w.dossier?.text || '',
  };
}

const row = (k, v) => `<div><div class="caps muted">${esc(k)}</div><div class="small">${v}</div></div>`;

export function dossierHTML(team, { compact = false } = {}) {
  const f = dossierFacts(team);
  const T = TERRITORIES[team.slot];
  const c = team.country || {};
  const changed = f.week1Type && f.finalType && f.week1Type !== f.finalType;
  return `<div class="charter dossier" style="--tc:${T.accent}">
    <div class="row" style="align-items:flex-start">
      ${flagSVG(c.flag, { width: compact ? 60 : 96 })}
      <div class="grow">
        <div class="caps muted">Origin Dossier · ${esc(T.region)}</div>
        <h2 style="margin:2px 0">${esc(c.name || team.name)}</h2>
        <div class="small">Replaced <b>${esc(f.order.toLowerCase())}</b> amid <b>${esc(f.crisis.toLowerCase())}</b>.</div>
      </div>
    </div>
    <div style="margin-top:12px;display:grid;grid-template-columns:${compact ? '1fr' : '1fr 1fr'};gap:10px 18px">
      ${row('Seized by', `${esc(f.group)}${f.org !== '–' ? `, ${esc(f.org.toLowerCase())}` : ''}`)}
      ${row('Road to power', esc(f.route))}
      ${row('Regime', f.finalType ? `${changed ? `${typePill(f.week1Type, { strike: true })} → ` : ''}${typePill(f.finalType)}${f.week1Type && !changed ? ' <span class="tiny muted">same as Week 1</span>' : ''}` : '<span class="muted">Not yet known</span>')}
      ${row('Leader’s free hand', f.autonomy ? `<b>${esc(f.autonomy)}</b>; reach into society ${esc((f.reach || '').toLowerCase())}` : '–')}
      ${!compact && f.promise ? row('First promise', esc(f.promise)) : ''}
      ${!compact && f.morning.length ? row('The morning after', esc(f.morning.join('; '))) : ''}
    </div>
    ${!compact && f.night ? `<p class="small" style="margin-top:10px"><b>The night it happened:</b> ${esc(f.night)}</p>` : ''}
    ${f.reasonText ? `<p class="small"><b>${changed ? 'Why it differs from Week 1' : 'Why it is this way'}${f.reason && f.reason !== '–' ? ` (${esc(f.reason.toLowerCase())})` : ''}:</b> ${esc(f.reasonText)}</p>` : ''}
    ${!compact && f.cf ? `<p class="small"><b>What if?</b> ${esc(f.cf.q)} ${f.cf.answer ? `The readings expect ${esc(REGIME_TYPES[f.cf.answer].label.toLowerCase())}.` : ''}${f.cf.failed ? ` <i>Where it could have failed:</i> ${esc(f.cf.failed)}` : ''}</p>` : ''}
    ${f.factorText ? `<p class="small"><b>What mattered most${f.factor ? ` (${esc(f.factor.toLowerCase())})` : ''}:</b> ${esc(f.factorText)}</p>` : ''}
    <div class="row wrap small" style="margin-top:8px;gap:14px">
      <span>Stability <b>${team.meters.stability}</b></span><span>Treasury <b>${team.meters.treasury}</b></span><span>Capital <b>${team.meters.capital}</b></span>
    </div>
  </div>`;
}
