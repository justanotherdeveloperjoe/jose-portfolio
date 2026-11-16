import { useState } from 'react';
import { StudioPortfolio } from './components/StudioPortfolio.tsx';
import './studio.css';
import './studio-details.css';
import './studio-editorial.css';
import { Hero } from './components/Hero.tsx';
import { WorkIndex } from './components/WorkIndex.tsx';
import { CornerFrame } from './components/CornerFrame.tsx';
import { IntroSequence } from './components/IntroSequence.tsx';
import { ProjectSection } from './components/ProjectSection.tsx';
import { HowIBuild } from './components/HowIBuild.tsx';
import { LabsSection } from './components/LabsSection.tsx';
import { Footer } from './components/Footer.tsx';
import { projects } from './data/projects.ts';

export default function App() {
  if (new URLSearchParams(window.location.search).get('view') !== 'original') {
    return <StudioPortfolio />;
  }
  return <OriginalPortfolio />;
}

function OriginalPortfolio() {
  const [introDone, setIntroDone] = useState(false);
  const firstBlock = projects.slice(0, 3);
  const restBlock = projects.slice(3);

  return (
    <div className="page">
      <IntroSequence onDone={() => setIntroDone(true)} />
      <CornerFrame projects={projects} visible={introDone} />

      <Hero />
      <WorkIndex projects={projects} />

      <div className="work-layout">
        <main className="project-stream">
          {firstBlock.map((p, i) => (
            <ProjectSection key={p.id} project={p} index={i} />
          ))}
          <HowIBuild />
          {restBlock.map((p, i) => (
            <ProjectSection key={p.id} project={p} index={i + 3} />
          ))}
          <LabsSection />
        </main>
      </div>

      <Footer />
    </div>
  );
}
