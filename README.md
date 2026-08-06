# arnabdas1034.github.io

Personal site: [arnabdas1034.github.io](https://arnabdas1034.github.io)

A single hand-written page: what I'm building now, what I've shipped, what's
next, and where I want it to go. No framework, no build step, no dependencies.

## Contents

| File | |
|---|---|
| `index.html` | The whole site: markup, styles and script inline. |
| `resume.pdf` | Résumé, linked from the header. |
| `og-image-v3.png` | 1200×630 link-preview card. |

## Notes

- Serves straight from the `main` branch root via GitHub Pages.
- Two themes, Paper and Dark; Dark is the default.
- Edit `index.html` and push. That's the entire deploy process.
- The link-preview card is versioned in its filename. Bump it when the artwork
  changes, since LinkedIn and WhatsApp cache previews by URL.

## Invariant: no third-party runtime dependencies

The page loads nothing from anyone else's server. No CDN, no icon kit, no
webfont, no analytics, no framework. Type is system fonts only (Georgia for
body, the platform monospace for labels), the favicon is an inline `data:` URI,
and both the stylesheet and the scripts live inside `index.html`.

A `Content-Security-Policy` meta tag in the `<head>` enforces this at runtime:
`default-src 'none'` with allowances only for inline style, inline script, and
same-origin or `data:` images. Anything added later that reaches for an external
host will be blocked and will show up in the browser console.

Keep it that way. A hosted kit is someone else's uptime and someone else's
change log; if an icon or a face is needed, inline the SVG or self-host a
subset.

© Arnab Das
