import './LearningSection.css';
import { LearningScene } from './LearningScenes.jsx';

import { learningTopics } from '../data/learning.js';

export function LearningSection() {
  return <section className="studio-learning studio-wrap" id="learning" aria-labelledby="learning-title">
    <div className="learning-heading">
      <div><span className="studio-kicker">04 / Currently learning</span><h2 id="learning-title">Still learning.<br /><em>Always building.</em></h2></div>
      <p>Client work keeps me building. Curiosity keeps me learning. I’m strengthening my front-end skills and exploring what’s behind them, one experiment at a time.</p>
    </div>
    <div className="learning-grid">
      {learningTopics.map((topic, index) => <article className={`learning-card learning-${topic.theme}`} key={topic.name} aria-labelledby={`learning-${topic.theme}-title`}>
        <div className="learning-card-meta"><span>0{index + 1} / {topic.category}</span><span className="learning-status"><i aria-hidden="true" />{topic.status || 'Learning'}</span></div>
        <div className="learning-card-visual"><h3 id={`learning-${topic.theme}-title`}>{topic.name}</h3><span className="learning-try-label">TRY A LITTLE EXPERIMENT ↘</span></div>
        <LearningScene kind={topic.theme} />
        <h4>{topic.title}</h4>
        <p className="learning-description">{topic.description}</p>
        <div className="learning-focus"><span>Currently learning</span><ul>{topic.topics.map(item => <li key={item}>{item}</li>)}</ul></div>
        <details className="learning-next"><summary>What I’m working toward <span aria-hidden="true">↗</span></summary><p>{topic.next}</p></details>
      </article>)}
    </div>
    <div className="learning-outlook">
      <span className="learning-outlook-star" aria-hidden="true">✳</span>
      <div><h3>Getting better is part of the work.</h3><p>There’s always another question to ask, another approach to try, and something to improve in the next build.</p></div>
      <a href="#playground">See my experiments <span aria-hidden="true">↗</span></a>
    </div>
  </section>;
}
