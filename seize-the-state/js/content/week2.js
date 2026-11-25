// Week 2: Origins. Rebuild the regime step by step from the seizure of power.
// The country (land, peoples, wealth) and the old order come from Week 1. The Week 1
// regime type stays sealed until the "become" step, where the two are compared.
// Sources: Geddes, Wright & Frantz (2018) ch. 2 (printed pp. 25–43);
// Lindstaedt (Ezrow) & Frantz (2011) ch. 2 (ebook printout: PDF pages 1–27);
// Bueno de Mesquita & Smith (2011) ch. 2 (scan: PDF pages 1–34);
// Svolik (2012) chs 3–4; Levitsky & Way (2013).
// Weights, meter values and effects are game judgements, not findings.
// DRAFT: student-facing wording awaits Jamie's approval.

import { rngFrom } from '../rng.js';

export const WEEK2 = {
  id: 2,
  title: 'Origins',
  subtitle: 'How did your regime come to be? Rebuild it step by step, then compare it with last week’s.',
  readings: ['gwf2018', 'ef2011', 'bdm2011ch2', 'svolik2012', 'levitskyway2013'],
  // About 46 minutes.
  steps: [
    { id: 'rejoin', title: 'Rejoin your state', short: 'Rejoin', minutes: 2 },
    { id: 'crisis', title: 'The crisis', short: 'Crisis', minutes: 3 },
    { id: 'seizure', title: 'Who moves first?', short: 'Who', minutes: 6 },
    { id: 'organisation', title: 'How united are they?', short: 'United?', minutes: 4 },
    { id: 'route', title: 'The road to power', short: 'Road', minutes: 8 },
    { id: 'morning', title: 'The morning after', short: 'Morning', minutes: 7 },
    { id: 'become', title: 'What has it become?', short: 'Became', minutes: 5 },
    { id: 'whatif', title: 'What if?', short: 'What if', minutes: 4 },
    { id: 'dossier', title: 'The Origin Dossier', short: 'Dossier', minutes: 4 },
    { id: 'meridia', title: 'Meridia after the seizures', short: 'Map', minutes: 3 },
  ],
};

export const G = (page) => ({ src: 'gwf2018', page });
export const EF = (page) => ({ src: 'ef2011', page });
export const BDM = (page) => ({ src: 'bdm2011ch2', page });
export const SV = (page) => ({ src: 'svolik2012', page });
export const LW = (page) => ({ src: 'levitskyway2013', page });

// ---------- The old order (chosen in Week 1, "What came before?") ----------

export const OLD_ORDER_INTRO = 'No dictatorship starts from nothing. Every seizure of power ends something: an elected government, an earlier dictator, a king, an empire. What did your new rulers replace? Next week you work out how they got from there to here.';

// weight: share of post-1946 dictatorships (GWF pp. 25–26). The split of the 42%
// that ousted another autocracy into "an earlier dictator" and "an old monarchy" is
// a game judgement.
export const OLD_ORDERS = {
  democracy: {
    label: 'An elected government',
    text: 'A democracy, with an elected president or parliament. Less than a third of dictatorships since 1946 replaced one.',
    weight: 30, cite: G('25'),
  },
  dictator: {
    label: 'An earlier dictator',
    text: 'Another dictatorship, ruled by a different group. This is the most common start: dictators are most often replaced by other dictators.',
    weight: 32, cite: G('26'),
  },
  monarchy: {
    label: 'An old monarchy',
    text: 'A king or shah and the court, overthrown as the Shah of Iran was in 1979.',
    weight: 10, cite: G('26'),
  },
  colonial: {
    label: 'A colonial power',
    text: 'Foreign rulers. A quarter of dictatorships began when foreign rulers were ousted or handed over power, mostly at independence.',
    weight: 26, cite: G('26'),
  },
  warlords: {
    label: 'Rival warlords',
    text: 'No state worth the name: armed bosses carved up the country. Only a few dictatorships began this way.',
    weight: 2, cite: G('26'),
  },
};

// ---------- Step: the crisis (dealt to fit the old order) ----------

export const CRISES = {
  slump: {
    label: 'Economic collapse',
    text: 'Prices are soaring and jobs are vanishing. Ousters usually come when things are going badly, and a broke ruler cannot pay the people who keep them in power.',
    cite: G('30'), cite2: BDM('19'), fits: ['democracy', 'dictator', 'monarchy'],
  },
  disorder: {
    label: 'Disorder and violence',
    text: 'Riots, crime and armed gangs. People no longer feel safe, and many would welcome anyone who promises order.',
    cite: G('30'), fits: ['democracy', 'dictator', 'monarchy', 'warlords'],
  },
  scandal: {
    label: 'Scandal and brutality',
    text: 'A scandal or an act of arbitrary brutality has discredited the rulers.',
    cite: G('30'), fits: ['democracy', 'dictator', 'monarchy'],
  },
  dying: {
    label: 'The ruler is dying',
    text: 'The old ruler is gravely ill, and the court is trying to hide it. A dying ruler cannot promise anyone a future, so supporters start looking elsewhere.',
    cite: BDM('7'), fits: ['dictator', 'monarchy'],
  },
  aidcut: {
    label: 'The patron cuts aid',
    text: 'A foreign patron has cut its aid. The money that paid the soldiers and officials is drying up.',
    cite: BDM('3'), cite2: BDM('33'), fits: ['dictator', 'monarchy', 'democracy'],
  },
  withdrawal: {
    label: 'The empire is leaving',
    text: 'The colonial power has announced it will go. Who inherits the state is suddenly up for grabs, and the departing rulers have favourites.',
    cite: G('28'), fits: ['colonial'],
  },
};

export const crisesFor = (order) => Object.keys(CRISES).filter((k) => CRISES[k].fits.includes(order));
// Deal a crisis to each team from its own old order, seeded by the room so it can be replayed.
export function dealCrisis(room, teamId, order) {
  const fit = crisesFor(order || 'dictator');
  const rng = rngFrom(`${room}:${teamId}:crisis`);
  return fit[Math.floor(rng() * fit.length)];
}
export function nextCrisis(order, crisis) {
  const fit = crisesFor(order || 'dictator');
  return fit[(fit.indexOf(crisis) + 1) % fit.length];
}
// A fallback deal for a team that skipped "What came before?" in Week 1.
export function dealOldOrder(room, teamId) {
  const rng = rngFrom(`${room}:${teamId}:oldorder`);
  const keys = Object.keys(OLD_ORDERS);
  const total = keys.reduce((s, k) => s + OLD_ORDERS[k].weight, 0);
  let r = rng() * total;
  for (const k of keys) { r -= OLD_ORDERS[k].weight; if (r <= 0) return k; }
  return keys[0];
}

// The promise in the first broadcast (GWF pp. 34–35).
export const PROMISE = {
  q: 'Seizure groups need some support from ordinary people. What will yours promise them?',
  hint: 'Groups do best when their goals are attractive and easy to grasp, and when they strike as disgust with the old rulers spreads.',
  cite: G('34–35'),
  options: [
    { value: 'order', label: 'Order and safety' },
    { value: 'prosperity', label: 'Jobs and prosperity' },
    { value: 'corruption', label: 'An end to corruption' },
    { value: 'nation', label: 'Independence and national pride' },
    { value: 'justice', label: 'Justice for our people' },
    { value: 'faith', label: 'A return to faith and tradition' },
  ],
};

// ---------- Step: who moves first? ----------

// GWF Table 2.2 (p. 31): leadership of the seizure group, % of all seizures.
// "Both" is counted in "Military" and "Party-based" too, so the shares sum to more than 100.
export const SEIZURE_GROUPS = {
  officers: { label: 'Army officers', text: 'Serving officers who command troops. They can order soldiers to act, and few of those soldiers need to know why.', cite: G('32'), share: 50, shareLabel: 'Military' },
  insiders: { label: 'Insiders of the old regime', text: 'Ministers, party barons, courtiers or security chiefs around the old ruler. They are already inside the state. Under an elected government, the insiders are the elected incumbents themselves.', cite: SV('74'), share: null, shareLabel: 'Not counted separately' },
  party: { label: 'A political party', text: 'A party with members, rules and leaders, existing before the seizure. It has to persuade people to march, strike or fight, because it cannot order them to.', cite: G('37'), share: 40, shareLabel: 'Party-based' },
  both: { label: 'Officers allied with a party', text: 'A party with sympathisers in the army. The officers strike, and the party hopes to outmanoeuvre them afterwards.', cite: G('32'), share: 8, shareLabel: 'Both' },
  movement: { label: 'A leader and a movement, no party', text: 'A popular leader or rebel commander with followers but no party organisation behind them.', cite: G('30'), share: 18, shareLabel: 'Neither (also covers monarchs installed by departing foreign rulers)' },
  royal: { label: 'A royal house, backed by foreigners', text: 'A royal family placed or kept on the throne by a foreign power. Foreigners handed control to nearly all the monarchies that have ruled since 1946.', cite: G('38'), share: null, shareLabel: 'Part of “Neither”' },
};
export const SEIZURE_TABLE_CITE = G('31');

// ---------- Step: how united are they? ----------

export const ORGANISATION = {
  disciplined: {
    label: 'Disciplined and united',
    text: 'One chain of command. Members follow the leadership’s decisions, and the organisation has its own rules for choosing and removing its leaders.',
    example: 'A professional army that acts on its commanders’ orders, or a party with a central committee that can sack its own chairman.',
    meaning: 'After the seizure, the organisation is usually better able to stand up to its own leader.',
    cite: EF('7'), cite2: G('41–42'),
  },
  factions: {
    label: 'Split into factions',
    text: 'Rival wings, each loyal to its own commander or boss. They joined forces to seize power, but each wants its share of it.',
    example: 'An army whose regional commanders each control their own units, or a party split between a radical and a moderate wing.',
    meaning: 'Every faction expects a seat at the table, so the new ruler has to share power widely, at least at first.',
    cite: G('39–40'),
  },
  loose: {
    label: 'A loose coalition',
    text: 'Groups that agreed on one thing only: getting rid of the old ruler. They have no shared rules for choosing a leader, no common chain of command and no plan for what comes next.',
    example: 'Students, a few colonels, a trade union and an exiled politician who met for the first time in the month before the seizure.',
    meaning: 'Nobody inside the coalition has the unity or the organisation to stop the new leader taking more and more power.',
    cite: EF('7'), cite2: G('41–42'),
  },
};
export const ORGANISATION_CITE = EF('7');
export const ORGANISATION_READING = {
  text: 'Geddes’s argument, as Ezrow and Frantz summarise it: the better organised the military or party is before it seizes power, the more its members can resist the leader’s attempts to take all the power. A professional army tends to produce military rule, a professional party single-party rule, and a weakly organised group personal rule.',
  cite: EF('7'),
  caveat: 'Ezrow and Frantz add that few systematic tests of this argument have been carried out.',
};

// ---------- Step: the road to power ----------

// Which roads are open to which group, given the old order and how united the group is
// (GWF pp. 25–33, 40; Svolik p. 74). Returns { ok, rare, reason, cite, cite2 }.
export function routeCheck(route, group, order, org = null) {
  const R = {
    coup: () => {
      if (order === 'colonial') return no('No foreign occupier or colonial power has ever been ousted by a coup.', G('32'));
      if (order === 'warlords') return no('A coup removes a government from inside. Rival warlords are not a government with an inner circle to turn on its leader.', G('27'));
      if (group === 'officers' || group === 'both') return yes('Officers command men and weapons, which makes a coup the easiest and cheapest road for them.', G('33'));
      if (group === 'insiders') {
        if (order === 'democracy') return no('Elected incumbents who take full power are not staging a coup: Geddes, Wright and Frantz call that a “self-coup”, and count it as authoritarianization.', G('25'));
        return yes('Svolik counts the removal of a leader by the inner circle as a coup, whoever does it. Geddes, Wright and Frantz count only ousters by the military as coups, so they would not record yours as one.', SV('74'), false, G('27'));
      }
      return no('A coup is carried out from inside the regime: by officers, or by the leader’s own inner circle. Your group is outside it.', SV('74'), G('27'));
    },
    authoritarianization: () => {
      if (order !== 'democracy' && order !== 'colonial') return no('Only a group that already controls an elected government can authoritarianize. Your old order held no free elections.', G('33'));
      if (group === 'officers' || group === 'royal' || group === 'both') return no('Authoritarianization is carried out by elected incumbents, usually a president backed by a ruling party.', G('29'));
      if (group === 'movement') return yes('Possible: a popular leader who won office without a strong party can still change the rules once elected.', G('30'), true);
      return yes(order === 'colonial' ? 'Possible: some authoritarianizations happened in the run-up to independence, when the departing power favoured the group that won.' : 'The incumbents already control the courts and the law, so they can start a dictatorship with legal changes such as banning the opposition.', G('27, 33'));
    },
    insurgency: () => {
      if (group === 'royal') return no('A royal house placed by foreigners does not fight its way in.', G('38'));
      if (group === 'insiders') return no('Insurgents are outsiders who defeat the government’s forces in war. Your group is already inside the state.', G('27'));
      if (org === 'loose') return no('Insurgencies last about a decade, and successful insurgent groups develop strong discipline. A loose coalition, united only against the old ruler, would fall apart long before victory.', G('40'), G('33'));
      if (order === 'democracy') return yes('Possible but rare: insurgency rarely succeeds against a democracy.', G('27'), true);
      return yes('Costly: insurgencies last about a decade and win outright only about a third of the time. It is used when nothing else is available.', G('33'));
    },
    uprising: () => {
      if (order === 'warlords') return no('An uprising persuades an incumbent government to hand over power. Rival warlords are not a government to persuade.', G('27'));
      if (group === 'royal') return no('Crowds demand a new government, not a foreign-backed throne.', G('27'));
      if (group === 'insiders') return no('Uprisings push the old rulers to hand power to the opposition or to seemingly neutral figures such as officers, not to the old rulers’ own insiders.', G('27'));
      return yes('The crowds usually demand democracy. A dictatorship begins when the interim leader breaks the promise to hold free elections.', G('27, 29, 33'));
    },
    foreign: () => yes(order === 'colonial' ? 'A common way out of colonial rule: the departing power hands over to a group it prefers.' : 'Possible, but you need a foreign power willing to install you: occupiers have imposed regimes on democracies and dictatorships alike.', G('28')),
    eliteRuleChange: () => {
      if (order !== 'dictator' && order !== 'monarchy') return no('Only the elite of an existing dictatorship can change the rules from inside.', G('27'));
      if (group !== 'officers' && group !== 'insiders' && group !== 'both') return no('An elite rule change is made by insiders of the old regime, most often officers. Your group is not one of them.', G('27'), G('30'));
      return yes('Insiders change who is allowed into the inner circle. Officers carry out more than half of these.', G('30'));
    },
  };
  return (R[route] || (() => no('Unknown route', G('27'))))();
}
const yes = (reason = '', cite = null, rare = false, cite2 = null) => ({ ok: true, rare, reason, cite, cite2 });
const no = (reason, cite, cite2 = null) => ({ ok: false, rare: false, reason, cite, cite2 });

// What tends to follow each road (filled with the readings' claims).
export const ROUTE_FOLLOWS = {
  coup: { text: 'When officers strike, they take the top offices, whatever their civilian allies hoped. Many such regimes do not stay military for long: one officer often consolidates power and rules personally, as Amin and Bokassa did.', cite: G('38'), cite2: { src: 'geddes1999', page: '124' } },
  foreign: { text: 'The regime depends on its patron. Half of the dictatorships imposed by foreign powers are led by dominant parties, and foreigners handed power to nearly all the monarchies since 1946.', cite: G('30'), cite2: G('38') },
  authoritarianization: { text: 'Civilian rule, with power centred on the incumbent. The bureaucrats, many of whom the incumbent appointed, stay loyal. Where the ruling party is loosely organised, the leader gets a free hand but only shallow links to ordinary citizens.', cite: G('38'), cite2: G('41–42') },
  insurgency: { text: 'The winners replace the old army and security services with their own. War builds a cohesive party that controls its soldiers, which is why revolutionary regimes almost never fall to coups and last unusually long.', cite: G('40'), cite2: LW('6, 8, 10') },
  uprising: { text: 'Power goes to a loosely organised civilian leadership or a seemingly neutral figure. Of uprisings that end in dictatorship, almost a third hand power to officers.', cite: G('27'), cite2: G('30, 41') },
  eliteRuleChange: { text: 'The same state machine carries on, and the incumbent stays in the inner circle, but a different group now controls who rules and what policy is made.', cite: G('29') },
};

// ---------- Step: the morning after (four dilemmas) ----------

export const MORNING_INTRO = 'The old rulers are gone. Now the hard part starts: the economy is still broken, there are hundreds of posts to fill, and your own allies are watching you. Four choices, and in each you can take only one side.';
export const MORNING_INTRO_CITE = G('38');

// Each dilemma has two sides that cannot both be taken. The effects depend on the
// regime so far (see morningEffects). Values are game judgements; reasons are cited.
export const MORNING = [
  {
    id: 'civil',
    q: 'The old regime’s civil servants',
    a: { value: 'keep', label: 'Keep them, and pay them well', text: 'They know how to run the ministries and collect the taxes. But they served the old rulers and may not be loyal.', cite: G('35, 38') },
    b: { value: 'fire', label: 'Fire them all, and appoint your own people', text: 'Your people are loyal, but most have never run a ministry, a port or a tax office.', cite: G('38') },
  },
  {
    id: 'plotters',
    q: 'Your fellow plotters',
    a: { value: 'share', label: 'Share power: a ruling council with a seat for each group', text: 'Everyone who took the risk gets a say, and nobody has a reason to plot. But you cannot act without them.', cite: G('39') },
    b: { value: 'purge', label: 'Purge them before they purge you', text: 'They know how to seize power, because they just did it. After secret trials, Samuel Doe had no fewer than fifty of his original collaborators executed. Nasser’s comrade Amir, a leading Free Officer, was arrested and died in custody.', cite: BDM('2'), cite2: SV('58') },
  },
  {
    id: 'army',
    q: 'The soldiers',
    a: { value: 'pay', label: 'Raise the army’s pay', text: 'Samuel Doe raised army privates’ pay from $85 to $250 a month. Bueno de Mesquita and Smith say of Mugabe that whatever happens to the people, he makes sure to pay the army.', cite: BDM('2, 20') },
    b: { value: 'guard', label: 'Build your own guard, loyal to you alone', text: 'A separate force, loyal to you rather than to the generals. Wintrobe lists a praetorian guard among the ways rulers buy security; revolutionary regimes went further, building new armies such as Iran’s Revolutionary Guard.', cite: { src: 'wintrobe1998', page: '38' }, cite2: LW('10–11') },
  },
  {
    id: 'crowd',
    q: 'The people who backed you',
    a: { value: 'reward', label: 'Reward them: jobs, land and a say', text: 'They took to the streets for you. Rewarding them widens your coalition, and a wide coalition is expensive.', cite: { src: 'bdm2011', page: '11–12' } },
    b: { value: 'shut', label: 'Thank them and send them home', text: 'Before the seizure you needed the people. Afterwards, rulers tend to shut the broad movement out: the secular and moderate religious groups who marched for Khomeini found they were left out.', cite: BDM('8'), cite2: G('35') },
  },
];

// The leader's free hand on the morning after, from the seizure (GWF pp. 39–42).
// 1 tied hands, 2 constrained, 3 free hand, 4 unchecked. Values are game judgements.
export const AUTONOMY_LABELS = ['', 'Tied hands', 'Constrained', 'A free hand', 'Unchecked'];
export function startingAutonomy(w) {
  const { group, org, route } = w || {};
  let a, why, cite;
  if (org === 'loose' && group !== 'royal') { a = 3; why = 'In a loose coalition nobody has the unity or the arms to constrain the leader, so bargaining power shifts to the leader once power is won.'; cite = G('41–42'); }
  else if (route === 'insurgency') { a = 3; why = 'Insurgent leaders command troops without military promotion norms, which strengthens the leader against the inner circle.'; cite = G('40'); }
  else if (group === 'officers' || (group === 'both' && route === 'coup')) { a = 1; why = 'Military rulers must consult fellow officers and follow promotion norms when appointing, or risk a coup by colleagues.'; cite = G('39'); }
  else if (group === 'royal') { a = 2; why = 'Geddes, Wright and Frantz leave monarchies out of this chapter, because foreigners installed almost all of them. The game gives the monarch a middling hand.'; cite = G('38'); }
  else if (group === 'movement' && org !== 'disciplined') { a = 3; why = 'A leader with a following but no party organisation faces few colleagues able to restrain them.'; cite = EF('7'); }
  else if ((route === 'authoritarianization' || route === 'uprising') && org !== 'disciplined') { a = 3; why = 'Loosely organised ruling parties give leaders more autonomy than military rulers start with: the inner circle lacks the unity and the arms to constrain them.'; cite = G('41–42'); }
  else { a = 2; why = 'A disciplined organisation has rules for choosing and removing leaders, which constrain the leader at first.'; cite = G('41–42'); }
  if (org === 'factions') { a -= 1; why += ' Factions must each be represented in the inner circle, which ties the leader’s hands further.'; }
  return { autonomy: Math.max(1, Math.min(4, a)), why, cite, cite2: org === 'factions' ? G('40') : null };
}

// How far the new regime can reach into society (GWF pp. 38–42). 1 low, 2 medium, 3 high.
export const REACH_LABELS = ['', 'Low', 'Medium', 'High'];
export function startingReach(w) {
  const { group, route } = w || {};
  if (route === 'insurgency') return { reach: 3, why: 'Insurgents arrive with cadres and security services already built, so they can quickly control the population.', cite: G('40') };
  if (group === 'officers') return { reach: 1, why: 'The military usually lacks a civilian network to reach or even gather information from ordinary people.', cite: G('40') };
  if (route === 'authoritarianization' || group === 'insiders') return { reach: 2, why: 'Insiders and elected incumbents already command loyal bureaucrats, many of whom they appointed.', cite: G('38') };
  return { reach: 2, why: 'Unarmed civilian groups are good at co-opting elites but poor at delivering on promises to ordinary citizens.', cite: G('42') };
}

// The winning coalition after the seizure (selectorate theory, as in Week 1). 1 narrow, 2 medium, 3 broad.
// The starting sizes are game judgements.
export const COALITION_LABELS = ['', 'Narrow', 'Medium', 'Broad'];
export const COALITION_TEXT = ['', 'a few dozen officers, insiders or courtiers', 'the leaders, cadres and allies of the seizure group', 'a mass following that expects to share the spoils'];
export function startingCoalition(w) {
  const { group, route } = w || {};
  if (group === 'officers' || group === 'insiders' || group === 'royal' || (group === 'both' && route === 'coup')) return 1;
  return 2;
}

// The chance that a purge succeeds against a disciplined organisation (game judgement):
// usually it can resist (EF p. 7), but not always (Geddes 1999 p. 123); insurgent party
// institutions are weaker relative to the leader (GWF p. 40).
export const purgeChance = (w) => (w?.org !== 'disciplined' ? 1 : w.route === 'insurgency' ? 0.5 : 1 / 3);

// The effects of the four choices, which depend on the regime so far.
// roll (0–1) decides a risky purge; the engine seeds it so the result can be replayed.
// Returns { fx: { stability, treasury, autonomy, reach, coalition }, notes: [{ text, cite }], purged }.
export function morningEffects(w, choices, roll = 0) {
  const z = w || {};
  const fx = { stability: 0, treasury: 0, autonomy: 0, reach: 0, coalition: 0 };
  const notes = [];
  let purged = false;
  const add = (k, v) => { fx[k] += v; };
  const officers = z.group === 'officers' || z.group === 'both';
  const cadres = z.route === 'insurgency';
  // The civil servants
  if (choices.civil === 'keep') {
    add('reach', 1); add('treasury', -1);
    notes.push({ text: z.route === 'authoritarianization' || z.group === 'insiders' ? 'You appointed many of these officials yourself, so they serve you willingly and the ministries run as before.' : 'The old officials keep the ministries running, so your orders reach the provinces. They served the old rulers, though, and may not be loyal.', cite: G('38') });
  } else if (choices.civil === 'fire') {
    if (cadres) {
      notes.push({ text: 'Your movement’s own cadres take over the ministries. They are loyal and they know the country, because years of insurgency trained them to recruit, collect resources and keep order.', cite: G('40') });
    } else {
      add('reach', -1); add('stability', -1);
      notes.push({ text: officers ? 'Like Samuel Doe, who replaced almost everyone in government with his own Krahn people, you swap expertise for loyalty. Officers have no civilian network to replace the officials they fired. Taxes go uncollected and the provinces go quiet: you no longer know what is happening there.' : 'Your loyalists cannot yet run the state. The provinces drift out of reach.', cite: G('40'), cite2: officers ? BDM('1–2') : null });
    }
  }
  // The plotters
  if (choices.plotters === 'share') {
    add('stability', 1); add('coalition', 1);
    if (z.org === 'factions') notes.push({ text: 'Each faction already expected a seat at the table, and now it has one. Nobody has a reason to plot today, but every decision needs their agreement.', cite: G('39–40') });
    else { add('autonomy', -1); notes.push({ text: 'Every group has a seat on the council. Nobody has a reason to plot today, but every decision needs their agreement.', cite: G('39') }); }
  } else if (choices.plotters === 'purge') {
    if (z.org === 'disciplined') {
      if (roll < purgeChance(z)) {
        purged = true;
        add('autonomy', 1); add('coalition', -1); add('stability', -1);
        notes.push({ text: 'Your colleagues expected the organisation’s rules to hold you, but you moved first, and it worked. Pinochet was picked to lead a collegial junta as a safe choice, then took the power for himself: deals made before a seizure are often unenforceable.', cite: { src: 'geddes1999', page: '123' }, cite2: z.route === 'insurgency' ? G('40') : null });
      } else {
        add('stability', -2);
        notes.push({ text: 'A disciplined organisation is usually better able to resist its leader. Your colleagues close ranks against you, and you back down.', cite: EF('7') });
      }
    } else {
      purged = true;
      add('autonomy', 1); add('coalition', -1);
      notes.push({ text: 'With the co-plotters gone, nobody inside the regime can restrain you. Followers who could check the leader before the seizure often cannot afterwards.', cite: G('41–42') });
    }
  }
  // The army
  if (choices.army === 'pay') {
    add('stability', 2); add('treasury', -2);
    notes.push({ text: 'Paid soldiers have no reason to listen to the next plotter.', cite: BDM('2, 20') });
  } else if (choices.army === 'guard') {
    add('autonomy', 1); add('treasury', -1);
    if (officers) { add('stability', -1); notes.push({ text: 'Your fellow officers see the new guard as a rival army and a sign that you mean to rule alone. (The game’s judgement: the readings do not test this.)', cite: null }); }
    else notes.push({ text: 'You are safer from a coup. Wintrobe counts a praetorian guard among the ways rulers buy security “at the expense of their power”.', cite: { src: 'wintrobe1998', page: '38' } });
  }
  // The crowd (selectorate theory: small coalitions are cheap and, in the short run, stable)
  if (choices.crowd === 'reward') {
    add('coalition', 1); add('treasury', -2);
    notes.push({ text: 'More people now count, and each one expects to be paid. A wider coalition is too large to keep loyal with private favours alone, so it must be bought with public goods, and it is less tightly bound to you.', cite: { src: 'bdm2011', page: '11–12' } });
  } else if (choices.crowd === 'shut') {
    add('coalition', -1); add('stability', 1);
    notes.push({ text: 'The crowds go home empty-handed. Your coalition stays small and cheap, and small coalitions encourage stable, corrupt regimes, at least in the short run. The people who brought you to power are now outsiders.', cite: { src: 'bdm2011', page: '11–12' }, cite2: BDM('8') });
  }
  return { fx, notes, purged };
}
// ---------- Step: what has it become? ----------

// The base rule: the organisation of the seizure group shapes the type
// (Geddes, as summarised by Ezrow & Frantz p. 7; GWF pp. 28, 32, 38–42).
export function predictType(w) {
  const { group, org, route } = w || {};
  if (group === 'royal') return { type: 'monarchy', why: 'A royal house installed by foreigners rules as a monarchy. Nearly all monarchies since 1946 were handed control this way.', cite: G('38') };
  if (org === 'loose') return { type: 'personalist', why: 'When weakly organised groups seize power, personal rule is likely: nobody inside the group can rein the leader in.', cite: EF('7') };
  if (group === 'officers') {
    return org === 'factions'
      ? { type: 'military', why: 'Officers take the top offices after a coup. A factionalised army needs a large ruling council to give every faction a seat.', cite: G('39') }
      : { type: 'military', why: 'A cohesive, professional military that seizes power tends to produce military rule.', cite: EF('7') };
  }
  if (group === 'both') {
    return route === 'coup'
      ? { type: 'military', why: 'The officers strike, so the officers take the top offices, whatever their civilian allies hoped. The party-first strategy worked at the first attempt only in Syria; elsewhere the military ally quickly eliminated its civilian party ally.', cite: G('32'), cite2: G('38') }
      : { type: 'party', why: 'Without a coup, the party leads and the officers support it: civilian parties that ally with officers hope to keep the upper hand, as the Ba’th eventually did in Syria and Iraq.', cite: G('32') };
  }
  if (group === 'party') {
    return route === 'insurgency'
      ? { type: 'party', why: 'A party that wins a war has a ready-made network of cadres and security services, so it is strong against society, though weaker against its own leader.', cite: G('40') }
      : { type: 'party', why: 'A professionalised party that seizes power tends to produce single-party rule.', cite: EF('7') };
  }
  if (group === 'insiders') {
    return org === 'disciplined'
      ? { type: 'party', why: 'Insiders backed by a disciplined ruling party can hold their new leader to the party’s rules.', cite: EF('7') }
      : { type: 'amalgam', why: 'Rival factions of insiders, such as ministers, party barons and security chiefs, must each be represented in the new inner circle, so power is shared between them.', cite: G('39–40') };
  }
  if (group === 'movement') {
    if (org === 'disciplined') return { type: 'party', why: 'A disciplined movement does the work of a party even without the name: insurgent organisations always perform some of a party’s functions.', cite: G('30'), cite2: EF('7') };
    if (route === 'insurgency') return { type: 'party', why: 'In a factionalised insurgency, such as the Mexican revolution, the various factions must be represented in the new elite, so no single commander rules alone.', cite: G('40') };
    return { type: 'personalist', why: 'Leaders swept to power without a party behind them face few colleagues able to restrain them.', cite: EF('7') };
  }
  return { type: null, why: '', cite: null };
}

// Recompute the morning after for a (possibly changed) seizure, keeping the team's choices
// and the seeded purge roll.
export function replayMorning(w) {
  const m = w?.morning;
  if (!m || !m.choices) return null;
  const eff = morningEffects(w, m.choices, m.roll ?? 0);
  const a = startingAutonomy(w).autonomy + eff.fx.autonomy;
  const r = startingReach(w).reach + eff.fx.reach;
  const c = startingCoalition(w) + eff.fx.coalition;
  return { ...m, fx: eff.fx, notes: eff.notes, purged: eff.purged, autonomy: Math.max(1, Math.min(4, a)), reach: Math.max(1, Math.min(3, r)), coalition: Math.max(1, Math.min(3, c)) };
}

// The regime that results: the base rule, then the morning after.
// Returns { type, base, chain: [{ text, cite, cite2, step }], autonomy, reach, coalition }.
export function deriveRegime(w) {
  const z = w || {};
  const base = predictType(z);
  const chain = [];
  if (!base.type) return { type: null, chain };
  chain.push({ step: 'seizure', text: base.why, cite: base.cite, cite2: base.cite2 || null });
  let type = base.type;
  const m = z.morning;
  const purgeTried = m?.choices?.plotters === 'purge';
  const purged = purgeTried && (m.purged ?? z.org !== 'disciplined');
  if (purgeTried && type !== 'monarchy') {
    if (!purged) {
      chain.push({ step: 'morning', text: 'You tried to purge your colleagues, but a disciplined organisation is usually better able to resist: it held together and kept its say over who leads.', cite: EF('7') });
    } else if (type !== 'personalist') {
      const from = type;
      type = 'personalist';
      chain.push({ step: 'morning', text: from === 'military'
        ? 'You purged your fellow officers and now control appointments yourself. Geddes would call this personal rule, “even though the leader wears a uniform”.'
        : 'You purged the co-plotters, so the organisation no longer controls who rules: you do. Bargaining power shifts after the seizure, and followers who could restrain the leader before may not be able to afterwards.',
      cite: from === 'military' ? { src: 'geddes1999', page: '124' } : G('41–42'), cite2: z.org === 'disciplined' ? { src: 'geddes1999', page: '123' } : null });
    }
  }
  if (m?.choices?.plotters === 'share' && (type === 'personalist' || type === 'amalgam') && z.org === 'factions') {
    chain.push({ step: 'morning', text: 'Sharing power with every faction keeps the leader in check for now. Whether it lasts depends on who wins the power struggles to come.', cite: G('43') });
  }
  const mm = m ? (m.coalition !== undefined ? m : replayMorning(z)) : null;
  const aut = Math.max(1, Math.min(4, (mm ? mm.autonomy : startingAutonomy(z).autonomy)));
  const reach = Math.max(1, Math.min(3, (mm ? mm.reach : startingReach(z).reach)));
  const coalition = Math.max(1, Math.min(3, (mm ? mm.coalition : startingCoalition(z))));
  return { type, base: base.type, chain, autonomy: aut, reach, coalition };
}
// Pressures from the land the team described in Week 1 (Ezrow & Frantz ch. 2).
// favours: a regime type, 'dictatorship' (any), 'democracy' (against), or 'contested'.
export const PRESSURES = {
  wealth: {
    oil: { head: 'Oil and gas', text: 'Authoritarianism is strongly correlated with oil and other natural resources. Rents let rulers hand out patronage instead of reforming.', favours: 'dictatorship', cite: EF('3–4'), extra: 'European powers set up monarchies partly to secure access to resources such as oil, and hegemonic parties need state resources to fund patronage.', extraCite: EF('14, 19') },
    minerals: { head: 'Minerals', text: 'Authoritarianism is strongly correlated with oil and other natural resources. Rents let rulers hand out patronage instead of reforming.', favours: 'dictatorship', cite: EF('3–4') },
    aid: { head: 'Foreign aid', text: 'Patrons have kept personal rulers afloat: France paid about half of Bokassa’s budget. When aid stops, the ruler is exposed.', favours: 'personalist', cite: EF('17–18'), extra: 'When the US cut Samuel Doe’s aid in 1989, rivals invaded.', extraCite: BDM('33') },
    farmland: { head: 'Farmland', text: 'Where landowners ally with the state to keep the peasants down, dictatorship follows. Isolated, rural populations make personal rule easier.', favours: 'dictatorship', cite: EF('5, 18') },
    industry: { head: 'Factories', text: 'Cities and factories let workers organise, and organised labour has pushed for democracy. But military rulers have also allied with technocrats to run industrialising, mobilised societies.', favours: 'contested', cite: EF('5, 11') },
    trade: { head: 'Ports and trade', text: 'The Week 2 readings say nothing specific about trading economies. Your argument here has to come from elsewhere.', favours: 'silent', cite: EF('3–5') },
  },
  ethnic: {
    one: null,
    minority: { head: 'A minority rules', text: 'Personal rulers have often favoured one ethnic group over another to stay in power.', favours: 'personalist', cite: EF('17') },
    two: { head: 'Two rival groups', text: 'Some argue that a society split in two produces single-party rule, the party standing for one side. Others find ethnic diversity does not doom democracy.', favours: 'contested', cite: EF('6, 15') },
    many: { head: 'Many peoples', text: 'Ethnic diversity is one of the main explanations offered for military coups in Africa, but the claim that diversity breeds dictatorship is disputed.', favours: 'contested', cite: EF('5–6, 24') },
  },
  urban: {
    rural: { head: 'A rural country', text: 'Sultanistic personal rule is likelier where the masses are rural, isolated and poor.', favours: 'personalist', cite: EF('18') },
    mixed: null,
    urban: { head: 'An urban country', text: 'Modernisation theory says urban, educated, industrial societies press for democracy. Przeworski and colleagues find wealth stabilises any regime instead.', favours: 'contested', cite: EF('3') },
  },
};
export function pressuresFor(land) {
  if (!land) return [];
  return [PRESSURES.wealth[land.wealth], PRESSURES.ethnic[land.ethnic], PRESSURES.urban[land.urban]].filter(Boolean);
}
export const FAVOURS_LABEL = {
  dictatorship: 'Favours dictatorship', personalist: 'Favours personal rule', military: 'Favours military rule', party: 'Favours party rule',
  monarchy: 'Favours monarchy', democracy: 'Pushes towards democracy', contested: 'Contested', silent: 'Readings silent',
};

// Reasons a regime may differ from last week's (shown on the "become" step).
export const DIFFERENCE_REASONS = [
  { value: 'seizure', label: 'Who seized power, and how organised they were', cite: EF('7') },
  { value: 'road', label: 'The road they took', cite: G('40') },
  { value: 'morning', label: 'What the leader did on the morning after', cite: G('41–42') },
  { value: 'struggle', label: 'Skill and luck in the power struggles that followed', cite: G('43') },
  { value: 'land', label: 'Our country: its wealth, peoples or patron', cite: EF('3–5') },
];

// ---------- Step: what if? ----------

// One condition is changed for each state, and only changes that lead to a different
// regime type are dealt. Each change keeps everything else the team chose, including the
// morning after, and must leave the team's road open (the royal change moves the road to
// a foreign handover, since that is how foreign-backed royal houses take power).
// A flip id is "org:<value>", "group:<value>" or "plotters:<value>".
const GROUP_PHRASE = {
  officers: 'army officers', insiders: 'insiders of the old regime', party: 'a political party',
  both: 'officers allied with a party', movement: 'a popular leader with a movement but no party', royal: 'a royal house backed by a foreign power',
};
const ORG_PHRASE = {
  disciplined: 'disciplined and united: one chain of command, with rules for choosing and removing its own leader',
  factions: 'split into factions, each loyal to its own commander or boss',
  loose: 'a loose coalition: groups that agreed only on getting rid of the old ruler, with no shared rules for choosing a leader and no common chain of command',
};
export function flipInfo(w, flip) {
  if (!flip || !w) return null;
  const [kind, value] = String(flip).split(':');
  if (kind === 'org' && ORGANISATION[value]) {
    return {
      kind, value, label: 'How united they were',
      describe: `What if the group that seized power had been ${ORG_PHRASE[value]}?`,
      reading: 'The better organised the group that seizes power, the more its members can resist the leader’s attempts to take all the power. Weakly organised groups tend to produce personal rule.',
      cite: EF('7'), cite2: G('41–42'),
      apply: (x) => ({ ...x, org: value }),
    };
  }
  if (kind === 'group' && SEIZURE_GROUPS[value]) {
    return {
      kind, value, label: 'Who seized power',
      describe: value === 'royal' ? 'What if a foreign power had put a royal house on the throne instead?' : `What if ${GROUP_PHRASE[value]} had led the seizure instead?`,
      reading: value === 'royal' ? 'Foreigners handed control to nearly all the monarchies that have ruled since 1946.' : 'Who seizes power, and how organised they are, shapes the regime that follows: officers tend to produce military rule, disciplined parties party rule, and groups without organisation personal rule.',
      cite: value === 'royal' ? G('38') : EF('7'), cite2: value === 'royal' ? null : G('42'),
      apply: (x) => ({ ...x, group: value, route: value === 'royal' ? 'foreign' : x.route }),
    };
  }
  if (kind === 'plotters' && (value === 'share' || value === 'purge')) {
    return {
      kind, value, label: 'The morning after',
      describe: value === 'share' ? 'What if, on the morning after, you had shared power with your fellow plotters instead of purging them?' : 'What if, on the morning after, you had purged your fellow plotters instead of sharing power with them?',
      reading: 'Bargaining power shifts once power is won: followers who could restrain the leader before the seizure may not be able to afterwards.',
      cite: G('41–42'), cite2: { src: 'geddes1999', page: '124' },
      apply: (x) => ({ ...x, morning: x.morning ? { ...x.morning, choices: { ...x.morning.choices, plotters: value } } : x.morning }),
    };
  }
  return null;
}

// What the readings expect after the flip: the new type (with the morning after replayed),
// and whether the road is still open.
export function flipOutcome(w, flip) {
  const F = flipInfo(w, flip);
  if (!F) return null;
  let nw = F.apply({ ...w });
  if (nw.morning) nw = { ...nw, morning: replayMorning(nw) };
  const reg = deriveRegime(nw);
  const rc = routeCheck(nw.route, nw.group, nw.order, nw.org);
  const open = ROUTE_IDS.filter((r) => routeCheck(r, nw.group, nw.order, nw.org).ok);
  return {
    w: nw, regime: reg,
    pred: { type: reg.type, why: reg.chain.map((c) => c.text).join(' '), cite: reg.chain[0]?.cite || null, chain: reg.chain },
    routeOk: rc.ok, routeReason: rc.reason, routeCite: rc.cite, open, newRoute: nw.route !== w.route ? nw.route : null,
  };
}

// Every change that would give this state a different regime type, with its road still open.
export function validFlips(w) {
  if (!w || !w.group || !w.org || !w.route) return [];
  const now = deriveRegime(w).type;
  const c = [];
  for (const o of Object.keys(ORGANISATION)) if (o !== w.org) c.push(`org:${o}`);
  for (const g of Object.keys(SEIZURE_GROUPS)) if (g !== w.group) c.push(`group:${g}`);
  const p = w.morning?.choices?.plotters;
  if (p) c.push(`plotters:${p === 'purge' ? 'share' : 'purge'}`);
  return c.filter((f) => { const out = flipOutcome(w, f); return out && out.routeOk && out.pred.type && out.pred.type !== now; });
}
// Deal one of them, seeded so it can be replayed. Organisation changes come up most often,
// because Jamie asked for that one to be spelled out.
export function dealFlip(room, teamId, w) {
  const v = validFlips(w);
  if (!v.length) return null;
  const rng = rngFrom(`${room}:${teamId}:flip`);
  const orgs = v.filter((f) => f.startsWith('org:'));
  const pool = orgs.length && rng() < 0.5 ? orgs : v;
  return pool[Math.floor(rng() * pool.length)];
}
export function nextFlip(w, f) {
  const v = validFlips(w);
  if (!v.length) return null;
  return v[(v.indexOf(f) + 1) % v.length];
}
const ROUTE_IDS = ['coup', 'foreign', 'authoritarianization', 'insurgency', 'uprising', 'eliteRuleChange'];
export const FAILED_PROMPT = {
  q: 'Name the moment your seizure could have failed: a date, a place and who could have stopped it.',
  starter: 'On the night of …, at …, … could have stopped us by …',
  swap: 'The swap test: put another state’s name into your sentence. If it is still true, it is not specific enough.',
};

// ---------- Step: dossier ----------

export const DOSSIER_Q = {
  q: 'Which condition did most to make your regime the kind it is?',
  hint: 'One factor, argued well, beats a list. This is the heart of the Reading Response.',
  options: [
    { value: 'oldorder', label: 'The old order we replaced' },
    { value: 'crisis', label: 'The crisis that opened the door' },
    { value: 'group', label: 'Who seized power' },
    { value: 'org', label: 'How organised they were' },
    { value: 'road', label: 'The road to power' },
    { value: 'morning', label: 'What we did on the morning after' },
    { value: 'land', label: 'Our wealth or our peoples' },
  ],
  sentenceQ: 'Finish the sentence, citing a reading.',
  starter: 'Our regime is … mainly because …, as … argue(s) on p. …',
};

export const LESSONS2 = [
  { head: 'Seizures are opportunistic', text: 'Groups take power by whatever method suits their resources: officers stage coups, elected incumbents rewrite the rules, and insurgency is the last resort.', cite: G('33') },
  { head: 'The seizure group shapes the regime', text: 'Who seized power, and how organised they were, sets who can lead the new dictatorship, how centralised power is on the morning after, and how it treats its citizens.', cite: G('42') },
  { head: 'The morning after decides who rules', text: 'Bargaining power shifts once power is won: followers who could restrain the leader before the seizure may not be able to afterwards. A leader who consolidates power can turn a junta into personal rule, “even though the leader wears a uniform”, as Stalin turned the Politburo into an instrument of personal rule.', cite: G('41–42'), cite2: { src: 'geddes1999', page: '124' }, cite3: SV('54') },
];

export const NEXT_WEEK2 = 'Next week: Power. Bring your leader’s free hand from today with you. Svolik asks how a dictator shares power with the allies who put them there, and why so many of those allies end up purged.';

export const AI_HOOKS2 = [
  { step: 'crisis', idea: 'A short history card for the old order, written for the team’s own country and region.' },
  { step: 'whatif', idea: 'Feedback on the team’s turning point: is the moment datable, the actor nameable, and does it pass the swap test?' },
  { step: 'dossier', idea: 'A one-paragraph intelligence assessment of the new regime, in the voice of a foreign ministry.' },
];
