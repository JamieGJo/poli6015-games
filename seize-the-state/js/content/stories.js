// Stories: a short scene for each choice as it plays out, written for the team's own
// country, and a real parallel from the readings. Template text only, no AI.
// Parallels and pages checked on 2026-11-19 against the readings (see BUILD-STATUS.md).
// DRAFT: wording awaits Jamie's approval.

const G = (page) => ({ src: 'gwf2018', page });
const GE = (page) => ({ src: 'geddes1999', page });
const EF = (page) => ({ src: 'ef2011', page });
const BDM = (page) => ({ src: 'bdm2011ch2', page });
const SV = (page) => ({ src: 'svolik2012', page });
const LW = (page) => ({ src: 'levitskyway2013', page });

// ctx: { name, capital, leader }
const C = (t) => ({
  name: t?.country?.name || t?.name || 'the country',
  capital: t?.country?.capital || 'the capital',
  leader: t?.country?.leader || 'the new leader',
});

export const OLD_ORDER_STORY = {
  democracy: (c) => `In ${c.capital}, the parliament still sits and the newspapers still argue. Elections come round every few years.`,
  dictator: (c) => `In ${c.capital}, the old dictator’s portrait hangs in every office. The same small circle has ruled for years, and is getting old.`,
  monarchy: (c) => `In ${c.capital}, the old king holds court in the palace. The ministers are his cousins and their friends.`,
  colonial: (c) => `In ${c.capital}, a foreign governor flies a foreign flag. Local men serve as clerks and policemen, never as ministers.`,
  warlords: (c) => `There is no real government in ${c.capital}. Armed bosses run the roads, the mines and the ports, and tax whoever passes.`,
};

export const CRISIS_STORY = {
  slump: { text: (c) => `The currency has collapsed. In ${c.capital}, bread queues form before dawn, and the soldiers have not been paid this month.`, parallel: 'Financial crises are an opportune time to strike: a ruler who cannot pay the coalition loses it.', cite: BDM('19') },
  disorder: { text: (c) => `Bombs in the market, gangs on the highway. People in ${c.capital} no longer go out after dark, and many say they would welcome anyone who restored order.`, parallel: 'Ousters usually come when disorder and violence make people feel unsafe.', cite: G('30') },
  scandal: { text: (c) => `A newspaper in ${c.capital} has published photographs of the security police beating students to death. Even the ruler’s friends are disgusted.`, parallel: 'Scandal or arbitrary brutality that discredits the incumbents opens the door.', cite: G('30') },
  dying: { text: (c) => `The old ruler has not been seen for six weeks. The palace in ${c.capital} speaks of a cold. Everybody knows it is cancer.`, parallel: 'Mobutu of Zaire was dying of prostate cancer and everybody knew it; his supporters had no future with him, and Kabila’s rebels took the capital.', cite: BDM('7, 10') },
  aidcut: { text: (c) => `The foreign patron has stopped the cheques. The soldiers in ${c.capital} were paid out of that money.`, parallel: 'The United States cut Samuel Doe’s aid in 1989, and suspended aid to Mobutu in 1992. Both regimes were soon in trouble.', cite: BDM('33'), cite2: EF('18') },
  withdrawal: { text: (c) => `The governor has announced that the empire will leave ${c.capital} within two years. Every faction is asking who the departing power will hand over to.`, parallel: 'About a quarter of dictatorships since 1946 began with the ouster of foreign rulers or a handover to an undemocratic government.', cite: G('26') },
};

export const GROUP_STORY = {
  officers: { text: (c) => `In a barracks outside ${c.capital}, a handful of majors and colonels meet at night. They command the tanks; they need nobody else.`, parallel: 'Liberia, 1980: Master Sergeant Samuel Doe and sixteen other non-commissioned officers climbed the fence of the Executive Mansion. The coup was barely planned, and it worked.', cite: BDM('1'), cite2: G('36') },
  insiders: { text: (c) => `In the ministry building in ${c.capital}, three of the ruler’s own ministers and the head of the security police agree that the ruler has to go.`, parallel: 'The Soviet Union, 1964: Presidium members moved against Khrushchev after his behaviour became increasingly unilateral, and the Central Committee confirmed his removal. Qatar, 1995: the emir was deposed by his own son.', cite: SV('89–90, 98') },
  party: { text: (c) => `The party has branches in every town of ${c.name}, a newspaper, and a youth wing. It cannot order anyone to march. It has to persuade them.`, parallel: 'Leninist parties in China and Vietnam built support during their insurgencies with land reform, and only collectivised after taking power.', cite: G('35') },
  both: { text: (c) => `The party’s leaders meet a group of sympathetic colonels in a flat in ${c.capital}. The officers will strike; the party hopes to outmanoeuvre them afterwards.`, parallel: 'The Ba’th tried this strategy repeatedly: it worked first time in Syria (1963) and at the third attempt in Iraq (1968). In the failed attempts, the officers threw the party out.', cite: G('28, 32') },
  movement: { text: (c) => `A preacher, a poet and a former footballer have become the faces of the protests in ${c.capital}. There is no party, only a name that everyone chants.`, parallel: 'Popular uprisings have occasionally catapulted party-less opposition leaders to power. The readings name no clean case: Khomeini became a focal point for opposition, but the Iranian revolution was well organised.', cite: G('30, 41'), cite2: BDM('8') },
  royal: { text: (c) => `A foreign envoy calls on a minor branch of the old royal family. The envoy’s government would like to see a king in ${c.capital}: a king it can work with.`, parallel: 'Iran in the 1920s: Britain backed the strongman Reza Khan, who had no royal lineage, and he founded a dynasty.', cite: EF('19–20') },
};

export const ORG_STORY = {
  disciplined: { text: (c) => `Orders come down one chain of command, and everyone in it knows the rules for choosing, and removing, the person at the top.`, parallel: 'Armed struggle gives rise to cohesive organisations, with sharp “us-them” distinctions that make defection costly.', cite: LW('8–9') },
  factions: { text: (c) => `Each faction has its own commander and its own men. They agreed to strike together; they have not agreed who will lead afterwards.`, parallel: 'Iraq after 1968: a group of officers, each of whom felt equally entitled to play the key role in government.', cite: G('37') },
  loose: { text: (c) => `Students, two colonels, a trade union and a politician just back from exile. They met for the first time a month ago, and they agree on one thing only: the old ruler must go.`, parallel: 'Many different parties or groups that joined forces only to win an election or oust a previous incumbent.', cite: G('41') },
};

export const ROUTE_STORY = {
  coup: { text: (c) => `At 3am the radio in ${c.capital} goes silent. At 6am a colonel reads a statement: the government has been dissolved, and the army is in control.`, parallel: 'Chile, 11 September 1973: military forces led by General Pinochet overthrew the elected President Allende. Coups are bloodless about two-thirds of the time; this one was not.', cite: G('25'), cite2: G('37') },
  foreign: { text: (c) => `Foreign troops guard the airport and the radio station. At a ceremony in ${c.capital}, the foreign ambassador hands power to ${c.leader}.`, parallel: 'Soviet occupation forces imposed party regimes on Eastern Europe during and after the Second World War.', cite: G('28') },
  authoritarianization: { text: (c) => `${c.leader}, elected two years ago, goes on television. Parliament is suspended, the judges are dismissed, and the elections are postponed “until order returns”.`, parallel: 'Peru, 1992: President Fujimori closed Congress and dismissed the judges, an autogolpe. More than a quarter of the dictatorships that replaced democracies began with self-coups.', cite: G('29, 31'), cite2: G('25') },
  insurgency: { text: (c) => `After eleven years in the hills, the rebel columns march into ${c.capital}. The old army has melted away; the rebels’ commanders take over the ministries.`, parallel: 'Chad, 1990: Idriss Déby’s forces defeated the Habré dictatorship. Insurgencies last about a decade on average and win outright only about a third of the time.', cite: G('29'), cite2: G('33') },
  uprising: { text: (c) => `A million people fill the squares of ${c.capital}. The old ruler flees. A provisional council promises free elections within a year.`, parallel: 'Haiti, 1986: after the uprising against the Duvaliers, officers on the transitional council blocked democratisation.', cite: G('29') },
  eliteRuleChange: { text: (c) => `Nothing changes on the streets of ${c.capital}. Inside the palace, the rules for who may sit on the ruling council are rewritten, and a new group takes the seats.`, parallel: 'Guatemala, 1985: military rule became indirect military rule with exclusionary elections. The elected president held no more than 30 per cent of power.', cite: G('29') },
};

export const MORNING_STORY = {
  civil: {
    keep: { parallel: 'Most new rulers depend at first on the ousted incumbent’s bureaucratic and military apparatus, including officials who may not be loyal.', cite: G('35, 38') },
    fire: { parallel: 'Samuel Doe replaced virtually everyone who had been in the government or the army with members of his own small Krahn group.', cite: BDM('1') },
  },
  plotters: {
    share: { parallel: 'Military rulers must consult their colleagues or risk a coup led by them. In established single-party regimes, co-optation rather than exclusion is the rule.', cite: G('39'), cite2: GE('129') },
    purge: { parallel: 'Doe had no fewer than fifty of his original collaborators executed. Under Stalin, more than half of all Politburo members were imprisoned, assassinated or executed, or took their own lives.', cite: BDM('2'), cite2: SV('54') },
  },
  army: {
    pay: { parallel: 'Doe raised army privates’ pay from $85 to $250 a month.', cite: BDM('2') },
    guard: { parallel: 'Revolutionary regimes created new armies, and gave ex-fighters places in forces such as Iran’s Revolutionary Guard.', cite: LW('10–11') },
  },
  crowd: {
    reward: { parallel: 'Single-party regimes win the loyalty of the able and ambitious through their control of education, jobs and positions.', cite: GE('134') },
    shut: { parallel: 'The secular and moderate religious groups who had marched for Khomeini found they were left out of the new regime.', cite: BDM('8') },
  },
};

// The scene for a step, written for this team. Returns { text, parallel, cite, cite2 } or null.
export function storyFor(stepId, team) {
  const c = C(team);
  const w = team?.w2 || {};
  const pick = (S) => (S ? { text: S.text(c), parallel: S.parallel, cite: S.cite, cite2: S.cite2 || null } : null);
  if (stepId === 'oldorder' && team?.oldOrder) return { text: OLD_ORDER_STORY[team.oldOrder.order]?.(c) || '', parallel: null };
  if (stepId === 'crisis') return pick(CRISIS_STORY[w.crisis]);
  if (stepId === 'seizure') return pick(GROUP_STORY[w.group]);
  if (stepId === 'organisation') return pick(ORG_STORY[w.org]);
  if (stepId === 'route') return pick(ROUTE_STORY[w.route]);
  return null;
}
