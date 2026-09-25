/* ═══════════════════════════════════════════
   D&D GRIMOIRE — main.js
   ~/> v1i · reskinned from the Book of Shadows shell
═══════════════════════════════════════════ */

/* ══════════════════════════════
   STORAGE KEYS
   Entries, highlights, role, DM-password hash, and the terms-on
   toggle are each kept under their own key so they can evolve
   independently and so a Realm export only ever touches entries.
══════════════════════════════ */
const LS_KEY     = 'dnd_grimoire_entries';
const HL_KEY     = 'dnd_grimoire_highlights';
const ROLE_KEY   = 'dnd_grimoire_role';
const DMPASS_KEY = 'dnd_grimoire_dm_pass_hash';
const TERMS_KEY  = 'dnd_grimoire_terms_on';

function lsLoad() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const p   = raw ? JSON.parse(raw) : [];
    return Array.isArray(p) ? p : [];
  } catch { return []; }
}

function lsSave(entries) {
  const ordered = [...entries].sort((a, b) => a.timestamp - b.timestamp);
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(ordered));
  } catch (err) {
    console.error('localStorage write failed:', err);
    alert('Storage quota exceeded — consider removing images or older entries.');
  }
}

function lsLoadHighlights() {
  try {
    const raw = localStorage.getItem(HL_KEY);
    const p   = raw ? JSON.parse(raw) : [];
    return Array.isArray(p) ? p : [];
  } catch { return []; }
}

function lsSaveHighlights(list) {
  try {
    localStorage.setItem(HL_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('highlight storage failed:', err);
  }
}

/* ══════════════════════════════
   D&D GLOSSARY
   ~33 core terms. Each may have aliases (abbreviations) that also
   trigger inline term-linking. Original wording, not reproduced
   from copyrighted rules text.
══════════════════════════════ */
const DND_GLOSSARY = [
  { term: 'Armor Class',        aliases: ['AC'],  def: 'How hard a creature is to hit in combat — an attack roll must meet or beat it to land.' },
  { term: 'Saving Throw',       aliases: [],       def: 'A roll made to resist or reduce the effect of a spell, trap, poison, or other hazard.' },
  { term: 'Advantage',          aliases: [],       def: 'Roll two d20s and take the higher result — granted by favorable circumstances.' },
  { term: 'Disadvantage',       aliases: [],       def: 'Roll two d20s and take the lower result — imposed by unfavorable circumstances.' },
  { term: 'Strength',           aliases: ['STR'],  def: 'The ability score governing raw physical power — melee damage, carrying capacity, and athletics.' },
  { term: 'Dexterity',          aliases: ['DEX'],  def: 'The ability score governing agility, reflexes, and balance — affects AC, initiative, and ranged attacks.' },
  { term: 'Constitution',       aliases: ['CON'],  def: 'The ability score governing health and stamina — determines hit points and resistance to fatigue.' },
  { term: 'Intelligence',       aliases: ['INT'],  def: 'The ability score governing reasoning and memory — used for arcane knowledge and some spellcasting.' },
  { term: 'Wisdom',             aliases: ['WIS'],  def: 'The ability score governing perception and intuition — used for insight and some spellcasting.' },
  { term: 'Charisma',           aliases: ['CHA'],  def: 'The ability score governing force of personality — persuasion, deception, and some spellcasting.' },
  { term: 'Hit Points',         aliases: ['HP'],   def: 'A measure of how much punishment a creature can take before falling unconscious or dying.' },
  { term: 'Hit Dice',           aliases: [],       def: 'Dice tied to a character\u2019s class and level, spent to determine HP gained on level-up or recovered on rest.' },
  { term: 'Cantrip',            aliases: [],       def: 'A spell simple enough to cast repeatedly without using up a spell slot.' },
  { term: 'Spell Slot',         aliases: [],       def: 'A resource spent to cast a spell of a given level or higher; slots refill on a rest.' },
  { term: 'Long Rest',          aliases: [],       def: 'A period of extended downtime (usually 8 hours) that restores hit points and most spent resources.' },
  { term: 'Short Rest',         aliases: [],       def: 'A shorter period of downtime (usually about an hour) that restores some resources, like Hit Dice.' },
  { term: 'Proficiency Bonus',  aliases: [],       def: 'A bonus added to rolls a character is trained in, growing steadily as they level up.' },
  { term: 'Initiative',         aliases: [],       def: 'A roll made at the start of combat to determine turn order.' },
  { term: 'Difficulty Class',   aliases: ['DC'],   def: 'The target number a roll must meet or beat to succeed at a check or save.' },
  { term: 'Critical Hit',       aliases: [],       def: 'Rolling the maximum on an attack die, usually dealing extra damage.' },
  { term: 'Critical Fail',      aliases: [],       def: 'Rolling the minimum on a d20, usually resulting in an automatic miss or failure.' },
  { term: 'Concentration',      aliases: [],       def: 'A state some spells require to stay active — broken by taking damage, casting another such spell, or losing focus.' },
  { term: 'Opportunity Attack', aliases: [],       def: 'A free attack made against a creature that moves out of your reach without care.' },
  { term: 'Multiclassing',      aliases: [],       def: 'Taking levels in more than one class as a character advances, blending two skill sets.' },
  { term: 'Alignment',          aliases: [],       def: 'A broad description of a creature\u2019s moral and ethical outlook, from lawful good to chaotic evil.' },
  { term: 'Experience Points',  aliases: ['XP'],   def: 'Points earned from overcoming challenges that accumulate toward gaining a level.' },
  { term: 'Challenge Rating',   aliases: ['CR'],   def: 'A rough measure of how tough a monster is meant to be for a party to face.' },
  { term: 'Ability Check',      aliases: [],       def: 'A roll made using an ability score to see whether a character succeeds at a task.' },
  { term: 'Passive Perception', aliases: [],       def: 'A static score representing how alert a character is without actively searching.' },
  { term: 'Darkvision',         aliases: [],       def: 'The ability to see in darkness, usually in shades of gray, out to a set range.' },
  { term: 'Resistance',         aliases: [],       def: 'Taking only half damage from a particular damage type.' },
  { term: 'Vulnerability',      aliases: [],       def: 'Taking double damage from a particular damage type.' },
  { term: 'Death Saving Throw', aliases: [],       def: 'A roll made each turn while unconscious at 0 HP to determine whether a character stabilizes or slips closer to death.' }
];

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

const DICT_PATTERNS = DND_GLOSSARY.map(entry => {
  const alts = [entry.term, ...(entry.aliases || [])]
    .map(escapeRegex)
    .sort((a, b) => b.length - a.length)
    .join('|');
  return { term: entry.term, regex: new RegExp('\\b(?:' + alts + ')\\b', 'gi') };
});

/* ══════════════════════════════
   STATE
══════════════════════════════ */
const state = {
  entries:        lsLoad(),
  highlights:     lsLoadHighlights(),
  role:           localStorage.getItem(ROLE_KEY) || 'player',
  termsOn:        localStorage.getItem(TERMS_KEY) !== 'off',
  activeType:     'chronicle',
  selectedMood:   '⚔ tense',
  spellSchool:    'evocation',
  spellLevel:     'cantrip',
  loreTier:       'realm',
  characterClass: 'fighter',
  readerSort:     'desc',
  recentFilter:   'all',
  grimoireQuery:  '',
  pendingDelete:  null,
  readerScrollTo: null,
  imageDataUrls:  [],
  editingId:      null,     // id of the entry being edited, or null for new entries
  openCharId:     null      // id of the character currently open in the Character Sheet modal
};

/* Tracks which form triggered the hidden file picker */
let _activePickForm = 'chronicle';

/* Tracks a pending highlight action (new selection or click on an existing mark) */
let _pendingHl = null;
let _suppressNextDocClick = false;

/* ══════════════════════════════
   LORE HIERARCHY
   Realm > Region > Location > Scenario. A Lore entry's
   "Parent" dropdown only offers entries at the tier directly
   above the one currently selected in the Tier pill-grid.
══════════════════════════════ */
const LORE_TIER_ORDER = ['realm', 'region', 'location', 'scenario'];

function populateLoreParentOptions(excludeId) {
  const sel = document.getElementById('lore-parent');
  if (!sel) return;
  const currentTier = state.loreTier;
  const idx = LORE_TIER_ORDER.indexOf(currentTier);
  sel.innerHTML = '';
  if (idx <= 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = '— top tier, no parent needed —';
    sel.appendChild(opt);
    sel.disabled = true;
    return;
  }
  sel.disabled = false;
  const parentTier = LORE_TIER_ORDER[idx - 1];
  const none = document.createElement('option');
  none.value = '';
  none.textContent = '— none —';
  sel.appendChild(none);
  state.entries
    .filter(e => e.type === 'lore' && e.tier === parentTier && e.id !== excludeId)
    .forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.id;
      opt.textContent = e.title || '(untitled)';
      sel.appendChild(opt);
    });
  if (sel.options.length === 1) {
    const hint = document.createElement('option');
    hint.value = '';
    hint.textContent = `(no ${parentTier} entries yet)`;
    hint.disabled = true;
    sel.appendChild(hint);
  }
}

/* ══════════════════════════════
   MOON PHASE
   Used purely as a decorative touch on the Reader's date-group
   headers — unrelated to the (removed) Sabbat calendar.
══════════════════════════════ */
function getMoonPhase(date) {
  const known = new Date('2000-01-06');
  const cycle = (((date - known) / 86400000) % 29.53 + 29.53) % 29.53;
  if (cycle < 1.85)  return '🌑';
  if (cycle < 7.38)  return '🌒';
  if (cycle < 9.22)  return '🌓';
  if (cycle < 14.77) return '🌔';
  if (cycle < 16.61) return '🌕';
  if (cycle < 22.15) return '🌖';
  if (cycle < 23.99) return '🌗';
  return '🌘';
}

/* ══════════════════════════════
   TYPE EMOJI MAP
══════════════════════════════ */
const TYPE_EMOJI = { chronicle: '📓', spell: '✦', lore: '🗺', character: '⚔' };

/* ══════════════════════════════
   DOM REFERENCES
══════════════════════════════ */
const btnReader        = document.getElementById('btn-reader');
const btnHighlights     = document.getElementById('btn-highlights');
const btnDictionary     = document.getElementById('btn-dictionary');
const btnRole           = document.getElementById('btn-role');
const btnExport         = document.getElementById('btn-export');
const btnImport         = document.getElementById('btn-import');
const importFileInput   = document.getElementById('import-file-input');
const storageStatus    = document.getElementById('storage-status');
const clockTime        = document.getElementById('clock-time');
const clockDate        = document.getElementById('clock-date');
const stampDay         = document.getElementById('stamp-day');
const stampDate        = document.getElementById('stamp-date');
const stampTime        = document.getElementById('stamp-time');
const moodGrid         = document.getElementById('mood-grid');
const emojiStrip       = document.getElementById('emoji-strip');
const btnSave          = document.getElementById('btn-save');
const btnClear         = document.getElementById('btn-clear');
const saveStatus       = document.getElementById('save-status');
const recentList       = document.getElementById('recent-list');
const recentCount      = document.getElementById('recent-count');
const footerCount      = document.getElementById('footer-count');
const footerRole       = document.getElementById('footer-role');
const recentFilters    = document.getElementById('recent-filters');
const grimoireSearch   = document.getElementById('grimoire-search');
const grimoireSearchClear = document.getElementById('grimoire-search-clear');
const grimoireSuggest  = document.getElementById('grimoire-suggest');
const overlayReader    = document.getElementById('overlay-reader');
const readerBody       = document.getElementById('reader-body');
const readerSearch     = document.getElementById('reader-search');
const readerFilterType = document.getElementById('reader-filter-type');
const readerFilterCat  = document.getElementById('reader-filter-cat');
const readerSort       = document.getElementById('reader-sort');
const readerTermsToggle = document.getElementById('reader-terms-toggle');
const readerSubtitle   = document.getElementById('reader-subtitle');
const readerClose      = document.getElementById('reader-close');
const overlayDelete    = document.getElementById('overlay-delete');
const deleteConfirm    = document.getElementById('delete-confirm');
const deleteCancel     = document.getElementById('delete-cancel');
const imgFileInput     = document.getElementById('img-file-input');

/* Character Sheet modal refs */
const overlayCharsheet   = document.getElementById('overlay-charsheet');
const csTitle            = document.getElementById('cs-title');
const csSubtitle         = document.getElementById('cs-subtitle');
const csClose            = document.getElementById('cs-close');
const csHpCurrent        = document.getElementById('cs-hp-current');
const csHpMax            = document.getElementById('cs-hp-max');
const csHpMinus          = document.getElementById('cs-hp-minus');
const csHpPlus           = document.getElementById('cs-hp-plus');
const csHpSet            = document.getElementById('cs-hp-set');
const csAbilityGrid      = document.getElementById('cs-ability-grid');
const csInventoryList    = document.getElementById('cs-inventory-list');
const csInventoryInput   = document.getElementById('cs-inventory-input');
const csInventoryAddBtn  = document.getElementById('cs-inventory-add-btn');
const csConditionsList   = document.getElementById('cs-conditions-list');
const csConditionInput   = document.getElementById('cs-condition-input');
const csConditionAddBtn  = document.getElementById('cs-condition-add-btn');
const csNotes            = document.getElementById('cs-notes');
const csNotesStatus      = document.getElementById('cs-notes-status');
const csBackgroundText   = document.getElementById('cs-background-text');
const csDmNotesText      = document.getElementById('cs-dmnotes-text');
const csDmNotesSection   = document.getElementById('cs-dmnotes-section');

/* My Highlights modal refs */
const overlayHighlights   = document.getElementById('overlay-highlights');
const highlightsSubtitle  = document.getElementById('highlights-subtitle');
const highlightsBody      = document.getElementById('highlights-body');
const highlightsClose     = document.getElementById('highlights-close');

/* Dictionary modal refs */
const overlayDictionary  = document.getElementById('overlay-dictionary');
const dictionarySubtitle = document.getElementById('dictionary-subtitle');
const dictionaryBody     = document.getElementById('dictionary-body');
const dictionarySearch   = document.getElementById('dictionary-search');
const dictionaryClose    = document.getElementById('dictionary-close');

/* DM auth modal refs */
const overlayDmauth  = document.getElementById('overlay-dmauth');
const dmauthTitle    = document.getElementById('dmauth-title');
const dmauthDesc     = document.getElementById('dmauth-desc');
const dmauthPass     = document.getElementById('dmauth-pass');
const dmauthPass2    = document.getElementById('dmauth-pass2');
const dmauthError    = document.getElementById('dmauth-error');
const dmauthForgot   = document.getElementById('dmauth-forgot');
const dmauthCancel   = document.getElementById('dmauth-cancel');
const dmauthSubmit   = document.getElementById('dmauth-submit');

/* Highlight palette + term popover (floating) */
const hlPalette       = document.getElementById('hl-palette');
const hlClearBtn      = document.getElementById('hl-clear-btn');
const termPopover     = document.getElementById('term-popover');
const termPopoverTerm = document.getElementById('term-popover-term');
const termPopoverDef  = document.getElementById('term-popover-def');
const termPopoverLive = document.getElementById('term-popover-live');

/* ══════════════════════════════
   LIVE CLOCK
══════════════════════════════ */
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

let _lastStampMinute = -1;

function tickClock() {
  const now = new Date();
  const hh  = String(now.getHours()).padStart(2,'0');
  const mm  = String(now.getMinutes()).padStart(2,'0');
  const ss  = String(now.getSeconds()).padStart(2,'0');
  clockTime.textContent = `${hh}:${mm}:${ss}`;
  clockDate.textContent = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  const cur = now.getHours() * 60 + now.getMinutes();
  if (cur !== _lastStampMinute) {
    _lastStampMinute = cur;
    stampDay.textContent  = DAYS[now.getDay()];
    stampDate.textContent = `${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    stampTime.textContent = `${hh}:${mm}`;
  }
}
setInterval(tickClock, 1000);
tickClock();

/* ══════════════════════════════
   STORAGE STATUS
══════════════════════════════ */
function updateStorageStatus() {
  const n  = state.entries.length;
  const kb = (new Blob([localStorage.getItem(LS_KEY)||'']).size / 1024).toFixed(1);
  storageStatus.textContent = `${n} entr${n !== 1 ? 'ies' : 'y'} · ${kb} KB`;
  storageStatus.classList.add('loaded');
}

/* ══════════════════════════════
   COMPOSER TYPE SWITCHING
══════════════════════════════ */
function switchType(type) {
  state.activeType = type;
  document.querySelectorAll('.type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === type));
  document.querySelectorAll('.entry-form').forEach(f => f.classList.add('hidden'));
  document.getElementById(`form-${type}`).classList.remove('hidden');
  if (type === 'lore') populateLoreParentOptions(state.editingId);
  checkSaveEnabled();
}

/* ══════════════════════════════
   PILL GRID HELPERS
══════════════════════════════ */
function activatePill(gridId, stateKey, val) {
  document.querySelectorAll(`#${gridId} .pill-btn, #${gridId} .mood-btn`).forEach(b => {
    b.classList.toggle('active', b.dataset.val === val || b.dataset.mood === val);
  });
  state[stateKey] = val;
}

/* ══════════════════════════════
   IMAGE UPLOAD
══════════════════════════════ */
const IMG_MAX_PX  = 800;
const IMG_QUALITY = 0.75;

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.onload  = evt => {
      const img = new Image();
      img.onerror = () => reject(new Error('Image decode failed'));
      img.onload  = () => {
        let { width, height } = img;
        if (width > IMG_MAX_PX || height > IMG_MAX_PX) {
          if (width >= height) { height = Math.round((height / width) * IMG_MAX_PX); width = IMG_MAX_PX; }
          else                 { width  = Math.round((width / height) * IMG_MAX_PX); height = IMG_MAX_PX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', IMG_QUALITY));
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function addImageUrl(url) {
  const trimmed = url.trim();
  if (!trimmed) return;
  if (!/^(https?:|data:)/.test(trimmed)) {
    alert('Please enter a valid image URL starting with http:// or https://');
    return;
  }
  state.imageDataUrls.push(trimmed);
  renderImagePreview();
}

function renderImagePreview() {
  const strip = document.getElementById(`img-preview-strip-${state.activeType}`);
  if (!strip) return;
  strip.innerHTML = '';
  state.imageDataUrls.forEach((src, i) => {
    const wrap      = document.createElement('div');
    wrap.className  = 'img-thumb-wrap';
    const img       = document.createElement('img');
    img.className   = 'img-thumb';
    img.src         = src;
    img.alt         = `Attached image ${i + 1}`;
    img.loading     = 'lazy';
    const removeBtn = document.createElement('button');
    removeBtn.className   = 'img-thumb-remove';
    removeBtn.type        = 'button';
    removeBtn.textContent = '×';
    removeBtn.title       = 'Remove image';
    removeBtn.addEventListener('click', () => { state.imageDataUrls.splice(i, 1); renderImagePreview(); });
    wrap.appendChild(img);
    wrap.appendChild(removeBtn);
    strip.appendChild(wrap);
  });
}

/* ══════════════════════════════
   BUILD ENTRY OBJECT
   images: always included — empty array if none attached.
══════════════════════════════ */
function buildEntry() {
  const now     = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const base    = { id: String(now.getTime()), date: dateStr, time: timeStr, timestamp: now.getTime(), type: state.activeType };
  const tags    = el => el.value.trim() ? el.value.split(',').map(t => t.trim()).filter(Boolean) : [];
  const images  = [...state.imageDataUrls];

  switch (state.activeType) {
    case 'chronicle': return { ...base,
      title:  document.getElementById('chronicle-title').value.trim(),
      body:   document.getElementById('chronicle-body').value.trim(),
      mood:   state.selectedMood,
      tags:   tags(document.getElementById('chronicle-tags')),
      pinned: document.getElementById('chronicle-pinned').checked,
      images
    };
    case 'spell': return { ...base,
      title:      document.getElementById('spell-title').value.trim(),
      school:     state.spellSchool,
      level:      state.spellLevel,
      components: document.getElementById('spell-components').value.trim(),
      effect:     document.getElementById('spell-effect').value.trim(),
      notes:      document.getElementById('spell-notes').value.trim(),
      tags:       tags(document.getElementById('spell-tags')),
      images
    };
    case 'lore': return { ...base,
      title:     document.getElementById('lore-title').value.trim(),
      tier:      state.loreTier,
      parentId:  document.getElementById('lore-parent').value,
      body:      document.getElementById('lore-body').value.trim(),
      notes:     document.getElementById('lore-notes').value.trim(),
      dmSecrets: document.getElementById('lore-dmsecrets').value.trim(),
      tags:      tags(document.getElementById('lore-tags')),
      images
    };
    case 'character': return { ...base,
      title:      document.getElementById('character-title').value.trim(),
      charClass:  state.characterClass,
      race:       document.getElementById('character-race').value.trim(),
      level:      document.getElementById('character-level').value.trim(),
      str: document.getElementById('character-str').value.trim(),
      dex: document.getElementById('character-dex').value.trim(),
      con: document.getElementById('character-con').value.trim(),
      int: document.getElementById('character-int').value.trim(),
      wis: document.getElementById('character-wis').value.trim(),
      cha: document.getElementById('character-cha').value.trim(),
      maxHp:      document.getElementById('character-maxhp').value.trim(),
      body:       document.getElementById('character-body').value.trim(),
      dmNotes:    document.getElementById('character-dmnotes').value.trim(),
      tags:       tags(document.getElementById('character-tags')),
      images
    };
  }
}

/* ══════════════════════════════
   SAVE ENTRY
   When state.editingId is set the existing entry is updated in-place,
   preserving its original id, date, time, and timestamp — and, for
   characters, preserving the live-sheet fields (hp/inventory/
   conditions/sheetNotes) that the composer never edits.
══════════════════════════════ */
function saveEntry() {
  const entry = buildEntry();
  if (!entry) return;

  if (state.editingId) {
    const original = state.entries.find(e => e.id === state.editingId);
    const updated  = {
      ...entry,
      id:        original ? original.id        : entry.id,
      date:      original ? original.date      : entry.date,
      time:      original ? original.time      : entry.time,
      timestamp: original ? original.timestamp : entry.timestamp
    };
    if (original && original.type === 'character' && entry.type === 'character') {
      updated.hp         = original.hp !== undefined ? original.hp : (parseInt(entry.maxHp, 10) || 0);
      updated.inventory  = original.inventory  || [];
      updated.conditions = original.conditions || [];
      updated.sheetNotes = original.sheetNotes || '';
    }
    state.entries  = state.entries.map(e => e.id === state.editingId ? updated : e);
    state.editingId = null;
    btnSave.innerHTML = '&#x1F4BE; Save to Grimoire';
    updateEditBanner(false);
  } else {
    if (entry.type === 'character') {
      entry.hp         = parseInt(entry.maxHp, 10) || 0;
      entry.inventory  = [];
      entry.conditions = [];
      entry.sheetNotes = '';
    }
    state.entries.push(entry);
  }

  lsSave(state.entries);
  saveStatus.textContent = '✓ Saved to Grimoire';
  saveStatus.classList.add('visible');
  setTimeout(() => saveStatus.classList.remove('visible'), 2200);

  clearComposer();
  renderRecentPanel();
  updateFooter();
  updateStorageStatus();
  populateCategoryFilter();
}

/* ══════════════════════════════
   CLEAR COMPOSER
══════════════════════════════ */
function clearComposer() {
  ['chronicle-title','chronicle-body','chronicle-tags'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  const jp = document.getElementById('chronicle-pinned'); if(jp) jp.checked = false;
  state.selectedMood = '⚔ tense';
  document.querySelectorAll('#mood-grid .mood-btn').forEach(b => b.classList.toggle('active', b.dataset.mood === state.selectedMood));

  ['spell-title','spell-components','spell-effect','spell-notes','spell-tags'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  activatePill('spell-school-grid','spellSchool','evocation');
  activatePill('spell-level-grid','spellLevel','cantrip');

  ['lore-title','lore-body','lore-notes','lore-dmsecrets','lore-tags'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  activatePill('lore-tier-grid','loreTier','realm');
  populateLoreParentOptions();

  ['character-title','character-race','character-level','character-str','character-dex','character-con','character-int','character-wis','character-cha','character-maxhp','character-body','character-dmnotes','character-tags'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  activatePill('character-class-grid','characterClass','fighter');

  document.querySelectorAll('.img-url-input').forEach(el => { el.value = ''; });

  state.imageDataUrls = [];
  ['chronicle','spell','lore','character'].forEach(type => {
    const strip = document.getElementById(`img-preview-strip-${type}`);
    if (strip) strip.innerHTML = '';
  });

  if (state.editingId) {
    state.editingId = null;
    btnSave.innerHTML = '&#x1F4BE; Save to Grimoire';
    updateEditBanner(false);
  }

  checkSaveEnabled();
}

/* ══════════════════════════════
   EDIT BANNER
══════════════════════════════ */
function updateEditBanner(visible, title) {
  let banner = document.getElementById('composer-edit-banner');

  if (!visible) {
    if (banner) banner.style.display = 'none';
    return;
  }

  if (!banner) {
    banner = document.createElement('div');
    banner.id        = 'composer-edit-banner';
    banner.className = 'composer-edit-banner';
    const actionsBar = document.querySelector('.composer-actions');
    actionsBar.parentNode.insertBefore(banner, actionsBar);
  }

  banner.style.display = 'flex';
  banner.innerHTML = `
    <span class="edit-banner-label">&#x270F;&#xFE0F; Editing: <em>${escapeHtml(title || 'Entry')}</em></span>
    <button class="edit-banner-cancel" id="edit-banner-cancel-btn" type="button">&#x2715; Cancel Edit</button>
  `;
  document.getElementById('edit-banner-cancel-btn').addEventListener('click', cancelEdit);
}

/* ══════════════════════════════
   CANCEL EDIT
══════════════════════════════ */
function cancelEdit() {
  clearComposer();
}

/* ══════════════════════════════
   EDIT ENTRY
══════════════════════════════ */
function editEntry(id) {
  const entry = state.entries.find(e => e.id === id);
  if (!entry) return;

  overlayReader.style.display = 'none';
  state.readerScrollTo = null;

  switchType(entry.type);
  clearComposer();

  switch (entry.type) {

    case 'chronicle': {
      const titleEl = document.getElementById('chronicle-title');
      const bodyEl  = document.getElementById('chronicle-body');
      const tagsEl  = document.getElementById('chronicle-tags');
      const pinEl   = document.getElementById('chronicle-pinned');
      if (titleEl) titleEl.value = entry.title  || '';
      if (bodyEl)  bodyEl.value  = entry.body   || '';
      if (tagsEl)  tagsEl.value  = (entry.tags  || []).join(', ');
      if (pinEl)   pinEl.checked = !!entry.pinned;
      if (entry.mood) {
        state.selectedMood = entry.mood;
        document.querySelectorAll('#mood-grid .mood-btn').forEach(b =>
          b.classList.toggle('active', b.dataset.mood === entry.mood));
      }
      break;
    }

    case 'spell': {
      const t = document.getElementById('spell-title');
      const g = document.getElementById('spell-components');
      const n = document.getElementById('spell-effect');
      const o = document.getElementById('spell-notes');
      const a = document.getElementById('spell-tags');
      if (t) t.value = entry.title      || '';
      if (g) g.value = entry.components || '';
      if (n) n.value = entry.effect     || '';
      if (o) o.value = entry.notes      || '';
      if (a) a.value = (entry.tags      || []).join(', ');
      if (entry.school) activatePill('spell-school-grid', 'spellSchool', entry.school);
      if (entry.level)  activatePill('spell-level-grid',  'spellLevel',  entry.level);
      break;
    }

    case 'lore': {
      const t  = document.getElementById('lore-title');
      const b  = document.getElementById('lore-body');
      const n  = document.getElementById('lore-notes');
      const ds = document.getElementById('lore-dmsecrets');
      const a  = document.getElementById('lore-tags');
      if (t)  t.value  = entry.title     || '';
      if (b)  b.value  = entry.body      || '';
      if (n)  n.value  = entry.notes     || '';
      if (ds) ds.value = entry.dmSecrets || '';
      if (a)  a.value  = (entry.tags     || []).join(', ');
      if (entry.tier) activatePill('lore-tier-grid', 'loreTier', entry.tier);
      populateLoreParentOptions(entry.id);
      const p = document.getElementById('lore-parent');
      if (p && entry.parentId) p.value = entry.parentId;
      break;
    }

    case 'character': {
      const t  = document.getElementById('character-title');
      const r  = document.getElementById('character-race');
      const lv = document.getElementById('character-level');
      const mh = document.getElementById('character-maxhp');
      const b  = document.getElementById('character-body');
      const dn = document.getElementById('character-dmnotes');
      const a  = document.getElementById('character-tags');
      if (t)  t.value  = entry.title  || '';
      if (r)  r.value  = entry.race   || '';
      if (lv) lv.value = entry.level  || '';
      if (mh) mh.value = entry.maxHp  || '';
      if (b)  b.value  = entry.body   || '';
      if (dn) dn.value = entry.dmNotes || '';
      if (a)  a.value  = (entry.tags  || []).join(', ');
      ['str','dex','con','int','wis','cha'].forEach(k => {
        const el = document.getElementById('character-' + k);
        if (el) el.value = entry[k] || '';
      });
      if (entry.charClass) activatePill('character-class-grid', 'characterClass', entry.charClass);
      break;
    }
  }

  if (entry.images && entry.images.length) {
    state.imageDataUrls = [...entry.images];
    renderImagePreview();
  }

  state.editingId = id;
  const entryTitle = entry.title || getDefaultTitle(entry);
  btnSave.innerHTML = '&#x270F;&#xFE0F; Update Entry';
  updateEditBanner(true, entryTitle);
  checkSaveEnabled();

  const composer = document.getElementById('composer');
  if (composer) composer.scrollTop = 0;
}

/* ══════════════════════════════
   SAVE BUTTON GATE
══════════════════════════════ */
function checkSaveEnabled() {
  let ok = false;
  switch (state.activeType) {
    case 'chronicle': ok = !!(document.getElementById('chronicle-title')?.value.trim() || document.getElementById('chronicle-body')?.value.trim()); break;
    case 'spell':     ok = !!(document.getElementById('spell-title')?.value.trim() || document.getElementById('spell-notes')?.value.trim()); break;
    case 'lore':      ok = !!(document.getElementById('lore-title')?.value.trim() || document.getElementById('lore-body')?.value.trim()); break;
    case 'character': ok = !!document.getElementById('character-title')?.value.trim(); break;
  }
  btnSave.disabled = !ok;
}

/* ══════════════════════════════
   EMOJI INSERT (chronicle body)
══════════════════════════════ */
function insertEmoji(emoji) {
  const ta = document.getElementById('chronicle-body');
  if (!ta) return;
  const s = ta.selectionStart, e = ta.selectionEnd;
  ta.value = ta.value.slice(0,s) + emoji + ta.value.slice(e);
  ta.selectionStart = ta.selectionEnd = s + emoji.length;
  ta.focus();
}

/* ══════════════════════════════
   RECENT PANEL
══════════════════════════════ */
function renderRecentPanel() {
  recentList.innerHTML = '';
  let entries = [...state.entries];
  if (state.recentFilter !== 'all') entries = entries.filter(e => e.type === state.recentFilter);
  if (state.grimoireQuery) {
    const q = state.grimoireQuery.toLowerCase();
    entries = entries.filter(e => getSearchHay(e).includes(q));
  }

  if (!entries.length) {
    const emptyMsg = state.grimoireQuery
      ? 'No entries match your search.'
      : 'Nothing here yet.<br/>Begin your first entry above.';
    recentList.innerHTML = `<div class="recent-empty">${emptyMsg}</div>`;
    recentCount.textContent = state.grimoireQuery ? '0 results' : '0 entries';
    return;
  }

  const sorted = entries
    .sort((a,b) => { if(a.pinned&&!b.pinned) return -1; if(!a.pinned&&b.pinned) return 1; return b.timestamp-a.timestamp; })
    .slice(0, 30);

  recentCount.textContent = `${entries.length} entr${entries.length!==1?'ies':'y'}`;

  sorted.forEach(entry => {
    const card = document.createElement('div');
    card.className    = `recent-card${entry.pinned?' pinned':''}`;
    card.dataset.id   = entry.id;
    card.dataset.type = entry.type;
    const typeEmoji = TYPE_EMOJI[entry.type] || '📝';
    const badge     = getBadge(entry);
    const blurb     = getBlurb(entry);
    const tagsHtml  = (entry.tags||[]).map(t=>`<span class="tag-pill">${escapeHtml(t)}</span>`).join('');
    card.innerHTML = `
      <div class="recent-card-meta">
        <span class="recent-card-type">${typeEmoji}</span>
        <span class="recent-card-date">${entry.date}</span>
        <span class="recent-card-time">${entry.time}</span>
        ${badge?`<span class="recent-card-badge">${escapeHtml(badge)}</span>`:''}
      </div>
      <div class="recent-card-title">${escapeHtml(entry.title||getDefaultTitle(entry))}</div>
      <div class="recent-card-blurb">${escapeHtml(blurb)}</div>
      ${tagsHtml?`<div class="recent-card-tags">${tagsHtml}</div>`:''}
    `;
    card.addEventListener('click', () => openEntry(entry.id));
    recentList.appendChild(card);
  });
}

function getBadge(e) {
  if (e.type==='chronicle') return e.mood||'';
  if (e.type==='spell')     return e.school||'';
  if (e.type==='lore')      return e.tier||'';
  if (e.type==='character') return e.charClass||'';
  return '';
}

function getBlurb(e) {
  if (e.type==='chronicle') return e.body||'';
  if (e.type==='spell')     return e.effect||e.notes||'';
  if (e.type==='lore')      return e.body||e.notes||'';
  if (e.type==='character') return e.body||'';
  return '';
}

function getDefaultTitle(e) {
  if (e.type==='spell')     return `${e.school} Spell`;
  if (e.type==='lore')      return `${e.tier} — Untitled`;
  if (e.type==='character') return e.charClass||'Untitled';
  return 'Untitled';
}

function updateFooter() {
  const n = state.entries.length;
  footerCount.textContent = `${n} entr${n!==1?'ies':'y'}`;
}

/* ══════════════════════════════
   GRIMOIRE SEARCH + AUTOSUGGEST
   DM-only fields (dmNotes/dmSecrets) are deliberately excluded from
   the search haystack so they never surface in search snippets.
══════════════════════════════ */
function getSearchHay(e) {
  return [
    e.title, e.body, e.notes, e.effect, e.components,
    e.race, e.mood, e.school, e.charClass, e.tier,
    ...(e.tags||[])
  ].filter(Boolean).join(' ').toLowerCase();
}

function highlightMatch(text, query) {
  if (!query || !text) return escapeHtml(text||'');
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return escapeHtml(text);
  return escapeHtml(text.slice(0, idx))
    + '<mark>' + escapeHtml(text.slice(idx, idx + query.length)) + '</mark>'
    + escapeHtml(text.slice(idx + query.length));
}

function matchingTags(entry, query) {
  if (!query) return [];
  return (entry.tags||[]).filter(t => t.toLowerCase().includes(query.toLowerCase()));
}

let _suggestIndex = -1;

function openGrimoireSearch(query) {
  state.grimoireQuery = query;
  grimoireSearchClear.style.display = query ? 'block' : 'none';
  grimoireSearch.classList.toggle('has-value', !!query);
  renderRecentPanel();
  renderSuggestions(query);
}

function clearGrimoireSearch() {
  state.grimoireQuery = '';
  grimoireSearch.value = '';
  grimoireSearchClear.style.display = 'none';
  grimoireSearch.classList.remove('has-value');
  grimoireSuggest.style.display = 'none';
  _suggestIndex = -1;
  renderRecentPanel();
}

function renderSuggestions(query) {
  grimoireSuggest.innerHTML = '';
  _suggestIndex = -1;

  if (!query || query.length < 1) { grimoireSuggest.style.display = 'none'; return; }

  const q = query.toLowerCase();
  const matches = state.entries
    .filter(e => getSearchHay(e).includes(q))
    .sort((a, b) => {
      const aTitle = (a.title||getDefaultTitle(a)).toLowerCase().includes(q);
      const bTitle = (b.title||getDefaultTitle(b)).toLowerCase().includes(q);
      if (aTitle && !bTitle) return -1;
      if (!aTitle && bTitle) return  1;
      return b.timestamp - a.timestamp;
    })
    .slice(0, 8);

  if (!matches.length) {
    grimoireSuggest.innerHTML = '<div class="suggest-empty">Nothing found in the Grimoire.</div>';
    grimoireSuggest.style.display = 'block';
    return;
  }

  matches.forEach(entry => {
    const item    = document.createElement('div');
    item.className = 'suggest-item';
    const title   = entry.title || getDefaultTitle(entry);
    const mTags   = matchingTags(entry, query);
    item.innerHTML = `
      <span class="suggest-icon">${TYPE_EMOJI[entry.type] || '📝'}</span>
      <span class="suggest-text">
        <span class="suggest-title">${highlightMatch(title, query)}</span>
        <span class="suggest-meta">${entry.date} ${entry.time}${getBadge(entry) ? ' · ' + escapeHtml(getBadge(entry)) : ''}</span>
        ${mTags.length ? `<span class="suggest-tags">${mTags.map(t=>`<span class="suggest-tag">${highlightMatch(t,query)}</span>`).join('')}</span>` : ''}
      </span>
    `;
    item.addEventListener('mousedown', e => {
      e.preventDefault();
      closeSuggestions();
      openEntry(entry.id);
    });
    grimoireSuggest.appendChild(item);
  });

  grimoireSuggest.style.display = 'block';
}

function closeSuggestions() {
  grimoireSuggest.style.display = 'none';
  _suggestIndex = -1;
}

function moveSuggestCursor(dir) {
  const items = grimoireSuggest.querySelectorAll('.suggest-item');
  if (!items.length) return;
  items[_suggestIndex]?.classList.remove('active');
  _suggestIndex = (_suggestIndex + dir + items.length) % items.length;
  const active = items[_suggestIndex];
  active.classList.add('active');
  active.scrollIntoView({ block: 'nearest' });
}

function selectSuggestCursor() {
  const active = grimoireSuggest.querySelector('.suggest-item.active');
  if (active) active.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
}

/* ══════════════════════════════
   OPEN ENTRY ROUTER
   Characters open the Character Sheet; everything else opens the
   Reader scrolled to that entry.
══════════════════════════════ */
function openEntry(id) {
  const entry = state.entries.find(e => e.id === id);
  if (!entry) return;
  if (entry.type === 'character') openCharacterSheet(id);
  else openReader(id);
}

/* ══════════════════════════════
   READER
══════════════════════════════ */
function openReader(scrollToId = null) {
  state.readerScrollTo = scrollToId;
  overlayReader.style.display = 'flex';
  renderReader();
}

function renderReader() {
  const search     = readerSearch.value.toLowerCase().trim();
  const typeFilter = readerFilterType.value;
  const catFilter  = readerFilterCat.value;

  let entries = [...state.entries];
  if (typeFilter) entries = entries.filter(e => e.type === typeFilter);
  if (catFilter)  entries = entries.filter(e => (e.category||e.subtype||e.tier||e.school||e.charClass||'') === catFilter);
  if (search) entries = entries.filter(e => getSearchHay(e).includes(search));

  entries.sort((a,b) => state.readerSort==='desc' ? b.timestamp-a.timestamp : a.timestamp-b.timestamp);

  readerSubtitle.textContent = (search||typeFilter||catFilter)
    ? `${entries.length} result${entries.length!==1?'s':''}`
    : `${state.entries.length} entr${state.entries.length!==1?'ies':'y'}`;

  readerBody.innerHTML = '';
  if (!entries.length) { readerBody.innerHTML = '<div class="reader-empty">Nothing found in the Book.</div>'; return; }

  const groupMap = new Map();
  entries.forEach(e => { if(!groupMap.has(e.date)) groupMap.set(e.date,[]); groupMap.get(e.date).push(e); });

  [...groupMap.keys()]
    .sort((a,b) => state.readerSort==='desc' ? b.localeCompare(a) : a.localeCompare(b))
    .forEach(date => {
      const d   = new Date(date+'T00:00:00');
      const grp = document.createElement('div');
      grp.className = 'reader-date-group';
      grp.innerHTML = `<span class="reader-date-group-label">${getMoonPhase(d)} ${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}</span><div class="reader-date-group-line"></div>`;
      readerBody.appendChild(grp);
      groupMap.get(date).forEach(entry => readerBody.appendChild(buildReaderEntry(entry)));
    });

  if (state.readerScrollTo) {
    const target = readerBody.querySelector(`[data-entry-id="${state.readerScrollTo}"]`);
    if (target) setTimeout(() => target.scrollIntoView({behavior:'smooth',block:'start'}), 80);
  }
}

/* ══════════════════════════════
   BUILD READER ENTRY
   Highlight- and dictionary-enabled fields are wrapped in a
   .hl-field container with data-entry-id/data-field so the
   highlighter's selection handler can locate them.
══════════════════════════════ */
function buildReaderEntry(entry) {
  const el = document.createElement('div');
  el.className       = `reader-entry${entry.pinned?' pinned':''}`;
  el.dataset.entryId = entry.id;
  el.dataset.type    = entry.type;

  const typeLabel = {chronicle:'📓 Chronicle',spell:'✦ Spell',lore:'🗺 Lore',character:'⚔ Character'}[entry.type]||entry.type;
  const badge     = getBadge(entry);
  const tagsHtml  = (entry.tags||[]).map(t=>`<span class="tag-pill">${escapeHtml(t)}</span>`).join('');
  const title     = entry.title||getDefaultTitle(entry);

  const imagesHtml = (entry.images && entry.images.length)
    ? `<div class="reader-entry-images">${entry.images.map((src,i) =>
        `<img class="reader-entry-img" src="${escapeHtml(src)}" alt="Attached image ${i+1}" loading="lazy"/>`
      ).join('')}</div>`
    : '';

  const hf = (field, text) => `<div class="hl-field" data-entry-id="${entry.id}" data-field="${field}">${renderFieldWithMarks(entry.id, field, text || '')}</div>`;

  let bodyHtml = '';
  switch (entry.type) {
    case 'chronicle': {
      bodyHtml = entry.body ? `<div class="reader-entry-body">${hf('body', entry.body)}</div>` : '';
      break;
    }
    case 'spell': {
      bodyHtml = `<div class="reader-fields">
        ${entry.components ? `<div class="reader-field-block"><div class="reader-field-label">Casting Time, Range &amp; Components</div><div class="reader-field-value">${hf('components', entry.components)}</div></div>` : ''}
        ${entry.effect      ? `<div class="reader-field-block"><div class="reader-field-label">Duration &amp; Classes</div><div class="reader-field-value">${hf('effect', entry.effect)}</div></div>` : ''}
        ${entry.notes       ? `<div class="reader-field-block"><div class="reader-field-label">Description &amp; Effect</div><div class="reader-field-value">${hf('notes', entry.notes)}</div></div>` : ''}
      </div>`;
      break;
    }
    case 'lore': {
      const parent = entry.parentId ? (state.entries.find(e => e.id === entry.parentId)) : null;
      bodyHtml = `<div class="reader-fields">
        ${parent ? `<div class="reader-field-block"><div class="reader-field-label">Parent</div><div class="reader-field-value">${escapeHtml(parent.title||'')}</div></div>` : ''}
        ${entry.body  ? `<div class="reader-field-block"><div class="reader-field-label">Description</div><div class="reader-field-value">${hf('body', entry.body)}</div></div>` : ''}
        ${entry.notes ? `<div class="reader-field-block"><div class="reader-field-label">Notes</div><div class="reader-field-value">${hf('notes', entry.notes)}</div></div>` : ''}
        ${(state.role === 'dm' && entry.dmSecrets) ? `<div class="reader-field-block dm-field"><div class="reader-field-label">&#x1F511; DM Secrets</div><div class="reader-field-value">${hf('dmSecrets', entry.dmSecrets)}</div></div>` : ''}
      </div>`;
      break;
    }
    case 'character': {
      const stats = ['str','dex','con','int','wis','cha']
        .map(k => entry[k] ? `<span class="tag-pill">${k.toUpperCase()} ${escapeHtml(entry[k])}</span>` : '').join('');
      bodyHtml = `
        <div class="reader-fields">
          ${entry.race  ? `<div class="reader-field-block"><div class="reader-field-label">Race</div><div class="reader-field-value">${escapeHtml(entry.race)}</div></div>` : ''}
          ${entry.level ? `<div class="reader-field-block"><div class="reader-field-label">Level</div><div class="reader-field-value">${escapeHtml(entry.level)}</div></div>` : ''}
          ${stats ? `<div class="reader-field-block"><div class="reader-field-label">Ability Scores</div><div class="reader-entry-tags">${stats}</div></div>` : ''}
          ${entry.maxHp ? `<div class="reader-field-block"><div class="reader-field-label">Hit Points</div><div class="reader-field-value">${escapeHtml(String(entry.hp !== undefined ? entry.hp : entry.maxHp))} / ${escapeHtml(String(entry.maxHp))}</div></div>` : ''}
          ${(state.role === 'dm' && entry.dmNotes) ? `<div class="reader-field-block dm-field"><div class="reader-field-label">&#x1F511; DM Notes</div><div class="reader-field-value">${hf('dmNotes', entry.dmNotes)}</div></div>` : ''}
        </div>
        ${entry.body ? `<div class="reader-entry-body" style="margin-top:8px">${hf('body', entry.body)}</div>` : ''}
      `;
      break;
    }
  }

  el.innerHTML = `
    <div class="reader-entry-meta">
      <span class="reader-entry-type-badge">${typeLabel}</span>
      <span class="reader-entry-time">${entry.time}</span>
      ${badge?`<span class="reader-entry-badge">${escapeHtml(badge)}</span>`:''}
      <div class="reader-entry-tags">${tagsHtml}</div>
      <div class="reader-entry-actions">
        ${entry.type === 'character' ? `<button class="entry-action-btn entry-action-btn--sheet" data-action="sheet" data-id="${entry.id}">&#x1F4CB; Sheet</button>` : ''}
        <button class="entry-action-btn entry-action-btn--edit"   data-action="edit"   data-id="${entry.id}">&#x270F;&#xFE0F; Edit</button>
        <button class="entry-action-btn entry-action-btn--delete" data-action="delete" data-id="${entry.id}">&#x1F5D1; Delete</button>
      </div>
    </div>
    <div class="reader-entry-title">${escapeHtml(title)}</div>
    ${imagesHtml}
    ${bodyHtml}
  `;

  el.querySelector('[data-action="edit"]').addEventListener('click', ev => {
    ev.stopPropagation();
    editEntry(entry.id);
  });

  el.querySelector('[data-action="delete"]').addEventListener('click', ev => {
    ev.stopPropagation();
    state.pendingDelete = entry.id;
    overlayDelete.style.display = 'flex';
  });

  const sheetBtn = el.querySelector('[data-action="sheet"]');
  if (sheetBtn) sheetBtn.addEventListener('click', ev => {
    ev.stopPropagation();
    openCharacterSheet(entry.id);
  });

  return el;
}

/* ══════════════════════════════
   CATEGORY FILTER
══════════════════════════════ */
function populateCategoryFilter() {
  const typeFilter = readerFilterType.value;
  const cats = [...new Set(
    state.entries
      .filter(e => !typeFilter || e.type === typeFilter)
      .map(e => e.school||e.charClass||e.tier)
      .filter(Boolean)
  )].sort();
  readerFilterCat.innerHTML = '<option value="">All categories</option>';
  cats.forEach(c => { const o=document.createElement('option'); o.value=c; o.textContent=c; readerFilterCat.appendChild(o); });
}

/* ══════════════════════════════
   DELETE
══════════════════════════════ */
function deleteEntry(id) {
  if (state.editingId === id) {
    state.editingId = null;
    btnSave.innerHTML = '&#x1F4BE; Save to Grimoire';
    updateEditBanner(false);
    clearComposer();
  }
  state.entries = state.entries.filter(e=>e.id!==id);
  state.highlights = state.highlights.filter(h=>h.entryId!==id);
  lsSave(state.entries);
  lsSaveHighlights(state.highlights);
  renderRecentPanel(); updateFooter(); updateStorageStatus(); populateCategoryFilter();
  if (overlayReader.style.display!=='none') renderReader();
}

/* ══════════════════════════════
   UTILITIES
══════════════════════════════ */
function escapeHtml(text) {
  const d=document.createElement('div'); d.textContent=String(text||''); return d.innerHTML;
}

/* ══════════════════════════════
   DICTIONARY TERM MATCHING
   Finds non-overlapping glossary-term matches in raw text, longest
   match preferred where terms would otherwise overlap.
══════════════════════════════ */
function buildTermMatches(text) {
  const matches = [];
  DICT_PATTERNS.forEach(p => {
    p.regex.lastIndex = 0;
    let m;
    while ((m = p.regex.exec(text))) {
      matches.push({ start: m.index, end: m.index + m[0].length, term: p.term });
      if (m[0].length === 0) p.regex.lastIndex++;
    }
  });
  matches.sort((a,b) => (b.end-b.start)-(a.end-a.start) || a.start-b.start);
  const kept = [];
  matches.forEach(m => {
    if (kept.some(k => m.start < k.end && m.end > k.start)) return;
    kept.push(m);
  });
  kept.sort((a,b) => a.start-b.start);
  return kept;
}

/* ══════════════════════════════
   HIGHLIGHT + TERM RENDERING
   Merges this field's highlights (filtered to the current role) and
   glossary term matches into a single sorted, non-overlapping list.
   A highlight always wins over an overlapping term match.
══════════════════════════════ */
function renderFieldWithMarks(entryId, field, rawText) {
  if (!rawText) return '';
  const hls = state.highlights.filter(h => h.entryId === entryId && h.field === field && h.ownerRole === state.role);
  const ranges = hls.map(h => ({ start: h.start, end: h.end, type: 'hl', color: h.color, id: h.id }));

  if (state.termsOn) {
    buildTermMatches(rawText).forEach(t => {
      const overlaps = ranges.some(r => t.start < r.end && t.end > r.start);
      if (!overlaps) ranges.push({ start: t.start, end: t.end, type: 'term', term: t.term });
    });
  }

  ranges.sort((a,b) => a.start - b.start);

  let html = '', pos = 0;
  ranges.forEach(r => {
    if (r.start < pos || r.end > rawText.length) return;
    html += escapeHtml(rawText.slice(pos, r.start));
    const seg = escapeHtml(rawText.slice(r.start, r.end));
    if (r.type === 'hl') html += `<mark class="hl-mark" data-color="${r.color}" data-hl-id="${r.id}">${seg}</mark>`;
    else                 html += `<span class="dict-term" data-term="${escapeHtml(r.term)}">${seg}</span>`;
    pos = r.end;
  });
  html += escapeHtml(rawText.slice(pos));
  return html;
}

/* ══════════════════════════════
   HIGHLIGHTER — SELECTION HANDLING
══════════════════════════════ */
function getTextOffset(root, node, offset) {
  let total = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    if (n === node) return total + offset;
    total += n.textContent.length;
  }
  return total;
}

function handleHlMouseUp() {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  const container = range.commonAncestorContainer.nodeType === 3
    ? range.commonAncestorContainer.parentElement
    : range.commonAncestorContainer;
  const fieldEl = container ? container.closest('.hl-field') : null;
  if (!fieldEl) return;
  const entryId = fieldEl.dataset.entryId;
  const field   = fieldEl.dataset.field;
  if (!entryId || !field) return;

  const start = getTextOffset(fieldEl, range.startContainer, range.startOffset);
  const end   = getTextOffset(fieldEl, range.endContainer, range.endOffset);
  if (end <= start) return;

  const rect = range.getBoundingClientRect();
  _pendingHl = { entryId, field, start, end, existingId: null };
  positionHlPalette(rect);
  hlClearBtn.style.display = 'none';
  _suppressNextDocClick = true;
}

function openHlPaletteForMark(mark) {
  const fieldEl = mark.closest('.hl-field');
  if (!fieldEl) return;
  _pendingHl = {
    entryId: fieldEl.dataset.entryId,
    field:   fieldEl.dataset.field,
    existingId: mark.dataset.hlId
  };
  positionHlPalette(mark.getBoundingClientRect());
  hlClearBtn.style.display = 'flex';
}

function positionHlPalette(rect) {
  hlPalette.style.display = 'flex';
  const top  = Math.max(8, rect.top - 42);
  const left = Math.min(Math.max(8, rect.left), window.innerWidth - 180);
  hlPalette.style.top  = `${top + window.scrollY}px`;
  hlPalette.style.left = `${left + window.scrollX}px`;
}

function hideHlPalette() {
  hlPalette.style.display = 'none';
  _pendingHl = null;
}

function addOrUpdateHighlight(color) {
  if (!_pendingHl) return;
  if (_pendingHl.existingId) {
    const h = state.highlights.find(x => x.id === _pendingHl.existingId);
    if (h) h.color = color;
  } else {
    const { entryId, field, start, end } = _pendingHl;
    // A new highlight overlapping an existing one of the same role/field/entry replaces it.
    state.highlights = state.highlights.filter(h =>
      !(h.entryId === entryId && h.field === field && h.ownerRole === state.role && start < h.end && end > h.start)
    );
    state.highlights.push({
      id: 'hl' + Date.now() + Math.random().toString(36).slice(2,6),
      entryId, field, start, end, color,
      ownerRole: state.role,
      createdAt: Date.now()
    });
  }
  lsSaveHighlights(state.highlights);
  hideHlPalette();
  refreshOpenViews();
}

function removeHighlightAction() {
  if (_pendingHl && _pendingHl.existingId) {
    state.highlights = state.highlights.filter(h => h.id !== _pendingHl.existingId);
    lsSaveHighlights(state.highlights);
  }
  hideHlPalette();
  refreshOpenViews();
}

function refreshOpenViews() {
  if (overlayReader.style.display !== 'none') renderReader();
  if (overlayCharsheet.style.display !== 'none' && state.openCharId) renderCharacterSheet(state.openCharId);
}

/* ══════════════════════════════
   MY HIGHLIGHTS PANEL
══════════════════════════════ */
function openHighlights() {
  overlayHighlights.style.display = 'flex';
  renderHighlightsList();
}

function renderHighlightsList() {
  const list = state.highlights.filter(h => h.ownerRole === state.role).sort((a,b) => b.createdAt - a.createdAt);
  highlightsSubtitle.textContent = `${list.length} highlight${list.length!==1?'s':''}`;
  highlightsBody.innerHTML = '';

  if (!list.length) {
    highlightsBody.innerHTML = '<div class="reader-empty">No highlights yet. Select text in the Reader or a Character Sheet to highlight it.</div>';
    return;
  }

  list.forEach(h => {
    const entry = state.entries.find(e => e.id === h.entryId);
    if (!entry) return; // orphaned highlight — its entry was deleted
    const text = entry[h.field] || '';
    const ctxStart = Math.max(0, h.start - 30);
    const ctxEnd   = Math.min(text.length, h.end + 30);
    const before   = escapeHtml(text.slice(ctxStart, h.start));
    const mid      = escapeHtml(text.slice(h.start, h.end));
    const after    = escapeHtml(text.slice(h.end, ctxEnd));

    const item = document.createElement('div');
    item.className = 'myhl-item';
    item.innerHTML = `
      <div class="myhl-item-meta"><span>${TYPE_EMOJI[entry.type]||'📝'} ${escapeHtml(entry.title||getDefaultTitle(entry))}</span><span>&middot;</span><span>${new Date(h.createdAt).toLocaleDateString()}</span></div>
      <div class="myhl-item-snippet">${ctxStart>0?'&hellip;':''}${before}<mark class="hl-mark" data-color="${h.color}">${mid}</mark>${after}${ctxEnd<text.length?'&hellip;':''}</div>
      <div class="myhl-item-actions">
        <button class="entry-action-btn" data-action="jump">&#x21A9; Jump to entry</button>
        <button class="entry-action-btn" data-action="remove">&#x1F5D1; Remove</button>
      </div>
    `;
    item.querySelector('[data-action="jump"]').addEventListener('click', () => {
      overlayHighlights.style.display = 'none';
      jumpToHighlight(h);
    });
    item.querySelector('[data-action="remove"]').addEventListener('click', () => {
      state.highlights = state.highlights.filter(x => x.id !== h.id);
      lsSaveHighlights(state.highlights);
      renderHighlightsList();
      refreshOpenViews();
    });
    highlightsBody.appendChild(item);
  });
}

function jumpToHighlight(h) {
  const entry = state.entries.find(e => e.id === h.entryId);
  if (!entry) return;
  if (entry.type === 'character') openCharacterSheet(entry.id);
  else openReader(entry.id);
  setTimeout(() => flashHighlightInDom(h), 150);
}

function flashHighlightInDom(h) {
  const el = document.querySelector(`.hl-field[data-entry-id="${h.entryId}"][data-field="${h.field}"] .hl-mark[data-hl-id="${h.id}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('hl-flash');
  setTimeout(() => el.classList.remove('hl-flash'), 1200);
}

/* ══════════════════════════════
   DICTIONARY — POPOVER + BROWSE MODAL
══════════════════════════════ */
const ABILITY_KEY_MAP = { Strength:'str', Dexterity:'dex', Constitution:'con', Intelligence:'int', Wisdom:'wis', Charisma:'cha' };

function showTermPopover(termEl) {
  const term = termEl.dataset.term;
  const entry = DND_GLOSSARY.find(e => e.term === term);
  if (!entry) return;

  termPopoverTerm.textContent = entry.term;
  termPopoverDef.textContent  = entry.def;
  termPopoverLive.innerHTML   = '';

  if (ABILITY_KEY_MAP[entry.term]) {
    const key = ABILITY_KEY_MAP[entry.term];
    const chars = state.entries.filter(e => e.type === 'character' && e[key]);
    if (chars.length) termPopoverLive.textContent = 'Live values: ' + chars.map(c => `${c.title||'Unnamed'} (${key.toUpperCase()} ${c[key]})`).join(', ');
  } else if (entry.term === 'Hit Points') {
    const chars = state.entries.filter(e => e.type === 'character' && e.maxHp);
    if (chars.length) termPopoverLive.textContent = 'Live values: ' + chars.map(c => `${c.title||'Unnamed'} (${c.hp!==undefined?c.hp:'?'} / ${c.maxHp})`).join(', ');
  }

  const rect = termEl.getBoundingClientRect();
  termPopover.style.display = 'block';
  const left = Math.min(rect.left, window.innerWidth - 300);
  termPopover.style.left = `${Math.max(8,left) + window.scrollX}px`;
  termPopover.style.top  = `${rect.bottom + 6 + window.scrollY}px`;
}

function hideTermPopover() {
  termPopover.style.display = 'none';
}

function openDictionary() {
  overlayDictionary.style.display = 'flex';
  dictionarySearch.value = '';
  renderDictionaryList('');
  dictionarySearch.focus();
}

function renderDictionaryList(query) {
  const q = query.toLowerCase();
  const list = DND_GLOSSARY.filter(e => !q || e.term.toLowerCase().includes(q) || e.def.toLowerCase().includes(q));
  dictionarySubtitle.textContent = `${list.length} term${list.length!==1?'s':''}`;
  dictionaryBody.innerHTML = list.length
    ? list.map(e => `<div class="dict-entry"><div class="dict-entry-term">${escapeHtml(e.term)}</div><div class="dict-entry-def">${escapeHtml(e.def)}</div></div>`).join('')
    : '<div class="reader-empty">No terms match.</div>';
}

/* ══════════════════════════════
   DM / PLAYER ROLE + PASSWORD GATE
   The password is a friction gate only — it keeps the mode switch
   deliberate, it is not real security. It is stored obfuscated
   (base64), never in plain text, but that is not encryption.
══════════════════════════════ */
function b64(pw) { return btoa(unescape(encodeURIComponent(pw))); }

function updateRoleUI() {
  btnRole.textContent = state.role === 'dm' ? '🎭 DM' : '🎭 Player';
  btnRole.classList.toggle('dm-active', state.role === 'dm');
  footerRole.textContent = state.role === 'dm' ? 'DM mode' : 'Player mode';
  refreshOpenViews();
}

function openDmAuth() {
  const hasPass = !!localStorage.getItem(DMPASS_KEY);
  overlayDmauth.dataset.mode = hasPass ? 'enter' : 'set';
  dmauthTitle.textContent = hasPass ? 'Enter DM Mode' : 'Set a DM Password';
  dmauthDesc.textContent  = hasPass
    ? 'Enter your DM password.'
    : 'This is a friction gate, not real security — it just keeps you from switching into DM mode by accident. Choose a password to confirm.';
  dmauthPass.value = '';
  dmauthPass2.value = '';
  dmauthPass2.style.display = hasPass ? 'none' : 'block';
  dmauthError.textContent = '';
  overlayDmauth.style.display = 'flex';
  dmauthPass.focus();
}

function submitDmAuth() {
  const mode = overlayDmauth.dataset.mode;
  const pw = dmauthPass.value;
  if (!pw) { dmauthError.textContent = 'Password cannot be empty.'; return; }

  if (mode === 'set') {
    if (pw !== dmauthPass2.value) { dmauthError.textContent = 'Passwords do not match.'; return; }
    localStorage.setItem(DMPASS_KEY, b64(pw));
    enterDmMode();
  } else {
    if (b64(pw) !== localStorage.getItem(DMPASS_KEY)) { dmauthError.textContent = 'Incorrect password.'; return; }
    enterDmMode();
  }
}

function enterDmMode() {
  state.role = 'dm';
  localStorage.setItem(ROLE_KEY, 'dm');
  overlayDmauth.style.display = 'none';
  updateRoleUI();
}

/* ══════════════════════════════
   REALM EXPORT / IMPORT
   Export strips DM-only fields so a shared file never leaks
   secrets even if opened directly in a text editor. Import merges
   by id and never overwrites a device's own live-sheet state or
   locally-set DM fields.
══════════════════════════════ */
function exportRealm() {
  const clean = state.entries.map(e => {
    const copy = { ...e };
    delete copy.dmSecrets;
    delete copy.dmNotes;
    return copy;
  });
  const blob = new Blob([JSON.stringify(clean, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `dnd-grimoire-realm-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function mergeImportedEntries(incoming) {
  let added = 0, merged = 0;
  incoming.forEach(inc => {
    if (!inc || !inc.id || !inc.type) return;
    const idx = state.entries.findIndex(e => e.id === inc.id);
    if (idx === -1) {
      const entry = { ...inc };
      if (entry.type === 'character') {
        entry.hp         = entry.hp !== undefined ? entry.hp : (parseInt(entry.maxHp, 10) || 0);
        entry.inventory  = entry.inventory  || [];
        entry.conditions = entry.conditions || [];
        entry.sheetNotes = entry.sheetNotes || '';
      }
      state.entries.push(entry);
      added++;
    } else {
      const local = state.entries[idx];
      const mergedEntry = { ...local, ...inc };
      if (local.type === 'character') {
        mergedEntry.hp         = local.hp;
        mergedEntry.inventory  = local.inventory;
        mergedEntry.conditions = local.conditions;
        mergedEntry.sheetNotes = local.sheetNotes;
        mergedEntry.dmNotes    = local.dmNotes;
      }
      if (local.type === 'lore') mergedEntry.dmSecrets = local.dmSecrets;
      state.entries[idx] = mergedEntry;
      merged++;
    }
  });
  lsSave(state.entries);
  renderRecentPanel(); updateFooter(); updateStorageStatus(); populateCategoryFilter();
  if (overlayReader.style.display !== 'none') renderReader();
  alert(`Realm import complete: ${added} new entr${added!==1?'ies':'y'}, ${merged} updated.`);
}

/* ══════════════════════════════
   CHARACTER SHEET MODAL
══════════════════════════════ */
function openCharacterSheet(id) {
  const entry = state.entries.find(e => e.id === id);
  if (!entry) return;
  state.openCharId = id;
  overlayCharsheet.style.display = 'flex';
  renderCharacterSheet(id);
}

function renderCharacterSheet(id) {
  const entry = state.entries.find(e => e.id === id);
  if (!entry) return;

  csTitle.textContent = entry.title || 'Unnamed Character';
  csSubtitle.textContent = `Level ${entry.level || '?'} · ${entry.race || 'Unknown race'} · ${entry.charClass || ''}`;

  const curHp = entry.hp !== undefined && entry.hp !== '' ? entry.hp : (entry.maxHp || 0);
  csHpCurrent.textContent = curHp;
  csHpMax.textContent = entry.maxHp || 0;

  csAbilityGrid.innerHTML = ['str','dex','con','int','wis','cha'].map(k => `
    <div class="cs-ability-item"><div class="cs-ability-label">${k.toUpperCase()}</div><div class="cs-ability-value">${escapeHtml(entry[k] || '—')}</div></div>
  `).join('');

  renderCsInventory(entry);
  renderCsConditions(entry);

  csNotes.value = entry.sheetNotes || '';

  csBackgroundText.dataset.entryId = entry.id;
  csBackgroundText.innerHTML = entry.body
    ? renderFieldWithMarks(entry.id, 'body', entry.body)
    : '<em style="color:var(--muted)">No background written yet.</em>';

  if (state.role === 'dm' && entry.dmNotes) {
    csDmNotesSection.style.display = 'block';
    csDmNotesText.dataset.entryId = entry.id;
    csDmNotesText.innerHTML = renderFieldWithMarks(entry.id, 'dmNotes', entry.dmNotes);
  } else {
    csDmNotesSection.style.display = 'none';
  }
}

function adjustHp(delta) {
  const entry = state.entries.find(e => e.id === state.openCharId);
  if (!entry) return;
  const cur = entry.hp !== undefined && entry.hp !== '' ? parseInt(entry.hp, 10) : (parseInt(entry.maxHp, 10) || 0);
  entry.hp = Math.max(0, cur + delta);
  lsSave(state.entries);
  renderCharacterSheet(state.openCharId);
}

function renderCsInventory(entry) {
  const items = entry.inventory || [];
  csInventoryList.innerHTML = items.length ? items.map(it => `
    <div class="cs-inventory-item" data-item-id="${it.id}">
      <span class="cs-inventory-name">${escapeHtml(it.name)}</span>
      <button class="cs-qty-btn" data-action="qty-minus" type="button">&#x2212;</button>
      <span class="cs-qty-value">${it.qty}</span>
      <button class="cs-qty-btn" data-action="qty-plus" type="button">&#x2B;</button>
      <button class="cs-item-remove" data-action="remove-item" type="button">&#x2715;</button>
    </div>
  `).join('') : '<div style="font-size:12px;color:var(--muted);font-style:italic;">No items yet.</div>';
}

function renderCsConditions(entry) {
  const conds = entry.conditions || [];
  csConditionsList.innerHTML = conds.length ? conds.map(c => `
    <span class="cs-condition-pill" data-cond="${escapeHtml(c)}">${escapeHtml(c)} <button data-action="remove-cond" type="button">&#x2715;</button></span>
  `).join('') : '<div style="font-size:12px;color:var(--muted);font-style:italic;">No active conditions.</div>';
}

/* ══════════════════════════════
   EVENT LISTENERS
══════════════════════════════ */

/* ── Type buttons ── */
document.querySelectorAll('.type-btn').forEach(btn =>
  btn.addEventListener('click', () => switchType(btn.dataset.type)));

/* ── Header buttons ── */
btnReader.addEventListener('click', () => openReader());
btnHighlights.addEventListener('click', openHighlights);
btnDictionary.addEventListener('click', openDictionary);
btnExport.addEventListener('click', exportRealm);
btnImport.addEventListener('click', () => { importFileInput.value = ''; importFileInput.click(); });

importFileInput.addEventListener('change', async () => {
  const file = importFileInput.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const incoming = JSON.parse(text);
    if (!Array.isArray(incoming)) throw new Error('file does not contain a realm entry list');
    mergeImportedEntries(incoming);
  } catch (err) {
    alert('Could not import realm file: ' + err.message);
  }
});

btnRole.addEventListener('click', () => {
  if (state.role === 'dm') {
    state.role = 'player';
    localStorage.setItem(ROLE_KEY, 'player');
    updateRoleUI();
  } else {
    openDmAuth();
  }
});
dmauthSubmit.addEventListener('click', submitDmAuth);
dmauthCancel.addEventListener('click', () => { overlayDmauth.style.display = 'none'; });
dmauthForgot.addEventListener('click', () => {
  if (!confirm('Reset the DM password? You will need to set a new one to enter DM mode again.')) return;
  localStorage.removeItem(DMPASS_KEY);
  openDmAuth();
});
[dmauthPass, dmauthPass2].forEach(inp => inp.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); submitDmAuth(); }
}));

/* ── Save / Clear ── */
btnSave.addEventListener('click', saveEntry);

btnClear.addEventListener('click', () => {
  const hasContent =
    document.getElementById('chronicle-body')?.value.trim() ||
    document.getElementById('chronicle-title')?.value.trim() ||
    document.getElementById('spell-title')?.value.trim() ||
    document.getElementById('spell-notes')?.value.trim() ||
    document.getElementById('lore-title')?.value.trim() ||
    document.getElementById('lore-body')?.value.trim() ||
    document.getElementById('character-title')?.value.trim() ||
    state.imageDataUrls.length > 0;
  const msg = state.editingId
    ? 'Cancel this edit and discard all changes?'
    : 'Clear the current entry?';
  if ((hasContent || state.editingId) && !confirm(msg)) return;
  clearComposer();
});

/* ── Text field input → save gate ── */
['chronicle-title','chronicle-body'].forEach(id => {
  const el=document.getElementById(id); if(el) el.addEventListener('input',checkSaveEnabled);
});
['spell-title','spell-notes'].forEach(id => {
  const el=document.getElementById(id); if(el) el.addEventListener('input',checkSaveEnabled);
});
['lore-title','lore-body'].forEach(id => {
  const el=document.getElementById(id); if(el) el.addEventListener('input',checkSaveEnabled);
});
const characterTitleEl = document.getElementById('character-title');
if (characterTitleEl) characterTitleEl.addEventListener('input', checkSaveEnabled);

/* ── Mood / Pill grids ── */
moodGrid.addEventListener('click', e => {
  const btn=e.target.closest('.mood-btn'); if(!btn) return;
  state.selectedMood=btn.dataset.mood;
  document.querySelectorAll('.mood-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
});

document.getElementById('spell-school-grid').addEventListener('click', e => {
  const btn=e.target.closest('.pill-btn'); if(!btn) return;
  activatePill('spell-school-grid','spellSchool',btn.dataset.val);
});
document.getElementById('spell-level-grid').addEventListener('click', e => {
  const btn=e.target.closest('.pill-btn'); if(!btn) return;
  activatePill('spell-level-grid','spellLevel',btn.dataset.val);
});
document.getElementById('lore-tier-grid').addEventListener('click', e => {
  const btn=e.target.closest('.pill-btn'); if(!btn) return;
  activatePill('lore-tier-grid','loreTier',btn.dataset.val);
  populateLoreParentOptions(state.editingId);
  checkSaveEnabled();
});
document.getElementById('character-class-grid').addEventListener('click', e => {
  const btn=e.target.closest('.pill-btn'); if(!btn) return;
  activatePill('character-class-grid','characterClass',btn.dataset.val);
});

/* ── Emoji strip ── */
emojiStrip.addEventListener('click', e => {
  const btn=e.target.closest('.emoji-btn'); if(btn) insertEmoji(btn.dataset.emoji);
});

/* ── IMAGE UPLOAD WIRING ── */
document.querySelectorAll('.img-pick-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    _activePickForm = btn.dataset.form;
    imgFileInput.value = '';
    imgFileInput.click();
  });
});

imgFileInput.addEventListener('change', async () => {
  const files = Array.from(imgFileInput.files);
  if (!files.length) return;
  for (const file of files) {
    try {
      const dataUri = await compressImage(file);
      state.imageDataUrls.push(dataUri);
    } catch (err) {
      console.warn('Image compress failed:', err);
      alert(`Could not process image "${file.name}". Please try another file.`);
    }
  }
  renderImagePreview();
});

document.querySelectorAll('.img-url-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = btn.closest('.img-url-row')?.querySelector('.img-url-input');
    if (!input) return;
    addImageUrl(input.value);
    input.value = '';
  });
});

document.querySelectorAll('.img-url-input').forEach(input => {
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); addImageUrl(input.value); input.value = ''; }
  });
});

/* ── Grimoire search ── */
grimoireSearch.addEventListener('input', e => { openGrimoireSearch(e.target.value); });
grimoireSearch.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown')  { e.preventDefault(); moveSuggestCursor(1); }
  if (e.key === 'ArrowUp')    { e.preventDefault(); moveSuggestCursor(-1); }
  if (e.key === 'Enter')      { e.preventDefault(); selectSuggestCursor(); }
  if (e.key === 'Escape')     { closeSuggestions(); grimoireSearch.blur(); }
});
grimoireSearch.addEventListener('focus', () => { if (state.grimoireQuery) renderSuggestions(state.grimoireQuery); });
grimoireSearch.addEventListener('blur',  () => { setTimeout(closeSuggestions, 150); });
grimoireSearchClear.addEventListener('click', clearGrimoireSearch);

/* ── Recent panel filters ── */
recentFilters.addEventListener('click', e => {
  const btn=e.target.closest('.filter-btn'); if(!btn) return;
  state.recentFilter=btn.dataset.filter;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.toggle('active',b.dataset.filter===state.recentFilter));
  renderRecentPanel();
});

/* ── Reader ── */
readerClose.addEventListener('click', () => { overlayReader.style.display='none'; state.readerScrollTo=null; });
readerSearch.addEventListener('input', () => renderReader());
readerFilterType.addEventListener('change', () => { populateCategoryFilter(); renderReader(); });
readerFilterCat.addEventListener('change', () => renderReader());
readerSort.addEventListener('click', () => {
  state.readerSort=state.readerSort==='desc'?'asc':'desc';
  readerSort.textContent=state.readerSort==='desc'?'↓ Newest':'↑ Oldest';
  renderReader();
});
readerTermsToggle.addEventListener('click', () => {
  state.termsOn = !state.termsOn;
  localStorage.setItem(TERMS_KEY, state.termsOn ? 'on' : 'off');
  readerTermsToggle.textContent = state.termsOn ? 'Terms: On' : 'Terms: Off';
  readerTermsToggle.classList.toggle('active', state.termsOn);
  refreshOpenViews();
});

/* ── Delete ── */
deleteConfirm.addEventListener('click', () => {
  if(state.pendingDelete) deleteEntry(state.pendingDelete);
  state.pendingDelete=null; overlayDelete.style.display='none';
});
deleteCancel.addEventListener('click', () => { state.pendingDelete=null; overlayDelete.style.display='none'; });

/* ── Character Sheet modal ── */
csClose.addEventListener('click', () => { overlayCharsheet.style.display='none'; state.openCharId=null; });
csHpMinus.addEventListener('click', () => adjustHp(-1));
csHpPlus.addEventListener('click',  () => adjustHp(1));
csHpSet.addEventListener('click', () => {
  const entry = state.entries.find(e => e.id === state.openCharId);
  if (!entry) return;
  const val = prompt('Set current HP:', entry.hp !== undefined ? entry.hp : (entry.maxHp || 0));
  if (val === null) return;
  const n = parseInt(val, 10);
  if (isNaN(n)) return;
  entry.hp = Math.max(0, n);
  lsSave(state.entries);
  renderCharacterSheet(state.openCharId);
});

csInventoryList.addEventListener('click', e => {
  const row = e.target.closest('.cs-inventory-item'); if(!row) return;
  const entry = state.entries.find(x=>x.id===state.openCharId); if(!entry) return;
  const itemId = row.dataset.itemId;
  const item = (entry.inventory||[]).find(i=>i.id===itemId); if(!item) return;
  const action = e.target.dataset.action;
  if (action==='qty-plus') item.qty++;
  else if (action==='qty-minus') { item.qty--; if (item.qty<=0) entry.inventory = entry.inventory.filter(i=>i.id!==itemId); }
  else if (action==='remove-item') entry.inventory = entry.inventory.filter(i=>i.id!==itemId);
  else return;
  lsSave(state.entries);
  renderCsInventory(entry);
});
csInventoryAddBtn.addEventListener('click', () => {
  const name = csInventoryInput.value.trim(); if(!name) return;
  const entry = state.entries.find(x=>x.id===state.openCharId); if(!entry) return;
  entry.inventory = entry.inventory || [];
  entry.inventory.push({ id: 'it'+Date.now()+Math.random().toString(36).slice(2,5), name, qty: 1 });
  lsSave(state.entries);
  csInventoryInput.value = '';
  renderCsInventory(entry);
});
csInventoryInput.addEventListener('keydown', e => { if(e.key==='Enter'){ e.preventDefault(); csInventoryAddBtn.click(); } });

csConditionsList.addEventListener('click', e => {
  const btn = e.target.closest('[data-action="remove-cond"]'); if(!btn) return;
  const pill = btn.closest('.cs-condition-pill');
  const cond = pill.dataset.cond;
  const entry = state.entries.find(x=>x.id===state.openCharId); if(!entry) return;
  entry.conditions = (entry.conditions||[]).filter(c=>c!==cond);
  lsSave(state.entries);
  renderCsConditions(entry);
});
csConditionAddBtn.addEventListener('click', () => {
  const val = csConditionInput.value.trim(); if(!val) return;
  const entry = state.entries.find(x=>x.id===state.openCharId); if(!entry) return;
  entry.conditions = entry.conditions || [];
  if (!entry.conditions.includes(val)) entry.conditions.push(val);
  lsSave(state.entries);
  csConditionInput.value = '';
  renderCsConditions(entry);
});
csConditionInput.addEventListener('keydown', e => { if(e.key==='Enter'){ e.preventDefault(); csConditionAddBtn.click(); } });

let _csNotesTimer = null;
csNotes.addEventListener('input', () => {
  clearTimeout(_csNotesTimer);
  _csNotesTimer = setTimeout(() => {
    const entry = state.entries.find(x=>x.id===state.openCharId); if(!entry) return;
    entry.sheetNotes = csNotes.value;
    lsSave(state.entries);
    csNotesStatus.textContent = '✓ saved';
    csNotesStatus.classList.add('visible');
    setTimeout(() => csNotesStatus.classList.remove('visible'), 1500);
  }, 600);
});

/* ── My Highlights modal ── */
highlightsClose.addEventListener('click', () => { overlayHighlights.style.display='none'; });

/* ── Dictionary modal ── */
dictionaryClose.addEventListener('click', () => { overlayDictionary.style.display='none'; });
dictionarySearch.addEventListener('input', () => renderDictionaryList(dictionarySearch.value));

/* ── Highlight palette buttons ── */
hlPalette.addEventListener('click', e => {
  const swatch = e.target.closest('.hl-swatch');
  if (swatch) { e.stopPropagation(); addOrUpdateHighlight(swatch.dataset.color); return; }
  if (e.target.closest('#hl-clear-btn')) { e.stopPropagation(); removeHighlightAction(); }
});

/* ── Global mouseup (highlight selection) + click (marks, terms, dismiss) ── */
document.addEventListener('mouseup', handleHlMouseUp);
document.addEventListener('click', e => {
  if (_suppressNextDocClick) { _suppressNextDocClick = false; return; }
  const mark = e.target.closest('.hl-mark');
  const term = e.target.closest('.dict-term');
  if (mark) { e.stopPropagation(); openHlPaletteForMark(mark); return; }
  if (term) { e.stopPropagation(); showTermPopover(term); return; }
  if (e.target.closest('.hl-palette') || e.target.closest('.term-popover')) return;
  hideHlPalette();
  hideTermPopover();
});

/* ── Keyboard global ── */
document.addEventListener('keydown', e => {
  if(e.key==='Escape'){
    overlayReader.style.display='none'; overlayDelete.style.display='none';
    overlayCharsheet.style.display='none'; overlayHighlights.style.display='none';
    overlayDictionary.style.display='none'; overlayDmauth.style.display='none';
    state.readerScrollTo=null; state.openCharId=null;
    hideHlPalette(); hideTermPopover();
  }
  if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();if(!btnSave.disabled)saveEntry();}
});

/* ── Overlay backdrop click to close ── */
[overlayReader,overlayDelete,overlayCharsheet,overlayHighlights,overlayDictionary,overlayDmauth].forEach(o=>{
  o.addEventListener('click',e=>{
    if(e.target!==o) return;
    o.style.display='none';
    if(o===overlayReader)     state.readerScrollTo=null;
    if(o===overlayDelete)     state.pendingDelete=null;
    if(o===overlayCharsheet)  state.openCharId=null;
  });
});

/* ══════════════════════════════
   INITIALISATION
══════════════════════════════ */
function init() {
  updateStorageStatus();
  checkSaveEnabled();
  renderRecentPanel();
  updateFooter();
  populateCategoryFilter();
  updateRoleUI();
}

init();
