// The same city and mountain artwork from the original personal postcard.
// Kept quiet behind the pet, with no second animated sky or weather system.
const buildings = [
  [22, 227, 28, 48], [57, 208, 35, 67], [100, 239, 22, 36], [133, 185, 32, 90],
  [174, 221, 40, 54], [225, 203, 29, 72], [268, 235, 34, 40], [310, 159, 25, 116],
  [346, 218, 34, 57], [391, 238, 29, 37],
];
export function MonterreyHabitat() {
  return <svg className="digimon-city" viewBox="0 0 440 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <path fill="#bec9aa" d="m-12 192 55-25 33 10 58-78 37 23 40-51 35 25 31 60 35 21 26-27 39 40 75-14v124H-12Z" />
    <path fill="#a2b58d" d="m0 236 53-42 28 12 65-67 27-16 31 36 26 4 43-44 22 16 27 68 42 5 42 38 34-14v68H0Z" />
    <path d="m81 206 65-67 27-16 31 36 26 4 43-44 22 16" fill="none" stroke="#cfdbc2" />
    {buildings.map(([x, y, w, h]) => <g key={x}><rect x={x} y={y} width={w} height={h} fill="#819976" />{Array.from({ length: Math.floor(h / 17) }, (_, row) => <g key={row} fill="#dce1c3"><rect x={x + 6} y={y + 9 + row * 15} width="4" height="5" /><rect x={x + w - 10} y={y + 9 + row * 15} width="4" height="5" /></g>)}</g>)}
    <path fill="#758d67" d="M0 275h440v25H0Z" /><path d="M20 287h65m12 0h38m110 0h63m13 0h99" fill="none" stroke="#acbb97" />
  </svg>;
}
