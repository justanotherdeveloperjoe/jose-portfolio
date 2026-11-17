import assert from 'node:assert/strict';
import { createTraffic, spriteAngle } from '../src/components/cityTraffic.ts';
import { walkRoutes, walkers, standing, obstacleRects, commercial, suburbsNear, suburbsFar, suburbYards, woods, pocketParkProps, SPUR_LINES } from '../src/data/cityLayout.ts';
import { ROAD_LINES } from '../src/components/cityTraffic.ts';
import { citySprites } from '../src/data/citySprites.ts';

// Deterministic random numbers so a failure can be reproduced.
function seeded(seed) { return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
const specs = n => walkers.slice(0, n).map(w => ({ ...walkRoutes.find(r => r.name === w.route), ...w }));

// 1. The walking routes and standing spots stay clear of every footprint.
const rects = obstacleRects();
const hits = (x, y, r) => rects.find(([l, t, rr, b]) => x > l - r && x < rr + r && y > t - r && y < b + r);
for (const route of walkRoutes) {
  const p = route.points;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let t = 0; t <= len; t++) {
      const x = a[0] + ((b[0] - a[0]) * t) / len, y = a[1] + ((b[1] - a[1]) * t) / len;
      assert.ok(!hits(x, y, 3), `${route.name} segment ${i} runs through a footprint at ${x.toFixed(0)},${y.toFixed(0)}`);
    }
  }
}
for (const [who, x, y] of standing) assert.ok(!hits(x, y, 3), `${who} stands inside a footprint at ${x},${y}`);
console.log('ok routes and standing spots are clear');

// 1b. Outer districts: nothing sits on a road or inside downtown, and nothing overlaps.
const outer = [...commercial, ...suburbsNear, ...suburbsFar, ...suburbYards, ...woods].map(([name, x, y]) => { const m = citySprites[name]; return [name, x - Math.abs(m.gx), y - Math.abs(m.gy), x + Math.abs(m.gx), y + Math.abs(m.gy)]; });
const roads = [...ROAD_LINES, ...SPUR_LINES].map(l => l.axis === 'h' ? [l.from - 16, l.at - 16, l.to + 16, l.at + 16] : [l.at - 16, l.from - 16, l.at + 16, l.to + 16]);
const over = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
for (const [name, ...r] of outer) {
  assert.ok(!roads.some(road => over(r, road)), `${name} at ${r} sits on a road`);
  assert.ok(!over(r, [0, 0, 760, 760]), `${name} at ${r} intrudes on downtown`);
}
for (let a = 0; a < outer.length; a++) for (let b = a + 1; b < outer.length; b++) assert.ok(!over(outer[a].slice(1), outer[b].slice(1)), `${outer[a][0]} overlaps ${outer[b][0]}`);
// Pocket park props stay off roads and out of downtown (they sit close together by design).
for (const [name, x, y] of pocketParkProps) { const m = citySprites[name]; const r = [x - Math.abs(m.gx), y - Math.abs(m.gy), x + Math.abs(m.gx), y + Math.abs(m.gy)]; assert.ok(!roads.some(road => over(r, road)) && !over(r, [0, 0, 760, 760]), `${name} in a pocket park sits on a road`); }
// Downtown's own sprites must stay off the extended roads too.
for (const [l, t, r, b] of obstacleRects()) assert.ok(!roads.some(road => over([l, t, r, b], road)), `a downtown footprint at ${[l, t, r, b]} sits on a road`);
console.log(`ok ${outer.length} outer buildings and trees clear of roads, downtown and each other`);

// 2. Cars and pedestrians together: no collisions, no gridlock, no teleporting.
for (const [count, people, seed] of [[6, 7, 1], [6, 7, 42], [3, 3, 7], [8, 7, 99]]) {
  const { cars, peds, update } = createTraffic(Array.from({ length: count }, (_, i) => `car-${i}`), seeded(seed), specs(people));
  const dt = 1 / 30;
  let carGap = Infinity, pedCar = Infinity, carWait = 0, pedWait = 0, jump = 0, carDist = 0, pedDist = 0;
  const lastCar = cars.map(c => ({ ...c.pos })), lastPed = peds.map(p => ({ ...p.pos }));
  for (let frame = 0; frame < 30 * 60 * 20; frame++) {
    update(dt);
    cars.forEach((c, a) => {
      const d = Math.hypot(c.pos.x - lastCar[a].x, c.pos.y - lastCar[a].y); jump = Math.max(jump, d); carDist += d; lastCar[a] = { ...c.pos };
      carWait = Math.max(carWait, c.waited);
      for (let b = a + 1; b < cars.length; b++) carGap = Math.min(carGap, Math.hypot(c.pos.x - cars[b].pos.x, c.pos.y - cars[b].pos.y));
      // A car body is about 19 x 11; a person about 6 across.
      for (const p of peds) pedCar = Math.min(pedCar, Math.hypot(c.pos.x - p.pos.x, c.pos.y - p.pos.y));
    });
    peds.forEach((p, a) => {
      const d = Math.hypot(p.pos.x - lastPed[a].x, p.pos.y - lastPed[a].y); jump = Math.max(jump, d); pedDist += d; lastPed[a] = { ...p.pos };
      pedWait = Math.max(pedWait, p.waited);
    });
  }
  const tag = `${count} cars, ${people} people, seed ${seed}`;
  assert.ok(carGap >= 15, `${tag}: cars came within ${carGap.toFixed(1)}px`);
  assert.ok(pedCar >= 12, `${tag}: a car came within ${pedCar.toFixed(1)}px of a pedestrian`);
  assert.ok(carWait < 15, `${tag}: a car waited ${carWait.toFixed(1)}s`);
  assert.ok(pedWait < 15, `${tag}: a pedestrian waited ${pedWait.toFixed(1)}s`);
  assert.ok(jump < 3, `${tag}: something jumped ${jump.toFixed(1)}px in one frame`);
  assert.ok(carDist / count > 15000 && pedDist / people > 5000, `${tag}: traffic barely moved`);
  console.log(`ok ${tag}: cars ${carGap.toFixed(1)}px apart, car-to-person ${pedCar.toFixed(1)}px, waits ${carWait.toFixed(1)}s / ${pedWait.toFixed(1)}s`);
}
assert.equal(spriteAngle(359), 0);
assert.equal(spriteAngle(100), 90);
console.log('city traffic: all checks passed');
