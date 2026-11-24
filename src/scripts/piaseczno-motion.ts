// Animacje podstrony /strony-internetowe-piaseczno/: GSAP ScrollTrigger + lekka scena three.js w hero.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initPiaseczno() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('pz-gs');

  // Hero: wejście tekstu i paralaksa zdjęcia rynku
  gsap.from('[data-gs="hero"]', { y: 40, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.12, delay: 0.1 });
  gsap.to('.pz-hero-bg', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.pz-hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.pz-hero-in', { yPercent: -8, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.pz-hero', start: 'center top', end: 'bottom top', scrub: true } });

  // Galeria: odsłanianie zdjęć maską i lekki ruch wewnątrz kadru
  gsap.utils.toArray<HTMLElement>('[data-gs="reveal"]').forEach((fig, i) => {
    const box = fig.querySelector('.pz-gimg');
    const img = fig.querySelector('img');
    gsap.fromTo(box, { clipPath: 'inset(18% 12% 18% 12% round 28px)' }, {
      clipPath: 'inset(0% 0% 0% 0% round 24px)', ease: 'power2.out', duration: 1.2, delay: (i % 2) * 0.1,
      scrollTrigger: { trigger: fig, start: 'top 85%' },
    });
    gsap.fromTo(img, { scale: 1.18, yPercent: -6 }, { scale: 1.02, yPercent: 6, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from(fig.querySelector('figcaption'), { y: 16, opacity: 0, duration: 0.8, ease: 'power2.out', scrollTrigger: { trigger: fig, start: 'top 75%' } });
  });

  // Proces: kroki wjeżdżają po kolei, linia postępu rośnie z przewijaniem
  const steps = document.querySelector<HTMLElement>('[data-gs="steps"]');
  if (steps) {
    steps.style.setProperty('--prog', '0');
    gsap.to(steps, { '--prog': 1, ease: 'none', scrollTrigger: { trigger: steps, start: 'top 75%', end: 'bottom 55%', scrub: true } });
    gsap.from(steps.children, { y: 30, opacity: 0, duration: 0.7, ease: 'power2.out', stagger: 0.08, scrollTrigger: { trigger: steps, start: 'top 80%' } });
  }

  // Miejscowości: chipy wskakują jak pinezki na mapie
  gsap.from('[data-gs="chips"] li', { scale: 0.6, opacity: 0, duration: 0.5, ease: 'back.out(2)', stagger: 0.035, scrollTrigger: { trigger: '[data-gs="chips"]', start: 'top 85%' } });

  // Scena three.js: siatka „pinezek” nad Piasecznem, ładowana dopiero gdy przeglądarka ma czas
  const canvas = document.querySelector<HTMLCanvasElement>('.pz-3d');
  if (canvas && innerWidth > 760) {
    const start = () => import('./piaseczno-three').then((m) => m.mountPins(canvas)).catch(() => {});
    if ('requestIdleCallback' in window) (window as any).requestIdleCallback(start, { timeout: 1500 });
    else setTimeout(start, 600);
  }
}
