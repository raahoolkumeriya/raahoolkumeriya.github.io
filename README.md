# Rahul Kumeriya – Portfolio & Admin Control Studio

> **Dynamic Cloud & AI Portfolio with Real-Time Authenticated Admin CMS**

[![Deploy Zola to GitHub Pages](https://github.com/raahoolkumeriya/raahoolkumeriya.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/raahoolkumeriya/raahoolkumeriya.github.io/actions/workflows/deploy.yml)
[![Node.js Express](https://img.shields.io/badge/Backend-Node.js%20Express-green?logo=node.js)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## ⚡ Key Highlights

- **Dynamic Content Rendering**: Real-time rendering of Projects, Career Experience, Gists, and Achievements.
- **Admin Control Studio (`/admin`)**: Dedicated, authenticated CMS to add, modify, reorder, or delete projects, career history, gists, and awards.
- **Environment Variables Security**: Admin secrets (`ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`) strictly configured via `.env` and kept private.
- **Search & Tag Filters**: Instant client-side search and tag filtering across engineering blueprints.
- **Static Export Tool**: `npm run sync-to-static` synchronizes dynamic database changes back into static Markdown/Zola files whenever you want to deploy static snapshots to GitHub Pages.

---

## 🏗️ Architecture

```
├── data/
│   └── portfolio-data.json # Dynamic persistent data store
├── public/                 # Dynamic public frontend & Admin Studio
│   ├── index.html          # Dynamic homepage (Hero, Terminal, Metrics, Awards)
│   ├── projects/index.html # Filterable Projects archive with blueprint viewer
│   ├── experience/         # Career timeline with milestone highlights
│   ├── gist/               # Technical gists & code solution embeds
│   ├── admin/              # Authenticated Admin Control Studio
│   │   ├── index.html      # Admin dashboard & modal forms
│   │   ├── admin.css       # Studio glassmorphism UI styles
│   │   └── admin.js        # Auth controller, JWT handler, and CRUD client
│   └── js/dynamic-site.js  # Unified client rendering & search engine
├── scripts/
│   └── sync-static.js      # Utility to sync dynamic data to static files
├── server.js               # Express API backend with JWT authentication
├── .env.example            # Environment configuration template
├── package.json            # Node.js dependencies and scripts
├── static/                 # Stylesheets, vector assets, company logos
└── templates/              # Zola static layout templates
```

---

## 🚀 Running the Dynamic Portfolio & Admin CMS

### 1. Environment Configuration

Copy the example configuration:

```bash
cp .env.example .env
```

Configure your admin secrets inside `.env`:

```env
PORT=3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourStrongPasswordHere!
JWT_SECRET=your_super_secret_jwt_signing_key_here
```

### 2. Launch Local Server

```bash
npm install
npm run dev
```

Visit:
- **Public Portfolio**: [http://localhost:3000](http://localhost:3000)
- **Admin Control Studio**: [http://localhost:3000/admin](http://localhost:3000/admin)

### Prerequisites

Install [Zola](https://www.getzola.org/documentation/getting-started/installation/):

```bash
# macOS (via Homebrew)
brew install zola

# Or via Cargo (Rust toolchain)
cargo install --git https://github.com/getzola/zola
```

### Live Reloading Dev Server

```bash
zola serve
```

Navigate to `http://127.0.0.1:1111/` in your browser. Changes to Markdown files or HTML templates will reload instantly.

### Production Build

```bash
zola build --minify
```

Outputs the optimized static bundle to `public/`.

### Lint & Link Verification

```bash
zola check
```

---

## 🚢 Continuous Deployment

Pushes to the `master` or `main` branches trigger the GitHub Actions workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which builds the minified site with Zola and deploys directly to GitHub Pages.

---

## 👤 Author

**Rahul Kumeriya**  
*Senior Database Platform Engineer & AI Systems Architect*  
Assistant Vice President, Deutsche Bank

- **Website**: [raahoolkumeriya.github.io](https://raahoolkumeriya.github.io)
- **LinkedIn**: [linkedin.com/in/rahulkumeriya](https://www.linkedin.com/in/rahulkumeriya)
- **GitHub**: [@raahoolkumeriya](https://github.com/raahoolkumeriya)
- **Twitter/X**: [@KumeriyaRahul](https://x.com/KumeriyaRahul)
