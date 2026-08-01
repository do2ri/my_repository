// app-decks.js — index.html (덱 목록 / 덱 상세) 화면 로직

const state = { currentDeckId: null };

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- 덱 목록 ----------
function refreshDeckList() {
  const decks = Store.getDecks();
  const container = document.getElementById('deckGrid');
  const emptyState = document.getElementById('deckEmptyState');

  if (decks.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  container.innerHTML = decks.map(deck => {
    const cards = Store.getCards(deck.id);
    const dueCount = getDueCards(cards).length;
    return `
      <button class="deck-card" data-deck-id="${deck.id}">
        <span class="deck-card__name">${escapeHtml(deck.name)}</span>
        <span class="deck-card__meta">
          <span>${cards.length}개 단어</span>
          <span class="deck-card__due ${dueCount > 0 ? 'is-active' : ''}">오늘 ${dueCount}개</span>
        </span>
      </button>
    `;
  }).join('');

  container.querySelectorAll('.deck-card').forEach(el => {
    el.addEventListener('click', () => openDeckDetail(el.dataset.deckId));
  });
}

document.getElementById('newDeckBtn').addEventListener('click', () => {
  document.getElementById('newDeckModal').classList.remove('hidden');
  const input = document.getElementById('newDeckInput');
  input.value = '';
  input.focus();
});
document.getElementById('newDeckCancel').addEventListener('click', () => {
  document.getElementById('newDeckModal').classList.add('hidden');
});
document.getElementById('newDeckForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('newDeckInput').value.trim();
  if (!name) return;
  Store.createDeck(name);
  document.getElementById('newDeckModal').classList.add('hidden');
  refreshDeckList();
});

// ---------- 덱 상세 ----------
function openDeckDetail(deckId) {
  state.currentDeckId = deckId;
  const deck = Store.getDeck(deckId);
  if (!deck) return;
  document.getElementById('deckListView').classList.add('hidden');
  document.getElementById('deckDetailView').classList.remove('hidden');
  document.getElementById('deckDetailName').textContent = deck.name;
  refreshCardList();
}

document.getElementById('backToDeckList').addEventListener('click', () => {
  document.getElementById('deckDetailView').classList.add('hidden');
  document.getElementById('deckListView').classList.remove('hidden');
  refreshDeckList();
});

document.getElementById('deleteDeckBtn').addEventListener('click', () => {
  if (!confirm('이 덱과 안의 모든 단어를 삭제할까요? 되돌릴 수 없습니다.')) return;
  Store.deleteDeck(state.currentDeckId);
  document.getElementById('deckDetailView').classList.add('hidden');
  document.getElementById('deckListView').classList.remove('hidden');
  refreshDeckList();
});

function statusLabel(status) {
  if (status === 'new') return '새 단어';
  if (status === 'learning') return '학습 중';
  return '복습';
}

function refreshCardList() {
  const cards = Store.getCards(state.currentDeckId);
  const listEl = document.getElementById('cardList');
  const emptyEl = document.getElementById('cardEmptyState');

  if (cards.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
  } else {
    emptyEl.classList.add('hidden');
    listEl.innerHTML = cards.map(card => `
      <li class="card-row">
        <div class="card-row__text">
          <span class="card-row__word">${escapeHtml(card.word)}</span>
          <span class="card-row__meaning">${escapeHtml(card.meaning)}</span>
        </div>
        <span class="card-row__status card-row__status--${card.srs.status}">${statusLabel(card.srs.status)}</span>
        <button class="card-row__delete" data-card-id="${card.id}" aria-label="삭제">✕</button>
      </li>
    `).join('');

    listEl.querySelectorAll('.card-row__delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        Store.deleteCard(btn.dataset.cardId);
        refreshCardList();
      });
    });
  }

  const dueCount = getDueCards(cards).length;
  document.getElementById('studyStartBtn').disabled = dueCount === 0;
  document.getElementById('dueTodayLabel').textContent = `오늘 학습할 단어: ${dueCount}개`;
}

// ---------- 단어 추가 (AI 자동 생성 ↔ 수동 입력 토글) ----------
let addWordMode = Store.getSettings().mode || 'auto';
updateAddWordModeUI();

document.getElementById('addWordModeToggle').addEventListener('click', () => {
  addWordMode = addWordMode === 'auto' ? 'manual' : 'auto';
  Store.updateSettings({ mode: addWordMode });
  updateAddWordModeUI();
});

function updateAddWordModeUI() {
  const toggle = document.getElementById('addWordModeToggle');
  const meaningField = document.getElementById('meaningField');
  toggle.textContent = addWordMode === 'auto' ? 'AI 자동 생성 모드' : '수동 입력 모드';
  toggle.classList.toggle('is-auto', addWordMode === 'auto');
  meaningField.classList.toggle('hidden', addWordMode === 'auto');
}

document.getElementById('addWordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const wordInput = document.getElementById('wordInput');
  const meaningInput = document.getElementById('meaningInput');
  const word = wordInput.value.trim();
  if (!word) return;

  const statusEl = document.getElementById('addWordStatus');
  const submitBtn = document.getElementById('addWordSubmit');
  statusEl.classList.remove('is-error');

  if (addWordMode === 'auto') {
    const settings = Store.getSettings();
    submitBtn.disabled = true;
    statusEl.textContent = 'Gemini가 뜻을 생성하는 중...';
    try {
      const meaning = await fetchGeminiDefinition(word, settings.geminiApiKey, settings.geminiModel);
      Store.addCard(state.currentDeckId, word, meaning);
      statusEl.textContent = `“${word}” 추가 완료`;
      wordInput.value = '';
      wordInput.focus();
      refreshCardList();
    } catch (err) {
      statusEl.textContent = err.message;
      statusEl.classList.add('is-error');
    } finally {
      submitBtn.disabled = false;
    }
  } else {
    const meaning = meaningInput.value.trim();
    if (!meaning) {
      statusEl.textContent = '뜻을 입력해주세요.';
      statusEl.classList.add('is-error');
      return;
    }
    Store.addCard(state.currentDeckId, word, meaning);
    wordInput.value = '';
    meaningInput.value = '';
    statusEl.textContent = `“${word}” 추가 완료`;
    wordInput.focus();
    refreshCardList();
  }
});

// ---------- 학습 시작 (모드 선택) ----------
document.getElementById('studyStartBtn').addEventListener('click', () => {
  document.getElementById('studyModeModal').classList.remove('hidden');
});
document.getElementById('studyModeCancel').addEventListener('click', () => {
  document.getElementById('studyModeModal').classList.add('hidden');
});
document.querySelectorAll('.study-mode-option').forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;
    window.location.href = `study.html?deck=${state.currentDeckId}&mode=${mode}`;
  });
});

// ---------- 설정 ----------
document.getElementById('settingsBtn').addEventListener('click', () => {
  const settings = Store.getSettings();
  document.getElementById('apiKeyInput').value = settings.geminiApiKey || '';
  document.getElementById('modelSelect').value = settings.geminiModel || 'gemini-2.5-flash-lite';
  document.getElementById('settingsModal').classList.remove('hidden');
});
document.getElementById('settingsCancel').addEventListener('click', () => {
  document.getElementById('settingsModal').classList.add('hidden');
});
document.getElementById('settingsForm').addEventListener('submit', (e) => {
  e.preventDefault();
  Store.updateSettings({
    geminiApiKey: document.getElementById('apiKeyInput').value.trim(),
    geminiModel: document.getElementById('modelSelect').value
  });
  document.getElementById('settingsModal').classList.add('hidden');
});

refreshDeckList();
