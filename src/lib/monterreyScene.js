// Turns a moment and a poster size into the Playground's Monterrey scene: real skyline, sky, sun, moon and stars.
import { skyline } from '../data/skyline.js';
import { sunPosition, moonPosition, moonPhase } from './sky.js';

export const monterrey = skyline.viewpoint;
// The full panorama runs from the Silla (east-southeast) past the Sierra Madre to Cerro de las Mitras (west).
const view = { from: 105, to: 295, focus: 130, knee: 9 };
const clock = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Monterrey', hour: '2-digit', minute: '2-digit', hour12: false });
const smooth = (from, to, value) => { const t = Math.min(1, Math.max(0, (value - from) / (to - from))); return t * t * (3 - 2 * t); };
const channels = color => [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16));
export const mix = (a, b, t) => '#' + channels(a).map((value, i) => Math.round(value + (channels(b)[i] - value) * t).toString(16).padStart(2, '0')).join('');

// Fixed, seeded positions so the stars keep their places at every poster size.
const starField = Array.from({ length: 90 }, (_, i) => {
  const random = n => { const s = Math.sin(i * 127.1 + n * 311.7) * 43758.5453; return s - Math.floor(s); };
  return { u: random(1), v: random(2) ** 1.5, size: 0.5 + random(3) * 0.9, light: 0.35 + random(4) * 0.65 };
});

// Compass azimuth and altitude to poster pixels. Narrow posters crop around the Silla instead of squeezing the panorama.
// Below the knee the scale matches the ridges, so the sun really sets behind the right mountain; above it the sky compresses.
export function projection(width, height, horizon) {
  const scale = Math.max(width / (view.to - view.from), height / 60), span = width / scale;
  const left = Math.max(view.from, view.focus - span / 2), centre = left + span / 2;
  const lift = height * 0.045, ceiling = Math.max(0, horizon - view.knee * lift - 26);
  return {
    left, right: left + span,
    x: azimuth => width / 2 + ((((azimuth - centre) % 360) + 540) % 360 - 180) * scale,
    y: altitude => altitude <= view.knee ? horizon - altitude * lift : horizon - view.knee * lift - Math.min(1, (altitude - view.knee) / (90 - view.knee)) * ceiling,
    azimuthAt: x => centre + (x - width / 2) / scale,
  };
}

const wallClock = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Monterrey', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });

// Monterrey's midnight (ms) for the day containing date, and the minutes since it.
export function monterreyDay(date) {
  const parts = Object.fromEntries(wallClock.formatToParts(date).map(({ type, value }) => [type, Number(value)]));
  const offset = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - Math.floor(date.valueOf() / 1000) * 1000;
  const start = Date.UTC(parts.year, parts.month - 1, parts.day) - offset;
  return { start, minutes: Math.floor((date.valueOf() - start) / 60000) };
}

const altitudeAt = time => sunPosition(new Date(time), monterrey.lat, monterrey.lon).altitude;
function crossing(from, to, rising) {
  for (let i = 0; i < 40; i++) {
    const middle = (from + to) / 2;
    if ((altitudeAt(middle) > 0) === rising) to = middle; else from = middle;
  }
  return (from + to) / 2;
}

// Sunrise and sunset (ms) on the Monterrey day containing date. Solar noon there falls near 12:40 all year.
export function daylight(date) {
  const { start } = monterreyDay(date), noon = start + 12.66 * 3600000;
  return { rise: crossing(start, noon, true), set: crossing(noon, start + 86400000, false) };
}

// The moment that day when the sun stands at this azimuth. Its azimuth only grows from dawn to dusk, so a bisection finds it.
export function sunTimeAt(azimuth, date) {
  const { rise, set } = daylight(date), margin = 40 * 60000;
  let from = rise - margin, to = set + margin;
  for (let i = 0; i < 32; i++) {
    const middle = (from + to) / 2;
    if (sunPosition(new Date(middle), monterrey.lat, monterrey.lon).azimuth < azimuth) from = middle; else to = middle;
  }
  return new Date((from + to) / 2);
}

// The print shader reads the ridges as one texel per CSS px column: far, mid and near ridge tops in px from the top.
export function ridgeColumns(width, height, horizon) {
  const p = projection(width, height, horizon), columns = new Float32Array(Math.max(1, Math.round(width)) * 4);
  const at = (values, azimuth) => {
    const i = (azimuth - skyline.from) / skyline.step, j = Math.floor(i);
    return j < 0 || j >= values.length - 1 ? 0 : values[j] + (values[j + 1] - values[j]) * (i - j);
  };
  for (let x = 0; x < columns.length / 4; x++) {
    const azimuth = p.azimuthAt(x + 0.5);
    columns.set([...['far', 'mid', 'near'].map(band => p.y(Math.max(0, at(skyline[band], azimuth)))), horizon], x * 4);
  }
  return columns;
}

// The ridges only change with the poster's size, so they are drawn once per size, not once per frame.
let ridgeCache = { key: '', ridges: [] };
function ridgesFor(p, width, height, horizon) {
  const key = `${width}/${height}/${horizon}`;
  if (ridgeCache.key !== key) ridgeCache = { key, ridges: ['far', 'mid', 'near'].map(band => ({ band, ...ridge(skyline[band], p, horizon) })) };
  return ridgeCache.ridges;
}

function ridge(values, { left, right, x, y }, horizon) {
  const first = Math.max(0, Math.floor((left - 1 - skyline.from) / skyline.step)), last = Math.min(values.length - 1, Math.ceil((right + 1 - skyline.from) / skyline.step));
  const points = [];
  for (let i = first; i <= last; i++) points.push([x(skyline.from + i * skyline.step), y(Math.max(0, values[i]))].map(n => n.toFixed(1)).join(' '));
  const ends = [points[0], points.at(-1)].map(point => point.split(' ')[0]);
  return { crest: `M${points.join('L')}`, fill: `M${ends[0]} ${horizon}L${points.join('L')}L${ends[1]} ${horizon}Z` };
}

// The lit part of the moon, bright limb facing +x: a half disc plus the terminator's half ellipse.
function moonShape(r, fraction) {
  const rx = (r * Math.abs(1 - 2 * fraction)).toFixed(2);
  return `M0 ${-r}A${r} ${r} 0 0 1 0 ${r}A${rx} ${r} 0 0 ${fraction > 0.5 ? 1 : 0} 0 ${-r}Z`;
}

export function composeScene({ date, width, height, horizon, palette, live = true, weather = null }) {
  const p = projection(width, height, horizon);
  const sun = sunPosition(date, monterrey.lat, monterrey.lon), moon = moonPosition(date, monterrey.lat, monterrey.lon), phase = moonPhase(date);
  // Night falls through civil twilight: the print turns over about 5° after sunset, the stars come out soon after.
  const night = smooth(2, -12, sun.altitude), shift = smooth(0.3, 0.7, night);
  const tone = key => mix(palette.day[key], palette.night[key], shift);
  const radius = Math.max(9, height * 0.032);
  const place = body => ({ x: p.x(body.azimuth), y: p.y(body.altitude) });
  const visible = (body, at) => body.altitude > -2 && at.x > -radius * 3 && at.x < width + radius * 3;
  const sunAt = place(sun), moonAt = place(moon);
  const state = sun.altitude > 0 ? `Sun ${Math.round(sun.altitude)}° up` : sun.altitude > -9 ? (sun.azimuth < 180 ? 'Before sunrise' : 'After sunset') : phase.name;
  const sky = tone('sky'), starLight = smooth(0.55, 1, night);
  // By day the moon is a pale disc with a faint outline of its dark side; at night its unlit side glows with earthshine.
  const moonColor = mix('#ffffff', palette.night.moon, shift), moonShade = mix(mix(sky, palette.day.ink, 0.07), mix(sky, palette.night.moon, 0.12), shift);
  // Clouds print pale by day and grey as they fill with rain; at night they pick up a little light. Wind is what the
  // poster's viewpoint would see: the part of it blowing across the line of sight, as px per second.
  const gloom = weather ? Math.min(1, weather.rain * 1.4 + Math.max(0, weather.cover - 0.8) * 2.5) : 0;
  const cloudColor = mix(mix(mix(sky, '#ffffff', 0.5), mix(sky, palette.day.ink, 0.22), gloom), mix(sky, palette.night.ink, 0.12), shift);
  const rainColor = mix(mix(sky, palette.day.ink, 0.45), mix(sky, palette.night.ink, 0.35), shift);
  const drift = weather ? weather.windSpeed * 3 * Math.cos((weather.windFrom + 180 - (p.left + p.right) / 2 - 90) * Math.PI / 180) : 0;
  const conditions = weather ? ` · ${Math.round(weather.temperature)}°C, ${weather.label.toLowerCase()}` : '';
  return {
    sky, horizon: tone('horizon'), ink: shift < 0.5 ? palette.day.ink : palette.night.ink, crest: tone('crest'), night,
    ridges: ridgesFor(p, width, height, horizon).map(shape => ({ ...shape, color: tone(shape.band) })),
    azimuthAt: p.azimuthAt,
    glow: { x: Math.min(width * 1.2, Math.max(-width * 0.2, sunAt.x)), strength: Math.max(0, 1 - Math.abs(sun.altitude - 2) / 12) * 0.8, color: palette.glow },
    sun: visible(sun, sunAt) && { ...sunAt, r: radius, color: palette.day.sun, halo: 0.25 + 0.35 * smooth(14, 1, sun.altitude) },
    moon: visible(moon, moonAt) && { ...moonAt, r: radius * 0.82, fraction: phase.fraction, lit: moonShape(radius * 0.82, phase.fraction), tilt: Math.atan2(sunAt.y - moonAt.y, sunAt.x - moonAt.x) * 180 / Math.PI, color: moonColor, shade: moonShade, opacity: 0.8 + 0.2 * night },
    stars: starField.map(star => ({ x: star.u * width, y: 18 + star.v * (horizon - 60), size: star.size, opacity: star.light * starLight })).filter(star => star.opacity > 0.02),
    starLight, starColor: palette.night.star, sunColor: palette.day.sun, moonColor, moonShade, cloudColor, rainColor,
    weather: weather && { cover: weather.cover, rain: weather.rain, fog: weather.fog, storm: weather.storm, drift, slant: Math.max(-0.4, Math.min(0.4, drift / 60)) },
    readout: `${live ? 'Live · ' : ''}${clock.format(date)} · ${state}${conditions}`,
    description: `The real skyline of Cerro de la Silla and the Sierra Madre at ${clock.format(date)} in Monterrey: ${state.toLowerCase()}${sun.altitude <= -9 ? '' : `, ${phase.name.toLowerCase()}`}${conditions.replace(' · ', ', ')}.`,
  };
}
