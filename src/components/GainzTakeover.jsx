import { useEffect, useRef, useState } from 'react';
import { useInView } from '../hooks/useInView.js';

const SIZES = ['S', 'M', 'L', 'XL'];
const COLORS = [
  { name: 'Jet Black', hex: '#111318' },
  { name: 'Bone', hex: '#e8e2d6' },
  { name: 'Acid', hex: '#a6f23c' },
];

function HoodieMark({ color }) {
  return (
    <svg viewBox="0 0 200 220" className="gainz-hoodie">
      <path
        d="M100 8 C70 8 58 26 56 40 C30 46 14 66 14 96 L14 140 L38 140 L38 210 L162 210 L162 140 L186 140 L186 96 C186 66 170 46 144 40 C142 26 130 8 100 8 Z M100 30 C112 30 120 38 122 46 C112 42 88 42 78 46 C80 38 88 30 100 30 Z"
        fill={color}
      />
      <path d="M78 46 C88 42 112 42 122 46 C126 60 118 70 100 70 C82 70 74 60 78 46 Z" fill="#05070c" opacity="0.35" />
    </svg>
  );
}

export function GainzTakeover({ project }) {
  const [hookRef, hookIn] = useInView({ threshold: 0.6 });
  const [questionRef, questionIn] = useInView({ threshold: 0.6 });
  const [flyRef, flyIn] = useInView({ threshold: 0.4 });
  const [overrideRef, overrideIn] = useInView({ threshold: 0.7 });
  const [storeRef, storeIn] = useInView({ threshold: 0.15 });

  const [size, setSize] = useState('M');
  const [color, setColor] = useState(COLORS[0]);
  const [cartOpen, setCartOpen] = useState(false);
  const [inCart, setInCart] = useState(false);

  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const active = overrideIn || storeIn;
    document.body.classList.toggle('takeover-active', active);
    return () => document.body.classList.remove('takeover-active');
  }, [overrideIn, storeIn]);

  function handleCardMove(e) {
    const node = cardRef.current;
    if (!node) return;
    const r = node.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const py = ((e.clientY - r.top) / r.height - 0.5) * 2;
    setTilt({ x: px * -10, y: py * -10 });
  }

  function handleAddToCart() {
    setInCart(true);
    setCartOpen(true);
  }

  return (
    <section id={project.id} className="gainz" style={{ '--case': project.accent }}>
      <div className="gainz-beat gainz-hook" ref={hookRef}>
        <span className={`gainz-num ${hookIn ? 'in' : ''}`}>05</span>
      </div>

      <div className="gainz-beat gainz-pause" aria-hidden="true" />

      <div className="gainz-beat gainz-question" ref={questionRef}>
        <span className={`gainz-num small ${questionIn ? 'in' : ''}`}>05</span>
        <p className={`gainz-question-text ${questionIn ? 'in' : ''}`}>
          YOU STILL
          <br />
          BUY BORING
          <br />
          CLOTHES?
        </p>
      </div>

      <div className={`gainz-beat gainz-fly ${flyIn ? 'in' : ''}`} ref={flyRef}>
        <span className="gainz-fly-card gainz-fly-card-a" style={{ background: '#111318' }} />
        <span className="gainz-fly-card gainz-fly-card-b" style={{ background: '#a6f23c' }} />
        <h3 className="gainz-fly-statement">
          GROWTH
          <br />
          <span>THROUGH</span>
          <br />
          STRUGGLE
        </h3>
      </div>

      <div className={`gainz-beat gainz-override ${overrideIn ? 'in' : ''}`} ref={overrideRef}>
        <span className="gainz-override-line">DROP_001</span>
        <span className="gainz-override-line glitch">SYSTEM OVERRIDE</span>
      </div>

      <div className={`gainz-store ${storeIn ? 'in' : ''}`} ref={storeRef}>
        <div className="gainz-store-head">
          <span>RICHARDSON</span>
          <span className="gainz-store-x">×</span>
          <span>GAINZOFPEACE</span>
        </div>

        <div className="gainz-store-layout">
          <div
            className="gainz-card"
            ref={cardRef}
            onMouseMove={handleCardMove}
            onMouseLeave={() => setTilt({ x: 0, y: 0 })}
            style={{ transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`, background: color.hex }}
          >
            <HoodieMark color={color.hex === '#111318' ? '#464b57' : '#05070c'} />
            <span className="gainz-card-hover-info">
              {color.name} · {size}
            </span>
          </div>

          <div className="gainz-store-panel">
            <span className="gainz-drop-tag">DROP 001</span>
            <h4 className="gainz-product-name">Override Hoodie</h4>

            <div className="gainz-variant-block">
              <span className="gainz-variant-label">Color — {color.name}</span>
              <div className="gainz-swatches">
                {COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    className={`gainz-swatch ${color.name === c.name ? 'active' : ''}`}
                    style={{ background: c.hex }}
                    aria-label={c.name}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>

            <div className="gainz-variant-block">
              <span className="gainz-variant-label">Size — {size}</span>
              <div className="gainz-sizes">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`gainz-size ${size === s ? 'active' : ''}`}
                    onClick={() => setSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <span className="gainz-price">$890 MXN</span>

            <button type="button" className="gainz-add-btn" onClick={handleAddToCart}>
              {inCart ? 'Added ✓ — view cart' : 'Add to cart'}
            </button>
            <p className="gainz-demo-note">A working demo — variant state, cart drawer, no backend.</p>
          </div>
        </div>
      </div>

      <div className={`gainz-cart-drawer ${cartOpen ? 'open' : ''}`}>
        <div className="gainz-cart-head">
          <span>YOUR CART</span>
          <button type="button" onClick={() => setCartOpen(false)} aria-label="Close cart">
            ✕
          </button>
        </div>
        {inCart ? (
          <div className="gainz-cart-item">
            <span className="gainz-cart-swatch" style={{ background: color.hex }} />
            <div>
              <p>Override Hoodie</p>
              <p className="gainz-cart-meta">{color.name} · {size}</p>
            </div>
            <span className="gainz-cart-price">$890</span>
          </div>
        ) : (
          <p className="gainz-cart-empty">Cart is empty.</p>
        )}
        <p className="gainz-demo-note">Portfolio demo — not a real store.</p>
      </div>
      {cartOpen && <div className="gainz-cart-backdrop" onClick={() => setCartOpen(false)} />}

      <div className="gainz-store-foot">
        <a className="explore-link" href="mailto:devilfruitd3v@proton.me">
          Want an interaction like this <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}
