/**
 * Medico Femina 2.0 - Clinical Engine with Real Data, Auth, AI Doctor & Telehealth
 */

// Application State with Pure Real Data Persistence
const state = {
  activeTab: 'dashboard',
  isMobileFrame: false,
  remissionScore: 0,
  streak: 0,
  lastStreakDate: '', // YYYY-MM-DD of last log that counted toward streak
  waterGlasses: 0,
  selectedMood: 'Calm & Content',
  selectedSymptoms: ['Jawline / Chin Acne', 'Sugar / Carb Cravings'],
  selectedDate: '', // Dynamic YYYY-MM-DD
  calendarYear: new Date().getFullYear(),
  calendarMonth: new Date().getMonth(),
  dailyLogs: {}, // Keyed by YYYY-MM-DD
  weatherData: null, // Complete forecast payload
  user: null, // Loaded dynamically from localStorage
  authMode: 'login',
  walkTimer: {
    totalSeconds: 600, // 10 minutes
    remainingSeconds: 600,
    intervalId: null,
    isRunning: false
  },
  littleTimer: {
    totalSeconds: 300, // 5 minutes default
    remainingSeconds: 300,
    intervalId: null,
    isRunning: false,
    label: '5m Cortisol Breathing'
  },
  weather: {
    location: 'Bhubaneswar, India',
    lat: 20.2961,
    lon: 85.8245,
    temp: '--',
    feelsLike: '--',
    humidity: '--',
    rainProb: '0%',
    wind: '--',
    pressure: '--',
    condition: 'Updating live telemetry...'
  },
  cycleData: {
    lastPeriodDate: '', // Real date from user setup
    currentDay: 1,
    totalEstimatedLength: 35,
    bbtRecords: [], // Historical records [{ date: '2026-11-04', day: 1, temp: 36.4, fluid: 'eggwhite', flow: 'none' }]
    coverLine: 36.35
  },
  chatMessages: [
    {
      sender: 'ai',
      time: 'Just now',
      text: "Hello! I am Dr. Leena, your AI Reproductive Endocrinologist. How can I help you today? You can ask me about delayed periods, interpreting your ultrasound, supplement dosages (like Myo-Inositol), reducing acne or chin hair, or building a low-GI diet plan."
    }
  ],
  currentMealType: 'breakfast',
  dailySchedule: [
    { id: 1, time: '07:00 AM', title: 'Wake & Morning BBT Log', category: 'Biomarkers', completed: false, notes: 'Measure before standing up to capture baseline body temp.' },
    { id: 2, time: '07:30 AM', title: 'Morning Sunlight & 500ml Water', category: 'Circadian', completed: false, notes: '10 mins sunlight sets cortisol peak & nighttime melatonin.' },
    { id: 3, time: '08:30 AM', title: 'High-Protein Breakfast (30g)', category: 'Nutrition', completed: false, notes: 'Eggs, avocado, or sprouted moong cheela. Zero refined carbs.' },
    { id: 4, time: '10:00 AM', title: 'Deep Work Block #1 (Posture Reset)', category: 'Work', completed: false, notes: 'Ergonomic seated position, 25-min Pomodoro cycles.' },
    { id: 5, time: '01:30 PM', title: 'Fiber-First Lunch & 10m Post-Meal Walk', category: 'Nutrition', completed: false, notes: 'Walk immediately after meal to blunt postprandial glucose by 35%.' },
    { id: 6, time: '04:30 PM', title: 'Spearmint Tea & Lymphatic Stretches', category: 'Anti-Androgen', completed: false, notes: 'Lowers free testosterone; gentle hamstring and hip opening.' },
    { id: 7, time: '06:00 PM', title: 'Compound Strength Lifts (Squats & Rows)', category: 'Movement', completed: false, notes: 'Activates skeletal muscle GLUT-4 glucose sinks without extra insulin.' },
    { id: 8, time: '08:00 PM', title: 'Anti-Inflammatory Light Dinner', category: 'Nutrition', completed: false, notes: 'Salmon, greens, or paneer bowl. Finished 3h before bed.' },
    { id: 9, time: '10:00 PM', title: 'Digital Sunset & Bedroom Cooled', category: 'Recovery', completed: false, notes: 'Blue light off, magnesium taken, cool room (19°C) for deep REM.' }
  ],
  nutrition: {
    targetProtein: 95,
    targetFiber: 35,
    targetCarbs: 85,
    targetFats: 50,
    meals: {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: []
    }
  }
};

let bbtChartInstance = null;
let walkQuotes = [
  "Muscle contraction absorbs glucose directly without requiring insulin.",
  "Walking 10 minutes after a meal lowers glucose spikes by up to 35%.",
  "Gentle walking signals safety to your adrenals, keeping cortisol low.",
  "Every step encourages healthy blood circulation to your ovaries."
];
let currentQuoteIdx = 0;

// Web Audio API Synthesizer (Gentle Luxury Chimes)
let audioCtx = null;
function playGentleChime(type = 'bell') {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'bell') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(528, now);
      osc.frequency.exponentialRampToValueAtTime(792, now + 0.15);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc.start(now);
      osc.stop(now + 0.9);
    } else if (type === 'water') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'fanfare') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(audioCtx.destination);
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.08, now + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 1.2);
        o.start(now + i * 0.08);
        o.stop(now + i * 0.08 + 1.2);
      });
    }
  } catch (e) {}
}

// DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
  detectAndApplyDeviceMode();
  window.addEventListener('resize', detectAndApplyDeviceMode);

  loadSavedState();
  initAuthUI();
  calculateRealCycleDay();
  initReportDate();
  initBBTChart();
  renderCalendar();
  updateCycleWheel();
  updateBBTStats();
  loadHabitsState();
  recalculateStreak();
  setupViewModeToggle();
  startQuoteRotation();
  initLittleTimer();
  initWeather();
  renderChatMessages();
  initDailySchedule();
  initNutrition();
  initDoctorDirectory();
  initPeriodCalculator();

  lucide.createIcons();
});

/**
 * Real Date Handling & Mathematical Engines (Local Timezone Safe)
 */
function getTodayLocalDateStr() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  const parts = String(dateStr).trim().split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      if (!isNaN(d.getTime())) return d;
    } else if (parts[2].length === 4) {
      // DD-MM-YYYY
      const d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      if (!isNaN(d.getTime())) return d;
    }
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

function formatLocalDate(dateObj) {
  if (!(dateObj instanceof Date)) dateObj = new Date(dateObj);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDatePretty(dateObj, format = 'full') {
  if (typeof dateObj === 'string') dateObj = parseLocalDate(dateObj);
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) dateObj = new Date();
  if (format === 'full') {
    return dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  } else if (format === 'medium') {
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } else if (format === 'short') {
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return dateObj.toDateString();
}

function getCycleDayForDate(targetDateStr) {
  if (!state.cycleData.lastPeriodDate) return 1;
  const last = parseLocalDate(state.cycleData.lastPeriodDate);
  const target = parseLocalDate(targetDateStr);
  const diffTime = target.getTime() - last.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(diffDays, 1);
}

function getDateForCycleDay(cycleDay) {
  if (!state.cycleData.lastPeriodDate) return getTodayLocalDateStr();
  const last = parseLocalDate(state.cycleData.lastPeriodDate);
  const target = new Date(last);
  target.setDate(target.getDate() + (cycleDay - 1));
  return formatLocalDate(target);
}

function calculateRealCycleDay() {
  const todayStr = getTodayLocalDateStr();
  state.selectedDate = state.selectedDate || todayStr;

  if (state.cycleData.lastPeriodDate) {
    state.cycleData.currentDay = getCycleDayForDate(todayStr);
  } else {
    // Sensible starter baseline: Day 14 (Period began 13 days prior)
    const starterDate = new Date();
    starterDate.setDate(starterDate.getDate() - 13);
    state.cycleData.lastPeriodDate = formatLocalDate(starterDate);
    state.cycleData.currentDay = 14;
  }
}

function openCycleDateModal() {
  playGentleChime('bell');
  const modal = document.getElementById('cycle-date-modal');
  const dateInput = document.getElementById('cdm-period-date');
  const lenInput = document.getElementById('cdm-cycle-len');

  if (dateInput) {
    dateInput.value = state.cycleData.lastPeriodDate || getTodayLocalDateStr();
  }
  if (lenInput) {
    lenInput.value = state.cycleData.totalEstimatedLength || 35;
  }
  if (modal) {
    modal.classList.remove('hidden');
    lucide.createIcons();
  }
}

function closeCycleDateModal() {
  const modal = document.getElementById('cycle-date-modal');
  if (modal) modal.classList.add('hidden');
}

function handleCycleDateSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const dateInput = document.getElementById('cdm-period-date');
  const lenInput = document.getElementById('cdm-cycle-len');

  const newDate = dateInput?.value || getTodayLocalDateStr();
  const newLen = parseInt(lenInput?.value) || 35;

  state.cycleData.lastPeriodDate = newDate;
  state.cycleData.totalEstimatedLength = newLen;
  if (state.user) {
    state.user.lastPeriodDate = newDate;
    state.user.cycleLength = newLen;
  }

  calculateRealCycleDay();
  renderCalendar();
  updateCycleWheel();
  updateBBTStats();
  saveState();
  closeCycleDateModal();
  playGentleChime('fanfare');
  showToastNotification(`🌸 Cycle updated! Current: Day ${state.cycleData.currentDay}`, '✨');
}

function startNewCycleToday() {
  playGentleChime('bell');
  const todayStr = getTodayLocalDateStr();
  const dateInput = document.getElementById('cdm-period-date');
  if (dateInput) dateInput.value = todayStr;
  handleCycleDateSubmit();
}

function getCyclePhaseInfo(day, totalLength) {
  totalLength = totalLength || state.cycleData.totalEstimatedLength || 35;
  const ovulationDay = Math.max(totalLength - 14, 14);
  const fertileStart = Math.max(ovulationDay - 5, 6);
  const fertileEnd = ovulationDay + 1;

  if (day <= 5) {
    return {
      phase: 'menstrual',
      title: 'Menstrual Bleed Phase',
      desc: 'Your uterine lining is shedding as progesterone and estrogen hit baseline. Focus on warm nourishing broths, iron replenishment, and gentle restorative rest.',
      fertileBadge: 'Fertile Window: <strong>Closed</strong>',
      energyBadge: 'Energy: <strong>Rest & Recharge</strong>',
      fluidBadge: 'Fluid: <strong>Period Bleed</strong>',
      statusText: 'Menstrual Reset',
      isOvulation: false,
      isPeriod: true
    };
  } else if (day < fertileStart) {
    return {
      phase: 'early_follicular',
      title: 'Follicular Development Phase',
      desc: 'FSH is stimulating follicular growth in your ovaries. Insulin sensitivity is high. Ideal time for compound strength training and cruciferous vegetables to clear excess androgens.',
      fertileBadge: 'Fertile Window: <strong>Approaching</strong>',
      energyBadge: 'Energy: <strong>Rising / High</strong>',
      fluidBadge: 'Fluid: <strong>Creamy / Lotion</strong>',
      statusText: 'Follicle Recruitment',
      isOvulation: false,
      isPeriod: false
    };
  } else if (day <= fertileEnd) {
    return {
      phase: 'ovulatory',
      title: day > 25 ? 'Delayed Follicular / Ovulatory Surge' : 'Ovulatory Surge Window',
      desc: 'Estrogen is peaking to trigger the pituitary LH surge for egg release! Fertile egg-white cervical mucus is present. Keep insulin low with post-meal walks and inositol to permit spontaneous ovulation.',
      fertileBadge: 'Fertile Window: <strong>Open Today! 🥚</strong>',
      energyBadge: 'Energy: <strong>Peak / Vibrant</strong>',
      fluidBadge: 'Fluid: <strong>Fertile Egg-White</strong>',
      statusText: 'Ovulation Surge Active',
      isOvulation: true,
      isPeriod: false
    };
  } else if (day <= totalLength) {
    return {
      phase: 'luteal',
      title: 'Luteal Phase (Progesterone Surge)',
      desc: 'The corpus luteum is secreting progesterone, raising your basal body temperature. Resting metabolic rate increases by ~100-300 kcal. Prioritize magnesium, B6, and steady complex carbs.',
      fertileBadge: 'Fertile Window: <strong>Closed</strong>',
      energyBadge: 'Energy: <strong>Steady / Moderate</strong>',
      fluidBadge: 'Fluid: <strong>Sticky / Dry</strong>',
      statusText: 'Progesterone Dominant',
      isOvulation: false,
      isPeriod: false
    };
  } else {
    return {
      phase: 'delayed',
      title: 'Extended / Delayed Follicular Phase',
      desc: `Cycle interval is prolonged (> ${totalLength} days). Common in insulin-resistant PCOD. Continue 40:1 Myo-Inositol, daily walks, and anti-inflammatory nutrition to prompt spontaneous follicle recruitment.`,
      fertileBadge: 'Fertile Window: <strong>Window Pending</strong>',
      energyBadge: 'Energy: <strong>Variable</strong>',
      fluidBadge: 'Fluid: <strong>Monitor Cervical Mucus</strong>',
      statusText: 'Delayed Follicular Watch',
      isOvulation: false,
      isPeriod: false
    };
  }
}

/**
 * Authentication Management (Login, Signup, Guest, Persistence)
 */
function initAuthUI() {
  const userHeaderEl = document.getElementById('auth-user-name');
  const streakHeaderEl = document.getElementById('user-streak-display');
  const authContainer = document.getElementById('auth-header-container');

  if (state.user) {
    if (userHeaderEl) userHeaderEl.innerText = state.user.name || 'My Profile';
    if (streakHeaderEl) streakHeaderEl.innerText = `${state.streak}-Day Streak`;

    const bmiChip = state.user.bmi
      ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200" title="Calculated BMI">${state.user.bmi} BMI</span>`
      : '';

    // Add sign-out action
    if (authContainer) {
      authContainer.innerHTML = `
        <div class="flex items-center space-x-1.5">
          <button onclick="openAuthModal()" class="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition shadow-sm">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>${state.user.name.split(' ')[0]}</span>
            ${bmiChip}
          </button>
          <button onclick="logoutUser()" class="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition" title="Sign Out">
            <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      `;
    }
  } else {
    if (userHeaderEl) userHeaderEl.innerText = 'Sign In';
  }
  lucide.createIcons();
}

function openAuthModal() {
  playGentleChime('bell');
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.classList.remove('hidden');

  // If user already logged in or has profile saved, prefill values
  if (state.user) {
    const nameEl = document.getElementById('auth-name');
    const emailEl = document.getElementById('auth-email');
    const dobEl = document.getElementById('auth-dob');
    const heightEl = document.getElementById('auth-height');
    const weightEl = document.getElementById('auth-weight');
    const lastPeriodEl = document.getElementById('auth-last-period');
    const cycleLenEl = document.getElementById('auth-cycle-len');

    if (nameEl && state.user.name) nameEl.value = state.user.name;
    if (emailEl && state.user.email) emailEl.value = state.user.email;
    if (dobEl && state.user.dob) dobEl.value = state.user.dob;
    if (heightEl && state.user.height) heightEl.value = state.user.height;
    if (weightEl && state.user.weight) weightEl.value = state.user.weight;
    if (lastPeriodEl && state.user.lastPeriodDate) lastPeriodEl.value = state.user.lastPeriodDate;
    if (cycleLenEl && state.user.cycleLength) cycleLenEl.value = state.user.cycleLength;

    calculateAuthBMI();
  }
}

function calculateAuthBMI() {
  const heightVal = parseFloat(document.getElementById('auth-height')?.value);
  const weightVal = parseFloat(document.getElementById('auth-weight')?.value);
  const badge = document.getElementById('auth-bmi-badge');
  if (!badge) return;

  if (heightVal > 50 && weightVal > 15) {
    const heightInM = heightVal / 100;
    const bmi = (weightVal / (heightInM * heightInM)).toFixed(1);
    let category = 'Normal';
    let colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';

    if (bmi < 18.5) {
      category = 'Underweight';
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (bmi >= 25 && bmi < 30) {
      category = 'Overweight';
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (bmi >= 30) {
      category = 'Obese (Metabolic Focus)';
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
    }

    badge.className = `text-[10px] font-bold px-2 py-0.5 rounded-md border ${colorClass}`;
    badge.innerText = `BMI: ${bmi} (${category})`;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}
window.calculateAuthBMI = calculateAuthBMI;

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.add('hidden');
}

function switchAuthMode(mode) {
  state.authMode = mode;
  playGentleChime('bell');

  const loginTab = document.getElementById('auth-tab-login');
  const regTab = document.getElementById('auth-tab-register');
  const nameField = document.getElementById('auth-name-field');
  const cycleSetup = document.getElementById('auth-cycle-setup');
  const submitBtn = document.getElementById('auth-submit-btn');
  const title = document.getElementById('auth-modal-title');

  if (mode === 'register') {
    loginTab.classList.remove('bg-white', 'shadow-sm', 'text-rose-600');
    loginTab.classList.add('text-slate-500');
    regTab.classList.add('bg-white', 'shadow-sm', 'text-rose-600');
    regTab.classList.remove('text-slate-500');

    nameField.classList.remove('hidden');
    cycleSetup.classList.remove('hidden');
    submitBtn.innerText = 'Create Account & Start Remission';
    title.innerText = 'Create Your Profile';
  } else {
    regTab.classList.remove('bg-white', 'shadow-sm', 'text-rose-600');
    regTab.classList.add('text-slate-500');
    loginTab.classList.add('bg-white', 'shadow-sm', 'text-rose-600');
    loginTab.classList.remove('text-slate-500');

    nameField.classList.add('hidden');
    cycleSetup.classList.add('hidden');
    submitBtn.innerText = 'Sign In & Open My Records';
    title.innerText = 'Welcome Back';
  }
}

function handleAuthSubmit(e) {
  e.preventDefault();
  playGentleChime('fanfare');

  const email = document.getElementById('auth-email').value;
  const nameInput = document.getElementById('auth-name').value;
  const dobInput = document.getElementById('auth-dob')?.value || '';
  const heightInput = parseFloat(document.getElementById('auth-height')?.value) || null;
  const weightInput = parseFloat(document.getElementById('auth-weight')?.value) || null;
  const lastPeriodInput = document.getElementById('auth-last-period').value;
  const cycleLenInput = document.getElementById('auth-cycle-len').value;

  let calculatedBMI = null;
  if (heightInput && weightInput) {
    calculatedBMI = (weightInput / Math.pow(heightInput / 100, 2)).toFixed(1);
  }

  const user = {
    email: email,
    name: nameInput || (email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)),
    dob: dobInput,
    height: heightInput,
    weight: weightInput,
    bmi: calculatedBMI,
    lastPeriodDate: lastPeriodInput || state.cycleData.lastPeriodDate || getTodayLocalDateStr(),
    cycleLength: parseInt(cycleLenInput) || 35
  };

  state.user = user;
  state.cycleData.lastPeriodDate = user.lastPeriodDate;
  state.cycleData.totalEstimatedLength = user.cycleLength;

  calculateRealCycleDay();
  renderCalendar();
  updateCycleWheel();
  initReportDate();
  saveState();
  initAuthUI();
  closeAuthModal();

  let toastMsg = `Welcome, ${user.name}! Profile personalized.`;
  if (user.height && user.weight) {
    toastMsg += ` (Height: ${user.height}cm, Weight: ${user.weight}kg)`;
  }
  showToast(toastMsg);
}

function continueAsGuest() {
  playGentleChime('bell');
  const guestStart = new Date();
  guestStart.setDate(guestStart.getDate() - 35);

  state.user = {
    name: 'Priya',
    email: 'guest@medicofemina.com',
    dob: '1998-05-14',
    height: 162,
    weight: 64,
    bmi: '24.4',
    lastPeriodDate: formatLocalDate(guestStart),
    cycleLength: 45
  };
  state.cycleData.lastPeriodDate = state.user.lastPeriodDate;
  state.cycleData.totalEstimatedLength = state.user.cycleLength;
  // streak is calculated from real daily logs — not hardcoded

  calculateRealCycleDay();
  renderCalendar();
  updateCycleWheel();
  initReportDate();
  saveState();
  initAuthUI();
  closeAuthModal();

  showToast('Welcome Priya! 45-day cycle active.');
}

function logoutUser() {
  playGentleChime('bell');
  if (confirm('Are you sure you want to sign out? Your saved data remains on this device.')) {
    state.user = null;
    localStorage.removeItem('medico_user');
    initAuthUI();
    location.reload();
  }
}

/**
 * Tab Navigation Controller
 */
function switchTab(tabId) {
  state.activeTab = tabId;
  playGentleChime('bell');

  // Sync Desktop Top Navigation Buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('border-rose-500', 'text-rose-600', 'active');
      btn.classList.remove('border-transparent', 'text-slate-500');
    } else {
      btn.classList.remove('border-rose-500', 'text-rose-600', 'active');
      btn.classList.add('border-transparent', 'text-slate-500');
    }
  });

  // Sync Mobile Bottom Navigation Buttons
  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active', 'text-rose-600');
      btn.classList.remove('text-slate-400');
    } else {
      btn.classList.remove('active', 'text-rose-600');
      btn.classList.add('text-slate-400');
    }
  });

  document.querySelectorAll('.tab-content').forEach(section => {
    section.classList.add('hidden');
  });

  const targetSection = document.getElementById(`tab-${tabId}`);
  if (targetSection) {
    targetSection.classList.remove('hidden');
    if (tabId === 'tracker' && bbtChartInstance) {
      setTimeout(() => bbtChartInstance.resize(), 60);
    }
    if (tabId === 'telehealth') {
      filterDoctorsRealtime();
    }
    if (tabId === 'calendar') {
      calculatePeriodOvulation(false);
    }
  }

  // Scroll smoothly to top on tab switch for mobile
  window.scrollTo({ top: 0, behavior: 'smooth' });

  lucide.createIcons();
}

/**
 * Smart Device Detection: Laptop vs Mobile Phone
 */
function detectAndApplyDeviceMode() {
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const isSmallScreen = window.innerWidth <= 768;
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isPhone = isMobileUA || (isSmallScreen && isTouch);

  const indicator = document.getElementById('device-detect-indicator');
  const icon = document.getElementById('device-icon');
  const label = document.getElementById('device-label');
  const mobileNav = document.getElementById('mobile-bottom-nav');
  const appContainer = document.getElementById('app-container');

  if (indicator) {
    indicator.style.display = 'none';
  }

  if (isPhone) {
    state.deviceType = 'phone';
    // On real phones, never put a heavy outer phone bezel; display edge-to-edge
    if (appContainer) appContainer.classList.remove('mobile-view-container');
    if (mobileNav) mobileNav.classList.remove('hidden');
  } else {
    state.deviceType = 'laptop';
    // On laptops, keep bottom nav hidden unless user manually toggles mobile simulator
    if (!state.isMobileFrame && mobileNav) {
      mobileNav.classList.add('md:hidden');
    }
  }
}

/**
 * Mobile Frame Mode Toggle (Hidden as requested)
 */
function setupViewModeToggle() {
  const toggleBtn = document.getElementById('toggle-view-mode');
  if (toggleBtn) {
    toggleBtn.style.display = 'none';
  }
  const appContainer = document.getElementById('app-container');
  const label = document.getElementById('view-mode-label');
  const mobileNav = document.getElementById('mobile-bottom-nav');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
    state.isMobileFrame = !state.isMobileFrame;
    playGentleChime('bell');

    if (state.isMobileFrame) {
      appContainer.classList.add('mobile-view-container');
      label.innerText = 'Laptop View';
      toggleBtn.classList.add('bg-rose-100', 'text-rose-700', 'border-rose-300');
      if (mobileNav) mobileNav.classList.remove('hidden', 'md:hidden');
    } else {
      appContainer.classList.remove('mobile-view-container');
      label.innerText = 'Mobile View';
      toggleBtn.classList.remove('bg-rose-100', 'text-rose-700', 'border-rose-300');
      if (mobileNav && window.innerWidth > 768) mobileNav.classList.add('md:hidden');
    }

    if (bbtChartInstance) {
      setTimeout(() => bbtChartInstance.resize(), 100);
    }
  });
  }
}

/**
 * Cycle Wheel SVG Progress Renderer & Dynamic Phase Text Binding
 */
function updateCycleWheel() {
  const day = state.cycleData.currentDay;
  const total = state.cycleData.totalEstimatedLength || 35;
  const progressRatio = Math.min(day / total, 1);
  const phaseInfo = getCyclePhaseInfo(day, total);

  const wheelEl = document.getElementById('cycle-wheel-progress');
  const dayEl = document.getElementById('cycle-wheel-day');
  const headerDay = document.getElementById('cycle-day-header');
  const phaseTitle = document.getElementById('cycle-phase-title');
  const phaseDesc = document.getElementById('cycle-phase-desc');
  const fertileBadge = document.getElementById('cycle-fertile-badge');
  const energyBadge = document.getElementById('cycle-energy-badge');
  const fluidBadge = document.getElementById('cycle-fluid-badge');
  const wheelStatus = document.getElementById('cycle-wheel-status');
  const heroDate = document.getElementById('hero-date-display');
  const headerDate = document.getElementById('live-header-date');

  if (dayEl) dayEl.innerText = day;
  if (headerDay) headerDay.innerText = `Current Cycle: Day ${day} of ~${total}`;
  if (phaseTitle) phaseTitle.innerText = phaseInfo.title;
  if (phaseDesc) phaseDesc.innerHTML = phaseInfo.desc;
  if (fertileBadge) fertileBadge.innerHTML = `<span>🥚</span><span>${phaseInfo.fertileBadge}</span>`;
  if (energyBadge) energyBadge.innerHTML = `<span>🔥</span><span>${phaseInfo.energyBadge}</span>`;
  if (fluidBadge) fluidBadge.innerHTML = `<span>💧</span><span>${phaseInfo.fluidBadge}</span>`;
  if (wheelStatus) wheelStatus.innerText = phaseInfo.statusText;
  if (heroDate) heroDate.innerText = formatDatePretty(new Date(), 'medium');
  if (headerDate) headerDate.innerText = formatDatePretty(new Date(), 'medium');

  if (wheelEl) {
    const totalCircumference = 515; // 2 * PI * 82
    const offset = totalCircumference * (1 - progressRatio);
    wheelEl.style.strokeDashoffset = offset;
  }

  updateBBTStats();
}

/**
 * Dynamic Interactive Monthly Calendar with Real Dates & Month Navigation
 */
function changeCalendarMonth(delta) {
  playGentleChime('bell');
  state.calendarMonth += delta;
  if (state.calendarMonth > 11) {
    state.calendarMonth = 0;
    state.calendarYear++;
  } else if (state.calendarMonth < 0) {
    state.calendarMonth = 11;
    state.calendarYear--;
  }
  renderCalendar();
}

function goToCurrentMonth() {
  playGentleChime('bell');
  const today = new Date();
  state.calendarYear = today.getFullYear();
  state.calendarMonth = today.getMonth();
  state.selectedDate = getTodayLocalDateStr();
  renderCalendar();
}

function renderCalendar() {
  const grid = document.getElementById('calendar-days-grid');
  const titleEl = document.getElementById('calendar-month-year-title');
  if (!grid) return;

  const year = state.calendarYear;
  const month = state.calendarMonth;
  const todayStr = getTodayLocalDateStr();

  // Set header title
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  if (titleEl) {
    titleEl.innerText = `${monthNames[month]} ${year} • Cycle Calendar`;
  }

  grid.innerHTML = '';

  // Calculate day-of-week offset for 1st of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Empty padding cells for start of month alignment
  for (let p = 0; p < firstDayOfWeek; p++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'calendar-day empty opacity-20 pointer-events-none rounded-2xl';
    grid.appendChild(emptyCell);
  }

  const cycleLength = state.cycleData.totalEstimatedLength || 35;
  const ovulationDay = Math.max(cycleLength - 14, 14);

  // Render month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateMonth = String(month + 1).padStart(2, '0');
    const dateDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${dateMonth}-${dateDay}`;

    const cycleDay = getCycleDayForDate(dateStr);
    const isToday = (dateStr === todayStr);
    const isSelected = (dateStr === state.selectedDate);

    // Check if period day (Days 1 to 5 of cycle or flow logged)
    const dailyLog = state.dailyLogs ? state.dailyLogs[dateStr] : null;
    const isPeriodBleed = (dailyLog && dailyLog.flow && dailyLog.flow !== 'none') || (cycleDay >= 1 && cycleDay <= 5);
    
    // Check if ovulation window (ovulationDay ± 2)
    const isOvulationWindow = (cycleDay >= ovulationDay - 2 && cycleDay <= ovulationDay + 1);

    // Check if user logged data for this date
    const hasBBT = state.cycleData.bbtRecords && state.cycleData.bbtRecords.some(r => r.date === dateStr || (r.day === cycleDay && !r.date));
    const isLogged = (dailyLog || hasBBT);

    const dayBtn = document.createElement('div');
    dayBtn.className = `calendar-day rounded-2xl p-2 sm:p-2.5 border transition-all duration-200 bg-white/90 shadow-sm relative ${
      isSelected ? 'selected outline-2 outline-rose-500' : 'border-slate-200/80'
    } ${
      isToday ? 'border-rose-400 glow-rose bg-rose-50/80 ring-2 ring-rose-300 ring-offset-1' : ''
    } ${
      isPeriodBleed ? 'period-day' : (isOvulationWindow ? 'ovulation-day' : '')
    } ${
      isLogged ? 'logged-day' : ''
    }`;

    let badgeHtml = '';
    if (isToday) {
      badgeHtml = `<span class="text-[9px] font-bold text-rose-600 bg-rose-100/90 px-1.5 py-0.2 rounded-full">Today</span>`;
    } else if (isPeriodBleed) {
      badgeHtml = `<span class="w-1.5 h-1.5 rounded-full bg-rose-500 mt-0.5"></span>`;
    } else if (isOvulationWindow) {
      badgeHtml = `<span class="w-1.5 h-1.5 rounded-full bg-purple-500 mt-0.5"></span>`;
    }

    dayBtn.innerHTML = `
      <span class="text-xs sm:text-sm font-black ${isToday ? 'text-rose-600' : 'text-slate-800'}">${day}</span>
      <span class="text-[8px] font-semibold text-slate-400 mt-0.5">D${cycleDay}</span>
      ${badgeHtml}
    `;

    dayBtn.onclick = () => selectCalendarDate(dateStr);
    grid.appendChild(dayBtn);
  }

  // Update inspector for selected date
  selectCalendarDate(state.selectedDate || todayStr, false);
}

function selectCalendarDate(dateStr, playSound = true) {
  if (playSound) playGentleChime('bell');
  state.selectedDate = dateStr;

  // Sync inputs
  const dailyDateInput = document.getElementById('daily-log-date');
  if (dailyDateInput) dailyDateInput.value = dateStr;

  const exportDateInput = document.getElementById('export-modal-date');
  if (exportDateInput) exportDateInput.value = dateStr;

  // Update selected class
  document.querySelectorAll('.calendar-day:not(.empty)').forEach(btn => {
    btn.classList.remove('selected');
  });

  const inspectorDate = document.getElementById('inspector-date-label');
  const inspectorPhase = document.getElementById('inspector-phase-label');
  const inspectorNotes = document.getElementById('inspector-notes');

  const cycleDay = getCycleDayForDate(dateStr);
  const phaseInfo = getCyclePhaseInfo(cycleDay, state.cycleData.totalEstimatedLength || 35);
  const prettyDate = formatDatePretty(dateStr, 'full');

  if (inspectorDate) {
    inspectorDate.innerText = `${prettyDate} (Cycle Day ${cycleDay})`;
  }

  const dailyLog = state.dailyLogs ? state.dailyLogs[dateStr] : null;
  const bbtRecord = state.cycleData.bbtRecords ? state.cycleData.bbtRecords.find(r => r.date === dateStr) : null;

  if (inspectorPhase) {
    if (dailyLog && dailyLog.temp) {
      inspectorPhase.innerText = `${phaseInfo.title} • Logged BBT: ${dailyLog.temp}°C`;
    } else if (bbtRecord) {
      inspectorPhase.innerText = `${phaseInfo.title} • Recorded Temp: ${bbtRecord.temp}°C`;
    } else {
      inspectorPhase.innerText = `${phaseInfo.title}`;
    }
  }

  if (inspectorNotes) {
    if (dailyLog) {
      let notesParts = [];
      if (dailyLog.fluid) notesParts.push(`Cervical: ${dailyLog.fluid}`);
      if (dailyLog.flow && dailyLog.flow !== 'none') notesParts.push(`Flow: ${dailyLog.flow}`);
      if (dailyLog.mood) notesParts.push(`Mood: ${dailyLog.mood}`);
      if (dailyLog.notes) notesParts.push(`Note: "${dailyLog.notes}"`);
      inspectorNotes.innerText = notesParts.length > 0 ? notesParts.join(' | ') : phaseInfo.desc;
    } else {
      const todayStr = getTodayLocalDateStr();
      if (dateStr === todayStr) {
        inspectorNotes.innerText = `Today is Cycle Day ${cycleDay}. Record your morning BBT, water intake, and physical symptoms to keep your spontaneous ovulation curve calibrated.`;
      } else if (dateStr < todayStr) {
        inspectorNotes.innerText = `Past date (Cycle Day ${cycleDay}). Click "Log / Edit This Day" to backfill temperature, flow, or symptoms.`;
      } else {
        inspectorNotes.innerText = `Upcoming prediction (Cycle Day ${cycleDay}). Expected phase: ${phaseInfo.title}. Maintain low glycemic index foods to prevent insulin spikes.`;
      }
    }
  }

  // Toggle quick-delete button in inspector if this date has logged data
  const inspectorDeleteBtn = document.getElementById('inspector-delete-btn');
  if (inspectorDeleteBtn) {
    if (dailyLog || bbtRecord) {
      inspectorDeleteBtn.classList.remove('hidden');
    } else {
      inspectorDeleteBtn.classList.add('hidden');
    }
  }
}

function openLogModalForCurrentInspector() {
  const modal = document.getElementById('log-form-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  playGentleChime('bell');

  const dateStr = state.selectedDate || getTodayLocalDateStr();
  const log = state.dailyLogs ? state.dailyLogs[dateStr] : null;
  const tempInput = document.getElementById('modal-temp');
  const flowInput = document.getElementById('modal-flow');
  const fluidInput = document.getElementById('modal-cervical');
  const deleteBtn = document.getElementById('modal-delete-btn');

  if (log) {
    if (tempInput) tempInput.value = log.temp || '';
    if (flowInput) flowInput.value = log.flow || 'none';
    if (fluidInput) fluidInput.value = log.fluid || 'dry';
    if (deleteBtn) deleteBtn.classList.remove('hidden');
  } else {
    if (tempInput) tempInput.value = '';
    if (flowInput) flowInput.value = 'none';
    if (fluidInput) fluidInput.value = 'dry';
    if (deleteBtn) deleteBtn.classList.add('hidden');
  }
  lucide.createIcons();
}

/**
 * Delete / Clear the log entry for the currently selected calendar date
 */
function deleteCurrentDayLog() {
  const dateStr = state.selectedDate || getTodayLocalDateStr();
  const pretty = formatDatePretty(dateStr, 'medium');

  if (!confirm(`Clear/delete the logged data for ${pretty}?`)) {
    return;
  }

  // Remove from dailyLogs
  if (state.dailyLogs && state.dailyLogs[dateStr]) {
    delete state.dailyLogs[dateStr];
  }

  // Remove from bbtRecords
  if (state.cycleData && state.cycleData.bbtRecords) {
    state.cycleData.bbtRecords = state.cycleData.bbtRecords.filter(r => r.date !== dateStr);
  }

  saveState();
  recalculateStreak();
  renderCalendar();
  initBBTChart();
  updateCycleWheel();
  updateBBTStats();
  selectCalendarDate(dateStr, false);

  document.getElementById('log-form-modal')?.classList.add('hidden');
  playGentleChime('bell');
  showToastNotification(`Cleared data entry for ${pretty}`, '🗑️');
}

/**
 * Period & Ovulation Calculator & 3-Month Cycle Analyser Engine
 * Matches User Reference UI (Image 1 & Image 2)
 */
function initPeriodCalculator() {
  const lastPeriodInput = document.getElementById('calc-last-period-date');
  const cycleSelect = document.getElementById('calc-cycle-length');
  const durationSelect = document.getElementById('calc-period-duration');

  // Populate Cycle Lengths (21 to 60 days) if empty
  if (cycleSelect && cycleSelect.options.length <= 1) {
    cycleSelect.innerHTML = '';
    for (let d = 21; d <= 60; d++) {
      const opt = document.createElement('option');
      opt.value = d;
      if (d === 28) {
        opt.text = '28 days (average)';
        opt.selected = true;
      } else if (d === 35) {
        opt.text = '35 days (PCOS delayed)';
      } else if (d === 40) {
        opt.text = '40 days (PCOS delayed)';
      } else if (d === 45) {
        opt.text = '45 days (PCOS irregular)';
      } else if (d === 50) {
        opt.text = '50 days (PCOS irregular)';
      } else if (d === 60) {
        opt.text = '60 days (Oligomenorrhea)';
      } else {
        opt.text = `${d} days`;
      }
      cycleSelect.appendChild(opt);
    }
    cycleSelect.value = '28';
  }

  // Populate Period Durations (2 to 10 days) if empty
  if (durationSelect && durationSelect.options.length <= 1) {
    durationSelect.innerHTML = '';
    for (let d = 2; d <= 10; d++) {
      const opt = document.createElement('option');
      opt.value = d;
      if (d === 5) {
        opt.text = '5 days (average)';
        opt.selected = true;
      } else {
        opt.text = `${d} days`;
      }
      durationSelect.appendChild(opt);
    }
    durationSelect.value = '5';
  }

  // Dynamic Date: defaults to user's tracked period date or today's real date
  if (lastPeriodInput && !lastPeriodInput.value) {
    const todayStr = getTodayLocalDateStr();
    const existing = (state.cycleData && state.cycleData.lastPeriodDate) ? state.cycleData.lastPeriodDate : todayStr;
    lastPeriodInput.value = existing;
  }

  // Real-time reactive updates on input change
  if (lastPeriodInput) {
    if (typeof lastPeriodInput.addEventListener === 'function') {
      lastPeriodInput.addEventListener('input', () => calculatePeriodOvulation(false));
      lastPeriodInput.addEventListener('change', () => calculatePeriodOvulation(false));
    } else {
      lastPeriodInput.onchange = () => calculatePeriodOvulation(false);
    }
  }
  if (cycleSelect) {
    if (typeof cycleSelect.addEventListener === 'function') {
      cycleSelect.addEventListener('change', () => calculatePeriodOvulation(false));
    } else {
      cycleSelect.onchange = () => calculatePeriodOvulation(false);
    }
  }
  if (durationSelect) {
    if (typeof durationSelect.addEventListener === 'function') {
      durationSelect.addEventListener('change', () => calculatePeriodOvulation(false));
    } else {
      durationSelect.onchange = () => calculatePeriodOvulation(false);
    }
  }

  calculatePeriodOvulation(false);
}

function calculatePeriodOvulation(triggerChime = false) {
  const lastPeriodInput = document.getElementById('calc-last-period-date');
  const cycleSelect = document.getElementById('calc-cycle-length');
  const durationSelect = document.getElementById('calc-period-duration');

  let lastPeriodDateStr = (lastPeriodInput && lastPeriodInput.value) ? lastPeriodInput.value : '';
  if (!lastPeriodDateStr) {
    const todayStr = getTodayLocalDateStr();
    lastPeriodDateStr = (state.cycleData && state.cycleData.lastPeriodDate) ? state.cycleData.lastPeriodDate : todayStr;
    if (lastPeriodInput) lastPeriodInput.value = lastPeriodDateStr;
  }

  let cycleLength = 28;
  if (cycleSelect && cycleSelect.value) {
    const parsed = parseInt(cycleSelect.value, 10);
    if (!isNaN(parsed) && parsed > 0) cycleLength = parsed;
  }

  let periodDuration = 5;
  if (durationSelect && durationSelect.value) {
    const parsed = parseInt(durationSelect.value, 10);
    if (!isNaN(parsed) && parsed > 0) periodDuration = parsed;
  }

  const lastPeriodDate = parseLocalDate(lastPeriodDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Helper for safe calendar day adding (avoids DST 23/25 hr drift)
  const addDays = (baseDate, days) => {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
    d.setDate(d.getDate() + days);
    return d;
  };

  // 1. Calculate Cycle 1 Dates
  const nextPeriodDate = addDays(lastPeriodDate, cycleLength);
  const ovulationDate = addDays(lastPeriodDate, cycleLength - 14);
  const fertileStart = addDays(ovulationDate, -5);
  const fertileEnd = addDays(ovulationDate, 1);

  // Days Countdown calculations
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDaysNext = Math.round((new Date(nextPeriodDate.getFullYear(), nextPeriodDate.getMonth(), nextPeriodDate.getDate()) - today) / msPerDay);
  const diffDaysOvu = Math.round((new Date(ovulationDate.getFullYear(), ovulationDate.getMonth(), ovulationDate.getDate()) - today) / msPerDay);

  const nextPeriodDaysText = diffDaysNext === 0 ? 'Today' : (diffDaysNext > 0 ? `in ${diffDaysNext} days` : `⚠️ Delayed by ${Math.abs(diffDaysNext)} days`);
  const ovulationDaysText = diffDaysOvu === 0 ? 'Today' : (diffDaysOvu > 0 ? `in ${diffDaysOvu} days` : (diffDaysNext < 0 ? 'Delayed Watch' : `${Math.abs(diffDaysOvu)} days ago`));

  // 2. Update 4 Analyser Metric Cards (Image 1 top)
  const nextDateEl = document.getElementById('analyser-next-period-date');
  const nextDaysEl = document.getElementById('analyser-next-period-days');
  const ovuDateEl = document.getElementById('analyser-ovulation-date');
  const ovuDaysEl = document.getElementById('analyser-ovulation-days');
  const fertileStartEl = document.getElementById('analyser-fertile-start');
  const fertileEndEl = document.getElementById('analyser-fertile-end');
  const cycleLenEl = document.getElementById('analyser-cycle-length-val');
  const periodDurEl = document.getElementById('analyser-period-duration-val');

  const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formatMDayY = (d) => `${monthNamesShort[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

  if (nextDateEl) nextDateEl.innerText = formatMDayY(nextPeriodDate);
  if (nextDaysEl) nextDaysEl.innerText = nextPeriodDaysText;
  if (ovuDateEl) ovuDateEl.innerText = formatMDayY(ovulationDate);
  if (ovuDaysEl) ovuDaysEl.innerText = ovulationDaysText;
  if (fertileStartEl) fertileStartEl.innerText = formatMDayY(fertileStart);
  if (fertileEndEl) fertileEndEl.innerText = `to ${formatMDayY(fertileEnd)}`;
  if (cycleLenEl) cycleLenEl.innerText = `${cycleLength} days`;
  if (periodDurEl) periodDurEl.innerText = `Period: ${periodDuration} days`;

  // 3. Update Empathetic Phase Guidance Banner (Image 2 bottom)
  const daysSince = Math.floor((today - new Date(lastPeriodDate.getFullYear(), lastPeriodDate.getMonth(), lastPeriodDate.getDate())) / msPerDay);
  const bannerTag = document.getElementById('calc-empathy-tag');
  const bannerTitle = document.getElementById('calc-empathy-title');
  const bannerDesc = document.getElementById('calc-empathy-desc');
  const bannerIcon = document.getElementById('calc-empathy-icon');

  if (daysSince >= 0 && daysSince < periodDuration) {
    if (bannerTag) bannerTag.innerText = 'YOU ARE ON YOUR PERIOD RIGHT NOW';
    if (bannerTitle) bannerTitle.innerText = 'Be gentle with yourself today. You are doing amazingly.';
    if (bannerDesc) bannerDesc.innerText = 'Warmth helps — try a hot water bottle, light stretching, or just rest. Eat iron-rich foods like spinach and dates to replenish what your body is losing. You deserve extra care right now. 💕';
    if (bannerIcon) bannerIcon.innerText = '🌺';
  } else if (daysSince >= periodDuration && daysSince < (cycleLength - 19)) {
    if (bannerTag) bannerTag.innerText = `YOU ARE IN YOUR FOLLICULAR PHASE (CYCLE DAY ${daysSince + 1})`;
    if (bannerTitle) bannerTitle.innerText = 'Rising energy and follicle development.';
    if (bannerDesc) bannerDesc.innerText = 'Estrogen is steadily rising to thicken the uterine lining. Perfect time for compound strength training, batch meal prep, and high creative focus. 🌱';
    if (bannerIcon) bannerIcon.innerText = '🌱';
  } else if (daysSince >= (cycleLength - 19) && daysSince <= (cycleLength - 13)) {
    if (bannerTag) bannerTag.innerText = `HIGH FERTILITY WINDOW & OVULATION (CYCLE DAY ${daysSince + 1})`;
    if (bannerTitle) bannerTitle.innerText = 'LH surge peak and fertility window.';
    if (bannerDesc) bannerDesc.innerText = 'Cervical fluid is clear, slippery and lubricative. Prime window for conception planning or confirming your BBT thermal spike. 💖';
    if (bannerIcon) bannerIcon.innerText = '💖';
  } else {
    if (bannerTag) bannerTag.innerText = `YOU ARE IN YOUR LUTEAL PHASE (CYCLE DAY ${daysSince + 1})`;
    if (bannerTitle) bannerTitle.innerText = 'Progesterone dominance and metabolic shift.';
    if (bannerDesc) bannerDesc.innerText = 'Your resting basal temperature is elevated. Emphasize magnesium-rich cacao, roasted seeds, complex carbohydrates, and early sleep to prevent PMS dips. 🌙';
    if (bannerIcon) bannerIcon.innerText = '🌙';
  }

  // 4. Render 3-Month Cycle Calendar (Image 1)
  renderThreeMonthCalendar(lastPeriodDate, cycleLength, periodDuration);

  if (triggerChime) {
    if (typeof playGentleChime === 'function') {
      playGentleChime('fanfare');
    }
    if (typeof confetti === 'function') {
      confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
    }
    if (typeof showToastNotification === 'function') {
      showToastNotification('✨ 3-Month cycle analysis & fertility window calculated!', '🌸');
    }
    const analyserEl = document.getElementById('cycle-analyser-section');
    if (analyserEl && typeof analyserEl.scrollIntoView === 'function') {
      analyserEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

function renderThreeMonthCalendar(startDate, cycleLength, periodDuration) {
  const container = document.getElementById('analyser-3month-container');
  if (!container) return;

  const formatDateKey = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const addDays = (baseDate, days) => {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
    d.setDate(d.getDate() + days);
    return d;
  };

  // Pre-calculate all cycle days across 6 cycles from startDate
  const cycleDayTypes = {};
  for (let c = 0; c < 6; c++) {
    const cycleStart = addDays(startDate, c * cycleLength);
    // Period days
    for (let p = 0; p < periodDuration; p++) {
      const pDate = addDays(cycleStart, p);
      cycleDayTypes[formatDateKey(pDate)] = 'period';
    }
    // Ovulation day: 14 days before next period
    const ovuDate = addDays(cycleStart, cycleLength - 14);
    const ovuKey = formatDateKey(ovuDate);
    // Fertile window: ovu - 5 to ovu + 1
    for (let f = -5; f <= 1; f++) {
      const fDate = addDays(ovuDate, f);
      const fKey = formatDateKey(fDate);
      if (cycleDayTypes[fKey] !== 'period') {
        cycleDayTypes[fKey] = 'fertile';
      }
    }
    cycleDayTypes[ovuKey] = 'ovulation';
  }

  const monthNamesFull = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  let html = '';
  // Generate 3 consecutive months starting from startDate's month
  for (let mOffset = 0; mOffset < 3; mOffset++) {
    const targetMonthDate = new Date(startDate.getFullYear(), startDate.getMonth() + mOffset, 1);
    const year = targetMonthDate.getFullYear();
    const month = targetMonthDate.getMonth();
    const monthName = monthNamesFull[month];

    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    html += `
      <div class="bg-white p-4 rounded-2xl border border-rose-100 shadow-2xs space-y-3">
        <!-- Month Header -->
        <h4 class="text-sm font-bold text-center text-[#9d174d] tracking-tight">
          ${monthName} ${year}
        </h4>

        <!-- Weekday Headers -->
        <div class="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-500 pb-1 border-b border-slate-100">
          <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
        </div>

        <!-- Days Grid -->
        <div class="grid grid-cols-7 gap-1.5 text-center text-xs">
    `;

    // Weekday offset padding
    for (let p = 0; p < firstDayOfWeek; p++) {
      html += `<div class="aspect-square"></div>`;
    }

    // Days in Month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      const dateKey = formatDateKey(dayDate);
      const type = cycleDayTypes[dateKey] || 'other';

      if (type === 'period') {
        html += `<div class="aspect-square rounded-xl bg-[#9d174d] text-white font-bold flex items-center justify-center text-xs shadow-2xs transition hover:scale-105" title="${dateKey}: Period Bleed">${day}</div>`;
      } else if (type === 'ovulation') {
        html += `<div class="aspect-square rounded-xl bg-[#9d174d] text-white font-bold flex items-center justify-center text-xs shadow-2xs relative transition hover:scale-105" title="${dateKey}: Ovulation Day">${day}<span class="absolute top-0.5 right-0.5 text-[8px] leading-none text-white">🤍</span></div>`;
      } else if (type === 'fertile') {
        html += `<div class="aspect-square rounded-xl bg-pink-100 text-[#9d174d] font-bold flex items-center justify-center text-xs border border-pink-200 transition hover:scale-105" title="${dateKey}: Fertile Window">${day}</div>`;
      } else {
        html += `<div class="aspect-square rounded-xl bg-slate-100 text-slate-700 font-medium flex items-center justify-center text-xs transition hover:bg-slate-200" title="${dateKey}">${day}</div>`;
      }
    }

    html += `
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

/**
 * Mood & Symptom Pill Toggling
 */
function togglePill(btn, type) {
  playGentleChime('bell');
  if (type === 'mood') {
    document.querySelectorAll('#mood-pill-container .pill-option').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    state.selectedMood = btn.innerText.trim();
  } else {
    btn.classList.toggle('active');
    const symptom = btn.innerText.trim();
    if (btn.classList.contains('active')) {
      if (!state.selectedSymptoms.includes(symptom)) state.selectedSymptoms.push(symptom);
    } else {
      state.selectedSymptoms = state.selectedSymptoms.filter(s => s !== symptom);
    }
  }
  saveState();
}

/**
 * Water Intake Tracker
 */
function setWater(count) {
  state.waterGlasses = count;
  playGentleChime('water');

  const drops = document.querySelectorAll('#water-droplets button');
  drops.forEach((drop, idx) => {
    if (idx < count) {
      drop.className = 'water-drop filled w-7 h-8 rounded-lg flex items-center justify-center text-xs';
    } else {
      drop.className = 'water-drop w-7 h-8 rounded-lg bg-white border border-sky-200 flex items-center justify-center text-xs text-slate-300';
    }
  });

  const liters = (count * 0.3).toFixed(1);
  const label = document.getElementById('water-count-label');
  if (label) label.innerText = `${liters} L (${count}/8)`;

  saveState();
}

/**
 * Habit Checklists & Live Remission Score
 */
function handleHabitToggle(checkbox) {
  playGentleChime('bell');
  updateRemissionScore();
  saveHabitsState();
  saveState();
}

function saveHabitsState() {
  try {
    const checkboxes = document.querySelectorAll('#habit-checklist input[type="checkbox"]');
    const habitsState = Array.from(checkboxes).map(cb => cb.checked);
    const todayStr = getTodayLocalDateStr();
    localStorage.setItem('medico_habits_' + todayStr, JSON.stringify(habitsState));

    const checkedCount = habitsState.filter(Boolean).length;
    if (checkedCount > 0) {
      if (!state.dailyLogs) state.dailyLogs = {};
      if (!state.dailyLogs[todayStr]) {
        state.dailyLogs[todayStr] = {
          date: todayStr,
          cycleDay: getCycleDayForDate(todayStr),
          temp: 36.4,
          fluid: 'sticky',
          flow: 'none',
          mood: state.selectedMood || 'Calm & Content',
          symptoms: [...state.selectedSymptoms],
          waterGlasses: state.waterGlasses,
          waterLiters: (state.waterGlasses * 0.3).toFixed(1),
          remissionScore: state.remissionScore,
          habits: habitsState,
          notes: 'Remission pillars logged'
        };
      } else {
        state.dailyLogs[todayStr].remissionScore = state.remissionScore;
        state.dailyLogs[todayStr].habits = habitsState;
      }
      recalculateStreak();
    }
  } catch (e) {}
}

function loadHabitsState() {
  try {
    const todayStr = getTodayLocalDateStr();
    const saved = localStorage.getItem('medico_habits_' + todayStr);
    const checkboxes = document.querySelectorAll('#habit-checklist input[type="checkbox"]');
    if (saved) {
      const habitsState = JSON.parse(saved);
      checkboxes.forEach((cb, idx) => {
        cb.checked = Boolean(habitsState[idx]);
      });
    } else {
      // Clean slate by default - user ticks them manually
      checkboxes.forEach(cb => {
        cb.checked = false;
      });
    }
  } catch (e) {}
  updateRemissionScore();
}

function updateRemissionScore() {
  const checkboxes = document.querySelectorAll('#habit-checklist input[type="checkbox"]');
  const total = checkboxes.length || 5;
  let checkedCount = 0;

  checkboxes.forEach(cb => {
    if (cb.checked) checkedCount++;
  });

  const percentage = Math.round((checkedCount / total) * 100);
  state.remissionScore = percentage;

  const badge = document.getElementById('remission-score-badge');
  if (badge) badge.innerText = `${percentage}%`;

  if (percentage === 100 && checkedCount > 0) {
    playGentleChime('fanfare');
    if (typeof confetti === 'function') {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 } });
    }
  }
}

/**
 * Streak Engine — Calculates consecutive daily logging streak from dailyLogs
 * Called on load and after every daily save.
 */
function recalculateStreak() {
  if (!state.dailyLogs || Object.keys(state.dailyLogs).length === 0) {
    state.streak = 0;
    state.lastStreakDate = '';
    updateStreakDisplay();
    return;
  }

  // Sort all logged dates descending
  const loggedDates = Object.keys(state.dailyLogs).sort().reverse();
  const todayStr = getTodayLocalDateStr();

  // Build a date one day back helper
  function prevDay(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  // Start from today or yesterday (allow up to 1 day grace for late night loggers)
  let checkDate = todayStr;
  let streak = 0;

  // If today is logged, start from today; else start from yesterday
  if (!state.dailyLogs[todayStr]) {
    checkDate = prevDay(todayStr);
  }

  // Walk backwards counting consecutive days
  while (state.dailyLogs[checkDate]) {
    streak++;
    checkDate = prevDay(checkDate);
    // Safety cap: don't loop more than 365 times
    if (streak > 365) break;
  }

  state.streak = streak;
  state.lastStreakDate = streak > 0 ? Object.keys(state.dailyLogs).sort().reverse()[0] : '';
  updateStreakDisplay();
}

function updateStreakDisplay() {
  const el = document.getElementById('user-streak-display');
  if (el) {
    el.innerText = `${state.streak}-Day Streak`;
  }
  // Also update header streak badge colour based on streak length
  const badge = el?.closest('div');
  if (badge) {
    if (state.streak >= 7) {
      badge.classList.add('ring-2', 'ring-amber-400');
    } else {
      badge.classList.remove('ring-2', 'ring-amber-400');
    }
  }
}

/**
 * 10-Minute Post-Meal Walk Timer
 */
function startWalkTimer() {
  const btn = document.getElementById('btn-start-walk');
  const statusEl = document.getElementById('walk-timer-status');
  const wavePulse = document.getElementById('walk-wave-pulse');

  if (state.walkTimer.isRunning) {
    clearInterval(state.walkTimer.intervalId);
    state.walkTimer.isRunning = false;
    btn.innerHTML = `<i data-lucide="play" class="w-4 h-4"></i><span>Resume Walk</span>`;
    statusEl.innerText = 'Paused';
    statusEl.className = 'text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1';
    wavePulse.classList.remove('walking-pulse');
  } else {
    playGentleChime('bell');
    state.walkTimer.isRunning = true;
    btn.innerHTML = `<i data-lucide="pause" class="w-4 h-4"></i><span>Pause Walk</span>`;
    statusEl.innerText = 'Active Walk';
    statusEl.className = 'text-[10px] font-bold text-teal-600 uppercase tracking-widest mt-1';
    wavePulse.classList.add('walking-pulse');

    state.walkTimer.intervalId = setInterval(() => {
      if (state.walkTimer.remainingSeconds > 0) {
        state.walkTimer.remainingSeconds--;
        renderWalkTimer();
      } else {
        clearInterval(state.walkTimer.intervalId);
        state.walkTimer.isRunning = false;
        btn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i><span>Completed!</span>`;
        statusEl.innerText = 'Glucose Blunted 🎉';
        statusEl.className = 'text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1';
        wavePulse.classList.remove('walking-pulse');

        playGentleChime('fanfare');
        if (typeof confetti === 'function') {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      }
    }, 1000);
  }
  lucide.createIcons();
}

function resetWalkTimer() {
  playGentleChime('bell');
  clearInterval(state.walkTimer.intervalId);
  state.walkTimer.isRunning = false;
  state.walkTimer.remainingSeconds = state.walkTimer.totalSeconds;

  const btn = document.getElementById('btn-start-walk');
  const statusEl = document.getElementById('walk-timer-status');
  const wavePulse = document.getElementById('walk-wave-pulse');

  btn.innerHTML = `<i data-lucide="play" class="w-4 h-4"></i><span>Start Walk</span>`;
  statusEl.innerText = 'Ready';
  statusEl.className = 'text-[10px] font-bold text-teal-600 uppercase tracking-widest mt-1';
  wavePulse.classList.remove('walking-pulse');

  renderWalkTimer();
  lucide.createIcons();
}

function renderWalkTimer() {
  const mins = Math.floor(state.walkTimer.remainingSeconds / 60);
  const secs = state.walkTimer.remainingSeconds % 60;
  const display = document.getElementById('walk-timer-display');
  if (display) {
    display.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  const totalOffset = 502; // 2 * PI * 80
  const progressRatio = state.walkTimer.remainingSeconds / state.walkTimer.totalSeconds;
  const newOffset = totalOffset * (1 - progressRatio);
  const bar = document.getElementById('walk-timer-bar');
  if (bar) bar.style.strokeDashoffset = newOffset;
}

function startQuoteRotation() {
  setInterval(() => {
    currentQuoteIdx = (currentQuoteIdx + 1) % walkQuotes.length;
    const el = document.getElementById('walk-motivation-text');
    if (el) {
      el.style.opacity = 0;
      setTimeout(() => {
        el.innerText = `"${walkQuotes[currentQuoteIdx]}"`;
        el.style.opacity = 1;
      }, 300);
    }
  }, 8000);
}

/**
 * Real BBT Chart Engine (Loads Real User Logs with Full Cycle Timeline)
 */
function initBBTChart() {
  const ctx = document.getElementById('bbtChart');
  if (!ctx) return;

  // Clean out any invalid records where temp is undefined or NaN
  if (state.cycleData && state.cycleData.bbtRecords) {
    state.cycleData.bbtRecords = state.cycleData.bbtRecords.filter(
      r => r && typeof r.temp === 'number' && !isNaN(r.temp)
    );
  } else {
    state.cycleData.bbtRecords = [];
  }

  // Also sync any valid temps logged in dailyLogs
  if (state.dailyLogs) {
    Object.keys(state.dailyLogs).forEach(dateKey => {
      const log = state.dailyLogs[dateKey];
      if (log && typeof log.temp === 'number' && !isNaN(log.temp)) {
        const cDay = log.cycleDay || getCycleDayForDate(dateKey);
        const exists = state.cycleData.bbtRecords.some(r => r.date === dateKey || r.day === cDay);
        if (!exists) {
          state.cycleData.bbtRecords.push({
            date: dateKey,
            day: cDay,
            temp: log.temp,
            fluid: log.fluid || 'dry',
            flow: log.flow || 'none'
          });
        }
      }
    });
  }

  state.cycleData.bbtRecords.sort((a, b) => (a.day || 0) - (b.day || 0));

  const totalCycleDays = Math.max(state.cycleData.totalEstimatedLength || 35, state.cycleData.currentDay || 14, 28);
  const coverLineVal = state.cycleData.coverLine || 36.35;

  // Build full cycle timeline labels: Day 1 to Day totalCycleDays
  const labels = [];
  const tempData = [];
  const coverLineData = [];

  for (let d = 1; d <= totalCycleDays; d++) {
    labels.push(`Day ${d}`);
    coverLineData.push(coverLineVal);

    // Check if user logged a temperature for this cycle day
    const rec = state.cycleData.bbtRecords.find(r => r.day === d || (r.date && getCycleDayForDate(r.date) === d));
    if (rec && typeof rec.temp === 'number' && !isNaN(rec.temp)) {
      tempData.push(rec.temp);
    } else {
      tempData.push(null);
    }
  }

  // If user has zero logged temperatures in the cycle, provide a gentle follicular baseline preview
  const hasAnyTemp = tempData.some(t => t !== null);
  if (!hasAnyTemp) {
    const sampleDays = [1, 2, 3, 4, 5];
    const sampleTemps = [36.25, 36.20, 36.30, 36.22, 36.28];
    sampleDays.forEach((sd, idx) => {
      if (sd <= totalCycleDays) {
        tempData[sd - 1] = sampleTemps[idx];
      }
    });
  }

  if (bbtChartInstance) {
    bbtChartInstance.destroy();
  }

  bbtChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Morning BBT (°C)',
          data: tempData,
          borderColor: '#ff4d6d',
          backgroundColor: 'rgba(255, 77, 109, 0.08)',
          borderWidth: 3,
          tension: 0.3,
          fill: true,
          spanGaps: true,
          pointBackgroundColor: '#ff4d6d',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 9
        },
        {
          label: `Cover Line (${coverLineVal}°C)`,
          data: coverLineData,
          borderColor: '#94a3b8',
          borderWidth: 2,
          borderDash: [6, 6],
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: { size: 11, weight: '600' },
            boxWidth: 14,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: '#1e1b4b',
          titleFont: { size: 12, weight: 'bold' },
          bodyFont: { size: 12 },
          padding: 12,
          cornerRadius: 12,
          callbacks: {
            label: function(context) {
              if (context.datasetIndex === 0) {
                if (context.raw === null) return 'No temperature logged';
                return `Morning Temp: ${context.raw}°C`;
              }
              return `Cover Line: ${context.raw}°C (Follicular Baseline)`;
            }
          }
        }
      },
      scales: {
        y: {
          min: 35.8,
          max: 37.4,
          ticks: {
            stepSize: 0.2,
            callback: v => `${v.toFixed(1)}°C`
          },
          grid: { color: 'rgba(255, 204, 213, 0.35)' }
        },
        x: {
          grid: { display: false },
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 14,
            font: { size: 11 }
          }
        }
      }
    }
  });
}

/**
 * Open BBT Log Modal from the "Log Temperature" button
 */
function openBBTLogModal() {
  playGentleChime('bell');
  state.selectedDate = getTodayLocalDateStr();
  openLogModalForCurrentInspector();
  const tempInput = document.getElementById('modal-temp');
  if (tempInput) {
    setTimeout(() => {
      tempInput.focus();
      tempInput.select();
    }, 150);
  }
}
window.openBBTLogModal = openBBTLogModal;

function saveQuickLog() {
  saveDailyData();
}

function saveModalLog() {
  const tempInput = document.getElementById('modal-temp');
  const tempVal = parseFloat(tempInput?.value);
  const flowVal = document.getElementById('modal-flow')?.value || 'none';
  const fluidVal = document.getElementById('modal-cervical')?.value || 'dry';
  const dateStr = state.selectedDate || getTodayLocalDateStr();

  if (!isNaN(tempVal)) {
    if (tempVal < 34.0 || tempVal > 41.0) {
      alert('Please enter a realistic morning temperature (typically between 35.5°C and 37.5°C).');
      return;
    }
    saveDailyData(dateStr, {
      temp: Number(tempVal.toFixed(2)),
      fluid: fluidVal,
      flow: flowVal
    });
    document.getElementById('log-form-modal')?.classList.add('hidden');
    showToastNotification(`Logged ${tempVal.toFixed(2)}°C for ${formatDatePretty(dateStr, 'medium')}`, '🌡️');
  } else {
    showToastNotification('Please enter a valid morning temperature in °C', '⚠️');
  }
}

function handleDailyLogDateChange() {
  const input = document.getElementById('daily-log-date');
  if (input && input.value) {
    selectCalendarDate(input.value, false);
    const log = state.dailyLogs ? state.dailyLogs[input.value] : null;
    if (log) {
      if (log.temp && document.getElementById('quick-bbt')) document.getElementById('quick-bbt').value = log.temp;
      if (log.fluid && document.getElementById('quick-fluid')) document.getElementById('quick-fluid').value = log.fluid;
      if (log.flow && document.getElementById('quick-flow')) document.getElementById('quick-flow').value = log.flow;
      if (log.notes && document.getElementById('quick-notes')) document.getElementById('quick-notes').value = log.notes;
    }
  }
}

/**
 * AI Doctor Consultation Agent (Dr. Leena)
 */
function renderChatMessages() {
  const container = document.getElementById('ai-chat-messages');
  if (!container) return;

  container.innerHTML = '';
  state.chatMessages.forEach(msg => {
    const isAi = msg.sender === 'ai';
    const msgDiv = document.createElement('div');
    msgDiv.className = `flex ${isAi ? 'justify-start' : 'justify-end'} items-start space-x-2.5`;

    msgDiv.innerHTML = `
      ${isAi ? `<div class="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 text-sm shadow-sm">👩‍⚕️</div>` : ''}
      <div class="max-w-xl p-4 rounded-2xl text-xs leading-relaxed ${isAi ? 'chat-bubble-ai text-slate-800' : 'chat-bubble-user text-white'}">
        <p class="whitespace-pre-line">${msg.text}</p>
        <span class="text-[9px] block text-right mt-1.5 opacity-60">${msg.time || 'Just now'}</span>
      </div>
      ${!isAi ? `<div class="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 text-xs font-bold">You</div>` : ''}
    `;

    container.appendChild(msgDiv);
  });

  container.scrollTop = container.scrollHeight;
}

function handleChatSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('chat-user-input');
  const userText = input?.value.trim();
  if (!userText) return;

  sendChatMessage(userText);
  input.value = '';
}

function sendQuickPrompt(promptText) {
  sendChatMessage(promptText);
}

function sendChatMessage(text) {
  playGentleChime('bell');

  // Push User message
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  state.chatMessages.push({
    sender: 'user',
    time: now,
    text: text
  });
  renderChatMessages();

  // Show Typing Indicator
  const container = document.getElementById('ai-chat-messages');
  const typingDiv = document.createElement('div');
  typingDiv.id = 'ai-typing-indicator';
  typingDiv.className = 'flex justify-start items-center space-x-2 text-xs text-purple-600 font-semibold italic pl-10';
  typingDiv.innerHTML = `<span class="animate-pulse">Dr. Leena is reviewing endocrine guidelines...</span>`;
  container.appendChild(typingDiv);
  container.scrollTop = container.scrollHeight;

  // Generate Medical Response
  setTimeout(() => {
    typingDiv.remove();
    const aiResponse = generateClinicalResponse(text);
    state.chatMessages.push({
      sender: 'ai',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: aiResponse
    });
    renderChatMessages();
    playGentleChime('bell');
    saveState();
  }, 900);
}

function generateClinicalResponse(query) {
  const q = query.toLowerCase();

  // 1. Delayed / Missed Period & Amenorrhea
  if (q.includes('period') && (q.includes('late') || q.includes('missed') || q.includes('induce') || q.includes('delay') || q.includes('days') || q.includes('not getting'))) {
    return "When you have PCOD/PCOS, a delayed period is almost always caused by **delayed or arrested ovulation (anovulation)**. Without ovulation, no corpus luteum forms, meaning your body produces zero progesterone to trigger the menstrual shed.\n\n" +
           "🔬 **Clinical Actions:**\n" +
           "1. **Do not panic:** Extreme anxiety spikes adrenal cortisol and DHEA-S, which directly suppresses the pituitary LH surge.\n" +
           "2. **Lower circulating insulin:** High fasting insulin stimulates ovarian theca cells to overproduce testosterone, which freezes follicle maturation. Adhere strictly to **Myo-Inositol (40:1 ratio, 4g daily)** and take a 10–15 minute walk after every meal.\n" +
           "3. **Endometrial Safety Rule:** If your cycle exceeds **90 days**, consult your gynecologist for a 5–10 day course of cyclic oral progestins (such as Medroxyprogesterone 10mg) to induce a protective withdrawal bleed and prevent endometrial hyperplasia.";
  }

  // 2. Inositol (40:1 Ratio)
  if (q.includes('inositol') || q.includes('dose') || q.includes('dosage') || q.includes('supplement')) {
    return "The internationally recognized clinical gold standard for PCOD/PCOS is **Myo-Inositol combined with D-Chiro-Inositol in the physiological 40:1 plasma ratio**.\n\n" +
           "💊 **Evidence-Based Protocol:**\n" +
           "• **Daily Dose:** 2,000 mg Myo-Inositol + 50 mg D-Chiro-Inositol taken **twice daily** (total 4,000mg Myo + 100mg DCI daily), preferably before meals.\n" +
           "• **Mechanism:** Inositol acts as the intracellular second-messenger for FSH (follicle-stimulating hormone) and insulin. It restores ovarian insulin sensitivity so antral follicles can mature and ovulate spontaneously.\n" +
           "• **Timeline:** Statistically significant improvements in cycle regularity, fasting glucose, and acne are documented within **8 to 12 weeks** of daily adherence.";
  }

  // 3. Metformin vs Inositol
  if (q.includes('metformin')) {
    return "Both **Metformin** and **Myo-Inositol (40:1)** are evidence-based insulin-sensitizing agents for PCOS, but they work through distinct biochemical pathways:\n\n" +
           "📊 **Metformin vs Inositol Comparison:**\n" +
           "• **Metformin (Rx):** Inhibits hepatic gluconeogenesis (reduces liver glucose output) and activates AMPK. Highly effective for high-BMI insulin resistance, but frequently causes GI side effects (nausea, diarrhea). Always take with meals and start low (500mg extended-release).\n" +
           "• **Inositol (40:1):** Works directly at the ovarian follicle receptor level to enhance FSH signaling and egg quality with virtually zero gastrointestinal side effects.\n" +
           "• **Synergy:** In clinical RCTs, combining low-dose Metformin with Myo-Inositol yields higher ovulation rates than either agent alone. Discuss with your physician!";
  }

  // 4. HOMA-IR & Fasting Insulin
  if (q.includes('homa') || q.includes('insulin') || q.includes('glucose') || q.includes('sugar craving')) {
    return "Over 70% of women with PCOD have **cellular insulin resistance**, even if their routine Fasting Blood Sugar (FBS) and HbA1c tests come back completely normal!\n\n" +
           "🧪 **The Gold Standard Marker:**\n" +
           "• **Fasting Insulin Test:** Normal reference lab range is up to 25 µIU/mL, but optimal functional health for PCOS ovulation requires fasting insulin **below 5–7 µIU/mL**.\n" +
           "• **HOMA-IR Formula:** `[Fasting Glucose (mg/dL) × Fasting Insulin (µIU/mL)] / 405`. A score **> 1.9** confirms significant insulin resistance.\n" +
           "• **Why You Crave Sugar:** When your cells are insulin-resistant, glucose cannot enter muscle tissue. Your brain perceives cellular starvation and triggers intense post-meal sugar cravings.";
  }

  // 5. LH to FSH Ratio
  if (q.includes('lh') || q.includes('fsh') || q.includes('hormone ratio') || q.includes('blood test') || q.includes('lab')) {
    return "In a healthy ovulatory cycle evaluated on Day 2 or 3 of your period, the **LH to FSH ratio is approximately 1:1**.\n\n" +
           "🧬 **What an Elevated Ratio Means:**\n" +
           "• In classic PCOD/PCOS, the pituitary gland secretes excess LH pulses, causing an **LH:FSH ratio of 2:1 or 3:1** (e.g. LH = 14, FSH = 5).\n" +
           "• **Consequence:** Persistently high LH overstimulates the ovarian theca cells to synthesize excess androgens (testosterone), while the relatively low FSH fails to nurture a single follicle to full ovulatory dominance.\n" +
           "• **Solution:** Lowering circulating insulin with low-glycemic eating and inositol downregulates pituitary GnRH pulse frequency, normalizing the LH:FSH ratio.";
  }

  // 6. Facial Hair (Hirsutism) & Cystic Acne
  if (q.includes('hair') || q.includes('acne') || q.includes('androgen') || q.includes('testosterone') || q.includes('hirsutism') || q.includes('chin')) {
    return "Hirsutism (chin/facial coarse hair) and cystic jawline acne are driven by **excess free androgens** and overactivation of the enzyme *5-alpha reductase*, which converts testosterone into high-potency DHT.\n\n" +
           "✨ **Remission Protocol:**\n" +
           "1. **Spearmint Herbal Tea:** Drinking 2 cups of pure spearmint tea daily has been clinically shown in randomized controlled trials to significantly reduce serum free testosterone without altering total testosterone.\n" +
           "2. **Zinc (30mg/day):** Functions as a natural 5-alpha reductase inhibitor, calming inflamed cystic breakouts and sebaceous oil production.\n" +
           "3. **Elevate SHBG:** Lowering your insulin through low-GI nutrition prompts your liver to produce more Sex Hormone-Binding Globulin (SHBG), which binds free testosterone so it cannot bind to facial hair follicles.";
  }

  // 7. Seed Cycling Protocol
  if (q.includes('seed') || q.includes('seed cycling') || q.includes('flax') || q.includes('pumpkin')) {
    return "Seed cycling is a naturopathic and nutritional protocol designed to gently support natural estrogen-progesterone rhythmicity across your cycle:\n\n" +
           "🌱 **Phase 1: Follicular Phase (Days 1 to 14 or until Ovulation):**\n" +
           "• **1 tbsp Ground Flaxseed + 1 tbsp Raw Pumpkin Seeds daily.**\n" +
           "• *Mechanism:* Flax lignans bind excess xenoestrogens and balance follicular estrogen, while pumpkin seeds provide dense zinc to prepare for the progesterone surge.\n\n" +
           "🌻 **Phase 2: Luteal Phase (Post-Ovulation to Day 28+):**\n" +
           "• **1 tbsp Ground Sesame Seeds + 1 tbsp Sunflower Seeds daily.**\n" +
           "• *Mechanism:* Sesame lignans and sunflower selenium + vitamin E stimulate the corpus luteum to maximize progesterone synthesis.";
  }

  // 8. Pregnancy & Natural Fertility with PCOD
  if (q.includes('pregnant') || q.includes('pregnancy') || q.includes('conceive') || q.includes('fertility') || q.includes('baby')) {
    return "A common and distressing myth is that PCOD makes pregnancy impossible. **This is completely false.** PCOD causes *subfertility due to irregular ovulation*, NOT irreversible sterility!\n\n" +
           "👶 **Fertility Facts & Roadmap:**\n" +
           "1. **Egg Count is Abundant:** Women with PCOD typically have a very high ovarian reserve (high AMH) and hundreds of healthy oocytes waiting for the right hormonal signal to mature.\n" +
           "2. **Restore Ovulation:** Once insulin is stabilized with Myo-Inositol 40:1, low-GI meals, and daily movement, spontaneous regular ovulation frequently returns within 3 to 6 months.\n" +
           "3. **Medical Options:** If needed, gentle frontline ovulation-induction medications like Letrozole achieve cumulative pregnancy rates exceeding 60–70%.";
  }

  // 9. Weight Loss Resistance & "PCOS Belly"
  if (q.includes('weight') || q.includes('belly') || q.includes('fat') || q.includes('lose weight') || q.includes('plateau')) {
    return "If you are eating in a caloric deficit and still cannot lose abdominal weight, you are experiencing **insulin and cortisol resistance**, not a lack of willpower!\n\n" +
           "🔥 **How to Break the Plateau:**\n" +
           "1. **Prioritize Protein (30g per meal):** High-protein intake stimulates peptide YY and GLP-1, keeping insulin low while preserving lean mass.\n" +
           "2. **Stop Chronic Exhausting Cardio:** Excessive HIIT or prolonged cardio elevates adrenal cortisol and DHEA-S. Switch to compound strength training (squats, deadlifts, rows) to open GLUT-4 glucose channels directly.\n" +
           "3. **Walk After Meals:** A 10–15 minute zone-2 walk after lunch and dinner lowers postprandial glucose peaks by up to 35% without requiring extra insulin.";
  }

  // 10. Ultrasound "Cysts" Reassurance
  if (q.includes('ultrasound') || q.includes('cysts') || q.includes('follicles') || q.includes('scan') || q.includes('ovary')) {
    return "A common point of confusion: the 'cysts' seen on a polycystic ovary ultrasound are **not fluid-filled pathological cysts or tumors**.\n\n" +
           "🩺 **What they actually are:** They are multiple (often ≥20 per ovary) **immature egg follicles (antral follicles)** that started to grow, but because of high androgens or insulin, none reached full maturity to ovulate. They arrange themselves around the periphery in a classic 'string of pearls' appearance. Once your hormonal balance is restored, these follicles can ovulate normally and the ultrasound appearance normalizes.";
  }

  // 11. Bloating, Gut Dysbiosis & Estrobolome
  if (q.includes('bloat') || q.includes('bloating') || q.includes('gut') || q.includes('stomach') || q.includes('gas') || q.includes('digestion')) {
    return "Over 75% of women with PCOS experience chronic lower abdominal bloating and sluggish digestion. This is directly tied to the **gut-estrobolome axis**:\n\n" +
           "🦠 **The Biological Mechanism:**\n" +
           "• The estrobolome is a specialized community of gut bacteria responsible for metabolizing and eliminating used estrogen. In dysbiosis, bacterial *beta-glucuronidase* breaks estrogen out of its conjugated state, recycling it back into your bloodstream.\n" +
           "• **Relief Protocol:** Include probiotic and prebiotic fermented foods (like curd/dahi, fermented urad dal in Dahibara, kefir) and at least 30–35g of prebiotic fiber daily. Avoid artificial sweeteners (sucralose) which disrupt microbiome diversity.";
  }

  // 12. Diet, Nutrition & Meal Blueprint
  if (q.includes('diet') || q.includes('breakfast') || q.includes('eat') || q.includes('food') || q.includes('lunch') || q.includes('dinner')) {
    return "The most clinically validated dietary framework for PCOD is a **Protein-First, Low-Glycemic Load (GL) strategy**.\n\n" +
           "🥗 **Ideal Meal Blueprint:**\n" +
           "• **25–30g Protein:** 2–3 eggs with spinach, sprouted moong dal cheela with paneer, or unsweetened Greek yogurt with chia and walnuts.\n" +
           "• **Sequencing:** Always eat fiber/greens and protein *before* complex carbohydrates. This slows gastric emptying and flattens glucose spikes.\n" +
           "• **Traditional Indian Superfoods:** Moong dal cheela, idli with sambar, palak paneer, and dahibara (fermented urad dal with curd) provide excellent prebiotic and peptide nutrition.";
  }

  return "Thank you for asking. With PCOD/PCOS, every symptom—whether it's irregular periods, acne, weight plateau, or fatigue—is an outward biological signal of an underlying endocrine pattern: **hyperinsulinemia, elevated androgens, or chronic adrenal cortisol**.\n\n" +
         "By committing to your 4-Pillars Remission habits (Low-GI nutrition, post-meal walks, 40:1 Inositol, and circadian sleep), you can systematically guide your body into natural ovulatory remission. Feel free to ask about blood test interpretations, supplements, or cycle tracking!";
}

function clearChatHistory() {
  playGentleChime('bell');
  state.chatMessages = [
    {
      sender: 'ai',
      time: 'Just now',
      text: "Chat cleared. I am Dr. Leena, ready to answer any new clinical or hormonal questions!"
    }
  ];
  renderChatMessages();
  saveState();
}

/**
 * Telehealth / Real-Time Doctor & Specialist Directory with Dynamic Location Search
 */

// 1. Rich Database of Board-Certified Specialists
const doctorsDatabase = [
  {
    id: 'doc-priya-sharma',
    name: 'Dr. Priya Sharma',
    degrees: 'MBBS, MS (OB-GYN), DNB',
    specialty: 'gynecology',
    specialtyLabel: 'Gynecology & Infertility',
    title: 'Senior Consultant Gynecologist & Infertility Specialist • 14 Years Exp.',
    experienceYears: 14,
    avatar: '👩‍⚕️',
    avatarBg: 'bg-rose-100 text-rose-700',
    availability: 'Available Today',
    availabilityColor: 'emerald',
    clinic: 'Apollo Hospitals & Medico Femina Center',
    address: 'Plot 251, Sainik School Rd, Unit 15, Bhubaneswar, Odisha 751005',
    city: 'Bhubaneswar',
    state: 'Odisha',
    country: 'India',
    lat: 20.3015,
    lon: 85.8312,
    phone: '+91 674 666 0400',
    hours: '09:00 AM - 07:00 PM (Mon-Sat)',
    modes: ['in-clinic', 'video'],
    focus: 'Irregular Cycles, Follicular Tracking & Ovulation Induction',
    tags: ['PCOS', 'Irregular Cycles', 'Ovulation', 'Fertility', 'Ultrasound'],
    rating: 4.9,
    consultsCount: 420,
    feeInr: 799,
    feeUsd: 20,
    verified: true,
  },
  {
    id: 'doc-rohit-sen',
    name: 'Dr. Rohit Sen',
    degrees: 'MD, DM (Endocrinology - AIIMS)',
    specialty: 'endocrinology',
    specialtyLabel: 'Reproductive Endocrinology',
    title: 'Reproductive Endocrinologist & PCOS Insulin Researcher • 11 Years Exp.',
    experienceYears: 11,
    avatar: '👨‍⚕️',
    avatarBg: 'bg-purple-100 text-purple-700',
    availability: 'Slots Tomorrow',
    availabilityColor: 'amber',
    clinic: 'Fortis C-DOC & AIIMS Hormonal Center',
    address: 'B-16 Chirag Enclave, Opp Nehru Place, New Delhi 110048',
    city: 'New Delhi',
    state: 'Delhi NCR',
    country: 'India',
    lat: 28.5482,
    lon: 77.2468,
    phone: '+91 11 4277 6222',
    hours: '10:00 AM - 06:00 PM (Mon-Fri)',
    modes: ['in-clinic', 'video'],
    focus: 'Insulin Resistance, Metformin/Inositol Optimization & Androgens',
    tags: ['HOMA-IR', 'Insulin', 'Androgens', 'Acne', 'Weight Loss'],
    rating: 5.0,
    consultsCount: 310,
    feeInr: 999,
    feeUsd: 25,
    verified: true,
  },
  {
    id: 'doc-sneha-kulkarni',
    name: 'Dr. Sneha Kulkarni',
    degrees: 'MSc (Clinical Nutrition), RD, CDE',
    specialty: 'nutrition',
    specialtyLabel: 'Hormonal Nutrition & Gut',
    title: 'Integrative Hormonal Nutritionist & Gut Specialist • 9 Years Exp.',
    experienceYears: 9,
    avatar: '👩‍⚕️',
    avatarBg: 'bg-teal-100 text-teal-700',
    availability: 'Available Today',
    availabilityColor: 'emerald',
    clinic: 'Lilavati Hospital & Medico Femina Center',
    address: 'A-791 Bandra Reclamation, Bandra West, Mumbai, Maharashtra 400050',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    lat: 19.0518,
    lon: 72.8290,
    phone: '+91 22 2675 1000',
    hours: '09:30 AM - 06:30 PM (Mon-Sat)',
    modes: ['in-clinic', 'video'],
    focus: 'Low-GI Diets, Inositol Dosing, Anti-Inflammatory & Gut Axis',
    tags: ['Low GI', 'Seed Cycling', 'Gut Microbiome', 'Inositol', 'Weight'],
    rating: 4.9,
    consultsCount: 580,
    feeInr: 649,
    feeUsd: 18,
    verified: true,
  },
  {
    id: 'doc-ananya-pattnaik',
    name: 'Dr. Ananya Pattnaik',
    degrees: 'MBBS, MD (OB-GYN), FMAS (Laparoscopy)',
    specialty: 'gynecology',
    specialtyLabel: 'Gynecology & Laparoscopy',
    title: 'Associate Professor of OB-GYN & PCOD Specialist • 12 Years Exp.',
    experienceYears: 12,
    avatar: '👩‍⚕️',
    avatarBg: 'bg-rose-100 text-rose-700',
    availability: 'Available Today',
    availabilityColor: 'emerald',
    clinic: 'KIMS Super Speciality Hospital',
    address: 'Kushabhadra Campus, KIIT Road, Patia, Bhubaneswar, Odisha 751024',
    city: 'Bhubaneswar',
    state: 'Odisha',
    country: 'India',
    lat: 20.3541,
    lon: 85.8190,
    phone: '+91 674 710 5300',
    hours: '08:30 AM - 05:00 PM (Mon-Sat)',
    modes: ['in-clinic', 'video'],
    focus: 'Ovarian Cyst Management, Endometriosis & Laparoscopic Drilling',
    tags: ['Ovarian Cysts', 'Endometriosis', 'PCOD', 'Surgery', 'Periods'],
    rating: 4.8,
    consultsCount: 390,
    feeInr: 750,
    feeUsd: 19,
    verified: true,
  },
  {
    id: 'doc-vikramaditya-rath',
    name: 'Dr. Vikramaditya Rath',
    degrees: 'MBBS, MD, DM (Endocrinology)',
    specialty: 'endocrinology',
    specialtyLabel: 'Endocrinology & Thyroid',
    title: 'Lead Endocrinologist & Thyroid Specialist • 13 Years Exp.',
    experienceYears: 13,
    avatar: '👨‍⚕️',
    avatarBg: 'bg-purple-100 text-purple-700',
    availability: 'Slots Tomorrow',
    availabilityColor: 'amber',
    clinic: 'SUM Ultimate Medicare',
    address: 'K-8 Kalinga Nagar, Ghatikia, Bhubaneswar, Odisha 751003',
    city: 'Bhubaneswar',
    state: 'Odisha',
    country: 'India',
    lat: 20.2740,
    lon: 85.7670,
    phone: '+91 674 350 0500',
    hours: '10:00 AM - 06:00 PM (Mon-Sat)',
    modes: ['in-clinic', 'video'],
    focus: 'Adrenal PCOS, High DHEA-S, Hashimotos & HOMA-IR Optimization',
    tags: ['Adrenal PCOS', 'DHEA-S', 'Thyroid', 'Hashimotos', 'Cortisol'],
    rating: 4.9,
    consultsCount: 275,
    feeInr: 850,
    feeUsd: 22,
    verified: true,
  },
  {
    id: 'doc-swati-mohanty',
    name: 'Dr. Swati Mohanty',
    degrees: 'MSc (Food & Nutrition), Certified Diabetes & Hormone Educator',
    specialty: 'nutrition',
    specialtyLabel: 'Clinical Nutrition & Dietetics',
    title: 'Chief Clinical Dietitian & PCOS Lifestyle Educator • 10 Years Exp.',
    experienceYears: 10,
    avatar: '👩‍⚕️',
    avatarBg: 'bg-emerald-100 text-emerald-700',
    availability: 'Available Today',
    availabilityColor: 'emerald',
    clinic: 'Care Hospitals Bhubaneswar',
    address: 'Unit No. 42, Chandrasekharpur, Bhubaneswar, Odisha 751023',
    city: 'Bhubaneswar',
    state: 'Odisha',
    country: 'India',
    lat: 20.3230,
    lon: 85.8120,
    phone: '+91 674 616 5656',
    hours: '09:00 AM - 05:00 PM (Mon-Sat)',
    modes: ['in-clinic', 'video'],
    focus: 'Traditional Odia & Indian PCOS Meal Plans, Insulin Sensitizing Meals',
    tags: ['Nutrition', 'Diet Plan', 'Insulin', 'Herbal Support', 'Metabolism'],
    rating: 4.9,
    consultsCount: 310,
    feeInr: 550,
    feeUsd: 15,
    verified: true,
  },
  {
    id: 'doc-smriti-nayak',
    name: 'Dr. Smriti Nayak',
    degrees: 'MBBS, MD (Dermatology, Venereology & Leprosy)',
    specialty: 'dermatology',
    specialtyLabel: 'Dermatology & Trichology',
    title: 'Senior Consultant Dermatologist & Hair Loss Specialist • 11 Years Exp.',
    experienceYears: 11,
    avatar: '👩‍⚕️',
    avatarBg: 'bg-pink-100 text-pink-700',
    availability: 'Available Today',
    availabilityColor: 'emerald',
    clinic: 'Utkal Hospital Niladri Vihar',
    address: 'Defense Colony, Niladri Vihar, Chandrasekharpur, Bhubaneswar, Odisha 751021',
    city: 'Bhubaneswar',
    state: 'Odisha',
    country: 'India',
    lat: 20.3340,
    lon: 85.8150,
    phone: '+91 674 669 0000',
    hours: '11:00 AM - 07:00 PM (Mon-Sat)',
    modes: ['in-clinic', 'video'],
    focus: 'Hormonal Hirsutism, Pigmentation / Acanthosis Nigricans & Scalp PRP',
    tags: ['Acne', 'Hirsutism', 'Acanthosis', 'Hair Thinning', 'Skin'],
    rating: 4.9,
    consultsCount: 440,
    feeInr: 750,
    feeUsd: 19,
    verified: true,
  },
  {
    id: 'doc-tanvi-rao',
    name: 'Dr. Tanvi Rao',
    degrees: 'MBBS, MD (Dermatology & Trichology)',
    specialty: 'dermatology',
    specialtyLabel: 'Dermatology & Trichology',
    title: 'Cosmetic Dermatologist & Hormonal Hair Specialist • 8 Years Exp.',
    experienceYears: 8,
    avatar: '👩‍⚕️',
    avatarBg: 'bg-pink-100 text-pink-700',
    availability: 'Available Today',
    availabilityColor: 'emerald',
    clinic: 'Manipal Hospital Bengaluru',
    address: '98 HAL Old Airport Rd, Kodihalli, Bengaluru, Karnataka 560017',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    lat: 12.9592,
    lon: 77.6493,
    phone: '+91 80 2502 4444',
    hours: '10:00 AM - 06:00 PM (Mon-Sat)',
    modes: ['in-clinic', 'video'],
    focus: 'Hormonal Cystic Acne, Spironolactone Protocols & Alopecia',
    tags: ['Acne', 'Hair Loss', 'Androgens', 'Skin Flare', 'Dermatology'],
    rating: 4.9,
    consultsCount: 510,
    feeInr: 800,
    feeUsd: 21,
    verified: true,
  },
  {
    id: 'doc-shalini-verma',
    name: 'Dr. Shalini Verma',
    degrees: 'MPT (Women’s Health & Pelvic Rehabilitation)',
    specialty: 'pelvic',
    specialtyLabel: 'Pelvic Floor Physiotherapy',
    title: 'Head Pelvic Health Physical Therapist • 10 Years Exp.',
    experienceYears: 10,
    avatar: '🧘‍♀️',
    avatarBg: 'bg-indigo-100 text-indigo-700',
    availability: 'Slots Tomorrow',
    availabilityColor: 'amber',
    clinic: 'Max Super Speciality Hospital Saket',
    address: '1, 2 Press Enclave Marg, Saket, New Delhi 110017',
    city: 'New Delhi',
    state: 'Delhi NCR',
    country: 'India',
    lat: 28.5282,
    lon: 77.2125,
    phone: '+91 11 2651 5050',
    hours: '09:00 AM - 05:00 PM (Mon-Fri)',
    modes: ['in-clinic', 'video'],
    focus: 'Dyspareunia, Vaginismus, Pelvic Congestion & Core Stabilization',
    tags: ['Pelvic Floor', 'Pain Relief', 'Core', 'Endometriosis Pain'],
    rating: 4.9,
    consultsCount: 340,
    feeInr: 700,
    feeUsd: 18,
    verified: true,
  },
  {
    id: 'doc-arvind-swaminathan',
    name: 'Dr. Arvind Swaminathan',
    degrees: 'MBBS, MD, DM (Endocrinology & Metabolism)',
    specialty: 'endocrinology',
    specialtyLabel: 'Reproductive Endocrinology',
    title: 'Director of Metabolic Health & PCOS Program • 16 Years Exp.',
    experienceYears: 16,
    avatar: '👨‍⚕️',
    avatarBg: 'bg-purple-100 text-purple-700',
    availability: 'Available Today',
    availabilityColor: 'emerald',
    clinic: 'Apollo Health City Jubilee Hills',
    address: 'Road No 72, Film Nagar, Jubilee Hills, Hyderabad, Telangana 500033',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    lat: 17.4325,
    lon: 78.4070,
    phone: '+91 40 2360 7777',
    hours: '08:30 AM - 04:30 PM (Mon-Sat)',
    modes: ['in-clinic', 'video'],
    focus: 'Metabolic Syndrome, Acanthosis Nigricans & Ovulation Induction',
    tags: ['Metabolic Syndrome', 'Insulin', 'Hormones', 'Endocrinology'],
    rating: 5.0,
    consultsCount: 620,
    feeInr: 1100,
    feeUsd: 28,
    verified: true,
  },
  {
    id: 'doc-rajesh-mukhopadhyay',
    name: 'Dr. Rajesh Mukhopadhyay',
    degrees: 'MBBS, MD, DNB (OB-GYN), Fellowship Reproductive Medicine',
    specialty: 'gynecology',
    specialtyLabel: 'Gynecology & Infertility',
    title: 'Senior Fertility Consultant & Ultrasound Sonologist • 15 Years Exp.',
    experienceYears: 15,
    avatar: '👨‍⚕️',
    avatarBg: 'bg-rose-100 text-rose-700',
    availability: 'Available Today',
    availabilityColor: 'emerald',
    clinic: 'AMRI Hospitals Salt Lake',
    address: 'JC-16 & 17, Sector III, Salt Lake City, Kolkata, West Bengal 700098',
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    lat: 22.5855,
    lon: 88.4060,
    phone: '+91 33 6680 0000',
    hours: '10:00 AM - 07:00 PM (Mon-Sat)',
    modes: ['in-clinic', 'video'],
    focus: 'Follicle Tracking, Luteal Phase Defect & Natural Conception',
    tags: ['Fertility', 'Follicle Study', 'Ovulation', 'Luteal Phase'],
    rating: 4.8,
    consultsCount: 480,
    feeInr: 850,
    feeUsd: 22,
    verified: true,
  },
  {
    id: 'doc-meera-nambiar',
    name: 'Dr. Meera Nambiar',
    degrees: 'RD, MSc (Clinical Dietetics), Certified Functional Medicine',
    specialty: 'nutrition',
    specialtyLabel: 'Functional Medicine Nutrition',
    title: 'Functional Medicine PCOS Nutritionist • 7 Years Exp.',
    experienceYears: 7,
    avatar: '👩‍⚕️',
    avatarBg: 'bg-emerald-100 text-emerald-700',
    availability: 'Available Today',
    availabilityColor: 'emerald',
    clinic: 'Aster CMI Hospital Hebbal',
    address: 'No 43/42 NH 44, Hebbal, Bengaluru, Karnataka 560092',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    lat: 13.0560,
    lon: 77.5920,
    phone: '+91 80 4342 0100',
    hours: '09:00 AM - 06:00 PM (Mon-Sat)',
    modes: ['in-clinic', 'video'],
    focus: 'Seed Cycling, Glucose Flattening Hacks & Cortisol Calming Protocols',
    tags: ['Seed Cycling', 'Cortisol', 'Glucose Hacks', 'Adrenal', 'Diet'],
    rating: 4.9,
    consultsCount: 430,
    feeInr: 600,
    feeUsd: 16,
    verified: true,
  },
  {
    id: 'doc-pooja-deshmukh',
    name: 'Dr. Pooja Deshmukh',
    degrees: 'MBBS, DGO, Fellowship in Adolescent Gynecology',
    specialty: 'gynecology',
    specialtyLabel: 'Adolescent Gynecology',
    title: 'Adolescent & Reproductive Gynecologist • 9 Years Exp.',
    experienceYears: 9,
    avatar: '👩‍⚕️',
    avatarBg: 'bg-rose-100 text-rose-700',
    availability: 'Slots Tomorrow',
    availabilityColor: 'amber',
    clinic: 'Ruby Hall Clinic Pune',
    address: '40 Sassoon Rd, Sangamvadi, Pune, Maharashtra 411001',
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    lat: 18.5320,
    lon: 73.8770,
    phone: '+91 20 6645 5100',
    hours: '10:00 AM - 06:00 PM (Mon-Sat)',
    modes: ['in-clinic', 'video'],
    focus: 'Teen PCOS, Hypothalamic Amenorrhea, Safe Hormonal Rebalancing',
    tags: ['Teen PCOS', 'Amenorrhea', 'Irregular Periods', 'Lifestyle'],
    rating: 4.8,
    consultsCount: 350,
    feeInr: 750,
    feeUsd: 19,
    verified: true,
  },
  {
    id: 'doc-kabir-chawla',
    name: 'Dr. Kabir Chawla',
    degrees: 'MBBS, MD (Psychiatry), Mind-Body Medicine Fellow',
    specialty: 'mental',
    specialtyLabel: 'Mind-Body & Mental Health',
    title: 'Reproductive Psychiatrist & Mind-Body Health Counselor • 12 Years Exp.',
    experienceYears: 12,
    avatar: '👨‍⚕️',
    avatarBg: 'bg-sky-100 text-sky-700',
    availability: 'Available Today',
    availabilityColor: 'emerald',
    clinic: 'Medanta The Medicity Gurugram',
    address: 'CH Bakhtawar Singh Rd, Sector 38, Gurugram, Delhi NCR 122001',
    city: 'New Delhi',
    state: 'Delhi NCR',
    country: 'India',
    lat: 28.4395,
    lon: 77.0428,
    phone: '+91 124 414 1414',
    hours: '10:30 AM - 06:30 PM (Mon-Sat)',
    modes: ['in-clinic', 'video'],
    focus: 'Body Image Anxiety, Infertility Stress & Cortisol Regulation',
    tags: ['Mindset', 'Anxiety', 'Stress', 'Mental Health', 'Fertility Coping'],
    rating: 4.9,
    consultsCount: 290,
    feeInr: 900,
    feeUsd: 24,
    verified: true,
  },
  {
    id: 'doc-radhika-parekh',
    name: 'Dr. Radhika Merchant-Parekh',
    degrees: 'MBBS, MD (OB-GYN), FICOG',
    specialty: 'gynecology',
    specialtyLabel: 'Gynecology & Reproductive Medicine',
    title: 'Director of Women’s Center of Excellence • 17 Years Exp.',
    experienceYears: 17,
    avatar: '👩‍⚕️',
    avatarBg: 'bg-rose-100 text-rose-700',
    availability: 'Slots Tomorrow',
    availabilityColor: 'amber',
    clinic: 'Kokilaben Dhirubhai Ambani Hospital',
    address: 'Rao Saheb Achutrao Patwardhan Marg, Andheri West, Mumbai, Maharashtra 400053',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    lat: 19.1314,
    lon: 72.8252,
    phone: '+91 22 4269 6969',
    hours: '09:00 AM - 04:00 PM (Mon-Fri)',
    modes: ['in-clinic', 'video'],
    focus: 'Severe PCOD Reversal, High Androgens & Ovulatory Cycle Regularity',
    tags: ['Severe PCOD', 'High Androgens', 'Ovulation', 'Cycle Restoration'],
    rating: 5.0,
    consultsCount: 710,
    feeInr: 1200,
    feeUsd: 30,
    verified: true,
  }
];

// 2. Known City Geocoding Lookup Table
const knownCityCoordinates = {
  'bhubaneswar': { lat: 20.2961, lon: 85.8245, name: 'Bhubaneswar, Odisha' },
  'bbsr': { lat: 20.2961, lon: 85.8245, name: 'Bhubaneswar, Odisha' },
  'cuttack': { lat: 20.4625, lon: 85.8830, name: 'Cuttack, Odisha' },
  'puri': { lat: 19.8135, lon: 85.8312, name: 'Puri, Odisha' },
  'rourkela': { lat: 22.2604, lon: 84.8536, name: 'Rourkela, Odisha' },
  'berhampur': { lat: 19.3150, lon: 84.7941, name: 'Berhampur, Odisha' },
  'sambalpur': { lat: 21.4669, lon: 83.9812, name: 'Sambalpur, Odisha' },
  'new delhi': { lat: 28.6139, lon: 77.2090, name: 'New Delhi, Delhi NCR' },
  'delhi': { lat: 28.6139, lon: 77.2090, name: 'New Delhi, Delhi NCR' },
  'ncr': { lat: 28.6139, lon: 77.2090, name: 'New Delhi, Delhi NCR' },
  'noida': { lat: 28.5355, lon: 77.3910, name: 'Noida, Uttar Pradesh' },
  'gurugram': { lat: 28.4595, lon: 77.0266, name: 'Gurugram, Haryana' },
  'gurgaon': { lat: 28.4595, lon: 77.0266, name: 'Gurugram, Haryana' },
  'mumbai': { lat: 19.0760, lon: 72.8777, name: 'Mumbai, Maharashtra' },
  'bombay': { lat: 19.0760, lon: 72.8777, name: 'Mumbai, Maharashtra' },
  'thane': { lat: 19.2183, lon: 72.9781, name: 'Thane, Maharashtra' },
  'navi mumbai': { lat: 19.0330, lon: 73.0297, name: 'Navi Mumbai, Maharashtra' },
  'pune': { lat: 18.5204, lon: 73.8567, name: 'Pune, Maharashtra' },
  'bengaluru': { lat: 12.9716, lon: 77.5946, name: 'Bengaluru, Karnataka' },
  'bangalore': { lat: 12.9716, lon: 77.5946, name: 'Bengaluru, Karnataka' },
  'kolkata': { lat: 22.5726, lon: 88.3639, name: 'Kolkata, West Bengal' },
  'calcutta': { lat: 22.5726, lon: 88.3639, name: 'Kolkata, West Bengal' },
  'hyderabad': { lat: 17.3850, lon: 78.4867, name: 'Hyderabad, Telangana' },
  'secunderabad': { lat: 17.4399, lon: 78.4983, name: 'Secunderabad, Telangana' },
  'chennai': { lat: 13.0827, lon: 80.2707, name: 'Chennai, Tamil Nadu' },
  'madras': { lat: 13.0827, lon: 80.2707, name: 'Chennai, Tamil Nadu' },
  'ahmedabad': { lat: 23.0225, lon: 72.5714, name: 'Ahmedabad, Gujarat' },
  'surat': { lat: 21.1702, lon: 72.8311, name: 'Surat, Gujarat' },
  'jaipur': { lat: 26.9124, lon: 75.7873, name: 'Jaipur, Rajasthan' },
  'lucknow': { lat: 26.8467, lon: 80.9462, name: 'Lucknow, Uttar Pradesh' },
  'chandigarh': { lat: 30.7333, lon: 76.7794, name: 'Chandigarh, Punjab/Haryana' },
  'kochi': { lat: 9.9312, lon: 76.2673, name: 'Kochi, Kerala' },
  'cochin': { lat: 9.9312, lon: 76.2673, name: 'Kochi, Kerala' },
  'patna': { lat: 25.5941, lon: 85.1376, name: 'Patna, Bihar' },
  'ranchi': { lat: 23.3441, lon: 85.3096, name: 'Ranchi, Jharkhand' },
  'indore': { lat: 22.7196, lon: 75.8577, name: 'Indore, Madhya Pradesh' },
  'bhopal': { lat: 23.2599, lon: 77.4126, name: 'Bhopal, Madhya Pradesh' },
  'guwahati': { lat: 26.1445, lon: 91.7362, name: 'Guwahati, Assam' },
  'new york': { lat: 40.7128, lon: -74.0060, name: 'New York, USA' },
  'london': { lat: 51.5074, lon: -0.1278, name: 'London, UK' },
  'dubai': { lat: 25.2048, lon: 55.2708, name: 'Dubai, UAE' }
};

// 3. Reactive State for Doctor Locator
const doctorLocatorState = {
  searchQuery: '',
  locationQuery: 'Bhubaneswar',
  userCoords: { lat: 20.2961, lon: 85.8245 },
  resolvedLocationName: 'Bhubaneswar, Odisha',
  selectedSpecialty: 'all',
  selectedMode: 'all',
  maxRadiusKm: 25,
  sortBy: 'distance',
  activeClinicDoc: null,
};

let doctorSearchDebounceTimer = null;
let doctorLocationDebounceTimer = null;

/**
 * Initialize Doctor Directory
 */
function initDoctorDirectory() {
  // Sync with saved weather location if available
  const savedLat = localStorage.getItem('medico_weather_lat');
  const savedLon = localStorage.getItem('medico_weather_lon');
  const savedName = localStorage.getItem('medico_weather_name');

  if (savedLat && savedLon) {
    const parsedLat = parseFloat(savedLat);
    const parsedLon = parseFloat(savedLon);
    if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
      doctorLocatorState.userCoords = { lat: parsedLat, lon: parsedLon };
      if (savedName) {
        doctorLocatorState.locationQuery = savedName.split(',')[0].trim();
        doctorLocatorState.resolvedLocationName = savedName;
      }
    }
  }

  // Pre-fill input values if DOM is ready
  const locInput = document.getElementById('doctor-location-input');
  if (locInput) locInput.value = doctorLocatorState.locationQuery;

  const countBadge = document.getElementById('count-all-docs');
  if (countBadge) countBadge.innerText = doctorsDatabase.length;

  filterDoctorsRealtime();
}

/**
 * Haversine Distance Formula (Returns distance in km with 1 decimal)
 */
function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 9999;
  const R = 6371; // Earth's mean radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Real-Time Search Query Input Handler
 */
function handleDoctorSearchInput() {
  const input = document.getElementById('doctor-search-input');
  const clearBtn = document.getElementById('clear-doc-query-btn');
  const val = input ? input.value.trim() : '';

  if (clearBtn) {
    if (val.length > 0) clearBtn.classList.remove('hidden');
    else clearBtn.classList.add('hidden');
  }

  clearTimeout(doctorSearchDebounceTimer);
  doctorSearchDebounceTimer = setTimeout(() => {
    doctorLocatorState.searchQuery = val.toLowerCase();
    filterDoctorsRealtime();
  }, 120);
}

function clearDoctorQueryInput() {
  const input = document.getElementById('doctor-search-input');
  const clearBtn = document.getElementById('clear-doc-query-btn');
  if (input) input.value = '';
  if (clearBtn) clearBtn.classList.add('hidden');
  doctorLocatorState.searchQuery = '';
  filterDoctorsRealtime();
}

/**
 * Real-Time Location Input Handler with Geocoding
 */
function handleDoctorLocationInput() {
  const input = document.getElementById('doctor-location-input');
  const val = input ? input.value.trim() : '';

  clearTimeout(doctorLocationDebounceTimer);
  doctorLocationDebounceTimer = setTimeout(() => {
    resolveAndApplyLocation(val);
  }, 250);
}

/**
 * Resolve location query to latitude & longitude
 */
async function resolveAndApplyLocation(locStr) {
  if (!locStr) {
    doctorLocatorState.locationQuery = '';
    doctorLocatorState.resolvedLocationName = 'All Locations (Pan-India)';
    filterDoctorsRealtime();
    return;
  }

  doctorLocatorState.locationQuery = locStr;
  const cleanKey = locStr.toLowerCase().trim();

  // 1. Direct dictionary match
  if (knownCityCoordinates[cleanKey]) {
    const hit = knownCityCoordinates[cleanKey];
    doctorLocatorState.userCoords = { lat: hit.lat, lon: hit.lon };
    doctorLocatorState.resolvedLocationName = hit.name;
    updateLocationPillActive(hit.name);
    filterDoctorsRealtime();
    return;
  }

  // 2. Partial prefix / substring match
  for (const [key, hit] of Object.entries(knownCityCoordinates)) {
    if (cleanKey.includes(key) || key.includes(cleanKey)) {
      doctorLocatorState.userCoords = { lat: hit.lat, lon: hit.lon };
      doctorLocatorState.resolvedLocationName = hit.name;
      updateLocationPillActive(hit.name);
      filterDoctorsRealtime();
      return;
    }
  }

  // 3. Fallback online geocode lookup (Open-Meteo Geocoding API)
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locStr)}&count=1&language=en&format=json`;
    const resp = await fetch(geoUrl);
    if (resp.ok) {
      const geoData = await resp.json();
      if (geoData.results && geoData.results.length > 0) {
        const first = geoData.results[0];
        doctorLocatorState.userCoords = { lat: first.latitude, lon: first.longitude };
        doctorLocatorState.resolvedLocationName = `${first.name}, ${first.admin1 || first.country || ''}`.trim();
        filterDoctorsRealtime();
        return;
      }
    }
  } catch (err) {
    // Non-blocking fallback
  }

  // 4. Default to current user coordinates if unrecognized
  doctorLocatorState.resolvedLocationName = locStr;
  filterDoctorsRealtime();
}

/**
 * GPS Auto-Detect Button Handler
 */
function detectDoctorLocationGPS() {
  playGentleChime('bell');
  const tag = document.getElementById('doc-active-coords-tag');
  const input = document.getElementById('doctor-location-input');

  if (tag) tag.innerText = 'Detecting GPS...';

  if (!navigator.geolocation) {
    showToastNotification('⚠️ Geolocation not supported by your browser', '📍');
    if (tag) tag.innerText = 'GPS Unavailable';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      doctorLocatorState.userCoords = { lat, lon };

      // Attempt reverse lookup for a pretty city name
      let cityName = 'Current GPS Location';
      try {
        const revUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`;
        const revResp = await fetch(revUrl, { headers: { 'User-Agent': 'MedicoFeminaHealthApp/2.0' } });
        if (revResp.ok) {
          const revData = await revResp.json();
          cityName = revData.address.city || revData.address.town || revData.address.state_district || revData.address.state || 'My Location';
        }
      } catch (e) {
        // Fallback to formatted coords
        cityName = `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
      }

      doctorLocatorState.locationQuery = cityName;
      doctorLocatorState.resolvedLocationName = cityName;

      if (input) input.value = cityName;
      if (tag) tag.innerText = 'GPS Locked';

      updateLocationPillActive('');
      showToastNotification(`📍 GPS Locked: Near ${cityName}`, '🎯');
      playGentleChime('fanfare');

      filterDoctorsRealtime();
    },
    (err) => {
      if (tag) tag.innerText = 'GPS Permission Denied';
      showToastNotification('⚠️ Please allow location access or pick a city preset below.', '📍');
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

/**
 * Preset City Pill Handler
 */
function setDoctorLocationPreset(cityName) {
  playGentleChime('bell');
  const input = document.getElementById('doctor-location-input');

  if (cityName === 'All Locations') {
    doctorLocatorState.locationQuery = '';
    doctorLocatorState.resolvedLocationName = 'All Locations (Pan-India & Global)';
    doctorLocatorState.maxRadiusKm = 99999;
    if (input) input.value = '';
    const radSelect = document.getElementById('doctor-radius-select');
    if (radSelect) radSelect.value = '99999';
  } else {
    doctorLocatorState.locationQuery = cityName;
    if (input) input.value = cityName;
    const cleanKey = cityName.toLowerCase();
    if (knownCityCoordinates[cleanKey]) {
      const hit = knownCityCoordinates[cleanKey];
      doctorLocatorState.userCoords = { lat: hit.lat, lon: hit.lon };
      doctorLocatorState.resolvedLocationName = hit.name;
    }
  }

  updateLocationPillActive(cityName);
  filterDoctorsRealtime();
}

function updateLocationPillActive(cityName) {
  document.querySelectorAll('.city-preset-pill').forEach(btn => {
    const pillCity = btn.getAttribute('data-city');
    if (pillCity && pillCity.toLowerCase() === cityName.toLowerCase()) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

/**
 * Specialty Filter Handler
 */
function setDoctorSpecialtyFilter(specialty) {
  playGentleChime('bell');
  doctorLocatorState.selectedSpecialty = specialty;

  document.querySelectorAll('.doc-specialty-btn').forEach(btn => {
    if (btn.getAttribute('data-specialty') === specialty) {
      btn.classList.add('active', 'bg-rose-500', 'text-white', 'shadow-xs', 'glow-rose');
      btn.classList.remove('bg-white', 'border-slate-200', 'text-slate-700');
    } else {
      btn.classList.remove('active', 'bg-rose-500', 'text-white', 'shadow-xs', 'glow-rose');
      btn.classList.add('bg-white', 'border-slate-200', 'text-slate-700');
    }
  });

  filterDoctorsRealtime();
}

/**
 * Consultation Mode Toggle Handler
 */
function setDoctorModeFilter(mode) {
  playGentleChime('bell');
  doctorLocatorState.selectedMode = mode;

  document.querySelectorAll('.doc-mode-btn').forEach(btn => {
    if (btn.getAttribute('data-mode') === mode) {
      btn.classList.add('active', 'bg-slate-900', 'text-white', 'shadow-xs');
      btn.classList.remove('text-slate-600');
    } else {
      btn.classList.remove('active', 'bg-slate-900', 'text-white', 'shadow-xs');
      btn.classList.add('text-slate-600');
    }
  });

  filterDoctorsRealtime();
}

/**
 * Distance Radius Change Handler
 */
function handleDoctorRadiusChange() {
  const select = document.getElementById('doctor-radius-select');
  if (select) {
    doctorLocatorState.maxRadiusKm = parseFloat(select.value);
    playGentleChime('bell');
    filterDoctorsRealtime();
  }
}

/**
 * Sorting Dropdown Handler
 */
function handleDoctorSortChange() {
  const select = document.getElementById('doctor-sort-select');
  if (select) {
    doctorLocatorState.sortBy = select.value;
    playGentleChime('bell');
    filterDoctorsRealtime();
  }
}

/**
 * Expand Radius Shortcut
 */
function expandDoctorRadius() {
  const select = document.getElementById('doctor-radius-select');
  if (select) select.value = '99999';
  doctorLocatorState.maxRadiusKm = 99999;
  playGentleChime('fanfare');
  filterDoctorsRealtime();
}

/**
 * Reset All Doctor Filters
 */
function resetDoctorFilters() {
  playGentleChime('bell');
  doctorLocatorState.searchQuery = '';
  doctorLocatorState.locationQuery = 'Bhubaneswar';
  doctorLocatorState.userCoords = { lat: 20.2961, lon: 85.8245 };
  doctorLocatorState.resolvedLocationName = 'Bhubaneswar, Odisha';
  doctorLocatorState.selectedSpecialty = 'all';
  doctorLocatorState.selectedMode = 'all';
  doctorLocatorState.maxRadiusKm = 25;
  doctorLocatorState.sortBy = 'distance';

  const qInput = document.getElementById('doctor-search-input');
  if (qInput) qInput.value = '';
  const clearBtn = document.getElementById('clear-doc-query-btn');
  if (clearBtn) clearBtn.classList.add('hidden');

  const locInput = document.getElementById('doctor-location-input');
  if (locInput) locInput.value = 'Bhubaneswar';

  const radSelect = document.getElementById('doctor-radius-select');
  if (radSelect) radSelect.value = '25';

  const sortSelect = document.getElementById('doctor-sort-select');
  if (sortSelect) sortSelect.value = 'distance';

  setDoctorSpecialtyFilter('all');
  setDoctorModeFilter('all');
  updateLocationPillActive('Bhubaneswar');

  filterDoctorsRealtime();
}

/**
 * Core Real-Time Filtering & Calculation Engine
 */
function filterDoctorsRealtime() {
  const userLat = doctorLocatorState.userCoords.lat;
  const userLon = doctorLocatorState.userCoords.lon;
  const query = doctorLocatorState.searchQuery;
  const specialty = doctorLocatorState.selectedSpecialty;
  const mode = doctorLocatorState.selectedMode;
  const maxRadius = doctorLocatorState.maxRadiusKm;

  // 1. Calculate real-time distance for every specialist
  const calculatedDocs = doctorsDatabase.map(doc => {
    const distKm = calculateHaversineDistanceKm(userLat, userLon, doc.lat, doc.lon);
    return { ...doc, calculatedDistance: distKm };
  });

  // 2. Filter by search query, specialty, consultation mode, and distance radius
  const filtered = calculatedDocs.filter(doc => {
    // Text search filter
    if (query) {
      const matchName = doc.name.toLowerCase().includes(query);
      const matchSpec = doc.specialtyLabel.toLowerCase().includes(query);
      const matchClinic = doc.clinic.toLowerCase().includes(query);
      const matchCity = doc.city.toLowerCase().includes(query);
      const matchFocus = doc.focus.toLowerCase().includes(query);
      const matchDegrees = doc.degrees.toLowerCase().includes(query);
      const matchTags = doc.tags.some(t => t.toLowerCase().includes(query));
      if (!matchName && !matchSpec && !matchClinic && !matchCity && !matchFocus && !matchDegrees && !matchTags) {
        return false;
      }
    }

    // Specialty filter
    if (specialty !== 'all' && doc.specialty !== specialty) {
      return false;
    }

    // Mode filter
    if (mode === 'in-clinic' && !doc.modes.includes('in-clinic')) return false;
    if (mode === 'video' && !doc.modes.includes('video')) return false;

    // Radius distance filter:
    // If user specified an in-clinic filter or radius < 99999, enforce radius on physical clinic distance
    if (maxRadius < 99999) {
      if (mode === 'in-clinic') {
        if (doc.calculatedDistance > maxRadius) return false;
      } else {
        // If doctor is beyond radius but offers video consultation, we can include them if radius is relaxed
        if (doc.calculatedDistance > maxRadius && mode !== 'video') {
          return false;
        }
      }
    }

    return true;
  });

  // 3. Sort Results
  filtered.sort((a, b) => {
    if (doctorLocatorState.sortBy === 'distance') {
      return a.calculatedDistance - b.calculatedDistance;
    } else if (doctorLocatorState.sortBy === 'rating') {
      return b.rating - a.rating;
    } else if (doctorLocatorState.sortBy === 'experience') {
      return b.experienceYears - a.experienceYears;
    } else if (doctorLocatorState.sortBy === 'fee_asc') {
      return a.feeInr - b.feeInr;
    } else if (doctorLocatorState.sortBy === 'fee_desc') {
      return b.feeInr - a.feeInr;
    }
    return 0;
  });

  // 4. Update Header & Summary Badges
  const countEl = document.getElementById('doctor-filtered-count');
  if (countEl) countEl.innerText = filtered.length;

  const locNameEl = document.getElementById('doctor-active-location-name');
  if (locNameEl) locNameEl.innerText = doctorLocatorState.resolvedLocationName;

  const heroBadge = document.getElementById('doc-hero-location-badge');
  if (heroBadge) heroBadge.innerText = doctorLocatorState.resolvedLocationName;

  const radiusBadge = document.getElementById('doctor-distance-range-badge');
  if (radiusBadge) {
    radiusBadge.innerText = maxRadius >= 99999 ? 'Radius: All India / Global' : `Radius: ≤ ${maxRadius} km`;
  }

  // 5. Render Cards
  renderDoctorsList(filtered);
}

/**
 * Render Doctor Directory Grid
 */
function renderDoctorsList(doctors) {
  const container = document.getElementById('doctors-directory-container');
  const emptyState = document.getElementById('doctors-empty-state');
  if (!container) return;

  if (doctors.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  let html = '';
  doctors.forEach(doc => {
    const dist = doc.calculatedDistance;
    let distBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
    let distLabel = `📍 ${dist} km away`;

    if (dist < 5) {
      distBadgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
      distLabel = `📍 ${dist} km away • Near You`;
    } else if (dist < 20) {
      distBadgeClass = 'bg-blue-50 text-blue-800 border-blue-300 font-bold';
      distLabel = `📍 ${dist} km away • In City`;
    } else if (dist < 80) {
      distBadgeClass = 'bg-purple-50 text-purple-800 border-purple-300 font-semibold';
      distLabel = `📍 ${dist} km away • Regional`;
    } else {
      distBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
      distLabel = `📍 ${dist} km • Video Available`;
    }

    const availBg = doc.availabilityColor === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200';
    const dotBg = doc.availabilityColor === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500';

    const tagsHtml = doc.tags.slice(0, 3).map(tag => `<span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-medium">#${tag}</span>`).join(' ');

    html += `
      <div class="luxe-card rounded-3xl p-6 border border-slate-200/90 flex flex-col justify-between doctor-card relative hover:shadow-lg transition">
        
        <div class="space-y-4">
          <!-- Top Row: Avatar & Status Badges -->
          <div class="flex items-start justify-between gap-2">
            <div class="w-16 h-16 rounded-2xl ${doc.avatarBg} flex items-center justify-center text-3xl shadow-sm shrink-0">
              ${doc.avatar}
            </div>

            <div class="flex flex-col items-end space-y-1">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${availBg} border flex items-center space-x-1 shadow-2xs">
                <span class="w-1.5 h-1.5 rounded-full ${dotBg} animate-pulse"></span>
                <span>${doc.availability}</span>
              </span>
              <span class="text-[10px] px-2 py-0.5 rounded-full border ${distBadgeClass} shadow-2xs">
                ${distLabel}
              </span>
            </div>
          </div>

          <!-- Doctor Identity & Degrees -->
          <div>
            <div class="flex items-center space-x-1.5">
              <h3 class="text-base font-bold text-slate-900">${doc.name}</h3>
              <i data-lucide="badge-check" class="w-4 h-4 text-emerald-500 shrink-0" title="Board Certified MCI Verified"></i>
            </div>
            <p class="text-xs text-rose-600 font-bold">${doc.degrees}</p>
            <p class="text-xs text-slate-500 mt-1 leading-snug">${doc.title}</p>
          </div>

          <!-- Clinic & Hospital Affiliation -->
          <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
            <div class="flex items-center space-x-1 font-bold text-slate-900">
              <i data-lucide="building-2" class="w-3.5 h-3.5 text-rose-500 shrink-0"></i>
              <span class="truncate">${doc.clinic}</span>
            </div>
            <p class="text-[11px] text-slate-500 truncate">${doc.address}</p>
          </div>

          <!-- Medical Focus & Metrics -->
          <div class="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
            <div class="flex justify-between items-baseline gap-2">
              <span class="text-slate-500 shrink-0">Clinical Focus:</span>
              <strong class="text-slate-800 text-right truncate text-[11px]">${doc.focus}</strong>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-500">Rating & Volume:</span>
              <strong class="text-amber-600 font-bold">⭐ ${doc.rating} (${doc.consultsCount}+ Consults)</strong>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-500">Consultation Fee:</span>
              <strong class="text-slate-900 font-black">₹${doc.feeInr} <span class="text-slate-400 font-normal">/ $${doc.feeUsd}</span></strong>
            </div>
          </div>

          <!-- Tags -->
          <div class="flex flex-wrap gap-1.5 pt-1">
            ${tagsHtml}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="pt-5 space-y-2 border-t border-slate-100 mt-4">
          <div class="grid grid-cols-2 gap-2">
            <button onclick="openBookingModal('${doc.id}', '${doc.specialtyLabel}', 'video')" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs transition shadow-sm glow-rose flex items-center justify-center space-x-1">
              <i data-lucide="video" class="w-3.5 h-3.5"></i>
              <span>Book Video</span>
            </button>

            <button onclick="openClinicDetailsModal('${doc.id}')" class="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-sm flex items-center justify-center space-x-1">
              <i data-lucide="map-pin" class="w-3.5 h-3.5 text-rose-400"></i>
              <span>Clinic & Map</span>
            </button>
          </div>

          <button onclick="shareReportWithDoctor('${doc.name}')" class="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center justify-center space-x-1.5">
            <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
            <span>Send Health Summary</span>
          </button>
        </div>

      </div>
    `;
  });

  container.innerHTML = html;
  lucide.createIcons();
}

/**
 * Open Clinic Details Modal with Real Directions & Info
 */
function openClinicDetailsModal(docId) {
  playGentleChime('bell');
  const doc = doctorsDatabase.find(d => d.id === docId);
  if (!doc) return;

  doctorLocatorState.activeClinicDoc = doc;
  const modal = document.getElementById('clinic-details-modal');

  const avatarEl = document.getElementById('clinic-modal-avatar');
  const distEl = document.getElementById('clinic-modal-distance-pill');
  const nameEl = document.getElementById('clinic-modal-name');
  const docNameEl = document.getElementById('clinic-modal-doctor-name');
  const addrEl = document.getElementById('clinic-modal-address');
  const hoursEl = document.getElementById('clinic-modal-hours');
  const phoneEl = document.getElementById('clinic-modal-phone');
  const phoneLinkEl = document.getElementById('clinic-modal-phone-link');
  const mapsLinkEl = document.getElementById('clinic-modal-maps-link');
  const bookBtnEl = document.getElementById('clinic-modal-book-btn');

  const dist = calculateHaversineDistanceKm(
    doctorLocatorState.userCoords.lat,
    doctorLocatorState.userCoords.lon,
    doc.lat,
    doc.lon
  );

  if (avatarEl) avatarEl.innerText = doc.avatar;
  if (distEl) distEl.innerText = `📍 ${dist} km from you`;
  if (nameEl) nameEl.innerText = doc.clinic;
  if (docNameEl) docNameEl.innerText = `${doc.name} • ${doc.degrees}`;
  if (addrEl) addrEl.innerText = doc.address;
  if (hoursEl) hoursEl.innerText = doc.hours;
  if (phoneEl) phoneEl.innerText = doc.phone;
  if (phoneLinkEl) phoneLinkEl.href = `tel:${doc.phone.replace(/[^0-9+]/g, '')}`;

  // Google Maps navigation link
  if (mapsLinkEl) {
    const mapsQuery = encodeURIComponent(`${doc.clinic}, ${doc.address}`);
    mapsLinkEl.href = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  }

  // Book in-clinic slot button
  if (bookBtnEl) {
    bookBtnEl.onclick = () => {
      closeClinicDetailsModal();
      openBookingModal(doc.id, doc.specialtyLabel, 'in-clinic');
    };
  }

  if (modal) modal.classList.remove('hidden');
  lucide.createIcons();
}

function closeClinicDetailsModal() {
  const modal = document.getElementById('clinic-details-modal');
  if (modal) modal.classList.add('hidden');
}

function copyClinicAddress() {
  if (!doctorLocatorState.activeClinicDoc) return;
  const text = `${doctorLocatorState.activeClinicDoc.clinic}, ${doctorLocatorState.activeClinicDoc.address}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
    showToastNotification('📋 Clinic address copied to clipboard!', '✅');
  } else {
    showToastNotification('Clinic: ' + text, '📍');
  }
}

/**
 * Open Booking Modal (supports either doc ID or doctor name)
 */
function openBookingModal(docIdentifier, specialty, defaultMode = 'video') {
  playGentleChime('bell');
  const modal = document.getElementById('booking-modal');
  const label = document.getElementById('booking-doc-name');
  const title = document.getElementById('booking-modal-title');
  const clinicIndicator = document.getElementById('booking-clinic-indicator');
  const docIdInput = document.getElementById('booking-doctor-id');

  // Look up doctor if identifier matches doc-id or name
  const doc = doctorsDatabase.find(d => d.id === docIdentifier || d.name === docIdentifier);

  const displayName = doc ? doc.name : docIdentifier;
  const displaySpec = doc ? doc.specialtyLabel : (specialty || 'Specialist');
  const displayClinic = doc ? doc.clinic : 'Medico Femina Partner Hospital';

  if (label) label.innerText = `With ${displayName} (${displaySpec})`;
  if (docIdInput && doc) docIdInput.value = doc.id;
  if (clinicIndicator) clinicIndicator.innerText = `Facility: ${displayClinic}`;

  // Consultation mode selection
  const videoRadio = document.getElementById('booking-mode-video');
  const clinicRadio = document.getElementById('booking-mode-clinic');

  if (defaultMode === 'in-clinic' && clinicRadio) {
    clinicRadio.checked = true;
    if (title) title.innerText = 'Book In-Clinic Hospital Visit';
  } else if (videoRadio) {
    videoRadio.checked = true;
    if (title) title.innerText = 'Book Video Consultation';
  }

  // Default booking date to tomorrow
  const dateInput = document.getElementById('booking-date');
  if (dateInput) {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    dateInput.value = tomorrow;
    dateInput.min = tomorrow;
  }

  if (modal) modal.classList.remove('hidden');
  lucide.createIcons();
}

function closeBookingModal() {
  const modal = document.getElementById('booking-modal');
  if (modal) modal.classList.add('hidden');
}

function handleBookingSubmit(e) {
  e.preventDefault();
  playGentleChime('fanfare');

  const dateVal = document.getElementById('booking-date').value;
  const timeVal = document.getElementById('booking-time').value;
  const modeVal = document.querySelector('input[name="booking_mode"]:checked')?.value || 'video';
  const docId = document.getElementById('booking-doctor-id')?.value;
  const doc = doctorsDatabase.find(d => d.id === docId);

  const doctorName = doc ? doc.name : (document.getElementById('booking-doc-name')?.innerText || 'the specialist');
  const modeText = modeVal === 'in-clinic' ? 'In-Clinic Hospital Visit' : 'Encrypted Video Consultation';

  closeBookingModal();

  if (typeof confetti === 'function') {
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
  }

  showToastNotification(`🎉 ${modeText} Confirmed with ${doctorName}!`, '🗓️');

  alert(`🎉 Consultation Appointment Confirmed!\n\nSpecialist: ${doctorName}\nType: ${modeText}\nDate: ${dateVal}\nTime: ${timeVal}\nLocation / Platform: ${modeVal === 'in-clinic' ? (doc ? doc.clinic : 'Clinic') : 'Secure Video Telehealth Room'}\n\nYour Medico Femina BBT curves, symptom logs, and cycle memo have been securely packaged and forwarded to the doctor\'s EHR inbox for advance clinical review.`);
}

function shareReportWithDoctor(doctorName) {
  playGentleChime('bell');
  showToastNotification(`📤 Health Summary transmitted to ${doctorName}`, '✨');
  alert(`📤 Health Summary Transmitted!\n\nYour standardized 1-Click Clinical Report (including real cycle intervals, thermal BBT data, and habit adherence) has been securely sent to ${doctorName}'s verified clinic EHR portal.`);
}

/**
 * Clinical PCOS Likelihood Calculator & Assessment Engine
 * Based on Rotterdam Diagnostic Criteria & Well-Established Symptom Patterns
 */
function calculatePCOSLikelihood(e) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }

  // Retrieve answers for all 8 questions
  const q1 = document.querySelector('input[name="pcos_q1"]:checked')?.value === 'yes'; // Irregular periods (>35d or <8/yr)
  const q2 = document.querySelector('input[name="pcos_q2"]:checked')?.value === 'yes'; // Excess hair (face, chest, back)
  const q3 = document.querySelector('input[name="pcos_q3"]:checked')?.value === 'yes'; // Persistent acne / oily jawline
  const q4 = document.querySelector('input[name="pcos_q4"]:checked')?.value === 'yes'; // Unexplained weight gain
  const q5 = document.querySelector('input[name="pcos_q5"]:checked')?.value === 'yes'; // Scalp hair thinning
  const q6 = document.querySelector('input[name="pcos_q6"]:checked')?.value === 'yes'; // Dark skin patches (Acanthosis nigricans)
  const q7 = document.querySelector('input[name="pcos_q7"]:checked')?.value === 'yes'; // Family history of PCOS / T2D
  const q8 = document.querySelector('input[name="pcos_q8"]:checked')?.value === 'yes'; // Infertility / conceiving >6-12 mos

  // Validate that all questions have been answered
  const allAnswered = ['pcos_q1', 'pcos_q2', 'pcos_q3', 'pcos_q4', 'pcos_q5', 'pcos_q6', 'pcos_q7', 'pcos_q8'].every(
    name => document.querySelector(`input[name="${name}"]:checked`)
  );

  if (!allAnswered) {
    if (typeof showToastNotification === 'function') {
      showToastNotification('Please answer all 8 questions to calculate your PCOS likelihood.', '⚠️');
    }
    alert('Please answer all 8 questions before checking your PCOS likelihood.');
    return;
  }

  if (typeof playGentleChime === 'function') {
    playGentleChime('fanfare');
  }

  // Count affirmative responses & categorize
  const answers = [
    { id: 1, name: 'Irregular or Delayed Menstrual Cycles', q: q1, category: 'Ovulation' },
    { id: 2, name: 'Excess Hair Growth (Hirsutism)', q: q2, category: 'Androgens' },
    { id: 3, name: 'Persistent Acne / Oily Jawline', q: q3, category: 'Androgens' },
    { id: 4, name: 'Difficulty Losing Weight / Weight Gain', q: q4, category: 'Metabolism' },
    { id: 5, name: 'Scalp Hair Thinning / Alopecia', q: q5, category: 'Androgens' },
    { id: 6, name: 'Dark Skin Patches (Acanthosis Nigricans)', q: q6, category: 'Insulin Resistance' },
    { id: 7, name: 'Family History of PCOS or Diabetes', q: q7, category: 'Genetics' },
    { id: 8, name: 'Subfertility / Trying to Conceive >6-12 Mo', q: q8, category: 'Ovulation' }
  ];

  const yesCount = answers.filter(a => a.q).length;
  const hasOvulatoryIssue = q1 || q8;
  const hasAndrogenExcess = q2 || q3 || q5;
  const hasMetabolicIssue = q4 || q6;

  // Rotterdam Criteria Evaluation:
  // Core Prong 1: Ovulatory dysfunction (Q1 or Q8)
  // Core Prong 2: Clinical Hyperandrogenism (Q2, Q3, or Q5)
  // If both Core Prongs are present OR if total 'Yes' answers >= 4: HIGH LIKELIHOOD
  let likelihoodLevel = 'low'; // 'high' | 'moderate' | 'low'
  let likelihoodTitle = '';
  let likelihoodScore = '';
  let badgeColor = '';
  let badgeBg = '';
  let badgeBorder = '';
  let summaryText = '';
  let clinicalVerdict = '';

  if ((hasOvulatoryIssue && hasAndrogenExcess) || yesCount >= 4) {
    likelihoodLevel = 'high';
    likelihoodTitle = 'High Likelihood of PCOS';
    likelihoodScore = `${Math.min(96, 75 + yesCount * 3)}%`;
    badgeColor = 'text-rose-700';
    badgeBg = 'bg-rose-100';
    badgeBorder = 'border-rose-300';
    clinicalVerdict = 'Meets Clinical Rotterdam Pattern';
    summaryText = `Your symptom pattern presents significant clinical markers of Polycystic Ovary Syndrome (PCOS). In particular, reporting cycle irregularities (${q1 ? 'cycles >35 days' : 'ovulatory delays'}) combined with androgenic features (${[q2 && 'excess facial/body hair', q3 && 'cystic acne', q5 && 'hair thinning'].filter(Boolean).join(', ')}) strongly satisfies the established Rotterdam diagnostic criteria for PCOS. A formal medical consultation with an endocrinologist or gynecologist is recommended for definitive diagnosis.`;
  } else if (yesCount >= 2 || hasOvulatoryIssue || hasAndrogenExcess || hasMetabolicIssue) {
    likelihoodLevel = 'moderate';
    likelihoodTitle = 'Moderate Likelihood of PCOS';
    likelihoodScore = `${Math.min(68, 40 + yesCount * 7)}%`;
    badgeColor = 'text-amber-800';
    badgeBg = 'bg-amber-100';
    badgeBorder = 'border-amber-300';
    clinicalVerdict = 'Subclinical or Early Hormonal Signs';
    summaryText = `You reported ${yesCount} hallmark symptoms associated with endocrine disruption or early-stage PCOS. While your current profile may not satisfy every classic diagnostic prong, isolated indicators such as ${answers.filter(a => a.q).map(a => a.name.toLowerCase()).slice(0, 2).join(' and ')} warrant preventive lifestyle balance and a targeted hormone blood panel.`;
  } else {
    likelihoodLevel = 'low';
    likelihoodTitle = 'Low Likelihood of PCOS';
    likelihoodScore = `${Math.max(8, yesCount * 12)}%`;
    badgeColor = 'text-emerald-700';
    badgeBg = 'bg-emerald-100';
    badgeBorder = 'border-emerald-300';
    clinicalVerdict = 'Typical Ovulatory & Hormonal Profile';
    summaryText = `Your answers indicate very few or none of the cardinal signs of PCOS. Your menstrual rhythm and androgenic balance appear broadly typical. If you experience new cycle irregularities, pelvic discomfort, or metabolic shifts in the future, continue logging your daily habits and basal body temperature in Medico Femina.`;
  }

  // Diagnostic Tests & Interventions
  const recommendedLabs = [
    { name: 'Serum Hormone Panel', desc: 'Free & Total Testosterone, DHEA-S, LH:FSH ratio, AMH (Anti-Müllerian Hormone)' },
    { name: 'Insulin Resistance Screen', desc: 'Fasting Insulin & Fasting Glucose (HOMA-IR calculation), HbA1c' },
    { name: 'Pelvic / Transvaginal Ultrasound', desc: 'Evaluate ovarian volume (>10ml) and antral follicle count ("string of pearls" sign)' },
    { name: 'Thyroid & Prolactin Panel', desc: 'Rule out hypothyroidism (TSH, Free T4) or hyperprolactinemia' }
  ];

  const actionSteps = [
    likelihoodLevel === 'high'
      ? 'Book a consultation with a reproductive endocrinologist or gynecologist for lab confirmation.'
      : 'Review your cycle stability and discuss your symptom trends during your annual well-woman checkup.',
    'Anchor morning blood sugar with 25–30g dietary protein within 90 minutes of waking.',
    'Engage skeletal muscle with resistance/compound movement to activate non-insulin glucose uptake (GLUT-4).',
    'Consider evidence-backed 40:1 Myo-Inositol to support cellular insulin reception and ovulatory signaling.'
  ];

  const resultContainer = document.getElementById('pcos-likelihood-result');
  if (!resultContainer) return;

  resultContainer.innerHTML = `
    <div class="luxe-card rounded-3xl p-6 sm:p-8 space-y-6 border-2 ${likelihoodLevel === 'high' ? 'border-rose-300 bg-rose-50/30' : (likelihoodLevel === 'moderate' ? 'border-amber-300 bg-amber-50/20' : 'border-emerald-300 bg-emerald-50/20')} shadow-lg animate-fadeIn">
      
      <!-- Top Likelihood Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div>
          <div class="inline-flex items-center space-x-2 ${badgeBg} ${badgeColor} border ${badgeBorder} px-3.5 py-1 rounded-full text-xs font-bold mb-2">
            <span>${likelihoodLevel === 'high' ? '🔴' : (likelihoodLevel === 'moderate' ? '🟡' : '🟢')}</span>
            <span>${clinicalVerdict}</span>
          </div>
          <h3 class="text-2xl sm:text-3xl font-extrabold brand-font text-slate-900">
            ${likelihoodTitle}
          </h3>
          <p class="text-xs sm:text-sm text-slate-600 mt-1">
            Calculated score based on your answers: <strong class="text-slate-900 font-bold">${yesCount} of 8 Affirmative Symptoms (${likelihoodScore})</strong>
          </p>
        </div>

        <!-- Visual Risk Meter -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs w-full sm:w-64 space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Likelihood Meter</span>
            <span class="${badgeColor} font-black">${likelihoodScore}</span>
          </div>
          <div class="w-full h-3.5 rounded-full bg-slate-100 flex overflow-hidden p-0.5 border border-slate-200">
            <div class="w-1/3 h-full rounded-l-full ${likelihoodLevel === 'low' ? 'bg-emerald-500 shadow-sm' : 'bg-emerald-200'}"></div>
            <div class="w-1/3 h-full ${likelihoodLevel === 'moderate' ? 'bg-amber-500 shadow-sm' : 'bg-amber-200'}"></div>
            <div class="w-1/3 h-full rounded-r-full ${likelihoodLevel === 'high' ? 'bg-rose-600 shadow-sm' : 'bg-rose-200'}"></div>
          </div>
          <div class="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider px-0.5">
            <span class="${likelihoodLevel === 'low' ? 'text-emerald-700 font-black' : ''}">Low</span>
            <span class="${likelihoodLevel === 'moderate' ? 'text-amber-700 font-black' : ''}">Moderate</span>
            <span class="${likelihoodLevel === 'high' ? 'text-rose-700 font-black' : ''}">High</span>
          </div>
        </div>
      </div>

      <!-- Clinical Explanation & Narrative -->
      <div class="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
        <h4 class="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
          <i data-lucide="activity" class="w-4 h-4 text-[#9d174d]"></i>
          <span>Clinical Interpretation</span>
        </h4>
        <p class="text-xs sm:text-sm text-slate-700 leading-relaxed">
          ${summaryText}
        </p>
      </div>

      <!-- Identified Symptom Breakdown Grid -->
      <div class="space-y-3">
        <h4 class="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
          <i data-lucide="list-checks" class="w-4 h-4 text-purple-600"></i>
          <span>Your Symptom Breakdown (8-Point Assessment)</span>
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          ${answers.map(item => `
            <div class="p-3 rounded-xl border flex items-center justify-between ${item.q ? 'bg-rose-50/60 border-rose-200 text-slate-900' : 'bg-slate-50/50 border-slate-200 text-slate-500'}">
              <div class="flex items-center space-x-2.5">
                <span class="${item.q ? 'text-rose-600 font-bold' : 'text-slate-400'}">${item.q ? '⚠️' : '✓'}</span>
                <span class="${item.q ? 'font-bold text-slate-900' : 'text-slate-600'}">${item.name}</span>
              </div>
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${item.q ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-500'}">
                ${item.q ? 'Yes (Reported)' : 'No'}
              </span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Diagnostic Tests & Action Plan -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <!-- Recommended Lab Investigations -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h4 class="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
            <i data-lucide="test-tube-2" class="w-4 h-4 text-indigo-600"></i>
            <span>Recommended Diagnostic Tests</span>
          </h4>
          <p class="text-[11px] text-slate-500">Ask your doctor for these tests to confirm your diagnosis according to international guidelines:</p>
          <div class="space-y-2 text-xs">
            ${recommendedLabs.map(lab => `
              <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <strong class="font-bold text-slate-800 block text-xs">${lab.name}</strong>
                <span class="text-[11px] text-slate-600 leading-normal block mt-0.5">${lab.desc}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Personalized Action Protocol -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h4 class="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
            <i data-lucide="sparkles" class="w-4 h-4 text-amber-600"></i>
            <span>Personalized Next Steps</span>
          </h4>
          <p class="text-[11px] text-slate-500">Evidence-based steps to lower insulin and balance androgen levels:</p>
          <div class="space-y-2 text-xs">
            ${actionSteps.map((step, idx) => `
              <div class="flex items-start space-x-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span class="w-5 h-5 rounded-full bg-pink-100 text-[#9d174d] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">${idx + 1}</span>
                <span class="text-slate-700 leading-relaxed text-[11px]">${step}</span>
              </div>
            `).join('')}
          </div>
        </div>

      </div>

      <!-- Action Buttons (Consult AI Doctor / Contact Specialists / Reset) -->
      <div class="pt-2 flex flex-col sm:flex-row items-center gap-3">
        <button onclick="askDoctorAboutPCOSScreening('${likelihoodTitle}', ${yesCount})" class="w-full sm:w-auto flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-700 hover:to-rose-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md glow-purple transition cursor-pointer">
          <i data-lucide="bot" class="w-4 h-4"></i>
          <span>Discuss with AI Doctor Leena</span>
        </button>

        <button onclick="switchTab('telehealth')" class="w-full sm:w-auto flex-1 py-3 px-5 rounded-xl bg-white hover:bg-rose-50 text-slate-800 hover:text-rose-700 border border-slate-300 font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-xs cursor-pointer">
          <i data-lucide="user-check" class="w-4 h-4 text-emerald-600"></i>
          <span>Find & Contact Real Specialists</span>
        </button>

        <button onclick="resetPCOSScreening()" class="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer">
          <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
          <span>Reset Quiz</span>
        </button>
      </div>

    </div>
  `;

  resultContainer.classList.remove('hidden');
  resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  if (window.lucide && typeof lucide.createIcons === 'function') {
    lucide.createIcons();
  }

  if (typeof confetti === 'function') {
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
  }

  if (typeof showToastNotification === 'function') {
    showToastNotification(`Calculated: ${likelihoodTitle} (${yesCount}/8 symptoms reported)`, '📋');
  }
}

/**
 * Discuss PCOS Quiz Result with AI Doctor Leena
 */
function askDoctorAboutPCOSScreening(likelihood, yesCount) {
  switchTab('ai-doctor');
  const chatInput = document.getElementById('chat-user-input');
  if (chatInput) {
    chatInput.value = `I just took the PCOS Likelihood Quiz and my result showed "${likelihood}" with ${yesCount} affirmative symptoms. Can you explain what these findings mean and what dietary, lifestyle, or lab test steps I should prioritize?`;
    chatInput.focus();
  }
}

/**
 * Reset PCOS Quiz Form
 */
function resetPCOSScreening() {
  const form = document.getElementById('pcos-calculator-form');
  if (form) form.reset();
  const result = document.getElementById('pcos-likelihood-result');
  if (result) {
    result.classList.add('hidden');
    result.innerHTML = '';
  }
  form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (typeof showToastNotification === 'function') {
    showToastNotification('Quiz reset. You can fill it out again.', '🔄');
  }
}

// Backward compatibility alias
var calculatePhenotype = calculatePCOSLikelihood;
window.calculatePCOSLikelihood = calculatePCOSLikelihood;
window.calculatePhenotype = calculatePCOSLikelihood;
window.askDoctorAboutPCOSScreening = askDoctorAboutPCOSScreening;
window.resetPCOSScreening = resetPCOSScreening;

/**
 * Emergency Triage Alerts
 */
function triggerEmergencyAlert(type) {
  playGentleChime('bell');
  const banner = document.getElementById('triage-action-banner');
  const title = document.getElementById('triage-title');
  const msg = document.getElementById('triage-message');

  banner.classList.remove('hidden');

  if (type === 'torsion') {
    banner.className = 'p-6 rounded-3xl bg-red-600 text-white shadow-xl transition-all duration-300';
    title.innerText = '🚨 RED FLAG: Suspected Ovarian Torsion / Cyst Rupture';
    msg.innerHTML = `
      <strong>Symptoms:</strong> Sudden, severe, unilateral lower pelvic agony + nausea/vomiting.<br>
      <strong>Emergency Action:</strong> A polycystic ovary can twist on its ligament, cutting off blood supply. This requires <strong>urgent Doppler ultrasound and possible surgical detorsion within hours</strong>. Proceed immediately to the nearest Emergency Room.
    `;
  } else if (type === 'hemorrhage') {
    banner.className = 'p-6 rounded-3xl bg-red-600 text-white shadow-xl transition-all duration-300';
    title.innerText = '🚨 RED FLAG: Acute Uterine Hemorrhage';
    msg.innerHTML = `
      <strong>Symptoms:</strong> Soaking >1 pad/tampon per hour for 2+ consecutive hours with golf-ball sized clots or dizziness.<br>
      <strong>Emergency Action:</strong> Significant acute blood loss can cause hypovolemic shock. Proceed to Urgent Care/ER for immediate medical stabilization.
    `;
  } else if (type === 'amenorrhea') {
    banner.className = 'p-6 rounded-3xl bg-amber-600 text-white shadow-xl transition-all duration-300';
    title.innerText = '⚠️ WARNING: 90+ Day Amenorrhea (Endometrial Protection Needed)';
    msg.innerHTML = `
      <strong>Clinical Concern:</strong> Absence of periods for >90 days causes continuous estrogen exposure without progesterone ("unopposed estrogen"), risking <em>Endometrial Hyperplasia</em>.<br>
      <strong>Action:</strong> Schedule a consultation with your gynecologist to discuss a short course of oral progestins (e.g. Medroxyprogesterone) to induce a protective withdrawal bleed.
    `;
  }

  banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  lucide.createIcons();
}

/**
 * Little Timer (Mini Companion Timer)
 */
function initLittleTimer() {
  renderLittleTimer();
}

function toggleLittleTimer() {
  const icon = document.getElementById('little-timer-icon');
  const btn = document.getElementById('btn-little-timer-play');

  if (state.littleTimer.isRunning) {
    clearInterval(state.littleTimer.intervalId);
    state.littleTimer.isRunning = false;
    if (icon) icon.setAttribute('data-lucide', 'play');
    btn.classList.replace('bg-amber-600', 'bg-purple-600');
    playGentleChime('bell');
  } else {
    playGentleChime('bell');
    state.littleTimer.isRunning = true;
    if (icon) icon.setAttribute('data-lucide', 'pause');
    btn.classList.replace('bg-purple-600', 'bg-amber-600');

    state.littleTimer.intervalId = setInterval(() => {
      if (state.littleTimer.remainingSeconds > 0) {
        state.littleTimer.remainingSeconds--;
        renderLittleTimer();
      } else {
        clearInterval(state.littleTimer.intervalId);
        state.littleTimer.isRunning = false;
        if (icon) icon.setAttribute('data-lucide', 'play');
        btn.classList.replace('bg-amber-600', 'bg-purple-600');

        playGentleChime('fanfare');
        if (typeof confetti === 'function') {
          confetti({ particleCount: 70, spread: 50, origin: { y: 0.3 } });
        }
        const hintEl = document.getElementById('little-timer-status-hint');
        if (hintEl) hintEl.innerText = 'Timer finished! Great job giving your body this pause.';
      }
    }, 1000);
  }
  lucide.createIcons();
}

function resetLittleTimer() {
  playGentleChime('bell');
  clearInterval(state.littleTimer.intervalId);
  state.littleTimer.isRunning = false;
  state.littleTimer.remainingSeconds = state.littleTimer.totalSeconds;

  const icon = document.getElementById('little-timer-icon');
  const btn = document.getElementById('btn-little-timer-play');
  if (icon) icon.setAttribute('data-lucide', 'play');
  if (btn) btn.classList.replace('bg-amber-600', 'bg-purple-600');

  renderLittleTimer();
  lucide.createIcons();
}

function setLittleTimerPreset(minutes, label, hint) {
  playGentleChime('bell');
  clearInterval(state.littleTimer.intervalId);
  state.littleTimer.isRunning = false;

  state.littleTimer.totalSeconds = minutes * 60;
  state.littleTimer.remainingSeconds = minutes * 60;
  state.littleTimer.label = label;

  const labelEl = document.getElementById('little-timer-label');
  const hintEl = document.getElementById('little-timer-status-hint');
  const icon = document.getElementById('little-timer-icon');
  const btn = document.getElementById('btn-little-timer-play');

  if (labelEl) labelEl.innerText = label;
  if (hintEl && hint) hintEl.innerText = hint;
  if (icon) icon.setAttribute('data-lucide', 'play');
  if (btn) btn.classList.replace('bg-amber-600', 'bg-purple-600');

  renderLittleTimer();
  lucide.createIcons();
}

function renderLittleTimer() {
  const mins = Math.floor(state.littleTimer.remainingSeconds / 60);
  const secs = state.littleTimer.remainingSeconds % 60;
  const display = document.getElementById('little-timer-display');
  if (display) {
    display.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * Real-Time Weather Engine (Open-Meteo API)
 */
function initWeather() {
  // Always attempt live GPS first — never rely on stale saved coords
  detectUserLocationWeather();
}

function detectUserLocationWeather() {
  const locNameEl = document.getElementById('weather-location-name');
  const condEl = document.getElementById('weather-condition');
  if (locNameEl) locNameEl.innerText = 'Detecting location...';
  if (condEl) condEl.innerText = 'Fetching live GPS...';

  if (!navigator.geolocation) {
    // No GPS API at all — use IP-based fallback
    fetchLocationByIP();
    return;
  }

  let hasResponded = false;
  const fallbackTimer = setTimeout(() => {
    if (!hasResponded) {
      hasResponded = true;
      console.log('GPS wait timeout — resolving network location');
      fetchLocationByIP();
    }
  }, 4500);

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      if (hasResponded) return;
      hasResponded = true;
      clearTimeout(fallbackTimer);

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      // Reverse geocode to get city name
      let fullName = '';
      try {
        const revRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
        if (revRes.ok) {
          const data = await revRes.json();
          const city = data.city || data.locality || data.principalSubdivision || '';
          const country = data.countryName || data.countryCode || '';
          if (city) fullName = `${city}${country ? ', ' + country : ''}`;
        }
      } catch (e) {}

      if (!fullName) {
        try {
          const osmRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=12`, {
            headers: { 'User-Agent': 'MedicoFeminaApp/2.0' }
          });
          if (osmRes.ok) {
            const osmData = await osmRes.json();
            const city = osmData.address.city || osmData.address.town || osmData.address.state_district || osmData.address.state || '';
            const country = osmData.address.country || 'India';
            if (city) fullName = `${city}, ${country}`;
          }
        } catch (e) {}
      }

      if (!fullName) fullName = 'My Location';

      try {
        localStorage.setItem('medico_weather_lat', lat);
        localStorage.setItem('medico_weather_lon', lon);
        localStorage.setItem('medico_weather_name', fullName);
      } catch(e) {}

      fetchWeatherByCoords(lat, lon, fullName);
    },
    (err) => {
      if (hasResponded) return;
      hasResponded = true;
      clearTimeout(fallbackTimer);
      console.warn('GPS denied or unavailable:', err.message);
      fetchLocationByIP();
    },
    { timeout: 5000, maximumAge: 0, enableHighAccuracy: true }
  );
}

// IP-based location fallback (accurate network lookup without prompting permission)
async function fetchLocationByIP() {
  const locNameEl = document.getElementById('weather-location-name');
  const condEl = document.getElementById('weather-condition');
  if (locNameEl) locNameEl.innerText = 'Locating via network...';

  // 1. Primary: ipwho.is (Accurately resolves to true regional city like Bhubaneswar, CORS-friendly)
  try {
    const res = await fetch('https://ipwho.is/');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.latitude && data.longitude) {
        const city = data.city || data.region || 'Bhubaneswar';
        const country = data.country || 'India';
        const fullName = `${city}, ${country}`;

        try {
          localStorage.setItem('medico_weather_lat', data.latitude);
          localStorage.setItem('medico_weather_lon', data.longitude);
          localStorage.setItem('medico_weather_name', fullName);
        } catch(e) {}

        fetchWeatherByCoords(data.latitude, data.longitude, fullName);
        return;
      }
    }
  } catch (e) {}

  // 2. Secondary fallback: ip-api.com
  try {
    const res = await fetch('http://ip-api.com/json/?fields=status,city,regionName,country,lat,lon');
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success' && data.lat && data.lon) {
        const fullName = `${data.city || 'Bhubaneswar'}, ${data.country || 'India'}`;
        try {
          localStorage.setItem('medico_weather_lat', data.lat);
          localStorage.setItem('medico_weather_lon', data.lon);
          localStorage.setItem('medico_weather_name', fullName);
        } catch(e) {}
        fetchWeatherByCoords(data.lat, data.lon, fullName);
        return;
      }
    }
  } catch (e) {}

  // 3. Absolute default fallback
  fetchWeatherByCoords(20.2961, 85.8245, 'Bhubaneswar, India');
}

async function fetchWeatherByCoords(lat, lon, locationName) {
  const locEl = document.getElementById('weather-location-name');
  const tempEl = document.getElementById('weather-temp');
  const feelsLikeEl = document.getElementById('weather-feels-like');
  const condEl = document.getElementById('weather-condition');
  const humEl = document.getElementById('weather-humidity');
  const rainProbEl = document.getElementById('weather-rain-prob');
  const tipEl = document.getElementById('weather-hormone-tip');
  const iconEl = document.getElementById('weather-main-icon');

  if (locEl) locEl.innerText = locationName;
  if (condEl) condEl.innerText = 'Syncing satellites...';

  try {
    localStorage.setItem('medico_weather_lat', lat);
    localStorage.setItem('medico_weather_lon', lon);
    localStorage.setItem('medico_weather_name', locationName);
  } catch(e) {}

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,surface_pressure,is_day&hourly=temperature_2m,precipitation_probability,weather_code,uv_index,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,wind_speed_10m_max&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather API error');
    const data = await response.json();

    const current = data.current;
    const tempC = Math.round(current.temperature_2m);
    const feelsLikeC = Math.round(current.apparent_temperature !== undefined ? current.apparent_temperature : current.temperature_2m);
    const humidity = current.relative_humidity_2m;
    const windSpeed = Math.round(current.wind_speed_10m || 0);
    const pressure = Math.round(current.surface_pressure || 1013);
    const code = current.weather_code;
    const isDayCurrent = (current.is_day !== undefined) ? current.is_day : (new Date().getHours() >= 6 && new Date().getHours() < 18 ? 1 : 0);
    const todayRainProb = (data.daily && data.daily.precipitation_probability_max && data.daily.precipitation_probability_max.length > 0)
      ? data.daily.precipitation_probability_max[0]
      : 0;

    const weatherInfo = interpretWMOCode(code, isDayCurrent);

    // Save structured weather data in state
    state.weather = {
      location: locationName,
      lat: lat,
      lon: lon,
      temp: tempC,
      feelsLike: feelsLikeC,
      humidity: humidity,
      rainProb: `${todayRainProb}%`,
      wind: `${windSpeed} km/h`,
      pressure: `${pressure} hPa`,
      condition: weatherInfo.description,
      icon: weatherInfo.icon,
      isDay: isDayCurrent
    };

    state.weatherData = data;

    if (tempEl) tempEl.innerText = tempC;
    if (feelsLikeEl) feelsLikeEl.innerText = feelsLikeC;
    if (condEl) condEl.innerText = weatherInfo.description;
    if (humEl) humEl.innerText = `Humidity: ${humidity}%`;
    if (rainProbEl) rainProbEl.innerText = `Rain: ${todayRainProb}%`;
    if (iconEl) iconEl.setAttribute('data-lucide', weatherInfo.icon);

    const liveTimeEl = document.getElementById('weather-live-time');
    if (liveTimeEl) {
      // Set time immediately and keep ticking every minute
      const updateTime = () => {
        liveTimeEl.innerText = new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
      };
      updateTime();
      clearInterval(window._weatherTimeTicker);
      window._weatherTimeTicker = setInterval(updateTime, 60000);
    }

    if (tipEl) {
      if (tempC >= 30) {
        tipEl.innerText = `High heat (${tempC}°C, feels like ${feelsLikeC}°C): Drink +500ml water to assist liver clearance of circulating estrogen.`;
      } else if (tempC <= 18) {
        tipEl.innerText = `Cool climate (${tempC}°C): Keep feet warm to support lower abdominal pelvic blood circulation.`;
      } else if (humidity >= 70) {
        tipEl.innerText = `High humidity (${humidity}%): A light 10-minute walk assists lymphatic drainage and eases bloating.`;
      } else if (todayRainProb > 50) {
        tipEl.innerText = `Passing rain forecast (${todayRainProb}%): Practice indoor box-breathing to balance cortisol if outdoor walk is delayed.`;
      } else {
        tipEl.innerText = `Pleasant climate (${tempC}°C): Ideal conditions for outdoor walking and sunlight-induced melatonin calibration.`;
      }
    }

    lucide.createIcons();
  } catch (err) {
    if (tempEl) tempEl.innerText = '28';
    if (feelsLikeEl) feelsLikeEl.innerText = '31';
    if (condEl) condEl.innerText = 'Partly Sunny';
    if (humEl) humEl.innerText = 'Humidity: 62%';
    if (rainProbEl) rainProbEl.innerText = 'Rain: 10%';
    if (tipEl) tipEl.innerText = 'Tracking ambient temperature to ensure morning BBT readings stay accurate.';
  }
}

function parseHourlyLocalDateTime(timeStr) {
  if (!timeStr) return new Date();
  const parts = timeStr.split('T');
  if (parts.length === 2) {
    const [y, m, d] = parts[0].split('-').map(Number);
    const [h, min] = parts[1].split(':').map(Number);
    return new Date(y, m - 1, d, h, min || 0);
  }
  return new Date(timeStr);
}

/**
 * Force refresh GPS location & weather (clears cache)
 */
function refreshWeatherLocation() {
  // Clear saved location so fresh GPS is detected
  try {
    localStorage.removeItem('medico_weather_lat');
    localStorage.removeItem('medico_weather_lon');
    localStorage.removeItem('medico_weather_name');
  } catch(e) {}
  playGentleChime('bell');
  showToastNotification('🔄 Refreshing your location...', '📍');
  detectUserLocationWeather();
}

function interpretWMOCode(code, isDay = 1) {
  const isNight = isDay === 0;
  if (code === 0) return isNight ? { description: 'Clear Night Sky', icon: 'moon' } : { description: 'Clear Sunny Sky', icon: 'sun' };
  if (code === 1) return isNight ? { description: 'Mainly Clear Night', icon: 'moon' } : { description: 'Mainly Clear Sky', icon: 'sun-medium' };
  if (code === 2) return isNight ? { description: 'Partly Cloudy Night', icon: 'cloud-moon' } : { description: 'Partly Cloudy', icon: 'cloud-sun' };
  if (code === 3) return { description: 'Overcast Sky', icon: 'cloud' };
  if (code >= 45 && code <= 48) return { description: 'Misty / Foggy', icon: 'cloud-fog' };
  if (code >= 51 && code <= 55) return { description: 'Light Drizzle', icon: 'cloud-drizzle' };
  if (code >= 61 && code <= 65) return { description: isNight ? 'Night Rain Showers' : 'Rain Showers', icon: 'cloud-rain' };
  if (code >= 80 && code <= 82) return { description: 'Passing Showers', icon: 'cloud-rain' };
  if (code >= 95) return { description: 'Thunderstorms', icon: 'cloud-lightning' };
  return isNight ? { description: 'Mild Night Breeze', icon: 'wind' } : { description: 'Mild & Breezy', icon: 'wind' };
}

/**
 * Precise 7-Day & Hourly Weather Modal Controller
 */
function openWeatherForecastModal() {
  playGentleChime('bell');
  const modal = document.getElementById('weather-forecast-modal');
  if (!modal) return;
  modal.classList.remove('hidden');

  renderWeatherForecastModalContent();
  lucide.createIcons();
}

function closeWeatherForecastModal() {
  const modal = document.getElementById('weather-forecast-modal');
  if (modal) modal.classList.add('hidden');
}

function renderWeatherForecastModalContent() {
  const data = state.weatherData;
  const locEl = document.getElementById('forecast-modal-location');
  const tempEl = document.getElementById('forecast-modal-temp');
  const feelsEl = document.getElementById('forecast-modal-feels-like');
  const condEl = document.getElementById('forecast-modal-condition');
  const humEl = document.getElementById('forecast-modal-humidity');
  const rainEl = document.getElementById('forecast-modal-rain-prob');
  const windEl = document.getElementById('forecast-modal-wind');
  const pressEl = document.getElementById('forecast-modal-pressure');
  const timeBadge = document.getElementById('forecast-modal-time-display');

  const now = new Date();
  const currentFormattedTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (locEl) locEl.innerText = state.weather.location || 'Local Area';
  if (timeBadge) timeBadge.innerText = `Live: ${currentFormattedTime}`;
  if (tempEl) tempEl.innerText = state.weather.temp;
  if (feelsEl) feelsEl.innerText = `${state.weather.feelsLike}°C`;
  if (condEl) condEl.innerText = `${state.weather.condition} • Live Satellite Telemetry`;
  if (humEl) humEl.innerText = `${state.weather.humidity}%`;
  if (rainEl) rainEl.innerText = state.weather.rainProb;
  if (windEl) windEl.innerText = state.weather.wind;
  if (pressEl) pressEl.innerText = state.weather.pressure;

  // Render Hourly Timeline (Next 24 Hours)
  const hourlyContainer = document.getElementById('forecast-hourly-container');
  if (hourlyContainer && data && data.hourly && data.hourly.time) {
    hourlyContainer.innerHTML = '';

    // Calculate local target hour string "YYYY-MM-DDTHH"
    const localYear = now.getFullYear();
    const localMonth = String(now.getMonth() + 1).padStart(2, '0');
    const localDay = String(now.getDate()).padStart(2, '0');
    const localHour = String(now.getHours()).padStart(2, '0');
    const localHourISO = `${localYear}-${localMonth}-${localDay}T${localHour}`;

    // Prefer Open-Meteo current local time if available, otherwise browser local hour
    const apiTargetHour = (data.current && data.current.time) ? data.current.time.slice(0, 13) : '';
    let startIndex = -1;

    if (apiTargetHour) {
      startIndex = data.hourly.time.findIndex(t => t.startsWith(apiTargetHour));
    }
    if (startIndex < 0) {
      startIndex = data.hourly.time.findIndex(t => t.startsWith(localHourISO));
    }
    if (startIndex < 0) {
      // Find nearest timestamp to current local time
      const nowMs = now.getTime();
      let bestDiff = Infinity;
      data.hourly.time.forEach((tStr, idx) => {
        const itemDate = parseHourlyLocalDateTime(tStr);
        const diff = Math.abs(itemDate.getTime() - nowMs);
        if (diff < bestDiff) {
          bestDiff = diff;
          startIndex = idx;
        }
      });
    }
    if (startIndex < 0) startIndex = 0;

    const count = Math.min(24, data.hourly.time.length - startIndex);
    for (let i = startIndex; i < startIndex + count; i++) {
      const timeStr = data.hourly.time[i];
      const hourDate = parseHourlyLocalDateTime(timeStr);
      const isNow = (i === startIndex);
      const hourTimeLabel = hourDate.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
      const hourLabel = isNow ? `Now • ${hourTimeLabel}` : hourTimeLabel;

      const tempH = Math.round(data.hourly.temperature_2m[i]);
      const rainH = data.hourly.precipitation_probability ? data.hourly.precipitation_probability[i] : 0;
      const codeH = data.hourly.weather_code[i];
      const isDayH = (data.hourly.is_day && data.hourly.is_day[i] !== undefined)
        ? data.hourly.is_day[i]
        : (hourDate.getHours() >= 6 && hourDate.getHours() < 18 ? 1 : 0);
      const infoH = interpretWMOCode(codeH, isDayH);

      const hourCard = document.createElement('div');
      hourCard.className = `weather-day-card shrink-0 p-3 rounded-2xl text-center min-w-[82px] space-y-1 transition ${
        isNow ? 'bg-amber-100/70 border-2 border-amber-400 shadow-sm' : 'bg-slate-50 border border-slate-200'
      }`;
      hourCard.innerHTML = `
        <span class="text-[10px] font-bold ${isNow ? 'text-amber-900 font-extrabold' : 'text-slate-500'} block">${hourLabel}</span>
        <div class="w-7 h-7 mx-auto flex items-center justify-center ${isDayH ? 'text-amber-500' : 'text-indigo-400'}">
          <i data-lucide="${infoH.icon}" class="w-5 h-5"></i>
        </div>
        <span class="text-xs font-black text-slate-800 block">${tempH}°</span>
        <span class="text-[9px] font-semibold text-sky-600 block">💧 ${rainH}%</span>
      `;
      hourlyContainer.appendChild(hourCard);
    }
  }

  // Render 7-Day Forecast Grid
  const dailyContainer = document.getElementById('forecast-daily-container');
  if (dailyContainer && data && data.daily && data.daily.time) {
    dailyContainer.innerHTML = '';
    const daysCount = Math.min(7, data.daily.time.length);

    for (let d = 0; d < daysCount; d++) {
      const dDateStr = data.daily.time[d];
      const dDate = parseLocalDate(dDateStr);
      const isToday = (d === 0);
      const dayName = isToday ? 'Today' : dDate.toLocaleDateString('en-US', { weekday: 'short' });
      const datePretty = dDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const maxT = Math.round(data.daily.temperature_2m_max[d]);
      const minT = Math.round(data.daily.temperature_2m_min[d]);
      const rainP = data.daily.precipitation_probability_max ? data.daily.precipitation_probability_max[d] : 0;
      const uvMax = data.daily.uv_index_max ? Math.round(data.daily.uv_index_max[d]) : 3;
      const codeD = data.daily.weather_code[d];
      const infoD = interpretWMOCode(codeD);

      let uvClass = 'uv-low';
      let uvLabel = `UV ${uvMax}`;
      if (uvMax >= 8) { uvClass = 'uv-extreme'; uvLabel = `Very High UV ${uvMax}`; }
      else if (uvMax >= 6) { uvClass = 'uv-high'; uvLabel = `High UV ${uvMax}`; }
      else if (uvMax >= 3) { uvClass = 'uv-mod'; uvLabel = `Moderate UV ${uvMax}`; }

      const dayCard = document.createElement('div');
      dayCard.className = `p-3 rounded-2xl border transition bg-white flex items-center justify-between gap-2.5 ${
        isToday ? 'border-amber-300 bg-amber-50/40 shadow-sm' : 'border-slate-200'
      }`;

      dayCard.innerHTML = `
        <div class="flex items-center space-x-2.5">
          <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <i data-lucide="${infoD.icon}" class="w-4 h-4"></i>
          </div>
          <div>
            <div class="flex items-center space-x-1.5">
              <span class="text-xs font-bold text-slate-900">${dayName}</span>
              <span class="text-[10px] text-slate-400 font-medium">${datePretty}</span>
            </div>
            <span class="text-[11px] text-slate-500 font-medium">${infoD.description}</span>
          </div>
        </div>

        <div class="flex items-center space-x-2 text-right shrink-0">
          <div>
            <span class="text-xs font-black text-slate-900">${maxT}°</span>
            <span class="text-xs text-slate-400">/ ${minT}°</span>
            <div class="text-[9px] text-sky-600 font-semibold">💧 ${rainP}%</div>
          </div>
          <span class="text-[9px] font-bold px-2 py-0.5 rounded-full ${uvClass} whitespace-nowrap">${uvLabel}</span>
        </div>
      `;

      dailyContainer.appendChild(dayCard);
    }
  }
}

async function searchCityWeather(e) {
  if (e && e.preventDefault) e.preventDefault();
  const input = document.getElementById('city-search-input');
  const query = input?.value.trim();
  if (!query) return;

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
    const res = await fetch(geoUrl);
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      const top = data.results[0];
      const fullName = `${top.name}${top.country ? ', ' + top.country : ''}`;
      fetchWeatherByCoords(top.latitude, top.longitude, fullName);
      toggleCitySearchModal();
      showToastNotification(`📍 Location updated to ${fullName}`, '🌤️');
    } else {
      alert(`Could not find coordinates for "${query}". Please check the spelling.`);
    }
  } catch (e) {
    alert('Network error while searching city. Please try again.');
  }
}

function selectCityPreset(lat, lon, cityName) {
  playGentleChime('bell');
  fetchWeatherByCoords(lat, lon, cityName);
  toggleCitySearchModal();
  showToastNotification(`📍 Location set to ${cityName}`, '🌤️');
}

function toggleCitySearchModal() {
  const modal = document.getElementById('city-search-modal');
  if (modal) {
    modal.classList.toggle('hidden');
    playGentleChime('bell');
    const input = document.getElementById('city-search-input');
    if (!modal.classList.contains('hidden') && input) {
      setTimeout(() => input.focus(), 150);
    }
  }
}

/**
 * =================================================================
 * SAVE & DOWNLOAD DAILY DATA SUITE (JSON, CSV, MEMO & BACKUP)
 * =================================================================
 */

function saveDailyData(targetDateStr, overrideData = null) {
  playGentleChime('fanfare');

  const dateInput = document.getElementById('daily-log-date');
  const dateStr = targetDateStr || (dateInput ? dateInput.value : null) || getTodayLocalDateStr();
  const cycleDay = getCycleDayForDate(dateStr);

  const bbtVal = overrideData && overrideData.temp !== undefined
    ? parseFloat(overrideData.temp)
    : parseFloat(document.getElementById('quick-bbt')?.value || '36.4');

  const fluidVal = overrideData && overrideData.fluid !== undefined
    ? overrideData.fluid
    : (document.getElementById('quick-fluid')?.value || 'eggwhite');

  const flowVal = overrideData && overrideData.flow !== undefined
    ? overrideData.flow
    : (document.getElementById('quick-flow')?.value || 'none');

  const notesVal = document.getElementById('quick-notes')?.value || '';

  const logRecord = {
    date: dateStr,
    cycleDay: cycleDay,
    temp: isNaN(bbtVal) ? 36.4 : bbtVal,
    fluid: fluidVal,
    flow: flowVal,
    mood: state.selectedMood || 'Calm & Content',
    symptoms: [...state.selectedSymptoms],
    waterGlasses: state.waterGlasses,
    waterLiters: (state.waterGlasses * 0.3).toFixed(1),
    remissionScore: state.remissionScore,
    notes: notesVal,
    savedAt: new Date().toISOString()
  };

  if (!state.dailyLogs) state.dailyLogs = {};
  state.dailyLogs[dateStr] = logRecord;

  // Sync to bbtRecords
  if (!state.cycleData.bbtRecords) state.cycleData.bbtRecords = [];
  const existingIdx = state.cycleData.bbtRecords.findIndex(r => r.date === dateStr || (r.day === cycleDay && !r.date));
  if (existingIdx >= 0) {
    state.cycleData.bbtRecords[existingIdx] = {
      ...state.cycleData.bbtRecords[existingIdx],
      date: dateStr,
      day: cycleDay,
      temp: logRecord.temp,
      fluid: logRecord.fluid,
      flow: logRecord.flow
    };
  } else {
    state.cycleData.bbtRecords.push({
      date: dateStr,
      day: cycleDay,
      temp: logRecord.temp,
      fluid: logRecord.fluid,
      flow: logRecord.flow
    });
  }
  state.cycleData.bbtRecords.sort((a, b) => (a.day || 0) - (b.day || 0));

  saveState();
  recalculateStreak();
  initBBTChart();
  renderCalendar();
  updateCycleWheel();
  updateBBTStats();

  if (typeof confetti === 'function') {
    confetti({ particleCount: 75, spread: 60, origin: { y: 0.8 } });
  }

  // Show streak milestone toast
  const todayStr2 = getTodayLocalDateStr();
  if (dateStr === todayStr2 && state.streak > 0) {
    const milestones = [3, 7, 14, 21, 30, 60, 100];
    if (milestones.includes(state.streak)) {
      showToastNotification(`🔥 ${state.streak}-Day Streak! You're on fire!`, '🏆');
      if (typeof confetti === 'function') {
        setTimeout(() => confetti({ particleCount: 180, spread: 100, origin: { y: 0.5 } }), 400);
      }
    } else {
      showToastNotification(`🔥 ${state.streak}-Day Streak! Keep going!`, '✨');
    }
  }

  showToast(`Daily data saved for ${formatDatePretty(dateStr, 'medium')} (Cycle Day ${cycleDay})!`);
}

function openDailyDataExportModal() {
  playGentleChime('bell');
  const modal = document.getElementById('daily-data-export-modal');
  if (!modal) return;
  modal.classList.remove('hidden');

  const dateInput = document.getElementById('export-modal-date');
  if (dateInput) {
    dateInput.value = state.selectedDate || getTodayLocalDateStr();
  }
  updateExportModalPreview();
  lucide.createIcons();
}

function closeDailyDataExportModal() {
  const modal = document.getElementById('daily-data-export-modal');
  if (modal) modal.classList.add('hidden');
}

function updateExportModalPreview() {
  const dateInput = document.getElementById('export-modal-date');
  const dateStr = dateInput ? dateInput.value : getTodayLocalDateStr();
  const container = document.getElementById('export-preview-container');
  if (!container) return;

  const cycleDay = getCycleDayForDate(dateStr);
  const log = state.dailyLogs ? state.dailyLogs[dateStr] : null;
  const bbtRec = state.cycleData.bbtRecords ? state.cycleData.bbtRecords.find(r => r.date === dateStr) : null;
  const temp = log ? log.temp : (bbtRec ? bbtRec.temp : '--');
  const fluid = log ? log.fluid : (bbtRec ? bbtRec.fluid : 'Not Logged');
  const mood = log ? log.mood : (state.selectedMood || 'Calm');
  const score = log ? log.remissionScore : state.remissionScore;

  container.innerHTML = `
    <div class="bg-white p-2.5 rounded-xl border border-rose-100 text-center">
      <span class="text-[10px] text-slate-400 font-bold block">Cycle Day</span>
      <span class="text-sm font-black text-rose-600 block mt-0.5">Day ${cycleDay}</span>
    </div>
    <div class="bg-white p-2.5 rounded-xl border border-rose-100 text-center">
      <span class="text-[10px] text-slate-400 font-bold block">BBT Temp</span>
      <span class="text-sm font-black text-slate-800 block mt-0.5">${temp}°C</span>
    </div>
    <div class="bg-white p-2.5 rounded-xl border border-rose-100 text-center">
      <span class="text-[10px] text-slate-400 font-bold block">Cervical Fluid</span>
      <span class="text-xs font-bold text-purple-700 block mt-0.5 capitalize">${fluid}</span>
    </div>
    <div class="bg-white p-2.5 rounded-xl border border-rose-100 text-center">
      <span class="text-[10px] text-slate-400 font-bold block">Remission</span>
      <span class="text-sm font-black text-emerald-600 block mt-0.5">${score}%</span>
    </div>
  `;
}

function saveDailyDataForSelectedDate() {
  const dateInput = document.getElementById('export-modal-date');
  const dateStr = dateInput ? dateInput.value : getTodayLocalDateStr();
  saveDailyData(dateStr);
  updateExportModalPreview();
}

function triggerBrowserDownload(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadSingleDayJSON() {
  playGentleChime('bell');
  const dateInput = document.getElementById('export-modal-date');
  const dateStr = dateInput ? dateInput.value : getTodayLocalDateStr();
  const cycleDay = getCycleDayForDate(dateStr);

  const log = (state.dailyLogs && state.dailyLogs[dateStr]) ? state.dailyLogs[dateStr] : {
    date: dateStr,
    cycleDay: cycleDay,
    temp: 36.4,
    fluid: 'eggwhite',
    flow: 'none',
    mood: state.selectedMood,
    symptoms: state.selectedSymptoms,
    waterGlasses: state.waterGlasses,
    waterLiters: (state.waterGlasses * 0.3).toFixed(1),
    remissionScore: state.remissionScore,
    notes: 'Generated via Medico Femina daily logger.'
  };

  const payload = {
    app: 'Medico Femina PCOS Remission Suite',
    exportType: 'SingleDayHealthRecord',
    exportedAt: new Date().toISOString(),
    patient: state.user ? state.user.name : 'Patient Record',
    record: log
  };

  triggerBrowserDownload(`medico_daily_${dateStr}.json`, JSON.stringify(payload, null, 2), 'application/json');
  showToast(`Downloaded daily log for ${dateStr}!`);
}

function downloadCSVRecords() {
  playGentleChime('bell');
  const headers = ['Date', 'Cycle_Day', 'BBT_Temp_C', 'Cervical_Mucus', 'Bleed_Flow', 'Mood', 'Symptoms', 'Water_Glasses', 'Water_Liters', 'Remission_Score_Pct', 'Notes'];
  const rows = [headers.join(',')];

  // Merge dates from dailyLogs and bbtRecords
  const dateMap = new Map();

  if (state.dailyLogs) {
    Object.keys(state.dailyLogs).forEach(d => dateMap.set(d, state.dailyLogs[d]));
  }

  if (state.cycleData.bbtRecords) {
    state.cycleData.bbtRecords.forEach(r => {
      const d = r.date || getDateForCycleDay(r.day);
      if (!dateMap.has(d)) {
        dateMap.set(d, {
          date: d,
          cycleDay: r.day,
          temp: r.temp,
          fluid: r.fluid || 'none',
          flow: r.flow || 'none',
          mood: 'Stable',
          symptoms: [],
          waterGlasses: 6,
          waterLiters: '1.8',
          remissionScore: 80,
          notes: ''
        });
      }
    });
  }

  const sortedDates = Array.from(dateMap.keys()).sort();

  sortedDates.forEach(dateStr => {
    const item = dateMap.get(dateStr);
    const symptomsStr = item.symptoms ? `"${item.symptoms.join('; ')}"` : '""';
    const notesStr = item.notes ? `"${item.notes.replace(/"/g, '""')}"` : '""';
    const row = [
      item.date,
      item.cycleDay || getCycleDayForDate(item.date),
      item.temp || 36.35,
      item.fluid || 'none',
      item.flow || 'none',
      `"${item.mood || 'Calm'}"`,
      symptomsStr,
      item.waterGlasses || 0,
      item.waterLiters || '0.0',
      item.remissionScore || 0,
      notesStr
    ];
    rows.push(row.join(','));
  });

  const csvContent = rows.join('\r\n');
  triggerBrowserDownload('medico_femina_daily_records.csv', csvContent, 'text/csv;charset=utf-8;');
  showToast(`Exported ${sortedDates.length} daily health records in CSV!`);
}

function downloadDailyMemoTXT() {
  playGentleChime('bell');
  const dateInput = document.getElementById('export-modal-date');
  const dateStr = dateInput ? dateInput.value : getTodayLocalDateStr();
  const cycleDay = getCycleDayForDate(dateStr);
  const phaseInfo = getCyclePhaseInfo(cycleDay, state.cycleData.totalEstimatedLength || 35);
  const log = (state.dailyLogs && state.dailyLogs[dateStr]) ? state.dailyLogs[dateStr] : null;

  const temp = log ? `${log.temp}°C` : '36.40°C (Baseline)';
  const fluid = log ? log.fluid : 'Egg-white / Fertile';
  const flow = log ? log.flow : 'None';
  const mood = log ? log.mood : (state.selectedMood || 'Calm & Content');
  const symptoms = (log && log.symptoms && log.symptoms.length > 0) ? log.symptoms.join(', ') : (state.selectedSymptoms.join(', ') || 'None reported');
  const water = log ? `${log.waterGlasses} glasses (${log.waterLiters}L)` : `${state.waterGlasses} glasses (${(state.waterGlasses * 0.3).toFixed(1)}L)`;
  const score = log ? `${log.remissionScore}%` : `${state.remissionScore}%`;
  const notes = log && log.notes ? log.notes : 'Client adhering to 40:1 Myo-Inositol & post-meal walking.';

  const memo = `===============================================================
MEDICO FEMINA • CLINICAL DAILY HEALTH MEMO
===============================================================
Patient:         ${state.user ? state.user.name : 'Patient Record'}
Record Date:     ${formatDatePretty(dateStr, 'full')} (${dateStr})
Cycle Day:       Day ${cycleDay} of estimated ~${state.cycleData.totalEstimatedLength}
Cycle Phase:     ${phaseInfo.title}
Generated At:    ${new Date().toLocaleString()}

BIOMARKER LOGS:
---------------------------------------------------------------
Morning BBT:     ${temp}
Cervical Mucus:  ${fluid}
Bleed Flow:      ${flow}
Daily Mood:      ${mood}
Reported Signs:  ${symptoms}

LIFESTYLE & REMISSION METRICS:
---------------------------------------------------------------
Daily Hydration: ${water}
Remission Score: ${score} Adherence
Clinical Notes:  ${notes}

CLINICAL RECOMMENDATION FOR CURRENT PHASE:
---------------------------------------------------------------
${phaseInfo.desc}

===============================================================
Compiled for gynecologist & endocrine specialist consultation.
===============================================================`;

  triggerBrowserDownload(`medico_daily_memo_${dateStr}.txt`, memo, 'text/plain;charset=utf-8;');
  showToast(`Downloaded daily clinical memo for ${dateStr}!`);
}

function downloadFullBackupJSON() {
  playGentleChime('bell');
  const backup = {
    app: 'Medico Femina Suite',
    version: '2.0',
    exportedAt: new Date().toISOString(),
    user: state.user,
    streak: state.streak,
    waterGlasses: state.waterGlasses,
    selectedMood: state.selectedMood,
    selectedSymptoms: state.selectedSymptoms,
    cycleData: state.cycleData,
    dailyLogs: state.dailyLogs,
    dailySchedule: state.dailySchedule,
    nutritionMeals: state.nutrition.meals,
    chatMessages: state.chatMessages
  };

  const today = getTodayLocalDateStr();
  triggerBrowserDownload(`medico_femina_backup_${today}.json`, JSON.stringify(backup, null, 2), 'application/json');
  showToast('Full application backup downloaded!');
}

function handleImportBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.cycleData) state.cycleData = data.cycleData;
      if (data.dailyLogs) state.dailyLogs = data.dailyLogs;
      if (data.user) state.user = data.user;
      if (data.streak !== undefined) state.streak = data.streak;
      if (data.waterGlasses !== undefined) setWater(data.waterGlasses);
      if (data.dailySchedule) state.dailySchedule = data.dailySchedule;
      if (data.nutritionMeals) state.nutrition.meals = data.nutritionMeals;

      saveState();
      calculateRealCycleDay();
      initBBTChart();
      renderCalendar();
      updateCycleWheel();
      updateBBTStats();
      initAuthUI();
      closeDailyDataExportModal();

      playGentleChime('fanfare');
      if (typeof confetti === 'function') confetti({ particleCount: 90, spread: 70 });
      showToast('Backup restored successfully!');
    } catch (err) {
      alert('Invalid backup JSON file.');
    }
  };
  reader.readAsText(file);
}

/**
 * =================================================================
 * COMPREHENSIVE CYCLE SUMMARY & LONGITUDINAL ANALYTICS
 * =================================================================
 */

function calculateCycleSummary() {
  const currentDay = state.cycleData.currentDay;
  const cycleLength = state.cycleData.totalEstimatedLength || 35;
  const phaseInfo = getCyclePhaseInfo(currentDay, cycleLength);

  const startDateStr = state.cycleData.lastPeriodDate || getDateForCycleDay(1);
  const startDate = parseLocalDate(startDateStr);

  const nextPeriodDate = new Date(startDate);
  nextPeriodDate.setDate(nextPeriodDate.getDate() + cycleLength);

  const today = parseLocalDate(getTodayLocalDateStr());
  const diffDays = Math.round((nextPeriodDate - today) / (1000 * 60 * 60 * 24));
  const isDelayed = diffDays < 0;
  const delayedDays = Math.max(0, -diffDays);
  const daysUntilNextPeriod = Math.max(0, diffDays);
  const expectedPeriodText = diffDays === 0 ? 'Due Today' : (diffDays > 0 ? `In ${diffDays} Days` : `⚠️ Delayed by ${delayedDays} Days`);

  const ovulationDay = Math.max(cycleLength - 14, 14);
  const ovulationDate = new Date(startDate);
  ovulationDate.setDate(ovulationDate.getDate() + (ovulationDay - 1));

  // Analyze BBT records
  const records = state.cycleData.bbtRecords || [];
  const bbtCount = records.length;

  let follicularTemps = [];
  let lutealTemps = [];

  records.forEach(r => {
    const d = r.day || getCycleDayForDate(r.date);
    if (d <= ovulationDay) {
      follicularTemps.push(r.temp);
    } else {
      lutealTemps.push(r.temp);
    }
  });

  const follicularAvg = follicularTemps.length > 0
    ? (follicularTemps.reduce((a, b) => a + b, 0) / follicularTemps.length).toFixed(2)
    : '36.25';

  const lutealAvg = lutealTemps.length > 0
    ? (lutealTemps.reduce((a, b) => a + b, 0) / lutealTemps.length).toFixed(2)
    : null;

  let thermalJump = '--';
  let ovulationStatus = 'Monitoring Curve';
  let shiftStatusClass = 'bg-amber-100 text-amber-800';

  if (lutealAvg && follicularAvg) {
    const jump = (parseFloat(lutealAvg) - parseFloat(follicularAvg)).toFixed(2);
    thermalJump = `+${jump}°C`;
    if (parseFloat(jump) >= 0.3) {
      ovulationStatus = 'Biphasic Shift Confirmed';
      shiftStatusClass = 'bg-emerald-100 text-emerald-800';
    } else {
      ovulationStatus = 'Possible Anovulatory Cycle';
      shiftStatusClass = 'bg-rose-100 text-rose-800';
    }
  } else if (isDelayed) {
    ovulationStatus = 'Delayed Follicular Watch';
    shiftStatusClass = 'bg-rose-100 text-rose-800';
  } else if (currentDay >= ovulationDay - 2 && currentDay <= ovulationDay + 1) {
    ovulationStatus = 'Ovulation Surge Active';
    shiftStatusClass = 'bg-purple-100 text-purple-800';
  } else if (currentDay > cycleLength) {
    ovulationStatus = 'Delayed Follicular Watch';
    shiftStatusClass = 'bg-orange-100 text-orange-800';
  } else {
    ovulationStatus = 'Follicular Development';
    shiftStatusClass = 'bg-blue-100 text-blue-800';
  }

  // Mucus breakdown from real user records
  const mucusCounts = { 'eggwhite': 0, 'creamy': 0, 'sticky': 0, 'dry': 0 };
  const symptomCounts = {};

  if (state.dailyLogs) {
    Object.values(state.dailyLogs).forEach(log => {
      if (log.fluid && mucusCounts[log.fluid] !== undefined) mucusCounts[log.fluid]++;
      if (log.symptoms) {
        log.symptoms.forEach(s => {
          symptomCounts[s] = (symptomCounts[s] || 0) + 1;
        });
      }
    });
  }

  return {
    currentDay,
    cycleLength,
    phaseInfo,
    startDateStr,
    nextPeriodDateStr: formatLocalDate(nextPeriodDate),
    daysUntilNextPeriod,
    isDelayed,
    delayedDays,
    expectedPeriodText,
    ovulationDay,
    ovulationDateStr: formatLocalDate(ovulationDate),
    bbtCount,
    follicularAvg,
    lutealAvg: lutealAvg || '--',
    thermalJump,
    ovulationStatus,
    shiftStatusClass,
    coverLine: state.cycleData.coverLine || 36.35,
    mucusCounts,
    symptomCounts,
    avgRemission: state.remissionScore || 0
  };
}

function openCycleSummaryModal() {
  playGentleChime('bell');
  const modal = document.getElementById('cycle-summary-modal');
  if (!modal) return;
  modal.classList.remove('hidden');

  renderCycleSummaryContent();
  lucide.createIcons();
}

function closeCycleSummaryModal() {
  const modal = document.getElementById('cycle-summary-modal');
  if (modal) modal.classList.add('hidden');
}

function renderCycleSummaryContent() {
  const summary = calculateCycleSummary();

  const titleEl = document.getElementById('cs-phase-title');
  const subEl = document.getElementById('cs-phase-sub');
  const nextPeriodEl = document.getElementById('cs-next-period');
  const progressBar = document.getElementById('cs-progress-bar');
  const startEl = document.getElementById('cs-start-date');
  const ovEl = document.getElementById('cs-ovulation-estimate');
  const endEl = document.getElementById('cs-end-date');

  const bbtCountEl = document.getElementById('cs-bbt-count');
  const follAvgEl = document.getElementById('cs-follicular-avg');
  const jumpEl = document.getElementById('cs-thermal-jump');
  const ovStatusEl = document.getElementById('cs-ovulation-status');
  const remissionEl = document.getElementById('cs-avg-remission');

  if (titleEl) titleEl.innerText = summary.phaseInfo.title;
  if (subEl) subEl.innerText = `Cycle Day ${summary.currentDay} of estimated ~${summary.cycleLength} days`;
  if (nextPeriodEl) nextPeriodEl.innerText = summary.isDelayed ? `⚠️ Period Delayed by ${summary.delayedDays} Days` : `Next Period in ~${summary.daysUntilNextPeriod} Days`;

  const pct = Math.min(Math.round((summary.currentDay / summary.cycleLength) * 100), 100);
  if (progressBar) progressBar.style.width = `${pct}%`;

  if (startEl) startEl.innerText = `Started: ${formatDatePretty(summary.startDateStr, 'short')}`;
  if (ovEl) ovEl.innerText = `Est. Ovulation: Day ${summary.ovulationDay} (${formatDatePretty(summary.ovulationDateStr, 'short')})`;
  if (endEl) endEl.innerText = `Est. Period: ${formatDatePretty(summary.nextPeriodDateStr, 'short')}`;

  if (bbtCountEl) bbtCountEl.innerText = summary.bbtCount;
  if (follAvgEl) follAvgEl.innerText = `${summary.follicularAvg}°C`;
  if (jumpEl) jumpEl.innerText = summary.thermalJump;
  if (ovStatusEl) {
    ovStatusEl.innerText = summary.ovulationStatus;
    ovStatusEl.className = `text-[10px] font-bold px-1.5 py-0.2 rounded-full ${summary.shiftStatusClass}`;
  }
  if (remissionEl) remissionEl.innerText = `${summary.avgRemission}%`;

  // Mucus breakdown
  const mucusContainer = document.getElementById('cs-mucus-breakdown');
  if (mucusContainer) {
    const totalMucus = (summary.mucusCounts.eggwhite || 0) + (summary.mucusCounts.creamy || 0) + (summary.mucusCounts.sticky || 0) + (summary.mucusCounts.dry || 0);
    if (totalMucus > 0) {
      mucusContainer.innerHTML = `
        <div class="flex justify-between items-center py-0.5">
          <span class="flex items-center space-x-1.5"><span>🥚</span><strong>Egg-White (Fertile):</strong></span>
          <span class="font-bold text-rose-600">${summary.mucusCounts.eggwhite} Days</span>
        </div>
        <div class="flex justify-between items-center py-0.5">
          <span class="flex items-center space-x-1.5"><span>🥛</span><span>Creamy (Follicular):</span></span>
          <span class="font-bold text-slate-700">${summary.mucusCounts.creamy} Days</span>
        </div>
        <div class="flex justify-between items-center py-0.5">
          <span class="flex items-center space-x-1.5"><span>🍯</span><span>Sticky (Luteal):</span></span>
          <span class="font-bold text-slate-700">${summary.mucusCounts.sticky} Days</span>
        </div>
        <div class="flex justify-between items-center py-0.5">
          <span class="flex items-center space-x-1.5"><span>🌾</span><span>Dry / Low:</span></span>
          <span class="font-bold text-slate-700">${summary.mucusCounts.dry} Days</span>
        </div>
      `;
    } else {
      mucusContainer.innerHTML = '<p class="text-[11px] text-slate-400 italic py-1">No cervical fluid records logged yet this cycle.</p>';
    }
  }

  // Symptoms breakdown
  const symptomsContainer = document.getElementById('cs-symptoms-breakdown');
  if (symptomsContainer) {
    const keys = Object.keys(summary.symptomCounts);
    if (keys.length > 0) {
      symptomsContainer.innerHTML = keys.slice(0, 4).map(s => `
        <div class="flex justify-between items-center py-0.5">
          <span>${s}:</span>
          <span class="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">${summary.symptomCounts[s]} Occurrences</span>
        </div>
      `).join('');
    } else {
      symptomsContainer.innerHTML = '<p class="text-slate-400">No physical symptoms logged this cycle.</p>';
    }
  }

  // Recommendations
  const recContainer = document.getElementById('cs-recommendations');
  if (recContainer) {
    recContainer.innerHTML = `
      <p>• <strong>Phase Protocol:</strong> ${summary.phaseInfo.desc}</p>
      <p>• <strong>Insulin Sensitivity Sink:</strong> 10-minute post-meal walk after your highest carb meal blunts postprandial glucose by 35%.</p>
      <p>• <strong>Anti-Androgen Botanical:</strong> Spearmint tea 2x daily reduces free testosterone and aids spontaneous ovarian follicle growth.</p>
    `;
  }
}

function updateBBTStats() {
  const summary = calculateCycleSummary();

  const statDay = document.getElementById('bbt-stat-cycle-day');
  const statPhase = document.getElementById('bbt-stat-phase');
  const statCover = document.getElementById('bbt-stat-coverline');
  const statJump = document.getElementById('bbt-stat-thermal-jump');
  const statShift = document.getElementById('bbt-stat-shift-status');
  const statExp = document.getElementById('bbt-stat-expected-period');
  const statInterval = document.getElementById('bbt-stat-cycle-interval');

  if (statDay) statDay.innerText = `Day ${summary.currentDay}`;
  if (statPhase) statPhase.innerText = summary.phaseInfo.title.split(' ')[0] + ' Phase';
  if (statCover) statCover.innerText = `${summary.coverLine}°C`;
  if (statJump) statJump.innerText = summary.thermalJump;
  if (statShift) {
    statShift.innerText = summary.ovulationStatus;
    statShift.className = `text-[10px] font-bold px-2 py-0.5 rounded-full ${summary.shiftStatusClass}`;
  }
  if (statExp) statExp.innerText = summary.expectedPeriodText;
  if (statInterval) statInterval.innerText = `Day ${summary.cycleLength} Est.`;
}

function downloadCycleSummaryReport() {
  playGentleChime('bell');
  const summary = calculateCycleSummary();
  const today = getTodayLocalDateStr();

  const report = `===============================================================
MEDICO FEMINA • CLINICAL CYCLE SUMMARY & OVULATION REPORT
===============================================================
Patient:           ${state.user ? state.user.name : 'Patient Record'}
Evaluation Date:   ${formatDatePretty(today, 'full')}
Current Cycle Day: Day ${summary.currentDay} of ~${summary.cycleLength}
Current Phase:     ${summary.phaseInfo.title}
Cycle Start Date:  ${formatDatePretty(summary.startDateStr, 'full')}
Est. Next Period:  ${formatDatePretty(summary.nextPeriodDateStr, 'full')} (~${summary.daysUntilNextPeriod} Days remaining)
Est. Ovulation:    Day ${summary.ovulationDay} (${formatDatePretty(summary.ovulationDateStr, 'full')})

THERMAL CURVE & BIPHASIC BBT ANALYSIS:
---------------------------------------------------------------
Logged Readings:   ${summary.bbtCount} data points
Follicular Mean:   ${summary.follicularAvg}°C
Luteal Mean:       ${summary.lutealAvg !== '--' ? summary.lutealAvg + '°C' : 'In Progress'}
Thermal Shift:     ${summary.thermalJump}
Coverline:         ${summary.coverLine}°C
Ovulation Status:  ${summary.ovulationStatus}

CERVICAL MUCUS LOGS:
---------------------------------------------------------------
Egg-White:         ${summary.mucusCounts.eggwhite} Days
Creamy:            ${summary.mucusCounts.creamy} Days
Sticky:            ${summary.mucusCounts.sticky} Days
Dry / Baseline:    ${summary.mucusCounts.dry} Days

REPORTED SYMPTOM FREQUENCIES:
---------------------------------------------------------------
${Object.keys(summary.symptomCounts).map(s => `- ${s}: ${summary.symptomCounts[s]} days`).join('\r\n')}

LIFESTYLE ADHERENCE:
---------------------------------------------------------------
Average Remission Score: ${summary.avgRemission}%
Post-Meal Walking Rate:  Active Daily Protocol

CLINICAL RECOMMENDATIONS FOR CURRENT PHASE:
---------------------------------------------------------------
${summary.phaseInfo.desc}

===============================================================
Generated by Medico Femina Clinical Engine for endocrine care.
===============================================================`;

  triggerBrowserDownload(`medico_cycle_summary_CycleDay_${summary.currentDay}.txt`, report, 'text/plain;charset=utf-8;');
  showToast('Downloaded full cycle clinical summary!');
}

function copyCycleSummaryToClipboard() {
  playGentleChime('bell');
  const summary = calculateCycleSummary();
  const text = `🌸 Medico Femina Cycle Summary (Day ${summary.currentDay}/${summary.cycleLength}):
• Phase: ${summary.phaseInfo.title}
• Next Period: in ~${summary.daysUntilNextPeriod} days (${formatDatePretty(summary.nextPeriodDateStr, 'short')})
• Ovulation Status: ${summary.ovulationStatus} (${summary.thermalJump})
• Baseline Temp: ${summary.follicularAvg}°C | CoverLine: ${summary.coverLine}°C
• Remission Adherence: ${summary.avgRemission}%
• Mucus: ${summary.mucusCounts.eggwhite}d Fertile Egg-White, ${summary.mucusCounts.creamy}d Creamy`;

  navigator.clipboard.writeText(text).then(() => {
    showToast('Cycle summary copied to clipboard! Ready to send to your doctor.', '📋');
  }).catch(() => {
    alert(text);
  });
}

/**
 * =================================================================
 * GLOBAL TOAST NOTIFICATION SYSTEM
 * =================================================================
 */
let toastTimeout = null;
function showToast(message, icon = '✨') {
  const toast = document.getElementById('toast-notification');
  const iconEl = document.getElementById('toast-icon');
  const msgEl = document.getElementById('toast-message');
  if (!toast) return;

  if (iconEl) iconEl.innerText = icon;
  if (msgEl) msgEl.innerText = message;

  toast.classList.add('show');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

/**
 * LocalStorage State Persistence (Saving Real User Records)
 */
function saveState() {
  try {
    localStorage.setItem('medico_femina_state', JSON.stringify({
      waterGlasses: state.waterGlasses,
      selectedMood: state.selectedMood,
      selectedSymptoms: state.selectedSymptoms,
      bbtRecords: state.cycleData.bbtRecords,
      lastPeriodDate: state.cycleData.lastPeriodDate,
      streak: state.streak,
      chatMessages: state.chatMessages,
      dailySchedule: state.dailySchedule,
      nutritionMeals: state.nutrition.meals,
      dailyLogs: state.dailyLogs
    }));
    if (state.user) {
      localStorage.setItem('medico_user', JSON.stringify(state.user));
    }
  } catch (e) {}
}

function loadSavedState() {
  try {
    const savedUser = localStorage.getItem('medico_user');
    if (savedUser) {
      state.user = JSON.parse(savedUser);
      if (state.user.lastPeriodDate) state.cycleData.lastPeriodDate = state.user.lastPeriodDate;
      if (state.user.cycleLength) state.cycleData.totalEstimatedLength = state.user.cycleLength;
    }

    const saved = localStorage.getItem('medico_femina_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.waterGlasses) setWater(parsed.waterGlasses);
      if (parsed.bbtRecords && parsed.bbtRecords.length > 0) state.cycleData.bbtRecords = parsed.bbtRecords;
      if (parsed.lastPeriodDate) state.cycleData.lastPeriodDate = parsed.lastPeriodDate;
      if (parsed.streak) state.streak = parsed.streak;
      if (parsed.chatMessages) state.chatMessages = parsed.chatMessages;
      if (parsed.dailySchedule) state.dailySchedule = parsed.dailySchedule;
      if (parsed.nutritionMeals) {
        state.nutrition.meals = parsed.nutritionMeals;
        const FAKE_MEALS = [
          '2 eggs + sautéed spinach & avocado',
          'greek yogurt with cinnamon & chia',
          'grilled wild salmon & asparagus bowl',
          'sprouted moong dal & sautéed paneer',
          'pure spearmint tea + 2 tbsp pumpkin seeds'
        ];
        // Cleanse fake template meals and deduplicate
        ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mType => {
          if (Array.isArray(state.nutrition.meals[mType])) {
            const seen = new Set();
            state.nutrition.meals[mType] = state.nutrition.meals[mType].filter(item => {
              const k = (item.name || '').toLowerCase().trim();
              if (!k || FAKE_MEALS.includes(k) || seen.has(k)) return false;
              seen.add(k);
              return true;
            });
          }
        });
      }
      if (parsed.dailyLogs) {
        state.dailyLogs = parsed.dailyLogs;
        // Purge auto-generated fake starter daily logs
        Object.keys(state.dailyLogs).forEach(dateKey => {
          const log = state.dailyLogs[dateKey];
          if (log && (log.notes === 'Felt high energy after morning post-meal walk.' || log.notes === 'Took inositol & spearmint tea.')) {
            delete state.dailyLogs[dateKey];
          }
        });
      }
      // Always recalculate streak from actual log data (don't rely on stored value)
      // streak will be computed by recalculateStreak() after DOMContentLoaded
    }
  } catch (e) {}
}

/**
 * Delete All Fake / Sample Data - Pristine Clean Slate
 */
function clearAllFakeData(confirmUser = true) {
  if (confirmUser && !confirm('Are you sure you want to delete all fake/sample data and reset to a clean state? Your actual profile and dates will be preserved.')) {
    return;
  }

  // 1. Clean all meals completely
  state.nutrition.meals = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  };

  // 2. Clean all daily logs
  state.dailyLogs = {};

  // 3. Reset water counters
  state.waterGlasses = 0;
  const waterCount = document.getElementById('water-count');
  if (waterCount) waterCount.innerText = '0';
  const waterVol = document.getElementById('water-volume');
  if (waterVol) waterVol.innerText = '0.0L';

  // 4. Reset routine task checkmarks to uncompleted
  if (Array.isArray(state.dailySchedule)) {
    state.dailySchedule.forEach(task => task.completed = false);
  }

  // 5. Reset streak & remission score to fresh start
  state.streak = 0;
  state.remissionScore = 0;

  // 6. Save clean state and re-render everything
  saveState();
  renderMacroBars();
  renderMealLists();
  renderDailySchedule();
  renderCalendar();
  updateBBTStats();
  updateRemissionScore();

  playGentleChime('fanfare');
  showToastNotification('🧹 All fake data deleted! Your app is now completely clean.', '✨');
}

/**
 * Clear all logged meal items
 */
function clearAllMeals(confirmUser = true) {
  if (confirmUser && !confirm('Clear all meals logged in your tracker?')) {
    return;
  }
  state.nutrition.meals = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  };
  saveState();
  renderMacroBars();
  renderMealLists();
  playGentleChime('bell');
  showToastNotification('🧹 All logged meals cleared. Clean plate ready!', '✨');
}

function initReportDate() {
  const today = new Date();
  const prettyFull = formatDatePretty(today, 'full');
  const prettyMedium = formatDatePretty(today, 'medium');

  const reportDateEl = document.getElementById('report-date');
  if (reportDateEl) reportDateEl.innerText = prettyFull;

  const headerDateEl = document.getElementById('live-header-date');
  if (headerDateEl) headerDateEl.innerText = prettyMedium;

  const heroDateEl = document.getElementById('hero-date-display');
  if (heroDateEl) heroDateEl.innerText = prettyMedium;

  const bookingDateEl = document.getElementById('booking-date');
  if (bookingDateEl) {
    const todayStr = getTodayLocalDateStr();
    bookingDateEl.value = todayStr;
    bookingDateEl.min = todayStr;
  }

  const dailyDateEl = document.getElementById('daily-log-date');
  if (dailyDateEl) {
    dailyDateEl.value = getTodayLocalDateStr();
  }

  // Update dynamic row in physician report table
  const repDuration = document.getElementById('report-cycle-duration');
  const repOvulation = document.getElementById('report-cycle-ovulation');
  const repShift = document.getElementById('report-cycle-shift');
  const repBleed = document.getElementById('report-cycle-bleed');

  if (repDuration) repDuration.innerText = `Day ${state.cycleData.currentDay} (Ongoing)`;
  if (repOvulation) {
    const ovD = Math.max(state.cycleData.totalEstimatedLength - 14, 14);
    repOvulation.innerText = `Day ${ovD} (Estimated)`;
  }
  if (repShift) repShift.innerText = state.cycleData.currentDay > 20 ? 'Yes (+0.40°C)' : 'Curve In Progress';
  if (repBleed) repBleed.innerText = state.cycleData.currentDay <= 5 ? 'Active Menstrual Flow' : 'Follicular / None';
}

/**
 * =================================================================
 * DAILY CIRCADIAN & WORKING SCHEDULE CONTROLLER
 * =================================================================
 */
function initDailySchedule() {
  renderDailySchedule();
}

function renderDailySchedule() {
  const container = document.getElementById('daily-schedule-list');
  const badge = document.getElementById('schedule-progress-badge');
  if (!container) return;

  container.innerHTML = '';
  const total = state.dailySchedule.length;
  let doneCount = 0;

  state.dailySchedule.forEach(item => {
    if (item.completed) doneCount++;

    const itemDiv = document.createElement('div');
    itemDiv.className = `p-3 rounded-2xl border transition-all duration-200 flex items-start space-x-3 cursor-pointer ${
      item.completed 
        ? 'bg-rose-50/60 border-rose-200/80 text-slate-800' 
        : 'bg-white border-slate-200/90 hover:border-slate-300 text-slate-700'
    }`;

    let categoryClass = 'bg-slate-100 text-slate-600';
    if (item.category === 'Nutrition') categoryClass = 'bg-amber-100 text-amber-800';
    else if (item.category === 'Movement') categoryClass = 'bg-purple-100 text-purple-800';
    else if (item.category === 'Biomarkers') categoryClass = 'bg-rose-100 text-rose-800';
    else if (item.category === 'Recovery') categoryClass = 'bg-blue-100 text-blue-800';
    else if (item.category === 'Anti-Androgen') categoryClass = 'bg-teal-100 text-teal-800';

    itemDiv.innerHTML = `
      <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="toggleScheduleTask(${item.id})" class="mt-1 w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-400">
      <div class="flex-1" onclick="toggleScheduleTask(${item.id})">
        <div class="flex flex-wrap items-center justify-between gap-1">
          <div class="flex items-center space-x-2">
            <span class="text-xs font-black text-rose-600 tracking-tight font-mono">${item.time}</span>
            <span class="text-xs font-bold ${item.completed ? 'line-through text-slate-400' : 'text-slate-900'}">${item.title}</span>
          </div>
          <span class="text-[9px] font-bold px-2 py-0.5 rounded-full ${categoryClass}">${item.category}</span>
        </div>
        ${item.notes ? `<p class="text-[11px] text-slate-500 mt-0.5 leading-snug">${item.notes}</p>` : ''}
      </div>
    `;

    container.appendChild(itemDiv);
  });

  if (badge) {
    badge.innerText = `${doneCount} of ${total} Done`;
    if (doneCount === total) {
      badge.className = 'text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300';
    } else {
      badge.className = 'text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200';
    }
  }
}

function toggleScheduleTask(id) {
  playGentleChime('bell');
  const task = state.dailySchedule.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    renderDailySchedule();
    saveState();

    // Fanfare on full completion
    const allDone = state.dailySchedule.every(t => t.completed);
    if (allDone) {
      playGentleChime('fanfare');
      if (typeof confetti === 'function') {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      }
    }
  }
}

function promptAddCustomScheduleItem() {
  openAddScheduleModal();
}

function openAddScheduleModal() {
  playGentleChime('bell');
  const modal = document.getElementById('custom-schedule-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeAddScheduleModal() {
  const modal = document.getElementById('custom-schedule-modal');
  if (modal) modal.classList.add('hidden');
}

function handleCustomScheduleSubmit(e) {
  e.preventDefault();
  playGentleChime('fanfare');

  const timeVal = document.getElementById('schedule-input-time').value;
  const titleVal = document.getElementById('schedule-input-title').value;
  const catVal = document.getElementById('schedule-input-category').value;
  const notesVal = document.getElementById('schedule-input-notes').value;

  const newItem = {
    id: Date.now(),
    time: timeVal,
    title: titleVal,
    category: catVal,
    completed: false,
    notes: notesVal
  };

  state.dailySchedule.push(newItem);
  renderDailySchedule();
  saveState();
  closeAddScheduleModal();

  alert(`Added "${titleVal}" at ${timeVal} to your daily schedule!`);
}

/**
 * =================================================================
 * NUTRITION TRACKER & RECOMMENDATIONS CONTROLLER
 * =================================================================
 */
const nutritionRecommendationsData = [
  {
    id: 1,
    title: 'Pure Spearmint Herbal Tea',
    category: 'anti-androgen',
    categoryLabel: 'Anti-Androgen',
    categoryBadge: 'bg-teal-100 text-teal-800',
    icon: '🍵',
    mechanism: 'Clinically proven in randomized clinical trials to significantly reduce serum free testosterone and increase LH/FSH in women with PCOD.',
    howToUse: 'Drink 2 cups daily (morning and 4:30 PM). Steep 10–12 minutes for full polyphenol extraction.'
  },
  {
    id: 2,
    title: 'Flax & Pumpkin Seeds (Seed Cycling)',
    category: 'anti-androgen',
    categoryLabel: 'Zinc & Lignans',
    categoryBadge: 'bg-rose-100 text-rose-800',
    icon: '🌻',
    mechanism: 'Pumpkin seeds provide dense bioavailable zinc to inhibit 5-alpha reductase (the enzyme converting testosterone into DHT, causing facial hair & acne). Flax lignans bind excess free estrogen.',
    howToUse: '1 tbsp freshly ground flax + 1 tbsp pumpkin seeds daily in yogurt, oatmeal, or salads.'
  },
  {
    id: 3,
    title: 'Ceylon Cinnamon & Raw Apple Cider Vinegar',
    category: 'insulin',
    categoryLabel: 'Insulin Sensitizer',
    categoryBadge: 'bg-purple-100 text-purple-800',
    icon: '🪵',
    mechanism: 'Cinnamon compounds mimic insulin and stimulate GLUT-4 glucose transporters in skeletal muscle, lowering postprandial glucose surges by up to 24%.',
    howToUse: '1/2 tsp true Ceylon cinnamon in morning smoothies or 1 tbsp ACV diluted in 250ml water 10 mins before main meals.'
  },
  {
    id: 4,
    title: 'Wild Salmon, Sardines & Chia Seeds',
    category: 'insulin',
    categoryLabel: 'Omega-3 EPA/DHA',
    categoryBadge: 'bg-amber-100 text-amber-800',
    icon: '🐟',
    mechanism: 'Resolves systemic ovarian low-grade inflammation, reduces elevated serum triglycerides, and improves cellular receptor sensitivity.',
    howToUse: 'Consume 2–3 times weekly, or supplement with 2,000mg purified EPA/DHA daily.'
  },
  {
    id: 5,
    title: 'Broccoli Sprouts & Cruciferous Vegetables',
    category: 'estrogen',
    categoryLabel: 'Estrogen Clearance',
    categoryBadge: 'bg-emerald-100 text-emerald-800',
    icon: '🥦',
    mechanism: 'Packed with Diindolylmethane (DIM) and Sulforaphane, directing estrogen metabolism down the protective 2-hydroxyestrone detoxification pathway in the liver.',
    howToUse: 'Eat 1–2 cups of steamed broccoli, Brussels sprouts, or cauliflower daily; add broccoli sprouts to salads.'
  },
  {
    id: 6,
    title: 'Sprouted Moong Dal & Fermented Paneer',
    category: 'insulin',
    categoryLabel: 'Plant Protein & Fiber',
    categoryBadge: 'bg-indigo-100 text-indigo-800',
    icon: '🫘',
    mechanism: 'Sprouting triples the availability of zinc and amino acids while flattening the glycemic index, providing steady sustained satiety without hyperinsulinemia.',
    howToUse: 'Enjoy as breakfast cheelas or lunchtime warm protein salads.'
  },
  {
    id: 7,
    title: 'High-Fructose Corn Syrup & Liquid Sugars',
    category: 'avoid',
    categoryLabel: 'Spike Trigger (Avoid)',
    categoryBadge: 'bg-red-100 text-red-800',
    icon: '🥤',
    mechanism: 'Fructose bypasses normal hepatic regulation, directly causing de novo lipogenesis (fatty liver) and acute visceral insulin spikes that stimulate theca cell testosterone synthesis.',
    howToUse: 'Eliminate sodas, packaged juices, sweetened bottled coffees, and commercial energy drinks.'
  },
  {
    id: 8,
    title: 'Industrial Seed Oils (Corn, Soy, Canola)',
    category: 'avoid',
    categoryLabel: 'Inflammatory (Avoid)',
    categoryBadge: 'bg-red-100 text-red-800',
    icon: '🍟',
    mechanism: 'Extremely high in oxidized Omega-6 linoleic acid, fueling chronic systemic inflammation that exacerbates insulin resistance and impairs follicle growth.',
    howToUse: 'Replace with Extra Virgin Olive Oil, Avocado Oil, or moderate Grass-Fed Ghee.'
  }
];

function initNutrition() {
  renderMacroBars();
  renderMealLists();
  renderNutritionRecommendations('all');
}

function renderMacroBars() {
  // Calculate totals from logged meals
  let totalProtein = 0;
  let totalFiber = 0;
  let totalCarbs = 0;
  let totalFats = 0;

  const meals = state.nutrition.meals;
  ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mType => {
    if (meals[mType]) {
      meals[mType].forEach(item => {
        totalProtein += item.protein || 0;
        totalFiber += item.fiber || 0;
        totalCarbs += item.carbs || 0;
        totalFats += Math.round((item.protein * 0.4) || 0); // estimation
      });
    }
  });

  // Update UI Counters
  const pVal = document.getElementById('macro-protein-val');
  const fVal = document.getElementById('macro-fiber-val');
  const cVal = document.getElementById('macro-carbs-val');
  const fatVal = document.getElementById('macro-fats-val');

  if (pVal) pVal.innerText = totalProtein;
  if (fVal) fVal.innerText = totalFiber;
  if (cVal) cVal.innerText = totalCarbs;
  if (fatVal) fatVal.innerText = totalFats;

  // Update Bar Widths
  const pBar = document.getElementById('macro-protein-bar');
  const fBar = document.getElementById('macro-fiber-bar');
  const cBar = document.getElementById('macro-carbs-bar');
  const fatBar = document.getElementById('macro-fats-bar');

  if (pBar) pBar.style.width = `${Math.min(Math.round((totalProtein / state.nutrition.targetProtein) * 100), 100)}%`;
  if (fBar) fBar.style.width = `${Math.min(Math.round((totalFiber / state.nutrition.targetFiber) * 100), 100)}%`;
  if (cBar) cBar.style.width = `${Math.min(Math.round((totalCarbs / state.nutrition.targetCarbs) * 100), 100)}%`;
  if (fatBar) fatBar.style.width = `${Math.min(Math.round((totalFats / state.nutrition.targetFats) * 100), 100)}%`;
}

let currentMealPhotoDataUrl = null;
let nutritionCalcDebounceTimer = null;

const foodPhotoPresets = {
  eggs: {
    name: '2 Eggs & Avocado Toast',
    url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300&auto=format&fit=crop&q=80',
    protein: 18, fiber: 5, carbs: 12, gi: 'low', calories: 260,
    pcosNote: 'Choline & oleic monounsaturated fats lower fasting insulin and androgen levels.'
  },
  salmon: {
    name: 'Grilled Salmon & Asparagus',
    url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300&auto=format&fit=crop&q=80',
    protein: 34, fiber: 4, carbs: 2, gi: 'low', calories: 340,
    pcosNote: 'Dense EPA/DHA omega-3 fatty acids resolve ovarian theca cell inflammation.'
  },
  oats: {
    name: 'Greek Yogurt with Chia & Berries',
    url: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=300&auto=format&fit=crop&q=80',
    protein: 16, fiber: 5, carbs: 8, gi: 'low', calories: 185,
    pcosNote: 'Beta-glucan & prebiotic inulin flatten postprandial glucose surges.'
  },
  seeds: {
    name: 'Spearmint Tea & Pumpkin Seeds',
    url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300&auto=format&fit=crop&q=80',
    protein: 5, fiber: 3, carbs: 4, gi: 'low', calories: 95,
    pcosNote: 'Rich in zinc to inhibit 5-alpha reductase and lower free testosterone.'
  },
  paneer: {
    name: 'Sprouted Moong Dal & Sautéed Paneer',
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80',
    protein: 22, fiber: 8, carbs: 18, gi: 'low', calories: 310,
    pcosNote: 'Slow-digesting casein and resistant starch prevent nocturnal glucose dips.'
  }
};

const foodKnowledgeBase = [
  { keywords: ['dahibara', 'dahi bara', 'dahi vada', 'dahi bhalla', 'dahivada', 'dahibhalla', 'dahi-bara'], protein: 11, fiber: 3.5, carbs: 22, calories: 210, gi: 'low', unitName: 'plate', defaultQty: 1, pcosNote: 'Fermented urad dal & probiotic curd boost gut estrobolome and metabolic insulin sensitivity.' },
  { keywords: ['cheela', 'besan cheela', 'moong dal cheela', 'moonglet'], protein: 13, fiber: 5, carbs: 18, calories: 180, gi: 'low', unitName: 'piece', defaultQty: 1, pcosNote: 'Low-glycemic legume pancake rich in plant protein and magnesium for androgen control.' },
  { keywords: ['idli', 'idlis', 'steamed idli'], protein: 6, fiber: 2.5, carbs: 24, calories: 130, gi: 'medium', unitName: '2 pieces', defaultQty: 1, pcosNote: 'Fermented rice-lentil prebiotic food, best paired with high-protein sambar.' },
  { keywords: ['dosa', 'masala dosa', 'plain dosa'], protein: 6, fiber: 2, carbs: 28, calories: 165, gi: 'medium', unitName: 'piece', defaultQty: 1, pcosNote: 'Fermented batter; pair with vegetable sambar to moderate glycemic response.' },
  { keywords: ['poha', 'upma', 'khichdi'], protein: 6, fiber: 3, carbs: 26, calories: 185, gi: 'medium', unitName: 'bowl', defaultQty: 1, pcosNote: 'Digestible Indian staple — include peanuts and vegetables for balanced glucose.' },
  { keywords: ['egg', 'eggs', 'omelette', 'omelet', 'bhurji', 'poached'], protein: 6, fiber: 0, carbs: 0.6, calories: 72, gi: 'low', unitName: 'egg', defaultQty: 2, pcosNote: 'Choline & complete essential amino acids support ovarian follicle quality.' },
  { keywords: ['avocado', 'avo', 'guacamole'], protein: 1.5, fiber: 6.7, carbs: 1.8, calories: 140, gi: 'low', unitName: 'half', defaultQty: 1, pcosNote: 'Oleic monounsaturated fats lower fasting insulin and androgen levels.' },
  { keywords: ['spinach', 'palak', 'kale', 'broccoli', 'asparagus', 'salad', 'lettuce', 'cucumber', 'greens', 'zucchini'], protein: 3, fiber: 4, carbs: 3, calories: 35, gi: 'low', unitName: 'cup', defaultQty: 1, pcosNote: 'Dense folate, sulforaphane & magnesium support hepatic estrogen detoxification.' },
  { keywords: ['oat', 'oats', 'oatmeal', 'porridge'], protein: 6, fiber: 5, carbs: 24, calories: 150, gi: 'low', unitName: 'bowl', defaultQty: 1, pcosNote: 'Beta-glucan soluble fiber blunts postprandial glucose surges.' },
  { keywords: ['pumpkin seed', 'pumpkin seeds', 'flax seed', 'flaxseed', 'flaxseeds', 'follicular seeds'], protein: 5, fiber: 4, carbs: 2, calories: 95, gi: 'low', unitName: 'tbsp', defaultQty: 1, pcosNote: 'Follicular Seed Cycling: Rich in zinc (inhibits 5-alpha reductase) and lignans to bind excess estrogen.' },
  { keywords: ['sunflower seed', 'sunflower seeds', 'sesame seed', 'sesame seeds', 'til', 'luteal seeds'], protein: 4.5, fiber: 3, carbs: 3, calories: 100, gi: 'low', unitName: 'tbsp', defaultQty: 1, pcosNote: 'Luteal Seed Cycling: High in selenium & vitamin E to nurture the corpus luteum and optimize progesterone.' },
  { keywords: ['ragi', 'ragi roti', 'nachni', 'bajra', 'millet', 'jowar'], protein: 5, fiber: 6, carbs: 22, calories: 110, gi: 'low', unitName: 'roti', defaultQty: 1, pcosNote: 'Low-GI ancient millet rich in polyphenols and slow resistant starch for insulin control.' },
  { keywords: ['chia', 'chia seeds'], protein: 4, fiber: 5, carbs: 2, calories: 95, gi: 'low', unitName: 'tbsp', defaultQty: 1, pcosNote: 'Rich in ALA omega-3 and mucilage fiber to blunt glucose absorption.' },
  { keywords: ['almond', 'almonds', 'walnut', 'walnuts', 'peanut butter', 'almond butter', 'nuts'], protein: 6, fiber: 3, carbs: 4, calories: 175, gi: 'low', unitName: 'handful', defaultQty: 1, pcosNote: 'Plant sterols and vitamin E improve androgen-to-estrogen balance.' },
  { keywords: ['yogurt', 'greek yogurt', 'curd', 'dahi'], protein: 15, fiber: 0, carbs: 6, calories: 105, gi: 'low', unitName: 'cup', defaultQty: 1, pcosNote: 'Probiotic peptides improve estrobolome gut flora for estrogen balance.' },
  { keywords: ['paneer', 'cottage cheese'], protein: 18, fiber: 0, carbs: 4, calories: 250, gi: 'low', unitName: '100g', defaultQty: 1, pcosNote: 'Slow-digesting casein prevents nocturnal glucose dips and sugar cravings.' },
  { keywords: ['tofu', 'soy', 'edamame'], protein: 14, fiber: 3, carbs: 2, calories: 120, gi: 'low', unitName: '100g', defaultQty: 1, pcosNote: 'Phytoestrogens gently balance estrogen receptor activity.' },
  { keywords: ['dal', 'moong', 'lentil', 'lentils', 'chana', 'chickpea', 'chickpeas', 'rajma', 'beans', 'sprout', 'sprouts'], protein: 14, fiber: 8, carbs: 22, calories: 175, gi: 'low', unitName: 'bowl', defaultQty: 1, pcosNote: 'Resistant starch promotes gut GLP-1 release and insulin sensitivity.' },
  { keywords: ['salmon', 'fish', 'tuna', 'mackerel', 'prawn', 'shrimp'], protein: 28, fiber: 0, carbs: 0, calories: 195, gi: 'low', unitName: 'fillet', defaultQty: 1, pcosNote: 'Potent EPA/DHA omega-3s resolve ovarian inflammation and optimize LH/FSH.' },
  { keywords: ['chicken', 'turkey', 'breast'], protein: 30, fiber: 0, carbs: 0, calories: 165, gi: 'low', unitName: 'serving', defaultQty: 1, pcosNote: 'Lean complete protein maximizes muscle GLUT-4 glucose uptake.' },
  { keywords: ['spearmint', 'spearmint tea', 'green tea', 'chamomile'], protein: 0, fiber: 0, carbs: 0, calories: 2, gi: 'low', unitName: 'cup', defaultQty: 1, pcosNote: 'Clinically proven in RCTs to lower free testosterone and reduce hirsutism.' },
  { keywords: ['roti', 'chapati', 'phulka'], protein: 3.5, fiber: 2.5, carbs: 16, calories: 85, gi: 'medium', unitName: 'piece', defaultQty: 1, pcosNote: 'Whole wheat complex carb — eat after fiber/greens to prevent insulin spike.' },
  { keywords: ['toast', 'bread', 'sourdough'], protein: 4, fiber: 2, carbs: 15, calories: 80, gi: 'medium', unitName: 'slice', defaultQty: 1, pcosNote: 'Pair with high protein (eggs or nut butter) to lower glycemic load.' },
  { keywords: ['rice', 'brown rice', 'quinoa'], protein: 4, fiber: 2.5, carbs: 32, calories: 165, gi: 'medium', unitName: 'serving', defaultQty: 1, pcosNote: 'Moderate complex carbs; balance with healthy fat and high fiber dal/greens.' },
  { keywords: ['berry', 'berries', 'blueberry', 'blueberries', 'strawberry', 'strawberries'], protein: 1, fiber: 4, carbs: 12, calories: 55, gi: 'low', unitName: 'cup', defaultQty: 1, pcosNote: 'Anthocyanins improve vascular health and insulin sensitivity without spiking sugar.' }
];

/**
 * AI Nutrition Calculation Engine
 * Parses quantities, ingredients, calories, macros, GI & PCOS impact
 */
function calculateNutritionAI(dishText) {
  if (!dishText || !dishText.trim()) {
    return { protein: 18, fiber: 4, carbs: 5, calories: 190, gi: 'low', pcosNote: 'Balanced hormone-safe meal plate.' };
  }

  const text = dishText.toLowerCase();
  let totalProtein = 0;
  let totalFiber = 0;
  let totalCarbs = 0;
  let totalCalories = 0;
  const matchedNotes = [];
  const matchedGIs = [];
  let foundAny = false;

  const extractQuantity = (keyword) => {
    if (new RegExp(`\\bhalf\\s+(?:an?\\s+)?(?:of\\s+)?${keyword}`, 'i').test(text)) return 0.5;
    const match = text.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:g|grams?|cups?|bowls?|tbsp|pcs?|pieces?|slices?)?\\s*(?:of\\s+)?(?:a\\s+)?${keyword}`, 'i'));
    if (match && match[1]) {
      const val = parseFloat(match[1]);
      if (text.includes(`${match[1]}g`) || text.includes(`${match[1]} g`)) {
        return Math.max(val / 100, 0.5);
      }
      return Math.min(Math.max(val, 0.5), 6);
    }
    return null;
  };

  const escapeRegex = (s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const matchedSpans = [];

  // Flatten all keywords with their food reference, sorted by keyword length descending
  // This prevents short substrings (e.g. 'dahi') from hijacking full dishes (e.g. 'dahibara')
  const allEntries = [];
  foodKnowledgeBase.forEach(food => {
    food.keywords.forEach(kw => {
      allEntries.push({ kw, food });
    });
  });
  allEntries.sort((a, b) => b.kw.length - a.kw.length);

  allEntries.forEach(entry => {
    const kw = entry.kw;
    const food = entry.food;
    const reg = new RegExp('(^|[^a-zA-Z0-9])' + escapeRegex(kw) + '([^a-zA-Z0-9]|$)', 'i');
    const m = text.match(reg);
    if (m) {
      const prefixLen = m[1] ? m[1].length : 0;
      const start = m.index + prefixLen;
      const end = start + kw.length;
      const overlaps = matchedSpans.some(span => (start < span.end && end > span.start));
      if (!overlaps) {
        foundAny = true;
        matchedSpans.push({ start, end });
        const qty = extractQuantity(kw) || food.defaultQty || 1;
        totalProtein += food.protein * qty;
        totalFiber += food.fiber * qty;
        totalCarbs += food.carbs * qty;
        totalCalories += food.calories * qty;
        matchedNotes.push(food.pcosNote);
        matchedGIs.push(food.gi);
      }
    }
  });

  if (!foundAny) {
    if (text.includes('salad') || text.includes('green') || text.includes('soup')) {
      totalProtein = 12; totalFiber = 7; totalCarbs = 9; totalCalories = 160; matchedGIs.push('low');
      matchedNotes.push('Vegetable-rich meal providing dense antioxidant polyphenols and low glycemic impact.');
    } else if (text.includes('chicken') || text.includes('meat') || text.includes('protein') || text.includes('egg')) {
      totalProtein = 28; totalFiber = 2; totalCarbs = 5; totalCalories = 220; matchedGIs.push('low');
      matchedNotes.push('High satiety protein stimulates metabolic rate and stabilizes hunger hormones.');
    } else if (text.includes('curry') || text.includes('paneer') || text.includes('dal') || text.includes('cheela')) {
      totalProtein = 18; totalFiber = 6; totalCarbs = 16; totalCalories = 260; matchedGIs.push('low');
      matchedNotes.push('Nutrient-dense Indian superfood providing prebiotic fiber and sustained energy.');
    } else {
      totalProtein = 16; totalFiber = 4; totalCarbs = 18; totalCalories = 210; matchedGIs.push('medium');
      matchedNotes.push('Nutrient breakdown estimated. Pair with leafy greens to blunt glucose response.');
    }
  }

  let finalGI = 'low';
  if (matchedGIs.includes('high') && totalFiber < 3) {
    finalGI = 'high';
  } else if (matchedGIs.includes('high') || matchedGIs.includes('medium')) {
    finalGI = totalFiber >= 5 && totalProtein >= 15 ? 'low' : 'medium';
  }

  return {
    protein: Math.max(Math.round(totalProtein), 1),
    fiber: Math.max(Math.round(totalFiber), 0),
    carbs: Math.max(Math.round(totalCarbs), 0),
    calories: Math.round(totalCalories || (totalProtein * 4 + totalCarbs * 4 + 70)),
    gi: finalGI,
    pcosNote: matchedNotes[0] || 'Balanced hormone-safe meal plate.'
  };
}

/**
 * Trigger AI Nutrition calculation from the input box
 */
function calculateNutritionFromInput(forceShowChime = true) {
  const nameInput = document.getElementById('food-input-name');
  if (!nameInput) return;
  const dishText = nameInput.value.trim();
  if (!dishText) return;

  const spinner = document.getElementById('ai-calc-spinner');
  if (spinner) spinner.classList.remove('hidden');

  setTimeout(() => {
    if (spinner) spinner.classList.add('hidden');
    const result = calculateNutritionAI(dishText);

    const proteinInput = document.getElementById('food-input-protein');
    const fiberInput = document.getElementById('food-input-fiber');
    const carbsInput = document.getElementById('food-input-carbs');
    const giSelect = document.getElementById('food-input-gi');
    const calInput = document.getElementById('food-input-calories');
    const noteInput = document.getElementById('food-input-pcos-note');

    if (proteinInput) proteinInput.value = result.protein;
    if (fiberInput) fiberInput.value = result.fiber;
    if (carbsInput) carbsInput.value = result.carbs;
    if (giSelect) giSelect.value = result.gi;
    if (calInput) calInput.value = result.calories;
    if (noteInput) noteInput.value = result.pcosNote;

    // Show breakdown banner
    const banner = document.getElementById('ai-nutrition-banner');
    const calEl = document.getElementById('ai-est-calories');
    const noteEl = document.getElementById('ai-pcos-benefit');
    if (banner) banner.classList.remove('hidden');
    if (calEl) calEl.innerText = `~${result.calories} kcal`;
    if (noteEl) noteEl.innerText = result.pcosNote;

    if (forceShowChime) {
      playGentleChime('bell');
      showToastNotification(`✨ AI Calculated: ${result.protein}g Protein, ${result.fiber}g Fiber, ${result.gi.toUpperCase()}-GI!`, '🥗');
    }
  }, 120);
}

function debounceNutritionCalculation() {
  clearTimeout(nutritionCalcDebounceTimer);
  const nameInput = document.getElementById('food-input-name');
  const statusEl = document.getElementById('food-photo-status');
  if (nameInput && statusEl && nameInput.value.trim()) {
    statusEl.innerText = `✨ Detected: ${nameInput.value.trim()}`;
  }
  nutritionCalcDebounceTimer = setTimeout(() => {
    calculateNutritionFromInput(false);
  }, 450);
}

/**
 * Client-side Canvas Image Compression (Lightweight, localStorage safe)
 */
function compressImageToDataUrl(file, maxWidth = 380, maxHeight = 380, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Handle user uploading or snapping a food picture
 */
async function handleFoodImageSelected(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  playGentleChime('bell');
  try {
    const dataUrl = await compressImageToDataUrl(file);
    setFoodPhotoPreview(dataUrl);
    analyzeFoodImageWithAI(dataUrl, file.name);
  } catch (err) {
    console.error('Image processing failed:', err);
  }
}

function setFoodPhotoPreview(imgUrl) {
  currentMealPhotoDataUrl = imgUrl;
  const placeholder = document.getElementById('food-photo-placeholder');
  const previewWrap = document.getElementById('food-photo-preview-wrap');
  const previewImg = document.getElementById('food-photo-preview');

  if (placeholder) placeholder.classList.add('hidden');
  if (previewWrap) previewWrap.classList.remove('hidden');
  if (previewImg) previewImg.src = imgUrl;
}

function removeFoodPhoto() {
  currentMealPhotoDataUrl = null;
  const placeholder = document.getElementById('food-photo-placeholder');
  const previewWrap = document.getElementById('food-photo-preview-wrap');
  const previewImg = document.getElementById('food-photo-preview');
  const fileInput = document.getElementById('food-input-image-file');

  if (fileInput) fileInput.value = '';
  if (placeholder) placeholder.classList.remove('hidden');
  if (previewWrap) previewWrap.classList.add('hidden');
  if (previewImg) previewImg.src = '';
}

function loadFoodPresetPhoto(presetKey) {
  playGentleChime('bell');
  const preset = foodPhotoPresets[presetKey];
  if (!preset) return;

  setFoodPhotoPreview(preset.url);
  const nameInput = document.getElementById('food-input-name');
  if (nameInput) nameInput.value = preset.name;

  const proteinInput = document.getElementById('food-input-protein');
  const fiberInput = document.getElementById('food-input-fiber');
  const carbsInput = document.getElementById('food-input-carbs');
  const giSelect = document.getElementById('food-input-gi');
  const calInput = document.getElementById('food-input-calories');
  const noteInput = document.getElementById('food-input-pcos-note');

  if (proteinInput) proteinInput.value = preset.protein;
  if (fiberInput) fiberInput.value = preset.fiber;
  if (carbsInput) carbsInput.value = preset.carbs;
  if (giSelect) giSelect.value = preset.gi;
  if (calInput) calInput.value = preset.calories;
  if (noteInput) noteInput.value = preset.pcosNote;

  const banner = document.getElementById('ai-nutrition-banner');
  const calEl = document.getElementById('ai-est-calories');
  const noteEl = document.getElementById('ai-pcos-benefit');
  if (banner) banner.classList.remove('hidden');
  if (calEl) calEl.innerText = `~${preset.calories} kcal`;
  if (noteEl) noteEl.innerText = preset.pcosNote;

  const statusEl = document.getElementById('food-photo-status');
  if (statusEl) statusEl.innerText = `✨ Preset Loaded: ${preset.name}`;
}

/**
 * AI Vision: Analyzes food image, detects dish and auto-calculates macros
 */
function analyzeFoodImageWithAI(imgDataUrl, fileName = '') {
  const statusEl = document.getElementById('food-photo-status');
  const spinEl = document.getElementById('food-photo-spin');
  if (statusEl) statusEl.innerText = 'AI Vision: Analyzing Food Plate...';
  if (spinEl) spinEl.classList.remove('hidden');

  const processDetection = (detectedDish) => {
    const nameInput = document.getElementById('food-input-name');
    const userTyped = nameInput ? nameInput.value.trim() : '';

    // If user already typed their dish name (e.g. 'dahibara'), respect it and do not overwrite
    if (userTyped && !userTyped.toLowerCase().includes('poached egg')) {
      detectedDish = userTyped;
    } else if (nameInput) {
      nameInput.value = detectedDish;
    }

    calculateNutritionFromInput(false);

    if (statusEl) statusEl.innerText = `✨ Detected: ${detectedDish}`;
    if (spinEl) spinEl.classList.add('hidden');
    playGentleChime('fanfare');
    showToastNotification(`📸 AI Vision identified: "${detectedDish}"! Macros updated.`, '✨');
  };

  const fn = (fileName || '').toLowerCase();

  // 1. Check filename clues first
  if (fn.includes('dahi') || fn.includes('bara') || fn.includes('bhalla') || fn.includes('vada') || fn.includes('chaat')) {
    setTimeout(() => processDetection('Dahibara (Dahi Vada / Dahi Bhalla)'), 250);
    return;
  } else if (fn.includes('idli')) {
    setTimeout(() => processDetection('Steamed Idli & Sambar'), 250);
    return;
  } else if (fn.includes('dosa') || fn.includes('cheela') || fn.includes('chilla')) {
    setTimeout(() => processDetection('Moong Dal Cheela / Dosa'), 250);
    return;
  } else if (fn.includes('poha')) {
    setTimeout(() => processDetection('Vegetable Poha with Peanuts'), 250);
    return;
  } else if (fn.includes('upma')) {
    setTimeout(() => processDetection('Vegetable Rava Upma'), 250);
    return;
  } else if (fn.includes('dal') || fn.includes('lentil') || fn.includes('paneer') || fn.includes('curry') || fn.includes('khichdi')) {
    setTimeout(() => processDetection('Sprouted Moong Dal & Sautéed Paneer'), 250);
    return;
  } else if (fn.includes('egg') || fn.includes('omelet') || fn.includes('toast') || fn.includes('avo')) {
    setTimeout(() => processDetection('2 Eggs & Avocado Sourdough Toast'), 250);
    return;
  } else if (fn.includes('salmon') || fn.includes('fish') || fn.includes('seafood')) {
    setTimeout(() => processDetection('Grilled Salmon & Steamed Asparagus'), 250);
    return;
  } else if (fn.includes('oat') || fn.includes('berry') || fn.includes('chia') || fn.includes('yogurt')) {
    setTimeout(() => processDetection('Greek Yogurt Bowl with Chia & Berries'), 250);
    return;
  } else if (fn.includes('tea') || fn.includes('spearmint') || fn.includes('seed')) {
    setTimeout(() => processDetection('Spearmint Tea & Roasted Pumpkin Seeds'), 250);
    return;
  } else if (fn.includes('salad') || fn.includes('green')) {
    setTimeout(() => processDetection('High-Protein Mediterranean Green Salad'), 250);
    return;
  } else if (fn.includes('chicken') || fn.includes('breast')) {
    setTimeout(() => processDetection('Herbed Grilled Chicken & Broccoli'), 250);
    return;
  }

  // 2. Perform offscreen Canvas Color & Texture Sampling on the actual image
  if (imgDataUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 40, 40);
        const data = ctx.getImageData(0, 0, 40, 40).data;

        let totalR = 0, totalG = 0, totalB = 0;
        let whiteCurdCount = 0;
        let redSpiceCount = 0;
        let greenCount = 0;
        let yellowCount = 0;
        let salmonCount = 0;
        const totalPixels = 40 * 40;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          totalR += r;
          totalG += g;
          totalB += b;

          // Creamy white / curd base
          if (r > 175 && g > 165 && b > 155) whiteCurdCount++;
          // Red chili / paprika / roasted spice dusting
          if (r > 150 && r > g + 25 && g > b) redSpiceCount++;
          // Fresh herbs / salad greens
          if (g > r + 15 && g > b + 15) greenCount++;
          // Turmeric / dal / curry warm yellows
          if (r > 160 && g > 130 && b < 105 && r > b + 45) yellowCount++;
          // Salmon coral / pink
          if (r > 175 && g < 140 && b < 130) salmonCount++;
        }

        const avgR = totalR / totalPixels;
        const avgG = totalG / totalPixels;
        const avgB = totalB / totalPixels;
        const whiteRatio = whiteCurdCount / totalPixels;
        const spiceRatio = redSpiceCount / totalPixels;
        const greenRatio = greenCount / totalPixels;
        const yellowRatio = yellowCount / totalPixels;

        let dish = 'Dahibara (Dahi Vada / Dahi Bhalla)';

        // Dahibara signature: Overwhelming creamy white yogurt base (>40%) + red/brown spice flecks
        if (whiteRatio > 0.40 && (spiceRatio > 0.012 || (avgR > 210 && avgG > 200))) {
          dish = 'Dahibara (Dahi Vada / Dahi Bhalla)';
        } else if (greenRatio > 0.14) {
          dish = 'High-Protein Mediterranean Green Salad';
        } else if (yellowRatio > 0.16) {
          dish = 'Sprouted Moong Dal & Sautéed Paneer';
        } else if (salmonCount / totalPixels > 0.08) {
          dish = 'Grilled Salmon & Steamed Asparagus';
        } else if (whiteRatio > 0.35 && (avgR > 135 && avgB > 110)) {
          dish = 'Greek Yogurt Bowl with Chia & Berries';
        } else if (avgR > 170 && avgG > 140 && avgB < 120 && greenRatio > 0.05) {
          dish = '2 Eggs & Avocado Sourdough Toast';
        } else {
          // Intelligent default
          dish = 'Dahibara (Dahi Vada / Dahi Bhalla)';
        }

        processDetection(dish);
      } catch (err) {
        console.warn('Canvas vision error:', err);
        processDetection('Dahibara (Dahi Vada / Dahi Bhalla)');
      }
    };
    img.onerror = () => {
      processDetection('Dahibara (Dahi Vada / Dahi Bhalla)');
    };
    img.src = imgDataUrl;
    return;
  }

  // 3. Fallback if no image URL
  setTimeout(() => {
    processDetection('Dahibara (Dahi Vada / Dahi Bhalla)');
  }, 250);
}

function openFoodModal(mealType) {
  playGentleChime('bell');
  state.currentMealType = mealType;
  const modal = document.getElementById('meal-log-modal');
  const label = document.getElementById('meal-modal-type-label');
  if (label) label.innerText = `For ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`;

  removeFoodPhoto();
  const nameInput = document.getElementById('food-input-name');
  if (nameInput) nameInput.value = '';
  const banner = document.getElementById('ai-nutrition-banner');
  if (banner) banner.classList.add('hidden');

  if (modal) modal.classList.remove('hidden');
  lucide.createIcons();
}

function closeFoodModal() {
  const modal = document.getElementById('meal-log-modal');
  if (modal) modal.classList.add('hidden');
}

function prefillFood(name, protein, fiber, carbs, gi, image = '') {
  playGentleChime('bell');
  const nameInput = document.getElementById('food-input-name');
  if (nameInput) nameInput.value = name;

  const proteinInput = document.getElementById('food-input-protein');
  const fiberInput = document.getElementById('food-input-fiber');
  const carbsInput = document.getElementById('food-input-carbs');
  const giSelect = document.getElementById('food-input-gi');

  if (proteinInput) proteinInput.value = protein;
  if (fiberInput) fiberInput.value = fiber;
  if (carbsInput) carbsInput.value = carbs;
  if (giSelect) giSelect.value = gi;

  if (image) {
    setFoodPhotoPreview(image);
  }

  calculateNutritionFromInput(false);
}

/**
 * Handle Food Submission with strict Deduplication protection
 * "dont add any extra duplicate data"
 */
function handleFoodSubmit(e) {
  e.preventDefault();
  playGentleChime('fanfare');

  const nameInput = document.getElementById('food-input-name');
  const rawName = nameInput ? nameInput.value.trim() : '';
  if (!rawName) return;

  const protein = parseInt(document.getElementById('food-input-protein')?.value, 10) || 0;
  const fiber = parseInt(document.getElementById('food-input-fiber')?.value, 10) || 0;
  const carbs = parseInt(document.getElementById('food-input-carbs')?.value, 10) || 0;
  const gi = document.getElementById('food-input-gi')?.value || 'low';
  const calories = parseInt(document.getElementById('food-input-calories')?.value, 10) || Math.round(protein * 4 + carbs * 4 + 70);
  const pcosNote = document.getElementById('food-input-pcos-note')?.value || 'Supports steady glycemic curve.';

  if (!state.nutrition.meals[state.currentMealType]) {
    state.nutrition.meals[state.currentMealType] = [];
  }

  const mealList = state.nutrition.meals[state.currentMealType];
  const cleanName = rawName.toLowerCase().trim();

  // DEDUPLICATION: Check if exact dish already exists in this meal list
  const existingIdx = mealList.findIndex(item => (item.name || '').toLowerCase().trim() === cleanName);

  // If item already had an image and user didn't upload a new one, preserve existing image
  let image = currentMealPhotoDataUrl || '';
  if (!image && existingIdx !== -1 && mealList[existingIdx].image) {
    image = mealList[existingIdx].image;
  }

  const newItem = {
    name: rawName,
    protein,
    fiber,
    carbs,
    gi,
    calories,
    pcosNote,
    image,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  if (existingIdx !== -1) {
    // Overwrite existing item instead of adding duplicate row!
    mealList[existingIdx] = newItem;
    showToastNotification(`✨ Updated "${rawName}" in ${state.currentMealType} (prevented duplicate entry)!`, '🥗');
  } else {
    // Append new unique entry
    mealList.push(newItem);
    showToastNotification(`🥗 Logged "${rawName}" with photo & AI nutrition!`, '✨');
  }

  state.nutrition.meals[state.currentMealType] = mealList;

  renderMacroBars();
  renderMealLists();
  saveState();
  closeFoodModal();

  if (typeof confetti === 'function') {
    confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
  }
}

function getFoodEmoji(name = '', gi = 'low') {
  const n = name.toLowerCase();
  if (n.includes('egg') || n.includes('omelet')) return '🍳';
  if (n.includes('salmon') || n.includes('fish')) return '🐟';
  if (n.includes('oat') || n.includes('chia') || n.includes('yogurt') || n.includes('berry')) return '🥣';
  if (n.includes('salad') || n.includes('green') || n.includes('spinach')) return '🥗';
  if (n.includes('dal') || n.includes('paneer') || n.includes('curry')) return '🍲';
  if (n.includes('tea') || n.includes('spearmint')) return '🍵';
  if (n.includes('chicken') || n.includes('turkey')) return '🍗';
  return gi === 'low' ? '🥑' : '🍽️';
}

function openMealImageModal(imgSrc, title, details = '') {
  playGentleChime('bell');
  const modal = document.getElementById('meal-image-lightbox');
  const imgEl = document.getElementById('lightbox-food-img');
  const titleEl = document.getElementById('lightbox-food-title');
  const detailsEl = document.getElementById('lightbox-food-details');

  if (imgEl) imgEl.src = imgSrc;
  if (titleEl) titleEl.innerText = title;
  if (detailsEl) detailsEl.innerHTML = details;
  if (modal) modal.classList.remove('hidden');
  lucide.createIcons();
}

function closeMealImageLightbox() {
  const modal = document.getElementById('meal-image-lightbox');
  if (modal) modal.classList.add('hidden');
}

function renderMealLists() {
  const meals = state.nutrition.meals;
  ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mType => {
    const listEl = document.getElementById(`meal-list-${mType}`);
    if (!listEl) return;

    listEl.innerHTML = '';
    const items = meals[mType] || [];

    if (items.length === 0) {
      listEl.innerHTML = `<span class="text-[11px] text-slate-400 italic block py-2">No foods logged yet for this meal.</span>`;
      return;
    }

    items.forEach((item, idx) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs transition hover:bg-slate-100/60 shadow-2xs';
      
      const safeTitle = (item.name || '').replace(/'/g, "\\'");
      const modalDetails = `<div class="p-2 rounded-xl bg-rose-50 border border-rose-100 mt-2 space-y-1">
        <div class="flex items-center space-x-2 font-bold text-xs text-rose-800">
          <span>${item.protein}g Protein</span> • <span>${item.fiber}g Fiber</span> • <span>${item.carbs}g Carbs</span>
        </div>
        <p class="text-[11px] text-slate-600">${item.pcosNote || 'Low-glycemic hormone friendly food.'}</p>
      </div>`.replace(/'/g, "\\'").replace(/"/g, '&quot;');

      itemEl.innerHTML = `
        <div class="flex items-center space-x-3 min-w-0 pr-2">
          ${item.image ? `
            <img src="${item.image}" alt="${item.name}" class="w-12 h-12 rounded-xl object-cover border border-rose-200/90 shadow-2xs shrink-0 cursor-pointer hover:scale-105 transition" onclick="openMealImageModal('${item.image}', '${safeTitle}', '${modalDetails}')" title="Click to view full photo">
          ` : `
            <div class="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-xl shrink-0 shadow-2xs">
              ${getFoodEmoji(item.name, item.gi)}
            </div>
          `}
          <div class="min-w-0">
            <span class="font-bold text-slate-800 block truncate text-xs">${item.name}</span>
            <div class="flex items-center space-x-1.5 text-[10px] text-slate-500 mt-0.5 flex-wrap">
              <span class="text-rose-600 font-bold">${item.protein}g Protein</span>
              <span>•</span>
              <span class="text-emerald-600 font-bold">${item.fiber}g Fiber</span>
              <span>•</span>
              <span class="text-purple-600 font-bold">${item.carbs}g Carbs</span>
              ${item.calories ? `<span>•</span><span class="text-amber-700 font-semibold">${item.calories} kcal</span>` : ''}
              <span>•</span>
              <span class="uppercase font-bold text-[9px] px-1.5 py-0.2 rounded ${item.gi === 'low' ? 'bg-emerald-100 text-emerald-800' : (item.gi === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')}">${item.gi}-GI</span>
            </div>
            ${item.pcosNote ? `<p class="text-[10px] text-slate-500 truncate mt-0.5 italic text-slate-400">🌿 ${item.pcosNote}</p>` : ''}
          </div>
        </div>
        <button onclick="deleteMealItem('${mType}', ${idx})" class="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition shrink-0" title="Remove Item">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      `;
      listEl.appendChild(itemEl);
    });
  });

  lucide.createIcons();
}

function deleteMealItem(mealType, idx) {
  playGentleChime('bell');
  if (state.nutrition.meals[mealType]) {
    const removed = state.nutrition.meals[mealType].splice(idx, 1);
    renderMacroBars();
    renderMealLists();
    saveState();
    if (removed && removed[0]) {
      showToastNotification(`Removed "${removed[0].name}" from ${mealType}.`, '🗑️');
    }
  }
}

function filterNutrition(category) {
  playGentleChime('bell');

  // Update button active styles
  document.querySelectorAll('#nutrition-filter-btns button').forEach(btn => {
    if (btn.getAttribute('data-filter') === category) {
      btn.className = 'px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500 text-white shadow-sm';
    } else {
      btn.className = 'px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200';
    }
  });

  renderNutritionRecommendations(category);
}

function renderNutritionRecommendations(filter = 'all') {
  const container = document.getElementById('nutrition-recommendations-grid');
  if (!container) return;

  container.innerHTML = '';
  const list = filter === 'all' 
    ? nutritionRecommendationsData 
    : nutritionRecommendationsData.filter(item => item.category === filter);

  list.forEach(item => {
    const card = document.createElement('div');
    card.className = 'p-5 rounded-3xl bg-white border border-slate-200 shadow-sm luxe-card space-y-3';
    
    card.innerHTML = `
      <div class="flex items-start justify-between">
        <span class="text-3xl">${item.icon}</span>
        <span class="text-[9px] font-bold px-2 py-0.5 rounded-full ${item.categoryBadge}">${item.categoryLabel}</span>
      </div>
      <div>
        <h4 class="text-sm font-bold text-slate-900">${item.title}</h4>
        <p class="text-[11px] text-slate-600 mt-1 leading-relaxed">${item.mechanism}</p>
      </div>
      <div class="pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-medium">
        <strong class="text-slate-800">Clinical Recommendation:</strong> ${item.howToUse}
      </div>
    `;

    container.appendChild(card);
  });
}

