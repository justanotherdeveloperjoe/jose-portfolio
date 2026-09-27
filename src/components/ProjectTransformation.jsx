import { useState } from 'react';

function ReconstructedWireframe() {
  return <svg viewBox="0 0 1400 880" className="transformation-wireframe" aria-hidden="true">
    <defs><pattern id="wireframe-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="#b8b6ac" strokeWidth=".5" /></pattern></defs>
    <path fill="#eeece3" d="M0 0h1400v880H0z" /><path fill="url(#wireframe-grid)" d="M0 0h1400v880H0z" />
    <path fill="#d6d5cc" d="M0 0h1400v38H0z" /><path fill="#f6f5ef" stroke="#abaea1" d="M0 38h1400v63H0z" />
    <g fill="none" stroke="#777e6a" strokeWidth="2"><rect x="185" y="54" width="208" height="32" rx="3" /><rect x="917" y="49" width="155" height="41" rx="7" /><path d="M0 102h1400M185 757h590" /></g>
    <g fill="#777e6a" fontFamily="monospace" fontSize="16"><text x="201" y="76">BRAND / LOGO</text><text x="535" y="76">LINKS · SERVICES · CONTACT</text><text x="935" y="75">GET A QUOTE</text><text x="201" y="209">LOCATION / CATEGORY</text></g>
    <rect x="185" y="184" width="222" height="34" fill="none" stroke="#929785" rx="17" />
    <g fill="#949b85"><rect x="185" y="250" width="590" height="41" rx="3" /><rect x="185" y="305" width="550" height="41" rx="3" /><rect x="185" y="360" width="651" height="41" rx="3" /></g>
    <g fill="#b9bead"><rect x="185" y="428" width="582" height="14" rx="2" /><rect x="185" y="455" width="549" height="14" rx="2" /><rect x="185" y="482" width="238" height="14" rx="2" /></g>
    <g fill="#e2e3d8" stroke="#8e9580" strokeWidth="2"><rect x="185" y="519" width="289" height="73" rx="18" /><rect x="486" y="519" width="289" height="73" rx="18" /><rect x="185" y="603" width="590" height="41" rx="18" /></g>
    <g fill="#7b836c" fontFamily="monospace" fontSize="17"><text x="210" y="562">REASSURANCE 01</text><text x="511" y="562">REASSURANCE 02</text><text x="210" y="630">SERVICE DETAILS</text></g>
    <rect x="185" y="676" width="176" height="45" rx="10" fill="#667453" /><rect x="374" y="676" width="138" height="45" rx="10" fill="none" stroke="#8e9580" strokeWidth="2" />
    <g fontFamily="monospace" fontSize="16"><text x="205" y="704" fill="#fff">PRIMARY ACTION</text><text x="395" y="704" fill="#667453">EXPLORE</text><text x="534" y="704" fill="#667453">CONTACT ↗</text></g>
    <g fill="none" stroke="#adb2a0" strokeWidth="2" strokeDasharray="8 8"><rect x="910" y="272" width="320" height="300" /><path d="m910 272 320 300m0-300L910 572" /></g>
    <text x="954" y="606" fill="#777e6a" fontFamily="monospace" fontSize="18">IMAGE / ATMOSPHERE</text>
    <g fill="#777e6a" fontFamily="monospace" fontSize="15"><text x="185" y="794">AVAILABILITY / SUPPORTING DETAIL</text><text x="1020" y="832">STRUCTURE STUDY</text></g>
  </svg>;
}

export function ProjectTransformation({ project }) {
  const [reveal, setReveal] = useState(50);
  return <section className="studio-transformation" id="transformation" aria-labelledby="transformation-title">
    <div className="transformation-heading"><div><span className="studio-kicker">From structure to character / {project.name}</span><h3 id="transformation-title">Same bones.<br /><em>Whole new feeling.</em></h3></div><p>Slide between the structure and the finished interface.<br /><span>Wireframe reconstructed for this comparison.</span></p></div>
    <div className="transformation-browser"><span aria-hidden="true">● ● ●</span><span>{project.url.replace('https://', '')} / a closer look</span><span aria-hidden="true">↗</span></div>
    <div className="transformation-stage" style={{ '--reveal': `${reveal}%` }}>
      <ReconstructedWireframe />
      <div className="transformation-finished"><img src={project.screenshot} alt={`${project.name} finished homepage with navy colors, transport photography, and red contact buttons`} width="1400" height="1225" loading="lazy" /></div>
      <span className="transformation-image-label transformation-image-label-finished" aria-hidden="true" style={{ opacity: reveal > 15 ? 1 : 0 }}>Finished interface</span>
      <span className="transformation-image-label transformation-image-label-wireframe" aria-hidden="true" style={{ opacity: reveal < 85 ? 1 : 0 }}>Reconstructed wireframe</span>
      <span className="transformation-divider" aria-hidden="true" /><span className="transformation-grip" aria-hidden="true">‹ <i /> ›</span>
      <input className="transformation-slider" id="transformation-reveal" type="range" min="0" max="100" value={reveal} aria-label="Finished design revealed" aria-valuetext={`${reveal}% finished design, ${100 - reveal}% reconstructed wireframe`} aria-describedby="transformation-help" onChange={event => setReveal(Number(event.target.value))} />
    </div>
    <div className="transformation-controls"><p id="transformation-help">Drag to reveal <span aria-hidden="true">↔</span><span>Or focus the image and use the arrow keys.</span></p><div className="transformation-presets" role="group" aria-label="Comparison view"><button type="button" aria-pressed={reveal === 0} onClick={() => setReveal(0)}>Wireframe</button><button type="button" aria-pressed={reveal === 50} onClick={() => setReveal(50)}>50 / 50</button><button type="button" aria-pressed={reveal === 100} onClick={() => setReveal(100)}>Finished</button></div></div>
  </section>;
}
