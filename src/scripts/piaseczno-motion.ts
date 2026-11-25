// Animacje podstron lokalnych (Piaseczno, Warszawa): GSAP ScrollTrigger.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initPiaseczno() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('pz-gs');

  // Hero: wejście tekstu i paralaksa zdjęcia rynku
  gsap.from('[data-gs="hero"]', { y: 40, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.12, delay: 0.1 });
  const hero = document.querySelector<HTMLElement>('.pz-hero');
  if (hero) {
    // Paralaksa: zdjęcie przesuwa się wolniej niż treść, więc „zostaje w tyle” przy przewijaniu
    gsap.fromTo('.pz-hero-bg', { y: 0, scale: 1.06 }, { y: () => hero.offsetHeight * 0.3, scale: 1, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true } });
  }
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

  // Proces: kafelki odsłaniają się po kolei, kreski i węzły zapalają się na zielono
  document.querySelectorAll<HTMLElement>('[data-gs="steps"] .pz-st').forEach((li) => {
    ScrollTrigger.create({
      trigger: li, start: 'top 80%',
      onEnter: () => li.classList.add('is-on'),
      onEnterBack: () => li.classList.add('is-on'),
    });
  });

  // Miejscowości: chipy wskakują jak pinezki na mapie
  gsap.from('[data-gs="chips"] li', { scale: 0.6, opacity: 0, duration: 0.5, ease: 'back.out(2)', stagger: 0.035, scrollTrigger: { trigger: '[data-gs="chips"]', start: 'top 85%' } });
}
