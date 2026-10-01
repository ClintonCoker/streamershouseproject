/* ============================================================
   STREAMERS HOUSE '26 — INTERNAL PLANNING PORTAL
   js/creators.js — Creator Cards & Task Lists
   Author: Clinton Olatunji
   Handles:
   - Rendering creator cards from data array
   - Rendering per-creator task checklists
   - Add / remove creator functionality
   - Saving creator roster to Firebase
   ============================================================ */

// ============================================================
// DEFAULT CREATOR DATA
// Photos are base64-encoded JPEGs embedded directly.
// Replace img values with real base64 strings or hosted URLs.
// ============================================================
const DEFAULT_CREATORS = [
  {
    handle: 'Clinton Coker',
    real:   'Clinton Coker',
    social: '@clintoncoker',
    img:    '' // Replace with base64 string: 'data:image/jpeg;base64,...'
  },
  {
    handle: 'Chile Reptile',
    real:   'Chile Reptile',
    social: '@chilereptile',
    img:    ''
  },
  {
    handle: 'Benzchukwu',
    real:   'Benzchukwu',
    social: '@benzchukwu',
    img:    ''
  },
  {
    handle: 'Eman2freshh',
    real:   'Eman2freshh',
    social: '@eman2freshh',
    img:    '' // No photo provided — shows initials
  },
  {
    handle: 'Ekem',
    real:   'Ekem',
    social: '@ekem',
    img:    ''
  },
  {
    handle: 'Bazz_yuware',
    real:   'Bazz_yuware',
    social: '@bazz_yuware',
    img:    ''
  },
  {
    handle: 'jesse.pkr',
    real:   'Jesse PKR',
    social: '@jesse.pkr',
    img:    ''
  },
  {
    handle: 'Mubaraq.3',
    real:   'Mubaraq',
    social: '@mubaraq.3',
    img:    ''
  },
];

// ============================================================
// DEFAULT TASK LIST
// Every creator starts with these tasks. Editable per creator.
// ============================================================
const DEFAULT_TASKS = [
  '3 Collaborations',
  '4 TikTok Videos',
  'Daily Stream',
  'Daily Clip Posting',
  'Instagram Stories',
  'Group Content',
];

// ============================================================
// UTILITY — Get initials from a name (max 2 characters)
// Used as avatar fallback when no photo is provided
// ============================================================
function getInitials(name) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ============================================================
// RENDER CREATOR CARDS
// Builds the creator grid from a data array.
// Called on init and whenever the roster changes.
// ============================================================
function renderCreators(creators) {
  const grid = document.getElementById('creator-grid');
  if (!grid) return;
  grid.innerHTML = '';

  creators.forEach((creator, index) => {
    const card = document.createElement('div');
    card.className = 'creator-card';

    // Photo: real image if available, otherwise gold initials
    const photoContent = creator.img
      ? `<img src="${creator.img}" alt="${creator.handle}">`
      : getInitials(creator.handle);

    card.innerHTML = `
      <!-- Remove button — visible on hover -->
      <button class="card-del" onclick="removeCreator(${index})" title="Remove creator">
        <i class="fas fa-times"></i>
      </button>

      <!-- Profile photo -->
      <div class="creator-photo">${photoContent}</div>

      <!-- Editable fields — save on blur -->
      <div class="creator-handle"
           contenteditable="true"
           data-ci="${index}"
           data-field="handle"
           onblur="saveCreators()">
        ${creator.handle}
      </div>

      <div class="creator-real-name"
           contenteditable="true"
           data-ci="${index}"
           data-field="real"
           onblur="saveCreators()">
        ${creator.real}
      </div>

      <div class="creator-social"
           contenteditable="true"
           data-ci="${index}"
           data-field="social"
           onblur="saveCreators()">
        ${creator.social}
      </div>
    `;

    grid.appendChild(card);
  });
}

// ============================================================
// SAVE CREATORS — Reads current card DOM → saves to Firebase
// Called on every contenteditable blur within a creator card
// ============================================================
function saveCreators() {
  const cards = document.querySelectorAll('.creator-card');

  const creators = Array.from(cards).map((card, i) => ({
    handle: card.querySelector('.creator-handle')?.textContent?.trim() || '',
    real:   card.querySelector('.creator-real-name')?.textContent?.trim() || '',
    social: card.querySelector('.creator-social')?.textContent?.trim() || '',
    img:    DEFAULT_CREATORS[i]?.img || '', // Preserve original photos
  }));

  fbSave('creators', creators);
}

// ============================================================
// ADD CREATOR — Appends a blank creator to the roster
// ============================================================
function addCreator() {
  fbGet('creators', val => {
    const creators = val || DEFAULT_CREATORS;
    creators.push({
      handle: 'New Creator',
      real:   'Real Name',
      social: '@handle',
      img:    '',
    });
    fbSave('creators', creators);
    renderCreators(creators);
    renderTasks(creators);
    showToast('Creator added');
  });
}

// ============================================================
// REMOVE CREATOR — Splices by index, re-renders
// ============================================================
function removeCreator(index) {
  fbGet('creators', val => {
    const creators = val || DEFAULT_CREATORS;
    creators.splice(index, 1);
    fbSave('creators', creators);
    renderCreators(creators);
    renderTasks(creators);
    showToast('Creator removed');
  });
}

// ============================================================
// RENDER TASKS — One checklist block per creator
// ============================================================
function renderTasks(creators) {
  const grid = document.getElementById('tasks-grid');
  if (!grid) return;
  grid.innerHTML = '';

  creators.forEach((creator, creatorIndex) => {
    const tasks = DEFAULT_TASKS.map(label => ({ label, done: false }));

    const block = document.createElement('div');
    block.className = 'task-creator';

    block.innerHTML = `
      <div class="task-creator-name">${creator.handle}</div>

      <ul class="task-list">
        ${tasks.map((task, taskIndex) => `
          <li class="task-item">
            <input
              type="checkbox"
              ${task.done ? 'checked' : ''}
              onchange="toggleTask(${creatorIndex}, ${taskIndex}, this.checked)"
            >
            <span
              class="task-text"
              contenteditable="true"
              onblur="renameTask(${creatorIndex}, ${taskIndex}, this.textContent)"
            >
              ${task.label}
            </span>
          </li>
        `).join('')}
      </ul>

      <button class="table-add-btn" style="margin-top:7px" onclick="addTask(this)">
        <i class="fas fa-plus"></i> Add Task
      </button>
    `;

    grid.appendChild(block);
  });
}

// ============================================================
// TASK HELPERS
// ============================================================

// Toggle a task's checked state
function toggleTask(creatorIndex, taskIndex, done) {
  const key = `task-${creatorIndex}-${taskIndex}`;
  fbSave(key, done);
  showToast(done ? 'Task completed ✓' : 'Task unchecked');
}

// Rename a task's label
function renameTask(creatorIndex, taskIndex, label) {
  const key = `task-label-${creatorIndex}-${taskIndex}`;
  fbSave(key, label.trim());
}

// Add a new task to a creator's list
function addTask(btn) {
  const ul = btn.previousElementSibling; // the <ul>
  const li = document.createElement('li');
  li.className = 'task-item';
  li.innerHTML = `
    <input type="checkbox">
    <span class="task-text" contenteditable="true">New Task</span>
  `;
  ul.appendChild(li);
  li.querySelector('[contenteditable]').focus();
  showToast('Task added');
}
