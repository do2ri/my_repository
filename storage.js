// storage.js — localStorage 기반 데이터 저장소
// 서버 없이 브라우저 안에서만 덱/카드/설정을 관리합니다.

const STORAGE_KEY = 'recallDeck_v1';

function defaultData() {
  return {
    decks: [],
    cards: [],
    settings: {
      geminiApiKey: '',
      geminiModel: 'gemini-2.5-flash-lite',
      mode: 'auto' // 'auto' | 'manual' — 단어 추가 시 기본 모드
    }
  };
}

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = defaultData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    const parsed = JSON.parse(raw);
    // 이전 버전 데이터에 필드가 없을 경우를 대비한 안전한 병합
    return {
      decks: parsed.decks || [],
      cards: parsed.cards || [],
      settings: { ...defaultData().settings, ...(parsed.settings || {}) }
    };
  } catch (e) {
    console.error('저장된 데이터를 읽는 중 오류가 발생했습니다.', e);
    return defaultData();
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function genId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const Store = {
  // ---- 덱 ----
  getDecks() {
    return loadData().decks;
  },
  getDeck(deckId) {
    return loadData().decks.find(d => d.id === deckId) || null;
  },
  createDeck(name) {
    const data = loadData();
    const deck = { id: genId('deck'), name, createdAt: new Date().toISOString() };
    data.decks.push(deck);
    saveData(data);
    return deck;
  },
  renameDeck(deckId, name) {
    const data = loadData();
    const deck = data.decks.find(d => d.id === deckId);
    if (deck) deck.name = name;
    saveData(data);
  },
  deleteDeck(deckId) {
    const data = loadData();
    data.decks = data.decks.filter(d => d.id !== deckId);
    data.cards = data.cards.filter(c => c.deckId !== deckId);
    saveData(data);
  },

  // ---- 카드 ----
  getCards(deckId) {
    return loadData().cards.filter(c => c.deckId === deckId);
  },
  getCard(cardId) {
    return loadData().cards.find(c => c.id === cardId) || null;
  },
  addCard(deckId, word, meaning) {
    const data = loadData();
    const card = {
      id: genId('card'),
      deckId,
      word,
      meaning,
      createdAt: new Date().toISOString(),
      srs: {
        interval: 0,          // 분 단위로 저장된 마지막 간격
        easeFactor: 2.5,
        repetitions: 0,
        status: 'new',        // 'new' | 'learning' | 'review'
        dueDate: new Date().toISOString(),
        lastReviewed: null
      }
    };
    data.cards.push(card);
    saveData(data);
    return card;
  },
  updateCard(cardId, updates) {
    const data = loadData();
    const card = data.cards.find(c => c.id === cardId);
    if (card) Object.assign(card, updates);
    saveData(data);
    return card;
  },
  deleteCard(cardId) {
    const data = loadData();
    data.cards = data.cards.filter(c => c.id !== cardId);
    saveData(data);
  },

  // ---- 설정 ----
  getSettings() {
    return loadData().settings;
  },
  updateSettings(updates) {
    const data = loadData();
    data.settings = { ...data.settings, ...updates };
    saveData(data);
    return data.settings;
  }
};
