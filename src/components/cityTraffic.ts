// Traffic for the isometric city: a closed grid of two-lane roads, cars that keep
// to the right-hand lane, follow the car ahead at a safe distance, and take turns
// through each junction. Pure logic (no DOM), so it can be stepped and tested.

export type Vec = { x: number; y: number };

/** A resident walking a closed sidewalk loop (see cityLayout.ts). */
export type WalkerSpec = { who: string; points: [number, number][]; cross: Record<number, [number, number]>; reverse?: boolean; speed: number; offset: number };
export type Ped = {
  id: number; who: string;
  pts: [number, number][]; cross: Record<number, number>; lengths: number[];
  seg: number; s: number; v: number; vmax: number;
  pos: Vec; heading: number; walking: boolean; waited: number;
};

export const ROADS = { half: 16, lane: 8 } as const;

/** A straight road centre line in ground pixels (downtown is the 0..760 square). */
export type RoadLine = { axis: 'h' | 'v'; at: number; from: number; to: number };

// The drivable network: the downtown grid, the four avenues carried out to an
// outer ring road through the commercial belt, and the ring itself. Every line
// ends on another line, so there are no dead ends.
export const ROAD_LINES: RoadLine[] = [
  { axis: 'h', at: -110, from: -110, to: 860 },
  { axis: 'h', at: 110, from: 104, to: 652 },
  { axis: 'h', at: 303, from: -110, to: 860 },
  { axis: 'h', at: 639, from: -110, to: 860 },
  { axis: 'h', at: 860, from: -110, to: 860 },
  { axis: 'v', at: -110, from: -110, to: 860 },
  { axis: 'v', at: 104, from: 110, to: 639 },
  { axis: 'v', at: 311, from: -110, to: 860 },
  { axis: 'v', at: 503, from: -110, to: 860 },
  { axis: 'v', at: 652, from: 110, to: 639 },
  { axis: 'v', at: 860, from: -110, to: 860 },
];
const CORE_CENTRE = { x: 380, y: 380 };

const CAR_LEN = 24;      // bumper-to-bumper footprint, ground px
const GAP = 8;           // extra space kept behind the car ahead
// Stop line distance from a junction centre: a whole car (nose to tail) waiting at
// the line, or just leaving, stays clear of the junction and of its crosswalks
// (which sit 22-27px from the centre).
const STOP = ROADS.half + CAR_LEN / 2 + 12;
const V_EDGE = 34;       // cruising speed, ground px per second
const V_TURN = 20;
const ACCEL = 26;
const DECEL = 70;

type Node = { x: number; y: number; holder: number | null; pedWaiting: boolean };
// A segment is a polyline (two points for an edge) with cumulative lengths.
type Segment = { kind: 'edge' | 'turn'; from: number; to: number; dir: Vec; ndir?: Vec; pts: Vec[]; cum: number[]; len: number };

function polyline(pts: Vec[]) {
  const cum = [0];
  for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y));
  return { pts, cum, len: cum[cum.length - 1] };
}

export type Car = {
  id: number;
  sprite: string;
  seg: Segment;
  next: Vec;            // direction to take at the end of the current edge
  s: number;            // distance along the current segment
  v: number;
  pos: Vec;
  heading: number;      // degrees, 0 = +y (south), 90 = +x (east)
  waited: number;
};

const add = (a: Vec, b: Vec, k = 1): Vec => ({ x: a.x + b.x * k, y: a.y + b.y * k });
const right = (d: Vec): Vec => ({ x: -d.y, y: d.x }); // y points down on the ground
const same = (a: Vec, b: Vec) => a.x === b.x && a.y === b.y;
const DIRS: Vec[] = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }];

export function createTraffic(sprites: string[], random: () => number = Math.random, walkers: WalkerSpec[] = []) {
  // Junctions are where a horizontal and a vertical line cross.
  const nodes: Node[] = [];
  const hs = ROAD_LINES.filter(l => l.axis === 'h'), vs = ROAD_LINES.filter(l => l.axis === 'v');
  for (const h of hs) for (const v of vs) {
    if (v.at >= h.from && v.at <= h.to && h.at >= v.from && h.at <= v.to) nodes.push({ x: v.at, y: h.at, holder: null, pedWaiting: false });
  }
  // The nearest junction in a direction, along a line that actually continues there.
  const adjacency = nodes.map(node => DIRS.map(d => {
    const line = d.x !== 0 ? hs.find(h => h.at === node.y && node.x >= h.from && node.x <= h.to) : vs.find(v => v.at === node.x && node.y >= v.from && node.y <= v.to);
    if (!line) return -1;
    let best = -1, bestDist = Infinity;
    nodes.forEach((other, k) => {
      const along = d.x !== 0 ? (other.y === node.y ? (other.x - node.x) * d.x : -1) : (other.x === node.x ? (other.y - node.y) * d.y : -1);
      const pos = d.x !== 0 ? other.x : other.y;
      if (along > 0 && pos >= line.from && pos <= line.to && along < bestDist) { best = k; bestDist = along; }
    });
    return best;
  }));
  const neighbour = (n: number, d: Vec) => adjacency[n][DIRS.findIndex(k => same(k, d))];
  const exits = (n: number, from: Vec) => DIRS.filter(d => neighbour(n, d) >= 0 && !same(d, { x: -from.x, y: -from.y }));

  function edge(from: number, dir: Vec): Segment {
    const to = neighbour(from, dir);
    const r = right(dir);
    const p0 = add(add(nodes[from], dir, STOP), r, ROADS.lane);
    const p1 = add(add(nodes[to], dir, -STOP), r, ROADS.lane);
    return { kind: 'edge', from, to, dir, ...polyline([p0, p1]) };
  }
  function turn(node: number, dir: Vec, ndir: Vec): Segment {
    const r = right(dir), nr = right(ndir);
    const p0 = add(add(nodes[node], dir, -STOP), r, ROADS.lane);
    const p1 = add(add(nodes[node], ndir, STOP), nr, ROADS.lane);
    if (same(dir, ndir)) return { kind: 'turn', from: node, to: node, dir, ndir, ...polyline([p0, p1]) };
    // Stay in lane up to the junction's edge, curve inside the junction, then
    // stay in the new lane: the car never cuts across a corner or sidewalk.
    const a = add(add(nodes[node], dir, -ROADS.half), r, ROADS.lane);
    const b = add(add(nodes[node], ndir, ROADS.half), nr, ROADS.lane);
    const c = add(nodes[node], add(r, nr), ROADS.lane); // where the two lanes cross
    const pts = [p0];
    for (let k = 0; k <= 10; k++) pts.push(bezier(a, c, b, k / 10));
    pts.push(p1);
    return { kind: 'turn', from: node, to: node, dir, ndir, ...polyline(pts) };
  }
  function pick(n: number, from: Vec): Vec {
    const options = exits(n, from);
    // Out on the ring, cars usually head back toward downtown, where they are seen.
    const node = nodes[n];
    if ((node.x < 0 || node.x > 760 || node.y < 0 || node.y > 760) && random() < 0.65) {
      const toward = options.reduce((best, d) => ((CORE_CENTRE.x - node.x) * d.x + (CORE_CENTRE.y - node.y) * d.y > (CORE_CENTRE.x - node.x) * best.x + (CORE_CENTRE.y - node.y) * best.y ? d : best), options[0]);
      return toward;
    }
    const straight = options.find(d => same(d, from));
    if (straight && random() < 0.45) return straight;
    return options[Math.floor(random() * options.length)];
  }

  // Spawn each car on its own edge, spread around the grid.
  // Start downtown: the edges nearest the core come first.
  const allEdges: Segment[] = [];
  nodes.forEach((_, n) => DIRS.forEach(d => { if (neighbour(n, d) >= 0) allEdges.push(edge(n, d)); }));
  const mid = (e: Segment) => ({ x: (e.pts[0].x + e.pts[1].x) / 2, y: (e.pts[0].y + e.pts[1].y) / 2 });
  allEdges.sort((a, b) => Math.hypot(mid(a).x - CORE_CENTRE.x, mid(a).y - CORE_CENTRE.y) - Math.hypot(mid(b).x - CORE_CENTRE.x, mid(b).y - CORE_CENTRE.y));
  allEdges.splice(Math.ceil(allEdges.length * 0.55));
  const step = Math.max(1, Math.floor(allEdges.length / Math.max(1, sprites.length)));
  const cars: Car[] = sprites.map((sprite, id) => {
    const seg = allEdges[(id * step + 3) % allEdges.length];
    const car: Car = { id, sprite, seg, next: pick(seg.to, seg.dir), s: seg.len * 0.35, v: 0, pos: seg.pts[0], heading: 0, waited: 0 };
    place(car);
    return car;
  });

  function place(car: Car) {
    const { pts, cum } = car.seg;
    const s = Math.min(car.s, car.seg.len);
    let k = 1;
    while (k < cum.length - 1 && cum[k] < s) k++;
    const a = pts[k - 1], b = pts[k], span = cum[k] - cum[k - 1] || 1, t = (s - cum[k - 1]) / span;
    car.pos = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    car.heading = ((Math.atan2(b.x - a.x, b.y - a.y) * 180) / Math.PI + 360) % 360;
  }

  // Distance this car may still travel before it would reach an obstacle.
  function room(car: Car): number {
    const { seg } = car;
    let free = Infinity;
    for (const other of cars) {
      if (other === car) continue;
      const o = other.seg;
      if (seg.kind === 'edge') {
        if (o.kind === 'edge' && o.from === seg.from && o.to === seg.to && other.s > car.s) free = Math.min(free, other.s - car.s - CAR_LEN - GAP);
        if (o.kind === 'turn' && o.from === seg.to && same(o.dir, seg.dir)) free = Math.min(free, seg.len - car.s + other.s - CAR_LEN - GAP);
      } else {
        const exitTo = neighbour(seg.to, seg.ndir!);
        if (o.kind === 'edge' && o.from === seg.to && o.to === exitTo) free = Math.min(free, seg.len - car.s + other.s - CAR_LEN - GAP);
      }
    }
    if (seg.kind === 'edge') {
      const node = nodes[seg.to];
      const toEnd = seg.len - car.s;
      if (node.holder !== car.id) {
        // Enter only when the junction is empty and the exit lane has room for this car.
        const exitTo = neighbour(seg.to, car.next);
        const exitClear = !cars.some(o => o !== car && ((o.seg.kind === 'edge' && o.seg.from === seg.to && o.seg.to === exitTo && o.s < CAR_LEN + GAP + 4)));
        // Someone waiting at a crosswalk goes first.
        if (node.holder === null && !node.pedWaiting && exitClear && toEnd < 34) node.holder = car.id;
        else free = Math.min(free, toEnd);
      }
    }
    return free;
  }

  // ------------------------------------------------------------- pedestrians
  const nodeAt = (x: number, y: number) => nodes.findIndex(n => n.x === x && n.y === y);
  const peds: Ped[] = walkers.map((spec, i) => {
    const pts = spec.reverse ? [...spec.points].reverse() : spec.points;
    const n = pts.length;
    const cross = Object.entries(spec.cross).reduce<Record<number, number>>((acc, [k, [x, y]]) => {
      const seg = Number(k);
      acc[spec.reverse ? (n - 2 - seg + n) % n : seg] = nodeAt(x, y);
      return acc;
    }, {});
    const lengths = pts.map((p, k) => { const q = pts[(k + 1) % n]; return Math.hypot(q[0] - p[0], q[1] - p[1]); });
    const total = lengths.reduce((a, b) => a + b, 0);
    let s = total * spec.offset, seg = 0;
    while (s >= lengths[seg]) { s -= lengths[seg]; seg = (seg + 1) % n; }
    // Never start on a crosswalk.
    if (cross[seg] !== undefined) { s = 0; seg = (seg + 1) % n; }
    const ped: Ped = { id: 1000 + i, who: spec.who, pts, cross, lengths, seg, s, v: 0, vmax: spec.speed, pos: { x: 0, y: 0 }, heading: 0, walking: false, waited: 0 };
    placePed(ped);
    return ped;
  });

  function placePed(ped: Ped) {
    const a = ped.pts[ped.seg], b = ped.pts[(ped.seg + 1) % ped.pts.length];
    const len = ped.lengths[ped.seg] || 1;
    const dx = (b[0] - a[0]) / len, dy = (b[1] - a[1]) / len;
    ped.pos = { x: a[0] + dx * ped.s, y: a[1] + dy * ped.s };
    ped.heading = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
  }

  function updatePeds(dt: number) {
    nodes.forEach(n => { n.pedWaiting = false; });
    for (const ped of peds) {
      const n = ped.pts.length;
      let free = ped.lengths[ped.seg] - ped.s + 40;
      // Wait for the junction before stepping onto a crosswalk.
      const nextSeg = (ped.seg + 1) % n;
      const crossing = ped.cross[nextSeg];
      if (crossing !== undefined && ped.cross[ped.seg] === undefined) {
        const node = nodes[crossing];
        const toCurb = ped.lengths[ped.seg] - ped.s;
        if (node.holder !== ped.id) {
          if (node.holder === null && toCurb < 6) node.holder = ped.id;
          else { free = Math.min(free, toCurb); if (toCurb < 12) node.pedWaiting = true; }
        }
      }
      // Keep a little space behind anyone walking the same way.
      const a = ped.pts[ped.seg], b = ped.pts[nextSeg];
      const len = ped.lengths[ped.seg] || 1, dx = (b[0] - a[0]) / len, dy = (b[1] - a[1]) / len;
      for (const other of peds) {
        if (other === ped) continue;
        const rx = other.pos.x - ped.pos.x, ry = other.pos.y - ped.pos.y;
        const ahead = rx * dx + ry * dy, side = Math.abs(rx * -dy + ry * dx);
        const sameWay = Math.abs(other.heading - ped.heading) < 1;
        if (sameWay && ahead > 0 && side < 4) free = Math.min(free, ahead - 9);
      }
      const target = Math.min(ped.vmax, Math.max(0, free) * 2);
      ped.v = target > ped.v ? Math.min(target, ped.v + 20 * dt) : Math.max(target, ped.v - 40 * dt);
      ped.walking = ped.v > 1.5;
      ped.waited = ped.walking ? 0 : ped.waited + dt;
      ped.s += ped.v * dt;
      while (ped.s >= ped.lengths[ped.seg]) {
        ped.s -= ped.lengths[ped.seg];
        // Leaving a crosswalk frees its junction.
        const done = ped.cross[ped.seg];
        if (done !== undefined && nodes[done].holder === ped.id) nodes[done].holder = null;
        ped.seg = (ped.seg + 1) % n;
      }
      placePed(ped);
    }
  }

  function update(dt: number) {
    dt = Math.min(dt, 0.05);
    updatePeds(dt);
    for (const car of cars) {
      const free = room(car);
      const cruise = car.seg.kind === 'turn' && !same(car.seg.dir, car.seg.ndir!) ? V_TURN : V_EDGE;
      const brake = Math.sqrt(Math.max(0, 2 * DECEL * (free - 2)));
      const target = Math.min(cruise, brake);
      car.v = target > car.v ? Math.min(target, car.v + ACCEL * dt) : Math.max(target, car.v - DECEL * dt);
      car.waited = car.v < 1 ? car.waited + dt : 0;
      car.s += car.v * dt;
      while (car.s >= car.seg.len) {
        car.s -= car.seg.len;
        const { seg } = car;
        if (seg.kind === 'edge') {
          car.seg = turn(seg.to, seg.dir, car.next);
        } else {
          nodes[seg.to].holder = null;
          car.seg = edge(seg.to, seg.ndir!);
          car.next = pick(car.seg.to, car.seg.dir);
        }
      }
      place(car);
    }
  }

  return { cars, peds, update, nodes };
}

export function bezier(p0: Vec, c: Vec, p1: Vec, t: number): Vec {
  const u = 1 - t;
  return { x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x, y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y };
}

/** The baked sprite angle (0, 45 ... 315) closest to a heading. */
export function spriteAngle(heading: number): number {
  return (Math.round(heading / 45) * 45) % 360;
}
