// Main screen (projector). Owns the game state.
import {
  WEEK1, REGIME_TYPES, CLASSIFY_EXPLANATIONS, MISMATCH_NOTE, SELECTORATE, DECREE, LESSONS, CLAIM_OPTIONS,
  JUSTIFY, ELECTORAL_MISMATCH, ELECTORAL_LAYERS, compareClaim, selectorateAnalysis, rung,
} from './content/week1.js';
import { OLD_ORDERS, OLD_ORDER_INTRO } from './content/week2.js';
import { DILEMMA } from './content/wintrobe.js';
import { PUZZLES, MEANING, researchFor } from './content/puzzles.js';
import { newGame, applyAction, reveal, goTo, currentStep, teamList, removeTeam, weekDef, startWeek2, cycleDeal, quizzesOn, settingsOf, setSetting } from './engine.js';
import { quizTally } from './quizui.js';
import { week2Views } from './main2.js';
import { connect } from './sync.js';
import { mapSVG, provincesFor, territoryViewBox } from './map.js';
import { deltaHTML } from './outcome.js';
import { regimeArt } from './art.js';
import { flagSVG } from './flag.js';
import { esc, citeHTML, typePill, claimPills, resultPills, decreeDetail, accent, fmt, money, nestedCircles, moodColour, timerText } from './ui.js';
import { TERRITORIES } from './territories.js';
import { charterHTML, profileHTML } from './charter.js';
import { LAND_INTRO, GROUP_COLOURS, RELIGION, URBAN, WEALTH, groupShares, find } from './content/land.js';
import { iconSVG } from './icons.js';

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const room = (params.get('room') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
if (room.length !== 4) location.href = 'index.html';
const KEY = `sts:host:${room}`;

function load() {
  try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); localStorage.setItem('sts:lastroom', room); } catch (e) { /* ignore */ }
}

let state = load() || newGame(room);
const sync = await connect(room, 'host');
sync.onAction((a) => {
  if (a.type === '__hello') { sync.publish(state); return; }
  state = applyAction(state, a);
  commit();
});
function commit() { save(); sync.publish(state); render(); }

let tour = -1; // which state the Year One tour shows; -1 for all
const JUSTIFY_SHORT = { decides: 'Who decides:', remove: 'Who could remove:', elections: 'Elections:' };
const joinURL = new URL('team.html', location.href).href.split('?')[0];

// ---------- Views ----------
// Each returns { left, right } (map + panel) or { full }.

const teamsWithCountry = (s, show = true) => teamList(s).map((t) => (show ? t : { ...t, country: null }));
const bigMap = (s, opts = {}) => mapSVG({ teams: teamsWithCountry(s, opts.show !== false), ...opts });

function statusList(s, stepId) {
  const ts = teamList(s);
  if (!ts.length) return '<p class="muted">No teams yet.</p>';
  const done = ts.filter((t) => t.submitted[stepId]).length;
  return `<p class="caps muted" style="margin-top:18px">${done} of ${ts.length} teams ready</p>`;
}

// "What does this mean?": a puzzle for the class after a reveal, and the quiz tally.
function meaningHTML(s, stepId) {
  if (!quizzesOn(s)) return '';
  const M = MEANING[stepId];
  return `${quizTally(s, stepId)}${M ? `<div class="card flat meaning" style="margin-top:14px"><div class="caps">What does this mean?</div><p style="margin:4px 0 0;font-size:1.15rem">${esc(M.q)} ${citeHTML(M.cite)}</p></div>` : ''}`;
}

function qrSVG(text) {
  if (!window.qrcode) return '';
  const q = window.qrcode(0, 'M');
  q.addData(text); q.make();
  return q.createSvgTag({ cellSize: 5, margin: 2, scalable: true });
}

const VIEWS = {
  lobby: {
    open: (s) => ({
      left: bigMap(s),
      right: `<h1>Five new states</h1>
        <p class="prompt">Form five teams. One device per team joins the game and claims a territory of Meridia.</p>
        <div class="card row" style="gap:18px;align-items:center">
          <div style="width:150px;height:150px" id="qr">${qrSVG(`${joinURL}?room=${room}`)}</div>
          <div class="grow"><div class="caps muted">Go to</div><div style="font-weight:700;word-break:break-all">${esc(joinURL)}</div>
          <div class="caps muted" style="margin-top:10px">and enter the code</div><div class="code" style="display:inline-block;margin-top:4px">${room}</div></div>
        </div>
        <div class="card flat" style="margin-top:16px;background:var(--paper)">
          <div class="caps muted">Ground rules</div>
          <p class="small" style="margin:6px 0 0">This is a game about how power works, not a celebration of dictators. Every state is fictional, and nobody speaks for a real country. When we debrief, we ask who paid the cost.</p>
        </div>
        ${statusList(s, 'lobby')}`,
    }),
  },

  found: {
    open: (s) => ({
      left: bigMap(s, { show: false }),
      right: `<h1>Found the state</h1>
        <p class="prompt">Name your country and its capital, place the capital on your territory, and design a flag and a motto. Give your ruler a name and a title.</p>
        <div class="card flat" style="background:var(--paper)"><p class="small" style="margin:0">Be inventive, but keep it fictional. A flag is a claim about who the state belongs to: what does yours claim?</p></div>
        ${statusList(s, 'found')}`,
    }),
    reveal: (s) => ({
      left: bigMap(s),
      right: `<h2>The founding of Meridia</h2>
        <div class="stack">${teamList(s).map((t) => t.country ? `<div class="tcard" style="--tc:${accent(t.slot)}"><div class="row">${flagSVG(t.country.flag, { width: 66 })}<div><h3>${esc(t.country.name)}</h3><div class="small">Capital ${esc(t.country.capital)} · ${esc(t.country.leader)}</div>${t.country.motto ? `<div class="small" style="font-family:var(--display);font-style:italic">“${esc(t.country.motto)}”</div>` : ''}</div></div></div>` : `<div class="tcard"><b>${esc(t.name)}</b> <span class="muted">did not found a state</span></div>`).join('')}</div>`,
    }),
  },

  land: {
    open: (s) => ({
      left: bigMap(s),
      right: `<h1>Land and people</h1>
        <p class="prompt">${esc(LAND_INTRO)}</p>
        <div class="card flat" style="background:var(--paper)"><p class="small" style="margin:0">Choose freely this week. Next week the readings ask whether a country like yours tends to get a regime like yours, and what oil, aid or a divided population do to a dictator’s choices.</p></div>
        ${statusList(s, 'land')}`,
    }),
    reveal: (s) => ({
      left: bigMap(s),
      right: `<h2>The peoples of Meridia</h2>
        <div class="stack">${teamList(s).map((t) => {
          const L = t.land;
          if (!L) return `<div class="tcard" style="--tc:${accent(t.slot)}"><b>${esc(t.country?.name || t.name)}</b> <span class="muted">not described</span></div>`;
          const shares = groupShares(L.ethnic);
          const w = find(WEALTH, L.wealth);
          return `<div class="tcard" style="--tc:${accent(t.slot)}"><div class="row spread"><h3 style="margin:0">${esc(t.country?.name || t.name)}</h3><span class="small"><b>${L.population}m</b> people · ${iconSVG(w.icon, 15)} ${esc(w.label)}</span></div>
            <div class="groupbar" style="margin-top:6px;height:20px">${shares.map((sh, i) => `<span style="width:${sh}%;background:${GROUP_COLOURS[i]}">${sh >= 18 ? esc(L.groups[i]) : ''}${i === L.rulerGroup ? ' ★' : ''}</span>`).join('')}</div>
            <div class="tiny muted" style="margin-top:4px">${esc(find(RELIGION, L.religion).label)} · ${esc(find(URBAN, L.urban).label)} · ★ the ruler’s people</div></div>`;
        }).join('')}</div>`,
    }),
  },

  rulers: {
    open: (s) => ({
      left: bigMap(s),
      right: `<h1>Who rules?</h1>
        <p class="prompt">Each team says what kind of regime it runs, alone or combining two. Then it answers four questions about who really controls access to power and what elections look like, and explains its answers.</p>
        <div class="stack">${CLAIM_OPTIONS.map((k) => { const t = REGIME_TYPES[k]; return `<div class="row" style="align-items:flex-start">${typePill(k)}<div class="small grow">${esc(t.definition)} ${citeHTML(t.cite)}</div></div>`; }).join('')}</div>
        ${statusList(s, 'rulers')}`,
    }),
    reveal: (s) => {
      const ts = teamList(s);
      const cards = ts.map((t) => {
        const r = t.rulers;
        if (!r) return `<div class="tcard" style="--tc:${accent(t.slot)}"><h3>${esc(t.country?.name || t.name)}</h3><p class="muted">No answer</p></div>`;
        const c = compareClaim(r);
        const ex = CLASSIFY_EXPLANATIONS[r.classified?.reason];
        const em = !c.electoralOk ? ELECTORAL_MISMATCH[c.hasElect ? 'missed' : 'claimedWithout'] : null;
        return `<div class="tcard" style="--tc:${accent(t.slot)}">
          <div class="row">${flagSVG(t.country?.flag, { width: 40 })}<h3 style="margin:0">${esc(t.country?.name || t.name)}</h3></div>
          <div class="small muted" style="margin-top:8px">They said</div>${claimPills(c.claim, c)}
          <div class="small muted" style="margin-top:6px">Geddes would say</div><div class="row" style="gap:10px;align-items:center">${regimeArt(c.type, REGIME_TYPES[c.type].colour, { size: 64 })}<div>${resultPills(r.classified)}<div class="verdict-sm ${c.ok ? 'ok' : c.exact ? 'part' : 'no'}">${c.ok ? '✓ matches' : c.exact ? '◐ right type, elections wrong' : '✗ does not match'}</div></div></div>
          ${!c.exact && ex ? `<p class="small" style="margin-top:8px">${esc(ex.text)} ${citeHTML(ex.cite)}</p>` : ''}
          ${em ? `<p class="small" style="margin-top:6px">${esc(em.text)} ${citeHTML(em.cite)}</p>` : ''}
          ${r.just ? JUSTIFY.filter((j) => r.just[j.id]).map((j) => `<p class="tiny muted" style="margin:4px 0 0"><b>${esc(JUSTIFY_SHORT[j.id])}</b> “${esc(r.just[j.id])}”</p>`).join('') : ''}
        </div>`;
      }).join('');
      const rows = ['military', 'personalist', 'party'].map((k) => {
        const T = REGIME_TYPES[k];
        const here = ts.filter((t) => t.rulers?.classified?.type === k);
        return `<div class="bar"><span><b>${esc(T.label)}</b></span><div class="track"><div class="fill" style="width:${(T.years / 25) * 100}%;background:${T.colour}"></div><div class="marks" style="left:${(T.years / 25) * 100}%">${here.map((t) => `<i style="background:${accent(t.slot)}" title="${esc(t.country?.name || t.name)}"></i>`).join('')}</div></div><span class="small"><b>${T.years}</b> yrs</span></div>`;
      }).join('');
      return {
        full: `<h1>What you said, and what Geddes would say</h1>
          <p class="prompt">${esc(MISMATCH_NOTE.text)} ${citeHTML(MISMATCH_NOTE.cite)}</p>
          <div class="reveal-grid">${cards}</div>
          <h3 style="margin-top:24px">How long do they last? Average length of rule, 1946–1998</h3>
          <div class="bars">${rows}</div>
          <p class="small muted" style="margin-top:8px">Dots show the class’s states. Monarchies are not in Geddes’s data, and her mixed types rest on few cases. ${citeHTML({ src: 'geddes1999', page: '133' })}</p>
          <h3 style="margin-top:20px">Elections run alongside every type</h3>
          <div class="reveal-grid" style="grid-template-columns:repeat(4,1fr)">${['none', 'single', 'rigged', 'competitive'].map((k) => { const L = ELECTORAL_LAYERS[k]; const here = ts.filter((t) => t.rulers?.classified?.elections === k); return `<div class="card flat"><b>${esc(L.label || 'No elections')}</b><div class="row" style="gap:4px;margin:4px 0">${here.map((t) => `<i style="width:12px;height:12px;border-radius:50%;background:${accent(t.slot)};display:inline-block" title="${esc(t.country?.name || t.name)}"></i>`).join('') || '<span class="tiny muted">none here</span>'}</div><div class="tiny">${esc(L.text)} ${citeHTML(L.cite)}</div></div>`; }).join('')}</div>
          ${meaningHTML(s, 'rulers')}`,
      };
    },
  },

  selectorate: {
    open: (s) => ({
      left: bigMap(s),
      right: `<h1>Who counts?</h1>
        <p class="prompt">No one rules alone. Each team works out three circles of people, one at a time: who has a formal say in choosing the leader, who really chooses, and whose support the leader cannot do without. What you decided about your people and your regime sets the limits.</p>
        <div class="stack">${SELECTORATE.terms.map((t) => `<div><b>${esc(t.label)}</b> <span class="muted">(the “${esc(t.nick)}”)</span><div class="small">${esc(t.gloss)} ${citeHTML(t.cite)}</div></div>`).join('')}</div>
        ${statusList(s, 'selectorate')}`,
    }),
    reveal: (s) => ({
      full: `<h1>Who counts, state by state</h1>
        <p class="prompt">Circles are drawn to scale, so area is people; the smallest are enlarged so you can see them. The outer ring shows each state’s peoples. ${esc(SELECTORATE.modelNote)}</p>
        <div class="reveal-grid" style="grid-template-columns:repeat(auto-fit,minmax(270px,1fr))">${teamList(s).map((t) => {
          if (!t.selectorate || !t.selectorate.ctx) return `<div class="tcard"><b>${esc(t.country?.name || t.name)}</b><p class="muted">No answer</p></div>`;
          const r = t.selectorate.result, ctx = t.selectorate.ctx;
          const nc = nestedCircles(r, ctx.adults, 130, t.land);
          const an = selectorateAnalysis(r, ctx, t);
          return `<div class="tcard" style="--tc:${accent(t.slot)}">
            <div class="row spread"><h3 style="margin:0">${esc(t.country?.name || t.name)}</h3><span class="tiny muted">quiz ${t.selectorate.quizCorrect}/3</span></div>
            <div class="row" style="gap:12px;align-items:center;margin-top:6px"><div>${nc.svg}</div><div class="grow tiny">${nc.legend}</div></div>
            <div class="small" style="margin-top:6px"><b>${esc(rung(r.coalition, ctx.adults).label)}</b> hold power: ${esc(rung(r.coalition, ctx.adults).text.toLowerCase())}</div>
            <div class="stack" style="margin-top:6px;gap:4px">${an.slice(0, 3).map((a) => `<div class="tiny"><b>${esc(a.head)}${/[?.!]$/.test(a.head) ? "" : "."}</b> ${esc(a.text)}</div>`).join('')}</div>
          </div>`;
        }).join('')}</div>
        <div class="row wrap" style="margin-top:18px;gap:24px;align-items:flex-start">
          <div class="stack grow" style="min-width:320px">${SELECTORATE.rules.map((r) => `<div class="small"><b>Rule ${r.n}.</b> ${esc(r.text)} ${citeHTML(r.cite)}</div>`).join('')}</div>
          <div class="grow" style="min-width:320px">${meaningHTML(s, 'selectorate')}</div>
        </div>`,
    }),
  },

  oldorder: {
    open: (s) => ({
      left: bigMap(s),
      right: `<h1>What came before?</h1>
        <p class="prompt">${esc(OLD_ORDER_INTRO)}</p>
        <div class="stack">${Object.values(OLD_ORDERS).map((o) => `<div><b>${esc(o.label)}</b></div>`).join('')}</div>
        <p class="small muted" style="margin-top:10px">Each team first answers one question on the readings: what did most new dictatorships replace?</p>
        ${statusList(s, 'oldorder')}`,
    }),
    reveal: (s) => {
      const ts = teamList(s);
      const rows = Object.entries(OLD_ORDERS).map(([k, O]) => `<div class="bar"><span><b>${esc(O.label)}</b></span><div class="track"><div class="fill" style="width:${(O.weight / 45) * 100}%"></div><div class="marks" style="left:${(O.weight / 45) * 100}%">${ts.filter((t) => t.oldOrder?.order === k).map((t) => `<i style="background:${accent(t.slot)}"></i>`).join('')}</div></div><span><b>${O.weight}%</b></span></div>`).join('');
      return {
        full: `<h1>What did new dictatorships replace?</h1>
          <p class="prompt">Bars show the share of dictatorships since 1946 that replaced each kind of rule. Dots show your states. ${citeHTML({ src: 'gwf2018', page: '25–26' })}</p>
          <div class="bars">${rows}</div>
          <p class="small muted" style="margin-top:6px">The split between earlier dictators and monarchies is the game’s; Geddes, Wright and Frantz report 42 per cent for both together.</p>
          <div class="reveal-grid" style="margin-top:18px">${ts.filter((t) => t.oldOrder).map((t) => `<div class="tcard" style="--tc:${accent(t.slot)}"><div class="caps muted">${esc(OLD_ORDERS[t.oldOrder.order].label)}</div><h3>${esc(t.country?.name || t.name)}</h3>${t.oldOrder.memory ? `<p class="small" style="font-family:var(--display);font-style:italic">“${esc(t.oldOrder.memory)}”</p>` : ''}</div>`).join('')}</div>
          ${meaningHTML(s, 'oldorder')}`,
      };
    },
  },

  dilemma: {
    open: (s) => ({
      left: bigMap(s),
      right: `<div class="caps muted">Optional extra</div><h1>The dictator’s dilemma</h1>
        <p class="prompt">${esc(DILEMMA.intro)} ${citeHTML(DILEMMA.introCite)}</p>
        <div class="quote">${esc(DILEMMA.nero.text)} ${citeHTML(DILEMMA.nero.cite)}</div>
        <div class="stack small" style="margin-top:12px">
          <div><b>Repression</b> stops people organising ${citeHTML(DECREE.cites.organise)}, but frightened officials stop telling the truth ${citeHTML(DECREE.cites.mobutu)}.</div>
          <div><b>Loyalty</b> can be bought with rents: jobs and wasteful projects ${citeHTML(DECREE.cites.rents)}.</div>
          <div><b>Who watches the watchers?</b> One service, rival agencies, or rotating chiefs ${citeHTML(DECREE.cites.agencies)}.</div>
          <div><b>Insurance.</b> A Swiss account, or real limits on your own power ${citeHTML(DECREE.cites.artefact)}.</div>
          <div>Then each team reads the dispatches and sends one inspector. Every state starts with a Treasury of ${DECREE.treasuryStart}.</div>
        </div>
        ${statusList(s, 'dilemma')}`,
    }),
    reveal: (s) => ({
      full: `<h1>What the palace heard, and what was true</h1>
        <p class="prompt" style="margin-bottom:10px">Left map: what officials reported. Right map: the real mood, with the plot marked.</p>
        <div class="reveal-grid" style="grid-template-columns:repeat(auto-fit,minmax(340px,1fr))">${teamList(s).map((t) => decreeCard(t, s)).join('')}</div>
        <h2 style="margin-top:20px">What Wintrobe says</h2>
        <div style="columns:2;column-gap:28px">${DILEMMA.lessons.map((l, i) => `<div class="lesson" style="break-inside:avoid"><div class="n">${i + 1}</div><div><b>${esc(l.head)}.</b> ${esc(l.text)} ${citeHTML(l.cite)}</div></div>`).join('')}</div>
        ${meaningHTML(s, 'dilemma')}`,
    }),
  },

  charter: {
    open: (s) => ({
      left: bigMap(s),
      right: `<h1>The Founding Charter</h1>
        <p class="prompt">Each team now has its Founding Charter to download and keep. ${quizzesOn(s) ? 'Before signing, each team solves one puzzle, and gets a real regime like its own to research:' : ''}</p>
        ${quizzesOn(s) ? `<div class="stack">${PUZZLES.week1.map((p) => `<div><b>${esc(p.label)}.</b> <span class="small">${esc(p.q)}</span></div>`).join('')}</div>` : ''}
        <p class="small muted" style="margin-top:10px">After the reveal, click a state’s name to tour it.</p>
        ${statusList(s, 'charter')}`,
    }),
    reveal: (s) => {
      const ts = teamList(s);
      const nav = `<div class="row wrap tournav" style="gap:6px;margin-bottom:14px"><button class="btn ${tour < 0 ? 'btn-primary' : ''}" data-tour="-1">All five states</button>${ts.map((t, i) => `<button class="btn ${tour === i ? 'btn-primary' : ''}" data-tour="${i}"><span class="sw" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${accent(t.slot)};margin-right:6px"></span>${esc(t.country?.name || t.name)}</button>`).join('')}</div>`;
      const t = ts[tour];
      if (t) {
        return {
          full: `${nav}<div class="row" style="gap:14px;align-items:center">${flagSVG(t.country?.flag, { width: 84 })}<div><div class="caps muted">Your state, Year One</div><h1 style="margin:0">${esc(t.country?.name || t.name)}</h1>${t.country?.motto ? `<div style="font-family:var(--display);font-style:italic">“${esc(t.country.motto)}”</div>` : ''}</div></div>
            <div style="margin-top:12px">${profileHTML(t, { wide: true, uid: `tour${t.slot}` })}</div>
            ${puzzleCard(t)}`,
        };
      }
      return {
        full: `${nav}<h1>Meridia, Year One</h1>
        <div class="reveal-grid" style="grid-template-columns:${ts.length >= 3 ? `repeat(${ts.length},minmax(0,1fr))` : 'repeat(auto-fit,minmax(300px,1fr))'}">${ts.map((t) => `<div>${charterHTML(t, { compact: true })}${puzzleCard(t, true)}</div>`).join('')}</div>
        <h2 style="margin-top:24px">Three lessons from Week 1</h2>
        ${LESSONS.map((l, i) => `<div class="lesson"><div class="n">${i + 1}</div><div><b>${esc(l.head)}.</b> ${esc(l.text)} ${citeHTML(l.cite)}</div></div>`).join('')}
        <div class="card flat" style="margin-top:16px;background:var(--accent-soft)"><b>Next week: Origins.</b> Same countries, same pasts. You go back to the moment power was seized and rebuild your regime step by step: who moved first, by which road, and what they did the morning after. Then you see whether you end up with the regime you chose today. ${citeHTML({ src: 'gwf2018', page: '36–43' })}</div>`,
      };
    },
  },
};

Object.assign(VIEWS, week2Views({ bigMap, statusList, meaningHTML }));

function puzzleCard(t, compact = false) {
  const P = PUZZLES.week1.find((p) => p.value === t.puzzle1?.id);
  if (!P || !t.puzzle1.text) return '';
  const r = researchFor(t, 1);
  return `<div class="card flat" style="margin-top:${compact ? 6 : 12}px;background:var(--accent-soft)"><div class="caps muted">${esc(P.label)}</div>${compact ? '' : `<p class="small" style="margin:4px 0;font-weight:600">${esc(P.q)}</p>`}<p class="small" style="margin:4px 0 0">“${esc(t.puzzle1.text)}”</p>
    ${!compact ? `<p class="small" style="margin:8px 0 0"><b>What the readings suggest.</b> ${esc(P.answer)} ${citeHTML(P.cite)} ${citeHTML(P.cite2)}</p>${r ? `<p class="small" style="margin:6px 0 0"><b>Research a regime like yours:</b> ${esc(r.name)}. ${citeHTML(r.cite)}</p>` : ''}` : ''}</div>`;
}

function decreeCard(t) {
  const d = t.decree;
  if (!d) return `<div class="tcard"><b>${esc(t.country?.name || t.name)}</b><p class="muted">No decree</p></div>`;
  const provs = provincesFor(t.slot, t.country?.capitalAt);
  const vb = territoryViewBox(t.slot, 20);
  const mk = (field, uid) => mapSVG({
    teams: [t], highlight: t.slot, dim: true, compact: true, labels: false, flags: false, viewBox: vb, uid,
    provinces: { list: provs.map((p, i) => ({ cells: p.cells, fill: moodColour(d.provinces[i][field]) })) },
    provinceLabels: field === 'mood' ? provs.map((p, i) => (d.provinces[i].plot ? { at: p.centre, text: 'PLOT' } : null)).filter(Boolean) : [],
  });
  const rep = DECREE.repression[d.choice.repression].label;
  const loy = DECREE.loyalty[d.choice.loyalty].label;
  return `<div class="tcard" style="--tc:${accent(t.slot)}">
    <div class="row spread"><h3 style="margin:0">${esc(t.country?.name || t.name)}</h3><span class="chip">Information ${d.information}%</span></div>
    <div class="small muted">${esc(rep)} repression · ${esc(loy)}${d.choice.agencies ? ' · rival agencies' : ''}</div>
    <div class="row" style="gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap"><div class="verdict-sm ${d.detected ? 'ok' : 'no'}" style="margin:0;font-size:16px;padding:6px 10px">${d.detected ? '✓ Plot caught' : '✗ Plot struck'}</div>${deltaHTML({ stability: d.stabilityChange, treasury: -d.cost })}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px">
      <div><div class="caps muted">Palace heard</div><div class="map-wrap" style="aspect-ratio:${vb[2]}/${vb[3]};max-height:30vh">${mk('reported', `p${t.slot}`)}</div></div>
      <div><div class="caps muted">The truth</div><div class="map-wrap" style="aspect-ratio:${vb[2]}/${vb[3]};max-height:30vh">${mk('mood', `q${t.slot}`)}</div></div>
    </div>
    ${decreeDetail(d)}
    ${d.notes.map((n) => `<p class="small" style="margin:6px 0 0">${esc(n.text)}${n.key === 'security' ? ' ' + citeHTML(DECREE.cites.securityForces) : ''}</p>`).join('')}
  </div>`;
}

// ---------- Render ----------

function render() {
  const step = currentStep(state);
  $('#code').textContent = room;
  const W = weekDef(state);
  $('#weeklabel').textContent = `Week ${W.id} · ${W.title}`;
  $('#steps').innerHTML = W.steps.map((s, i) => `<span class="s ${i < state.step ? 'done' : ''} ${i === state.step ? 'now' : ''}">${esc(s.short)}</span>`).join('');
  { const box = $('#steps'), now = box.querySelector('.now'); if (now && box.scrollWidth > box.clientWidth) box.scrollLeft = now.offsetLeft - box.offsetLeft - (box.clientWidth - now.offsetWidth) / 2; }
  const v = VIEWS[step.id];
  const view = (state.phase === 'reveal' && v.reveal ? v.reveal : v.open)(state);
  const stage = $('#stage');
  if (view.full) {
    stage.className = 'stage full';
    stage.innerHTML = `<div class="panel">${view.full}</div>`;
  } else {
    stage.className = 'stage';
    stage.innerHTML = `<div class="map-wrap">${view.left}</div><div class="panel">${view.right}</div>`;
  }
  const ts = teamList(state);
  $('#teams').innerHTML = TERRITORIES.map((T, slot) => {
    const t = ts.find((x) => x.slot === slot);
    if (!t) return `<span class="teamchip" style="opacity:.45"><span class="sw" style="background:${T.accent}"></span>${esc(T.defaultTeam)}<span class="st">empty</span></span>`;
    const done = !!t.submitted[step.id];
    return `<button class="teamchip ${done ? 'done' : ''}" data-team="${esc(t.id)}" title="Open this team’s screen in a new tab"><span class="sw" style="background:${T.accent}"></span>${esc(t.country?.name || t.name)}<span class="st">${done ? 'Ready' : 'Working'}</span></button>`;
  }).join('');
  $('#back').disabled = state.step === 0;
  const lastOfWeek1 = state.week !== 2 && state.step >= W.steps.length - 1;
  $('#next').disabled = (state.step >= W.steps.length - 1 && !lastOfWeek1) || (step.id === 'lobby' && ts.length === 0);
  $('#next').textContent = lastOfWeek1 ? 'Start Week 2' : 'Next';
  const canReveal = state.phase === 'open' && !!v.reveal;
  $('#reveal').classList.toggle('hidden', !canReveal);
  $('#next').classList.toggle('btn-primary', !canReveal);
  $('#mode').textContent = sync.mode === 'local' ? 'Local mode' : 'Live';
  $('#mode').title = sync.mode === 'local' ? 'Team screens only work as tabs in this browser. See SETUP.md.' : 'Teams can join from their own devices.';
  tick();
}

function tick() {
  const step = currentStep(state);
  const left = step.minutes * 60000 - (Date.now() - state.stepStartedAt);
  const el = $('#timer');
  el.textContent = timerText(left);
  el.classList.toggle('over', left < 0);
}
setInterval(tick, 1000);

// ---------- Controls ----------

const next = () => {
  if ($('#next').disabled) return;
  if (state.week !== 2 && state.step >= weekDef(state).steps.length - 1) { beginWeek2(); return; }
  state = goTo(state, state.step + 1); commit();
};
function beginWeek2() {
  if (state.week === 2) { alert('This game is already in Week 2.'); return; }
  if (!confirm('Start Week 2 (Origins) with these five states? Week 1 answers are kept: each state keeps its country and its past, and the game deals it a crisis. Download the class results first if you want a copy of Week 1 as it stands.')) return;
  state = startWeek2(state); tour = -1; commit();
}
const back = () => { if (state.step > 0) { state = goTo(state, state.step - 1); commit(); } };
const doReveal = () => { if (!$('#reveal').classList.contains('hidden')) { state = reveal(state); commit(); } };
$('#next').onclick = next;
$('#back').onclick = back;
$('#reveal').onclick = doReveal;
$('#timer').onclick = () => { state = { ...state, stepStartedAt: Date.now() }; commit(); };
$('#teams').onclick = (e) => {
  const b = e.target.closest('[data-team]');
  if (b) window.open(`team.html?room=${room}&as=${encodeURIComponent(b.dataset.team)}`, '_blank');
};
document.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea')) return;
  if (e.key === 'ArrowRight') next();
  if (e.key === 'ArrowLeft') back();
  if (e.key === 'r' || e.key === 'R') doReveal();
  if (e.key === 'f' || e.key === 'F') document.documentElement.requestFullscreen?.();
});
$('#stage').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tour]');
  if (b) { tour = +b.dataset.tour; render(); }
  const c = e.target.closest('[data-cycle]');
  if (c) { state = cycleDeal(state, c.dataset.team, c.dataset.cycle); commit(); }
});
function menuLabels() {
  const set = settingsOf(state);
  const q = document.querySelector('[data-act="quizzes"]'), w = document.querySelector('[data-act="wintrobe"]');
  if (q) q.textContent = `Quizzes and “What does this mean?” prompts: ${set.quizzes ? 'on' : 'off'}`;
  if (w) w.textContent = `Optional extra, the dictator’s dilemma (Week 1): ${set.wintrobe ? 'on' : 'off'}`;
}
$('#menu').onclick = () => { menuLabels(); $('#menudlg').showModal(); };
$('#menudlg').onclick = (e) => {
  const act = e.target.dataset?.act;
  if (act === 'close') $('#menudlg').close();
  if (act === 'fullscreen') { document.documentElement.requestFullscreen?.(); $('#menudlg').close(); }
  if (act === 'manual') window.open(`team.html?room=${room}`, '_blank');
  if (act === 'remove') {
    const ts = teamList(state);
    if (!ts.length) { alert('No teams have joined yet.'); return; }
    const pick = prompt(`Remove which team? Type its number. Its answers are deleted from this game.\n\n${ts.map((t, i) => `${i + 1}. ${t.country?.name || t.name}`).join('\n')}`);
    const t = ts[(parseInt(pick, 10) || 0) - 1];
    if (t && confirm(`Remove ${t.country?.name || t.name}? Its territory becomes free again.`)) { state = removeTeam(state, t.id); commit(); $('#menudlg').close(); }
  }
  if (act === 'export') {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `seize-the-state_${room}_week${state.week || 1}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }
  if (act === 'week2') { $('#menudlg').close(); beginWeek2(); }
  if (act === 'quizzes' || act === 'wintrobe') {
    const cur = settingsOf(state)[act];
    if (act === 'wintrobe' && state.week === 2) { alert('The dictator’s dilemma is part of Week 1.'); return; }
    state = setSetting(state, act, !cur); commit(); menuLabels();
  }
  if (act === 'load') $('#loadfile').click();
};

$('#loadfile').onchange = async (e) => {
  const f = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    const loaded = JSON.parse(await f.text());
    if (!loaded || typeof loaded.teams !== 'object' || !Number.isInteger(loaded.step)) throw new Error('not a saved game');
    const n = Object.keys(loaded.teams).length;
    if (!confirm(`Load this saved game (${n} team${n === 1 ? '' : 's'}, Week ${loaded.week || 1})? It replaces the game in room ${room}. Teams rejoin with code ${room}.`)) return;
    state = { ...loaded, room, stepStartedAt: Date.now(), settings: settingsOf(loaded) };
    tour = -1; commit(); $('#menudlg').close();
  } catch (err) {
    alert('That file is not a saved Seize the State game.');
  }
};

// QR code library (loaded after first paint so the screen never waits for it).
import('https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/+esm')
  .then((m) => { window.qrcode = m.default || m; render(); })
  .catch(() => { /* the join URL and code are still shown */ });

render();
sync.publish(state);
