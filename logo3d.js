/* The [b] sign in 3D — particle assembly, then metal.
   1) ~9 000 particles swirl in from a wide vortex and settle into the volume of the sign (brackets amber, b light);
   2) the particles dissolve upwards while the solid metal sign fades in; a light sweeps across it (a glint);
   3) the sign floats and follows the pointer; a sparse amber dust drifts around it.
   Replays every time the sign comes back into view. Shapes: video-src/brand-kit.html (box 0..292 × 0..220).
   The previous version (parts flying in, rings, smoke) — video-src/_old/logo3d-parts-rings.js. */
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

const cv = document.getElementById('logo-cv'); if (!cv) throw 0;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SMALL = innerWidth < 760;
const R = new THREE.WebGLRenderer({canvas: cv, antialias: true, alpha: true});
R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.toneMapping = THREE.ACESFilmicToneMapping;
const S = new THREE.Scene();
S.environment = new THREE.PMREMGenerator(R).fromScene(new RoomEnvironment(R), .04).texture;
const C = new THREE.PerspectiveCamera(30, 1, .1, 100); C.position.set(0, 0, 12);
const dl = new THREE.DirectionalLight(0xffffff, 1.2); dl.position.set(3, 4, 5); S.add(dl);
const warm = new THREE.PointLight(0xf5b83d, 22, 20); warm.position.set(-4, -2, 4); S.add(warm);
const sweep = new THREE.PointLight(0xffffff, 0, 6, 1.5); S.add(sweep);           // the glint that crosses the sign

/* ---------- solid sign ---------- */
const amber = new THREE.MeshPhysicalMaterial({color: 0xf5b83d, metalness: .8, roughness: .22, clearcoat: .7, clearcoatRoughness: .15, transparent: true, opacity: 0});
const ink = new THREE.MeshPhysicalMaterial({color: 0xf2f0ea, metalness: .1, roughness: .3, clearcoat: .9, transparent: true, opacity: 0});
const K = 1 / 50, D = .55, SC = 1.1, cx = 146, cy = 110, OX = 14;
const rect = (x, y, w, h) => { const s = new THREE.Shape(); s.moveTo(x, y); s.lineTo(x + w, y); s.lineTo(x + w, y + h); s.lineTo(x, y + h); s.closePath(); return s; };
const ext = (shapes, mat, bevel = .035) => { const g = new THREE.ExtrudeGeometry(shapes, {depth: D, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * .7, bevelSegments: 4, curveSegments: 48});
  g.translate(0, 0, -D / 2); return new THREE.Mesh(g, mat); };
/* bracket parts in SVG units (spine, two arms, two lips); the right bracket is mirrored to x 237 */
const BR = [[0, 0, 22, 200], [22, 0, 28, 20], [22, 180, 28, 20], [38, 20, 12, 22], [38, 158, 12, 22]];
const svgRects = [];
[false, true].forEach(mir => BR.forEach(([x, y, w, h]) => { const X = v => mir ? 237 + (50 - v) * SC : v * SC;
  const x0 = Math.min(X(x), X(x + w)), x1 = Math.max(X(x), X(x + w)); svgRects.push([x0, y * SC, x1 - x0, h * SC]); }));
const toShape = ([x, y, w, h]) => rect((x - cx) * K, (cy - y - h) * K, w * K, h * K);
const G = new THREE.Group(); S.add(G);
const brackets = ext(svgRects.map(toShape), amber); G.add(brackets);
const bShape = (() => { const stem = rect((96 + OX - cx) * K, (cy - 172) * K, 30 * K, 150 * K);
  const bowl = new THREE.Shape(); bowl.absarc((150 + OX - cx) * K, (cy - 118) * K, 55 * K, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absarc((150 + OX - cx) * K, (cy - 118) * K, 27 * K, 0, Math.PI * 2, true); bowl.holes.push(hole); return [stem, bowl]; })();
const bMesh = ext(bShape, ink, .05); G.add(bMesh);

/* ---------- particle targets: sample the sign on a canvas, give each point a depth inside the extrusion ---------- */
const N = SMALL ? 5000 : 9000;
const mask = (() => { const c = document.createElement('canvas'); c.width = 292 * 2; c.height = 220 * 2; const x = c.getContext('2d'); x.scale(2, 2);
  x.fillStyle = '#f00'; svgRects.forEach(r => x.fillRect(...r));
  x.fillStyle = '#0f0'; x.fillRect(96 + OX, 22, 30, 150); x.beginPath(); x.arc(150 + OX, 118, 55, 0, Math.PI * 2); x.arc(150 + OX, 118, 27, 0, Math.PI * 2, true); x.fill('evenodd');
  return x.getImageData(0, 0, c.width, c.height); })();
const pix = []; for (let y = 0; y < mask.height; y++) for (let x = 0; x < mask.width; x++) { const i = (y * mask.width + x) * 4; if (mask.data[i] > 128 || mask.data[i + 1] > 128) pix.push([x / 2, y / 2, mask.data[i + 1] > 128 ? 1 : 0]); }
const aT = new Float32Array(N * 3), aS = new Float32Array(N * 3), aR = new Float32Array(N * 4);
for (let i = 0; i < N; i++) {
  const p = pix[(Math.random() * pix.length) | 0];
  aT.set([(p[0] - cx) * K, (cy - p[1]) * K, (Math.random() - .5) * D], i * 3);
  const a = Math.random() * Math.PI * 2, r = 4.5 + Math.random() * 4, h = (Math.random() - .5) * 6;
  aS.set([Math.cos(a) * r, h, Math.sin(a) * r - 1], i * 3);
  aR.set([Math.random(), Math.random(), Math.random(), p[2]], i * 4);       // delay, swirl, size, is-b
}
const pg = new THREE.BufferGeometry();
pg.setAttribute('position', new THREE.BufferAttribute(aT, 3)); pg.setAttribute('aStart', new THREE.BufferAttribute(aS, 3)); pg.setAttribute('aRnd', new THREE.BufferAttribute(aR, 4));
const pm = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: {uT: {value: 0}, uPx: {value: R.getPixelRatio()}, uOut: {value: 0}},
  vertexShader: `
    attribute vec3 aStart; attribute vec4 aRnd; uniform float uT; uniform float uPx; uniform float uOut;
    varying float vA; varying float vB;
    float eo(float t){ return 1.0 - pow(1.0 - t, 3.0); }
    void main(){
      float k = clamp((uT - aRnd.x * .55) / 1.35, 0.0, 1.0), e = eo(k);
      float ang = (1.0 - e) * (2.2 + aRnd.y * 2.5);
      vec3 s = aStart; s.xz = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * s.xz;
      vec3 p = mix(s, position, e);
      p += (1.0 - e) * vec3(sin(uT * 3.0 + aRnd.y * 20.0), cos(uT * 2.0 + aRnd.x * 17.0), 0.0) * .25;
      p.y += uOut * (.6 + aRnd.z); p.x += uOut * (aRnd.y - .5) * .6;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = (1.2 + aRnd.z * 1.8) * uPx * (11.0 / -mv.z) * (1.0 + (1.0 - e) * .8);
      vA = (.25 + .75 * e) * (1.0 - uOut); vB = aRnd.w;
    }`,
  fragmentShader: `
    varying float vA; varying float vB;
    void main(){ vec2 c = gl_PointCoord - .5; float d = length(c); if (d > .5) discard;
      float a = smoothstep(.5, .0, d) * vA;
      vec3 col = mix(vec3(1.0, .72, .24), vec3(1.0, .96, .9), vB);
      gl_FragColor = vec4(col * a, a); }`,
});
const parts = new THREE.Points(pg, pm); G.add(parts);

/* sparse amber dust around the sign */
const DN = 260, dp = new Float32Array(DN * 3); for (let i = 0; i < DN; i++) dp.set([(Math.random() - .5) * 11, (Math.random() - .5) * 5, (Math.random() - .5) * 4 - 1], i * 3);
const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
const dust = new THREE.Points(dg, new THREE.PointsMaterial({color: 0xf5b83d, size: .035, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending}));
S.add(dust);

const clamp = (v, a = 0, z = 1) => Math.min(z, Math.max(a, v)), eo = t => 1 - Math.pow(1 - t, 3);
let t0 = null, mx = 0, my = 0, vis = false;
function frame(now){
  if (!vis) return;
  if (t0 === null) t0 = now + 350;
  const t = RM ? 10 : (now - t0) / 1000;
  pm.uniforms.uT.value = Math.max(0, t);
  const solid = eo(clamp((t - 1.55) / .7));
  amber.opacity = ink.opacity = solid; amber.depthWrite = ink.depthWrite = solid > .98;
  brackets.scale.setScalar(1 + (1 - solid) * .03); bMesh.scale.setScalar(1 + (1 - solid) * .03);
  pm.uniforms.uOut.value = eo(clamp((t - 1.7) / 1.1)); parts.visible = t < 3;
  const sw = clamp((t - 2.0) / 1.0); sweep.intensity = 40 * Math.sin(sw * Math.PI); sweep.position.set(-4 + 8 * sw, 1.2 - sw * 1.6, 2.2);
  dust.material.opacity = .5 * clamp((t - 1.8) / 1.5); dust.rotation.y = t * .03; dust.position.y = Math.sin(t * .4) * .1;
  const settle = clamp((t - 2.2) / 1.2);
  G.rotation.y += ((mx * .7 + Math.sin(t * .6) * .2) * settle + (1 - settle) * (1 - eo(clamp(t / 2))) * .9 - G.rotation.y) * .06;
  G.rotation.x += ((my * .4 + Math.cos(t * .5) * .07) * settle - G.rotation.x) * .06;
  G.position.y = Math.sin(t * 1.1) * .07 * settle;
  R.render(S, C); requestAnimationFrame(frame);
}
function size(){ const w = cv.clientWidth, h = cv.clientHeight; R.setSize(w, h, false); C.aspect = w / h; C.updateProjectionMatrix(); pm.uniforms.uPx.value = R.getPixelRatio(); }
addEventListener('resize', size); size();
addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
new IntersectionObserver(es => es.forEach(e => {
  const was = vis; vis = e.intersectionRatio >= .5;
  if (vis && !was) { t0 = null; requestAnimationFrame(frame); }
}), {threshold: [0, .5, 1]}).observe(cv);
