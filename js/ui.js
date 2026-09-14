const currency = new Intl.NumberFormat('ko-KR');

// 숫자를 한국 원화 표기로 바꾼다.
// 예: 13500을 "13,500원"으로 변환해 화면에 표시하기 쉽게 만든다.
export function formatWon(amount) {
  return `${currency.format(Math.round(amount))}원`;
}

// 상단 요약 영역의 숫자들을 최신 구독 데이터로 갱신한다.
// 월 합계와 연간 합계는 logic.js의 계산 함수를 사용한다.
// 이번 주 결제 예정은 오늘부터 7일 이내인 구독을 찾아 개수와 금액을 표시한다.
export function renderSummary(subscriptions, today) {
  const monthly = getTotalMonthlyAmount(subscriptions);
  const upcoming = getUpcomingPayments(subscriptions, today, 7);
  const upcomingAmount = upcoming.reduce((sum, subscription) => sum + Number(subscription.amount), 0);
  document.querySelector('#monthly-total').textContent = formatWon(monthly);
  document.querySelector('#yearly-total').textContent = formatWon(getTotalYearlyAmount(subscriptions));
  document.querySelector('#upcoming-count').textContent = `${upcoming.length}건`;
  document.querySelector('#upcoming-total').textContent = `결제 예정 금액 ${formatWon(upcomingAmount)}`;
  document.querySelector('#subscription-count').textContent = `${subscriptions.length}개`;
}

// 구독 목록 영역을 다시 그린다.
// 결제일이 가까운 구독이 위에 오도록 복사본을 정렬하므로 원래 배열 순서는 바뀌지 않는다.
// 구독이 하나도 없으면 안내 문구를 표시하고, 있으면 각 구독의 정보와 버튼을 만든다.
export function renderSubscriptions(subscriptions, today) {
  const list = document.querySelector('#subscription-list');
  if (subscriptions.length === 0) {
    list.innerHTML = '<div class="empty-state"><div><strong>아직 등록된 구독이 없어요</strong><p>오른쪽 폼에서 첫 구독을 추가해 보세요.</p></div></div>';
    return;
  }
  const sorted = [...subscriptions].sort((a, b) => getDaysUntilNextPayment(today, a.nextPaymentDate) - getDaysUntilNextPayment(today, b.nextPaymentDate));
  list.innerHTML = sorted.map((subscription) => {
    const days = getDaysUntilNextPayment(today, subscription.nextPaymentDate);
    const dday = days === 0 ? '오늘' : days < 0 ? `${Math.abs(days)}일 지남` : `D-${days}`;
    const cycleText = subscription.cycle === 'yearly' ? '연간' : '월간';
    const meta = [subscription.category, subscription.paymentMethod].filter(Boolean).join(' · ');
    return `<article class="subscription-item">
      <div class="subscription-info"><p class="subscription-name">${escapeHtml(subscription.name)}</p><p class="subscription-meta">${escapeHtml(meta || '카테고리 미지정')} · ${subscription.nextPaymentDate}</p></div>
      <div class="subscription-price">${formatWon(subscription.amount)}<small>${cycleText} 결제</small></div>
      <div class="dday ${days === 0 ? 'today' : ''}">${dday}</div>
      <div class="item-actions"><button class="icon-button" type="button" data-edit-id="${subscription.id}">수정</button><button class="icon-button" type="button" data-delete-id="${subscription.id}">삭제</button></div>
    </article>`;
  }).join('');
}

// 카테고리별 월 지출 비중을 막대 그래프로 표시한다.
// logic.js에서 카테고리별 월 합계를 받은 뒤, 전체 월 합계에서 차지하는 백분율을 계산한다.
// 데이터가 없을 때는 그래프 대신 구독 추가 안내 문구를 표시한다.
export function renderCategories(subscriptions) {
  const chart = document.querySelector('#category-chart');
  const categories = getMonthlyAmountByCategory(subscriptions);
  const entries = Object.entries(categories).sort(([, first], [, second]) => second - first);
  if (entries.length === 0) {
    chart.innerHTML = '<p class="empty-chart">구독을 추가하면 카테고리별 지출이 보여요.</p>';
    return;
  }
  const total = entries.reduce((sum, [, amount]) => sum + amount, 0);
  chart.innerHTML = entries.map(([category, amount]) => {
    const percent = Math.round((amount / total) * 100);
    return `<div class="category-row"><div class="category-label"><span>${escapeHtml(category)}</span><strong>${percent}% · ${formatWon(amount)}</strong></div><div class="bar-track"><div class="bar-fill" style="width: ${percent}%"></div></div></div>`;
  }).join('');
}

// 사용자가 입력한 문자열을 HTML에 안전하게 넣기 위해 특수문자를 치환한다.
// 이름이나 카테고리에 <, > 같은 문자가 있어도 HTML 태그로 해석되지 않게 한다.
function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}