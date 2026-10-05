const prompts = [
  'The quiet mind notices more.',
  'Small signals shape big decisions.',
  'Attention leaves a gentle trace.'
];

const input = document.querySelector('#typingInput');
const promptText = document.querySelector('#promptText');
const testTitle = document.querySelector('#testTitle');
const testIntro = document.querySelector('#testIntro');
const nextButton = document.querySelector('#nextButton');
const resetButton = document.querySelector('#resetButton');
const verifyControls = document.querySelector('#verifyControls');
const verifyButton = document.querySelector('#verifyButton');
const clearData = document.querySelector('#clearData');
const progressBar = document.querySelector('#progressBar');
const progressLabel = document.querySelector('#progressLabel');
const inputHint = document.querySelector('#inputHint');
const roundLabel = document.querySelector('#roundLabel');
const consistencyValue = document.querySelector('#consistencyValue');
const consistencyLabel = document.querySelector('#consistencyLabel');
const consistencyMeter = document.querySelector('#consistencyMeter');
const consistencyNote = document.querySelector('#consistencyNote');
const holdValue = document.querySelector('#holdValue');
const flightValue = document.querySelector('#flightValue');
const paceValue = document.querySelector('#paceValue');
const chartBars = document.querySelector('#chartBars');
const toast = document.querySelector('#toast');
const signalStatus = document.querySelector('#signalStatus');
const signalInterval = document.querySelector('#signalInterval');
const waveformBars = [...document.querySelectorAll('.waveform span')];

let round = 0;
let keyDowns = [];
let keyUps = [];
let roundResults = [];
let toastTimer;
let completionTimer;
let mode = 'baseline';
let baseline = null;
let typingStartedAt = null;
let typingEndedAt = null;
let signalIndex = 0;
let lastSignalKeyAt = null;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function resetRound() {
  input.value = '';
  keyDowns = [];
  keyUps = [];
  typingStartedAt = null;
  typingEndedAt = null;
  signalIndex = 0;
  lastSignalKeyAt = null;
  signalStatus.textContent = 'LIVE SIGNAL';
  progressBar.style.width = '0%';
  progressLabel.textContent = `0 / ${prompts[round].length} characters`;
  inputHint.textContent = 'click here to begin';
  nextButton.disabled = true;
  input.focus();
}

function startRound() {
  promptText.textContent = prompts[round];
  roundLabel.textContent = `ROUND ${round + 1} / 3`;
  resetRound();
}

function calculateResult() {
  const completed = input.value.length;
  const totalTime = typingStartedAt !== null && typingEndedAt !== null ? typingEndedAt - typingStartedAt : 1;
  const holds = keyUps.map((up, index) => Math.max(0, up - (keyDowns[index] || up)));
  const flights = keyDowns.slice(1).map((down, index) => Math.max(0, down - (keyUps[index] || down)));
  const average = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const meanFlight = average(flights);
  const variance = average(flights.map(value => (value - meanFlight) ** 2));
  const consistency = Math.max(54, Math.min(98, Math.round(100 - Math.sqrt(variance) / 3)));
  const wpm = Math.round((completed / 5) / (totalTime / 60000));
  return { consistency, hold: Math.round(average(holds)), flight: Math.round(meanFlight), wpm: Number.isFinite(wpm) ? wpm : 0, flights };
}

function renderResult(result) {
  consistencyValue.innerHTML = `${result.consistency}<small>%</small>`;
  consistencyMeter.style.width = `${result.consistency}%`;
  consistencyNote.textContent = result.consistency > 83 ? 'A steady, recognizable cadence.' : 'A developing pattern. Keep going.';
  holdValue.innerHTML = `${result.hold} <small>ms</small>`;
  flightValue.innerHTML = `${result.flight} <small>ms</small>`;
  paceValue.innerHTML = `${result.wpm} <small>wpm</small>`;
  chartBars.innerHTML = '';
  result.flights.slice(-18).forEach((flight, index) => {
    const bar = document.createElement('span');
    bar.style.height = `${Math.max(12, Math.min(100, flight / 2))}%`;
    bar.style.animationDelay = `${index * 25}ms`;
    chartBars.appendChild(bar);
  });
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function buildBaseline() {
  return {
    hold: average(roundResults.map(result => result.hold)),
    flight: average(roundResults.map(result => result.flight)),
    wpm: average(roundResults.map(result => result.wpm))
  };
}

function compareToBaseline(result) {
  const difference = (value, reference) => Math.min(1, Math.abs(value - reference) / Math.max(reference, 20));
  const distance = difference(result.hold, baseline.hold) * 0.35 + difference(result.flight, baseline.flight) * 0.35 + difference(result.wpm, baseline.wpm) * 0.3;
  return Math.max(0, Math.round((1 - distance) * 100));
}

input.addEventListener('keydown', event => {
  if (event.key.length === 1 || event.key === 'Backspace' || event.key === ' ') {
    const timestamp = performance.now();
    const interval = lastSignalKeyAt === null ? 120 : timestamp - lastSignalKeyAt;
    if (typingStartedAt === null) typingStartedAt = timestamp;
    typingEndedAt = null;
    waveformBars[signalIndex % waveformBars.length].style.height = `${Math.max(18, Math.min(94, interval / 2))}%`;
    waveformBars[signalIndex % waveformBars.length].classList.add('signal-hit');
    signalIndex += 1;
    lastSignalKeyAt = timestamp;
    signalInterval.textContent = Math.round(interval);
    signalStatus.textContent = 'CAPTURING';
    keyDowns.push(timestamp);
  }
});

input.addEventListener('keyup', event => {
  if (event.key.length === 1 || event.key === 'Backspace' || event.key === ' ') {
    typingEndedAt = performance.now();
    keyUps.push(typingEndedAt);
    signalStatus.textContent = input.value === prompts[round] ? 'SIGNAL READY' : 'CAPTURING';
  }
  updateProgress();
  clearTimeout(completionTimer);
  if (input.value === prompts[round]) completionTimer = setTimeout(completeRound, 0);
});

function updateProgress() {
  const current = input.value;
  const target = prompts[round];
  const progress = Math.min(100, (current.length / target.length) * 100);
  progressBar.style.width = `${progress}%`;
  progressLabel.textContent = `${current.length} / ${target.length} characters`;
  inputHint.textContent = current ? 'signal detected' : 'click here to begin';
  nextButton.disabled = current !== target;
}

input.addEventListener('input', updateProgress);

function completeRound() {
  if (input.value !== prompts[round]) return;
  const result = calculateResult();
  if (mode === 'verify') {
    const matchScore = compareToBaseline(result);
    renderResult({ ...result, consistency: matchScore });
    consistencyLabel.textContent = 'MATCH SCORE';
    consistencyNote.textContent = matchScore >= 72 ? 'Likely you — this rhythm is close to the baseline.' : 'Different rhythm — this sample does not match closely.';
    roundLabel.textContent = matchScore >= 72 ? 'LIKELY YOU' : 'DIFFERENT RHYTHM';
    verifyButton.textContent = 'Test again →';
    verifyControls.hidden = false;
    nextButton.style.display = 'none';
    showToast(matchScore >= 72 ? 'Rhythm match found.' : 'Rhythm mismatch detected.');
    return;
  }
  roundResults.push(result);
  renderResult(result);
  if (round < 2) {
    round += 1;
    startRound();
    showToast(`Round ${round} ready. Same you, new signal.`);
  } else {
    nextButton.disabled = true;
    nextButton.innerHTML = 'Baseline complete <span>✓</span>';
    roundLabel.textContent = 'BASELINE READY';
    consistencyNote.textContent = 'Three rounds captured. Your baseline is ready.';
    baseline = buildBaseline();
    testTitle.textContent = 'Test your rhythm';
    testIntro.textContent = 'Start a fresh sample to compare its timing against your private baseline.';
    verifyControls.hidden = false;
    nextButton.style.display = 'none';
    showToast('Baseline complete. Nothing left this browser.');
  }
}

nextButton.addEventListener('click', completeRound);

verifyButton.addEventListener('click', () => {
  if (!baseline) return;
  mode = 'verify';
  round = 0;
  signalInterval.textContent = '—';
  testTitle.textContent = 'Verify your rhythm';
  testIntro.textContent = 'Type the phrase again at a comfortable pace. We compare timing, not text.';
  promptText.textContent = prompts[round];
  roundLabel.textContent = 'VERIFICATION';
  verifyControls.hidden = true;
  nextButton.style.display = 'none';
  consistencyLabel.textContent = 'MATCH SCORE';
  resetRound();
  showToast('Verification ready.');
});

resetButton.addEventListener('click', () => {
  signalInterval.textContent = '—';
  resetRound();
  showToast('Current round cleared.');
});

clearData.addEventListener('click', event => {
  event.preventDefault();
  round = 0;
  roundResults = [];
  baseline = null;
  mode = 'baseline';
  signalInterval.textContent = '—';
  consistencyValue.innerHTML = '—<small>%</small>';
  consistencyMeter.style.width = '0%';
  consistencyNote.textContent = 'Complete a round to reveal your pattern.';
  holdValue.innerHTML = '— <small>ms</small>';
  flightValue.innerHTML = '— <small>ms</small>';
  paceValue.innerHTML = '— <small>wpm</small>';
  chartBars.innerHTML = '';
  testTitle.textContent = 'Find your baseline';
  testIntro.textContent = 'Type the phrase below at a comfortable pace. The test reads timing, not what you say.';
  consistencyLabel.textContent = 'TYPING CONSISTENCY';
  verifyControls.hidden = true;
  nextButton.style.display = 'flex';
  nextButton.innerHTML = 'Complete round <span>→</span>';
  startRound();
  showToast('Local session cleared.');
});

startRound();
