import { useState } from 'react';
import { Hero } from './components/Hero.jsx';
import { WorkIndex } from './components/WorkIndex.jsx';
import { CornerFrame } from './components/CornerFrame.jsx';
import { IntroSequence } from './components/IntroSequence.jsx';
import { ProjectSection } from './components/ProjectSection.jsx';
import { HowIBuild } from './components/HowIBuild.jsx';
import { LabsSection } from './components/LabsSection.jsx';
import { Footer } from './components/Footer.jsx';
import { projects } from './data/projects.js';

export default function App() {
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
