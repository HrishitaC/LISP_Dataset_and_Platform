
document.addEventListener('keydown', function (e) {
    // Block browser search shortcuts (Ctrl+F, Cmd+F, F3) to prevent cheating
    if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') || e.key === 'F3') {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true); 

// Defining variables
const SYMBOLS = ['¥', 'ε'];
const OTHER_CHARS = '§$%&/#*+=!><€@';
const YES_KEY = 'j', NO_KEY = 'n';
const TEST_PHASE_TIME = 30000;
const MAIN_TEST_TIME = 120000;
const RATIO = 0.3;
const MIN_LEN = 10, MAX_LEN = 15;
const MAX_TRIALS_MAIN = 500;

let searchDisabled = true;
let mainTestWords = [];
let mode = 'test';
let idx = 0, correctCount = 0;
let amount_n = 0;
let amount_j = 0;
let amount_n_correct = 0;
let amount_j_correct = 0;
let endTime, trialStart;
let historyTest = [], historyMain = [], currentTrial = null;
let canGoBack = false, timerInterval;
let currentUserId = '';

// DOM elements
const startScreen = document.getElementById('startScreen');
const testScreen = document.getElementById('testScreen');
const testPhaseEndScreen = document.getElementById('testPhaseEndScreen');
const endScreen = document.getElementById('endScreen');
const snippet = document.getElementById('snippet');
const timer = document.getElementById('timer');
const resultText = document.getElementById('resultText');
const testPhaseResultText = document.getElementById('testPhaseResultText');
const userIdInput = document.getElementById('userIdInput');
const backButton = document.getElementById('backButton');

// Save score
fetch('php/save_score.php', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        user_id: currentUserId,
        score: correctCount,
        amount_n: amount_n,
        amount_n_correct: amount_n_correct,
        amount_j: amount_j,
        amount_j_correct: amount_j_correct  
    })
});


// Fetch scores
fetch('php/get_score.php')
    .then(res => res.json())
    .then(data => {
    });

// Show the appropriate screen
function showScreen(screenId) {
const screens = ['startScreen', 'testScreen', 'testPhaseEndScreen', 'endScreen'];
screens.forEach(id => {
    document.getElementById(id).style.display = (id === screenId) ? 'block' : 'none';
});
}

// Get a random character that is not in the exclude list
function getRandomChar(exclude = []) {
let ch;
do {
    ch = OTHER_CHARS[Math.floor(Math.random() * OTHER_CHARS.length)];
} while (exclude.includes(ch));
return ch;
}

// Creates "pseudo words" for the pretest
function makeWord(hasBothSymbols) {
const len = Math.floor(Math.random() * (MAX_LEN - MIN_LEN + 1)) + MIN_LEN;
let chars = [];

if (hasBothSymbols) {
    const pos1 = Math.floor(Math.random() * len);
    let pos2;
    do {
    pos2 = Math.floor(Math.random() * len);
    } while (pos2 === pos1);

    for (let i = 0; i < len; i++) {
    if (i === pos1) chars.push('ε');
    else if (i === pos2) chars.push('¥');
    else chars.push(getRandomChar(SYMBOLS));
    }
} else {
    const includeEpsilon = Math.random() < 0.5;
    const symbol = includeEpsilon ? 'ε' : '¥';
    const pos = Math.floor(Math.random() * len);
    for (let i = 0; i < len; i++) {
    chars.push(i === pos ? symbol : getRandomChar(SYMBOLS));
    }
}

return { word: chars.join(''), hasBothSymbols };
}

async function checkUsername(username) {
const response = await fetch(`php/check_username.php?user_id=${encodeURIComponent(username)}`);
const result = await response.json();
return result.available;
}

async function startTestPhase() {
const input = document.getElementById('userIdInput');
const userId = input.value.trim();

if (!userId) {
    alert('Please enter a user ID.');
    return;
}

const available = await checkUsername(userId);
if (!available) {
    alert('This user ID is already taken. Please choose another one.');
    return;
}

currentUserId = userId;
showScreen('testScreen'); 

idx = 0;
correctCount = 0;
amount_n = 0;
amount_j = 0;
amount_n_correct = 0;
amount_j_correct = 0;

nextTrial();                
startCountdown(TEST_PHASE_TIME);                     
document.addEventListener('keydown', handleKey);  
}

async function startMainTest() {
await loadMainTestWords();
if (mainTestWords.length === 0) {
    alert('No words available in the final test.');
    return;
}

mode = 'main';
correctCount = 0;
amount_n = 0;
amount_j = 0;
amount_n_correct = 0;
amount_j_correct = 0;

idx = 0;
historyMain = [];

showScreen('testScreen'); 
document.addEventListener('keydown', handleKey);
nextTrial();
startCountdown(MAIN_TEST_TIME);
}

function startCountdown(duration) {
endTime = Date.now() + duration;
updateTimer();
timerInterval = setInterval(() => {
    const remaining = endTime - Date.now();
    if (remaining <= 0 || (mode === 'main' && idx >= mainTestWords.length)) {
    clearInterval(timerInterval);
    finish();
    } else {
    updateTimer();
    }
}, 1000);
}

function updateTimer() {
const remaining = Math.ceil((endTime - Date.now()) / 1000);
timer.textContent = remaining + ' s';
}

function nextTrial() {
if (mode === 'main') {
    if (idx >= mainTestWords.length || idx >= MAX_TRIALS_MAIN) {
    finish();
    return;
    }

    const stim = mainTestWords[idx];
    currentTrial = { stim, response: null, rt: null, scoreChange: 0 };
    snippet.textContent = stim.word;
    trialStart = performance.now();
    canGoBack = true;
    backButton.disabled = false;
    return;
}

const hasBoth = Math.random() < RATIO;
const stim = makeWord(hasBoth);
currentTrial = { stim, response: null, rt: null, scoreChange: 0 };
snippet.textContent = stim.word;
trialStart = performance.now();
canGoBack = true;
backButton.disabled = false;
}

function handleKey(e) {
const key = e.key.toLowerCase();
if (key !== YES_KEY && key !== NO_KEY) return;
if (!currentTrial || currentTrial.response !== null) return;

const response = key;
if (key === 'n') amount_n++;
if (key === 'j') amount_j++;

const isCorrect = (response === YES_KEY) === currentTrial.stim.hasBothSymbols;
const rt = Math.round(performance.now() - trialStart);

currentTrial.response = response;
currentTrial.rt = rt;

if (isCorrect) {
    correctCount++;
    currentTrial.scoreChange = +1;
    if (response === 'n') amount_n_correct++;
    if (response === 'j') amount_j_correct++;

} else {
    correctCount--;
    currentTrial.scoreChange = -1;
}

if (mode === 'test') historyTest.push(currentTrial);
else historyMain.push(currentTrial);

currentTrial = null;
idx++;
nextTrial();
}

function goBack() {
const history = (mode === 'test') ? historyTest : historyMain;
if (!canGoBack || history.length === 0) return;

currentTrial = history.pop();
correctCount -= currentTrial.scoreChange;

if (currentTrial.response === 'n'){
    amount_n--;
    if (currentTrial.scoreChange === 1) amount_n_correct--;
}
if (currentTrial.response === 'j'){
    amount_j--;
    if (currentTrial.scoreChange === 1) amount_j_correct--;
}


idx--;

snippet.textContent = currentTrial.stim.word;
currentTrial.response = null;
currentTrial.rt = null;
currentTrial.scoreChange = 0;
trialStart = performance.now();

canGoBack = false;
backButton.disabled = true;
}

function finish() {
document.removeEventListener('keydown', handleKey);
clearInterval(timerInterval);

if (mode === 'test') {
    showScreen('testPhaseEndScreen'); 
    testPhaseResultText.textContent = `Test phase completed. Correct answers: ${correctCount}`;
} else {
    showScreen('endScreen'); 

    resultText.textContent = `User ID: ${currentUserId}\nCorrect answers in the final test: ${correctCount}`;
    saveScoreToDatabase();
    loadScoreboard();
    setInterval(loadScoreboard, 1000); 

}
}

async function loadMainTestWords() {
try {
    const response = await fetch('word_list.txt');
    const text = await response.text();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    mainTestWords = lines.map(word => {
    const hasEpsilon = word.includes('ε');
    const hasYen = word.includes('¥');
    return {
        word,
        hasBothSymbols: hasEpsilon && hasYen
    };
    });
} catch (err) {
    alert('Error loading word list for final test.');
    console.error(err);
}
}

startScreen.style.display = 'block';

async function saveScoreToDatabase() {
  try {
    const response = await fetch('php/save_score.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: currentUserId, 
        score: correctCount,
        amount_n: amount_n,
        amount_n_correct: amount_n_correct,
        amount_j: amount_j,
        amount_j_correct: amount_j_correct
      })
    });
    if (!response.ok) throw new Error('Error saving score');
  } catch (err) {
    console.error(err);
  }
}

async function loadScoreboard() {
try {
const response = await fetch('php/get_leaderboard.php');
const scores = await response.json();
const tableBody = document.querySelector('#scoreTable tbody');
tableBody.innerHTML = '';

scores.slice(0, 10).forEach(({ user_id, score }) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${user_id}</td><td>${score}</td>`;
    tableBody.appendChild(row);
});
} catch (err) {
console.error('Error loading scoreboard:', err);
}
}
showScreen('startScreen');
