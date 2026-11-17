// Everything placed in the isometric city, in ground pixels (the world is 760 x 760).
// Kept apart from the component so the layout can be checked by tests.
import { citySprites } from './citySprites.ts';
import { ROAD_LINES, ROADS } from '../components/cityTraffic.ts';
import type { RoadLine } from '../components/cityTraffic.ts';

export type CityBlock = {
  id: string;
  /** The page section this building opens. Keep these in sync with the section ids. */
  target: string;
  label: string;
  note: string;
  kind: 'tower' | 'shop' | 'house' | 'lab' | 'arcade' | 'computer' | 'antenna' | 'gallery';
  x: number; y: number; w: number; d: number; h: number;
  color: string;
};

// Landmarks were laid out on a 560 grid; the world is 760 with them centred.
export const O = 100;

// The one place that maps buildings to sections.
export const cityBlocks: CityBlock[] = [
  { id: 'work', target: 'work', label: 'Work', note: 'Selected projects', kind: 'tower', x: 56, y: 52, w: 126, d: 126, h: 236, color: '#e9e7dd' },
  { id: 'services', target: 'services', label: 'Services', note: 'Plans and pricing', kind: 'shop', x: 236, y: 48, w: 140, d: 104, h: 86, color: '#d5f77a' },
  { id: 'contact', target: 'contact', label: 'Contact', note: 'Say hello', kind: 'antenna', x: 440, y: 58, w: 66, d: 66, h: 148, color: '#dcdad0' },
  { id: 'learning', target: 'learning', label: 'Learning lab', note: 'Live experiments', kind: 'lab', x: 56, y: 236, w: 128, d: 100, h: 66, color: '#9fc3b2' },
  { id: 'about', target: 'about', label: 'About', note: 'Behind the browser', kind: 'house', x: 250, y: 222, w: 104, d: 104, h: 78, color: '#3d7a62' },
  { id: 'arcade', target: 'arcade', label: 'Arcade', note: 'A tiny space game', kind: 'arcade', x: 420, y: 226, w: 100, d: 112, h: 122, color: '#2a2d28' },
  { id: 'sandbox', target: 'sandbox', label: 'Sandbox', note: 'A Linux desktop', kind: 'computer', x: 236, y: 404, w: 132, d: 92, h: 58, color: '#596158' },
  { id: 'playground', target: 'playground', label: 'Playground', note: 'Monterrey, made yours', kind: 'gallery', x: 436, y: 370, w: 92, d: 92, h: 54, color: '#ece7d8' },
];

// Kenney sprites: [name, ground x, ground y] of the model's centre.
export type Placed = [string, number, number];
export const industrial: Placed[] = [
  ['ind-building-l-0', 44, 156], ['ind-water-tower-0', 18, 214], ['ind-detail-tank-large-0', 60, 230],
  ['ind-building-r-90', 44, 362], ['ind-building-q-0', 44, 432], ['ind-building-c-90', 44, 534],
  ['ind-shipping-container-a-0', 22, 606], ['ind-shipping-container-c-0', 38, 608], ['ind-shipping-container-b-90', 66, 604],
  ['ind-building-a-0', 52, 694], ['ind-chimney-large-0', 112, 690], ['ind-building-f-0', 168, 698], ['ind-building-t-0', 252, 704],
  ['ind-solar-panel-landscape-group-0', 60, 742], ['ind-detail-tank-0', 128, 742], ['parked-truck-flat-0', 194, 744], ['parked-garbage-truck-90', 250, 748],
];
export const nature: Placed[] = [
  // east forest
  ['forest-tree-0', 690, 138], ['forest-tree-high-0', 722, 150], ['forest-tree-90', 748, 132], ['forest-tree-0', 706, 192], ['forest-tree-90', 740, 206],
  ['forest-tree-high-0', 688, 246], ['forest-tree-0', 726, 262], ['forest-tree-90', 752, 266], ['forest-tree-0', 694, 342], ['forest-tree-high-0', 734, 352],
  ['forest-rocks-high-0', 700, 392], ['forest-tree-90', 748, 404],
  ['forest-tent-0', 716, 470], ['forest-flag-0', 690, 450], ['forest-stones-0', 744, 496], ['forest-patch-grass-0', 698, 500],
  ['forest-tree-0', 692, 548], ['forest-tree-high-0', 728, 560], ['forest-tree-90', 754, 580], ['forest-tree-0', 700, 598], ['forest-rocks-low-0', 742, 598],
  // south meadow
  ['forest-tree-high-0', 352, 690], ['forest-tree-0', 390, 712], ['forest-tree-90', 352, 744], ['forest-plant-0', 420, 690], ['forest-tree-0', 446, 738],
  ['forest-patch-grass-0', 464, 700], ['forest-fence-0', 548, 682], ['forest-fence-0', 578, 682], ['ind-windmill-0', 600, 716], ['forest-patch-grass-0', 560, 740],
  ['forest-tree-high-0', 648, 690], ['forest-tree-0', 690, 712], ['forest-tree-90', 728, 694], ['forest-tree-0', 748, 740], ['forest-rocks-low-0', 660, 748],
  // north-east corner and a few street plants
  ['forest-tree-0', 690, 74], ['forest-tree-high-0', 740, 80], ['forest-plant-0', 466, 452], ['forest-plant-0', 138, 444],
];
// The downtown parking lot: rows facing south and north.
export const parked: Placed[] = [
  ['car-suv-0', 160, 500], ['car-taxi-0', 188, 500], ['car-sedan-0', 216, 500], ['car-van-0', 272, 500],
  ['car-hatchback-sports-180', 160, 572], ['car-delivery-180', 216, 572], ['car-sedan-180', 244, 572],
];

// Small anonymous buildings: the north strip and two downtown infill blocks.
export type Filler = { x: number; y: number; w: number; d: number; h: number; c: string };
const palette = ['#4a4e45', '#5b5f55', '#6b6f64', '#8a8d84', '#3f4a3e', '#7a8a6a'];
const fillerSeed: [number, number, number, number, number][] = [
  [8, 6, 44, 40, 34], [60, 10, 36, 36, 52], [104, 4, 48, 44, 28], [160, 8, 40, 40, 46], [210, 6, 50, 36, 30], [256, 12, 36, 40, 60],
  [352, 8, 44, 36, 38], [404, 4, 40, 44, 26], [448, 10, 36, 40, 48], [522, 6, 30, 36, 32], [556, 8, 42, 44, 58], [606, 4, 48, 40, 30],
  [548, 236, 40, 36, 30], [596, 244, 28, 30, 44],
];
export const fillers: Filler[] = fillerSeed.map(([x, y, w, d, h], i) => ({ x, y, w, d, h, c: palette[(i * 7) % palette.length] }));

// ---------------------------------------------------------------- residents
// Sidewalks run 21px from each road centre line; crosswalks cross a road 24.5px
// from a junction centre, between the junction and where cars stop.
export const SIDEWALK = 21;
export const CROSSWALK = 24.5;

export const people = ['female-b', 'female-c', 'female-d', 'female-e', 'male-b', 'male-d', 'male-g', 'worker'] as const;
export type Person = (typeof people)[number];

/** A closed walking loop. cross[i] names the junction whose crosswalk segment i uses. */
export type WalkRoute = { name: string; points: [number, number][]; cross: Record<number, [number, number]> };

// Corners of the sidewalk loops, by block (x and y are ground px).
const XW = [125, 290, 332, 482, 524, 631];   // sidewalk lines beside the four avenues
const YN = [131, 282, 438, 452, 618];
export const walkRoutes: WalkRoute[] = [
  // around the Work tower's block
  { name: 'work-block', points: [[XW[0], YN[0]], [XW[1], YN[0]], [XW[1], YN[1]], [XW[0], YN[1]]], cross: {} },
  // around the Services block
  { name: 'services-block', points: [[XW[2], YN[0]], [XW[3], YN[0]], [XW[3], YN[1]], [XW[2], YN[1]]], cross: {} },
  // both northern blocks, crossing the second avenue twice
  { name: 'north-loop', points: [
    [XW[0], YN[0]], [XW[1], YN[0]], [XW[1], 134.5], [XW[2], 134.5], [XW[2], YN[0]], [XW[3], YN[0]], [XW[3], YN[1]],
    [XW[2], YN[1]], [XW[2], 278.5], [XW[1], 278.5], [XW[1], YN[1]], [XW[0], YN[1]],
  ], cross: { 2: [311, 110], 8: [311, 303] } },
  // around the Learning lab and the parking lot
  { name: 'learning-block', points: [[XW[0], 324], [XW[1], 324], [XW[1], YN[4]], [XW[0], YN[4]]], cross: {} },
  // the plaza and Sandbox block, then across to the Playground gallery and back
  { name: 'south-loop', points: [
    [XW[2], YN[2]], [XW[3], YN[2]], [XW[3], YN[4]], [XW[3], 614.5], [XW[4], 614.5], [XW[4], YN[4]],
    [XW[4], YN[3]], [XW[5], YN[3]], [XW[5], YN[4]], [XW[4], YN[4]], [XW[4], 614.5], [XW[3], 614.5], [XW[3], YN[4]], [XW[2], YN[4]],
  ], cross: { 3: [503, 639], 10: [503, 639] } },
];

/** Who walks which loop. Everyone on a shared sidewalk walks the same way round,
 * so nobody meets head-on. Phones get the first three. */
export const walkers: { who: Person; route: string; reverse?: boolean; speed: number; offset: number }[] = [
  { who: 'female-c', route: 'north-loop', speed: 12, offset: 0 },
  { who: 'worker', route: 'south-loop', speed: 11, offset: 0.1 },
  { who: 'male-b', route: 'work-block', speed: 10, offset: 0.3 },
  { who: 'female-e', route: 'work-block', speed: 12.5, offset: 0.75 },
  { who: 'male-d', route: 'services-block', speed: 11.5, offset: 0.5 },
  { who: 'female-b', route: 'learning-block', speed: 10.5, offset: 0.2 },
  { who: 'male-g', route: 'south-loop', speed: 12, offset: 0.55 },
];

/** People standing around: [who, x, y, facing degrees (0 south, 90 east, 180 north, 270 west)]. */
export const standing: [Person, number, number, number][] = [
  ['female-d', 408, 262, 0],     // outside Services
  ['male-b', 392, 606, 90],      // two friends talking outside the Sandbox
  ['female-e', 410, 606, 270],
  ['worker', 268, 536, 90],      // in the parking lot
  ['male-g', 694, 506, 270],     // at the campsite
];

// ---------------------------------------------------------------- obstacles
/** Footprints people and cars must stay out of: [left, top, right, bottom]. */
export function obstacleRects(): [number, number, number, number][] {
  const rects: [number, number, number, number][] = [];
  for (const b of cityBlocks) rects.push([b.x + O, b.y + O, b.x + O + b.w, b.y + O + b.d]);
  for (const f of fillers) rects.push([f.x, f.y, f.x + f.w, f.y + f.d]);
  for (const [name, x, y] of [...industrial, ...nature, ...parked, ...holidayCore]) {
    if (name.includes('patch-grass')) continue; // flat grass, walkable
    const m = citySprites[name];
    rects.push([x - Math.abs(m.gx), y - Math.abs(m.gy), x + Math.abs(m.gx), y + Math.abs(m.gy)]);
  }
  return rects;
}

// ---------------------------------------------------------------- outer districts
// Beyond downtown (0..760) a commercial belt runs up to the ring road (at -110 and
// 860), and quiet suburbs sit outside it. Suburban streets carry on past the edge
// of the view; they are scenery only, so cars never drive them.
export const WORLD = { from: -340, to: 1100 } as const;
export const SPUR_LINES: RoadLine[] = [
  { axis: 'v', at: 311, from: -340, to: -110 },
  { axis: 'v', at: 503, from: 860, to: 1100 },
  { axis: 'h', at: 639, from: -340, to: -110 },
  { axis: 'h', at: 303, from: 860, to: 1100 },
];

type Rect = [number, number, number, number];
const overlaps = (a: Rect, b: Rect) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
const roadRects: Rect[] = [...ROAD_LINES, ...SPUR_LINES].map(l => {
  const w = ROADS.half + 6; // the road plus a strip of sidewalk
  return l.axis === 'h' ? [l.from - w, l.at - w, l.to + w, l.at + w] : [l.at - w, l.from - w, l.at + w, l.to + w];
});
const DOWNTOWN: Rect = [-4, -4, 764, 764];

// Deterministic variety, so the layout is the same on every visit.
function seeded(seed: number) { return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }

/** Lines buildings up along a row, skipping roads, downtown and anything already placed. */
function row(models: string[], axis: 'h' | 'v', at: number, from: number, to: number, seed: number, placed: Rect[], gap: [number, number]): Placed[] {
  const random = seeded(seed), out: Placed[] = [];
  let cursor = from, last = '';
  while (cursor < to) {
    let name = models[Math.floor(random() * models.length)];
    if (name === last) name = models[(models.indexOf(name) + 1) % models.length];
    const m = citySprites[name], hx = Math.abs(m.gx), hy = Math.abs(m.gy);
    const size = axis === 'h' ? hx * 2 : hy * 2;
    const x = axis === 'h' ? cursor + hx : at, y = axis === 'h' ? at : cursor + hy;
    const rect: Rect = [x - hx - 3, y - hy - 3, x + hx + 3, y + hy + 3];
    if (overlaps(rect, DOWNTOWN) || roadRects.some(r => overlaps(rect, r)) || placed.some(r => overlaps(rect, r))) { cursor += 6; continue; }
    out.push([name, Math.round(x), Math.round(y)]);
    placed.push(rect);
    last = name;
    cursor += size + gap[0] + random() * (gap[1] - gap[0]);
  }
  return out;
}

const commercialSouthFacing = 'abcdefghijk'.split('').map(b => `com-${b}-0`);
const commercialEastFacing = 'abcdefghijk'.split('').map(b => `com-${b}-90`);
const houses = (rot: number) => 'acegkloprs'.split('').map(h => `sub-${h}-${rot}`);
const placedOuter: Rect[] = [];

// Pocket parks in the commercial belt, one per side, reserved before the shops go in.
export const pocketParks: [number, number][] = [[407, -52], [407, 804], [-52, 471], [804, 471]];
/** The town tree: the big decorated tree in the south pocket park. */
export const townTree: Placed = ['hol-tree-decorated-0', 407, 800];
for (const [x, y] of pocketParks) placedOuter.push([x - 38, y - 36, x + 38, y + 36]);

/** Shops and small offices between downtown and the ring road. */
export const commercial: Placed[] = [
  ...row(commercialSouthFacing, 'h', -52, -96, 856, 11, placedOuter, [8, 18]),
  ...row(commercialSouthFacing, 'h', 804, -96, 856, 12, placedOuter, [8, 18]),
  ...row(commercialEastFacing, 'v', -52, -96, 856, 13, placedOuter, [8, 18]),
  ...row(commercialEastFacing, 'v', 804, -96, 856, 14, placedOuter, [8, 18]),
];

/** Houses outside the ring road. The second rows are dropped on small screens. */
export const suburbsNear: Placed[] = [
  ...row(houses(0), 'h', -160, -236, 986, 21, placedOuter, [14, 30]),
  ...row(houses(180), 'h', 914, -236, 986, 22, placedOuter, [14, 30]),
  ...row(houses(90), 'v', -160, -236, 986, 23, placedOuter, [14, 30]),
  ...row(houses(270), 'v', 914, -236, 986, 24, placedOuter, [14, 30]),
];
const yardDecor = ['hol-snowman-0', 'hol-snowman-hat-0', 'hol-reindeer-0', 'hol-present-a-round-0', 'hol-sled-0', 'hol-tree-decorated-small-0', 'hol-present-b-rectangle-0'];
const bushes = ['nat-plant_bush-0', 'nat-plant_bushLarge-0', 'nat-plant_bushSmall-0', 'nat-grass_large-0', 'nat-flower_redA-0', 'nat-flower_yellowA-0'];
/** Holiday yards and garden bushes along the suburban streets you can see (north, east, south). */
export const suburbYards: Placed[] = [
  ...row(yardDecor, 'h', -160, -236, 986, 51, placedOuter, [70, 140]),
  ...row(yardDecor, 'v', 914, -236, 986, 52, placedOuter, [70, 140]),
  ...row(yardDecor, 'h', 914, -236, 986, 53, placedOuter, [90, 160]),
  ...row(bushes, 'h', -160, -236, 986, 61, placedOuter, [12, 26]),
  ...row(bushes, 'v', 914, -236, 986, 62, placedOuter, [12, 26]),
  ...row(bushes, 'h', 914, -236, 986, 63, placedOuter, [16, 32]),
];
const natureTrees = ['nat-tree_pineRoundA-0', 'nat-tree_pineRoundC-0', 'nat-tree_oak-0', 'nat-tree_default-0', 'nat-tree_fat-0', 'nat-tree_cone-0', 'nat-tree_pineRoundE-0'];
const darkTrees = ['nat-tree_oak_dark-0', 'nat-tree_default_dark-0', 'nat-tree_pineRoundB-0', 'nat-tree_pineTallA-0', 'nat-tree_pineRoundE-0'];

export const suburbsFar: Placed[] = [
  ...row(houses(0), 'h', -222, -260, 1020, 31, placedOuter, [40, 80]),
  ...row(houses(90), 'v', 976, -260, 1020, 32, placedOuter, [40, 80]),
  ...row(natureTrees, 'h', -272, -280, 1040, 41, placedOuter, [44, 90]),
  ...row(natureTrees, 'v', -222, -280, 1040, 42, placedOuter, [44, 90]),
  ...row(natureTrees, 'h', 966, -280, 1040, 43, placedOuter, [44, 90]),
  ...row(natureTrees, 'v', 1030, -280, 1040, 44, placedOuter, [44, 90]),
];

/** Denser woods beyond the suburbs, where the city meets the countryside (desktop only). */
function grove(cx: number, cy: number, count: number, seed: number): Placed[] {
  const random = seeded(seed), out: Placed[] = [];
  for (let tries = 0; out.length < count && tries < count * 8; tries++) {
    const a = random() * Math.PI * 2, r = Math.sqrt(random()) * 46;
    const name = darkTrees[Math.floor(random() * darkTrees.length)];
    const m = citySprites[name], x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    const rect: Rect = [x - Math.abs(m.gx) - 1, y - Math.abs(m.gy) - 1, x + Math.abs(m.gx) + 1, y + Math.abs(m.gy) + 1];
    if (roadRects.some(q => overlaps(rect, q)) || placedOuter.some(q => overlaps(rect, q))) continue;
    out.push([name, Math.round(x), Math.round(y)]);
    placedOuter.push(rect);
  }
  return out;
}
export const woods: Placed[] = [
  ...grove(150, -300, 8, 71), ...grove(640, -300, 8, 72), ...grove(1060, 150, 8, 73),
  ...grove(1060, 620, 8, 74), ...grove(700, 1050, 7, 75), ...grove(1040, 1040, 7, 76),
  // log piles and rocks among the trees
  ...row(['nat-log_stack-0', 'nat-rock_largeA-0', 'nat-stump_round-0', 'nat-rock_smallA-0'], 'h', -300, -200, 980, 77, placedOuter, [120, 220]),
];

// ---------------------------------------------------------------- holiday season
/** Downtown stays clean: a few presents, two lanterns, and candy canes by the
 * Arcade door. The town tree stands in the south pocket park, facing the camera. */
export const holidayCore: Placed[] = [
  // a few presents and two lanterns in the open square by the Playground gallery,
  // kept low and off to the side so the gallery's front stays clear
  ['hol-present-a-cube-0', 612, 600], ['hol-present-b-rectangle-0', 600, 607], ['hol-present-a-round-0', 621, 608],
  ['hol-lantern-0', 566, 604], ['hol-lantern-0', 624, 576],
  ['hol-candy-cane-red-0', 558, 444], ['hol-candy-cane-green-0', 582, 444],
];
/** Each pocket park: a small tree, presents, a bench, lanterns and planting. */
export const pocketParkProps: Placed[] = pocketParks.flatMap(([x, y], i): Placed[] => [
  [i === 1 ? 'hol-tree-decorated-0' : 'hol-tree-decorated-small-0', x, y - 4],
  ['hol-present-b-cube-0', x - 11, y + 8], ['hol-present-a-round-0', x + 10, y + 6],
  [i % 2 ? 'hol-bench-90' : 'hol-bench-0', x + (i % 2 ? 22 : 0), y + (i % 2 ? 0 : 22)],
  ['hol-lantern-0', x - 26, y - 24], ['hol-lantern-0', x + 26, y + 24],
  ['nat-plant_bushLarge-0', x - 28, y + 22], ['nat-plant_bush-0', x + 27, y - 22], ['nat-flower_redA-0', x - 14, y - 24], ['nat-flower_yellowA-0', x + 15, y - 26],
]);
