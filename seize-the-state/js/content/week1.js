// Week 1: Founding. Content and rules, each with a citation.
// Page numbers checked against the PDFs in Readings/ on 2026-11-17.
// DRAFT: student-facing wording awaits Jamie's approval.

export const WEEK1 = {
  id: 1,
  title: 'Founding',
  subtitle: 'Five new states. What kind of regime rules each, and who keeps it in power?',
  readings: ['geddes1999', 'bdm2011', 'wintrobe1998'],
  // About 33 minutes. "dilemma" is an optional extra (Wintrobe), switched on from the main-screen menu.
  steps: [
    { id: 'lobby', title: 'Claim your territory', short: 'Claim', minutes: 2 },
    { id: 'found', title: 'Found the state', short: 'Found', minutes: 5 },
    { id: 'land', title: 'Land and people', short: 'Land', minutes: 3 },
    { id: 'oldorder', title: 'What came before?', short: 'Before', minutes: 3 },
    { id: 'rulers', title: 'Who rules?', short: 'Rulers', minutes: 8 },
    { id: 'selectorate', title: 'Who counts?', short: 'Selectorate', minutes: 8 },
    { id: 'dilemma', title: 'Extra: the dictator’s dilemma', short: 'Dilemma', minutes: 15, optional: 'wintrobe' },
    { id: 'charter', title: 'The Founding Charter', short: 'Charter', minutes: 4 },
  ],
};

// ---------- Step: rulers (Geddes 1999) ----------

export const REGIME_TYPES = {
  military: {
    label: 'Military junta',
    claim: 'A council of officers runs the country.',
    definition: 'A group of officers decides who will rule and has some influence on policy.',
    cite: { src: 'geddes1999', page: '121' },
    years: 8.8, yearsCite: { src: 'geddes1999', page: '133' },
    surviving: '11%', survivingCite: { src: 'geddes1999', page: '132' },
    strength: 'Officers care most about the unity of the army, so most will follow whoever moves first.',
    strengthCite: { src: 'geddes1999', page: '128' },
    weakness: 'When factions split, most officers prefer to go back to the barracks, so the regime can end itself.',
    weaknessCite: { src: 'geddes1999', page: '131' },
    colour: '#5b6b4a',
  },
  party: {
    label: 'Single-party state',
    claim: 'One party runs the country.',
    definition: 'One party dominates access to office and control over policy, though other parties may legally exist.',
    cite: { src: 'geddes1999', page: '121' },
    years: 22.7, yearsCite: { src: 'geddes1999', page: '133' },
    surviving: '50%', survivingCite: { src: 'geddes1999', page: '132' },
    strength: 'Rival factions are better off staying together in office, so the party co-opts rather than excludes.',
    strengthCite: { src: 'geddes1999', page: '129' },
    weakness: 'Few internal threats: it usually falls to shocks from outside, such as economic crisis or a patron’s collapse.',
    weaknessCite: { src: 'geddes1999', page: '122' },
    colour: '#8a2f2a',
  },
  personalist: {
    label: 'Personal rule',
    claim: 'One leader and their circle run the country.',
    definition: 'Access to office and its rewards depends on the discretion of one leader.',
    cite: { src: 'geddes1999', page: '121' },
    years: 15.1, yearsCite: { src: 'geddes1999', page: '133' },
    surviving: '15.7%', survivingCite: { src: 'geddes1999', page: '133' },
    strength: 'Insiders depend on the leader and have no future outside the regime, so they cling to it.',
    strengthCite: { src: 'geddes1999', page: '130' },
    weakness: 'It rarely outlives its leader: only 4 of 51 such regimes survived more than a short time after the dictator’s death or ouster.',
    weaknessCite: { src: 'geddes1999', page: '132' },
    colour: '#b8892b',
  },
  monarchy: {
    label: 'Royal house',
    claim: 'A royal family runs the country.',
    definition: 'A ruling family decides who reigns. Geddes leaves monarchies out of her data, so her averages do not apply.',
    cite: { src: 'geddes1999', page: '116' }, // p. 116 supports the exclusion only; the first sentence is a plain definition
    years: null,
    surviving: null,
    strength: 'Wintrobe: a known successor partly solves the dilemma, since killing the ruler only brings the heir.',
    strengthCite: { src: 'wintrobe1998', page: '22' },
    weakness: 'Not covered by this week’s readings. Keep it in mind for later weeks.',
    weaknessCite: null,
    colour: '#4a5a7a',
  },
  amalgam: {
    label: 'Mixed rule',
    claim: 'Power is shared between the army, a party and the leader.',
    definition: 'An amalgam of two or more pure types: an officer corps and a party sharing power, or a group that picks the leader while the leader controls careers, as under Pinochet and Suharto.',
    cite: { src: 'geddes1999', page: '122' },
    years: null,
    surviving: null,
    strength: 'Geddes’s hybrids often last a long time, but several of her averages rest on very few cases.',
    strengthCite: { src: 'geddes1999', page: '133' },
    weakness: 'Check which partner really controls who rules: that decides how it behaves when it splits.',
    weaknessCite: { src: 'geddes1999', page: '123' },
    colour: '#6a4a6e',
  },
  electoral: {
    label: 'Electoral',
    claim: 'The opposition can really compete in elections, but on a field tilted in the ruler’s favour.',
    definition: 'Parties compete in meaningful elections, but those in power abuse state institutions to tilt the playing field against their opponents. The competition is real but unfair.',
    cite: { src: 'levitskyway2026', page: '5' },
    years: null,
    surviving: null,
    strength: 'A crushing win signals the dictator’s strength and deters defectors. Elections also show how local officials perform, and spread benefits to more people.',
    strengthCite: { src: 'gwf2018elections', page: '139–42' },
    weakness: 'Elections are risky at first: they raise the chance that the regime falls in the short run, and may only strengthen its grip in the long run.',
    weaknessCite: { src: 'knutsen2017', page: '99' },
    colour: '#2f6f73',
    layer: true,
  },
};

// Three questions that apply Geddes's test: who controls access to power?
export const RULER_QUESTIONS = [
  {
    id: 'chooser',
    text: 'When the top job falls vacant, who decides who gets it?',
    options: [
      { value: 'officers', label: 'A council of senior officers' },
      { value: 'party', label: 'The party’s leading committee' },
      { value: 'leader', label: 'The leader names a successor personally' },
      { value: 'family', label: 'The royal family' },
    ],
  },
  {
    id: 'remove',
    text: 'If the leader crossed that group, could it remove the leader?',
    options: [
      { value: 'yes', label: 'Yes, and the leader knows it' },
      { value: 'no', label: 'No, the leader is beyond their reach' },
    ],
  },
  {
    id: 'careers',
    text: 'Who controls promotions and top appointments?',
    options: [
      { value: 'officers', label: 'The officer corps, by its own rules' },
      { value: 'party', label: 'The party organisation' },
      { value: 'leader', label: 'The leader, personally' },
      { value: 'family', label: 'The royal family' },
    ],
  },
  {
    id: 'elections',
    text: 'What do national elections look like?',
    options: [
      { value: 'none', label: 'There are none' },
      { value: 'single', label: 'One party or one approved list: voters can only say yes' },
      { value: 'rigged', label: 'Several parties run, but fraud, bans and fear fix the result' },
      { value: 'competitive', label: 'The opposition can really compete, but on a tilted field: the ruler controls the media, the money and the courts' },
    ],
  },
];

// Teams may claim one type, or combine two. "Electoral" combines with any of the others.
export const CLAIM_OPTIONS = ['military', 'party', 'personalist', 'monarchy', 'electoral'];
export const MAX_CLAIMS = 2;

// The prompts that replace the old one-sentence justification.
export const JUSTIFY_HINT = 'Geddes sorts regimes by who controls access to power: who picks the leader, and who hands out the top jobs. Answer with that in mind.';
export const JUSTIFY = [
  { id: 'decides', q: 'Who really decides who leads? Name the group and say why it has that power.', starter: 'The leader is chosen by … because …' },
  { id: 'remove', q: 'Who could remove the leader, and how would they do it?', starter: 'If the leader failed, … could remove them by …' },
  { id: 'elections', q: 'Why does your regime hold elections, or why not?', starter: 'We hold / do not hold elections because …' },
];

// Elections run alongside every type of dictatorship. They are a layer, not a replacement for Geddes's test.
export const ELECTORAL_LAYERS = {
  none: { label: null, text: 'No national elections. Most party-led dictatorships hold them, and postponing scheduled elections signals a regime in trouble.', cite: { src: 'gwf2018elections', page: '137, 143' } },
  single: { label: 'One-party ballots', text: 'Elections without choice. Soviet voters could only say yes or no to the candidates the party had chosen.', cite: { src: 'bdm2011', page: '5' } },
  rigged: { label: 'Electoral authoritarian', text: 'Several parties stand, but the result is never in doubt. A big win is a costly signal of the dictator’s strength, meant to deter elites from defecting.', cite: { src: 'gwf2018elections', page: '139' } },
  competitive: { label: 'Competitive authoritarian', text: 'The opposition competes for real and can sometimes win, but the incumbents abuse state institutions to tilt the field against it.', cite: { src: 'levitskyway2026', page: '5, 19' } },
};
export const hasMultipartyElections = (e) => e === 'rigged' || e === 'competitive';

const CHOOSER_TO_TYPE = { officers: 'military', party: 'party', leader: 'personalist', family: 'monarchy' };

// Geddes classifies by control over access to power, not by labels (p. 123).
export function classifyRegime(a) {
  const base = classifyBase(a);
  return base ? { ...base, elections: a.elections || 'none' } : null;
}
function classifyBase(a) {
  if (!a || !a.chooser) return null;
  if (a.chooser === 'family') return { type: 'monarchy', reason: 'family' };
  if (a.chooser === 'leader') return { type: 'personalist', reason: 'leader-chooses' };
  if (a.remove === 'no') return { type: 'personalist', reason: 'cannot-remove' };
  if (a.careers === a.chooser) return { type: CHOOSER_TO_TYPE[a.chooser], reason: 'pure' };
  if (a.careers === 'leader') return { type: 'amalgam', reason: 'leader-appoints' };
  return { type: 'amalgam', reason: 'split-control' };
}

export const CLASSIFY_EXPLANATIONS = {
  family: { text: 'A ruling family controls who reigns.', cite: null },
  'leader-chooses': {
    text: 'If the leader picks their own successor, no group controls access to power except the leader.',
    cite: { src: 'geddes1999', page: '121' },
  },
  'cannot-remove': {
    text: 'Neither the army nor the party can overrule him. Geddes calls such regimes personal dictatorships, “even though the leader wears a uniform”.',
    cite: { src: 'geddes1999', page: '124' },
  },
  'leader-appoints': {
    text: 'A group picks the leader and could remove them, but the leader hands out the jobs in person. Geddes puts regimes like Pinochet’s and Suharto’s in intermediate categories between military or party rule and personal rule.',
    cite: { src: 'geddes1999', page: '124' },
  },
  pure: {
    text: 'The same group picks the leader and controls careers: a pure type.',
    cite: { src: 'geddes1999', page: '124' },
  },
  'split-control': {
    text: 'One group picks the leader and another controls careers, so power is shared between them.',
    cite: { src: 'geddes1999', page: '122' },
  },
};

// Compares what a team claimed with Geddes's test and the elections layer.
export function compareClaim(r) {
  if (!r || !r.classified) return null;
  const claim = Array.isArray(r.claim) ? r.claim : [r.claim].filter(Boolean);
  const base = claim.filter((k) => k !== 'electoral');
  const type = r.classified.type;
  const baseOk = base.includes(type) || (type === 'amalgam' && base.length === 2);
  const exact = baseOk && (type === 'amalgam' || base.length === 1);
  const hasElect = hasMultipartyElections(r.classified.elections);
  const electoralOk = claim.includes('electoral') === hasElect;
  return { claim, base, type, baseOk, exact, hasElect, electoralOk, ok: exact && electoralOk };
}

export const ELECTORAL_MISMATCH = {
  claimedWithout: { text: 'You called your regime electoral, but it holds no multiparty elections. Electoral and competitive authoritarian regimes have parties competing at the ballot box, however unfairly.', cite: { src: 'levitskyway2026', page: '5' } },
  missed: { text: 'You hold multiparty elections, so your regime is also electoral. In this game elections are a layer that runs alongside your type: who controls access to power still decides the type.', cite: { src: 'levitskyway2026', page: '5' } },
};

export const MISMATCH_NOTE = {
  text: 'Geddes classifies regimes by who controls access to power and influence, not by their formal institutions or what they call themselves.',
  cite: { src: 'geddes1999', page: '123' },
};

// ---------- Step: selectorate (Bueno de Mesquita & Smith 2011; Lecture 1) ----------

export const SELECTORATE = {
  terms: [
    {
      id: 'nominal', label: 'Nominal selectorate', nick: 'interchangeables',
      gloss: 'Everyone with at least some legal say in choosing the leader.', cite: { src: 'bdm2011', page: '4–5' },
      quiz: {
        q: 'Who is in the nominal selectorate?',
        options: ['Everyone with at least some legal say in choosing the leader, even if it makes no real difference', 'The people who actually choose the leader', 'The people the leader cannot survive without', 'Everyone who lives in the country'],
        answer: 0,
        explain: 'These are the “interchangeables”: they have a formal say, such as a vote, but any one of them can be replaced. People with no say at all, such as children or the disenfranchised, are outside it.',
        cite: { src: 'bdm2011', page: '4–5' },
      },
    },
    {
      id: 'real', label: 'Real selectorate', nick: 'influentials',
      gloss: 'The group that actually chooses the leader.', cite: { src: 'bdm2011', page: '5' },
      quiz: {
        q: 'Who is in the real selectorate?',
        options: ['Everyone with a vote', 'The group that actually chooses the leader', 'Only the leader’s family', 'Anyone with enough guns to stage a coup'],
        answer: 1,
        explain: 'These are the “influentials”. In China, as in the Soviet Union, they are the voting members of the Communist Party. In Saudi Arabia they are the senior members of the royal family.',
        cite: { src: 'bdm2011', page: '5' },
      },
    },
    {
      id: 'coalition', label: 'Winning coalition', nick: 'essentials',
      gloss: 'The people whose support is essential if the leader is to survive in office.', cite: { src: 'bdm2011', page: '5' },
      quiz: {
        q: 'Who is in the winning coalition?',
        options: ['The largest party in parliament', 'Everyone who voted for the leader', 'The people whose support is essential if the leader is to survive in office', 'The leader’s cabinet ministers'],
        answer: 2,
        explain: 'These are the “essentials”. North Korea’s winning coalition is probably no more than a couple of hundred people, and Saudi Arabia’s may be smaller still.',
        cite: { src: 'bdm2011', page: '5–7' },
      },
    },
  ],
  rules: [
    { n: 1, text: 'Keep your winning coalition as small as possible.', cite: { src: 'lecture1', slide: '75' } },
    { n: 2, text: 'Keep your nominal selectorate as large as possible: more possible replacements make supporters more loyal.', cite: { src: 'bdm2011', page: '17' } },
    { n: 4, text: 'Pay your key supporters just enough to keep them loyal.', cite: { src: 'lecture1', slide: '80' } },
  ],
  modelNote: 'The ranges, the ladder and the budget figures are a game model of the argument, not data.',
  budget: 1_000_000_000, // one billion in local currency a year, the same for every state this week
};

// What a number of people means in practice. Game descriptions, not data.
export const LADDER = [
  { max: 3, label: 'Close family', text: 'The ruler’s spouse, children or siblings.' },
  { max: 15, label: 'An inner circle', text: 'A handful of relatives and cronies, or a junta council.' },
  { max: 150, label: 'The top elite', text: 'Ministers, top generals, security chiefs, a politburo.' },
  { max: 2_000, label: 'The senior ranks', text: 'Senior officers, a party central committee, governors and top officials.' },
  { max: 30_000, label: 'Officers and cadres', text: 'The whole officer corps, or the party’s full-time officials.' },
  { max: 300_000, label: 'The state machine', text: 'Officials, police and army commanders across the provinces.' },
  { max: 5_000_000, label: 'A mass organisation', text: 'Everyone with a party card, or the whole army.' },
  { max: Infinity, label: 'The people', text: 'Most adults: in practice, everyone with a vote.' },
];
// Half or more of all adults counts as "the people", whatever the number.
export const rung = (n, adults = Infinity) => (n >= adults * 0.5 ? LADDER[LADDER.length - 1] : LADDER.find((r) => n <= r.max));
export const ELECTIONS_PHRASE = { none: 'no national elections', single: 'one-party elections', rigged: 'rigged multiparty elections', competitive: 'competitive but unfair elections' };

// Where each circle sits, by regime type. Game ranges: the readings give
// examples (cited) but not ranges. Elections widen the nominal selectorate to the voters.
const TYPE_RANGES = {
  military: { nominal: [1_000, 300_000, 'the officer corps and the army'], real: [10, 5_000, 'senior officers'], coalition: [3, 500, 'the junta and the key commanders'], cite: { src: 'bdm2011', page: '16' }, example: 'In a military junta, both the coalition and the selectorate are small.' },
  party: { nominal: [100_000, 0.15, 'party members'], real: [100, 100_000, 'the party’s voting members and cadres'], coalition: [7, 5_000, 'the party leadership and its allies'], cite: { src: 'bdm2011', page: '5' }, example: 'In China, as in the Soviet Union, the real selectorate is the party’s voting members, and a small group inside the party controls policy.' },
  personalist: { nominal: [10, 20_000, 'the leader’s associates'], real: [3, 2_000, 'the leader’s circle'], coalition: [2, 300, 'family and trusted cronies'], cite: { src: 'geddes1999', page: '133' }, example: 'Personal rulers lean on networks sometimes based on kinship, ethnicity or region.' },
  monarchy: { nominal: [20, 5_000, 'the royal family and the nobility'], real: [2, 1_000, 'the senior royals'], coalition: [2, 200, 'the monarch’s closest relatives'], cite: { src: 'bdm2011', page: '5–7' }, example: 'In Saudi Arabia, the real selectorate is the senior royals, and the coalition may be even smaller than North Korea’s.' },
  amalgam: { nominal: [1_000, 0.15, 'officers and party members'], real: [10, 100_000, 'senior officers and party leaders'], coalition: [3, 5_000, 'the leaders of both'], cite: { src: 'geddes1999', page: '122' }, example: 'Power is shared, so each partner has a seat in the coalition.' },
};
export const ELECTION_NOMINAL = { text: 'Because you hold national elections, every adult with a vote has a formal say, so your nominal selectorate is most of the adult population.', cite: { src: 'bdm2011', page: '4–5' } };

export function selectorateContext(team, adultsFallback = 6_000_000) {
  const pop = team && team.land ? team.land.population : 10;
  const adults = Math.round(pop * 1_000_000 * 0.6) || adultsFallback;
  const type = team && team.rulers && team.rulers.classified ? team.rulers.classified.type : 'personalist';
  const elections = team && team.rulers && team.rulers.classified ? team.rulers.classified.elections : 'none';
  return { adults, type, elections, pop };
}

export function selectorateRanges(ctx) {
  const T = TYPE_RANGES[ctx.type] || TYPE_RANGES.personalist;
  const abs = (v) => (v < 1 ? Math.round(v * ctx.adults) : v);
  const voting = ctx.elections && ctx.elections !== 'none';
  const nominal = voting ? [Math.round(ctx.adults * 0.5), ctx.adults, 'every adult with a vote'] : [abs(T.nominal[0]), Math.min(abs(T.nominal[1]), ctx.adults), T.nominal[2]];
  const real = [T.real[0], Math.min(T.real[1], nominal[1]), T.real[2]];
  const coalition = [T.coalition[0], Math.min(T.coalition[1], real[1]), T.coalition[2]];
  return { nominal, real, coalition, voting, cite: T.cite, example: T.example };
}

// Illustrative model: as the coalition grows, private rewards stop being affordable
// and spending shifts to public goods (Bueno de Mesquita & Smith 2011, pp. 11–12).
export function selectorateModel({ nominal, real, coalition, stacked }, ctx) {
  const adults = ctx.adults;
  const S = Math.max(1, Math.min(Math.round(nominal), adults));
  const R = Math.max(1, Math.min(Math.round(real), S));
  const W = Math.max(1, Math.min(Math.round(coalition), R));
  const publicShare = Math.max(0.05, Math.min(0.95, (Math.log10(W) - 0.5) / (Math.log10(adults) - 0.5)));
  const perSupporter = Math.round((SELECTORATE.budget * (1 - publicShare)) / W);
  const ratio = W / S;
  const odds = R / W;
  return { nominal: S, real: R, coalition: W, adults, publicShare, perSupporter, ratio, odds, stacked: !!stacked };
}

// The fuller loyal-or-shaky analysis that sits beside the diagram.
export function selectorateAnalysis(r, ctx, team) {
  const out = [];
  const oneIn = Math.round(1 / r.ratio);
  const loyalty = r.ratio <= 1 / 10_000 ? ['Very cheap loyalty', 'There are so many interchangeables for each essential that every supporter knows how easily they could be dropped.']
    : r.ratio <= 1 / 100 ? ['Cheap loyalty', 'Each essential sits on top of a large pool of people who could replace them.']
      : r.ratio <= 1 / 10 ? ['Costly loyalty', 'The pool of possible replacements is thin, so supporters can ask for more.']
        : ['Expensive loyalty', 'Almost everyone with a say is in the coalition. Nobody is easy to replace, and they know it.'];
  out.push({ head: loyalty[0], text: `One essential for every ${fmtN(oneIn)} people with a formal say. ${loyalty[1]}`, cite: { src: 'bdm2011', page: '16–17' } });
  out.push({ head: 'Who is waiting', text: `About ${fmtN(Math.round(r.odds))} influentials for each seat in the coalition. Rulers keep the coalition small and make sure everyone in it knows there are plenty of replacements.`, cite: { src: 'bdm2011', page: '61' } });
  const priv = Math.round((1 - r.publicShare) * 100);
  out.push({
    head: priv >= 60 ? 'Private rewards' : priv >= 30 ? 'A mix of rewards' : 'Public goods',
    text: priv >= 60
      ? `About ${priv}% of the budget goes on private rewards: roughly ${fmtN(r.perSupporter)} a year for each essential. Small coalitions encourage stable, corrupt regimes that run on private goods.`
      : priv >= 30
        ? `About ${priv}% of the budget goes on private rewards, roughly ${fmtN(r.perSupporter)} a year each. The rest must go on roads, schools and order, because the coalition is too big to buy one by one.`
        : `With so many essentials, private rewards are too costly: only about ${priv}% of the budget can go on them. The ruler has to deliver public goods to stay in office.`,
    cite: { src: 'bdm2011', page: '11–12' },
  });
  if (team && team.land) {
    const L = team.land;
    const g = L.groups[L.rulerGroup];
    out.push(r.stacked
      ? { head: 'Whose people?', text: `The coalition is drawn from the ruler’s own people, the ${g}. Rulers often surround themselves with trusted members of their own tribe or clan. The groups left out of power are a risk the game returns to in later weeks.`, cite: { src: 'bdm2011', page: '58' } }
      : { head: 'Whose people?', text: `The coalition is drawn from several groups, not only the ruler’s own people, the ${g}. A divided junta may take in many more officers to make sure every group is represented, which widens support but makes the coalition bigger and dearer.`, cite: { src: 'gwf2018', page: '39' } });
  }
  const T = REGIME_TYPES[ctx.type];
  if (T) out.push({ head: 'What tends to break it', text: T.weakness, cite: T.weaknessCite || T.cite });
  if (ctx.elections === 'rigged' || ctx.elections === 'competitive') out.push({ head: 'And the elections', text: 'Elections raise the risk of the regime falling in the short run, though they may strengthen its grip in the long run.', cite: { src: 'knutsen2017', page: '99' } });
  return out;
}

function fmtN(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + ' billion';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + ' million';
  return Math.round(n).toLocaleString('en-GB');
}

// ---------- Step: route (Geddes, Wright & Frantz 2018, ch. 2) ----------
// Introduced freely in Week 1; Week 2 asks whether the team's group could have used it.

export const ROUTES = {
  coup: {
    label: 'Coup',
    blurb: 'Members of the regime’s inner circle oust the leader by force or the threat of it. Geddes, Wright and Frantz count only ousters by the military; Svolik counts any inner circle.',
    cite: { src: 'gwf2018', page: '27' },
    share: 45,
  },
  foreign: {
    label: 'Foreign imposition',
    blurb: 'An occupier or outgoing colonial power hands control to a group it prefers.',
    cite: { src: 'gwf2018', page: '27' },
    share: 16,
  },
  authoritarianization: {
    label: 'Authoritarianization',
    blurb: 'An elected government changes the rules so that the opposition cannot compete.',
    cite: { src: 'gwf2018', page: '27' },
    share: 15,
  },
  insurgency: {
    label: 'Insurgency',
    blurb: 'Rebels defeat the government in war and install their own leaders.',
    cite: { src: 'gwf2018', page: '27' },
    share: 14,
  },
  uprising: {
    label: 'Popular uprising',
    blurb: 'Crowds force the old rulers out; the interim leader then breaks the promise to democratise.',
    cite: { src: 'gwf2018', page: '27' },
    share: 5,
  },
  eliteRuleChange: {
    label: 'Elite rule change',
    blurb: 'Rulers already in power change who is allowed into the inner circle.',
    cite: { src: 'gwf2018', page: '27' },
    share: 5,
  },
};
export const ROUTE_TABLE_CITE = { src: 'gwf2018', page: '28' };
export const ROUTE_FORESHADOW = {
  text: 'Next week: only some groups can use some routes. For example, only an elected government can authoritarianize.',
  cite: { src: 'gwf2018', page: '27' },
};

// ---------- Step: decree (Wintrobe 1998) ----------

export const DECREE = {
  repression: [
    { value: 0, label: 'Light', detail: 'Critics are tolerated. The press grumbles openly.' },
    { value: 1, label: 'Firm', detail: 'Opposition rallies are banned. Editors are warned.' },
    { value: 2, label: 'Harsh', detail: 'A political police watches everyone. Critics disappear.' },
    { value: 3, label: 'Terror', detail: 'Show trials. Even officials fear for their lives.' },
  ],
  loyalty: [
    { value: 0, label: 'Nothing', detail: 'Keep the treasury full.', cost: 0 },
    { value: 1, label: 'Patronage jobs', detail: 'Well-paid posts for people in the coalition’s provinces.', cost: 2 },
    { value: 2, label: 'Grand projects', detail: 'A bridge, a stadium and a palace in every province. Wasteful, and everyone knows who paid.', cost: 4 },
  ],
  agencies: { label: 'Rival intelligence agencies', detail: 'Two services that watch each other and report separately.', cost: 2 },
  treasuryStart: 10,
  cites: {
    paradox: { src: 'wintrobe1998', page: '22' },
    mobutu: { src: 'wintrobe1998', page: '24' },
    organise: { src: 'wintrobe1998', page: '34' },
    agencies: { src: 'wintrobe1998', page: '34–35' },
    rents: { src: 'wintrobe1998', page: '31–32' },
    artefact: { src: 'wintrobe1998', page: '38' },
    securityForces: { src: 'wintrobe1998', page: '34' },
  },
  moodShort: { 3: 'Joyful', 2: 'Loyal', 1: 'Calm', 0: 'Quiet', '-1': 'Grumbling', '-2': 'Striking', '-3': 'Plotting' },
  provinceNames: ['Capital district', 'River towns', 'The mines', 'Northern hills', 'Coastal ports', 'The borderlands'],
  moodText: {
    3: 'All the people work in joy, thanks to the new regime.',
    2: 'Loyal and content. Portraits of the leader in every window.',
    1: 'Situation is calm.',
    0: 'Situation is calm. Some talk of prices.',
    '-1': 'Grumbling about prices and the new governor.',
    '-2': 'Strikes at the depots. Leaflets on the walls.',
    '-3': 'Officers have been meeting at night.',
  },
};

// ---------- Step: briefing (new questions for the game) ----------

export const BRIEFING = [
  {
    id: 'b1',
    text: 'Your leader founded a party that runs every election, but he alone hires and fires its leaders. What does Geddes call this regime?',
    options: ['Single-party: the party organises his support', 'Personalist: office depends on him alone', 'Military: he rose through the army', 'Amalgam: the party and the leader share power'],
    answer: 1,
    explain: 'Classify by who controls access to power. Perón founded a party but kept a near monopoly over policy and personnel, so Geddes calls his regime personalist.',
    cite: { src: 'geddes1999', page: '124' },
  },
  {
    id: 'b2',
    text: 'A bitter split opens at the top of three regimes. Which is most likely to give up power of its own accord?',
    options: ['The single-party state', 'The personal dictatorship', 'The military junta', 'All three equally'],
    answer: 2,
    explain: 'Officers care most about the army’s unity. If a split threatens it, most prefer a return to the barracks, where there is “life after democracy”. Party cadres and cronies have no such exit.',
    cite: { src: 'geddes1999', page: '131' },
  },
  {
    id: 'b3',
    text: 'Every report from the provinces says “situation is calm”. Why should that worry you, according to Wintrobe?',
    options: ['Calm provinces pay less tax', 'Officials fear bringing bad news, so the reports hide what is happening', 'The reports are written by foreign spies', 'Calm is the first sign of a coming famine'],
    answer: 1,
    explain: 'Heavy coercion made Mobutu’s officials afraid to report bad news. In one report 24 prisoners had escaped, and the situation was still “calm”.',
    cite: { src: 'wintrobe1998', page: '24' },
  },
  {
    id: 'b4',
    text: 'Which of these does Wintrobe say can raise a dictator’s power and his security at the same time?',
    options: ['Issuing more commands backed by harsher sanctions', 'Surveillance, buying loyalty, or making agencies compete', 'Refusing to name any successor', 'Abolishing the army'],
    answer: 1,
    explain: 'The paradox that more power means less security is an artefact of the command model. Loyalty (Augustus), surveillance (Mobutu) and competition between agencies (Stalin) raise both.',
    cite: { src: 'wintrobe1998', page: '38' },
  },
  {
    id: 'b5',
    text: 'Your coalition is 2,000 generals and officials. How could you make each of them more loyal without paying them more?',
    options: ['Enlarge the coalition to 20,000', 'Give the vote to more people, so there are more possible replacements', 'Hold free and fair elections', 'Publish the budget'],
    answer: 1,
    explain: 'Rule 2: keep the nominal selectorate large. The more people who could replace a supporter, the more loyal each supporter will be.',
    cite: { src: 'lecture1', slide: '76–77' },
  },
];
export const CAPITAL_PER_CORRECT = 2;

// ---------- Step: charter and debrief ----------

export const LESSONS = [
  {
    head: 'Labels mislead',
    text: 'A general in uniform can be a personal dictator. Ask who controls access to power, not what the regime calls itself.',
    cite: { src: 'geddes1999', page: '123–124' },
  },
  {
    head: 'Type shapes fate',
    text: 'Military regimes tend to break up from within, parties endure, and personal rule rarely outlives the ruler.',
    cite: { src: 'geddes1999', page: '131–132' },
  },
  {
    head: 'Fear blinds',
    text: 'The more a ruler is feared, the less the ruler learns. But repression is not the only tool: loyalty and rival agencies can buy security too.',
    cite: { src: 'wintrobe1998', page: '22, 38' },
  },
];

export const EXIT_QUESTION = 'Today you chose freely. In a real country, which of your choices would have been hardest to make, and why?';
export const EXIT = {
  intro: 'Real rulers do not choose from a blank sheet. Their country’s wealth, army, peoples, neighbours and history push them one way or another. Pick the choice you think was least realistic for a country like yours.',
  choices: [
    { value: 'rulers', label: 'Who rules', detail: 'The group that controls access to power' },
    { value: 'route', label: 'How you took power', detail: 'Your road to power' },
    { value: 'coalition', label: 'How few people you rely on', detail: 'The size of your winning coalition' },
    { value: 'repression', label: 'How hard you repress', detail: 'Your first decree' },
  ],
  factorsQ: 'What about your country would have made it hard? Tick any that apply.',
  factors: [
    { value: 'wealth', label: 'Its wealth and resources' },
    { value: 'army', label: 'Its army' },
    { value: 'peoples', label: 'Its peoples' },
    { value: 'neighbours', label: 'Its neighbours' },
    { value: 'history', label: 'Its history' },
  ],
  sentenceQ: 'Finish the sentence.',
  starter: 'In a real country, we probably could not have … because …',
};

// AI_HOOK points for a later version (see AI-HOOKS.md).
export const AI_HOOKS = [
  'found: a front-page newspaper announcing each state’s founding, written from the team’s choices',
  'rulers: feedback on the team’s one-sentence justification, checked against Geddes',
  'decree: province dispatches written in each regime’s own voice',
  'charter: an official portrait or propaganda poster generated from the flag and motto',
];
