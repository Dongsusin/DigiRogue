import * as THREE from 'three'

// Full-screen procedural backdrops for the signature evolution scenes. Being computed per
// pixel they stay sharp at any resolution, unlike the earlier canvas-texture cylinder.
export const BACKDROP_KINDS = ['stripes', 'helix', 'grid', 'code', 'sun', 'heaven', 'void', 'glitch', 'prism', 'cathedral', 'inferno', 'celestial', 'abyss', 'blueprint', 'bloom']

const vertexShader = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.9999, 1.0);
}
`

const fragmentShader = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform float uTime, uCharge, uReveal, uFlash, uAspect, uSpin, uMotion;
uniform int uKind;
uniform vec3 uA, uB, uC;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
vec3 hue(float h) { return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

// Adventure / Super Rumble: layered ribbons of light streaming diagonally past the partner.
vec3 stripes(vec2 p, float t) {
  vec3 col = vec3(0.008, 0.01, 0.03);
  float speed = 0.35 + uCharge * 2.2;
  for (int l = 0; l < 4; l++) {
    float fl = float(l);
    float depth = 1.0 - fl * 0.22;
    vec2 q = rot(0.66 + fl * 0.035) * (p + vec2(uSpin * (0.12 + fl * 0.06), 0.0));
    float x = q.x * (5.0 + fl * 4.5) + fl * 3.7;
    float id = floor(x), fx = fract(x);
    float h = hash(vec2(id, fl));
    float w = 0.18 + 0.62 * hash(vec2(id, fl + 7.0));
    float band = smoothstep(0.0, 0.05, fx) * smoothstep(w, w - 0.05, fx);
    float flow = 0.5 + 0.5 * sin(q.y * (2.0 + h * 5.0) - t * speed * (3.0 + h * 7.0) + h * 40.0);
    float shimmer = 0.75 + 0.25 * noise(vec2(id * 3.1, q.y * 6.0 - t * speed * 6.0));
    vec3 c = mix(hue(h + t * 0.02), h > 0.55 ? uA : uB, 0.3);
    col += c * band * (0.25 + 0.75 * flow) * shimmer * (0.22 + 0.22 * depth);
    float core = exp(-pow((fx - w * 0.5) / (0.012 + w * 0.02), 2.0));
    col += mix(c, vec3(1.0), 0.7) * core * band * flow * 0.55 * depth;
  }
  // fine sparkling dust riding the stream
  vec2 g = rot(0.66) * p * 90.0; g.y -= t * speed * 18.0;
  float s = hash(floor(g));
  col += vec3(1.0) * step(0.985, s) * smoothstep(0.45, 0.0, length(fract(g) - 0.5)) * 0.9;
  return col;
}

// Jogress: a deep nebula with a two-coloured spiral pulling toward the centre.
vec3 helix(vec2 p, float t) {
  float r = length(p), a = atan(p.y, p.x);
  vec2 q = p * 1.6 + vec2(uSpin * 0.2, 0.0);
  float n1 = fbm(q * 1.4 + vec2(t * 0.03, -t * 0.02));
  float n2 = fbm(q * 2.6 - vec2(t * 0.05, 0.0) + n1 * 1.5);
  vec3 col = vec3(0.004, 0.006, 0.025);
  col += mix(uA, uB, smoothstep(0.3, 0.7, n1)) * pow(n2, 2.6) * 1.1;
  float arms = sin(a * 2.0 + r * 9.0 - t * (1.5 + uCharge * 5.0));
  col += mix(uA, uB, step(0.0, sin(a + r * 4.5 - t))) * pow(max(arms, 0.0), 6.0) * smoothstep(1.3, 0.1, r) * (0.15 + uCharge * 0.9);
  for (int l = 0; l < 2; l++) {
    vec2 g = (p + vec2(uSpin * 0.05 * float(l + 1), 0.0)) * (70.0 + float(l) * 60.0);
    float s = hash(floor(g) + float(l) * 17.0);
    float tw = 0.5 + 0.5 * sin(t * 3.0 + s * 60.0);
    col += vec3(0.8, 0.9, 1.0) * step(0.993, s) * smoothstep(0.5, 0.0, length(fract(g) - 0.5)) * tw;
  }
  return col;
}

// Tamers: a digital lattice receding to a horizon, with binary columns behind.
vec3 grid(vec2 p, float t) {
  vec3 col = vec3(0.0, 0.012, 0.01);
  float horizon = 0.04;
  float dy = abs(p.y - horizon);
  float z = 0.45 / max(dy, 0.002);
  vec2 g = vec2((p.x + uSpin * 0.25) * z, z + t * (1.0 + uCharge * 6.0));
  vec2 f = abs(fract(g - 0.5) - 0.5);
  vec2 gw = fwidth(g) * 1.5 + 0.004;
  vec2 lg = 1.0 - smoothstep(vec2(0.0), gw, f);
  float line = max(lg.x, lg.y);
  float fade = smoothstep(18.0, 1.5, z) * smoothstep(0.0, 0.05, dy);
  col += uA * line * fade * 1.6;
  col += uA * exp(-dy * 22.0) * 0.6;
  // background code columns
  vec2 cell = vec2(floor(p.x * 70.0), 0.0);
  float sp = 0.3 + hash(cell) * 0.9;
  float yy = p.y * 30.0 + t * sp * 8.0;
  float on = step(0.55, hash(vec2(cell.x, floor(yy))));
  float tail = fract(-yy * 0.05 + hash(cell) * 10.0);
  col += mix(uB, uA, 0.5) * on * pow(tail, 6.0) * smoothstep(0.5, 0.0, abs(fract(p.x * 70.0) - 0.5)) * 0.35 * smoothstep(0.0, 0.3, p.y - horizon);
  return col;
}

// Frontier: cascading fractal code drawn as crisp 0/1 glyphs in three depth layers.
vec3 code(vec2 p, float t) {
  vec3 col = vec3(0.01, 0.005, 0.0);
  for (int l = 0; l < 3; l++) {
    float fl = float(l);
    float scale = 26.0 + fl * 18.0;
    vec2 q = (p + vec2(uSpin * (0.1 + fl * 0.05), 0.0)) * scale;
    float colId = floor(q.x);
    float speed = (0.6 + hash(vec2(colId, fl)) * 1.8) * (1.0 + uCharge * 3.0);
    q.y += t * speed * 4.0;
    vec2 id = floor(q), f = fract(q) - 0.5;
    float lead = fract(-id.y * 0.035 + hash(vec2(colId, fl + 3.0)) * 7.0 + t * speed * 0.14);
    float bright = pow(lead, 5.0);
    float glyph = hash(id + floor(t * 6.0 * hash(id)));
    float one = smoothstep(0.08, 0.04, abs(f.x)) * step(abs(f.y), 0.36);
    float zero = smoothstep(0.07, 0.03, abs(length(f * vec2(1.6, 1.0)) - 0.32));
    float shape = glyph > 0.5 ? one : zero;
    float depth = 1.0 - fl * 0.3;
    col += mix(uA, vec3(1.0), bright * 0.7) * shape * (0.06 + bright) * depth * step(0.25, hash(vec2(colId, fl + 9.0)));
  }
  return col;
}

// Savers: a blazing corona with rotating rays and rolling heat.
vec3 sun(vec2 p, float t) {
  vec2 c = p - vec2(0.0, -0.05);
  float r = length(c), a = atan(c.y, c.x);
  float turb = fbm(vec2(a * 2.5, r * 3.0 - t * (0.8 + uCharge * 2.5)));
  float rays = pow(abs(sin(a * 11.0 + t * 0.35 + turb * 3.0)), 10.0);
  float flame = fbm(vec2(p.x * 3.0, p.y * 2.5 - t * (1.2 + uCharge * 2.0)));
  vec3 col = mix(uC * 0.08, uA * 0.55, smoothstep(1.2, 0.0, r));
  col += mix(uA, uB, rays) * rays * smoothstep(1.4, 0.15, r) * (0.35 + uCharge * 0.8);
  col += uA * pow(flame, 3.0) * 1.2 * smoothstep(0.9, -0.6, p.y);
  col += uB * exp(-r * r * 9.0) * (0.15 + uCharge * 0.25);
  return col;
}

// Holy: god rays from above through slow, luminous clouds.
vec3 heaven(vec2 p, float t) {
  vec2 o = p - vec2(uSpin * 0.1, 0.95);
  float a = atan(o.x, -o.y);
  float rays = pow(abs(sin(a * 9.0 + sin(t * 0.2) * 0.4)), 5.0) * smoothstep(2.2, 0.0, length(o));
  float clouds = fbm(p * vec2(1.6, 3.0) + vec2(t * 0.04, 0.0));
  vec3 col = mix(vec3(0.05, 0.03, 0.08), uA * 0.7, smoothstep(-0.7, 0.8, p.y));
  col += uB * pow(clouds, 2.0) * 0.7;
  col += mix(uA, vec3(1.0), 0.6) * rays * (0.35 + uCharge * 0.5);
  vec2 g = p * 60.0; g.y += t * 2.0;
  col += vec3(1.0, 0.95, 0.8) * step(0.99, hash(floor(g))) * smoothstep(0.5, 0.0, length(fract(g) - 0.5));
  return col;
}

// Dark: churning violet smoke split by red lightning.
vec3 voidKind(vec2 p, float t) {
  vec2 q = p * 1.8 + vec2(uSpin * 0.2, 0.0);
  float smoke = fbm(q + vec2(fbm(q + t * 0.12), fbm(q - t * 0.1)) * 1.6);
  vec3 col = mix(vec3(0.01, 0.0, 0.02), uA * 0.5, pow(smoke, 2.2));
  // Thin jagged bolts that re-strike a few times a second.
  float strike = floor(t * 4.0);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float seed = hash(vec2(strike, fi));
    if (seed < 0.35) continue;
    float x0 = (hash(vec2(strike, fi + 5.0)) - 0.5) * uAspect * 0.9;
    float jag = (fbm(vec2(p.y * 6.0, seed * 40.0)) - 0.5) * 0.35 + (noise(vec2(p.y * 40.0, seed * 9.0)) - 0.5) * 0.04;
    float d = abs(p.x - x0 - jag * (0.6 + p.y));
    float life = 1.0 - fract(t * 4.0);
    col += mix(uB, vec3(1.0), 0.6) * (exp(-d * 260.0) * 1.4 + exp(-d * 30.0) * 0.25) * life * (0.5 + uCharge);
  }
  return col;
}

// X-antibody: continuous DNA double helices, a soft green haze and a pulsing X sigil.
// No row tearing: the image flows instead of breaking into bands.
vec3 glitchKind(vec2 p, float t) {
  float wob = (noise(vec2(p.y * 5.0, t * 1.2)) - 0.5) * 0.018 * (0.5 + uCharge);
  vec2 q = p + vec2(wob, 0.0);
  vec3 col = vec3(0.0, 0.012, 0.006) + code(q * 0.8, t) * 0.22;
  col += uA * pow(fbm(q * 1.6 + vec2(0.0, -t * 0.12)), 3.0) * 0.4;
  for (int s = 0; s < 2; s++) {
    float cx = (s == 0 ? -1.0 : 1.0) * uAspect * 0.36;
    float ph = q.y * 7.0 - t * 2.2 + float(s) * 1.3;
    float x1 = cx + sin(ph) * 0.085, x2 = cx - sin(ph) * 0.085;
    float front = 0.5 + 0.5 * cos(ph);
    float d1 = abs(q.x - x1), d2 = abs(q.x - x2);
    col += uA * (exp(-d1 * 220.0) * (0.45 + 0.75 * front) + exp(-d1 * 28.0) * 0.07);
    col += uB * (exp(-d2 * 220.0) * (0.45 + 0.75 * (1.0 - front)) + exp(-d2 * 28.0) * 0.05);
    // rungs: thin lines between the strands every quarter turn
    float fy = abs(fract(ph / 1.5708) - 0.5) * (1.5708 / 7.0);
    float inside = smoothstep(0.004, 0.0, max(min(x1, x2) - q.x, q.x - max(x1, x2)));
    col += mix(uA, uB, 0.5) * exp(-fy * 900.0) * inside * 0.45;
  }
  float d = min(abs(q.x * 0.75 - q.y), abs(q.x * 0.75 + q.y));
  float pulse = 0.5 + 0.5 * sin(t * 2.0);
  col += uA * (exp(-d * 60.0) * 0.5 + exp(-d * 9.0) * 0.08) * smoothstep(0.85, 0.1, length(q)) * (0.25 + uCharge * 0.6 + pulse * 0.15);
  col *= 0.94 + 0.06 * sin(vUv.y * 900.0);
  return col;
}

// Royal Knights / Olympos: pointed stained-glass windows and god rays.
vec3 cathedral(vec2 p, float t) {
  vec2 q = p + vec2(uSpin * 0.12, 0.0);
  vec3 col = vec3(0.012, 0.01, 0.025);
  float cw = 0.36;
  float lx = (fract(q.x / cw) - 0.5) * cw;
  float hw = 0.105;
  float body = step(abs(lx), hw) * step(-0.28, q.y) * step(q.y, 0.18);
  float arch = step(length(vec2(lx + hw, q.y - 0.18)), 2.0 * hw) * step(length(vec2(lx - hw, q.y - 0.18)), 2.0 * hw) * step(0.18, q.y);
  float window = max(body, arch);
  vec2 pane = floor(vec2(lx, q.y) * vec2(28.0, 13.0) + floor(q.x / cw) * 7.0);
  float h = hash(pane);
  vec3 glass = mix(mix(uA, uB, h), hue(h + 0.08), 0.35);
  vec2 cell = fract(vec2(lx, q.y) * vec2(28.0, 13.0));
  float lead = smoothstep(0.08, 0.0, min(min(cell.x, 1.0 - cell.x), min(cell.y, 1.0 - cell.y)));
  float shimmer = 0.6 + 0.4 * sin(t * 1.5 + h * 20.0);
  col += window * glass * (1.0 - lead * 0.85) * shimmer * (0.32 + uCharge * 0.35);
  vec2 o = p - vec2(0.0, 1.0);
  float rays = pow(abs(sin(atan(o.x, -o.y) * 10.0 + sin(t * 0.25) * 0.5)), 6.0) * smoothstep(1.8, 0.2, length(o));
  col += mix(uA, vec3(1.0), 0.6) * rays * (0.18 + uCharge * 0.3);
  vec2 g = p * 70.0; g += vec2(sin(t * 0.3) * 3.0, -t * 1.5);
  col += vec3(1.0, 0.95, 0.8) * step(0.992, hash(floor(g))) * smoothstep(0.5, 0.0, length(fract(g) - 0.5)) * 0.8;
  return col;
}

// Demon Lords: hellfire licking up from below, embers and smoke.
vec3 inferno(vec2 p, float t) {
  float n = fbm(vec2(p.x * 3.0, p.y * 2.2 - t * 1.6)) + 0.5 * fbm(vec2(p.x * 6.0 + 3.0, p.y * 4.0 - t * 2.6));
  float h = n * 1.2 - (p.y + 0.62) * 1.6 + uCharge * 0.2;
  vec3 col = mix(vec3(0.012, 0.0, 0.004), uA * 0.16, smoothstep(-0.45, 0.0, h));
  col = mix(col, uA * 0.9, smoothstep(0.0, 0.5, h));
  col = mix(col, mix(uB, vec3(1.0, 0.9, 0.6), 0.5), smoothstep(0.5, 1.0, h));
  col += uA * pow(fbm(p * 2.0 + vec2(t * 0.05, -t * 0.1)), 4.0) * 0.1 * smoothstep(-0.2, 0.6, p.y);
  vec2 g = p * 45.0; g.y -= t * 4.0; g.x += sin(g.y * 0.2 + t) * 0.6;
  float s = hash(floor(g));
  col += mix(uA, uB, s) * step(0.985, s) * smoothstep(0.45, 0.0, length(fract(g) - 0.5)) * smoothstep(0.7, -0.5, p.y) * 1.5;
  return col * 0.85;
}

// Four Holy Beasts: domain-warped clouds and a slowly turning celestial dial.
vec3 celestial(vec2 p, float t) {
  vec2 q = rot(t * 0.03) * p * 1.4 + vec2(uSpin * 0.2, 0.0);
  float w = fbm(q * 1.4 + fbm(q * 2.0 + t * 0.06) * 1.6);
  vec3 col = mix(uC * 0.12, uA * 0.42, w * w);
  col += uB * pow(w, 4.0) * 0.55;
  float r = length(p), a = atan(p.y, p.x) + t * 0.12;
  float rings = smoothstep(0.005, 0.0, abs(r - 0.42)) + smoothstep(0.005, 0.0, abs(r - 0.47)) + smoothstep(0.004, 0.0, abs(r - 0.64));
  float ticks = smoothstep(0.85, 0.95, fract(a * 24.0 / 6.2831)) * step(abs(r - 0.445), 0.022);
  float marks = smoothstep(0.9, 1.0, fract(-a * 8.0 / 6.2831)) * step(abs(r - 0.6), 0.03);
  col += mix(uA, vec3(1.0, 0.92, 0.7), 0.55) * (rings + ticks + marks) * (0.3 + uCharge * 0.6);
  return col;
}

// Deep sea: caustics from the surface, light shafts and rising bubbles.
vec3 abyss(vec2 p, float t) {
  vec3 col = mix(uC * 0.35, uA * 0.32, smoothstep(-0.7, 0.7, p.y));
  vec2 c = p * 5.0 + vec2(uSpin * 0.6, 0.0);
  float caustic = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    c += vec2(sin(c.y * 1.3 + t * (0.6 + fi * 0.2)), cos(c.x * 1.1 - t * (0.5 + fi * 0.15))) * 0.35;
    caustic += pow(0.5 + 0.5 * sin(c.x + c.y), 10.0);
  }
  col += uB * caustic * 0.16 * smoothstep(-0.3, 0.6, p.y);
  float shafts = pow(abs(sin(p.x * 7.0 + p.y * 1.6 + sin(t * 0.3) * 0.8)), 14.0) * smoothstep(-0.5, 0.6, p.y);
  col += uB * shafts * 0.18;
  for (int l = 0; l < 2; l++) {
    vec2 g = p * (14.0 + float(l) * 10.0); g.y -= t * (1.2 + float(l) * 0.8); g.x += sin(g.y * 0.5 + float(l)) * 0.3;
    vec2 id = floor(g), f = fract(g) - 0.5;
    float b = step(0.93, hash(id + float(l) * 9.0));
    float ring = smoothstep(0.03, 0.0, abs(length(f) - 0.18)) + smoothstep(0.1, 0.0, length(f - vec2(-0.06, 0.06))) * 0.6;
    col += vec3(0.85, 0.95, 1.0) * b * ring * 0.5;
  }
  return col;
}

// Machines: a living blueprint with turning gears and a scan line.
float gear(vec2 p, float r, float teeth, float a) {
  float ang = atan(p.y, p.x) + a;
  float edge = r + 0.025 * step(0.5, fract(ang * teeth / 6.2831));
  return smoothstep(0.004, 0.0, abs(length(p) - edge)) + smoothstep(0.004, 0.0, abs(length(p) - r * 0.45));
}
vec3 blueprint(vec2 p, float t) {
  vec2 q = p + vec2(uSpin * 0.15, 0.0);
  vec3 col = uC * 0.55;
  vec2 g1 = q * 24.0, g2 = q * 4.8;
  vec2 f1 = abs(fract(g1 - 0.5) - 0.5) / fwidth(g1), f2 = abs(fract(g2 - 0.5) - 0.5) / fwidth(g2);
  col += uA * (1.0 - min(min(f1.x, f1.y), 1.0)) * 0.12;
  col += uA * (1.0 - min(min(f2.x, f2.y), 1.0)) * 0.3;
  float gears = gear(q - vec2(-0.62, 0.22), 0.16, 12.0, t * 0.4) + gear(q - vec2(-0.4, 0.05), 0.1, 8.0, -t * 0.64)
    + gear(q - vec2(0.62, -0.18), 0.2, 14.0, -t * 0.3) + gear(q - vec2(0.58, 0.26), 0.08, 6.0, t * 0.8);
  col += uB * gears * 0.6;
  float scan = exp(-abs(q.y - (fract(t * 0.25) * 1.6 - 0.8)) * 60.0);
  col += uA * scan * (0.25 + uCharge * 0.5);
  vec2 dash = q * vec2(40.0, 60.0);
  col += uB * step(0.8, hash(floor(dash))) * step(0.3, fract(dash.x)) * step(abs(fract(dash.y) - 0.5), 0.08) * 0.12 * smoothstep(0.2, 0.5, abs(q.x));
  return col;
}

// Plants: soft light, drifting bokeh and falling petals.
vec3 bloom(vec2 p, float t) {
  vec3 col = mix(uC * 0.5, uA * 0.35, smoothstep(-0.8, 0.8, p.y));
  for (int l = 0; l < 2; l++) {
    vec2 g = (p + vec2(uSpin * 0.1 * float(l + 1), 0.0)) * (5.0 + float(l) * 4.0) + vec2(t * 0.1, t * 0.05);
    vec2 id = floor(g), f = fract(g) - 0.5;
    vec2 o = (vec2(hash(id), hash(id + 3.0)) - 0.5) * 0.6;
    float h = hash(id + 11.0);
    col += mix(uA, uB, h) * smoothstep(0.22, 0.15, length(f - o)) * step(0.55, h) * 0.18;
  }
  vec2 g = p * 9.0; g.y += t * 0.7; g.x += sin(g.y * 0.7 + t) * 0.4;
  vec2 id = floor(g), f = fract(g) - 0.5;
  float h = hash(id);
  vec2 pf = rot(t * (h - 0.5) * 3.0 + h * 6.0) * f;
  float petal = smoothstep(0.02, 0.0, length(pf * vec2(1.0, 2.2)) - 0.16);
  col += mix(uA, vec3(1.0), 0.35) * petal * step(0.8, h) * 0.75;
  return col;
}

// Mode change: a crystal forge of shifting facets swept by light, in two depth layers.
vec3 facets(vec2 q, float t, float seed, out float edge) {
  vec2 i = floor(q), f = fract(q);
  float d1 = 8.0, d2 = 8.0, id = 0.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 o = vec2(hash(i + g + seed), hash(i + g + seed + 19.0));
    o = 0.5 + 0.4 * sin(t * 0.4 + 6.2831 * o);
    vec2 r = g + o - f;
    float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; id = hash(i + g + seed + 7.0); } else if (d < d2) { d2 = d; }
  }
  float gap = sqrt(d2) - sqrt(d1);
  edge = 1.0 - smoothstep(0.0, 0.025, gap);
  // each facet catches the light at its own angle
  return vec3(id, smoothstep(0.0, 0.4, gap), 0.0);
}
vec3 prism(vec2 p, float t) {
  vec3 col = vec3(0.0);
  for (int l = 0; l < 2; l++) {
    float fl = float(l);
    float edge;
    vec2 q = p * (6.0 + fl * 5.0) + vec2(uSpin * (0.5 - fl * 0.2), t * 0.05 * (1.0 + fl));
    vec3 cell = facets(q, t, fl * 31.0, edge);
    float sweep = pow(0.5 + 0.5 * sin(p.x * 3.0 + p.y * 2.0 - t * (1.2 + uCharge * 3.0) + cell.x * 3.0), 8.0);
    float depth = 1.0 - fl * 0.55;
    vec3 face = mix(uC * 0.1, uA * 0.32, cell.x) * (0.3 + cell.y * 0.5 + sweep * 1.1);
    col += face * depth;
    col += mix(uA, vec3(1.0), 0.5) * edge * (0.18 + sweep * 0.6 + uCharge * 0.35) * depth;
  }
  return col * 0.7;
}

void main() {
  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
  float t = uTime * uMotion;
  vec3 col;
  if (uKind == 0) col = stripes(p, t) * 0.62;
  else if (uKind == 1) col = helix(p, t);
  else if (uKind == 2) col = grid(p, t);
  else if (uKind == 3) col = code(p, t);
  else if (uKind == 4) col = sun(p, t) * 0.38;
  else if (uKind == 5) col = heaven(p, t) * 0.5;
  else if (uKind == 6) col = voidKind(p, t);
  else if (uKind == 7) col = glitchKind(p, t);
  else if (uKind == 8) col = prism(p, t);
  else if (uKind == 9) col = cathedral(p, t);
  else if (uKind == 10) col = inferno(p, t);
  else if (uKind == 11) col = celestial(p, t);
  else if (uKind == 12) col = abyss(p, t);
  else if (uKind == 13) col = blueprint(p, t);
  else col = bloom(p, t);
  float r = length(p);
  float a = atan(p.y, p.x);
  // Speed lines rushing to the centre while the power gathers.
  float lines = pow(noise(vec2(a * 46.0, r * 3.0 - t * 9.0)), 7.0) * smoothstep(0.18, 0.95, r);
  col += uB * lines * uCharge * 2.2 * uMotion;
  col += uB * exp(-r * r * 7.0) * (0.08 + uCharge * 0.3);
  col *= mix(1.0, 0.55, uReveal * 0.6);
  col *= smoothstep(1.35, 0.25, r * 0.95);
  col = mix(col, vec3(1.0), uFlash * 0.5);
  col += (hash(vUv * 900.0 + fract(t)) - 0.5) * 0.012;
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`

// A backdrop's kind never changes during a scene. Compiling the former uniform
// branch compiled all fifteen backgrounds (including nested Voronoi/noise loops)
// on the first frame. Keep only the selected function and its dependencies.
const backdropCalls = ['stripes(p, t) * 0.62', 'helix(p, t)', 'grid(p, t)', 'code(p, t)', 'sun(p, t) * 0.38',
  'heaven(p, t) * 0.5', 'voidKind(p, t)', 'glitchKind(p, t)', 'prism(p, t)', 'cathedral(p, t)',
  'inferno(p, t)', 'celestial(p, t)', 'abyss(p, t)', 'blueprint(p, t)', 'bloom(p, t)']
const shaderFunctions = new Map(), backdropShaders = new Map()
const definitions = /(?:float|vec[234]|mat[234]|void)\s+(\w+)\s*\([^)]*\)\s*\{/g
let definition, header
while ((definition = definitions.exec(fragmentShader))) {
  header ??= fragmentShader.slice(0, definition.index).replace('uniform int uKind;', '')
  let end = definitions.lastIndex, depth = 1
  while (depth && end < fragmentShader.length) {
    const char = fragmentShader[end++]
    if (char === '{') depth++
    else if (char === '}') depth--
  }
  shaderFunctions.set(definition[1], fragmentShader.slice(definition.index, end))
  definitions.lastIndex = end
}
function backdropShader(index) {
  if (backdropShaders.has(index)) return backdropShaders.get(index)
  const main = shaderFunctions.get('main').replace(/ {2}vec3 col;[\s\S]*? {2}float r =/, `  vec3 col = ${backdropCalls[index]};\n  float r =`)
  const used = new Set(), chunks = []
  const visit = (name, source) => {
    if (used.has(name)) return
    used.add(name)
    for (const call of source.matchAll(/\b(\w+)\s*\(/g)) {
      if (call[1] !== name && shaderFunctions.has(call[1])) visit(call[1], shaderFunctions.get(call[1]))
    }
    chunks.push(source)
  }
  visit('main', main)
  const shader = header + chunks.join('\n')
  backdropShaders.set(index, shader)
  return shader
}

export function createCinematicBackdrop(kind, palette) {
  const index = Math.max(0, BACKDROP_KINDS.indexOf(kind))
  const material = new THREE.ShaderMaterial({
    vertexShader, fragmentShader: backdropShader(index),
    uniforms: {
      uTime: { value: 0 }, uCharge: { value: 0 }, uReveal: { value: 0 }, uFlash: { value: 0 },
      uAspect: { value: 16 / 9 }, uSpin: { value: 0 }, uMotion: { value: 1 },
      uA: { value: new THREE.Color(palette[0]) }, uB: { value: new THREE.Color(palette[1]) }, uC: { value: new THREE.Color(palette[2]) },
    },
    depthTest: false, depthWrite: false, fog: false,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
  mesh.frustumCulled = false
  mesh.renderOrder = -1000
  return mesh
}
