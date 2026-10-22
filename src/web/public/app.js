// State
let prompts = [];
let categories = [];
let tags = [];
let currentCategory = 'ALL';
let currentTag = null;
let favoriteOnly = false;
let searchQuery = '';
let activePromptForPaste = null;
let currentPasteValues = {};

// DOM Elements
const promptsGrid = document.getElementById('prompts-grid');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const searchClear = document.getElementById('search-clear');
const categoryPillsContainer = document.getElementById('category-pills');
const tagsBar = document.getElementById('tags-bar');
const tagsContainer = document.getElementById('tags-container');
const promptCountText = document.getElementById('prompt-count-text');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Modals
const pasteModal = document.getElementById('paste-modal');
const editModal = document.getElementById('edit-modal');
const importModal = document.getElementById('import-modal');

// API Functions
async function api(path, options = {}) {
  try {
    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    return await res.json();
  } catch (err) {
    showToast(`Network error: ${err.message}`, 'error');
    throw err;
  }
}

async function loadData() {
  const [promptsRes, metaRes] = await Promise.all([
    api('/api/prompts'),
    api('/api/prompts/meta')
  ]);

  if (promptsRes.success) {
    prompts = promptsRes.prompts || [];
  }
  if (metaRes.success) {
    categories = metaRes.categories || [];
    tags = metaRes.tags || [];
  }

  renderCategories();
  renderTags();
  renderPrompts();
}

// Rendering
function renderCategories() {
  // Clear extra categories except 'All Prompts' and 'Favorites'
  const baseButtons = Array.from(categoryPillsContainer.querySelectorAll('.pill')).slice(0, 2);
  categoryPillsContainer.innerHTML = '';
  baseButtons.forEach(b => categoryPillsContainer.appendChild(b));

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = `pill ${currentCategory === cat.name ? 'active' : ''}`;
    btn.textContent = `${cat.name} (${cat.count})`;
    btn.dataset.category = cat.name;
    categoryPillsContainer.appendChild(btn);
  });

  // Populate datalist in edit form
  const datalist = document.getElementById('category-suggestions');
  if (datalist) {
    datalist.innerHTML = categories.map(c => `<option value="${escapeHtml(c.name)}">`).join('');
  }
}

function renderTags() {
  if (tags.length === 0) {
    tagsBar.classList.add('hidden');
    return;
  }

  tagsBar.classList.remove('hidden');
  tagsContainer.innerHTML = tags.slice(0, 15).map(t => `
    <span class="tag-badge ${currentTag === t.name ? 'active' : ''}" data-tag="${escapeHtml(t.name)}">
      #${escapeHtml(t.name)} <small>(${t.count})</small>
    </span>
  `).join('');
}

function getFilteredPrompts() {
  return prompts.filter(p => {
    if (favoriteOnly && !p.favorite) return false;
    if (currentCategory !== 'ALL' && p.category.toLowerCase() !== currentCategory.toLowerCase()) return false;
    if (currentTag && !p.tags.some(t => t.toLowerCase() === currentTag.toLowerCase())) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      const matchTags = p.tags.some(t => t.toLowerCase().includes(q));
      const matchTmpl = p.template.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat && !matchTags && !matchTmpl) return false;
    }
    return true;
  });
}

function renderPrompts() {
  const filtered = getFilteredPrompts();

  promptCountText.textContent = `Showing ${filtered.length} of ${prompts.length} prompt${prompts.length === 1 ? '' : 's'}`;

  if (filtered.length === 0) {
    promptsGrid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  promptsGrid.innerHTML = filtered.map(prompt => {
    const varsCount = prompt.variables ? prompt.variables.length : 0;
    const isFav = !!prompt.favorite;

    return `
      <div class="prompt-card" data-id="${escapeHtml(prompt.id)}">
        <div class="card-header">
          <div class="card-title-group">
            <span class="card-category-badge">${escapeHtml(prompt.category || 'General')}</span>
            <h3 class="card-title">${escapeHtml(prompt.title)}</h3>
          </div>
          <div class="card-actions">
            <button class="btn-icon btn-fav ${isFav ? 'favorite-active' : ''}" data-id="${escapeHtml(prompt.id)}" title="${isFav ? 'Unfavorite' : 'Favorite'}">
              ★
            </button>
            <button class="btn-icon btn-edit" data-id="${escapeHtml(prompt.id)}" title="Edit prompt">
              ✎
            </button>
            <button class="btn-icon btn-delete" data-id="${escapeHtml(prompt.id)}" title="Delete prompt">
              🗑
            </button>
          </div>
        </div>

        <p class="card-description">${escapeHtml(prompt.description || 'No description provided.')}</p>

        ${varsCount > 0 ? `
          <div class="card-variables-preview">
            ${prompt.variables.map(v => `<span class="var-chip" title="${escapeHtml(v.description || v.name)}">{{${escapeHtml(v.name)}}}</span>`).join('')}
          </div>
        ` : ''}

        <div class="card-footer">
          <div class="card-meta">
            ${prompt.usageCount > 0 ? `<span>Used ${prompt.usageCount} time${prompt.usageCount === 1 ? '' : 's'}</span> • ` : ''}
            <span>${varsCount} variable${varsCount === 1 ? '' : 's'}</span>
          </div>
          <button class="btn-paste" data-id="${escapeHtml(prompt.id)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Paste
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Paste & Variables Handling
function openPasteModal(prompt) {
  activePromptForPaste = prompt;
  currentPasteValues = {};

  document.getElementById('paste-modal-title').textContent = `Paste: ${prompt.title}`;
  document.getElementById('paste-modal-desc').textContent = prompt.description || 'Fill variables and copy to system clipboard.';

  const container = document.getElementById('variables-inputs-container');
  container.innerHTML = '';

  if (!prompt.variables || prompt.variables.length === 0) {
    container.innerHTML = `<p style="color: var(--text-secondary); font-size: 0.9rem;">This prompt has no dynamic variables. Ready to copy!</p>`;
  } else {
    prompt.variables.forEach(v => {
      const defaultValue = v.defaultValue || '';
      currentPasteValues[v.name] = defaultValue;

      const group = document.createElement('div');
      group.className = 'form-group var-input-group';
      group.innerHTML = `
        <label for="var-input-${v.name}">
          <span class="var-name-tag">{{${escapeHtml(v.name)}}}</span>
          ${v.required ? '<span class="var-required-indicator">Required</span>' : ''}
        </label>
        <input type="text" id="var-input-${v.name}" data-var="${escapeHtml(v.name)}" value="${escapeHtml(defaultValue)}" placeholder="${escapeHtml(v.description || v.name)}">
      `;
      container.appendChild(group);

      const input = group.querySelector('input');
      input.addEventListener('input', (e) => {
        currentPasteValues[v.name] = e.target.value;
        updatePreview();
      });
    });
  }

  updatePreview();
  pasteModal.classList.remove('hidden');
}

function updatePreview() {
  if (!activePromptForPaste) return;

  let text = activePromptForPaste.template;
  const regex = /\{\{\s*([a-zA-Z0-9_-]+)(?::([^}]*))?\s*\}\}/g;

  text = text.replace(regex, (match, varName, inlineDefault) => {
    const val = currentPasteValues[varName];
    if (val !== undefined && val !== '') return val;
    if (inlineDefault !== undefined && inlineDefault !== '') return inlineDefault;
    return match;
  });

  const previewBox = document.getElementById('preview-box');
  previewBox.textContent = text;
  document.getElementById('preview-char-count').textContent = `${text.length} characters`;
}

async function executePaste(promptId, variables = {}) {
  try {
    const res = await api(`/api/prompts/${encodeURIComponent(promptId)}/paste`, {
      method: 'POST',
      body: JSON.stringify({ variables })
    });

    if (res.success) {
      // Also write directly in browser clipboard as secondary guarantee
      if (navigator.clipboard && res.result && res.result.rendered) {
        try {
          await navigator.clipboard.writeText(res.result.rendered);
        } catch {}
      }

      showToast(`Copied "${res.result.title}" to clipboard! Ready to paste.`, 'success');
      pasteModal.classList.add('hidden');
      await loadData();
    } else {
      showToast(`Error: ${res.error}`, 'error');
    }
  } catch (err) {
    showToast(`Paste failed: ${err.message}`, 'error');
  }
}

// Edit & Create Form Handling
function openEditModal(prompt = null) {
  const form = document.getElementById('prompt-form');
  form.reset();

  if (prompt) {
    document.getElementById('edit-modal-title').textContent = 'Edit Prompt';
    document.getElementById('form-prompt-id').value = prompt.id;
    document.getElementById('form-title').value = prompt.title;
    document.getElementById('form-category').value = prompt.category || '';
    document.getElementById('form-tags').value = (prompt.tags || []).join(', ');
    document.getElementById('form-description').value = prompt.description || '';
    document.getElementById('form-template').value = prompt.template;
  } else {
    document.getElementById('edit-modal-title').textContent = 'Create New Prompt';
    document.getElementById('form-prompt-id').value = '';
    document.getElementById('form-category').value = currentCategory !== 'ALL' ? currentCategory : '';
    document.getElementById('form-tags').value = currentTag ? currentTag : '';
  }

  updateDetectedVarsPill();
  editModal.classList.remove('hidden');
}

function updateDetectedVarsPill() {
  const template = document.getElementById('form-template').value;
  const regex = /\{\{\s*([a-zA-Z0-9_-]+)(?::([^}]*))?\s*\}\}/g;
  const vars = new Set();
  let match;
  while ((match = regex.exec(template)) !== null) {
    vars.add(match[1]);
  }
  const pill = document.getElementById('detected-vars-pill');
  pill.textContent = `${vars.size} variable${vars.size === 1 ? '' : 's'} detected: ${Array.from(vars).map(v => '{{' + v + '}}').join(', ')}`;
}

// Toast
function showToast(msg, type = 'info') {
  toastMessage.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3500);
}

// Utility
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  loadData();

  // Search
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    searchClear.classList.toggle('hidden', !searchQuery);
    renderPrompts();
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    searchClear.classList.add('hidden');
    renderPrompts();
    searchInput.focus();
  });

  // Hotkey Ctrl+K for search
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });

  // Category filter
  categoryPillsContainer.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill');
    if (!pill) return;

    categoryPillsContainer.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');

    if (pill.dataset.favorite === 'true') {
      favoriteOnly = true;
      currentCategory = 'ALL';
    } else {
      favoriteOnly = false;
      currentCategory = pill.dataset.category || 'ALL';
    }
    renderPrompts();
  });

  // Tags filter
  tagsContainer.addEventListener('click', (e) => {
    const tagBadge = e.target.closest('.tag-badge');
    if (!tagBadge) return;

    const clickedTag = tagBadge.dataset.tag;
    if (currentTag === clickedTag) {
      currentTag = null;
    } else {
      currentTag = clickedTag;
    }
    renderTags();
    renderPrompts();
  });

  // Prompts Grid Delegated Actions
  promptsGrid.addEventListener('click', async (e) => {
    const card = e.target.closest('.prompt-card');
    if (!card) return;
    const promptId = card.dataset.id;
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return;

    // Paste button
    if (e.target.closest('.btn-paste')) {
      if (prompt.variables && prompt.variables.length > 0) {
        openPasteModal(prompt);
      } else {
        await executePaste(prompt.id);
      }
      return;
    }

    // Favorite button
    if (e.target.closest('.btn-fav')) {
      const res = await api(`/api/prompts/${encodeURIComponent(prompt.id)}/favorite`, { method: 'POST' });
      if (res.success) {
        prompt.favorite = res.prompt.favorite;
        renderPrompts();
        showToast(prompt.favorite ? `Favorited "${prompt.title}"` : `Removed "${prompt.title}" from favorites`);
      }
      return;
    }

    // Edit button
    if (e.target.closest('.btn-edit')) {
      openEditModal(prompt);
      return;
    }

    // Delete button
    if (e.target.closest('.btn-delete')) {
      if (confirm(`Are you sure you want to delete "${prompt.title}"?`)) {
        const res = await api(`/api/prompts/${encodeURIComponent(prompt.id)}`, { method: 'DELETE' });
        if (res.success) {
          showToast(`Deleted "${prompt.title}"`);
          await loadData();
        }
      }
      return;
    }
  });

  // Paste Modal Actions
  document.getElementById('paste-modal-close').addEventListener('click', () => pasteModal.classList.add('hidden'));
  document.getElementById('paste-modal-cancel').addEventListener('click', () => pasteModal.classList.add('hidden'));
  document.getElementById('btn-confirm-paste').addEventListener('click', () => {
    if (activePromptForPaste) {
      executePaste(activePromptForPaste.id, currentPasteValues);
    }
  });

  // Edit / Create Form Actions
  document.getElementById('btn-new-prompt').addEventListener('click', () => openEditModal());
  document.getElementById('btn-empty-create').addEventListener('click', () => openEditModal());
  document.getElementById('edit-modal-close').addEventListener('click', () => editModal.classList.add('hidden'));
  document.getElementById('edit-modal-cancel').addEventListener('click', () => editModal.classList.add('hidden'));
  document.getElementById('form-template').addEventListener('input', updateDetectedVarsPill);

  document.getElementById('btn-save-prompt').addEventListener('click', async (e) => {
    e.preventDefault();
    const id = document.getElementById('form-prompt-id').value;
    const title = document.getElementById('form-title').value.trim();
    const category = document.getElementById('form-category').value.trim() || 'General';
    const tagsStr = document.getElementById('form-tags').value;
    const tags = tagsStr ? tagsStr.split(',').map(s => s.trim()).filter(Boolean) : [];
    const description = document.getElementById('form-description').value.trim();
    const template = document.getElementById('form-template').value;

    if (!title || !template) {
      showToast('Title and Template are required fields.', 'error');
      return;
    }

    const payload = { id: id || undefined, title, category, tags, description, template };
    const res = await api('/api/prompts', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.success) {
      showToast(`Prompt "${title}" saved!`, 'success');
      editModal.classList.add('hidden');
      await loadData();
    } else {
      showToast(`Failed to save: ${res.error}`, 'error');
    }
  });

  // Export
  document.getElementById('btn-export').addEventListener('click', async () => {
    const data = await api('/api/prompts/export');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `antigravity-prompts-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Prompt library exported successfully!');
  });

  // Import
  document.getElementById('btn-import').addEventListener('click', () => {
    document.getElementById('import-json-text').value = '';
    importModal.classList.remove('hidden');
  });
  document.getElementById('import-modal-close').addEventListener('click', () => importModal.classList.add('hidden'));
  document.getElementById('import-modal-cancel').addEventListener('click', () => importModal.classList.add('hidden'));
  document.getElementById('btn-confirm-import').addEventListener('click', async () => {
    const raw = document.getElementById('import-json-text').value.trim();
    if (!raw) {
      showToast('Please paste valid JSON', 'error');
      return;
    }
    const mode = document.querySelector('input[name="import-mode"]:checked').value;
    try {
      const parsed = JSON.parse(raw);
      const res = await api('/api/prompts/import', {
        method: 'POST',
        body: JSON.stringify({ prompts: parsed, mode })
      });
      if (res.success) {
        showToast(`Imported ${res.imported} prompt(s)! Total: ${res.total}`);
        importModal.classList.add('hidden');
        await loadData();
      }
    } catch (e) {
      showToast('Invalid JSON format: ' + e.message, 'error');
    }
  });

  // ==========================================================================
  // TAB NAVIGATION & ROADMAP INITIALIZATION
  // ==========================================================================
  const tabPrompts = document.getElementById('tab-btn-prompts');
  const tabRoadmap = document.getElementById('tab-btn-roadmap');
  const viewPrompts = document.getElementById('view-prompts');
  const viewRoadmap = document.getElementById('view-roadmap');
  const promptHeaderActions = document.getElementById('prompt-header-actions');

  function switchTab(target) {
    if (target === 'prompts') {
      tabPrompts.classList.add('active');
      tabRoadmap.classList.remove('active');
      viewPrompts.classList.remove('hidden');
      viewRoadmap.classList.add('hidden');
      promptHeaderActions.classList.remove('hidden');
    } else {
      tabRoadmap.classList.add('active');
      tabPrompts.classList.remove('active');
      viewRoadmap.classList.remove('hidden');
      viewPrompts.classList.add('hidden');
      promptHeaderActions.classList.add('hidden');
      loadRoadmapData();
    }
  }

  tabPrompts.addEventListener('click', () => switchTab('prompts'));
  tabRoadmap.addEventListener('click', () => switchTab('roadmap'));

  // ==========================================================================
  // ROADMAP LOGIC & EVENT HANDLERS
  // ==========================================================================
  let roadmapData = null;
  let discoveryData = null;
  let competitorData = null;
  let activeMoscowFilter = 'ALL';

  async function loadRoadmapData() {
    try {
      const res = await api('/api/roadmap');
      if (res) {
        discoveryData = res.discovery;
        competitorData = res.competitors;
        roadmapData = res.roadmap;

        renderDiscoveryCard(discoveryData);
        renderCompetitorCard(competitorData);
        renderRoadmapBoard(roadmapData);
      }
    } catch (e) {
      console.warn('Roadmap initial load error:', e);
    }
  }

  function renderDiscoveryCard(discovery) {
    const badge = document.getElementById('discovery-type-badge');
    const container = document.getElementById('discovery-card-content');

    if (!discovery) {
      badge.textContent = 'Not Scanned';
      badge.className = 'badge';
      container.innerHTML = `
        <p class="text-muted">Repository not yet scanned. Click <b>"1. Scan Project"</b> above to auto-detect tech stack, personas, and problem statement.</p>
      `;
      return;
    }

    badge.textContent = discovery.projectType.toUpperCase();
    badge.className = 'badge badge-accent';

    const techChips = [
      discovery.techStack.primaryLanguage,
      ...discovery.techStack.frameworks,
      ...discovery.techStack.tools
    ].filter(Boolean).map(t => `<span class="chip">${escapeHtml(t)}</span>`).join('');

    const gapsList = discovery.currentState.knownGaps.slice(0, 3)
      .map(g => `<li>${escapeHtml(g)}</li>`).join('');

    container.innerHTML = `
      <div class="intel-field">
        <div class="intel-label">Project & Tech Stack</div>
        <div class="intel-value"><b>${escapeHtml(discovery.projectName)}</b></div>
        <div class="chips-list">${techChips}</div>
      </div>
      <div class="intel-field">
        <div class="intel-label">Target Audience Persona</div>
        <div class="intel-value">${escapeHtml(discovery.targetAudience.primaryPersona)}</div>
      </div>
      <div class="intel-field">
        <div class="intel-label">Product Vision & Problem Statement</div>
        <div class="intel-value"><em>"${escapeHtml(discovery.productVision.oneLiner)}"</em></div>
      </div>
      <div class="intel-field">
        <div class="intel-label">Identified Gaps & Technical Opportunities</div>
        <ul style="padding-left: 18px; font-size: 0.8rem; color: var(--text-muted);">${gapsList}</ul>
      </div>
    `;
  }

  function renderCompetitorCard(comp) {
    const badge = document.getElementById('competitor-count-badge');
    const container = document.getElementById('competitor-card-content');

    if (!comp || !comp.competitors || comp.competitors.length === 0) {
      badge.textContent = '0 Competitors';
      badge.className = 'badge';
      container.innerHTML = `
        <p class="text-muted">No competitor analysis loaded. Click <b>"2. Analyze Competitors"</b> to extract market flaws and differentiation gaps.</p>
      `;
      return;
    }

    badge.textContent = `${comp.competitors.length} Competitors Mapped`;
    badge.className = 'badge badge-amber';

    let html = '';
    for (const c of comp.competitors.slice(0, 3)) {
      const flaws = c.painPoints.slice(0, 2).map(p => `
        <div class="pain-point-item">
          <div class="pain-point-header">
            <span class="severity-${p.severity}">[${p.severity.toUpperCase()} IMPACT] ${escapeHtml(p.source)}</span>
            <span style="font-size: 0.7rem; color: #94a3b8;">${p.id}</span>
          </div>
          <div>${escapeHtml(p.description)}</div>
          <div style="font-size: 0.74rem; color: #34d399; margin-top: 3px;">💡 Opportunity: ${escapeHtml(p.opportunity)}</div>
        </div>
      `).join('');

      html += `
        <div class="competitor-item">
          <div class="competitor-header">
            <span class="competitor-name">${escapeHtml(c.name)}</span>
            <span class="badge" style="font-size: 0.7rem;">${c.relevance.toUpperCase()} RELEVANCE</span>
          </div>
          <div class="competitor-position">${escapeHtml(c.marketPosition)}</div>
          ${flaws}
        </div>
      `;
    }

    if (comp.marketGaps && comp.marketGaps.length > 0) {
      const topGap = comp.marketGaps[0];
      html += `
        <div class="market-gap-banner">
          <b>🎯 Top Market Differentiator:</b> ${escapeHtml(topGap.description)}
        </div>
      `;
    }

    container.innerHTML = html;
  }

  function renderRoadmapBoard(roadmap) {
    const summaryText = document.getElementById('roadmap-summary-text');
    const container = document.getElementById('roadmap-phases-container');

    if (!roadmap || !roadmap.phases || roadmap.phases.length === 0) {
      summaryText.textContent = 'No roadmap generated yet.';
      container.innerHTML = `
        <div class="empty-state">
          <h3>No Roadmap Generated</h3>
          <p>Click <b>"3. Generate Roadmap"</b> to synthesize project discovery & competitor analysis into a phased MoSCoW plan.</p>
        </div>
      `;
      return;
    }

    const filteredFeatures = activeMoscowFilter === 'ALL'
      ? roadmap.features
      : roadmap.features.filter(f => f.priority.toLowerCase() === activeMoscowFilter.toLowerCase());

    const mustCount = roadmap.features.filter(f => f.priority === 'must').length;
    const completedCount = roadmap.features.filter(f => f.status === 'completed').length;
    const progressPercent = Math.round((completedCount / roadmap.features.length) * 100);

    summaryText.innerHTML = `
      <b>${roadmap.features.length} Features</b> (${completedCount} completed, ${mustCount} MVP Must-Haves) &bull; 
      Overall Progress: <b>${progressPercent}%</b>
    `;

    let html = '';

    for (const phase of roadmap.phases) {
      const phaseFeatures = filteredFeatures.filter(f => f.phaseId === phase.id);
      const allPhaseFeatures = roadmap.features.filter(f => f.phaseId === phase.id);
      const phaseCompleted = allPhaseFeatures.filter(f => f.status === 'completed').length;
      const phasePercent = allPhaseFeatures.length > 0
        ? Math.round((phaseCompleted / allPhaseFeatures.length) * 100)
        : 0;

      if (phaseFeatures.length === 0 && activeMoscowFilter !== 'ALL') {
        continue; // Skip phases with 0 features matching filter
      }

      const featuresHtml = phaseFeatures.map(feat => {
        const priorityClass = `moscow-${feat.priority}`;
        const storiesHtml = feat.userStories.map(s => `<div class="user-story-quote">"${escapeHtml(s)}"</div>`).join('');
        const criteriaHtml = feat.acceptanceCriteria.map(c => `
          <li class="criteria-item">
            <span class="criteria-bullet">✔</span>
            <span>${escapeHtml(c)}</span>
          </li>
        `).join('');

        const competitorTags = (feat.competitorInsightIds || []).map(id => `
          <span class="tag-competitor">Solves ${id}</span>
        `).join('');

        return `
          <div class="feature-item-card" id="card-${feat.id}">
            <div class="feature-top-row">
              <span class="moscow-tag ${priorityClass}">${feat.priority.toUpperCase()}</span>
              <select class="feature-status-select" data-feature-id="${feat.id}">
                <option value="idea" ${feat.status === 'idea' ? 'selected' : ''}>Idea</option>
                <option value="planned" ${feat.status === 'planned' ? 'selected' : ''}>Planned</option>
                <option value="in_progress" ${feat.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                <option value="completed" ${feat.status === 'completed' ? 'selected' : ''}>Completed</option>
              </select>
            </div>
            <div class="feature-title">[${feat.id}] ${escapeHtml(feat.title)}</div>
            <div class="feature-desc">${escapeHtml(feat.description)}</div>
            ${storiesHtml}
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); margin-top: 4px;">Acceptance Criteria</div>
            <ul class="criteria-list">${criteriaHtml}</ul>
            <div class="feature-tags-row">
              <span class="badge" style="font-size: 0.7rem;">Effort: ${feat.complexity}</span>
              <span class="badge" style="font-size: 0.7rem;">Impact: ${feat.impact}</span>
              ${competitorTags}
            </div>
            <div class="feature-footer-actions">
              <button class="btn-feature-prompt" data-feature-id="${feat.id}" title="Copy AI Pair Programmer prompt to implement this feature">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy Prompt for Feature
              </button>
            </div>
          </div>
        `;
      }).join('');

      html += `
        <div class="phase-card">
          <div class="phase-header">
            <div>
              <div class="phase-title">${escapeHtml(phase.name)}</div>
              <div class="phase-desc">${escapeHtml(phase.description)}</div>
            </div>
            <div class="phase-progress-wrapper">
              <span class="phase-progress-text">${phasePercent}% Done</span>
              <div class="progress-track">
                <div class="progress-fill" style="width: ${phasePercent}%;"></div>
              </div>
            </div>
          </div>
          <div class="features-grid">
            ${featuresHtml || '<p class="text-muted">No features in this phase match current filter.</p>'}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;

    // Attach feature status change listeners
    container.querySelectorAll('.feature-status-select').forEach(sel => {
      sel.addEventListener('change', async (e) => {
        const featId = e.target.getAttribute('data-feature-id');
        const newStatus = e.target.value;
        try {
          const updatedRoadmap = await api('/api/roadmap/feature/status', {
            method: 'POST',
            body: JSON.stringify({ featureId: featId, status: newStatus })
          });
          if (updatedRoadmap) {
            roadmapData = updatedRoadmap;
            showToast(`Feature ${featId} set to "${newStatus}"!`);
            renderRoadmapBoard(roadmapData);
          }
        } catch (err) {
          showToast(`Failed to update status: ${err.message}`, 'error');
        }
      });
    });

    // Attach "Copy Prompt for Feature" listeners
    container.querySelectorAll('.btn-feature-prompt').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const featId = btn.getAttribute('data-feature-id');
        const feat = roadmap.features.find(f => f.id === featId);
        if (!feat) return;

        const promptText = generatePromptForFeature(feat, roadmap);
        try {
          await navigator.clipboard.writeText(promptText);
          showToast(`📋 Copied implementation prompt for [${feat.id}] ${feat.title}!`);
        } catch {
          showToast('Failed to copy to clipboard', 'error');
        }
      });
    });
  }

  function generatePromptForFeature(feat, roadmap) {
    return `### Antigravity Task: Implement [${feat.id}] ${feat.title}

**Context:**
Project: ${roadmap.projectName}
Vision: ${roadmap.vision}
Priority: ${feat.priority.toUpperCase()} (MoSCoW)
Phase: ${feat.phaseId}

**Feature Description:**
${feat.description}

**Rationale:**
${feat.rationale}

**User Story:**
${feat.userStories.map(s => `- "${s}"`).join('\n')}

**Acceptance Criteria:**
${feat.acceptanceCriteria.map(c => `- [ ] ${c}`).join('\n')}

**Instructions:**
Please inspect the current codebase, write clean and modular code fulfilling all acceptance criteria above, provide automated unit tests, and confirm that all existing and new tests pass.`;
  }

  // MoSCoW Filter Buttons
  document.querySelectorAll('#moscow-pills button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#moscow-pills button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeMoscowFilter = btn.getAttribute('data-moscow');
      renderRoadmapBoard(roadmapData);
    });
  });

  // Action Buttons
  document.getElementById('btn-run-discovery').addEventListener('click', async () => {
    showToast('🔬 Scanning repository codebase...');
    try {
      const res = await api('/api/roadmap/discovery', { method: 'POST' });
      discoveryData = res;
      renderDiscoveryCard(discoveryData);
      showToast('Project discovery complete!', 'success');
    } catch (err) {
      showToast(`Scan failed: ${err.message}`, 'error');
    }
  });

  document.getElementById('btn-run-competitors').addEventListener('click', async () => {
    showToast('🥊 Analyzing competitors and user pain points...');
    try {
      const res = await api('/api/roadmap/competitors', { method: 'POST' });
      competitorData = res;
      renderCompetitorCard(competitorData);
      showToast('Competitor intelligence analyzed!', 'success');
    } catch (err) {
      showToast(`Competitor analysis failed: ${err.message}`, 'error');
    }
  });

  document.getElementById('btn-run-generate').addEventListener('click', async () => {
    showToast('⚡ Generating strategic MoSCoW roadmap...');
    try {
      const res = await api('/api/roadmap/generate', { method: 'POST' });
      roadmapData = res;
      await loadRoadmapData();
      showToast('Roadmap generated successfully!', 'success');
    } catch (err) {
      showToast(`Roadmap generation failed: ${err.message}`, 'error');
    }
  });

  document.getElementById('btn-export-markdown').addEventListener('click', async () => {
    showToast('📄 Exporting ROADMAP.md to project root...');
    try {
      const res = await api('/api/roadmap/export', { method: 'POST' });
      if (res.success) {
        showToast(`Saved ROADMAP.md successfully to: ${res.filePath}`, 'success');
      } else {
        showToast(res.error || 'Failed to export ROADMAP.md', 'error');
      }
    } catch (err) {
      showToast(`Export failed: ${err.message}`, 'error');
    }
  });
});
