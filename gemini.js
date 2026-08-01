// gemini.js — Google AI Studio (Gemini API) 연동
// 토큰 소모를 최소화하기 위해 시스템 프롬프트로 "뜻풀이만" 출력하도록 강제합니다.

const GEMINI_SYSTEM_PROMPT = `You are an English dictionary API. Your task is to provide a very simple, easy-to-understand English definition for the given word.
RULES:
1. Provide ONLY the definition.
2. NO conversational text, NO greetings, NO formatting (no markdown, no bolding).
3. Keep it as concise as possible to minimize token usage.`;

async function fetchGeminiDefinition(word, apiKey, model) {
  if (!apiKey) {
    throw new Error('Gemini API 키가 설정되어 있지 않습니다. 우측 상단 설정에서 API 키를 입력해주세요.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: GEMINI_SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: word }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 60 }
      })
    });
  } catch (networkErr) {
    throw new Error('Gemini API에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.');
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('무료 티어 요청 한도를 초과했습니다(429). 잠시 후 다시 시도하거나 수동 입력 모드를 사용해주세요.');
    }
    const errBody = await response.text().catch(() => '');
    throw new Error(`Gemini API 호출 실패 (${response.status}): ${errBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const blockReason = data?.promptFeedback?.blockReason;
    throw new Error(blockReason ? `Gemini가 응답을 차단했습니다: ${blockReason}` : 'Gemini API 응답에서 뜻풀이를 찾을 수 없습니다.');
  }
  return text.trim();
}
