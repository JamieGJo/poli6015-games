// Main screen views for Week 2 (Origins). main.js passes in its shared helpers.
import { REGIME_TYPES, ROUTES } from './content/week1.js';
import {
  OLD_ORDERS, CRISES, PROMISE, SEIZURE_GROUPS, ORGANISATION, ORGANISATION_READING, ROUTE_FOLLOWS, MORNING, MORNING_INTRO,
  MORNING_INTRO_CITE, AUTONOMY_LABELS, REACH_LABELS, COALITION_LABELS, flipInfo, deriveRegime, startingAutonomy, DOSSIER_Q, DIFFERENCE_REASONS, LESSONS2, NEXT_WEEK2, G,
} from './content/week2.js';
import { heroHTML, versusHTML, howHTML, gaugeHTML, powerGauges, deltaHTML } from './outcome.js';
import { choiceArt } from './art.js';
import { finalMapHTML } from './finalmap.js';
import { ROUTE_STORY, GROUP_STORY, MORNING_STORY } from './content/stories.js';
import { PUZZLES } from './content/puzzles.js';
import { flagSVG } from './flag.js';
import { esc, citeHTML, typePill, accent } from './ui.js';
import { teamList, quizzesOn } from './engine.js';
import { dossierHTML } from './dossier.js';

const nm = (t) => esc(t.country?.name || t.name);
const lab = (list, v) => (Array.isArray(list) ? list.find((x) => x.value === v)?.label : list[v]?.label) || '–';
const lc = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : '');
const head = (t, extra = '') => `<div class="row spread" style="align-items:center"><div class="row" style="gap:8px;align-items:center">${flagSVG(t.country?.flag, { width: 34 })}<h3 style="margin:0">${nm(t)}</h3></div>${extra}</div>`;
const none = (t, msg = 'No answer') => `<div class="tcard" style="--tc:${accent(t.slot)}">${head(t)}<p class="muted small">${msg}</p></div>`;
const dots = (ts) => ts.map((t) => `<i style="background:${accent(t.slot)}" title="${nm(t)}"></i>`).join('');
const grid = (n) => `grid-template-columns:${n >= 3 ? 'repeat(auto-fit,minmax(260px,1fr))' : 'repeat(auto-fit,minmax(320px,1fr))'}`;
const cards = (s, fn) => `<div class="reveal-grid" style="${grid(teamList(s).length)}">${teamList(s).map((t) => (t.w2 ? fn(t, t.w2) : none(t, 'Not in Week 2'))).join('')}</div>`;
const parallel = (P) => (P ? `<p class="tiny parallel" style="margin:6px 0 0"><b>In real life.</b> ${esc(P.parallel)} ${citeHTML(P.cite)}</p>` : '');

export function week2Views({ bigMap, statusList, meaningHTML }) {
  return {
    rejoin: {
      open: (s) => ({
        left: bigMap(s),
        right: `<div class="caps muted">Week 2</div><h1>Origins</h1>
          <p class="prompt">Same countries, same pasts. Today you go back to the moment power was seized and rebuild your regime one step at a time: the crisis, who moves first, how united they are, the road they take, and what they do the morning after. Last week’s regime type is sealed. At the end, you compare.</p>
          <div class="stack">${teamList(s).map((t) => `<div class="tcard" style="--tc:${accent(t.slot)}">${head(t)}<div class="tiny muted" style="margin-top:4px">Replaced ${esc(lc(OLD_ORDERS[t.w2?.order]?.label || 'unknown'))}${t.w2?.orderDealt ? ' (dealt)' : ''} · ${esc(t.country?.leader || '')}</div></div>`).join('')}</div>
          <p class="small muted" style="margin-top:10px">Teams: open the game on any device, enter the code and choose your country. Readings: ${citeHTML(G('25–43'))} ${citeHTML({ src: 'ef2011', page: '1–22' })} ${citeHTML({ src: 'bdm2011ch2', page: '1–34' })}</p>
          ${statusList(s, 'rejoin')}`,
      }),
    },

    crisis: {
      open: (s) => ({
        full: `<h1>The crisis</h1>
          <p class="prompt">Every seizure needs an opening. The game deals each state a crisis that fits its past. Teams answer one question on why crises matter, then write the first broadcast.</p>
          ${cards(s, (t, w) => {
            const O = OLD_ORDERS[w.order], C = CRISES[w.crisis];
            return `<div class="tcard" style="--tc:${accent(t.slot)}">${head(t)}
              <div class="caps muted" style="margin-top:8px">Replacing</div><b>${esc(O.label)}</b>
              <div class="caps muted" style="margin-top:8px">The crisis</div><b>${esc(C.label)}</b> <button class="btn btn-ghost tiny" data-cycle="crisis" data-team="${esc(t.id)}" title="Deal a different crisis">change</button>
              <div class="small">${esc(C.text)} ${citeHTML(C.cite)}</div></div>`;
          })}
          ${statusList(s, 'crisis')}`,
      }),
      reveal: (s) => ({
        full: `<h1>The first broadcasts</h1>
          ${cards(s, (t, w) => (w.promise ? `<div class="tcard" style="--tc:${accent(t.slot)}">${head(t)}<div class="caps muted" style="margin-top:6px">${esc(CRISES[w.crisis].label)}</div><p style="font-family:var(--display);font-style:italic;margin:6px 0 0">“${esc(w.promise.text || lab(PROMISE.options, w.promise.value))}”</p><div class="tiny muted">Promise: ${esc(lab(PROMISE.options, w.promise.value))}</div></div>` : none(t)))}
          <p class="small muted" style="margin-top:12px">Seizures are often welcomed at first: people know what the new rulers are against, not what they stand for. ${citeHTML(G('30'))}</p>
          ${meaningHTML(s, 'crisis')}`,
      }),
    },

    seizure: {
      open: (s) => ({
        left: bigMap(s),
        right: `<h1>Who moves first?</h1>
          <p class="prompt">Leaders never act alone: only groups overthrow governments. Each team chooses who leads its seizure. First, two questions: who can stage a coup, and who has led most seizures? ${citeHTML(G('26–27'))}</p>
          <div class="stack">${Object.values(SEIZURE_GROUPS).map((g) => `<div><b>${esc(g.label)}</b><div class="small">${esc(g.text)}</div></div>`).join('')}</div>
          ${statusList(s, 'seizure')}`,
      }),
      reveal: (s) => {
        const ts = teamList(s);
        const rows = Object.entries(SEIZURE_GROUPS).filter(([, g]) => g.share).map(([k, g]) => `<div class="bar"><span><b>${esc(g.shareLabel)}</b></span><div class="track"><div class="fill" style="width:${g.share * 1.6}%"></div><div class="marks" style="left:${g.share * 1.6}%">${dots(ts.filter((t) => t.w2?.group === k || (k !== 'both' && t.w2?.group === 'both' && (k === 'officers' || k === 'party'))))}</div></div><span><b>${g.share}%</b></span></div>`).join('');
        return {
          full: `<h1>Who seized power</h1>
            ${cards(s, (t, w) => (w.group ? `<div class="tcard" style="--tc:${accent(t.slot)}">${head(t)}<div class="caps muted" style="margin-top:6px">${esc(SEIZURE_GROUPS[w.group].label)}</div>${parallel(GROUP_STORY[w.group])}</div>` : none(t)))}
            <h3 style="margin-top:20px">Who led seizures of power, 1946–2010 (share of all seizures)</h3>
            <div class="bars">${rows}</div>
            <p class="small muted" style="margin-top:6px">Groups combining officers and a party count in both rows, so the shares add up to more than 100. Insiders and royal houses are not counted separately. ${citeHTML(G('31'))}</p>
            ${meaningHTML(s, 'seizure')}`,
        };
      },
    },

    organisation: {
      open: (s) => ({
        left: bigMap(s),
        right: `<h1>How united are they?</h1>
          <p class="prompt">${esc(ORGANISATION_READING.text)} ${citeHTML(ORGANISATION_READING.cite)}</p>
          <div class="stack">${Object.values(ORGANISATION).map((o) => `<div><b>${esc(o.label)}</b><div class="small">${esc(o.text)}</div><div class="tiny muted">For example: ${esc(o.example)}</div></div>`).join('')}</div>
          <p class="small muted" style="margin-top:8px">${esc(ORGANISATION_READING.caveat)}</p>
          ${statusList(s, 'organisation')}`,
      }),
      reveal: (s) => ({
        full: `<h1>How united they are</h1>
          ${cards(s, (t, w) => (w.org ? `<div class="tcard" style="--tc:${accent(t.slot)}">${head(t)}<div class="caps muted" style="margin-top:6px">${esc(SEIZURE_GROUPS[w.group]?.label || '')}</div><b style="font-size:20px">${esc(ORGANISATION[w.org].label)}</b><p class="small" style="margin:6px 0 0">${esc(ORGANISATION[w.org].meaning)}</p>${gaugeHTML('Leader’s free hand', startingAutonomy(w).autonomy, 4, AUTONOMY_LABELS)}</div>` : none(t)))}
          ${meaningHTML(s, 'organisation')}`,
      }),
    },

    route: {
      open: (s) => ({
        left: bigMap(s),
        right: `<h1>The road to power</h1>
          <p class="prompt">Six roads lead to dictatorship, and not every group can take every road. Each team first spots which road is closed to it, and why. Then it chooses, and writes one sentence about the night it happened. ${citeHTML(G('27'))}</p>
          <div class="stack">${Object.values(ROUTES).map((r) => `<div><b>${esc(r.label)}</b><div class="small">${esc(r.blurb)}</div></div>`).join('')}</div>
          ${statusList(s, 'route')}`,
      }),
      reveal: (s) => {
        const ts = teamList(s);
        const rows = Object.entries(ROUTES).map(([k, r]) => `<div class="bar"><span><b>${esc(r.label)}</b></span><div class="track"><div class="fill" style="width:${(r.share / 50) * 100}%"></div><div class="marks" style="left:${(r.share / 50) * 100}%">${dots(ts.filter((t) => t.w2?.route === k))}</div></div><span><b>${r.share}%</b></span></div>`).join('');
        return {
          full: `<h1>The night it happened</h1>
            ${cards(s, (t, w) => (w.route ? `<div class="tcard" style="--tc:${accent(t.slot)}">${head(t)}<div class="caps muted" style="margin-top:6px">${esc(ROUTES[w.route].label)}</div>${w.night ? `<p class="small" style="font-family:var(--display);font-style:italic;margin:4px 0">“${esc(w.night)}”</p>` : ''}${parallel(ROUTE_STORY[w.route])}<p class="tiny" style="margin:6px 0 0"><b>What tends to follow.</b> ${esc(ROUTE_FOLLOWS[w.route].text)}</p></div>` : none(t)))}
            <h3 style="margin-top:20px">How dictatorships began, 1946–2010</h3>
            <div class="bars">${rows}</div>
            <p class="small muted" style="margin-top:6px">${citeHTML(G('28'))}</p>
            ${meaningHTML(s, 'route')}`,
        };
      },
    },

    morning: {
      open: (s) => ({
        full: `<h1>The morning after</h1>
          <p class="prompt">${esc(MORNING_INTRO)} ${citeHTML(MORNING_INTRO_CITE)}</p>
          <div class="reveal-grid" style="grid-template-columns:repeat(2,1fr)">${MORNING.map((m, i) => `<div class="card"><div class="caps muted">${i + 1}. ${esc(m.q)}</div>
            <div class="vsrow"><div><b>${esc(m.a.label)}</b><div class="small">${esc(m.a.text)}</div></div><div class="vs-mid">or</div><div><b>${esc(m.b.label)}</b><div class="small">${esc(m.b.text)}</div></div></div></div>`).join('')}</div>
          <p class="small muted" style="margin-top:10px">What each choice does depends on the regime so far: a purge works differently for a disciplined party than for a loose coalition.</p>
          ${statusList(s, 'morning')}`,
      }),
      reveal: (s) => ({
        full: `<h1>The morning after</h1>
          <table class="dtable" style="width:100%"><thead><tr><th></th>${MORNING.map((m) => `<th>${esc(m.q)}</th>`).join('')}<th>Free hand</th><th>Reach</th><th>Coalition</th><th>Stability</th></tr></thead>
          <tbody>${teamList(s).map((t) => { const M = t.w2?.morning; return `<tr><td><b style="color:${accent(t.slot)};font-size:18px">${nm(t)}</b></td>${MORNING.map((m) => { const side = M ? (M.choices[m.id] === m.a.value ? m.a : m.b) : null; return `<td class="small">${side ? `<div class="row" style="gap:8px;align-items:center">${choiceArt(side.value, { size: 40 })}<span>${esc(side.label)}</span></div>` : '–'}</td>`; }).join('')}<td><b>${M ? esc(AUTONOMY_LABELS[M.autonomy]) : '–'}</b></td><td><b>${M ? esc(REACH_LABELS[M.reach]) : '–'}</b></td><td><b>${M ? esc(COALITION_LABELS[M.coalition ?? 2]) : '–'}</b></td><td><b style="font-size:22px;color:${M && M.fx.stability < 0 ? 'var(--accent)' : 'var(--ok)'}">${M ? (M.fx.stability > 0 ? '+' : M.fx.stability < 0 ? '−' : '±') + Math.abs(M.fx.stability) : '–'}</b></td></tr>`; }).join('')}</tbody></table>
          <div class="reveal-grid" style="grid-template-columns:repeat(4,1fr);margin-top:16px">${MORNING.map((m) => `<div class="card flat"><div class="caps muted">${esc(m.q)}</div>${[m.a, m.b].map((x) => `<p class="tiny" style="margin:6px 0 0"><b>${esc(x.label)}.</b> ${esc(MORNING_STORY[m.id][x.value].parallel)} ${citeHTML(MORNING_STORY[m.id][x.value].cite)}</p>`).join('')}</div>`).join('')}</div>
          ${meaningHTML(s, 'morning')}`,
      }),
    },

    become: {
      open: (s) => ({
        left: bigMap(s),
        right: `<h1>What has it become?</h1>
          <p class="prompt">Each team first predicts the kind of regime its choices have produced. Then last week’s answer is unsealed, and they compare. Where the two differ, what explains it?</p>
          <div class="stack small">${DIFFERENCE_REASONS.map((r) => `<div>${esc(r.label)} ${citeHTML(r.cite)}</div>`).join('')}</div>
          ${statusList(s, 'become')}`,
      }),
      reveal: (s) => {
        const ts = teamList(s);
        const same = ts.filter((t) => t.w2?.regime && t.w2.become?.week1Type === t.w2.regime.type).length;
        return {
          full: `<h1>Last week and this week</h1>
            <p class="prompt">${same} of ${ts.length} states ended up where they started.</p>
            ${cards(s, (t, w) => (w.regime ? `<div class="tcard" style="--tc:${accent(t.slot)}">${head(t)}
              ${w.become?.week1Type ? versusHTML(w.become.week1Type, w.regime.type, { aLabel: 'Week 1', bLabel: 'Week 2', size: 64 }) : heroHTML(w.regime.type, { size: 72 })}
              <p class="tiny" style="margin:6px 0 0">${esc(w.regime.chain[w.regime.chain.length - 1]?.text || '')}</p>
              ${w.become?.reason ? `<div class="tiny muted" style="margin-top:6px">Why: ${esc(lab(DIFFERENCE_REASONS, w.become.reason))}</div>` : ''}${w.become?.text ? `<p class="small" style="font-style:italic;margin:4px 0 0">“${esc(w.become.text)}”</p>` : ''}</div>` : none(t)))}
            ${meaningHTML(s, 'become')}`,
        };
      },
    },

    whatif: {
      open: (s) => ({
        full: `<h1>What if?</h1>
          <p class="prompt">One thing changes for each state. Teams predict what regime the readings would expect, and whether their road would still have been open. Then they name the moment their seizure could have failed.</p>
          ${cards(s, (t, w) => (w.flip ? `<div class="tcard" style="--tc:${accent(t.slot)}">${head(t, `<button class="btn btn-ghost tiny" data-cycle="flip" data-team="${esc(t.id)}" title="Deal a different change">change</button>`)}<p style="margin:6px 0 0;font-weight:600">${esc(flipInfo(w, w.flip)?.describe || 'Not dealt yet: the seizure is not complete.')}</p></div>` : none(t, 'Not dealt yet: the seizure is not complete.')))}
          ${statusList(s, 'whatif')}`,
      }),
      reveal: (s) => ({
        full: `<h1>What if?</h1>
          ${cards(s, (t, w) => (w.cf ? `<div class="tcard" style="--tc:${accent(t.slot)}">${head(t)}<p style="margin:6px 0;font-weight:600">${esc(flipInfo(w, w.cf.flip)?.describe || '')}</p>
            ${w.cf.out ? versusHTML(w.regime?.type || deriveRegime(w).type, w.cf.out.pred.type, { aLabel: 'They built', bLabel: 'What if', size: 64 }) : ''}
            ${w.cf.failed ? `<p class="small" style="font-style:italic;margin:6px 0 0">“${esc(w.cf.failed)}”</p>` : ''}</div>` : none(t)))}
          ${meaningHTML(s, 'whatif')}`,
      }),
    },

    dossier: {
      open: (s) => ({
        left: bigMap(s),
        right: `<h1>The Origin Dossier</h1>
          <p class="prompt">${esc(DOSSIER_Q.q)} ${esc(DOSSIER_Q.hint)}</p>
          ${quizzesOn(s) ? `<p class="small">Then one puzzle, with an answer in the readings:</p><div class="stack">${PUZZLES.week2.map((p) => `<div><b>${esc(p.label)}.</b> <span class="small">${esc(p.q)}</span></div>`).join('')}</div>` : ''}
          ${statusList(s, 'dossier')}`,
      }),
      reveal: (s) => ({
        full: `<h1>Meridia: how it began</h1>
          <div class="reveal-grid" style="${grid(teamList(s).length)}">${teamList(s).map((t) => {
            const D = t.w2?.dossier;
            const P = PUZZLES.week2.find((p) => p.value === D?.puzzle);
            return `<div>${dossierHTML(t, { compact: true })}${P && D.puzzleText ? `<div class="card flat" style="margin-top:6px;background:var(--accent-soft)"><div class="caps muted">${esc(P.label)}</div><p class="small" style="margin:4px 0 0">“${esc(D.puzzleText)}”</p></div>` : ''}</div>`;
          }).join('')}</div>
          ${quizzesOn(s) ? `<h3 style="margin-top:20px">The puzzles: what the readings suggest</h3><div class="stack">${PUZZLES.week2.map((p) => `<div class="small"><b>${esc(p.label)}.</b> ${esc(p.answer)} ${citeHTML(p.cite)} ${citeHTML(p.cite2)}</div>`).join('')}</div>` : ''}
          <p class="small muted" style="margin-top:14px">Next: the map of Meridia after the seizures.</p>`,
      }),
    },

    meridia: {
      open: (s) => ({
        full: `<h1>Meridia after the seizures</h1>
          <p class="prompt">Five states, five seizures of power. Each picture shows the regime it became; the shading shows its peoples, with the ruling group starred; the signs show what each leader did on the morning after.</p>
          ${finalMapHTML(teamList(s))}
          ${meaningHTML(s, 'meridia')}
          <h2 style="margin-top:22px">Three lessons from Week 2</h2>
          ${LESSONS2.map((l, i) => `<div class="lesson"><div class="n">${i + 1}</div><div><b>${esc(l.head)}${/[?.!]$/.test(l.head) ? "" : "."}</b> ${esc(l.text)} ${[l.cite, l.cite2, l.cite3].filter(Boolean).map(citeHTML).join(' ')}</div></div>`).join('')}
          <div class="card flat" style="margin-top:16px;background:var(--accent-soft)">${esc(NEXT_WEEK2)}</div>`,
      }),
    },
  };
}
