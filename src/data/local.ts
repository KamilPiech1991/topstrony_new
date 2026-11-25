// Podstrony lokalne: jedno źródło prawdy dla stopki, linkowania wewnętrznego i llms.txt
export type LocalLink = { slug: string; nom: string; loc: string; label: string; href: string };
const mk = (slug: string, nom: string, loc: string): LocalLink => ({ slug, nom, loc, label: `Strony internetowe ${nom}`, href: `/uslugi/strony-internetowe/${slug}/` });
export const LOCAL_LINKS: LocalLink[] = [
  mk('piaseczno', 'Piaseczno', 'Piasecznie'),
  mk('warszawa', 'Warszawa', 'Warszawie'),
  mk('konstancin-jeziorna', 'Konstancin-Jeziorna', 'Konstancinie-Jeziornie'),
  mk('lesznowola', 'Lesznowola', 'Lesznowoli'),
  mk('gora-kalwaria', 'Góra Kalwaria', 'Górze Kalwarii'),
  mk('tarczyn', 'Tarczyn', 'Tarczynie'),
  mk('grojec', 'Grójec', 'Grójcu'),
  mk('legionowo', 'Legionowo', 'Legionowie'),
  mk('minsk-mazowiecki', 'Mińsk Mazowiecki', 'Mińsku Mazowieckim'),
];
