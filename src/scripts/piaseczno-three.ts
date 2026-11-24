// Delikatna scena three.js w hero: świecące punkty (jak pinezki firm na mapie okolicy) połączone liniami,
// lekko falujące i reagujące na ruch myszy. Bez tekstur, jeden draw call na punkty i jeden na linie.
import { WebGLRenderer, Scene, PerspectiveCamera, BufferGeometry, BufferAttribute, PointsMaterial, CanvasTexture, Points, LineBasicMaterial, LineSegments, AdditiveBlending } from 'three';

export function mountPins(canvas: HTMLCanvasElement) {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  const scene = new Scene();
  const camera = new PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 7.5, 9);
  camera.lookAt(0, 0, 0);

  const N = 140, R = 9;
  const base: { x: number; z: number; ph: number }[] = [];
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * R;
    base.push({ x: Math.cos(a) * r * 1.4, z: Math.sin(a) * r * 0.8, ph: Math.random() * Math.PI * 2 });
  }
  const pGeo = new BufferGeometry();
  pGeo.setAttribute('position', new BufferAttribute(pos, 3));
  const dot = document.createElement('canvas'); dot.width = dot.height = 64;
  const g = dot.getContext('2d')!; const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(180,240,140,1)'); grd.addColorStop(0.35, 'rgba(96,173,38,.9)'); grd.addColorStop(1, 'rgba(96,173,38,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  const pMat = new PointsMaterial({ size: 0.32, map: new CanvasTexture(dot), transparent: true, depthWrite: false, blending: AdditiveBlending });
  scene.add(new Points(pGeo, pMat));

  // stałe pary sąsiadów → linie
  const pairs: [number, number][] = [];
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
    const dx = base[i].x - base[j].x, dz = base[i].z - base[j].z;
    if (dx * dx + dz * dz < 2.2 && pairs.length < 260) pairs.push([i, j]);
  }
  const lPos = new Float32Array(pairs.length * 6);
  const lGeo = new BufferGeometry();
  lGeo.setAttribute('position', new BufferAttribute(lPos, 3));
  const lMat = new LineBasicMaterial({ color: 0x8fd35a, transparent: true, opacity: 0.22, blending: AdditiveBlending, depthWrite: false });
  scene.add(new LineSegments(lGeo, lMat));

  const group = scene;
  let mx = 0, my = 0, tx = 0, ty = 0, visible = true, raf = 0;
  addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  resize(); addEventListener('resize', resize);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) loop(); }).observe(canvas);

  const t0 = performance.now();
  function loop() {
    if (!visible) { raf = 0; return; }
    const t = (performance.now() - t0) / 1000;
    for (let i = 0; i < N; i++) {
      const b = base[i];
      pos[i * 3] = b.x; pos[i * 3 + 1] = Math.sin(t * 0.8 + b.ph + b.x * 0.4) * 0.35; pos[i * 3 + 2] = b.z;
    }
    pGeo.attributes.position.needsUpdate = true;
    for (let k = 0; k < pairs.length; k++) {
      const [i, j] = pairs[k];
      lPos.set([pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]], k * 6);
    }
    lGeo.attributes.position.needsUpdate = true;
    tx += (mx - tx) * 0.04; ty += (my - ty) * 0.04;
    group.rotation.y = t * 0.03 + tx * 0.5;
    group.rotation.x = ty * 0.15;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }
  canvas.classList.add('is-on');
  loop();
}
