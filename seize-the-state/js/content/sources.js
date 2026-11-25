// Every claim in the game cites one of these sources with a page (or slide) number.
// Page numbers are the printed page numbers of the PDFs in Readings/, except where a
// source has pdfPages: true (no printed numbers), when they count pages of the PDF.
export const SOURCES = {
  geddes1999: {
    short: 'Geddes (1999)',
    full: 'Geddes, B. (1999) “What Do We Know About Democratization After Twenty Years?”, Annual Review of Political Science, 2, pp. 115–44.',
    file: 'Readings/week-02/5_Geddes_Democratization_1999.pdf',
    week: 1,
  },
  wintrobe1998: {
    short: 'Wintrobe (1998)',
    full: 'Wintrobe, R. (1998) The Political Economy of Dictatorship. Cambridge: Cambridge University Press, ch. 2 “The Dictator’s Dilemma”, pp. 20–39.',
    file: 'Readings/week-01/dictators_dilemma.pdf',
    week: 1,
  },
  gwf2018: {
    short: 'Geddes, Wright & Frantz (2018)',
    full: 'Geddes, B., Wright, J. and Frantz, E. (2018) How Dictatorships Work. Cambridge: Cambridge University Press, ch. 2 “Autocratic Seizures of Power”.',
    file: 'Readings/week-02/autocratic-seizures-of-power.pdf',
    week: 2,
  },
  gwf2018elections: {
    short: 'Geddes, Wright & Frantz (2018), ch. 6',
    full: 'Geddes, B., Wright, J. and Frantz, E. (2018) How Dictatorships Work. Cambridge: Cambridge University Press, ch. 6 “Why Parties and Elections in Dictatorships?”, pp. 129–53.',
    file: 'Readings/week-06/why_parties_and_elections_in_dictatorships.pdf',
    week: 6,
  },
  levitskyway2026: {
    short: 'Levitsky & Way (2026)',
    full: 'Levitsky, S. and Way, L. A. (2026) “Competitive Authoritarianism in America”, Journal of Democracy, 37(4), pp. 5–25.',
    file: 'Readings/week-06/project_muse_1001893.pdf',
    week: 6,
  },
  knutsen2017: {
    short: 'Knutsen, Nygård & Wig (2017)',
    full: 'Knutsen, C. H., Nygård, H. M. and Wig, T. (2017) “Autocratic Elections: Stabilizing Tool or Force for Change?”, World Politics, 69(1), pp. 98–143.',
    file: 'Readings/week-06/KNUTSEN-AUTOCRATICELECTIONSStabilizing-2017.pdf',
    week: 6,
  },
  bdm2011: {
    short: 'Bueno de Mesquita & Smith (2011)',
    full: 'Bueno de Mesquita, B. and Smith, A. (2011) The Dictator’s Handbook: Why Bad Behavior Is Almost Always Good Politics. New York: PublicAffairs, ch. 1 “The Rules of Politics”, pp. 1–20, and ch. 3 “Staying in Power”, pp. 49–74.',
    file: 'Readings/selectorate-theory/Chapter 1 BDM & S.pdf; Chapter 3 BDM & S.pdf',
    week: 1,
  },
  ef2011: {
    short: 'Ezrow & Frantz (2011)',
    full: 'Lindstaedt (née Ezrow), N. M. and Frantz, E. (2011) Dictators and Dictatorships: Understanding Authoritarian Regimes and Their Leaders. London: Bloomsbury Academic, ch. 2 “The Causes of Dictatorship”. Page numbers are those of the Moodle ebook printout (27 pages).',
    file: 'Readings/week-02/Dictators_and_Dictatorships_Understanding_Authorit..._----_(2_The_Causes_of_Dictatorship).pdf',
    week: 2,
    pdfPages: true,
  },
  bdm2011ch2: {
    short: 'Bueno de Mesquita & Smith (2011), ch. 2',
    full: 'Bueno de Mesquita, B. and Smith, A. (2011) The Dictator’s Handbook: Why Bad Behavior Is Almost Always Good Politics. New York: PublicAffairs, ch. 2 “Coming to Power”. The scan has no printed page numbers, so pages are those of the Moodle PDF (34 pages).',
    file: 'Readings/week-02/Coming to Power Chapter.pdf',
    week: 2,
    pdfPages: true,
  },
  svolik2012: {
    short: 'Svolik (2012)',
    full: 'Svolik, M. W. (2012) The Politics of Authoritarian Rule. Cambridge: Cambridge University Press, ch. 3 “And Then There Was One!” and ch. 4 “When and Why Institutions Contribute to Authoritarian Stability”.',
    file: 'Readings/week-03/and-then-there-was-one-authoritarian-power-sharing-and-the-path-to-personal-dictatorship.pdf; Readings/week-02/when_and_why_institutions_contribute_to_authoritarian_stability_commitment_monitoring_and_collective_action_problems_in_authoritarian_powersharing (1).pdf',
    week: 2,
  },
  levitskyway2013: {
    short: 'Levitsky & Way (2013)',
    full: 'Levitsky, S. and Way, L. A. (2013) “The Durability of Revolutionary Regimes”, Journal of Democracy, 24(3), pp. 5–17.',
    file: 'Readings/week-02/revolutionary regimes.pdf',
    week: 2,
  },
  trinh2019: {
    short: 'Trinh (2019)',
    full: 'Trinh, M. (2019) “Statistical Misreporting from Below, as Seen from (Very High) Above”, MIT Political Science Department Research Paper No. 2019-22.',
    file: 'Readings/week-01/misreporting.pdf',
    week: 1,
  },
  lecture1: {
    short: 'Lecture 1',
    full: 'POLI6015 Lecture 1, “The Landscape”, selectorate theory section (after Bueno de Mesquita et al. 2003; Bueno de Mesquita & Smith 2011).',
    file: 'Lectures/POLI6008 Lecture 1 Landscape 1.pptx',
    week: 1,
  },
};

export function cite(c) {
  if (!c) return '';
  const s = SOURCES[c.src];
  if (!s) return '';
  const multi = /[–,-]/.test(String(c.slide || c.page));
  const where = c.slide ? `slide${multi ? 's' : ''} ${c.slide}` : `${s.pdfPages ? 'PDF ' : ''}${multi ? 'pp.' : 'p.'} ${c.page}`;
  return `${s.short}, ${where}`;
}
