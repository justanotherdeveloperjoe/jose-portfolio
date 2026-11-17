import { ArrowUpRight as PhArrowUpRight, Check as PhCheck, Eye as PhEye, Stack as PhStack, Lightning as PhLightning, Code as PhCode } from '@phosphor-icons/react';
import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { projects } from '../data/projects.ts';
import { serviceInquiry, serviceTiers } from '../data/services.ts';
import type { ServiceTier } from '../data/services.ts';
import './ServicesSection.css';
import './services-showcase.css';

type InquiryHandler = (tier: ServiceTier) => void;

// Each plan's pitch line and the phone screenshot used in its device preview.
const pitch: Record<string, { lead: string; phone: string | null; laptop?: string }> = {
  launch: { lead: 'A strong starting point for your business, idea, or project.', phone: null },
  business: { lead: 'A complete website with more room to grow your business.', phone: '/screenshots/afh-mobile.jpg' },
  custom: { lead: 'A tailored solution built around your idea, goals, and audience.', phone: '/screenshots/elsotanocomico-live-mobile.jpg', laptop: '/screenshots/elsotanocomico-live.jpg' },
};

const promises = [
  { icon: PhStack, title: 'Clear scope', text: 'You know what’s included from the start.' },
  { icon: PhLightning, title: 'Built for growth', text: 'A solid base you can expand later.' },
  { icon: PhCode, title: 'Tailored to you', text: 'From straightforward to fully custom.' },
];

export function ServicesSection({ onInquiry }: { onInquiry?: InquiryHandler } = {}) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const tier = serviceTiers[active];
  const project = projects.find(item => item.slug === tier.projectSlug);
  const custom = tier.id === 'custom';
  const extra = pitch[tier.id];

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const target = ({ ArrowDown: index + 1, ArrowRight: index + 1, ArrowUp: index - 1, ArrowLeft: index - 1, Home: 0, End: serviceTiers.length - 1 } as Partial<Record<string, number>>)[event.key];
    if (target === undefined) return;
    event.preventDefault();
    const next = (target + serviceTiers.length) % serviceTiers.length;
    setActive(next);
    tabs.current[next]?.focus();
  }

  return <section className="studio-services svc studio-wrap" id="services" aria-labelledby="services-title">
    <div className="svc-head">
      <div className="svc-title"><span className="studio-kicker svc-kicker"><b>05</b> / Services &amp; pricing</span><h2 id="services-title">The right size<br /><em>for your next step.</em></h2></div>
      <div className="svc-intro"><p>A simple launch. A fuller business presence.<br />Or something that needs its own approach.</p><p className="svc-intro-strong">Explore the options and find your starting point.</p></div>
    </div>

    <div className="svc-body">
      <div className="svc-tiers" role="tablist" aria-orientation="vertical" aria-label="Services">
        {serviceTiers.map((item, index) => <button
          key={item.id}
          ref={node => { tabs.current[index] = node; }}
          type="button"
          role="tab"
          id={`svc-tab-${item.id}`}
          aria-selected={active === index}
          aria-controls="svc-panel"
          tabIndex={active === index ? 0 : -1}
          className="svc-tier"
          onClick={() => setActive(index)}
          onKeyDown={event => navigate(event, index)}
        >
          <span className="svc-tier-text">
            <span className="svc-tier-kicker">{item.number} / {item.character}</span>
            <span className="svc-tier-name">{item.name}</span>
            <span className="svc-tier-desc">{item.description}</span>
          </span>
          <span className={`svc-tier-price${item.id === 'custom' ? ' is-quote' : ''}`}>{item.price}</span>
          <PhArrowUpRight aria-hidden="true" className="ph-icon svc-tier-arrow" />
        </button>)}
      </div>

      <article className="svc-panel" id="svc-panel" role="tabpanel" aria-labelledby={`svc-tab-${tier.id}`} key={tier.id}>
        <div className="svc-panel-copy">
          <span className="svc-selected">Selected service</span>
          <h3>{tier.name}</h3>
          <p className="svc-lead">{extra.lead}</p>
          <h4>What’s included</h4>
          <ul className="svc-features">{tier.features.map(feature => <li key={feature}><PhCheck aria-hidden="true" className="ph-icon" weight="bold" />{feature}</li>)}</ul>
        </div>
        <div className="svc-devices" aria-hidden="true">
          <i className="svc-slash" />
          <i className="svc-spark"><i /><i /><i /></i>
          <span className="svc-laptop"><span className="svc-laptop-bar"><i /><i /><i /></span><img src={extra.laptop ?? project?.screenshot ?? undefined} alt="" loading="lazy" decoding="async" /></span>
          <span className="svc-laptop-base" />
          <span className="svc-phone"><img src={extra.phone ?? project?.screenshot ?? undefined} alt="" loading="lazy" decoding="async" className={extra.phone ? '' : 'is-desktop-crop'} /></span>
        </div>
        <div className="svc-panel-foot">
          <div className="svc-price"><span>{custom ? 'Custom quote' : 'Starting at'}</span><b className={custom ? 'is-quote' : ''}>{tier.price}</b></div>
          <a className="svc-cta" href={serviceInquiry()} onClick={event => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) onInquiry?.(tier); }}>{tier.action}<PhArrowUpRight aria-hidden="true" className="ph-icon" /></a>
          {project?.url
            ? <a className="svc-example" href={project.url} target="_blank" rel="noreferrer" aria-label={`View example: ${project.name} (opens in a new tab)`}><PhEye aria-hidden="true" className="ph-icon" />View example</a>
            : <span className="svc-example is-soon">Example launching soon</span>}
        </div>
        <p className="svc-example-note">Example: {project?.name}. {tier.exampleNote}</p>
      </article>
    </div>

    <ul className="svc-promises">
      {promises.map(({ icon: Icon, title, text }) => <li key={title}><Icon aria-hidden="true" className="ph-icon" /><span><b>{title}</b>{text}</span></li>)}
    </ul>
    <p className="svc-footnote">Starting prices in USD. Final scope and price agreed before we begin. <a href="#contact">Not sure where to start? Let’s talk <PhArrowUpRight aria-hidden="true" className="ph-icon" /></a></p>
  </section>;
}
