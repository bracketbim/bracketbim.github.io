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
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

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
  rail: std({color: 0x9da3ab, roughness: .48, metalness: .8}),
  rung: std({color: 0x80868f, roughness: .52, metalness: .75}),
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

/* ---------- desk + monitor (detailed) ---------- */
const DM = {
  top: std({color: 0x1b1e25, roughness: .5, metalness: .25}),
  edge: std({color: 0x2a2f38, roughness: .35, metalness: .8}),
  mat: std({color: 0x111317, roughness: .97}),
  case: std({color: 0x262a32, roughness: .32, metalness: .85}),
  key: std({color: 0xffffff, roughness: .55, metalness: .05}),
  plastic: new THREE.MeshPhysicalMaterial({color: 0x15171b, roughness: .32, clearcoat: .5, clearcoatRoughness: .2}),
  bezel: new THREE.MeshPhysicalMaterial({color: 0x050608, roughness: .22, metalness: .2, clearcoat: 1, clearcoatRoughness: .06}),
  cable: std({color: 0x0d0e11, roughness: .58}),
  ceramic: new THREE.MeshPhysicalMaterial({color: 0xdcd8cf, roughness: .25, clearcoat: .6}),
};
const rb = (w, h, d, r, m, x, y, z, parent = S) => { const o = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), m); o.position.set(x, y, z); return add(o, parent); };
const TOP = .7625;
/* desk: rounded top with a metal edge band, T-leg frame, back beam, cable basket */
rb(1.9, .04, .85, .006, DM.top, 0, TOP - .02, 0);
box(1.9, .006, .004, DM.edge, 0, TOP - .02, .427);
[-.86, .86].forEach(x => {
  box(.06, .7, .05, M.dark, x, .37, 0);
  rb(.07, .028, .72, .01, M.dark, x, .014, 0);
  box(.05, .03, .72, M.dark, x, TOP - .055, 0);
  [-.33, .33].forEach(z => box(.05, .01, .05, M.alu, x, .004, z));
});
box(1.66, .07, .025, M.dark, 0, TOP - .08, -.34);
box(.9, .09, .14, M.rung, .1, TOP - .16, -.3);
box(.9, .004, .14, M.dark, .1, TOP - .205, -.3);
/* desk mat */
rb(.92, .003, .38, .0015, DM.mat, 0, TOP + .0015, .2);
/* monitor: thin glossy bezel, rounded back housing, hinge, aluminium neck and base */
const SW = 1.0, SH = .625, SY = 1.24, SZ = -.12;           // screen 16:10, like the console screenshot
rb(SW + .026, SH + .026, .02, .006, DM.bezel, 0, SY, SZ - .0105);
rb(SW * .72, SH * .72, .05, .022, M.dark, 0, SY - .02, SZ - .045);
rb(SW + .026, .022, .021, .005, M.dark, 0, SY - SH / 2 - .002, SZ - .011);
const hinge = new THREE.Mesh(new THREE.CylinderGeometry(.016, .016, .11, 28), M.alu); hinge.rotation.z = Math.PI / 2; hinge.position.set(0, SY - .04, SZ - .085); add(hinge);
const neck = rb(.075, .5, .022, .009, M.alu, 0, (TOP + SY - .04) / 2, SZ - .1); neck.rotation.x = -.06;
rb(.024, .06, .006, .002, M.dark, 0, TOP + .12, SZ - .113);
rb(.3, .012, .22, .0055, M.alu, 0, TOP + .006, SZ - .06);
const led = add(new THREE.Mesh(new THREE.SphereGeometry(.0022, 10, 8), new THREE.MeshBasicMaterial({color: 0xf5b83d})));
led.position.set(SW / 2 - .03, SY - SH / 2 - .006, SZ + .0005);
/* keyboard: aluminium case + instanced keycaps, ANSI rows */
const kb = new THREE.Group(); kb.position.set(-.04, TOP + .003, .2); kb.rotation.set(.04, .02, 0); S.add(kb);
rb(.455, .016, .19, .005, DM.case, 0, .008, 0, kb);
const ROWS = [[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1,1,1,1,2],[1.5,1,1,1,1,1,1,1,1,1,1,1,1,1.5],[1.75,1,1,1,1,1,1,1,1,1,1,1,2.25],[2.25,1,1,1,1,1,1,1,1,1,1,2.75],[1.25,1.25,1.25,6.25,1.25,1.25,1.25,1.25]];
const U = .0285, KEYS = [];
ROWS.forEach((r, ri) => { let x = -7.5 * U; r.forEach((w, ki) => { KEYS.push({x: x + w * U / 2, z: (ri - 2.5) * U, w, f: ri === 0, mod: w > 1 || (ri === 0 && ki === 0), esc: ri === 0 && ki === 0, enter: ri === 2 && ki === 13}); x += w * U; }); });
const keys = new THREE.InstancedMesh(new RoundedBoxGeometry(1, 1, 1, 2, .2), DM.key, KEYS.length);
const kO = new THREE.Object3D(), kc = {main: new THREE.Color(0x24272e), mod: new THREE.Color(0x353942), acc: new THREE.Color(0xf5b83d)};
KEYS.forEach((k, i) => {
  kO.position.set(k.x, .0205, k.z + (k.f ? -.003 : 0)); kO.scale.set(k.w * U - .004, .009, (k.f ? .78 : 1) * U - .004); kO.updateMatrix();
  keys.setMatrixAt(i, kO.matrix); keys.setColorAt(i, k.esc || k.enter ? kc.acc : k.mod ? kc.mod : kc.main);
});
keys.castShadow = keys.receiveShadow = true; kb.add(keys);
/* mouse */
const mouse = add(new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), DM.plastic)); mouse.scale.set(.031, .019, .058); mouse.position.set(.33, TOP + .003, .22); mouse.rotation.y = -.15;
const wheel = add(new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .005, 24), M.alu)); wheel.rotation.z = Math.PI / 2; wheel.position.set(.327, TOP + .021, .195);
/* tray-rack drawing (A3) on the desk */
const sheet = (() => {
  const c = document.createElement('canvas'); c.width = 1684; c.height = 1191; const g = c.getContext('2d');
  g.fillStyle = '#ece9e1'; g.fillRect(0, 0, c.width, c.height);
  const ink = '#2a3442', thin = '#5b6676';
  g.strokeStyle = ink; g.lineWidth = 4; g.strokeRect(60, 40, 1584, 1111); g.lineWidth = 2; g.strokeRect(40, 20, 1624, 1151);
  const L = (x1, y1, x2, y2, w = 2, col = ink) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
  const Rect = (x, y, w, h, lw = 2.5, fill) => { if (fill) { g.fillStyle = fill; g.fillRect(x, y, w, h); } g.strokeStyle = ink; g.lineWidth = lw; g.strokeRect(x, y, w, h); };
  g.font = '600 30px Helvetica, Arial'; g.fillStyle = ink; g.fillText('SECTION 1–1', 330, 110); g.fillText('PLAN', 1150, 110);
  L(140, 900, 1000, 900, 3); for (let x = 150; x < 1000; x += 28) L(x, 900, x - 18, 924, 1.5, thin);
  [320, 820].forEach(x => { Rect(x - 14, 220, 28, 680, 3, '#d9d5cb'); Rect(x - 40, 890, 80, 10, 2); });
  L(334, 640, 806, 880, 1.8, thin); L(806, 640, 334, 880, 1.8, thin);
  [330, 480, 630].forEach((y, k) => {
    Rect(250, y, 640, 16, 2.5, '#cfcabe');
    [0, 1, 2].forEach(j => { const x = 300 + j * 190; Rect(x, y - 34, 150, 34, 2); for (let n = 0; n < 6 - k; n++) { g.beginPath(); g.arc(x + 16 + n * 22, y - 11, 9, 0, Math.PI * 2); g.lineWidth = 1.4; g.stroke(); } });
  });
  const dim = (x, y1, y2, t) => { L(x, y1, x, y2, 1.5, thin); L(x - 10, y1 + 10, x + 10, y1 - 10, 2, thin); L(x - 10, y2 + 10, x + 10, y2 - 10, 2, thin); g.save(); g.translate(x - 12, (y1 + y2) / 2); g.rotate(-Math.PI / 2); g.font = '24px Helvetica, Arial'; g.fillStyle = ink; g.textAlign = 'center'; g.fillText(t, 0, 0); g.restore(); };
  dim(950, 330, 480, '600'); dim(950, 480, 630, '600'); dim(950, 630, 900, '2150'); dim(1000, 220, 900, '3600');
  L(320, 180, 820, 180, 1.5, thin); L(310, 190, 330, 170, 2, thin); L(810, 190, 830, 170, 2, thin); g.font = '24px Helvetica, Arial'; g.textAlign = 'center'; g.fillText('6000', 570, 170); g.textAlign = 'left';
  for (let i = 0; i < 4; i++) { const x = 1120 + i * 130; Rect(x - 12, 160, 24, 24, 2, '#cfcabe'); Rect(x - 12, 680, 24, 24, 2, '#cfcabe'); L(x, 196, x, 668, 1.2, thin); }
  [250, 380, 510].forEach(y => { Rect(1090, y, 450, 80, 2); for (let x = 1100; x < 1540; x += 30) L(x, y + 4, x, y + 76, 1, thin); });
  Rect(1124, 860, 520, 271, 3); [910, 960, 1010, 1060].forEach(y => L(1124, y, 1644, y, 1.5)); L(1300, 860, 1300, 1131, 1.5);
  g.font = '22px Helvetica, Arial'; g.fillStyle = ink;
  ['Project', 'Part', 'Scale', 'Sheet', 'bracketBIM'].forEach((t, i) => g.fillText(t, 1140, 893 + i * 50));
  ['Cable rack T1–T4', 'Cable supports', '1:50', '1 / 3', 'PML Console'].forEach((t, i) => g.fillText(t, 1316, 893 + i * 50));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = R.capabilities.getMaxAnisotropy(); return t;
})();
const paper = add(new THREE.Mesh(new THREE.BoxGeometry(.42, .0012, .297), [DM.mat, DM.mat, std({map: sheet, color: 0x76736d, roughness: 1, envMapIntensity: .25}), DM.mat, DM.mat, DM.mat]));
paper.material[0] = paper.material[1] = paper.material[3] = paper.material[4] = paper.material[5] = std({color: 0x6f6c66, roughness: 1});
paper.position.set(-.64, TOP + .0012, .14); paper.rotation.y = .12;
const pencil = add(new THREE.Mesh(new THREE.CylinderGeometry(.0036, .0036, .17, 6), std({color: 0xf5b83d, roughness: .45})));
pencil.rotation.set(Math.PI / 2, 0, .9); pencil.position.set(-.5, TOP + .0045, .27);
/* laptop on a stand, right of the monitor, showing the bracketBIM home page */
const home = (() => {
  const c = document.createElement('canvas'); c.width = 1440; c.height = 900; const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const paint = img => {
    g.fillStyle = '#0b0c0f'; g.fillRect(0, 0, 1440, 900);
    g.fillStyle = '#e8e6e1'; g.font = '600 26px Helvetica, Arial'; g.fillText('bracket', 64, 58); g.fillStyle = '#f5b83d'; g.fillText('BIM', 64 + g.measureText('bracket').width, 58);
    g.fillStyle = '#9a978f'; g.font = '20px Helvetica, Arial'; ['Cable supports', 'How it works', 'Tools', 'Guide', 'Tested'].forEach((n, i) => g.fillText(n, 520 + i * 150, 56));
    g.strokeStyle = '#f5b83d'; g.lineWidth = 2; g.strokeRect(1270, 32, 110, 38); g.fillStyle = '#f5b83d'; g.fillText('Follow', 1294, 58);
    g.fillStyle = '#1a1c21'; g.fillRect(64, 130, 470, 38); g.fillStyle = '#f5b83d'; g.font = '600 16px Helvetica, Arial'; g.fillText('NEW', 80, 155); g.fillStyle = '#c9c6bf'; g.font = '17px Helvetica, Arial'; g.fillText('Cable supports along tray routes — automatically', 130, 155);
    g.fillStyle = '#f2f0eb'; g.font = '600 68px Helvetica, Arial'; g.fillText('AVEVA E3D automation,', 64, 260); g.fillStyle = '#f5b83d'; g.fillText('tested, not guessed.', 64, 340);
    g.fillStyle = '#9a978f'; g.font = '22px Helvetica, Arial'; g.fillText('PML Console turns an export of your cable trays into cable supports,', 64, 400); g.fillText('checks and ready PML — in under a second.', 64, 432);
    g.fillStyle = '#f5b83d'; g.fillRect(64, 470, 230, 52); g.fillStyle = '#0b0c0f'; g.font = '600 19px Helvetica, Arial'; g.fillText('Follow on Telegram', 84, 503);
    g.strokeStyle = '#3a3d44'; g.strokeRect(312, 470, 210, 52); g.fillStyle = '#e8e6e1'; g.fillText('See how it works', 334, 503);
    if (img) { const w = 1312, h = w * img.height / img.width; g.save(); g.beginPath(); g.rect(64, 570, w, 330); g.clip(); g.drawImage(img, 64, 570, w, h); g.restore(); g.strokeStyle = '#2a2d33'; g.strokeRect(64, 570, w, h); }
    t.needsUpdate = true;
  };
  paint(); const im = new Image(); im.onload = () => { paint(im); draw(); }; im.src = 'assets/app-knk-full.webp';
  return t;
})();
const LT = new THREE.Group(); LT.position.set(.74, TOP, .02); LT.rotation.y = -.42; S.add(LT);
[-.11, .11].forEach(x => { const leg = box(.012, .07, .19, M.alu, x, .03, 0, LT); leg.rotation.x = .22; });
const LB = new THREE.Group(); LB.position.set(0, .066, 0); LB.rotation.x = .22; LT.add(LB);
rb(.32, .014, .22, .005, M.alu, 0, .007, 0, LB);
box(.28, .001, .095, M.dark, 0, .0145, -.03, LB);
box(.1, .001, .06, M.dark, 0, .0145, .07, LB);
const LH = new THREE.Group(); LH.position.set(0, .014, -.108); LH.rotation.x = -1.95; LB.add(LH);
rb(.32, .006, .215, .004, M.alu, 0, .003, .1075, LH);
const lscr = new THREE.Mesh(new THREE.PlaneGeometry(.296, .185), new THREE.MeshBasicMaterial({map: home, toneMapped: false, color: 0xd8d8d8}));
lscr.rotation.x = Math.PI / 2; lscr.position.set(0, -.0006, .11); LH.add(lscr);
const lbz = new THREE.Mesh(new THREE.PlaneGeometry(.314, .209), std({color: 0x07080a, roughness: .25})); lbz.rotation.x = Math.PI / 2; lbz.position.set(0, -.0003, .1075); LH.add(lbz);
const lglow = new THREE.PointLight(0xb8c6ff, .5, 1.2, 2); lglow.position.set(.6, TOP + .2, .2); S.add(lglow);
/* cables: keyboard + two from the monitor, through a grommet, down to the floor */
const tube = (pts, r) => add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), 96, r, 10), DM.cable));
const GX = .06, GZ = -.33;
const grom = add(new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .004, 32), M.dark)); grom.position.set(GX, TOP + .001, GZ);
tube([[-.04, TOP + .01, .1], [-.05, TOP + .004, .03], [-.14, TOP + .003, -.08], [-.1, TOP + .003, -.24], [GX - .012, TOP + .004, GZ], [GX - .012, TOP - .2, GZ - .02], [GX - .03, .02, -.42]], .0025);
[0, .018].forEach(d => tube([[.03 + d, SY - .12, SZ - .07], [.03 + d, SY - .3, SZ - .118], [.025 + d, TOP + .2, SZ - .118], [.04 + d, TOP + .006, SZ - .16], [GX + d * .5, TOP + .004, GZ + .01], [GX + d * .5, TOP - .25, GZ - .02], [.25 + d, .012, -.5], [.9, .012, -.62]], .0032));
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
const key = new THREE.SpotLight(0xfff0d8, 75, 18, .5, .85, 1.6); key.position.set(3.2, 6.5, 3.2); key.target.position.set(-.4, 1.8, -2);
key.castShadow = true; key.shadow.mapSize.set(SMALL ? 1024 : 2048, SMALL ? 1024 : 2048); key.shadow.bias = -.0003; key.shadow.radius = 4; S.add(key, key.target);
const wash = new THREE.SpotLight(0xf5b83d, 28, 12, .9, 1, 1.4); wash.position.set(-1, 5.5, WALLZ + 2.6); wash.target.position.set(-1, 2.2, WALLZ); S.add(wash, wash.target);
const rim = new THREE.PointLight(0xf5b83d, 5, 9, 2); rim.position.set(-4, 3.4, WALLZ + 1.2); S.add(rim);
const cool = new THREE.PointLight(0x7aa7ff, 4, 9, 2); cool.position.set(4.5, 2.4, WALLZ + 1.4); S.add(cool);

/* ---------- post: bloom ---------- */
const CO = new EffectComposer(R);
CO.addPass(new RenderPass(S, C));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .45, .6, .92); CO.addPass(bloom);
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
  bloom.strength = lerp(.2, .38, clamp(P * 2));
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
