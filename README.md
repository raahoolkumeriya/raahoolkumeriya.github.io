# Rahul Kumeriya – Portfolio

> **Blazing-Fast, Responsive Portfolio Powered by Rust & [Zola](https://www.getzola.org/)**

[![Deploy Zola to GitHub Pages](https://github.com/raahoolkumeriya/raahoolkumeriya.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/raahoolkumeriya/raahoolkumeriya.github.io/actions/workflows/deploy.yml)
[![Built with Zola](https://img.shields.io/badge/Built_with-Zola_(Rust)-orange?logo=rust)](https://www.getzola.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## ⚡ Performance Highlights

- **Rust-Fast Compilation**: Generates the entire website and sitemap in **< 60 milliseconds**.
- **Ultra-Lightweight Payload**: Zero JavaScript framework overhead (No React, Next.js, or Semantic UI bloat).
- **Zero-Dependency CSS**: Clean, modern CSS with native CSS Grid, Flexbox, and Dark/Light mode tokens (**< 15 KB** total).
- **Responsive & Accessible**: Native mobile navigation drawer, fluid typography, and accessible color contrast.

---

## 🏗️ Architecture

```
├── .github/workflows/
│   └── deploy.yml          # GitHub Actions CI/CD for automated GitHub Pages deployment
├── content/
│   ├── _index.md           # Homepage configuration
│   ├── experience/         # Career timeline & leadership milestones
│   ├── gist/               # Technical snippets & MongoDB script solutions
│   └── projects/           # Architectural blueprints & hackathon systems
├── static/
│   ├── css/style.css       # Unified design system & responsive layout (<15KB)
│   ├── js/main.js          # Lightweight theme switcher & terminal helpers (<2KB)
│   └── images/             # Vector icons and SVG illustrations
├── templates/
│   ├── base.html           # Master layout, SEO meta tags, and footer
│   ├── index.html          # Hero section, interactive terminal, skills & awards
│   ├── section.html        # Generic listing template
│   ├── page.html           # Project detail blueprint with YouTube embeds
│   ├── experience.html     # Interactive vertical career timeline
│   ├── gist.html           # Gist showcase with embedded script
│   └── 404.html            # Custom responsive 404 error page
├── zola.toml               # Site metadata, navigation menus, and markdown config
└── README.md
```

---

## 🚀 Local Development

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
