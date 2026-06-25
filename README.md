# Disinvented

A static marketing/showcase website with the tagline *"AI Disinvented. Humans Invented."* Deployed to Cloudflare Pages.

## Local Development

Simply open `index.html` in your browser, or use a local server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

For Road Reliquary's API routes, use Cloudflare Pages local dev instead of a plain static server:

```bash
npx wrangler pages dev .
```

That serves the static files and the `functions/` directory together.

Copy `.dev.vars.example` to `.dev.vars` and fill in your local secrets before testing Tesla-backed sync routes.

## Deploying to Cloudflare Pages

### Option 1: GitHub Integration (Recommended)

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/disinvented.git
   git push -u origin main
   ```

2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. Navigate to **Pages** → **Create a project**
4. Select **Connect to Git**
5. Choose your `disinvented` repository
6. Configure build settings:
   - **Build command**: (leave empty for static site)
   - **Build output directory**: `/`
7. Click **Save and Deploy**

### Option 2: Direct Upload

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler pages deploy . --project-name=disinvented
```

## Project Structure

```
disinvented/
├── index.html          # Scroll-snap landing page (8 full-viewport sections)
├── work.html           # Selected Works page
├── about.html          # About / philosophy page
├── contact.html        # Contact form page
├── road-reliquary.html # Road Reliquary prototype page
├── styles.css          # Global stylesheet for all pages
├── script.js           # Scroll-snap enhancements and flowing-logo animation
├── functions/          # Cloudflare Pages Functions for Road Reliquary APIs
├── wrangler.toml       # Local Pages Functions configuration
├── favicon.svg         # Optimized SVG favicon
├── screen_*.png        # Device screen textures (PNG fallbacks)
├── screen_*.webp       # Device screen textures (WebP, preferred)
├── robots.txt          # Crawler instructions
├── sitemap.xml         # Page sitemap
└── README.md           # This file
```

## Architecture

- **No build process**: This is a static site with no compilation, bundling, or transpilation
- **No runtime dependencies**: Pure vanilla HTML/CSS/JS with no frameworks or libraries
- **Cloudflare Pages**: Deployment target with root directory as build output
- **Pages Functions**: Optional backend endpoints for Road Reliquary live relic storage
- **Responsive design**: Mobile breakpoint at 768px
- **Scroll behavior**: CSS scroll-snap on the landing page with JavaScript-enhanced dot navigation and animations
- **Images**: WebP textures with PNG fallbacks via `image-set()`; unused composite asset removed

## Road Reliquary API

Road Reliquary now supports a small Cloudflare Pages backend for persisted relics.

### Endpoints

- `GET /api/relics` returns the stored relic list.
- `POST /api/relics` accepts a normalized trip summary, generates a relic, and stores it.
- `POST /api/relics/sync` fetches Tesla `vehicle_data` server-side, merges it with trip-level overrides, and stores the resulting relic.

### Security model

- Tesla OAuth and live Fleet API calls should stay off the public page.
- A server-side sync process should fetch Tesla trip data, distill it to a trip summary, and `POST` that summary into `/api/relics`.
- `POST /api/relics` requires `Authorization: Bearer <RELIQUARY_INGEST_TOKEN>` in deployed environments.
- If no token is configured, `POST` is accepted only on local `localhost` requests for development.

### Environment bindings

Configure these in Cloudflare Pages:

- `RELIQUARY_INGEST_TOKEN`: shared secret for write access to `/api/relics`
- `RELIQUARY_SYNC_TOKEN`: optional separate secret for `/api/relics/sync` if you do not want to reuse the ingest token
- `RELIQUARY_KV`: KV namespace binding used to persist generated relics
- `TESLA_ACCESS_TOKEN`: Tesla OAuth access token used for Fleet API requests
- `TESLA_VEHICLE_TAG`: VIN or Tesla vehicle identifier used in the Fleet API URL
- `TESLA_API_BASE_URL`: optional override for the Fleet API base URL; defaults to Tesla's North America endpoint

If `RELIQUARY_KV` is not configured, the API falls back to in-memory seeded relics. That is useful for demos but not durable.

The repository includes:

- `wrangler.toml` with a fixed compatibility date and local Pages output settings
- `.dev.vars.example` as the local secret template for Wrangler dev

### Trip summary payload

```json
{
   "label": "Mount Shasta Return",
   "startedAt": "2026-06-25T18:12:00Z",
   "distanceMiles": 241,
   "batteryStartPercent": 92,
   "batteryEndPercent": 21,
   "cabinTempF": 69,
   "outsideTempF": 57,
   "quietMinute": "19:04",
   "routeTexture": "pine, grade, dusk charger",
   "weather": "Fog",
   "chargeStops": 1,
   "altitudeGainFt": 5300,
   "silentMinutes": 129,
   "durationMinutes": 298
}
```

### Example ingest

```bash
curl -X POST http://127.0.0.1:8788/api/relics \
   -H "Content-Type: application/json" \
   -H "Authorization: Bearer YOUR_TOKEN" \
   -d '{
      "label": "Mount Shasta Return",
      "startedAt": "2026-06-25T18:12:00Z",
      "distanceMiles": 241,
      "batteryStartPercent": 92,
      "batteryEndPercent": 21,
      "cabinTempF": 69,
      "outsideTempF": 57,
      "quietMinute": "19:04",
      "routeTexture": "pine, grade, dusk charger",
      "weather": "Fog",
      "chargeStops": 1,
      "altitudeGainFt": 5300,
      "silentMinutes": 129,
      "durationMinutes": 298
   }'
```

The front end at `road-reliquary.html` will fetch `/api/relics` automatically when served through Pages or Wrangler. If the API is unavailable, it falls back to bundled seed relics so the page still renders when opened directly from disk.

### Tesla sync endpoint

`POST /api/relics/sync` is the first-party Tesla bridge. It calls Tesla's Fleet API on the server, reads live `vehicle_data`, and then combines that with the trip-level fields Tesla cannot infer from a single snapshot.

Required override fields for `/api/relics/sync`:

- `distanceMiles`
- `batteryStartPercent`
- `quietMinute`
- `routeTexture`
- `weather`
- `silentMinutes`
- `durationMinutes`

Optional override fields:

- `id`
- `label`
- `startedAt`
- `batteryEndPercent`
- `cabinTempF`
- `outsideTempF`
- `chargeStops`
- `altitudeGainFt`

Example sync request:

```bash
curl -X POST http://127.0.0.1:8788/api/relics/sync \
   -H "Content-Type: application/json" \
   -H "Authorization: Bearer YOUR_SYNC_TOKEN" \
   -d '{
      "label": "Mount Shasta Return",
      "startedAt": "2026-06-25T18:12:00Z",
      "distanceMiles": 241,
      "batteryStartPercent": 92,
      "quietMinute": "19:04",
      "routeTexture": "pine, grade, dusk charger",
      "weather": "Fog",
      "chargeStops": 1,
      "altitudeGainFt": 5300,
      "silentMinutes": 129,
      "durationMinutes": 298
   }'
```

For local development without Tesla credentials, `/api/relics/sync` also accepts a `teslaSnapshot` object in the POST body on `localhost`. That dev-only hook exists so you can validate the end-to-end sync path before wiring real Tesla tokens.

### Styling System

- Google Fonts: `Cinzel`, `Inter`, `Playfair Display`, `Space Grotesk`
- Gradient accents: `#00f5ff` to `#ff00ff`
- Primary dark background: `#000000`
- Responsive breakpoint at 768px
- `prefers-reduced-motion` respected throughout

## Customization

- Edit `index.html` to change landing-page content
- Modify `styles.css` to adjust styling
- Add interactive features in `script.js`
- Update canonical URLs and social meta tags in each HTML file to match your domain
