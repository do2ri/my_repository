// srs.js — 에빙하우스 망각곡선 기반 간격 반복 알고리즘
//
// Again / Hard / Good 은 요청하신 대로 "분" 단위의 짧은 간격을 사용하고,
// Good을 일정 횟수(GRADUATION_REPS) 이상 성공하면 '복습' 단계로 넘어가
// 이후에는 SM-2 방식(간격 × 이지팩터)으로 날짜 단위 간격이 점점 늘어납니다.
// 그렇게 하지 않으면 카드가 영원히 몇 분 간격으로만 반복되어
// 장기적으로 쓸 수 있는 암기 앱이 되지 않기 때문입니다.
// Easy는 요청하신 대로 항상 3~5일 뒤로 스케줄링합니다.

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
const GRADUATION_REPS = 2;

function gradeCard(srs, grade) {
  const now = Date.now();
  const next = { ...srs };

  switch (grade) {
    case 'again': {
      next.repetitions = 0;
      next.easeFactor = Math.max(1.3, srs.easeFactor - 0.2);
      next.interval = 1;
      next.status = 'learning';
      next.dueDate = new Date(now + 1 * MINUTE).toISOString();
      break;
    }
    case 'hard': {
      next.easeFactor = Math.max(1.3, srs.easeFactor - 0.15);
      next.interval = 6;
      next.status = 'learning';
      next.dueDate = new Date(now + 6 * MINUTE).toISOString();
      break;
    }
    case 'good': {
      next.repetitions = srs.repetitions + 1;
      if (srs.status === 'review') {
        const prevDays = Math.max(1, Math.round(srs.interval / (24 * 60)));
        const newDays = Math.max(1, Math.round(prevDays * srs.easeFactor));
        next.interval = newDays * 24 * 60;
        next.dueDate = new Date(now + newDays * DAY).toISOString();
      } else if (next.repetitions >= GRADUATION_REPS) {
        next.status = 'review';
        next.interval = 1 * 24 * 60;
        next.dueDate = new Date(now + 1 * DAY).toISOString();
      } else {
        next.status = 'learning';
        next.interval = 10;
        next.dueDate = new Date(now + 10 * MINUTE).toISOString();
      }
      break;
    }
    case 'easy': {
      next.repetitions = srs.repetitions + 1;
      next.easeFactor = srs.easeFactor + 0.15;
      next.status = 'review';
      const days = 3 + Math.round(Math.random() * 2); // 3~5일
      next.interval = days * 24 * 60;
      next.dueDate = new Date(now + days * DAY).toISOString();
      break;
    }
    default:
      throw new Error(`알 수 없는 등급입니다: ${grade}`);
  }

  next.lastReviewed = new Date(now).toISOString();
  return next;
}

function isDue(card) {
  return new Date(card.srs.dueDate).getTime() <= Date.now();
}

function getDueCards(cards) {
  return cards.filter(isDue).sort((a, b) => new Date(a.srs.dueDate) - new Date(b.srs.dueDate));
}

// 학습 화면에서 각 버튼을 눌렀을 때 "다음 노출까지" 예상 시간을 미리 보여주기 위한 헬퍼
function previewIntervals(srs) {
  const previews = {};
  ['again', 'hard', 'good', 'easy'].forEach(grade => {
    const result = gradeCard(srs, grade);
    previews[grade] = formatInterval(result.dueDate);
  });
  return previews;
}

function formatInterval(dueDateIso) {
  const diffMs = new Date(dueDateIso).getTime() - Date.now();
  const diffMin = Math.max(1, Math.round(diffMs / MINUTE));
  if (diffMin < 60) return `${diffMin}분`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간`;
  const diffDay = Math.max(1, Math.round(diffHour / 24));
  return `${diffDay}일`;
}
