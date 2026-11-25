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

// Wpis firmy w Mapach Google (ten sam na stronie kontaktowej i na stronach lokalnych)
export const MAP_PLACE = 'https://www.google.com/maps/place/Top+Strony+%E2%80%93+Strony+Internetowe+Piaseczno+i+Warszawa/@52.0776014,21.010337,17z/data=!3m1!4b1!4m6!3m5!1s0x47192fe20fe2da93:0xf50fcb17f005e31a!8m2!3d52.0775981!4d21.0129119!16s%2Fg%2F11jmxz18x3?hl=pl';
export const mapEmbed = (alt = 1223) =>
  `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d${alt}!2d21.0129119!3d52.0775981!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47192fe20fe2da93%3A0xf50fcb17f005e31a!2sTop%20Strony%20%E2%80%93%20Strony%20Internetowe%20Piaseczno%20i%20Warszawa!5e0!3m2!1spl!2spl!4v1732500000000!5m2!1spl!2spl`;
