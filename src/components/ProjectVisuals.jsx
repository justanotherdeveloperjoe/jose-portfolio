function BrowserBar({ domain }) {
  return <div className="showcase-browser-bar" aria-hidden="true"><span>● ● ●</span><span>{domain}</span><span>↗</span></div>;
}

export function ComedyVisual({ project }) {
  return <div className="comedy-composition">
    <span className="comedy-outline" aria-hidden="true">ON AIR</span>
    <a className="comedy-browser" href={project.url} target="_blank" rel="noreferrer" aria-label={`Visit ${project.name}`}>
      <BrowserBar domain="elsotanocomico.com" />
      <img src={project.screenshot} alt="El Sótano Cómico website with its raccoon mascot and comedy artwork" loading="lazy" width="1400" height="945" />
    </a>
    <div className="comedy-artwork" aria-hidden="true"><div className="comedy-artwork-crop"><img src={project.screenshot} alt="" loading="lazy" /></div><span>EL SÓTANO CÓMICO <i>↗</i></span></div>
    <span className="comedy-sticker" aria-hidden="true">GOOD<br /><em>company.</em></span>
  </div>;
}

export function EstateVisual({ project }) {
  return <div className="estate-composition">
    <img className="estate-landscape" src="/artwork/allende-property.webp" alt="Pool, garden, and covered terrace at Quinta El Roble in Allende" loading="lazy" width="1000" height="525" />
    <span className="estate-location">QUINTA EL ROBLE <span>ALLENDE, N.L. ↗</span></span>
    <a className="estate-browser" href={project.url} target="_blank" rel="noreferrer" aria-label={`Visit ${project.name}`}>
      <BrowserBar domain="propiedadesallende.com" />
      <img src={project.screenshot} alt="Propiedades Allende website with property photography and contact options" loading="lazy" width="1400" height="1225" />
    </a>
    <span className="estate-note" aria-hidden="true">Room for a new perspective.</span>
  </div>;
}

export function LogisticsVisual({ project }) {
  return <div className="logistics-composition">
    <svg className="logistics-map" viewBox="0 0 640 440" fill="none" aria-hidden="true">
      <path d="M-20 310 100 250 175 280 265 165 390 195 480 65 660 90M30 460 170 325 255 355 370 265 440 300 570 180 660 200" stroke="currentColor" strokeOpacity=".18" />
      <path d="M70 350 175 280 265 165 390 195 480 65 580 78" stroke="currentColor" strokeWidth="2" strokeDasharray="5 7" />
      {[[70, 350], [265, 165], [480, 65], [580, 78]].map(([x, y]) => <g key={x}><circle cx={x} cy={y} r="10" stroke="currentColor" strokeOpacity=".35" /><circle cx={x} cy={y} r="3" fill="currentColor" /></g>)}
    </svg>
    <a className="logistics-browser" href={project.url} target="_blank" rel="noreferrer" aria-label={`Visit ${project.name}`}>
      <BrowserBar domain="afh.mx" />
      <img src={project.screenshot} alt="AFH Logistics desktop website" loading="lazy" width="1400" height="880" />
    </a>
    <a className="logistics-phone" href={project.url} target="_blank" rel="noreferrer" aria-label="View AFH Logistics website"><span className="phone-camera" aria-hidden="true" /><img src="/screenshots/afh-mobile.jpg" alt="AFH Logistics website on a mobile screen" loading="lazy" width="390" height="844" /></a>
    <span className="logistics-coordinate">25.6866° N / 100.3161° W</span>
  </div>;
}

export function MountainSignature() {
  return <div className="mountain-signature" aria-hidden="true">
    <div className="mountain-caption"><span>MADE IN MONTERREY</span><span>WITH CURIOSITY & A LITTLE CAFFEINE.</span><span>25.6866° N / 100.3161° W</span></div>
    <svg viewBox="0 0 1440 240" fill="none" preserveAspectRatio="none">
      <path d="M0 215 100 185 185 202 300 141 385 174 485 65 540 104 610 30 672 80 741 161 830 130 950 187 1080 141 1200 200 1330 169 1440 218V240H0Z" fill="currentColor" fillOpacity=".045" />
      <path d="M0 215 100 185 185 202 300 141 385 174 485 65 540 104 610 30 672 80 741 161 830 130 950 187 1080 141 1200 200 1330 169 1440 218" stroke="currentColor" strokeOpacity=".45" />
      <path d="m385 174 99-60 57 30 69-114m-69 114 131-64M0 234l180-17 155 14 140-37 164 31 184-40 167 44 178-29 132 33 140-10" stroke="currentColor" strokeOpacity=".16" />
    </svg>
  </div>;
}
