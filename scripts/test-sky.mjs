import assert from 'node:assert/strict';
import { sunPosition, moonPosition, moonPhase } from '../src/lib/sky.js';
import { skyline } from '../src/data/skyline.js';
import { daylight, monterreyDay, projection, sunTimeAt } from '../src/lib/monterreyScene.js';
import { forecastSeries, weatherAt } from '../src/lib/weather.js';

const { lat, lon } = skyline.viewpoint;
const minutes = (start, count) => Array.from({ length: count }, (_, i) => new Date(Date.parse(start) + i * 60000));

// Equinox noon: the sun peaks near 90° minus Monterrey's latitude.
const noon = Math.max(...minutes('2026-03-20T17:30:00Z', 180).map(date => sunPosition(date, lat, lon).altitude));
assert.ok(Math.abs(noon - (90 - lat)) < 0.7, `Equinox noon altitude ${noon.toFixed(2)}°`);

// Winter solstice sunrise comes up in the southeast, about 116° from north at this latitude.
const sunrise = minutes('2026-12-21T12:00:00Z', 180).find(date => sunPosition(date, lat, lon).altitude > 0);
assert.ok(sunrise, 'Sun rises on the solstice');
assert.ok(Math.abs(sunPosition(sunrise, lat, lon).azimuth - 116.2) < 1.5, `Solstice sunrise azimuth ${sunPosition(sunrise, lat, lon).azimuth.toFixed(1)}°`);
assert.ok(Math.abs(sunrise.getUTCHours() + sunrise.getUTCMinutes() / 60 - 13.4) < 0.4, `Solstice sunrise at ${sunrise.toISOString()}`);

// The total lunar eclipse of March 3, 2026 is a full moon; the total solar eclipse of August 12, 2026 a new moon.
const eclipseMoon = moonPhase(new Date('2026-03-03T11:33:00Z'));
assert.ok(eclipseMoon.fraction > 0.99 && eclipseMoon.name === 'Full moon', `Lunar eclipse fraction ${eclipseMoon.fraction}`);
const solarEclipse = new Date('2026-08-12T17:46:00Z'), newMoon = moonPhase(solarEclipse);
assert.ok(newMoon.fraction < 0.01 && newMoon.name === 'New moon', `Solar eclipse fraction ${newMoon.fraction}`);

// During that solar eclipse the sun and moon sit almost on top of each other in Monterrey's sky.
const sun = sunPosition(solarEclipse, lat, lon), moon = moonPosition(solarEclipse, lat, lon), r = Math.PI / 180;
const separation = Math.acos(Math.sin(sun.altitude * r) * Math.sin(moon.altitude * r) + Math.cos(sun.altitude * r) * Math.cos(moon.altitude * r) * Math.cos((sun.azimuth - moon.azimuth) * r)) / r;
assert.ok(separation < 1.5, `Sun and moon ${separation.toFixed(2)}° apart during the eclipse`);

// Phases run in order through a month and the names follow.
const quarter = moonPhase(new Date('2026-03-11T09:38:00Z'));
assert.ok(Math.abs(quarter.phase - 0.75) < 0.03 && quarter.name === 'Last quarter', `Last quarter phase ${quarter.phase}`);

// The skyline keeps the Silla's saddle between its two peaks, and the Sierra Madre stands highest.
const at = azimuth => Math.round((azimuth - skyline.from) / skyline.step);
const north = Math.max(...skyline.mid.slice(at(120), at(128))), saddle = Math.min(...skyline.mid.slice(at(127), at(133))), south = Math.max(...skyline.mid.slice(at(131), at(138)));
assert.ok(saddle < north - 0.5 && saddle < south - 0.2, `Silla saddle ${saddle}° between ${north}° and ${south}°`);
assert.ok(Math.max(...skyline.mid.slice(at(185), at(225))) > north, 'Sierra Madre rises above the Silla');
// Monterrey keeps UTC−6 all year: 22:41 UTC is 16:41 there, and its day starts at 06:00 UTC.
const afternoon = new Date('2026-10-12T22:41:00Z'), local = monterreyDay(afternoon);
assert.equal(local.minutes, 16 * 60 + 41);
assert.equal(local.start, Date.parse('2026-10-12T06:00:00Z'));

// Sunrise and sunset bracket a day of about eleven and a half hours in mid-October, sunrise near 06:40 (no daylight saving since 2022).
const { rise, set } = daylight(afternoon);
assert.ok(Math.abs(sunPosition(new Date(rise), lat, lon).altitude) < 0.05 && Math.abs(sunPosition(new Date(set), lat, lon).altitude) < 0.05, 'Sunrise and sunset sit on the horizon');
assert.ok(Math.abs((set - rise) / 3600000 - 11.45) < 0.3, `Day length ${((set - rise) / 3600000).toFixed(2)} h`);
assert.ok(Math.abs(monterreyDay(new Date(rise)).minutes - 6 * 60 - 41) < 12, `Sunrise at minute ${monterreyDay(new Date(rise)).minutes}`);

// Finding the moment for an azimuth lands the sun there, due south at solar noon.
for (const azimuth of [110, 180, 250]) assert.ok(Math.abs(sunPosition(sunTimeAt(azimuth, afternoon), lat, lon).azimuth - azimuth) < 0.01, `Sun found at ${azimuth}°`);

// The projection and its inverse agree, and a narrow poster keeps the Silla in frame.
const wide = projection(1232, 420, 368), narrow = projection(300, 380, 330);
assert.ok(Math.abs(wide.azimuthAt(wide.x(200)) - 200) < 1e-9);
assert.ok(narrow.x(128) > 0 && narrow.x(128) < 300, 'The Silla stays on a narrow poster');
assert.ok(wide.y(0) === 368 && wide.y(90) < wide.y(30) && wide.y(30) < wide.y(9), 'Altitude climbs the poster');
// MET Norway's compact forecast becomes hourly steps; the poster eases between them and knows rain, storms and fog.
const step = (time, cloud, symbol, rain = 0) => ({ time, data: { instant: { details: { air_temperature: 20 + cloud / 10, cloud_area_fraction: cloud, wind_speed: 4, wind_from_direction: 110 } }, next_1_hours: { summary: { symbol_code: symbol }, details: { precipitation_amount: rain } } } });
const series = forecastSeries({ properties: { timeseries: [step('2026-10-12T22:00:00Z', 10, 'fair_day'), step('2026-10-12T23:00:00Z', 90, 'lightrain', 0.8), step('2026-10-13T00:00:00Z', 100, 'heavyrainandthunder', 6), { time: '2026-10-13T06:00:00Z', data: { instant: { details: {} } } }] } });
assert.equal(series.length, 3, 'Only hourly steps are kept');
const halfway = weatherAt(series, new Date('2026-10-12T22:30:00Z'));
assert.ok(Math.abs(halfway.cover - 0.5) < 1e-9 && halfway.label === 'Fair' && halfway.rain === 0, 'Cloud cover eases between hours');
const shower = weatherAt(series, new Date('2026-10-12T23:10:00Z'));
assert.ok(shower.label === 'Light rain' && shower.rain > 0.3 && shower.cover >= 0.8, 'Rain thickens the clouds');
assert.ok(weatherAt(series, new Date('2026-10-13T00:20:00Z')).storm, 'Thunder is a storm');
assert.equal(weatherAt(series, new Date('2026-10-12T12:00:00Z')), null, 'No weather for the past');
assert.equal(weatherAt([], new Date()), null);
console.log(`Sky checks passed: equinox noon ${noon.toFixed(1)}°, solstice sunrise ${sunPosition(sunrise, lat, lon).azimuth.toFixed(1)}°, eclipse separation ${separation.toFixed(2)}°.`);
