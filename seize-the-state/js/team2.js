// Team device forms and reveals for Week 2 (Origins). team.js passes in its shared helpers.
// The regime is rebuilt step by step from the seizure of power; last week's type stays
// sealed until "What has it become?".
import { REGIME_TYPES, ROUTES } from './content/week1.js';
import {
  OLD_ORDERS, CRISES, PROMISE, SEIZURE_GROUPS, ORGANISATION, ORGANISATION_READING, routeCheck, ROUTE_FOLLOWS,
  MORNING, MORNING_INTRO, MORNING_INTRO_CITE, AUTONOMY_LABELS, REACH_LABELS, startingAutonomy, startingReach,
  deriveRegime, DIFFERENCE_REASONS, flipInfo, flipOutcome, FAILED_PROMPT, DOSSIER_Q, LESSONS2, NEXT_WEEK2, G,
} from './content/week2.js';
import { heroHTML, versusHTML, howHTML, gaugeHTML, powerGauges, deltaHTML, choicesHTML } from './outcome.js';
import { finalMapHTML, stateCardHTML } from './finalmap.js';
import { storyFor, MORNING_STORY } from './content/stories.js';
import { PUZZLES } from './content/puzzles.js';
import { esc, citeHTML, typePill, meters, storyHTML } from './ui.js';
import { charterHTML } from './charter.js';
import { dossierHTML } from './dossier.js';
import { quizzesOn } from './engine.js';

const lab = (list, v) => (Array.isArray(list) ? list.find((x) => x.value === v)?.label : list[v]?.label) || '–';
const lc = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : '');
const ROUTE_ORDER = ['coup', 'authoritarianization', 'insurgency', 'uprising', 'foreign', 'eliteRuleChange'];

// "What might this mean?" for the team, after each step (off in solo play).
const THINK = {
  crisis: 'Who in the old regime has just lost the most from this crisis, and will they defend it?',
  seizure: 'Once you have won, who inside your own group is best placed to remove your leader?',
  organisation: 'A year from now, who could stop your leader taking all the power?',
  route: 'Which roads were closed to you, and what does that tell you about what each road needs?',
  morning: 'Which of today’s choices makes your leader safer this year, and which makes the regime weaker in ten?',
  whatif: 'Which of your choices made the biggest difference to the kind of regime you got?',
};

export function week2Steps(h) {
  // The closing map: every state that has joined, with this team's own card first.
  const STEPS_MERIDIA = (main, t) => {
    const all = Object.values(h.getState().teams || {}).sort((a, b) => a.slot - b.slot);
    main.innerHTML = `<h2>Meridia after the seizures</h2>
      <p class="muted">Each picture shows the regime a state became; the shading shows its peoples, with the ruling group starred; the signs show what its leader did on the morning after.</p>
      ${finalMapHTML(all, { uid: 'fmt', cards: false })}
      <div class="state-cards">${[t, ...all.filter((x) => x.id !== t.id)].map(stateCardHTML).join('')}</div>
      <div class="row" style="margin-top:12px"><button class="btn" id="m-print">Print or save PDF</button></div>
      <h2 style="margin-top:20px">Three lessons from Week 2</h2>${LESSONS2.map((l, i) => `<div class="lesson"><div class="n">${i + 1}</div><div><b>${esc(l.head)}${/[?.!]$/.test(l.head) ? "" : "."}</b> ${esc(l.text)} ${[l.cite, l.cite2, l.cite3].filter(Boolean).map(citeHTML).join(' ')}</div></div>`).join('')}
      <div class="card flat" style="margin-top:12px;background:var(--accent-soft)">${esc(NEXT_WEEK2)}</div>`;
    $('#m-print').onclick = () => window.print();
  };
  const { $, draft, submit, footButton, optionCards, bindText, quizBox, researchHTML, getState, changeAnswer } = h;
  const think = (id) => (quizzesOn(getState()) && THINK[id] ? `<div class="card flat think" style="margin-top:12px"><div class="caps muted">What might this mean?</div><p class="small" style="margin:4px 0 0">${esc(THINK[id])}</p></div>` : '');
  const crisisCard = (w) => {
    const O = OLD_ORDERS[w.order], C = CRISES[w.crisis];
    return `<div class="card">
      <div class="caps muted">Your state replaced</div><h3 style="margin:2px 0 4px">${esc(O.label)}</h3><p class="small" style="margin:0">${esc(O.text)} ${citeHTML(O.cite)}</p>
      <div class="caps muted" style="margin-top:10px">The crisis that opened the door</div><h3 style="margin:2px 0 4px">${esc(C.label)}</h3><p class="small" style="margin:0">${esc(C.text)} ${citeHTML(C.cite)}${C.cite2 ? ' ' + citeHTML(C.cite2) : ''}</p>
    </div>`;
  };
  const none = (main) => { main.innerHTML = '<p class="muted">You did not answer this step.</p>'; };

  return {
    rejoin: {
      form: (main, foot, t) => {
        const w = t.w2 || {};
        main.innerHTML = `<div class="caps muted">Week 2 · Origins</div><h2>Welcome back</h2>
          <p class="muted">This is the state you founded last week. This week you go back to the moment power was seized and rebuild the regime step by step: who moved first, how, and what they did the morning after.${t.rulers?.classified ? ' Last week’s regime type is sealed until the end, when you compare the two.' : ''}</p>
          ${charterHTML(t, { compact: true, sealed: true })}
          ${w.order ? `<div class="card flat" style="margin-top:12px"><b>Your past.</b> <span class="small">${esc(OLD_ORDERS[w.order].label)}${w.orderDealt ? ' (dealt by the game, because you skipped this last week)' : ''}.</span></div>` : ''}`;
        footButton(foot, 'We are ready', () => submit('rejoin', {}));
      },
    },

    crisis: {
      form: (main, foot, t) => {
        const w = t.w2;
        const d = (draft.crisis ||= { value: null, text: '' });
        const st = storyFor('crisis', t);
        main.innerHTML = `<h2>The crisis</h2>
          <div id="q"></div>
          <p class="muted" style="margin-top:14px">The game has dealt your state a crisis to fit its past. Your rulers have to work with what they find.</p>
          ${crisisCard(w)}${storyHTML(st)}
          <h3 style="margin-top:16px">${esc(PROMISE.q)}</h3>
          <p class="small muted">${esc(PROMISE.hint)} ${citeHTML(PROMISE.cite)}</p>
          <div class="options two" id="pr"></div>
          <label class="field" style="margin-top:12px"><span>Your first broadcast, in one sentence</span><textarea id="pr-text" maxlength="160" placeholder="Citizens! The days of … are over."></textarea></label>`;
        optionCards($('#pr'), PROMISE.options.map((o) => ({ value: o.value, title: o.label })), d.value, (v) => { d.value = v; check(); });
        bindText($('#pr-text'), d, 'text');
        const qd = quizBox($('#q'), 'crisis', 'before', t, () => check());
        const check = () => { btn.disabled = !(d.value && qd()); };
        d._check = check;
        const btn = footButton(foot, 'Broadcast it', () => submit('crisis', { value: d.value, text: d.text }));
        check();
      },
      after: (main, foot, t) => {
        const w = t.w2;
        main.innerHTML = `<h2>The crisis</h2>${crisisCard(w)}
          ${w.promise ? `<div class="quote" style="margin-top:12px">“${esc(w.promise.text || lab(PROMISE.options, w.promise.value))}”</div>` : ''}
          <p class="small muted">Seizures are often welcomed at first: people know what the new rulers are against, not what they stand for. ${citeHTML(G('30'))}</p>${think('crisis')}`;
        changeAnswer(foot);
      },
    },

    seizure: {
      form: (main, foot, t) => {
        const w = t.w2;
        const d = (draft.seizure ||= { group: w.group || null });
        main.innerHTML = `<h2>Who moves first?</h2>
          <div id="q"></div>
          <p class="muted" style="margin-top:14px">Leaders never act alone: only groups can overthrow a government. Your state is replacing <b>${esc(lc(OLD_ORDERS[w.order].label))}</b>. Who leads the seizure? ${citeHTML(G('26–27'))}</p>
          <div class="options" id="g"></div>`;
        optionCards($('#g'), Object.entries(SEIZURE_GROUPS).map(([k, g]) => ({ value: k, title: g.label, detail: `${esc(g.text)} ${citeHTML(g.cite)}` })), d.group, (v) => { d.group = v; check(); });
        const qd = quizBox($('#q'), 'seizure', 'before', t, () => check());
        const check = () => { btn.disabled = !(d.group && qd()); };
        const btn = footButton(foot, 'They move first', () => submit('seizure', d));
        check();
      },
      after: (main, foot, t) => {
        const g = SEIZURE_GROUPS[t.w2.group];
        if (!g) return none(main);
        main.innerHTML = `<h2>${esc(g.label)}</h2>
          <div class="card"><p class="small" style="margin:0">${esc(g.text)} ${citeHTML(g.cite)}</p>
          ${g.share ? `<p class="small" style="margin:8px 0 0">Groups like yours led about <b>${g.share}%</b> of all seizures of power since 1946. ${citeHTML(G('31'))}</p>` : `<p class="small muted" style="margin:8px 0 0">The readings’ table of seizure groups does not count groups like yours separately. ${citeHTML(G('31'))}</p>`}</div>
          ${storyHTML(storyFor('seizure', t))}${think('seizure')}`;
        changeAnswer(foot);
      },
    },

    organisation: {
      form: (main, foot, t) => {
        const d = (draft.org ||= { org: t.w2.org || null });
        main.innerHTML = `<h2>How united are they?</h2>
          <div id="q"></div>
          <div class="card flat" style="margin-top:14px"><b>The argument.</b> <span class="small">${esc(ORGANISATION_READING.text)} ${citeHTML(ORGANISATION_READING.cite)} <i>${esc(ORGANISATION_READING.caveat)}</i></span></div>
          <p class="muted" style="margin-top:12px">How united is ${esc(lc(SEIZURE_GROUPS[t.w2.group]?.label || 'your group'))}?</p>
          <div class="options" id="o"></div>`;
        optionCards($('#o'), Object.entries(ORGANISATION).map(([k, o]) => ({ value: k, title: o.label, detail: `${esc(o.text)}<br><i>For example: ${esc(o.example)}</i>` })), d.org, (v) => { d.org = v; check(); });
        const qd = quizBox($('#q'), 'organisation', 'before', t, () => check());
        const check = () => { btn.disabled = !(d.org && qd()); };
        const btn = footButton(foot, 'That is who we are', () => submit('organisation', d));
        check();
      },
      after: (main, foot, t) => {
        const w = t.w2, O = ORGANISATION[w.org];
        if (!O) return none(main);
        const a = startingAutonomy(w);
        main.innerHTML = `<h2>${esc(O.label)}</h2>
          <div class="card"><p class="small" style="margin:0"><b>What it means.</b> ${esc(O.meaning)} ${citeHTML(O.cite)}${O.cite2 ? ' ' + citeHTML(O.cite2) : ''}</p></div>
          ${storyHTML(storyFor('organisation', t))}
          <div class="result-head">Your leader’s free hand, so far</div>
          ${gaugeHTML('Free hand', a.autonomy, 4, AUTONOMY_LABELS, { note: `${esc(a.why)} ${citeHTML(a.cite)}${a.cite2 ? ' ' + citeHTML(a.cite2) : ''}` })}
          ${think('organisation')}`;
        changeAnswer(foot);
      },
    },

    route: {
      form: (main, foot, t) => {
        const w = t.w2;
        const d = (draft.route ||= { route: null, night: '' });
        main.innerHTML = `<h2>The road to power</h2>
          <div id="q"></div>
          <p class="muted" style="margin-top:14px">${esc(SEIZURE_GROUPS[w.group]?.label || 'Your group')}, replacing ${esc(lc(OLD_ORDERS[w.order].label))}. Which road do you take? Some are closed to you, and the game says why.</p>
          <div class="options" id="r"></div>
          <label class="field" style="margin-top:14px"><span>The night it happened, in one sentence</span><textarea id="night" maxlength="240" placeholder="At 3am the radio station fell silent…"></textarea></label>`;
        const items = ROUTE_ORDER.map((k) => {
          const rc = routeCheck(k, w.group, w.order, w.org);
          return { value: k, disabled: !rc.ok, title: `${ROUTES[k].label}${!rc.ok ? ' · closed' : rc.rare ? ' · possible but rare' : ''}`, detail: `${esc(rc.reason)} ${citeHTML(rc.cite)}${rc.cite2 ? ' ' + citeHTML(rc.cite2) : ''}` };
        });
        const qd = quizBox($('#q'), 'route', 'before', t, () => check());
        // Hide the roads until the closed-road question is answered, so it is a real test.
        const draw = () => {
          if (!qd()) { $('#r').innerHTML = '<p class="small muted">Answer the question first: then the roads open.</p>'; return; }
          optionCards($('#r'), items, d.route, (v) => { d.route = v; check(); });
        };
        bindText($('#night'), d, 'night');
        const check = () => { draw(); btn.disabled = !(d.route && qd()); };
        d._check = () => { btn.disabled = !(d.route && qd()); };
        const btn = footButton(foot, 'Seize power', () => submit('route', d));
        check();
      },
      after: (main, foot, t) => {
        const w = t.w2, R = ROUTES[w.route];
        if (!R) return none(main);
        const F = ROUTE_FOLLOWS[w.route];
        const showFollows = !quizzesOn(getState()) || getState().phase === 'reveal';
        const rch = startingReach(w);
        main.innerHTML = `<h2>${esc(R.label)}</h2>
          ${w.night ? `<div class="quote">${esc(w.night)}</div>` : ''}
          ${storyHTML(storyFor('route', t))}
          <div class="card" style="margin-top:12px"><p class="small" style="margin:0"><b>${R.share}%</b> of dictatorships since 1946 began this way. ${citeHTML(G('28'))}</p>
          ${showFollows ? `<p class="small" style="margin:8px 0 0"><b>What tends to follow.</b> ${esc(F.text)} ${citeHTML(F.cite)}${F.cite2 ? ' ' + citeHTML(F.cite2) : ''}</p>` : ''}</div>
          <div id="q"></div>
          <div class="result-head">Reach into society, so far</div>
          ${gaugeHTML('Reach into society', rch.reach, 3, REACH_LABELS, { note: `${esc(rch.why)} ${citeHTML(rch.cite)}` })}
          ${think('route')}`;
        quizBox($('#q'), 'route', 'after', t);
        changeAnswer(foot);
      },
    },

    morning: {
      form: (main, foot, t) => {
        const d = (draft.morning ||= {});
        main.innerHTML = `<h2>The morning after</h2>
          <div id="q"></div>
          <p class="muted" style="margin-top:14px">${esc(MORNING_INTRO)} ${citeHTML(MORNING_INTRO_CITE)}</p>
          ${MORNING.map((m, i) => `<h3 style="margin-top:16px">${i + 1}. ${esc(m.q)}</h3><div class="options two vs" id="m-${m.id}"></div>`).join('')}`;
        for (const m of MORNING) {
          optionCards($(`#m-${m.id}`), [m.a, m.b].map((x) => ({ value: x.value, title: x.label, detail: `${esc(x.text)} ${citeHTML(x.cite)}${x.cite2 ? ' ' + citeHTML(x.cite2) : ''}` })), d[m.id] || null, (v) => { d[m.id] = v; check(); });
        }
        const qd = quizBox($('#q'), 'morning', 'before', t, () => check());
        const check = () => { btn.disabled = !(MORNING.every((m) => d[m.id]) && qd()); };
        const btn = footButton(foot, 'Make it so', () => submit('morning', d));
        check();
      },
      after: (main, foot, t) => {
        const w = t.w2, M = w.morning;
        if (!M) return none(main);
        main.innerHTML = `<h2>The morning after</h2>
          ${choicesHTML(MORNING, M.choices, { stories: MORNING_STORY })}
          <div class="result-head">What changed</div>
          ${powerGauges(w)}
          ${deltaHTML(M.fx)}
          <div class="result-head">What happened</div>
          <ol class="how">${M.notes.map((n) => `<li><div class="small">${esc(n.text)} ${citeHTML(n.cite)}${n.cite2 ? ' ' + citeHTML(n.cite2) : ''}</div></li>`).join('')}</ol>
          ${getState().phase === 'reveal' ? `<div style="margin-top:12px">${meters(t.meters)}</div>` : ''}
          ${think('morning')}`;
        changeAnswer(foot);
      },
    },

    become: {
      form: (main, foot, t) => {
        const w = t.w2;
        const d = (draft.become ||= { reason: null, text: '' });
        const reg = deriveRegime(w);
        const w1 = t.rulers?.classified?.type || null;
        main.innerHTML = `<h2>What has it become?</h2>
          <div id="q"></div>
          <div id="res"></div>`;
        const qd = quizBox($('#q'), 'become', 'before', t, () => { draw(); check(); });
        const draw = () => {
          if (!qd()) { $('#res').innerHTML = '<p class="small muted" style="margin-top:12px">Make your prediction first.</p>'; return; }
          const same = w1 && w1 === reg.type;
          $('#res').innerHTML = `${heroHTML(reg.type, { kicker: 'By the readings, your regime is now' })}
            <div class="result-head">How you got here</div>${howHTML(w, reg)}
            ${w1 ? `<div class="result-head">Last week and this week</div>${versusHTML(w1, reg.type, { aLabel: 'Week 1: you said', bLabel: 'Week 2: you built' })}
              <p class="small" style="margin:0;text-align:center"><b>${same ? 'The same.' : 'A different regime.'}</b> ${same ? 'Your seizure leads where you started.' : 'Something between the seizure and last week’s choice does not fit.'}</p>` : ''}
            ${w1 && !same ? `<h3 style="margin-top:14px">What explains the difference?</h3><div class="options" id="why"></div>` : '<h3 style="margin-top:14px">What did most to make it this way?</h3><div class="options" id="why"></div>'}
            <label class="field" style="margin-top:12px"><span>In one sentence</span><textarea id="bt" maxlength="280" placeholder="${w1 && !same ? 'We ended up with … rather than … because …' : 'It became … because …'}"></textarea></label>`;
          optionCards($('#why'), DIFFERENCE_REASONS.map((r) => ({ value: r.value, title: r.label })), d.reason, (v) => { d.reason = v; check(); });
          bindText($('#bt'), d, 'text');
        };
        draw();
        const check = () => { btn.disabled = !(qd() && d.reason); };
        d._check = check;
        const btn = footButton(foot, 'That is our regime', () => submit('become', d));
        check();
      },
      after: (main, foot, t) => {
        const w = t.w2, reg = w.regime, b = w.become;
        if (!reg) return none(main);
        const T = REGIME_TYPES[reg.type];
        main.innerHTML = `${heroHTML(reg.type, { kicker: 'Your regime has become' })}
          ${b?.week1Type ? versusHTML(b.week1Type, reg.type, { aLabel: 'Week 1: you said', bLabel: 'Week 2: you built' }) : ''}
          <div class="result-head">How you got here</div>${howHTML(w, reg)}
          ${powerGauges(w)}
          ${b?.text ? `<div class="quote" style="margin-top:12px">${esc(b.text)}</div>` : ''}
          <div class="card flat" style="margin-top:12px"><p class="small" style="margin:0">${esc(T.definition)} ${citeHTML(T.cite)}</p>
            ${T.years ? `<p class="small" style="margin:6px 0 0">Regimes like this lasted <b>${T.years} years</b> on average. ${citeHTML(T.yearsCite)}</p>` : ''}
            <p class="small" style="margin:6px 0 0"><b>Where it is weak.</b> ${esc(T.weakness)} ${citeHTML(T.weaknessCite)}</p></div>`;
        changeAnswer(foot);
      },
    },

    whatif: {
      form: (main, foot, t) => {
        const w = t.w2;
        const F = flipInfo(w, w.flip);
        const d = (draft.whatif ||= { failed: '' });
        const out = flipOutcome(w, w.flip);
        main.innerHTML = `<h2>What if?</h2>
          ${F ? `<div class="card"><div class="caps muted">One thing changes: ${esc(lc(F.label))}</div><p style="font-weight:600;font-size:18px;margin:4px 0">${esc(F.describe)}</p>
          <p class="small" style="margin:0">Everything else stays as you chose it, including the morning after. <b>The reading.</b> ${esc(F.reading)} ${citeHTML(F.cite)}${F.cite2 ? ' ' + citeHTML(F.cite2) : ''}</p></div>` : '<div class="card"><p class="small" style="margin:0">Your teacher has not dealt a what-if yet.</p></div>'}
          <div id="q"></div><div id="res"></div>
          <h3 style="margin-top:16px">${esc(FAILED_PROMPT.q)}</h3>
          <p class="small muted">${esc(FAILED_PROMPT.swap)}</p>
          <label class="field"><span>The moment</span><textarea id="fl" maxlength="240" placeholder="${esc(FAILED_PROMPT.starter)}"></textarea></label>`;
        const qd = quizBox($('#q'), 'whatif', 'before', t, () => { draw(); check(); });
        const draw = () => {
          if (!qd() || !out) { $('#res').innerHTML = ''; return; }
          const now = deriveRegime(w);
          $('#res').innerHTML = `<div class="result-head">The readings expect a different regime</div>
            ${versusHTML(now.type, out.pred.type, { aLabel: 'What you built', bLabel: 'What if' })}
            <div class="result-head">How it would have gone</div>${howHTML(out.w, out.regime)}
            ${out.newRoute ? `<p class="small">The road changes too: ${esc(lc(ROUTES[out.newRoute].label))}.</p>` : ''}`;
        };
        draw();
        bindText($('#fl'), d, 'failed');
        const check = () => { btn.disabled = !qd(); };
        const btn = footButton(foot, 'Done', () => submit('whatif', d));
        check();
      },
      after: (main, foot, t) => {
        const w = t.w2, cf = w.cf;
        if (!cf) return none(main);
        const F = flipInfo(w, cf.flip);
        main.innerHTML = `<h2>What if?</h2>
          ${F ? `<div class="card"><p style="font-weight:600;font-size:18px;margin:0">${esc(F.describe)}</p></div>` : ''}
          ${cf.out ? `${versusHTML(w.regime?.type || deriveRegime(w).type, cf.out.pred.type, { aLabel: 'What you built', bLabel: 'What if' })}
            <div class="result-head">How it would have gone</div>${howHTML(cf.out.w, cf.out.regime)}` : ''}
          ${cf.failed ? `<div class="quote" style="margin-top:12px">${esc(cf.failed)}</div>` : ''}${think('whatif')}`;
        changeAnswer(foot);
      },
    },

    dossier: {
      form: (main, foot, t) => {
        const d = (draft.dossier ||= { factor: null, text: '', puzzle: null, puzzleText: '' });
        const withPuzzle = quizzesOn(getState());
        main.innerHTML = `${dossierHTML(t)}
          <div class="row" style="margin-top:12px"><button class="btn" id="c-print">Print or save PDF</button></div>
          <div class="card" style="margin-top:16px"><h3 style="margin:0 0 6px">${esc(DOSSIER_Q.q)}</h3><p class="small muted">${esc(DOSSIER_Q.hint)}</p>
            <div class="options two" id="f"></div>
            <label class="field" style="margin-top:12px"><span>${esc(DOSSIER_Q.sentenceQ)}</span><textarea id="ft" maxlength="280" placeholder="${esc(DOSSIER_Q.starter)}"></textarea></label></div>
          ${withPuzzle ? `<div class="card" style="margin-top:14px"><h3 style="margin:0 0 6px">Solve one puzzle</h3><p class="small muted">Each has an answer in the readings.</p><div class="options" id="pz"></div><div id="ph"></div>
            <label class="field" style="margin-top:12px"><span>Your answer, in one or two sentences</span><textarea id="pt" maxlength="320" placeholder="Because …, as … argue(s) on p. …"></textarea></label></div>` : ''}
          ${researchHTML(t, 2)}`;
        optionCards($('#f'), DOSSIER_Q.options.map((o) => ({ value: o.value, title: o.label })), d.factor, (v) => { d.factor = v; check(); });
        bindText($('#ft'), d, 'text');
        if (withPuzzle) {
          optionCards($('#pz'), PUZZLES.week2.map((p) => ({ value: p.value, title: p.label, detail: esc(p.q) })), d.puzzle, (v) => { d.puzzle = v; hint(); check(); });
          const hint = () => { const P = PUZZLES.week2.find((p) => p.value === d.puzzle); $('#ph').innerHTML = P ? `<p class="small" style="margin-top:10px"><b>A clue.</b> ${esc(P.hint)} ${citeHTML(P.cite)} ${citeHTML(P.cite2)}</p>` : ''; };
          hint();
          bindText($('#pt'), d, 'puzzleText');
        }
        $('#c-print').onclick = () => window.print();
        const check = () => { btn.disabled = !(d.factor && (!withPuzzle || (d.puzzle && d.puzzleText.trim().length >= 12))); };
        d._check = check;
        const btn = footButton(foot, 'Seal the dossier', () => submit('dossier', d));
        check();
      },
      after: (main, foot, t) => {
        const w = t.w2, D = w.dossier;
        const P = PUZZLES.week2.find((p) => p.value === D?.puzzle);
        const revealed = getState().phase === 'reveal';
        main.innerHTML = `${dossierHTML(t)}
          <div class="row" style="margin-top:12px"><button class="btn" id="c-print">Print or save PDF</button></div>
          ${P && D.puzzleText ? `<div class="card" style="margin-top:14px"><div class="caps muted">Your puzzle: ${esc(P.label)}</div><p class="small" style="font-weight:600">${esc(P.q)}</p><div class="quote">${esc(D.puzzleText)}</div>
            ${revealed ? `<p class="small" style="margin-top:10px"><b>What the readings suggest.</b> ${esc(P.answer)} ${citeHTML(P.cite)} ${citeHTML(P.cite2)}</p>` : ''}</div>` : ''}
          ${revealed ? '<p class="small muted" style="margin-top:14px">Next: the map of Meridia after the seizures.</p>' : ''}`;
        $('#c-print').onclick = () => window.print();
      },
    },

    meridia: {
      form: (main, foot, t) => STEPS_MERIDIA(main, t),
      reveal: (main, foot, t) => STEPS_MERIDIA(main, t),
    },
  };
}
