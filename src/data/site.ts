export const SITE = 'https://topstrony.pl';

export const business = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  '@id': SITE + '/#business',
  name: 'top.strony',
  legalName: 'Qamitech Kamil Piech',
  url: SITE + '/',
  logo: SITE + '/img/top-strony-logo-ink.webp',
  image: SITE + '/img/og-topstrony.jpg',
  description: 'Agencja marketingowa z Piaseczna: strony i sklepy internetowe, pozycjonowanie SEO, AEO i GEO, kampanie Google Ads i Meta Ads, social media oraz branding.',
  telephone: '+48501784882',
  email: 'biuro@topstrony.pl',
  priceRange: '$$',
  address: { '@type': 'PostalAddress', streetAddress: 'ul. Strusia 3C lok. 31', postalCode: '05-500', addressLocality: 'Piaseczno', addressCountry: 'PL' },
  areaServed: ['Piaseczno', 'Warszawa', 'Polska'],
  openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '20:00' }],
  aggregateRating: { '@type': 'AggregateRating', ratingValue: '5.0', reviewCount: '20' },
  founder: { '@type': 'Person', name: 'Kamil Piech' },
  sameAs: ['https://www.facebook.com/topstronypl/', 'https://www.instagram.com/topstrony/', 'https://www.linkedin.com/in/top-strony-a72347205/'],
};

export const crumbs = (items: [string, string][]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + path })),
});

export const faqLd = (faqs: { q: string; a: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});
