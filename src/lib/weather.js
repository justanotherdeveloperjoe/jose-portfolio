// Monterrey's weather for the Playground poster, from MET Norway's forecast (relayed by /api/weather.php).
// Weather data from MET Norway, licensed CC BY 4.0: https://api.met.no/doc/License
const hourMs = 3600000;
const labels = { clearsky: 'Clear', fair: 'Fair', partlycloudy: 'Partly cloudy', cloudy: 'Cloudy', fog: 'Fog' };

function label(kind) {
  if (labels[kind]) return labels[kind];
  const strength = kind.startsWith('heavy') ? 'Heavy ' : kind.startsWith('light') ? 'Light ' : '';
  if (kind.includes('thunder')) return 'Thunderstorm';
  if (kind.includes('snow')) return `${strength}snow`.replace(/^./, c => c.toUpperCase());
  if (kind.includes('sleet')) return `${strength}sleet`.replace(/^./, c => c.toUpperCase());
  if (kind.includes('showers')) return `${strength}showers`.replace(/^./, c => c.toUpperCase());
  if (kind.includes('rain')) return `${strength}rain`.replace(/^./, c => c.toUpperCase());
  return 'Fair';
}

// MET's compact forecast → the next 48 hourly steps.
export function forecastSeries(json) {
  return (json?.properties?.timeseries ?? []).filter(entry => entry.data?.next_1_hours && entry.data?.instant?.details).slice(0, 48).map(entry => {
    const now = entry.data.instant.details, hour = entry.data.next_1_hours;
    return { time: Date.parse(entry.time), temperature: now.air_temperature, cloud: (now.cloud_area_fraction ?? 0) / 100, windSpeed: now.wind_speed ?? 0, windFrom: now.wind_from_direction ?? 0, rain: hour.details?.precipitation_amount ?? 0, symbol: hour.summary?.symbol_code ?? 'fair_day' };
  });
}

// The weather at a moment, eased between hourly steps. Null outside the forecast (the past, or beyond two days).
export function weatherAt(series, date) {
  if (!series?.length) return null;
  const time = date.valueOf();
  if (time < series[0].time - 3 * hourMs || time > series.at(-1).time + hourMs) return null;
  const next = series.findIndex(step => step.time > time);
  const before = series[Math.max(0, (next === -1 ? series.length : next) - 1)], after = series[next] ?? before;
  const t = after === before ? 0 : Math.min(1, Math.max(0, (time - before.time) / (after.time - before.time)));
  const blend = key => before[key] + (after[key] - before[key]) * t;
  const kind = before.symbol.replace(/_(day|night|polartwilight)$/, '');
  const wet = /rain|sleet|snow|showers/.test(kind), storm = kind.includes('thunder');
  const rainfall = blend('rain');
  return {
    temperature: blend('temperature'), windSpeed: blend('windSpeed'), windFrom: before.windFrom,
    cover: Math.min(1, Math.max(blend('cloud'), wet || storm ? 0.8 : 0, kind === 'fog' ? 0.5 : 0)),
    rain: wet || storm ? Math.min(1, 0.3 + rainfall / 4) : 0,
    fog: kind === 'fog' ? 1 : 0,
    storm, label: label(kind),
  };
}

// Development only: ?weather=clear|partlycloudy|cloudy|rain|storm|fog previews a condition without the network.
export function previewForecast(kind, now = Date.now()) {
  const looks = { clear: [0, 0, 'clearsky_day'], partlycloudy: [0.45, 0, 'partlycloudy_day'], cloudy: [0.97, 0, 'cloudy'], rain: [0.95, 1.6, 'rain'], storm: [1, 6, 'heavyrainandthunder'], fog: [1, 0, 'fog'] };
  const [cloud, rain, symbol] = looks[kind] ?? looks.partlycloudy;
  const start = Math.floor(now / hourMs) * hourMs;
  return Array.from({ length: 48 }, (_, i) => ({ time: start + i * hourMs, temperature: 24, cloud, windSpeed: 4, windFrom: 110, rain, symbol }));
}
