import { Magnetic } from './Magnetic.jsx';

export function Footer() {
  return (
    <>
      <section className="cta">
        <div className="cta-tally">
          <span className="cta-tally-line seen">
            <span>YOU'VE SEEN WHAT I'VE BUILT.</span>
          </span>
          <span className="cta-tally-line next">
            <span>LET'S BUILD THE NEXT ONE.</span>
          </span>
        </div>
        <Magnetic className="btn-primary btn-huge" href="mailto:devilfruitd3v@proton.me">
          Start a project <span aria-hidden="true">→</span>
        </Magnetic>
      </section>
      <footer className="sig">Jose Sanchez · Front-End Developer</footer>
    </>
  );
}
