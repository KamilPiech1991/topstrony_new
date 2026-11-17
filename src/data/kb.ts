// Baza wiedzy: artykuły w src/content/baza-wiedzy/*.md (frontmatter: title, description, category, date, readingTime, image, imageAlt, order)
export interface KbMeta {
  title: string; description: string; category: string; date: Date | string;
  readingTime: number; image: string; imageAlt: string; order?: number;
}
export interface KbArticle {
  slug: string; meta: KbMeta; Content: any; headings: { depth: number; slug: string; text: string }[];
}

const mods = import.meta.glob('../content/baza-wiedzy/*.md', { eager: true }) as Record<string, any>;

export const articles: KbArticle[] = Object.entries(mods)
  .map(([path, m]) => ({
    slug: path.split('/').pop()!.replace(/\.md$/, ''),
    meta: m.frontmatter as KbMeta,
    Content: m.Content,
    headings: (m.getHeadings?.() ?? []) as KbArticle['headings'],
  }))
  .sort((a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime() || (a.meta.order ?? 99) - (b.meta.order ?? 99));

export const kbUrl = (slug: string) => `/baza-wiedzy/${slug}/`;
export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Warsaw' });
export const isoDate = (d: Date | string) => new Date(d).toISOString().slice(0, 10);
