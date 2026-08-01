# RecallDeck — 나만의 단어 암기장

에빙하우스 망각곡선 기반 간격 반복(SRS) + Gemini API 자동 뜻풀이를 지원하는
가벼운 로컬 웹앱입니다. 서버 없이 브라우저 `localStorage`에 모든 데이터가 저장됩니다.

## 실행 방법

별도 설치 없이 바로 열 수 있습니다.

**방법 1. 그냥 더블클릭**
`index.html` 파일을 더블클릭해서 브라우저로 열면 됩니다.

**방법 2. 로컬 서버로 실행 (권장)**
일부 브라우저는 `file://`로 열었을 때 fetch 요청을 제한할 수 있어, 아래처럼 간단한 로컬 서버로 여는 것을 권장합니다.

```bash
cd recall-deck
python3 -m http.server 8080
# 브라우저에서 http://localhost:8080 접속
```

## Gemini API 키 발급

1. https://aistudio.google.com/apikey 접속 후 Google 계정으로 로그인
2. "Create API key" 클릭 → 키 복사 (`AIza...`로 시작)
3. 앱 우측 상단 **⚙ 설정** 클릭 → API 키 붙여넣기 → 저장
4. 무료 티어는 분당/일일 요청 수 제한이 있습니다. 한도에 걸리면
   단어 추가 폼의 **[AI 자동 생성 모드 ↔ 수동 입력 모드]** 토글로
   전환해 직접 뜻을 입력할 수 있습니다.

API 키는 서버로 전송되지 않고 브라우저의 localStorage에만 저장되며,
브라우저에서 Google Gemini API로 직접 요청을 보냅니다.

## 사용 흐름

1. **+ 새 덱** 으로 덱 생성 (예: 토익, 수능, 일상 회화)
2. 덱 클릭 → 단어 추가 (자동 모드면 Gemini가 뜻을 자동 생성)
3. **학습 모드 선택** → 단어→뜻 / 뜻→단어 / 랜덤(교차) 중 선택
4. 카드를 탭해 정답 확인 → Again / Hard / Good / Easy 중 선택
   - Again: 1분 후 재노출
   - Hard: 6분 후 재노출
   - Good: 10분 후 재노출 (2회 이상 성공 시 이후 날짜 단위 간격으로 전환)
   - Easy: 3~5일 후 재노출

## 데이터 구조 (localStorage key: `recallDeck_v1`)

```
decks:    [{ id, name, createdAt }]
cards:    [{ id, deckId, word, meaning, srs: { interval, easeFactor, repetitions, status, dueDate, lastReviewed } }]
settings: { geminiApiKey, geminiModel, mode }
```

## 참고

- 데이터는 브라우저별로 저장되므로 다른 브라우저/기기에서는 보이지 않습니다.
- 브라우저 저장소를 지우면(캐시 삭제 등) 데이터도 함께 사라집니다. 주기적 백업이 필요하면
  브라우저 개발자 도구 콘솔에서 `localStorage.getItem('recallDeck_v1')` 값을 복사해두세요.
