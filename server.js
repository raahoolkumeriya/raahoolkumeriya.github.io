/**
 * Dynamic Portfolio & Admin CMS Server
 * Author: Rahul Kumeriya
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'portfolio-data.json');

// Admin Secrets from Environment Variables
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'RahulAdmin2026!SecureKey';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_db_eurorisk_2026_default';

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static asset folders
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// Data Layer Helper Functions
// ---------------------------------------------------------------------------
function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      throw new Error(`Data file not found at ${DATA_FILE}`);
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading portfolio data:', err.message);
    return null;
  }
}

function saveData(data) {
  try {
    const tempFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, DATA_FILE);
    return true;
  } catch (err) {
    console.error('Error saving portfolio data:', err.message);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Authentication Middleware & Verification
// ---------------------------------------------------------------------------
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Admin authentication token required.'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Unauthorized: Token is invalid or expired. Please log in again.'
    });
  }
}

// ---------------------------------------------------------------------------
// Auth Endpoints
// ---------------------------------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  // Verify against environment variables
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign(
      { username: ADMIN_USERNAME, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({
      success: true,
      message: 'Authenticated successfully.',
      token,
      user: { username: ADMIN_USERNAME }
    });
  }

  return res.status(401).json({
    error: 'Invalid credentials. Please verify your admin username and password in .env.'
  });
});

app.get('/api/auth/verify', requireAuth, (req, res) => {
  res.json({
    valid: true,
    user: req.user
  });
});

// ---------------------------------------------------------------------------
// Public Content Endpoints
// ---------------------------------------------------------------------------
app.get('/api/content', (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to read portfolio data.' });
  res.json(data);
});

app.get('/api/profile', (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to read data.' });
  res.json(data.profile || {});
});

app.get('/api/projects', (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to read data.' });
  const sorted = [...(data.projects || [])].sort((a, b) => (a.weight || 99) - (b.weight || 99));
  res.json(sorted);
});

app.get('/api/projects/:idOrSlug', (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to read data.' });
  const param = req.params.idOrSlug;
  const project = (data.projects || []).find(p => p.id === param || p.slug === param);
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  res.json(project);
});

app.get('/api/experience', (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to read data.' });
  res.json(data.experience || []);
});

app.get('/api/gists', (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to read data.' });
  res.json(data.gists || []);
});

app.get('/api/achievements', (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to read data.' });
  res.json(data.achievements || []);
});

// ---------------------------------------------------------------------------
// Protected Admin Content Mutation Endpoints (CRUD)
// ---------------------------------------------------------------------------

// --- 1. Projects CRUD ---
app.post('/api/projects', requireAuth, (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to read data.' });

  const {
    title, subtitle, description, badge, badgeColor, slug,
    weight, featured, github, video, demo, tags, content
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Project title is required.' });
  }

  const generatedSlug = (slug || title)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');

  const newProject = {
    id: `project-${Date.now()}`,
    slug: generatedSlug,
    title: title.trim(),
    subtitle: (subtitle || '').trim(),
    description: (description || '').trim(),
    badge: (badge || 'Engineering Blueprint').trim(),
    badgeColor: badgeColor || 'badge-purple',
    date: new Date().toISOString().split('T')[0],
    weight: parseInt(weight, 10) || (data.projects.length + 1),
    featured: Boolean(featured),
    github: (github || '').trim(),
    video: (video || '').trim(),
    demo: (demo || '').trim(),
    tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []),
    content: (content || '').trim()
  };

  data.projects.push(newProject);
  if (saveData(data)) {
    res.status(201).json({ success: true, project: newProject });
  } else {
    res.status(500).json({ error: 'Failed to save project.' });
  }
});

app.put('/api/projects/:id', requireAuth, (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to read data.' });

  const index = data.projects.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const existing = data.projects[index];
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id,
    weight: req.body.weight !== undefined ? parseInt(req.body.weight, 10) : existing.weight,
    featured: req.body.featured !== undefined ? Boolean(req.body.featured) : existing.featured,
    tags: Array.isArray(req.body.tags)
      ? req.body.tags
      : (req.body.tags ? req.body.tags.split(',').map(t => t.trim()).filter(Boolean) : existing.tags)
  };

  data.projects[index] = updated;
  if (saveData(data)) {
    res.json({ success: true, project: updated });
  } else {
    res.status(500).json({ error: 'Failed to update project.' });
  }
});

app.delete('/api/projects/:id', requireAuth, (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to read data.' });

  const prevLen = data.projects.length;
  data.projects = data.projects.filter(p => p.id !== req.params.id);

  if (data.projects.length === prevLen) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  if (saveData(data)) {
    res.json({ success: true, message: 'Project deleted successfully.' });
  } else {
    res.status(500).json({ error: 'Failed to delete project.' });
  }
});

// --- 2. Experience CRUD ---
app.post('/api/experience', requireAuth, (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to read data.' });

  const {
    company, role, rolePill, location, startDate, endDate,
    duration, isCurrent, logo, featured, summary, highlights, tags
  } = req.body;

  if (!company || !role) {
    return res.status(400).json({ error: 'Company and Role are required.' });
  }

  const newExp = {
    id: `exp-${Date.now()}`,
    company: company.trim(),
    role: role.trim(),
    rolePill: (rolePill || role).trim(),
    location: (location || 'Pune, India').trim(),
    startDate: (startDate || '').trim(),
    endDate: isCurrent ? 'Present' : (endDate || '').trim(),
    duration: (duration || '').trim(),
    isCurrent: Boolean(isCurrent),
    logo: (logo || '/static/images/deutsche-bank.svg').trim(),
    featured: Boolean(featured),
    summary: (summary || '').trim(),
    highlights: Array.isArray(highlights)
      ? highlights
      : (highlights ? highlights.split('\n').map(h => h.trim()).filter(Boolean) : []),
    tags: Array.isArray(tags)
      ? tags
      : (tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [])
  };

  data.experience.unshift(newExp);
  if (saveData(data)) {
    res.status(201).json({ success: true, experience: newExp });
  } else {
    res.status(500).json({ error: 'Failed to save experience.' });
  }
});

app.put('/api/experience/:id', requireAuth, (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to read data.' });

  const index = data.experience.findIndex(e => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Experience record not found.' });
  }

  const existing = data.experience[index];
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id,
    isCurrent: req.body.isCurrent !== undefined ? Boolean(req.body.isCurrent) : existing.isCurrent,
    featured: req.body.featured !== undefined ? Boolean(req.body.featured) : existing.featured,
    highlights: Array.isArray(req.body.highlights)
      ? req.body.highlights
      : (req.body.highlights ? req.body.highlights.split('\n').map(h => h.trim()).filter(Boolean) : existing.highlights),
    tags: Array.isArray(req.body.tags)
      ? req.body.tags
      : (req.body.tags ? req.body.tags.split(',').map(t => t.trim()).filter(Boolean) : existing.tags)
  };

  if (updated.isCurrent) {
    updated.endDate = 'Present';
  }

  data.experience[index] = updated;
  if (saveData(data)) {
    res.json({ success: true, experience: updated });
  } else {
    res.status(500).json({ error: 'Failed to update experience.' });
  }
});

app.delete('/api/experience/:id', requireAuth, (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to read data.' });

  const prevLen = data.experience.length;
  data.experience = data.experience.filter(e => e.id !== req.params.id);

  if (data.experience.length === prevLen) {
    return res.status(404).json({ error: 'Experience record not found.' });
  }

  if (saveData(data)) {
    res.json({ success: true, message: 'Experience record deleted successfully.' });
  } else {
    res.status(500).json({ error: 'Failed to delete experience record.' });
  }
});

// --- 3. Gists CRUD ---
app.post('/api/gists', requireAuth, (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to read data.' });

  const {
    title, category, scenario, challenge, embedScriptUrl,
    gistUrl, tags, featured
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Gist title is required.' });
  }

  const newGist = {
    id: `gist-${Date.now()}`,
    title: title.trim(),
    category: (category || 'Technical Gist & Snippet').trim(),
    scenario: (scenario || '').trim(),
    challenge: (challenge || '').trim(),
    embedScriptUrl: (embedScriptUrl || '').trim(),
    gistUrl: (gistUrl || '').trim(),
    tags: Array.isArray(tags)
      ? tags
      : (tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []),
    featured: Boolean(featured),
    date: new Date().toISOString().split('T')[0]
  };

  data.gists.push(newGist);
  if (saveData(data)) {
    res.status(201).json({ success: true, gist: newGist });
  } else {
    res.status(500).json({ error: 'Failed to save gist.' });
  }
});

app.put('/api/gists/:id', requireAuth, (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to read data.' });

  const index = data.gists.findIndex(g => g.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Gist not found.' });
  }

  const existing = data.gists[index];
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id,
    featured: req.body.featured !== undefined ? Boolean(req.body.featured) : existing.featured,
    tags: Array.isArray(req.body.tags)
      ? req.body.tags
      : (req.body.tags ? req.body.tags.split(',').map(t => t.trim()).filter(Boolean) : existing.tags)
  };

  data.gists[index] = updated;
  if (saveData(data)) {
    res.json({ success: true, gist: updated });
  } else {
    res.status(500).json({ error: 'Failed to update gist.' });
  }
});

app.delete('/api/gists/:id', requireAuth, (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to read data.' });

  const prevLen = data.gists.length;
  data.gists = data.gists.filter(g => g.id !== req.params.id);

  if (data.gists.length === prevLen) {
    return res.status(404).json({ error: 'Gist not found.' });
  }

  if (saveData(data)) {
    res.json({ success: true, message: 'Gist deleted successfully.' });
  } else {
    res.status(500).json({ error: 'Failed to delete gist.' });
  }
});

// --- 4. Achievements & Awards CRUD ---
app.post('/api/achievements', requireAuth, (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to read data.' });

  const { title, date, badge, organization, description, featured } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Achievement title is required.' });
  }

  const newAch = {
    id: `ach-${Date.now()}`,
    title: title.trim(),
    date: (date || 'July 2026').trim(),
    badge: badge || 'badge-purple',
    organization: (organization || 'Deutsche Bank').trim(),
    description: (description || '').trim(),
    featured: Boolean(featured)
  };

  data.achievements.unshift(newAch);
  if (saveData(data)) {
    res.status(201).json({ success: true, achievement: newAch });
  } else {
    res.status(500).json({ error: 'Failed to save achievement.' });
  }
});

app.put('/api/achievements/:id', requireAuth, (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to read data.' });

  const index = data.achievements.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Achievement not found.' });
  }

  const existing = data.achievements[index];
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id,
    featured: req.body.featured !== undefined ? Boolean(req.body.featured) : existing.featured
  };

  data.achievements[index] = updated;
  if (saveData(data)) {
    res.json({ success: true, achievement: updated });
  } else {
    res.status(500).json({ error: 'Failed to update achievement.' });
  }
});

app.delete('/api/achievements/:id', requireAuth, (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to read data.' });

  const prevLen = data.achievements.length;
  data.achievements = data.achievements.filter(a => a.id !== req.params.id);

  if (data.achievements.length === prevLen) {
    return res.status(404).json({ error: 'Achievement not found.' });
  }

  if (saveData(data)) {
    res.json({ success: true, message: 'Achievement deleted successfully.' });
  } else {
    res.status(500).json({ error: 'Failed to delete achievement.' });
  }
});

// --- 5. Profile, Hero & Terminal Updates ---
app.put('/api/profile', requireAuth, (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to read data.' });

  data.profile = {
    ...data.profile,
    ...req.body,
    socials: { ...(data.profile?.socials || {}), ...(req.body.socials || {}) },
    terminal: { ...(data.profile?.terminal || {}), ...(req.body.terminal || {}) }
  };

  if (saveData(data)) {
    res.json({ success: true, profile: data.profile });
  } else {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// ---------------------------------------------------------------------------
// Page Routes & Navigation
// ---------------------------------------------------------------------------
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

app.get('/projects', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'projects', 'index.html'));
});
app.get('/projects/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'projects', 'index.html'));
});

app.get('/experience', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'experience', 'index.html'));
});
app.get('/experience/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'experience', 'index.html'));
});

app.get('/gist', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'gist', 'index.html'));
});
app.get('/gist/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'gist', 'index.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 Fallback
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'templates', '404.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Rahul Kumeriya Dynamic Portfolio & Admin CMS Online`);
  console.log(`🌐 Public Website: http://localhost:${PORT}`);
  console.log(`🔐 Admin Section: http://localhost:${PORT}/admin`);
  console.log(`🔑 Admin Username: ${ADMIN_USERNAME}`);
  console.log(`=======================================================`);
});
