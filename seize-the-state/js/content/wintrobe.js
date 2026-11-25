// Optional extra for Week 1: "The dictator's dilemma", a full examination of Wintrobe (1998), ch. 2.
// Switched on from the main-screen menu (or the solo start page). Page numbers are the
// printed pages of Readings/week-01/dictators_dilemma.pdf (pp. 20–39), checked 2026-11-19.
// Meter values are game judgements; every reason is cited.
// DRAFT: student-facing wording awaits Jamie's approval.
import { DECREE } from './week1.js';

const W = (page) => ({ src: 'wintrobe1998', page });

export const DILEMMA = {
  intro: 'Your state is new and you have enormous power over its people. There is one thing that power cannot give you: their minds. Do they support you, or only say they do?',
  introCite: W('20'),

  // Part 1: the applause
  nero: {
    head: 'The emperor’s applause',
    text: 'Whenever the emperor Nero sang, his audiences applauded wildly. Nobody was allowed to leave while he performed: some men pretended to be dead so that they could be carried out.',
    cite: W('20–21'),
  },

  // Part 2: the levers. Repression and loyalty reuse the Week 1 decree.
  repression: DECREE.repression,
  loyalty: DECREE.loyalty,
  loyaltyWhy: { text: 'Wintrobe makes this point about democratic politicians, then adds that dictators do it even more: a useful project buys no loyalty, because any competent government would build it. The waste is the signal that you went out of your way for them, so it is the waste that earns their support.', cite: W('31'), cite2: W('36') },
  watch: [
    { value: 'one', label: 'One security service', detail: 'Cheaper and simpler. But who watches the watchers?', cost: 0, cite: W('34') },
    { value: 'rival', label: 'Rival agencies', detail: 'Two services that watch each other and report separately, as Stalin kept the secret police and military intelligence in competition.', cost: 2, cite: W('34–35') },
    { value: 'rotate', label: 'Rotate the security chiefs', detail: 'Replace the head of the secret police every few years, before they grow too strong. Stalin had two in a row liquidated, which kept the apparatus afraid.', cost: 1, cite: W('34–35'), cite2: W('38') },
  ],
  insure: [
    { value: 'none', label: 'Nothing', detail: 'All your power, all your risk.', cite: W('38') },
    { value: 'exit', label: 'A Swiss bank account and a plane on the runway', detail: 'If it all goes wrong, you get out rich. You are safer, but not more powerful.', cost: 1, cite: W('38') },
    { value: 'limits', label: 'Accept some limits on your own power', detail: 'A court you cannot overrule, a council that must approve taxes. People have less to fear from you, so you have less to fear from them.', cost: 0, cite: W('38') },
  ],

  // Part 3: the dispatches (from the Week 1 decree model)
  dispatchIntro: 'This is what your officials tell the palace. You can send one inspector, who reports only to you, to one province.',

  // Part 4: the lessons
  lessons: [
    { head: 'The paradox', text: 'The more the subjects fear the ruler, the less the ruler knows what they really think, and so the more reason the ruler has to be afraid.', cite: W('22') },
    { head: 'It runs both ways', text: 'It is also the subjects’ dilemma. They want the ruler to believe they are loyal, because only then are they safe from the ruler.', cite: W('22') },
    { head: '“Situation is calm”', text: 'Mobutu’s officials feared bringing bad news. One report noted that 24 of 36 prisoners had escaped, and added: “Situation is calm.”', cite: W('24') },
    { head: 'Two instruments', text: 'Every strategy a dictator has falls into two kinds: repression, and building loyalty, for example with rents such as patronage jobs and wasteful projects.', cite: W('31–33, 36–37') },
    { head: 'Who watches the watchers?', text: 'Heavy repression needs a powerful security force, and its own uncertain loyalty may become the main threat. Overpay it, keep it afraid, or make agencies compete.', cite: W('34–35') },
    { head: 'Not a law of nature', text: 'The paradox comes from thinking of power only as commands backed by punishment. Loyalty (Augustus), surveillance (Mobutu) and competition between agencies (Stalin) can raise power and security together.', cite: W('38') },
    { head: 'Power for security', text: 'Rulers can also trade power for security: the Swiss bank account, the fuelled plane, a praetorian guard, rotating officers, or accepting real limits on their power.', cite: W('38') },
    { head: 'Why dictators are paranoid', text: 'Behind it all: there is no legitimate, regular way to remove a dictator, so on perfectly rational grounds the dictator’s characteristic trait is paranoia.', cite: W('39') },
  ],

  // Questions inside the extra (off when quizzes are off)
  quiz: [
    {
      id: 'dl-nero', part: 'nero',
      q: 'Nero’s audiences always applauded. What could Nero conclude about what they thought of his singing?',
      options: ['That they loved it', 'Nothing: he could not tell real applause from applause he had commanded', 'That they hated it'],
      answer: 1,
      explain: 'This is the root of the dilemma. Force, threats and money cannot tell a dictator whether the people worship him, or only worship him because he commands it.',
      cite: W('20'),
    },
    {
      id: 'dl-waste', part: 'levers',
      q: 'Why might a wasteful stadium buy more loyalty than a useful bridge?',
      options: ['Stadiums are more popular than bridges', 'The waste shows that the ruler went out of their way for that group, so the group has a reason to expect more in return for its support', 'It does not: useful projects always buy more loyalty'],
      answer: 1,
      explain: 'Wintrobe treats patronage and pork-barrel projects like a wage premium: the waste is the sign that someone can claim the credit, and the rents can be withdrawn if support stops. He makes the argument about democratic politicians and says dictatorships go further still.',
      cite: W('31–32'), cite2: W('36'),
    },
    {
      id: 'dl-artefact', part: 'reveal',
      q: 'Wintrobe says the paradox (more power, less security) is “an artifact” of one way of thinking. Which?',
      options: ['Thinking of power only as commands backed by punishment', 'Thinking that dictators are rational', 'Thinking that people tell the truth in surveys'],
      answer: 0,
      explain: 'In the command model, the only tool is threat. Add loyalty, surveillance and competition between agencies, and a ruler can become both more powerful and more secure.',
      cite: W('38'),
    },
  ],

  // Trinh (2019): misreporting by lower levels in a one-party state. Filled after checking the paper.
  trinh: null,
};
