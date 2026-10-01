export const serviceTiers = [
  {
    id: 'launch', number: '01', name: 'Launch', character: 'A clear starting point',
    description: 'A focused home for your business, with one clear next step for your customers.',
    price: '$300', priceNote: 'Starting at · USD', projectSlug: 'smashouse',
    exampleNote: 'A menu, opening hours, and a direct way to order.',
    features: ['One responsive page', 'A layout made for mobile', 'Contact details & a clear call to action', 'Basic search engine setup', 'Deployment to your hosting'],
    action: 'Start with Launch',
  },
  {
    id: 'business', number: '02', name: 'Business Website', character: 'More room to grow',
    description: 'Give your services room to breathe, and make it easy for the right people to get in touch.',
    price: '$650', priceNote: 'Starting at · USD', projectSlug: 'afh-logistics',
    exampleNote: 'Services, reassurance, and a clear route to a quote.',
    features: ['Multiple pages, clearly organized', 'Responsive design across devices', 'Contact & inquiry forms', 'Dedicated service sections', 'Basic search engine setup', 'Deployment to your hosting'],
    action: 'Plan a business website',
  },
  {
    id: 'custom', number: '03', name: 'Custom Build', character: 'Built around your idea',
    description: 'For the idea that needs its own approach. A new experience, a useful feature, or a better existing site.',
    price: 'Let’s talk.', priceNote: 'Custom quote', projectSlug: 'el-sotano-comico',
    exampleNote: 'A brand experience that connects content, audience, and merch.',
    features: ['Interfaces shaped around your business', 'Thoughtful motion & interactions', 'Connections to your existing tools', 'Custom features & customer journeys', 'Redesigns & existing-site improvements'],
    action: 'Tell me about your idea',
  },
];

export function serviceInquiry(tier) {
  const subject = `Website inquiry — ${tier.name}`;
  const body = `Hi Jose,\n\nI’m interested in ${tier.name}.\n\nMy business / idea:\nWhat I need the website to do:\nIdeal timing:\n\nThanks!`;
  return `mailto:devilfruitd3v@proton.me?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
