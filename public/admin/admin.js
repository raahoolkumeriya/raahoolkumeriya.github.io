/**
 * Admin Studio Controller
 * Handles JWT Auth, CRUD Operations, Modals, Forms & Toasts
 */

(function () {
  'use strict';

  let currentData = null;
  let activeEditType = null; // 'project', 'experience', 'gist', 'achievement'
  let activeEditId = null;

  // ---------------------------------------------------------------------------
  // Token & API Helpers
  // ---------------------------------------------------------------------------
  function getToken() {
    return localStorage.getItem('rk_admin_token');
  }

  function setToken(token) {
    if (token) {
      localStorage.setItem('rk_admin_token', token);
    } else {
      localStorage.removeItem('rk_admin_token');
    }
  }

  async function apiRequest(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = { method, headers };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(endpoint, options);
    if (res.status === 401) {
      // Token invalid or expired
      setToken(null);
      showLoginOverlay(true);
      throw new Error('Unauthorized. Please log in again.');
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Error: ${res.statusText}`);
    }
    return data;
  }

  // ---------------------------------------------------------------------------
  // Toast Notifications
  // ---------------------------------------------------------------------------
  function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;
    toast.innerHTML = `
      <span>${escapeHtml(message)}</span>
      <button style="background:none; border:none; color:inherit; cursor:pointer; font-size:1.1rem; margin-left:0.75rem;" onclick="this.parentElement.remove()">&times;</button>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 3500);
  }

  // ---------------------------------------------------------------------------
  // Auth Flow & Verification
  // ---------------------------------------------------------------------------
  function showLoginOverlay(show) {
    const overlay = document.getElementById('login-overlay');
    if (overlay) {
      overlay.style.display = show ? 'flex' : 'none';
      if (show) {
        document.getElementById('login-password').value = '';
        const alert = document.getElementById('login-alert');
        if (alert) alert.style.display = 'none';
      }
    }
  }

  async function checkAuth() {
    const token = getToken();
    if (!token) {
      showLoginOverlay(true);
      return false;
    }

    try {
      await apiRequest('/api/auth/verify');
      showLoginOverlay(false);
      await loadContent();
      return true;
    } catch (err) {
      showLoginOverlay(true);
      return false;
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const alertBox = document.getElementById('login-alert');
    const submitBtn = document.getElementById('login-submit-btn');

    if (!username || !password) {
      alertBox.textContent = 'Please enter both username and password.';
      alertBox.className = 'login-alert error';
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verifying...';

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      setToken(data.token);
      showLoginOverlay(false);
      showToast('Welcome back, Admin! Authenticated successfully.', 'success');
      await loadContent();
    } catch (err) {
      alertBox.textContent = err.message;
      alertBox.className = 'login-alert error';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Authenticate & Enter Studio';
    }
  }

  function handleLogout() {
    setToken(null);
    showLoginOverlay(true);
    showToast('Logged out of Admin Studio.', 'success');
  }

  // ---------------------------------------------------------------------------
  // Load & Render Content
  // ---------------------------------------------------------------------------
  async function loadContent() {
    try {
      currentData = await apiRequest('/api/content');
      renderProjectsTable(currentData.projects || []);
      renderExperienceTable(currentData.experience || []);
      renderGistsTable(currentData.gists || []);
      renderAchievementsTable(currentData.achievements || []);
      populateProfileForm(currentData.profile || {});
      updateCounts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function updateCounts() {
    if (!currentData) return;
    setCountText('badge-count-projects', currentData.projects?.length || 0);
    setCountText('badge-count-experience', currentData.experience?.length || 0);
    setCountText('badge-count-gists', currentData.gists?.length || 0);
    setCountText('badge-count-achievements', currentData.achievements?.length || 0);
  }

  function setCountText(id, count) {
    const el = document.getElementById(id);
    if (el) el.textContent = count;
  }

  // ---------------------------------------------------------------------------
  // 1. Projects Rendering & Actions
  // ---------------------------------------------------------------------------
  function renderProjectsTable(projects) {
    const tbody = document.getElementById('projects-table-body');
    if (!tbody) return;

    if (!projects.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem;">No projects found. Click "Add Project" to create one.</td></tr>`;
      return;
    }

    tbody.innerHTML = projects.map(p => `
      <tr>
        <td>
          <strong style="color: var(--accent-primary); font-size: 1.05rem;">${escapeHtml(p.title)}</strong>
          <div style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 0.25rem;">
            ${escapeHtml(p.description).substring(0, 75)}...
          </div>
        </td>
        <td>
          <span class="card-badge ${p.badgeColor || 'badge-purple'}">${escapeHtml(p.badge || 'Blueprint')}</span>
        </td>
        <td>
          ${(p.tags || []).slice(0, 3).map(t => `<span class="tag" style="margin-bottom: 2px;">${escapeHtml(t)}</span>`).join(' ')}
          ${(p.tags || []).length > 3 ? `<span style="font-size:0.75rem; color:var(--text-muted);">+${(p.tags || []).length - 3}</span>` : ''}
        </td>
        <td style="text-align: center;">${p.weight || 1}</td>
        <td>
          ${p.featured ? '<span style="color:#34d399; font-weight:600;">✓ Yes</span>' : '<span style="color:var(--text-muted);">No</span>'}
        </td>
        <td>
          <div class="table-actions">
            <button class="btn-table-action" onclick="openProjectEdit('${p.id}')">Edit</button>
            <button class="btn-table-action danger" onclick="deleteProject('${p.id}')">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.openProjectAdd = function () {
    activeEditType = 'project';
    activeEditId = null;
    document.getElementById('modal-title').textContent = 'Add New Project Blueprint';
    document.getElementById('project-form').reset();
    document.getElementById('project-form-id').value = '';
    document.getElementById('project-form-weight').value = (currentData?.projects?.length || 0) + 1;
    showModal('project-modal', true);
  };

  window.openProjectEdit = function (id) {
    const project = currentData?.projects?.find(p => p.id === id);
    if (!project) return;

    activeEditType = 'project';
    activeEditId = id;
    document.getElementById('modal-title').textContent = `Edit Project: ${project.title}`;
    document.getElementById('project-form-id').value = project.id;
    document.getElementById('project-form-title').value = project.title || '';
    document.getElementById('project-form-subtitle').value = project.subtitle || '';
    document.getElementById('project-form-slug').value = project.slug || '';
    document.getElementById('project-form-badge').value = project.badge || '';
    document.getElementById('project-form-badgeColor').value = project.badgeColor || 'badge-purple';
    document.getElementById('project-form-description').value = project.description || '';
    document.getElementById('project-form-github').value = project.github || '';
    document.getElementById('project-form-video').value = project.video || '';
    document.getElementById('project-form-demo').value = project.demo || '';
    document.getElementById('project-form-tags').value = (project.tags || []).join(', ');
    document.getElementById('project-form-weight').value = project.weight || 1;
    document.getElementById('project-form-featured').checked = Boolean(project.featured);
    document.getElementById('project-form-content').value = project.content || '';

    showModal('project-modal', true);
  };

  async function saveProject(e) {
    e.preventDefault();
    const id = document.getElementById('project-form-id').value;
    const payload = {
      title: document.getElementById('project-form-title').value.trim(),
      subtitle: document.getElementById('project-form-subtitle').value.trim(),
      slug: document.getElementById('project-form-slug').value.trim(),
      badge: document.getElementById('project-form-badge').value.trim(),
      badgeColor: document.getElementById('project-form-badgeColor').value,
      description: document.getElementById('project-form-description').value.trim(),
      github: document.getElementById('project-form-github').value.trim(),
      video: document.getElementById('project-form-video').value.trim(),
      demo: document.getElementById('project-form-demo').value.trim(),
      tags: document.getElementById('project-form-tags').value.split(',').map(t => t.trim()).filter(Boolean),
      weight: parseInt(document.getElementById('project-form-weight').value, 10) || 1,
      featured: document.getElementById('project-form-featured').checked,
      content: document.getElementById('project-form-content').value.trim()
    };

    try {
      if (id) {
        await apiRequest(`/api/projects/${id}`, 'PUT', payload);
        showToast('Project updated successfully!', 'success');
      } else {
        await apiRequest('/api/projects', 'POST', payload);
        showToast('New project blueprint added!', 'success');
      }
      showModal('project-modal', false);
      await loadContent();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  window.deleteProject = async function (id) {
    const project = currentData?.projects?.find(p => p.id === id);
    if (!project) return;

    if (!confirm(`Are you sure you want to delete "${project.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await apiRequest(`/api/projects/${id}`, 'DELETE');
      showToast('Project deleted successfully.', 'success');
      await loadContent();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ---------------------------------------------------------------------------
  // 2. Experience Rendering & Actions
  // ---------------------------------------------------------------------------
  function renderExperienceTable(expList) {
    const tbody = document.getElementById('experience-table-body');
    if (!tbody) return;

    if (!expList.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem;">No experience records found.</td></tr>`;
      return;
    }

    tbody.innerHTML = expList.map(e => `
      <tr>
        <td>
          <div style="font-weight:600; font-size:1.05rem; color:var(--text-primary);">${escapeHtml(e.company)}</div>
          <div style="color:var(--text-muted); font-size:0.85rem;">${escapeHtml(e.location)}</div>
        </td>
        <td>
          <span class="role-pill">${escapeHtml(e.rolePill || e.role)}</span>
        </td>
        <td>
          <div>${escapeHtml(e.startDate)} – ${escapeHtml(e.endDate)}</div>
          <div style="color:var(--text-secondary); font-size:0.82rem;">${escapeHtml(e.duration)}</div>
        </td>
        <td>
          <span style="font-size:0.88rem; color:var(--accent-primary); font-weight:600;">${(e.highlights || []).length} bullets</span>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn-table-action" onclick="openExperienceEdit('${e.id}')">Edit</button>
            <button class="btn-table-action danger" onclick="deleteExperience('${e.id}')">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.openExperienceAdd = function () {
    document.getElementById('experience-form').reset();
    document.getElementById('experience-form-id').value = '';
    document.getElementById('exp-modal-title').textContent = 'Add Career Milestone';
    showModal('experience-modal', true);
  };

  window.openExperienceEdit = function (id) {
    const exp = currentData?.experience?.find(e => e.id === id);
    if (!exp) return;

    document.getElementById('exp-modal-title').textContent = `Edit Milestone: ${exp.company}`;
    document.getElementById('experience-form-id').value = exp.id;
    document.getElementById('exp-company').value = exp.company || '';
    document.getElementById('exp-role').value = exp.role || '';
    document.getElementById('exp-rolePill').value = exp.rolePill || '';
    document.getElementById('exp-location').value = exp.location || '';
    document.getElementById('exp-startDate').value = exp.startDate || '';
    document.getElementById('exp-endDate').value = exp.endDate || '';
    document.getElementById('exp-duration').value = exp.duration || '';
    document.getElementById('exp-isCurrent').checked = Boolean(exp.isCurrent);
    document.getElementById('exp-logo').value = exp.logo || '';
    document.getElementById('exp-featured').checked = Boolean(exp.featured);
    document.getElementById('exp-summary').value = exp.summary || '';
    document.getElementById('exp-highlights').value = (exp.highlights || []).join('\n');
    document.getElementById('exp-tags').value = (exp.tags || []).join(', ');

    showModal('experience-modal', true);
  };

  async function saveExperience(e) {
    e.preventDefault();
    const id = document.getElementById('experience-form-id').value;
    const isCurrent = document.getElementById('exp-isCurrent').checked;

    const payload = {
      company: document.getElementById('exp-company').value.trim(),
      role: document.getElementById('exp-role').value.trim(),
      rolePill: document.getElementById('exp-rolePill').value.trim(),
      location: document.getElementById('exp-location').value.trim(),
      startDate: document.getElementById('exp-startDate').value.trim(),
      endDate: isCurrent ? 'Present' : document.getElementById('exp-endDate').value.trim(),
      duration: document.getElementById('exp-duration').value.trim(),
      isCurrent: isCurrent,
      logo: document.getElementById('exp-logo').value.trim() || '/static/images/deutsche-bank.svg',
      featured: document.getElementById('exp-featured').checked,
      summary: document.getElementById('exp-summary').value.trim(),
      highlights: document.getElementById('exp-highlights').value.split('\n').map(h => h.trim()).filter(Boolean),
      tags: document.getElementById('exp-tags').value.split(',').map(t => t.trim()).filter(Boolean)
    };

    try {
      if (id) {
        await apiRequest(`/api/experience/${id}`, 'PUT', payload);
        showToast('Experience milestone updated!', 'success');
      } else {
        await apiRequest('/api/experience', 'POST', payload);
        showToast('New experience milestone added!', 'success');
      }
      showModal('experience-modal', false);
      await loadContent();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  window.deleteExperience = async function (id) {
    const exp = currentData?.experience?.find(e => e.id === id);
    if (!exp) return;

    if (!confirm(`Delete experience record for "${exp.company}"?`)) return;

    try {
      await apiRequest(`/api/experience/${id}`, 'DELETE');
      showToast('Experience record deleted.', 'success');
      await loadContent();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ---------------------------------------------------------------------------
  // 3. Gists Rendering & Actions
  // ---------------------------------------------------------------------------
  function renderGistsTable(gists) {
    const tbody = document.getElementById('gists-table-body');
    if (!tbody) return;

    if (!gists.length) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 2rem;">No gists recorded.</td></tr>`;
      return;
    }

    tbody.innerHTML = gists.map(g => `
      <tr>
        <td>
          <strong style="color:var(--text-primary); font-size:1rem;">${escapeHtml(g.title)}</strong>
          <div style="color:var(--text-secondary); font-size:0.82rem; margin-top:0.25rem;">${escapeHtml(g.category || 'Automation')}</div>
        </td>
        <td>
          ${(g.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join(' ')}
        </td>
        <td>
          ${g.gistUrl ? `<a href="${escapeHtml(g.gistUrl)}" target="_blank" style="color:var(--accent-primary); font-size:0.85rem;">GitHub Gist ↗</a>` : '<span style="color:var(--text-muted);">-</span>'}
        </td>
        <td>
          <div class="table-actions">
            <button class="btn-table-action" onclick="openGistEdit('${g.id}')">Edit</button>
            <button class="btn-table-action danger" onclick="deleteGist('${g.id}')">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.openGistAdd = function () {
    document.getElementById('gist-form').reset();
    document.getElementById('gist-form-id').value = '';
    document.getElementById('gist-modal-title').textContent = 'Add Technical Gist';
    showModal('gist-modal', true);
  };

  window.openGistEdit = function (id) {
    const gist = currentData?.gists?.find(g => g.id === id);
    if (!gist) return;

    document.getElementById('gist-modal-title').textContent = `Edit Gist: ${gist.title}`;
    document.getElementById('gist-form-id').value = gist.id;
    document.getElementById('gist-title').value = gist.title || '';
    document.getElementById('gist-category').value = gist.category || '';
    document.getElementById('gist-scenario').value = gist.scenario || '';
    document.getElementById('gist-challenge').value = gist.challenge || '';
    document.getElementById('gist-embed').value = gist.embedScriptUrl || '';
    document.getElementById('gist-url').value = gist.gistUrl || '';
    document.getElementById('gist-tags').value = (gist.tags || []).join(', ');
    document.getElementById('gist-featured').checked = Boolean(gist.featured);

    showModal('gist-modal', true);
  };

  async function saveGist(e) {
    e.preventDefault();
    const id = document.getElementById('gist-form-id').value;

    const payload = {
      title: document.getElementById('gist-title').value.trim(),
      category: document.getElementById('gist-category').value.trim(),
      scenario: document.getElementById('gist-scenario').value.trim(),
      challenge: document.getElementById('gist-challenge').value.trim(),
      embedScriptUrl: document.getElementById('gist-embed').value.trim(),
      gistUrl: document.getElementById('gist-url').value.trim(),
      tags: document.getElementById('gist-tags').value.split(',').map(t => t.trim()).filter(Boolean),
      featured: document.getElementById('gist-featured').checked
    };

    try {
      if (id) {
        await apiRequest(`/api/gists/${id}`, 'PUT', payload);
        showToast('Gist updated successfully!', 'success');
      } else {
        await apiRequest('/api/gists', 'POST', payload);
        showToast('New technical gist added!', 'success');
      }
      showModal('gist-modal', false);
      await loadContent();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  window.deleteGist = async function (id) {
    const gist = currentData?.gists?.find(g => g.id === id);
    if (!gist) return;

    if (!confirm(`Delete Gist "${gist.title}"?`)) return;

    try {
      await apiRequest(`/api/gists/${id}`, 'DELETE');
      showToast('Gist deleted successfully.', 'success');
      await loadContent();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ---------------------------------------------------------------------------
  // 4. Achievements & Awards Rendering & Actions
  // ---------------------------------------------------------------------------
  function renderAchievementsTable(achievements) {
    const tbody = document.getElementById('achievements-table-body');
    if (!tbody) return;

    if (!achievements.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem;">No achievements recorded.</td></tr>`;
      return;
    }

    tbody.innerHTML = achievements.map(a => `
      <tr>
        <td>
          <strong style="color:var(--text-primary); font-size:1rem;">${escapeHtml(a.title)}</strong>
          <div style="color:var(--text-secondary); font-size:0.82rem; margin-top:0.25rem;">${escapeHtml(a.description).substring(0, 80)}...</div>
        </td>
        <td>${escapeHtml(a.organization || 'Organization')}</td>
        <td>
          <span class="card-badge ${a.badge || 'badge-purple'}">${escapeHtml(a.date)}</span>
        </td>
        <td>
          ${a.featured ? '<span style="color:#34d399; font-weight:600;">✓ Spotlight</span>' : '<span style="color:var(--text-muted);">Standard</span>'}
        </td>
        <td>
          <div class="table-actions">
            <button class="btn-table-action" onclick="openAchievementEdit('${a.id}')">Edit</button>
            <button class="btn-table-action danger" onclick="deleteAchievement('${a.id}')">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.openAchievementAdd = function () {
    document.getElementById('achievement-form').reset();
    document.getElementById('achievement-form-id').value = '';
    document.getElementById('ach-modal-title').textContent = 'Add Award / Milestone';
    showModal('achievement-modal', true);
  };

  window.openAchievementEdit = function (id) {
    const ach = currentData?.achievements?.find(a => a.id === id);
    if (!ach) return;

    document.getElementById('ach-modal-title').textContent = `Edit Achievement: ${ach.title}`;
    document.getElementById('achievement-form-id').value = ach.id;
    document.getElementById('ach-title').value = ach.title || '';
    document.getElementById('ach-date').value = ach.date || '';
    document.getElementById('ach-badge').value = ach.badge || 'badge-purple';
    document.getElementById('ach-org').value = ach.organization || '';
    document.getElementById('ach-description').value = ach.description || '';
    document.getElementById('ach-featured').checked = Boolean(ach.featured);

    showModal('achievement-modal', true);
  };

  async function saveAchievement(e) {
    e.preventDefault();
    const id = document.getElementById('achievement-form-id').value;

    const payload = {
      title: document.getElementById('ach-title').value.trim(),
      date: document.getElementById('ach-date').value.trim(),
      badge: document.getElementById('ach-badge').value,
      organization: document.getElementById('ach-org').value.trim(),
      description: document.getElementById('ach-description').value.trim(),
      featured: document.getElementById('ach-featured').checked
    };

    try {
      if (id) {
        await apiRequest(`/api/achievements/${id}`, 'PUT', payload);
        showToast('Achievement updated!', 'success');
      } else {
        await apiRequest('/api/achievements', 'POST', payload);
        showToast('New achievement added!', 'success');
      }
      showModal('achievement-modal', false);
      await loadContent();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  window.deleteAchievement = async function (id) {
    const ach = currentData?.achievements?.find(a => a.id === id);
    if (!ach) return;

    if (!confirm(`Delete achievement "${ach.title}"?`)) return;

    try {
      await apiRequest(`/api/achievements/${id}`, 'DELETE');
      showToast('Achievement deleted.', 'success');
      await loadContent();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ---------------------------------------------------------------------------
  // 5. Profile, Hero & Terminal Form
  // ---------------------------------------------------------------------------
  function populateProfileForm(profile) {
    if (!profile) return;

    document.getElementById('profile-heroTagline').value = profile.heroTagline || '';
    document.getElementById('profile-heroTitle').value = profile.heroTitle || '';
    document.getElementById('profile-heroSubtitle').value = profile.heroSubtitle || '';
    document.getElementById('profile-resumeUrl').value = profile.resumeUrl || '';
    document.getElementById('profile-fullCvUrl').value = profile.fullCvUrl || '';

    // Terminal files
    if (profile.terminal) {
      document.getElementById('profile-term-about').value = profile.terminal.about || '';
      document.getElementById('profile-term-arch').value = profile.terminal.architecture || '';
      document.getElementById('profile-term-milestones').value = profile.terminal.milestones || '';
    }

    // Metrics
    if (profile.metrics && profile.metrics.length >= 3) {
      document.getElementById('metric-val-1').value = profile.metrics[0].value || '';
      document.getElementById('metric-lbl-1').value = profile.metrics[0].label || '';
      document.getElementById('metric-val-2').value = profile.metrics[1].value || '';
      document.getElementById('metric-lbl-2').value = profile.metrics[1].label || '';
      document.getElementById('metric-val-3').value = profile.metrics[2].value || '';
      document.getElementById('metric-lbl-3').value = profile.metrics[2].label || '';
    }
  }

  async function saveProfile(e) {
    e.preventDefault();

    const payload = {
      heroTagline: document.getElementById('profile-heroTagline').value.trim(),
      heroTitle: document.getElementById('profile-heroTitle').value.trim(),
      heroSubtitle: document.getElementById('profile-heroSubtitle').value.trim(),
      resumeUrl: document.getElementById('profile-resumeUrl').value.trim(),
      fullCvUrl: document.getElementById('profile-fullCvUrl').value.trim(),
      terminal: {
        about: document.getElementById('profile-term-about').value,
        architecture: document.getElementById('profile-term-arch').value,
        milestones: document.getElementById('profile-term-milestones').value
      },
      metrics: [
        {
          id: 'metric-1',
          value: document.getElementById('metric-val-1').value.trim(),
          label: document.getElementById('metric-lbl-1').value.trim()
        },
        {
          id: 'metric-2',
          value: document.getElementById('metric-val-2').value.trim(),
          label: document.getElementById('metric-lbl-2').value.trim()
        },
        {
          id: 'metric-3',
          value: document.getElementById('metric-val-3').value.trim(),
          label: document.getElementById('metric-lbl-3').value.trim()
        }
      ]
    };

    try {
      await apiRequest('/api/profile', 'PUT', payload);
      showToast('Profile, Hero & Terminal settings saved successfully!', 'success');
      await loadContent();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // ---------------------------------------------------------------------------
  // Tabs & Modals Management
  // ---------------------------------------------------------------------------
  function initTabs() {
    const tabBtns = document.querySelectorAll('.admin-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetPane = btn.getAttribute('data-tab');
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.admin-pane').forEach(p => {
          p.classList.toggle('active', p.id === targetPane);
        });
      });
    });
  }

  window.showModal = function (modalId, show) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    if (show) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    } else {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ---------------------------------------------------------------------------
  // Initialize on DOM Ready
  // ---------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    initTabs();

    // Attach form listeners
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('btn-logout')?.addEventListener('click', handleLogout);

    document.getElementById('project-form')?.addEventListener('submit', saveProject);
    document.getElementById('experience-form')?.addEventListener('submit', saveExperience);
    document.getElementById('gist-form')?.addEventListener('submit', saveGist);
    document.getElementById('achievement-form')?.addEventListener('submit', saveAchievement);
    document.getElementById('profile-form')?.addEventListener('submit', saveProfile);

    // Close modals on escape or backdrop click
    document.querySelectorAll('.admin-modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.admin-modal-overlay.active').forEach(m => {
          m.classList.remove('active');
        });
        document.body.style.overflow = '';
      }
    });

    // Check credentials / verify existing session
    checkAuth();
  });

})();
