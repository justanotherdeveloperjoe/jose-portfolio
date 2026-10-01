import { useEffect, useRef, useState } from 'react';
import { projects } from '../data/projects.js';
import { serviceInquiry, serviceTiers } from '../data/services.js';
import { ServiceCustomDemo } from './ServiceCustomDemo.jsx';
import './ServicesSection.css';

function PreviewBrowser({ project, className = '' }) {
  return <div className={`service-browser ${className}`}>
    <div className="service-browser-bar" aria-hidden="true"><span>• • •</span><span>{new URL(project.url).hostname}</span><span>↗</span></div>
    <img src={project.screenshot} alt={`${project.name} website preview`} width={project.slug === 'smashouse' ? 1440 : 1400} height={project.slug === 'smashouse' ? 1080 : project.slug === 'afh-logistics' ? 1225 : 945} loading="lazy" decoding="async" />
  </div>;
}

function ProjectPreview({ tier, project, inputRef }) {
  const [device, setDevice] = useState('desktop');
  if (tier.id === 'launch') return <div className="service-preview service-preview-launch" id={project.id}>
    <a href={project.url} target="_blank" rel="noreferrer" aria-label={`View ${project.name} website`}><PreviewBrowser project={project} /></a>
    <span className="service-preview-caption">One page. A clear next step.</span>
  </div>;
  if (tier.id === 'business') return <div className={`service-preview service-preview-business is-${device}`}>
    <div className="service-device-stage" id="service-business-devices" role="group" aria-label={`AFH Logistics ${device} preview`}>
      <a href={project.url} target="_blank" rel="noreferrer" className="service-business-desktop" aria-label={`View ${project.name} website`}><PreviewBrowser project={project} /></a>
      <div className="service-business-phone"><span aria-hidden="true" /><img src="/screenshots/afh-mobile.jpg" alt="AFH Logistics mobile layout" width="390" height="844" loading="lazy" decoding="async" /></div>
    </div>
    <div className="service-device-switch" role="group" aria-label="Business preview device">{['desktop', 'mobile'].map(item => <button key={item} type="button" aria-pressed={device === item} aria-controls="service-business-devices" onClick={() => setDevice(item)}>{item === 'desktop' ? 'Desktop' : 'Mobile'}</button>)}<span>Same site. Different screen.</span></div>
  </div>;
  return <div className="service-preview service-preview-custom"><ServiceCustomDemo inputRef={inputRef} /></div>;
}

function ServiceCard({ tier, onCaseStudy, caseLink, caseOpen }) {
  const card = useRef(null), frame = useRef(null), input = useRef(null);
  const project = projects.find(item => item.slug === tier.projectSlug);
  useEffect(() => {
    if (tier.id === 'launch') return;
    const element = card.current;
    const motion = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const reset = () => {
      cancelAnimationFrame(frame.current);
      element.style.setProperty('--service-x', '0'); element.style.setProperty('--service-y', '0');
      element.style.setProperty('--service-light-x', '50%'); element.style.setProperty('--service-light-y', '25%');
    };
    const move = event => {
      if (!motion.matches || event.pointerType === 'touch') return;
      cancelAnimationFrame(frame.current);
      const bounds = element.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
      const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
      frame.current = requestAnimationFrame(() => {
        element.style.setProperty('--service-x', String(x - .5)); element.style.setProperty('--service-y', String(y - .5));
        element.style.setProperty('--service-light-x', `${x * 100}%`); element.style.setProperty('--service-light-y', `${y * 100}%`);
      });
    };
    element.addEventListener('pointermove', move); element.addEventListener('pointerleave', reset); element.addEventListener('pointercancel', reset); motion.addEventListener('change', reset);
    return () => { reset(); element.removeEventListener('pointermove', move); element.removeEventListener('pointerleave', reset); element.removeEventListener('pointercancel', reset); motion.removeEventListener('change', reset); };
  }, [tier.id]);

  useEffect(() => {
    if (tier.id !== 'business') return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const list = card.current.querySelector('.service-features');
    const animations = [];
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      if (!motion.matches) [...list.children].forEach((node, index) => animations.push(node.animate([{ opacity: .15, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 480, delay: index * 65, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' })));
    }, { threshold: .15 });
    const cancel = () => animations.forEach(animation => animation.cancel());
    observer.observe(list); motion.addEventListener('change', cancel);
    return () => { observer.disconnect(); cancel(); motion.removeEventListener('change', cancel); };
  }, [tier.id]);

  return <article ref={card} className={`service-card service-${tier.id}`} aria-labelledby={`service-${tier.id}-title`}>
    <div className="service-card-top"><span>{tier.number} / {tier.character}</span><span className="service-level" aria-hidden="true">{[0, 1, 2].map(index => <i key={index} className={index < Number(tier.number) ? 'is-lit' : ''} />)}</span></div>
    <div className="service-intro"><h3 id={`service-${tier.id}-title`}>{tier.name}</h3><p>{tier.description}</p></div>
    <ProjectPreview tier={tier} project={project} inputRef={input} />
    {tier.id === 'custom' ? <div className="service-example service-custom-actions"><button type="button" onClick={() => input.current?.focus()}>Interact with demo <span aria-hidden="true">→</span></button><a ref={caseLink} href="#service-case-study" aria-expanded={caseOpen} aria-controls="service-case-study" onClick={event => { event.preventDefault(); onCaseStudy(); }}>View case study <span aria-hidden="true">↗</span></a></div> : <div className="service-example"><span>{project.name}</span><a href={project.url} target="_blank" rel="noreferrer">{tier.id === 'launch' ? 'View website' : 'Explore project'} <span aria-hidden="true">↗</span></a></div>}
    <p className="service-example-note">{tier.exampleNote}</p>
    <div className="service-price"><span>{tier.priceNote}</span><strong>{tier.price}</strong></div>
    <ul className="service-features" aria-label={`${tier.name} includes`}>{tier.features.map((feature, index) => <li key={feature} style={{ '--feature-index': index }}><span aria-hidden="true">↳</span>{feature}</li>)}</ul>
    <a className="service-inquiry" href={serviceInquiry(tier)}>{tier.action}<span aria-hidden="true">↗</span></a>
  </article>;
}

export function ServicesSection() {
  const [caseOpen, setCaseOpen] = useState(false);
  const caseLink = useRef(null), caseHeading = useRef(null);
  const customProject = projects.find(project => project.slug === 'el-sotano-comico');
  useEffect(() => {
    if (caseOpen) { caseHeading.current?.focus({ preventScroll: true }); caseHeading.current?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }
  }, [caseOpen]);
  function closeCase() { setCaseOpen(false); caseLink.current?.focus({ preventScroll: true }); caseLink.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' }); }
  return <section className="studio-services studio-wrap" id="services" aria-labelledby="services-title">
    <div className="studio-section-heading services-heading"><div><span className="studio-kicker">06 / Work with me</span><h2 id="services-title">The right size<br /><em>for your next step.</em></h2></div><p>A simple launch. A fuller business presence.<br />Or something that needs its own approach.<br /><span>Explore the examples. Find your starting point.</span></p></div>
    <div className="services-grid">{serviceTiers.map(tier => <ServiceCard key={tier.id} tier={tier} onCaseStudy={() => setCaseOpen(true)} caseOpen={caseOpen} caseLink={caseLink} />)}</div>
    <div id="service-case-study" className="service-case-study" hidden={!caseOpen} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); closeCase(); } }}><div className="service-case-top"><span className="studio-kicker">A closer look / Custom work</span><button type="button" onClick={closeCase}>Close case study <span aria-hidden="true">×</span></button></div><h3 ref={caseHeading} tabIndex="-1">A comedy brand.<br /><em>A whole world around it.</em></h3><div className="service-case-grid">{caseOpen && <img src={customProject.screenshot} alt="El Sótano Cómico website" width="1400" height="945" />}<div><h4>{customProject.name}</h4><p>The brief: give the brand a home that carries its personality and connects visitors to more than a single page of content.</p><ul><li><strong>Discovery.</strong> A distinct visual identity and a home for the comedy.</li><li><strong>Connection.</strong> Newsletter capture, a lead-magnet download, and social links.</li><li><strong>Next steps.</strong> A path from discovering the brand to exploring merchandise.</li></ul><p className="service-case-note">The brand studio above is an interactive portfolio demo inspired by this project. Try changing the design, switching formats, and moving the sticker.</p><a href={customProject.url} target="_blank" rel="noreferrer">View the live project ↗</a></div></div></div>
    <div className="services-footnote"><p>Starting prices in USD. Final scope and price agreed before we begin.<br />Examples show the kind of work each service can support.</p><a href="mailto:devilfruitd3v@proton.me?subject=Help%20choosing%20a%20website%20service">Not sure where to start? Let’s talk <span aria-hidden="true">↗</span></a></div>
  </section>;
}
