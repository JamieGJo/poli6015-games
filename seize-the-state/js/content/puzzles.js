// Puzzles: questions about regime types and their mechanisms that have a real answer
// in the readings, in place of open-ended discussion. Each team picks one at the end of
// the week and answers it in a sentence or two. Each comes with a real regime to research.
// Cases and pages checked against the readings on 2026-11-19 (see BUILD-STATUS.md).
// DRAFT: wording awaits Jamie's approval.

const G = (page) => ({ src: 'gwf2018', page });
const GE = (page) => ({ src: 'geddes1999', page });
const W = (page) => ({ src: 'wintrobe1998', page });
const EF = (page) => ({ src: 'ef2011', page });
const BDM = (page) => ({ src: 'bdm2011ch2', page });
const SV = (page) => ({ src: 'svolik2012', page });
const LW = (page) => ({ src: 'levitskyway2013', page });

// A real regime resembling each type, to research: "where did it come from?"
export const RESEMBLES = {
  military: { name: 'Argentina’s junta, 1976–83', text: 'Senior officers never completely lost the power to choose the president, despite intense factional struggle.', cite: GE('124') },
  party: { name: 'Mexico’s revolutionary regime (later the PRI)', text: 'Born of a revolution, it lasted 83 years by Levitsky and Way’s count.', cite: LW('6') },
  personalist: { name: 'Zaire under Mobutu', text: 'Officials feared him so much that they reported calm while prisoners escaped.', cite: W('24') },
  monarchy: { name: 'Iran under Reza Shah', text: 'A strongman with no royal blood, backed by Britain, who founded a dynasty in 1925.', cite: EF('19–20') },
  amalgam: { name: 'Chile under Pinochet', text: 'The armed forces picked him as a safe choice, but he came to control careers himself. Geddes puts the regime in an intermediate category between military and personal rule.', cite: GE('123–24') },
  electoral: { name: 'Venezuela under Chávez', text: 'An elected government turned the political system authoritarian step by step.', cite: G('29') },
};

// A real seizure resembling each road, for Week 2.
export const ROAD_CASES = {
  coup: { name: 'Liberia, 1980', text: 'Master Sergeant Samuel Doe and sixteen other non-commissioned officers climbed the fence of the Executive Mansion and killed President Tolbert.', cite: BDM('1'), cite2: G('36') },
  foreign: { name: 'Eastern Europe after 1945', text: 'Soviet occupation forces installed communist party regimes in Poland, Hungary, East Germany and elsewhere.', cite: G('28'), cite2: EF('13') },
  authoritarianization: { name: 'Peru, 1992', text: 'President Fujimori closed Congress and dismissed the judges: an “autogolpe”, or self-coup.', cite: G('29, 31') },
  insurgency: { name: 'Nicaragua, 1979', text: 'The Sandinistas’ insurgency defeated the Somoza family dictatorship.', cite: G('29') },
  uprising: { name: 'Haiti, 1986', text: 'An uprising drove out the Duvaliers. A transitional council was meant to hold elections, but its officers blocked democratisation.', cite: G('29') },
  eliteRuleChange: { name: 'Guatemala, 1985', text: 'Military rule became indirect military rule behind exclusionary elections; the elected president held “no more than 30 percent of power”.', cite: G('29') },
};
export const INSIDER_CASE = { name: 'The Soviet Union, 1964', text: 'Presidium members moved against Khrushchev after his behaviour became increasingly unilateral, and the Central Committee confirmed his removal.', cite: SV('90, 98') };

export const PUZZLES = {
  week1: [
    {
      value: 'junta',
      label: 'The junta paradox',
      q: 'Coups start more dictatorships than any other road, yet military regimes are the shortest-lived type. How can both be true?',
      hint: 'Think about what officers care about most, and what happens to them if they hand power back.',
      cite: G('28'), cite2: GE('131'),
      answer: 'Officers care most about the unity of the army. When a junta splits, most prefer to return to the barracks, and for officers there is life after democracy.',
    },
    {
      value: 'loyal',
      label: 'The loyal essentials',
      q: 'Selectorate theory says a small winning coalition makes supporters more loyal, not less. Why would that be?',
      hint: 'Compare the rewards an essential supporter gets now with their chances of being in the next leader’s coalition.',
      cite: { src: 'bdm2011', page: '17' }, cite2: { src: 'lecture1', slide: '75–77' },
      answer: 'A small coalition shares private rewards among few people, so each gets a lot. With many possible replacements in the selectorate, each also knows they could easily be swapped out and lose everything, so they stay loyal.',
    },
    {
      value: 'calm',
      label: 'The calm report',
      q: 'Every province reports calm. Under which regime type would you trust that report least, and why?',
      hint: 'Who fears the ruler most, and who has a second channel of information?',
      cite: W('22, 24'), cite2: W('39'),
      answer: 'Probably personal rule: officials fear a ruler who can dismiss them at will, there is no party to report separately, and no regular way to remove the ruler.',
    },
    {
      value: 'label',
      label: 'The misleading label',
      q: 'A regime calls itself a people’s republic led by a party, yet Geddes calls it personal rule. What would you need to find out to settle it?',
      hint: 'Geddes classifies by who controls access to power, not by names. Perón is her example.',
      cite: GE('121'), cite2: GE('124'),
      answer: 'Who really picks the leader and hands out the top jobs: the party’s own bodies, or the leader alone.',
    },
  ],
  week2: [
    {
      value: 'loose',
      label: 'The strong leader of a weak coalition',
      q: 'A loose coalition is the weakest kind of group to seize power, yet it tends to produce the strongest single leader. Why?',
      hint: 'Who could stop the leader taking more power once it is won?',
      cite: EF('7'), cite2: G('41–42'),
      answer: 'Nobody in a loose coalition has the unity or the arms to restrain the leader, and bargaining power shifts to the leader after the seizure.',
    },
    {
      value: 'revolution',
      label: 'Born in chaos, built to last',
      q: 'Revolutionary regimes are born in war and chaos, yet they are the most durable dictatorships. Why?',
      hint: 'What does a long war destroy, and what does it build?',
      cite: LW('6–7'), cite2: G('40'),
      answer: 'War destroys rival power centres, builds a cohesive party that controls the army, and creates a powerful coercive apparatus.',
    },
    {
      value: 'purge',
      label: 'The winning purge?',
      q: 'Purging co-plotters makes a leader safer from them, yet personal regimes rarely outlive their founders. Is purging a winning strategy?',
      hint: 'Safer for whom, and for how long?',
      cite: BDM('2'), cite2: GE('132'),
      answer: 'It wins for the leader in the short run but removes the able rivals and the institutions that could carry the regime on after the leader.',
    },
    {
      value: 'colonial',
      label: 'No coup against an empire',
      q: 'No colonial power has ever been ousted by a coup. Why not, and what does that tell you about what a coup needs?',
      hint: 'Whose army is it?',
      cite: G('32'), cite2: SV('74'),
      answer: 'A coup is made from inside the regime by people who already hold its weapons or offices; a colonial army answers to the empire, not to local plotters.',
    },
  ],
};

// "Research a regime like yours": a real case for the team's type (Week 1) or road (Week 2).
export function researchFor(team, week) {
  if (week === 2) {
    const w = team?.w2 || {};
    if (w.group === 'insiders' && w.route === 'coup') return INSIDER_CASE;
    return ROAD_CASES[w.route] || null;
  }
  const cls = team?.rulers?.classified;
  if (!cls) return null;
  if (cls.elections === 'rigged' || cls.elections === 'competitive') return RESEMBLES.electoral;
  return RESEMBLES[cls.type] || null;
}

// "What does this mean?" prompts for the main screen's reveals. One per step,
// framed as a puzzle with an answer in the readings. Off with "Quizzes and prompts".
export const MEANING = {
  oldorder: { q: 'Most new dictatorships replaced another dictatorship or foreign rule, not a democracy. What does that suggest about where dictatorships come from, and about the Chile-style coup we tend to imagine?', cite: G('25–26') },
  rulers: { q: 'Where a state’s label and Geddes’s test disagree, which will matter more for how it behaves when it is in trouble: the label, or who controls access to power?', cite: GE('121, 124') },
  selectorate: { q: 'Which ruler here is safest, and which state will be governed best? If they are the same state, selectorate theory has a problem. Are they?', cite: { src: 'bdm2011', page: '17' } },
  dilemma: { q: 'Compare the state that repressed hardest with the one that repressed least: which knew more about its own provinces? Is that a law, or could a ruler buy loyalty and information as well?', cite: W('22, 38') },
  crisis: { q: 'Each crisis cut the money or the trust that held the old coalition together. Which would the old rulers find hardest to survive?', cite: G('30') },
  seizure: { q: 'Officers led half of all seizures. What do they have that a party or a crowd does not?', cite: G('31, 33') },
  organisation: { q: 'Which of these seizure groups could stop its own leader taking all the power a year from now?', cite: EF('7') },
  route: { q: 'Which states would the readings expect to end up as personal rule, and which road made that likelier?', cite: G('38–42') },
  morning: { q: 'Look at who purged and who shared. Which leaders have just made themselves safer this year, and less safe in ten?', cite: GE('132') },
  become: { q: 'Where your regime changed from last week, was it the group, the road or the morning after that did it?', cite: G('42') },
  whatif: { q: 'Which single change would have turned the most regimes into personal rule?', cite: EF('7') },
  meridia: { q: 'Using Geddes’s average lifespans for each type, which state on this map would you bet on to last longest, and which to fall first? What on the map, beyond the regime type, changes your bet?', cite: GE('133') },
};
