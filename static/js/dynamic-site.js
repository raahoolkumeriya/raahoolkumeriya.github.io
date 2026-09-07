/**
 * Dynamic Portfolio Rendering Engine
 * Author: Rahul Kumeriya
 * Features: Instant API fetch, zero-flicker cache, live search/tag filtering, modals
 */

(function () {
  'use strict';

  // State cache
  let siteData = null;

  // Fetch full portfolio content from API or static JSON with caching
  async function fetchContent() {
    // 1. Check local Express server API if running
    try {
      const res = await fetch('/api/content');
      if (res.ok) {
        siteData = await res.json();
        sessionStorage.setItem('rk_portfolio_data', JSON.stringify(siteData));
        return siteData;
      }
    } catch (e) {
      // Proceed to static fallback
    }

    // 2. Fetch static JSON data (GitHub Pages mode)
    const staticPaths = ['/data/portfolio-data.json', '/static/data/portfolio-data.json', './data/portfolio-data.json'];
    for (const path of staticPaths) {
      try {
        const res = await fetch(path);
        if (res.ok) {
          siteData = await res.json();
          sessionStorage.setItem('rk_portfolio_data', JSON.stringify(siteData));
          return siteData;
        }
      } catch (e) {
        // Try next path
      }
    }

    // 3. Fallback to session cache
    const cached = sessionStorage.getItem('rk_portfolio_data');
    if (cached) {
      siteData = JSON.parse(cached);
      return siteData;
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Index / Homepage Dynamic Renderer
  // ---------------------------------------------------------------------------
  function renderHomepage(data) {
    if (!data) return;

    // 1. Profile & Hero
    const { profile, projects, achievements, skills } = data;

    const heroTaglineEl = document.getElementById('hero-tagline-text');
    if (heroTaglineEl && profile.heroTagline) {
      heroTaglineEl.innerHTML = profile.heroTagline;
    }

    const heroTitleEl = document.getElementById('hero-title-text');
    if (heroTitleEl && profile.heroTitle) {
      heroTitleEl.innerHTML = profile.heroTitle;
    }

    const heroSubEl = document.getElementById('hero-subtitle-text');
    if (heroSubEl && profile.heroSubtitle) {
      heroSubEl.innerHTML = profile.heroSubtitle;
    }

    // 2. Metrics Strip
    const metricsContainer = document.getElementById('metrics-container');
    if (metricsContainer && profile.metrics) {
      metricsContainer.innerHTML = profile.metrics.map(m => `
        <div class="metric-card">
          <div class="metric-val">${escapeHtml(m.value)}</div>
          <div class="metric-label">${escapeHtml(m.label)}</div>
        </div>
      `).join('');
    }

    // 3. Interactive Terminal Content
    if (profile.terminal) {
      const paneAbout = document.getElementById('pane-about-content');
      if (paneAbout && profile.terminal.about) {
        paneAbout.innerHTML = formatPythonCode(profile.terminal.about, profile.socials);
      }

      const paneArch = document.getElementById('pane-arch-content');
      if (paneArch && profile.terminal.architecture) {
        paneArch.innerHTML = formatYamlCode(profile.terminal.architecture);
      }

      const paneMilestones = document.getElementById('pane-milestones-content');
      if (paneMilestones && profile.terminal.milestones) {
        paneMilestones.innerHTML = formatJsonCode(profile.terminal.milestones);
      }
    }

    // 4. Featured Projects (Top 3)
    const featuredProjectsContainer = document.getElementById('featured-projects-container');
    if (featuredProjectsContainer && projects) {
      const sorted = [...projects].sort((a, b) => (a.weight || 99) - (b.weight || 99));
      const featured = sorted.slice(0, 3);

      featuredProjectsContainer.innerHTML = featured.map((p, idx) => `
        <article class="card ${idx === 0 ? 'card-featured' : ''}">
          ${p.badge ? `<span class="card-badge ${p.badgeColor || (idx === 0 ? 'badge-purple' : 'badge-blue')}">${escapeHtml(p.badge)}</span>` : ''}
          <h3>
            <a href="/projects/#${p.slug || p.id}">${escapeHtml(p.title)}</a>
          </h3>
          <p>${escapeHtml(p.description)}</p>
          <div class="card-footer">
            <div class="tags-group">
              ${(p.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
            </div>
            <a class="btn btn-outline btn-sm" href="/projects/#${p.slug || p.id}">
              <span>Blueprint</span> <span class="arrow-icon">➔</span>
            </a>
          </div>
        </article>
      `).join('');
    }

    // 5. Skills Grid
    const skillsContainer = document.getElementById('skills-container');
    if (skillsContainer && skills) {
      skillsContainer.innerHTML = skills.map(s => `
        <div class="card">
          <span class="card-badge ${s.badgeColor || 'badge-emerald'}">${escapeHtml(s.badge)}</span>
          <h3>${escapeHtml(s.title)}</h3>
          <p>${escapeHtml(s.description)}</p>
        </div>
      `).join('');
    }

    // 6. Awards & Milestones Grid
    const achievementsContainer = document.getElementById('achievements-container');
    if (achievementsContainer && achievements) {
      achievementsContainer.innerHTML = achievements.map((a, idx) => `
        <div class="card ${a.featured || idx === 0 ? 'card-featured' : ''}">
          <span class="card-badge ${a.badge || 'badge-purple'}">${escapeHtml(a.date)}</span>
          <h3>${escapeHtml(a.title)}</h3>
          <p>${escapeHtml(a.description)}</p>
        </div>
      `).join('');
    }
  }

  // ---------------------------------------------------------------------------
  // Projects Page Dynamic Renderer with Real-time Filter & Modal
  // ---------------------------------------------------------------------------
  function renderProjectsPage(data) {
    if (!data || !data.projects) return;

    const listContainer = document.getElementById('projects-list-container');
    const filterContainer = document.getElementById('tags-filter-container');
    const searchInput = document.getElementById('project-search-input');
    if (!listContainer) return;

    let activeTag = 'all';
    let searchQuery = '';

    // Collect all unique tags
    const allTags = new Set();
    data.projects.forEach(p => (p.tags || []).forEach(t => allTags.add(t)));

    // Render filter pills
    if (filterContainer) {
      const tagsList = ['all', ...Array.from(allTags)];
      filterContainer.innerHTML = tagsList.map(tag => `
        <button class="filter-pill ${tag === 'all' ? 'active' : ''}" data-tag="${escapeHtml(tag)}">
          ${tag === 'all' ? 'All Projects' : escapeHtml(tag)}
        </button>
      `).join('');

      filterContainer.querySelectorAll('.filter-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          filterContainer.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          activeTag = btn.getAttribute('data-tag');
          filterAndRender();
        });
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        filterAndRender();
      });
    }

    function filterAndRender() {
      const filtered = data.projects.filter(p => {
        const matchesTag = activeTag === 'all' || (p.tags || []).some(t => t.toLowerCase() === activeTag.toLowerCase());
        const matchesSearch = !searchQuery ||
          p.title.toLowerCase().includes(searchQuery) ||
          p.description.toLowerCase().includes(searchQuery) ||
          (p.tags || []).some(t => t.toLowerCase().includes(searchQuery));
        return matchesTag && matchesSearch;
      });

      if (filtered.length === 0) {
        listContainer.innerHTML = `
          <div class="no-results-box">
            <p>No projects match your filter criteria.</p>
            <button class="btn btn-outline btn-sm" onclick="resetFilters()">Clear Filters</button>
          </div>
        `;
        return;
      }

      listContainer.innerHTML = filtered.map((p, idx) => `
        <article class="card ${p.featured ? 'card-featured' : ''}" id="${p.slug || p.id}">
          ${p.badge ? `<span class="card-badge ${p.badgeColor || 'badge-purple'}">${escapeHtml(p.badge)}</span>` : ''}
          <h3>
            <a href="javascript:void(0)" onclick="openProjectModal('${p.id}')">${escapeHtml(p.title)}</a>
          </h3>
          <p>${escapeHtml(p.description)}</p>
          <div class="card-footer">
            <div class="tags-group">
              ${(p.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
            </div>
            <div class="card-actions">
              ${p.github ? `<a class="btn btn-outline btn-sm" href="${escapeHtml(p.github)}" target="_blank" rel="noopener noreferrer">GitHub ↗</a>` : ''}
              <button class="btn btn-primary btn-sm" onclick="openProjectModal('${p.id}')">
                <span>Blueprint</span> <span class="arrow-icon">➔</span>
              </button>
            </div>
          </div>
        </article>
      `).join('');
    }

    window.resetFilters = function () {
      activeTag = 'all';
      searchQuery = '';
      if (searchInput) searchInput.value = '';
      if (filterContainer) {
        filterContainer.querySelectorAll('.filter-pill').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-tag') === 'all');
        });
      }
      filterAndRender();
    };

    filterAndRender();

    // Check if hash matches project
    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      const match = data.projects.find(p => p.id === hash || p.slug === hash);
      if (match) {
        setTimeout(() => openProjectModal(match.id), 300);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Experience Page Dynamic Renderer
  // ---------------------------------------------------------------------------
  function renderExperiencePage(data) {
    if (!data || !data.experience) return;

    const timelineContainer = document.getElementById('experience-timeline-container');
    if (!timelineContainer) return;

    timelineContainer.innerHTML = data.experience.map((e, idx) => `
      <div class="timeline-item" id="${e.id}">
        <div class="timeline-marker"></div>
        <div class="timeline-date">
          <span>${escapeHtml(e.startDate)} – ${escapeHtml(e.endDate)}</span> • <span>${escapeHtml(e.duration)}</span>
        </div>
        <div class="card ${e.featured || idx === 0 ? 'card-featured' : ''}">
          <div class="company-header">
            <img src="${e.logo || '/static/images/deutsche-bank.svg'}" alt="${escapeHtml(e.company)}" class="company-logo" onerror="this.src='/static/images/developer_activity.fc9f8bef8cc2.svg'">
            <div class="company-title-wrap">
              <h3>${escapeHtml(e.company)}</h3>
              <span class="role-pill">${escapeHtml(e.rolePill || e.role)}</span>
              <span class="role-location">${escapeHtml(e.location)}</span>
            </div>
          </div>
          <p>${escapeHtml(e.summary)}</p>
          ${e.highlights && e.highlights.length ? `
            <ul class="experience-list">
              ${e.highlights.map(h => `<li>${formatHighlight(h)}</li>`).join('')}
            </ul>
          ` : ''}
          <div class="card-footer">
            <div class="tags-group">
              ${(e.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  // ---------------------------------------------------------------------------
  // Gist Page Dynamic Renderer
  // ---------------------------------------------------------------------------
  function renderGistPage(data) {
    if (!data || !data.gists) return;

    const gistContainer = document.getElementById('gists-list-container');
    if (!gistContainer) return;

    gistContainer.innerHTML = data.gists.map((g, idx) => `
      <article class="card ${g.featured || idx === 0 ? 'card-featured' : ''} gist-card" id="${g.id}">
        <span class="card-badge badge-emerald" style="margin-bottom: 1.25rem;">${escapeHtml(g.category || 'Database & Automation Solution')}</span>
        <h2 class="gist-title">${escapeHtml(g.title)}</h2>

        ${g.scenario ? `
          <h3 style="font-size: 1.15rem; margin-top: 1rem; color: var(--accent-primary);">Automation Scenario</h3>
          <p style="margin-bottom: 1rem;">${escapeHtml(g.scenario)}</p>
        ` : ''}

        ${g.challenge ? `
          <h3 style="font-size: 1.15rem; margin-top: 1rem; color: var(--accent-amber);">The Engineering Challenge</h3>
          <p style="margin-bottom: 1.5rem;">${escapeHtml(g.challenge)}</p>
        ` : ''}

        ${g.embedScriptUrl ? `
          <div class="gist-embed-wrapper" id="embed-${g.id}">
            <iframe
              srcdoc="<style>body{margin:0;font-family:sans-serif;} .gist .gist-file{margin:0 !important;}</style><script src='${escapeHtml(g.embedScriptUrl)}'></script>"
              style="width: 100%; min-height: 280px; border: 0;"
              onload="this.style.height=(this.contentWindow.document.body.scrollHeight + 40)+'px'">
            </iframe>
          </div>
        ` : ''}

        <div class="card-footer gist-footer">
          <div class="tags-group">
            ${(g.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
          </div>
          ${g.gistUrl ? `
            <a class="btn btn-primary btn-sm" href="${escapeHtml(g.gistUrl)}" target="_blank" rel="noopener noreferrer">
              <span>Open on GitHub Gist</span> ↗
            </a>
          ` : ''}
        </div>
      </article>
    `).join('');
  }

  // ---------------------------------------------------------------------------
  // Project Blueprint Modal
  // ---------------------------------------------------------------------------
  window.openProjectModal = function (projectId) {
    if (!siteData || !siteData.projects) return;
    const project = siteData.projects.find(p => p.id === projectId || p.slug === projectId);
    if (!project) return;

    let modal = document.getElementById('project-blueprint-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'project-blueprint-modal';
      modal.className = 'blueprint-modal-overlay';
      modal.innerHTML = `
        <div class="blueprint-modal-dialog">
          <button class="blueprint-modal-close" onclick="closeProjectModal()">&times;</button>
          <div id="blueprint-modal-body"></div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeProjectModal();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeProjectModal();
      });
    }

    const body = document.getElementById('blueprint-modal-body');
    body.innerHTML = `
      <div style="margin-bottom: 1.5rem;">
        ${project.badge ? `<span class="card-badge ${project.badgeColor || 'badge-purple'}" style="margin-bottom: 0.75rem;">${escapeHtml(project.badge)}</span>` : ''}
        <h2 style="font-size: 1.85rem; margin-bottom: 0.5rem;">${escapeHtml(project.title)}</h2>
        <p style="color: var(--text-secondary); line-height: 1.6; font-size: 1.1rem; margin-bottom: 1.25rem;">
          ${escapeHtml(project.description)}
        </p>
        <div class="article-meta-bar" style="margin-bottom: 1.5rem;">
          <div class="tags-group">
            ${(project.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
          </div>
          <div style="display: flex; gap: 0.5rem;">
            ${project.github ? `<a class="btn btn-primary btn-sm" href="${escapeHtml(project.github)}" target="_blank" rel="noopener noreferrer">View on GitHub ↗</a>` : ''}
            ${project.demo ? `<a class="btn btn-outline btn-sm" href="${escapeHtml(project.demo)}" target="_blank" rel="noopener noreferrer">Live Demo ↗</a>` : ''}
          </div>
        </div>
      </div>

      ${project.video ? `
        <div class="video-container" style="margin-bottom: 2rem;">
          <iframe src="${escapeHtml(project.video)}" title="${escapeHtml(project.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
      ` : ''}

      <div class="card article-content-card" style="padding: 1.75rem;">
        ${formatMarkdownContent(project.content)}
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeProjectModal = function () {
    const modal = document.getElementById('project-blueprint-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  // ---------------------------------------------------------------------------
  // Syntax & Markdown Formatters
  // ---------------------------------------------------------------------------
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatHighlight(text) {
    if (!text) return '';
    // Bold keywords before colon
    const parts = text.split(':');
    if (parts.length > 1) {
      return `<strong>${escapeHtml(parts[0])}:</strong>${escapeHtml(parts.slice(1).join(':'))}`;
    }
    return escapeHtml(text);
  }

  function formatPythonCode(code, socials) {
    let html = '';
    const lines = code.split('\n');
    lines.forEach(line => {
      let l = escapeHtml(line);
      l = l.replace(/\b(class|def)\b/g, '<span class="syn-keyword">$1</span>');
      l = l.replace(/\b(PlatformEngineer|__init__)\b/g, '<span class="syn-func">$1</span>');
      l = l.replace(/\b(self)\b/g, '<span class="syn-key">$1</span>');
      l = l.replace(/(&quot;.*?&quot;)/g, '<span class="syn-str">$1</span>');
      html += `<div>${l}</div>`;
    });

    if (socials) {
      html += `
        <div class="terminal-socials" style="margin-top: 0.5rem;">
          <a href="${escapeHtml(socials.github)}" target="_blank" class="terminal-social-link">GitHub ↗</a>
          <a href="${escapeHtml(socials.linkedin)}" target="_blank" class="terminal-social-link">LinkedIn ↗</a>
          <a href="${escapeHtml(socials.twitter)}" target="_blank" class="terminal-social-link">X / Twitter ↗</a>
          <a href="${escapeHtml(socials.medium)}" target="_blank" class="terminal-social-link">Medium ↗</a>
        </div>
      `;
    }
    return html;
  }

  function formatYamlCode(code) {
    let html = '';
    const lines = code.split('\n');
    lines.forEach(line => {
      let l = escapeHtml(line);
      if (l.trim().startsWith('#')) {
        html += `<div><span class="syn-comment">${l}</span></div>`;
      } else {
        l = l.replace(/^(\s*)([\w_-]+)(:)/g, '$1<span class="syn-key">$2</span><span class="syn-sym">:</span>');
        l = l.replace(/(&quot;.*?&quot;)/g, '<span class="syn-str">$1</span>');
        html += `<div>${l}</div>`;
      }
    });
    return html;
  }

  function formatJsonCode(code) {
    let html = '';
    const lines = code.split('\n');
    lines.forEach(line => {
      let l = escapeHtml(line);
      l = l.replace(/(&quot;[\w_-]+&quot;)(\s*:)/g, '<span class="syn-key">$1</span><span class="syn-sym">:</span>');
      l = l.replace(/(:\s*)(&quot;.*?&quot;)/g, '$1<span class="syn-str">$2</span>');
      html += `<div>${l}</div>`;
    });
    return html;
  }

  function formatMarkdownContent(md) {
    if (!md) return '<p>No details provided.</p>';
    let html = escapeHtml(md);

    // Headings
    html = html.replace(/### (.*?)\n/g, '<h3 style="margin-top: 1.5rem; margin-bottom: 0.75rem; color: var(--accent-primary);">$1</h3>\n');
    html = html.replace(/## (.*?)\n/g, '<h2 style="margin-top: 2rem; margin-bottom: 1rem; color: var(--text-primary);">$1</h2>\n');

    // Bold & italics
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Bullet points
    html = html.replace(/^\- (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul style="padding-left: 1.5rem; margin-bottom: 1.5rem; line-height: 1.7;">$1</ul>');

    // Links [text](url)
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: var(--accent-primary); text-decoration: underline;">$1</a>');

    // Paragraphs
    html = html.split('\n\n').map(p => {
      if (p.trim().startsWith('<h') || p.trim().startsWith('<ul') || p.trim().startsWith('<li')) {
        return p;
      }
      return `<p style="line-height: 1.8; margin-bottom: 1.25rem; color: var(--text-secondary);">${p.trim()}</p>`;
    }).join('\n');

    return html;
  }

  // ---------------------------------------------------------------------------
  // Initialization Controller
  // ---------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', async () => {
    const data = await fetchContent();
    if (!data) return;

    // Detect active page
    const pathname = window.location.pathname;

    if (document.getElementById('hero-title-text')) {
      renderHomepage(data);
    }
    if (document.getElementById('projects-list-container')) {
      renderProjectsPage(data);
    }
    if (document.getElementById('experience-timeline-container')) {
      renderExperiencePage(data);
    }
    if (document.getElementById('gists-list-container')) {
      renderGistPage(data);
    }
  });

})();
