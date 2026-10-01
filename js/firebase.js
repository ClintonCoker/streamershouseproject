/* ============================================================
   STREAMERS HOUSE '26 — INTERNAL PLANNING PORTAL
   js/firebase.js — Firebase Configuration & Real-Time Sync
   Author: Clinton Olatunji
   Architecture:
   - Firebase Realtime DB is the source of truth for all users
   - localStorage is the immediate offline backup / fallback
   - All saves write to BOTH simultaneously (dual-write pattern)
   - fbWatch() keeps all browsers in sync in real time
   ============================================================ */

// ============================================================
// FIREBASE CONFIGURATION
// Replace these placeholder values with your real Firebase
// project config from console.firebase.google.com
// ============================================================
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  databaseURL:       "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

// ============================================================
// STATE
// ============================================================
let db      = null;   // Firebase database reference
let fbReady = false;  // True once Firebase successfully initializes

// Debounce timers — one per save key to avoid flooding Firebase
const saveTimers = {};
const SAVE_DELAY = 800; // ms — fires 800ms after user stops typing

// ============================================================
// INITIALIZE FIREBASE
// Called on DOMContentLoaded. Renders content immediately from
// defaults/localStorage, then upgrades to Firebase sync if available.
// ============================================================
function initFirebase() {
  // Step 1: Always render content immediately so the page is never blank
  renderCreators(DEFAULT_CREATORS);
  renderTasks(DEFAULT_CREATORS);
  loadContentFromLocalStorage();

  // Step 2: Check if Firebase SDK loaded (CDN may be blocked locally)
  if (typeof firebase === 'undefined') {
    console.warn('Firebase SDK not loaded — running in local-only mode');
    setFbStatus('error', 'Local only');
    return;
  }

  // Step 3: Initialize Firebase and start real-time listeners
  try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    fbReady = true;
    setFbStatus('live', 'Live sync');
    loadAllFromFirebase();
  } catch (e) {
    console.warn('Firebase init failed — falling back to localStorage', e);
    setFbStatus('error', 'Local only');
  }
}

// ============================================================
// STATUS INDICATOR
// Updates the "Live sync" pill in the top-right corner
// ============================================================
function setFbStatus(state, label) {
  const el    = document.getElementById('firebase-status');
  const lbl   = document.getElementById('fs-label');
  const dot   = document.getElementById('syncDot');
  const sLbl  = document.getElementById('syncLabel');

  if (el)   el.className  = state;
  if (lbl)  lbl.textContent = label;
  if (dot)  dot.className = 'sync-dot ' + state;
  if (sLbl) sLbl.textContent = label;
}

// ============================================================
// SAVE — Write a key/value pair to Firebase + localStorage
// ============================================================
function fbSave(key, value) {
  // Always write to localStorage immediately as offline backup
  localStorage.setItem(
    'sh26-' + key,
    typeof value === 'string' ? value : JSON.stringify(value)
  );

  if (fbReady && db) {
    setFbStatus('saving', 'Saving…');
    db.ref('sh26/' + key)
      .set(value)
      .then(() => {
        setFbStatus('live', 'Live sync');
        showToast('Saved ✓');
      })
      .catch(err => {
        console.error('Firebase save error:', err);
        setFbStatus('error', 'Save failed');
        showToast('Saved locally only');
      });
  } else {
    // Offline: localStorage already written above
    showToast('Saved locally');
  }
}

// ============================================================
// DEBOUNCED SAVE — Prevents saving on every single keystroke
// Resets timer each call; fires once user pauses typing
// ============================================================
function fbSaveDebounced(key, value) {
  clearTimeout(saveTimers[key]);
  saveTimers[key] = setTimeout(() => fbSave(key, value), SAVE_DELAY);
}

// ============================================================
// GET — One-time read from Firebase (or localStorage fallback)
// ============================================================
function fbGet(key, callback) {
  if (fbReady && db) {
    db.ref('sh26/' + key).once('value', snap => callback(snap.val()));
  } else {
    const v = localStorage.getItem('sh26-' + key);
    callback(v ? JSON.parse(v) : null);
  }
}

// ============================================================
// WATCH — Real-time listener (fires on every remote change)
// This is what makes edits appear instantly for all users
// ============================================================
function fbWatch(key, callback) {
  if (fbReady && db) {
    db.ref('sh26/' + key).on('value', snap => callback(snap.val()));
  }
}

// ============================================================
// LOAD FROM FIREBASE — Set up all real-time watchers
// Each fbWatch() call subscribes to a key and updates the DOM
// whenever ANY user changes that value
// ============================================================
function loadAllFromFirebase() {
  // Named contenteditable fields (data-fb attribute)
  document.querySelectorAll('[data-fb]').forEach(el => {
    const key = el.dataset.fb;
    fbWatch(key, val => {
      if (val !== null && val !== el.innerHTML) el.innerHTML = val;
    });
  });

  // Progress bar
  fbWatch('progress', val => {
    if (val !== null) {
      document.getElementById('progress-range').value = val;
      setProgress(val);
    }
  });

  // Creator roster (stored as JSON array)
  fbGet('creators', val => {
    if (val) {
      try { renderCreators(val); renderTasks(val); }
      catch (e) { renderCreators(DEFAULT_CREATORS); renderTasks(DEFAULT_CREATORS); }
    } else {
      renderCreators(DEFAULT_CREATORS);
      renderTasks(DEFAULT_CREATORS);
    }
  });

  // Budget table (stored as raw innerHTML)
  fbWatch('budget-html', val => {
    if (val) {
      document.getElementById('budget-body').innerHTML = val;
      recalcBudget();
    }
  });

  // Streaming plan table
  fbWatch('streaming-html', val => {
    if (val) document.getElementById('streaming-body').innerHTML = val;
  });

  // Announcements grid
  fbWatch('announcements-html', val => {
    if (val) document.getElementById('announcements-grid').innerHTML = val;
  });

  // Recent updates list
  fbWatch('updates-html', val => {
    if (val) document.getElementById('updates-list').innerHTML = val;
  });

  // Sponsors grid
  fbWatch('sponsors-html', val => {
    if (val) document.getElementById('sponsor-grid').innerHTML = val;
  });

  // Timeline (stored as JSON with one key per phase)
  fbWatch('timeline-html', val => {
    if (val) {
      try {
        const tl = JSON.parse(val);
        if (tl.pre)  document.getElementById('tl-pre').innerHTML  = tl.pre;
        if (tl.day1) document.getElementById('tl-day1').innerHTML = tl.day1;
        if (tl.day2) document.getElementById('tl-day2').innerHTML = tl.day2;
        if (tl.day3) document.getElementById('tl-day3').innerHTML = tl.day3;
        if (tl.post) document.getElementById('tl-post').innerHTML = tl.post;
      } catch (e) { console.warn('Timeline parse error', e); }
    }
  });

  // Food plan (stored as JSON array of grid innerHTML)
  fbWatch('food-html', val => {
    if (val) {
      try {
        const grids = document.querySelectorAll('.food-grid');
        const saved = JSON.parse(val);
        grids.forEach((g, i) => { if (saved[i]) g.innerHTML = saved[i]; });
      } catch (e) { console.warn('Food parse error', e); }
    }
  });
}

// ============================================================
// LOAD FROM LOCALSTORAGE — Offline / first-load fallback
// Runs immediately before Firebase responds so UI is never empty
// ============================================================
function loadContentFromLocalStorage() {
  // Named fields
  document.querySelectorAll('[data-fb]').forEach(el => {
    const saved = localStorage.getItem('sh26-' + el.dataset.fb);
    if (saved !== null) el.innerHTML = saved;
  });

  // Progress bar
  const p = localStorage.getItem('sh26-progress');
  if (p) { document.getElementById('progress-range').value = p; setProgress(p); }

  // HTML sections
  const budgetHtml = localStorage.getItem('sh26-budget-html');
  if (budgetHtml) {
    document.getElementById('budget-body').innerHTML = budgetHtml;
    recalcBudget();
  }

  const streamHtml = localStorage.getItem('sh26-streaming-html');
  if (streamHtml) document.getElementById('streaming-body').innerHTML = streamHtml;

  const annHtml = localStorage.getItem('sh26-announcements-html');
  if (annHtml) document.getElementById('announcements-grid').innerHTML = annHtml;

  const updHtml = localStorage.getItem('sh26-updates-html');
  if (updHtml) document.getElementById('updates-list').innerHTML = updHtml;

  const sponsorHtml = localStorage.getItem('sh26-sponsors-html');
  if (sponsorHtml) document.getElementById('sponsor-grid').innerHTML = sponsorHtml;

  const tlHtml = localStorage.getItem('sh26-timeline-html');
  if (tlHtml) {
    try {
      const tl = JSON.parse(tlHtml);
      if (tl.pre)  document.getElementById('tl-pre').innerHTML  = tl.pre;
      if (tl.day1) document.getElementById('tl-day1').innerHTML = tl.day1;
      if (tl.day2) document.getElementById('tl-day2').innerHTML = tl.day2;
      if (tl.day3) document.getElementById('tl-day3').innerHTML = tl.day3;
      if (tl.post) document.getElementById('tl-post').innerHTML = tl.post;
    } catch (e) {}
  }

  const foodHtml = localStorage.getItem('sh26-food-html');
  if (foodHtml) {
    try {
      const grids = document.querySelectorAll('.food-grid');
      const saved = JSON.parse(foodHtml);
      grids.forEach((g, i) => { if (saved[i]) g.innerHTML = saved[i]; });
    } catch (e) {}
  }
}

// ============================================================
// SAVE SECTION HELPER
// Determines which Firebase key to save based on which element
// was edited. Called on both 'input' (debounced) and 'blur' (immediate).
// ============================================================
function saveSection(el) {
  if (!el || el.contentEditable !== 'true') return;

  // Named fields — save directly by key
  if (el.dataset.fb) {
    localStorage.setItem('sh26-' + el.dataset.fb, el.innerHTML);
    fbSaveDebounced(el.dataset.fb, el.innerHTML);
  }

  // Budget table
  if (el.closest('#budget-body')) {
    recalcBudget();
    const html = document.getElementById('budget-body').innerHTML;
    localStorage.setItem('sh26-budget-html', html);
    fbSave('budget-html', html);
  }

  // Streaming plan
  if (el.closest('#streaming-body')) {
    const html = document.getElementById('streaming-body').innerHTML;
    localStorage.setItem('sh26-streaming-html', html);
    fbSave('streaming-html', html);
  }

  // Announcements
  if (el.closest('#announcements-grid')) {
    const html = document.getElementById('announcements-grid').innerHTML;
    localStorage.setItem('sh26-announcements-html', html);
    fbSave('announcements-html', html);
  }

  // Updates list
  if (el.closest('#updates-list')) {
    const html = document.getElementById('updates-list').innerHTML;
    localStorage.setItem('sh26-updates-html', html);
    fbSave('updates-html', html);
  }

  // Timeline phases
  if (
    el.closest('#tl-pre')  || el.closest('#tl-day1') ||
    el.closest('#tl-day2') || el.closest('#tl-day3') ||
    el.closest('#tl-post')
  ) {
    const html = getTimelineHTML();
    localStorage.setItem('sh26-timeline-html', html);
    fbSave('timeline-html', html);
  }

  // Food grids
  if (el.closest('.food-grid')) {
    const html = getFoodHTML();
    localStorage.setItem('sh26-food-html', html);
    fbSave('food-html', html);
  }

  // Sponsors
  if (el.closest('#sponsor-grid')) {
    const html = document.getElementById('sponsor-grid').innerHTML;
    localStorage.setItem('sh26-sponsors-html', html);
    fbSave('sponsors-html', html);
  }
}

// ============================================================
// HELPERS — Serialize multi-part sections to JSON strings
// ============================================================
function getTimelineHTML() {
  return JSON.stringify({
    pre:  document.getElementById('tl-pre').innerHTML,
    day1: document.getElementById('tl-day1').innerHTML,
    day2: document.getElementById('tl-day2').innerHTML,
    day3: document.getElementById('tl-day3').innerHTML,
    post: document.getElementById('tl-post').innerHTML,
  });
}

function getFoodHTML() {
  const grids = document.querySelectorAll('.food-grid');
  return JSON.stringify(Array.from(grids).map(g => g.innerHTML));
}
