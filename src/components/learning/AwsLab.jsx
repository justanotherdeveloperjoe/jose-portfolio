import { ArrowUpRight as PhArrowUpRight } from '@phosphor-icons/react';
import { useReducer } from 'react';
import { deliveryReducer, initialDelivery } from '../../lib/learningTasks.js';
import { LabIntro } from './LabParts.jsx';

function CloudMark({ online }) {
  return <svg className="lab-mark" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="45" cy="16" r="8" opacity={online ? 1 : .2} /><path d="M16 42a11 11 0 0 1-1-22 16 16 0 0 1 30-2 12 12 0 1 1 4 24Z" fill="var(--topic-paper)" />{!online && <path d="m22 48-3 7m15-7-3 7m15-7-3 7" />}</svg>;
}

export function AwsLab() {
  const [state, dispatch] = useReducer(deliveryReducer, initialDelivery);
  return <div className="learning-scene aws-lab">
    <LabIntro title="Published doesn’t always mean updated.">Follow a page through storage, a cache, and a visitor’s browser. Then change what happens along the way.</LabIntro>
    <div className="task-window">
      <div className="task-masthead"><div><span className="task-eyebrow">CLOUD DELIVERY STUDY</span><strong>One page. Three stops.</strong></div><CloudMark online={state.online} /></div>
      <ol className="delivery-route" aria-label="Website delivery route">
        <li data-active={state.outcome === 'publish' || state.outcome === 'miss'}><span>01 / STORAGE</span><strong>Amazon S3</strong><b>v{state.origin}</b><small>{state.online ? 'Origin available' : 'Origin unavailable'}</small></li>
        <li data-active={state.outcome === 'hit' || state.outcome === 'miss' || state.outcome === 'invalidate'}><span>02 / EDGE CACHE</span><strong>CloudFront</strong><b>{state.cached === null ? '—' : `v${state.cached}`}</b><small>{state.cached === null ? 'No cached copy' : state.cached !== state.origin ? 'Previous version' : 'Copy stored'}</small></li>
        <li data-active={state.outcome === 'hit' || state.outcome === 'miss'}><span>03 / BROWSER</span><strong>The visitor</strong><b>{state.visitor === null ? '—' : `v${state.visitor}`}</b><small>{state.outcome === 'error' ? 'Request failed' : state.visitor === null ? 'Waiting for a visit' : 'Last page received'}</small></li>
      </ol>
      <div className="delivery-readout"><span><b>{state.requests}</b> visits</span><span><b>{state.hits}</b> cache hits</span><span><b>{state.fetches}</b> origin requests</span></div>
      <p className={`task-status delivery-status ${state.outcome === 'error' ? 'has-error' : ''}`} role="status">{state.message}</p>
      <div className="delivery-controls"><button type="button" className="lab-run" onClick={() => dispatch('visit')}>Visit page <span aria-hidden="true"><PhArrowUpRight aria-hidden="true" className="ph-icon" /></span></button><button type="button" disabled={!state.online} onClick={() => dispatch('publish')}>Publish v{state.origin + 1}</button><button type="button" onClick={() => dispatch('invalidate')}>Clear cache</button></div>
      <div className="delivery-options"><label><input type="checkbox" checked={!state.online} onChange={() => dispatch('toggle-origin')} /> Simulate origin outage</label><button type="button" onClick={() => dispatch('reset')}>Reset demo</button></div>
    </div>
    <p className="scene-caption">Local AWS model; no cloud resources connected. One file and one fresh cache, with expiry and invalidation delays left out.</p>
    <a className="lab-source" href="https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html" target="_blank" rel="noreferrer">How CloudFront invalidation works <span aria-hidden="true"><PhArrowUpRight aria-hidden="true" className="ph-icon" /></span></a>
  </div>;
}
