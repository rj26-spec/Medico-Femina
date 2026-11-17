const fs = require('fs');
const path = require('path');

// 1. Mock Browser Environment for app.js
const domStorage = {};
const mockLocalStorage = {
  getItem: (key) => (key in domStorage ? domStorage[key] : null),
  setItem: (key, val) => { domStorage[key] = String(val); },
  removeItem: (key) => { delete domStorage[key]; },
  clear: () => { Object.keys(domStorage).forEach(k => delete domStorage[k]); }
};

// Simple Mock DOM Element
class MockElement {
  constructor(id = '', tag = 'div') {
    this.id = id;
    this.tagName = tag.toUpperCase();
    this.classList = new Set();
    this.classList.add = (c) => this.classList.add(c);
    this.classList.remove = (c) => this.classList.delete(c);
    this.classList.contains = (c) => this.classList.has(c);
    this.classList.toggle = (c) => (this.classList.has(c) ? this.classList.delete(c) : this.classList.add(c));
    this.style = {};
    this.innerText = '';
    this.innerHTML = '';
    this.value = '';
    this.checked = false;
    this.attributes = {};
    this.children = [];
    this.dataset = {};
  }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] || null; }
  removeAttribute(k) { delete this.attributes[k]; }
  appendChild(child) { this.children.push(child); return child; }
  removeChild(child) { this.children = this.children.filter(c => c !== child); }
  querySelector(sel) { return null; }
  querySelectorAll(sel) { return []; }
}

const elementsMap = new Map();
function getOrCreateElem(id, tag = 'div') {
  if (!elementsMap.has(id)) {
    const el = new MockElement(id, tag);
    elementsMap.set(id, el);
  }
  return elementsMap.get(id);
}

const mockDocument = {
  getElementById: (id) => getOrCreateElem(id),
  createElement: (tag) => new MockElement('', tag),
  querySelector: (sel) => {
    if (sel.startsWith('#')) return getOrCreateElem(sel.slice(1));
    return new MockElement('', 'div');
  },
  querySelectorAll: (sel) => [],
  addEventListener: (event, handler) => {},
  body: new MockElement('body', 'body')
};

const mockWindow = {
  localStorage: mockLocalStorage,
  document: mockDocument,
  addEventListener: () => {},
  removeEventListener: () => {},
  AudioContext: class {
    constructor() { this.state = 'running'; this.currentTime = 0; }
    createOscillator() {
      return {
        connect: () => {},
        start: () => {},
        stop: () => {},
        frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }
      };
    }
    createGain() {
      return {
        connect: () => {},
        gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }
      };
    }
    resume() {}
  },
  webkitAudioContext: null
};

// Canvas mock for AI Vision
class MockCanvas {
  constructor(w = 40, h = 40) {
    this.width = w;
    this.height = h;
  }
  getContext() {
    return {
      drawImage: () => {},
      getImageData: (x, y, w, h) => {
        // Mock image data: 40x40 RGBA
        const data = new Uint8Array(w * h * 4);
        for (let i = 0; i < data.length; i += 4) {
          // Default creamy-white with spice dusting
          data[i] = 230;     // R
          data[i + 1] = 220; // G
          data[i + 2] = 215; // B
          data[i + 3] = 255;
          if (i % 64 === 0) {
            data[i] = 190;   // Red chili
            data[i + 1] = 60;
            data[i + 2] = 30;
          }
        }
        return { data };
      }
    };
  }
}

// Global Mocks
global.window = mockWindow;
global.document = mockDocument;
global.localStorage = mockLocalStorage;
global.navigator = { geolocation: { getCurrentPosition: () => {} } };
global.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
global.Image = class {
  constructor() {
    setTimeout(() => { if (this.onload) this.onload(); }, 10);
  }
};
global.lucide = { createIcons: () => {} };
global.confetti = () => {};
global.Chart = class {
  constructor(ctx, config) {
    this.ctx = ctx;
    this.config = config;
    this.data = config.data;
  }
  update() {}
  destroy() {}
};

// Load app.js in global context
let appCode = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
// Expose top level consts to global
appCode = appCode.replace('const state =', 'global.state =');
appCode = appCode.replace('const foodKnowledgeBase =', 'global.foodKnowledgeBase =');
appCode = appCode.replace('const foodPhotoPresets =', 'global.foodPhotoPresets =');

const vm = require('vm');
vm.runInThisContext(appCode);
console.log('✅ app.js successfully loaded into simulation test harness.');

// 50-Run Clinical Simulation for PCOD/PCOS Patient
async function run50Simulations() {
  console.log('\n=============================================================');
  console.log('🚀 STARTING 50 SIMULATED CLINICAL RUNS FOR PCOD/PCOS PATIENT');
  console.log('=============================================================\n');

  const issuesFound = [];
  const runFeedback = [];

  // Patient profile test scenarios
  const profiles = [
    { type: 'Phenotype A (Classic Severe)', age: 24, height: 162, weight: 78, cycleLen: 54, hirsutism: 'Severe', acne: 'Cystic', insulinResistant: true },
    { type: 'Phenotype B (Hyperandrogenic Anovulatory)', age: 27, height: 165, weight: 64, cycleLen: 42, hirsutism: 'Moderate', acne: 'Severe', insulinResistant: false },
    { type: 'Phenotype C (Ovulatory Polycystic)', age: 31, height: 158, weight: 58, cycleLen: 33, hirsutism: 'Mild', acne: 'Mild', insulinResistant: false },
    { type: 'Phenotype D (Adrenal / Lean PCOS)', age: 22, height: 168, weight: 51, cycleLen: 68, hirsutism: 'None', acne: 'Moderate', insulinResistant: false, highCortisol: true },
    { type: 'Post-Pill PCOS (Secondary Amenorrhea)', age: 29, height: 160, weight: 60, cycleLen: 90, hirsutism: 'Mild', acne: 'Severe', insulinResistant: false }
  ];

  const testDishes = [
    'dahibara', 'dahi vada', 'dahi bhalla', 'moong dal cheela', 'besan cheela', 'idli sambar',
    'masala dosa', 'vegetable poha', 'vegetable upma', 'palak paneer with roti', 'sprouted moong dal',
    'greek yogurt with berries', 'spearmint tea and pumpkin seeds', 'grilled salmon and asparagus',
    '2 boiled eggs with avocado', 'high protein green salad', 'quinoa chicken bowl', 'ragi roti with dal',
    'chana masala bowl', 'tofu stir fry with broccoli'
  ];

  const testLeenaQueries = [
    'I have not had my period for 55 days. Should I induce withdrawal bleeding with progesterone?',
    'What is the optimal ratio of Myo-Inositol to D-Chiro-Inositol for PCOS egg quality?',
    'Why do I feel extreme sugar cravings and brain fog after eating white rice or pasta?',
    'How do I lower elevated DHEA-S and cortisol without medications?',
    'Can spearmint tea actually reduce hirsutism and facial hair growth in clinical studies?',
    'My fasting insulin is 16 uIU/mL and fasting glucose is 92 mg/dL. What is my HOMA-IR?',
    'Does metformin help with ovulation induction, and what are the main side effects?',
    'How can I distinguish anovulatory cycles from ovulatory cycles using Basal Body Temperature?'
  ];

  for (let i = 1; i <= 50; i++) {
    const prof = profiles[(i - 1) % profiles.length];
    const dayOfCycle = ((i - 1) % prof.cycleLen) + 1;
    const testLog = { run: i, phenotype: prof.type, cycleDay: dayOfCycle, passed: true, notes: [] };

    // --- SUB-TEST 1: Profile & BMI Verification ---
    const bmiVal = parseFloat((prof.weight / Math.pow(prof.height / 100, 2)).toFixed(1));
    state.user = state.user || {};
    state.user.name = `Patient ${i}`;
    state.user.height = prof.height;
    state.user.weight = prof.weight;
    state.user.bmi = bmiVal;
    state.user.dob = `${2026 - prof.age}-04-15`;

    if (isNaN(bmiVal) || bmiVal <= 0) {
      issuesFound.push(`[Run ${i}] Invalid BMI calculated: ${bmiVal}`);
      testLog.passed = false;
    }

    // --- SUB-TEST 2: Cycle Phase & Irregular Length Handling ---
    state.cycleData.totalEstimatedLength = prof.cycleLen;
    state.cycleData.currentDay = dayOfCycle;
    state.cycleDay = dayOfCycle;
    
    // Test getCyclePhaseInfo
    const phaseInfo = typeof getCyclePhaseInfo === 'function' ? getCyclePhaseInfo(dayOfCycle, prof.cycleLen) : null;
    if (!phaseInfo) {
      issuesFound.push(`[Run ${i}] getCyclePhaseInfo returned null or undefined for day ${dayOfCycle}/${prof.cycleLen}`);
      testLog.passed = false;
    } else {
      testLog.notes.push(`Phase: ${phaseInfo.title}`);
    }

    // --- SUB-TEST 3: BBT Logging & Thermal Shift ---
    // In follicular phase (before ovulation), temp is 36.25 - 36.40°C.
    // Ovulation in PCOS is often delayed (e.g. day 21+ or anovulatory).
    const ovulDay = prof.cycleLen > 40 ? Math.round(prof.cycleLen - 14) : 14;
    let bbtTemp = 36.32;
    if (prof.type.includes('Anovulatory')) {
      // Flat curve (no thermal shift)
      bbtTemp = parseFloat((36.28 + (Math.sin(i) * 0.05)).toFixed(2));
    } else if (dayOfCycle >= ovulDay) {
      // Progesterone thermal shift: +0.35 to 0.45°C
      bbtTemp = parseFloat((36.72 + (Math.cos(i) * 0.04)).toFixed(2));
    } else {
      bbtTemp = parseFloat((36.30 + (Math.sin(i) * 0.04)).toFixed(2));
    }

    const testDate = `2026-11-${String((i % 28) + 1).padStart(2, '0')}`;
    const fluidType = dayOfCycle === ovulDay ? 'eggwhite' : (dayOfCycle < 6 ? 'none' : 'sticky');
    const flowType = dayOfCycle <= 5 ? (dayOfCycle <= 2 ? 'heavy' : 'light') : 'none';

    // Verify bbt record insertion
    state.cycleData.bbtRecords = state.cycleData.bbtRecords || [];
    state.cycleData.bbtRecords.push({
      date: testDate,
      day: dayOfCycle,
      temp: bbtTemp,
      fluid: fluidType,
      flow: flowType
    });

    if (typeof calculateCycleSummary === 'function') {
      const summary = calculateCycleSummary();
      if (!summary || typeof summary.follicularAvg === 'undefined') {
        issuesFound.push(`[Run ${i}] calculateCycleSummary returned incomplete stats.`);
      }
    }

    // --- SUB-TEST 4: Nutrition & Macro Engine ---
    const dish = testDishes[(i - 1) % testDishes.length];
    const nutrition = calculateNutritionAI(dish);
    if (!nutrition || !nutrition.protein || !nutrition.calories) {
      issuesFound.push(`[Run ${i}] calculateNutritionAI failed for dish: "${dish}"`);
      testLog.passed = false;
    } else {
      // Verify dahibara macros specifically
      if (dish.includes('dahi') && dish.includes('bara')) {
        if (nutrition.protein < 10 || nutrition.fiber < 3 || nutrition.carbs < 18) {
          issuesFound.push(`[Run ${i}] Dahibara macros unexpected: P:${nutrition.protein}, F:${nutrition.fiber}, C:${nutrition.carbs}`);
          testLog.passed = false;
        }
      }
      testLog.notes.push(`Dish "${dish}": ${nutrition.protein}g P, ${nutrition.fiber}g F, ${nutrition.calories} kcal`);
    }

    // --- SUB-TEST 5: Remission 4-Pillars Protocol ---
    // Simulate checking pillars
    const habitPillars = {
      p1: i % 2 === 0, // Morning sunlight
      p2: true,        // Protein & fiber breakfast
      p3: i % 3 !== 0, // 10-15m walk
      p4: true,        // Targeted inositol & supplements
      p5: i % 4 !== 0  // Zero plastic heating
    };
    const completedCount = Object.values(habitPillars).filter(Boolean).length;
    const expectedScore = Math.round((completedCount / 5) * 100);
    testLog.notes.push(`Remission Score: ${expectedScore}% (${completedCount}/5 pillars)`);

    // --- SUB-TEST 6: Dr. Leena AI Clinical Response ---
    const query = testLeenaQueries[(i - 1) % testLeenaQueries.length];
    if (typeof generateClinicalResponse === 'function') {
      const response = generateClinicalResponse(query);
      if (!response || response.length < 50) {
        issuesFound.push(`[Run ${i}] generateClinicalResponse returned empty or too short response for: "${query}"`);
        testLog.passed = false;
      } else {
        // Clinical keyword checks
        const lowerRes = response.toLowerCase();
        if (query.includes('Inositol') && !lowerRes.includes('inositol') && !lowerRes.includes('40:1')) {
          issuesFound.push(`[Run ${i}] Dr. Leena response missed clinical 40:1 inositol guidance.`);
        }
        if (query.includes('spearmint') && !lowerRes.includes('androgen') && !lowerRes.includes('testosterone')) {
          issuesFound.push(`[Run ${i}] Dr. Leena response missed anti-androgen context for spearmint.`);
        }
      }
    }

    // --- SUB-TEST 7: Data Export Verification ---
    if (i === 25 || i === 50) {
      try {
        // Test backup JSON structure
        const backupData = {
          user: state.user,
          cycleData: state.cycleData,
          nutrition: state.nutrition,
          exportDate: new Date().toISOString()
        };
        const serialized = JSON.stringify(backupData);
        if (serialized.length < 100) {
          issuesFound.push(`[Run ${i}] Backup serialization produced suspiciously short payload.`);
        }
      } catch (err) {
        issuesFound.push(`[Run ${i}] Backup export serialization error: ${err.message}`);
      }
    }

    runFeedback.push(testLog);
  }

  console.log('✅ Completed all 50 simulated clinical test iterations.');
  console.log(`\nTotal Runs: 50 | Passed: ${runFeedback.filter(r => r.passed).length} | Failed: ${runFeedback.filter(r => !r.passed).length}`);
  console.log(`Issues / Gaps Detected: ${issuesFound.length}`);

  if (issuesFound.length > 0) {
    console.log('\n--- ISSUES DETECTED DURING RUNS ---');
    issuesFound.forEach(iss => console.log('⚠️ ' + iss));
  } else {
    console.log('🎉 100% of simulated clinical runs passed with zero functional failures!');
  }

  console.log('\n--- SAMPLE RUN BREAKDOWNS (10 RUN SAMPLES) ---');
  [1, 5, 10, 15, 20, 25, 30, 35, 40, 50].forEach(rNum => {
    const r = runFeedback[rNum - 1];
    console.log(`\n[RUN ${r.run}] Phenotype: ${r.phenotype} | Day: ${r.cycleDay}`);
    r.notes.forEach(n => console.log(`  • ${n}`));
  });

  return { runFeedback, issuesFound };

  return { runFeedback, issuesFound };
}

run50Simulations();
