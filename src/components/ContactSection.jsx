import { Check as PhCheck, ArrowUpRight as PhArrowUpRight } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import './ContactSection.css';
import { serviceMessage } from '../data/services.js';

// The delivery plugin supplies onSend(details). Recipient configuration stays server-side.
export function ContactSection({ onSend, inquiry } = {}) {
  const [details, setDetails] = useState({ name: '', email: '', message: '' });
  const [delivery, setDelivery] = useState('idle');
  const [feedback, setFeedback] = useState('');
  const sending = useRef(false);
  const messageInput = useRef(null);
  const drafts = useRef({});
  const activeService = useRef('general');
  const connected = typeof onSend === 'function';

  useEffect(() => {
    if (!inquiry?.tier || sending.current) return;
    const template = serviceMessage(inquiry.tier);
    if (!template) return;
    activeService.current = inquiry.tier.id;
    setDetails(current => ({ ...current, message: drafts.current[inquiry.tier.id] ?? template }));
    setDelivery('idle');
    setFeedback(inquiry.tier.name + ' inquiry ready. Add your details and edit the message however you like.');
    const frame = requestAnimationFrame(() => {
      messageInput.current?.focus({ preventScroll: true });
      messageInput.current?.closest('section')?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [inquiry]);

  function update(event) {
    if (event.target.name === 'message') drafts.current[activeService.current] = event.target.value;
    setDetails(current => ({ ...current, [event.target.name]: event.target.value }));
    setFeedback('');
    setDelivery('idle');
  }

  async function submit(event) {
    event.preventDefault();
    if (!connected || sending.current || delivery === 'success') return;
    const values = Object.fromEntries(Object.entries(details).map(([key, value]) => [key, value.trim()]));
    if (!values.name || !values.message) {
      setFeedback('Please add your name and a short message.');
      event.currentTarget.elements[!values.name ? 'name' : 'message'].focus();
      return;
    }
    sending.current = true;
    setDelivery('sending');
    setFeedback('');
    try {
      const result = await onSend(values);
      if (result?.ok !== true) throw new Error('Delivery was not confirmed');
      setDelivery('success');
      setFeedback('Message sent. Thanks for saying hello.');
    } catch {
      setDelivery('error');
      setFeedback('Your message couldn’t be sent. Your details are still here; please try again.');
    } finally {
      sending.current = false;
    }
  }

  return <section className="studio-contact studio-wrap contact-note" id="contact" aria-labelledby="contact-title">
    <div className="contact-heading"><span className="studio-kicker">07 / Say hello</span><span className="contact-heading-note">Something in mind?</span></div>
    <div className="contact-layout">
      <div className="contact-intro">
        <h2 id="contact-title">Let’s make<br /><em>something good.</em></h2>
        <p>Tell me a little about it.<br />We’ll take it from there.</p>
        <span className="contact-location">JOSE SANCHEZ <span aria-hidden="true">/</span> MONTERREY, MX</span>
      </div>
      <form id="contact-form" className="contact-form" aria-label="Contact Jose" aria-busy={delivery === 'sending'} onSubmit={submit}>
        <fieldset disabled={delivery === 'sending'}>
          <legend className="contact-sr-only">Your contact details and message</legend>
          <div className="contact-fields">
            <label htmlFor="contact-name">Name<input id="contact-name" name="name" autoComplete="name" placeholder="Your name" value={details.name} onChange={update} maxLength={80} required /></label>
            <label htmlFor="contact-email">Email<input id="contact-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={details.email} onChange={update} maxLength={150} required /></label>
          </div>
          <label className="contact-message" htmlFor="contact-message">What do you have in mind?<textarea ref={messageInput} id="contact-message" name="message" placeholder="An idea, a project, or just a hello…" value={details.message} onChange={update} rows={3} maxLength={1200} required /></label>
          <div className="contact-actions">
            <p id="contact-availability">{connected ? 'A good conversation starts here.' : 'Messaging opens soon.'}</p>
            <button className="contact-submit" type="submit" disabled={!connected || delivery === 'sending' || delivery === 'success'} aria-describedby="contact-availability">{delivery === 'sending' ? 'Sending…' : delivery === 'success' ? 'Sent, thank you' : 'Send a note'}<span aria-hidden="true">{delivery === 'success' ? <PhCheck aria-hidden="true" className="ph-icon" /> : <PhArrowUpRight aria-hidden="true" className="ph-icon" />}</span></button>
          </div>
        </fieldset>
        <p className={`contact-feedback is-${delivery}`} role="status" aria-live="polite">{feedback}</p>
      </form>
    </div>
  </section>;
}
