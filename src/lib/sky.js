// Sun and moon positions for a place and time, accurate to a fraction of a degree.
// Formulas after SunCalc by Vladimir Agafonkin (BSD-2-Clause), based on the astronomy notes at aa.quae.nl.
const rad = Math.PI / 180;
const obliquity = 23.4397 * rad;
const daysSinceJ2000 = date => date.valueOf() / 86400000 - 10957.5;
const rightAscension = (l, b) => Math.atan2(Math.sin(l) * Math.cos(obliquity) - Math.tan(b) * Math.sin(obliquity), Math.cos(l));
const declination = (l, b) => Math.asin(Math.sin(b) * Math.cos(obliquity) + Math.cos(b) * Math.sin(obliquity) * Math.sin(l));
const siderealTime = (d, lon) => rad * (280.16 + 360.9856235 * d + lon);

function sunCoords(d) {
  const m = rad * (357.5291 + 0.98560028 * d);
  const l = m + rad * (1.9148 * Math.sin(m) + 0.02 * Math.sin(2 * m) + 0.0003 * Math.sin(3 * m)) + rad * 102.9372 + Math.PI;
  return { ra: rightAscension(l, 0), dec: declination(l, 0) };
}

// The main periodic terms from Meeus, Astronomical Algorithms ch. 47, keep the moon within about a quarter degree.
function moonCoords(d) {
  const l0 = 218.316 + 13.176396 * d, m = rad * (134.963 + 13.064993 * d), f = rad * (93.272 + 13.22935 * d);
  const e = rad * (297.8502 + 12.19074912 * d), s = rad * (357.5291 + 0.98560028 * d);
  const l = rad * (l0 + 6.289 * Math.sin(m) + 1.274 * Math.sin(2 * e - m) + 0.658 * Math.sin(2 * e) + 0.214 * Math.sin(2 * m) - 0.186 * Math.sin(s) - 0.114 * Math.sin(2 * f));
  const b = rad * (5.128 * Math.sin(f) + 0.281 * Math.sin(m + f) + 0.278 * Math.sin(m - f) + 0.173 * Math.sin(2 * e - f));
  return { ra: rightAscension(l, b), dec: declination(l, b), distance: 385001 - 20905 * Math.cos(m) - 3699 * Math.cos(2 * e - m) - 2956 * Math.cos(2 * e) };
}

// Compass azimuth (0° north, 90° east) and apparent altitude in degrees, refraction included.
// distance (km) adds the moon's parallax: seen from the ground it sits up to a degree lower than from Earth's centre.
function horizontal({ ra, dec, distance }, d, lat, lon) {
  const phi = rad * lat, hour = siderealTime(d, lon) - ra;
  const azimuth = Math.atan2(Math.sin(hour), Math.cos(hour) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi)) / rad + 180;
  let altitude = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(hour)) / rad;
  if (distance) altitude -= Math.asin(6378.14 / distance * Math.cos(rad * altitude)) / rad;
  const refraction = altitude > -1 ? 1.02 / Math.tan(rad * (altitude + 10.3 / (altitude + 5.11))) / 60 : 0;
  return { azimuth: (azimuth + 360) % 360, altitude: altitude + refraction };
}

export function sunPosition(date, lat, lon) {
  const d = daysSinceJ2000(date);
  return horizontal(sunCoords(d), d, lat, lon);
}

export function moonPosition(date, lat, lon) {
  const d = daysSinceJ2000(date);
  return horizontal(moonCoords(d), d, lat, lon);
}

const phaseNames = [[0.03, 'New moon'], [0.22, 'Waxing crescent'], [0.28, 'First quarter'], [0.47, 'Waxing gibbous'], [0.53, 'Full moon'], [0.72, 'Waning gibbous'], [0.78, 'Last quarter'], [0.97, 'Waning crescent'], [1.01, 'New moon']];

// fraction: lit share of the disc. phase: 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter.
export function moonPhase(date) {
  const d = daysSinceJ2000(date), sun = sunCoords(d), moon = moonCoords(d), sunDistance = 149598000;
  const elongation = Math.acos(Math.sin(sun.dec) * Math.sin(moon.dec) + Math.cos(sun.dec) * Math.cos(moon.dec) * Math.cos(sun.ra - moon.ra));
  const incidence = Math.atan2(sunDistance * Math.sin(elongation), moon.distance - sunDistance * Math.cos(elongation));
  const angle = Math.atan2(Math.cos(sun.dec) * Math.sin(sun.ra - moon.ra), Math.sin(sun.dec) * Math.cos(moon.dec) - Math.cos(sun.dec) * Math.sin(moon.dec) * Math.cos(sun.ra - moon.ra));
  const phase = 0.5 + 0.5 * incidence * (angle < 0 ? -1 : 1) / Math.PI;
  return { fraction: (1 + Math.cos(incidence)) / 2, phase, name: phaseNames.find(([limit]) => phase < limit)[1] };
}
