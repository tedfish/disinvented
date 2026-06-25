# AGENTS.md — Disinvented

This file is written for AI coding agents who need to understand and modify the **Disinvented** project. Everything below is derived from the actual files in this repository.

## Project overview

Disinvented is a static marketing/showcase website with the tagline *"AI Disinvented. Humans Invented."* It presents a reverse-chronological scroll journey through display technologies, from today's digital screens back to cave paintings. The site is intentionally built without frameworks, build tools, or runtime dependencies.

Key facts:

- **Type:** Static HTML/CSS/JS website.
- **Repository language:** English (content, comments, and documentation).
- **No build step:** Files are served exactly as they exist in the repository.
- **No dependencies:** No `package.json`, `pyproject.toml`, `Cargo.toml`, or other package manifest is present.
- **Deployment target:** Cloudflare Pages (static site).
- **Primary entry point:** `index.html`.

## Technology stack

- **HTML5** — semantic markup; four pages (`index.html`, `work.html`, `about.html`, `contact.html`).
- **CSS3** — single stylesheet `styles.css`; custom properties are not used; colors and gradients are hard-coded.
- **Vanilla JavaScript** — single script `script.js`; no modules, no bundler.
- **Google Fonts** — loaded via `fonts.googleapis.com` for `Cinzel`, `Inter`, `Playfair Display`, and `Space Grotesk`.
- **SVG favicon** — `favicon.svg` is a static, optimized SVG.
- **Raster assets** — device screen textures in WebP (`screen_*.webp`) with PNG fallbacks (`screen_*.png`).

## Code organization

```
disinvented/
├── index.html          # Scroll-snap landing page (8 full-viewport sections)
├── work.html           # Standard content page: "Selected Works"
├── about.html          # Standard content page: "The Origin" / philosophy
├── contact.html        # Standard content page: contact form (not wired to backend)
├── styles.css          # Global stylesheet for all pages
├── script.js           # Scroll-snap enhancements and animation logic for index.html
├── favicon.svg         # Static optimized SVG favicon
├── screen_*.png        # Device screen texture PNG fallbacks
├── screen_*.webp       # Device screen textures (preferred format)
├── robots.txt          # Crawler instructions
├── sitemap.xml         # Page sitemap
└── README.md           # Human-facing deployment instructions
```

### Page types

- **`index.html`** — Full-screen, scroll-snap narrative. CSS `scroll-snap-type` handles the section locking; JavaScript provides dot navigation, Home/End shortcuts, an `IntersectionObserver`-driven indicator, and a persistent `flowing-logo-container` that morphs into each device's screen as the user scrolls.
- **`work.html`, `about.html`, `contact.html`** — Conventional, non-scrolljacked pages that share the same navigation and use the `.standard-page` / `.standard-content` layout classes.

### JavaScript responsibilities (`script.js`)

- Runs in an IIFE and exits early on pages without `.section` elements.
- `IntersectionObserver` to keep the scroll indicator and active section state in sync.
- `requestAnimationFrame`-based animation loop that:
  - Morphs the persistent logo and viewport background into the current device screen.
  - Scales/fades device containers based on viewport visibility.
  - Hides/shows the scroll hint on the first section.
- Dot navigation clicks and Home/End keyboard shortcuts.
- Reads bezel geometry from rendered CSS (`getComputedStyle`) instead of hard-coded values.

### CSS structure (`styles.css`)

- Reset, base typography, skip-link, and `prefers-reduced-motion` at the top.
- Scroll indicator, semantic dots, and section counter.
- Persistent flowing logo and viewport background.
- Theme-specific logo classes (e.g., `.connected-bw`, `.connected-crt`).
- One block per `section-*` with device styling and screen textures (WebP preferred, PNG fallback via `image-set()`).
- Mobile breakpoint at `768px`.
- Shared components: navigation, standard-page layout, content grid, contact form, footer.

## Build and test commands

There is **no build process** and **no automated test suite**.

### Local development

Option 1 — open directly:

```bash
open index.html
```

Option 2 — serve with any static file server, for example Python:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

Option 3 — use Cloudflare Wrangler locally (if already installed):

```bash
npx wrangler pages dev .
```

This is optional; no Wrangler configuration file is required for local static serving.

### Validation

Because there are no tests, verify changes manually:

1. Load `index.html` and test wheel/trackpad scrolling, dot navigation, Home/End keys, and the `768px` breakpoint.
2. Confirm `prefers-reduced-motion` disables snap and animations.
3. Check `work.html`, `about.html`, and `contact.html` for shared navigation consistency.
4. Confirm all `screen_*.webp` and `screen_*.png` references load correctly after path or filename changes.

## Code style guidelines

Follow the existing conventions; do not introduce a formatter config unless asked.

- **Indentation:** 4 spaces in HTML, CSS, and JavaScript.
- **HTML:**
  - Use lowercase tag names and double-quoted attributes.
  - Navigation markup is duplicated across pages; keep it identical when editing links.
  - Page titles follow the pattern `<page name> - disinvented` (except `index.html`, which uses the tagline).
- **CSS:**
  - Use kebab-case class names.
  - Comment blocks delimit major sections (e.g., `/* Section 4: CRT TV */`).
  - Prefer `rgba()` and explicit hex values; no CSS custom properties are currently used.
  - Mobile overrides live in the `@media (max-width: 768px)` block near the bottom.
  - Prefer property-specific `transition` declarations over `transition: all`.
- **JavaScript:**
  - Use `const` by default, `let` for mutable state.
  - Use semicolons and camelCase.
  - DOM queries are cached at the top of the IIFE.
  - Event listeners use `{ passive: true }` for scroll/resize.
  - Keep magic numbers (thresholds, cooldowns) as named constants near the top.

## Testing instructions

- **No automated tests exist.** There is no `test/` directory, no test runner, and no CI configuration.
- Manual test checklist:
  - Scroll-snapping on `index.html` works with mouse wheel, trackpad, touch swipe, and dot clicks.
  - Active dot and section counter update correctly at each of the eight sections.
  - The flowing logo transitions smoothly into each device screen and the final origin title.
  - Standard pages (`work.html`, `about.html`, `contact.html`) render correctly and navigation highlights the active page.
  - The site is usable at viewport widths below and above `768px`.
  - `favicon.svg` and all image assets load without 404s.
  - Visible focus indicators appear on keyboard navigation.

## Deployment process

The site is designed for **Cloudflare Pages**.

### Recommended deployment (Git integration)

1. Push the repository to GitHub.
2. In the Cloudflare Dashboard, go to **Pages → Create a project → Connect to Git**.
3. Select the `disinvented` repository.
4. Build settings:
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/`
5. Save and deploy.

### Alternative deployment (Wrangler CLI)

```bash
npm install -g wrangler
wrangler login
wrangler pages deploy . --project-name=disinvented
```

No `wrangler.toml` is required for static deployments, and the repository ignores `.wrangler/` and `wrangler.toml` via `.gitignore`.

## Security considerations

- **Static site:** There is no server-side code, API, database, or authentication.
- **Secrets:** No secrets are committed. `.gitignore` excludes `.env`, `.env.local`, and `wrangler.toml`.
- **External resources:** Google Fonts load from third-party/CDN-like sources. If deploying with a strict Content-Security-Policy, allow `fonts.googleapis.com` and `fonts.gstatic.com`.
- **Contact form:** `contact.html` contains a form with `action="#"` and `method="POST"`. It is not connected to a backend or form service; submissions will not be processed unless you add an integration. A fallback message is shown on submit.
- **Mailto link:** The CTA in `index.html` uses `mailto:hello@disinvented.com`; update or remove if the address is not configured.
- **No CSP, referrer policy, or HTTPS-enforcing headers are currently set.** Add them at the hosting level (Cloudflare Pages) if required.

## Notes for agents

- If you change class names in `index.html`, update the corresponding selectors in both `styles.css` and `script.js`.
- The logo morphing logic in `script.js` reads bezel dimensions from the rendered `.device-screen` element; keep CSS border widths/radii in sync with the visual design.
- Because navigation HTML is duplicated across pages, update all four files when adding or renaming pages.
- When adding or removing sections on `index.html`, the section counter total is generated from the DOM; only the hard-coded dot labels need manual updates.
