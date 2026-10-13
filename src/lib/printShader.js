// The Playground poster as a risograph print, drawn by one fragment shader: real ridges from a data texture,
// sky, halftone glow, stars, moon phase, sun and the live weather, then paper grain and inks printed slightly out of register.
// Returns null when WebGL2 is unavailable so the caller can keep the SVG version.
const vertex = `#version 300 es
in vec2 corner;
void main() { gl_Position = vec4(corner, 0.0, 1.0); }`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 uSize;        // poster size in CSS px
uniform float uScale;      // device pixels per CSS px
uniform float uHorizon;    // horizon line, CSS px from the top
uniform float uTime;
uniform sampler2D uRidges; // one texel per CSS px column: far, mid and near ridge tops in CSS px
uniform vec3 uInk[13];     // sky, horizon, far, mid, near, crest, sun, glow, moon, moon shade, star, cloud, rain
uniform vec3 uOld[13];     // the previous palette while a new one spreads in
uniform vec4 uSun;         // x, y, radius, halo strength; radius 0 hides it
uniform vec4 uMoon;        // x, y, radius, opacity; radius 0 hides it
uniform vec2 uPhase;       // lit fraction, tilt toward the sun in radians
uniform vec2 uGlow;        // x, strength
uniform float uStars;
uniform vec3 uReveal;      // origin x, y and radius of the new ink; radius below 0 means no change in progress
uniform vec4 uWeather;     // cloud cover, rain, fog, lightning, each 0 to 1
uniform vec2 uWind;        // cloud drift in px per second, rain slant
out vec4 outColor;

// smoothstep with either edge order (GLSL leaves reversed edges undefined).
float ease(float a, float b, float x) { float t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + 1.0), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 7.1; a *= 0.5; } return v; }

struct Masks { float sky, glow, stars, moonDisc, moonLit, sunHalo, sunDisc, cloud, far, mid, near, crest, fog, rain; };

// Halftone dots on a 15° screen, 4.5px apart, sized so their coverage follows amount.
float halftone(vec2 p, float amount, float aa) {
  vec2 cell = fract(mat2(0.966, -0.259, 0.259, 0.966) * p / 4.5) - 0.5;
  float radius = 2.6 * sqrt(amount);
  return amount > 0.002 ? ease(radius + aa * 1.6, radius - aa * 1.6, length(cell) * 4.5) : 0.0;
}

float ridgeMask(float y, float top, float aa) { return ease(-aa, aa, y - top) * step(y, uHorizon); }

Masks paint(vec2 p) {
  Masks m;
  float aa = 0.75 / uScale, above = step(p.y, uHorizon);
  m.sky = clamp(p.y / uHorizon, 0.0, 1.0);

  // Twilight glow as halftone dots on a 15° screen, larger where the glow is stronger.
  vec2 g = (p - vec2(uGlow.x, uHorizon)) / vec2(uSize.x * 0.6, uHorizon * 0.85);
  m.glow = halftone(p, uGlow.y * pow(max(0.0, 1.0 - length(g)), 1.6), aa) * above;

  // Stars: one chance per 26px cell, twinkling slowly.
  vec2 id = floor(p / 26.0);
  float chance = hash(id);
  vec2 spot = (id + 0.2 + 0.6 * vec2(hash(id + 3.1), hash(id + 7.7))) * 26.0;
  float size = 0.45 + 0.9 * hash(id + 11.3);
  float twinkle = 0.72 + 0.28 * sin(uTime * (0.8 + 1.7 * chance) + 40.0 * hash(id + 5.9));
  m.stars = step(chance, 0.36) * step(spot.y, uHorizon - 40.0) * ease(size + aa, size - aa, length(p - spot)) * twinkle * (0.4 + 0.6 * hash(id + 2.3)) * uStars * above;

  // Moon: the lit side faces +x before the tilt; the terminator is a half ellipse whose width follows the phase.
  m.moonDisc = 0.0; m.moonLit = 0.0;
  if (uMoon.z > 0.0) {
    vec2 d = p - uMoon.xy;
    float c = cos(-uPhase.y), s = sin(-uPhase.y);
    vec2 q = vec2(c * d.x - s * d.y, s * d.x + c * d.y) / uMoon.z;
    float edge = 1.0 / uMoon.z;
    m.moonDisc = ease(1.0 + edge, 1.0 - edge, length(q)) * above;
    m.moonLit = m.moonDisc * ease(-edge, edge, q.x - (1.0 - 2.0 * uPhase.x) * sqrt(max(0.0, 1.0 - q.y * q.y)));
  }

  // Sun: a halo, then the disc printed a hair off register.
  m.sunHalo = 0.0; m.sunDisc = 0.0;
  if (uSun.z > 0.0) {
    float d = length(p - uSun.xy);
    m.sunHalo = uSun.w * ease(uSun.z * 3.2, uSun.z * 0.95, d) * above;
    m.sunDisc = ease(uSun.z + aa, uSun.z - aa, length(p - uSun.xy - vec2(0.6, -0.4))) * above;
  }

  // Clouds: a noise field drifting with the real wind, cut at a level set by the real cloud cover, with halftone fringes.
  m.cloud = 0.0;
  if (uWeather.x > 0.01) {
    float field = fbm(vec2(p.x - uWind.x * uTime, p.y * 2.2) / 170.0), level = mix(0.78, 0.28, uWeather.x);
    m.cloud = max(ease(level + 0.02, level + 0.1, field), halftone(p, ease(level - 0.07, level + 0.02, field), aa)) * above;
  }

  // Ridges: the plate sits 0.7px right and 0.45px down of the sky plate, with slightly rough edges.
  vec2 r = p - vec2(0.7, 0.45);
  vec3 tops = texture(uRidges, vec2(r.x / uSize.x, 0.5)).rgb + (noise(vec2(r.x * 0.45, 3.0)) - 0.5) * 0.9;
  m.far = ridgeMask(r.y, tops.r, aa);
  m.mid = ridgeMask(r.y, tops.g, aa);
  m.near = ridgeMask(r.y, tops.b, aa);

  // The crest line on the main ridge, its own ink, nudged the other way.
  vec2 k = p + vec2(0.55, -0.35);
  float left = texture(uRidges, vec2((k.x - 1.0) / uSize.x, 0.5)).g, right = texture(uRidges, vec2((k.x + 1.0) / uSize.x, 0.5)).g;
  float crestTop = texture(uRidges, vec2(k.x / uSize.x, 0.5)).g;
  float gap = abs(k.y - crestTop) / sqrt(1.0 + pow((right - left) * 0.5, 2.0));
  m.crest = ease(0.62 + aa, 0.62 - aa, gap) * step(k.y, uHorizon) * step(crestTop, uHorizon - 0.5);

  // Fog settles on the horizon and swallows the far ridges first.
  m.fog = uWeather.z * ease(uHorizon * 0.5, uHorizon, p.y) * above;

  // Rain: thin streaks in their own ink, falling fast along lanes slanted by the wind.
  m.rain = 0.0;
  if (uWeather.y > 0.01) {
    float lane = p.x + p.y * uWind.y, column = floor(lane / 6.0);
    float fall = fract((p.y - uTime * (520.0 + 160.0 * hash(vec2(column, 1.7)))) / 110.0 + hash(vec2(column, 4.2)));
    m.rain = step(hash(vec2(column, 9.1)), uWeather.y * 0.85) * ease(1.1, 0.3, abs(fract(lane / 6.0) * 6.0 - 3.0)) * ease(0.0, 0.03, fall) * ease(0.24, 0.1, fall) * 0.6 * above;
  }
  return m;
}

vec3 shade(Masks m, vec3 ink[13]) {
  vec3 c = mix(ink[0], ink[1], m.sky);
  c = mix(c, ink[7], m.glow);
  c = mix(c, ink[10], m.stars);
  c = mix(c, ink[9], m.moonDisc * uMoon.w);
  c = mix(c, ink[8], m.moonLit * uMoon.w);
  c = mix(c, ink[6], m.sunHalo);
  c = mix(c, ink[6], m.sunDisc);
  c = mix(c, ink[11], m.cloud);
  c = mix(c, ink[2], m.far);
  c = mix(c, ink[3], m.mid);
  c = mix(c, ink[4], m.near);
  c = mix(c, ink[5], m.crest);
  c = mix(c, ink[1], m.fog * 0.75);
  c = mix(c, ink[12], m.rain);
  return c;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uSize.y * uScale - gl_FragCoord.y) / uScale;
  Masks m = paint(p);
  vec3 c = shade(m, uInk);

  // A new palette spreads from its origin with a ragged, slightly darker leading edge.
  if (uReveal.z >= 0.0) {
    vec2 d = p - uReveal.xy;
    float front = length(d) + (fbm(vec2(atan(d.y, d.x) * 3.0, uReveal.z * 0.01)) - 0.5) * 26.0;
    float inked = ease(uReveal.z + 1.5, uReveal.z - 1.5, front);
    c = mix(shade(m, uOld), c, inked);
    c *= 1.0 - 0.1 * ease(5.0, 0.0, abs(front - uReveal.z)) * step(0.5, uReveal.z);
  }

  // Lightning lifts the whole sky for a moment.
  c += uWeather.w * 0.2 * step(p.y, uHorizon) * (1.0 - 0.5 * m.sky) * (1.0 - max(m.mid, m.near));

  // Ink sits unevenly on paper: soft mottling over the printed areas, then fine grain everywhere.
  float printed = max(max(max(m.far, m.mid), max(m.near, m.sunDisc)), m.cloud);
  c = mix(c, c * 1.06 + 0.012, (fbm(p / 38.0) - 0.45) * 0.55 * printed);
  c += (hash(floor(gl_FragCoord.xy) + 0.5) - 0.5) * 0.045;
  c += (fbm(p * vec2(0.9, 0.12)) - 0.5) * 0.018;
  outColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

const channels = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
// The scene's colors in the order the shader expects.
export const inks = scene => new Float32Array([scene.sky, scene.horizon, ...scene.ridges.map(ridge => ridge.color), scene.crest, scene.sunColor, scene.glow.color, scene.moonColor, scene.moonShade, scene.starColor, scene.cloudColor, scene.rainColor].flatMap(channels));

// Storm light: one double flicker at an irregular moment in every nine seconds (never more than two flashes a second).
export function lightning(time) {
  const beat = Math.floor(time / 9), offset = ((Math.sin(beat * 12.9898) * 43758.5453) % 1 + 1) % 1 * 6, since = time - beat * 9 - offset;
  return since < 0 ? 0 : since < 0.07 ? 1 : since < 0.16 ? 0.25 : since < 0.22 ? 0.85 : Math.max(0, 0.85 - (since - 0.22) / 0.5);
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

export function createPrint(canvas) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' });
  if (!gl) return null;
  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  } catch (error) {
    console.warn('Print shader unavailable, keeping the SVG poster.', error);
    return null;
  }
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const corner = gl.getAttribLocation(program, 'corner');
  gl.enableVertexAttribArray(corner);
  gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  for (const [name, value] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, name, value);
  const at = Object.fromEntries(['uSize', 'uScale', 'uHorizon', 'uTime', 'uRidges', 'uInk', 'uOld', 'uSun', 'uMoon', 'uPhase', 'uGlow', 'uStars', 'uReveal', 'uWeather', 'uWind'].map(name => [name, gl.getUniformLocation(program, name)]));
  gl.uniform1i(at.uRidges, 0);
  let size = { width: 1, height: 1, ratio: 1 };

  return {
    resize(width, height, horizon, columns, ratio) {
      size = { width, height, ratio };
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, columns.length / 4, 1, 0, gl.RGBA, gl.FLOAT, columns);
      gl.uniform2f(at.uSize, width, height);
      gl.uniform1f(at.uScale, ratio);
      gl.uniform1f(at.uHorizon, horizon);
    },
    draw(scene, { time = 0, previous = null, reveal = null, flash = 0 } = {}) {
      const current = inks(scene);
      gl.uniform1f(at.uTime, time);
      gl.uniform3fv(at.uInk, current);
      gl.uniform3fv(at.uOld, previous ? inks(previous) : current);
      gl.uniform4f(at.uSun, scene.sun?.x ?? 0, scene.sun?.y ?? 0, scene.sun ? scene.sun.r : 0, scene.sun?.halo ?? 0);
      gl.uniform4f(at.uMoon, scene.moon?.x ?? 0, scene.moon?.y ?? 0, scene.moon ? scene.moon.r : 0, scene.moon?.opacity ?? 0);
      gl.uniform2f(at.uPhase, scene.moon?.fraction ?? 0, (scene.moon?.tilt ?? 0) * Math.PI / 180);
      gl.uniform2f(at.uGlow, scene.glow.x, scene.glow.strength);
      gl.uniform1f(at.uStars, scene.starLight);
      gl.uniform3f(at.uReveal, reveal?.x ?? 0, reveal?.y ?? 0, reveal ? reveal.radius : -1);
      const weather = scene.weather;
      gl.uniform4f(at.uWeather, weather?.cover ?? 0, weather?.rain ?? 0, weather?.fog ?? 0, flash);
      gl.uniform2f(at.uWind, weather?.drift ?? 0, weather?.slant ?? 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    get size() { return size; },
    lost: () => gl.isContextLost(),
  };
}
