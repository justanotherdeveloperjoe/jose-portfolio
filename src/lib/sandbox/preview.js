import DOMPurify from 'dompurify';

export const SOURCE_LIMIT = 20 * 1024;
export const sourceSize = value => new TextEncoder().encode(value).length;

// No URLs, inline style attributes, navigation, SVG, or executable elements.
const allowedTags = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'section', 'article', 'header', 'footer', 'main', 'aside', 'strong', 'b', 'em', 'i', 'small', 'br', 'hr', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'button'];
const policy = "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src 'none'; font-src 'none'; connect-src 'none'; frame-src 'none'; object-src 'none'; media-src 'none'; base-uri 'none'; form-action 'none'";

export function buildPreview({ html, css }, reducedMotion = false) {
  if (sourceSize(html) > SOURCE_LIMIT || sourceSize(css) > SOURCE_LIMIT) throw new Error('Keep HTML and CSS under 20 KB each.');
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: ['class', 'id', 'title'],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  });
  // CSS escapes preserve literal '<' inside CSS strings while preventing raw-text
  // </style> termination when the browser parses srcdoc.
  const safeCSS = css.replace(/</g, '\\3c ');
  const motion = reducedMotion ? '@layer sandbox-motion { :root, :root *, :root *::before, :root *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; } }' : '';
  return `<!doctype html><html lang="en"><head><meta http-equiv="Content-Security-Policy" content="${policy}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your experiment</title><style>${motion}
* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; padding: 32px; display: grid; place-items: center; background: #e9e6da; color: #191b18; font: 15px/1.5 system-ui, sans-serif; overflow-wrap: anywhere; }
button { cursor: default; }
</style><style>${safeCSS}</style></head><body>${clean}</body></html>`;
}
