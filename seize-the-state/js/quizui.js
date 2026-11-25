// Quiz cards with immediate feedback (team screens) and the class tally (main screen).
import { esc, citeHTML, accent } from './ui.js';
import { teamList, stepQuestions } from './engine.js';

function card(q, a) {
  const answered = Number.isInteger(a);
  const opts = q.options.map((o, j) => {
    const cls = answered ? (j === q.answer ? 'right' : j === a ? 'wrong' : '') : '';
    return answered
      ? `<div class="opt ${cls}"><span class="opt-title">${esc(o)}</span></div>`
      : `<button type="button" class="opt" data-q="${esc(q.id)}" data-a="${j}"><span class="opt-title">${esc(o)}</span></button>`;
  }).join('');
  const fb = answered
    ? `<p class="small" style="margin:8px 0 0">${a === q.answer ? '<b style="color:var(--ok)">Right.</b>' : '<b style="color:var(--warn)">Not quite.</b>'} ${esc(q.explain)} ${citeHTML(q.cite)}${q.cite2 ? ' ' + citeHTML(q.cite2) : ''}</p>${q.more ? `<p class="tiny muted" style="margin:6px 0 0">${esc(q.more)}</p>` : ''}`
    : '';
  return `<div class="card quiz" style="margin-top:12px"><div class="caps muted">Test yourselves</div><p style="font-weight:600;margin:4px 0 8px">${esc(q.q)}</p><div class="options">${opts}</div>${fb}</div>`;
}

// Draw the questions into a container; onAnswer(qid, index) is called on the first tap.
export function drawQuiz(container, qs, answers, onAnswer) {
  if (!container) return;
  container.innerHTML = qs.map((q) => card(q, answers[q.id])).join('');
  container.onclick = (e) => {
    const b = e.target.closest('[data-q]');
    if (!b) return;
    const qid = b.dataset.q, a = +b.dataset.a;
    if (Number.isInteger(answers[qid])) return;
    answers[qid] = a;
    onAnswer(qid, a);
    drawQuiz(container, qs, answers, onAnswer);
  };
}
export const allAnswered = (qs, answers) => qs.every((q) => Number.isInteger(answers[q.id]));

// Main screen: how each state did on this step's questions.
export function quizTally(state, stepId) {
  const ts = teamList(state);
  const rows = ts.map((t) => {
    const qs = stepQuestions(stepId, t).filter((q) => t.quiz && t.quiz[q.id] !== undefined);
    if (!qs.length) return '';
    const right = qs.filter((q) => t.quiz[q.id] === q.answer).length;
    return `<span class="chip"><span class="dot" style="background:${accent(t.slot)}"></span>${esc(t.country?.name || t.name)}: ${right} of ${qs.length} right</span>`;
  }).filter(Boolean);
  return rows.length ? `<div class="row wrap" style="gap:6px;margin-top:10px"><span class="caps muted" style="align-self:center">Quiz</span>${rows.join('')}</div>` : '';
}
