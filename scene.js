/* Scroll scene: the camera starts inside the PML Console screen and pulls back — the screen is a monitor on a desk,
   and behind it a cable tray rack on the wall whose cable supports grow one by one, as the console places them.
   The rack: two runs of square tube 100×100 along the wall, one above the other, 600 mm clear between them;
   each cable support is a strut welded to both runs, with a bracket per tier.
   Units: metres. Idea: the "UI → studio" pull-back on vizcom.com. */
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

const sec = document.getElementById('scene'), cv = document.getElementById('scene-cv');
const caps = [...sec.querySelectorAll('.cap')];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SMALL = innerWidth < 760;

let R;
try { R = new THREE.WebGLRenderer({canvas: cv, antialias: true, powerPreference: 'high-performance'}); }
catch (e) { sec.classList.add('no3d'); throw e; }
R.setPixelRatio(Math.min(devicePixelRatio, SMALL ? 1.5 : 2));
R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05;
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;

const S = new THREE.Scene();
S.background = new THREE.Color(0x08090c);
S.fog = new THREE.FogExp2(0x08090c, .075);
const pm = new THREE.PMREMGenerator(R);
S.environment = pm.fromScene(new RoomEnvironment(R), .04).texture;
S.environmentIntensity = .35;
const C = new THREE.PerspectiveCamera(34, 1, .01, 80);

/* ---------- materials ---------- */
const std = o => new THREE.MeshStandardMaterial(o);
const M = {
  floor: std({color: 0x101216, roughness: .28, metalness: .55}),
  wall: std({color: 0x14161b, roughness: .92}),
  pilaster: std({color: 0x181a20, roughness: .85}),
  desk: std({color: 0x1a1d24, roughness: .4, metalness: .35}),
  dark: std({color: 0x0c0d10, roughness: .3, metalness: .6}),
  alu: std({color: 0xa7adb5, roughness: .28, metalness: .95}),
  rail: std({color: 0xb3b9c1, roughness: .26, metalness: .95}),
  rung: std({color: 0x8d949d, roughness: .35, metalness: .9}),
  run: std({color: 0x2e4766, roughness: .5, metalness: .45}),       // painted steel (columns, runs) — unlike the galvanized trays
  amber: std({color: 0xf5b83d, roughness: .3, metalness: .6, emissive: 0xf5b83d, emissiveIntensity: .08}),
  weld: std({color: 0xc98f22, roughness: .6, metalness: .4}),
  lamp: new THREE.MeshBasicMaterial({color: 0xfff3dc}),
  cable: [0x1d2025, 0x2b2620, 0x22262d, 0x3a2a14].map(c => std({color: c, roughness: .62, metalness: .05})),
};
const add = (o, parent = S) => { o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
const box = (w, h, d, m, x, y, z, parent = S) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return add(o, parent); };

/* ---------- room ---------- */
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), M.floor); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; S.add(floor);
const WALLZ = -3.2;
box(60, 9, .1, M.wall, 0, 4.5, WALLZ - .05);
/* steel columns at the wall, every 6 m, between the cable supports; the runs are fixed to their front faces */
const COLD = .25, COLF = WALLZ + COLD;                        // column depth from the wall → front face
const column = x => { box(.25, 9, .012, M.run, x, 4.5, COLF - .006); box(.25, 9, .012, M.run, x, 4.5, WALLZ + .006); box(.012, 9, COLD - .024, M.run, x, 4.5, WALLZ + COLD / 2); };
for (let x = -9; x <= 9; x += 6) column(x);
for (let x = -7; x <= 7; x += 3.5) { box(1.6, .03, .12, M.lamp, x, 4.6, -.6); }           // ceiling light strips

/* ---------- desk + monitor ---------- */
box(1.9, .045, .85, M.desk, 0, .74, 0);
[[-.88, -.36], [.88, -.36], [-.88, .36], [.88, .36]].forEach(([x, z]) => box(.04, .72, .04, M.dark, x, .36, z));
const SW = 1.0, SH = .625, SY = 1.24, SZ = -.12;           // screen 16:10, like the console screenshot
box(SW + .04, SH + .04, .035, M.dark, 0, SY, SZ - .02);
box(.06, .38, .05, M.alu, 0, .95, SZ - .07);
box(.32, .015, .22, M.alu, 0, .77, SZ - .05);
box(.62, .018, .2, M.dark, 0, .772, .2);
box(.09, .02, .12, M.dark, .48, .772, .22);
const tex = new THREE.TextureLoader().load('assets/app-knk-full.webp', t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = R.capabilities.getMaxAnisotropy(); draw(); });
const screen = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({map: tex, toneMapped: false, color: 0xe8e8e8}));
screen.position.set(0, SY, SZ); S.add(screen);
const glowL = new THREE.PointLight(0x9fb4ff, 2.2, 3.5, 2); glowL.position.set(0, SY, SZ + .45); S.add(glowL);

/* ---------- runs on the wall: 2 × square tube 100×100, 600 mm clear between them (vertical) ---------- */
const TIERS = [2.0, 2.45, 2.9], TW = .6, TH = .1, X0 = -12, X1 = 12, TZ = WALLZ + .87;
const RUN = .1, RUNZ = COLF + RUN / 2, RUNS = [2.15, 2.15 + .6 + RUN];       // on the columns' front faces; centres 2.15 / 2.85 → 600 mm clear
RUNS.forEach(y => box(X1 - X0, RUN, RUN, M.run, (X0 + X1) / 2, y, RUNZ));
const SZF = COLF + RUN + .0205;                               // strut on the front faces of the runs

/* ---------- ladder trays with cables ---------- */
const rail = (() => {
  const s = new THREE.Shape(), t = .006, h = TH, f = .025;
  s.moveTo(0, 0); s.lineTo(f, 0); s.lineTo(f, t); s.lineTo(t, t); s.lineTo(t, h - t); s.lineTo(f, h - t); s.lineTo(f, h); s.lineTo(0, h); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {depth: X1 - X0, bevelEnabled: false}); g.rotateY(Math.PI / 2); g.translate(X0, 0, 0); return g; })();
const rungs = Math.floor((X1 - X0) / .3);
const rungGeo = new THREE.BoxGeometry(.025, .012, TW - .02);
TIERS.forEach((y, k) => {
  const a = add(new THREE.Mesh(rail, M.rail)); a.position.set(0, y, TZ - TW / 2);
  const b = add(new THREE.Mesh(rail, M.rail)); b.position.set(0, y, TZ + TW / 2); b.scale.z = -1;
  const im = new THREE.InstancedMesh(rungGeo, M.rung, rungs); const m4 = new THREE.Matrix4();
  for (let i = 0; i < rungs; i++) { m4.makeTranslation(X0 + .15 + i * .3, y + .006, TZ); im.setMatrixAt(i, m4); }
  im.castShadow = im.receiveShadow = true; S.add(im);
  const n = 7 - k;
  for (let c = 0; c < n; c++) {
    const r = .014 + ((c * 7 + k) % 3) * .006;
    const cb = add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, X1 - X0, 12), M.cable[(c + k) % 4]));
    cb.rotation.z = Math.PI / 2; cb.position.set(0, y + .012 + r, TZ - TW / 2 + .06 + c * ((TW - .12) / (n - 1)));
  }
});

/* ---------- cable supports: one strut welded to both runs + a bracket per tier; hidden until their turn ---------- */
const SUP = [], STEP = 1.5, BRL = TZ + TW / 2 + .04 - SZF, SB = TIERS[0] - .17, SL = TIERS[2] + .15 - SB;
for (let x = X0 + .75; x <= X1 - .5; x += STEP) {
  const g = new THREE.Group(); g.position.x = x; g.visible = false; S.add(g);
  const strut = box(.041, SL, .041, M.amber, 0, 0, SZF, g); strut.geometry.translate(0, SL / 2, 0); strut.position.y = SB;
  const welds = RUNS.map(y => box(.06, .06, .006, M.weld, 0, y, COLF + RUN + .003, g));
  const br = TIERS.map(y => { const b = box(.041, .041, BRL, M.amber, 0, y - .021, 0, g); b.geometry.translate(0, 0, BRL / 2); b.position.z = SZF; return b; });
  SUP.push({g, strut, welds, br, x});
}

/* ---------- dust in the light ---------- */
const DN = SMALL ? 260 : 600, dpos = new Float32Array(DN * 3);
for (let i = 0; i < DN; i++) { dpos[i * 3] = (Math.random() - .5) * 9; dpos[i * 3 + 1] = Math.random() * 4.2; dpos[i * 3 + 2] = WALLZ + Math.random() * 6; }
const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
const dot = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d');
  const g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })();
const dust = new THREE.Points(dg, new THREE.PointsMaterial({color: 0xffe2a8, map: dot, size: .018, transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending}));
S.add(dust);

/* ---------- lights ---------- */
S.add(new THREE.HemisphereLight(0x8090b0, 0x08090c, .22));
const key = new THREE.SpotLight(0xfff0d8, 90, 18, .5, .7, 1.6); key.position.set(3.2, 6.5, 3.2); key.target.position.set(-.4, 1.8, -2);
key.castShadow = true; key.shadow.mapSize.set(SMALL ? 1024 : 2048, SMALL ? 1024 : 2048); key.shadow.bias = -.0003; key.shadow.radius = 4; S.add(key, key.target);
const wash = new THREE.SpotLight(0xf5b83d, 60, 12, .9, .9, 1.4); wash.position.set(-1, 5.5, WALLZ + 2.6); wash.target.position.set(-1, 2.2, WALLZ); S.add(wash, wash.target);
const rim = new THREE.PointLight(0xf5b83d, 10, 9, 2); rim.position.set(-4, 3.4, WALLZ + 1.2); S.add(rim);
const cool = new THREE.PointLight(0x7aa7ff, 4, 9, 2); cool.position.set(4.5, 2.4, WALLZ + 1.4); S.add(cool);

/* ---------- post: bloom ---------- */
const CO = new EffectComposer(R);
CO.addPass(new RenderPass(S, C));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .55, .7, .82); CO.addPass(bloom);
CO.addPass(new OutputPass());

/* ---------- camera path ---------- */
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function camAt(p){
  const asp = C.aspect, f = Math.tan(THREE.MathUtils.degToRad(C.fov) / 2);
  const d0 = Math.min((SH / 2) / f, (SW / 2) / (f * asp)) * .985;          // the screen covers the viewport
  const a = ease(clamp(p / .6)), k = ease(clamp((p - .6) / .4));
  const far = SMALL ? V(1.2, 1.7, 4.4) : V(1.55, 1.55, 3.05);
  const pos = V(0, SY, SZ + d0).lerp(far, a); pos.x += Math.sin(a * Math.PI) * -.5; pos.y += Math.sin(a * Math.PI) * .15;
  pos.lerp(SMALL ? V(-.6, 1.9, 4.6) : V(-.9, 1.75, 3.3), k * .9);         // slow drift along the rack
  const look = V(0, SY, SZ).lerp(V(-.25, 1.85, -1.6), a).lerp(V(.2, 1.95, -1.8), k);
  C.position.copy(pos); C.lookAt(look);
}

let P = 0, mx = 0, my = 0, T = 0;
function grow(p){
  const g0 = .34, g1 = .9;
  SUP.forEach(s => {
    const o = Math.abs(s.x - .3) / (X1 - X0) * 2;             // from the centre outwards
    const t = clamp((p - g0 - (g1 - g0) * .7 * o) / ((g1 - g0) * .22));
    s.g.visible = t > 0;
    s.strut.scale.y = Math.max(.001, ease(t));
    s.welds.forEach(w => w.scale.setScalar(Math.max(.001, ease(clamp(t * 2)))));
    s.br.forEach((b, k) => { const u = clamp(t * 1.7 - .3 - k * .2); b.visible = u > 0; b.scale.z = Math.max(.001, ease(u)); });
  });
  M.amber.emissiveIntensity = .08 + .5 * Math.pow(Math.sin(clamp((p - .34) / .6) * Math.PI), 2);
}
function draw(){
  camAt(P);
  const w = clamp(P * 2.5);
  C.position.x += mx * .14 * w; C.position.y -= my * .07 * w;
  grow(P);
  glowL.intensity = lerp(2.2, 1.1, P);
  bloom.strength = lerp(.25, .6, clamp(P * 2));
  dust.rotation.y = T * .01; dust.position.y = Math.sin(T * .2) * .05;
  CO.render();
}
function size(){ const w = cv.clientWidth, h = cv.clientHeight; R.setSize(w, h, false); CO.setSize(w, h); C.aspect = w / h; C.updateProjectionMatrix(); draw(); }
const onScroll = () => {
  const r = sec.getBoundingClientRect(), total = r.height - innerHeight;
  P = RM ? 1 : clamp(-r.top / total);
  caps.forEach(c => c.classList.toggle('on', P >= +c.dataset.a && P < +c.dataset.b));
  sec.style.setProperty('--p', P.toFixed(3));
  draw();
};
let vis = false;
new IntersectionObserver(es => es.forEach(e => { const was = vis; vis = e.isIntersecting; if (vis && !was && !RM) requestAnimationFrame(loop); })).observe(sec);
function loop(t){ if (!vis) return; T = t / 1000; draw(); requestAnimationFrame(loop); }
addEventListener('resize', size); addEventListener('scroll', onScroll, {passive: true});
sec.addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
size(); onScroll();
sec.classList.add('ready');
