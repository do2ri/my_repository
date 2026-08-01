// app-study.js — study.html 학습 화면 로직

const params = new URLSearchParams(window.location.search);
const deckId = params.get('deck');
const mode = params.get('mode') || 'word2meaning'; // word2meaning | meaning2word | random

const deck = Store.getDeck(deckId);
if (!deck) {
  window.location.href = 'index.html';
}

document.getElementById('deckName').textContent = deck ? deck.name : '';

let queue = [];
let currentCard = null;
let currentDirection = null; // 'w2m' | 'm2w'
let isFlipped = false;
let sessionReviewed = 0;

function loadQueue() {
  const cards = Store.getCards(deckId);
  queue = getDueCards(cards);
  sessionReviewed = 0;
  renderNext();
}

function pickDirection() {
  if (mode === 'word2meaning') return 'w2m';
  if (mode === 'meaning2word') return 'm2w';
  return Math.random() < 0.5 ? 'w2m' : 'm2w';
}

function renderNext() {
  isFlipped = false;
  const flashcard = document.getElementById('flashcard');
  const emptyState = document.getElementById('emptyState');
  const gradeButtons = document.getElementById('gradeButtons');

  flashcard.classList.remove('is-flipped');

  if (queue.length === 0) {
    flashcard.classList.add('hidden');
    gradeButtons.classList.add('hidden');
    emptyState.classList.remove('hidden');
    document.getElementById('finishedCount').textContent = sessionReviewed;
    document.getElementById('remainingCount').textContent = 0;
    return;
  }

  emptyState.classList.add('hidden');
  flashcard.classList.remove('hidden');
  gradeButtons.classList.add('hidden');

  currentCard = queue[0];
  currentDirection = pickDirection();

  const frontText = currentDirection === 'w2m' ? currentCard.word : currentCard.meaning;
  const backText = currentDirection === 'w2m' ? currentCard.meaning : currentCard.word;

  document.getElementById('cardFront').textContent = frontText;
  document.getElementById('cardBack').textContent = backText;
  document.getElementById('cardHint').textContent = currentDirection === 'w2m' ? '단어 → 뜻' : '뜻 → 단어';
  document.getElementById('remainingCount').textContent = queue.length;
}

document.getElementById('flashcard').addEventListener('click', () => {
  if (isFlipped || !currentCard) return;
  isFlipped = true;
  document.getElementById('flashcard').classList.add('is-flipped');
  document.getElementById('gradeButtons').classList.remove('hidden');
  updateGradePreviews();
});

function updateGradePreviews() {
  const previews = previewIntervals(currentCard.srs);
  document.getElementById('previewAgain').textContent = previews.again;
  document.getElementById('previewHard').textContent = previews.hard;
  document.getElementById('previewGood').textContent = previews.good;
  document.getElementById('previewEasy').textContent = previews.easy;
}

document.querySelectorAll('.grade-btn').forEach(btn => {
  btn.addEventListener('click', () => handleGrade(btn.dataset.grade));
});

function handleGrade(grade) {
  const newSrs = gradeCard(currentCard.srs, grade);
  Store.updateCard(currentCard.id, { srs: newSrs });
  sessionReviewed += 1;
  document.getElementById('sessionCount').textContent = sessionReviewed;

  queue.shift();

  // 10분 이내에 다시 노출될 카드(Again/Hard/초반 Good)는 이번 세션에서 다시 큐에 넣습니다.
  const dueInMs = new Date(newSrs.dueDate).getTime() - Date.now();
  if (dueInMs <= 10 * 60 * 1000) {
    const requeuedCard = { ...currentCard, srs: newSrs };
    const insertAt = queue.findIndex(c => new Date(c.srs.dueDate) > new Date(newSrs.dueDate));
    if (insertAt === -1) queue.push(requeuedCard);
    else queue.splice(insertAt, 0, requeuedCard);
  }

  renderNext();
}

loadQueue();
