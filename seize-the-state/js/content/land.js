// Week 1: Land and people. The teams' own description of their state.
// These are creative choices, not claims from the readings, so they carry no citations.
// Week 2 asks what the readings say about them (for example, resource wealth).
// DRAFT: student-facing wording awaits Jamie's approval.

export const LAND_INTRO = 'Describe your country. Who lives there, how do they live, and where does the money come from? Next week the readings ask what these facts mean for how your state is ruled.';

export const POPULATION = [
  { value: 2, label: '2 million', text: 'A small state. The elite all know one another.' },
  { value: 10, label: '10 million', text: 'A middling state, with one big city and several provincial towns.' },
  { value: 40, label: '40 million', text: 'A large state, with big cities and remote provinces.' },
  { value: 120, label: '120 million', text: 'A giant. Ruling it takes a vast state machine.' },
];
export const ADULT_SHARE = 0.6; // adults as a share of the population, for the selectorate diagram

export const ETHNIC = [
  { value: 'one', label: 'One dominant group', text: 'Most people share one language and identity, with small minorities.', shares: [82, 12, 6] },
  { value: 'minority', label: 'A minority rules', text: 'A larger group lives under rulers drawn mainly from a smaller one.', shares: [62, 26, 12] },
  { value: 'two', label: 'Two rival groups', text: 'Two groups of similar size, with a long history of rivalry.', shares: [47, 43, 10] },
  { value: 'many', label: 'Many groups, none dominant', text: 'A patchwork of peoples, languages and regions.', shares: [28, 26, 24, 22] },
];
export const DEFAULT_GROUPS = ['Aren', 'Belmari', 'Kostrin', 'Dovai'];
export const GROUP_COLOURS = ['#c9a96e', '#7f9bb5', '#a77a9a', '#8fae7e'];

export const RELIGION = [
  { value: 'secular', label: 'Mostly secular', text: 'Religion plays little part in public life.' },
  { value: 'one', label: 'One dominant faith', text: 'One faith, with its own clergy and institutions, shapes daily life.' },
  { value: 'divided', label: 'Divided between faiths', text: 'Two or more faiths, often matching regional or ethnic lines.' },
];

export const URBAN = [
  { value: 'rural', label: 'Mostly rural', text: 'Most people live in villages, far from the capital.' },
  { value: 'mixed', label: 'Mixed', text: 'A growing capital, provincial towns and a large countryside.' },
  { value: 'urban', label: 'Mostly urban', text: 'Most people live in cities, close to the seat of power.' },
];

export const WEALTH = [
  { value: 'oil', label: 'Oil and gas', icon: 'oil', text: 'Wells and pipelines earn foreign currency, and the state collects it directly.', economy: 'Oil and gas exports pay for most of the budget. The state needs few taxpayers, and the money arrives whatever the people think of their rulers.' },
  { value: 'minerals', label: 'Minerals', icon: 'minerals', text: 'Mines of copper, gold or diamonds, worked by foreign firms or the state.', economy: 'Mining earns most of the export income. The mines are concentrated in a few places, and whoever holds them holds the money.' },
  { value: 'farmland', label: 'Farmland', icon: 'wheat', text: 'Most people farm. Grain and cash crops are the main exports.', economy: 'Most families live off the land. The state taxes harvests and crop exports, so bad years hit the budget and the villages together.' },
  { value: 'trade', label: 'Ports and trade', icon: 'anchor', text: 'Ports and trade routes. Merchants and customs duties fund the state.', economy: 'Customs duties and trade fees fund the state. Merchants are rich and well connected abroad, so their goodwill matters.' },
  { value: 'industry', label: 'Factories', icon: 'gear', text: 'Factories and workshops in the cities employ much of the population.', economy: 'Factories in the cities employ a large workforce. Taxes on wages and firms fund the state, so it depends on people working.' },
  { value: 'aid', label: 'Foreign aid', icon: 'aid', text: 'Little to sell abroad. Aid and loans from a powerful patron keep the budget afloat.', economy: 'Aid and loans from abroad fill the budget. The patron’s goodwill matters more than any taxpayer’s.' },
];

export function groupShares(ethnic, n = null) {
  const e = ETHNIC.find((x) => x.value === ethnic) || ETHNIC[0];
  return n ? e.shares.slice(0, n) : e.shares;
}

export const find = (list, v) => list.find((x) => x.value === v) || null;
