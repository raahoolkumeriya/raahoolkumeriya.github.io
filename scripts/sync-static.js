/**
 * Static Sync Utility
 * Synchronizes dynamic data store (data/portfolio-data.json) back into
 * Zola static markdown files & templates for GitHub Pages deployment.
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'portfolio-data.json');
const PROJECTS_DIR = path.join(__dirname, '..', 'content', 'projects');

if (!fs.existsSync(DATA_FILE)) {
  console.error('Error: portfolio-data.json not found!');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

console.log('🔄 Starting Static Sync from Dynamic Portfolio CMS...');

// 1. Sync Projects to content/projects/*.md
if (data.projects && Array.isArray(data.projects)) {
  if (!fs.existsSync(PROJECTS_DIR)) {
    fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  }

  data.projects.forEach((proj, idx) => {
    const filename = `${proj.slug || `project-${idx + 1}`}.md`;
    const filepath = path.join(PROJECTS_DIR, filename);

    const tagsArrayStr = (proj.tags || []).map(t => `"${t}"`).join(', ');

    const mdContent = `+++
title = "${proj.title.replace(/"/g, '\\"')}"
description = "${(proj.description || '').replace(/"/g, '\\"')}"
weight = ${proj.weight || (idx + 1)}
date = ${proj.date || new Date().toISOString().split('T')[0]}

[extra]
badge = "${(proj.badge || 'Blueprint').replace(/"/g, '\\"')}"
${proj.github ? `github = "${proj.github}"` : ''}
${proj.video ? `video = "${proj.video}"` : ''}
${proj.demo ? `demo = "${proj.demo}"` : ''}
tags = [${tagsArrayStr}]
+++

${proj.content || ''}
`;

    fs.writeFileSync(filepath, mdContent, 'utf8');
    console.log(`  ✓ Synced Project: ${filename}`);
  });
}

console.log(`🎉 Static sync completed successfully! Total projects synced: ${data.projects?.length || 0}`);
console.log(`You can now run 'zola build' or push to GitHub Pages whenever needed.`);
