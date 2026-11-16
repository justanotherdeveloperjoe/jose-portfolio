export const labs = [
  {
    num: '01',
    title: 'React Interface Lab',
    items: ['Reusable components', 'State management', 'Conditional rendering', 'Responsive layouts'],
    blurb: 'Small experiments built while studying component architecture and UI behavior.',
  },
  {
    num: '02',
    title: 'GSAP Motion Lab',
    items: ['ScrollTrigger', 'Timeline animations', 'Parallax', 'Section transitions', 'Micro-interactions'],
    blurb: 'Exploring how motion can improve storytelling without overwhelming the interface.',
  },
  {
    num: '03',
    title: 'SQL Database Lab',
    items: ['SELECT / WHERE', 'JOINs', 'GROUP BY', 'Aggregations', 'Relational thinking'],
    blurb: 'Learning how the interface connects to the data underneath it.',
  },
  {
    num: '04',
    title: 'AWS Cloud Lab',
    items: ['Cloud fundamentals', 'Compute', 'Storage', 'Networking', 'Deployment'],
    blurb: 'Learning the infrastructure behind modern web applications.',
  },
  {
    num: '05',
    title: 'JavaScript Lab',
    items: ['Arrays & objects', 'Promises', 'Async / await', 'Modules', 'DOM', 'APIs'],
    blurb: 'Building stronger fundamentals instead of relying entirely on frameworks.',
  },
];

export const skillCategories = [
  { name: 'Front End', items: ['React', 'JavaScript', 'HTML', 'CSS', 'Responsive Design', 'Vite'] },
  { name: 'Motion / UI', items: ['GSAP', 'ScrollTrigger', 'UI Animation', 'Interaction Design'] },
  { name: 'Data', items: ['SQL', 'Relational Databases'] },
  { name: 'Cloud', items: ['AWS', 'Deployment', 'Hosting', 'DNS'] },
  { name: 'Tools', items: ['Git', 'GitHub', 'Figma', 'AI-assisted Development', 'VS Code'] },
];

export const skillTiers = [
  { tier: 'building', label: 'Building with', items: ['React', 'JavaScript', 'CSS', 'Git'] },
  { tier: 'learning', label: 'Currently learning', items: ['AWS', 'SQL', 'Python'] },
  { tier: 'exploring', label: 'Exploring', items: ['Node', 'TypeScript', 'Backend architecture'] },
];

export const buildingFlow = {
  frontend: { label: 'Frontend', items: ['React', 'JavaScript', 'Responsive UI', 'GSAP'] },
  backend: { label: 'Backend', items: ['Node', 'APIs', 'Databases', 'Authentication'] },
  cloud: { label: 'Cloud / Infrastructure', items: ['AWS', 'Deployment', 'Networking'] },
};
