import { Asterisk as PhAsterisk, ArrowUpRight as PhArrowUpRight } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import './LearningSection.css';
import { LearningScene } from './LearningScenes.jsx';

import { learningTopics } from '../data/learning.js';

// A lab notebook: the topics on one side, the chosen topic's experiment and notes on the other.
// Every panel stays mounted (only one shows), so edits in one lab survive a look at another.
export function LearningSection() {
  const [active, setActive] = useState(0);
  const tabs = useRef([]);
  const [horizontal, setHorizontal] = useState(() => window.matchMedia('(max-width: 1100px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 1100px)');
    const update = () => setHorizontal(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  // On narrow screens the topics scroll sideways; the chosen one always slides fully into view.
  function select(index) {
    setActive(index);
    tabs.current[index]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  function navigate(event, index) {
    const target = { ArrowDown: index + 1, ArrowRight: index + 1, ArrowUp: index - 1, ArrowLeft: index - 1, Home: 0, End: learningTopics.length - 1 }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    const next = (target + learningTopics.length) % learningTopics.length;
    select(next);
    tabs.current[next]?.focus();
  }

  return <section className="studio-learning studio-wrap" id="learning" aria-labelledby="learning-title">
    <div className="learning-heading">
      <div><span className="studio-kicker">04 / Currently learning</span><h2 id="learning-title">Still learning.<br /><em>Always building.</em></h2></div>
      <p>Client work keeps me building. Curiosity keeps me learning. I’m strengthening my front-end skills and exploring what’s behind them, one experiment at a time.</p>
    </div>
    <div className="learning-lab">
      <div className="learning-index" role="tablist" aria-orientation={horizontal ? 'horizontal' : 'vertical'} aria-label="What I’m learning">
        {learningTopics.map((topic, index) => <button key={topic.name} ref={element => { tabs.current[index] = element; }} type="button" role="tab" id={`learning-tab-${topic.theme}`} aria-selected={active === index} aria-controls={`learning-panel-${topic.theme}`} tabIndex={active === index ? 0 : -1} className={`learning-tab learning-${topic.theme}`} onClick={() => select(index)} onKeyDown={event => navigate(event, index)}>
          <span className="learning-tab-number">0{index + 1}</span>
          <span className="learning-tab-name">{topic.name}</span>
          <span className="learning-tab-status"><i aria-hidden="true" />{topic.status || 'Learning'}</span>
        </button>)}
      </div>
      {learningTopics.map((topic, index) => <article key={topic.name} id={`learning-panel-${topic.theme}`} role="tabpanel" aria-labelledby={`learning-tab-${topic.theme}`} hidden={active !== index} className={`learning-panel learning-${topic.theme}`}>
        <div className="learning-panel-meta"><span>0{index + 1} / {topic.category}</span><span className="learning-status"><i aria-hidden="true" />{topic.status || 'Learning'}</span></div>
        <div className="learning-panel-body">
          <LearningScene kind={topic.theme} />
          <div className="learning-notes">
            <h3>{topic.name}</h3>
            <h4>{topic.title}</h4>
            <p className="learning-description">{topic.description}</p>
            <div className="learning-focus"><span>Currently learning</span><ul>{topic.topics.map(item => <li key={item}>{item}</li>)}</ul></div>
            <p className="learning-goal"><span>Working toward</span>{topic.next}</p>
          </div>
        </div>
      </article>)}
    </div>
    <div className="learning-outlook">
      <span className="learning-outlook-star" aria-hidden="true"><PhAsterisk aria-hidden="true" className="ph-icon" /></span>
      <div><h3>Getting better is part of the work.</h3><p>There’s always another question to ask, another approach to try, and something to improve in the next build.</p></div>
      <a href="#playground">See my experiments <span aria-hidden="true"><PhArrowUpRight aria-hidden="true" className="ph-icon" /></span></a>
    </div>
  </section>;
}
