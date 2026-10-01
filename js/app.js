/* ============================================================
   STREAMERS HOUSE '26 — INTERNAL PLANNING PORTAL
   js/app.js — Main Application Logic
   Author: Clinton Olatunji
  
  
   Handles:
   - Sidebar navigation & routing
   - Search filtering
   - Progress bar
   - All section interactions (budget, streaming, timeline, etc.)
   - Toast notifications
   - Budget auto-calculation
   - Mobile menu
   ============================================================ */

// ============================================================
// 1. NAVIGATION — Single-page routing via section toggling
// ============================================================
const navItems = document.querySelectorAll('.nav-item[data-section]');
const sections = document.querySelectorAll('.section');

/**
 * Navigate to a section by ID.
 * Hides all sections, shows the target, updates nav active state.
 */
function navigateTo(sectionId) {
  // Hide all sections
  sections.forEach(s => s.classList.remove('active'));

  // Deactivate all nav items
  navItems.forEach(n => n.classList.remove('active'));

  // Show target section
  const target = document.getElementById('sec-' + sectionId);
  if (target) target.classList.add('active');

  // Activate matching nav item
  const navItem = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
  if (navItem) navItem.classList.add('active');

  // Close mobile sidebar after navigation
  document.getElementById('sidebar').classList.remove('open');
}

// Attach click listeners to all nav items
navItems.forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    navigateTo(item.dataset.section);
  });
});

// ============================================================
// 2. MOBILE MENU TOGGLE
// ============================================================
document.getElementById('mobileMenuBtn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ============================================================
// 3. SIDEBAR SEARCH — Filter nav items in real time
// ============================================================
document.getElementById('searchInput').addEventListener('input', function () {
  const query = this.value.toLowerCase();
  navItems.forEach(item => {
    const match = item.textContent.toLowerCase().includes(query);
    item.style.display = match ? '' : 'none';
  });
});

// ============================================================
// 4. AUTO-SAVE LISTENERS
// Two triggers: 'input' (debounced) and 'blur' (immediate)
// This dual approach ensures nothing is lost even if
// the user closes the tab right after editing.
// ============================================================

// Debounced save while typing
document.addEventListener('input', e => {
  const el = e.target;
  if (el.contentEditable === 'true') {
    // Recalculate budget if a budget cell changed
    if (el.closest('#budget-body')) recalcBudget();

    // Debounce the actual save
    clearTimeout(saveTimers['_global']);
    saveTimers['_global'] = setTimeout(() => saveSection(el), 800);
  }
});

// Immediate save when user clicks away
document.addEventListener('blur', e => {
  const el = e.target;
  if (el.contentEditable === 'true') saveSection(el);
}, true); // useCapture=true to catch blur on all elements

// Save timeline checkboxes immediately on change
document.addEventListener('change', e => {
  if (e.target.type === 'checkbox' && e.target.closest('.timeline-list')) {
    const html = getTimelineHTML();
    localStorage.setItem('sh26-timeline-html', html);
    fbSave('timeline-html', html);
  }
});

// ============================================================
// 5. PLANNING PROGRESS BAR
// ============================================================
const progressRange = document.getElementById('progress-range');

progressRange.addEventListener('input', function () {
  setProgress(this.value);
  localStorage.setItem('sh26-progress', this.value);
  fbSaveDebounced('progress', this.value);
});

/**
 * Update the progress bar fill and percentage label.
 * @param {number|string} val - 0 to 100
 */
function setProgress(val) {
  document.getElementById('progress-fill').style.width = val + '%';
  document.getElementById('progress-pct').textContent  = val + '%';
}

// ============================================================
// 6. RECENT UPDATES
// ============================================================

/** Add a new update entry to the dashboard updates list */
function addUpdate() {
  const list = document.getElementById('updates-list');
  const li   = document.createElement('li');
  li.innerHTML = `
    <span class="update-date" contenteditable="true">Date</span>
    <span class="update-text" contenteditable="true">New update…</span>
    <button class="update-del" onclick="deleteUpdate(this)">
      <i class="fas fa-times"></i>
    </button>
  `;
  list.appendChild(li);
  li.querySelector('[contenteditable]').focus();
  fbSave('updates-html', list.innerHTML);
}

/** Delete an update entry */
function deleteUpdate(btn) {
  const list = document.getElementById('updates-list');
  btn.closest('li').remove();
  fbSave('updates-html', list.innerHTML);
}

// ============================================================
// 7. ANNOUNCEMENTS
// ============================================================

/** Add a new announcement card to the grid */
function addAnnouncement() {
  const grid  = document.getElementById('announcements-grid');
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day:   'numeric'
  });

  const card = document.createElement('div');
  card.className = 'announcement-card';
  card.innerHTML = `
    <div class="ann-date"  contenteditable="true">${today}</div>
    <div class="ann-title" contenteditable="true">New Announcement</div>
    <div class="ann-body"  contenteditable="true">Click to edit this announcement…</div>
    <button class="ann-del" onclick="deleteAnnouncement(this)">
      <i class="fas fa-times"></i>
    </button>
  `;

  // Prepend so newest appears first
  grid.prepend(card);
  card.querySelector('.ann-title').focus();

  fbSave('announcements-html', grid.innerHTML);
  showToast('Announcement added');
}

/** Delete an announcement card */
function deleteAnnouncement(btn) {
  const grid = document.getElementById('announcements-grid');
  btn.closest('.announcement-card').remove();
  fbSave('announcements-html', grid.innerHTML);
}

// ============================================================
// 8. STREAMING PLAN TABLE
// ============================================================

/** Add a new row to the streaming schedule table */
function addStreamRow() {
  const tbody = document.getElementById('streaming-body');
  const tr    = document.createElement('tr');
  tr.innerHTML = `
    <td contenteditable="true">Day X – 7:00 PM</td>
    <td contenteditable="true">Creator</td>
    <td contenteditable="true">Platform</td>
    <td contenteditable="true">Topic</td>
    <td contenteditable="true">Notes</td>
    <td>
      <button class="del-row-btn" onclick="deleteStreamRow(this)">
        <i class="fas fa-times"></i>
      </button>
    </td>
  `;
  tbody.appendChild(tr);
  tr.querySelector('[contenteditable]').focus();
  fbSave('streaming-html', tbody.innerHTML);
}

/** Delete a streaming plan row */
function deleteStreamRow(btn) {
  const tbody = document.getElementById('streaming-body');
  btn.closest('tr').remove();
  fbSave('streaming-html', tbody.innerHTML);
}

// ============================================================
// 9. BUDGET TABLE
// ============================================================

/** Add a new budget line item */
function addBudgetRow() {
  const tbody = document.getElementById('budget-body');
  const tr    = document.createElement('tr');
  tr.innerHTML = `
    <td contenteditable="true">New Item</td>
    <td contenteditable="true" class="est-col">0</td>
    <td contenteditable="true" class="actual-col">0</td>
    <td><span class="status-badge status-tbd">TBD</span></td>
    <td>
      <button class="del-row-btn" onclick="deleteBudgetRow(this)">
        <i class="fas fa-times"></i>
      </button>
    </td>
  `;
  tbody.appendChild(tr);
  recalcBudget();
  tr.querySelector('[contenteditable]').focus();
  fbSave('budget-html', tbody.innerHTML);
}

/** Delete a budget row and recalculate */
function deleteBudgetRow(btn) {
  const tbody = document.getElementById('budget-body');
  btn.closest('tr').remove();
  recalcBudget();
  fbSave('budget-html', tbody.innerHTML);
}

/**
 * Recalculate budget totals from the table.
 * Reads all .est-col and .actual-col cells, sums them,
 * and updates the three summary cards.
 */
function recalcBudget() {
  let estimated = 0;
  let actual    = 0;

  document.querySelectorAll('#budget-body tr').forEach(tr => {
    estimated += parseFloat(tr.querySelector('.est-col')?.textContent)    || 0;
    actual    += parseFloat(tr.querySelector('.actual-col')?.textContent) || 0;
  });

  const format = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0 });

  document.getElementById('budget-est-total').textContent    = format(estimated);
  document.getElementById('budget-actual-total').textContent = format(actual);

  // Variance: positive = over budget (red), negative = under budget (green)
  const variance  = actual - estimated;
  const varEl     = document.getElementById('budget-variance');
  varEl.textContent = (variance >= 0 ? '+' : '') + format(variance);
  varEl.style.color = variance > 0
    ? 'var(--danger)'
    : variance < 0 ? 'var(--success)' : 'var(--white)';
}

// ============================================================
// 10. TIMELINE
// ============================================================

/**
 * Add a new item to a timeline list.
 * @param {string} listId - ID of the <ul> to append to
 */
function addTlItem(listId) {
  const list = document.getElementById(listId);
  const li   = document.createElement('li');
  li.className = 'timeline-item';
  li.innerHTML = `
    <input type="checkbox">
    <span class="timeline-item-text" contenteditable="true">New item…</span>
    <button class="timeline-del" onclick="deleteTlItem(this)">
      <i class="fas fa-times"></i>
    </button>
  `;
  list.appendChild(li);
  li.querySelector('[contenteditable]').focus();

  const html = getTimelineHTML();
  localStorage.setItem('sh26-timeline-html', html);
  fbSave('timeline-html', html);
}

/** Delete a timeline item */
function deleteTlItem(btn) {
  btn.closest('li').remove();
  const html = getTimelineHTML();
  localStorage.setItem('sh26-timeline-html', html);
  fbSave('timeline-html', html);
}

// ============================================================
// 11. SPONSORS
// ============================================================

/** Add a new sponsor card */
function addSponsor() {
  const grid = document.getElementById('sponsor-grid');
  const card = document.createElement('div');
  card.className = 'sponsor-card';
  card.style.position = 'relative';
  card.innerHTML = `
    <div class="sponsor-logo-area"><i class="fas fa-building"></i></div>
    <div class="sponsor-name"         contenteditable="true">Sponsor Name</div>
    <div class="sponsor-contribution" contenteditable="true">Contribution TBD</div>
    <div class="sponsor-notes"        contenteditable="true">Notes about this sponsor…</div>
    <button class="card-del" style="opacity:1" onclick="deleteSponsor(this)">
      <i class="fas fa-times"></i>
    </button>
  `;
  grid.appendChild(card);
  card.querySelector('[contenteditable]').focus();
  fbSave('sponsors-html', grid.innerHTML);
  showToast('Sponsor added');
}

/** Delete a sponsor card */
function deleteSponsor(btn) {
  const grid = document.getElementById('sponsor-grid');
  btn.closest('.sponsor-card').remove();
  fbSave('sponsors-html', grid.innerHTML);
}

// ============================================================
// 12. TOAST NOTIFICATIONS
// ============================================================
let toastTimer;

/**
 * Show a brief toast notification at the bottom-right.
 * @param {string} msg - Message to display
 */
function showToast(msg = 'Saved') {
  const toast    = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  if (toastMsg) toastMsg.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

// ============================================================
// 13. INITIALISATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Start Firebase (or localStorage fallback)
  initFirebase();

  // Calculate budget totals from default HTML
  recalcBudget();
});
