# Caffeine Half-Life Calculator

Free caffeine half-life calculator. Estimate how much caffeine remains in your system at bedtime and find the safest time to sleep after coffee, tea, or energy drinks. Based on an average 5-hour half-life exponential decay model.

## Tech Stack

- **React 19** + **Vite 6** + **TypeScript**
- **HeroUI** component library (Card / Input / Select / Button / Chip / Divider / Accordion / Tabs)
- **Tailwind CSS v4** for responsive, mobile-first styling
- **framer-motion** for HeroUI animation support

## Project Structure

```
├── index.html                  # Vite entry template, references shared/ infrastructure
├── package.json
├── vite.config.ts
├── tsconfig.json
├── postcss.config.js
├── public/
│   ├── shared/                 # Shared hub infrastructure (SEO / analytics / ads / base styles / config)
│   │   ├── seo.js
│   │   ├── analytics.js
│   │   ├── ads.js
│   │   ├── base.css
│   │   └── config.json
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── main.tsx
│   ├── App.tsx                 # Main calculator + FAQ + steps + hero, HeroUI-based
│   └── styles/
│       └── globals.css
└── .github/workflows/deploy.yml
```

## Local Development

```bash
npm install
npm run dev
```

## Build & Deploy

```bash
npm run build      # outputs to ./dist
npm run preview    # preview the production build locally
```

Deployment to GitHub Pages is automated via `.github/workflows/deploy.yml`. After pushing to `main`, ensure the repository Pages source is set to **GitHub Actions** in Settings → Pages.

## Shared Infrastructure

The `public/shared/` files are sourced from the [`micro-sites-hub`](https://github.com/Max179/micro-sites-hub) `templates/shared/` directory and provide:

- `seo.js` — dynamic SEO meta + JSON-LD structured data injection (`window.SiteSEO.setupSEO`)
- `analytics.js` — Google Analytics 4 loader with auto event tracking (`window.SiteAnalytics`)
- `ads.js` — AdSense slot management (`window.SiteAds`)
- `base.css` — shared mobile-first base styles with dark mode support
- `config.json` — site-level config (gaId / adsenseId / adPositions / siteUrl)

## Calculator Logic

Caffeine decays exponentially: `remaining = dose × 0.5^(elapsed / half-life)` with half-life options of 3 h (fast), 5 h (average), 7 h (slow). Results flag sleep-impact thresholds (50 mg moderate, 25 mg low, 100 mg high) and estimate the safe-sleep and clearance clock times.

All SEO content (title / meta / keywords / canonical / OG / JSON-LD) and FAQ items from the original static HTML version are preserved.
